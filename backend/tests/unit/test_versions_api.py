"""
Unit tests for Prompt Version API endpoints
Tests: Module 9.1 - 版本历史 API 单元测试
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.prompt import Prompt
from app.models.prompt_version import PromptVersion
from app.models.user import User


@pytest.mark.unit
class TestVersionListAPI:
    """测试版本列表 API"""

    def test_get_versions_success(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        test_prompt: Prompt,
        auth_headers: dict
    ):
        """测试成功获取版本列表"""
        # 创建多个版本
        versions = []
        for i in range(3):
            version = PromptVersion(
                prompt_id=test_prompt.id,
                version_number=i + 1,
                content=f"Content version {i + 1}",
                token_count=10 + i,
                change_note=f"Change {i + 1}"
            )
            test_db.add(version)
            versions.append(version)

        test_db.commit()

        # 发送请求
        response = client.get(
            f"/api/prompts/{test_prompt.id}/versions",
            headers=auth_headers
        )

        # 验证响应
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 3

        # 验证版本按 version_number 倒序排列
        assert data[0]["version_number"] == 3
        assert data[1]["version_number"] == 2
        assert data[2]["version_number"] == 1

        # 验证字段
        for version_data in data:
            assert "id" in version_data
            assert "version_number" in version_data
            assert "content" in version_data
            assert "token_count" in version_data
            assert "change_note" in version_data
            assert "created_at" in version_data

    def test_get_versions_empty(
        self,
        client: TestClient,
        test_prompt: Prompt,
        auth_headers: dict
    ):
        """测试没有版本的情况"""
        response = client.get(
            f"/api/prompts/{test_prompt.id}/versions",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_get_versions_nonexistent_prompt(
        self,
        client: TestClient,
        auth_headers: dict
    ):
        """测试提示词不存在的情况"""
        response = client.get(
            "/api/prompts/nonexistent-id/versions",
            headers=auth_headers
        )

        assert response.status_code == 404


@pytest.mark.unit
class TestVersionDetailAPI:
    """测试版本详情 API"""

    def test_get_version_detail_success(
        self,
        client: TestClient,
        test_prompt: Prompt,
        test_version: PromptVersion,
        auth_headers: dict
    ):
        """测试成功获取版本详情"""
        response = client.get(
            f"/api/prompts/{test_prompt.id}/versions/{test_version.id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # 验证数据
        assert data["id"] == test_version.id
        assert data["prompt_id"] == test_prompt.id
        assert data["version_number"] == test_version.version_number
        assert data["content"] == test_version.content
        assert data["token_count"] == test_version.token_count
        assert data["change_note"] == test_version.change_note

    def test_get_version_detail_not_found(
        self,
        client: TestClient,
        test_prompt: Prompt,
        auth_headers: dict
    ):
        """测试版本不存在的情况"""
        response = client.get(
            f"/api/prompts/{test_prompt.id}/versions/nonexistent-version-id",
            headers=auth_headers
        )

        assert response.status_code == 404


@pytest.mark.unit
class TestVersionRestoreAPI:
    """测试版本回滚 API"""

    def test_restore_version_success(
        self,
        client: TestClient,
        test_db: Session,
        test_prompt: Prompt,
        auth_headers: dict
    ):
        """测试成功回滚版本"""
        # 创建旧版本
        old_version = PromptVersion(
            prompt_id=test_prompt.id,
            version_number=1,
            content="Old content to restore",
            token_count=15,
            change_note="Original version"
        )
        test_db.add(old_version)
        test_db.commit()
        test_db.refresh(old_version)

        # 更新提示词内容（创建新版本）
        test_prompt.content = "New content"
        test_db.commit()

        # 执行回滚
        response = client.post(
            f"/api/prompts/{test_prompt.id}/versions/{old_version.id}/restore",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # 验证返回的新版本
        assert data["content"] == "Old content to restore"
        assert data["version_number"] == 2
        assert "Restored from version 1" in data["change_note"]

        # 验证提示词内容已更新
        test_db.refresh(test_prompt)
        assert test_prompt.content == "Old content to restore"

    def test_restore_version_not_found(
        self,
        client: TestClient,
        test_prompt: Prompt,
        auth_headers: dict
    ):
        """测试回滚不存在的版本"""
        response = client.post(
            f"/api/prompts/{test_prompt.id}/versions/nonexistent-id/restore",
            headers=auth_headers
        )

        assert response.status_code == 404

    def test_restore_creates_new_version(
        self,
        client: TestClient,
        test_db: Session,
        test_prompt: Prompt,
        auth_headers: dict
    ):
        """测试回滚会创建新版本而不是覆盖"""
        # 创建多个版本
        v1 = PromptVersion(
            prompt_id=test_prompt.id,
            version_number=1,
            content="Version 1",
            token_count=10
        )
        v2 = PromptVersion(
            prompt_id=test_prompt.id,
            version_number=2,
            content="Version 2",
            token_count=10
        )
        test_db.add_all([v1, v2])
        test_db.commit()

        # 回滚到版本 1
        response = client.post(
            f"/api/prompts/{test_prompt.id}/versions/{v1.id}/restore",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # 应该创建版本 3
        assert data["version_number"] == 3
        assert data["content"] == "Version 1"

        # 验证所有版本都还存在
        all_versions = test_db.query(PromptVersion).filter(
            PromptVersion.prompt_id == test_prompt.id
        ).all()
        assert len(all_versions) == 3


@pytest.mark.unit
class TestVersionTokenCount:
    """测试版本 Token 计数"""

    def test_version_preserves_token_count(
        self,
        client: TestClient,
        test_db: Session,
        test_prompt: Prompt,
        auth_headers: dict
    ):
        """测试版本正确保存 Token 数量"""
        original_content = "This is a test with some tokens."
        original_token_count = 20

        # 创建版本
        version = PromptVersion(
            prompt_id=test_prompt.id,
            version_number=1,
            content=original_content,
            token_count=original_token_count,
            change_note="Test version"
        )
        test_db.add(version)
        test_db.commit()

        # 获取版本
        response = client.get(
            f"/api/prompts/{test_prompt.id}/versions/{version.id}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["token_count"] == original_token_count


@pytest.mark.unit
class TestVersionChangedNote:
    """测试版本变更说明"""

    def test_version_with_change_note(
        self,
        test_db: Session,
        test_prompt: Prompt
    ):
        """测试版本包含变更说明"""
        change_note = "Fixed typos and improved clarity"

        version = PromptVersion(
            prompt_id=test_prompt.id,
            version_number=1,
            content="Updated content",
            token_count=10,
            change_note=change_note
        )
        test_db.add(version)
        test_db.commit()
        test_db.refresh(version)

        assert version.change_note == change_note

    def test_version_without_change_note(
        self,
        test_db: Session,
        test_prompt: Prompt
    ):
        """测试版本可以没有变更说明"""
        version = PromptVersion(
            prompt_id=test_prompt.id,
            version_number=1,
            content="Content without note",
            token_count=10
        )
        test_db.add(version)
        test_db.commit()
        test_db.refresh(version)

        assert version.change_note is None

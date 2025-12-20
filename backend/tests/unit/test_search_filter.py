"""
Unit tests for Search and Filter functionality
Tests: Module 9.4 - 搜索和筛选功能测试
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.prompt import Prompt
from app.models.tag import Tag
from app.models.user import User
from tests.conftest import create_multiple_prompts


@pytest.mark.unit
class TestPromptSearch:
    """测试提示词搜索功能"""

    def test_search_by_name(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        auth_headers: dict
    ):
        """测试按名称搜索"""
        # 创建测试提示词
        prompt1 = Prompt(
            id="p1",
            name="Python Tutorial",
            content="Learn Python programming",
            user_id=test_user.id
        )
        prompt2 = Prompt(
            id="p2",
            name="JavaScript Guide",
            content="Web development with JS",
            user_id=test_user.id
        )
        test_db.add_all([prompt1, prompt2])
        test_db.commit()

        # 搜索 "Python"
        response = client.get(
            "/api/prompts?search=Python",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["name"] == "Python Tutorial"

    def test_search_by_content(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        auth_headers: dict
    ):
        """测试按内容搜索"""
        prompt1 = Prompt(
            id="p1",
            name="Tutorial A",
            content="This is about machine learning",
            user_id=test_user.id
        )
        prompt2 = Prompt(
            id="p2",
            name="Tutorial B",
            content="This is about web development",
            user_id=test_user.id
        )
        test_db.add_all([prompt1, prompt2])
        test_db.commit()

        # 搜索 "machine learning"
        response = client.get(
            "/api/prompts?search=machine",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert "machine learning" in data["items"][0]["content"]

    def test_search_case_insensitive(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        auth_headers: dict
    ):
        """测试搜索不区分大小写"""
        prompt = Prompt(
            id="p1",
            name="Database Design",
            content="SQL and NoSQL",
            user_id=test_user.id
        )
        test_db.add(prompt)
        test_db.commit()

        # 使用不同大小写搜索
        for search_term in ["DATABASE", "database", "DaTaBaSe"]:
            response = client.get(
                f"/api/prompts?search={search_term}",
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 1

    def test_search_no_results(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        auth_headers: dict
    ):
        """测试搜索无结果"""
        prompt = Prompt(
            id="p1",
            name="Test Prompt",
            content="Test content",
            user_id=test_user.id
        )
        test_db.add(prompt)
        test_db.commit()

        response = client.get(
            "/api/prompts?search=nonexistent",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert len(data["items"]) == 0


@pytest.mark.unit
class TestTagFilter:
    """测试标签筛选功能"""

    def test_filter_by_single_tag(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        auth_headers: dict
    ):
        """测试按单个标签筛选"""
        # 创建标签
        tag1 = Tag(name="python", is_system=False)
        tag2 = Tag(name="javascript", is_system=False)
        test_db.add_all([tag1, tag2])
        test_db.commit()

        # 创建带标签的提示词
        prompt1 = Prompt(
            id="p1",
            name="Python Prompt",
            content="Python content",
            user_id=test_user.id
        )
        prompt1.tags.append(tag1)

        prompt2 = Prompt(
            id="p2",
            name="JS Prompt",
            content="JS content",
            user_id=test_user.id
        )
        prompt2.tags.append(tag2)

        test_db.add_all([prompt1, prompt2])
        test_db.commit()

        # 按 python 标签筛选
        response = client.get(
            "/api/prompts?tags=python",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["name"] == "Python Prompt"

    def test_filter_by_multiple_tags_or(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        auth_headers: dict
    ):
        """测试多标签 OR 逻辑筛选"""
        # 创建标签
        tag1 = Tag(name="python", is_system=False)
        tag2 = Tag(name="tutorial", is_system=False)
        test_db.add_all([tag1, tag2])
        test_db.commit()

        # 创建提示词
        prompt1 = Prompt(id="p1", name="P1", content="C1", user_id=test_user.id)
        prompt1.tags.append(tag1)

        prompt2 = Prompt(id="p2", name="P2", content="C2", user_id=test_user.id)
        prompt2.tags.append(tag2)

        prompt3 = Prompt(id="p3", name="P3", content="C3", user_id=test_user.id)

        test_db.add_all([prompt1, prompt2, prompt3])
        test_db.commit()

        # OR 逻辑：python 或 tutorial
        response = client.get(
            "/api/prompts?tags=python,tutorial&tag_logic=OR",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2  # prompt1 和 prompt2

    def test_filter_by_multiple_tags_and(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        auth_headers: dict
    ):
        """测试多标签 AND 逻辑筛选"""
        # 创建标签
        tag1 = Tag(name="python", is_system=False)
        tag2 = Tag(name="beginner", is_system=False)
        test_db.add_all([tag1, tag2])
        test_db.commit()

        # 创建提示词
        prompt1 = Prompt(id="p1", name="P1", content="C1", user_id=test_user.id)
        prompt1.tags.extend([tag1, tag2])  # 同时有两个标签

        prompt2 = Prompt(id="p2", name="P2", content="C2", user_id=test_user.id)
        prompt2.tags.append(tag1)  # 只有 python

        test_db.add_all([prompt1, prompt2])
        test_db.commit()

        # AND 逻辑：必须同时有 python 和 beginner
        response = client.get(
            "/api/prompts?tags=python,beginner&tag_logic=AND",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1  # 只有 prompt1


@pytest.mark.unit
class TestSorting:
    """测试排序功能"""

    def test_sort_by_updated_at_desc(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        auth_headers: dict
    ):
        """测试按更新时间倒序排列"""
        prompts = create_multiple_prompts(test_db, test_user, count=3)

        response = client.get(
            "/api/prompts?sort_by=updated_at&sort_order=desc",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3

        # 验证倒序
        for i in range(len(data["items"]) - 1):
            current = data["items"][i]["updated_at"]
            next_item = data["items"][i + 1]["updated_at"]
            assert current >= next_item

    def test_sort_by_name_asc(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        auth_headers: dict
    ):
        """测试按名称正序排列"""
        prompt1 = Prompt(id="p1", name="Zebra", content="C", user_id=test_user.id)
        prompt2 = Prompt(id="p2", name="Apple", content="C", user_id=test_user.id)
        prompt3 = Prompt(id="p3", name="Mango", content="C", user_id=test_user.id)

        test_db.add_all([prompt1, prompt2, prompt3])
        test_db.commit()

        response = client.get(
            "/api/prompts?sort_by=name&sort_order=asc",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # 验证正序
        names = [item["name"] for item in data["items"]]
        assert names == sorted(names)

    def test_sort_by_token_count(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        auth_headers: dict
    ):
        """测试按 token 数量排序"""
        prompt1 = Prompt(id="p1", name="P1", content="C", user_id=test_user.id, token_count=100)
        prompt2 = Prompt(id="p2", name="P2", content="C", user_id=test_user.id, token_count=50)
        prompt3 = Prompt(id="p3", name="P3", content="C", user_id=test_user.id, token_count=75)

        test_db.add_all([prompt1, prompt2, prompt3])
        test_db.commit()

        response = client.get(
            "/api/prompts?sort_by=token_count&sort_order=desc",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        tokens = [item["token_count"] for item in data["items"]]
        assert tokens == sorted(tokens, reverse=True)


@pytest.mark.unit
class TestPagination:
    """测试分页功能"""

    def test_pagination_default(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        auth_headers: dict
    ):
        """测试默认分页"""
        create_multiple_prompts(test_db, test_user, count=25)

        response = client.get(
            "/api/prompts",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert data["page"] == 1
        assert data["page_size"] == 20  # 默认值
        assert data["total"] == 25
        assert data["total_pages"] == 2
        assert len(data["items"]) == 20  # 第一页 20 条

    def test_pagination_custom_page_size(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        auth_headers: dict
    ):
        """测试自定义页面大小"""
        create_multiple_prompts(test_db, test_user, count=15)

        response = client.get(
            "/api/prompts?page_size=5",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert data["page_size"] == 5
        assert data["total_pages"] == 3
        assert len(data["items"]) == 5

    def test_pagination_second_page(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        auth_headers: dict
    ):
        """测试第二页"""
        create_multiple_prompts(test_db, test_user, count=25)

        response = client.get(
            "/api/prompts?page=2&page_size=10",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert data["page"] == 2
        assert len(data["items"]) == 10

    def test_pagination_last_page(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        auth_headers: dict
    ):
        """测试最后一页"""
        create_multiple_prompts(test_db, test_user, count=25)

        response = client.get(
            "/api/prompts?page=3&page_size=10",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert data["page"] == 3
        assert len(data["items"]) == 5  # 最后一页只有 5 条


@pytest.mark.unit
class TestCombinedFilters:
    """测试组合筛选"""

    def test_search_and_tag_filter(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        auth_headers: dict
    ):
        """测试搜索 + 标签筛选组合"""
        # 创建标签
        tag = Tag(name="python", is_system=False)
        test_db.add(tag)
        test_db.commit()

        # 创建提示词
        prompt1 = Prompt(id="p1", name="Python Tutorial", content="C1", user_id=test_user.id)
        prompt1.tags.append(tag)

        prompt2 = Prompt(id="p2", name="Python Guide", content="C2", user_id=test_user.id)
        # 没有标签

        prompt3 = Prompt(id="p3", name="JavaScript Tutorial", content="C3", user_id=test_user.id)
        prompt3.tags.append(tag)

        test_db.add_all([prompt1, prompt2, prompt3])
        test_db.commit()

        # 搜索 "Python" + python 标签
        response = client.get(
            "/api/prompts?search=Python&tags=python",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1  # 只有 prompt1 满足条件
        assert data["items"][0]["name"] == "Python Tutorial"

    def test_search_with_sorting(
        self,
        client: TestClient,
        test_db: Session,
        test_user: User,
        auth_headers: dict
    ):
        """测试搜索 + 排序组合"""
        prompt1 = Prompt(id="p1", name="Tutorial A", content="Python programming", user_id=test_user.id, token_count=50)
        prompt2 = Prompt(id="p2", name="Tutorial B", content="Python basics", user_id=test_user.id, token_count=100)

        test_db.add_all([prompt1, prompt2])
        test_db.commit()

        # 搜索 "Python" 并按 token_count 排序
        response = client.get(
            "/api/prompts?search=Python&sort_by=token_count&sort_order=desc",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert data["items"][0]["token_count"] == 100  # 倒序第一个

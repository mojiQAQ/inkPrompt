# InkPrompt 测试文档

## 📋 概览

本目录包含 InkPrompt 后端的单元测试和集成测试。测试使用 pytest 框架编写，覆盖了核心 API 功能、LangChain 集成和搜索筛选功能。

## 🗂️ 目录结构

```
tests/
├── conftest.py              # 共享 fixtures 和配置
├── pytest.ini               # Pytest 配置文件（在 backend/ 根目录）
├── unit/                    # 单元测试
│   ├── test_versions_api.py      # 版本历史 API 测试
│   ├── test_optimization_api.py  # 优化 API 测试
│   ├── test_langchain.py         # LangChain 集成测试
│   └── test_search_filter.py    # 搜索和筛选功能测试
└── integration/             # 集成测试（未来实现）
```

## 🚀 快速开始

### 安装依赖

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### 运行所有测试

```bash
pytest
```

### 运行特定测试文件

```bash
# 版本历史测试
pytest tests/unit/test_versions_api.py

# 优化 API 测试
pytest tests/unit/test_optimization_api.py

# LangChain 测试
pytest tests/unit/test_langchain.py

# 搜索和筛选测试
pytest tests/unit/test_search_filter.py
```

### 运行特定测试类或方法

```bash
# 运行特定测试类
pytest tests/unit/test_versions_api.py::TestVersionListAPI

# 运行特定测试方法
pytest tests/unit/test_versions_api.py::TestVersionListAPI::test_get_versions_success
```

## 📊 测试覆盖

### 模块 9.1: 版本历史 API 测试

**文件**: `tests/unit/test_versions_api.py`

**测试范围**:
- ✅ 获取版本列表（空/非空/排序）
- ✅ 获取版本详情
- ✅ 版本回滚功能
- ✅ 版本 Token 计数
- ✅ 版本变更说明
- ✅ 错误处理（提示词不存在、版本不存在）

**测试类**:
- `TestVersionListAPI` - 版本列表测试
- `TestVersionDetailAPI` - 版本详情测试
- `TestVersionRestoreAPI` - 版本回滚测试
- `TestVersionTokenCount` - Token 计数测试
- `TestVersionChangedNote` - 变更说明测试

**测试数量**: 15+ 个测试用例

### 模块 9.2: 优化 API 测试

**文件**: `tests/unit/test_optimization_api.py`

**测试范围**:
- ✅ 提示词优化成功
- ✅ 不同优化场景（5 种）
- ✅ 自定义优化要求
- ✅ 成本追踪
- ✅ 错误处理（LLM 错误、空响应）
- ✅ 请求验证（缺少字段、无效场景）

**测试类**:
- `TestOptimizationAPI` - 优化 API 测试
- `TestOptimizationScenarios` - 场景枚举测试
- `TestOptimizationErrorHandling` - 错误处理测试
- `TestOptimizationRequestValidation` - 请求验证测试

**测试数量**: 12+ 个测试用例

**Mock 策略**: 使用 `unittest.mock` 模拟 LangChain 调用，避免实际 API 费用

### 模块 9.3: LangChain 调用链测试

**文件**: `tests/unit/test_langchain.py`

**测试范围**:
- ✅ LangChain 配置初始化
- ✅ 配置验证
- ✅ 单例模式
- ✅ 聊天模型创建
- ✅ Token 计数（英文/中文/空字符串）
- ✅ 成本计算（GPT-3.5/GPT-4/未知模型）
- ✅ CallbackHandler 初始化
- ✅ LLM 调用成功/失败回调
- ✅ 数据库记录

**测试类**:
- `TestLangChainConfig` - 配置测试
- `TestTokenCounting` - Token 计数测试
- `TestCostCalculation` - 成本计算测试
- `TestCallTrackerHandler` - 回调处理器测试
- `TestLangChainIntegration` - 集成测试（跳过）

**测试数量**: 15+ 个测试用例

### 模块 9.4: 搜索和筛选功能测试

**文件**: `tests/unit/test_search_filter.py`

**测试范围**:
- ✅ 按名称搜索
- ✅ 按内容搜索
- ✅ 大小写不敏感搜索
- ✅ 单标签筛选
- ✅ 多标签 OR 逻辑
- ✅ 多标签 AND 逻辑
- ✅ 多种排序（更新时间/名称/Token 数）
- ✅ 分页功能
- ✅ 组合筛选（搜索 + 标签 + 排序）

**测试类**:
- `TestPromptSearch` - 搜索测试
- `TestTagFilter` - 标签筛选测试
- `TestSorting` - 排序测试
- `TestPagination` - 分页测试
- `TestCombinedFilters` - 组合筛选测试

**测试数量**: 20+ 个测试用例

## 🔧 Fixtures 说明

### 数据库 Fixtures

**`test_engine`** (function scope)
- 创建内存 SQLite 数据库引擎
- 每个测试函数独立数据库
- 测试后自动清理

**`test_db`** (function scope)
- 创建数据库会话
- 用于数据操作
- 自动回滚和关闭

**`client`** (function scope)
- FastAPI TestClient
- 使用测试数据库
- 模拟 HTTP 请求

### 数据 Fixtures

**`test_user`**
- 创建测试用户
- ID: `test-user-id-123`
- Email: `test@example.com`

**`test_prompt`**
- 创建测试提示词
- 关联到 test_user
- ID: `test-prompt-id-123`

**`test_tag`**
- 创建测试标签
- 非系统标签
- Name: `test-tag`

**`test_version`**
- 创建测试版本
- 关联到 test_prompt
- Version number: 1

**`auth_headers`**
- 认证请求头
- 包含 Bearer token
- 用于需要认证的请求

**`mock_openai_key`**
- Mock OpenAI API key
- 避免真实 API 调用
- 用于 LangChain 测试

## 🏷️ 测试标记

使用 pytest markers 标记测试类型：

```bash
# 运行单元测试
pytest -m unit

# 运行集成测试
pytest -m integration

# 运行慢测试
pytest -m slow

# 运行需要数据库的测试
pytest -m requires_db

# 运行需要 API key 的测试
pytest -m requires_api_key

# 排除特定标记
pytest -m "not slow"
```

## ⚙️ 配置选项

**pytest.ini** 配置:

```ini
[pytest]
# 测试发现模式
python_files = test_*.py
python_classes = Test*
python_functions = test_*

# 测试路径
testpaths = tests

# 输出选项
addopts =
    -v                  # 详细输出
    --strict-markers    # 严格标记检查
    --tb=short         # 简短回溯
    --disable-warnings # 禁用警告

# 异步支持
asyncio_mode = auto
```

## 📈 运行选项

### 详细输出

```bash
pytest -v
```

### 显示打印语句

```bash
pytest -s
```

### 显示覆盖率

```bash
# 需要先安装 pytest-cov
pip install pytest-cov

pytest --cov=app --cov-report=html
```

### 并行运行

```bash
# 需要先安装 pytest-xdist
pip install pytest-xdist

pytest -n auto
```

### 失败时立即停止

```bash
pytest -x
```

### 只运行失败的测试

```bash
pytest --lf
```

## 🐛 调试测试

### 使用 pdb 调试器

```bash
pytest --pdb
```

### 在失败时进入调试器

```bash
pytest --pdb --maxfail=1
```

### 打印详细日志

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📝 编写新测试

### 测试文件命名

- 文件名: `test_*.py`
- 类名: `Test*`
- 方法名: `test_*`

### 测试模板

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

@pytest.mark.unit
class TestYourFeature:
    """测试描述"""

    def test_your_test_case(
        self,
        client: TestClient,
        test_db: Session,
        auth_headers: dict
    ):
        """测试用例描述"""
        # Arrange (准备)
        # ... 设置测试数据

        # Act (执行)
        response = client.get("/api/your-endpoint", headers=auth_headers)

        # Assert (断言)
        assert response.status_code == 200
        data = response.json()
        assert "expected_field" in data
```

### 使用 Mock

```python
from unittest.mock import patch, MagicMock

@patch('app.services.your_service.external_function')
def test_with_mock(
    self,
    mock_external,
    client: TestClient
):
    """测试使用 mock"""
    # 配置 mock
    mock_external.return_value = "mocked value"

    # 执行测试
    response = client.get("/api/endpoint")

    # 验证 mock 被调用
    mock_external.assert_called_once()
```

## ✅ 最佳实践

1. **每个测试独立**
   - 不依赖其他测试
   - 使用 fixtures 准备数据
   - 测试后自动清理

2. **清晰的测试名称**
   - 描述测试内容
   - 使用 `test_<action>_<expected_result>` 格式
   - 例如: `test_get_versions_success`

3. **AAA 模式**
   - Arrange (准备)
   - Act (执行)
   - Assert (断言)

4. **使用 Mock 避免外部依赖**
   - Mock OpenAI API 调用
   - Mock 数据库（使用内存数据库）
   - Mock 外部服务

5. **测试边界情况**
   - 空输入
   - 无效输入
   - 大量数据
   - 错误情况

## 🔍 常见问题

### Q: 测试运行很慢

A: 使用并行运行：
```bash
pytest -n auto
```

### Q: 如何只运行一个测试

A: 指定完整路径：
```bash
pytest tests/unit/test_versions_api.py::TestVersionListAPI::test_get_versions_success
```

### Q: 如何跳过某些测试

A: 使用 `@pytest.mark.skip` 装饰器：
```python
@pytest.mark.skip(reason="Not implemented yet")
def test_future_feature(self):
    pass
```

### Q: 如何测试需要认证的端点

A: 使用 `auth_headers` fixture：
```python
def test_protected_endpoint(self, client, auth_headers):
    response = client.get("/api/protected", headers=auth_headers)
    assert response.status_code == 200
```

## 📚 参考资源

- [Pytest 官方文档](https://docs.pytest.org/)
- [FastAPI 测试文档](https://fastapi.tiangolo.com/tutorial/testing/)
- [unittest.mock 文档](https://docs.python.org/3/library/unittest.mock.html)
- [SQLAlchemy 测试最佳实践](https://docs.sqlalchemy.org/en/20/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites)

---

**测试版本**: v1.0
**创建日期**: 2025-12-09
**维护者**: InkPrompt 团队

**测试覆盖率目标**: 80%+ (核心功能 API)

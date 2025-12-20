# LangChain 集成指南

## 概览

InkPrompt 使用 LangChain 框架集成大语言模型（主要是 OpenAI），实现提示词优化和 AI 增强功能。本文档详细说明了 LangChain 的集成方式、配置方法和使用最佳实践。

## 架构设计

### 核心组件

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Application                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐         ┌─────────────────┐             │
│  │  API Layer    │────────▶│  Service Layer  │             │
│  │ (optimization)│         │ (optimization)  │             │
│  └───────────────┘         └────────┬────────┘             │
│                                      │                       │
│                                      ▼                       │
│                            ┌─────────────────┐              │
│                            │  LangChain      │              │
│                            │  Configuration  │              │
│                            └────────┬────────┘              │
│                                      │                       │
│                    ┌─────────────────┴──────────────────┐   │
│                    ▼                                     ▼   │
│          ┌──────────────────┐              ┌──────────────┐ │
│          │  ChatOpenAI      │              │  Callback    │ │
│          │  (LangChain)     │─────────────▶│  Handler     │ │
│          └──────────────────┘              └──────┬───────┘ │
│                    │                               │         │
│                    ▼                               ▼         │
│          ┌──────────────────┐              ┌──────────────┐ │
│          │  OpenAI API      │              │  Database    │ │
│          │                  │              │  (ModelCall) │ │
│          └──────────────────┘              └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 关键模块

1. **配置管理** (`app/core/langchain_config.py`)
   - 集中管理 LangChain/OpenAI 配置
   - 提供模型创建工厂方法
   - 单例模式确保配置一致性

2. **回调追踪** (`app/callbacks/call_tracker.py`)
   - 自动记录所有 LLM 调用
   - 统计 token 使用和成本
   - 追踪响应时间和错误

3. **优化服务** (`app/services/optimization_service.py`)
   - 实现提示词优化逻辑
   - 管理不同优化场景的模板
   - 整合配置和回调

## 环境配置

### 必需的环境变量

在 `.env` 文件中配置以下变量：

```bash
# OpenAI API 配置
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_API_BASE=https://api.openai.com/v1

# 模型配置
DEFAULT_MODEL=gpt-3.5-turbo
DEFAULT_TEMPERATURE=0.7
MAX_TOKENS_PER_REQUEST=4000
```

### 配置说明

| 变量 | 说明 | 默认值 | 示例 |
|------|------|--------|------|
| `OPENAI_API_KEY` | OpenAI API 密钥 | **必需** | `sk-proj-...` |
| `OPENAI_API_BASE` | API 基础 URL | `https://api.openai.com/v1` | Azure 或其他兼容端点 |
| `DEFAULT_MODEL` | 默认使用的模型 | `gpt-3.5-turbo` | `gpt-4`, `gpt-4-turbo-preview` |
| `DEFAULT_TEMPERATURE` | 采样温度 (0-2) | `0.7` | `0.3` (更确定), `1.0` (更随机) |
| `MAX_TOKENS_PER_REQUEST` | 单次请求最大 token 数 | `4000` | 根据模型调整 |

### 获取 OpenAI API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册/登录账号
3. 导航至 **API Keys** 页面
4. 点击 **Create new secret key**
5. 复制密钥并保存到 `.env` 文件

⚠️ **安全提示**：
- 不要将 API Key 提交到版本控制
- 使用环境变量或密钥管理系统
- 定期轮换 API Key
- 设置使用限额

## LangChain 配置管理

### 配置类设计

`LangChainConfig` 类负责管理所有 LangChain 相关配置：

```python
from app.core.langchain_config import get_langchain_config, create_chat_model

# 方式 1: 获取配置单例
config = get_langchain_config()
model = config.create_chat_model()

# 方式 2: 使用便捷函数
model = create_chat_model(
    model="gpt-4",
    temperature=0.5,
    max_tokens=2000
)
```

### 配置验证

启动时自动验证配置：

```python
config = get_langchain_config()
is_valid, message = config.validate_config()

if not is_valid:
    logger.error(f"LangChain configuration invalid: {message}")
    # 处理配置错误
```

### 支持的模型

#### OpenAI 模型

| 模型名称 | 上下文长度 | 特点 | 推荐场景 |
|---------|-----------|------|---------|
| `gpt-3.5-turbo` | 4K/16K | 快速、经济 | 通用优化、批量处理 |
| `gpt-3.5-turbo-16k` | 16K | 更长上下文 | 长提示词优化 |
| `gpt-4` | 8K | 最强能力 | 复杂优化、代码生成 |
| `gpt-4-turbo-preview` | 128K | 最长上下文 | 超长文本处理 |

#### 自定义模型

支持任何 OpenAI 兼容的 API：

```bash
# Azure OpenAI
OPENAI_API_BASE=https://your-resource.openai.azure.com/
OPENAI_API_KEY=your-azure-key

# 其他兼容服务
OPENAI_API_BASE=https://api.example.com/v1
```

## 回调追踪器 (CallbackHandler)

### 工作原理

`CallTrackerHandler` 继承自 LangChain 的 `BaseCallbackHandler`，在 LLM 调用生命周期的关键节点插入追踪逻辑：

```python
from app.callbacks.call_tracker import create_call_tracker

# 创建回调处理器
callback = create_call_tracker(
    db=db_session,
    user_id=user.id,
    chain_type="prompt_optimization",
    scenario="general"
)

# 传递给 LangChain 模型
model = create_chat_model(callbacks=[callback])
response = model.invoke("Your prompt here")

# 调用会自动记录到数据库
```

### 自动记录的信息

每次 LLM 调用会自动记录以下信息到 `model_calls` 表：

- **基本信息**：用户 ID、会话 ID、模型名称
- **输入**：完整的输入提示词、输入 token 数
- **输出**：模型响应内容、输出 token 数、完成原因
- **性能**：响应时间（毫秒）
- **成本**：基于 token 数量的估算成本
- **状态**：成功/失败/超时
- **错误**：如有错误，记录错误信息

### Token 计数

使用 `tiktoken` 库进行精确的 token 计数：

```python
from app.callbacks.call_tracker import count_tokens

# 计算文本的 token 数
token_count = count_tokens("Your text here", model="gpt-3.5-turbo")
```

支持的模型编码：
- `gpt-4`, `gpt-3.5-turbo`: `cl100k_base`
- 其他模型：回退到 `cl100k_base`

### 成本估算

内置的定价表（截至 2025 年）：

| 模型 | 输入成本 (per 1K tokens) | 输出成本 (per 1K tokens) |
|------|-------------------------|-------------------------|
| GPT-4 | $0.03 | $0.06 |
| GPT-4 Turbo | $0.01 | $0.03 |
| GPT-3.5 Turbo | $0.0005 | $0.0015 |
| GPT-3.5 Turbo 16K | $0.003 | $0.004 |

成本计算公式：

```python
total_cost = (input_tokens / 1000 * input_price) + (output_tokens / 1000 * output_price)
```

⚠️ **注意**：定价可能变化，请参考 [OpenAI 官方定价](https://openai.com/pricing) 更新 `TOKEN_PRICING` 字典。

## 提示词优化实现

### 优化场景

系统提供 5 种预定义的优化场景：

1. **通用优化 (general)**
   - 提升清晰度和有效性
   - 优化结构和格式
   - 适用于所有类型的提示词

2. **内容创作 (content_creation)**
   - 强调创意和风格
   - 优化语言表达
   - 适用于文章、营销文案等

3. **代码生成 (code_generation)**
   - 强调技术准确性
   - 明确输入输出格式
   - 适用于编程任务

4. **数据分析 (data_analysis)**
   - 强调逻辑性和准确性
   - 优化分析步骤
   - 适用于数据处理任务

5. **对话交互 (conversation)**
   - 强调自然对话流程
   - 优化上下文理解
   - 适用于聊天机器人

### 优化模板结构

每个场景有专门的优化模板：

```python
OPTIMIZATION_TEMPLATES = {
    OptimizationScenario.GENERAL: """You are an expert prompt engineer.
    Optimize the following prompt to be clearer, more effective, and better structured.

    Original prompt:
    {prompt}

    Provide an optimized version that:
    1. Is clearer and more specific
    2. Has better structure
    3. Gives better results from LLMs

    Return only the optimized prompt without explanation.""",

    # ... 其他场景模板
}
```

### 使用优化服务

#### 后端调用

```python
from app.services.optimization_service import OptimizationService
from app.schemas.optimization import OptimizationScenario

result = OptimizationService.optimize_prompt(
    db=db_session,
    user_id=user.id,
    original_prompt="原始提示词内容",
    scenario=OptimizationScenario.GENERAL,
    custom_requirements="可选的自定义要求"
)

print(f"优化后内容: {result['optimized_content']}")
print(f"Token 数: {result['token_count']}")
print(f"估算成本: ${result['estimated_cost']}")
```

#### API 调用

```bash
curl -X POST http://localhost:8000/api/prompts/{prompt_id}/optimize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "content_creation",
    "custom_requirements": "适合社交媒体营销"
  }'
```

响应：

```json
{
  "optimized_content": "优化后的提示词内容...",
  "suggestions": [
    "改进建议1",
    "改进建议2",
    "改进建议3"
  ],
  "token_count": 180,
  "estimated_cost": 0.0012
}
```

## 错误处理

### 常见错误及解决方案

#### 1. API Key 无效

**错误信息**：
```
openai.error.AuthenticationError: Incorrect API key provided
```

**解决方案**：
- 检查 `.env` 文件中的 `OPENAI_API_KEY`
- 确认 API Key 有效且未过期
- 检查 API Key 前缀（应为 `sk-`）

#### 2. 配额超限

**错误信息**：
```
openai.error.RateLimitError: You exceeded your current quota
```

**解决方案**：
- 检查 OpenAI 账户余额
- 升级 OpenAI 付费计划
- 实施速率限制和缓存策略

#### 3. 超时错误

**错误信息**：
```
requests.exceptions.Timeout: Request timed out
```

**解决方案**：
- 增加超时设置：`request_timeout=60`
- 检查网络连接
- 考虑使用更快的模型

#### 4. Token 超限

**错误信息**：
```
openai.error.InvalidRequestError: This model's maximum context length is 4096 tokens
```

**解决方案**：
- 使用更大上下文的模型（如 `gpt-3.5-turbo-16k`）
- 截断或分割输入内容
- 调整 `MAX_TOKENS_PER_REQUEST` 设置

### 错误处理最佳实践

在服务层添加全面的错误处理：

```python
try:
    result = OptimizationService.optimize_prompt(...)
except openai.error.AuthenticationError:
    # API Key 错误
    raise HTTPException(status_code=401, detail="OpenAI API 认证失败")
except openai.error.RateLimitError:
    # 配额超限
    raise HTTPException(status_code=429, detail="API 调用频率超限，请稍后重试")
except openai.error.InvalidRequestError as e:
    # 请求参数错误
    raise HTTPException(status_code=400, detail=f"请求错误: {str(e)}")
except Exception as e:
    # 其他错误
    logger.error(f"Optimization error: {str(e)}")
    raise HTTPException(status_code=500, detail="优化服务暂时不可用")
```

## 监控和成本控制

### 查看调用统计

使用 API 端点获取统计信息：

```bash
curl http://localhost:8000/api/model-calls/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

响应：

```json
{
  "total_calls": 156,
  "successful_calls": 150,
  "failed_calls": 6,
  "total_tokens": 23450,
  "total_cost": 0.0234,
  "average_response_time_ms": 1523.5
}
```

### 成本监控建议

1. **设置使用限额**
   - 在 OpenAI 账户设置使用上限
   - 实施用户级别的配额（Module 7 待实现）

2. **定期审查**
   - 每日/每周检查 `/api/model-calls/stats`
   - 分析成本趋势和异常

3. **优化策略**
   - 使用 `gpt-3.5-turbo` 而非 `gpt-4` 用于简单任务
   - 缓存常见优化结果
   - 实施去重机制

4. **告警设置**
   - 成本超过阈值时发送通知
   - 失败率过高时触发告警

### 性能优化

1. **异步调用**
   ```python
   # 使用 async/await 提升并发性能
   async def optimize_prompt_async(...):
       model = create_chat_model(callbacks=[callback])
       response = await model.ainvoke(prompt)
       return response
   ```

2. **批量处理**
   ```python
   # 批量优化多个提示词
   results = await asyncio.gather(*[
       optimize_prompt_async(db, user_id, prompt, scenario)
       for prompt in prompts
   ])
   ```

3. **缓存策略**
   ```python
   # 使用 Redis 缓存优化结果
   cache_key = f"optimize:{hash(original_prompt)}:{scenario}"
   cached = redis_client.get(cache_key)
   if cached:
       return json.loads(cached)

   # 执行优化并缓存
   result = optimize_prompt(...)
   redis_client.setex(cache_key, 3600, json.dumps(result))
   ```

## 测试

### 单元测试示例

```python
import pytest
from app.core.langchain_config import LangChainConfig, get_langchain_config

def test_langchain_config_initialization():
    """测试配置初始化"""
    config = LangChainConfig()
    assert config.api_key is not None
    assert config.default_model == "gpt-3.5-turbo"

def test_create_chat_model():
    """测试模型创建"""
    config = get_langchain_config()
    model = config.create_chat_model(temperature=0.5)
    assert model.temperature == 0.5

@pytest.mark.asyncio
async def test_optimization_service():
    """测试优化服务"""
    from app.services.optimization_service import OptimizationService

    result = OptimizationService.optimize_prompt(
        db=mock_db,
        user_id="test-user",
        original_prompt="Write a blog post",
        scenario=OptimizationScenario.CONTENT_CREATION
    )

    assert "optimized_content" in result
    assert result["token_count"] > 0
    assert result["estimated_cost"] >= 0
```

### 集成测试

```python
def test_optimization_api_endpoint(client, auth_token):
    """测试优化 API"""
    response = client.post(
        "/api/prompts/test-prompt-id/optimize",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"scenario": "general"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "optimized_content" in data
    assert "token_count" in data
    assert "estimated_cost" in data
```

## 故障排查

### 调试技巧

1. **启用详细日志**
   ```python
   import logging
   logging.basicConfig(level=logging.DEBUG)
   logging.getLogger("langchain").setLevel(logging.DEBUG)
   logging.getLogger("openai").setLevel(logging.DEBUG)
   ```

2. **使用 Verbose 模式**
   ```python
   model = create_chat_model(verbose=True, callbacks=[callback])
   ```

3. **检查回调记录**
   ```sql
   -- 查询最近的调用记录
   SELECT * FROM model_calls
   WHERE user_id = 'your-user-id'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

### 常见问题 FAQ

**Q: 如何切换到 Azure OpenAI？**

A: 修改环境变量：
```bash
OPENAI_API_BASE=https://your-resource.openai.azure.com/
OPENAI_API_KEY=your-azure-key
OPENAI_API_TYPE=azure
OPENAI_API_VERSION=2023-05-15
```

**Q: 如何使用本地模型（如 Ollama）？**

A: 使用 LangChain 的 `ChatOllama`：
```python
from langchain_community.chat_models import ChatOllama

model = ChatOllama(model="llama2", callbacks=[callback])
```

**Q: 回调处理器会影响性能吗？**

A: 影响很小。数据库写入是异步的，token 计数使用高效的 tiktoken 库。

**Q: 如何导出调用记录？**

A: 使用 API：
```bash
curl "http://localhost:8000/api/model-calls?page=1&page_size=1000" \
  -H "Authorization: Bearer YOUR_TOKEN" > calls.json
```

## 最佳实践总结

### 配置管理
✅ 使用环境变量管理敏感信息
✅ 不要硬编码 API Key
✅ 为开发和生产环境使用不同配置
✅ 定期验证配置有效性

### 成本控制
✅ 设置合理的 token 限制
✅ 优先使用 `gpt-3.5-turbo`
✅ 实施缓存策略
✅ 监控每日/每周成本

### 错误处理
✅ 捕获并处理所有 OpenAI 异常
✅ 提供友好的用户错误提示
✅ 记录详细的错误日志
✅ 实施重试机制（避免临时故障）

### 安全性
✅ 验证所有用户输入
✅ 限制单次请求的 token 数
✅ 实施速率限制
✅ 定期审查调用记录

### 性能优化
✅ 使用异步调用提升并发
✅ 实施结果缓存
✅ 批量处理多个请求
✅ 选择合适的模型（速度 vs 质量）

## 参考资源

- [LangChain 官方文档](https://python.langchain.com/docs/get_started/introduction)
- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)
- [OpenAI 定价页面](https://openai.com/pricing)
- [tiktoken GitHub](https://github.com/openai/tiktoken)

---

**文档版本**: v1.0
**更新日期**: 2025-12-09
**维护者**: InkPrompt 团队

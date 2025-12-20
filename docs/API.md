# InkPrompt API 文档

## 概览

InkPrompt 提供了完整的 RESTful API 用于提示词管理、版本控制、优化和调用记录追踪。

**基础 URL**: `http://localhost:8000/api`

**认证方式**: Bearer Token (JWT)

**Content-Type**: `application/json`

---

## 认证 (Authentication)

### 登录
```http
POST /auth/login
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**响应**:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

---

## 提示词管理 (Prompts)

### 1. 获取提示词列表
```http
GET /prompts?page=1&page_size=20&search=query&tags=tag1,tag2&tag_logic=OR&sort_by=updated_at&sort_order=desc
```

**查询参数**:
- `page` (int): 页码，从 1 开始
- `page_size` (int): 每页数量，1-100
- `search` (string, 可选): 搜索关键词（搜索名称和内容）
- `tags` (string, 可选): 标签过滤，逗号分隔
- `tag_logic` (string, 可选): `AND` 或 `OR`，默认 `OR`
- `sort_by` (string, 可选): 排序字段 `updated_at|created_at|name|token_count`
- `sort_order` (string, 可选): `asc` 或 `desc`，默认 `desc`

**响应**:
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "提示词名称",
      "content": "提示词内容...",
      "token_count": 150,
      "version_count": 3,
      "tags": [
        {
          "id": "uuid",
          "name": "标签名",
          "is_system": false,
          "use_count": 5
        }
      ],
      "created_at": "2025-12-09T10:00:00Z",
      "updated_at": "2025-12-09T12:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 20,
  "total_pages": 3
}
```

### 2. 创建提示词
```http
POST /prompts
```

**请求体**:
```json
{
  "name": "我的提示词",
  "content": "提示词内容...",
  "tag_names": ["标签1", "标签2"]
}
```

**响应**: 201 Created + Prompt 对象

### 3. 获取提示词详情
```http
GET /prompts/{prompt_id}
```

**响应**: Prompt 对象

### 4. 更新提示词
```http
PUT /prompts/{prompt_id}
```

**请求体**:
```json
{
  "name": "新名称",
  "content": "新内容",
  "tag_names": ["新标签"],
  "change_note": "更新说明"
}
```

**响应**: Prompt 对象

### 5. 删除提示词
```http
DELETE /prompts/{prompt_id}
```

**响应**: 204 No Content

---

## 版本历史 (Versions)

### 1. 获取版本列表
```http
GET /prompts/{prompt_id}/versions
```

**响应**:
```json
[
  {
    "id": "uuid",
    "prompt_id": "uuid",
    "version_number": 2,
    "content": "版本内容...",
    "token_count": 145,
    "change_note": "优化了措辞",
    "created_at": "2025-12-09T11:00:00Z"
  }
]
```

### 2. 获取版本详情
```http
GET /prompts/{prompt_id}/versions/{version_id}
```

**响应**: PromptVersion 对象

### 3. 恢复版本
```http
POST /prompts/{prompt_id}/versions/{version_id}/restore
```

**响应**: 新创建的 PromptVersion 对象

---

## 标签管理 (Tags)

### 1. 获取标签列表
```http
GET /tags?page=1&page_size=50&search=query&popular_only=false
```

**查询参数**:
- `search` (string, 可选): 搜索标签名称
- `popular_only` (boolean, 可选): 只返回热门标签

**响应**:
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "标签名",
      "is_system": false,
      "use_count": 10
    }
  ],
  "total": 25,
  "page": 1,
  "page_size": 50,
  "total_pages": 1
}
```

---

## ✨ 提示词优化 (Optimization)

### 优化提示词
```http
POST /prompts/{prompt_id}/optimize
```

**请求体**:
```json
{
  "scenario": "general",
  "custom_requirements": "可选的自定义要求"
}
```

**scenario 可选值**:
- `general`: 通用优化
- `content_creation`: 内容创作
- `code_generation`: 代码生成
- `data_analysis`: 数据分析
- `conversation`: 对话交互

**响应**:
```json
{
  "optimized_content": "优化后的提示词内容...",
  "suggestions": [
    "改进建议1",
    "改进建议2",
    "改进建议3"
  ],
  "token_count": 160,
  "estimated_cost": 0.0012
}
```

**费率**: 根据使用的模型和 token 数量计算

---

## 📊 模型调用记录 (Model Calls)

### 1. 获取调用记录列表
```http
GET /model-calls?page=1&page_size=20&status=success&model_name=gpt-3.5-turbo
```

**查询参数**:
- `page` (int): 页码
- `page_size` (int): 每页数量
- `status` (string, 可选): `success|failure|timeout`
- `model_name` (string, 可选): 模型名称过滤

**响应**:
```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "session_id": "uuid",
      "model_name": "gpt-3.5-turbo",
      "input_prompt": "输入提示词...",
      "input_tokens": 50,
      "output_content": "模型输出...",
      "output_tokens": 100,
      "total_tokens": 150,
      "completion_reason": "stop",
      "estimated_cost": 0.0002,
      "status": "success",
      "response_time_ms": 1234,
      "error_message": null,
      "created_at": "2025-12-09T12:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "total_pages": 5
}
```

### 2. 获取调用统计
```http
GET /model-calls/stats
```

**响应**:
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

### 3. 获取调用详情
```http
GET /model-calls/{call_id}
```

**响应**: ModelCall 对象

---

## 错误响应

所有 API 错误遵循统一格式：

```json
{
  "detail": "错误描述信息"
}
```

**常见状态码**:
- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `204 No Content`: 删除成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证或 token 无效
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器错误

---

## 使用示例

### Python 示例

```python
import requests

# 登录
response = requests.post('http://localhost:8000/api/auth/login', json={
    'email': 'user@example.com',
    'password': 'password'
})
token = response.json()['access_token']

# 设置认证头
headers = {'Authorization': f'Bearer {token}'}

# 获取提示词列表
prompts = requests.get('http://localhost:8000/api/prompts', headers=headers).json()

# 优化提示词
optimize_result = requests.post(
    f'http://localhost:8000/api/prompts/{prompt_id}/optimize',
    headers=headers,
    json={'scenario': 'general'}
).json()

print(f"优化成本: ${optimize_result['estimated_cost']}")
```

### JavaScript/TypeScript 示例

```typescript
// 登录
const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
})
const { access_token } = await loginResponse.json()

// 优化提示词
const optimizeResponse = await fetch(
  `http://localhost:8000/api/prompts/${promptId}/optimize`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ scenario: 'content_creation' })
  }
)
const result = await optimizeResponse.json()
console.log('优化后的内容:', result.optimized_content)
```

### cURL 示例

```bash
# 登录
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 优化提示词
curl -X POST http://localhost:8000/api/prompts/{prompt_id}/optimize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scenario":"general"}'

# 查看调用统计
curl http://localhost:8000/api/model-calls/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 交互式文档

访问以下 URL 获取自动生成的交互式 API 文档：

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI Schema**: http://localhost:8000/api/openapi.json

---

## 速率限制

目前未实施速率限制，但建议：
- 合理使用优化功能，避免频繁调用
- 监控 `/model-calls/stats` 以控制成本
- 后续版本将添加用量配额管理

---

**更新日期**: 2025-12-09
**API 版本**: v0.1.0

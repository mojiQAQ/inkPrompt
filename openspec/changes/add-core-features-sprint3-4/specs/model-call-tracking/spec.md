# 大模型调用记录规范

## ADDED Requirements

### Requirement: 调用记录存储
系统SHALL记录所有大模型 API 调用的详细信息,用于审计和成本分析。

#### Scenario: 自动记录调用
- **WHEN** 系统通过 LangChain 调用大模型 API
- **THEN** 系统通过 CallbackHandler 自动捕获调用事件
- **AND** 记录完整的输入输出信息

#### Scenario: 记录输入信息
- **WHEN** 大模型调用开始时
- **THEN** 系统记录输入的提示词内容
- **AND** 记录消息历史(如果是对话场景)
- **AND** 计算并记录输入 Token 数

#### Scenario: 记录输出信息
- **WHEN** 大模型调用成功返回时
- **THEN** 系统记录模型生成的响应内容
- **AND** 记录输出 Token 数
- **AND** 记录完成原因(stop/length/error)

#### Scenario: 记录元数据
- **WHEN** 记录调用信息时
- **THEN** 系统记录模型名称(如 gpt-4, claude-3)
- **AND** 记录调用参数(temperature, max_tokens, top_p 等)
- **AND** 记录响应时间(毫秒)
- **AND** 记录调用时间戳

#### Scenario: 记录失败调用
- **WHEN** 大模型调用失败时
- **THEN** 系统仍然创建调用记录
- **AND** 调用状态标记为"失败"
- **AND** 记录错误信息和错误类型

### Requirement: Token 统计和成本计算
系统SHALL准确统计 Token 消耗并计算预估成本。

#### Scenario: 统计总 Token 数
- **WHEN** 调用完成时
- **THEN** 系统计算总 Token 数 = input_tokens + output_tokens
- **AND** 记录到调用记录中

#### Scenario: 计算预估成本
- **WHEN** 记录调用信息时
- **THEN** 系统根据模型定价计算预估成本
- **AND** 成本 = (input_tokens × input_price + output_tokens × output_price) / 1000
- **AND** 不同模型使用不同的定价表

#### Scenario: 累计用户消耗
- **WHEN** 用户进行多次调用
- **THEN** 系统可以聚合计算用户的总 Token 消耗和总成本
- **AND** 支持按日期范围统计

### Requirement: 调用历史查询
系统SHALL支持查询和展示调用历史记录。

#### Scenario: 查询用户调用记录
- **WHEN** 用户访问调用记录页面
- **THEN** 系统显示该用户的所有调用历史
- **AND** 按调用时间降序排序(最新的在前)
- **AND** 支持分页加载

#### Scenario: 查看调用详情
- **WHEN** 用户点击某条调用记录
- **THEN** 系统展示该调用的完整详情
- **AND** 包括输入提示词、输出内容、Token 统计、参数配置等

#### Scenario: 筛选调用记录
- **WHEN** 用户需要查找特定调用
- **THEN** 系统支持按模型名称、调用状态、日期范围筛选
- **AND** 支持搜索输入/输出内容关键词

### Requirement: 数据模型定义
系统SHALL定义完整的调用记录数据模型。

#### Scenario: ModelCall 模型字段
- **WHEN** 创建调用记录时
- **THEN** 包含以下必需字段:
  - id: UUID
  - user_id: UUID (外键)
  - model_name: string
  - input_prompt: text
  - input_tokens: integer
  - output_content: text
  - output_tokens: integer
  - total_tokens: integer
  - estimated_cost: decimal
  - status: enum (success/failure/timeout)
  - response_time_ms: integer
  - created_at: timestamp

#### Scenario: 可选字段
- **WHEN** 记录调用时
- **THEN** 可选记录以下字段:
  - session_id: UUID (用于关联对话上下文)
  - message_history: JSON (对话历史)
  - completion_reason: enum (stop/length/error/timeout)
  - parameters: JSON (temperature, max_tokens, top_p 等)
  - langchain_metadata: JSON (chain_type, memory_type 等)
  - error_message: text (失败时的错误信息)

### Requirement: 隐私和安全
系统SHALL保护调用记录中的敏感信息。

#### Scenario: 数据隔离
- **WHEN** 查询调用记录时
- **THEN** 系统严格按 user_id 过滤
- **AND** 用户只能查看自己的调用记录
- **AND** 禁止跨用户访问

#### Scenario: 敏感信息处理
- **WHEN** 记录包含敏感信息(API Key, 密码等)
- **THEN** 系统在存储前进行脱敏处理
- **AND** 或提示用户不要在提示词中包含敏感信息

### Requirement: API 接口定义
系统SHALL提供标准的 RESTful API 支持调用记录查询。

#### Scenario: 获取调用记录列表
- **WHEN** 客户端发送 GET /api/model-calls 请求
- **THEN** 系统返回当前用户的调用记录列表
- **AND** 支持分页参数 page, page_size
- **AND** 支持筛选参数 model_name, status, date_from, date_to

#### Scenario: 获取调用详情
- **WHEN** 客户端发送 GET /api/model-calls/{id} 请求
- **THEN** 系统返回该调用的完整信息
- **AND** 仅当记录属于当前用户时返回

#### Scenario: 获取统计信息
- **WHEN** 客户端发送 GET /api/model-calls/stats 请求
- **THEN** 系统返回用户的调用统计摘要
- **AND** 包括总调用次数、总 Token 消耗、总成本、本周期调用次数等

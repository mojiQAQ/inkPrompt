# 提示词优化规范

## ADDED Requirements

### Requirement: 场景选择
系统SHALL提供预定义的优化场景供用户选择。

#### Scenario: 显示场景列表
- **WHEN** 用户在提示词编辑器中点击"优化"按钮
- **THEN** 系统显示可选的优化场景列表
- **AND** 场景包括:内容创作、代码生成、数据分析、客服对话、教育培训、通用优化

#### Scenario: 场景说明
- **WHEN** 用户查看场景列表时
- **THEN** 每个场景显示简短的说明文字
- **AND** 说明该场景的优化侧重点

#### Scenario: 选择场景
- **WHEN** 用户选择一个优化场景
- **THEN** 系统记录选中的场景
- **AND** 准备执行优化操作

### Requirement: 提示词优化执行
系统SHALL通过 LangChain 调用大模型 API 对提示词进行优化。

#### Scenario: 提交优化请求
- **WHEN** 用户选择场景后点击"开始优化"
- **THEN** 系统发送优化请求到后端 API
- **AND** 显示加载状态(进度指示器)

#### Scenario: 构建优化提示词
- **WHEN** 后端接收到优化请求
- **THEN** 系统根据选定场景加载对应的 PromptTemplate
- **AND** 将用户的提示词内容填充到模板中
- **AND** 构建完整的优化提示词

#### Scenario: 调用大模型
- **WHEN** 优化提示词构建完成
- **THEN** 系统通过 LangChain 的 ChatOpenAI 调用大模型 API
- **AND** 使用配置的默认模型(例如 gpt-4)
- **AND** 设置合理的参数(temperature=0.7, max_tokens=2000)

#### Scenario: 优化成功返回
- **WHEN** 大模型 API 调用成功
- **THEN** 系统解析优化建议
- **AND** 返回优化后的提示词内容
- **AND** 记录本次调用的详细信息(input tokens, output tokens, 响应时间)

#### Scenario: 优化失败处理
- **WHEN** 大模型 API 调用失败(网络错误、超时、API 错误)
- **THEN** 系统返回友好的错误提示
- **AND** 记录错误详情到日志
- **AND** 不消耗用户配额

### Requirement: 优化结果展示
系统SHALL清晰地展示优化建议,让用户决定是否采纳。

#### Scenario: 展示优化建议
- **WHEN** 优化成功完成
- **THEN** 系统在侧边栏或对话框中展示优化后的提示词
- **AND** 显示优化前后的对比
- **AND** 显示本次优化的 Token 消耗

#### Scenario: 应用优化建议
- **WHEN** 用户点击"应用优化"按钮
- **THEN** 系统将优化后的内容填充到编辑器
- **AND** 用户可以进一步编辑
- **AND** 保存时创建新版本

#### Scenario: 拒绝优化建议
- **WHEN** 用户点击"取消"或关闭优化面板
- **THEN** 系统保持原有提示词内容不变
- **AND** 关闭优化面板

#### Scenario: 重新优化
- **WHEN** 用户对优化结果不满意
- **THEN** 用户可以选择不同场景重新优化
- **AND** 每次优化独立记录调用历史

### Requirement: LangChain 集成
系统SHALL通过 LangChain 框架统一管理所有大模型调用。

#### Scenario: 配置 ChatOpenAI
- **WHEN** 系统初始化 LangChain
- **THEN** 使用环境变量配置 ChatOpenAI 实例
- **AND** 支持配置 API Key, Base URL, 模型名称
- **AND** 支持切换不同的模型(OpenAI, Anthropic, 本地模型等)

#### Scenario: 使用 PromptTemplate
- **WHEN** 构建优化提示词时
- **THEN** 系统使用 LangChain 的 PromptTemplate
- **AND** 模板包含系统提示词和用户提示词占位符
- **AND** 支持动态替换场景特定的指导语

#### Scenario: 注册 CallbackHandler
- **WHEN** 执行大模型调用时
- **THEN** 系统注册自定义的 CallbackHandler
- **AND** 回调函数自动记录调用开始、结束、Token 消耗等事件
- **AND** 将调用记录保存到数据库

### Requirement: 用量控制
系统SHALL实现调用频率限制,防止滥用和成本失控。

#### Scenario: 检查用户配额
- **WHEN** 用户发起优化请求时
- **THEN** 系统检查用户的剩余调用配额
- **AND** 如果配额不足,返回友好提示
- **AND** 不执行实际的大模型调用

#### Scenario: 消耗配额
- **WHEN** 优化成功完成时
- **THEN** 系统扣减用户的调用配额
- **AND** 记录本次消耗的 Token 数和预估成本

#### Scenario: 配额重置
- **WHEN** 达到配额重置周期(例如每天/每小时)
- **THEN** 系统自动重置用户的调用配额
- **AND** 向用户显示最新的配额状态

#### Scenario: 超时保护
- **WHEN** 大模型 API 调用时间过长
- **THEN** 系统在 30 秒后超时中断调用
- **AND** 返回超时错误,不消耗配额

### Requirement: API 接口定义
系统SHALL提供标准的 RESTful API 支持提示词优化功能。

#### Scenario: 优化请求
- **WHEN** 客户端发送 POST /api/prompts/{id}/optimize 请求
- **THEN** 请求体包含 scenario (场景枚举)
- **AND** 系统返回优化后的提示词内容
- **AND** 返回 Token 消耗统计

#### Scenario: 获取场景列表
- **WHEN** 客户端发送 GET /api/optimization/scenarios 请求
- **THEN** 系统返回所有可用的优化场景列表
- **AND** 包括场景 ID、名称、说明

#### Scenario: 查询配额状态
- **WHEN** 客户端发送 GET /api/user/quota 请求
- **THEN** 系统返回用户当前的调用配额信息
- **AND** 包括剩余次数、重置时间、本周期已用次数

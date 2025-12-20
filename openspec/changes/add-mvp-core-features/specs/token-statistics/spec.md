# Token 统计规范

## ADDED Requirements

### Requirement: Token 自动计算
系统 SHALL 在创建或更新提示词时自动计算 Token 数量,并存储到数据库。

#### Scenario: 创建提示词时计算 Token
- **WHEN** 用户创建新的提示词
- **THEN** 系统应使用 tiktoken 或 sentencepiece 计算提示词内容的 Token 数
- **AND** 将 Token 数存储到 prompt 表的 token_count 字段
- **AND** 将 Token 数存储到 prompt_version 表 (初始版本)
- **AND** Token 计算应在数据库事务提交前完成

#### Scenario: 更新提示词内容时重新计算 Token
- **WHEN** 用户修改提示词内容
- **THEN** 系统应重新计算新内容的 Token 数
- **AND** 更新 prompt 表的 token_count 字段
- **AND** 在新版本记录中存储新的 Token 数
- **AND** 保留历史版本的 Token 数不变

#### Scenario: 仅更新标签时不重新计算 Token
- **WHEN** 用户仅修改提示词的标签
- **AND** 内容未改变
- **THEN** 系统应保持原有的 Token 数不变
- **AND** 不执行 Token 计算操作

### Requirement: Token 统计库集成
系统 SHALL 集成 Token 计算库,支持准确的 Token 统计。

#### Scenario: 使用 tiktoken 库
- **WHEN** 系统初始化 Token 计算模块
- **THEN** 应优先使用 tiktoken 库 (OpenAI 官方库)
- **AND** 使用 cl100k_base 编码器 (GPT-4/GPT-3.5 通用)
- **AND** 如果 tiktoken 不可用,降级到 sentencepiece

#### Scenario: Token 计算函数
- **WHEN** 系统需要计算文本的 Token 数
- **THEN** 应提供统一的工具函数 `count_tokens(text: str) -> int`
- **AND** 函数应处理空字符串 (返回 0)
- **AND** 函数应处理特殊字符和 emoji
- **AND** 函数应有合理的性能 (处理 10000 字符 < 100ms)

#### Scenario: 错误处理
- **WHEN** Token 计算过程中发生错误
- **THEN** 系统应记录错误日志
- **AND** 返回估算值或 0
- **AND** 不影响提示词的保存操作
- **AND** 向用户显示 Token 统计异常的提示

### Requirement: Token 展示
系统 SHALL 在用户界面多处展示 Token 统计信息,帮助用户了解提示词规模。

#### Scenario: 提示词列表展示 Token
- **WHEN** 用户查看提示词列表
- **THEN** 每个提示词卡片应显示 Token 统计
- **AND** 格式为 "约 1,234 tokens"
- **AND** 使用千位分隔符提高可读性
- **AND** 使用灰色次要文字样式

#### Scenario: 提示词详情展示 Token
- **WHEN** 用户查看提示词详情
- **THEN** 应显示详细的 Token 信息
- **AND** 包含当前版本的 Token 数
- **AND** 可选显示历史版本 Token 数变化趋势
- **AND** 显示位置:详情页顶部或侧边栏

#### Scenario: 编辑器实时 Token 统计
- **WHEN** 用户在编辑器中输入提示词内容
- **THEN** 系统应实时计算并显示 Token 数
- **AND** 使用防抖(debounce)避免频繁计算 (300ms 延迟)
- **AND** 显示在编辑器底部或右下角
- **AND** 格式为 "Token: 1,234"

#### Scenario: Token 可视化
- **WHEN** 用户查看 Token 统计
- **THEN** 可选提供可视化指示器 (进度条或颜色提示)
- **AND** 例如: < 1000 tokens (绿色), 1000-4000 (黄色), > 4000 (红色)
- **AND** 帮助用户快速判断提示词规模

### Requirement: Token 精度说明
系统 SHALL 向用户说明 Token 统计为估算值,可能与实际模型 Token 有偏差。

#### Scenario: 首次使用提示
- **WHEN** 用户首次创建提示词
- **THEN** 系统应显示 Token 说明提示
- **AND** 内容: "Token 统计为估算值,与实际模型可能有 ±5% 偏差"
- **AND** 提供 "不再提示" 选项
- **AND** 用户选择后不再显示

#### Scenario: Token 数旁的提示图标
- **WHEN** 用户查看 Token 统计
- **THEN** 应在 Token 数旁显示提示图标 (i 或 ?)
- **AND** 鼠标悬停显示说明文字
- **AND** 说明: "基于 tiktoken 估算,实际消耗可能略有差异"

#### Scenario: Token 计算方法说明
- **WHEN** 用户查看帮助文档或设置
- **THEN** 应提供 Token 计算的详细说明
- **AND** 说明使用的编码器类型 (cl100k_base)
- **AND** 说明适用的模型 (GPT-4, GPT-3.5 等)
- **AND** 提供 Token 概念的科普

### Requirement: Token 数据持久化
系统 SHALL 正确存储 Token 统计数据,支持历史查询。

#### Scenario: Prompt 表存储 Token
- **WHEN** 系统保存提示词
- **THEN** token_count 字段应存储当前版本的 Token 数
- **AND** 类型为 integer
- **AND** 不允许为 null (默认值 0)
- **AND** 每次内容更新时更新该字段

#### Scenario: PromptVersion 表存储 Token
- **WHEN** 系统创建版本记录
- **THEN** token_count 字段应存储该版本的 Token 数
- **AND** 历史版本的 Token 数不可修改
- **AND** 支持查询历史版本的 Token 变化

#### Scenario: Token 数据一致性
- **WHEN** 系统查询提示词
- **THEN** prompt.token_count 应等于最新版本的 token_count
- **AND** 如果不一致应记录警告日志
- **AND** 提供数据修复工具

### Requirement: Token 性能优化
系统 SHALL 优化 Token 计算性能,避免影响用户体验。

#### Scenario: 异步计算 Token
- **WHEN** Token 计算耗时较长 (> 500ms)
- **THEN** 系统应使用异步任务处理
- **AND** 先保存提示词,后台计算 Token
- **AND** 计算完成后更新数据库
- **AND** 前端显示 "计算中..." 状态

#### Scenario: Token 计算缓存
- **WHEN** 相同内容多次计算 Token
- **THEN** 系统可使用缓存避免重复计算
- **AND** 缓存键为内容的 hash 值
- **AND** 缓存时间为 1 小时
- **AND** 缓存存储在内存或 Redis

#### Scenario: 批量 Token 计算
- **WHEN** 系统需要计算多个提示词的 Token
- **THEN** 应支持批量计算接口
- **AND** 批量处理避免多次库加载
- **AND** 返回 Token 数组与输入数组一一对应

### Requirement: Token 统计 API
系统 SHALL 提供 Token 统计的 API 接口,供前端调用。

#### Scenario: 实时 Token 计算 API
- **WHEN** 前端请求计算文本的 Token 数
- **THEN** 后端应提供 POST /api/tokens/count 接口
- **AND** 请求体: `{"text": "提示词内容"}`
- **AND** 响应体: `{"token_count": 1234}`
- **AND** 不保存到数据库,仅返回计算结果

#### Scenario: Token 统计限流
- **WHEN** 用户频繁调用 Token 计算 API
- **THEN** 系统应实施频率限制
- **AND** 限制为每用户每秒最多 5 次请求
- **AND** 超出限制返回 429 Too Many Requests
- **AND** 响应头包含 Retry-After 信息

#### Scenario: Token 统计历史查询
- **WHEN** 用户查询提示词的 Token 变化历史
- **THEN** 后端应提供 GET /api/prompts/{id}/token-history 接口
- **AND** 返回所有版本的 Token 数据
- **AND** 格式: `[{"version": 1, "token_count": 100, "created_at": "..."}, ...]`
- **AND** 按版本号升序排列

### Requirement: Token 成本估算(未来扩展)
系统 SHALL 预留基于 Token 统计提供成本估算的扩展能力。

#### Scenario: 显示成本估算
- **WHEN** 用户查看提示词的 Token 统计
- **THEN** 系统可选显示预估成本
- **AND** 基于配置的模型单价计算
- **AND** 格式: "约 $0.012 (GPT-4)"
- **AND** 说明为估算值,实际计费以平台为准

#### Scenario: 成本配置管理
- **WHEN** 管理员配置模型定价
- **THEN** 系统应支持配置不同模型的单价
- **AND** 单价单位为美元/1000 tokens
- **AND** 支持输入和输出不同定价
- **AND** 配置变更实时生效

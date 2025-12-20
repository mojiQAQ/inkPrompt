# 用户认证规范

## ADDED Requirements

### Requirement: OAuth 2.0 登录
系统 SHALL 支持通过 Supabase OAuth 2.0 进行用户身份认证,用户可以使用第三方账号登录系统。

#### Scenario: 用户首次登录成功
- **WHEN** 用户点击 OAuth 登录按钮并完成第三方授权
- **THEN** 系统应重定向到 Supabase OAuth 授权页面
- **AND** 授权成功后返回 JWT Token
- **AND** 系统在数据库中创建新用户记录
- **AND** 用户被重定向到提示词列表页面

#### Scenario: 用户已存在时登录
- **WHEN** 已注册用户通过 OAuth 登录
- **THEN** 系统应返回 JWT Token
- **AND** 更新用户的最后登录时间
- **AND** 用户被重定向到提示词列表页面

#### Scenario: OAuth 授权失败
- **WHEN** 用户取消授权或授权过程出错
- **THEN** 系统应显示友好的错误提示
- **AND** 用户停留在登录页面
- **AND** 错误信息被记录到日志

### Requirement: JWT Token 管理
系统 SHALL 使用 JWT Token 作为用户身份凭证,并在每次 API 请求时验证 Token 的有效性。

#### Scenario: Token 存储
- **WHEN** 用户成功登录
- **THEN** JWT Token 应被安全存储在浏览器 localStorage 中
- **AND** Token 应包含用户 ID 和过期时间信息

#### Scenario: Token 验证成功
- **WHEN** 前端发起 API 请求并携带有效的 JWT Token
- **THEN** 后端应通过 Supabase 验证 Token 的真实性
- **AND** 提取 Token 中的用户信息
- **AND** 允许请求继续执行

#### Scenario: Token 验证失败
- **WHEN** 前端发起 API 请求但 Token 无效或过期
- **THEN** 后端应返回 401 Unauthorized 错误
- **AND** 前端应清除本地 Token
- **AND** 用户被重定向到登录页面

#### Scenario: Token 刷新
- **WHEN** Token 即将过期(剩余有效期 < 5 分钟)
- **THEN** 系统应自动刷新 Token
- **AND** 更新本地存储的 Token
- **AND** 用户无需重新登录

### Requirement: 用户会话管理
系统 SHALL 维护用户会话状态,并在用户登出时清理相关数据。

#### Scenario: 用户主动登出
- **WHEN** 用户点击登出按钮
- **THEN** 系统应清除本地存储的 JWT Token
- **AND** 调用 Supabase 登出 API
- **AND** 清除所有会话状态
- **AND** 用户被重定向到登录页面

#### Scenario: 会话超时
- **WHEN** Token 过期且无法刷新
- **THEN** 系统应自动登出用户
- **AND** 显示会话超时提示
- **AND** 用户被重定向到登录页面

### Requirement: 路由守卫
系统 SHALL 实现路由级别的访问控制,未登录用户无法访问受保护的页面。

#### Scenario: 未登录访问受保护页面
- **WHEN** 未登录用户尝试访问提示词列表等受保护页面
- **THEN** 系统应拦截请求
- **AND** 记录原始目标路径
- **AND** 重定向到登录页面

#### Scenario: 登录后自动跳转
- **WHEN** 用户在登录页面成功登录
- **AND** 之前尝试访问过受保护页面
- **THEN** 系统应重定向到原始目标路径
- **AND** 如果没有原始路径,则重定向到提示词列表

#### Scenario: 已登录访问登录页
- **WHEN** 已登录用户尝试访问登录页面
- **THEN** 系统应直接重定向到提示词列表页面

### Requirement: 用户数据隔离
系统 SHALL 严格隔离不同用户的数据,确保用户只能访问自己的资源。

#### Scenario: API 请求携带用户上下文
- **WHEN** 后端接收到经过认证的 API 请求
- **THEN** 系统应从 JWT Token 中提取用户 ID
- **AND** 将用户 ID 注入到请求上下文中
- **AND** 所有数据库查询自动过滤为当前用户的数据

#### Scenario: 跨用户访问拦截
- **WHEN** 用户尝试访问其他用户的提示词或标签
- **THEN** 系统应返回 403 Forbidden 错误
- **AND** 记录安全日志
- **AND** 不泄露资源是否存在的信息

### Requirement: 认证错误处理
系统 SHALL 提供清晰的认证错误提示,帮助用户理解问题并采取行动。

#### Scenario: Supabase 服务不可用
- **WHEN** Supabase 服务中断或无法连接
- **THEN** 系统应显示 "认证服务暂时不可用,请稍后重试" 错误
- **AND** 记录详细错误日志
- **AND** 提供刷新页面的提示

#### Scenario: 网络错误
- **WHEN** 用户网络连接异常导致认证失败
- **THEN** 系统应显示 "网络连接失败,请检查网络设置" 错误
- **AND** 提供重试按钮

#### Scenario: Token 格式错误
- **WHEN** 前端发送的 Token 格式不正确
- **THEN** 后端应返回 400 Bad Request 错误
- **AND** 前端应清除无效 Token
- **AND** 用户被重定向到登录页面

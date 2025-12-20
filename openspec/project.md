# Project Context

## Purpose

Ink & Prompt 是一个为创作者与构建者打造的"提示词写作空间（Prompt Writing Space）"。它不仅保存提示词，更像一个能够陪伴创造的灵感工作室，让提示词成为真正的创作工具，而不是模型指令。

**核心理念：**
1. 让提示词，更像写作，而不是编程
2. 让 AI 生成，更像创作,而不是调用

**核心价值：**
- 提供专业的提示词管理和优化工具
- 支持提示词的版本控制和历史追踪
- 智能标签系统帮助用户组织和检索提示词
- 基于场景的提示词优化能力
- 精确的 Token 统计和成本预估

## Tech Stack

### 前端技术栈
- **框架**: React 18+ with TypeScript
- **构建工具**: Vite
- **样式方案**: Tailwind CSS v4 (最新语法)
- **组件库**:
  - shadcn/ui (UI 组件)
  - Supabase Auth UI (登录组件)
- **状态管理**: React Hooks + Context API
- **HTTP 客户端**: Fetch API / Axios

### 后端技术栈
- **框架**: Python 3.10+ with FastAPI
- **虚拟环境**: venv
- **数据库**:
  - SQLite (开发环境/轻量级存储)
  - PostgreSQL (生产环境)
- **认证**: JWT + Supabase OAuth 2.0
- **ORM**: SQLAlchemy
- **大模型管理**: LangChain (支持对话、记忆、多模型切换)

### 外部依赖
- **Supabase**: OAuth 2.0 认证服务、JWT 验证
- **OpenAI API**: 兼容 OpenAI API 格式的多模型接入
- **LangChain**: 大模型编排框架，支持对话链、记忆管理、多模型切换
- **SentencePiece**: Token 统计库

## Project Conventions

### Code Style

#### 前端代码风格
- **TypeScript**: 严格模式，所有函数和变量必须有明确类型
- **组件命名**: PascalCase (例如: `PromptCard.tsx`)
- **函数命名**: camelCase (例如: `handleSubmit`, `fetchPrompts`)
- **常量命名**: UPPER_SNAKE_CASE (例如: `MAX_TOKEN_COUNT`)
- **文件组织**:
  ```
  src/
  ├── components/     # 可复用组件
  ├── pages/          # 页面组件
  ├── hooks/          # 自定义 Hooks
  ├── lib/            # 工具函数
  ├── types/          # TypeScript 类型定义
  └── api/            # API 调用封装
  ```
- **Tailwind CSS v4**: 使用最新的导入语法，避免使用已废弃的配置方式
- **组件规范**: 优先使用 shadcn/ui 组件，保持风格统一

#### 后端代码风格
- **Python**: 遵循 PEP 8 规范
- **命名规范**:
  - 文件/模块: snake_case
  - 类名: PascalCase
  - 函数/变量: snake_case
- **文件组织**:
  ```
  app/
  ├── api/            # API 路由
  ├── models/         # 数据模型
  ├── schemas/        # Pydantic schemas
  ├── services/       # 业务逻辑
  ├── chains/         # LangChain 链定义
  ├── prompts/        # 提示词模板 (PromptTemplate)
  ├── callbacks/      # LangChain 回调处理器
  ├── core/           # 核心配置
  └── utils/          # 工具函数
  ```
- **类型提示**: 所有函数必须包含类型提示
- **异步优先**: 使用 `async/await` 处理 I/O 操作

### Architecture Patterns

#### 前端架构
- **组件设计**: 原子设计模式 (Atoms, Molecules, Organisms)
- **状态管理**: 局部状态优先，全局状态使用 Context
- **API 调用**: 统一封装在 `api/` 目录，使用 TypeScript 类型
- **路由**: React Router v6，懒加载页面组件
- **错误处理**: 统一的错误边界和错误提示组件

#### 后端架构
- **分层架构**:
  - API Layer (路由、请求验证)
  - Service Layer (业务逻辑)
  - LangChain Layer (大模型调用编排)
  - Data Layer (数据库操作)
- **LangChain 集成模式**:
  - 所有大模型调用统一通过 LangChain 管理
  - 自定义 CallbackHandler 记录调用详情到数据库
  - PromptTemplate 统一管理系统提示词
  - 支持通过配置切换不同模型 (OpenAI, Anthropic, 本地模型)
- **依赖注入**: FastAPI 的依赖注入系统
- **中间件**: 认证、日志、CORS、错误处理
- **异常处理**: 统一的异常处理器和错误响应格式

### Testing Strategy

#### 前端测试
- **单元测试**: Vitest + React Testing Library
- **组件测试**: 重点测试交互逻辑和状态变化
- **E2E 测试**: Playwright (关键用户流程)
- **测试覆盖率**: 核心业务逻辑 >80%

#### 后端测试
- **单元测试**: pytest
- **API 测试**: pytest + httpx (TestClient)
- **数据库测试**: 使用独立测试数据库
- **测试覆盖率**: API 端点 >90%，业务逻辑 >85%

### Git Workflow

- **分支策略**: Git Flow
  - `main`: 生产环境代码
  - `develop`: 开发环境代码
  - `feature/*`: 功能分支
  - `hotfix/*`: 紧急修复分支
- **提交规范**: Conventional Commits
  - `feat:` 新功能
  - `fix:` Bug 修复
  - `docs:` 文档更新
  - `style:` 代码格式调整
  - `refactor:` 重构
  - `test:` 测试相关
  - `chore:` 构建/工具链更新
- **PR 要求**:
  - 代码审查通过
  - 所有测试通过
  - 无冲突

## Domain Context

### 核心业务实体

#### 1. 用户 (User)
- **唯一标识**: UUID (Supabase 生成)
- **认证方式**: OAuth 2.0 + JWT Token
- **关联资源**: 提示词、标签、大模型调用记录

#### 2. 提示词 (Prompt)
- **属性**:
  - ID: UUID
  - 名称: string (必填)
  - 内容: text (必填)
  - Token 数: integer (自动计算)
  - 标签: Tag[] (多对多关系)
  - 创建时间: timestamp
  - 更新时间: timestamp
- **版本控制**: 每次内容修改自动创建新版本
- **历史记录**: 保留所有历史版本，支持查看和回溯

#### 3. 标签 (Tag)
- **属性**:
  - ID: UUID
  - 名称: string (唯一)
  - 类型: enum (系统预设 | 用户自定义)
  - 使用次数: integer (统计)
- **系统预设标签场景**:
  - 内容创作
  - 代码生成
  - 数据分析
  - 客服对话
  - 教育培训
  - 其他通用场景

#### 4. 提示词历史版本 (PromptVersion)
- **属性**:
  - ID: UUID
  - Prompt ID: UUID (外键)
  - 版本号: integer (自增)
  - 内容: text
  - Token 数: integer
  - 修改时间: timestamp
  - 变更说明: string (可选)

#### 5. 大模型调用记录 (ModelCall)
- **属性**:
  - ID: UUID
  - User ID: UUID (外键)
  - 会话 ID: UUID (可选，用于关联对话上下文)
  - 模型名称: string (例如: gpt-4, claude-3, etc.)
  - 输入 (Input):
    - 提示词: text (用户输入或系统构造的 prompt)
    - 消息历史: JSON (对话历史，LangChain messages 格式)
    - 输入 Token 数: integer
  - 输出 (Output):
    - 响应内容: text (模型生成的结果)
    - 输出 Token 数: integer
    - 完成原因: enum (stop | length | error | timeout)
  - Token 消耗统计:
    - 总 Token 数: integer (input_tokens + output_tokens)
    - 预估成本: decimal (基于模型定价)
  - 调用状态: enum (成功 | 失败 | 超时)
  - 调用时间: timestamp
  - 响应时间: integer (毫秒)
  - 参数配置: JSON (temperature, max_tokens, top_p 等)
  - LangChain 元数据: JSON (chain_type, memory_type 等)
- **用途**:
  - 记录所有大模型调用历史，支持审计和成本分析
  - 为未来的对话功能提供数据基础
  - 通过 LangChain 管理，支持扩展到 ConversationChain、AgentChain 等

### 业务流程

#### 用户认证流程
1. 用户通过 Supabase OAuth 登录
2. 前端接收 JWT Token
3. 后端验证 JWT Token 有效性
4. 系统创建或更新用户记录

#### 提示词管理流程
1. 用户创建提示词 → 自动计算 Token → 保存初始版本
2. 用户编辑提示词内容 → 创建新版本 → 更新 Token 统计
3. 用户修改标签 → 仅更新标签关联，不创建新版本

#### 提示词优化流程
1. 用户选择提示词和优化场景
2. 系统加载场景对应的 system_prompt
3. 通过 LangChain 构建优化链 (PromptTemplate + ChatModel)
4. 调用大模型 API 进行优化
5. 返回优化建议，用户可选择应用
6. 记录完整的模型调用历史 (包含 input/output/tokens/metadata)

### UI/UX 设计原则

#### 视觉风格
- **设计关键词**: 简洁、高级、专业、优雅
- **色彩理念**: 契合 "Ink & Prompt" 概念
  - 主色调: 深邃的墨色系 (深灰、炭黑)
  - 强调色: 墨水晕染的渐变色 (蓝紫、墨绿)
  - 背景色: 干净的纸张感 (米白、浅灰)
- **排版**: 宽松的留白、清晰的层次、舒适的阅读体验
- **字体**: 衬线字体用于标题，无衬线字体用于正文

#### 交互设计
- **操作流畅**: 最小化点击次数，智能表单填充
- **即时反馈**: 操作立即响应，加载状态清晰
- **容错设计**: 防误操作确认，可撤销的删除操作
- **键盘友好**: 支持快捷键，Enter 提交，Esc 取消

#### 功能优先级
- **P0 (核心功能)**: 提示词 CRUD、标签管理、用户认证
- **P1 (重要功能)**: 版本历史、Token 统计、标签筛选
- **P2 (增强功能)**: 提示词优化、批量操作
- **P3 (未来规划)**: 积分系统、协作分享

## Important Constraints

### 技术约束
- **Tailwind v4 兼容性**: 必须使用最新的 `@import` 语法导入 Tailwind
- **Supabase 依赖**: 认证系统完全依赖 Supabase，需处理服务不可用情况
- **Token 统计精度**: SentencePiece 统计结果可能与实际模型 Token 有偏差，需向用户说明
- **数据库选择**: 开发使用 SQLite，生产使用 PostgreSQL，需保证数据迁移兼容性

### 业务约束
- **用户数据隔离**: 严格的用户数据隔离，禁止跨用户访问
- **版本存储**: 历史版本无限期保留，可能需要实现归档策略
- **标签唯一性**: 每个用户的标签名称唯一，避免重复创建
- **模型调用限制**: 需实现请求频率限制，防止滥用

### 安全约束
- **JWT 验证**: 所有 API 请求必须验证 JWT Token
- **CORS 策略**: 严格的跨域资源共享配置
- **SQL 注入防护**: 使用 ORM 参数化查询
- **XSS 防护**: 前端渲染用户内容时进行转义
- **敏感信息**: API Key、数据库密码等通过环境变量管理

### 性能约束
- **提示词列表分页**: 单页最多显示 50 条记录
- **Token 统计**: 异步计算，避免阻塞主流程
- **大模型超时**: API 调用超时时间设置为 30 秒
- **缓存策略**: 标签列表、系统配置等静态数据可缓存

## External Dependencies

### Supabase
- **用途**: OAuth 2.0 认证、JWT Token 签发与验证
- **关键 API**:
  - `signInWithOAuth()`: 发起 OAuth 登录
  - `getSession()`: 获取当前会话
  - `verifyJWT()`: 后端验证 Token
- **风险**: 服务中断会导致无法登录，需实现降级方案
- **文档**: https://supabase.com/docs/guides/auth

### LangChain
- **用途**: 大模型应用编排框架，统一管理所有 LLM 调用
- **核心功能**:
  - **多模型支持**: 通过统一接口切换不同 LLM (OpenAI, Anthropic, 本地模型等)
  - **提示词模板**: PromptTemplate 管理系统提示词和用户输入
  - **对话记忆**: ConversationBufferMemory 支持多轮对话上下文
  - **链式调用**: LLMChain、SequentialChain 组合复杂工作流
  - **回调系统**: 记录 Token 消耗、响应时间等元数据
- **MVP 阶段使用场景**:
  - 提示词优化: PromptTemplate + ChatOpenAI
  - 调用记录: 通过 Callbacks 自动记录 input/output/tokens
- **未来扩展**:
  - 多轮对话: ConversationChain + Memory
  - Agent 模式: 提示词智能改写、自动标签推荐
  - RAG 功能: 基于历史提示词的检索增强生成
- **关键组件**:
  - `ChatOpenAI`: OpenAI API 兼容的聊天模型封装
  - `PromptTemplate`: 提示词模板管理
  - `ConversationBufferMemory`: 对话历史管理
  - `LLMChain`: 基础调用链
  - `CallbackHandler`: 自定义回调记录调用详情
- **文档**: https://python.langchain.com/docs/

### OpenAI API (及兼容接口)
- **用途**: 提示词优化、内容生成 (通过 LangChain 调用)
- **兼容性**: 支持所有 OpenAI API 格式兼容的模型服务
- **关键参数**:
  - `model`: 模型名称 (如 gpt-4, gpt-3.5-turbo, claude-3, etc.)
  - `messages`: 对话历史
  - `temperature`: 随机性控制 (0-2)
  - `max_tokens`: 最大生成 Token 数
- **成本考量**: 按 Token 计费，需向用户展示预估成本
- **调用方式**: 通过 LangChain 的 ChatOpenAI 或自定义 ChatModel
- **文档**: https://platform.openai.com/docs/api-reference

### SentencePiece
- **用途**: 提示词 Token 数量统计
- **注意事项**:
  - 统计结果为估算值，与实际模型 Token 可能有 ±5% 偏差
  - 需预加载语言模型文件
- **替代方案**: tiktoken (OpenAI 官方库)
- **文档**: https://github.com/google/sentencepiece

### shadcn/ui
- **用途**: UI 组件库
- **安装方式**: 按需安装组件到项目中
- **定制**: 支持通过 Tailwind 配置主题
- **文档**: https://ui.shadcn.com/

## Additional Notes

### 开发环境配置

#### 前端环境变量 (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:8000
```

#### 后端环境变量 (.env)
```
# 数据库配置
DATABASE_URL=sqlite:///./inkprompt.db  # 开发环境
# DATABASE_URL=postgresql://user:pass@localhost/inkprompt  # 生产环境

# Supabase 认证
SUPABASE_URL=your_supabase_url
SUPABASE_JWT_SECRET=your_jwt_secret

# LangChain + 大模型配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE=https://api.openai.com/v1  # 可替换为其他兼容服务
DEFAULT_MODEL=gpt-4  # 默认使用的模型
LANGCHAIN_TRACING_V2=false  # LangSmith 追踪 (可选)
LANGCHAIN_API_KEY=your_langsmith_key  # LangSmith API Key (可选)

# 模型调用限制
MAX_TOKENS_DEFAULT=2000  # 默认最大 Token 数
TEMPERATURE_DEFAULT=0.7  # 默认温度参数
MODEL_TIMEOUT=30  # API 调用超时时间 (秒)
RATE_LIMIT_PER_USER=100  # 每用户每小时调用次数限制
```

### 未来规划功能

#### 积分管理系统 (待定)
- **积分获取**: 每日签到、邀请好友、完成任务
- **积分消耗**: 提示词优化、高级模型调用
- **积分充值**: 支付接入 (Stripe/支付宝)
- **免费额度**: 新用户注册赠送初始积分

#### 协作功能 (待定)
- **提示词分享**: 生成分享链接
- **团队空间**: 多人协作编辑提示词
- **评论功能**: 对提示词进行讨论
- **版本对比**: 可视化对比不同版本差异

#### 高级功能 (待定)
- **提示词模板**: 预设常用场景模板
- **智能推荐**: 基于标签推荐相关提示词
- **导出功能**: 导出为 Markdown/JSON
- **批量操作**: 批量编辑标签、批量删除

### 开发优先级

**MVP (最小可行产品) - Sprint 1-2**
- 用户认证 (Supabase OAuth)
- 提示词 CRUD
- 基础标签管理
- Token 统计

**核心功能 - Sprint 3-4**
- 版本历史查看
- 标签筛选和搜索
- 提示词优化 (单场景)

**增强功能 - Sprint 5-6**
- 多场景优化
- 大模型调用记录
- UI/UX 优化

**未来迭代**
- 积分系统
- 协作功能
- 高级搜索和推荐

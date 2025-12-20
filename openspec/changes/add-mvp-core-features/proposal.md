# MVP 核心功能实现提案

## Why

Ink & Prompt 项目需要构建最小可行产品(MVP),以验证核心价值主张:"让提示词更像写作,而不是编程"。MVP 需要包含用户认证、提示词管理、标签系统和 Token 统计这四个核心功能,为用户提供完整的提示词写作和管理体验。

当前项目处于初始阶段,需要从零开始构建前后端基础架构和核心业务功能,为后续的版本历史、提示词优化等增强功能打下坚实基础。

## What Changes

### 1. 用户认证系统
- 集成 Supabase OAuth 2.0 认证
- 实现 JWT Token 验证中间件
- 前端登录/登出流程
- 后端用户身份验证和授权

### 2. 提示词管理模块
- 提示词 CRUD 操作 (创建、读取、更新、删除)
- 提示词列表展示 (分页、搜索)
- 提示词详情查看
- 自动创建初始版本记录

### 3. 标签管理系统
- 系统预设标签初始化
- 用户自定义标签创建
- 标签关联提示词 (多对多关系)
- 标签筛选和搜索功能
- 标签输入时的自动补全

### 4. Token 统计功能
- 集成 SentencePiece/tiktoken 进行 Token 计算
- 创建/更新提示词时自动统计 Token
- 在列表和详情页展示 Token 数量

### 5. 基础架构搭建
- 前端: React + TypeScript + Tailwind v4 + Vite 项目初始化
- 后端: FastAPI + SQLAlchemy + SQLite 项目初始化
- 数据库 Schema 设计和迁移
- API 接口规范定义
- 错误处理和日志系统

## Impact

### 受影响的规范
- **NEW**: `user-auth` - 用户认证规范
- **NEW**: `prompt-management` - 提示词管理规范
- **NEW**: `tag-management` - 标签管理规范
- **NEW**: `token-statistics` - Token 统计规范

### 受影响的代码
- **前端新增**:
  - `src/pages/Login.tsx` - 登录页面
  - `src/pages/PromptList.tsx` - 提示词列表页
  - `src/pages/PromptEditor.tsx` - 提示词编辑器
  - `src/components/TagInput.tsx` - 标签输入组件
  - `src/components/PromptCard.tsx` - 提示词卡片组件
  - `src/api/` - API 调用封装
  - `src/hooks/useAuth.tsx` - 认证 Hook
  - `src/types/` - TypeScript 类型定义

- **后端新增**:
  - `app/models/` - 数据模型 (User, Prompt, Tag, PromptVersion)
  - `app/api/auth.py` - 认证相关 API
  - `app/api/prompts.py` - 提示词 API
  - `app/api/tags.py` - 标签 API
  - `app/services/` - 业务逻辑层
  - `app/core/auth.py` - JWT 验证中间件
  - `app/core/config.py` - 配置管理
  - `app/utils/token_counter.py` - Token 统计工具

- **数据库**:
  - 数据库迁移文件
  - 初始数据种子文件 (系统预设标签)

### 技术风险
- Tailwind v4 兼容性问题需要特别注意最新语法
- Supabase OAuth 集成可能需要额外配置
- Token 统计精度需要向用户说明为估算值

### 业务影响
- 用户可以开始使用系统创建和管理提示词
- 为后续的版本历史和提示词优化功能奠定基础
- 提供完整的用户体验闭环

### 非功能性影响
- 建立项目的代码规范和架构模式
- 设置 CI/CD 基础
- 定义 API 接口规范

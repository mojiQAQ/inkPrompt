# MVP 核心功能实现任务清单

## 1. 项目初始化与基础架构
- [x] 1.1 前端项目初始化 (Vite + React + TypeScript)
- [x] 1.2 配置 Tailwind CSS v3 (回退到稳定版本)
- [ ] 1.3 安装 shadcn/ui 组件库
- [x] 1.4 配置 React Router v6
- [x] 1.5 后端项目初始化 (FastAPI + SQLAlchemy)
- [x] 1.6 配置 Python 虚拟环境 (venv)
- [x] 1.7 设置环境变量管理 (.env)
- [x] 1.8 配置 CORS 中间件
- [x] 1.9 创建项目目录结构 (前后端)
- [x] 1.10 设置代码格式化工具 (Prettier, Black)

## 2. 数据库设计与实现
- [x] 2.1 设计数据库 Schema (User, Prompt, Tag, PromptVersion, PromptTag)
- [x] 2.2 创建 SQLAlchemy 数据模型
- [x] 2.3 配置数据库连接 (SQLite)
- [x] 2.4 创建数据库迁移脚本 (自动创建表)
- [x] 2.5 执行初始迁移
- [x] 2.6 创建系统预设标签种子数据 (已修复并正常工作)
- [x] 2.7 编写数据库工具函数 (get_db 依赖注入)

## 3. 用户认证系统实现
- [x] 3.1 配置 Supabase 项目和 OAuth 设置 (已由用户配置)
- [x] 3.2 前端安装 @supabase/supabase-js
- [x] 3.3 创建 Supabase 客户端配置
- [x] 3.4 实现登录页面组件 (Login.tsx)
- [x] 3.5 实现 OAuth 登录流程 (Google) 和邮箱登录
- [x] 3.6 实现 JWT Token 存储 (Supabase 自动处理)
- [x] 3.7 后端创建 JWT 验证中间件
- [x] 3.8 实现 Supabase JWT 验证函数
- [x] 3.9 创建用户模型和数据库表
- [x] 3.10 实现用户创建/更新逻辑
- [x] 3.11 创建认证 Hook (useAuth)
- [x] 3.12 实现登出功能
- [x] 3.13 添加路由守卫 (ProtectedRoute)
- [x] 3.14 处理 Token 过期和刷新 (Supabase 自动处理)

## 4. 提示词管理功能实现
- [x] 4.1 创建 Prompt 数据模型
- [x] 4.2 创建 PromptVersion 数据模型
- [x] 4.3 定义 Prompt Pydantic Schema (请求/响应)
- [x] 4.4 实现提示词创建 API (POST /api/prompts)
- [x] 4.5 实现提示词列表 API (GET /api/prompts - 支持分页)
- [x] 4.6 实现提示词详情 API (GET /api/prompts/{id})
- [x] 4.7 实现提示词更新 API (PUT /api/prompts/{id})
- [x] 4.8 实现提示词删除 API (DELETE /api/prompts/{id})
- [x] 4.9 实现提示词搜索 API (GET /api/prompts?search=xxx)
- [x] 4.10 创建 Service 层处理业务逻辑
- [x] 4.11 实现自动创建版本记录逻辑
- [x] 4.12 前端创建提示词列表页面 (PromptList.tsx)
- [x] 4.13 前端创建提示词编辑器页面 (PromptEditor.tsx)
- [x] 4.14 创建提示词卡片组件 (PromptCard.tsx)
- [x] 4.15 实现分页组件 (内置在 PromptList)
- [x] 4.16 实现搜索框组件 (内置在 PromptList)
- [x] 4.17 封装提示词 API 调用函数 (frontend/src/api/prompts.ts)
- [x] 4.18 实现创建提示词表单 (PromptEditor 创建模式)
- [x] 4.19 实现更新提示词表单 (PromptEditor 编辑模式)
- [x] 4.20 实现删除确认对话框 (ConfirmDialog.tsx)
- [x] 4.21 添加加载状态和错误处理 (Loading.tsx + 错误状态)

## 5. 标签管理功能实现
- [x] 5.1 创建 Tag 数据模型
- [x] 5.2 创建 PromptTag 关联表模型 (多对多)
- [x] 5.3 定义 Tag Pydantic Schema (backend/app/schemas/tag.py)
- [x] 5.4 实现标签列表 API (GET /api/tags)
- [x] 5.5 实现创建标签 API (POST /api/tags)
- [x] 5.6 实现标签关联提示词 API (已内置在提示词 Service)
- [x] 5.7 实现按标签筛选提示词 API (GET /api/prompts?tag_names=xxx)
- [x] 5.8 实现系统预设标签初始化逻辑 (backend/app/utils/init_data.py)
- [x] 5.9 创建标签输入组件 (TagInput.tsx)
- [x] 5.10 实现标签自动补全功能
- [x] 5.11 实现标签创建功能 (输入回车)
- [x] 5.12 实现标签删除功能
- [x] 5.13 创建标签筛选组件 (已在 PromptList 中实现)
- [x] 5.14 实现标签筛选逻辑 (已在 PromptList 中实现)
- [x] 5.15 封装标签 API 调用函数 (frontend/src/api/tags.ts)
- [x] 5.16 添加标签样式设计 (墨色系主题)

## 6. Token 统计功能实现
- [x] 6.1 安装 tiktoken 包
- [x] 6.2 创建 Token 计算工具函数
- [x] 6.3 实现同步 Token 统计逻辑
- [x] 6.4 在创建提示词时自动计算 Token
- [x] 6.5 在更新提示词时自动计算 Token
- [x] 6.6 在版本记录中存储 Token 数
- [x] 6.7 在提示词列表展示 Token 数 (PromptCard)
- [x] 6.8 在提示词详情展示 Token 数 (PromptEditor)
- [x] 6.9 创建 Token 显示组件 (内置在相应页面)
- [x] 6.10 添加 Token 统计的误差说明提示 (PromptEditor 中已添加)

## 7. UI/UX 实现
- [x] 7.1 设计整体布局组件 (Layout.tsx)
- [x] 7.2 创建导航栏组件 (Navbar.tsx)
- [ ] 7.3 创建侧边栏组件 (Sidebar.tsx - 可选)
- [x] 7.4 配置 Tailwind 主题 (墨色系配色)
- [x] 7.5 实现响应式设计 (部分完成 - 基础响应式)
- [x] 7.6 创建加载状态组件 (Loading.tsx)
- [x] 7.7 创建空状态组件 (EmptyState.tsx)
- [x] 7.8 创建错误提示组件 (ErrorMessage.tsx)
- [x] 7.9 实现 Toast 通知系统 (react-hot-toast)
- [x] 7.10 优化表单用户体验 (验证、提示)
- [x] 7.11 添加页面过渡动画 (fadeIn, slideUp, card-transition)
- [x] 7.12 实现键盘快捷键支持 (Ctrl/⌘+K 搜索, Ctrl/⌘+N 新建, ESC 关闭对话框)

## 8. 测试
- [ ] 8.1 配置 Vitest 测试环境
- [ ] 8.2 编写提示词 API 单元测试
- [ ] 8.3 编写标签 API 单元测试
- [ ] 8.4 编写认证中间件测试
- [ ] 8.5 编写 Token 统计工具测试
- [ ] 8.6 编写前端组件测试 (关键组件)
- [ ] 8.7 配置 pytest 测试环境
- [ ] 8.8 编写后端 API 集成测试
- [ ] 8.9 确保测试覆盖率达标 (>80%)

## 9. 文档与部署
- [x] 9.1 编写 API 文档 (OpenAPI/Swagger - FastAPI 自动生成)
- [x] 9.2 编写前端 README (已在主 README 中)
- [x] 9.3 编写后端 README (已在主 README 中)
- [x] 9.4 创建环境变量示例文件 (.env.example)
- [x] 9.5 编写本地开发指南 (已在主 README 中)
- [x] 9.6 配置开发环境启动脚本 (dev.sh + stop-dev.sh)
- [x] 9.7 创建数据库初始化脚本 (backend/scripts/init_db.py)
- [ ] 9.8 验证完整的用户流程

## 10. 优化与调试
- [ ] 10.1 性能优化 (API 响应时间、前端渲染)
- [ ] 10.2 安全检查 (XSS、SQL 注入防护)
- [ ] 10.3 错误处理完善
- [ ] 10.4 日志记录完善
- [ ] 10.5 代码审查和重构
- [ ] 10.6 修复已知 Bug
- [ ] 10.7 用户体验优化
- [ ] 10.8 可访问性优化 (a11y)

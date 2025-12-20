# Ink & Prompt

> 让提示词，更像写作，而不是编程

一个专注于 AI 提示词管理的现代化 Web 应用，帮助你更好地组织、管理和迭代你的提示词。

## ✨ 特性

### 核心功能
- 🎨 **直观的编辑器** - 所见即所得的提示词编辑体验
- 🏷️ **智能标签系统** - 通过标签快速组织和查找提示词
- 📊 **Token 统计** - 实时计算提示词的 Token 数量
- 📝 **版本历史** - 自动保存每次修改，随时回溯历史版本
- 🔍 **强大搜索** - 支持全文搜索、标签筛选和搜索历史
- 🔐 **安全认证** - 基于 Supabase 的 OAuth 登录(支持 Google 和 GitHub)
- 🎯 **响应式设计** - 完美适配各种屏幕尺寸

### AI 增强功能 ✨ NEW
- 🤖 **AI 优化** - 使用 LangChain 和 OpenAI 智能优化提示词
- 🎭 **多场景支持** - 通用、内容创作、代码生成、数据分析、对话交互
- 💰 **成本追踪** - 实时显示 Token 使用量和估算成本
- 📈 **调用记录** - 完整的 LLM 调用历史和统计信息
- 🚀 **功能引导** - 首次使用时的交互式新手引导

## 🚀 快速开始

### 方式一：Docker 部署（推荐）

使用 Docker 可以快速启动整个应用，无需手动配置环境。

#### 前置要求
- Docker >= 20.10
- Docker Compose >= 2.0

#### 快速启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd inkPrompt

# 2. 配置环境变量
cp .env.example backend/.env
# 编辑 backend/.env 填写必要配置（Supabase、OpenRouter API Key）

# 3. 启动所有服务
docker-compose up -d

# 4. 访问应用
# 前端: http://localhost:3000
# API 文档: http://localhost:3000/api/docs
```

详细的 Docker 部署文档请参考：[Docker 部署指南](docs/DOCKER.md)

### 方式二：本地开发环境

#### 前置要求

- Node.js >= 18.0.0
- Python >= 3.11
- Supabase 账号(用于认证)

### 1. 克隆项目

```bash
git clone <repository-url>
cd inkPrompt
```

### 2. 配置 Supabase

1. 访问 [Supabase](https://app.supabase.com) 创建新项目
2. 在项目设置中启用 Google 和 GitHub OAuth
3. 获取项目的 URL 和 anon key

### 3. 配置环境变量

**前端配置:**

```bash
cd frontend
cp .env.example .env
```

编辑 `.env` 文件,填入你的 Supabase 配置:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=http://localhost:8000
```

**后端配置:**

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件,填入配置:

```env
# 数据库
DATABASE_URL=postgresql://username:password@localhost:5432/inkprompt

# 认证
SECRET_KEY=your-secret-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret-here

# OpenAI / LangChain (可选 - 用于 AI 优化功能)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_API_BASE=https://api.openai.com/v1
DEFAULT_MODEL=gpt-3.5-turbo
```

### 4. 安装依赖

**前端:**

```bash
cd frontend
npm install
```

**后端:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 5. 启动开发服务器

**后端(终端 1):**

```bash
cd backend
source venv/bin/activate
python run.py
```

后端 API 将运行在 http://localhost:8000

**前端(终端 2):**

```bash
cd frontend
npm run dev
```

前端应用将运行在 http://localhost:3000

### 6. 访问应用

打开浏览器访问 http://localhost:3000,使用 Google 或 GitHub 账号登录即可开始使用!

## 📁 项目结构

```
inkPrompt/
├── frontend/              # 前端应用(React + TypeScript + Vite)
│   ├── src/
│   │   ├── api/          # API 客户端
│   │   ├── components/   # React 组件
│   │   ├── hooks/        # 自定义 Hooks
│   │   ├── pages/        # 页面组件
│   │   ├── types/        # TypeScript 类型定义
│   │   └── styles/       # 样式文件
│   └── package.json
│
├── backend/              # 后端 API(FastAPI + SQLAlchemy)
│   ├── app/
│   │   ├── api/         # API 路由
│   │   ├── core/        # 核心功能(认证、配置、数据库)
│   │   ├── models/      # 数据库模型
│   │   ├── schemas/     # Pydantic 数据模型
│   │   ├── services/    # 业务逻辑层
│   │   └── utils/       # 工具函数
│   └── requirements.txt
│
└── openspec/            # OpenSpec 变更管理
    └── changes/
        └── add-mvp-core-features/
```

## 🛠️ 技术栈

### 前端

- **框架:** React 18 + TypeScript
- **构建工具:** Vite 5
- **路由:** React Router v6
- **样式:** Tailwind CSS v3
- **认证:** Supabase Auth
- **通知:** react-hot-toast

### 后端

- **框架:** FastAPI
- **ORM:** SQLAlchemy
- **数据库:** PostgreSQL (推荐) / SQLite (开发环境)
- **认证:** Supabase JWT 验证
- **AI 框架:** LangChain + OpenAI
- **Token 计算:** tiktoken

## 📖 文档

### API 文档

后端启动后,访问以下地址查看 API 文档:

- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc
- OpenAPI JSON: http://localhost:8000/api/openapi.json

### 完整文档

**用户指南**
- [⚡ 优化功能快速上手](docs/OPTIMIZATION_QUICK_START.md) - 3 分钟快速入门 AI 优化
- [📚 优化功能完整指南](docs/OPTIMIZATION_USAGE.md) - AI 优化功能详细使用说明
- [🎯 优化场景详解](docs/OPTIMIZATION_GUIDE.md) - 各场景的优化策略和案例

**技术文档**
- [📖 API 参考文档](docs/API.md) - 完整的 API 接口说明
- [🔗 LangChain 集成指南](docs/LANGCHAIN_INTEGRATION.md) - AI 功能技术实现
- [🐳 Docker 部署指南](docs/DOCKER.md) - Docker 容器化部署完整指南
- [🚀 传统部署指南](docs/DEPLOYMENT.md) - 传统方式生产环境部署说明
- [📋 实施总结](IMPLEMENTATION_SUMMARY.md) - Sprint 3-4 功能概览

## 🎯 核心功能

### 提示词管理

- 创建、编辑、删除提示词
- 实时 Token 统计
- 自动保存版本历史
- 全文搜索

### 标签系统

- 23 个系统预设标签(用途、领域、技术、风格)
- 自定义标签
- 标签自动补全
- 多标签筛选

### 版本控制

- 每次修改自动创建版本
- 版本对比
- 版本回溯

## 🔧 开发指南

### 前端开发

```bash
cd frontend
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run lint         # 代码检查
```

### 后端开发

```bash
cd backend
source venv/bin/activate
python run.py        # 启动开发服务器(带热重载)
```

## 🧪 测试

目前测试模块尚在开发中。

## 📝 后续规划

### 优先级高
- [ ] 模型调用记录前端页面
- [ ] 用量限制和配额管理
- [ ] 单元测试和集成测试
- [ ] 优化历史记录保存

### 未来功能
- [ ] 实现键盘快捷键
- [ ] 支持导入/导出功能
- [ ] 支持 Markdown 格式
- [ ] 添加提示词模板
- [ ] 团队协作功能
- [ ] 流式展示优化过程

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📄 许可证

MIT License

## 🙏 致谢

- [Supabase](https://supabase.com) - 认证服务
- [FastAPI](https://fastapi.tiangolo.com) - 后端框架
- [React](https://react.dev) - 前端框架
- [Tailwind CSS](https://tailwindcss.com) - CSS 框架
- [LangChain](https://python.langchain.com) - AI 框架
- [OpenAI](https://openai.com) - 大语言模型
- [tiktoken](https://github.com/openai/tiktoken) - Token 计算

---

Made with ❤️ by the Ink & Prompt Team

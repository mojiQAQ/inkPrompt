# Docker 容器化部署规范

## ADDED Requirements

### Requirement: 后端 Docker 镜像构建

系统 MUST 提供后端服务的 Docker 镜像构建配置，确保可以将 FastAPI 应用及其所有依赖打包成可独立运行的容器镜像。

#### Scenario: 构建后端镜像

**Given** 开发者在项目根目录
**And** backend/Dockerfile 存在
**And** backend/requirements.txt 包含所有依赖
**When** 执行 `docker build -t inkprompt-backend ./backend`
**Then** 镜像构建成功
**And** 镜像大小小于 300MB
**And** 镜像包含 Python 3.11 运行时
**And** 镜像包含所有 Python 依赖（FastAPI, SQLAlchemy, LangChain 等）

#### Scenario: 运行后端容器

**Given** 后端镜像已构建
**And** .env 文件配置了必要的环境变量
**When** 执行 `docker run -p 8000:8000 --env-file backend/.env inkprompt-backend`
**Then** 容器成功启动
**And** FastAPI 服务监听在 8000 端口
**And** 访问 http://localhost:8000/health 返回 200 状态码
**And** 访问 http://localhost:8000/docs 可以看到 API 文档

---

### Requirement: 前端 Docker 镜像构建

系统 MUST 提供前端应用的 Docker 镜像构建配置，使用多阶段构建生成优化的生产镜像，包含构建后的静态资源和 Nginx 服务器。

#### Scenario: 多阶段构建前端镜像

**Given** 开发者在项目根目录
**And** frontend/Dockerfile 存在
**And** frontend/nginx.conf 存在
**And** frontend/package.json 包含所有依赖
**When** 执行 `docker build -t inkprompt-frontend ./frontend`
**Then** 镜像构建成功
**And** 构建过程分为两个阶段（build 和 production）
**And** 最终镜像仅包含构建产物和 Nginx
**And** 镜像大小小于 100MB

#### Scenario: 运行前端容器

**Given** 前端镜像已构建
**When** 执行 `docker run -p 3000:80 inkprompt-frontend`
**Then** 容器成功启动
**And** Nginx 服务监听在 80 端口
**And** 访问 http://localhost:3000 可以看到登录页面
**And** 所有静态资源（JS, CSS, 图片）正常加载

---

### Requirement: Nginx 配置

前端容器的 Nginx MUST 正确配置以支持 SPA 路由、API 代理和静态资源优化。

#### Scenario: SPA 路由支持

**Given** 前端容器正在运行
**When** 用户访问 /prompts/123（不存在的静态文件）
**Then** Nginx 返回 index.html
**And** React Router 处理路由
**And** 页面正常显示

#### Scenario: API 代理

**Given** 前端容器正在运行
**And** 后端容器正在运行在同一网络
**When** 前端发起请求到 /api/prompts
**Then** Nginx 将请求代理到 http://backend:8000/api/prompts
**And** 后端正常响应
**And** 不存在 CORS 错误

#### Scenario: 静态资源缓存

**Given** 前端容器正在运行
**When** 浏览器请求 *.js 或 *.css 文件
**Then** 响应头包含 `Cache-Control: public, immutable`
**And** 响应头包含 `Expires` 设置为 1 年后

---

### Requirement: Docker Compose 服务编排

系统 MUST 提供 docker-compose.yml 配置，实现前后端服务的一键启动和网络连接。

#### Scenario: 一键启动所有服务

**Given** docker-compose.yml 存在
**And** .env 文件已配置
**When** 执行 `docker-compose up`
**Then** backend 服务成功启动
**And** frontend 服务成功启动
**And** 两个服务连接到 inkprompt-network 网络
**And** frontend 依赖 backend 后启动

#### Scenario: 服务间网络通信

**Given** 所有服务通过 docker-compose 启动
**When** frontend 服务发起请求到 http://backend:8000
**Then** 请求成功到达 backend 服务
**And** backend 服务正常响应

#### Scenario: 端口映射

**Given** 所有服务通过 docker-compose 启动
**Then** 宿主机端口 3000 映射到 frontend 容器端口 80
**And** 访问 http://localhost:3000 可以访问前端应用
**And** backend 服务不直接暴露到宿主机

---

### Requirement: 环境变量管理

系统 MUST 提供 .env.example 模板文件，并通过 docker-compose 正确加载环境变量到各服务容器。

#### Scenario: 环境变量模板

**Given** .env.example 文件存在
**Then** 文件包含所有必要的环境变量键
**And** 每个变量都有描述注释
**And** 敏感信息（API Key）使用占位符
**And** 包含以下配置：
  - DATABASE_URL
  - SUPABASE_URL
  - SUPABASE_JWT_SECRET
  - OPENAI_API_KEY
  - OPENAI_API_BASE
  - DEFAULT_MODEL
  - CORS_ORIGINS

#### Scenario: 加载环境变量到容器

**Given** .env 文件已从 .env.example 复制并配置
**And** docker-compose.yml 配置了 env_file
**When** 执行 `docker-compose up`
**Then** backend 容器可以读取所有环境变量
**And** 应用使用正确的配置启动

---

### Requirement: 数据持久化

系统 MUST 确保 SQLite 数据库文件通过卷挂载持久化，容器重启后数据不丢失。

#### Scenario: 数据库卷挂载

**Given** docker-compose.yml 配置了数据库卷挂载
**When** backend 服务启动
**Then** SQLite 数据库文件创建在 backend/inkprompt.db
**And** 数据库文件在宿主机可见

#### Scenario: 数据持久化验证

**Given** 用户创建了一个提示词
**And** 提示词保存到数据库
**When** 执行 `docker-compose down`
**And** 执行 `docker-compose up`
**Then** 之前创建的提示词仍然存在
**And** 数据库内容未丢失

---

### Requirement: 健康检查

后端服务 MUST 提供健康检查端点，Docker 容器配置健康检查以监控服务状态。

#### Scenario: 健康检查端点

**Given** 后端服务正在运行
**When** 发送 GET 请求到 /health
**Then** 返回 200 状态码
**And** 响应体包含 `{"status": "healthy"}`

#### Scenario: 容器健康检查

**Given** docker-compose.yml 配置了健康检查
**When** 后端容器启动
**Then** Docker 每 30 秒执行健康检查
**And** 如果连续 3 次失败，标记容器为 unhealthy
**And** 可以通过 `docker-compose ps` 查看健康状态

---

### Requirement: 构建优化

镜像构建 MUST 优化以减少构建时间和镜像大小。

#### Scenario: Docker 层缓存

**Given** Dockerfile 先复制依赖文件（package.json, requirements.txt）
**And** 然后复制应用代码
**When** 仅修改应用代码（未修改依赖）
**And** 重新构建镜像
**Then** 依赖安装步骤使用缓存
**And** 仅重新构建代码层
**And** 构建时间显著减少

#### Scenario: .dockerignore 排除

**Given** .dockerignore 文件存在
**And** 文件包含 node_modules, venv, .git, __pycache__
**When** 构建镜像
**Then** 这些目录不包含在构建上下文中
**And** 构建上下文大小减少
**And** 构建速度提升

---

### Requirement: 部署文档

系统 MUST 提供完整的部署文档，指导用户完成 Docker 部署。

#### Scenario: 快速启动文档

**Given** docs/DEPLOYMENT.md 文件存在
**Then** 文档包含以下章节：
  - Docker 安装指南
  - 快速启动步骤（3 步以内）
  - 环境变量配置说明
  - 常见问题排查
**And** 每个步骤都有清晰的命令示例
**And** 包含验证成功的方法

#### Scenario: README 更新

**Given** README.md 文件
**Then** 包含 "Docker 部署" 章节
**And** 章节包含一键启动命令
**And** 链接到详细的 DEPLOYMENT.md 文档

---

### Requirement: 开发环境支持

系统 SHALL 提供开发环境的 Docker 配置，支持代码热重载。

#### Scenario: 开发环境配置（可选）

**Given** docker-compose.dev.yml 文件存在
**When** 执行 `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up`
**Then** backend 容器挂载本地代码目录
**And** 修改 Python 代码时自动重载（uvicorn --reload）
**And** frontend 容器挂载本地代码目录
**And** 修改前端代码时自动重新构建（Vite HMR）

---

### Requirement: 安全性

Docker 部署 MUST 遵循安全最佳实践。

#### Scenario: 非 root 用户运行

**Given** Dockerfile 配置了 USER 指令
**When** 容器启动
**Then** 容器内进程以非 root 用户运行
**And** `docker exec <container> whoami` 返回非 root 用户名

#### Scenario: 敏感信息保护

**Given** .env 文件包含敏感信息
**Then** .env 文件在 .gitignore 中
**And** .env 文件不提交到版本控制
**And** 仅 .env.example 提交到版本控制

#### Scenario: 最小化镜像

**Given** 使用 alpine 或 slim 基础镜像
**And** 仅安装必要的依赖
**When** 构建完成
**Then** 镜像不包含编译工具、缓存文件
**And** 镜像大小在合理范围内

---

### Requirement: 一键部署体验

新用户 MUST 能在 5 分钟内完成从克隆仓库到运行应用的全过程。

#### Scenario: 新用户首次部署

**Given** 用户克隆了 Git 仓库
**And** 用户安装了 Docker 和 Docker Compose
**When** 用户执行以下命令：
  ```bash
  cp .env.example .env
  # 编辑 .env 文件配置 API Key
  docker-compose up -d
  ```
**Then** 所有服务在 3 分钟内启动完成
**And** 访问 http://localhost:3000 可以看到应用
**And** 可以正常登录和使用所有功能
**And** 无需手动安装 Node.js、Python 或其他依赖

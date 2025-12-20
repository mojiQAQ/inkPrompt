# Docker 容器化部署任务清单

## 1. 前期准备
- [x] 1.1 检查项目当前部署方式和依赖
- [x] 1.2 确认 Docker 和 Docker Compose 安装
- [x] 1.3 备份现有 .env 文件（避免被覆盖）

## 2. 后端 Docker 配置
- [x] 2.1 创建 backend/.dockerignore 文件
- [x] 2.2 编写 backend/Dockerfile
  - [x] 2.2.1 选择基础镜像 (python:3.11-slim)
  - [x] 2.2.2 设置工作目录
  - [x] 2.2.3 创建虚拟环境
  - [x] 2.2.4 复制并安装 requirements.txt
  - [x] 2.2.5 复制应用代码
  - [x] 2.2.6 暴露端口 8000
  - [x] 2.2.7 设置启动命令 (uvicorn)
- [x] 2.3 添加健康检查端点 (GET /health)
- [ ] 2.4 本地构建并测试后端镜像
  ```bash
  cd backend
  docker build -t inkprompt-backend .
  docker run -p 8000:8000 --env-file .env inkprompt-backend
  ```

## 3. 前端 Docker 配置
- [x] 3.1 创建 frontend/.dockerignore 文件
- [x] 3.2 创建 frontend/nginx.conf 配置文件
  - [x] 3.2.1 配置 SPA 路由回退 (try_files)
  - [x] 3.2.2 配置 API 代理 (/api -> backend:8000)
  - [x] 3.2.3 配置静态资源缓存
  - [x] 3.2.4 启用 Gzip 压缩
- [x] 3.3 编写 frontend/Dockerfile (多阶段构建)
  - [x] 3.3.1 Stage 1: 构建阶段 (node:18-alpine)
    - [x] 安装依赖 (npm ci)
    - [x] 执行生产构建 (npm run build)
  - [x] 3.3.2 Stage 2: 生产阶段 (nginx:alpine)
    - [x] 复制构建产物到 nginx html 目录
    - [x] 复制 nginx 配置文件
    - [x] 暴露端口 80
- [ ] 3.4 本地构建并测试前端镜像
  ```bash
  cd frontend
  docker build -t inkprompt-frontend .
  docker run -p 3000:80 inkprompt-frontend
  ```

## 4. Docker Compose 配置
- [x] 4.1 创建根目录的 docker-compose.yml
  - [x] 4.1.1 定义网络 (inkprompt-network)
  - [x] 4.1.2 定义 backend 服务
    - [x] 构建配置 (./backend)
    - [x] 环境变量配置
    - [x] 数据库卷挂载
    - [x] 健康检查
  - [x] 4.1.3 定义 frontend 服务
    - [x] 构建配置 (./frontend)
    - [x] 端口映射 (3000:80)
    - [x] 依赖 backend 服务
  - [x] 4.1.4 配置服务依赖关系 (depends_on)
- [x] 4.2 创建 .env.example 模板文件
  - [x] 数据库配置
  - [x] Supabase 配置
  - [x] OpenRouter API 配置
  - [x] 应用配置
- [ ] 4.3 创建 docker-compose.dev.yml (可选开发配置)
  - [ ] 后端代码卷挂载 (热重载)
  - [ ] 前端代码卷挂载 (热重载)
  - [ ] 开发模式环境变量

## 5. 环境变量和配置管理
- [x] 5.1 确保 backend/.env 在 .gitignore 中
- [x] 5.2 更新 .env.example 包含所有必要变量
- [ ] 5.3 添加环境变量验证脚本 (可选)
- [x] 5.4 在 docker-compose.yml 中配置环境变量加载

## 6. 数据持久化配置
- [x] 6.1 配置 SQLite 数据库卷挂载
- [ ] 6.2 确保数据库文件权限正确
- [ ] 6.3 添加数据库迁移启动脚本
- [ ] 6.4 测试容器重启后数据保留

## 7. 网络和代理配置
- [x] 7.1 验证前端到后端的 API 代理配置
- [ ] 7.2 测试跨服务网络通信
- [ ] 7.3 配置 CORS（如果需要）
- [ ] 7.4 验证静态资源访问

## 8. 构建优化
- [x] 8.1 完善 .dockerignore 文件（排除不必要的文件）
  - [ ] node_modules
  - [ ] venv
  - [ ] .git
  - [ ] __pycache__
  - [ ] *.pyc
  - [ ] .env
  - [ ] .DS_Store
- [ ] 8.2 利用 Docker 层缓存（依赖优先复制）
- [ ] 8.3 使用 BuildKit 加速构建（可选）
- [ ] 8.4 测试镜像大小是否合理（前端 < 50MB, 后端 < 200MB）

## 9. 部署脚本和文档
- [ ] 9.1 创建快速启动脚本 (scripts/start.sh)
  ```bash
  #!/bin/bash
  cp .env.example .env
  echo "请编辑 .env 文件配置环境变量"
  docker-compose up -d
  ```
- [ ] 9.2 创建停止脚本 (scripts/stop.sh)
- [ ] 9.3 创建日志查看脚本 (scripts/logs.sh)
- [x] 9.4 编写部署文档 (docs/DOCKER.md)
  - [x] Docker 安装指南
  - [x] 快速启动步骤
  - [x] 环境变量说明
  - [x] 常见问题排查
  - [x] 数据备份和恢复
  - [x] 生产部署建议
- [x] 9.5 更新 README.md 添加 Docker 部署章节

## 10. 测试和验证
- [ ] 10.1 完整的本地部署测试
  ```bash
  docker-compose down -v  # 清理旧数据
  docker-compose up --build
  ```
- [ ] 10.2 验证前端访问 (http://localhost:3000)
- [ ] 10.3 验证后端 API (http://localhost:3000/api/health)
- [ ] 10.4 验证用户登录流程
- [ ] 10.5 验证提示词 CRUD 操作
- [ ] 10.6 验证 AI 优化功能
- [ ] 10.7 验证数据持久化（重启容器后数据保留）
- [ ] 10.8 检查容器日志无严重错误
- [ ] 10.9 性能测试（响应时间是否合理）
- [ ] 10.10 资源使用检查（内存/CPU 占用）

## 11. 安全加固
- [ ] 11.1 确保 .env 文件不提交到版本控制
- [ ] 11.2 后端容器使用非 root 用户运行
- [ ] 11.3 前端容器使用非 root 用户运行
- [ ] 11.4 移除不必要的包和工具
- [ ] 11.5 扫描镜像漏洞 (docker scan)
- [ ] 11.6 配置只读根文件系统（可选）

## 12. 生产环境准备（可选）
- [ ] 12.1 创建生产环境 docker-compose.prod.yml
- [ ] 12.2 配置 PostgreSQL 容器（替代 SQLite）
- [ ] 12.3 配置容器资源限制 (memory, cpu)
- [ ] 12.4 配置容器重启策略 (restart: unless-stopped)
- [ ] 12.5 配置日志驱动和日志轮转
- [ ] 12.6 设置监控和告警（可选）

## 13. CI/CD 集成（未来迭代）
- [ ] 13.1 创建 GitHub Actions 工作流
- [ ] 13.2 配置自动构建镜像
- [ ] 13.3 推送镜像到容器仓库
- [ ] 13.4 自动化测试集成

## 验证检查清单

部署完成后，确认以下项目：

✅ **基础功能**
- [ ] 访问 http://localhost:3000 可以看到登录页面
- [ ] 可以成功登录
- [ ] 可以创建、查看、编辑、删除提示词
- [ ] 标签功能正常
- [ ] AI 优化功能正常
- [ ] 版本历史功能正常

✅ **数据持久化**
- [ ] 停止容器后重新启动，数据仍然存在
- [ ] 数据库文件在宿主机可见

✅ **性能和资源**
- [ ] 前端页面加载时间 < 3 秒
- [ ] API 响应时间 < 500ms
- [ ] 内存占用合理（总计 < 1GB）
- [ ] CPU 占用正常（空闲时 < 5%）

✅ **日志和监控**
- [ ] 容器日志正常，无严重错误
- [ ] 健康检查通过
- [ ] 可以通过 docker-compose logs 查看日志

✅ **文档完整性**
- [ ] README.md 包含 Docker 部署说明
- [ ] DEPLOYMENT.md 文档详细完整
- [ ] .env.example 包含所有必要变量
- [ ] 环境变量有清晰的注释

## 任务完成标准

- 所有上述任务标记为完成 ✅
- 通过验证检查清单的所有项目 ✅
- 文档完整且经过审阅 ✅
- 至少一次完整的端到端部署测试成功 ✅

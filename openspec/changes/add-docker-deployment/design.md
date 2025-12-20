# Docker 部署架构设计

## 架构概览

```
┌─────────────────────────────────────────────────────┐
│                    Docker Host                      │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  Frontend    │  │   Backend    │  │ Database │ │
│  │  (Nginx)     │  │  (FastAPI)   │  │ (SQLite) │ │
│  │              │  │              │  │          │ │
│  │  Port: 80    │  │  Port: 8000  │  │  Volume  │ │
│  └──────┬───────┘  └──────┬───────┘  └────┬─────┘ │
│         │                 │                │       │
│         └────────┬────────┴────────────────┘       │
│                  │                                  │
│            inkprompt-network                        │
└─────────────────────────────────────────────────────┘
         │
         └──> Host Port 3000 (Frontend)
```

## 核心决策

### 1. 多阶段构建策略

**前端 Dockerfile 设计**
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
# 安装依赖，构建生产资源

# Stage 2: Production
FROM nginx:alpine
# 仅复制构建产物 + nginx 配置
```

**理由**：
- 减少最终镜像大小（无需保留 node_modules 和构建工具）
- 提高安全性（生产镜像仅包含运行时所需文件）
- 加快部署速度（镜像更小，拉取更快）

**后端 Dockerfile 设计**
```dockerfile
FROM python:3.11-slim
# 使用 slim 变体减少基础镜像大小
# 创建虚拟环境隔离依赖
# 仅复制必要的应用代码
```

**理由**：
- Python 应用不需要多阶段构建（无编译步骤）
- 使用 slim 变体平衡大小和兼容性
- 虚拟环境保持与本地开发一致性

### 2. 网络架构

**服务间通信**：
- 使用自定义桥接网络 `inkprompt-network`
- 服务通过服务名称相互访问（如 `http://backend:8000`）
- 仅前端暴露到宿主机（端口 3000）

**理由**：
- 自定义网络提供自动 DNS 解析
- 后端无需直接暴露，增强安全性
- 前端作为唯一入口点，简化架构

### 3. 数据持久化

**SQLite 卷挂载**：
```yaml
volumes:
  - ./backend/inkprompt.db:/app/inkprompt.db
```

**理由**：
- 开发阶段使用 SQLite 简化部署
- 卷挂载确保数据在容器重启后保留
- 后续可切换到 PostgreSQL 容器（通过环境变量）

**未来扩展（PostgreSQL）**：
```yaml
services:
  db:
    image: postgres:15-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
```

### 4. 环境变量管理

**分层配置**：
1. `.env.example` - 配置模板（提交到版本控制）
2. `.env` - 实际配置（添加到 .gitignore）
3. `docker-compose.yml` - 通过 `env_file` 加载

**敏感信息处理**：
- `OPENAI_API_KEY` - 通过环境变量注入
- `SUPABASE_JWT_SECRET` - 通过环境变量注入
- 生产环境建议使用 Docker Secrets 或密钥管理服务

**理由**：
- 避免硬编码敏感信息
- 支持多环境配置（开发/测试/生产）
- 符合 12-Factor App 原则

### 5. Nginx 配置策略

**关键配置**：
```nginx
# SPA 路由支持
location / {
    try_files $uri $uri/ /index.html;
}

# API 代理
location /api {
    proxy_pass http://backend:8000;
}

# 静态资源缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**理由**：
- SPA 路由回退确保前端路由正常工作
- API 代理避免 CORS 问题
- 静态资源缓存提升性能

### 6. 健康检查

**后端健康检查**：
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

**理由**：
- 确保服务真正可用后再接收流量
- 自动重启不健康的容器
- 为负载均衡做准备

### 7. 开发与生产环境隔离

**docker-compose.yml** - 生产配置：
- 使用构建镜像
- 无卷挂载代码（代码打包进镜像）
- 优化的环境变量

**docker-compose.dev.yml**（可选）- 开发配置：
```yaml
services:
  backend:
    volumes:
      - ./backend:/app  # 代码热重载
    command: uvicorn app.main:app --reload --host 0.0.0.0
```

**理由**：
- 开发环境优先开发体验（热重载）
- 生产环境优先性能和稳定性
- 使用 `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up` 组合配置

## 技术权衡

### 选择 Nginx vs Node 服务器

**决策**：使用 Nginx 服务前端静态文件

**理由**：
- ✅ Nginx 性能更高（处理静态文件）
- ✅ 镜像更小（nginx:alpine ~40MB vs node:18-alpine ~170MB）
- ✅ 内置反向代理功能
- ❌ 需要额外配置文件

### SQLite vs PostgreSQL 容器

**决策**：初期使用 SQLite，预留 PostgreSQL 切换路径

**理由**：
- ✅ SQLite 部署更简单（无需额外容器）
- ✅ 降低资源消耗
- ✅ 适合小规模部署
- ❌ 并发写入性能有限
- 📋 通过环境变量 `DATABASE_URL` 可无缝切换

### 单个 docker-compose.yml vs 多文件

**决策**：主文件 + 可选开发覆盖文件

**理由**：
- ✅ 单一文件满足大多数用户需求
- ✅ 开发者可选择性使用开发配置
- ✅ 避免配置过于复杂

## 安全考虑

1. **非 root 用户运行**：
   ```dockerfile
   USER nobody
   ```

2. **最小化镜像**：
   - 使用 alpine 基础镜像
   - 仅安装必要依赖

3. **环境变量隔离**：
   - `.env` 不提交到版本控制
   - 使用 `.env.example` 作为模板

4. **网络隔离**：
   - 后端不直接暴露到外网
   - 仅通过前端代理访问

## 构建优化

1. **利用 Docker 缓存**：
   ```dockerfile
   # 先复制依赖文件
   COPY package*.json ./
   RUN npm ci
   # 再复制代码
   COPY . .
   ```

2. **.dockerignore**：
   - 排除 `node_modules`, `venv`, `.git`
   - 减少构建上下文大小

3. **并行构建**：
   - Docker Compose 自动并行构建各服务
   - 使用 BuildKit 加速构建

## 未来扩展路径

1. **容器编排**：
   - Kubernetes 部署（Helm Chart）
   - Docker Swarm（轻量级选择）

2. **CI/CD 集成**：
   - GitHub Actions 自动构建镜像
   - 推送到容器仓库（Docker Hub, GitHub Container Registry）

3. **监控和日志**：
   - 集成 Prometheus + Grafana
   - 集中式日志收集（ELK Stack）

4. **数据库升级**：
   - PostgreSQL 容器化
   - 数据库备份策略
   - 读写分离

5. **负载均衡**：
   - 前端多副本部署
   - Nginx 作为负载均衡器

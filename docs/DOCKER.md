# Docker 部署指南

本文档提供 Ink & Prompt 项目的 Docker 容器化部署完整指南。

## 目录

- [前置要求](#前置要求)
- [快速启动](#快速启动)
- [环境变量配置](#环境变量配置)
- [常见问题](#常见问题)
- [数据备份和恢复](#数据备份和恢复)
- [生产部署建议](#生产部署建议)

## 前置要求

在开始之前，请确保您的系统已安装以下软件：

### Docker 和 Docker Compose

#### macOS

```bash
# 安装 Docker Desktop for Mac
# 下载地址: https://www.docker.com/products/docker-desktop

# 验证安装
docker --version
docker-compose --version
```

#### Linux (Ubuntu/Debian)

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version

# 将当前用户添加到 docker 组（避免 sudo）
sudo usermod -aG docker $USER
newgrp docker
```

#### Windows

```bash
# 安装 Docker Desktop for Windows
# 下载地址: https://www.docker.com/products/docker-desktop

# 验证安装（在 PowerShell 或 CMD 中）
docker --version
docker-compose --version
```

## 快速启动

### 1. 克隆仓库

```bash
git clone https://github.com/your-username/inkPrompt.git
cd inkPrompt
```

### 2. 配置环境变量

```bash
# 复制环境变量模板到后端目录
cp .env.example backend/.env

# 编辑环境变量文件，填写必要的配置
nano backend/.env  # 或使用其他编辑器
```

**必须配置的变量：**
- `SUPABASE_URL` - Supabase 项目 URL
- `SUPABASE_JWT_SECRET` - Supabase JWT 密钥
- `OPENAI_API_KEY` - OpenRouter API 密钥

### 3. 启动服务

```bash
# 启动所有服务（后台运行）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 验证部署

打开浏览器访问：
- **前端应用**: http://localhost:3000
- **后端 API 文档**: http://localhost:3000/api/docs
- **健康检查**: http://localhost:3000/api/health

## 环境变量配置

### 数据库配置

```env
# SQLite 数据库（开发和小规模部署）
DATABASE_URL=sqlite:///./inkprompt.db
```

### Supabase 认证配置

从 [Supabase Dashboard](https://app.supabase.com) 获取：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret-here
```

**获取步骤：**
1. 登录 Supabase 控制台
2. 选择您的项目
3. 进入 Settings > API
4. 复制 "URL" 和 "JWT Secret"

### LLM API 配置

从 [OpenRouter](https://openrouter.ai) 获取 API Key：

```env
OPENAI_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_BASE=https://openrouter.ai/api/v1
DEFAULT_MODEL=openai/gpt-4
```

**支持的模型：**
- `openai/gpt-4` - GPT-4
- `openai/gpt-3.5-turbo` - GPT-3.5 Turbo
- `anthropic/claude-3-sonnet` - Claude 3 Sonnet
- 更多模型请参考 [OpenRouter 文档](https://openrouter.ai/docs)

### 应用设置

```env
APP_NAME=Ink & Prompt
APP_VERSION=0.1.0
DEBUG=false  # 生产环境设置为 false
CORS_ORIGINS=http://localhost:3000
```

## Docker Compose 命令

### 服务管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 停止并删除所有数据（谨慎使用！）
docker-compose down -v
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs

# 实时跟踪日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs backend
docker-compose logs frontend

# 查看最近 100 行日志
docker-compose logs --tail=100
```

### 重新构建镜像

```bash
# 重新构建所有镜像
docker-compose build

# 重新构建并启动
docker-compose up --build -d

# 仅构建特定服务
docker-compose build backend
```

### 进入容器

```bash
# 进入后端容器
docker-compose exec backend /bin/sh

# 进入前端容器
docker-compose exec frontend /bin/sh
```

## 常见问题

### 1. 端口冲突

**问题**：启动时提示端口 3000 已被占用

**解决方案**：
```bash
# 方案 1: 停止占用端口的进程
lsof -ti:3000 | xargs kill -9

# 方案 2: 修改 docker-compose.yml 中的端口映射
# 将 "3000:80" 改为 "8080:80"
```

### 2. 数据库迁移失败

**问题**：后端容器启动失败，日志显示数据库错误

**解决方案**：
```bash
# 删除旧的数据库文件
rm backend/inkprompt.db

# 重启服务
docker-compose restart backend
```

### 3. 前端无法连接后端

**问题**：前端显示网络错误或 API 调用失败

**解决方案**：
```bash
# 检查后端服务健康状态
docker-compose ps

# 检查后端日志
docker-compose logs backend

# 验证网络连接
docker-compose exec frontend ping backend
```

### 4. 镜像构建缓慢

**问题**：构建镜像耗时过长

**解决方案**：
```bash
# 启用 Docker BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# 使用构建缓存
docker-compose build

# 清理未使用的镜像和缓存
docker system prune -a
```

### 5. 容器内存不足

**问题**：容器因内存不足而崩溃

**解决方案**：

在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  backend:
    # ... 其他配置
    mem_limit: 512m
    memswap_limit: 1g
```

## 数据备份和恢复

### 备份数据库

```bash
# 创建备份目录
mkdir -p backups

# 备份 SQLite 数据库
cp backend/inkprompt.db backups/inkprompt_$(date +%Y%m%d_%H%M%S).db

# 或使用 docker cp
docker cp inkprompt-backend:/app/inkprompt.db backups/inkprompt_$(date +%Y%m%d_%H%M%S).db
```

### 恢复数据库

```bash
# 停止服务
docker-compose down

# 恢复数据库文件
cp backups/inkprompt_20231215_120000.db backend/inkprompt.db

# 重启服务
docker-compose up -d
```

### 自动备份脚本

创建 `scripts/backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/inkprompt_$TIMESTAMP.db"

mkdir -p $BACKUP_DIR
docker cp inkprompt-backend:/app/inkprompt.db $BACKUP_FILE

# 保留最近 7 天的备份
find $BACKUP_DIR -name "inkprompt_*.db" -mtime +7 -delete

echo "✅ Backup completed: $BACKUP_FILE"
```

## 生产部署建议

### 1. 使用环境特定配置

```bash
# 创建生产环境配置
cp docker-compose.yml docker-compose.prod.yml

# 编辑生产配置，设置资源限制和重启策略
```

### 2. 配置 HTTPS

使用 Nginx 或 Caddy 作为反向代理：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. 配置容器重启策略

```yaml
services:
  backend:
    restart: unless-stopped

  frontend:
    restart: unless-stopped
```

### 4. 配置日志管理

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 5. 资源限制

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 性能优化

### 1. 启用 Gzip 压缩

Nginx 配置已包含 Gzip 压缩，可在 `frontend/nginx.conf` 中调整：

```nginx
gzip_comp_level 6;  # 压缩级别 (1-9)
gzip_min_length 1000;  # 最小压缩文件大小
```

### 2. 配置静态资源缓存

已在 Nginx 配置中设置 1 年缓存，适合生产环境。

### 3. 使用 BuildKit 加速构建

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
docker-compose build
```

## 故障排查

### 检查容器健康状态

```bash
# 查看容器状态
docker-compose ps

# 查看详细健康检查信息
docker inspect inkprompt-backend | grep -A 10 Health
```

### 检查网络连接

```bash
# 查看网络配置
docker network ls
docker network inspect inkprompt_inkprompt-network

# 测试服务间连接
docker-compose exec frontend curl http://backend:8000/health
```

### 查看资源使用

```bash
# 查看容器资源使用情况
docker stats

# 查看磁盘使用
docker system df
```

## 开发环境支持

创建 `docker-compose.dev.yml`：

```yaml
version: '3.8'

services:
  backend:
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    environment:
      - DEBUG=true

  frontend:
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev
```

启动开发环境：

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## 获取帮助

如果遇到问题，请：

1. 查看日志：`docker-compose logs`
2. 检查健康状态：`docker-compose ps`
3. 参考 [Docker 官方文档](https://docs.docker.com/)
4. 提交 [GitHub Issue](https://github.com/your-username/inkPrompt/issues)

---

**祝您部署顺利！** 🚀

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

Docker 部署需要配置以下环境变量文件：

#### 2.1 配置前端环境变量

```bash
# 复制前端环境变量模板
cp frontend/.env.example frontend/.env

# 编辑前端环境变量
nano frontend/.env  # 或使用其他编辑器
```

填写以下变量：
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:8000
```

#### 2.2 配置后端环境变量

```bash
# 复制后端环境变量模板
cp .env.example backend/.env

# 编辑后端环境变量
nano backend/.env  # 或使用其他编辑器
```

**必须配置的变量：**
- **frontend/.env**（前端构建时使用）:
  - `VITE_SUPABASE_URL` - Supabase 项目 URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase Anon Key
  - `VITE_API_BASE_URL` - 后端 API 地址（默认 http://localhost:8000）

- **backend/.env**（后端运行时使用）:
  - `SUPABASE_URL` - Supabase 项目 URL
  - `SUPABASE_JWT_SECRET` - Supabase JWT Secret
  - `OPENAI_API_KEY` - OpenRouter API 密钥
  - `DATABASE_URL` - PostgreSQL 连接字符串（已预配置）

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
# Docker 部署使用 PostgreSQL（推荐用于生产环境）
DATABASE_URL=postgresql://inkprompt:inkprompt_password_change_in_production@localhost:5432/inkprompt

# 本地开发可使用 SQLite：sqlite:///./inkprompt.db
```

> **注意**：
> - Docker Compose 已包含 PostgreSQL 15 容器，数据持久化到命名卷 `postgres-data`
> - 使用 host 网络模式时，通过 `localhost:5432` 连接数据库
> - **生产环境请务必修改默认密码 `inkprompt_password_change_in_production`**

#### PostgreSQL 连接参数说明

- **主机**: `localhost` (host 网络模式)
- **端口**: `5432` (PostgreSQL 默认端口)
- **数据库名**: `inkprompt`
- **用户名**: `inkprompt`
- **密码**: `inkprompt_password_change_in_production` (⚠️ 生产环境必须修改)

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
docker-compose logs postgres
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
# 进入 PostgreSQL 容器
docker-compose exec postgres /bin/sh

# 进入后端容器
docker-compose exec backend /bin/sh

# 进入前端容器
docker-compose exec frontend /bin/sh
```

## PostgreSQL 数据库管理

### 连接数据库

```bash
# 通过 psql 连接数据库
docker exec -it inkprompt-postgres psql -U inkprompt -d inkprompt

# 或使用 docker-compose
docker-compose exec postgres psql -U inkprompt -d inkprompt
```

### 常用 PostgreSQL 命令

进入 psql 后可以使用以下命令：

```sql
-- 列出所有数据库
\l

-- 列出所有表
\dt

-- 查看表结构
\d table_name

-- 查询示例
SELECT * FROM prompts LIMIT 10;

-- 退出 psql
\q
```

### 数据库操作

```bash
# 查看数据库大小
docker exec inkprompt-postgres psql -U inkprompt -d inkprompt -c "SELECT pg_size_pretty(pg_database_size('inkprompt'));"

# 查看所有连接
docker exec inkprompt-postgres psql -U inkprompt -d inkprompt -c "SELECT * FROM pg_stat_activity;"

# 终止所有连接（谨慎使用）
docker exec inkprompt-postgres psql -U inkprompt -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'inkprompt' AND pid <> pg_backend_pid();"

# 重建数据库（会丢失所有数据！）
docker exec inkprompt-postgres psql -U inkprompt -d postgres -c "DROP DATABASE inkprompt;"
docker exec inkprompt-postgres psql -U inkprompt -d postgres -c "CREATE DATABASE inkprompt;"
```

### 修改数据库密码

```bash
# 进入 PostgreSQL
docker exec -it inkprompt-postgres psql -U inkprompt -d inkprompt

# 修改密码
ALTER USER inkprompt WITH PASSWORD 'your_new_password';
```

**重要**：修改密码后，需要同步更新 `backend/.env` 中的 `DATABASE_URL`：

```env
DATABASE_URL=postgresql://inkprompt:your_new_password@localhost:5432/inkprompt
```

## 常见问题

### 1. 端口冲突

**问题**：启动时提示端口 3000、8000 或 5432 已被占用

**解决方案**：
```bash
# 查看占用端口的进程
lsof -ti:3000   # 前端 Nginx
lsof -ti:8000   # 后端 API
lsof -ti:5432   # PostgreSQL

# 停止占用端口的进程
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
lsof -ti:5432 | xargs kill -9
```

> **注意**：本项目使用 `host` 网络模式，容器直接使用主机的网络栈。服务端口：
> - 前端：`3000` (Nginx) - 修改 `frontend/nginx.conf` 中的 `listen` 指令
> - 后端：`8000` (Uvicorn) - 修改 `backend/Dockerfile` 中的 `uvicorn` 启动命令
> - 数据库：`5432` (PostgreSQL) - 修改 `docker-compose.yml` 中的环境变量

### 2. 数据库连接失败

**问题**：后端容器启动失败，日志显示数据库连接错误

**可能原因**：
1. PostgreSQL 容器未完全启动
2. 数据库密码配置不匹配
3. 数据库不存在

**解决方案**：

```bash
# 1. 检查 PostgreSQL 容器状态
docker-compose ps postgres

# 2. 查看 PostgreSQL 日志
docker-compose logs postgres

# 3. 验证数据库连接
docker exec inkprompt-postgres psql -U inkprompt -d inkprompt -c "SELECT 1;"

# 4. 如果数据库不存在，重建数据库
docker-compose restart postgres
docker-compose restart backend

# 5. 如果问题持续，重置所有数据（谨慎！）
docker-compose down -v
docker-compose up -d
```

> **警告**：使用 `-v` 参数会删除所有数据卷中的数据，包括 PostgreSQL 中的所有表和记录。请确保已备份重要数据。

### 3. 前端无法连接后端

**问题**：前端显示网络错误或 API 调用失败

**解决方案**：
```bash
# 检查后端服务健康状态
docker-compose ps

# 检查后端日志
docker-compose logs backend

# 验证后端健康检查端点
curl http://localhost:8000/health

# 验证前端代理到后端的连接
curl http://localhost:3000/api/health
```

> **注意**：使用 `host` 网络模式时，服务通过 `localhost` 相互通信，而不是通过容器名称。

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

### 备份 PostgreSQL 数据库

```bash
# 创建备份目录
mkdir -p backups

# 备份 PostgreSQL 数据库
docker exec inkprompt-postgres pg_dump -U inkprompt inkprompt > backups/inkprompt_$(date +%Y%m%d_%H%M%S).sql

# 或者使用压缩格式（推荐）
docker exec inkprompt-postgres pg_dump -U inkprompt -Fc inkprompt > backups/inkprompt_$(date +%Y%m%d_%H%M%S).dump

# 验证备份文件
ls -lh backups/
```

> **注意**：
> - `.sql` 格式：文本格式，可读，适合查看和编辑
> - `.dump` 格式：二进制格式，压缩，恢复更快，推荐用于大数据库

### 恢复 PostgreSQL 数据库

#### 从 SQL 文件恢复

```bash
# 停止后端服务（避免连接冲突）
docker-compose stop backend

# 恢复数据库
docker exec -i inkprompt-postgres psql -U inkprompt -d inkprompt < backups/inkprompt_20231215_120000.sql

# 重启所有服务
docker-compose up -d
```

#### 从 dump 文件恢复

```bash
# 停止后端服务
docker-compose stop backend

# 恢复数据库（需要先删除现有数据库）
docker exec inkprompt-postgres dropdb -U inkprompt inkprompt
docker exec inkprompt-postgres createdb -U inkprompt inkprompt
docker exec -i inkprompt-postgres pg_restore -U inkprompt -d inkprompt < backups/inkprompt_20231215_120000.dump

# 重启所有服务
docker-compose up -d
```

### 自动备份脚本

创建 `scripts/backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/inkprompt_$TIMESTAMP.dump"

mkdir -p $BACKUP_DIR

# 备份 PostgreSQL 数据库（压缩格式）
docker exec inkprompt-postgres pg_dump -U inkprompt -Fc inkprompt > $BACKUP_FILE

# 保留最近 7 天的备份
find $BACKUP_DIR -name "inkprompt_*.dump" -mtime +7 -delete

echo "✅ Backup completed: $BACKUP_FILE"
```

**使用方法**：
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

**设置定时备份（可选）**：
```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 2 点自动备份
0 2 * * * /path/to/inkPrompt/scripts/backup.sh
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
# 使用 host 网络模式时，服务通过 localhost 通信
# 测试后端服务
curl http://localhost:8000/health

# 测试前端服务
curl http://localhost:3000

# 测试前端到后端的代理
curl http://localhost:3000/api/health

# 在容器内测试（如果需要）
docker-compose exec backend curl http://localhost:8000/health
```

> **注意**：本项目使用 `host` 网络模式，不创建独立的 Docker 网络。服务直接使用主机的网络栈进行通信。

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

# InkPrompt 部署指南

## 📋 概览

本文档提供 InkPrompt 的完整部署指南，包括环境配置、数据库迁移、依赖安装和生产环境部署建议。

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    Nginx (反向代理)                  │
└────────────┬────────────────────────────┬───────────┘
             │                            │
             ▼                            ▼
┌────────────────────┐         ┌──────────────────────┐
│  Frontend (React)  │         │  Backend (FastAPI)   │
│  Port: 5173 (dev)  │         │  Port: 8000          │
│  Port: 80 (prod)   │         │                      │
└────────────────────┘         └──────────┬───────────┘
                                          │
                                          ▼
                               ┌──────────────────────┐
                               │  PostgreSQL          │
                               │  Port: 5432          │
                               └──────────────────────┘
                                          │
                                          ▼
                               ┌──────────────────────┐
                               │  OpenAI API          │
                               │  (LangChain)         │
                               └──────────────────────┘
```

## 📦 系统要求

### 硬件要求

**最低配置**：
- CPU: 2 核
- RAM: 4 GB
- 存储: 20 GB

**推荐配置**：
- CPU: 4 核+
- RAM: 8 GB+
- 存储: 50 GB+ (SSD)

### 软件要求

**操作系统**：
- Ubuntu 20.04+ / Debian 10+
- CentOS 8+ / Rocky Linux 8+
- macOS 11+ (开发环境)

**必需软件**：
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Nginx 1.18+ (生产环境)

## 🔧 环境配置

### 1. 后端环境变量

创建 `backend/.env` 文件：

```bash
# 数据库配置
DATABASE_URL=postgresql://username:password@localhost:5432/inkprompt

# JWT 认证
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS 配置
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# LangChain / OpenAI 配置
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_API_BASE=https://api.openai.com/v1
DEFAULT_MODEL=gpt-3.5-turbo
DEFAULT_TEMPERATURE=0.7
MAX_TOKENS_PER_REQUEST=4000

# 应用配置
APP_NAME=InkPrompt
DEBUG=false
LOG_LEVEL=INFO

# 可选：Redis 缓存 (未来功能)
# REDIS_URL=redis://localhost:6379/0
```

### 2. 前端环境变量

创建 `frontend/.env` 文件：

```bash
# API 基础 URL
VITE_API_BASE_URL=http://localhost:8000/api

# 应用配置
VITE_APP_NAME=InkPrompt
VITE_APP_VERSION=1.0.0

# 开发工具
VITE_ENABLE_DEV_TOOLS=false
```

### 3. 生产环境变量

**后端** (`backend/.env.production`)：

```bash
# 数据库 (使用连接池)
DATABASE_URL=postgresql://inkprompt_user:strong_password@db.example.com:5432/inkprompt_prod?pool_size=10&max_overflow=20

# JWT (使用强密钥)
SECRET_KEY=complex-random-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS (生产域名)
CORS_ORIGINS=https://inkprompt.com,https://www.inkprompt.com

# OpenAI (生产密钥)
OPENAI_API_KEY=sk-prod-key-here
OPENAI_API_BASE=https://api.openai.com/v1
DEFAULT_MODEL=gpt-3.5-turbo
DEFAULT_TEMPERATURE=0.7
MAX_TOKENS_PER_REQUEST=4000

# 应用配置
APP_NAME=InkPrompt
DEBUG=false
LOG_LEVEL=WARNING

# 监控 (可选)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

**前端** (`frontend/.env.production`)：

```bash
VITE_API_BASE_URL=https://api.inkprompt.com/api
VITE_APP_NAME=InkPrompt
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEV_TOOLS=false
```

## 🗄️ 数据库设置

### 1. 安装 PostgreSQL

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS**:
```bash
brew install postgresql
brew services start postgresql
```

### 2. 创建数据库和用户

```bash
# 进入 PostgreSQL
sudo -u postgres psql

# 创建用户
CREATE USER inkprompt_user WITH PASSWORD 'your_password';

# 创建数据库
CREATE DATABASE inkprompt_dev OWNER inkprompt_user;
CREATE DATABASE inkprompt_prod OWNER inkprompt_user;

# 授予权限
GRANT ALL PRIVILEGES ON DATABASE inkprompt_dev TO inkprompt_user;
GRANT ALL PRIVILEGES ON DATABASE inkprompt_prod TO inkprompt_user;

# 退出
\q
```

### 3. 运行数据库迁移

```bash
cd backend

# 激活虚拟环境
source venv/bin/activate

# 运行迁移
alembic upgrade head
```

### 4. 验证数据库结构

```bash
# 连接数据库
psql -h localhost -U inkprompt_user -d inkprompt_dev

# 查看表
\dt

# 预期输出:
#  Schema |      Name       | Type  |     Owner
# --------+-----------------+-------+---------------
#  public | prompts         | table | inkprompt_user
#  public | prompt_versions | table | inkprompt_user
#  public | tags            | table | inkprompt_user
#  public | prompt_tags     | table | inkprompt_user
#  public | users           | table | inkprompt_user
#  public | model_calls     | table | inkprompt_user

# 退出
\q
```

## 📥 依赖安装

### 后端依赖

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/macOS
# 或
.\venv\Scripts\activate   # Windows

# 安装依赖
pip install -r requirements.txt

# 验证安装
python -c "import fastapi, sqlalchemy, langchain; print('Dependencies OK')"
```

**requirements.txt** 包含的关键依赖：
- `fastapi>=0.104.0` - Web 框架
- `uvicorn[standard]>=0.24.0` - ASGI 服务器
- `sqlalchemy>=2.0.0` - ORM
- `alembic>=1.12.0` - 数据库迁移
- `pydantic>=2.5.0` - 数据验证
- `python-jose[cryptography]>=3.3.0` - JWT
- `passlib[bcrypt]>=1.7.4` - 密码加密
- `langchain>=0.1.0` - LLM 框架
- `langchain-openai>=0.0.2` - OpenAI 集成
- `tiktoken>=0.5.0` - Token 计数
- `psycopg2-binary>=2.9.0` - PostgreSQL 驱动

### 前端依赖

```bash
cd frontend

# 安装依赖
npm install

# 验证安装
npm list react react-dom
```

**package.json** 包含的关键依赖：
- `react>=18.2.0` - UI 框架
- `react-dom>=18.2.0` - React DOM
- `react-router-dom>=6.20.0` - 路由
- `@tanstack/react-query>=5.0.0` - 数据获取
- `react-hot-toast>=2.4.0` - 通知
- `tailwindcss>=3.3.0` - CSS 框架

## 🚀 启动应用

### 开发环境

**后端**:
```bash
cd backend
source venv/bin/activate
python run.py

# 或使用 uvicorn 直接启动
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

访问:
- API: http://localhost:8000
- 文档: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

**前端**:
```bash
cd frontend
npm run dev
```

访问: http://localhost:5173

### 生产环境

#### 1. 后端部署 (使用 Gunicorn + Uvicorn)

创建 `backend/gunicorn_config.py`:

```python
import multiprocessing

# 服务器配置
bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"

# 日志
accesslog = "/var/log/inkprompt/access.log"
errorlog = "/var/log/inkprompt/error.log"
loglevel = "info"

# 进程管理
timeout = 120
keepalive = 5
graceful_timeout = 30

# 性能
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
```

启动命令:
```bash
cd backend
source venv/bin/activate
gunicorn app.main:app -c gunicorn_config.py
```

#### 2. 使用 Systemd 管理后端

创建 `/etc/systemd/system/inkprompt-backend.service`:

```ini
[Unit]
Description=InkPrompt Backend Service
After=network.target postgresql.service

[Service]
Type=notify
User=inkprompt
Group=inkprompt
WorkingDirectory=/opt/inkprompt/backend
Environment="PATH=/opt/inkprompt/backend/venv/bin"
Environment="PYTHONPATH=/opt/inkprompt/backend"
ExecStart=/opt/inkprompt/backend/venv/bin/gunicorn app.main:app -c gunicorn_config.py
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

启动服务:
```bash
sudo systemctl daemon-reload
sudo systemctl enable inkprompt-backend
sudo systemctl start inkprompt-backend
sudo systemctl status inkprompt-backend
```

#### 3. 前端构建和部署

```bash
cd frontend

# 生产构建
npm run build

# 输出在 dist/ 目录
```

#### 4. Nginx 配置

创建 `/etc/nginx/sites-available/inkprompt`:

```nginx
# 后端 API
upstream backend {
    server 127.0.0.1:8000;
}

# HTTP → HTTPS 重定向
server {
    listen 80;
    server_name inkprompt.com www.inkprompt.com;
    return 301 https://$server_name$request_uri;
}

# 主站点
server {
    listen 443 ssl http2;
    server_name inkprompt.com www.inkprompt.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/inkprompt.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/inkprompt.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 日志
    access_log /var/log/nginx/inkprompt-access.log;
    error_log /var/log/nginx/inkprompt-error.log;

    # 前端静态文件
    root /opt/inkprompt/frontend/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API 文档
    location /docs {
        proxy_pass http://backend/docs;
        proxy_set_header Host $host;
    }

    location /redoc {
        proxy_pass http://backend/redoc;
        proxy_set_header Host $host;
    }

    location /openapi.json {
        proxy_pass http://backend/openapi.json;
        proxy_set_header Host $host;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

启用配置:
```bash
sudo ln -s /etc/nginx/sites-available/inkprompt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 SSL 证书 (Let's Encrypt)

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d inkprompt.com -d www.inkprompt.com

# 自动续期
sudo certbot renew --dry-run
```

## 🐳 Docker 部署 (可选)

### Docker Compose 配置

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: inkprompt_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: inkprompt_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U inkprompt_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://inkprompt_user:${DB_PASSWORD}@db:5432/inkprompt_prod
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      SECRET_KEY: ${SECRET_KEY}
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - backend_logs:/var/log/inkprompt
    command: gunicorn app.main:app -c gunicorn_config.py

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  backend_logs:
```

### 后端 Dockerfile

`backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建日志目录
RUN mkdir -p /var/log/inkprompt

# 暴露端口
EXPOSE 8000

# 运行迁移并启动应用
CMD ["sh", "-c", "alembic upgrade head && gunicorn app.main:app -c gunicorn_config.py"]
```

### 前端 Dockerfile

`frontend/Dockerfile`:

```dockerfile
# 构建阶段
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 启动 Docker 环境

```bash
# 创建 .env 文件
cat > .env << EOF
DB_PASSWORD=strong_db_password
OPENAI_API_KEY=sk-your-key-here
SECRET_KEY=your-secret-key-here
EOF

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 🔍 健康检查

### 1. 后端健康检查端点

在 `backend/app/main.py` 添加:

```python
@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/health/db")
async def db_health_check(db: Session = Depends(get_db)):
    """数据库健康检查"""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")
```

### 2. 监控脚本

创建 `scripts/health_check.sh`:

```bash
#!/bin/bash

# 后端检查
backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$backend_status" -eq 200 ]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is down (HTTP $backend_status)"
    exit 1
fi

# 数据库检查
db_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health/db)
if [ "$db_status" -eq 200 ]; then
    echo "✅ Database is healthy"
else
    echo "❌ Database is down (HTTP $db_status)"
    exit 1
fi

# 前端检查
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
if [ "$frontend_status" -eq 200 ]; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is down (HTTP $frontend_status)"
    exit 1
fi

echo "🎉 All services are healthy"
```

## 📊 日志管理

### 1. 日志配置

创建 `backend/app/core/logging_config.py`:

```python
import logging
import sys
from pathlib import Path

def setup_logging():
    """配置应用日志"""
    log_level = os.getenv("LOG_LEVEL", "INFO")
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # 控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter(log_format))

    # 文件处理器
    log_dir = Path("/var/log/inkprompt")
    log_dir.mkdir(parents=True, exist_ok=True)

    file_handler = logging.FileHandler(log_dir / "app.log")
    file_handler.setFormatter(logging.Formatter(log_format))

    # 配置根日志器
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)

    return root_logger
```

### 2. 日志轮转

创建 `/etc/logrotate.d/inkprompt`:

```
/var/log/inkprompt/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 inkprompt inkprompt
    sharedscripts
    postrotate
        systemctl reload inkprompt-backend > /dev/null 2>&1 || true
    endscript
}
```

## 🔐 安全建议

### 1. 环境变量安全

- ✅ 使用强随机密钥（至少 32 字符）
- ✅ 定期轮换 API Keys
- ✅ 不要在代码中硬编码密钥
- ✅ 使用环境变量或密钥管理系统

### 2. 数据库安全

- ✅ 使用强密码
- ✅ 限制数据库访问（仅本地或特定 IP）
- ✅ 定期备份数据
- ✅ 启用 SSL 连接（生产环境）

### 3. API 安全

- ✅ 启用 CORS 限制
- ✅ 使用 HTTPS（生产环境）
- ✅ 实施速率限制
- ✅ 验证所有用户输入

### 4. 系统安全

- ✅ 定期更新系统和依赖
- ✅ 使用防火墙（UFW/iptables）
- ✅ 禁用 root SSH 登录
- ✅ 使用非 root 用户运行应用

## 📈 性能优化

### 1. 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_created_at ON prompts(created_at);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_model_calls_user_id ON model_calls(user_id);
CREATE INDEX idx_model_calls_created_at ON model_calls(created_at);

-- 分析表
ANALYZE prompts;
ANALYZE tags;
ANALYZE model_calls;
```

### 2. 应用缓存 (Redis)

```bash
# 安装 Redis
sudo apt install redis-server

# 启动 Redis
sudo systemctl start redis
sudo systemctl enable redis
```

在 `backend/requirements.txt` 添加:
```
redis>=5.0.0
```

### 3. 静态资源 CDN

将前端静态资源部署到 CDN (如 Cloudflare, AWS CloudFront):
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    # 指向 CDN
    return 301 https://cdn.inkprompt.com$request_uri;
}
```

## 🗄️ 备份策略

### 数据库备份脚本

创建 `scripts/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backup/inkprompt"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="inkprompt_prod"
DB_USER="inkprompt_user"

mkdir -p "$BACKUP_DIR"

# 备份数据库
pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$BACKUP_DIR/db_$TIMESTAMP.dump"

# 保留最近 30 天的备份
find "$BACKUP_DIR" -name "db_*.dump" -mtime +30 -delete

echo "Backup completed: db_$TIMESTAMP.dump"
```

### Cron 定时备份

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 2 点备份
0 2 * * * /opt/inkprompt/scripts/backup.sh >> /var/log/inkprompt/backup.log 2>&1
```

## 📞 故障排查

### 常见问题

#### 1. 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 检查连接
psql -h localhost -U inkprompt_user -d inkprompt_prod

# 查看日志
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

#### 2. 后端无法启动

```bash
# 检查服务状态
sudo systemctl status inkprompt-backend

# 查看日志
sudo journalctl -u inkprompt-backend -n 50 --no-pager

# 检查端口占用
sudo lsof -i :8000
```

#### 3. OpenAI API 错误

```bash
# 测试 API Key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# 检查配置
cd backend
source venv/bin/activate
python -c "from app.core.langchain_config import get_langchain_config; config = get_langchain_config(); print(config.validate_config())"
```

## 📚 相关文档

- [API 文档](./API.md)
- [LangChain 集成指南](./LANGCHAIN_INTEGRATION.md)
- [优化功能使用指南](./OPTIMIZATION_GUIDE.md)
- [实施总结](../IMPLEMENTATION_SUMMARY.md)

---

**文档版本**: v1.0
**更新日期**: 2025-12-09
**维护者**: InkPrompt 团队

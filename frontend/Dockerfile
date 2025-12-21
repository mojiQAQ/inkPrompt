# Stage 1: Build
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码（不包含 .env 文件）
COPY . .

# 构建生产资源（跳过类型检查以加快构建）
# 注意：环境变量将在运行时注入，构建时使用占位符
RUN npm run build:docker

# Stage 2: Production
FROM nginx:alpine

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从 builder 阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制运行时环境变量注入脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 暴露端口
EXPOSE 3000

# 使用自定义入口脚本
ENTRYPOINT ["/docker-entrypoint.sh"]

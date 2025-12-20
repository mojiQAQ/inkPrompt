#!/bin/bash

# Ink & Prompt 开发环境启动脚本

set -e

echo "🚀 Starting Ink & Prompt Development Environment..."

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查依赖
check_dependencies() {
    echo -e "${BLUE}📋 Checking dependencies...${NC}"

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}⚠️  Node.js not found. Please install Node.js >= 18${NC}"
        exit 1
    fi

    # 检查 Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${YELLOW}⚠️  Python3 not found. Please install Python >= 3.11${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Dependencies check passed${NC}"
}

# 初始化后端
init_backend() {
    echo -e "${BLUE}🔧 Initializing backend...${NC}"

    cd backend

    # 创建虚拟环境（如果不存在）
    if [ ! -d "venv" ]; then
        echo "Creating Python virtual environment..."
        python3 -m venv venv
    fi

    # 激活虚拟环境并安装依赖
    source venv/bin/activate

    if [ ! -f "venv/.initialized" ]; then
        echo "Installing Python dependencies..."
        pip install -r requirements.txt
        touch venv/.initialized
    fi

    # 初始化数据库
    if [ ! -f "ink_prompt.db" ]; then
        echo "Initializing database..."
        python scripts/init_db.py
    fi

    cd ..
    echo -e "${GREEN}✅ Backend initialized${NC}"
}

# 初始化前端
init_frontend() {
    echo -e "${BLUE}🔧 Initializing frontend...${NC}"

    cd frontend

    # 安装依赖（如果需要）
    if [ ! -d "node_modules" ]; then
        echo "Installing Node.js dependencies..."
        npm install
    fi

    # 检查 .env 文件
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  .env file not found. Please create it from .env.example${NC}"
        echo "Copying .env.example to .env..."
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please update .env with your Supabase credentials${NC}"
    fi

    cd ..
    echo -e "${GREEN}✅ Frontend initialized${NC}"
}

# 启动开发服务器
start_servers() {
    echo -e "${BLUE}🚀 Starting development servers...${NC}"

    # 后台启动后端服务
    echo "Starting backend server..."
    cd backend
    source venv/bin/activate
    python run.py > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    cd ..

    # 等待后端启动
    sleep 3

    # 后台启动前端服务
    echo "Starting frontend server..."
    cd frontend
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    cd ..

    # 等待前端启动
    sleep 3

    echo -e "${GREEN}✅ Development servers started${NC}"
    echo ""
    echo -e "${GREEN}🎉 Ink & Prompt is running!${NC}"
    echo ""
    echo -e "  Frontend: ${BLUE}http://localhost:3000${NC}"
    echo -e "  Backend:  ${BLUE}http://localhost:8000${NC}"
    echo -e "  API Docs: ${BLUE}http://localhost:8000/api/docs${NC}"
    echo ""
    echo -e "  Backend PID: ${BACKEND_PID}"
    echo -e "  Frontend PID: ${FRONTEND_PID}"
    echo ""
    echo "To stop the servers, run: ./stop-dev.sh"
    echo ""
    echo "Logs:"
    echo "  Backend:  tail -f backend.log"
    echo "  Frontend: tail -f frontend.log"
}

# 主函数
main() {
    check_dependencies
    init_backend
    init_frontend
    start_servers
}

main

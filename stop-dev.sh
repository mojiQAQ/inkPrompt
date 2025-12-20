#!/bin/bash

# Ink & Prompt 停止开发服务器脚本

echo "🛑 Stopping Ink & Prompt Development Environment..."

# 读取 PID 文件并停止进程
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "Stopping backend server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm backend.pid
    else
        echo "Backend server not running"
        rm backend.pid
    fi
else
    echo "Backend PID file not found"
fi

if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "Stopping frontend server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        rm frontend.pid
    else
        echo "Frontend server not running"
        rm frontend.pid
    fi
else
    echo "Frontend PID file not found"
fi

# 清理端口（以防万一）
echo "Cleaning up ports..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "✅ Development servers stopped"

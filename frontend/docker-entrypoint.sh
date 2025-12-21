#!/bin/sh
set -e

# 生成 env-config.js 文件，包含运行时环境变量
cat > /usr/share/nginx/html/env-config.js << EOF
window._env_ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}",
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}"
};
EOF

echo "Environment configuration generated:"
cat /usr/share/nginx/html/env-config.js

# 启动 Nginx
exec nginx -g "daemon off;"

/**
 * Supabase client configuration
 */
import { createClient } from '@supabase/supabase-js'

// 声明全局 window._env_ 类型
declare global {
  interface Window {
    _env_?: {
      VITE_SUPABASE_URL?: string
      VITE_SUPABASE_ANON_KEY?: string
      VITE_API_BASE_URL?: string
    }
  }
}

// 优先使用运行时环境变量（Docker），然后使用构建时环境变量（本地开发）
const supabaseUrl = window._env_?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = window._env_?.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

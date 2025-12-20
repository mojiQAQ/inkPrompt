/**
 * OAuth callback page that handles redirect after authentication
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Handle the OAuth callback
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Auth callback error:', error)
        navigate('/login', { state: { error: error.message } })
        return
      }

      if (session) {
        // Successfully authenticated, redirect to prompts page
        navigate('/prompts', { replace: true })
      } else {
        // No session, redirect to login
        navigate('/login', { replace: true })
      }
    })
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink-700 mx-auto"></div>
        <p className="mt-4 text-ink-600">正在完成登录...</p>
      </div>
    </div>
  )
}

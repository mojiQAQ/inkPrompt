/**
 * OAuth callback page that handles redirect after authentication
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    const searchParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const authError = searchParams.get('error_description')
      || searchParams.get('error')
      || hashParams.get('error_description')
      || hashParams.get('error')

    if (authError) {
      navigate('/login', { replace: true, state: { error: authError } })
      return
    }

    const finishAuth = async () => {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (cancelled) return

        if (error) {
          console.error('Auth callback error:', error)
          navigate('/login', { replace: true, state: { error: error.message } })
          return
        }

        if (session) {
          navigate('/prompts', { replace: true })
          return
        }

        await new Promise((resolve) => window.setTimeout(resolve, 250))
      }

      navigate('/login', {
        replace: true,
        state: { error: '登录回调未完成，请重试。' },
      })
    }

    finishAuth()

    return () => {
      cancelled = true
    }
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

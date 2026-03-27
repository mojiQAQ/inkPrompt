/**
 * OAuth callback page that handles redirect after authentication
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useI18n } from '@/hooks/useI18n'
import { supabase } from '@/lib/supabase'
import { consumePostAuthRedirect } from '@/utils/authRedirect'

export function AuthCallback() {
  const navigate = useNavigate()
  const { t } = useI18n()

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
          navigate(consumePostAuthRedirect('/prompts'), { replace: true })
          return
        }

        await new Promise((resolve) => window.setTimeout(resolve, 250))
      }

      navigate('/login', {
        replace: true,
        state: { error: t('auth.callbackIncomplete') },
      })
    }

    finishAuth()

    return () => {
      cancelled = true
    }
  }, [navigate, t])

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink-700 mx-auto"></div>
        <p className="mt-4 text-ink-600">{t('auth.callbackLoading')}</p>
      </div>
    </div>
  )
}

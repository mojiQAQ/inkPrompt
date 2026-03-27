import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import {
  buildRedirectTarget,
  clearPostAuthRedirect,
  persistPostAuthRedirect,
  readPostAuthRedirect,
} from '@/utils/authRedirect'

function ArrowRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5 13 4 4L19 7" />
    </svg>
  )
}

export function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    (location.state as { error?: string } | null)?.error ?? null,
  )
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const heroPills = t('landing.hero.pills', { returnObjects: true }) as string[]
  const heroStats = t('landing.hero.stats', { returnObjects: true }) as Array<{
    value: string
    label: string
  }>

  const fromState = (location.state as {
    from?: {
      pathname: string
      search?: string
      hash?: string
    }
  } | null)?.from
  const redirectTo = fromState
    ? buildRedirectTarget(fromState)
    : readPostAuthRedirect() || '/prompts'

  useEffect(() => {
    const nextError = (location.state as { error?: string } | null)?.error ?? null
    setError(nextError)
  }, [location.state])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      persistPostAuthRedirect(redirectTo)
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.error.loginFailed'))
      setLoading(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError(t('login.error.emailPasswordRequired'))
      return
    }

    if (password.length < 6) {
      setError(t('login.error.passwordMinLength'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password)
        setError(t('login.success.signup'))
        setIsSignUp(false)
      } else {
        await signInWithEmail(email, password)
        clearPostAuthRedirect()
        navigate(redirectTo, { replace: true })
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isSignUp
            ? t('login.error.signupFailed')
            : t('login.error.loginFailed'),
      )
      setLoading(false)
    }
  }

  return (
    <div className="auth-page relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="app-page-grid pointer-events-none fixed inset-0 opacity-60" />
      <div className="app-page-orb app-page-orb-primary pointer-events-none fixed left-[-8rem] top-[2rem] h-[24rem] w-[24rem] rounded-full blur-3xl" />
      <div className="app-page-orb app-page-orb-secondary pointer-events-none fixed right-[-6rem] top-[14rem] h-[22rem] w-[22rem] rounded-full blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/72 px-4 py-2 text-sm font-medium text-ink-700 shadow-[0_18px_34px_-28px_rgba(31,41,55,0.45)] backdrop-blur-xl transition-colors hover:text-ink-900"
          >
            <span>{t('login.backHome')}</span>
            <ArrowRightIcon />
          </button>
          <LanguageSwitcher variant="landing" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(430px,0.9fr)]">
          <section className="auth-showcase rounded-[36px] p-6 sm:p-8 lg:p-10">
            <div className="flex h-full flex-col justify-between gap-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/65 bg-white/70 px-4 py-2 text-sm text-ink-700 shadow-[0_18px_40px_-30px_rgba(31,41,55,0.42)] backdrop-blur-xl">
                  <img src="/logo.svg" alt="Ink & Prompt" className="h-5 w-5" />
                  <span>{t('landing.hero.kicker')}</span>
                </div>

                <div>
                  <h1 className="landing-display-title max-w-4xl text-5xl font-semibold leading-[1.04] text-ink-900 sm:text-6xl">
                    {t('landing.hero.title')}
                  </h1>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-600">
                    {t('landing.hero.subtitle')}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {heroPills.map((pill) => (
                    <div
                      key={pill}
                      className="landing-pill inline-flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium text-ink-700"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#ece7ff] text-[#4f46e5]">
                        <CheckIcon />
                      </span>
                      <span>{pill}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {heroStats.map((item) => (
                  <div key={item.label} className="landing-stat rounded-[24px] px-5 py-4">
                    <div className="text-2xl font-semibold text-ink-900">{item.value}</div>
                    <div className="mt-1 text-sm text-ink-600">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="auth-form-shell rounded-[36px] p-6 sm:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="landing-section-kicker">{isSignUp ? t('login.signUp') : t('login.signIn')}</p>
                <h2 className="mt-3 text-3xl font-semibold text-ink-900">
                  {isSignUp ? t('login.createAccount') : t('login.welcome')}
                </h2>
                <p className="mt-3 text-sm leading-7 text-ink-600">
                  {t('common.appFooterTagline')}
                </p>
              </div>
              <img src="/favicon.svg" alt="inkPrompt" className="h-14 w-14 rounded-[20px] bg-white/88 p-2 shadow-sm" />
            </div>

            {error ? (
              <div
                className={`mb-6 rounded-[24px] border px-4 py-4 text-sm ${
                  error === t('login.success.signup')
                    ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800'
                    : 'border-rose-200 bg-rose-50/80 text-rose-800'
                }`}
              >
                {error}
              </div>
            ) : null}

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-ink-700">
                  {t('login.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  className="input"
                  placeholder={t('login.emailPlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-ink-700">
                  {t('login.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  className="input"
                  placeholder={t('login.passwordPlaceholder')}
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="landing-hero-primary mt-2 inline-flex w-full items-center justify-center gap-3 rounded-full px-7 py-4 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading
                  ? t('login.processing')
                  : isSignUp
                    ? t('login.signUp')
                    : t('login.signIn')}
                <ArrowRightIcon />
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[rgba(122,102,82,0.16)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
                {t('login.divider')}
              </span>
              <div className="h-px flex-1 bg-[rgba(122,102,82,0.16)]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="auth-google-btn flex w-full items-center justify-center gap-3 rounded-full px-6 py-3.5 text-sm font-semibold text-ink-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t('login.google')}
            </button>

            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp((value) => !value)
                  setError(null)
                }}
                className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
                disabled={loading}
              >
                {isSignUp ? t('login.hasAccount') : t('login.noAccount')}
              </button>
              <div className="text-right text-xs leading-6 text-ink-500">
                {t('login.terms')}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

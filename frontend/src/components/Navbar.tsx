import { useNavigate } from 'react-router-dom'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'

export function Navbar() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { t } = useI18n()
  const avatarInitial = user?.email?.charAt(0).toUpperCase() || 'U'

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="app-navbar sticky top-0 z-30">
      <div className="app-navbar-shell mx-auto flex h-[4.5rem] w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/prompts')}
          className="flex min-w-0 items-center gap-3 text-left transition-opacity hover:opacity-85"
          title={t('nav.logoTitle')}
        >
          <img src="/favicon.svg" alt="Ink & Prompt" className="h-10 w-10 rounded-2xl bg-white/88 p-1.5 shadow-sm" />
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold tracking-tight text-ink-900">
              {t('common.appName')}
            </div>
          </div>
        </button>

        <nav className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={() => navigate('/prompts')}
            className="app-nav-link app-nav-link-active"
          >
            {t('nav.myPrompts')}
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="workspace" className="hidden sm:flex" />
          {user ? (
            <div className="group relative">
              <button
                type="button"
                className="nav-avatar-trigger"
                aria-label={user.email || t('promptList.myPrompts')}
                aria-haspopup="menu"
              >
                <span className="nav-avatar-circle">{avatarInitial}</span>
              </button>
              <div className="nav-dropdown-panel right-0 top-[calc(100%+0.6rem)] min-w-[15rem] opacity-0 pointer-events-none translate-y-1 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="nav-avatar-circle nav-avatar-circle-lg">{avatarInitial}</span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-ink-900">
                        {user.email}
                      </div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-ink-400">
                        {t('promptList.myPrompts')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[rgba(122,102,82,0.1)] py-2">
                  <button
                    type="button"
                    onClick={() => navigate('/prompts')}
                    className="nav-dropdown-item"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>{t('nav.myPrompts')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="nav-dropdown-item text-rose-600 hover:text-rose-700"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
                    </svg>
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

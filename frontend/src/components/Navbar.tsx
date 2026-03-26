/**
 * Navigation bar component
 */
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function Navbar() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleLogoClick = () => {
    navigate('/prompts')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-ink-200/70 bg-white/72 backdrop-blur-xl">
      <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              <img src="/favicon.svg" alt="inkPrompt" className="h-9 w-9" />
              <h1 className="text-base font-semibold tracking-tight text-ink-900">Ink & Prompt</h1>
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate('/prompts')}
              className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
            >
              我的提示词
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-ink-200/80 bg-white/72 px-2 py-1 text-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900">
                    <span className="text-xs font-semibold text-white">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="max-w-[220px] truncate text-ink-600">{user.email}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn btn-secondary"
                >
                  退出登录
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

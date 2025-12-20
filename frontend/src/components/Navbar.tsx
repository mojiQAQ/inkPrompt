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
    <header className="bg-white border-b border-ink-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-accent-purple to-accent-green rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-ink-900">Ink & Prompt</h1>
            </button>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate('/prompts')}
              className="text-ink-600 hover:text-ink-900 font-medium transition-colors"
            >
              我的提示词
            </button>
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-gradient-to-br from-accent-purple to-accent-green rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-ink-600">{user.email}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn btn-secondary text-sm"
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

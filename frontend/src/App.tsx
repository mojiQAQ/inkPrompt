import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Login } from '@/pages/Login'
import { AuthCallback } from '@/pages/AuthCallback'
import { PromptList } from '@/pages/PromptList'
import { PromptEditor } from '@/pages/PromptEditor'

// 路由层先完成 PromptDetail 入口收口，页面实现仍由 PromptEditor 承接。
const PromptDetail = PromptEditor

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#0a0a0a',
              border: '1px solid #e0e0e0',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected routes */}
          <Route
            path="/prompts"
            element={
              <ProtectedRoute>
                <PromptList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prompts/new"
            element={
              <ProtectedRoute>
                <PromptEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prompts/:id"
            element={
              <ProtectedRoute>
                <PromptDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prompts/:id/edit"
            element={
              <ProtectedRoute>
                <PromptDetail />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

/**
 * Simple optimize button component for prompt editor
 */
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { optimizePrompt, OptimizationScenario } from '@/api/optimization'

interface OptimizeButtonProps {
  promptId: string
  onOptimized: (optimizedContent: string) => void
}

export function OptimizeButton({ promptId, onOptimized }: OptimizeButtonProps) {
  const { getAccessToken } = useAuth()
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [showScenarios, setShowScenarios] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  const scenarios: { value: OptimizationScenario; label: string; icon: string }[] = [
    { value: 'general', label: '通用优化', icon: '✨' },
    { value: 'content_creation', label: '内容创作', icon: '✍️' },
    { value: 'code_generation', label: '代码生成', icon: '💻' },
    { value: 'data_analysis', label: '数据分析', icon: '📊' },
    { value: 'conversation', label: '对话交互', icon: '💬' },
  ]

  // Update position when dropdown should be shown
  useEffect(() => {
    if (showScenarios && buttonRef.current) {
      const updatePosition = () => {
        // Check if ref is still valid (component might have unmounted)
        if (!buttonRef.current) {
          console.log('[OptimizeButton] Button ref is null, skipping position update')
          return
        }

        const rect = buttonRef.current.getBoundingClientRect()

        // Check if rect is valid (not all zeros)
        const isValidRect = rect.width > 0 && rect.height > 0

        if (isValidRect) {
          const position = {
            top: rect.bottom + window.scrollY + 8,
            left: rect.right - 224 + window.scrollX,
          }
          console.log('[OptimizeButton] Calculated position:', position)
          console.log('[OptimizeButton] Button rect:', rect)
          setDropdownPosition(position)
        } else {
          // Fallback: use viewport-based positioning
          const fallbackPosition = {
            top: window.scrollY + 100,
            left: window.innerWidth - 256, // 224 (dropdown width) + 32 (margin)
          }
          console.log('[OptimizeButton] Using fallback position:', fallbackPosition)
          setDropdownPosition(fallbackPosition)
        }
      }

      // Use requestAnimationFrame to ensure DOM is ready
      const frameId = requestAnimationFrame(updatePosition)

      // Cleanup: cancel animation frame if component unmounts
      return () => {
        cancelAnimationFrame(frameId)
      }
    }
  }, [showScenarios])

  const handleButtonClick = () => {
    console.log('[OptimizeButton] Button clicked, showScenarios will become:', !showScenarios)
    setShowScenarios(!showScenarios)
  }

  const handleOptimize = async (scenario: OptimizationScenario) => {
    setShowScenarios(false)
    setIsOptimizing(true)

    try {
      const token = await getAccessToken()
      if (!token) {
        toast.error('请先登录')
        return
      }

      console.log('[OptimizeButton] Starting optimization with:', {
        promptId,
        scenario,
        hasToken: !!token,
      })

      const result = await optimizePrompt(token, promptId, { scenario })

      console.log('[OptimizeButton] Optimization result:', result)

      onOptimized(result.optimized_content)

      toast.success(
        <div>
          <div className="font-semibold">优化完成！</div>
          <div className="text-sm mt-1">
            Token: {result.token_count} | 成本: ${result.estimated_cost.toFixed(4)}
          </div>
        </div>,
        { duration: 4000 }
      )
    } catch (error) {
      console.error('[OptimizeButton] Optimization error:', error)

      // Get detailed error message
      let errorMessage = '优化失败，请稍后重试'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      // Show detailed error to user
      toast.error(
        <div>
          <div className="font-semibold">优化失败</div>
          <div className="text-sm mt-1">{errorMessage}</div>
        </div>,
        { duration: 5000 }
      )
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        disabled={isOptimizing}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-purple to-accent-purple/80 text-white rounded-lg hover:from-accent-purple/90 hover:to-accent-purple/70 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        title="提示词优化"
        data-testid="optimize-button"
      >
        {isOptimizing ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            优化中...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            提示词优化
          </>
        )}
      </button>

      {/* Scenario selection dropdown - rendered via Portal */}
      {showScenarios && !isOptimizing && createPortal(
        <>
          {/* Click outside to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowScenarios(false)}
            data-testid="optimize-dropdown-backdrop"
          />

          {/* Dropdown menu */}
          <div
            className="fixed w-56 bg-white border border-ink-200 rounded-lg shadow-xl z-50"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
            data-testid="optimize-dropdown-menu"
          >
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-ink-600 border-b border-ink-100">
                选择优化场景
              </div>
              <div className="mt-1">
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.value}
                    onClick={() => handleOptimize(scenario.value)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-accent-purple/5 rounded-md transition-colors"
                    data-testid={`optimize-scenario-${scenario.value}`}
                  >
                    <span className="text-lg">{scenario.icon}</span>
                    <span className="text-ink-700">{scenario.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}

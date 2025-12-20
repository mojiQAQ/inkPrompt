/**
 * Feature tour component for first-time users
 */
import { useState, useEffect } from 'react'

const TOUR_STORAGE_KEY = 'inkprompt_tour_completed'

interface TourStep {
  title: string
  description: string
  icon: JSX.Element
}

const tourSteps: TourStep[] = [
  {
    title: '创建和管理提示词',
    description: '点击"新建提示词"按钮创建你的第一个提示词模板，支持添加标签进行分类管理。',
    icon: (
      <svg className="w-12 h-12 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    title: '版本历史追踪',
    description: '每次修改提示词都会自动创建新版本，支持查看历史记录和回滚到任意版本。',
    icon: (
      <svg className="w-12 h-12 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: '高级搜索和筛选',
    description: '使用关键词搜索提示词内容，通过标签筛选，支持多种排序方式。搜索历史会自动保存。',
    icon: (
      <svg className="w-12 h-12 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: '快捷键支持',
    description: '使用 Ctrl+K (或 Cmd+K) 快速聚焦到搜索框，提升操作效率。',
    icon: (
      <svg className="w-12 h-12 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
]

export function FeatureTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if tour has been completed
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY)
    if (!tourCompleted) {
      // Show tour after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    setIsOpen(false)
  }

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    setIsOpen(false)
  }

  if (!isOpen) return null

  const step = tourSteps[currentStep]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent-purple to-accent-purple/80 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">欢迎使用 InkPrompt 🎉</h2>
            <button
              onClick={handleSkip}
              className="text-white/80 hover:text-white transition-colors"
              title="跳过引导"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-white/90 mt-1">让我们快速了解主要功能</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {step.icon}
          </div>

          {/* Step info */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-ink-900 mb-3">{step.title}</h3>
            <p className="text-ink-600 text-lg leading-relaxed">{step.description}</p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-accent-purple'
                    : 'w-2 bg-ink-200 hover:bg-ink-300'
                }`}
                aria-label={`跳转到步骤 ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-4 py-2 text-ink-600 hover:text-ink-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
            >
              上一步
            </button>

            <span className="text-sm text-ink-500">
              {currentStep + 1} / {tourSteps.length}
            </span>

            <button
              onClick={handleNext}
              className="px-6 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/90 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              {currentStep === tourSteps.length - 1 ? '开始使用' : '下一步'}
            </button>
          </div>
        </div>

        {/* Footer tip */}
        <div className="bg-ink-50 px-6 py-3 border-t border-ink-100">
          <p className="text-xs text-ink-500 text-center">
            💡 提示：你可以随时在设置中重新查看此引导
          </p>
        </div>
      </div>
    </div>
  )
}

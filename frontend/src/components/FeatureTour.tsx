/**
 * Feature tour component for first-time users
 */
import { useState, useEffect } from 'react'

import { useI18n } from '@/hooks/useI18n'

const TOUR_STORAGE_KEY = 'inkprompt_tour_completed'

interface TourStep {
  title: string
  description: string
  icon: JSX.Element
}

export function FeatureTour() {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const tourSteps: TourStep[] = [
    {
      title: t('featureTour.steps.create.title'),
      description: t('featureTour.steps.create.description'),
      icon: (
        <svg className="w-12 h-12 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      title: t('featureTour.steps.history.title'),
      description: t('featureTour.steps.history.description'),
      icon: (
        <svg className="w-12 h-12 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: t('featureTour.steps.search.title'),
      description: t('featureTour.steps.search.description'),
      icon: (
        <svg className="w-12 h-12 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      title: t('featureTour.steps.shortcuts.title'),
      description: t('featureTour.steps.shortcuts.description'),
      icon: (
        <svg className="w-12 h-12 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ]

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
            <h2 className="text-xl font-bold">{t('featureTour.title')}</h2>
            <button
              onClick={handleSkip}
              className="text-white/80 hover:text-white transition-colors"
              title={t('featureTour.skip')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-white/90 mt-1">{t('featureTour.subtitle')}</p>
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
                aria-label={t('featureTour.jumpToStep', { step: index + 1 })}
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
              {t('featureTour.previous')}
            </button>

            <span className="text-sm text-ink-500">
              {currentStep + 1} / {tourSteps.length}
            </span>

            <button
              onClick={handleNext}
              className="px-6 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/90 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              {currentStep === tourSteps.length - 1 ? t('featureTour.start') : t('featureTour.next')}
            </button>
          </div>
        </div>

        {/* Footer tip */}
        <div className="bg-ink-50 px-6 py-3 border-t border-ink-100">
          <p className="text-xs text-ink-500 text-center">
            {t('featureTour.footer')}
          </p>
        </div>
      </div>
    </div>
  )
}

import { useId } from 'react'

import { useI18n } from '@/hooks/useI18n'

interface LanguageSwitcherProps {
  className?: string
  variant?: 'default' | 'landing' | 'workspace'
}

export function LanguageSwitcher({
  className = '',
  variant = 'default',
}: LanguageSwitcherProps) {
  const selectId = useId()
  const { currentLanguage, languages, setLanguage, t } = useI18n()
  const compactLabel = currentLanguage.code === 'zh-CN' ? 'CN' : 'EN'

  const labelClassName =
    variant === 'landing'
      ? 'hidden text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-500 sm:block'
      : variant === 'workspace'
        ? 'hidden text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-500 sm:block'
      : 'hidden text-sm font-medium text-ink-600 sm:block'

  const selectClassName =
    variant === 'landing'
      ? 'rounded-full border border-white/70 bg-white/76 px-4 py-2 text-sm text-ink-700 shadow-[0_14px_30px_-24px_rgba(31,41,55,0.38)] backdrop-blur-md transition-colors hover:border-[rgba(91,91,214,0.35)] focus:border-[rgba(91,91,214,0.5)] focus:outline-none focus:ring-2 focus:ring-[rgba(91,91,214,0.12)]'
      : variant === 'workspace'
        ? 'rounded-full border border-[rgba(122,102,82,0.14)] bg-white/78 px-4 py-2 text-sm text-ink-700 shadow-[0_16px_32px_-28px_rgba(31,41,55,0.4)] backdrop-blur-md transition-colors hover:border-[rgba(91,91,214,0.24)] focus:border-[rgba(91,91,214,0.4)] focus:outline-none focus:ring-2 focus:ring-[rgba(91,91,214,0.1)]'
      : 'rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-700 shadow-sm transition-colors hover:border-ink-400 focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/20'

  if (variant === 'workspace') {
    return (
      <div className={`relative ${className}`.trim()}>
        <div className="group relative">
          <button
            type="button"
            className="nav-compact-trigger"
            aria-label={t('common.language.label')}
            aria-haspopup="menu"
          >
            <span className="nav-compact-code">{compactLabel}</span>
            <svg className="h-4 w-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className="nav-dropdown-panel right-0 top-[calc(100%+0.6rem)] min-w-[10rem] opacity-0 pointer-events-none translate-y-1 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-400">
              {t('common.language.label')}
            </div>
            <div className="border-t border-[rgba(122,102,82,0.1)] py-2">
              {languages.map((language) => {
                const code = language.code === 'zh-CN' ? 'CN' : 'EN'
                const isActive = language.code === currentLanguage.code

                return (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => {
                      void setLanguage(language.code)
                    }}
                    className={`nav-dropdown-item ${isActive ? 'nav-dropdown-item-active' : ''}`}
                  >
                    <span className="inline-flex min-w-[2.25rem] items-center justify-center rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold tracking-[0.12em] text-ink-500">
                      {code}
                    </span>
                    <span>{language.nativeLabel}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <label
        htmlFor={selectId}
        className={labelClassName}
      >
        {t('common.language.label')}
      </label>
      <select
        id={selectId}
        value={currentLanguage.code}
        onChange={(event) => {
          void setLanguage(event.target.value as (typeof languages)[number]['code'])
        }}
        className={selectClassName}
        aria-label={t('common.language.label')}
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.nativeLabel}
          </option>
        ))}
      </select>
    </div>
  )
}

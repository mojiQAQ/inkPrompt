import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import enUS from './locales/en-US.json'
import zhCN from './locales/zh-CN.json'
import {
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from './types'

export const DEFAULT_LANGUAGE: LanguageCode = 'zh-CN'

const resources = {
  'zh-CN': {
    translation: zhCN,
  },
  'en-US': {
    translation: enUS,
  },
} as const

function isSupportedLanguage(value: string): value is LanguageCode {
  return SUPPORTED_LANGUAGES.includes(value as LanguageCode)
}

export function normalizeLanguage(value?: string | null): LanguageCode {
  if (!value) return DEFAULT_LANGUAGE

  if (isSupportedLanguage(value)) {
    return value
  }

  if (value.startsWith('zh')) {
    return 'zh-CN'
  }

  if (value.startsWith('en')) {
    return 'en-US'
  }

  return DEFAULT_LANGUAGE
}

function syncDocumentLanguage(language: LanguageCode) {
  if (typeof document === 'undefined') return

  document.documentElement.lang = language
}

function getStoredLanguage() {
  if (typeof window === 'undefined') return null
  if (!window.localStorage || typeof window.localStorage.getItem !== 'function') {
    return null
  }

  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    lng:
      typeof window !== 'undefined'
        ? normalizeLanguage(getStoredLanguage())
        : DEFAULT_LANGUAGE,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

i18n.on('languageChanged', (language) => {
  syncDocumentLanguage(normalizeLanguage(language))
})

syncDocumentLanguage(normalizeLanguage(i18n.resolvedLanguage || i18n.language))

export async function changeAppLanguage(language: LanguageCode) {
  if (
    typeof window !== 'undefined' &&
    window.localStorage &&
    typeof window.localStorage.setItem === 'function'
  ) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }

  await i18n.changeLanguage(language)
}

export default i18n

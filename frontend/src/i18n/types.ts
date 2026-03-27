export const LANGUAGE_STORAGE_KEY = 'userLanguage'

export const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US'] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]

export interface LanguageOption {
  code: LanguageCode
  label: string
  nativeLabel: string
}

export const LANGUAGES: LanguageOption[] = [
  {
    code: 'zh-CN',
    label: '简体中文',
    nativeLabel: '简体中文',
  },
  {
    code: 'en-US',
    label: 'English',
    nativeLabel: 'English',
  },
]

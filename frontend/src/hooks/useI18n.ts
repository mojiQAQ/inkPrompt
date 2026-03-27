import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { changeAppLanguage, normalizeLanguage } from '@/i18n'
import { LANGUAGES, type LanguageCode } from '@/i18n/types'

export function useI18n() {
  const { t, i18n } = useTranslation()

  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language)

  const currentLanguage = useMemo(
    () => LANGUAGES.find((item) => item.code === language) ?? LANGUAGES[0],
    [language],
  )

  const setLanguage = async (nextLanguage: LanguageCode) => {
    await changeAppLanguage(nextLanguage)
  }

  const formatDate = (
    value: string,
    options?: Intl.DateTimeFormatOptions,
  ) => new Intl.DateTimeFormat(language, options).format(new Date(value))

  const formatDateTime = (
    value: string,
    options?: Intl.DateTimeFormatOptions,
  ) => new Intl.DateTimeFormat(language, options).format(new Date(value))

  return {
    t,
    i18n,
    language,
    currentLanguage,
    languages: LANGUAGES,
    setLanguage,
    formatDate,
    formatDateTime,
  }
}

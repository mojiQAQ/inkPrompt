import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import {
  copySquareEntry,
  fetchSquareEntry,
  toggleSquareFavorite,
  toggleSquareLike,
} from '@/api/square'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Loading } from '@/components/Loading'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import type { SquareEntry } from '@/types/square'
import {
  clearPostAuthAction,
  persistPostAuthAction,
  persistPostAuthRedirect,
  readPostAuthAction,
} from '@/utils/authRedirect'

function DetailStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-[rgba(122,102,82,0.1)] bg-white/86 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-ink-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-ink-900">{value}</div>
    </div>
  )
}

export function PromptSquareDetail() {
  const { entryId } = useParams<{ entryId: string }>()
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()
  const { t, formatDate, formatDateTime } = useI18n()

  const [entry, setEntry] = useState<SquareEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copyConfirm, setCopyConfirm] = useState<{ entryId: string; openTest: boolean } | null>(null)
  const [copying, setCopying] = useState(false)

  const getCategoryLabel = useCallback(
    (categoryKey: string) => t(`square.category.${categoryKey}`),
    [t],
  )

  const requireLogin = (pendingAction?: { type: 'square-copy' | 'square-test'; entryId: string }) => {
    persistPostAuthRedirect(window.location.pathname + window.location.search)
    if (pendingAction) {
      persistPostAuthAction(pendingAction)
    }
    navigate('/login')
  }

  const loadDetail = useCallback(async () => {
    if (!entryId) return
    setLoading(true)
    setError(null)

    try {
      const token = await getAccessToken()
      const data = await fetchSquareEntry(entryId, token)
      setEntry(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('square.messages.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [entryId, getAccessToken, t])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  const withAuthAction = async <T,>(runner: (token: string) => Promise<T>) => {
    const token = await getAccessToken()
    if (!token) {
      requireLogin()
      return null
    }
    return runner(token)
  }

  const handleCopySuccess = useCallback(
    (openTest: boolean, result: Awaited<ReturnType<typeof copySquareEntry>>) => {
      setEntry((current) => (current ? { ...current, copies: result.copies } : current))

      if (openTest) {
        toast.success(
          result.created_new ? t('square.messages.testReady') : t('square.messages.testOpenedExisting'),
        )
        navigate(`/prompts/${result.prompt_id}?panel=test`)
        return
      }

      toast.success(result.created_new ? t('square.messages.copied') : t('square.messages.alreadySaved'))
      navigate(`/prompts/${result.prompt_id}`)
    },
    [navigate, t],
  )

  const executeCopy = useCallback(
    async (entryId: string, openTest: boolean, tokenOverride?: string) => {
      const token = tokenOverride ?? await getAccessToken()
      if (!token) {
        requireLogin({
          type: openTest ? 'square-test' : 'square-copy',
          entryId,
        })
        return
      }

      setCopying(true)
      try {
        const result = await copySquareEntry(token, entryId)
        clearPostAuthAction()
        handleCopySuccess(openTest, result)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('square.messages.copyFailed'))
      } finally {
        setCopying(false)
      }
    },
    [getAccessToken, handleCopySuccess, t],
  )

  useEffect(() => {
    let cancelled = false

    const resumePostAuthAction = async () => {
      const action = readPostAuthAction()
      if (!action || !entryId) return
      if (action.entryId !== entryId) return

      const token = await getAccessToken()
      if (!token || cancelled) return

      await executeCopy(entryId, action.type === 'square-test', token)
    }

    void resumePostAuthAction()

    return () => {
      cancelled = true
    }
  }, [entryId, executeCopy, getAccessToken])

  const handleLike = async () => {
    if (!entry) return
    const result = await withAuthAction((token) => toggleSquareLike(token, entry.id))
    if (!result) return
    setEntry({
      ...entry,
      is_liked: result.is_liked ?? entry.is_liked,
      likes: result.likes ?? entry.likes,
    })
  }

  const handleFavorite = async () => {
    if (!entry) return
    const result = await withAuthAction((token) => toggleSquareFavorite(token, entry.id))
    if (!result) return
    setEntry({
      ...entry,
      is_favorited: result.is_favorited ?? entry.is_favorited,
      favorites: result.favorites ?? entry.favorites,
    })
  }

  const requestCopy = async (openTest = false) => {
    if (!entry) return

    const token = await getAccessToken()
    if (!token) {
      requireLogin({
        type: openTest ? 'square-test' : 'square-copy',
        entryId: entry.id,
      })
      return
    }

    setCopyConfirm({ entryId: entry.id, openTest })
  }

  const handleQuickCopy = async () => {
    if (!entry) return

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable')
      }

      await navigator.clipboard.writeText(entry.content || entry.preview_text)
      toast.success(t('square.messages.quickCopied'))
    } catch {
      toast.error(t('square.messages.quickCopyFailed'))
    }
  }

  if (loading) {
    return (
      <div className="app-page min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-4xl py-20">
          <Loading text={t('common.action.loading')} />
        </div>
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="app-page min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-4xl py-10">
          <ErrorMessage message={error ?? t('square.messages.loadFailed')} onRetry={() => void loadDetail()} />
        </div>
      </div>
    )
  }

  return (
    <div className="app-page min-h-screen">
      <div className="app-page-grid pointer-events-none fixed inset-0 opacity-60" />
      <div className="app-page-orb app-page-orb-primary pointer-events-none fixed left-[-8rem] top-[4rem] h-[24rem] w-[24rem] rounded-full blur-3xl" />
      <div className="app-page-orb app-page-orb-secondary pointer-events-none fixed right-[-7rem] top-[15rem] h-[22rem] w-[22rem] rounded-full blur-3xl" />

      <Navbar />

      <main className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-[rgba(122,102,82,0.12)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,244,238,0.92))] p-6 shadow-[0_30px_80px_-50px_rgba(17,24,39,0.45)]">
          <button
            type="button"
            onClick={() => navigate('/square')}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19 8 12l7-7" />
            </svg>
            {t('square.actions.backToSquare')}
          </button>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-ink-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                  {getCategoryLabel(entry.category)}
                </span>
                <span className="text-xs uppercase tracking-[0.18em] text-ink-400">
                  {t(`square.difficulty.${entry.difficulty}`)}
                </span>
                <span className="rounded-full border border-[rgba(122,102,82,0.12)] bg-white/72 px-3 py-1 text-xs text-ink-500">
                  {t('square.publishedAt', {
                    date: formatDate(entry.published_at, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }),
                  })}
                </span>
              </div>

              <div>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
                  {entry.title}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-ink-600">
                  {entry.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tagItem) => (
                  <button
                    key={tagItem.id}
                    type="button"
                    onClick={() => navigate(`/square?tag=${encodeURIComponent(tagItem.name)}`)}
                    className="badge badge-user"
                  >
                    {tagItem.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <DetailStat label={t('square.stats.views')} value={entry.views} />
                <DetailStat label={t('square.stats.likes')} value={entry.likes} />
                <DetailStat label={t('square.stats.favorites')} value={entry.favorites} />
                <DetailStat label={t('square.stats.copies')} value={entry.copies} />
              </div>
            </div>

            <aside className="workspace-paper flex flex-col gap-5">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-ink-400">{t('square.author')}</div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-white">
                    {entry.author.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-ink-900">{entry.author.name}</div>
                    <div className="text-sm text-ink-500">
                      {t('square.updatedAt', { date: formatDateTime(entry.updated_at) })}
                    </div>
                  </div>
                </div>
              </div>

              {entry.recommended_models.length > 0 ? (
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-ink-400">{t('square.recommendedModels')}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.recommended_models.map((model) => (
                      <span
                        key={model}
                        className="rounded-full border border-[rgba(79,70,229,0.14)] bg-[rgba(79,70,229,0.06)] px-3 py-1 text-xs font-medium text-[#4f46e5]"
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                <button type="button" onClick={() => void requestCopy(false)} className="btn btn-primary w-full" disabled={copying}>
                  {t('square.actions.copy')}
                </button>
                <button type="button" onClick={() => void requestCopy(true)} className="btn btn-secondary w-full" disabled={copying}>
                  {t('square.actions.testNow')}
                </button>
                <div className="flex items-center gap-2 rounded-full border border-[rgba(122,102,82,0.12)] bg-white/84 p-2 shadow-[0_16px_28px_-28px_rgba(31,41,55,0.5)]">
                  <button
                    type="button"
                    onClick={() => void handleQuickCopy()}
                    className="prompt-card-icon"
                    title={t('square.actions.quickCopy')}
                    aria-label={t('square.actions.quickCopy')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-2m-4 4H6a2 2 0 01-2-2V9a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleLike()}
                    className={`inline-flex min-w-0 items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${
                      entry.is_liked ? 'bg-rose-50 text-rose-600' : 'text-ink-600 hover:bg-ink-50'
                    }`}
                    title={entry.is_liked ? t('square.actions.liked') : t('square.actions.like')}
                  >
                    <svg className="h-4 w-4" fill={entry.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21s-6.716-4.32-9.193-8.008C1.236 10.72 2.01 7.5 5.296 6.32 7.404 5.562 9.6 6.3 11 8c1.4-1.7 3.596-2.438 5.704-1.68 3.286 1.18 4.06 4.4 2.49 6.672C18.716 16.68 12 21 12 21Z" />
                    </svg>
                    <span className="font-medium">{entry.likes}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleFavorite()}
                    className={`inline-flex min-w-0 items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${
                      entry.is_favorited ? 'bg-amber-50 text-amber-600' : 'text-ink-600 hover:bg-ink-50'
                    }`}
                    title={entry.is_favorited ? t('square.actions.favorited') : t('square.actions.favorite')}
                  >
                    <svg className="h-4 w-4" fill={entry.is_favorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6.75 4.75h10.5A1.75 1.75 0 0 1 19 6.5v14l-7-3-7 3v-14a1.75 1.75 0 0 1 1.75-1.75Z" />
                    </svg>
                    <span className="font-medium">{entry.favorites}</span>
                  </button>
                </div>
              </div>

              {!user ? (
                <div className="rounded-[22px] border border-dashed border-[rgba(122,102,82,0.2)] bg-white/66 px-4 py-4 text-sm leading-7 text-ink-600">
                  {t('square.messages.loginHint')}
                </div>
              ) : null}
            </aside>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
          <article className="workspace-paper">
            <div className="text-xs uppercase tracking-[0.18em] text-ink-400">{t('square.preview')}</div>
            <div className="mt-4 rounded-[26px] border border-[rgba(122,102,82,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,244,236,0.92))] p-5">
              <pre className="whitespace-pre-wrap break-words text-sm leading-8 text-ink-800">
                {entry.content || entry.preview_text}
              </pre>
            </div>
            {!entry.content ? (
              <p className="mt-4 text-sm leading-7 text-ink-500">
                {t('square.messages.partialPreview')}
              </p>
            ) : null}
          </article>

          <aside className="workspace-paper space-y-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-ink-400">{t('square.howToUse')}</div>
              <div className="mt-4 space-y-4 text-sm leading-7 text-ink-700">
                <p>{t('square.howToUseBody')}</p>
                <ul className="space-y-2 text-ink-600">
                  <li>1. {t('square.steps.copy')}</li>
                  <li>2. {t('square.steps.test')}</li>
                  <li>3. {t('square.steps.iterate')}</li>
                </ul>
              </div>
            </div>
            <div className="rounded-[24px] border border-[rgba(122,102,82,0.1)] bg-white/80 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-ink-400">{t('square.detailNoteTitle')}</div>
              <p className="mt-3 text-sm leading-7 text-ink-600">{t('square.detailNoteBody')}</p>
            </div>
          </aside>
        </section>

        <ConfirmDialog
          isOpen={!!copyConfirm}
          title={t(copyConfirm?.openTest ? 'square.confirm.testTitle' : 'square.confirm.copyTitle')}
          message={t(copyConfirm?.openTest ? 'square.confirm.testMessage' : 'square.confirm.copyMessage')}
          confirmLabel={t(copyConfirm?.openTest ? 'square.actions.testNow' : 'square.actions.copy')}
          cancelLabel={t('common.action.cancel')}
          onCancel={() => setCopyConfirm(null)}
          onConfirm={() => {
            if (!copyConfirm) return
            const nextAction = copyConfirm
            setCopyConfirm(null)
            void executeCopy(nextAction.entryId, nextAction.openTest)
          }}
        />
      </main>
    </div>
  )
}

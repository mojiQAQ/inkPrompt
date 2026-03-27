import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import {
  copySquareEntry,
  fetchSquareCategories,
  fetchSquareEntries,
  fetchSquarePopularTags,
  toggleSquareFavorite,
  toggleSquareLike,
} from '@/api/square'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { Loading } from '@/components/Loading'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import type {
  SquareCategory,
  SquareDifficulty,
  SquareEntry,
  SquareSortBy,
  SquareTagSummary,
} from '@/types/square'
import {
  clearPostAuthAction,
  persistPostAuthAction,
  persistPostAuthRedirect,
  readPostAuthAction,
} from '@/utils/authRedirect'

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(122,102,82,0.12)] bg-white/74 px-3 py-1 text-xs text-ink-600">
      <span className="font-semibold text-ink-900">{value}</span>
      <span>{label}</span>
    </span>
  )
}

export function PromptSquare() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { getAccessToken } = useAuth()
  const { t, formatDate } = useI18n()

  const [entries, setEntries] = useState<SquareEntry[]>([])
  const [categories, setCategories] = useState<SquareCategory[]>([])
  const [popularTags, setPopularTags] = useState<SquareTagSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState<SquareDifficulty | ''>('')
  const [activeTag, setActiveTag] = useState(searchParams.get('tag') ?? '')
  const [sortBy, setSortBy] = useState<SquareSortBy>('hot')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [copyConfirm, setCopyConfirm] = useState<{ entryId: string; openTest: boolean } | null>(null)
  const [copyingEntryId, setCopyingEntryId] = useState<string | null>(null)

  const selectedCategoryLabel = useMemo(
    () => categories.find((item) => item.key === category)?.label ?? t('square.filters.allCategories'),
    [categories, category, t],
  )

  const getCategoryLabel = useCallback(
    (categoryKey: string) =>
      categories.find((item) => item.key === categoryKey)?.label ?? t(`square.category.${categoryKey}`),
    [categories, t],
  )

  const requireLogin = (pendingAction?: { type: 'square-copy' | 'square-test'; entryId: string }) => {
    persistPostAuthRedirect(window.location.pathname + window.location.search)
    if (pendingAction) {
      persistPostAuthAction(pendingAction)
    }
    navigate('/login')
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await getAccessToken()
      const [listResponse, nextTags, nextCategories] = await Promise.all([
        fetchSquareEntries(
          {
            page,
            page_size: 12,
            search: search || undefined,
            category: category || undefined,
            difficulty: difficulty || undefined,
            tag: activeTag || undefined,
            sort_by: sortBy,
          },
          token,
        ),
        fetchSquarePopularTags(),
        fetchSquareCategories(),
      ])

      setEntries(listResponse.items)
      setTotalPages(listResponse.total_pages)
      setPopularTags(nextTags)
      setCategories(nextCategories)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('square.messages.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [activeTag, category, difficulty, getAccessToken, page, search, sortBy, t])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    const nextTag = searchParams.get('tag') ?? ''
    if (nextTag !== activeTag) {
      setActiveTag(nextTag)
      setPage(1)
    }
  }, [activeTag, searchParams])

  const withAuthAction = async <T,>(runner: (token: string) => Promise<T>) => {
    const token = await getAccessToken()
    if (!token) {
      requireLogin()
      return null
    }
    return runner(token)
  }

  const handleCopySuccess = useCallback(
    (entryId: string, openTest: boolean, result: Awaited<ReturnType<typeof copySquareEntry>>) => {
      setEntries((prev) =>
        prev.map((item) =>
          item.id === entryId
            ? {
                ...item,
                copies: result.copies,
              }
            : item,
        ),
      )

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

      setCopyingEntryId(entryId)
      try {
        const result = await copySquareEntry(token, entryId)
        clearPostAuthAction()
        handleCopySuccess(entryId, openTest, result)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('square.messages.copyFailed'))
      } finally {
        setCopyingEntryId((current) => (current === entryId ? null : current))
      }
    },
    [getAccessToken, handleCopySuccess, t],
  )

  useEffect(() => {
    let cancelled = false

    const resumePostAuthAction = async () => {
      const action = readPostAuthAction()
      if (!action) return

      const token = await getAccessToken()
      if (!token || cancelled) return

      if (action.type === 'square-copy' || action.type === 'square-test') {
        await executeCopy(action.entryId, action.type === 'square-test', token)
      }
    }

    void resumePostAuthAction()

    return () => {
      cancelled = true
    }
  }, [executeCopy, getAccessToken])

  const updateTagFilter = (nextTag: string) => {
    const params = new URLSearchParams(searchParams)
    if (nextTag) {
      params.set('tag', nextTag)
    } else {
      params.delete('tag')
    }
    setSearchParams(params)
    setActiveTag(nextTag)
    setPage(1)
  }

  const handleLike = async (entryId: string) => {
    const result = await withAuthAction((token) => toggleSquareLike(token, entryId))
    if (!result) return

    setEntries((prev) =>
      prev.map((item) =>
        item.id === entryId
          ? {
              ...item,
              is_liked: result.is_liked ?? item.is_liked,
              likes: result.likes ?? item.likes,
            }
          : item,
      ),
    )
  }

  const handleFavorite = async (entryId: string) => {
    const result = await withAuthAction((token) => toggleSquareFavorite(token, entryId))
    if (!result) return

    setEntries((prev) =>
      prev.map((item) =>
        item.id === entryId
          ? {
              ...item,
              is_favorited: result.is_favorited ?? item.is_favorited,
              favorites: result.favorites ?? item.favorites,
            }
          : item,
      ),
    )
  }

  const requestCopy = async (entryId: string, openTest = false) => {
    const token = await getAccessToken()
    if (!token) {
      requireLogin({
        type: openTest ? 'square-test' : 'square-copy',
        entryId,
      })
      return
    }

    setCopyConfirm({ entryId, openTest })
  }

  return (
    <div className="app-page min-h-screen">
      <div className="app-page-grid pointer-events-none fixed inset-0 opacity-60" />
      <div className="app-page-orb app-page-orb-primary pointer-events-none fixed left-[-8rem] top-[5rem] h-[24rem] w-[24rem] rounded-full blur-3xl" />
      <div className="app-page-orb app-page-orb-secondary pointer-events-none fixed right-[-7rem] top-[15rem] h-[22rem] w-[22rem] rounded-full blur-3xl" />

      <Navbar />

      <main className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-[rgba(122,102,82,0.12)] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(247,244,238,0.88))] p-6 shadow-[0_30px_80px_-50px_rgba(17,24,39,0.45)]">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
            <div className="space-y-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-ink-400">
                {t('square.kicker')}
              </div>
              <div className="max-w-3xl space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
                  {t('square.title')}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-ink-600">
                  {t('square.subtitle')}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPage(1)
                  }}
                  className="input h-12 flex-1"
                  placeholder={t('square.searchPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => void loadData()}
                  className="btn btn-primary h-12 px-6"
                >
                  {t('square.actions.search')}
                </button>
              </div>
            </div>

            <div className="workspace-paper flex flex-col justify-between gap-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
                  {t('square.heroPanelTitle')}
                </div>
                <div className="mt-4 space-y-3 text-sm leading-7 text-ink-700">
                  <p>{t('square.heroPanelBody')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[22px] border border-[rgba(122,102,82,0.08)] bg-white/84 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-ink-400">{t('square.heroStats.discover')}</div>
                  <div className="mt-2 text-2xl font-semibold text-ink-900">{popularTags.length}</div>
                </div>
                <div className="rounded-[22px] border border-[rgba(122,102,82,0.08)] bg-white/84 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-ink-400">{t('square.heroStats.convert')}</div>
                  <div className="mt-2 text-2xl font-semibold text-ink-900">{entries.length}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="workspace-paper space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-ink-900">{t('square.popularTags')}</div>
              <div className="mt-1 text-sm text-ink-500">{t('square.popularTagsHint')}</div>
            </div>
            {activeTag ? (
              <button
                type="button"
                onClick={() => {
                  updateTagFilter('')
                }}
                className="btn btn-ghost btn-small"
              >
                {t('square.actions.clearTag')}
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {popularTags.map((tagItem) => (
              <button
                key={tagItem.id}
                type="button"
                onClick={() => {
                  updateTagFilter(tagItem.name)
                }}
                className={`rounded-full px-3 py-2 text-sm transition-all ${
                  activeTag === tagItem.name
                    ? 'bg-ink-900 text-white shadow-[0_14px_30px_-24px_rgba(17,24,39,0.8)]'
                    : 'border border-[rgba(122,102,82,0.12)] bg-white/74 text-ink-700 hover:border-[rgba(79,70,229,0.24)] hover:text-ink-900'
                }`}
              >
                #{tagItem.name}
                <span className="ml-2 text-xs opacity-70">{tagItem.count}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="workspace-paper space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value)
                  setPage(1)
                }}
                className="toolbar-select"
              >
                <option value="">{t('square.filters.allCategories')}</option>
                {categories.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={difficulty}
                onChange={(event) => {
                  setDifficulty(event.target.value as SquareDifficulty | '')
                  setPage(1)
                }}
                className="toolbar-select"
              >
                <option value="">{t('square.filters.allDifficulty')}</option>
                <option value="simple">{t('square.difficulty.simple')}</option>
                <option value="medium">{t('square.difficulty.medium')}</option>
                <option value="advanced">{t('square.difficulty.advanced')}</option>
              </select>

              <select
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value as SquareSortBy)
                  setPage(1)
                }}
                className="toolbar-select"
              >
                <option value="hot">{t('square.sort.hot')}</option>
                <option value="newest">{t('square.sort.newest')}</option>
                <option value="copies">{t('square.sort.copies')}</option>
              </select>
            </div>

            <div className="text-sm text-ink-500">
              {t('square.filters.summary', { category: selectedCategoryLabel })}
            </div>
          </div>

          {error ? (
            <div className="rounded-[22px] border border-rose-200 bg-rose-50/80 px-4 py-4 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="py-16">
              <Loading text={t('common.action.loading')} />
            </div>
          ) : entries.length === 0 ? (
            <EmptyState
              title={t('square.empty.title')}
              description={t('square.empty.description')}
              action={{
                label: t('square.actions.resetFilters'),
                onClick: () => {
                  setSearch('')
                  setCategory('')
                  setDifficulty('')
                  setActiveTag('')
                  setSortBy('hot')
                  setPage(1)
                },
              }}
              icon={(
                <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 5h14v14H5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h8M8 14h5" />
                </svg>
              )}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
                {entries.map((entry) => (
                  <article
                    key={entry.id}
                    className="group flex h-full flex-col rounded-[28px] border border-[rgba(122,102,82,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,244,236,0.9))] p-5 shadow-[0_22px_48px_-36px_rgba(17,24,39,0.48)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_58px_-36px_rgba(17,24,39,0.54)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-ink-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                            {getCategoryLabel(entry.category)}
                          </span>
                          <span className="text-xs uppercase tracking-[0.18em] text-ink-400">
                            {t(`square.difficulty.${entry.difficulty}`)}
                          </span>
                        </div>
                        <h2
                          className="mt-4 cursor-pointer text-2xl font-semibold tracking-tight text-ink-900 transition-colors group-hover:text-[#3f3aa8]"
                          onClick={() => navigate(`/square/${entry.id}`)}
                        >
                          {entry.title}
                        </h2>
                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-ink-600">
                          {entry.summary}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleLike(entry.id)}
                          className={`icon-button ${entry.is_liked ? 'text-rose-600' : ''}`}
                          aria-label={t('square.actions.like')}
                        >
                          <svg className="h-5 w-5" fill={entry.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21s-6.716-4.32-9.193-8.008C1.236 10.72 2.01 7.5 5.296 6.32 7.404 5.562 9.6 6.3 11 8c1.4-1.7 3.596-2.438 5.704-1.68 3.286 1.18 4.06 4.4 2.49 6.672C18.716 16.68 12 21 12 21Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleFavorite(entry.id)}
                          className={`icon-button ${entry.is_favorited ? 'text-amber-500' : ''}`}
                          aria-label={t('square.actions.favorite')}
                        >
                          <svg className="h-5 w-5" fill={entry.is_favorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6.75 4.75h10.5A1.75 1.75 0 0 1 19 6.5v14l-7-3-7 3v-14a1.75 1.75 0 0 1 1.75-1.75Z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div
                      className="mt-5 cursor-pointer rounded-[24px] border border-[rgba(122,102,82,0.08)] bg-white/82 p-4"
                      onClick={() => navigate(`/square/${entry.id}`)}
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400">
                        {t('square.preview')}
                      </div>
                      <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-7 text-ink-700">
                        {entry.preview_text}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {entry.tags.slice(0, 4).map((tagItem) => (
                        <button
                          key={tagItem.id}
                          type="button"
                          onClick={() => {
                            updateTagFilter(tagItem.name)
                          }}
                          className="badge badge-user"
                        >
                          {tagItem.name}
                        </button>
                      ))}
                    </div>

                    {entry.recommended_models.length > 0 ? (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {entry.recommended_models.map((model) => (
                          <span
                            key={model}
                            className="rounded-full border border-[rgba(79,70,229,0.14)] bg-[rgba(79,70,229,0.06)] px-3 py-1 text-xs font-medium text-[#4f46e5]"
                          >
                            {model}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-6 flex flex-wrap gap-2">
                      <StatPill label={t('square.stats.likes')} value={entry.likes} />
                      <StatPill label={t('square.stats.favorites')} value={entry.favorites} />
                      <StatPill label={t('square.stats.copies')} value={entry.copies} />
                    </div>

                    <div className="mt-auto border-t border-[rgba(122,102,82,0.12)] pt-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-ink-900">{entry.author.name}</div>
                          <div className="text-xs text-ink-500">
                            {t('square.updatedAt', {
                              date: formatDate(entry.updated_at, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }),
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void requestCopy(entry.id, false)}
                            className="btn btn-secondary btn-small"
                            disabled={copyingEntryId === entry.id}
                          >
                            {t('square.actions.copy')}
                          </button>
                          <button
                            type="button"
                            onClick={() => void requestCopy(entry.id, true)}
                            className="btn btn-primary btn-small"
                            disabled={copyingEntryId === entry.id}
                          >
                            {t('square.actions.testNow')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 ? (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('promptList.previousPage')}
                  </button>
                  <span className="rounded-full border border-[rgba(122,102,82,0.12)] bg-white/70 px-4 py-2 text-sm text-ink-600">
                    {t('promptList.pageInfo', { page, totalPages })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                    disabled={page === totalPages}
                    className="btn btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('promptList.nextPage')}
                  </button>
                </div>
              ) : null}
            </>
          )}
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

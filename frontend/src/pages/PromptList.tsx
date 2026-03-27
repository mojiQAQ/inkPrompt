import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import { deletePrompt, fetchPrompts } from '@/api/prompts'
import { AddToFolderDialog } from '@/components/AddToFolderDialog'
import { AdvancedSearch } from '@/components/AdvancedSearch'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { FeatureTour } from '@/components/FeatureTour'
import { FolderSidebar } from '@/components/FolderSidebar'
import { Loading } from '@/components/Loading'
import { Navbar } from '@/components/Navbar'
import { PromptCard } from '@/components/PromptCard'
import { TagFilter } from '@/components/TagFilter'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Folder } from '@/types/folder'
import { Prompt, PromptListResponse } from '@/types/prompt'

export function PromptList() {
  const { getAccessToken } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()

  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagLogic, setTagLogic] = useState<'AND' | 'OR'>('OR')
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'name' | 'token_count'>('updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [favoritesActive, setFavoritesActive] = useState(false)
  const [folders, setFolders] = useState<Folder[]>([])
  const [sidebarKey, setSidebarKey] = useState(0)

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    promptId: string | null
    promptName: string
  }>({
    isOpen: false,
    promptId: null,
    promptName: '',
  })

  const [addToFolderDialog, setAddToFolderDialog] = useState<{
    isOpen: boolean
    promptId: string
    promptName: string
  }>({
    isOpen: false,
    promptId: '',
    promptName: '',
  })

  const isFavoriteSystemFolder = (folder: Folder) => folder.is_system && folder.name === '收藏提示词'
  const isAllSystemFolder = (folder: Folder) => folder.is_system && !isFavoriteSystemFolder(folder)

  const loadPrompts = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error(t('promptList.notLoggedIn'))
      }

      const allFolder = folders.find(isAllSystemFolder)
      const favFolder = folders.find(isFavoriteSystemFolder)
      const isCustomFolder = activeFolderId && !favoritesActive
      const isAllFolder = activeFolderId === allFolder?.id
      const isFavFolder = activeFolderId === favFolder?.id

      let folder_id: string | undefined
      let favorites_only: boolean | undefined

      if (favoritesActive) {
        favorites_only = true
      } else if (isCustomFolder && !isAllFolder && !isFavFolder) {
        folder_id = activeFolderId!
      }

      const response: PromptListResponse = await fetchPrompts(token, {
        page,
        page_size: pageSize,
        search: searchQuery || undefined,
        tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
        tag_logic: tagLogic,
        sort_by: sortBy,
        sort_order: sortOrder,
        folder_id,
        favorites_only,
      })

      setPrompts(response.items)
      setTotalPages(response.total_pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('promptList.loadFailed'))
      console.error('Load prompts error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPrompts()
  }, [page, searchQuery, selectedTags, tagLogic, sortBy, sortOrder, activeFolderId, favoritesActive, t])

  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      callback: () => {
        const searchInput = document.querySelector<HTMLInputElement>('.prompt-search-bar input')
        searchInput?.focus()
      },
      description: t('promptList.searchAndSort'),
    },
    {
      key: 'n',
      ctrl: true,
      callback: () => navigate('/prompts/new'),
      description: t('promptList.newPrompt'),
    },
  ])

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.promptId) return

    try {
      const token = await getAccessToken()
      if (!token) throw new Error(t('promptList.notLoggedIn'))

      await deletePrompt(token, deleteConfirm.promptId)
      toast.success(t('promptList.deleted'))
      await loadPrompts()
      setSidebarKey((value) => value + 1)
      setDeleteConfirm({ isOpen: false, promptId: null, promptName: '' })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('promptList.deleteFailed')
      setError(message)
      toast.error(message)
    }
  }

  return (
    <div className="app-page flex min-h-screen flex-col">
      <div className="app-page-grid pointer-events-none fixed inset-0 opacity-60" />
      <div className="app-page-orb app-page-orb-primary pointer-events-none fixed left-[-8rem] top-[5rem] h-[24rem] w-[24rem] rounded-full blur-3xl" />
      <div className="app-page-orb app-page-orb-secondary pointer-events-none fixed right-[-7rem] top-[16rem] h-[22rem] w-[22rem] rounded-full blur-3xl" />

      <Navbar />
      <FeatureTour />

      <main className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 pb-6 pt-5 sm:px-6 lg:flex-row lg:px-8">
        <FolderSidebar
          key={sidebarKey}
          activeFolderId={activeFolderId}
          favoritesActive={favoritesActive}
          onFolderSelect={(folderId, isFavorites) => {
            setActiveFolderId(folderId)
            setFavoritesActive(isFavorites)
            setPage(1)
          }}
          onFoldersLoaded={setFolders}
        />

        <section className="prompt-library-shell min-h-0 flex-1">
          <div className="prompt-library-body">
            <div className="prompt-command-bar">
              <div className="min-w-0 flex-1">
                <AdvancedSearch
                  search={searchQuery}
                  onSearchChange={(value) => {
                    setSearchQuery(value)
                    setPage(1)
                  }}
                  sortBy={sortBy}
                  onSortByChange={(value) => {
                    setSortBy(value)
                    setPage(1)
                  }}
                  sortOrder={sortOrder}
                  onSortOrderChange={(value) => {
                    setSortOrder(value)
                    setPage(1)
                  }}
                />
              </div>
              <div className="prompt-command-actions">
                <TagFilter
                  selectedTags={selectedTags}
                  onTagsChange={(value) => {
                    setSelectedTags(value)
                    setPage(1)
                  }}
                  tagLogic={tagLogic}
                  onLogicChange={(value) => {
                    setTagLogic(value)
                    setPage(1)
                  }}
                />
                <button
                  type="button"
                  onClick={() => navigate('/prompts/new')}
                  className="landing-hero-primary inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold text-white"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('promptList.newPrompt')}
                </button>
              </div>
            </div>

            {selectedTags.length > 0 || searchQuery ? (
              <div className="prompt-filter-summary">
                <div className="min-w-0 flex-1 text-sm text-ink-700">
                  {t('promptList.filtering')}
                  {searchQuery ? <span className="ml-1 font-semibold">"{searchQuery}"</span> : null}
                  {selectedTags.length > 0 ? (
                    <span className="ml-1">
                      {t('promptList.tagsCount', { count: selectedTags.length })}
                      {tagLogic === 'AND' ? t('promptList.logicAnd') : t('promptList.logicOr')}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTags([])
                    setSearchQuery('')
                    setPage(1)
                  }}
                  className="text-sm font-medium text-[#4f46e5] transition-colors hover:text-[#3730a3]"
                >
                  {t('promptList.clearFilters')}
                </button>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-[24px] border border-rose-200 bg-rose-50/80 px-4 py-4 text-sm text-rose-800">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="py-16">
                <Loading text={t('promptEditor.loading')} />
              </div>
            ) : prompts.length === 0 ? (
              <EmptyState
                title={searchQuery ? t('promptList.emptySearchTitle') : t('promptList.emptyDefaultTitle')}
                description={
                  searchQuery
                    ? t('promptList.emptySearchDescription')
                    : t('promptList.emptyDefaultDescription')
                }
                action={
                  searchQuery
                    ? undefined
                    : {
                        label: t('promptList.createPrompt'),
                        onClick: () => navigate('/prompts/new'),
                      }
                }
                icon={(
                  <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {prompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onClick={(id) => navigate(`/prompts/${id}`)}
                      onEdit={(id) => navigate(`/prompts/${id}/edit`)}
                      onDelete={(id) => {
                        const target = prompts.find((item) => item.id === id)
                        setDeleteConfirm({
                          isOpen: true,
                          promptId: id,
                          promptName: target?.name || '',
                        })
                      }}
                      onAddToFolder={(promptItem) => {
                        setAddToFolderDialog({
                          isOpen: true,
                          promptId: promptItem.id,
                          promptName: promptItem.name,
                        })
                      }}
                      onFavoriteToggled={async () => {
                        await loadPrompts()
                        setSidebarKey((value) => value + 1)
                      }}
                      searchKeyword={searchQuery}
                    />
                  ))}
                </div>

                {totalPages > 1 ? (
                  <div className="flex items-center justify-center gap-3 pt-3">
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
          </div>
        </section>
      </main>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={t('promptList.deleteTitle')}
        message={t('promptList.deleteMessage', { name: deleteConfirm.promptName })}
        confirmLabel={t('common.action.delete')}
        cancelLabel={t('common.action.cancel')}
        danger
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteConfirm({ isOpen: false, promptId: null, promptName: '' })}
      />

      <AddToFolderDialog
        isOpen={addToFolderDialog.isOpen}
        promptId={addToFolderDialog.promptId}
        promptName={addToFolderDialog.promptName}
        onClose={() => setAddToFolderDialog({ isOpen: false, promptId: '', promptName: '' })}
        onAdded={() => {
          void loadPrompts()
          setSidebarKey((value) => value + 1)
        }}
      />
    </div>
  )
}

/**
 * Complete Prompt list page with folder sidebar
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { fetchPrompts, deletePrompt } from '@/api/prompts'
import { Prompt, PromptListResponse } from '@/types/prompt'
import { Folder } from '@/types/folder'
import { Navbar } from '@/components/Navbar'
import { PromptCard } from '@/components/PromptCard'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { AdvancedSearch } from '@/components/AdvancedSearch'
import { TagFilter } from '@/components/TagFilter'
import { FeatureTour } from '@/components/FeatureTour'
import { FolderSidebar } from '@/components/FolderSidebar'
import { AddToFolderDialog } from '@/components/AddToFolderDialog'

export function PromptList() {
  const { getAccessToken } = useAuth()
  const navigate = useNavigate()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // State
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [total, setTotal] = useState(0)
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

  // Folder state
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [favoritesActive, setFavoritesActive] = useState(false)
  const [folders, setFolders] = useState<Folder[]>([])
  const [sidebarKey, setSidebarKey] = useState(0) // for refreshing sidebar

  // Dialog state
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

  // Load prompts
  const loadPrompts = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('未登录')
      }

      // Determine folder filtering
      // For system folders: "全部提示词" = no filter, "收藏提示词" = favorites_only
      // For custom folders: pass folder_id
      const isCustomFolder = activeFolderId && !favoritesActive
      const allFolder = folders.find((f) => f.name === '全部提示词')
      const favFolder = folders.find((f) => f.name === '收藏提示词')
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
      setTotal(response.total)
      setTotalPages(response.total_pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
      console.error('Load prompts error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load on mount and when filters change
  useEffect(() => {
    loadPrompts()
  }, [page, searchQuery, selectedTags, tagLogic, sortBy, sortOrder, activeFolderId, favoritesActive])

  // Handlers
  const handleCreateNew = () => {
    navigate('/prompts/new')
  }

  const handleEdit = (id: string) => {
    navigate(`/prompts/${id}/edit`)
  }

  const handleView = (id: string) => {
    navigate(`/prompts/${id}`)
  }

  const handleDeleteClick = (prompt: Prompt) => {
    setDeleteConfirm({
      isOpen: true,
      promptId: prompt.id,
      promptName: prompt.name,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.promptId) return

    try {
      const token = await getAccessToken()
      if (!token) throw new Error('未登录')

      await deletePrompt(token, deleteConfirm.promptId)

      toast.success('提示词已删除')
      await loadPrompts()
      setSidebarKey((k) => k + 1) // refresh sidebar counts
      setDeleteConfirm({ isOpen: false, promptId: null, promptName: '' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除失败'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Delete prompt error:', err)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, promptId: null, promptName: '' })
  }

  const handleClearFilters = () => {
    setSelectedTags([])
    setSearchQuery('')
    setPage(1)
  }

  const handleFolderSelect = (folderId: string | null, isFavorites: boolean) => {
    setActiveFolderId(folderId)
    setFavoritesActive(isFavorites)
    setPage(1)
  }

  const handleAddToFolder = (prompt: Prompt) => {
    setAddToFolderDialog({
      isOpen: true,
      promptId: prompt.id,
      promptName: prompt.name,
    })
  }

  const handleFavoriteToggled = () => {
    // Refresh data
    loadPrompts()
    setSidebarKey((k) => k + 1) // refresh sidebar counts
  }

  // Get active folder name for display
  const getActiveFolderName = () => {
    if (favoritesActive) return '收藏提示词'
    if (activeFolderId) {
      const folder = folders.find((f) => f.id === activeFolderId)
      return folder?.name || '我的提示词'
    }
    return '全部提示词'
  }

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      callback: () => {
        searchInputRef.current?.focus()
      },
      description: '搜索提示词',
    },
    {
      key: 'n',
      ctrl: true,
      callback: () => {
        handleCreateNew()
      },
      description: '新建提示词',
    },
  ])

  return (
    <div className="flex flex-col h-screen bg-paper-white overflow-hidden">
      <Navbar />
      
      {/* Feature Tour for first-time users */}
      <FeatureTour />

      <main className="flex flex-1 overflow-hidden w-full bg-white/50">
        {/* Folder Sidebar */}
        <FolderSidebar
          key={sidebarKey}
          activeFolderId={activeFolderId}
          favoritesActive={favoritesActive}
          onFolderSelect={handleFolderSelect}
          onFoldersLoaded={setFolders}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-ink-900">{getActiveFolderName()}</h2>
              <p className="text-sm text-ink-500 mt-1">
                共 {total} 个提示词
              </p>
            </div>

            <button onClick={handleCreateNew} className="btn btn-primary">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建提示词
            </button>
          </div>

          {/* Advanced Search and Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Search Section - takes 2 columns */}
            <div className="lg:col-span-2 p-4 bg-white border border-ink-200 rounded-lg">
              <h3 className="text-sm font-semibold text-ink-700 mb-3">搜索和排序</h3>
              <AdvancedSearch
                search={searchQuery}
                onSearchChange={(search) => {
                  setSearchQuery(search)
                  setPage(1)
                }}
                sortBy={sortBy}
                onSortByChange={(sort) => {
                  setSortBy(sort)
                  setPage(1)
                }}
                sortOrder={sortOrder}
                onSortOrderChange={(order) => {
                  setSortOrder(order)
                  setPage(1)
                }}
              />
            </div>

            {/* Tag Filter Section - takes 1 column */}
            <div className="p-4 bg-white border border-ink-200 rounded-lg">
              <TagFilter
                selectedTags={selectedTags}
                onTagsChange={(tags) => {
                  setSelectedTags(tags)
                  setPage(1)
                }}
                tagLogic={tagLogic}
                onLogicChange={(logic) => {
                  setTagLogic(logic)
                  setPage(1)
                }}
              />
            </div>
          </div>

          {/* Filter summary and results count */}
          {(selectedTags.length > 0 || searchQuery) && (
            <div className="mb-6 space-y-3">
              {/* Active filters */}
              <div className="flex items-center justify-between p-3 bg-accent-purple/5 border border-accent-purple/20 rounded-lg">
                <p className="text-sm text-ink-700">
                  正在筛选
                  {searchQuery && <span className="ml-1 font-semibold">"{searchQuery}"</span>}
                  {selectedTags.length > 0 && (
                    <span className="ml-1">
                      · {selectedTags.length} 个标签
                      {tagLogic === 'AND' ? '（同时包含）' : '（包含任一）'}
                    </span>
                  )}
                </p>
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-accent-purple hover:text-accent-purple/80 font-medium"
                >
                  清除所有筛选
                </button>
              </div>

              {/* Results count */}
              {!loading && (
                <div className="text-sm text-ink-600">
                  找到 <span className="font-semibold text-accent-purple">{total}</span> 个匹配的提示词
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="py-16">
              <Loading text="加载中..." />
            </div>
          ) : prompts.length === 0 ? (
            <EmptyState
              title={searchQuery ? '未找到匹配的提示词' : '还没有提示词'}
              description={searchQuery ? '尝试使用其他关键词搜索' : '开始创建你的第一个提示词吧'}
              action={
                searchQuery
                  ? undefined
                  : {
                      label: '创建提示词',
                      onClick: handleCreateNew,
                    }
              }
              icon={
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          ) : (
            <>
              {/* Prompts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {prompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onClick={handleView}
                    onEdit={handleEdit}
                    onDelete={() => handleDeleteClick(prompt)}
                    onAddToFolder={handleAddToFolder}
                    onFavoriteToggled={handleFavoriteToggled}
                    searchKeyword={searchQuery}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>

                  <span className="text-ink-600 text-sm px-4">
                    第 {page} / {totalPages} 页
                  </span>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="确认删除"
        message={`确定要删除提示词"${deleteConfirm.promptName}"吗？此操作无法撤销。`}
        confirmLabel="删除"
        cancelLabel="取消"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Add to Folder Dialog */}
      <AddToFolderDialog
        isOpen={addToFolderDialog.isOpen}
        promptId={addToFolderDialog.promptId}
        promptName={addToFolderDialog.promptName}
        onClose={() => setAddToFolderDialog({ isOpen: false, promptId: '', promptName: '' })}
        onAdded={() => {
          loadPrompts()
          setSidebarKey((k) => k + 1)
        }}
      />
    </div>
  )
}

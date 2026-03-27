import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { createFolder, deleteFolder, fetchFolders, updateFolder } from '@/api/folders'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import { Folder } from '@/types/folder'

interface FolderSidebarProps {
  activeFolderId: string | null
  favoritesActive: boolean
  onFolderSelect: (folderId: string | null, isFavorites: boolean) => void
  onFoldersLoaded?: (folders: Folder[]) => void
}

export function FolderSidebar({
  activeFolderId,
  favoritesActive,
  onFolderSelect,
  onFoldersLoaded,
}: FolderSidebarProps) {
  const { getAccessToken } = useAuth()
  const { t } = useI18n()
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [contextMenu, setContextMenu] = useState<{
    folderId: string
    x: number
    y: number
  } | null>(null)
  const newFolderInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const isFavoriteSystemFolder = (folder: Folder) => folder.is_system && folder.name === '收藏提示词'
  const isAllSystemFolder = (folder: Folder) => folder.is_system && !isFavoriteSystemFolder(folder)

  const loadFolders = async () => {
    try {
      const token = await getAccessToken()
      if (!token) return

      const response = await fetchFolders(token)
      setFolders(response.items)
      onFoldersLoaded?.(response.items)
    } catch (err) {
      console.error('Failed to load folders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFolders()
  }, [])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu])

  useEffect(() => {
    if (creating) {
      newFolderInputRef.current?.focus()
    }
  }, [creating])

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [editingId])

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) {
      setCreating(false)
      setNewFolderName('')
      return
    }

    try {
      const token = await getAccessToken()
      if (!token) return

      await createFolder(token, { name })
      toast.success(t('folderSidebar.created'))
      setCreating(false)
      setNewFolderName('')
      await loadFolders()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('folderSidebar.createFailed'))
    }
  }

  const handleRenameFolder = async (folderId: string) => {
    const name = editingName.trim()
    if (!name) {
      setEditingId(null)
      setEditingName('')
      return
    }

    try {
      const token = await getAccessToken()
      if (!token) return

      await updateFolder(token, folderId, { name })
      toast.success(t('folderSidebar.renamed'))
      setEditingId(null)
      setEditingName('')
      await loadFolders()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('folderSidebar.renameFailed'))
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const token = await getAccessToken()
      if (!token) return

      await deleteFolder(token, folderId)
      toast.success(t('folderSidebar.deleted'))

      if (activeFolderId === folderId) {
        onFolderSelect(null, false)
      }

      await loadFolders()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('folderSidebar.deleteFailed'))
    }
  }

  const handleContextMenu = (event: React.MouseEvent, folderId: string) => {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu({
      folderId,
      x: event.clientX,
      y: event.clientY,
    })
  }

  const systemFolders = folders.filter((folder) => folder.is_system)
  const customFolders = folders.filter((folder) => !folder.is_system)
  const allFolder = systemFolders.find(isAllSystemFolder)
  const favFolder = systemFolders.find(isFavoriteSystemFolder)
  const isAllActive = !activeFolderId && !favoritesActive

  const totalPrompts = allFolder?.prompt_count ?? 0

  return (
    <aside className="prompt-library-sidebar w-full xl:w-[300px]">
      <div className="prompt-library-nav-card h-full">
        <div className="border-b border-[rgba(122,102,82,0.12)] px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-400">
                {t('common.label.library')}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-ink-900">{t('folderSidebar.title')}</h3>
            </div>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="icon-button h-10 w-10"
              title={t('folderSidebar.newFolder')}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/70 bg-white/72 px-4 py-4 shadow-[0_18px_36px_-34px_rgba(31,41,55,0.55)]">
            <div className="text-2xl font-semibold text-ink-900">{totalPrompts}</div>
            <div className="mt-1 text-sm text-ink-500">{t('promptList.count', { count: totalPrompts })}</div>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          <div className="space-y-2">
            {allFolder ? (
              <button
                type="button"
                onClick={() => onFolderSelect(null, false)}
                className={`folder-nav-item group ${isAllActive ? 'folder-nav-item-active' : ''}`}
              >
                <span className="folder-nav-icon">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1 truncate">{t('promptList.allPrompts')}</span>
                <span className="folder-nav-count">{allFolder.prompt_count}</span>
              </button>
            ) : null}

            {favFolder ? (
              <button
                type="button"
                onClick={() => onFolderSelect(null, true)}
                className={`folder-nav-item group ${favoritesActive ? 'folder-nav-item-active' : ''}`}
              >
                <span className="folder-nav-icon">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1 truncate">{t('promptList.favoritePrompts')}</span>
                <span className="folder-nav-count">{favFolder.prompt_count}</span>
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400">
                {t('common.label.custom')}
              </p>
              <span className="text-xs text-ink-400">{customFolders.length}</span>
            </div>

            {loading ? (
              <div className="rounded-[24px] border border-dashed border-[rgba(122,102,82,0.18)] px-4 py-5 text-sm text-ink-500">
                {t('folderSidebar.loading')}
              </div>
            ) : (
              <div className="space-y-2">
                {customFolders.map((folder) => (
                  <div key={folder.id}>
                    {editingId === folder.id ? (
                      <div className="rounded-[22px] border border-[rgba(91,91,214,0.22)] bg-white/82 p-2">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') void handleRenameFolder(folder.id)
                            if (event.key === 'Escape') {
                              setEditingId(null)
                              setEditingName('')
                            }
                          }}
                          onBlur={() => void handleRenameFolder(folder.id)}
                          className="input h-11"
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onFolderSelect(folder.id, false)}
                        onContextMenu={(event) => handleContextMenu(event, folder.id)}
                        className={`folder-nav-item group ${activeFolderId === folder.id ? 'folder-nav-item-active' : ''}`}
                      >
                        <span className="folder-nav-icon">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </span>
                        <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                        <span className="folder-nav-count">{folder.prompt_count}</span>
                        <span
                          onClick={(event) => handleContextMenu(event, folder.id)}
                          className="rounded-full p-1 text-ink-400 opacity-0 transition-all hover:bg-white/80 hover:text-ink-700 group-hover:opacity-100"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </span>
                      </button>
                    )}
                  </div>
                ))}

                {creating ? (
                  <div className="rounded-[22px] border border-[rgba(91,91,214,0.22)] bg-white/82 p-2">
                    <input
                      ref={newFolderInputRef}
                      type="text"
                      value={newFolderName}
                      onChange={(event) => setNewFolderName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') void handleCreateFolder()
                        if (event.key === 'Escape') {
                          setCreating(false)
                          setNewFolderName('')
                        }
                      }}
                      onBlur={() => void handleCreateFolder()}
                      placeholder={t('folderSidebar.placeholder')}
                      className="input h-11"
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {contextMenu ? (
        <div
          className="dialog-surface fixed z-50 min-w-[160px] py-2"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            onClick={() => {
              const folder = folders.find((item) => item.id === contextMenu.folderId)
              if (folder) {
                setEditingId(folder.id)
                setEditingName(folder.name)
              }
              setContextMenu(null)
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ink-700 transition-colors hover:bg-white/70"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t('folderSidebar.rename')}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleDeleteFolder(contextMenu.folderId)
              setContextMenu(null)
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50/80"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t('folderSidebar.delete')}
          </button>
        </div>
      ) : null}
    </aside>
  )
}

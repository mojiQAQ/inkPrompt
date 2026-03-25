/**
 * Folder sidebar component for prompt organization
 */
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { Folder } from '@/types/folder'
import { fetchFolders, createFolder, updateFolder, deleteFolder } from '@/api/folders'

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

  // Load folders
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
    loadFolders()
  }, [])

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu])

  // Focus new folder input
  useEffect(() => {
    if (creating) {
      newFolderInputRef.current?.focus()
    }
  }, [creating])

  // Focus edit input
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
      return
    }

    try {
      const token = await getAccessToken()
      if (!token) return

      await createFolder(token, { name })
      toast.success('文件夹已创建')
      setCreating(false)
      setNewFolderName('')
      await loadFolders()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建失败')
    }
  }

  const handleRenameFolder = async (folderId: string) => {
    const name = editingName.trim()
    if (!name) {
      setEditingId(null)
      return
    }

    try {
      const token = await getAccessToken()
      if (!token) return

      await updateFolder(token, folderId, { name })
      toast.success('文件夹已重命名')
      setEditingId(null)
      setEditingName('')
      await loadFolders()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '重命名失败')
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const token = await getAccessToken()
      if (!token) return

      await deleteFolder(token, folderId)
      toast.success('文件夹已删除')

      // If deleting active folder, switch to all
      if (activeFolderId === folderId) {
        onFolderSelect(null, false)
      }

      await loadFolders()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleContextMenu = (e: React.MouseEvent, folderId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      folderId,
      x: e.clientX,
      y: e.clientY,
    })
  }

  // Separate system and custom folders
  const systemFolders = folders.filter((f) => f.is_system)
  const customFolders = folders.filter((f) => !f.is_system)
  const allFolder = systemFolders.find((f) => f.name === '全部提示词')
  const favFolder = systemFolders.find((f) => f.name === '收藏提示词')

  const isAllActive = !activeFolderId && !favoritesActive

  return (
    <div className="w-64 flex-shrink-0 bg-white border-r border-ink-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-ink-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-700">文件夹</h3>
          <button
            onClick={() => setCreating(true)}
            className="p-1 text-ink-400 hover:text-accent-purple hover:bg-ink-50 rounded transition-colors"
            title="新建文件夹"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Folder List */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="px-4 py-2 text-sm text-ink-400">加载中...</div>
        ) : (
          <>
            {/* System Folders */}
            {allFolder && (
              <button
                onClick={() => onFolderSelect(null, false)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${
                  isAllActive
                    ? 'bg-accent-purple/10 text-accent-purple font-medium'
                    : 'text-ink-700 hover:bg-ink-50'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span className="flex-1 truncate">{allFolder.name}</span>
                <span className="text-xs text-ink-400">{allFolder.prompt_count}</span>
              </button>
            )}

            {favFolder && (
              <button
                onClick={() => onFolderSelect(null, true)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${
                  favoritesActive
                    ? 'bg-accent-purple/10 text-accent-purple font-medium'
                    : 'text-ink-700 hover:bg-ink-50'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
                <span className="flex-1 truncate">{favFolder.name}</span>
                <span className="text-xs text-ink-400">{favFolder.prompt_count}</span>
              </button>
            )}

            {/* Divider */}
            {customFolders.length > 0 && (
              <div className="mx-4 my-2 border-t border-ink-100"></div>
            )}

            {/* Custom Folders */}
            {customFolders.map((folder) => (
              <div key={folder.id} className="relative">
                {editingId === folder.id ? (
                  <div className="px-4 py-1">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameFolder(folder.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      onBlur={() => handleRenameFolder(folder.id)}
                      className="w-full px-2 py-1 text-sm border border-accent-purple rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => onFolderSelect(folder.id, false)}
                    onContextMenu={(e) => handleContextMenu(e, folder.id)}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors group ${
                      activeFolderId === folder.id
                        ? 'bg-accent-purple/10 text-accent-purple font-medium'
                        : 'text-ink-700 hover:bg-ink-50'
                    }`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <span className="flex-1 truncate">{folder.name}</span>
                    <span className="text-xs text-ink-400">{folder.prompt_count}</span>
                    {/* Inline more button */}
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        handleContextMenu(e, folder.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-ink-400 hover:text-ink-600 rounded transition-all cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </span>
                  </button>
                )}
              </div>
            ))}

            {/* Create new folder inline */}
            {creating && (
              <div className="px-4 py-1">
                <input
                  ref={newFolderInputRef}
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder()
                    if (e.key === 'Escape') {
                      setCreating(false)
                      setNewFolderName('')
                    }
                  }}
                  onBlur={handleCreateFolder}
                  placeholder="文件夹名称"
                  className="w-full px-2 py-1 text-sm border border-accent-purple rounded focus:outline-none focus:ring-1 focus:ring-accent-purple"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white shadow-lg rounded-lg border border-ink-200 py-1 z-50 min-w-[120px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              const folder = folders.find((f) => f.id === contextMenu.folderId)
              if (folder) {
                setEditingId(folder.id)
                setEditingName(folder.name)
              }
              setContextMenu(null)
            }}
            className="w-full px-3 py-1.5 text-sm text-left text-ink-700 hover:bg-ink-50 flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            重命名
          </button>
          <button
            onClick={() => {
              handleDeleteFolder(contextMenu.folderId)
              setContextMenu(null)
            }}
            className="w-full px-3 py-1.5 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            删除
          </button>
        </div>
      )}
    </div>
  )
}

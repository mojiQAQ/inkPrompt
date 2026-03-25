/**
 * Dialog for adding a prompt to a folder
 */
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { Folder } from '@/types/folder'
import { fetchFolders, addPromptToFolder } from '@/api/folders'

interface AddToFolderDialogProps {
  isOpen: boolean
  promptId: string
  promptName: string
  onClose: () => void
  onAdded?: () => void
}

export function AddToFolderDialog({
  isOpen,
  promptId,
  promptName,
  onClose,
  onAdded,
}: AddToFolderDialogProps) {
  const { getAccessToken } = useAuth()
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadFolders()
    }
  }, [isOpen])

  const loadFolders = async () => {
    setLoading(true)
    try {
      const token = await getAccessToken()
      if (!token) return

      const response = await fetchFolders(token)
      // Only show custom (non-system) folders
      setFolders(response.items.filter((f) => !f.is_system))
    } catch (err) {
      console.error('Failed to load folders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (folderId: string) => {
    setAdding(true)
    try {
      const token = await getAccessToken()
      if (!token) return

      await addPromptToFolder(token, folderId, promptId)
      toast.success('已添加到文件夹')
      onAdded?.()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '添加失败')
    } finally {
      setAdding(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h3 className="text-base font-semibold text-ink-900">添加到文件夹</h3>
          <button
            onClick={onClose}
            className="p-1 text-ink-400 hover:text-ink-600 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-3">
          <p className="text-sm text-ink-500 mb-3">
            将「{promptName}」添加到：
          </p>

          {loading ? (
            <div className="py-4 text-sm text-ink-400 text-center">加载中...</div>
          ) : folders.length === 0 ? (
            <div className="py-4 text-sm text-ink-400 text-center">
              暂无自定义文件夹，请先创建文件夹
            </div>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleAdd(folder.id)}
                  disabled={adding}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  <span className="text-xs text-ink-400">{folder.prompt_count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-ink-100 flex justify-end">
          <button onClick={onClose} className="btn btn-secondary text-sm">
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

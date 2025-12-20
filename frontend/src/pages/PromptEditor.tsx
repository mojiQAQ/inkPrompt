/**
 * Prompt editor page for creating and editing prompts
 */
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { fetchPrompt, createPrompt, updatePrompt } from '@/api/prompts'
import { getPromptVersions, restoreVersion, PromptVersion } from '@/api/versions'
import { Prompt, CreatePromptData, UpdatePromptData } from '@/types/prompt'
import { Layout } from '@/components/Layout'
import { Loading } from '@/components/Loading'
import { TagInput } from '@/components/TagInput'
import { VersionList } from '@/components/VersionList'
import { VersionDetailDialog } from '@/components/VersionDetailDialog'
import { OptimizeButton } from '@/components/OptimizeButton'

export function PromptEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getAccessToken } = useAuth()

  const isEditMode = !!id

  // Form state
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [changeNote, setChangeNote] = useState('')

  // UI state
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenCount, setTokenCount] = useState(0)
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [showVersions, setShowVersions] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null)
  const [showVersionDetail, setShowVersionDetail] = useState(false)

  // Define load functions with useCallback to avoid dependency issues
  const loadPrompt = useCallback(async (promptId: string) => {
    setLoading(true)
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) throw new Error('未登录')

      const prompt: Prompt = await fetchPrompt(token, promptId)

      setName(prompt.name)
      setContent(prompt.content)
      setTags(prompt.tags.map((t) => t.name))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
      console.error('Load prompt error:', err)
    } finally {
      setLoading(false)
    }
  }, [getAccessToken])

  const loadVersions = useCallback(async (promptId: string) => {
    try {
      const token = await getAccessToken()
      if (!token) {
        console.log('No token available for loading versions')
        return
      }

      console.log('Loading versions for prompt:', promptId)
      const data = await getPromptVersions(token, promptId)
      console.log('Versions loaded:', data)
      console.log('Data type:', typeof data, 'Is array:', Array.isArray(data))

      // Handle both response formats: array or object with versions field
      const versionsArray = Array.isArray(data) ? data : data.versions
      console.log('Setting versions array:', versionsArray)
      console.log('Versions array length:', versionsArray?.length)
      setVersions(versionsArray || [])
      console.log('After setVersions called')
    } catch (err) {
      console.error('Load versions error:', err)
    }
  }, [getAccessToken])

  // Load prompt data if editing
  useEffect(() => {
    if (isEditMode && id) {
      loadPrompt(id)
      loadVersions(id)
    }
  }, [id, isEditMode, loadPrompt, loadVersions])

  // Calculate token count (simple estimation)
  useEffect(() => {
    // Simple estimation: 1 token ≈ 4 characters
    const estimated = Math.ceil(content.length / 4)
    setTokenCount(estimated)
  }, [content])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('请输入提示词名称')
      return
    }

    if (!content.trim()) {
      setError('请输入提示词内容')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) throw new Error('未登录')

      if (isEditMode && id) {
        // Update existing prompt
        const updateData: UpdatePromptData = {
          name: name.trim(),
          content: content.trim(),
          tag_names: tags.length > 0 ? tags : undefined,
          change_note: changeNote.trim() || undefined,
        }

        await updatePrompt(token, id, updateData)

        // Show success toast
        toast.success('提示词已更新')

        // Clear change note and reload data
        setChangeNote('')
        await loadPrompt(id)
        await loadVersions(id)
      } else {
        // Create new prompt
        const createData: CreatePromptData = {
          name: name.trim(),
          content: content.trim(),
          tag_names: tags.length > 0 ? tags : undefined,
        }

        await createPrompt(token, createData)

        // Show success toast
        toast.success('提示词已创建')

        // Navigate back to list for new prompts
        navigate('/prompts')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存失败'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Save prompt error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/prompts')
  }

  const handleViewVersion = (version: PromptVersion) => {
    setSelectedVersion(version)
    setShowVersionDetail(true)
  }

  const handleRestoreVersion = async (version: PromptVersion) => {
    if (!id) return

    try {
      const token = await getAccessToken()
      if (!token) throw new Error('未登录')

      await restoreVersion(token, id, version.id)
      toast.success(`已恢复到版本 ${version.version_number}`)

      // Reload prompt and versions
      await loadPrompt(id)
      await loadVersions(id)

      // Close dialog if open
      setShowVersionDetail(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '恢复版本失败'
      toast.error(errorMessage)
      console.error('Restore version error:', err)
    }
  }

  const handleOptimized = (optimizedContent: string) => {
    setContent(optimizedContent)
    toast.success('内容已更新为优化后的版本')
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <Loading text="加载中..." />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-ink-900">
            {isEditMode ? '编辑提示词' : '新建提示词'}
          </h1>
          <button onClick={handleCancel} className="text-ink-600 hover:text-ink-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {/* Name Input */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-ink-700 mb-2">
              提示词名称 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="例如：代码审查助手"
              required
            />
          </div>

          {/* Content Input */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="content" className="block text-sm font-medium text-ink-700">
                提示词内容 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-ink-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="font-medium">{tokenCount}</span> tokens
                  <span className="text-ink-400">(估算值，±5% 误差)</span>
                </div>
                {isEditMode && id && (
                  <OptimizeButton promptId={id} onOptimized={handleOptimized} />
                )}
              </div>
            </div>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input min-h-[300px] font-mono text-sm"
              placeholder="输入你的提示词内容..."
              required
            />
          </div>

          {/* Tags Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-ink-700 mb-2">
              标签
            </label>
            <TagInput
              value={tags}
              onChange={setTags}
              placeholder="输入标签后按回车添加，支持自动补全"
            />
          </div>

          {/* Change Note (only for edit mode) */}
          {isEditMode && (
            <div className="mb-6">
              <label htmlFor="changeNote" className="block text-sm font-medium text-ink-700 mb-2">
                版本更新说明 (可选)
              </label>
              <input
                id="changeNote"
                type="text"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                className="input"
                placeholder="例如：优化了提示词结构"
              />
              <p className="text-xs text-ink-500 mt-1">
                如果内容有变化，将自动创建新版本
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-ink-200">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
              disabled={saving}
            >
              取消
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? '保存中...' : isEditMode ? '保存更改' : '创建提示词'}
            </button>
          </div>
        </form>

        {/* Version History (only for edit mode) */}
        {isEditMode && id && (
          <div className="mt-12 pt-8 border-t border-ink-200">
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="flex items-center gap-2 text-lg font-semibold text-ink-800 hover:text-ink-900 mb-4"
            >
              <svg
                className={`w-5 h-5 transition-transform ${showVersions ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              版本历史 ({versions?.length || 0} 个版本)
            </button>

            {showVersions && versions && versions.length > 0 && (
              <VersionList
                versions={versions}
                onViewVersion={handleViewVersion}
                onRestoreVersion={handleRestoreVersion}
              />
            )}

            {showVersions && (!versions || versions.length === 0) && (
              <p className="text-sm text-ink-500">暂无版本历史</p>
            )}
          </div>
        )}

        {/* Version Detail Dialog */}
        <VersionDetailDialog
          version={selectedVersion}
          isOpen={showVersionDetail}
          onClose={() => setShowVersionDetail(false)}
          onRestore={handleRestoreVersion}
        />
      </div>
    </Layout>
  )
}

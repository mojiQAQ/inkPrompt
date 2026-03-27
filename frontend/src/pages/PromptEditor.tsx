/**
 * Prompt detail page with view/edit split and side panels.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import { createPrompt, fetchPrompt, updatePrompt } from '@/api/prompts'
import { getAvailableModels } from '@/api/models'
import { getOptimizationSession, startOptimizeStream } from '@/api/optimization'
import { fetchSquareCategories, publishPromptToSquare } from '@/api/square'
import { getTestSession, startTestStream } from '@/api/test'
import { getPromptVersions, restoreVersion } from '@/api/versions'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Layout } from '@/components/Layout'
import { Loading } from '@/components/Loading'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { PublishToSquareDialog } from '@/components/PublishToSquareDialog'
import type {
  CustomTestModelInput,
  TestModelOption,
  TestModelOutput,
  TestPanelModel,
} from '@/components/TestPanel'
import { TestPanel } from '@/components/TestPanel'
import { TagInput } from '@/components/TagInput'
import type { OptimizeRound as PanelOptimizeRound, OptimizeSuggestion as PanelOptimizeSuggestion } from '@/components/OptimizePanel'
import { OptimizePanel } from '@/components/OptimizePanel'
import { VersionDetailDialog } from '@/components/VersionDetailDialog'
import { VersionDiffDialog } from '@/components/VersionDiffDialog'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import type {
  ChatMessage,
  CreatePromptData,
  ModelConfig,
  OptimizationRound,
  Prompt,
  PromptVersion,
  TestModelConversation,
  UpdatePromptData,
} from '@/types/prompt'
import type { PublishPromptPayload, SquareCategory } from '@/types/square'

type PageMode = 'view' | 'edit'
type RightPanel = 'optimize' | 'test' | null

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.trim().length / 4))
}

function makeSummary(content: string) {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 140) return normalized
  return `${normalized.slice(0, 140).trim()}...`
}

function makeSnapshot(name: string, content: string, tags: string[]) {
  return JSON.stringify({
    name: name.trim(),
    content: content.trim(),
    tags: normalizeTags(tags).sort(),
  })
}

function normalizeTags(tags: string[]) {
  return tags.map((tag) => tag.trim()).filter(Boolean)
}

function formatFullDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function normalizeModelKeyPart(value: string) {
  return value.trim().toLowerCase()
}

function buildModelId(model: Pick<ModelConfig, 'name' | 'model'> & Partial<Pick<ModelConfig, 'base_url'>>) {
  return [
    normalizeModelKeyPart(model.name),
    normalizeModelKeyPart(model.model),
    normalizeModelKeyPart(model.base_url ?? ''),
  ].join('::')
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mapSuggestion(question: string, options: string[], prefix = ''): PanelOptimizeSuggestion {
  return {
    id: `${prefix}${slugify(question) || 'suggestion'}`,
    question,
    options: options.map((option, index) => ({
      id: `${prefix}${slugify(question) || 'suggestion'}-${index}`,
      label: option,
    })),
  }
}

function mapRoundToPanelRound(round: OptimizationRound): PanelOptimizeRound {
  return {
    id: round.id,
    roundNumber: round.round_number,
    createdAt: round.created_at,
    optimizedContent: round.optimized_content,
    userIdea: round.user_idea ?? undefined,
    selectedSuggestions: round.selected_suggestions ?? {},
    suggestions: round.suggestions.map((item, index) =>
      mapSuggestion(item.question, item.options, `${round.id}-${index}-`)
    ),
    domainAnalysis: round.domain_analysis,
    versionId: round.version_id ?? undefined,
  }
}

function getLastAssistantMessage(messages: ChatMessage[]) {
  const list = [...messages].reverse()
  return list.find((item) => item.role === 'assistant')?.content ?? ''
}

function mapConversationToOutput(conversation: TestModelConversation): TestModelOutput {
  return {
    modelId: buildModelId(conversation.model_config),
    modelName: conversation.model_name,
    status: 'done',
    content: getLastAssistantMessage(conversation.messages),
    messages: conversation.messages,
    conversationId: conversation.id,
  }
}

function mapOptionToTestPanelModel(option: TestModelOption): TestPanelModel {
  return {
    id: option.id,
    name: option.name,
    model: option.model,
    baseUrl: option.baseUrl ?? '',
    provider: option.provider,
    isCustom: false,
  }
}

function mapCustomInputToTestPanelModel(input: CustomTestModelInput): TestPanelModel {
  const name = input.name.trim() || input.model.trim()
  const model = input.model.trim()
  const baseUrl = input.baseUrl.trim()

  return {
    id: buildModelId({ name, model, base_url: baseUrl }),
    name,
    model,
    baseUrl,
    apiKey: input.apiKey.trim(),
    isCustom: true,
  }
}

export function PromptDetail() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { getAccessToken } = useAuth()
  const { t, language } = useI18n()

  const isCreateMode = !id
  const initialMode: PageMode = isCreateMode || location.pathname.endsWith('/edit') ? 'edit' : 'view'

  const [mode, setMode] = useState<PageMode>(initialMode)
  const [loading, setLoading] = useState(!isCreateMode)
  const [error, setError] = useState<string | null>(null)
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [savingError, setSavingError] = useState<string | null>(null)
  const [isTagSaving, setIsTagSaving] = useState(false)

  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null)
  const [selectedVersionDetail, setSelectedVersionDetail] = useState<PromptVersion | null>(null)
  const [compareVersionForDiff, setCompareVersionForDiff] = useState<PromptVersion | null>(null)
  const [versionHistoryExpanded, setVersionHistoryExpanded] = useState(false)
  const [tagEditorOpen, setTagEditorOpen] = useState(false)
  const [tagDraft, setTagDraft] = useState('')
  const [tagsExpanded, setTagsExpanded] = useState(false)

  const [activePanel, setActivePanel] = useState<RightPanel>(null)

  const [optimizeRounds, setOptimizeRounds] = useState<PanelOptimizeRound[]>([])
  const [optimizeSuggestions, setOptimizeSuggestions] = useState<PanelOptimizeSuggestion[]>([])
  const [optimizeIdea, setOptimizeIdea] = useState('')
  const [selectedOptimizeSuggestions, setSelectedOptimizeSuggestions] = useState<Record<string, string[]>>({})
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizePreviewContent, setOptimizePreviewContent] = useState('')

  const [availableModels, setAvailableModels] = useState<TestModelOption[]>([])
  const [maxSelectedModels, setMaxSelectedModels] = useState(5)
  const [testModels, setTestModels] = useState<TestPanelModel[]>([])
  const [testUserInput, setTestUserInput] = useState('')
  const [testOutputs, setTestOutputs] = useState<TestModelOutput[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const [squareCategories, setSquareCategories] = useState<SquareCategory[]>([])
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false)
  const [isPublishingToSquare, setIsPublishingToSquare] = useState(false)

  const persistedSnapshotRef = useRef('')
  const editBaselineSnapshotRef = useRef('')
  const savedValuesRef = useRef({
    name: '',
    content: '',
    tags: [] as string[],
  })
  const optimizeAbortRef = useRef<AbortController | null>(null)
  const testControllersRef = useRef<Record<string, AbortController>>({})
  const tagEditorRef = useRef<HTMLDivElement | null>(null)
  const tagInputRef = useRef<HTMLInputElement | null>(null)
  const versionDockRef = useRef<HTMLDivElement | null>(null)

  const sortedVersions = useMemo(
    () => [...versions].sort((left, right) => right.version_number - left.version_number),
    [versions]
  )

  const currentVersion = useMemo(() => {
    if (sortedVersions.length === 0) return null
    if (activeVersionId) {
      return sortedVersions.find((item) => item.id === activeVersionId) ?? sortedVersions[0]
    }
    return sortedVersions[0]
  }, [activeVersionId, sortedVersions])

  const activeTestCount = useMemo(
    () => testOutputs.filter((item) => item.status === 'streaming').length,
    [testOutputs]
  )

  const tokenCount = useMemo(() => estimateTokens(content), [content])
  const isVersionSwitchBlocked = isOptimizing || activeTestCount > 0
  const displayedContent = optimizePreviewContent || (mode === 'edit' ? content : currentVersion?.content ?? content)
  const hasUnsavedChanges = mode === 'edit' && makeSnapshot(name, content, tags) !== editBaselineSnapshotRef.current
  const publishInitialPayload = useMemo<PublishPromptPayload>(() => ({
    title: name.trim() || prompt?.name || '',
    summary: makeSummary(prompt?.content || content || ''),
    category: squareCategories[0]?.key ?? 'general',
    difficulty: 'simple',
    recommended_models: [],
    allow_full_preview: false,
  }), [content, name, prompt, squareCategories])

  const syncPersistedEditorState = useCallback((nextName: string, nextContent: string, nextTags: string[]) => {
    const normalizedTags = normalizeTags(nextTags)
    const snapshot = makeSnapshot(nextName, nextContent, normalizedTags)
    persistedSnapshotRef.current = snapshot
    editBaselineSnapshotRef.current = snapshot
    savedValuesRef.current = {
      name: nextName,
      content: nextContent,
      tags: normalizedTags,
    }
  }, [])

  const applyPromptToState = useCallback((value: Prompt) => {
    setPrompt(value)
    setName(value.name)
    setContent(value.content)
    setTags(value.tags.map((tag) => tag.name))
    setTagsExpanded(false)
    setSavingState('idle')
    setSavingError(null)

    syncPersistedEditorState(value.name, value.content, value.tags.map((tag) => tag.name))
  }, [syncPersistedEditorState])

  const loadVersions = useCallback(async (promptId: string, preferredVersionId?: string | null) => {
    const token = await getAccessToken()
    if (!token) throw new Error(t('promptEditor.notLoggedIn'))

    const response = await getPromptVersions(token, promptId)
    const list = response.versions
    const sorted = [...list].sort((left, right) => right.version_number - left.version_number)
    setVersions(sorted)
    setActiveVersionId((previous) => {
      if (preferredVersionId && sorted.some((item) => item.id === preferredVersionId)) {
        return preferredVersionId
      }
      if (previous && sorted.some((item) => item.id === previous)) {
        return previous
      }
      return sorted[0]?.id ?? null
    })
    return sorted
  }, [getAccessToken, t])

  const loadOptimizationRounds = useCallback(async (promptId: string) => {
    const token = await getAccessToken()
    if (!token) throw new Error(t('promptEditor.notLoggedIn'))

    const session = await getOptimizationSession(token, promptId)
    const rounds = [...session.rounds]
      .sort((left, right) => right.round_number - left.round_number)
      .map(mapRoundToPanelRound)
    setOptimizeRounds(rounds)
    setOptimizeSuggestions(rounds[0]?.suggestions ?? [])
    setSelectedOptimizeSuggestions(rounds[0]?.selectedSuggestions ?? {})
    return rounds
  }, [getAccessToken, t])

  const loadTestConversation = useCallback(async (versionId: string) => {
    const token = await getAccessToken()
    if (!token) throw new Error(t('promptEditor.notLoggedIn'))

    const session = await getTestSession(token, versionId)
    setTestOutputs(session.conversations.map(mapConversationToOutput))
    return session.conversations
  }, [getAccessToken, t])

  const loadAvailableModelOptions = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) throw new Error(t('promptEditor.notLoggedIn'))

    const response = await getAvailableModels(token)
    const options: TestModelOption[] = response.items.map((item) => ({
      id: buildModelId(item),
      name: item.name,
      model: item.model,
      provider: item.base_url,
      baseUrl: item.base_url,
      description: item.params && Object.keys(item.params).length > 0 ? JSON.stringify(item.params) : undefined,
    }))
    setAvailableModels(options)
    setMaxSelectedModels(response.max_concurrent_test_models)
    setTestModels((previous) => {
      const preservedPresetModels = previous
        .filter((item) => !item.isCustom)
        .map((item) => options.find((option) => option.id === item.id))
        .filter((item): item is TestModelOption => !!item)
        .map(mapOptionToTestPanelModel)
      const preservedCustomModels = previous.filter((item) => item.isCustom)
      const preservedModels = [...preservedPresetModels, ...preservedCustomModels]

      if (preservedModels.length > 0) {
        return preservedModels.slice(0, response.max_concurrent_test_models)
      }

      return options
        .slice(0, Math.min(1, response.max_concurrent_test_models))
        .map(mapOptionToTestPanelModel)
    })
  }, [getAccessToken, t])

  const loadSquareCategories = useCallback(async () => {
    const categories = await fetchSquareCategories()
    setSquareCategories(categories)
    return categories
  }, [])

  const loadPrompt = useCallback(async (promptId: string, preferredVersionId?: string | null) => {
    setLoading(true)
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) throw new Error(t('promptEditor.notLoggedIn'))

      const value = await fetchPrompt(token, promptId)
      applyPromptToState(value)
      const loadedVersions = await loadVersions(promptId, preferredVersionId)
      await loadOptimizationRounds(promptId)

      const versionId = preferredVersionId
        ?? loadedVersions[0]?.id

      if (versionId) {
        await loadTestConversation(versionId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('promptEditor.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [applyPromptToState, getAccessToken, loadOptimizationRounds, loadTestConversation, loadVersions, t])

  useEffect(() => {
    if (isCreateMode) {
      setLoading(false)
      return
    }

    if (id) {
      loadPrompt(id)
      loadAvailableModelOptions().catch((err) => {
        console.error(err)
      })
    }
  }, [id, isCreateMode, loadAvailableModelOptions, loadPrompt])

  useEffect(() => {
    if (!tagEditorOpen) return
    window.setTimeout(() => {
      tagInputRef.current?.focus()
    }, 0)
  }, [tagEditorOpen])

  useEffect(() => {
    if (!tagEditorOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (tagEditorRef.current?.contains(event.target as Node)) {
        return
      }
      handleCloseTagEditor()
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [tagEditorOpen])

  useEffect(() => {
    if (!versionHistoryExpanded) return
    if (compareVersionForDiff) return

    const handlePointerDown = (event: MouseEvent) => {
      if (versionDockRef.current?.contains(event.target as Node)) {
        return
      }
      setVersionHistoryExpanded(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [compareVersionForDiff, versionHistoryExpanded])

  useEffect(() => {
    setMode(isCreateMode || location.pathname.endsWith('/edit') ? 'edit' : 'view')
  }, [isCreateMode, location.pathname])

  useEffect(() => {
    const panel = new URLSearchParams(location.search).get('panel')
    if (panel === 'test' || panel === 'optimize') {
      setActivePanel(panel)
    }
  }, [location.search])

  useEffect(() => {
    return () => {
      optimizeAbortRef.current?.abort()
      Object.values(testControllersRef.current).forEach((controller) => controller.abort())
    }
  }, [])

  useEffect(() => {
    if (!currentVersion || activePanel !== 'test' || isTesting) {
      return
    }

    loadTestConversation(currentVersion.id).catch((err) => {
      console.error(err)
    })
  }, [activePanel, currentVersion, isTesting, loadTestConversation])

  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!name.trim()) {
      setError(t('promptEditor.nameRequired'))
      return
    }

    if (!content.trim()) {
      setError(t('promptEditor.contentRequired'))
      return
    }

    setSavingState('saving')
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) throw new Error(t('promptEditor.notLoggedIn'))

      const payload: CreatePromptData = {
        name: name.trim(),
        content: content.trim(),
        tag_names: tags.length > 0 ? tags : undefined,
      }

      await createPrompt(token, payload)
      toast.success(t('promptEditor.created'))
      navigate('/prompts')
    } catch (err) {
      const message = err instanceof Error ? err.message : t('promptEditor.createFailed')
      setError(message)
      toast.error(message)
    } finally {
      setSavingState('idle')
    }
  }

  const handleCancelCreate = () => {
    navigate('/prompts')
  }

  const handleEnterEdit = () => {
    const baseContent = currentVersion?.content ?? prompt?.content ?? content
    const normalizedName = name.trim()
    const normalizedTags = tags.map((tag) => tag.trim()).filter(Boolean)

    setName(normalizedName)
    setContent(baseContent)
    setTags(normalizedTags)
    savedValuesRef.current = {
      name: normalizedName,
      content: baseContent,
      tags: normalizedTags,
    }
    editBaselineSnapshotRef.current = makeSnapshot(normalizedName, baseContent, normalizedTags)
    setMode('edit')
    setSavingState('idle')
    setSavingError(null)
    navigate(`/prompts/${id}/edit`, { replace: true })
  }

  const handleExitEdit = () => {
    setName(savedValuesRef.current.name)
    setContent(savedValuesRef.current.content)
    setTags([...savedValuesRef.current.tags])
    setMode('view')
    setSavingState('idle')
    setSavingError(null)
    setTagEditorOpen(false)
    if (id) {
      navigate(`/prompts/${id}`, { replace: true })
    }
  }

  const handleSaveEdit = async () => {
    if (!id || !prompt) return

    if (!name.trim()) {
      setSavingState('error')
      setSavingError(t('promptEditor.nameRequired'))
      return
    }

    if (!content.trim()) {
      setSavingState('error')
      setSavingError(t('promptEditor.contentRequired'))
      return
    }

    if (!hasUnsavedChanges) {
      setMode('view')
      setSavingState('idle')
      setSavingError(null)
      navigate(`/prompts/${id}`, { replace: true })
      return
    }

    try {
      const token = await getAccessToken()
      if (!token) throw new Error(t('promptEditor.notLoggedIn'))

      setSavingState('saving')
      setSavingError(null)

      const normalizedName = name.trim()
      const normalizedContent = content.trim()
      const normalizedTags = normalizeTags(tags)
      const contentChanged = normalizedContent !== savedValuesRef.current.content.trim()

      const updateData: UpdatePromptData = {
        name: normalizedName,
        content: normalizedContent,
        tag_names: normalizedTags,
        change_note: contentChanged && currentVersion
          ? t('promptEditor.editSaveNote', { version: currentVersion.version_number })
          : undefined,
      }

      await updatePrompt(token, id, updateData)
      await loadPrompt(id)

      setMode('view')
      setSavingState('saved')
      setSavingError(null)
      navigate(`/prompts/${id}`, { replace: true })
      toast.success(contentChanged ? t('promptEditor.saveWithVersion') : t('promptEditor.saved'))
    } catch (err) {
      const message = err instanceof Error ? err.message : t('promptEditor.saveFailed')
      setSavingState('error')
      setSavingError(message)
      toast.error(message)
    }
  }

  const handleSetActiveVersion = (versionId: string) => {
    if (isVersionSwitchBlocked) {
      toast.error(t('promptEditor.switchVersionBlocked'))
      return
    }
    setActiveVersionId(versionId)
  }

  const handleRestoreVersion = async (version: PromptVersion) => {
    if (!id || isVersionSwitchBlocked) {
      toast.error(t('promptEditor.restoreVersionBlocked'))
      return
    }

    const shouldRestore = window.confirm(
      t('promptEditor.restoreVersionConfirm', { version: version.version_number }),
    )
    if (!shouldRestore) return

    try {
      const token = await getAccessToken()
      if (!token) throw new Error(t('promptEditor.notLoggedIn'))

      await restoreVersion(token, id, version.id)
      toast.success(t('promptEditor.restored', { version: version.version_number }))
      await loadPrompt(id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('promptEditor.restoreFailed'))
    }
  }

  const handleStartOptimize = async () => {
    if (!id || !currentVersion || isOptimizing) return

    try {
      const token = await getAccessToken()
      if (!token) throw new Error(t('promptEditor.notLoggedIn'))

      setIsOptimizing(true)
      setOptimizePreviewContent('')
      optimizeAbortRef.current?.abort()
      const controller = new AbortController()
      optimizeAbortRef.current = controller

      const selectedMap = Object.entries(selectedOptimizeSuggestions).reduce<Record<string, string[]>>((acc, [question, options]) => {
        if (options.length > 0) {
          acc[question] = options
        }
        return acc
      }, {})

      let savedVersionId: string | null = null
      let optimizedContent = ''
      const connection = startOptimizeStream(
        token,
        id,
        currentVersion.id,
        {
          user_idea: optimizeIdea.trim() || undefined,
          selected_suggestions: Object.keys(selectedMap).length > 0 ? selectedMap : undefined,
        },
        (event) => {
          switch (event.type) {
            case 'content':
              optimizedContent += event.data
              setOptimizePreviewContent((previous) => previous + event.data)
              break
            case 'suggestions':
              setOptimizeSuggestions(
                event.data.questions.map((item, index) => mapSuggestion(item.question, item.options, `live-${index}-`))
              )
              break
            case 'version_saved':
              savedVersionId = event.data.version_id
              break
            case 'error':
              throw new Error(event.data.message)
          }
        },
        controller
      )

      await connection.done
      await loadPrompt(id, savedVersionId)

      if (mode === 'edit' && optimizedContent.trim()) {
        setContent(optimizedContent)
        setPrompt((previous) => (previous ? { ...previous, content: optimizedContent } : previous))
        syncPersistedEditorState(name, optimizedContent, tags)
        setSavingState('saved')
      }

      setOptimizeIdea('')
      setSelectedOptimizeSuggestions({})
      setOptimizePreviewContent('')
      toast.success(t('promptEditor.optimized'))
    } catch (err) {
      const message = err instanceof Error ? err.message : t('promptEditor.optimizeFailed')
      toast.error(message)
    } finally {
      setIsOptimizing(false)
      optimizeAbortRef.current = null
    }
  }

  const handleOpenOptimize = () => {
    setActivePanel('optimize')
  }

  const handleOpenTest = async () => {
    setActivePanel('test')
    if (!currentVersion) return

    try {
      await loadAvailableModelOptions()
      await loadTestConversation(currentVersion.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('promptEditor.loadTestFailed'))
    }
  }

  const handleCopyPromptContent = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable')
      }

      await navigator.clipboard.writeText(mode === 'edit' ? content : displayedContent)
      toast.success(t('promptEditor.copied'))
    } catch {
      toast.error(t('promptEditor.copyFailed'))
    }
  }

  const handleOpenPublishDialog = async () => {
    if (isCreateMode || mode !== 'view' || !prompt || isPublishingToSquare) return

    try {
      if (squareCategories.length === 0) {
        await loadSquareCategories()
      }
      setIsPublishDialogOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('promptEditor.publishFailed'))
    }
  }

  const handlePublishToSquare = async (payload: PublishPromptPayload) => {
    if (!id || !prompt || isPublishingToSquare) return

    try {
      const token = await getAccessToken()
      if (!token) throw new Error(t('promptEditor.notLoggedIn'))

      setIsPublishingToSquare(true)
      const entry = await publishPromptToSquare(token, id, payload)

      toast.success(t('promptEditor.publishedToSquare'))
      setIsPublishDialogOpen(false)
      navigate(`/square/${entry.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('promptEditor.publishFailed'))
    } finally {
      setIsPublishingToSquare(false)
    }
  }

  const handleAddPresetTestModel = (optionId: string) => {
    const option = availableModels.find((item) => item.id === optionId)
    if (!option) return

    setTestModels((previous) => {
      if (previous.some((item) => item.id === option.id)) {
        return previous
      }

      if (maxSelectedModels && previous.length >= maxSelectedModels) {
        toast.error(t('promptEditor.maxModels', { count: maxSelectedModels }))
        return previous
      }

      return [...previous, mapOptionToTestPanelModel(option)]
    })
  }

  const handleAddCustomTestModel = (input: CustomTestModelInput) => {
    const nextModel = mapCustomInputToTestPanelModel(input)

    setTestModels((previous) => {
      if (previous.some((item) => item.id === nextModel.id)) {
        toast.error(t('promptEditor.duplicateModel'))
        return previous
      }

      if (maxSelectedModels && previous.length >= maxSelectedModels) {
        toast.error(t('promptEditor.maxModels', { count: maxSelectedModels }))
        return previous
      }

      return [...previous, nextModel]
    })
  }

  const handleRemoveTestModel = (modelId: string) => {
    if (isTesting) {
      toast.error(t('promptEditor.removeModelBlocked'))
      return
    }

    setTestModels((previous) => previous.filter((item) => item.id !== modelId))
    setTestOutputs((previous) => previous.filter((item) => item.modelId !== modelId))
  }

  const handleSendTest = async () => {
    if (!currentVersion || testModels.length === 0 || !testUserInput.trim() || isTesting) return

    try {
      const token = await getAccessToken()
      if (!token) throw new Error(t('promptEditor.notLoggedIn'))

      setIsTesting(true)
      const conversationMap = new Map<string, TestModelOutput>()
      testOutputs.forEach((output) => conversationMap.set(output.modelId, output))
      let hasStreamError = false
      let firstErrorMessage = ''

      testModels.forEach((model) => {
        setTestOutputs((previous) => {
          const remaining = previous.filter((item) => item.modelId !== model.id)
          const current = conversationMap.get(model.id)
          return [
            ...remaining,
            {
              modelId: model.id,
              modelName: model.name,
              status: 'streaming',
              content: '',
              messages: current?.messages ?? [],
              conversationId: current?.conversationId,
              error: undefined,
            },
          ]
        })
      })

      const tasks = testModels.map(async (model) => {
        const controller = new AbortController()
        testControllersRef.current[model.id] = controller

        const modelConfig: ModelConfig = {
          name: model.name,
          base_url: model.baseUrl,
          model: model.model,
          ...(model.apiKey ? { api_key: model.apiKey } : {}),
        }

        const connection = startTestStream(
          token,
          currentVersion.id,
          {
            model: modelConfig,
            user_prompt: testUserInput.trim(),
            continue: true,
          },
          (event) => {
            setTestOutputs((previous) => previous.map((item) => {
              if (item.modelId !== model.id) return item

              if (event.type === 'conversation_id') {
                return {
                  ...item,
                  conversationId: event.data.conversation_id,
                }
              }

              if (event.type === 'content') {
                return {
                  ...item,
                  content: `${item.content}${event.data}`,
                  status: 'streaming',
                }
              }

              if (event.type === 'complete') {
                return {
                  ...item,
                  status: 'done',
                }
              }

              if (event.type === 'error') {
                hasStreamError = true
                if (!firstErrorMessage) {
                  firstErrorMessage = event.data.message
                }
                return {
                  ...item,
                  status: 'error',
                  error: event.data.message,
                }
              }

              return item
            }))
          },
          controller
        )

        try {
          await connection.done
        } catch (err) {
          const message = err instanceof Error ? err.message : t('promptEditor.testFailed')
          hasStreamError = true
          if (!firstErrorMessage) {
            firstErrorMessage = message
          }
          setTestOutputs((previous) => previous.map((item) => (
            item.modelId === model.id
              ? {
                  ...item,
                  status: 'error',
                  error: message,
                }
              : item
          )))
        }
      })

      await Promise.all(tasks)

      if (!hasStreamError) {
        await loadTestConversation(currentVersion.id)
        toast.success(t('promptEditor.testCompleted'))
      } else {
        toast.error(firstErrorMessage || t('promptEditor.testFailed'))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('promptEditor.testFailed'))
    } finally {
      Object.values(testControllersRef.current).forEach((controller) => controller.abort())
      testControllersRef.current = {}
      setIsTesting(false)
    }
  }

  const latestRound = optimizeRounds[0]
  const visibleTags = normalizeTags(tags)
  const hiddenTags = visibleTags.slice(3)
  const collapsedTagPreview = hiddenTags[0]
  const displayedTags = tagsExpanded ? visibleTags : visibleTags.slice(0, 3)

  const persistTags = useCallback(async (nextTags: string[]) => {
    if (!id || !prompt || isTagSaving) return false

    try {
      const token = await getAccessToken()
      if (!token) throw new Error(t('promptEditor.notLoggedIn'))

      setIsTagSaving(true)
      setSavingError(null)

      const normalizedTags = normalizeTags(nextTags)
      const updatedPrompt = await updatePrompt(token, id, {
        name: name.trim() || prompt.name,
        content: prompt.content,
        tag_names: normalizedTags,
      })

      applyPromptToState(updatedPrompt)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : t('promptEditor.updateTagsFailed')
      toast.error(message)
      return false
    } finally {
      setIsTagSaving(false)
    }
  }, [applyPromptToState, getAccessToken, id, isTagSaving, name, prompt, t])

  const handleToggleTagEditor = () => {
    setTagEditorOpen((previous) => !previous)
  }

  const handleToggleTagsExpanded = () => {
    setTagsExpanded((previous) => !previous)
  }

  const handleCloseTagEditor = () => {
    setTagEditorOpen(false)
    setTagDraft('')
  }

  const handleAddTag = async () => {
    if (isTagSaving) return

    const trimmed = tagDraft.trim()
    if (!trimmed) return

    if (tags.includes(trimmed)) {
      setTagDraft('')
      return
    }

    const previousTags = [...visibleTags]
    const nextTags = [...previousTags, trimmed]

    setTags(nextTags)
    setTagsExpanded(true)
    setTagDraft('')

    if (mode === 'edit') {
      window.setTimeout(() => {
        tagInputRef.current?.focus()
      }, 0)
      return
    }

    const saved = await persistTags(nextTags)
    if (!saved) {
      setTags(previousTags)
      window.setTimeout(() => {
        tagInputRef.current?.focus()
      }, 0)
      return
    }

    handleCloseTagEditor()
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    if (isTagSaving) return

    const previousTags = [...visibleTags]
    const nextTags = previousTags.filter((tag) => tag !== tagToRemove)

    setTags(nextTags)
    if (nextTags.length <= 3) {
      setTagsExpanded(false)
    }

    if (mode === 'edit') {
      return
    }

    const saved = await persistTags(nextTags)
    if (!saved) {
      setTags(previousTags)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <Loading text={t('promptEditor.loading')} />
        </div>
      </Layout>
    )
  }

  if (isCreateMode) {
    return (
      <Layout>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(540px,1.08fr)]">
          <section className="create-showcase rounded-[34px] p-6 sm:p-8">
            <div className="flex h-full flex-col justify-between gap-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/74 px-4 py-2 text-sm text-ink-700 shadow-[0_18px_36px_-28px_rgba(31,41,55,0.45)] backdrop-blur-xl">
                  <img src="/logo.svg" alt="Ink & Prompt" className="h-5 w-5" />
                  <span>{t('landing.steps.title')}</span>
                </div>
                <div>
                  <p className="landing-section-kicker">{t('promptEditor.createTitle')}</p>
                  <h1 className="landing-display-title mt-4 text-4xl font-semibold leading-[1.06] text-ink-900 sm:text-5xl">
                    {t('promptEditor.createTitle')}
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-ink-600 sm:text-base">
                    {t('promptEditor.createDescription')}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    t('landing.hero.pills', { returnObjects: true }) as string[]
                  ).map((pill) => (
                    <div
                      key={pill}
                      className="landing-pill inline-flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium text-ink-700"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#ece7ff] text-[#4f46e5]">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5 13 4 4L19 7" />
                        </svg>
                      </span>
                      <span>{pill}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="create-showcase-note rounded-[28px] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-400">
                  {t('common.label.workflow')}
                </div>
                <div className="mt-3 space-y-3 text-sm leading-7 text-ink-700">
                  <div>{t('promptEditor.createButton')}</div>
                  <div>{t('promptEditor.optimize')}</div>
                  <div>{t('promptEditor.test')}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="create-form-shell rounded-[34px] p-6 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="landing-section-kicker">{t('common.appName')}</p>
                <h2 className="mt-3 text-3xl font-semibold text-ink-900">{t('promptEditor.createTitle')}</h2>
              </div>
              <button onClick={handleCancelCreate} className="icon-button" type="button">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              {error && <ErrorMessage message={error} />}

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">{t('promptEditor.nameLabel')}</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="input h-12"
                  placeholder={t('promptEditor.namePlaceholder')}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-ink-700">{t('promptEditor.contentLabel')}</label>
                  <span className="rounded-full border border-[rgba(122,102,82,0.12)] bg-white/78 px-3 py-1 text-xs text-ink-500">
                    {tokenCount} {t('common.tokens')}
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  className="input min-h-[360px] font-mono text-sm"
                  placeholder={t('promptEditor.contentPlaceholder')}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">{t('promptEditor.tagsLabel')}</label>
                <TagInput value={tags} onChange={setTags} placeholder={t('promptEditor.tagsPlaceholder')} />
              </div>

              <div className="flex flex-col gap-3 border-t border-[rgba(122,102,82,0.12)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={handleCancelCreate} className="btn btn-secondary">
                  {t('common.action.cancel')}
                </button>
                <button type="submit" className="landing-hero-primary inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-white" disabled={savingState === 'saving'}>
                  {savingState === 'saving' ? t('promptEditor.creating') : t('promptEditor.createButton')}
                </button>
              </div>
            </form>
          </section>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl py-8">
          <ErrorMessage message={error} onRetry={() => id && loadPrompt(id)} />
        </div>
      </Layout>
    )
  }

  return (
      <Layout>
      <div className={`workbench-page grid gap-6 pb-4 ${activePanel ? 'xl:grid-cols-[minmax(0,1.06fr)_minmax(420px,0.94fr)] xl:items-start' : 'grid-cols-1'}`}>
        <div className={`workbench-column flex flex-col ${activePanel ? 'xl:sticky xl:top-24 xl:self-start' : ''}`}>
          <section className={`workbench-shell workbench-main flex flex-col ${activePanel ? 'xl:h-[calc(100dvh-7rem)] xl:min-h-[calc(100dvh-7rem)]' : ''}`}>
            <div className="workbench-core flex h-full flex-col">
            <div className="workbench-header">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {mode === 'edit' ? (
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="input h-11 text-base font-semibold tracking-tight text-ink-900"
                        placeholder={t('promptEditor.nameLabel')}
                      />
                    ) : (
                      <h1 className="flex h-11 items-center text-base font-semibold tracking-tight text-ink-900">
                        {name || t('common.untitledPrompt')}
                      </h1>
                    )}
                    <p className="workbench-subtitle">
                      {currentVersion
                        ? formatFullDate(currentVersion.created_at, language)
                        : t('common.appFooterTagline')}
                    </p>
                    {prompt?.source_square_entry_id ? (
                      <div className="mt-3 rounded-[22px] border border-[rgba(79,70,229,0.14)] bg-[rgba(79,70,229,0.05)] px-4 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4f46e5]">
                              {t('promptEditor.squareSourceBadge')}
                            </div>
                            <p className="mt-1 text-sm leading-6 text-ink-700">
                              {t(
                                activePanel === 'test'
                                  ? 'promptEditor.squareSourceTesting'
                                  : 'promptEditor.squareSourceDescription',
                                {
                                  title: prompt.source_square_title || prompt.name,
                                },
                              )}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate(`/square/${prompt.source_square_entry_id}`)}
                            className="btn btn-secondary btn-small"
                          >
                            {t('promptEditor.viewSquareSource')}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleOpenOptimize}
                      className={`btn ${activePanel === 'optimize' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {t('promptEditor.optimize')}
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenTest}
                      className={`btn ${activePanel === 'test' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {t('promptEditor.test')}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPromptContent}
                      className="icon-button"
                      title={t('promptEditor.copy')}
                      aria-label={t('promptEditor.copy')}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-2m-4 4H6a2 2 0 01-2-2V9a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    {!isCreateMode && mode === 'view' ? (
                      <button
                        type="button"
                        onClick={() => void handleOpenPublishDialog()}
                        className="btn btn-secondary"
                        disabled={isPublishingToSquare}
                      >
                        {isPublishingToSquare ? t('promptEditor.publishingToSquare') : t('promptEditor.publishToSquare')}
                      </button>
                    ) : null}
                    {mode === 'edit' ? (
                      <>
                        <button type="button" onClick={handleExitEdit} className="btn btn-secondary">
                          {t('common.action.cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="btn btn-primary"
                          disabled={savingState === 'saving' || !hasUnsavedChanges}
                        >
                          {savingState === 'saving' ? t('promptEditor.saving') : t('common.action.save')}
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={handleEnterEdit} className="icon-button" title={t('promptEditor.enterEdit')}>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                </div>
              </div>

                <div className="workbench-metrics">
                  {displayedTags.map((tag) => (
                    <span key={tag} className="badge badge-user group relative pr-7">
                      {tag}
                      <button
                        type="button"
                        onClick={() => void handleRemoveTag(tag)}
                        className="absolute right-1.5 top-1/2 inline-flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white/90 opacity-0 transition-all duration-150 hover:bg-white/30 hover:text-white focus-visible:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0"
                        title={t('promptEditor.removeTag', { tag })}
                        aria-label={t('promptEditor.removeTag', { tag })}
                        disabled={isTagSaving}
                      >
                        <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                  {!tagsExpanded && collapsedTagPreview ? (
                    <button
                      type="button"
                      onClick={handleToggleTagsExpanded}
                      className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-ink-200/80 bg-white/55 px-3 py-1 text-[11px] font-semibold text-ink-600 shadow-sm backdrop-blur-sm transition-all hover:border-ink-300 hover:bg-white/75 hover:text-ink-800"
                      title={t('promptEditor.expandTags', { count: hiddenTags.length })}
                      aria-label={t('promptEditor.expandTags', { count: hiddenTags.length })}
                    >
                      <span className="max-w-[7rem] truncate opacity-70 blur-[0.2px]">
                        {collapsedTagPreview}
                      </span>
                      <span className="rounded-full bg-white/75 px-2 py-0.5 text-[10px] font-semibold text-ink-500">
                        +{hiddenTags.length}
                      </span>
                      <svg className="h-3.5 w-3.5 text-ink-400 transition-colors group-hover:text-ink-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  ) : null}
                  {tagsExpanded && hiddenTags.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleToggleTagsExpanded}
                      className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white/70 px-3 py-1 text-[11px] font-semibold text-ink-600 transition-all hover:border-ink-300 hover:bg-white hover:text-ink-900"
                      title={t('promptEditor.collapseTags')}
                      aria-label={t('promptEditor.collapseTags')}
                    >
                      {t('promptEditor.collapse')}
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  ) : null}
                  {tagEditorOpen ? (
                    <div ref={tagEditorRef} className="tag-inline-editor">
                      <input
                        ref={tagInputRef}
                        value={tagDraft}
                        onChange={(event) => setTagDraft(event.target.value)}
                        disabled={isTagSaving}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            void handleAddTag()
                          } else if (event.key === 'Escape') {
                            event.preventDefault()
                            handleCloseTagEditor()
                          }
                        }}
                        className="tag-inline-input"
                        placeholder={t('promptEditor.tagNamePlaceholder')}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleToggleTagEditor}
                      className="tag-add-button"
                      title={t('promptEditor.addTag')}
                      disabled={isTagSaving}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" />
                      </svg>
                    </button>
                  )}
                  {isTagSaving && <span className="status-pill bg-amber-100 text-amber-800">{t('common.status.tagSaving')}</span>}
                  {isVersionSwitchBlocked && <span className="status-pill bg-amber-100 text-amber-800">{t('common.status.processing')}</span>}
                  {mode === 'edit' && hasUnsavedChanges && savingState !== 'saving' && (
                    <span className="status-pill bg-slate-100 text-slate-700">{t('common.status.unsaved')}</span>
                  )}
                  {savingState === 'saving' && <span className="status-pill bg-amber-100 text-amber-800">{t('common.status.saving')}</span>}
                  {savingState === 'saved' && <span className="status-pill bg-emerald-100 text-emerald-800">{t('common.status.saved')}</span>}
                  {savingState === 'error' && <span className="status-pill bg-rose-100 text-rose-800">{t('common.status.saveFailed')}</span>}
                </div>
              </div>
            </div>

            <div className={`workspace-body workbench-content flex flex-1 min-h-0 flex-col ${activePanel ? 'xl:flex-1 xl:min-h-0' : ''}`}>
              {savingError && mode === 'edit' && (
                <div className="mb-4">
                  <ErrorMessage message={savingError} />
                </div>
              )}

              {mode === 'edit' ? (
                <div className="workspace-stack flex flex-1 min-h-0">
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    className="input editor-frame h-full flex-1 font-mono text-sm"
                    placeholder={t('promptEditor.contentPlaceholder')}
                  />
                </div>
              ) : (
                <div className="workspace-stack flex flex-1 min-h-0">
                  <div className="workspace-paper prompt-workspace flex flex-1 flex-col">
                    <div className="prompt-preview flex-1">
                      <MarkdownRenderer content={displayedContent} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={versionDockRef} className="version-dock">
              {versionHistoryExpanded && (
                <div className="version-dock-history px-4 py-4">
                  {sortedVersions.length === 0 ? (
                    <div className="panel-empty">
                      <p className="text-sm font-medium text-ink-700">{t('promptEditor.emptyVersions')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sortedVersions.map((version) => {
                        const isCurrent = version.id === currentVersion?.id

                        return (
                          <article
                            key={version.id}
                            onClick={() => !isVersionSwitchBlocked && handleSetActiveVersion(version.id)}
                            className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-5 py-3.5 transition-all ${
                              isCurrent
                                ? 'border-indigo-300 bg-indigo-50/75 shadow-soft'
                                : 'border-ink-200 bg-white/80 hover:border-ink-300 hover:shadow-soft'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`text-sm font-bold ${isCurrent ? 'text-indigo-600' : 'text-ink-900'}`}>
                                v{version.version_number}
                              </span>
                              <span className="text-xs text-ink-500">
                                {formatFullDate(version.created_at, language)}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-xs font-medium text-ink-500">
                                {t('promptEditor.versionTokenCount', { count: version.token_count })}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCompareVersionForDiff(version)
                                }}
                                className="btn btn-ghost btn-small"
                              >
                                {t('promptEditor.compare')}
                              </button>
                              {!isCurrent && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRestoreVersion(version)
                                  }}
                                  className="btn btn-secondary btn-small"
                                  disabled={isVersionSwitchBlocked}
                                >
                                  {t('promptEditor.restore')}
                                </button>
                              )}
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="workspace-toolbar version-dock-toolbar border-t-0">
                <div className="toolbar-cluster">
                  <span className="metric-chip">{estimateTokens(displayedContent)} {t('common.tokens')}</span>
                  {isOptimizing && optimizePreviewContent ? <span className="status-pill status-pill-active">{t('common.status.previewing')}</span> : null}
                </div>
                <div className="toolbar-cluster">
                  <button
                    type="button"
                    onClick={() => setVersionHistoryExpanded((previous) => !previous)}
                    className={`btn ${
                      versionHistoryExpanded
                        ? 'border border-indigo-300 bg-indigo-50/85 text-indigo-700 shadow-soft hover:bg-indigo-100'
                        : 'btn-secondary'
                    }`}
                    aria-label={versionHistoryExpanded ? t('promptEditor.collapseTags') : t('promptEditor.versionButton')}
                  >
                    {currentVersion
                      ? t('promptEditor.viewVersion', { version: currentVersion.version_number })
                      : t('promptEditor.versionButton')}
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            </div>
          </section>
        </div>

        {activePanel === 'optimize' && (
          <aside className="self-start xl:sticky xl:top-24 xl:h-[calc(100dvh-7rem)]">
            <OptimizePanel
              promptName={name || t('common.untitledPrompt')}
              currentContent={displayedContent}
              rounds={optimizeRounds}
              suggestions={optimizeSuggestions}
              userIdea={optimizeIdea}
              selectedSuggestions={selectedOptimizeSuggestions}
              isOptimizing={isOptimizing}
              onClose={() => setActivePanel(null)}
              onUserIdeaChange={setOptimizeIdea}
              onToggleSuggestionOption={(question, option) => {
                setSelectedOptimizeSuggestions((previous) => {
                  const current = previous[question] ?? []
                  const next = current.includes(option)
                    ? current.filter((item) => item !== option)
                    : [...current, option]

                  if (next.length === 0) {
                    const nextSelections = { ...previous }
                    delete nextSelections[question]
                    return nextSelections
                  }

                  return {
                    ...previous,
                    [question]: next,
                  }
                })
              }}
              onStartOptimize={handleStartOptimize}
              onReset={() => {
                setOptimizeIdea('')
                setSelectedOptimizeSuggestions({})
                setOptimizeSuggestions(latestRound?.suggestions ?? [])
              }}
            />
          </aside>
        )}

        {activePanel === 'test' && (
          <aside className="self-start xl:sticky xl:top-24 xl:h-[calc(100dvh-7rem)]">
            <TestPanel
              models={availableModels}
              testModels={testModels}
              outputs={testOutputs.filter((item) => testModels.some((model) => model.id === item.modelId))}
              userInput={testUserInput}
              maxSelectedModels={maxSelectedModels}
              isSending={isTesting}
              onClose={() => setActivePanel(null)}
              onAddPresetModel={handleAddPresetTestModel}
              onAddCustomModel={handleAddCustomTestModel}
              onRemoveModel={handleRemoveTestModel}
              onUserInputChange={setTestUserInput}
              onSend={handleSendTest}
              onClear={() => setTestUserInput('')}
            />
          </aside>
        )}
      </div>

      <PublishToSquareDialog
        isOpen={isPublishDialogOpen}
        categories={squareCategories}
        initialPayload={publishInitialPayload}
        isSubmitting={isPublishingToSquare}
        onClose={() => setIsPublishDialogOpen(false)}
        onConfirm={(payload) => {
          void handlePublishToSquare(payload)
        }}
      />

      <VersionDetailDialog
        version={selectedVersionDetail}
        isOpen={!!selectedVersionDetail}
        onClose={() => setSelectedVersionDetail(null)}
        onRestore={handleRestoreVersion}
      />

      <VersionDiffDialog
        isOpen={!!compareVersionForDiff}
        baseVersion={currentVersion}
        compareVersion={compareVersionForDiff}
        onClose={() => setCompareVersionForDiff(null)}
      />
    </Layout>
  )
}

export function PromptEditor() {
  return <PromptDetail />
}

import { apiRequest, getAuthHeaders } from './client'
import type {
  PublishPromptPayload,
  SquareActionResponse,
  SquareCategory,
  SquareCopyResponse,
  SquareEntry,
  SquareListFilters,
  SquareListResponse,
  SquareTagSummary,
} from '@/types/square'

export async function fetchSquareEntries(
  filters: SquareListFilters = {},
  token?: string | null,
): Promise<SquareListResponse> {
  const params = new URLSearchParams()

  if (filters.page) params.append('page', String(filters.page))
  if (filters.page_size) params.append('page_size', String(filters.page_size))
  if (filters.search) params.append('search', filters.search)
  if (filters.category) params.append('category', filters.category)
  if (filters.difficulty) params.append('difficulty', filters.difficulty)
  if (filters.tag) params.append('tag', filters.tag)
  if (filters.recommended_model) params.append('recommended_model', filters.recommended_model)
  if (filters.sort_by) params.append('sort_by', filters.sort_by)

  const query = params.toString()
  const endpoint = `/api/square/entries${query ? `?${query}` : ''}`

  return apiRequest<SquareListResponse>(endpoint, {
    headers: getAuthHeaders(token ?? null),
  })
}

export async function fetchSquareEntry(
  entryId: string,
  token?: string | null,
): Promise<SquareEntry> {
  return apiRequest<SquareEntry>(`/api/square/entries/${entryId}`, {
    headers: getAuthHeaders(token ?? null),
  })
}

export async function fetchSquareCategories(): Promise<SquareCategory[]> {
  return apiRequest<SquareCategory[]>('/api/square/categories')
}

export async function fetchSquarePopularTags(limit = 12): Promise<SquareTagSummary[]> {
  return apiRequest<SquareTagSummary[]>(`/api/square/tags/popular?limit=${limit}`)
}

export async function toggleSquareLike(token: string, entryId: string): Promise<SquareActionResponse> {
  return apiRequest<SquareActionResponse>(`/api/square/entries/${entryId}/like`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  })
}

export async function toggleSquareFavorite(token: string, entryId: string): Promise<SquareActionResponse> {
  return apiRequest<SquareActionResponse>(`/api/square/entries/${entryId}/favorite`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  })
}

export async function copySquareEntry(
  token: string,
  entryId: string,
  folderId?: string,
): Promise<SquareCopyResponse> {
  return apiRequest<SquareCopyResponse>(`/api/square/entries/${entryId}/copy`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ folder_id: folderId ?? null }),
  })
}

export async function publishPromptToSquare(
  token: string,
  promptId: string,
  payload: PublishPromptPayload,
): Promise<SquareEntry> {
  return apiRequest<SquareEntry>(`/api/square/prompts/${promptId}/publish`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  })
}

export async function unpublishSquareEntry(token: string, entryId: string): Promise<SquareActionResponse> {
  return apiRequest<SquareActionResponse>(`/api/square/entries/${entryId}/unpublish`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  })
}

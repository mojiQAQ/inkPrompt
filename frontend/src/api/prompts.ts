/**
 * Prompts API functions
 */
import { apiRequest, getAuthHeaders } from './client'
import type {
  Prompt,
  PromptListResponse,
  VersionListResponse,
  CreatePromptData,
  UpdatePromptData,
  PromptFilters,
} from '@/types/prompt'

/**
 * Fetch prompts list with pagination and filters
 */
export async function fetchPrompts(
  token: string,
  filters: PromptFilters = {}
): Promise<PromptListResponse> {
  const params = new URLSearchParams()

  if (filters.page) params.append('page', filters.page.toString())
  if (filters.page_size) params.append('page_size', filters.page_size.toString())
  if (filters.search) params.append('search', filters.search)
  if (filters.tags) params.append('tags', filters.tags)
  if (filters.tag_logic) params.append('tag_logic', filters.tag_logic)
  if (filters.sort_by) params.append('sort_by', filters.sort_by)
  if (filters.sort_order) params.append('sort_order', filters.sort_order)
  if (filters.folder_id) params.append('folder_id', filters.folder_id)
  if (filters.favorites_only) params.append('favorites_only', 'true')

  const query = params.toString()
  const endpoint = `/api/prompts${query ? `?${query}` : ''}`

  return apiRequest<PromptListResponse>(endpoint, {
    headers: getAuthHeaders(token),
  })
}

/**
 * Fetch a single prompt by ID
 */
export async function fetchPrompt(
  token: string,
  id: string
): Promise<Prompt> {
  return apiRequest<Prompt>(`/api/prompts/${id}`, {
    headers: getAuthHeaders(token),
  })
}

/**
 * Create a new prompt
 */
export async function createPrompt(
  token: string,
  data: CreatePromptData
): Promise<Prompt> {
  return apiRequest<Prompt>('/api/prompts', {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  })
}

/**
 * Update an existing prompt
 */
export async function updatePrompt(
  token: string,
  id: string,
  data: UpdatePromptData
): Promise<Prompt> {
  return apiRequest<Prompt>(`/api/prompts/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  })
}

/**
 * Delete a prompt
 */
export async function deletePrompt(
  token: string,
  id: string
): Promise<void> {
  return apiRequest<void>(`/api/prompts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  })
}

/**
 * Fetch version history for a prompt
 */
export async function fetchPromptVersions(
  token: string,
  id: string
): Promise<VersionListResponse> {
  return apiRequest<VersionListResponse>(`/api/prompts/${id}/versions`, {
    headers: getAuthHeaders(token),
  })
}

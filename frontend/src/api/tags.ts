/**
 * Tags API client functions
 */
import { apiRequest, getAuthHeaders } from './client'
import type { Tag, TagListResponse, CreateTagData, TagFilters } from '@/types/tag'

/**
 * Fetch list of tags
 */
export async function fetchTags(
  token: string,
  filters: TagFilters = {}
): Promise<TagListResponse> {
  const params = new URLSearchParams()

  if (filters.search) {
    params.append('search', filters.search)
  }

  if (filters.include_system !== undefined) {
    params.append('include_system', filters.include_system.toString())
  }

  if (filters.popular_only) {
    params.append('popular_only', 'true')
  }

  if (filters.limit) {
    params.append('limit', filters.limit.toString())
  }

  const queryString = params.toString()
  const endpoint = queryString ? `/api/tags?${queryString}` : '/api/tags'

  return apiRequest<TagListResponse>(endpoint, {
    headers: getAuthHeaders(token),
  })
}

/**
 * Fetch a single tag by ID
 */
export async function fetchTag(
  token: string,
  tagId: string
): Promise<Tag> {
  return apiRequest<Tag>(`/api/tags/${tagId}`, {
    headers: getAuthHeaders(token),
  })
}

/**
 * Create a new tag
 */
export async function createTag(
  token: string,
  data: CreateTagData
): Promise<Tag> {
  return apiRequest<Tag>('/api/tags', {
    method: 'POST',
    headers: {
      ...getAuthHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

/**
 * Delete a tag
 */
export async function deleteTag(
  token: string,
  tagId: string
): Promise<void> {
  await apiRequest<void>(`/api/tags/${tagId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  })
}

/**
 * Get popular tags
 */
export async function fetchPopularTags(
  token: string,
  limit: number = 10
): Promise<Tag[]> {
  const response = await fetchTags(token, {
    popular_only: true,
    limit,
  })
  return response.items
}

/**
 * Alias for fetchTags
 */
export const getTags = fetchTags

// Export Tag type for convenience
export type { Tag } from '@/types/tag'

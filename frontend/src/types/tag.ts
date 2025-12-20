/**
 * Tag type definitions
 */

export interface Tag {
  id: string
  name: string
  is_system: boolean
  use_count: number
}

export interface TagListResponse {
  items: Tag[]
  total: number
}

export interface CreateTagData {
  name: string
  is_system?: boolean
}

export interface TagFilters {
  search?: string
  include_system?: boolean
  popular_only?: boolean
  limit?: number
}

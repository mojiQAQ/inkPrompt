/**
 * Prompt related TypeScript types
 */

export interface Tag {
  id: string
  name: string
  is_system: boolean
  use_count: number
}

export interface Prompt {
  id: string
  user_id: string
  name: string
  content: string
  token_count: number
  tags: Tag[]
  version_count: number
  created_at: string
  updated_at: string
}

export interface PromptVersion {
  id: string
  prompt_id: string
  version_number: number
  content: string
  token_count: number
  change_note: string | null
  created_at: string
}

export interface PromptListResponse {
  items: Prompt[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface CreatePromptData {
  name: string
  content: string
  tag_names?: string[]
}

export interface UpdatePromptData {
  name?: string
  content?: string
  tag_names?: string[]
  change_note?: string
}

export interface PromptFilters {
  page?: number
  page_size?: number
  search?: string
  tags?: string
  tag_logic?: 'AND' | 'OR'
  sort_by?: 'updated_at' | 'created_at' | 'name' | 'token_count'
  sort_order?: 'asc' | 'desc'
}

export type SquareSortBy = 'hot' | 'newest' | 'copies'
export type SquareDifficulty = 'simple' | 'medium' | 'advanced'

export interface SquareAuthor {
  id: string
  name: string
  avatar_url?: string | null
}

export interface SquareTag {
  id: string
  name: string
  is_system: boolean
  use_count: number
}

export interface SquareEntry {
  id: string
  prompt_id: string
  title: string
  summary: string
  category: string
  difficulty: SquareDifficulty
  tags: SquareTag[]
  recommended_models: string[]
  allow_full_preview: boolean
  preview_text: string
  content?: string | null
  views: number
  likes: number
  favorites: number
  copies: number
  is_liked: boolean
  is_favorited: boolean
  author: SquareAuthor
  published_at: string
  updated_at: string
}

export interface SquareListResponse {
  items: SquareEntry[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface SquareActionResponse {
  success: boolean
  is_liked?: boolean
  is_favorited?: boolean
  likes?: number
  favorites?: number
}

export interface SquareCopyResponse {
  success: boolean
  prompt_id: string
  entry_id: string
  copies: number
  created_new: boolean
  already_saved: boolean
}

export interface SquareCategory {
  key: string
  label: string
}

export interface SquareTagSummary {
  id: string
  name: string
  count: number
}

export interface SquareListFilters {
  page?: number
  page_size?: number
  search?: string
  category?: string
  difficulty?: SquareDifficulty | ''
  tag?: string
  recommended_model?: string
  sort_by?: SquareSortBy
}

export interface PublishPromptPayload {
  title: string
  summary: string
  category: string
  difficulty: SquareDifficulty
  recommended_models?: string[]
  allow_full_preview?: boolean
}

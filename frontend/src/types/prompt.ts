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
  is_favorited: boolean
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

export interface VersionListResponse {
  versions: PromptVersion[]
  total: number
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
  folder_id?: string
  favorites_only?: boolean
}

export interface OptimizeSuggestion {
  question: string
  options: string[]
}

export interface OptimizationSession {
  id: string
  prompt_id: string
  user_id: string
  created_at: string
  updated_at: string
  rounds: OptimizationRound[]
}

export interface OptimizationRound {
  id: string
  session_id: string
  round_number: number
  user_idea: string | null
  selected_suggestions: Record<string, string[]> | null
  optimized_content: string
  suggestions: OptimizeSuggestion[]
  domain_analysis: string
  created_at: string
  version_id?: string | null
}

export interface OptimizationSessionSummary {
  session: OptimizationSession
  latest_round: OptimizationRound | null
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ModelConfig {
  name: string
  base_url: string
  model: string
  api_key?: string
  [key: string]: unknown
}

export interface TestModelConversation {
  id: string
  test_session_id: string
  model_name: string
  model_config: ModelConfig
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

export interface TestSession {
  id: string
  prompt_version_id: string
  user_id: string
  created_at: string
  updated_at: string
  conversations: TestModelConversation[]
}

export interface OptimizationStreamRequest {
  user_idea?: string
  selected_suggestions?: Record<string, string[]> | null
}

export interface TestStreamRequest {
  model: ModelConfig
  user_prompt: string
  continue?: boolean
}

export type OptimizeSSEEvent =
  | { type: 'round_start'; data: { round_number: number } }
  | { type: 'content'; data: string }
  | { type: 'suggestions'; data: { domain?: string; questions: OptimizeSuggestion[] } }
  | { type: 'version_saved'; data: { version_id: string; version_number: number } }
  | { type: 'complete'; data: Record<string, never> }
  | { type: 'error'; data: { message: string } }

export type TestSSEEvent =
  | { type: 'conversation_id'; data: { conversation_id: string } }
  | { type: 'content'; data: string }
  | { type: 'complete'; data: Record<string, never> }
  | { type: 'error'; data: { message: string } }

export type OptimizeSSEEventHandler = (event: OptimizeSSEEvent) => void
export type TestSSEEventHandler = (event: TestSSEEvent) => void

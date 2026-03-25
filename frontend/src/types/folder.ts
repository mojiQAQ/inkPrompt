/**
 * Folder related TypeScript types
 */

export interface Folder {
  id: string
  user_id: string
  name: string
  is_system: boolean
  sort_order: number
  prompt_count: number
  created_at: string
  updated_at: string
}

export interface FolderListResponse {
  items: Folder[]
}

export interface CreateFolderData {
  name: string
}

export interface UpdateFolderData {
  name: string
}

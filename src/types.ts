export type StorageType = "local" | "notion"

export interface Prompt {
  id: string
  title: string
  content: string
  tags?: string[]
  createdAt: number
  updatedAt: number
}

export interface NotionConfig {
  apiKey: string
  pageId: string
}

export interface SyncStatus {
  lastSynced: number | null
  inProgress: boolean
  error: string | null
}


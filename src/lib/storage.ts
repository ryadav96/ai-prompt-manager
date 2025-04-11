import type { Prompt, StorageType, NotionConfig, SyncStatus } from "../types"
import { syncWithNotion as notionSync } from "./notion"

// Declare chrome if it's not available (e.g., in a testing environment)
declare const chrome: any

// Default Tags
export const DEFAULT_TAGS = [
  "General",
  "Education & Learning",
  "Personal",
  "Coding & Development",
  "AI Roleplay & Agents",
  "Writing",
  "Research",
  "Design",
]

// Chrome storage keys
const STORAGE_KEYS = {
  PROMPTS: "prompts",
  STORAGE_TYPE: "storageType",
  NOTION_CONFIG: "notionConfig",
  SYNC_STATUS: "syncStatus",
  TAGS: "tags",
}

// Get prompts from storage
export async function getPrompts(): Promise<{ prompts: Prompt[]; storageType: StorageType }> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEYS.PROMPTS, STORAGE_KEYS.STORAGE_TYPE], (result) => {
      const storageType = (result[STORAGE_KEYS.STORAGE_TYPE] as StorageType) || "local"
      const prompts = (result[STORAGE_KEYS.PROMPTS] as Prompt[]) || []

      resolve({ prompts, storageType })
    })
  })
}

// Save prompts to storage
export async function savePrompts(prompts: Prompt[], storageType: StorageType): Promise<void> {
  // Extract all unique tags
  const allTags = new Set<string>()
  prompts.forEach((prompt) => {
    if (prompt.tags) {
      prompt.tags.forEach((tag) => allTags.add(tag))
    }
  })

  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(
      {
        [STORAGE_KEYS.PROMPTS]: prompts,
        [STORAGE_KEYS.STORAGE_TYPE]: storageType,
        [STORAGE_KEYS.TAGS]: Array.from(allTags),
      },
      () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      },
    )
  })
}

// Get all tags
export async function getAllTags(): Promise<string[]> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEYS.TAGS], (result) => {
      const savedTags = result[STORAGE_KEYS.TAGS] as string[];

      // If there are no saved tags, return the default tags
      if (!savedTags || savedTags.length === 0) {
        resolve(DEFAULT_TAGS);
      } else {
        resolve(savedTags);
      }
    })
  })
}

// Initialize default tags if none exist
export async function initializeDefaultTags(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get([STORAGE_KEYS.TAGS], (result) => {
      const existingTags = result[STORAGE_KEYS.TAGS] as string[];

      // Only initialize if no tags exist yet
      if (!existingTags || existingTags.length === 0) {
        chrome.storage.sync.set(
          {
            [STORAGE_KEYS.TAGS]: DEFAULT_TAGS,
          },
          () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError)
            } else {
              resolve()
            }
          },
        )
      } else {
        // Tags already exist, nothing to do
        resolve();
      }
    });
  });
}

// Get Notion configuration
export async function getNotionConfig(): Promise<NotionConfig | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEYS.NOTION_CONFIG], (result) => {
      resolve((result[STORAGE_KEYS.NOTION_CONFIG] as NotionConfig) || null)
    })
  })
}

// Save Notion configuration
export async function saveNotionConfig(config: NotionConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(
      {
        [STORAGE_KEYS.NOTION_CONFIG]: config,
      },
      () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      },
    )
  })
}

// Clear Notion configuration
export async function clearNotionConfig(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.remove(STORAGE_KEYS.NOTION_CONFIG, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        resolve()
      }
    })
  })
}

// Get sync status
export async function getSyncStatus(): Promise<SyncStatus> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEYS.SYNC_STATUS], (result) => {
      resolve(
        (result[STORAGE_KEYS.SYNC_STATUS] as SyncStatus) || {
          lastSynced: null,
          inProgress: false,
          error: null,
        },
      )
    })
  })
}

// Update sync status
export async function updateSyncStatus(status: Partial<SyncStatus>): Promise<void> {
  const currentStatus = await getSyncStatus()
  const newStatus = { ...currentStatus, ...status }

  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(
      {
        [STORAGE_KEYS.SYNC_STATUS]: newStatus,
      },
      () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      },
    )
  })
}

// Sync with Notion
export async function syncWithNotion(): Promise<Prompt[]> {
  const { prompts } = await getPrompts()
  const config = await getNotionConfig()

  if (!config) {
    throw new Error("Notion is not configured")
  }

  try {
    await updateSyncStatus({ inProgress: true, error: null })

    // Sync with Notion
    const syncedPrompts = await notionSync(prompts)

    // Save synced prompts
    await savePrompts(syncedPrompts, "notion")

    // Update sync status
    await updateSyncStatus({
      lastSynced: Date.now(),
      inProgress: false,
    })

    return syncedPrompts
  } catch (error) {
    await updateSyncStatus({
      inProgress: false,
      error: error instanceof Error ? error.message : "Unknown error during sync",
    })
    throw error
  }
}

// Search prompts
export async function searchPrompts(query: string, tags: string[] = []): Promise<Prompt[]> {
  const { prompts } = await getPrompts()

  if (!query && tags.length === 0) {
    return prompts
  }

  const normalizedQuery = query.toLowerCase().trim()

  return prompts.filter((prompt) => {
    // Filter by tags if specified
    if (tags.length > 0) {
      if (!prompt.tags || !tags.some((tag) => prompt.tags?.includes(tag))) {
        return false
      }
    }

    // Filter by search query if specified
    if (normalizedQuery) {
      const titleMatch = prompt.title.toLowerCase().includes(normalizedQuery)
      const contentMatch = prompt.content.toLowerCase().includes(normalizedQuery)
      return titleMatch || contentMatch
    }

    return true
  })
}

// Export prompts to JSON
export function exportPromptsToJson(prompts: Prompt[]): string {
  return JSON.stringify(prompts, null, 2)
}

// Import prompts from JSON
export async function importPromptsFromJson(json: string): Promise<Prompt[]> {
  try {
    const importedPrompts = JSON.parse(json) as Prompt[]

    // Validate imported data
    if (!Array.isArray(importedPrompts)) {
      throw new Error("Invalid format: Expected an array of prompts")
    }

    // Validate each prompt
    importedPrompts.forEach((prompt) => {
      if (!prompt.id || !prompt.content) {
        throw new Error("Invalid prompt format: Missing required fields")
      }
    })

    // Get current prompts
    const { prompts: currentPrompts, storageType } = await getPrompts()

    // Merge prompts, avoiding duplicates by ID
    const currentPromptsMap = new Map(currentPrompts.map((p) => [p.id, p]))

    importedPrompts.forEach((prompt) => {
      currentPromptsMap.set(prompt.id, prompt)
    })

    const mergedPrompts = Array.from(currentPromptsMap.values())

    // Save merged prompts
    await savePrompts(mergedPrompts, storageType)

    return mergedPrompts
  } catch (error) {
    console.error("Failed to import prompts:", error)
    throw error
  }
}


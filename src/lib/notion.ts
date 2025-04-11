import type { Prompt, NotionConfig } from "../types"
import { getNotionConfig } from "./storage"

// Declare chrome if it's not available (e.g., in a testing environment)
declare const chrome: any

// Notion API client
const NOTION_API_BASE_URL = "https://api.notion.com/v1"

// Helper function to make authenticated requests to Notion API
async function notionRequest(endpoint: string, method = "GET", body?: any, apiKey?: string): Promise<any> {
  const config = apiKey ? { apiKey } : await getNotionConfig()

  if (!config) {
    throw new Error("Notion is not configured")
  }

  const headers = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28",
  }

  try {
    const response = await fetch(`${NOTION_API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to communicate with Notion API")
    }

    return await response.json()
  } catch (error) {
    console.error("Notion API error:", error)
    throw error
  }
}

// Test Notion connection
export async function testNotionConnection(config: NotionConfig): Promise<boolean> {
  try {
    // Try to get the page to verify API key and page existence
    await notionRequest(`/pages/${config.pageId}`, "GET", undefined, config.apiKey)
    return true
  } catch (error) {
    console.error("Failed to connect to Notion:", error)
    return false
  }
}

// Convert Notion page to Prompt
function notionPageToPrompt(page: any): Prompt | null {
  try {
    const properties = page.properties

    // Extract title from the title property
    const titleProperty = Object.values(properties).find((prop: any) => prop.type === "title") as any

    const title = titleProperty?.title?.map((t: any) => t.plain_text).join("") || ""

    // Extract content from the rich_text property named "Content"
    const contentProperty = properties.Content || properties.content
    const content = contentProperty?.rich_text?.map((t: any) => t.plain_text).join("") || ""

    // Extract tags if they exist
    const tagsProperty = properties.Tags || properties.tags
    const tags = tagsProperty?.multi_select?.map((tag: any) => tag.name) || []

    // Extract timestamps
    const createdTime = new Date(page.created_time).getTime()
    const lastEditedTime = new Date(page.last_edited_time).getTime()

    return {
      id: page.id,
      title,
      content,
      tags,
      createdAt: createdTime,
      updatedAt: lastEditedTime,
    }
  } catch (error) {
    console.error("Error converting Notion page to prompt:", error)
    return null
  }
}

// Create a Notion database for prompts if it doesn't exist
export async function createNotionDatabase(parentPageId: string): Promise<string> {
  const body = {
    parent: {
      type: "page_id",
      page_id: parentPageId,
    },
    title: [
      {
        type: "text",
        text: {
          content: "Prompt Manager",
        },
      },
    ],
    properties: {
      Title: {
        title: {},
      },
      Content: {
        rich_text: {},
      },
      Tags: {
        multi_select: {
          options: [],
        },
      },
    },
  }

  const response = await notionRequest("/databases", "POST", body)
  return response.id
}

// Fetch prompts from Notion
export async function fetchPromptsFromNotion(): Promise<Prompt[]> {
  const config = await getNotionConfig()

  if (!config) {
    throw new Error("Notion is not configured")
  }

  try {
    // Check if the page ID is a database
    const pageResponse = await notionRequest(`/pages/${config.pageId}`)

    // If it's not a database, create one
    let databaseId = config.pageId
    if (!pageResponse.object === "database") {
      databaseId = await createNotionDatabase(config.pageId)

      // Update the config with the new database ID
      await saveNotionConfig({
        ...config,
        pageId: databaseId,
      })
    }

    // Query the database
    const response = await notionRequest(`/databases/${databaseId}/query`, "POST")

    // Convert Notion pages to Prompts
    const prompts = response.results.map(notionPageToPrompt).filter(Boolean) as Prompt[]

    return prompts
  } catch (error) {
    console.error("Failed to fetch prompts from Notion:", error)
    throw error
  }
}

// Save a prompt to Notion
export async function savePromptToNotion(prompt: Prompt): Promise<void> {
  const config = await getNotionConfig()

  if (!config) {
    throw new Error("Notion is not configured")
  }

  const properties: any = {
    Title: {
      title: [
        {
          text: {
            content: prompt.title || "Untitled Prompt",
          },
        },
      ],
    },
    Content: {
      rich_text: [
        {
          text: {
            content: prompt.content,
          },
        },
      ],
    },
  }

  // Add tags if they exist
  if (prompt.tags && prompt.tags.length > 0) {
    properties.Tags = {
      multi_select: prompt.tags.map((tag) => ({ name: tag })),
    }
  }

  const body = {
    parent: {
      database_id: config.pageId,
    },
    properties,
  }

  // If the prompt already exists in Notion, update it
  if (prompt.id && prompt.id.length > 30) {
    await notionRequest(`/pages/${prompt.id}`, "PATCH", {
      properties,
    })
  } else {
    // Otherwise create a new page
    await notionRequest("/pages", "POST", body)
  }
}

// Save all prompts to Notion
export async function savePromptsToNotion(prompts: Prompt[]): Promise<void> {
  // Save each prompt individually
  for (const prompt of prompts) {
    await savePromptToNotion(prompt)
  }
}

// Delete a prompt from Notion
export async function deletePromptFromNotion(promptId: string): Promise<void> {
  // Notion doesn't allow true deletion via API, so we archive the page
  await notionRequest(`/pages/${promptId}`, "PATCH", {
    archived: true,
  })
}

// Sync prompts with Notion (bidirectional)
export async function syncWithNotion(localPrompts: Prompt[]): Promise<Prompt[]> {
  try {
    // Get prompts from Notion
    const notionPrompts = await fetchPromptsFromNotion()

    // Create maps for easier lookup
    const notionPromptsMap = new Map(notionPrompts.map((p) => [p.id, p]))
    const localPromptsMap = new Map(localPrompts.map((p) => [p.id, p]))

    // Merged prompts will contain the final state
    const mergedPrompts: Prompt[] = []

    // Process local prompts
    for (const localPrompt of localPrompts) {
      const notionPrompt = notionPromptsMap.get(localPrompt.id)

      if (!notionPrompt) {
        // Prompt exists only locally, add to Notion
        await savePromptToNotion(localPrompt)
        mergedPrompts.push(localPrompt)
      } else {
        // Prompt exists in both places, use the most recent version
        if (localPrompt.updatedAt > notionPrompt.updatedAt) {
          await savePromptToNotion(localPrompt)
          mergedPrompts.push(localPrompt)
        } else {
          mergedPrompts.push(notionPrompt)
        }

        // Remove from Notion map to track what's been processed
        notionPromptsMap.delete(localPrompt.id)
      }
    }

    // Add remaining Notion prompts (those not in local storage)
    for (const [, notionPrompt] of notionPromptsMap) {
      mergedPrompts.push(notionPrompt)
    }

    return mergedPrompts
  } catch (error) {
    console.error("Failed to sync with Notion:", error)
    throw error
  }
}

// Helper function to save Notion config
async function saveNotionConfig(config: NotionConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(
      {
        notionConfig: config,
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


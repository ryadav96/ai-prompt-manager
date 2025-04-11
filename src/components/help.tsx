import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Help() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Help & Documentation</CardTitle>
          <CardDescription>Learn how to use the Prompt Manager extension effectively.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Getting Started</AccordionTrigger>
              <AccordionContent>
                <p className="mb-2">
                  Welcome to Prompt Manager! This extension helps you store, manage, and reuse text prompts.
                </p>
                <p className="mb-2">To get started:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Click the "Add New" tab to create your first prompt</li>
                  <li>Give your prompt a title (optional) and enter the prompt text</li>
                  <li>Add tags to organize your prompts (optional)</li>
                  <li>Click "Save Prompt" to store it</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Managing Prompts</AccordionTrigger>
              <AccordionContent>
                <p className="mb-2">You can manage your prompts in several ways:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>View:</strong> Click the "View" button to see the full prompt
                  </li>
                  <li>
                    <strong>Edit:</strong> Click the "Edit" button to modify a prompt
                  </li>
                  <li>
                    <strong>Delete:</strong> Click the "Delete" button to remove a prompt
                  </li>
                  <li>
                    <strong>Copy:</strong> Click the "Copy" button to copy the prompt to your clipboard
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Using Tags</AccordionTrigger>
              <AccordionContent>
                <p className="mb-2">Tags help you organize and find your prompts more easily:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Add tags when creating or editing a prompt</li>
                  <li>Use the search bar to filter prompts by tags</li>
                  <li>Click on a tag in the search bar to remove it from the filter</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Notion Integration</AccordionTrigger>
              <AccordionContent>
                <p className="mb-2">You can store your prompts in Notion instead of locally:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Go to the "Settings" tab</li>
                  <li>Enter your Notion API key and page ID</li>
                  <li>Click "Test Connection" to verify your credentials</li>
                  <li>Click "Connect Notion" to enable integration</li>
                  <li>Use the "Sync" button in the header to manually sync changes</li>
                </ol>
                <p className="mt-2 text-sm text-muted-foreground">
                  To get a Notion API key, visit{" "}
                  <a
                    href="https://www.notion.so/my-integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Notion Integrations
                  </a>{" "}
                  and create a new integration.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Import & Export</AccordionTrigger>
              <AccordionContent>
                <p className="mb-2">You can backup or transfer your prompts:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Export:</strong> Go to the "Import/Export" tab and click "Export to JSON" to download all
                    your prompts
                  </li>
                  <li>
                    <strong>Import:</strong> Paste previously exported JSON data and click "Import" to add those prompts
                    to your collection
                  </li>
                </ul>
                <p className="mt-2 text-sm text-muted-foreground">
                  Importing will merge with your existing prompts, with imported versions taking precedence for
                  duplicates.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>Troubleshooting</AccordionTrigger>
              <AccordionContent>
                <p className="mb-2">Common issues and solutions:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Notion sync not working:</strong> Ensure your API key has the correct permissions and the
                    page ID is correct. Try disconnecting and reconnecting.
                  </li>
                  <li>
                    <strong>Prompts not saving:</strong> Chrome storage has limits. Try exporting and then removing some
                    prompts if you have many large ones.
                  </li>
                  <li>
                    <strong>Import failing:</strong> Ensure the JSON format matches the export format. Check for any
                    syntax errors in the JSON.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Prompt Manager v1.0.0
            <br />A Chrome extension for storing and managing text prompts.
            <br />
            Built with Vite, React, Tailwind CSS, and shadcn/ui.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}


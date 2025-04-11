"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "./components/mode-toggle";
import PromptList from "./components/prompt-list";
import PromptListRedesigned from "./components/prompt-list-redesigned";
import AddPrompt from "./components/add-prompt";
import Settings from "./components/settings";
import SearchBar from "./components/search-bar";
import Help from "./components/help";
import ImportExport from "./components/import-export";
import type { Prompt, StorageType } from "./types";
import {
  getPrompts,
  savePrompts,
  searchPrompts,
  syncWithNotion,
  getSyncStatus,
  getAllTags,
} from "./lib/storage";

import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Plus,
  Download,
  SettingsIcon,
  HelpCircle,
  Sparkles,
  BookmarkPlus,
  Search,
  Library,
  X,
} from "lucide-react";
import { useToast } from "./hooks/use-toast";
import { Toaster } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

function App() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
  const [storageType, setStorageType] = useState<StorageType>("local");
  const [isLoading, setIsLoading] = useState(true);
  const [notionConnected, setNotionConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    lastSynced: null,
    inProgress: false,
    error: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [autoSync, setAutoSync] = useState(false);
  const [useRedesignedUI, setUseRedesignedUI] = useState(true); // Set to true to use the redesigned UI
  const [activeTab, setActiveTab] = useState("prompts");
  const { toast } = useToast();

  // Load prompts and settings
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const { prompts: loadedPrompts, storageType: loadedStorageType } =
          await getPrompts();
        const status = await getSyncStatus();
        const tags = await getAllTags();

        setPrompts(loadedPrompts);
        setFilteredPrompts(loadedPrompts);
        setStorageType(loadedStorageType);
        setNotionConnected(loadedStorageType === "notion");
        setSyncStatus(status);
        setAvailableTags(tags);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast({
          title: "Error loading data",
          description: "There was a problem loading your prompts and settings.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Filter prompts when search query or selected tags change
  useEffect(() => {
    const filterPrompts = async () => {
      try {
        const results = await searchPrompts(searchQuery, selectedTags);
        setFilteredPrompts(results);
      } catch (error) {
        console.error("Search error:", error);
      }
    };

    filterPrompts();
  }, [searchQuery, selectedTags, prompts]);

  const handleAddPrompt = async (newPrompt: Prompt) => {
    try {
      const updatedPrompts = [...prompts, newPrompt];
      setPrompts(updatedPrompts);
      await savePrompts(updatedPrompts, storageType);

      // Update available tags
      if (newPrompt.tags?.length) {
        const newTags = Array.from(
          new Set([...availableTags, ...newPrompt.tags])
        );
        setAvailableTags(newTags);
      }

      toast({
        title: "Prompt added",
        description: "Your prompt has been saved successfully.",
      });

      if (storageType === "notion" && autoSync) await handleSync();

      // Switch back to prompts tab after adding
      if (useRedesignedUI) {
        setActiveTab("prompts");
      } else {
        document.querySelector('[value="prompts"]')?.click();
      }
    } catch (error) {
      console.error("Failed to save prompt:", error);
      toast({
        title: "Error saving prompt",
        description: "There was a problem saving your prompt.",
        variant: "destructive",
      });
      setPrompts(prompts); // Revert on error
    }
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      const updatedPrompts = prompts.filter((prompt) => prompt.id !== id);
      setPrompts(updatedPrompts);
      await savePrompts(updatedPrompts, storageType);

      toast({
        title: "Prompt deleted",
        description: "Your prompt has been deleted successfully.",
      });

      if (storageType === "notion" && autoSync) await handleSync();
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      toast({
        title: "Error deleting prompt",
        description: "There was a problem deleting your prompt.",
        variant: "destructive",
      });
      setPrompts(prompts); // Revert on error
    }
  };

  const handleEditPrompt = async (updatedPrompt: Prompt) => {
    try {
      const updatedPrompts = prompts.map((prompt) =>
        prompt.id === updatedPrompt.id ? updatedPrompt : prompt
      );
      setPrompts(updatedPrompts);
      await savePrompts(updatedPrompts, storageType);

      // Update available tags
      if (updatedPrompt.tags?.length) {
        const newTags = Array.from(
          new Set([...availableTags, ...updatedPrompt.tags])
        );
        setAvailableTags(newTags);
      }

      toast({
        title: "Prompt updated",
        description: "Your prompt has been updated successfully.",
      });

      if (storageType === "notion" && autoSync) await handleSync();
    } catch (error) {
      console.error("Failed to update prompt:", error);
      toast({
        title: "Error updating prompt",
        description: "There was a problem updating your prompt.",
        variant: "destructive",
      });
      setPrompts(prompts); // Revert on error
    }
  };

  const handleStorageChange = async (newStorageType: StorageType) => {
    try {
      await savePrompts(prompts, newStorageType);
      setStorageType(newStorageType);
      setNotionConnected(newStorageType === "notion");

      toast({
        title: "Storage updated",
        description: `Your prompts are now stored ${
          newStorageType === "notion" ? "in Notion" : "locally"
        }.`,
      });

      if (newStorageType === "notion" && autoSync) await handleSync();
    } catch (error) {
      console.error("Failed to change storage:", error);
      toast({
        title: "Error changing storage",
        description: "There was a problem changing your storage settings.",
        variant: "destructive",
      });
    }
  };

  const handleSync = async () => {
    if (storageType !== "notion") {
      toast({
        title: "Notion not connected",
        description: "Please connect to Notion before syncing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSyncStatus((prev) => ({ ...prev, inProgress: true, error: null }));
      const syncedPrompts = await syncWithNotion();
      setPrompts(syncedPrompts);

      const status = await getSyncStatus();
      setSyncStatus(status);

      toast({
        title: "Sync complete",
        description: "Your prompts have been synchronized with Notion.",
      });
    } catch (error) {
      console.error("Sync failed:", error);
      const status = await getSyncStatus();
      setSyncStatus(status);

      toast({
        title: "Sync failed",
        description: status.error || "There was a problem syncing with Notion.",
        variant: "destructive",
      });
    }
  };

  const handleAutoSyncChange = (value: boolean) => {
    setAutoSync(value);
  };

  const handleImportPrompts = async (importedPrompts: Prompt[]) => {
    try {
      setPrompts(importedPrompts);

      // Update available tags
      const allTags = new Set<string>(availableTags);
      importedPrompts.forEach((prompt) => {
        prompt.tags?.forEach((tag) => allTags.add(tag));
      });
      setAvailableTags(Array.from(allTags));

      toast({
        title: "Import successful",
        description: `${importedPrompts.length} prompts have been imported.`,
      });

      if (storageType === "notion" && autoSync) await handleSync();
    } catch (error) {
      console.error("Import failed:", error);
      toast({
        title: "Import failed",
        description: "There was a problem importing your prompts.",
        variant: "destructive",
      });
    }
  };

  const handleAddNewClick = () => {
    if (useRedesignedUI) {
      setActiveTab("add");
    } else {
      document.querySelector('[value="add"]')?.click();
    }
  };

  const handelSettingsClick = () => {
    if (useRedesignedUI) {
      setActiveTab("settings");
    } else {
      document.querySelector('[value="settings"]')?.click();
    }
  }
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="flex items-center justify-between p-4 border-b">
          <Skeleton className="w-56 h-8" />
          <div className="flex gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </header>
        <div className="flex-1 p-4">
          <Skeleton className="w-full h-12 mb-4 rounded-xl" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-full h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render the redesigned UI if enabled
  if (useRedesignedUI) {
    return (
      <div className="flex flex-col h-full bg-background">
        {activeTab === "prompts" && (
          <PromptListRedesigned
            prompts={filteredPrompts}
            onDelete={handleDeletePrompt}
            onEdit={handleEditPrompt}
            onAddNew={handleAddNewClick}
            availableTags={availableTags}
            onSettings={handelSettingsClick}
          />
        )}

        {activeTab === "add" && (
          <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b">
              <h1 className="text-xl font-bold">Create New Prompt</h1>
              <Button
                variant="ghost"
                size="icon"
                className="header-icon"
                onClick={() => setActiveTab("prompts")}
              >
                <X className="w-5 h-5" />
              </Button>
            </header>
            <div className="flex-1 p-1 overflow-y-auto bg-gray-100">
              <AddPrompt
                onAdd={handleAddPrompt}
                availableTags={availableTags}
              />
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b">
              <h1 className="text-xl font-bold">Settings</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveTab("prompts")}
              >
                <X className="w-5 h-5" />
              </Button>
            </header>
            <div className="flex-1 p-1 overflow-y-auto bg-gray-100">
              <Settings
                storageType={storageType}
                notionConnected={notionConnected}
                onStorageChange={handleStorageChange}
                syncStatus={syncStatus}
                autoSync={autoSync}
                onAutoSyncChange={handleAutoSyncChange}
              />
            </div>
          </div>
        )}

        <Toaster position="bottom-right" richColors closeButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-sm bg-background">
      {/* Enhanced Header with Gradient */}
      <header className="relative flex items-center justify-between px-8 py-6 border-b bg-gradient-to-b from-background to-muted/20">
        <div className="flex flex-col">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <Sparkles className="w-8 h-8 text-primary" />
            Prompt Manager
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize and manage your AI prompts in one place
          </p>
        </div>
        <div className="flex items-center gap-3">
          {notionConnected && (
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={syncStatus.inProgress}
              className="gap-2 font-medium transition-all duration-300 border-primary/20 hover:bg-primary/10 hover:text-primary"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  syncStatus.inProgress ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Sync with Notion</span>
            </Button>
          )}
          {notionConnected && (
            <Badge className="px-3 py-1 text-xs bg-primary/15 text-primary border-primary/20">
              Notion Connected
            </Badge>
          )}
          <ModeToggle />
        </div>
      </header>

      <Tabs defaultValue="prompts" className="flex flex-col flex-1">
        {/* Enhanced Tab Navigation */}
        <div className="sticky top-0 z-10 border-b shadow-sm bg-background/80 backdrop-blur supports-backdrop-blur:bg-background/50">
          <TabsList className="justify-start w-full h-auto max-w-screen-lg p-0 mx-auto bg-transparent">
            {[
              {
                value: "prompts",
                icon: <Library className="w-4 h-4" />,
                label: "Prompts",
                badge: filteredPrompts.length,
              },
              {
                value: "add",
                icon: <BookmarkPlus className="w-4 h-4" />,
                label: "Add New",
                mobilLabel: "Add",
              },
              {
                value: "import",
                icon: <Download className="w-4 h-4" />,
                label: "",
              },
              {
                value: "settings",
                icon: <SettingsIcon className="w-4 h-4" />,
                label: "",
              },
              {
                value: "help",
                icon: <HelpCircle className="w-4 h-4" />,
                label: "",
              },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 py-4 px-5 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none transition-all duration-300 hover:bg-muted/50"
              >
                {tab.icon}
                {tab.mobilLabel ? (
                  <>
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.mobilLabel}</span>
                  </>
                ) : (
                  <span
                    className={tab.value === "import" ? "hidden sm:inline" : ""}
                  >
                    {tab.label}
                  </span>
                )}
                {tab.badge && (
                  <Badge
                    variant="secondary"
                    className="ml-1 px-2 py-0.5 text-xs bg-primary/15 text-primary"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Prompts Tab with Enhanced Search */}
          <TabsContent value="prompts" className="flex-1 h-full m-0">
            <div className="px-6 py-8 border-b bg-muted/20">
              <div className="max-w-screen-lg mx-auto">
                <Card className="overflow-hidden border shadow-md bg-background">
                  <CardContent className="p-4">
                    <SearchBar
                      onSearch={setSearchQuery}
                      availableTags={availableTags}
                      selectedTags={selectedTags}
                      onTagSelect={setSelectedTags}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
            <ScrollArea className="h-[calc(100%-116px)]">
              <div className="container max-w-screen-lg p-8 mx-auto">
                {filteredPrompts.length > 0 ? (
                  <PromptList
                    prompts={filteredPrompts}
                    onDelete={handleDeletePrompt}
                    onEdit={handleEditPrompt}
                    availableTags={availableTags}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-6 mb-6 rounded-full bg-muted">
                      <Search className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-medium">No prompts found</h3>
                    <p className="mt-2 text-muted-foreground">
                      Try adjusting your search or tags, or add a new prompt
                    </p>
                    <Button
                      variant="default"
                      className="gap-2 mt-6 transition-all duration-300 bg-primary hover:bg-primary/90"
                      onClick={() =>
                        document.querySelector('[value="add"]')?.click()
                      }
                    >
                      <Plus className="w-4 h-4" />
                      Add New Prompt
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Other Tab Contents with Consistent Spacing */}
          <TabsContent value="add" className="flex-1 h-full m-0">
            <ScrollArea className="h-full">
              <div className="container max-w-screen-lg p-8 mx-auto">
                <AddPrompt
                  onAdd={handleAddPrompt}
                  availableTags={availableTags}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="import" className="flex-1 h-full m-0">
            <ScrollArea className="h-full">
              <div className="container max-w-screen-lg p-8 mx-auto">
                <ImportExport
                  prompts={prompts}
                  onImport={handleImportPrompts}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 h-full m-0">
            <ScrollArea className="h-full">
              <div className="container max-w-screen-lg p-8 mx-auto">
                <Settings
                  storageType={storageType}
                  notionConnected={notionConnected}
                  onStorageChange={handleStorageChange}
                  syncStatus={syncStatus}
                  autoSync={autoSync}
                  onAutoSyncChange={handleAutoSyncChange}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="help" className="flex-1 h-full m-0">
            <ScrollArea className="h-full">
              <div className="container max-w-screen-lg p-8 mx-auto">
                <Help />
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>

      {/* Enhanced Toast Positioning */}
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}

export default App;

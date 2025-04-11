"use client";

import { useState, useEffect } from "react";
import type { Prompt } from "../types";
import {
  Copy,
  Star,
  Plus,
  Settings,
  Search,
  BookOpen,
  Mail,
  Code,
  Languages,
  Trash2,
  Edit,
  X,
  List,
  Grid,
  BookmarkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

interface PromptListProps {
  prompts: Prompt[];
  onDelete: (id: string) => void;
  onEdit: (prompt: Prompt) => void;
  onAddNew: () => void;
  availableTags?: string[];
  onSettings?: () => void;
}

export default function PromptListRedesigned({
  prompts,
  onDelete,
  onEdit,
  onAddNew,
  onSettings,
  availableTags = [],
}: PromptListProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(true);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>(prompts);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [viewingPrompt, setViewingPrompt] = useState<Prompt | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [open, setOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Filter prompts when tab changes or search query updates
  useEffect(() => {
    let filtered = [...prompts];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (prompt) =>
          prompt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prompt.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Apply tab filter
    if (activeTab === "favorites") {
      filtered = filtered.filter((prompt) => favorites.includes(prompt.id));
    } else if (activeTab !== "all" && activeTab !== "categories") {
      // Filter by category/tag
      filtered = filtered.filter((prompt) => prompt.tags?.includes(activeTab));
    }

    setFilteredPrompts(filtered);
  }, [prompts, activeTab, searchQuery, favorites]);

  // Load favorites from localStorage
  useEffect(() => {
    const storedFavorites = localStorage.getItem("promptFavorites");
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  const handleCopy = (content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        toast.success("Copied to clipboard", {
          description: "The prompt has been copied to your clipboard.",
          duration: 2000,
        });
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        toast.error("Copy failed", {
          description: "Failed to copy to clipboard.",
          duration: 2000,
        });
      });
  };

  const handleEditClick = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setEditTitle(prompt.title || "");
    setEditContent(prompt.content);
    setEditTags(prompt.tags || []);
  };

  const handleSaveEdit = () => {
    if (editingPrompt) {
      onEdit({
        ...editingPrompt,
        title: editTitle,
        content: editContent,
        tags: editTags.length > 0 ? editTags : undefined,
        updatedAt: Date.now(),
      });
      setEditingPrompt(null);
    }
  };

  const handleViewPrompt = (prompt: Prompt) => {
    setViewingPrompt(prompt);
  };

  const handleTagSelect = (tag: string) => {
    if (!editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
    }
    setOpen(false);
  };

  const handleTagRemove = (tagToRemove: string) => {
    setEditTags(editTags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddNewTag = () => {
    if (newTag && !editTags.includes(newTag)) {
      setEditTags([...editTags, newTag]);
      setNewTag("");
    }
  };

  const toggleFavorite = (id: string) => {
    let newFavorites: string[];

    if (favorites.includes(id)) {
      newFavorites = favorites.filter((favId) => favId !== id);
    } else {
      newFavorites = [...favorites, id];
    }

    setFavorites(newFavorites);
    localStorage.setItem("promptFavorites", JSON.stringify(newFavorites));

    toast(
      favorites.includes(id) ? "Removed from favorites" : "Added to favorites",
      {
        description: favorites.includes(id)
          ? "The prompt has been removed from your favorites."
          : "The prompt has been added to your favorites.",
        duration: 2000,
      }
    );
  };

  // Function to get icon based on prompt title
  const getPromptIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (
      lowerTitle.includes("blog") ||
      lowerTitle.includes("post") ||
      lowerTitle.includes("article")
    ) {
      return <BookOpen className="w-5 h-5 text-muted-foreground" />;
    } else if (
      lowerTitle.includes("email") ||
      lowerTitle.includes("mail") ||
      lowerTitle.includes("message")
    ) {
      return <Mail className="w-5 h-5 text-muted-foreground" />;
    } else if (
      lowerTitle.includes("code") ||
      lowerTitle.includes("review") ||
      lowerTitle.includes("programming")
    ) {
      return <Code className="w-5 h-5 text-muted-foreground" />;
    } else if (
      lowerTitle.includes("translate") ||
      lowerTitle.includes("language")
    ) {
      return <Languages className="w-5 h-5 text-muted-foreground" />;
    } else {
      return <BookOpen className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // Get unique categories from prompts
  const categories = Array.from(
    new Set(prompts.flatMap((prompt) => prompt.tags || []))
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between p-3 border-b">
        <h1 className="text-xl font-bold">PromptManager</h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 header-icon"
            onClick={onAddNew}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 header-icon" onClick={onSettings}>
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 header-icon"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Search Bar (conditionally rendered) */}
      {isSearchOpen && (
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              className="pl-9 pr-9 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 -translate-y-1/2 rounded-full w-7 h-7 top-1/2"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="favorites">
                <Star className="w-3 h-3 mr-1" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeTab === "categories" && (
          <div className="flex flex-wrap gap-1 mt-2 mb-3">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={activeTab === category ? "default" : "outline"}
                className="text-xs cursor-pointer"
                onClick={() => setActiveTab(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}

        {/* Show active category filter if a specific category is selected */}
        {activeTab !== "all" &&
          activeTab !== "favorites" &&
          activeTab !== "categories" && (
            <div className="flex items-center gap-2 mt-2 mb-3">
              <span className="text-xs text-muted-foreground">
                Filtered by:
              </span>
              <Badge variant="default" className="gap-1 text-xs">
                {activeTab}
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-4 h-4 p-0 ml-1 hover:bg-transparent"
                  onClick={() => setActiveTab("all")}
                >
                  <X className="w-2 h-2" />
                </Button>
              </Badge>
            </div>
          )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className={`px-2 h-7 ${viewMode === "list" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`px-2 h-7 ${viewMode === "grid" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-3 h-3" />
            </Button>
            <span className="ml-2 text-xs text-muted-foreground">
              {filteredPrompts.length} prompt
              {filteredPrompts.length !== 1 ? "s" : ""}
            </span>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={onAddNew}
            className="gap-1 text-xs h-7"
          >
            <Plus className="w-3 h-3" />
            New Prompt
          </Button>
        </div>
      </div>

      {/* Prompts List */}
      <ScrollArea className="flex-1 overflow-scroll bg-gray-100 bg">
        <div className="p-3">
          {filteredPrompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <BookmarkIcon className="w-12 h-12 mb-4 text-muted-foreground opacity-20" />
              <p className="mb-4 text-muted-foreground">No prompts found</p>
              <Button onClick={onAddNew} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add New Prompt
              </Button>
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-3">
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="p-4 transition-all bg-white border shadow-sm dark:bg-card rounded-xl hover:shadow-md border-border/30"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleViewPrompt(prompt)}
                    >
                      <h3 className="text-base font-semibold">
                        {prompt.title || "Untitled Prompt"}
                      </h3>
                      <p className="mt-1 text-sm line-clamp-2 text-muted-foreground">
                        {prompt.content}
                      </p>
                    </div>
                    <div className="ml-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-70 hover:opacity-100"
                        onClick={() => toggleFavorite(prompt.id)}
                      >
                        <Star
                          className={`w-5 h-5 ${
                            favorites.includes(prompt.id)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-3">
                    {prompt.tags && prompt.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {prompt.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {prompt.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{prompt.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div></div>
                    )}

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCopy(prompt.content)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditClick(prompt)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete prompt?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "
                              {prompt.title || "Untitled Prompt"}". This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(prompt.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="bg-white dark:bg-card rounded-xl shadow-sm hover:shadow-md border border-border/30 p-3 h-[140px] flex flex-col transition-all"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-xs font-semibold line-clamp-1">
                      {prompt.title || "Untitled Prompt"}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-5 h-5 -mt-1 -mr-1"
                      onClick={() => toggleFavorite(prompt.id)}
                    >
                      <Star
                        className={`w-3 h-3 ${
                          favorites.includes(prompt.id)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                  </div>

                  <div
                    className="flex-1 cursor-pointer overflow-hidden text-[11px] text-muted-foreground my-1"
                    onClick={() => handleViewPrompt(prompt)}
                  >
                    <p className="line-clamp-4">{prompt.content}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 mt-auto">
                    <div className="flex gap-1">
                      {prompt.tags && prompt.tags.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {prompt.tags[0]}
                          {prompt.tags.length > 1 &&
                            ` +${prompt.tags.length - 1}`}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-5 h-5"
                        onClick={() => handleCopy(prompt.content)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-5 h-5"
                        onClick={() => handleEditClick(prompt)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Edit Prompt Dialog */}
      <Dialog
        open={editingPrompt !== null}
        onOpenChange={(open) => !open && setEditingPrompt(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Make changes to your prompt here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter a title for your prompt"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">Prompt Content</Label>
              <Textarea
                id="content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Enter your prompt text"
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            <div className="grid gap-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {editTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 px-2 py-1 rounded-full"
                  >
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0.5 text-muted-foreground hover:text-foreground"
                      onClick={() => handleTagRemove(tag)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Add a new tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNewTag();
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddNewTag}
                  disabled={!newTag.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>

                {availableTags.length > 0 && (
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="whitespace-nowrap">
                        Select Tags
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[200px]" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search tags..."
                          className="focus:outline-none focus-within:ring-2"
                        />
                        <CommandList>
                          <CommandEmpty>No tags found</CommandEmpty>
                          <CommandGroup>
                            {availableTags
                              .filter((tag) => !editTags.includes(tag))
                              .map((tag) => (
                                <CommandItem
                                  key={tag}
                                  onSelect={() => handleTagSelect(tag)}
                                  className="cursor-pointer"
                                >
                                  {tag}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPrompt(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Prompt Dialog */}
      <Dialog
        open={viewingPrompt !== null}
        onOpenChange={(open) => !open && setViewingPrompt(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {viewingPrompt?.title || "Untitled Prompt"}
            </DialogTitle>
            <DialogDescription>
              {viewingPrompt?.tags && viewingPrompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {viewingPrompt.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 rounded-md bg-muted">
              <pre className="font-mono text-sm whitespace-pre-wrap">
                {viewingPrompt?.content}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingPrompt(null)}>
              Close
            </Button>
            <Button
              onClick={() => viewingPrompt && handleCopy(viewingPrompt.content)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast for notifications */}
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}

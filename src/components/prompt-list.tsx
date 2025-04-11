"use client";

import { useState, useMemo } from "react";
import type { Prompt } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Edit, Trash2, Eye, Plus, X, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface PromptListProps {
  prompts: Prompt[];
  onDelete: (id: string) => void;
  onEdit: (prompt: Prompt) => void;
  availableTags: string[];
}

export default function PromptList({
  prompts,
  onDelete,
  onEdit,
  availableTags,
}: PromptListProps) {
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [viewingPrompt, setViewingPrompt] = useState<Prompt | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();

  // Filter prompts based on search and category
  const filteredPrompts = useMemo(() => {
    return prompts.filter((prompt) => {
      // Search filter
      const matchesSearch =
        prompt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Category filter
      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "untagged" && !prompt.tags?.length) ||
        prompt.tags?.includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [prompts, searchQuery, selectedCategory]);

  // Get all unique categories from availableTags and prompts
  const allCategories = useMemo(() => {
    const categories = new Set(availableTags);
    prompts.forEach((prompt) => {
      prompt.tags?.forEach((tag) => categories.add(tag));
    });
    return Array.from(categories).sort();
  }, [prompts, availableTags]);

  const handleCopy = (content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "The prompt has been copied to your clipboard.",
          duration: 2000,
        });
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        toast({
          title: "Copy failed",
          description: "Failed to copy to clipboard.",
          variant: "destructive",
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

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="p-4 mb-4 rounded-full bg-muted">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-medium">No prompts found</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          You don't have any prompts yet. Create your first prompt by clicking
          the "Add New" button.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Tabs
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="flex-1"
          >
            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="untagged">Untagged</TabsTrigger>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    Categories
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Filter categories..." />
                    <CommandList>
                      <CommandEmpty>No categories found</CommandEmpty>
                      <CommandGroup>
                        {allCategories.map((category) => (
                          <CommandItem
                            key={category}
                            onSelect={() => setSelectedCategory(category)}
                            className="cursor-pointer"
                          >
                            {category}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Results Count */}
      {filteredPrompts.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredPrompts.length} prompt
          {filteredPrompts.length !== 1 ? "s" : ""}
          {selectedCategory !== "all" && ` in "${selectedCategory}"`}
        </p>
      )}

      {/* Prompts List */}
      <ScrollArea className="flex-1 pr-4">
        {filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="p-4 mb-4 rounded-full bg-muted">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-medium">No matching prompts</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              No prompts match your search criteria. Try adjusting your search
              or filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrompts.map((prompt) => (
              <Card
                key={prompt.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">
                      {prompt.title || "Untitled Prompt"}
                    </CardTitle>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(prompt.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {prompt.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="transition-colors cursor-pointer hover:bg-accent/80"
                          onClick={() => setSelectedCategory(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {prompt.content}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewPrompt(prompt)}
                    className="gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(prompt)}
                    className="gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Trash2 className="w-4 h-4" />
                        Delete
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

                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1 ml-auto"
                    onClick={() => handleCopy(prompt.content)}
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
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
                          className="focus:outline-none focus-within:ring-2 focus-within:ring-primary"
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
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="transition-colors cursor-pointer hover:bg-accent/80"
                      onClick={() => setSelectedCategory(tag)}
                    >
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
    </div>
  );
}

"use client";

import type React from "react";
import { useState, useMemo, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  X,
  Plus,
  ChevronDown,
  Search,
  AlertCircle,
  ArrowLeft,
  Tag,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Prompt } from "../types";
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
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddPromptProps {
  onAdd: (prompt: Prompt) => void;
  availableTags: string[];
  className?: string;
  onBack?: () => void;
}

export default function AddPrompt({
  onAdd,
  availableTags,
  className,
  onBack,
}: AddPromptProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isContentFocused, setIsContentFocused] = useState(false);

  // Character limit for content
  const MAX_CONTENT_LENGTH = 2000;
  const contentPercentage = Math.min(
    (content.length / MAX_CONTENT_LENGTH) * 100,
    100
  );
  const isContentNearLimit = content.length > MAX_CONTENT_LENGTH * 0.8;

  const filteredTags = useMemo(() => {
    return availableTags.filter(
      (tag) =>
        !tags.includes(tag) &&
        tag.toLowerCase().includes(tagSearch.toLowerCase())
    );
  }, [availableTags, tags, tagSearch]);

  // Clear error when content changes
  useEffect(() => {
    if (error && content.trim()) {
      setError(null);
    }
  }, [content, error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Prompt content is required");
      return;
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      setError(
        `Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`
      );
      return;
    }

    setIsSubmitting(true);

    const newPrompt: Prompt = {
      id: uuidv4(),
      title: title.trim() || "Untitled Prompt",
      content: content.trim(),
      tags: tags.length > 0 ? tags : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onAdd(newPrompt);

    // Reset form
    setTitle("");
    setContent("");
    setTags([]);
    setIsSubmitting(false);
  };

  const handleTagSelect = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setOpen(false);
    setTagSearch("");
  };

  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddNewTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && onBack) {
      onBack();
    }
  };

  return (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      {/* Header - Consistent with prompt list header */}

      {/* Main content area with proper scrolling */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <form
            onSubmit={handleSubmit}
            className={cn("space-y-6", className)}
            aria-labelledby="prompt-form-title"
          >
            {/* Title field with card styling */}
            <div className="overflow-hidden transition-shadow border rounded-lg shadow-sm bg-card border-border/40 hover:shadow-md">
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="title"
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isTitleFocused ? "text-primary" : "text-foreground"
                    )}
                  >
                    Title
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Optional
                  </span>
                </div>
                <div
                  className={cn(
                    "relative rounded-md transition-all duration-200",
                    isTitleFocused ? "ring-2 ring-primary/20" : ""
                  )}
                >
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a descriptive title"
                    disabled={isSubmitting}
                    aria-describedby="title-description"
                    className={cn(
                      "h-10 transition-all border-input/50 focus:border-primary/30 focus:ring-0",
                      isTitleFocused ? "border-primary/30" : ""
                    )}
                    onFocus={() => setIsTitleFocused(true)}
                    onBlur={() => setIsTitleFocused(false)}
                    maxLength={100}
                  />
                </div>
                <p
                  id="title-description"
                  className="text-xs text-muted-foreground"
                >
                  A descriptive title helps you identify your prompts
                </p>
              </div>
            </div>

            {/* Content field with card styling */}
            <div className="overflow-hidden transition-shadow border rounded-lg shadow-sm bg-card border-border/40 hover:shadow-md">
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="content"
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isContentFocused ? "text-primary" : "text-foreground"
                    )}
                  >
                    Prompt Content <span className="text-destructive">*</span>
                  </Label>
                  <span
                    className={cn(
                      "text-xs transition-colors",
                      isContentNearLimit
                        ? "text-amber-500"
                        : "text-muted-foreground",
                      content.length > MAX_CONTENT_LENGTH
                        ? "text-destructive"
                        : ""
                    )}
                  >
                    {content.length}/{MAX_CONTENT_LENGTH}
                  </span>
                </div>
                <div
                  className={cn(
                    "relative rounded-md transition-all duration-200",
                    isContentFocused ? "ring-2 ring-primary/20" : ""
                  )}
                >
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter your prompt text here..."
                    className={cn(
                      "min-h-[180px] resize-y transition-all border-input/50 focus:border-primary/30 focus:ring-0",
                      isContentFocused ? "border-primary/30" : ""
                    )}
                    disabled={isSubmitting}
                    required
                    aria-describedby="content-description"
                    onFocus={() => setIsContentFocused(true)}
                    onBlur={() => setIsContentFocused(false)}
                  />
                  {/* Character limit progress bar for visual feedback */}
                  <div className="h-1 mt-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        contentPercentage < 80
                          ? "bg-primary/50"
                          : contentPercentage < 100
                          ? "bg-amber-500"
                          : "bg-destructive"
                      )}
                      style={{ width: `${contentPercentage}%` }}
                    />
                  </div>
                </div>
                <p
                  id="content-description"
                  className="text-xs text-muted-foreground"
                >
                  This is the main text that will be used as your prompt
                </p>
                {error && (
                  <div
                    className="flex items-start p-3 text-sm rounded-lg bg-destructive/10 text-destructive"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags section with card styling */}
            <div className="overflow-hidden transition-shadow border rounded-lg shadow-sm bg-card border-border/40 hover:shadow-md">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Tags</Label>
                </div>

                {/* Tag display with proper whitespace and alignment */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 border border-input/50 rounded-md bg-background/50">
                  {tags.length === 0 && (
                    <span className="text-xs italic text-muted-foreground">
                      No tags added yet
                    </span>
                  )}
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 px-2 py-1 transition-colors rounded-full hover:bg-secondary/80"
                    >
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0.5 text-muted-foreground hover:text-foreground hover:bg-transparent"
                        onClick={() => handleTagRemove(tag)}
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>

                {/* Tag input with clear affordance */}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex flex-1 gap-2">
                    <Input
                      placeholder="Create new tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddNewTag();
                        }
                      }}
                      className="flex-1 transition-all h-9 border-input/50 focus:border-primary/30 focus:ring-1 focus:ring-primary/20"
                      aria-label="Create new tag"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddNewTag}
                      disabled={!newTag.trim()}
                      className="transition-colors rounded-lg h-9 w-9 hover:bg-accent/50"
                      aria-label="Add new tag"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {availableTags.length > 0 && (
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="justify-between transition-colors rounded-lg h-9 sm:w-auto hover:bg-accent/50"
                        >
                          <span className="text-sm">Select existing tags</span>
                          <ChevronDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] shadow-lg rounded-lg border-border/50">
                        <Command>
                          <CommandInput
                            placeholder="Search tags..."
                            value={tagSearch}
                            onValueChange={setTagSearch}
                            className="px-3 py-2 border-b border-border/50 focus-ring-0 focus-visible:outline-none"
                            aria-label="Search tags"
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="flex flex-col items-center justify-center py-4 text-center">
                                <Search className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  No matching tags found
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Try a different search term
                                </p>
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredTags.map((tag) => (
                                <CommandItem
                                  key={tag}
                                  onSelect={() => handleTagSelect(tag)}
                                  className="px-3 py-1.5 transition-colors cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
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
                <p className="text-xs text-muted-foreground">
                  Tags help you organize and find your prompts later
                </p>
              </div>
            </div>
          </form>
        </div>
      </ScrollArea>

      {/* Footer with improved styling */}
      <div className="p-4 border-t bg-muted/20 flex justify-between items-center shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="px-4 transition-colors"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            !content.trim() ||
            content.length > MAX_CONTENT_LENGTH
          }
          className={cn(
            "px-4 h-10 font-medium rounded-lg transition-all gap-2 shadow-sm hover:shadow-md",
            onBack ? "flex-1 ml-3" : "w-full"
          )}
          aria-live="polite"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block animate-spin">↻</span>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Prompt
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

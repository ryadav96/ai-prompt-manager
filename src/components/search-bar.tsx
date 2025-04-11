"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Search, Filter, ChevronDown, Check } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  availableTags: string[];
  selectedTags: string[];
  onTagSelect: (tags: string[]) => void;
  className?: string;
}

export default function SearchBar({
  onSearch,
  availableTags,
  selectedTags,
  onTagSelect,
  className,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [tagSearchInput, setTagSearchInput] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  // Filter available tags based on search input
  const filteredTags = useMemo(() => {
    return availableTags.filter(
      (tag) =>
        tag.toLowerCase().includes(tagSearchInput.toLowerCase()) &&
        !selectedTags.includes(tag)
    );
  }, [availableTags, tagSearchInput, selectedTags]);

  const handleTagSelect = (tag: string) => {
    onTagSelect([...selectedTags, tag]);
    setTagSearchInput("");
  };

  const handleTagRemove = (tagToRemove: string) => {
    onTagSelect(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleClearAll = () => {
    setSearchQuery("");
    onTagSelect([]);
    onSearch("");
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
          <Input
            placeholder="Search prompts by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {(searchQuery || selectedTags.length > 0) && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 w-8 h-8 -translate-y-1/2 rounded-full top-1/2"
              onClick={handleClearAll}
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Clear all filters</span>
            </Button>
          )}
        </div>

        {/* Tags Filter Dropdown */}
        <Popover open={isTagPopoverOpen} onOpenChange={setIsTagPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              role="combobox"
              aria-expanded={isTagPopoverOpen}
              className="justify-between gap-2"
            >
              <Filter className="w-4 h-4 shrink-0" />
              <span>Tags</span>
              <ChevronDown className="w-4 h-4 ml-1 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[250px] p-0 bg-[var(--background)] "
            align="end"
          >
            <Command>
              <CommandInput
                placeholder="Filter tags..."
                value={tagSearchInput}
                onValueChange={setTagSearchInput}
                className="border-none focus-visible:ring-0 focus-visible:outline-none"
              />
              <CommandList>
                <CommandEmpty>No tags found</CommandEmpty>
                <CommandGroup heading="Available Tags">
                  {filteredTags.map((tag) => (
                    <CommandItem
                      key={tag}
                      onSelect={() => handleTagSelect(tag)}
                      className="cursor-pointer"
                    >
                      {tag}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {selectedTags.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="Selected Tags">
                      {selectedTags.map((tag) => (
                        <CommandItem
                          key={tag}
                          onSelect={() => handleTagRemove(tag)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{tag}</span>
                            <Check className="w-4 h-4 text-primary" />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtering by:</span>
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 py-1 pl-2 pr-1 transition-colors rounded-full hover:bg-accent/80"
            >
              <span className="text-sm">{tag}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-5 h-5 rounded-full hover:bg-transparent"
                onClick={() => handleTagRemove(tag)}
              >
                <X className="w-3 h-3" />
                <span className="sr-only">Remove {tag} filter</span>
              </Button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={handleClearAll}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

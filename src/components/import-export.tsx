"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
import { Download, Upload, FileInput, FileCheck } from "lucide-react";
import type { Prompt } from "../types";
import { exportPromptsToJson, importPromptsFromJson } from "../lib/storage";
import { useToast } from "@/hooks/use-toast";

interface ImportExportProps {
  prompts: Prompt[];
  onImport: (prompts: Prompt[]) => void;
}

export default function ImportExport({ prompts, onImport }: ImportExportProps) {
  const [importData, setImportData] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExport = () => {
    try {
      const jsonData = exportPromptsToJson(prompts);
      const dateString = new Date().toISOString().split("T")[0];
      const fileName = `prompts-export-${dateString}.json`;

      // Create a blob and download it
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `${prompts.length} prompts exported to ${fileName}`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting your prompts",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setImportData(content);
        setImportError(null);
      } catch (error) {
        setImportError("Failed to read file");
      }
    };
    reader.onerror = () => {
      setImportError("Error reading file");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImportError(null);
    setIsImporting(true);

    try {
      if (!importData.trim()) {
        setImportError("Please provide JSON data to import");
        setIsImporting(false);
        return;
      }

      const importedPrompts = await importPromptsFromJson(importData);
      onImport(importedPrompts);
      setImportData("");
      setFileName(null);

      toast({
        title: "Import successful",
        description: `Added ${importedPrompts.length} prompts to your collection`,
      });
    } catch (error) {
      console.error("Import failed:", error);
      setImportError(
        error instanceof Error ? error.message : "Invalid JSON format"
      );
      toast({
        title: "Import failed",
        description: "The provided data is not valid",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Card */}
      <Card className="transition-shadow shadow-sm border-border/50 hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Export Prompts</CardTitle>
              <CardDescription>
                Save all your prompts to a JSON file
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This will export {prompts.length} prompt
              {prompts.length !== 1 ? "s" : ""} in JSON format.
            </p>
            {prompts.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Includes titles, content, tags, and metadata.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleExport}
            disabled={prompts.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
            {prompts.length > 0 && (
              <span className="ml-1 text-xs opacity-80">
                ({prompts.length})
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Import Card */}
      <Card className="transition-shadow shadow-sm border-border/50 hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Import Prompts</CardTitle>
              <CardDescription>Add prompts from a JSON file</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label
                htmlFor="file-upload"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-md cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border"
              >
                <FileInput className="w-4 h-4" />
                Choose File
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
              {fileName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileCheck className="w-4 h-4 text-green-500" />
                  <span className="truncate max-w-[180px]">{fileName}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Or paste JSON directly:
            </p>
            <Textarea
              placeholder={`Paste JSON data here...\n\nExample format:\n[\n  {\n    "title": "My Prompt",\n    "content": "...",\n    "tags": ["tag1", "tag2"]\n  }\n]`}
              value={importData}
              onChange={(e) => {
                setImportData(e.target.value);
                setImportError(null);
              }}
              className="min-h-[200px] font-mono text-sm"
            />
            {importError && (
              <div className="p-3 text-sm rounded-md bg-destructive/10 text-destructive">
                {importError}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Imported prompts will be merged with your existing collection.
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={!importData.trim() || isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <>
                    <span className="animate-spin">↻</span>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Import</AlertDialogTitle>
                <AlertDialogDescription>
                  This will merge the imported prompts with your existing
                  collection. Any prompts with the same ID will be overwritten.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleImport}
                  disabled={isImporting}
                >
                  {isImporting ? "Importing..." : "Confirm Import"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}

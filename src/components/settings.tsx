"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  CheckCircle,
  Link2,
  Link2Off,
  Loader2,
  Database,
  HardDrive,
  Settings2,
  RefreshCw,
  Shield,
  Clock,
} from "lucide-react";
import type { StorageType, SyncStatus } from "../types";
import { saveNotionConfig, clearNotionConfig } from "../lib/storage";
import { testNotionConnection } from "../lib/notion";

interface SettingsProps {
  storageType: StorageType;
  notionConnected: boolean;
  onStorageChange: (storageType: StorageType) => void;
  syncStatus: SyncStatus;
  autoSync: boolean;
  onAutoSyncChange: (autoSync: boolean) => void;
}

export default function Settings({
  storageType,
  notionConnected,
  onStorageChange,
  syncStatus,
  autoSync,
  onAutoSyncChange,
}: SettingsProps) {
  const [selectedStorage, setSelectedStorage] =
    useState<StorageType>(storageType);
  const [notionApiKey, setNotionApiKey] = useState("");
  const [notionPageId, setNotionPageId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [isApiKeyFocused, setIsApiKeyFocused] = useState(false);
  const [isPageIdFocused, setIsPageIdFocused] = useState(false);

  // Reset connection status when inputs change
  useEffect(() => {
    if (connectionStatus !== "idle") {
      setConnectionStatus("idle");
    }
  }, [notionApiKey, notionPageId]);

  const handleStorageChange = (value: StorageType) => {
    setSelectedStorage(value);
    // Save immediately when changing storage type
    onStorageChange(value);
  };

  const handleTestConnection = async () => {
    if (!notionApiKey || !notionPageId) {
      toast({
        title: "Missing information",
        description: "Please provide both API key and page ID.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setConnectionStatus("idle");

    try {
      const isConnected = await testNotionConnection({
        apiKey: notionApiKey,
        pageId: notionPageId,
      });

      setConnectionStatus(isConnected ? "success" : "error");

      toast({
        title: isConnected ? "Connection successful" : "Connection failed",
        description: isConnected
          ? "Your Notion credentials are valid."
          : "Could not connect to Notion with the provided credentials.",
        variant: isConnected ? "default" : "destructive",
      });
    } catch (error) {
      setConnectionStatus("error");
      console.error("Failed to test Notion connection:", error);
      toast({
        title: "Connection failed",
        description: "There was a problem connecting to Notion.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleConnectNotion = async () => {
    if (!notionApiKey || !notionPageId) {
      toast({
        title: "Missing information",
        description: "Please provide both API key and page ID.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      await saveNotionConfig({
        apiKey: notionApiKey,
        pageId: notionPageId,
      });

      setNotionApiKey("");
      setNotionPageId("");
      setConnectionStatus("idle");
      onStorageChange("notion");

      toast({
        title: "Notion connected",
        description: "Your Notion account has been connected successfully.",
      });
    } catch (error) {
      console.error("Failed to connect Notion:", error);
      toast({
        title: "Connection failed",
        description: "There was a problem connecting to Notion.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectNotion = async () => {
    setIsDisconnecting(true);

    try {
      await clearNotionConfig();
      onStorageChange("local");

      toast({
        title: "Notion disconnected",
        description: "Your Notion account has been disconnected.",
      });
    } catch (error) {
      console.error("Failed to disconnect Notion:", error);
      toast({
        title: "Disconnection failed",
        description: "There was a problem disconnecting from Notion.",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const formatLastSyncTime = (timestamp: number | null) => {
    if (!timestamp) return "Never";
    const now = new Date();
    const syncTime = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - syncTime.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60)
      return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
    if (diffInMinutes < 24 * 60)
      return `${Math.floor(diffInMinutes / 60)} hour${
        diffInMinutes / 60 < 2 ? "" : "s"
      } ago`;
    return syncTime.toLocaleString();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-6">
          {/* Storage Settings Card */}
          <div className="overflow-hidden transition-shadow border rounded-lg shadow-sm bg-card border-border/40 hover:shadow-md">
            <div className="p-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Storage Settings</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose where to store your prompts
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <RadioGroup
                value={selectedStorage}
                onValueChange={handleStorageChange as (value: string) => void}
                className="space-y-3"
              >
                <div className="flex items-center p-3 space-x-3 transition-colors border rounded-lg hover:bg-accent/50">
                  <RadioGroupItem
                    value="local"
                    id="local"
                    className="w-5 h-5"
                  />
                  <Label htmlFor="local" className="flex-1 cursor-pointer">
                    <div className="font-medium">Local Storage</div>
                    <div className="text-sm text-muted-foreground">
                      Store prompts in your browser's local storage
                    </div>
                  </Label>
                  {selectedStorage === "local" && (
                    <Badge variant="secondary" className="px-2 py-1">
                      Active
                    </Badge>
                  )}
                </div>

                <div className="flex items-center p-3 space-x-3 transition-colors border rounded-lg hover:bg-accent/50">
                  <RadioGroupItem
                    value="notion"
                    id="notion"
                    className="w-5 h-5"
                    disabled={!notionConnected}
                  />
                  <Label htmlFor="notion" className="flex-1 cursor-pointer">
                    <div className="font-medium">Notion Database</div>
                    <div className="text-sm text-muted-foreground">
                      {notionConnected
                        ? "Sync prompts with your Notion workspace"
                        : "Connect your Notion account"}
                    </div>
                  </Label>
                  {notionConnected ? (
                    selectedStorage === "notion" ? (
                      <Badge variant="secondary" className="px-2 py-1">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="px-2 py-1">
                        <Link2 className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    )
                  ) : (
                    <Badge variant="outline" className="px-2 py-1">
                      Not Connected
                    </Badge>
                  )}
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Notion Integration Card */}
          <div className="overflow-hidden transition-shadow border rounded-lg shadow-sm bg-card border-border/40 hover:shadow-md">
            <div className="p-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Notion Integration</h2>
                  <p className="text-sm text-muted-foreground">
                    {notionConnected
                      ? "Manage your Notion connection"
                      : "Connect your Notion account to sync prompts"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {!notionConnected ? (
                <>
                  <div className="space-y-3">
                    <Label
                      htmlFor="notion-api-key"
                      className="text-sm font-medium"
                    >
                      Notion API Key
                    </Label>
                    <div
                      className={`relative rounded-md transition-all duration-200 ${
                        isApiKeyFocused ? "ring-2 ring-primary/20" : ""
                      }`}
                    >
                      <Input
                        id="notion-api-key"
                        type="password"
                        value={notionApiKey}
                        onChange={(e) => setNotionApiKey(e.target.value)}
                        placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className={`font-mono h-10 transition-all border-input/50 focus:border-primary/30 focus:ring-0 ${
                          isApiKeyFocused ? "border-primary/30" : ""
                        }`}
                        onFocus={() => setIsApiKeyFocused(true)}
                        onBlur={() => setIsApiKeyFocused(false)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Create an integration in Notion and copy the "Internal
                      Integration Token"
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="notion-page-id"
                      className="text-sm font-medium"
                    >
                      Notion Database ID
                    </Label>
                    <div
                      className={`relative rounded-md transition-all duration-200 ${
                        isPageIdFocused ? "ring-2 ring-primary/20" : ""
                      }`}
                    >
                      <Input
                        id="notion-page-id"
                        value={notionPageId}
                        onChange={(e) => setNotionPageId(e.target.value)}
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className={`font-mono h-10 transition-all border-input/50 focus:border-primary/30 focus:ring-0 ${
                          isPageIdFocused ? "border-primary/30" : ""
                        }`}
                        onFocus={() => setIsPageIdFocused(true)}
                        onBlur={() => setIsPageIdFocused(false)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Share a database with your integration and copy its ID
                      from the URL
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isTesting || !notionApiKey || !notionPageId}
                      className="gap-2 transition-all hover:bg-accent/50"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        "Test Connection"
                      )}
                    </Button>
                    <Button
                      onClick={handleConnectNotion}
                      disabled={isConnecting || !notionApiKey || !notionPageId}
                      className="gap-2 transition-all shadow-sm hover:shadow-md"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4" />
                          Connect Notion
                        </>
                      )}
                    </Button>
                  </div>

                  {connectionStatus !== "idle" && (
                    <div
                      className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                        connectionStatus === "success"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {connectionStatus === "success" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span>
                        {connectionStatus === "success"
                          ? "Connection successful! You can now connect to Notion."
                          : "Connection failed. Please check your credentials."}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-muted/30 border-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div className="font-medium">Sync Status</div>
                        </div>
                        <Badge
                          variant={
                            syncStatus.error ? "destructive" : "secondary"
                          }
                        >
                          {syncStatus.error ? "Error" : "Connected"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {syncStatus.inProgress
                          ? "Syncing in progress..."
                          : syncStatus.lastSynced
                          ? `Last synced ${formatLastSyncTime(
                              syncStatus.lastSynced
                            )}`
                          : "Never synced"}
                      </div>
                    </div>

                    {syncStatus.error && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">{syncStatus.error}</div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 border rounded-lg border-border/40">
                      <div>
                        <Label htmlFor="auto-sync" className="font-medium">
                          Automatic Sync
                        </Label>
                        <div className="text-sm text-muted-foreground">
                          Automatically sync changes with Notion
                        </div>
                      </div>
                      <Switch
                        id="auto-sync"
                        checked={autoSync}
                        onCheckedChange={onAutoSyncChange}
                        disabled={storageType !== "notion"}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="gap-2 transition-all hover:bg-accent/50"
                      onClick={() => {}}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Sync Now
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDisconnectNotion}
                      disabled={isDisconnecting}
                      className="gap-2"
                    >
                      {isDisconnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <Link2Off className="w-4 h-4" />
                          Disconnect Notion
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Privacy Settings Card */}
          <div className="overflow-hidden transition-shadow border rounded-lg shadow-sm bg-card border-border/40 hover:shadow-md">
            <div className="p-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Privacy & Data</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your data and privacy settings
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg border-border/40">
                <div>
                  <Label htmlFor="analytics" className="font-medium">
                    Usage Analytics
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    Allow anonymous usage data collection
                  </div>
                </div>
                <Switch
                  id="analytics"
                  checked={false}
                  onCheckedChange={() => {}}
                />
              </div>

              <Button
                variant="outline"
                className="justify-start w-full h-auto px-4 py-3 text-left"
              >
                <div>
                  <div className="font-medium">Clear All Data</div>
                  <div className="text-sm text-muted-foreground">
                    Remove all locally stored prompts and settings
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

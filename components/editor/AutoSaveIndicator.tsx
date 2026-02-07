"use client";

import { CheckCircle2, Loader2, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

type SyncStatus = "synced" | "syncing" | "offline";

interface AutoSaveIndicatorProps {
  status: SyncStatus;
}

export function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "synced":
        return {
          icon: CheckCircle2,
          text: "Saved",
          className: "text-green-600",
        };
      case "syncing":
        return {
          icon: Loader2,
          text: "Saving...",
          className: "text-blue-600 animate-spin",
        };
      case "offline":
        return {
          icon: WifiOff,
          text: "Offline",
          className: "text-gray-500",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className={cn("h-4 w-4", config.className)} />
      <span>{config.text}</span>
    </div>
  );
}


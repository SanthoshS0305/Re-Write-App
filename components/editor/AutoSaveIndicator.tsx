"use client";

import { CheckCircle2, Loader2, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

type SyncStatus = "synced" | "syncing" | "offline";

interface AutoSaveIndicatorProps {
  status: SyncStatus;
  textHidden?: boolean;
}

export function AutoSaveIndicator({ status, textHidden = false }: AutoSaveIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "synced":
        return { icon: CheckCircle2, text: "Saved", color: "var(--green-highlight)" };
      case "syncing":
        return { icon: Loader2, text: "Saving...", color: "var(--aqua)", spin: true };
      case "offline":
        return { icon: WifiOff, text: "Offline", color: "var(--light-gray)" };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1 text-xs font-display" style={{ color: "var(--light-gray)", opacity: 0.7 }}>
      <Icon className={cn("h-4 w-4", (config as any).spin ? "animate-spin" : "")} style={{ color: config.color }} />
      {!textHidden && <span>{config.text}</span>}
    </div>
  );
}


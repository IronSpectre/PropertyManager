"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SyncResult {
  synced: number;
  created: number;
  updated: number;
  message: string;
}

export function SyncSmoobuButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setResult(null);

    try {
      const response = await fetch("/api/properties/sync", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        // Reload the page to show new properties
        if (data.created > 0 || data.updated > 0) {
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        setResult({
          synced: 0,
          created: 0,
          updated: 0,
          message: "Failed to sync properties",
        });
      }
    } catch {
      setResult({
        synced: 0,
        created: 0,
        updated: 0,
        message: "Error connecting to Smoobu",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {result && (
        <span className="text-sm text-muted-foreground">
          {result.created > 0 || result.updated > 0
            ? `${result.created} created, ${result.updated} updated`
            : result.message}
        </span>
      )}
      <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
        {isSyncing ? "Syncing..." : "Sync from Smoobu"}
      </Button>
    </div>
  );
}

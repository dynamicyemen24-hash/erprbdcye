import React, { useEffect, useState } from "react";
import checkForUpdate from "../core/updates";
import { X } from "lucide-react";

interface UpdateBannerProps {
  autoCheck: boolean;
  onDismiss: () => void;
}

export function UpdateBanner({ autoCheck = true, onDismiss }: UpdateBannerProps) {
  const [result, setResult] = useState<{ hasUpdate: boolean; latest: string } | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!autoCheck) return;
    checkForUpdate().then((r) => {
      setResult(r);
      setShow(true);
    });
  }, [autoCheck]);

  if (!show || !result) return null;

  const { hasUpdate, latest } = result;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-zinc-950 border-b border-zinc-800 text-zinc-200 p-4 flex items-center gap-3 shadow-lg"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        {hasUpdate && (
          <svg
            className="w-4 h-4 text-emerald-400"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        )}
        {!hasUpdate && (
          <svg
            className="w-4 h-4 text-emerald-400"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        )}
        <span className="font-medium">{hasUpdate ? "Update available" : "You're up to date"}</span>
      </div>
      <span className="ml-auto text-sm">
        {hasUpdate ? `v${latest}` : "v4.0.0"}
      </span>
      <button
        onClick={onDismiss}
        className="ml-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg px-2 py-0.5 text-sm transition-colors"
        aria-label="Dismiss update notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
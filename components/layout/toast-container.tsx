"use client"

import { useToasts } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export function ToastContainer() {
  const { toasts, dismiss } = useToasts()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex w-72 items-start gap-2 rounded-lg border px-3 py-2.5 text-sm shadow-lg animate-in fade-in slide-in-from-right-2",
            t.variant === "destructive"
              ? "border-danger/30 bg-danger/10 text-danger"
              : "border-border-subtle bg-surface text-text-primary",
          )}
        >
          <div className="flex-1">
            <p className="font-medium">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t.description}
              </p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
    </div>
  )
}

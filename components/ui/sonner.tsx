"use client"

import { Toaster as Sonner } from "sonner"

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-text-primary group-[.toaster]:border-border-subtle group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-text-muted",
          actionButton:
            "group-[.toast]:bg-accent-primary group-[.toast]:text-bg-primary",
          cancelButton:
            "group-[.toast]:bg-surface group-[.toast]:text-text-muted",
          success: "group-[.toast]:border-accent-primary/50 group-[.toast]:text-accent-primary",
          error: "group-[.toast]:border-danger/50 group-[.toast]:text-danger",
        },
      }}
    />
  )
}

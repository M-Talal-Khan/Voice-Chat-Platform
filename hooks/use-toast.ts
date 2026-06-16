"use client"

import { toast as sonnerToast } from "sonner"

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: "default" | "destructive"
}

export function toast(
  title: string,
  opts?: { description?: string; variant?: "default" | "destructive" },
) {
  if (opts?.variant === "destructive") {
    sonnerToast.error(title, {
      description: opts.description,
    })
  } else {
    sonnerToast.success(title, {
      description: opts.description,
    })
  }
}

export function useToasts() {
  return { 
    toasts: [], 
    dismiss: () => {} 
  }
}

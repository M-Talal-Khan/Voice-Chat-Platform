"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { useAppStore } from "@/lib/store"

export function usePresence() {
  const { currentUser, setCurrentUser } = useAppStore()
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null)

  useEffect(() => {
    if (!currentUser) return

    const supabase = createClient()

    // Update profile status to online
    supabase
      .from("profiles")
      .update({ status: "online" })
      .eq("id", currentUser.id)
      .then(() => {
        setCurrentUser({ ...currentUser, status: "online" } as any)
      })

    // Join presence channel
    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    })

    channel
      .on("presence", { event: "sync" }, () => {
        // Could track presence state here
      })
      .on("presence", { event: "join" }, ({ key }) => {
        // User joined
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        // User left
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: currentUser.id,
            username: currentUser.username,
            online_at: new Date().toISOString(),
          })
        }
      })

    channelRef.current = channel

    // Handle tab close
    function handleBeforeUnload() {
      supabase
        .from("profiles")
        .update({ status: "offline" })
        .eq("id", currentUser.id)

      channel.untrack()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      supabase
        .from("profiles")
        .update({ status: "offline" })
        .eq("id", currentUser.id)
      channel.untrack()
      supabase.removeChannel(channel)
    }
  }, [currentUser?.id])
}

export function useUnreadNotifications() {
  const { messages, dmMessages } = useAppStore()
  const unreadCount = messages.length > 0 || dmMessages.length > 0

  useEffect(() => {
    const total = messages.length + dmMessages.length

    if (total > 0) {
      document.title = `(${total}) NexTalk`
    } else {
      document.title = "NexTalk"
    }

    // Clear on focus
    function handleFocus() {
      document.title = "NexTalk"
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [messages.length, dmMessages.length])
}

"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { useAppStore } from "@/lib/store"

export function usePresence() {
  const { currentUser, setCurrentUser } = useAppStore()
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null)

  useEffect(() => {
    if (!currentUser) return
    const userId = currentUser.id

    const supabase = createClient()

    // Update profile status to online
    supabase
      .from("profiles")
      .update({ status: "online" })
      .eq("id", userId)
      .then(() => {
        setCurrentUser({ ...currentUser, status: "online" } as any)
      })

    // Join presence channel
    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: userId,
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
            user_id: userId,
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
        .eq("id", userId)

      channel.untrack()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      supabase
        .from("profiles")
        .update({ status: "offline" })
        .eq("id", userId)
      channel.untrack()
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id])
}

export function useUnreadNotifications() {
  const { messages, dmMessages } = useAppStore()
  const unreadCount = messages.length > 0 || dmMessages.length > 0

  useEffect(() => {
    const total = messages.length + dmMessages.length

    if (total > 0) {
      document.title = `(${total}) Thiscord`
    } else {
      document.title = "Thiscord"
    }

    // Clear on focus
    function handleFocus() {
      document.title = "Thiscord"
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [messages.length, dmMessages.length])
}

"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase"
import { useAppStore } from "@/lib/store"

export function usePresence() {
  const currentUser = useAppStore(state => state.currentUser)
  const setCurrentUser = useAppStore(state => state.setCurrentUser)
  
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
        // We don't want to trigger a full re-render here if not needed
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
        // Track presence state if needed globally
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
  }, [currentUser?.id, currentUser?.username]) // eslint-disable-line react-hooks/exhaustive-deps
}

export function useUnreadNotifications() {
  const messages = useAppStore(state => state.messages)
  const dmMessages = useAppStore(state => state.dmMessages)

  useEffect(() => {
    const total = messages.filter(m => m.isPending).length + dmMessages.filter(m => m.isPending).length
    // This is just a placeholder for real unread logic which would involve last_read_at
    if (total > 0) {
      document.title = `(${total}) Thiscord`
    } else {
      document.title = "Thiscord"
    }

    function handleFocus() {
      document.title = "Thiscord"
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [messages, dmMessages])
}

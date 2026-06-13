"use client"

import { useEffect, useState } from "react"
import { Hash } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/supabase"
import type { Message } from "@/lib/types"

export default function AppPage() {
  const { selectedChannel, selectedServer } = useAppStore()

  if (!selectedServer) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Select a server to start chatting</p>
      </div>
    )
  }

  if (!selectedChannel) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Select a channel</p>
      </div>
    )
  }

  if (selectedChannel.type === "voice") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">
            <span className="text-[var(--color-online)]">●</span> Voice Channel
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You are in <strong>{selectedChannel.name}</strong>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-4">
        <Hash className="size-4 text-muted-foreground" />
        <span className="font-semibold">{selectedChannel.name}</span>
        {selectedChannel.topic && (
          <>
            <span className="mx-1 h-4 w-px bg-border/60" />
            <span className="truncate text-xs text-muted-foreground">
              {selectedChannel.topic}
            </span>
          </>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <ChatMessages channelId={selectedChannel.id} />
      </div>

      {/* Message input */}
      <ChatInput channelId={selectedChannel.id} />
    </div>
  )
}

function ChatMessages({ channelId }: { channelId: string }) {
  const { messages, setMessages } = useAppStore()

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from("messages")
      .select("*, profile:profiles(*), reactions:message_reactions(*), attachments:attachments(*)")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          setMessages(data as any)
        }
      })

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("messages")
            .select("*, profile:profiles(*), reactions:message_reactions(*), attachments:attachments(*)")
            .eq("id", payload.new.id)
            .single()
          if (data) {
            useAppStore.getState().addMessage(data as any)
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          useAppStore.getState().updateMessage(payload.new.id as string, payload.new as any)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          useAppStore.getState().deleteMessage(payload.old.id as string)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId, setMessages])

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No messages yet. Start the conversation!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const initials = message.profile?.username
    ? message.profile.username.slice(0, 2).toUpperCase()
    : "??"

  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : ""

  return (
    <div className="group flex items-start gap-3 rounded-md px-2 py-1 transition-colors hover:bg-background/30">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">
            {message.profile?.username ?? "Unknown"}
          </span>
          <span className="text-[11px] text-muted-foreground">{time}</span>
          {message.edited && (
            <span className="text-[11px] text-muted-foreground">(edited)</span>
          )}
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-foreground/90">
          {message.content}
        </p>
      </div>
    </div>
  )
}

function ChatInput({ channelId }: { channelId: string }) {
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)
  const { currentUser } = useAppStore()

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || sending || !currentUser) return

    setSending(true)
    const supabase = createClient()

    const { error } = await supabase.from("messages").insert({
      channel_id: channelId,
      user_id: currentUser.id,
      content: content.trim(),
    })

    if (!error) {
      setContent("")
    }
    setSending(false)
  }

  return (
    <form onSubmit={handleSend} className="shrink-0 border-t border-border/60 px-4 py-3">
      <div className="flex items-center gap-2 rounded-lg bg-background/40 px-3 py-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Message #${useAppStore.getState().selectedChannel?.name ?? "channel"}`}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </form>
  )
}

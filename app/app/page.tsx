"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  Hash,
  Volume2,
  Send,
  Pencil,
  Trash2,
  Reply,
  SmilePlus,
  X,
  Loader2,
  ChevronDown,
  Paperclip,
  FileText,
  Image,
} from "lucide-react"
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
            Connected to <strong>{selectedChannel.name}</strong>
          </p>
        </div>
      </div>
    )
  }

  return <ChatView channelId={selectedChannel.id} channelName={selectedChannel.name} channelTopic={selectedChannel.topic ?? undefined} />
}

// ─── Chat View ──────────────────────────────────────────────────

function ChatView({
  channelId,
  channelName,
  channelTopic,
}: {
  channelId: string
  channelName: string
  channelTopic?: string
}) {
  const { messages, setMessages } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  // Fetch messages
  useEffect(() => {
    setLoading(true)
    const supabase = createClient()

    supabase
      .from("messages")
      .select("*, profile:profiles(*), reactions:message_reactions(*), attachments:attachments(*)")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          setMessages((data as any).reverse())
          setHasMore(data.length === 50)
        }
        setLoading(false)
      })

    // Realtime subscription
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
      setMessages([])
    }
  }, [channelId, setMessages])

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages.length, autoScroll])

  // Track scroll position
  function handleScroll() {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100)
  }

  // Load more messages
  async function loadMore() {
    if (!hasMore || messages.length === 0) return
    const supabase = createClient()
    const oldest = messages[0]

    const { data } = await supabase
      .from("messages")
      .select("*, profile:profiles(*), reactions:message_reactions(*), attachments:attachments(*)")
      .eq("channel_id", channelId)
      .lt("created_at", oldest.created_at)
      .order("created_at", { ascending: false })
      .limit(50)

    if (data && data.length > 0) {
      const existing = useAppStore.getState().messages
      useAppStore.getState().setMessages([...data.reverse(), ...existing])
      setHasMore(data.length === 50)
    } else {
      setHasMore(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-4">
        <Hash className="size-4 text-muted-foreground" />
        <span className="font-semibold">{channelName}</span>
        {channelTopic && (
          <>
            <span className="mx-1 h-4 w-px bg-border/60" />
            <span className="truncate text-xs text-muted-foreground">
              {channelTopic}
            </span>
          </>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="mb-4 text-center">
                <button
                  onClick={loadMore}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Load older messages
                </button>
              </div>
            )}
            <div className="space-y-1">
              {messages.map((message, i) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isFirst={i === 0 || messages[i - 1]?.user_id !== message.user_id}
                  onReply={(msg) => {
                    setReplyTo(msg)
                  }}
                />
              ))}
            </div>
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* New messages indicator */}
      {!autoScroll && !loading && (
        <button
          onClick={() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" })
            setAutoScroll(true)
          }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground shadow-lg"
        >
          <ChevronDown className="size-3 inline" /> New messages
        </button>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 border-t border-border/60 bg-muted/50 px-4 py-1.5">
          <Reply className="size-3 text-muted-foreground shrink-0" />
          <div className="flex-1 truncate text-xs text-muted-foreground">
            Replying to <span className="font-medium text-foreground">{replyTo.profile?.username ?? "Unknown"}</span>:{" "}
            {replyTo.content.slice(0, 80)}
          </div>
          <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground">
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* Chat Input */}
      <ChatInput channelId={channelId} replyTo={replyTo} onReplyClear={() => setReplyTo(null)} />
    </div>
  )
}

// ─── Message Bubble ─────────────────────────────────────────────

const EMOJIS = ["👍", "❤️", "😂", "🔥", "🚀", "🎉", "💯", "👀"]

function MessageBubble({
  message,
  isFirst,
  onReply,
}: {
  message: Message
  isFirst: boolean
  onReply: (msg: Message) => void
}) {
  const { currentUser, updateMessage, deleteMessage } = useAppStore()
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showEmojis, setShowEmojis] = useState(false)
  const editRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const isOwner = currentUser?.id === message.user_id

  const initials = message.profile?.username?.slice(0, 2).toUpperCase() ?? "??"
  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : ""

  // Group reactions by emoji
  const groupedReactions = (message.reactions ?? []).reduce(
    (acc, r) => {
      const existing = acc.find((g) => g.emoji === r.emoji)
      if (existing) {
        existing.count++
        if (r.user_id === currentUser?.id) existing.reacted = true
      } else {
        acc.push({ emoji: r.emoji, count: 1, reacted: r.user_id === currentUser?.id })
      }
      return acc
    },
    [] as { emoji: string; count: number; reacted: boolean }[],
  )

  async function handleSaveEdit() {
    if (!editContent.trim() || editContent === message.content) {
      setEditing(false)
      return
    }
    await supabase
      .from("messages")
      .update({ content: editContent.trim(), edited: true })
      .eq("id", message.id)
    updateMessage(message.id, { content: editContent.trim(), edited: true } as any)
    setEditing(false)
  }

  async function handleDelete() {
    await supabase.from("messages").delete().eq("id", message.id)
    deleteMessage(message.id)
  }

  async function handleReaction(emoji: string) {
    const existing = (message.reactions ?? []).find(
      (r) => r.emoji === emoji && r.user_id === currentUser?.id,
    )
    if (existing) {
      await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", message.id)
        .eq("user_id", currentUser?.id)
        .eq("emoji", emoji)
      useAppStore.getState().removeReaction(message.id, emoji, currentUser?.id ?? "")
    } else {
      await supabase.from("message_reactions").insert({
        message_id: message.id,
        user_id: currentUser?.id,
        emoji,
      })
      useAppStore.getState().addReaction(message.id, { emoji, userId: currentUser?.id ?? "" })
    }
  }

  if (editing) {
    return (
      <div className="flex items-start gap-3 px-2 py-1">
        <div className="flex-1">
          <input
            ref={editRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus-visible:border-ring"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit()
              if (e.key === "Escape") setEditing(false)
            }}
            autoFocus
          />
          <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
            <span>escape to cancel • enter to save</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative flex items-start gap-3 rounded-md px-2 py-0.5 transition-colors hover:bg-background/30">
      {/* Avatar or spacer */}
      {isFirst ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials}
        </span>
      ) : (
        <span className="invisible flex size-9 shrink-0 items-center justify-center text-[10px] text-muted-foreground group-hover:visible">
          {time}
        </span>
      )}

      <div className="min-w-0 flex-1">
        {isFirst && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium">{message.profile?.username ?? "Unknown"}</span>
            <span className="text-[11px] text-muted-foreground">{time}</span>
            {message.edited && <span className="text-[11px] text-muted-foreground">(edited)</span>}
          </div>
        )}
        <p className="text-sm leading-relaxed text-foreground/90">{message.content}</p>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att) => {
              const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(
                att.file_type?.split("/")[1]?.toLowerCase() ?? "",
              )
              if (isImage) {
                return (
                  <a
                    key={att.id}
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="overflow-hidden rounded-lg border border-border"
                  >
                    <img
                      src={att.file_url}
                      alt={att.file_name}
                      className="max-h-48 max-w-60 object-cover"
                    />
                  </a>
                )
              }
              return (
                <a
                  key={att.id}
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs transition-colors hover:bg-muted"
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{att.file_name}</p>
                    <p className="text-muted-foreground">
                      {att.file_size > 1024 * 1024
                        ? `${(att.file_size / 1024 / 1024).toFixed(1)} MB`
                        : `${(att.file_size / 1024).toFixed(0)} KB`}
                    </p>
                  </div>
                </a>
              )
            })}
          </div>
        )}

        {/* Reactions */}
        {groupedReactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {groupedReactions.map((g) => (
              <button
                key={g.emoji}
                onClick={() => handleReaction(g.emoji)}
                className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors ${
                  g.reacted
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {g.emoji} {g.count}
              </button>
            ))}
          </div>
        )}

        {/* Reply preview */}
        {message.reply_to && (
          <div className="mt-1 flex items-center gap-1.5 border-l-2 border-muted-foreground/30 pl-2">
            <span className="text-xs font-medium text-muted-foreground">
              {message.reply_to.profile?.username ?? "Unknown"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {message.reply_to.content.slice(0, 60)}
            </span>
          </div>
        )}
      </div>

      {/* Hover actions */}
      <div className="invisible absolute -top-3 right-2 flex items-center gap-0.5 rounded-lg border border-border bg-card shadow-sm group-hover:visible">
        <button
          onClick={() => onReply(message)}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
          title="Reply"
        >
          <Reply className="size-3.5" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowEmojis(!showEmojis)}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
            title="React"
          >
            <SmilePlus className="size-3.5" />
          </button>
          {showEmojis && (
            <div className="absolute top-full left-0 z-50 mt-1 flex gap-0.5 rounded-lg border border-border bg-card p-1 shadow-lg">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    handleReaction(emoji)
                    setShowEmojis(false)
                  }}
                  className="rounded p-1 text-sm hover:bg-muted"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        {isOwner && (
          <>
            <button
              onClick={() => {
                setEditContent(message.content)
                setEditing(true)
              }}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
              title="Edit"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="rounded p-1 text-muted-foreground hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="size-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Chat Input ─────────────────────────────────────────────────

function ChatInput({
  channelId,
  replyTo,
  onReplyClear,
}: {
  channelId: string
  replyTo: Message | null
  onReplyClear: () => void
}) {
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { currentUser, selectedChannel } = useAppStore()

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    if (!content.trim() || sending || !currentUser) return

    setSending(true)
    const supabase = createClient()

    const { data: msg, error } = await supabase
      .from("messages")
      .insert({
        channel_id: channelId,
        user_id: currentUser.id,
        content: content.trim(),
        reply_to_id: replyTo?.id ?? null,
      })
      .select()
      .single()

    if (!error && msg) {
      setContent("")
      onReplyClear()
    }
    setSending(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size must be under 10MB")
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadError(null)
    const supabase = createClient()

    const fileExt = file.name.split(".").pop()
    const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      setUploadError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = await supabase.storage
      .from("attachments")
      .getPublicUrl(filePath)

    // Insert the message first, then add attachment
    const { data: msg, error: msgError } = await supabase
      .from("messages")
      .insert({
        channel_id: channelId,
        user_id: currentUser.id,
        content: file.name,
      })
      .select()
      .single()

    if (msgError || !msg) {
      setUploadError(msgError?.message ?? "Failed to create message")
      setUploading(false)
      return
    }

    await supabase.from("attachments").insert({
      message_id: msg.id,
      file_url: urlData?.publicUrl ?? "",
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    })

    setUploadProgress(100)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <form onSubmit={handleSend} className="shrink-0 border-t border-border/60 px-4 py-3">
      {uploadError && (
        <div className="mb-2 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          {uploadError}
        </div>
      )}
      {uploading && (
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Uploading... {uploadProgress > 0 && `${uploadProgress}%`}
        </div>
      )}
      <div className="flex items-center gap-2 rounded-lg bg-background/40 px-3 py-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf,.txt,.zip,.mp3,.mp4"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          title="Attach file"
        >
          <Paperclip className="size-4" />
        </button>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Message #${selectedChannel?.name ?? "channel"}`}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          disabled={sending || uploading}
        />
        <button
          type="submit"
          disabled={(!content.trim() && !uploading) || sending || uploading}
          className="rounded-md bg-primary p-1.5 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </div>
    </form>
  )
}

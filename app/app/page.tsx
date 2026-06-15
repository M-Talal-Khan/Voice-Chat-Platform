"use client"

import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react"
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
  Image as ImageIcon,
  MicOff,
  PhoneOff,
  Headphones,
  Camera,
  WifiOff,
  RefreshCw,
} from "lucide-react"
import { useParticipants } from "@livekit/components-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import type { Message } from "@/lib/types"
import { ChatInput, type FileAttachment } from "@/components/features/chat-input"
import { AttachmentGallery } from "@/components/features/attachment-gallery"
import { getImageDimensions } from "@/lib/media-utils"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useVirtualizer } from "@tanstack/react-virtual"

function FloatingDots() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-accent-primary/20 animate-pulse"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            animationDuration: `${Math.random() * 3 + 2}s`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function AppPage() {
  const selectedServer = useAppStore((state) => state.selectedServer)
  const selectedChannel = useAppStore((state) => state.selectedChannel)
  const setSelectedChannel = useAppStore((state) => state.setSelectedChannel)
  const channels = useAppStore((state) => state.channels)
  const members = useAppStore((state) => state.members)

  const router = useRouter()

  if (!selectedServer) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center bg-bg-primary overflow-hidden">
        <FloatingDots />
        <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up">
          <Image
            src="/logo-with-text.svg"
            alt="Thiscord"
            width={240}
            height={60}
            className="mb-8 w-[240px]"
            style={{ filter: "drop-shadow(0 0 12px rgba(170, 255, 0, 0.4))" }}
          />
          <h1 className="text-3xl font-bold tracking-heading text-text-primary">Welcome to Thiscord</h1>
          <p className="mt-2 text-text-muted text-muted-opacity">totally not Discord. select a server to start.</p>
          <div className="mt-8 flex gap-4">
            <Button onClick={() => router.push("/app/explore")} className="shadow-accent-glow hover:scale-105 transition-transform">
              Browse Servers
            </Button>
            <Button variant="outline" onClick={() => window.dispatchEvent(new CustomEvent("openCreateServer"))} className="hover:scale-105 transition-transform">
              Create Server
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedChannel) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center bg-bg-primary overflow-hidden">
        <FloatingDots />
        <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up max-w-md w-full px-4">
          <div className="size-24 rounded-server bg-surface flex items-center justify-center text-3xl font-bold text-accent-primary shadow-accent-glow mb-6">
            {selectedServer.name.slice(0,2).toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold tracking-heading text-text-primary mb-2">{selectedServer.name}</h2>
          <p className="text-sm text-text-muted text-muted-opacity mb-8">
            {members.filter(m => m.profile?.status === 'online').length} members online
          </p>
          <div className="w-full glass-strong rounded-xl p-4 border border-border-subtle">
            <h3 className="text-xs font-semibold uppercase tracking-section text-text-muted mb-3 text-left">Jump into a channel</h3>
            <div className="flex flex-col gap-1">
              {channels.slice(0, 5).map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChannel(c)}
                  className="flex items-center gap-2 p-2 rounded hover:bg-surface text-left transition-colors text-sm"
                >
                  {c.type === 'voice' ? <Volume2 className="size-4 text-text-muted" /> : <Hash className="size-4 text-text-muted" />}
                  <span className="text-text-primary">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedChannel.type === "voice") {
    return <VoiceChannelView channelName={selectedChannel.name} channelId={selectedChannel.id} />
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
  const messages = useAppStore((state) => state.messages)
  const setMessages = useAppStore((state) => state.setMessages)
  const addMessage = useAppStore((state) => state.addMessage)
  const updateMessage = useAppStore((state) => state.updateMessage)
  const deleteMessage = useAppStore((state) => state.deleteMessage)
  const currentUser = useAppStore((state) => state.currentUser)
  const isConnected = useAppStore((state) => state.isConnected)
  const setIsConnected = useAppStore((state) => state.setIsConnected)

  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [replyTo, setReplyTo] = useState<Message | null>(null)

  const fetchMessages = useCallback(async (cId: string, before?: string) => {
    const supabase = createClient()
    let query = supabase
      .from("messages")
      .select(`
        *,
        profile:profiles(*),
        reactions:message_reactions(*),
        attachments:attachments(*),
        reply_to:messages(
          id,
          content,
          profile:profiles(username, avatar_url)
        )
      `)
      .eq("channel_id", cId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (before) {
      query = query.lt("created_at", before)
    }

    const { data } = await query
    return data
  }, [])

  // Initial fetch
  useEffect(() => {
    setLoading(true)
    fetchMessages(channelId).then((data) => {
      if (data) {
        setMessages((data as any).reverse())
        setHasMore(data.length === 50)
      }
      setLoading(false)
    })

    const supabase = createClient()
    const realtimeChannel = supabase
      .channel(`messages-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // Dedup
          if (useAppStore.getState().messages.some(m => m.id === payload.new.id)) return

          const { data: fullMessage } = await supabase
            .from("messages")
            .select(`
              *,
              profile:profiles(*),
              reactions:message_reactions(*),
              attachments:attachments(*),
              reply_to:messages(
                id,
                content,
                profile:profiles(username, avatar_url)
              )
            `)
            .eq("id", payload.new.id)
            .single()

          if (fullMessage) {
            useAppStore.getState().addMessage(fullMessage as any)
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        }
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false)
        }
      })

    // Monitor connection
    supabase.getChannels().forEach(channel => {
      channel.on('system', {}, (status: any) => {
        if (status === 'disconnected') setIsConnected(false)
        if (status === 'reconnected') {
          setIsConnected(true)
          fetchMessages(channelId).then(data => {
             if (data) useAppStore.getState().setMessages((data as any).reverse())
          })
        }
      })
    })

    return () => {
      supabase.removeChannel(realtimeChannel)
      setMessages([])
    }
  }, [channelId, setMessages, fetchMessages, setIsConnected])

  // Virtualization
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  })

  // Auto scroll to bottom
  useEffect(() => {
    if (autoScroll && messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end', behavior: 'smooth' })
    }
  }, [messages.length, autoScroll, virtualizer])

  const handleScroll = useCallback(() => {
    if (!parentRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current
    const atBottom = scrollHeight - scrollTop - clientHeight < 100
    setAutoScroll(atBottom)
  }, [])

  async function handleSendMessage(content: string, attachments: FileAttachment[]) {
    if (!currentUser) return
    const supabase = createClient()
    
    const optimisticId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      id: optimisticId,
      channel_id: channelId,
      user_id: currentUser.id,
      content: content || "",
      created_at: new Date().toISOString(),
      edited: false,
      reply_to_id: replyTo?.id ?? null,
      profile: currentUser,
      reactions: [],
      attachments: [],
      reply_to: replyTo,
      isPending: true
    }

    addMessage(optimisticMessage)
    setAutoScroll(true)

    try {
      // Insert message
      const { data: msg, error: msgError } = await supabase
        .from("messages")
        .insert({
          channel_id: channelId,
          user_id: currentUser.id,
          content: content || "",
          reply_to_id: replyTo?.id ?? null,
        })
        .select(`
          *,
          profile:profiles(*),
          reactions:message_reactions(*),
          attachments:attachments(*),
          reply_to:messages(
            id,
            content,
            profile:profiles(username, avatar_url)
          )
        `)
        .single()

      if (msgError) throw msgError

      deleteMessage(optimisticId)
      addMessage(msg as any)

      // Handle attachments
      if (attachments.length > 0) {
        for (const att of attachments) {
          const fileExt = att.file.name.split(".").pop()
          const filePath = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from("attachments")
            .upload(filePath, att.file, { cacheControl: "3600", upsert: false })

          if (uploadError) continue

          const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(filePath)

          const isImage = att.file.type.startsWith("image/")
          let width = null
          let height = null
          if (isImage) {
            try {
              const dims = await getImageDimensions(att.file)
              width = dims.width
              height = dims.height
            } catch (e) {}
          }

          const expiresAt = new Date(Date.now() + 49 * 24 * 60 * 60 * 1000).toISOString()

          await supabase.from("attachments").insert({
            message_id: msg.id,
            file_url: urlData.publicUrl,
            file_name: att.file.name,
            file_type: att.file.type,
            file_size: att.file.size,
            is_image: isImage,
            width,
            height,
            expires_at: expiresAt,
          })
        }

        // Re-fetch to get attachments
        const { data: finalMsg } = await supabase
          .from("messages")
          .select("*, profile:profiles(*), reactions:message_reactions(*), attachments:attachments(*)")
          .eq("id", msg.id)
          .single()

        if (finalMsg) updateMessage(msg.id, finalMsg as any)
      }
    } catch (err: any) {
      deleteMessage(optimisticId)
      toast("Failed to send message", { description: err.message, variant: "destructive" })
    }
  }

  return (
    <div className="flex h-full flex-col relative">
      {/* Reconnection Banner */}
      {!isConnected && (
        <div className="bg-[#FFB800] text-black px-4 py-1 flex items-center justify-center gap-2 text-xs font-bold animate-pulse">
          <RefreshCw className="size-3 animate-spin" />
          Reconnecting... messages may be delayed
        </div>
      )}

      {/* Header */}
      <div className="glass flex h-12 shrink-0 items-center gap-2 border-b border-border-subtle px-4">
        <Hash className="size-4 text-text-muted" />
        <span className="font-semibold">{channelName}</span>
        {channelTopic && (
          <>
            <span className="mx-1 h-4 w-px bg-border-subtle" />
            <span className="truncate text-xs text-text-muted text-muted-opacity">
              {channelTopic}
            </span>
          </>
        )}
      </div>

      {/* Messages */}
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
             <Loader2 className="size-8 animate-spin text-accent-primary" />
             <p className="text-sm text-text-muted">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-muted">no messages yet...</p>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => (
              <div
                key={messages[virtualItem.index].id}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <MessageBubble
                  message={messages[virtualItem.index]}
                  isFirst={virtualItem.index === 0 || messages[virtualItem.index - 1]?.user_id !== messages[virtualItem.index].user_id}
                  onReply={setReplyTo}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New messages indicator */}
      {!autoScroll && !loading && (
        <button
          onClick={() => {
            setAutoScroll(true)
            virtualizer.scrollToIndex(messages.length - 1)
          }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-accent-primary px-3 py-1 text-xs font-bold text-bg-primary shadow-accent-glow z-20"
        >
          <ChevronDown className="size-3 inline" /> New messages
        </button>
      )}

      {/* Chat Input */}
      <ChatInput
        placeholder={`Message #${channelName}`}
        onSendMessage={handleSendMessage}
        channelName={channelName}
        replyToPreview={
          replyTo && (
            <div className="flex items-center gap-2 border-b border-border-subtle bg-bg-tertiary/50 px-4 py-1.5 rounded-t-lg">
              <Reply className="size-3 text-muted-foreground shrink-0" />
              <div className="flex-1 truncate text-xs text-muted-foreground">
                Replying to <span className="font-medium text-foreground">{replyTo.profile?.username ?? "Unknown"}</span>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground">
                <X className="size-3" />
              </button>
            </div>
          )
        }
        onReplyClear={() => setReplyTo(null)}
      />
    </div>
  )
}

// ─── Message Bubble ─────────────────────────────────────────────

const EMOJIS = ["👍", "❤️", "😂", "🔥", "🚀", "🎉", "💯", "👀"]

const MessageBubble = memo(({
  message,
  isFirst,
  onReply,
}: {
  message: Message
  isFirst: boolean
  onReply: (msg: Message) => void
}) => {
  const currentUser = useAppStore((state) => state.currentUser)
  const updateMessage = useAppStore((state) => state.updateMessage)
  const deleteMessage = useAppStore((state) => state.deleteMessage)

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

  const groupedReactions = useMemo(() => (message.reactions ?? []).reduce(
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
  ), [message.reactions, currentUser?.id])

  const handleSaveEdit = useCallback(async () => {
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
  }, [editContent, message.content, message.id, updateMessage, supabase])

  const handleDelete = useCallback(async () => {
    await supabase.from("messages").delete().eq("id", message.id)
    deleteMessage(message.id)
  }, [message.id, deleteMessage, supabase])

  const handleReaction = useCallback(async (emoji: string) => {
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
  }, [message.id, message.reactions, currentUser?.id, supabase])

  if (editing) {
    return (
      <div className="flex items-start gap-3 px-2 py-1">
        <div className="flex-1">
          <input
            ref={editRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-bg-primary px-3 py-1.5 text-sm outline-none focus-visible:border-accent-primary focus-visible:shadow-accent-focus"
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
    <div className={`group relative flex items-start gap-3 rounded-md px-2 py-0.5 transition-colors hover:bg-bg-secondary/50 ${message.isPending ? 'opacity-70' : ''}`}>
      {/* Avatar or spacer */}
      {isFirst ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-server bg-surface text-xs font-semibold text-accent-primary">
          {initials}
        </span>
      ) : (
        <span className="invisible flex size-9 shrink-0 items-center justify-center text-[10px] text-text-muted group-hover:visible">
          {time}
        </span>
      )}

      <div className="min-w-0 flex-1">
        {isFirst && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-text-primary">{message.profile?.username ?? "Unknown"}</span>
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              {time}
              {message.isPending && <Loader2 className="size-2 animate-spin" />}
            </span>
            {message.edited && <span className="text-[11px] text-text-muted">(edited)</span>}
          </div>
        )}
        {message.content && (
          <p className="text-[15px] leading-[1.6] text-text-secondary whitespace-pre-wrap">{message.content}</p>
        )}

        {/* Attachments */}
        <AttachmentGallery attachments={message.attachments || []} />

        {/* Reactions */}
        {groupedReactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {groupedReactions.map((g) => (
              <button
                key={g.emoji}
                onClick={() => handleReaction(g.emoji)}
                className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors ${
                  g.reacted
                    ? "border-accent-primary bg-accent-primary text-bg-primary"
                    : "border-border-subtle bg-surface text-text-secondary hover:border-accent-primary hover:text-accent-primary"
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
              {message.reply_to.content}
            </span>
          </div>
        )}
      </div>

      {/* Hover actions */}
      {!message.isPending && (
        <div className="invisible absolute -top-3 right-2 flex items-center gap-0.5 rounded-lg border border-border-subtle bg-surface shadow-sm backdrop-blur-[10px] group-hover:visible z-10">
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
              <div className="absolute top-full right-0 z-50 mt-1 flex gap-0.5 rounded-lg border border-border-subtle bg-surface p-1 shadow-lg backdrop-blur-[10px]">
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
      )}
    </div>
  )
})

MessageBubble.displayName = "MessageBubble"

// ─── Voice Channel View ─────────────────────────────────────────

function VoiceChannelView({ channelName, channelId }: { channelName: string; channelId: string }) {
  const connectedVoiceChannelId = useAppStore((state) => state.connectedVoiceChannelId)
  const setConnectedVoiceChannelId = useAppStore((state) => state.setConnectedVoiceChannelId)
  const micOn = useAppStore((state) => state.micOn)
  const setMicOn = useAppStore((state) => state.setMicOn)
  const deafened = useAppStore((state) => state.deafened)
  const setDeafened = useAppStore((state) => state.setDeafened)

  const participants = useParticipants()
  const isConnected = connectedVoiceChannelId === channelId

  if (!isConnected) {
    return (
      <div className="flex h-full flex-col relative overflow-hidden bg-bg-primary">
        <div className="hero-glow left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center animate-fade-in-up">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-server border border-border-subtle bg-surface shadow-xl">
            <div className="flex size-12 items-center justify-center rounded-lg bg-accent-primary/15 text-accent-primary">
              <Volume2 className="size-6" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-heading">{channelName}</h2>
          <Button
            size="lg"
            className="mt-8 shadow-accent-glow transition-transform hover:scale-105"
            onClick={() => setConnectedVoiceChannelId(channelId)}
          >
            Join Voice
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col relative overflow-hidden bg-bg-primary">
      <div className="glass flex h-12 shrink-0 items-center gap-2 border-b border-border-subtle px-4">
        <Volume2 className="size-4 text-text-muted" />
        <span className="font-semibold">{channelName}</span>
        <span className="mx-1 h-4 w-px bg-border-subtle" />
        <span className="flex items-center gap-1.5 text-xs font-medium text-accent-primary">
          <span className="relative inline-block size-2 rounded-full bg-accent-primary">
            <span className="absolute inset-0 animate-ping rounded-full bg-accent-primary opacity-50" />
          </span>
          Connected
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {participants.map((p) => {
            const initials = p.identity?.slice(0, 2).toUpperCase() ?? "??"
            return (
              <div
                key={p.identity}
                className={`relative flex flex-col items-center justify-center rounded-server border bg-surface p-6 shadow-sm transition-colors duration-300 ${
                  p.isSpeaking
                    ? "animate-speaking-glow border-accent-primary ring-1 ring-accent-primary"
                    : "border-border-subtle"
                }`}
              >
                <div
                  className={`flex size-16 items-center justify-center rounded-server bg-accent-primary/10 text-xl font-bold text-accent-primary transition-transform duration-300 ${
                    p.isSpeaking ? "scale-110 bg-accent-primary text-bg-primary" : ""
                  }`}
                >
                  {initials}
                </div>
                <p className="mt-4 text-sm font-medium">{p.identity}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-4 border-t border-border-subtle bg-bg-secondary p-4 backdrop-blur-sm">
        <Button
          variant={micOn && !deafened ? "outline" : "destructive"}
          size="icon"
          className="rounded-full size-12 shadow-sm"
          onClick={() => setMicOn(!micOn)}
        >
          {micOn && !deafened ? <Volume2 className="size-5" /> : <MicOff className="size-5" />}
        </Button>
        <Button
          variant={deafened ? "destructive" : "outline"}
          size="icon"
          className="rounded-full size-12 shadow-sm"
          onClick={() => setDeafened(!deafened)}
        >
          {deafened ? <Headphones className="size-5 opacity-50" /> : <Headphones className="size-5" />}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="rounded-full size-12 shadow-sm"
          onClick={() => setConnectedVoiceChannelId(null)}
        >
          <PhoneOff className="size-5" />
        </Button>
      </div>
    </div>
  )
}

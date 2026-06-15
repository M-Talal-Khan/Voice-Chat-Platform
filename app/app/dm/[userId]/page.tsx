"use client"

import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react"
import {
  Send,
  Loader2,
  ChevronDown,
  Camera,
  Search,
  Hash,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import type { DirectMessage, Profile } from "@/lib/types"
import { ChatInput, type FileAttachment } from "@/components/features/chat-input"
import { AttachmentGallery } from "@/components/features/attachment-gallery"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useVirtualizer } from "@tanstack/react-virtual"

export default function DMPage() {
  const { userId: otherUserId } = useParams() as { userId: string }
  const currentUser = useAppStore((state) => state.currentUser)
  const dmMessages = useAppStore((state) => state.dmMessages)
  const setDmMessages = useAppStore((state) => state.setDmMessages)
  const addDmMessage = useAppStore((state) => state.addDmMessage)
  const isConnected = useAppStore((state) => state.isConnected)
  const setIsConnected = useAppStore((state) => state.setIsConnected)

  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!currentUser || !otherUserId) return

    const supabase = createClient()

    // Fetch other user profile
    supabase
      .from("profiles")
      .select("*")
      .eq("id", otherUserId)
      .single()
      .then(({ data }) => setOtherUser(data))

    // Fetch initial DMs
    supabase
      .from("direct_messages")
      .select(`
        *,
        attachments:attachments(*)
      `)
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          setDmMessages((data as any).reverse())
          // Mark as read
          for (const dm of data) {
            if (!dm.read && dm.receiver_id === currentUser.id) {
              supabase
                .from("direct_messages")
                .update({ read: true })
                .eq("id", dm.id)
                .then()
            }
          }
        }
        setLoading(false)
      })

    // Realtime subscription
    const realtimeChannel = supabase
      .channel(`dm:${currentUser.id}:${otherUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        async (payload) => {
          const msg = payload.new as DirectMessage
          // Filter for current conversation
          if (
            (msg.sender_id === currentUser.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === currentUser.id)
          ) {
            // Fetch with attachments
            const { data: fullMsg } = await supabase
              .from("direct_messages")
              .select("*, attachments:attachments(*)")
              .eq("id", msg.id)
              .single()

            if (fullMsg) {
              addDmMessage(fullMsg as any)
              if (fullMsg.receiver_id === currentUser.id) {
                supabase.from("direct_messages").update({ read: true }).eq("id", fullMsg.id).then()
              }
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsConnected(true)
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setIsConnected(false)
      })

    return () => {
      supabase.removeChannel(realtimeChannel)
      setDmMessages([])
    }
  }, [currentUser, otherUserId, setDmMessages, addDmMessage, setIsConnected])

  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: dmMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  })

  useEffect(() => {
    if (autoScroll && dmMessages.length > 0) {
      virtualizer.scrollToIndex(dmMessages.length - 1, { align: 'end', behavior: 'smooth' })
    }
  }, [dmMessages.length, autoScroll, virtualizer])

  const handleScroll = useCallback(() => {
    if (!parentRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100)
  }, [])

  const handleSendMessage = async (content: string, attachments: FileAttachment[]) => {
    if (!currentUser || !otherUserId) return
    const supabase = createClient()

    const optimisticId = `temp-${Date.now()}`
    const optimisticMessage: DirectMessage = {
      id: optimisticId,
      sender_id: currentUser.id,
      receiver_id: otherUserId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      read: false,
      attachments: [],
      isPending: true
    }

    addDmMessage(optimisticMessage)
    setAutoScroll(true)

    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .insert({
          sender_id: currentUser.id,
          receiver_id: otherUserId,
          content: content.trim(),
        })
        .select("*, attachments:attachments(*)")
        .single()

      if (error) throw error
      
      useAppStore.getState().deleteDmMessage(optimisticId)
      addDmMessage(data as any)
    } catch (err: any) {
      useAppStore.getState().deleteDmMessage(optimisticId)
      toast("Failed to send message", { description: err.message, variant: "destructive" })
    }
  }

  if (!otherUser && !loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-bg-primary">
        <p className="text-text-muted">User not found</p>
        <Button variant="ghost" onClick={() => router.push("/app")} className="mt-4">
          <ArrowLeft className="mr-2 size-4" /> Go back
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col relative bg-bg-primary">
      {!isConnected && (
        <div className="bg-[#FFB800] text-black px-4 py-1 flex items-center justify-center gap-2 text-xs font-bold">
          <RefreshCw className="size-3 animate-spin" />
          Reconnecting...
        </div>
      )}

      {/* Header */}
      <div className="glass flex h-12 shrink-0 items-center gap-3 border-b border-border-subtle px-4">
        <MessageSquare className="size-4 text-text-muted" />
        <span className="font-semibold">{otherUser?.username ?? "Loading..."}</span>
        {otherUser?.status && (
          <div className="flex items-center gap-1.5 ml-auto">
            <div className={`size-2 rounded-full ${otherUser.status === 'online' ? 'bg-[#AAFF00] shadow-[0_0_8px_#AAFF00]' : 'bg-text-muted'}`} />
            <span className="text-xs text-text-muted capitalize">{otherUser.status}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-8 animate-spin text-accent-primary" />
          </div>
        ) : dmMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="size-20 rounded-full bg-surface flex items-center justify-center mb-4">
               <MessageSquare className="size-10 text-text-muted" />
            </div>
            <h3 className="text-xl font-bold">This is the start of your DM history with {otherUser?.username}</h3>
            <p className="text-sm text-text-muted mt-2">Say something nice!</p>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const dm = dmMessages[virtualItem.index]
              const isFirst = virtualItem.index === 0 || dmMessages[virtualItem.index - 1]?.sender_id !== dm.sender_id
              const profile = dm.sender_id === currentUser?.id ? currentUser : otherUser

              return (
                <div
                  key={dm.id}
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
                  <DMMessageItem dm={dm} isFirst={isFirst} profile={profile} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ChatInput
        placeholder={`Message @${otherUser?.username ?? "user"}`}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}

const DMMessageItem = memo(({ dm, isFirst, profile }: { dm: DirectMessage, isFirst: boolean, profile: Profile | null }) => {
  const time = dm.created_at ? new Date(dm.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""

  return (
    <div className={`group relative flex items-start gap-3 rounded-md px-2 py-0.5 transition-colors hover:bg-bg-secondary/50 ${dm.isPending ? 'opacity-70' : ''}`}>
      {isFirst ? (
        <div className="size-9 shrink-0 overflow-hidden rounded-server bg-surface">
           {profile?.avatar_url ? (
             <Image src={profile.avatar_url} alt="" width={36} height={36} className="object-cover" />
           ) : (
             <div className="flex h-full w-full items-center justify-center text-xs font-bold text-accent-primary">
               {profile?.username?.slice(0, 2).toUpperCase() ?? "??"}
             </div>
           )}
        </div>
      ) : (
        <div className="invisible group-hover:visible w-9 text-right text-[10px] text-text-muted">
          {time}
        </div>
      )}
      <div className="min-w-0 flex-1">
        {isFirst && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-text-primary">{profile?.username ?? "Unknown"}</span>
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              {time}
              {dm.isPending && <Loader2 className="size-2 animate-spin" />}
            </span>
          </div>
        )}
        <p className="text-[15px] leading-[1.6] text-text-secondary whitespace-pre-wrap">{dm.content}</p>
        {dm.attachments && <AttachmentGallery attachments={dm.attachments} />}
      </div>
    </div>
  )
})

DMMessageItem.displayName = "DMMessageItem"

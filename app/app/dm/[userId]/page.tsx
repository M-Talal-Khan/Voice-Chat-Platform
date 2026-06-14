"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Send, Loader2 } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import type { DirectMessage, Profile } from "@/lib/types"
import { ChatInput, type FileAttachment } from "@/components/features/chat-input"
import { AttachmentGallery } from "@/components/features/attachment-gallery"
import { getImageDimensions } from "@/lib/media-utils"

export default function DmChatPage() {
  const params = useParams()
  const otherUserId = params.userId as string
  const { currentUser, dmMessages, setDmMessages, addDmMessage } = useAppStore()
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!currentUser || !otherUserId) return
    const supabase = createClient()

    // Fetch other user profile
    supabase
      .from("profiles")
      .select("*")
      .eq("id", otherUserId)
      .single()
      .then(({ data }) => {
        if (data) setOtherUser(data as Profile)
      })

    // Fetch last 50 DMs
    supabase
      .from("direct_messages")
      .select("*, sender:sender_id(*), receiver:receiver_id(*), attachments:attachments(*)")
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data) setDmMessages(data as any)
        setLoading(false)

        // Mark as read
        for (const dm of data ?? []) {
          if (!dm.read && dm.receiver_id === currentUser.id) {
            supabase
              .from("direct_messages")
              .update({ read: true })
              .eq("id", dm.id)
          }
        }
      })

    // Realtime subscription
    const channel = supabase
      .channel(`dm:${currentUser.id}:${otherUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `and(or(sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}),or(sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}))`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("direct_messages")
            .select("*, sender:sender_id(*), receiver:receiver_id(*), attachments:attachments(*)")
            .eq("id", payload.new.id)
            .single()
          if (data) {
            addDmMessage(data as any)
            // Mark as read
            if (!data.read && data.receiver_id === currentUser.id) {
              supabase.from("direct_messages").update({ read: true }).eq("id", data.id)
            }
            if (data.sender_id !== currentUser.id) {
              const hasImage = data.attachments?.some((a: any) => a.is_image)
              const title = hasImage 
                ? `📷 ${data.sender?.username} sent an image`
                : `${data.sender?.username} sent a message`
              toast(title, { description: data.content })
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attachments",
        },
        async (payload) => {
          const dmId = payload.new.dm_id
          if (!dmId) return
          const existing = useAppStore.getState().dmMessages.find((m) => m.id === dmId)
          if (existing) {
            const { data } = await supabase
              .from("direct_messages")
              .select("*, sender:sender_id(*), receiver:receiver_id(*), attachments:attachments(*)")
              .eq("id", dmId)
              .single()
            if (data) {
              useAppStore.getState().updateDmMessage(dmId, data as any)
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, otherUserId, setDmMessages, addDmMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [dmMessages.length])

  async function handleSendMessage(content: string, attachments: FileAttachment[]) {
    if (!currentUser) return
    const supabase = createClient()

    // Create message first
    const { data: msg, error: msgError } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: currentUser.id,
        receiver_id: otherUserId,
        content: content || "",
      })
      .select("*, sender:sender_id(*), receiver:receiver_id(*)")
      .single()

    if (msgError || !msg) throw new Error(msgError?.message || "Failed to send DM")

    addDmMessage(msg as any)

    // Upload attachments
    if (attachments.length > 0) {
      const { data: buckets } = await supabase.storage.listBuckets()
      if (!buckets?.find((b) => b.name === "attachments")) {
        toast("Storage not set up. Please contact admin.", { variant: "destructive" })
        return
      }

      for (const att of attachments) {
        const fileExt = att.file.name.split(".").pop()
        const filePath = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(filePath, att.file, { cacheControl: "3600", upsert: false })
          
        if (uploadError) {
          continue
        }

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

        const { error: attError } = await supabase.from("attachments").insert({
          dm_id: msg.id,
          file_url: urlData.publicUrl,
          file_name: att.file.name,
          file_type: att.file.type,
          file_size: att.file.size,
          is_image: isImage,
          width,
          height,
          expires_at: expiresAt,
        })

        if (attError) {
          // Do nothing
        }
      }
      
      // Re-fetch the full message with attachments so the sender sees the image
      const { data: fullMsg } = await supabase
        .from("direct_messages")
        .select("*, sender:sender_id(*), receiver:receiver_id(*), attachments:attachments(*)")
        .eq("id", msg.id)
        .single()
      
      if (fullMsg) {
        useAppStore.getState().updateDmMessage(msg.id, fullMsg as any)
      }
    }
  }

  const initials = otherUser?.username?.slice(0, 2).toUpperCase() ?? "??"

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="glass flex h-12 shrink-0 items-center gap-2 border-b border-border-subtle px-4">
        {otherUser && (
          <>
            <span
              className="inline-block size-2 rounded-full"
              style={{
                backgroundColor: otherUser.status === "online"
                  ? "var(--color-online)"
                  : "var(--color-offline)",
              }}
            />
            <span className="font-semibold">{otherUser.username}</span>
          </>
        )}
        {!otherUser && <span className="font-semibold">Direct Message</span>}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="h-8 w-32 skeleton rounded-lg" />
            <p className="text-sm text-text-muted text-muted-opacity">
              definitely not copying anyone...
            </p>
          </div>
        ) : dmMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-muted text-muted-opacity">
              no messages yet, be the first to say something totally original
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {dmMessages.map((dm, idx) => {
              const prev = idx > 0 ? dmMessages[idx - 1] : null
              const isFirst =
                !prev ||
                prev.sender_id !== dm.sender_id ||
                new Date(dm.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000

              const profile = dm.sender_id === currentUser?.id ? currentUser : otherUser
              const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "??"

              const time = dm.created_at
                ? new Date(dm.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""

              return (
                <div key={dm.id} className="group relative flex items-start gap-3 rounded-md px-2 py-0.5 transition-colors hover:bg-bg-secondary/50">
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
                        <span className="text-sm font-semibold text-text-primary">{profile?.username ?? "Unknown"}</span>
                        <span className="text-[11px] text-text-muted">{time}</span>
                      </div>
                    )}
                    {dm.content && (
                      <p className="text-[15px] leading-[1.6] text-text-secondary">{dm.content}</p>
                    )}

                    {/* Attachments */}
                    {dm.attachments && dm.attachments.length > 0 && (
                      <AttachmentGallery attachments={dm.attachments} />
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        placeholder={`Message ${otherUser?.username ?? "user"}`}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}

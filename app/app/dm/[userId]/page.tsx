"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Send, Loader2 } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/supabase"
import type { DirectMessage, Profile } from "@/lib/types"

export default function DmChatPage() {
  const params = useParams()
  const otherUserId = params.userId as string
  const { currentUser, dmMessages, setDmMessages, addDmMessage } = useAppStore()
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)
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
      .select("*, sender:sender_id(*), receiver:receiver_id(*)")
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
            .select("*, sender:sender_id(*), receiver:receiver_id(*)")
            .eq("id", payload.new.id)
            .single()
          if (data) {
            addDmMessage(data as any)
            // Mark as read
            if (!data.read && data.receiver_id === currentUser.id) {
              supabase.from("direct_messages").update({ read: true }).eq("id", data.id)
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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || sending || !currentUser) return

    setSending(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: currentUser.id,
        receiver_id: otherUserId,
        content: content.trim(),
      })
      .select("*, sender:sender_id(*), receiver:receiver_id(*)")
      .single()

    if (!error && data) {
      addDmMessage(data as any)
      setContent("")
    }
    setSending(false)
  }

  const initials = otherUser?.username?.slice(0, 2).toUpperCase() ?? "??"

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-4">
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
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : dmMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Send a message to start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {dmMessages.map((dm) => {
              const isMine = dm.sender_id === currentUser?.id
              const time = dm.created_at
                ? new Date(dm.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""
              return (
                <div
                  key={dm.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      isMine
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <p className="text-sm">{dm.content}</p>
                    <p
                      className={`mt-0.5 text-[10px] ${
                        isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {time}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="shrink-0 border-t border-border/60 px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg bg-background/40 px-3 py-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Message ${otherUser?.username ?? "user"}`}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!content.trim() || sending}
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
    </div>
  )
}

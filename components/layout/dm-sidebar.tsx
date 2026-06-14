"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/supabase"
import type { Profile, DirectMessage } from "@/lib/types"

export function DmSidebar() {
  const router = useRouter()
  const { currentUser, selectedDmUser, setSelectedDmUser, setDmView, setDmMessages } = useAppStore()
  const [conversations, setConversations] = useState<
    { user: Profile; lastMessage: DirectMessage; unread: number }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!currentUser) return
    const userId = currentUser.id
    const supabase = createClient()

    async function fetchConversations() {
      const { data } = await supabase
        .from("direct_messages")
        .select("*, sender:sender_id(*), receiver:receiver_id(*), attachments:attachments(*)")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false })

      if (!data) {
        setLoading(false)
        return
      }

      const seen = new Map<string, { user: Profile; lastMessage: DirectMessage; unread: number }>()

      for (const dm of data as any[]) {
        const otherUser: Profile = dm.sender_id === userId ? dm.receiver : dm.sender
        if (!otherUser) continue

        if (!seen.has(otherUser.id)) {
          seen.set(otherUser.id, {
            user: otherUser,
            lastMessage: dm,
            unread: !dm.read && dm.receiver_id === userId ? 1 : 0,
          })
        }
      }

      setConversations(Array.from(seen.values()))
      setLoading(false)
    }

    fetchConversations()
  }, [currentUser])

  const filtered = conversations.filter((c) =>
    c.user.username.toLowerCase().includes(query.toLowerCase()),
  )

  function handleSelectUser(user: Profile) {
    setSelectedDmUser(user)
    setDmMessages([])
    router.push(`/app/dm/${user.id}`)
  }

  return (
    <div className="flex h-full w-60 shrink-0 flex-col border-r border-border-subtle bg-bg-secondary">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border-subtle px-4">
        <span className="font-bold tracking-heading">Direct Messages</span>
        <button
          onClick={() => setDmView(false)}
          className="rounded p-1 text-text-muted hover:text-accent-primary"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="p-2.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a friend"
            className="h-8 bg-bg-primary pl-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 no-scrollbar">
        {loading ? (
          <div className="px-2 py-4 text-center text-xs text-text-muted text-muted-opacity">
            definitely not copying anyone...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-2 py-4 text-center text-xs text-text-muted text-muted-opacity">
            No conversations yet
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filtered.map((conv) => (
              <button
                key={conv.user.id}
                onClick={() => handleSelectUser(conv.user)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  selectedDmUser?.id === conv.user.id
                    ? "border-l-2 border-accent-primary bg-surface pl-[calc(0.5rem-2px)] text-accent-primary"
                    : "text-text-muted hover:bg-surface hover:text-text-primary",
                )}
              >
                <span
                  className="inline-block size-2 shrink-0 rounded-full shadow-[0_0_6px_currentColor]"
                  style={{
                    backgroundColor: conv.user.status === "online"
                      ? "var(--online)"
                      : "var(--offline)",
                    color: conv.user.status === "online"
                      ? "var(--online)"
                      : "var(--offline)",
                  }}
                />
                <span className="truncate">{conv.user.username}</span>
                {conv.unread > 0 && (
                  <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-accent-primary text-[10px] font-bold text-bg-primary">
                    {conv.lastMessage?.attachments?.some((a: any) => a.is_image) ? "📷" : conv.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

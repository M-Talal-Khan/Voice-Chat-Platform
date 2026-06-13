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
    const supabase = createClient()

    async function fetchConversations() {
      const { data } = await supabase
        .from("direct_messages")
        .select("*, sender:sender_id(*), receiver:receiver_id(*)")
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order("created_at", { ascending: false })

      if (!data) {
        setLoading(false)
        return
      }

      // Group by other user
      const seen = new Map<string, { user: Profile; lastMessage: DirectMessage; unread: number }>()

      for (const dm of data as any[]) {
        const otherUser: Profile = dm.sender_id === currentUser.id ? dm.receiver : dm.sender
        if (!otherUser) continue

        if (!seen.has(otherUser.id)) {
          seen.set(otherUser.id, {
            user: otherUser,
            lastMessage: dm,
            unread: !dm.read && dm.receiver_id === currentUser.id ? 1 : 0,
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
    <div className="flex h-full w-60 shrink-0 flex-col bg-channels">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 px-4">
        <span className="font-semibold">Direct Messages</span>
        <button
          onClick={() => setDmView(false)}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="p-2.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a friend"
            className="h-8 bg-background/50 pl-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 no-scrollbar">
        {loading ? (
          <div className="px-2 py-4 text-center text-xs text-muted-foreground">
            Loading conversations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-2 py-4 text-center text-xs text-muted-foreground">
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
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                )}
              >
                <span
                  className="inline-block size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: conv.user.status === "online"
                      ? "var(--color-online)"
                      : "var(--color-offline)",
                  }}
                />
                <span className="truncate">{conv.user.username}</span>
                {conv.unread > 0 && (
                  <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {conv.unread}
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

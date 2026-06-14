"use client"

import { useEffect, useState } from "react"
import { Users, Search, MessageSquare, UserMinus, Check, X, ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase"
import { useAppStore } from "@/lib/store"
import type { Profile, Friend } from "@/lib/types"

type Tab = "all" | "pending" | "blocked" | "add"

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all")
  const { currentUser, setDmView, setSelectedDmUser, setDmMessages } = useAppStore()
  const router = useRouter()

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center border-b border-border-subtle px-4">
        <Users className="mr-3 size-5 text-text-muted" />
        <span className="mr-4 font-bold tracking-heading">Friends</span>
        
        <div className="mx-2 h-4 w-px bg-border-subtle" />
        
        <div className="flex gap-1 ml-2">
          {(["all", "pending", "blocked"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-surface text-text-primary"
                  : "text-text-muted hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          <button
            onClick={() => setActiveTab("add")}
            className={`rounded px-3 py-1 text-sm font-bold transition-colors ${
              activeTab === "add"
                ? "bg-transparent text-accent-primary"
                : "bg-accent-primary text-bg-primary"
            }`}
          >
            Add Friend
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "all" && <AllFriendsTab />}
        {activeTab === "pending" && <PendingTab />}
        {activeTab === "blocked" && <BlockedTab />}
        {activeTab === "add" && <AddFriendTab />}
      </div>
    </div>
  )
}

function AllFriendsTab() {
  const { currentUser, friends, setFriends, setSelectedDmUser, setDmMessages } = useAppStore()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    const supabase = createClient()
    supabase
      .from("friends")
      .select("*, sender:sender_id(*), receiver:receiver_id(*)")
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .eq("status", "accepted")
      .then(({ data }) => {
        if (data) setFriends(data as any)
        setLoading(false)
      })
  }, [currentUser, setFriends])

  async function handleRemove(friend: Friend) {
    const supabase = createClient()
    await supabase.from("friends").delete().eq("id", friend.id)
    setFriends(friends.filter((f) => f.id !== friend.id))
  }

  function handleMessage(user: Profile) {
    setSelectedDmUser(user)
    setDmMessages([])
    router.push(`/app/dm/${user.id}`)
  }

  const acceptedFriends = friends.filter((f) => f.status === "accepted")

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>
  if (acceptedFriends.length === 0) return <EmptyState type="all" />

  return (
    <div className="max-w-3xl space-y-2">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-text-muted">
        All Friends — {acceptedFriends.length}
      </h2>
      {acceptedFriends.map((friend) => {
        const otherUser = friend.sender_id === currentUser?.id ? friend.receiver : friend.sender
        if (!otherUser) return null
        return (
          <div
            key={friend.id}
            className="group flex items-center justify-between rounded-lg border border-transparent p-3 transition-colors hover:border-border-subtle hover:bg-surface"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex size-10 items-center justify-center rounded-server bg-bg-secondary text-sm font-bold text-accent-primary">
                  {otherUser.username.slice(0, 2).toUpperCase()}
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-bg-primary shadow-[0_0_6px_currentColor]"
                  style={{
                    backgroundColor: otherUser.status === "online" ? "var(--online)" : "var(--offline)",
                    color: otherUser.status === "online" ? "var(--online)" : "var(--offline)",
                  }}
                />
              </div>
              <div>
                <div className="font-bold">{otherUser.username}</div>
                <div className="text-xs text-text-muted capitalize">{otherUser.status}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleMessage(otherUser)}
                className="flex size-9 items-center justify-center rounded-full bg-surface text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
                title="Message"
              >
                <MessageSquare className="size-4" />
              </button>
              <button
                onClick={() => handleRemove(friend)}
                className="flex size-9 items-center justify-center rounded-full bg-surface text-text-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Remove Friend"
              >
                <UserMinus className="size-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PendingTab() {
  const { currentUser, pendingRequests, setPendingRequests } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    const supabase = createClient()
    supabase
      .from("friends")
      .select("*, sender:sender_id(*), receiver:receiver_id(*)")
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .eq("status", "pending")
      .then(({ data }) => {
        if (data) setPendingRequests(data as any)
        setLoading(false)
      })
  }, [currentUser, setPendingRequests])

  async function handleAction(request: Friend, action: "accepted" | "rejected" | "canceled") {
    const supabase = createClient()
    if (action === "canceled" || action === "rejected") {
      await supabase.from("friends").delete().eq("id", request.id)
    } else {
      await supabase.from("friends").update({ status: action }).eq("id", request.id)
    }
    setPendingRequests(pendingRequests.filter((r) => r.id !== request.id))
  }

  const incoming = pendingRequests.filter((r) => r.receiver_id === currentUser?.id)
  const outgoing = pendingRequests.filter((r) => r.sender_id === currentUser?.id)

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>
  if (pendingRequests.length === 0) return <EmptyState type="pending" />

  return (
    <div className="max-w-3xl space-y-8">
      {incoming.length > 0 && (
        <div className="space-y-2">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-text-muted">
            Incoming — {incoming.length}
          </h2>
          {incoming.map((req) => (
            <div
              key={req.id}
              className="group flex items-center justify-between rounded-lg border border-transparent p-3 transition-colors hover:border-border-subtle hover:bg-surface"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-server bg-bg-secondary text-sm font-bold text-accent-primary">
                  {req.sender?.username.slice(0, 2).toUpperCase() || "??"}
                </div>
                <div>
                  <div className="font-bold">{req.sender?.username}</div>
                  <div className="text-xs text-text-muted">Incoming Friend Request</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(req, "accepted")}
                  className="flex size-9 items-center justify-center rounded-full bg-green-500/10 text-green-500 transition-colors hover:bg-green-500/20"
                  title="Accept"
                >
                  <Check className="size-5" />
                </button>
                <button
                  onClick={() => handleAction(req, "rejected")}
                  className="flex size-9 items-center justify-center rounded-full bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
                  title="Reject"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="space-y-2">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-text-muted">
            Outgoing — {outgoing.length}
          </h2>
          {outgoing.map((req) => (
            <div
              key={req.id}
              className="group flex items-center justify-between rounded-lg border border-transparent p-3 transition-colors hover:border-border-subtle hover:bg-surface"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-server bg-bg-secondary text-sm font-bold text-accent-primary">
                  {req.receiver?.username.slice(0, 2).toUpperCase() || "??"}
                </div>
                <div>
                  <div className="font-bold">{req.receiver?.username}</div>
                  <div className="text-xs text-text-muted">Outgoing Friend Request</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(req, "canceled")}
                  className="flex size-9 items-center justify-center rounded-full bg-surface text-text-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Cancel Request"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BlockedTab() {
  const { currentUser } = useAppStore()
  const [blocked, setBlocked] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    const supabase = createClient()
    supabase
      .from("friends")
      .select("*, sender:sender_id(*), receiver:receiver_id(*)")
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .eq("status", "blocked")
      .then(({ data }) => {
        if (data) setBlocked(data as any)
        setLoading(false)
      })
  }, [currentUser])

  async function handleUnblock(request: Friend) {
    const supabase = createClient()
    await supabase.from("friends").delete().eq("id", request.id)
    setBlocked(blocked.filter((r) => r.id !== request.id))
  }

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>
  if (blocked.length === 0) return <EmptyState type="blocked" />

  return (
    <div className="max-w-3xl space-y-2">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-text-muted">
        Blocked — {blocked.length}
      </h2>
      {blocked.map((req) => {
        const otherUser = req.sender_id === currentUser?.id ? req.receiver : req.sender
        if (!otherUser) return null
        return (
          <div
            key={req.id}
            className="group flex items-center justify-between rounded-lg border border-transparent p-3 transition-colors hover:border-border-subtle hover:bg-surface"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-server bg-bg-secondary text-sm font-bold text-accent-primary">
                {otherUser.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="font-bold">{otherUser.username}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleUnblock(req)}>
                Unblock
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AddFriendTab() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<Profile | null>(null)
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const { currentUser } = useAppStore()

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || !currentUser) return
    if (query.trim() === currentUser.username) {
      setMessage({ type: "error", text: "You cannot add yourself as a friend." })
      setResult(null)
      return
    }

    setLoading(true)
    setMessage(null)
    const supabase = createClient()

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", query.trim())
      .single()

    if (data) {
      setResult(data as Profile)
    } else {
      setResult(null)
      setMessage({ type: "error", text: "Hm, didn't work. Double check that the username is correct." })
    }
    setLoading(false)
  }

  async function handleSendRequest() {
    if (!result || !currentUser) return
    setLoading(true)
    const supabase = createClient()

    // Check if relationship exists
    const { data: existing } = await supabase
      .from("friends")
      .select("id")
      .or(
        `and(sender_id.eq.${currentUser.id},receiver_id.eq.${result.id}),and(sender_id.eq.${result.id},receiver_id.eq.${currentUser.id})`
      )
      .single()

    if (existing) {
      setMessage({ type: "error", text: "You are already friends or have a pending request with this user." })
      setLoading(false)
      return
    }

    const { error } = await supabase.from("friends").insert({
      sender_id: currentUser.id,
      receiver_id: result.id,
    })

    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: `Friend request sent to ${result.username}!` })
      setResult(null)
      setQuery("")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl">
      <h2 className="mb-2 text-base font-bold uppercase tracking-wider">Add Friend</h2>
      <p className="mb-6 text-sm text-text-muted">You can add a friend with their username.</p>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative flex items-center rounded-xl border border-border-subtle bg-bg-secondary p-2 transition-colors focus-within:border-accent-primary">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="You can add friends with their username"
            className="flex-1 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 outline-none shadow-none"
          />
          <Button type="submit" disabled={!query.trim() || loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
      </form>

      {message && (
        <div
          className={`mb-6 rounded-lg p-3 text-sm ${
            message.type === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-green-500/10 text-green-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {result && (
        <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface p-4">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-server bg-bg-secondary text-lg font-bold text-accent-primary">
              {result.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-lg font-bold">{result.username}</div>
              <div className="text-sm text-text-muted capitalize">{result.status}</div>
            </div>
          </div>
          <Button onClick={handleSendRequest} disabled={loading}>
            Send Friend Request
          </Button>
        </div>
      )}
    </div>
  )
}

function EmptyState({ type }: { type: Tab }) {
  const images = {
    all: "https://discord.com/assets/a12ff54c4c5c03b41006.svg",
    pending: "https://discord.com/assets/a12ff54c4c5c03b41006.svg",
    blocked: "https://discord.com/assets/a12ff54c4c5c03b41006.svg",
  }
  
  const text = {
    all: "No one's around to play with Wumpus.",
    pending: "There are no pending friend requests. Here's a Wumpus for now.",
    blocked: "You can't unblock the Wumpus.",
  }

  return (
    <div className="flex h-full flex-col items-center justify-center text-center opacity-50">
      <div className="mb-8 size-48 opacity-20 filter grayscale">
        <ShieldAlert className="size-full" />
      </div>
      <p className="text-text-muted">{text[type as keyof typeof text]}</p>
    </div>
  )
}

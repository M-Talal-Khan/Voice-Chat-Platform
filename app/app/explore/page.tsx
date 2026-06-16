"use client"

import { useEffect, useState } from "react"
import { Search, Users, Shield, Globe } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase"
import { useAppStore } from "@/lib/store"
import { joinServerAction } from "@/lib/queries"
import type { Server } from "@/lib/types"

const CATEGORIES = ["All", "Gaming", "Music", "Study", "Friends", "Art", "Tech", "Other"]

interface ExploreServer extends Server {
  member_count: number
  is_member: boolean
  request_status?: "pending" | "accepted" | "rejected" | null
}

export default function ExplorePage() {
  const [servers, setServers] = useState<ExploreServer[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [joining, setJoining] = useState<string | null>(null)
  const { currentUser, setServers: setStoreServers, servers: storeServers } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    async function fetchServers() {
      if (!currentUser) return
      const supabase = createClient()

      // Fetch all servers
      const { data: serverData } = await supabase
        .from("servers")
        .select("*, server_members(count)")

      if (!serverData) {
        setLoading(false)
        return
      }

      // Fetch user's current memberships
      const { data: memberData } = await supabase
        .from("server_members")
        .select("server_id")
        .eq("user_id", currentUser.id)

      const joinedServerIds = new Set(memberData?.map((m) => m.server_id) || [])

      // Fetch user's pending requests
      const { data: requestData } = await supabase
        .from("join_requests")
        .select("server_id, status")
        .eq("user_id", currentUser.id)

      const requestMap = new Map(requestData?.map((r) => [r.server_id, r.status]) || [])

      const formatted = (serverData as any).map((s: any) => ({
        ...s,
        member_count: s.server_members[0]?.count || 0,
        is_member: joinedServerIds.has(s.id),
        request_status: requestMap.get(s.id),
      })) as ExploreServer[]

      setServers(formatted)
      setLoading(false)
    }

    fetchServers()
  }, [currentUser])

  async function handleJoin(server: ExploreServer) {
    if (!currentUser || joining) return
    setJoining(server.id)

    try {
      const supabase = createClient()

      if (server.is_public) {
        // Auto-join public server
        const joined = await joinServerAction(server.invite_code, currentUser.id)
        setStoreServers([...storeServers, joined as any])
        setServers(
          servers.map((s) =>
            s.id === server.id
              ? { ...s, is_member: true, member_count: s.member_count + 1 }
              : s
          )
        )
      } else {
        // Request to join private server
        const { error } = await supabase.from("join_requests").insert({
          server_id: server.id,
          user_id: currentUser.id,
        })
        if (!error) {
          setServers(
            servers.map((s) =>
              s.id === server.id ? { ...s, request_status: "pending" } : s
            )
          )
        }
      }
    } catch (err) {
      // Do nothing on err or handle silently
    } finally {
      setJoining(null)
    }
  }

  const filtered = servers.filter((s) => {
    const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase())
    const matchesCategory =
      category === "All" ||
      s.category?.toLowerCase() === category.toLowerCase() ||
      (!s.category && category === "Other")
      
    // The prompt says "Only show servers where is_public is true", but also
    // "If server is private send request to owner". I'll show both, but if
    // strict filtering is preferred, uncomment the next line:
    // const isPublic = s.is_public === true

    return matchesQuery && matchesCategory
  })

  return (
    <div className="flex h-full flex-col bg-bg-primary">
      <div className="flex h-12 shrink-0 items-center border-b border-border-subtle px-6">
        <Compass className="mr-2 size-5 text-accent-primary" />
        <span className="font-bold tracking-heading">Explore Servers</span>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        {/* Search & Filters */}
        <div className="mb-8 space-y-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for servers..."
              className="h-12 w-full rounded-xl bg-bg-secondary pl-10 text-lg border-transparent focus-visible:border-accent-primary"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  category === c
                    ? "bg-accent-primary text-bg-primary shadow-accent-glow"
                    : "bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Discovering communities...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">No servers found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((server) => (
              <div
                key={server.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-secondary transition-colors hover:border-accent-primary/50"
              >
                {/* Banner / Header */}
                <div className="h-16 bg-gradient-to-r from-accent-primary/20 to-transparent" />
                
                {/* Icon */}
                <div className="absolute left-4 top-8 flex size-14 items-center justify-center rounded-server border-4 border-bg-secondary bg-surface text-xl font-bold text-accent-primary shadow-sm">
                  {server.name.slice(0, 2).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4 pt-8">
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-bold truncate">{server.name}</h3>
                    {server.is_public ? (
                      <Globe className="size-4 text-text-muted shrink-0" aria-label="Public Server" />
                    ) : (
                      <Shield className="size-4 text-text-muted shrink-0" aria-label="Private Server" />
                    )}
                  </div>
                  
                  <p className="mb-4 text-xs text-text-muted line-clamp-2 min-h-[32px]">
                    {server.description || "No description provided."}
                  </p>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                      <Users className="size-3.5" />
                      {server.member_count} Members
                    </div>

                    {server.is_member ? (
                      <Button variant="secondary" size="sm" onClick={() => router.push(`/app`)} className="bg-surface">
                        Joined
                      </Button>
                    ) : server.request_status === "pending" ? (
                      <Button variant="secondary" size="sm" disabled className="opacity-50">
                        Requested
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleJoin(server)}
                        disabled={joining === server.id}
                      >
                        {joining === server.id ? "Joining..." : server.is_public ? "Join" : "Request to Join"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Compass(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ServerRail } from "@/components/layout/server-rail"
import { ChannelSidebar } from "@/components/layout/channel-sidebar"
import { DmSidebar } from "@/components/layout/dm-sidebar"
import { VoiceProvider } from "@/components/features/voice-provider"
import { ErrorBoundary } from "@/components/features/error-boundary"
import { dynamic } from "@/lib/performance"

// Lazy load modals and heavy components
const CreateServerModal = dynamic(() => import("@/components/features/modals").then(m => m.CreateServerModal))
const JoinServerModal = dynamic(() => import("@/components/features/modals").then(m => m.JoinServerModal))
const CreateChannelModal = dynamic(() => import("@/components/features/modals").then(m => m.CreateChannelModal))
const ServerInfoModal = dynamic(() => import("@/components/features/modals").then(m => m.ServerInfoModal))
const DeleteServerModal = dynamic(() => import("@/components/features/modals").then(m => m.DeleteServerModal))
const ServerSettingsModal = dynamic(() => import("@/components/features/server-settings").then(m => m.ServerSettingsModal))
const UserSettings = dynamic(() => import("@/components/features/user-settings").then(m => m.UserSettings))
const CommandPalette = dynamic(() => import("@/components/features/command-palette").then(m => m.CommandPalette))

import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/supabase"
import { usePresence, useUnreadNotifications } from "@/hooks/use-presence"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Server, Channel } from "@/lib/types"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  // Selective subscriptions for performance
  const currentUser = useAppStore(state => state.currentUser)
  const setCurrentUser = useAppStore(state => state.setCurrentUser)
  const servers = useAppStore(state => state.servers)
  const setServers = useAppStore(state => state.setServers)
  const selectedServer = useAppStore(state => state.selectedServer)
  const setSelectedServer = useAppStore(state => state.setSelectedServer)
  const channels = useAppStore(state => state.channels)
  const setChannels = useAppStore(state => state.setChannels)
  const selectedChannel = useAppStore(state => state.selectedChannel)
  const setSelectedChannel = useAppStore(state => state.setSelectedChannel)
  const members = useAppStore(state => state.members)
  const setMembers = useAppStore(state => state.setMembers)
  const connectedVoiceChannelId = useAppStore(state => state.connectedVoiceChannelId)
  const setConnectedVoiceChannelId = useAppStore(state => state.setConnectedVoiceChannelId)
  const micOn = useAppStore(state => state.micOn)
  const setMicOn = useAppStore(state => state.setMicOn)
  const deafened = useAppStore(state => state.deafened)
  const setDeafened = useAppStore(state => state.setDeafened)
  const setMessages = useAppStore(state => state.setMessages)
  const dmView = useAppStore(state => state.dmView)
  const setDmView = useAppStore(state => state.setDmView)
  const setSelectedDmUser = useAppStore(state => state.setSelectedDmUser)
  const pendingRequests = useAppStore(state => state.pendingRequests)
  const setPendingRequests = useAppStore(state => state.setPendingRequests)

  const [loading, setLoading] = useState(true)
  const [showCreateServer, setShowCreateServer] = useState(false)
  const [showJoinServer, setShowJoinServer] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showServerInfo, setShowServerInfo] = useState(false)
  const [showDeleteServer, setShowDeleteServer] = useState(false)
  const [showServerSettings, setShowServerSettings] = useState(false)
  const [showUserSettings, setShowUserSettings] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login")
        return
      }
      supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data: profile }) => {
        if (profile) setCurrentUser(profile as any)
      })
      supabase.from("server_members").select("server:servers(*)").eq("user_id", user.id).then(({ data: memberData }) => {
        if (memberData) {
          const serverList = memberData.map((m: any) => m.server).filter(Boolean)
          setServers(serverList as Server[])
        }
        setLoading(false)
      })
      supabase.from("friends").select("*").eq("receiver_id", user.id).eq("status", "pending").then(({ data }) => {
        if (data) setPendingRequests(data as any)
      })
    })
  }, [router, setCurrentUser, setServers, setPendingRequests])

  useEffect(() => {
    if (!selectedServer) return
    const supabase = createClient()
    supabase.from("channels").select("*").eq("server_id", selectedServer.id).order("position", { ascending: true }).then(({ data: channelData }) => {
      if (channelData) {
        setChannels(channelData as Channel[])
        const currentChannelStillExists = channelData.find((c) => c.id === selectedChannel?.id)
        if (!currentChannelStillExists && channelData.length > 0) {
          setSelectedChannel(channelData[0] as Channel)
        }
      }
    })
    supabase.from("server_members").select("*, profile:profiles(*)").eq("server_id", selectedServer.id).then(({ data: memberData }) => {
      if (memberData) setMembers(memberData as any)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServer?.id])

  function handleSelectServer(serverId: string) {
    const server = servers.find((s) => s.id === serverId)
    if (server) {
      setDmView(false)
      setSelectedDmUser(null)
      setSelectedServer(server)
      router.push("/app")
    }
  }

  function handleSelectChannel(channelId: string) {
    const channel = channels.find((c) => c.id === channelId)
    if (channel) {
      setSelectedChannel(channel)
      setMessages([])
      router.push("/app")
    }
  }

  function handleOpenDm() {
    setDmView(true)
    setSelectedServer(null)
    setSelectedChannel(null)
    setChannels([])
    setMembers([])
    setMessages([])
    setSelectedDmUser(null)
    router.push("/app/friends")
  }

  async function handleLeaveServer() {
    if (!selectedServer || !currentUser) return
    const supabase = createClient()
    await supabase.from("server_members").delete().eq("server_id", selectedServer.id).eq("user_id", currentUser.id)
    setServers(servers.filter((s) => s.id !== selectedServer.id))
    setSelectedServer(null)
    setSelectedChannel(null)
    setChannels([])
    setMembers([])
  }

  async function handleDeleteServer() {
    if (!selectedServer) return
    const supabase = createClient()
    await supabase.from("servers").delete().eq("id", selectedServer.id)
    setServers(servers.filter((s) => s.id !== selectedServer.id))
    setSelectedServer(null)
    setSelectedChannel(null)
    setChannels([])
    setMembers([])
    setShowDeleteServer(false)
  }

  const isOwner = selectedServer?.owner_id === currentUser?.id

  usePresence()
  useUnreadNotifications()

  useEffect(() => {
    const handleOpenCreateServer = () => setShowCreateServer(true)
    window.addEventListener("openCreateServer", handleOpenCreateServer)
    return () => window.removeEventListener("openCreateServer", handleOpenCreateServer)
  }, [])

  if (loading) {
    return (
      <div className="flex h-svh items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
          <p className="text-sm text-text-muted">Loading Thiscord...</p>
        </div>
      </div>
    )
  }

  if (servers.length === 0) {
    return (
      <div className="flex h-svh flex-col bg-bg-primary">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold tracking-heading">No servers yet</h2>
            <p className="mt-2 text-sm text-text-muted">Join a community or create your own!</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={() => setShowCreateServer(true)}>
                <Plus className="size-4 mr-2" /> Create Server
              </Button>
              <Button variant="outline" onClick={() => setShowJoinServer(true)}>Join Server</Button>
            </div>
          </div>
        </div>
        <CreateServerModal open={showCreateServer} onOpenChange={setShowCreateServer} />
        <JoinServerModal open={showJoinServer} onOpenChange={setShowJoinServer} />
      </div>
    )
  }

  return (
    <div className="flex h-svh bg-bg-primary">
      <ServerRail
        servers={servers}
        activeServerId={selectedServer?.id ?? null}
        onSelectServer={handleSelectServer}
        onAddServer={() => setShowCreateServer(true)}
        onExploreServers={() => router.push("/app/explore")}
        onOpenDm={handleOpenDm}
        dmActive={dmView}
        dmBadge={pendingRequests.filter(r => r.receiver_id === currentUser?.id).length}
      />

      {dmView && <DmSidebar />}

      {!dmView && selectedServer && (
        <ChannelSidebar
          server={selectedServer as any}
          channels={channels}
          activeChannelId={selectedChannel?.id ?? ""}
          onSelectChannel={handleSelectChannel}
          connectedVoiceId={connectedVoiceChannelId}
          onJoinVoice={(id) => setConnectedVoiceChannelId(id)}
          onLeaveVoice={() => setConnectedVoiceChannelId(null)}
          micOn={micOn}
          onToggleMic={() => setMicOn(!micOn)}
          deafened={deafened}
          onToggleDeafen={() => setDeafened(!deafened)}
          onOpenServerSettings={() => setShowServerSettings(true)}
          onOpenUserSettings={() => setShowUserSettings(true)}
          onOpenCreateChannel={() => setShowCreateChannel(true)}
          onOpenInvite={() => setShowServerInfo(true)}
          onLeaveServer={handleLeaveServer}
          onDeleteServer={() => setShowDeleteServer(true)}
          isOwner={isOwner}
          onMessageMember={(userId) => {
            const userProfile = members.find((m) => m.user_id === userId)?.profile
            if (userProfile) {
              handleOpenDm()
              setSelectedDmUser(userProfile)
              router.push(`/app/dm/${userProfile.id}`)
            }
          }}
        />
      )}

      <VoiceProvider
        roomName={connectedVoiceChannelId && selectedServer ? `server-${selectedServer.id}-channel-${connectedVoiceChannelId}` : null}
        username={currentUser?.username ?? "Anonymous"}
        onDisconnected={() => setConnectedVoiceChannelId(null)}
      >
        <main className="relative z-0 flex flex-1 flex-col bg-bg-primary overflow-hidden">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </VoiceProvider>

      <UserSettings open={showUserSettings} onOpenChange={setShowUserSettings} />
      <CommandPalette />
      <CreateServerModal open={showCreateServer} onOpenChange={setShowCreateServer} />
      <JoinServerModal open={showJoinServer} onOpenChange={setShowJoinServer} />

      {selectedServer && (
        <>
          <CreateChannelModal open={showCreateChannel} onOpenChange={setShowCreateChannel} serverId={selectedServer.id} />
          <ServerInfoModal open={showServerInfo} onOpenChange={setShowServerInfo} server={selectedServer} />
          <DeleteServerModal open={showDeleteServer} onOpenChange={setShowDeleteServer} serverName={selectedServer.name} onConfirm={handleDeleteServer} />
          <ServerSettingsModal open={showServerSettings} onOpenChange={setShowServerSettings} server={selectedServer} />
        </>
      )}
    </div>
  )
}

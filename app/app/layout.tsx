"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ServerRail } from "@/components/layout/server-rail"
import { ChannelSidebar } from "@/components/layout/channel-sidebar"
import { DmSidebar } from "@/components/layout/dm-sidebar"
import { VoiceProvider } from "@/components/features/voice-provider"
import { ErrorBoundary } from "@/components/features/error-boundary"
import { SetupChecker } from "@/components/features/setup-checker"
import { dynamic } from "@/lib/performance"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

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
import { Plus, Compass, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Server, Channel } from "@/lib/types"
import Image from "next/image"
import { StarField } from "@/components/features/star-field"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
          const serverList = (memberData as unknown as { server: Server }[]).map((m) => m.server).filter(Boolean)
          setServers(serverList)
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
  }, [selectedServer, selectedChannel?.id, setChannels, setMembers, setSelectedChannel])

  const handleSelectServer = useCallback((serverId: string) => {
    const server = servers.find((s) => s.id === serverId)
    if (server) {
      setDmView(false)
      setSelectedDmUser(null)
      setSelectedServer(server)
      setMobileMenuOpen(false)
      router.push("/app")
    }
  }, [router, servers, setDmView, setSelectedDmUser, setSelectedServer])

  const handleSelectChannel = useCallback((channelId: string) => {
    const channel = channels.find((c) => c.id === channelId)
    if (channel) {
      setSelectedChannel(channel)
      setMessages([])
      setMobileMenuOpen(false)
      router.push("/app")
    }
  }, [channels, router, setMessages, setSelectedChannel])

  const handleOpenDm = useCallback(() => {
    setDmView(true)
    setSelectedServer(null)
    setSelectedChannel(null)
    setChannels([])
    setMembers([])
    setMessages([])
    setSelectedDmUser(null)
    setMobileMenuOpen(false)
    router.push("/app/friends")
  }, [router, setChannels, setDmView, setMembers, setMessages, setSelectedChannel, setSelectedDmUser, setSelectedServer])

  const handleLeaveServer = useCallback(async () => {
    if (!selectedServer || !currentUser) return
    const supabase = createClient()
    await supabase.from("server_members").delete().eq("server_id", selectedServer.id).eq("user_id", currentUser.id)
    setServers(servers.filter((s) => s.id !== selectedServer.id))
    setSelectedServer(null)
    setSelectedChannel(null)
    setChannels([])
    setMembers([])
  }, [currentUser, selectedServer, setServers, servers, setSelectedServer, setSelectedChannel, setChannels, setMembers])

  const handleDeleteServer = useCallback(async () => {
    if (!selectedServer) return
    const supabase = createClient()
    await supabase.from("servers").delete().eq("id", selectedServer.id)
    setServers(servers.filter((s) => s.id !== selectedServer.id))
    setSelectedServer(null)
    setSelectedChannel(null)
    setChannels([])
    setMembers([])
    setShowDeleteServer(false)
  }, [selectedServer, setServers, servers, setSelectedServer, setSelectedChannel, setChannels, setMembers])

  const isOwner = selectedServer?.owner_id === currentUser?.id

  usePresence()
  useUnreadNotifications()

  useEffect(() => {
    const handleOpenCreateServer = () => setShowCreateServer(true)
    window.addEventListener("openCreateServer", handleOpenCreateServer)
    return () => window.removeEventListener("openCreateServer", handleOpenCreateServer)
  }, [])

  const [funnyMessage, setFunnyMessage] = useState("Loading Thiscord...")
  
  useEffect(() => {
    if (!loading) return
    const messages = [
      "Loading Thiscord...",
      "definitely not Discord...",
      "stealing code from better apps...",
      "originality is overrated...",
      "connecting to the matrix...",
      "bribing the database...",
      "polishing pixels...",
      "waiting for Nitro to expire...",
    ]
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % messages.length
      setFunnyMessage(messages[i])
    }, 2000)
    return () => clearInterval(interval)
  }, [loading])

  if (loading) {
    return (
      <div className="flex h-svh items-center justify-center bg-bg-primary overflow-hidden relative">
        <StarField isAuthPage />
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="size-16 relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-accent-primary/20" />
            <div className="size-16 animate-spin rounded-full border-4 border-accent-primary border-t-transparent relative z-10" />
          </div>
          <p className="text-xl font-bold tracking-heading text-accent-primary animate-pulse text-center">{funnyMessage}</p>
        </div>
      </div>
    )
  }

  if (servers.length === 0) {
    return (
      <div className="flex h-svh flex-col bg-bg-primary overflow-hidden relative">
        <StarField />
        <div className="flex flex-1 items-center justify-center relative z-10 px-4">
          <div className="max-w-md w-full text-center space-y-8 glass-strong p-12 rounded-3xl border border-border-subtle shadow-2xl">
             <div className="flex flex-col items-center gap-4">
               <div className="size-24 bg-surface rounded-3xl flex items-center justify-center shadow-accent-glow border border-accent-primary/20">
                 <Image src="/logo-icon.svg" alt="Logo" width={64} height={64} className="animate-float" />
               </div>
               <h1 className="text-4xl font-bold tracking-heading text-text-primary">Welcome to Thiscord</h1>
               <p className="text-text-muted text-lg">totally not Discord. let&apos;s get started.</p>
             </div>
             
             <div className="grid gap-4 pt-4">
                <Button size="lg" className="h-16 text-lg font-bold shadow-accent-glow hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => setShowCreateServer(true)}>
                  <Plus className="mr-2 size-6" /> Create Your First Server
                </Button>
                <Button size="lg" variant="outline" className="h-16 text-lg font-bold hover:bg-surface/50 transition-all" onClick={() => router.push("/app/explore")}>
                  <Compass className="mr-2 size-6" /> Browse Public Servers
                </Button>
             </div>
             
             <div className="flex items-center justify-center gap-2 text-text-muted text-sm pt-4 italic">
                <Sparkles className="size-4 text-accent-primary" />
                <span>Join millions of people who also forgot Nitro existed</span>
             </div>
          </div>
        </div>
        <CreateServerModal open={showCreateServer} onOpenChange={setShowCreateServer} />
        <JoinServerModal open={showJoinServer} onOpenChange={setShowJoinServer} />
      </div>
    )
  }

  const rail = (
    <ServerRail
      servers={servers}
      activeServerId={selectedServer?.id ?? null}
      onSelectServer={handleSelectServer}
      onAddServer={() => { setShowCreateServer(true); setMobileMenuOpen(false); }}
      onExploreServers={() => { router.push("/app/explore"); setMobileMenuOpen(false); }}
      onOpenDm={handleOpenDm}
      dmActive={dmView}
      dmBadge={pendingRequests.filter(r => r.receiver_id === currentUser?.id).length}
    />
  )

  const sidebar = dmView ? <DmSidebar /> : (selectedServer && (
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
      onOpenServerSettings={() => { setShowServerSettings(true); setMobileMenuOpen(false); }}
      onOpenUserSettings={() => { setShowUserSettings(true); setMobileMenuOpen(false); }}
      onOpenCreateChannel={() => { setShowCreateChannel(true); setMobileMenuOpen(false); }}
      onOpenInvite={() => { setShowServerInfo(true); setMobileMenuOpen(false); }}
      onLeaveServer={handleLeaveServer}
      onDeleteServer={() => { setShowDeleteServer(true); setMobileMenuOpen(false); }}
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
  ))

  return (
    <div className="flex h-svh bg-bg-primary flex-col overflow-hidden">
      <SetupChecker />
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex h-12 shrink-0 items-center justify-between border-b border-border-subtle bg-bg-secondary px-4 z-50">
         <button onClick={() => setMobileMenuOpen(true)} className="text-text-muted hover:text-text-primary">
            <Menu className="size-6" />
         </button>
         <span className="font-bold tracking-heading text-sm">
            {dmView ? "Direct Messages" : selectedServer?.name ?? "Thiscord"}
         </span>
         <div className="size-6" /> {/* Placeholder for alignment */}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebars */}
        <div className="hidden md:flex shrink-0">
          {rail}
          {sidebar}
        </div>

        {/* Mobile Sidebar Drawer */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
           <SheetContent side="left" className="p-0 flex h-full w-[312px] border-r-0 bg-transparent gap-0" showCloseButton={false}>
              <div className="flex h-full w-full">
                 {rail}
                 <div className="flex-1 min-w-0 bg-bg-secondary">
                    {sidebar}
                 </div>
              </div>
           </SheetContent>
        </Sheet>

        <VoiceProvider
          roomName={connectedVoiceChannelId && selectedServer ? `server-${selectedServer.id}-channel-${connectedVoiceChannelId}` : null}
          username={currentUser?.username ?? "Anonymous"}
          onDisconnected={() => setConnectedVoiceChannelId(null)}
        >
          <main className="relative z-0 flex flex-1 flex-col bg-bg-primary overflow-hidden">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </VoiceProvider>
      </div>

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

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ServerRail } from "@/components/layout/server-rail"
import { ChannelSidebar } from "@/components/layout/channel-sidebar"
import { DmSidebar } from "@/components/layout/dm-sidebar"
import { VoiceProvider } from "@/components/features/voice-provider"
import { UserSettings } from "@/components/features/user-settings"
import { ErrorBoundary } from "@/components/features/error-boundary"
import {
  CreateServerModal,
  JoinServerModal,
  CreateChannelModal,
  ServerInfoModal,
  DeleteServerModal,
} from "@/components/features/modals"
import { ServerSettingsModal } from "@/components/features/server-settings"
import { CommandPalette } from "@/components/features/command-palette"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/supabase"
import { usePresence, useUnreadNotifications } from "@/hooks/use-presence"
import { Plus } from "lucide-react"
import type { Server, Channel } from "@/lib/types"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const {
    currentUser,
    setCurrentUser,
    servers,
    setServers,
    selectedServer,
    setSelectedServer,
    channels,
    setChannels,
    selectedChannel,
    setSelectedChannel,
    members,
    setMembers,
    connectedVoiceChannelId,
    setConnectedVoiceChannelId,
    micOn,
    setMicOn,
    deafened,
    setDeafened,
    setMessages,
    dmView,
    setDmView,
    setSelectedDmUser,
    selectedDmUser,
    pendingRequests,
    setPendingRequests,
  } = useAppStore()

  const [loading, setLoading] = useState(true)
  const [showCreateServer, setShowCreateServer] = useState(false)
  const [showJoinServer, setShowJoinServer] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showServerInfo, setShowServerInfo] = useState(false)
  const [showDeleteServer, setShowDeleteServer] = useState(false)
  const [showServerSettings, setShowServerSettings] = useState(false)
  const [showUserSettings, setShowUserSettings] = useState(false)

  // Fetch session and servers on mount
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login")
        return
      }

      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile) {
            setCurrentUser(profile as any)
          }
        })

      supabase
        .from("server_members")
        .select("server:servers(*)")
        .eq("user_id", user.id)
        .then(({ data: memberData }) => {
          if (memberData) {
            const serverList = memberData
              .map((m: any) => m.server)
              .filter(Boolean)
            setServers(serverList as Server[])
          }
          setLoading(false)
        })

      // Fetch pending friend requests for badge
      supabase
        .from("friends")
        .select("*")
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .then(({ data }) => {
          if (data) {
            setPendingRequests(data as any)
          }
        })
    })
  }, [router, setCurrentUser, setServers, setPendingRequests])

  // When selected server changes, fetch channels and members
  useEffect(() => {
    if (!selectedServer) return

    const supabase = createClient()

    supabase
      .from("channels")
      .select("*")
      .eq("server_id", selectedServer.id)
      .order("position", { ascending: true })
      .then(({ data: channelData }) => {
        if (channelData) {
          setChannels(channelData as Channel[])
          const currentChannelStillExists = channelData.find(
            (c) => c.id === selectedChannel?.id,
          )
          if (!currentChannelStillExists && channelData.length > 0) {
            setSelectedChannel(channelData[0] as Channel)
          }
        }
      })

    supabase
      .from("server_members")
      .select("*, profile:profiles(*)")
      .eq("server_id", selectedServer.id)
      .then(({ data: memberData }) => {
        if (memberData) {
          setMembers(memberData as any)
        }
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

  function handleJoinVoice(channelId: string) {
    setConnectedVoiceChannelId(channelId)
  }

  function handleLeaveVoice() {
    setConnectedVoiceChannelId(null)
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
    await supabase
      .from("server_members")
      .delete()
      .eq("server_id", selectedServer.id)
      .eq("user_id", currentUser.id)

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

  // Presence and notifications
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
          <p className="text-sm text-text-muted text-muted-opacity">
            definitely not copying anyone...
          </p>
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
            <p className="mt-2 text-sm text-text-muted text-muted-opacity">
              so empty, just like our originality
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={() => setShowCreateServer(true)}>
                <Plus className="size-4" />
                Create Server
              </Button>
              <Button variant="outline" onClick={() => setShowJoinServer(true)}>
                Join Server
              </Button>
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
      {/* Server Rail */}
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

      {/* DM Sidebar */}
      {dmView && <DmSidebar />}

      {/* Channel Sidebar */}
      {!dmView && selectedServer && (
        <ChannelSidebar
          server={selectedServer as any}
          channels={channels}
          activeChannelId={selectedChannel?.id ?? ""}
          onSelectChannel={handleSelectChannel}
          connectedVoiceId={connectedVoiceChannelId}
          onJoinVoice={handleJoinVoice}
          onLeaveVoice={handleLeaveVoice}
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

      {/* Main Content */}
      <VoiceProvider
        roomName={
          connectedVoiceChannelId && selectedServer
            ? `server-${selectedServer.id}-channel-${connectedVoiceChannelId}`
            : null
        }
        username={currentUser?.username ?? "Anonymous"}
        onDisconnected={() => setConnectedVoiceChannelId(null)}
      >
        <main className="relative z-0 flex flex-1 flex-col bg-bg-primary">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </VoiceProvider>

      {/* User Settings */}
      <UserSettings open={showUserSettings} onOpenChange={setShowUserSettings} />

      {/* Command Palette */}
      <CommandPalette />

      {/* Modals */}
      <CreateServerModal open={showCreateServer} onOpenChange={setShowCreateServer} />
      <JoinServerModal open={showJoinServer} onOpenChange={setShowJoinServer} />

      {selectedServer && (
        <>
          <CreateChannelModal
            open={showCreateChannel}
            onOpenChange={setShowCreateChannel}
            serverId={selectedServer.id}
          />
          <ServerInfoModal
            open={showServerInfo}
            onOpenChange={setShowServerInfo}
            server={selectedServer}
          />
          <DeleteServerModal
            open={showDeleteServer}
            onOpenChange={setShowDeleteServer}
            serverName={selectedServer.name}
            onConfirm={handleDeleteServer}
          />
          <ServerSettingsModal
            open={showServerSettings}
            onOpenChange={setShowServerSettings}
            server={selectedServer}
          />
        </>
      )}
    </div>
  )
}

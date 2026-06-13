"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ServerRail } from "@/components/app/server-rail"
import { ChannelSidebar } from "@/components/app/channel-sidebar"
import { DmSidebar } from "@/components/app/dm-sidebar"
import { VoiceRoom } from "@/components/app/voice-provider"
import {
  CreateServerModal,
  JoinServerModal,
  CreateChannelModal,
  ServerInfoModal,
  DeleteServerModal,
} from "@/components/app/modals"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
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
  } = useAppStore()

  const [loading, setLoading] = useState(true)
  const [showCreateServer, setShowCreateServer] = useState(false)
  const [showJoinServer, setShowJoinServer] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showServerInfo, setShowServerInfo] = useState(false)
  const [showDeleteServer, setShowDeleteServer] = useState(false)
  const [showServerSettings, setShowServerSettings] = useState(false)
  const [serverSettingsName, setServerSettingsName] = useState("")
  const [serverSettingsError, setServerSettingsError] = useState<string | null>(null)

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
    })
  }, [router, setCurrentUser, setServers])

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
  }, [selectedServer?.id])

  function handleSelectServer(serverId: string) {
    const server = servers.find((s) => s.id === serverId)
    if (server) {
      setDmView(false)
      setSelectedDmUser(null)
      setSelectedServer(server)
    }
  }

  function handleSelectChannel(channelId: string) {
    const channel = channels.find((c) => c.id === channelId)
    if (channel) {
      setSelectedChannel(channel)
      setMessages([])
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

  async function handleUpdateServerName() {
    if (!selectedServer || !serverSettingsName.trim()) return
    setServerSettingsError(null)
    const supabase = createClient()
    const { error } = await supabase
      .from("servers")
      .update({ name: serverSettingsName.trim() })
      .eq("id", selectedServer.id)

    if (error) {
      setServerSettingsError(error.message)
      return
    }

    setServers(
      servers.map((s) =>
        s.id === selectedServer.id ? { ...s, name: serverSettingsName.trim() } : s,
      ),
    )
    setSelectedServer({ ...selectedServer, name: serverSettingsName.trim() })
    setShowServerSettings(false)
  }

  const isOwner = selectedServer?.owner_id === currentUser?.id

  // Presence and notifications
  usePresence()
  useUnreadNotifications()

  if (loading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (servers.length === 0) {
    return (
      <div className="flex h-svh flex-col bg-background">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold">No servers yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a server or join one with an invite code to get started.
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
    <div className="flex h-svh bg-background">
      {/* Server Rail */}
      <ServerRail
        servers={servers}
        activeServerId={selectedServer?.id ?? null}
        onSelectServer={handleSelectServer}
        onAddServer={() => setShowCreateServer(true)}
        onExploreServers={() => setShowJoinServer(true)}
        onOpenDm={handleOpenDm}
        dmActive={dmView}
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
          onOpenServerSettings={() => {
            setServerSettingsName(selectedServer.name)
            setShowServerSettings(true)
          }}
          onOpenUserSettings={() => {}}
          onOpenCreateChannel={() => setShowCreateChannel(true)}
          onOpenInvite={() => setShowServerInfo(true)}
          onLeaveServer={handleLeaveServer}
          onDeleteServer={() => setShowDeleteServer(true)}
          isOwner={isOwner}
        />
      )}

      {/* Main Content */}
      <main className="flex flex-1 flex-col bg-chat">{children}</main>

      {/* Voice Room (hidden, manages connection) */}
      {connectedVoiceChannelId && currentUser && selectedServer && (
        <VoiceRoom
          roomName={`server-${selectedServer.id}-channel-${connectedVoiceChannelId}`}
          username={currentUser.username}
          onDisconnected={() => setConnectedVoiceChannelId(null)}
        />
      )}

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
          <Dialog open={showServerSettings} onOpenChange={setShowServerSettings}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Server Settings</DialogTitle>
                <DialogDescription>
                  Edit your server name and configuration.
                </DialogDescription>
              </DialogHeader>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="server-settings-name">Server Name</FieldLabel>
                  <Input
                    id="server-settings-name"
                    value={serverSettingsName}
                    onChange={(e) => setServerSettingsName(e.target.value)}
                    placeholder={selectedServer.name}
                    onKeyDown={(e) => e.key === "Enter" && handleUpdateServerName()}
                  />
                </Field>
                {serverSettingsError && (
                  <p className="text-sm text-destructive">{serverSettingsError}</p>
                )}
              </FieldGroup>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleUpdateServerName}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}

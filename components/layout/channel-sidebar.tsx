"use client"

import { useState } from "react"
import {
  ChevronDown,
  Hash,
  Volume2,
  Plus,
  Search,
  Bell,
  Settings,
  Mic,
  MicOff,
  Headphones,
  HeadphoneOff,
  PhoneOff,
  LogOut,
  Users,
  Trash2,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UserAvatar, type AvatarUser } from "@/components/features/user-avatar"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/supabase"
import type { Channel, Server, Profile, ServerMember } from "@/lib/types"

export function ChannelSidebar({
  server,
  channels,
  activeChannelId,
  onSelectChannel,
  connectedVoiceId,
  onJoinVoice,
  onLeaveVoice,
  micOn,
  onToggleMic,
  deafened,
  onToggleDeafen,
  onOpenServerSettings,
  onOpenUserSettings,
  onOpenCreateChannel,
  onOpenInvite,
  onLeaveServer,
  onDeleteServer,
  isOwner,
}: {
  server: Server
  channels: Channel[]
  activeChannelId: string
  onSelectChannel: (id: string) => void
  connectedVoiceId: string | null
  onJoinVoice: (id: string) => void
  onLeaveVoice: () => void
  micOn: boolean
  onToggleMic: () => void
  deafened: boolean
  onToggleDeafen: () => void
  onOpenServerSettings: () => void
  onOpenUserSettings: () => void
  onOpenCreateChannel?: () => void
  onOpenInvite?: () => void
  onLeaveServer?: () => void
  onDeleteServer?: () => void
  isOwner?: boolean
}) {
  const [query, setQuery] = useState("")
  const { currentUser, setCurrentUser, members, setMessages } = useAppStore()

  const filtered = channels.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  )
  const textChannels = filtered.filter((c) => c.type === "text")
  const voiceChannels = filtered.filter((c) => c.type === "voice")

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setCurrentUser(null)
    setMessages([])
    window.location.href = "/auth/login"
  }

  const [showServerMenu, setShowServerMenu] = useState(false)

  const onlineMembers = members.filter(
    (m) => m.profile?.status === "online" || m.profile?.status === "idle" || m.profile?.status === "dnd",
  )
  const offlineMembers = members.filter(
    (m) => m.profile?.status === "offline" || !m.profile?.status,
  )

  return (
    <div className="flex h-full w-60 shrink-0 flex-col bg-channels">
      {/* Server header dropdown */}
      <DropdownMenu open={showServerMenu} onOpenChange={setShowServerMenu}>
        <DropdownMenuTrigger render={<button type="button" className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 px-4 text-left transition-colors hover:bg-secondary/50 w-full" />}>
          <span className="truncate font-semibold">{server.name}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{server.name}</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { onOpenInvite?.(); setShowServerMenu(false); }}>
            <Users className="size-4" />
            Invite People
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { onOpenCreateChannel?.(); setShowServerMenu(false); }}>
            <Plus className="size-4" />
            Create Channel
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { onOpenServerSettings?.(); setShowServerMenu(false); }}>
            <Settings className="size-4" />
            Server Settings
          </DropdownMenuItem>
          {onLeaveServer && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { onLeaveServer(); setShowServerMenu(false); }}>
                <LogOut className="size-4" />
                Leave Server
              </DropdownMenuItem>
              {isOwner && onDeleteServer && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => { onDeleteServer(); setShowServerMenu(false); }}
                >
                  <Trash2 className="size-4" />
                  Delete Server
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Search */}
      <div className="p-2.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search channels"
            className="h-8 bg-background/50 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 no-scrollbar">
        <ChannelSection label="Text Channels" onAdd={onOpenCreateChannel}>
          {textChannels.map((channel) => (
            <TextChannelRow
              key={channel.id}
              channel={channel}
              active={channel.id === activeChannelId}
              onClick={() => onSelectChannel(channel.id)}
            />
          ))}
        </ChannelSection>

        <ChannelSection label="Voice Channels" onAdd={onOpenCreateChannel}>
          {voiceChannels.map((channel) => (
            <VoiceChannelRow
              key={channel.id}
              channel={channel}
              active={channel.id === activeChannelId}
              connected={connectedVoiceId === channel.id}
              onClick={() => onSelectChannel(channel.id)}
            />
          ))}
        </ChannelSection>

        {/* Members section */}
        {members.length > 0 && (
          <div className="mt-4">
            <div className="px-1.5 py-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                ONLINE — {onlineMembers.length}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {onlineMembers.slice(0, 10).map((m) => (
                <MemberRow key={m.id} member={m} />
              ))}
            </div>
            {offlineMembers.length > 0 && (
              <>
                <div className="mt-2 px-1.5 py-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    OFFLINE — {offlineMembers.length}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {offlineMembers.slice(0, 5).map((m) => (
                    <MemberRow key={m.id} member={m} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Voice status (when connected) */}
      {connectedVoiceId && (
        <div className="mx-2 mb-1 flex items-center justify-between rounded-md bg-background/40 px-2 py-1.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <Volume2 className="size-4 shrink-0 text-[var(--color-online)]" />
            <span className="truncate text-xs font-medium text-[var(--color-online)]">
              Voice Connected
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onLeaveVoice}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                />
              }
            >
              <PhoneOff className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Disconnect</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* User control panel */}
      <div className="flex shrink-0 items-center gap-1 bg-rail/80 px-2 py-2">
        {currentUser && (
          <button
            type="button"
            onClick={onOpenUserSettings}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 text-left transition-colors hover:bg-secondary/60"
          >
            <UserAvatar
              user={
                {
                  id: currentUser.id,
                  username: currentUser.username,
                  initials: currentUser.username.slice(0, 2).toUpperCase(),
                  color: "var(--color-chart-2)",
                  status: currentUser.status,
                  customStatus: undefined,
                  avatar: currentUser.avatar_url ?? undefined,
                } as AvatarUser
              }
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-tight">
                {currentUser.username}
              </p>
              <p className="truncate text-xs leading-tight text-muted-foreground">
                {currentUser.status}
              </p>
            </div>
          </button>
        )}

        <ControlButton
          label={micOn ? "Mute" : "Unmute"}
          active={!micOn}
          onClick={onToggleMic}
        >
          {micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
        </ControlButton>
        <ControlButton
          label={deafened ? "Undeafen" : "Deafen"}
          active={deafened}
          onClick={onToggleDeafen}
        >
          {deafened ? (
            <HeadphoneOff className="size-4" />
          ) : (
            <Headphones className="size-4" />
          )}
        </ControlButton>
        <ControlButton label="Logout" onClick={handleLogout}>
          <LogOut className="size-4" />
        </ControlButton>
        <ControlButton label="User Settings" onClick={onOpenUserSettings}>
          <Settings className="size-4" />
        </ControlButton>
      </div>
    </div>
  )
}

function MemberRow({ member }: { member: ServerMember }) {
  if (!member.profile) return null
  const initials = member.profile.username.slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-secondary/40">
      <span
        className="inline-block size-2 rounded-full"
        style={{
          backgroundColor:
            member.profile.status === "online"
              ? "var(--color-online)"
              : member.profile.status === "idle"
                ? "var(--color-idle)"
                : member.profile.status === "dnd"
                  ? "var(--color-dnd)"
                  : "var(--color-offline)",
        }}
      />
      <span className="truncate text-foreground/90">{member.profile.username}</span>
      {member.role !== "member" && (
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {member.role}
        </Badge>
      )}
    </div>
  )
}

function ChannelSection({
  label,
  onAdd,
  children,
}: {
  label: string
  onAdd?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mt-4 first:mt-2">
      <div className="group flex items-center justify-between px-1.5 py-1">
        <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <ChevronDown className="size-3" />
          {label}
        </span>
        {onAdd && (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onAdd}
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                />
              }
            >
              <Plus className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Create channel</TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

function TextChannelRow({
  channel,
  active,
  onClick,
}: {
  channel: Channel
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
      )}
    >
      <Hash className="size-4 shrink-0 opacity-70" />
      <span className="truncate">{channel.name}</span>
      <span className="ml-auto flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
                <Bell className="size-3.5" />
              </span>
            }
          />
          <TooltipContent>Notification settings</TooltipContent>
        </Tooltip>
      </span>
    </button>
  )
}

function VoiceChannelRow({
  channel,
  active,
  connected,
  onClick,
}: {
  channel: Channel
  active: boolean
  connected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-secondary text-foreground"
          : connected
            ? "text-[var(--color-online)] hover:bg-secondary/40"
            : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
      )}
    >
      <Volume2 className={cn("size-4 shrink-0", connected ? "text-[var(--color-online)] animate-pulse" : "opacity-70")} />
      <span className={cn("truncate", connected && "text-[var(--color-online)] font-medium")}>{channel.name}</span>
    </button>
  )
}

function ControlButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onClick}
            className={cn(
              "flex size-8 items-center justify-center rounded-md transition-colors",
              active
                ? "text-destructive hover:bg-destructive/10"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

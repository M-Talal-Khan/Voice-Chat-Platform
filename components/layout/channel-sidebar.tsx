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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UserAvatar, type AvatarUser } from "@/components/features/user-avatar"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/supabase"
import type { Channel, Server, ServerMember } from "@/lib/types"

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
  onMessageMember,
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
  onMessageMember?: (userId: string) => void
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
    <div className="flex h-full w-60 shrink-0 flex-col border-r border-border-subtle bg-bg-secondary">
      {/* Server header dropdown */}
      <DropdownMenu open={showServerMenu} onOpenChange={setShowServerMenu}>
        <DropdownMenuTrigger render={<button type="button" className="flex h-12 w-full shrink-0 items-center justify-between border-b border-border-subtle px-4 text-left transition-colors hover:bg-surface" />}>
          <span className="truncate font-bold tracking-heading">{server.name}</span>
          <ChevronDown className="size-4 shrink-0 text-text-muted" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 border-border-subtle bg-surface backdrop-blur-[20px]">
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
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search channels"
            className="h-8 bg-bg-primary pl-8 text-sm"
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
          <div className="mt-4 border-l border-border-subtle pl-2 pb-4">
            <div className="px-1.5 py-1">
              <span className="text-[11px] font-semibold uppercase tracking-section text-text-muted">
                ONLINE NOW
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {onlineMembers.slice(0, 8).map((m) => (
                <MemberRow 
                  key={m.id} 
                  member={m} 
                  onClick={() => onMessageMember?.(m.user_id)} 
                  connectedVoiceId={connectedVoiceId}
                />
              ))}
              {onlineMembers.length > 8 && (
                <div className="px-2 py-1 text-xs text-text-muted">
                  and {onlineMembers.length - 8} more online
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Voice status (when connected) */}
      {connectedVoiceId && (
        <div className="mx-2 mb-1 flex items-center justify-between rounded-md border-t border-border-subtle bg-bg-secondary px-2 py-1.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="relative inline-block size-2 rounded-full bg-accent-primary">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent-primary opacity-50" />
            </span>
            <span className="truncate text-xs font-medium text-accent-primary">
              Voice Connected
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onLeaveVoice}
                  className="rounded p-1 text-text-muted transition-colors hover:bg-surface hover:text-danger"
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
      <div className="flex shrink-0 items-center gap-1 border-t border-border-subtle bg-bg-primary px-2 py-2">
        {currentUser && (
          <button
            type="button"
            onClick={onOpenUserSettings}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 text-left transition-colors hover:bg-surface"
          >
            <UserAvatar
              user={
                {
                  id: currentUser.id,
                  username: currentUser.username,
                  initials: currentUser.username.slice(0, 2).toUpperCase(),
                  color: "var(--accent-dark)",
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
              <p className="truncate text-xs leading-tight text-text-muted text-muted-opacity">
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

function MemberRow({ member, onClick, connectedVoiceId }: { member: ServerMember; onClick?: () => void; connectedVoiceId?: string | null }) {
  const [open, setOpen] = useState(false)
  if (!member.profile) return null

  const isTyping = false // Placeholder for typing indicator
  const isInVoice = false // Placeholder for voice indicator
  const statusColor =
    member.profile.status === "online"
      ? "var(--color-online)"
      : member.profile.status === "idle"
        ? "var(--color-idle)"
        : member.profile.status === "dnd"
          ? "var(--color-dnd)"
          : "var(--color-offline)"

  const avatarUser = {
    id: member.profile.id,
    username: member.profile.username,
    initials: member.profile.username.slice(0, 2).toUpperCase(),
    color: "var(--accent-dark)", // Fallback color
    status: member.profile.status,
    avatar: member.profile.avatar_url ?? undefined,
  } as AvatarUser

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <div
            role="button"
            tabIndex={0}
            className="group flex w-full cursor-pointer items-center gap-2 rounded px-1.5 py-1.5 text-left transition-colors hover:bg-surface"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.currentTarget.click()
              }
            }}
          />
        }
      >
        <div className="relative">
          <UserAvatar user={avatarUser} size="sm" />
        </div>
        <span className="truncate text-sm font-medium text-text-muted transition-colors group-hover:text-text-primary">
          {member.profile.username}
        </span>

        {isInVoice && (
          <Volume2 className="ml-auto size-3.5 text-text-muted opacity-70" />
        )}

        {isTyping && (
          <span className="ml-auto flex items-center gap-0.5">
            <span className="size-1 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="size-1 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="size-1 rounded-full bg-accent-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-64 p-0 shadow-2xl bg-bg-secondary border-border-subtle" sideOffset={12}>
        <div className="h-16 w-full rounded-t-lg bg-surface relative">
          <div className="absolute -bottom-6 left-4 rounded-full p-1 bg-bg-secondary">
            <UserAvatar user={avatarUser} size="lg" />
          </div>
        </div>
        <div className="px-4 pb-4 pt-8">
          <h3 className="text-lg font-bold">{member.profile.username}</h3>
          <p className="text-xs text-text-muted mb-4 capitalize">{member.profile.status}</p>
          <Button 
            className="w-full text-xs" 
            size="sm" 
            onClick={() => {
              setOpen(false)
              onClick?.()
            }}
          >
            Send Message
          </Button>
        </div>
      </PopoverContent>
    </Popover>
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
        <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-section text-text-muted">
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
                  className="text-text-muted opacity-0 transition-opacity hover:text-accent-primary group-hover:opacity-100"
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
          ? "border-l-2 border-accent-primary bg-surface pl-[calc(0.5rem-2px)] text-accent-primary"
          : "text-text-muted hover:bg-surface hover:text-text-primary",
      )}
    >
      <Hash className={cn("size-4 shrink-0", active ? "text-accent-primary" : "opacity-70")} />
      <span className="truncate">{channel.name}</span>
      <span className="ml-auto flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="text-text-muted opacity-0 transition-opacity hover:text-text-primary group-hover:opacity-100">
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
          ? "border-l-2 border-accent-primary bg-surface pl-[calc(0.5rem-2px)] text-accent-primary"
          : connected
            ? "text-accent-primary hover:bg-surface"
            : "text-text-muted hover:bg-surface hover:text-text-primary",
      )}
    >
      <Volume2 className={cn("size-4 shrink-0", connected ? "text-accent-primary animate-pulse" : "opacity-70")} />
      <span className={cn("truncate", connected && "font-medium text-accent-primary")}>{channel.name}</span>
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
                ? "text-danger hover:bg-surface"
                : "text-text-muted hover:bg-surface hover:text-accent-primary",
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

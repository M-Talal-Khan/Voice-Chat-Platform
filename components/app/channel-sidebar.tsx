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
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/app/user-avatar"
import {
  currentUser,
  users,
  statusLabel,
  type Channel,
  type Server,
} from "@/lib/mock-data"

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
}) {
  const [query, setQuery] = useState("")

  const filtered = channels.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  )
  const textChannels = filtered.filter((c) => c.type === "text")
  const voiceChannels = filtered.filter((c) => c.type === "voice")

  return (
    <div className="flex h-full w-60 shrink-0 flex-col bg-channels">
      {/* Server header */}
      <button
        type="button"
        onClick={onOpenServerSettings}
        className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 px-4 text-left transition-colors hover:bg-secondary/50"
      >
        <span className="truncate font-semibold">{server.name}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

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
        <ChannelSection label="Text Channels">
          {textChannels.map((channel) => (
            <TextChannelRow
              key={channel.id}
              channel={channel}
              active={channel.id === activeChannelId}
              onClick={() => onSelectChannel(channel.id)}
            />
          ))}
        </ChannelSection>

        <ChannelSection label="Voice Channels">
          {voiceChannels.map((channel) => (
            <VoiceChannelRow
              key={channel.id}
              channel={channel}
              connected={connectedVoiceId === channel.id}
              onJoin={() => onJoinVoice(channel.id)}
            />
          ))}
        </ChannelSection>
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
        <button
          type="button"
          onClick={onOpenUserSettings}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 text-left transition-colors hover:bg-secondary/60"
        >
          <UserAvatar user={currentUser} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight">
              {currentUser.username}
            </p>
            <p className="truncate text-xs leading-tight text-muted-foreground">
              {currentUser.customStatus ?? statusLabel(currentUser.status)}
            </p>
          </div>
        </button>

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
        <ControlButton label="User Settings" onClick={onOpenUserSettings}>
          <Settings className="size-4" />
        </ControlButton>
      </div>
    </div>
  )
}

function ChannelSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-4 first:mt-2">
      <div className="group flex items-center justify-between px-1.5 py-1">
        <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <ChevronDown className="size-3" />
          {label}
        </span>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              />
            }
          >
            <Plus className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Create channel</TooltipContent>
        </Tooltip>
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
  const hasUnread = !!channel.unread && !active
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-secondary text-foreground"
          : hasUnread
            ? "text-foreground hover:bg-secondary/60"
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
        {channel.mentions ? (
          <Badge className="size-5 justify-center rounded-full p-0 text-[10px]">
            {channel.mentions}
          </Badge>
        ) : channel.unread ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-foreground">
            {channel.unread}
          </span>
        ) : null}
      </span>
    </button>
  )
}

function VoiceChannelRow({
  channel,
  connected,
  onJoin,
}: {
  channel: Channel
  connected: boolean
  onJoin: () => void
}) {
  const connectedUsers = (channel.connectedUserIds ?? [])
    .map((id) => users[id])
    .filter(Boolean)

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onJoin}
        className={cn(
          "group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors",
          connected
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
        )}
      >
        <Volume2 className="size-4 shrink-0 opacity-70" />
        <span className="truncate">{channel.name}</span>
        {connectedUsers.length > 0 && (
          <span className="ml-auto text-[11px] text-muted-foreground">
            {connectedUsers.length}
          </span>
        )}
      </button>

      {connectedUsers.length > 0 && (
        <div className="ml-3 flex flex-col gap-0.5 border-l border-border/60 pl-3 pt-0.5">
          {connectedUsers.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-secondary/40"
            >
              <UserAvatar user={u} size="sm" showStatus={false} />
              <span className="truncate text-xs text-foreground/90">
                {u.username}
              </span>
              {u.status === "dnd" && (
                <MicOff className="ml-auto size-3 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
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

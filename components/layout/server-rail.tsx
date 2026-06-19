"use client"

import { memo, useMemo } from "react"
import { Plus, Compass, MessageSquare, Link2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Server } from "@/lib/types"

export function ServerRail({
  servers,
  activeServerId,
  onSelectServer,
  onAddServer,
  onJoinServer,
  onExploreServers,
  onOpenDm,
  dmActive,
  dmBadge,
}: {
  servers: Server[]
  activeServerId: string | null
  onSelectServer: (id: string) => void
  onAddServer?: () => void
  onJoinServer?: () => void
  onExploreServers?: () => void
  onOpenDm?: () => void
  dmActive?: boolean
  dmBadge?: number
}) {
  return (
    <nav
      aria-label="Servers"
      className="flex h-full w-[72px] shrink-0 flex-col items-center gap-2 bg-bg-primary py-3"
    >
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href="/"
                  className="group flex size-12 items-center justify-center rounded-server bg-transparent transition-transform hover:scale-105"
                />
              }
            >
              <Image
                src="/logo-icon.svg"
                alt="Thiscord"
                width={48}
                height={48}
                className="size-12 transition-transform duration-[600ms] group-hover:rotate-[360deg]"
                style={{ filter: "drop-shadow(0 0 8px rgba(170, 255, 0, 0.6))" }}
              />
            </TooltipTrigger>
            <TooltipContent side="right">Thiscord Home</TooltipContent>
          </Tooltip>

      {onOpenDm && (
        <>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onOpenDm}
                  className={cn(
                    "relative flex size-12 items-center justify-center rounded-server transition-all",
                    dmActive
                      ? "bg-accent-primary text-bg-primary shadow-accent-glow"
                      : "bg-surface text-text-secondary hover:scale-105 hover:shadow-accent-glow",
                  )}
                />
              }
            >
              <>
                <MessageSquare className="size-5" />
                {!!dmBadge && dmBadge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-bg-primary bg-destructive px-1 text-[10px] font-bold text-white z-10 pointer-events-none">
                    {dmBadge}
                  </span>
                )}
              </>
            </TooltipTrigger>
            <TooltipContent side="right">Direct Messages</TooltipContent>
          </Tooltip>
          <div className="my-1 h-px w-8 bg-border-subtle" />
        </>
      )}

      <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto no-scrollbar">
        {servers.map((server) => (
          <ServerIcon
            key={server.id}
            server={server}
            active={server.id === activeServerId}
            onClick={() => onSelectServer(server.id)}
          />
        ))}

        {onAddServer && (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onAddServer}
                  className="flex size-12 items-center justify-center rounded-server border-2 border-dashed border-border-subtle bg-transparent text-text-muted transition-all hover:scale-105 hover:border-accent-primary hover:text-accent-primary hover:shadow-accent-glow"
                />
              }
            >
              <Plus className="size-6" />
            </TooltipTrigger>
            <TooltipContent side="right">Add a server</TooltipContent>
          </Tooltip>
        )}

        {onJoinServer && (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onJoinServer}
                  className="flex size-12 items-center justify-center rounded-server border-2 border-dashed border-border-subtle bg-transparent text-text-muted transition-all hover:scale-105 hover:border-accent-primary hover:text-accent-primary hover:shadow-accent-glow"
                />
              }
            >
              <Link2 className="size-6" />
            </TooltipTrigger>
            <TooltipContent side="right">Join a server</TooltipContent>
          </Tooltip>
        )}

        {onExploreServers && (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onExploreServers}
                  className="flex size-12 items-center justify-center rounded-server border-2 border-dashed border-border-subtle bg-transparent text-text-muted transition-all hover:scale-105 hover:border-accent-primary hover:text-accent-primary hover:shadow-accent-glow"
                />
              }
            >
              <Compass className="size-6" />
            </TooltipTrigger>
            <TooltipContent side="right">Explore servers</TooltipContent>
          </Tooltip>
        )}
      </div>
    </nav>
  )
}

const ServerIcon = memo(({
  server,
  active,
  onClick,
}: {
  server: Server
  active: boolean
  onClick: () => void
}) => {
  const acronym = useMemo(() => server.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase(), [server.name])

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onClick}
            aria-current={active ? "page" : undefined}
            className="group relative flex items-center justify-center"
          />
        }
      >
        {/* Active server: neon green left pill */}
        <span
          className={cn(
            "absolute -left-3 w-1 rounded-r-full bg-accent-primary transition-all",
            active ? "h-8" : "h-0 group-hover:h-4",
          )}
        />
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-server text-sm font-semibold transition-all",
            active
              ? "bg-accent-primary text-bg-primary shadow-accent-glow"
              : "bg-surface text-text-secondary hover:scale-105 hover:shadow-accent-glow",
          )}
        >
          {acronym}
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">{server.name}</TooltipContent>
    </Tooltip>
  )
})

ServerIcon.displayName = "ServerIcon"

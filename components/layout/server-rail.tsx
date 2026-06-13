"use client"

import { Plus, Compass, Radio, MessageSquare } from "lucide-react"
import Link from "next/link"
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
  onExploreServers,
  onOpenDm,
  dmActive,
}: {
  servers: Server[]
  activeServerId: string | null
  onSelectServer: (id: string) => void
  onAddServer?: () => void
  onExploreServers?: () => void
  onOpenDm?: () => void
  dmActive?: boolean
}) {
  return (
    <nav
      aria-label="Servers"
      className="flex h-full w-[72px] shrink-0 flex-col items-center gap-2 bg-rail py-3"
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href="/"
              className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-transform hover:scale-105"
            />
          }
        >
          <Radio className="size-6" />
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
                    "flex size-12 items-center justify-center transition-all",
                    dmActive
                      ? "rounded-2xl bg-primary text-primary-foreground"
                      : "rounded-3xl bg-secondary text-secondary-foreground hover:rounded-2xl",
                  )}
                />
              }
            >
              <MessageSquare className="size-5" />
            </TooltipTrigger>
            <TooltipContent side="right">Direct Messages</TooltipContent>
          </Tooltip>
          <div className="my-1 h-px w-8 bg-border" />
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
                  className="flex size-12 items-center justify-center rounded-3xl bg-secondary text-[var(--color-online)] transition-all hover:rounded-2xl hover:bg-[var(--color-online)] hover:text-primary-foreground"
                />
              }
            >
              <Plus className="size-6" />
            </TooltipTrigger>
            <TooltipContent side="right">Add a server</TooltipContent>
          </Tooltip>
        )}

        {onExploreServers && (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={onExploreServers}
                  className="flex size-12 items-center justify-center rounded-3xl bg-secondary text-[var(--color-online)] transition-all hover:rounded-2xl hover:bg-[var(--color-online)] hover:text-primary-foreground"
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

function ServerIcon({
  server,
  active,
  onClick,
}: {
  server: Server
  active: boolean
  onClick: () => void
}) {
  const acronym = server.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

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
        {/* active/unread pill indicator */}
        <span
          className={cn(
            "absolute -left-3 w-1 rounded-r-full bg-foreground transition-all",
            active ? "h-8" : "h-0 group-hover:h-4",
          )}
        />
        <span
          className={cn(
            "flex size-12 items-center justify-center text-sm font-semibold transition-all",
            active
              ? "rounded-2xl text-primary-foreground"
              : "rounded-3xl text-secondary-foreground hover:rounded-2xl",
          )}
          style={{
            backgroundColor: active ? "var(--color-primary)" : "var(--color-secondary)",
          }}
        >
          {acronym}
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">{server.name}</TooltipContent>
    </Tooltip>
  )
}

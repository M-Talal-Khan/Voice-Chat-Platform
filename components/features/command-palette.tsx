"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import {
  Search,
  MessageSquare,
  Settings,
  LogOut,
  Hash,
  Volume2,
  Users,
  Layout,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { 
    servers, 
    channels, 
    setSelectedServer, 
    setSelectedChannel, 
    setDmView,
    setCurrentUser,
    setMessages
  } = useAppStore()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setCurrentUser(null)
    setMessages([])
    router.push("/auth/login")
  }

  return (
    <div className="command-palette-wrapper">
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Global Command Menu"
        className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-border-subtle bg-surface/80 p-0 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center border-b border-border-subtle px-3" cmdk-input-wrapper="">
          <Search className="mr-2 size-4 shrink-0 text-text-muted" />
          <Command.Input
            placeholder="Type a command or search..."
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 no-scrollbar">
          <Command.Empty className="py-6 text-center text-sm text-text-muted">
            No results found.
          </Command.Empty>
          
          <Command.Group heading="Navigation" className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            <CommandItem
              onSelect={() => runCommand(() => {
                setDmView(true)
                router.push("/app/friends")
              })}
            >
              <Users className="mr-2 size-4" />
              <span>Friends</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => {
                setDmView(true)
                router.push("/app/friends")
              })}
            >
              <MessageSquare className="mr-2 size-4" />
              <span>Direct Messages</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => {
                router.push("/app/explore")
              })}
            >
              <Layout className="mr-2 size-4" />
              <span>Explore Servers</span>
            </CommandItem>
          </Command.Group>

          {servers.length > 0 && (
            <Command.Group heading="Servers" className="mt-2 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              {servers.map((server) => (
                <CommandItem
                  key={server.id}
                  onSelect={() => runCommand(() => {
                    setSelectedServer(server)
                    setDmView(false)
                    router.push("/app")
                  })}
                >
                  <div className="mr-2 flex size-4 items-center justify-center rounded-sm bg-accent-primary/20 text-[10px] font-bold text-accent-primary">
                    {server.name[0].toUpperCase()}
                  </div>
                  <span>{server.name}</span>
                </CommandItem>
              ))}
            </Command.Group>
          )}

          {channels.length > 0 && (
            <Command.Group heading="Channels" className="mt-2 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              {channels.map((channel) => (
                <CommandItem
                  key={channel.id}
                  onSelect={() => runCommand(() => {
                    setSelectedChannel(channel)
                    router.push("/app")
                  })}
                >
                  {channel.type === "voice" ? (
                    <Volume2 className="mr-2 size-4" />
                  ) : (
                    <Hash className="mr-2 size-4" />
                  )}
                  <span>{channel.name}</span>
                </CommandItem>
              ))}
            </Command.Group>
          )}

          <Command.Separator className="-mx-2 my-2 h-px bg-border-subtle" />
          
          <Command.Group heading="Settings" className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            <CommandItem onSelect={() => runCommand(() => window.dispatchEvent(new CustomEvent("openUserSettings")))}>
              <Settings className="mr-2 size-4" />
              <span>User Settings</span>
              <Command.Shortcut className="ml-auto text-[10px] tracking-widest text-text-muted">⌘S</Command.Shortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(handleLogout)}>
              <LogOut className="mr-2 size-4 text-danger" />
              <span className="text-danger">Logout</span>
            </CommandItem>
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </div>
  )
}

function CommandItem({ children, onSelect, className }: { children: React.ReactNode, onSelect?: () => void, className?: string }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-md px-2 py-2 text-sm outline-none aria-selected:bg-accent-primary aria-selected:text-bg-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors duration-150",
        className
      )}
    >
      {children}
    </Command.Item>
  )
}

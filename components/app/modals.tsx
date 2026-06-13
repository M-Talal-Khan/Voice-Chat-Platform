"use client"

import { useState } from "react"
import { Copy, Check, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { createClient } from "@/lib/supabase"
import { useAppStore } from "@/lib/store"

// ─── Create Server Modal ───────────────────────────────────────

export function CreateServerModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { currentUser, setServers, servers } = useAppStore()

  async function handleCreate() {
    if (!name.trim()) {
      setError("Server name is required")
      return
    }
    if (!currentUser) return

    setLoading(true)
    setError(null)
    const supabase = createClient()

    // Create the server
    const { data: server, error: serverError } = await supabase
      .from("servers")
      .insert({
        name: name.trim(),
        owner_id: currentUser.id,
      })
      .select()
      .single()

    if (serverError || !server) {
      setError(serverError?.message ?? "Failed to create server")
      setLoading(false)
      return
    }

    // Add creator as owner member
    await supabase.from("server_members").insert({
      server_id: server.id,
      user_id: currentUser.id,
      role: "owner",
    })

    // Create default channels
    await supabase.from("channels").insert([
      { server_id: server.id, name: "general", type: "text", position: 0, topic: "General discussion" },
      { server_id: server.id, name: "General", type: "voice", position: 1 },
    ])

    setServers([...servers, server])
    setName("")
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Server</DialogTitle>
          <DialogDescription>
            Give your new server a name. You can customize it later.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="server-name">Server Name</FieldLabel>
            <Input
              id="server-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Server"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </Field>
          {error && <FieldError errors={[{ message: error }]} />}
        </FieldGroup>
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Join Server Modal ─────────────────────────────────────────

export function JoinServerModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { currentUser, setServers, servers } = useAppStore()

  async function handleJoin() {
    if (!code.trim()) {
      setError("Invite code is required")
      return
    }
    if (!currentUser) return

    setLoading(true)
    setError(null)
    const supabase = createClient()

    // Find server by invite code
    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("*")
      .eq("invite_code", code.trim())
      .single()

    if (serverError || !server) {
      setError("Invalid invite code. Please check and try again.")
      setLoading(false)
      return
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("server_members")
      .select("id")
      .eq("server_id", server.id)
      .eq("user_id", currentUser.id)
      .single()

    if (existing) {
      setError("You are already a member of this server")
      setLoading(false)
      return
    }

    // Add member
    const { error: joinError } = await supabase.from("server_members").insert({
      server_id: server.id,
      user_id: currentUser.id,
    })

    if (joinError) {
      setError(joinError.message)
      setLoading(false)
      return
    }

    setServers([...servers, server])
    setCode("")
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Server</DialogTitle>
          <DialogDescription>
            Enter an invite code to join an existing server.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="invite-code">Invite Code</FieldLabel>
            <Input
              id="invite-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter invite code"
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
          </Field>
          {error && <FieldError errors={[{ message: error }]} />}
        </FieldGroup>
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleJoin} disabled={loading}>
            {loading ? "Joining..." : "Join"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Create Channel Modal ──────────────────────────────────────

export function CreateChannelModal({
  open,
  onOpenChange,
  serverId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  serverId: string
}) {
  const [name, setName] = useState("")
  const [type, setType] = useState<"text" | "voice">("text")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { setChannels, channels } = useAppStore()

  async function handleCreate() {
    if (!name.trim()) {
      setError("Channel name is required")
      return
    }

    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .insert({
        server_id: serverId,
        name: name.trim().toLowerCase().replace(/\s+/g, "-"),
        type,
        position: channels.length,
      })
      .select()
      .single()

    if (channelError || !channel) {
      setError(channelError?.message ?? "Failed to create channel")
      setLoading(false)
      return
    }

    setChannels([...channels, channel])
    setName("")
    setType("text")
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Create a new text or voice channel.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="channel-name">Channel Name</FieldLabel>
            <Input
              id="channel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="new-channel"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </Field>
          <Field>
            <FieldLabel>Channel Type</FieldLabel>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("text")}
                className={`flex-1 rounded-lg border p-2 text-sm transition-colors ${
                  type === "text"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                Text
              </button>
              <button
                type="button"
                onClick={() => setType("voice")}
                className={`flex-1 rounded-lg border p-2 text-sm transition-colors ${
                  type === "voice"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                Voice
              </button>
            </div>
          </Field>
          {error && <FieldError errors={[{ message: error }]} />}
        </FieldGroup>
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Server Info / Invite Modal ────────────────────────────────

export function ServerInfoModal({
  open,
  onOpenChange,
  server,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  server: { id: string; name: string; invite_code: string }
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(server.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{server.name}</DialogTitle>
          <DialogDescription>
            Share the invite code below to let others join your server.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
          <code className="flex-1 text-sm font-mono">{server.invite_code}</code>
          <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
            {copied ? <Check className="size-4 text-[var(--color-online)]" /> : <Copy className="size-4" />}
          </Button>
        </div>
        <div className="flex justify-end">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete Server Modal ───────────────────────────────────────

export function DeleteServerModal({
  open,
  onOpenChange,
  serverName,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  serverName: string
  onConfirm: () => void
}) {
  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (confirmText !== serverName) return
    setLoading(true)
    await onConfirm()
    setLoading(false)
    setConfirmText("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Server</DialogTitle>
          <DialogDescription>
            This action is permanent. Type <strong>{serverName}</strong> to confirm.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="confirm-delete">
              Type <strong>{serverName}</strong> to confirm
            </FieldLabel>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={serverName}
            />
          </Field>
        </FieldGroup>
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== serverName || loading}
          >
            {loading ? "Deleting..." : "Delete Server"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

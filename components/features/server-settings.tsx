"use client"

import { useState, useEffect } from "react"
import { Check, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { createClient } from "@/lib/supabase"
import { useAppStore } from "@/lib/store"
import type { Server, JoinRequest } from "@/lib/types"

export function ServerSettingsModal({
  open,
  onOpenChange,
  server,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  server: Server
}) {
  const [activeTab, setActiveTab] = useState<"general" | "requests">("general")
  const [name, setName] = useState(server.name)
  const [error, setError] = useState<string | null>(null)
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const { setServers, servers, setSelectedServer } = useAppStore()

  useEffect(() => {
    if (open && activeTab === "requests") {
      const supabase = createClient()
      supabase
        .from("join_requests")
        .select("*, profile:profiles(*)")
        .eq("server_id", server.id)
        .eq("status", "pending")
        .then(({ data }) => {
          if (data) setRequests(data as any)
        })
    }
  }, [open, activeTab, server.id])

  async function handleUpdateName() {
    if (!name.trim()) return
    setError(null)
    const supabase = createClient()
    const { error } = await supabase
      .from("servers")
      .update({ name: name.trim() })
      .eq("id", server.id)

    if (error) {
      setError(error.message)
      return
    }

    setServers(servers.map((s) => (s.id === server.id ? { ...s, name: name.trim() } : s)))
    setSelectedServer({ ...server, name: name.trim() })
    onOpenChange(false)
  }

  async function handleRequest(request: JoinRequest, action: "accepted" | "rejected") {
    const supabase = createClient()
    
    // Update request status
    await supabase
      .from("join_requests")
      .update({ status: action })
      .eq("id", request.id)

    // If accepted, add to server_members
    if (action === "accepted") {
      await supabase.from("server_members").insert({
        server_id: server.id,
        user_id: request.user_id,
        role: "member",
      })
    }

    setRequests((prev) => prev.filter((r) => r.id !== request.id))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden flex flex-row">
        {/* Sidebar */}
        <div className="w-40 bg-bg-secondary p-4 border-r border-border-subtle flex flex-col gap-1">
          <div className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">{server.name}</div>
          <button
            onClick={() => setActiveTab("general")}
            className={`text-left px-2 py-1.5 rounded text-sm transition-colors ${
              activeTab === "general" ? "bg-surface text-text-primary" : "text-text-muted hover:bg-surface-hover"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center justify-between ${
              activeTab === "requests" ? "bg-surface text-text-primary" : "text-text-muted hover:bg-surface-hover"
            }`}
          >
            Requests
            {requests.length > 0 && activeTab !== "requests" && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {activeTab === "general" && (
            <>
              <DialogHeader className="mb-6">
                <DialogTitle>Server Overview</DialogTitle>
              </DialogHeader>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="server-settings-name">Server Name</FieldLabel>
                  <Input
                    id="server-settings-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={server.name}
                    onKeyDown={(e) => e.key === "Enter" && handleUpdateName()}
                  />
                </Field>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </FieldGroup>
              <div className="mt-8 flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateName}>Save Changes</Button>
              </div>
            </>
          )}

          {activeTab === "requests" && (
            <div className="flex h-[300px] flex-col">
              <DialogHeader className="mb-4 shrink-0">
                <DialogTitle>Join Requests</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
                {requests.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-4 text-center">No pending requests.</p>
                ) : (
                  <div className="space-y-2">
                    {requests.map((req) => (
                      <div key={req.id} className="flex items-center justify-between rounded-lg border border-border-subtle p-3 bg-surface">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-server bg-bg-secondary text-xs font-bold text-accent-primary">
                            {req.profile?.username?.slice(0, 2).toUpperCase() || "??"}
                          </div>
                          <span className="text-sm font-medium">{req.profile?.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRequest(req, "accepted")}
                            className="flex size-8 items-center justify-center rounded-full bg-green-500/10 text-green-500 transition-colors hover:bg-green-500/20"
                            title="Accept"
                          >
                            <Check className="size-4" />
                          </button>
                          <button
                            onClick={() => handleRequest(req, "rejected")}
                            className="flex size-8 items-center justify-center rounded-full bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
                            title="Reject"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

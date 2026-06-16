"use client"

import { useEffect, useRef, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/supabase"
import { Loader2, Upload, Check, Mic, Volume2 } from "lucide-react"
import type { Profile } from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import { compressImage } from "@/lib/media-utils"

export function UserSettings({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { currentUser, setCurrentUser } = useAppStore()
  const [username, setUsername] = useState(currentUser?.username ?? "")
  const [status, setStatus] = useState<string>(currentUser?.status ?? "online")
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [micDevice, setMicDevice] = useState("")
  const [speakerDevice, setSpeakerDevice] = useState("")
  const [inputVolume, setInputVolume] = useState(80)
  const [testing, setTesting] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Load compact mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("thiscord-compact-mode")
    if (saved) setCompactMode(saved === "true")
  }, [])

  // Load audio devices
  useEffect(() => {
    if (open) {
      navigator.mediaDevices?.enumerateDevices().then((devices) => {
        setAudioDevices(devices)
        const mics = devices.filter((d) => d.kind === "audioinput")
        const speakers = devices.filter((d) => d.kind === "audiooutput")
        if (mics.length > 0) setMicDevice(mics[0].deviceId)
        if (speakers.length > 0) setSpeakerDevice(speakers[0].deviceId)
      })
    }
  }, [open])

  // Reset form when opened
  useEffect(() => {
    if (open && currentUser) {
      setUsername(currentUser.username)
      setStatus(currentUser.status)
    }
  }, [open, currentUser])

  async function handleSaveUsername() {
    if (!username.trim() || !currentUser) return
    setUsernameError(null)
    setSaving(true)
    const supabase = createClient()

    try {
      // Check availability
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.trim())
        .neq("id", currentUser.id)
        .maybeSingle()

      if (existing) {
        setUsernameError("Username already taken")
        setSaving(false)
        return
      }

      const { error } = await supabase
        .from("profiles")
        .update({ username: username.trim() })
        .eq("id", currentUser.id)

      if (error) {
        setUsernameError(error.message)
      } else {
        setCurrentUser({ ...currentUser, username: username.trim() } as Profile)
        toast("Username updated!")
      }
    } catch (err) {
      toast("Failed to update username. Please try again.", { variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    setUploadingAvatar(true)
    const supabase = createClient()

    try {
      // Test bucket access first (silent)
      await supabase.storage.from('avatars').list('', { limit: 1 })
      
      // Compress image
      const { file: compressedFile } = await compressImage(file)
      
      const fileExt = "webp"
      const filePath = `${currentUser.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressedFile, { 
          upsert: true,
          contentType: 'image/webp',
          cacheControl: '3600'
        })

      if (uploadError) {
        toast("Failed to upload photo. Please try again.", { variant: "destructive" })
        setUploadingAvatar(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", currentUser.id)

      if (updateError) {
        toast("Failed to save photo. Please try again.", { variant: "destructive" })
      } else {
        setCurrentUser({ ...currentUser, avatar_url: publicUrl } as Profile)
        toast("Profile photo updated!")
      }
    } catch (err) {
      toast("Something went wrong. Please try again.", { variant: "destructive" })
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleUpdateStatus(newStatus: string) {
    setStatus(newStatus)
    if (!currentUser) return
    const supabase = createClient()
    await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", currentUser.id)
    setCurrentUser({ ...currentUser, status: newStatus } as any)
  }

  function handleCompactModeChange(val: boolean) {
    setCompactMode(val)
    localStorage.setItem("thiscord-compact-mode", val.toString())
  }

  async function handleTestMic() {
    if (testing) {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioContextRef.current?.close()
      setTesting(false)
      setAudioLevel(0)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: micDevice ? { exact: micDevice } : undefined },
      })
      streamRef.current = stream
      setTesting(true)

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const updateLevel = () => {
        if (!testing) return
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength
        setAudioLevel(Math.min(100, (avg / 255) * 100))
        requestAnimationFrame(updateLevel)
      }
      updateLevel()
    } catch {
      setTesting(false)
    }
  }

  const initials = currentUser?.username?.slice(0, 2).toUpperCase() ?? "??"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>User Settings</SheetTitle>
          <SheetDescription>Manage your profile and preferences.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <Tabs defaultValue="profile">
            <TabsList className="w-full">
              <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
              <TabsTrigger value="voice" className="flex-1">Voice & Audio</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-4 space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <span className="relative flex size-16 items-center justify-center overflow-hidden rounded-server bg-surface text-2xl font-semibold text-accent-primary">
                    {currentUser?.avatar_url ? (
                      <Image
                        src={currentUser.avatar_url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </span>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 rounded-full bg-accent-primary p-1.5 text-bg-primary shadow"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Upload className="size-3" />
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Username */}
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="settings-username">Username</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      id="settings-username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value)
                        setUsernameError(null)
                      }}
                      placeholder="your_handle"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveUsername}
                      disabled={saving || username === currentUser?.username}
                    >
                      {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                    </Button>
                  </div>
                  {usernameError && (
                    <FieldError errors={[{ message: usernameError }]} />
                  )}
                </Field>

                {/* Status */}
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "online", label: "Online", color: "var(--color-online)" },
                      { value: "dnd", label: "Busy", color: "var(--color-dnd)" },
                      { value: "idle", label: "Away", color: "var(--color-idle)" },
                      { value: "offline", label: "Invisible", color: "var(--color-offline)" },
                    ].map((s) => (
                      <button
                        key={s.value}
                        onClick={() => handleUpdateStatus(s.value)}
                        className={`flex items-center gap-2 rounded-lg border p-2 text-sm transition-colors ${
                          status === s.value
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <span
                          className="inline-block size-2.5 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.label}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Compact Mode */}
                <Field orientation="horizontal">
                  <FieldLabel>Compact Mode</FieldLabel>
                  <Switch
                    checked={compactMode}
                    onCheckedChange={handleCompactModeChange}
                  />
                </Field>
              </FieldGroup>
            </TabsContent>

            {/* Voice & Audio Tab */}
            <TabsContent value="voice" className="mt-4 space-y-6">
              <FieldGroup>
                {/* Microphone */}
                <Field>
                  <FieldLabel htmlFor="mic-device">Microphone</FieldLabel>
                  <select
                    id="mic-device"
                    value={micDevice}
                    onChange={(e) => setMicDevice(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                  >
                    {audioDevices
                      .filter((d) => d.kind === "audioinput")
                      .map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
                        </option>
                      ))}
                  </select>
                </Field>

                {/* Speaker */}
                <Field>
                  <FieldLabel htmlFor="speaker-device">Speaker</FieldLabel>
                  <select
                    id="speaker-device"
                    value={speakerDevice}
                    onChange={(e) => setSpeakerDevice(e.target.value)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                  >
                    {audioDevices
                      .filter((d) => d.kind === "audiooutput")
                      .map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Speaker ${d.deviceId.slice(0, 8)}`}
                        </option>
                      ))}
                  </select>
                </Field>

                {/* Input Volume */}
                <Field>
                  <FieldLabel>Input Volume</FieldLabel>
                  <div className="flex items-center gap-3">
                    <Volume2 className="size-4 text-muted-foreground" />
                    <Slider
                      value={[inputVolume]}
                      onValueChange={(val) => setInputVolume(Array.isArray(val) ? val[0] : val)}
                      min={0}
                      max={100}
                      className="flex-1"
                    />
                    <span className="w-8 text-right text-xs text-muted-foreground">
                      {inputVolume}%
                    </span>
                  </div>
                </Field>

                {/* Test Mic */}
                <Field>
                  <FieldLabel>Test Microphone</FieldLabel>
                  <Button
                    variant={testing ? "destructive" : "outline"}
                    size="sm"
                    onClick={handleTestMic}
                    className="w-full"
                  >
                    <Mic className="size-4" />
                    {testing ? "Stop Test" : "Test Mic"}
                  </Button>
                  {testing && (
                    <div className="mt-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-accent-primary transition-all duration-100"
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Audio level: {Math.round(audioLevel)}%
                      </p>
                    </div>
                  )}
                </Field>
              </FieldGroup>
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t border-border/60 p-4">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

"use client"

import { useCallback, useEffect, useState } from "react"
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useSpeakingParticipants,
  useParticipants,
} from "@livekit/components-react"
import { Track, createLocalAudioTrack } from "livekit-client"
import { useAppStore } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import "@livekit/components-styles"

export function getLiveKitTokenUrl(roomName: string, username: string) {
  return `/api/livekit/token?roomName=${encodeURIComponent(roomName)}&username=${encodeURIComponent(username)}`
}

export async function fetchLiveKitToken(
  roomName: string,
  username: string,
): Promise<string | null> {
  try {
    const res = await fetch(getLiveKitTokenUrl(roomName, username))
    const data = await res.json()
    return data.token ?? null
  } catch {
    return null
  }
}

function VoiceStateSync() {
  const { micOn, deafened } = useAppStore()
  const { localParticipant } = useLocalParticipant()

  useEffect(() => {
    if (localParticipant) {
      // Deafen also mutes your mic automatically
      localParticipant.setMicrophoneEnabled(micOn && !deafened)
    }
  }, [localParticipant, micOn, deafened])

  return null
}

export function VoiceProvider({
  roomName,
  username,
  onDisconnected,
  children,
}: {
  roomName: string | null
  username: string
  onDisconnected: () => void
  children: React.ReactNode
}) {
  const [token, setToken] = useState<string | undefined>(undefined)
  const { deafened, micOn } = useAppStore()

  const handleDisconnected = useCallback(() => {
    toast("Connection lost", {
      description: "disconnected, just like our relationship with copyright law",
      variant: "destructive",
    })
    onDisconnected()
  }, [onDisconnected])

  useEffect(() => {
    if (!roomName) {
      setToken(undefined)
      return
    }
    fetchLiveKitToken(roomName, username).then((t) => setToken(t ?? undefined))
  }, [roomName, username])

  return (
    <LiveKitRoom
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connect={!!roomName && !!token}
      onDisconnected={handleDisconnected}
      audio={!!roomName && !!token && micOn && !deafened} // Only request mic if connected
      className="flex flex-1 flex-col"
    >
      {!deafened && <RoomAudioRenderer />}
      <VoiceStateSync />
      {children}
    </LiveKitRoom>
  )
}

export function VoiceParticipantList() {
  const participants = useParticipants()
  const speakingParticipants = useSpeakingParticipants()
  const { localParticipant } = useLocalParticipant()

  if (participants.length === 0) return null

  return null // Visual handled in channel sidebar
}

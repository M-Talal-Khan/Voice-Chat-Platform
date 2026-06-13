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

export function VoiceRoom({
  roomName,
  username,
  onDisconnected,
}: {
  roomName: string
  username: string
  onDisconnected: () => void
}) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLiveKitToken(roomName, username).then((t) => {
      if (t) {
        setToken(t)
      } else {
        setError("Failed to get LiveKit token. Check your LiveKit configuration.")
      }
      setLoading(false)
    })
  }, [roomName, username])

  if (loading) {
    return (
      <div className="mx-2 mb-1 rounded-md bg-background/40 px-2 py-1.5 text-xs text-muted-foreground">
        Connecting to voice channel...
      </div>
    )
  }

  if (error || !token) {
    return (
      <div className="mx-2 mb-1 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
        {error ?? "Failed to connect"}
      </div>
    )
  }

  return (
    <LiveKitRoom
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connect={true}
      onDisconnected={onDisconnected}
      audio={true}
      style={{ display: "none" }}
    >
      <RoomAudioRenderer />
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

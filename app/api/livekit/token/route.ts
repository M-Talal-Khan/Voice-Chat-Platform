import { NextRequest, NextResponse } from "next/server"
import { AccessToken } from "livekit-server-sdk"

export async function GET(request: NextRequest) {
  const roomName = request.nextUrl.searchParams.get("roomName")
  const username = request.nextUrl.searchParams.get("username")

  if (!roomName || !username) {
    return NextResponse.json(
      { error: "roomName and username are required" },
      { status: 400 },
    )
  }

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit credentials not configured" },
      { status: 500 },
    )
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: username,
    ttl: "10m",
  })

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })

  const token = await at.toJwt()

  return NextResponse.json({ token })
}

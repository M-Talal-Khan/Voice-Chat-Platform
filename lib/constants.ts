// Centralized mock data + domain types.
// Structured to map cleanly onto a future Supabase schema + LiveKit rooms.

export type UserStatus = "online" | "idle" | "dnd" | "offline"

export type User = {
  id: string
  username: string
  /** Two-letter initials used by the avatar fallback */
  initials: string
  /** Tailwind-friendly accent color used for the avatar fallback bg */
  color: string
  status: UserStatus
  customStatus?: string
  /** Optional generated avatar image path */
  avatar?: string
}

export type ChannelType = "text" | "voice"

export type Channel = {
  id: string
  serverId: string
  name: string
  type: ChannelType
  topic?: string
  unread?: number
  mentions?: number
  /** users currently connected (voice only) */
  connectedUserIds?: string[]
  muted?: boolean
}

export type Server = {
  id: string
  name: string
  /** short label shown in the rail */
  acronym: string
  color: string
  unread?: boolean
}

export type Reaction = {
  emoji: string
  count: number
  reacted?: boolean
}

export type Message = {
  id: string
  authorId: string
  content: string
  timestamp: string
  /** id of the message this one replies to */
  replyToId?: string
  reactions?: Reaction[]
  pinned?: boolean
  edited?: boolean
}

export const currentUser: User = {
  id: "u-me",
  username: "you_dev",
  initials: "YD",
  color: "var(--color-chart-2)",
  status: "online",
  customStatus: "Shipping pixels",
}

export const users: Record<string, User> = {
  "u-me": currentUser,
  "u-1": {
    id: "u-1",
    username: "nova",
    initials: "NV",
    color: "var(--color-chart-1)",
    status: "online",
    customStatus: "In the zone",
  },
  "u-2": {
    id: "u-2",
    username: "lumen",
    initials: "LM",
    color: "var(--color-chart-3)",
    status: "online",
  },
  "u-3": {
    id: "u-3",
    username: "pixelpete",
    initials: "PP",
    color: "var(--color-chart-4)",
    status: "idle",
    customStatus: "AFK — back soon",
  },
  "u-4": {
    id: "u-4",
    username: "synth",
    initials: "SY",
    color: "var(--color-chart-5)",
    status: "dnd",
    customStatus: "Do not disturb",
  },
  "u-5": {
    id: "u-5",
    username: "echo",
    initials: "EC",
    color: "var(--color-chart-2)",
    status: "online",
  },
  "u-6": {
    id: "u-6",
    username: "vector",
    initials: "VC",
    color: "var(--color-chart-1)",
    status: "offline",
  },
  "u-7": {
    id: "u-7",
    username: "quill",
    initials: "QL",
    color: "var(--color-chart-3)",
    status: "offline",
  },
  "u-8": {
    id: "u-8",
    username: "byte",
    initials: "BY",
    color: "var(--color-chart-4)",
    status: "online",
  },
}

export const servers: Server[] = [
  { id: "s-1", name: "Resonate HQ", acronym: "RH", color: "var(--color-primary)" },
  { id: "s-2", name: "Design Guild", acronym: "DG", color: "var(--color-chart-2)", unread: true },
  { id: "s-3", name: "Game Night", acronym: "GN", color: "var(--color-chart-3)" },
  { id: "s-4", name: "Indie Devs", acronym: "ID", color: "var(--color-chart-4)" },
  { id: "s-5", name: "Lo-fi Lounge", acronym: "LL", color: "var(--color-chart-5)" },
]

export const channels: Channel[] = [
  // text
  {
    id: "c-welcome",
    serverId: "s-1",
    name: "welcome",
    type: "text",
    topic: "Say hi and read the rules before posting.",
  },
  {
    id: "c-general",
    serverId: "s-1",
    name: "general",
    type: "text",
    topic: "General chatter for everything Resonate. Be kind, ship things.",
    unread: 4,
  },
  {
    id: "c-dev",
    serverId: "s-1",
    name: "dev-talk",
    type: "text",
    topic: "Engineering discussion, PRs, and architecture.",
    unread: 12,
    mentions: 2,
  },
  {
    id: "c-design",
    serverId: "s-1",
    name: "design",
    type: "text",
    topic: "Mockups, critiques, and design systems.",
  },
  {
    id: "c-memes",
    serverId: "s-1",
    name: "memes",
    type: "text",
    topic: "Keep it light. Keep it funny.",
  },
  // voice
  {
    id: "v-lobby",
    serverId: "s-1",
    name: "Lobby",
    type: "voice",
    connectedUserIds: ["u-1", "u-2", "u-8"],
  },
  {
    id: "v-standup",
    serverId: "s-1",
    name: "Daily Standup",
    type: "voice",
    connectedUserIds: ["u-5"],
  },
  {
    id: "v-focus",
    serverId: "s-1",
    name: "Focus Room",
    type: "voice",
    connectedUserIds: [],
  },
  {
    id: "v-gaming",
    serverId: "s-1",
    name: "Gaming",
    type: "voice",
    connectedUserIds: [],
  },
]

export const messages: Message[] = [
  {
    id: "m-1",
    authorId: "u-1",
    content: "morning everyone, pushed the new voice channel UI last night",
    timestamp: "9:02 AM",
    reactions: [
      { emoji: "🔥", count: 4, reacted: true },
      { emoji: "🚀", count: 2 },
    ],
  },
  {
    id: "m-2",
    authorId: "u-2",
    content: "looks slick! the avatars stacking inside the channel row is a nice touch",
    timestamp: "9:04 AM",
  },
  {
    id: "m-3",
    authorId: "u-3",
    content: "agreed. did we decide on the accent color? the red pops really well on the dark bg",
    timestamp: "9:06 AM",
    pinned: true,
  },
  {
    id: "m-4",
    authorId: "u-1",
    content: "yep, locking in #e94560 as the accent. it's our brand now",
    timestamp: "9:07 AM",
    replyToId: "m-3",
    reactions: [{ emoji: "💯", count: 3 }],
  },
  {
    id: "m-5",
    authorId: "u-5",
    content: "can someone hop into the Lobby? want to test screen share latency",
    timestamp: "9:12 AM",
  },
  {
    id: "m-6",
    authorId: "u-8",
    content: "omw",
    timestamp: "9:12 AM",
  },
  {
    id: "m-7",
    authorId: "u-2",
    content:
      "while we're here — should typing indicators show avatars or just names? I think names are cleaner for now.",
    timestamp: "9:15 AM",
    reactions: [
      { emoji: "👀", count: 1 },
      { emoji: "✅", count: 2, reacted: true },
    ],
  },
  {
    id: "m-8",
    authorId: "u-me",
    content: "names for v1, we can add avatars later. ready for Supabase + LiveKit wiring next sprint.",
    timestamp: "9:16 AM",
    edited: true,
  },
]

export function getServerChannels(serverId: string) {
  return channels.filter((c) => c.serverId === serverId)
}

export function statusColor(status: UserStatus): string {
  switch (status) {
    case "online":
      return "var(--color-online)"
    case "idle":
      return "var(--color-idle)"
    case "dnd":
      return "var(--color-dnd)"
    default:
      return "var(--color-offline)"
  }
}

export function statusLabel(status: UserStatus): string {
  switch (status) {
    case "online":
      return "Online"
    case "idle":
      return "Idle"
    case "dnd":
      return "Do Not Disturb"
    default:
      return "Offline"
  }
}

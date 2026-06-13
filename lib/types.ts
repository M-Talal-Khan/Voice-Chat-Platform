export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  status: "online" | "idle" | "dnd" | "offline"
  created_at: string
}

export interface Server {
  id: string
  name: string
  icon_url: string | null
  owner_id: string
  invite_code: string
  created_at: string
}

export interface ServerMember {
  id: string
  server_id: string
  user_id: string
  role: "owner" | "admin" | "member"
  joined_at: string
  profile?: Profile
}

export interface Channel {
  id: string
  server_id: string
  name: string
  type: "text" | "voice"
  topic: string | null
  position: number
  created_at: string
}

export interface Attachment {
  id: string
  message_id: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
}

export interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
}

export interface Message {
  id: string
  channel_id: string
  user_id: string
  content: string
  edited: boolean
  reply_to_id: string | null
  created_at: string
  profile?: Profile
  reactions?: MessageReaction[]
  attachments?: Attachment[]
  reply_to?: Message
}

export interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
  sender?: Profile
  receiver?: Profile
}

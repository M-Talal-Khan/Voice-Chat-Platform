export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  status: "online" | "offline" | "idle" | "dnd"
  created_at: string
}

export interface Server {
  id: string
  name: string
  icon_url: string | null
  owner_id: string
  invite_code: string
  category: string | null
  description: string | null
  is_public: boolean
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
  reply_to?: Message | null
  isPending?: boolean
}

export interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
}

export interface Attachment {
  id: string
  message_id: string | null
  dm_id: string | null
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  is_image: boolean
  width: number | null
  height: number | null
  expires_at: string
}

export interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
  attachments?: Attachment[]
  isPending?: boolean
}

export interface Friend {
  id: string
  sender_id: string
  receiver_id: string
  status: "pending" | "accepted" | "blocked"
  created_at: string
  profile?: Profile
}

export interface JoinRequest {
  id: string
  server_id: string
  user_id: string
  status: "pending" | "accepted" | "rejected"
  created_at: string
  profile?: Profile
}

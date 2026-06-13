import { create } from "zustand"
import type { Profile, Server, Channel, Message, ServerMember } from "@/lib/types"

interface AppState {
  // User
  currentUser: Profile | null
  setCurrentUser: (user: Profile | null) => void

  // Server
  selectedServer: Server | null
  setSelectedServer: (server: Server | null) => void
  servers: Server[]
  setServers: (servers: Server[]) => void

  // Channels
  selectedChannel: Channel | null
  setSelectedChannel: (channel: Channel | null) => void
  channels: Channel[]
  setChannels: (channels: Channel[]) => void

  // Messages
  messages: Message[]
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  deleteMessage: (id: string) => void
  addReaction: (messageId: string, reaction: { emoji: string; userId: string }) => void
  removeReaction: (messageId: string, emoji: string, userId: string) => void

  // Members
  members: ServerMember[]
  setMembers: (members: ServerMember[]) => void

  // Voice
  connectedVoiceChannelId: string | null
  setConnectedVoiceChannelId: (id: string | null) => void
  micOn: boolean
  setMicOn: (on: boolean) => void
  deafened: boolean
  setDeafened: (on: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // User
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Server
  selectedServer: null,
  setSelectedServer: (server) => set({ selectedServer: server }),
  servers: [],
  setServers: (servers) => set({ servers }),

  // Channels
  selectedChannel: null,
  setSelectedChannel: (channel) => set({ selectedChannel: channel }),
  channels: [],
  setChannels: (channels) => set({ channels }),

  // Messages
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    })),
  addReaction: (messageId, reaction) =>
    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id !== messageId) return m
        const existing = m.reactions ?? []
        return {
          ...m,
          reactions: [
            ...existing,
            { id: "", message_id: messageId, user_id: reaction.userId, emoji: reaction.emoji },
          ],
        }
      }),
    })),
  removeReaction: (messageId, emoji, userId) =>
    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id !== messageId) return m
        return {
          ...m,
          reactions: (m.reactions ?? []).filter(
            (r) => !(r.emoji === emoji && r.user_id === userId),
          ),
        }
      }),
    })),

  // Members
  members: [],
  setMembers: (members) => set({ members }),

  // Voice
  connectedVoiceChannelId: null,
  setConnectedVoiceChannelId: (id) => set({ connectedVoiceChannelId: id }),
  micOn: true,
  setMicOn: (on) => set({ micOn: on }),
  deafened: false,
  setDeafened: (on) => set({ deafened: on }),
}))

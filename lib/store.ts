import { create, StateCreator } from "zustand"
import type { Profile, Server, Channel, Message, ServerMember, DirectMessage, Friend, JoinRequest } from "@/lib/types"

interface MessagesSlice {
  messages: Message[]
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  deleteMessage: (id: string) => void
  addReaction: (messageId: string, reaction: { id?: string; emoji: string; userId: string }) => void
  removeReaction: (messageId: string, emoji: string, userId: string) => void
  removeReactionById: (reactionId: string) => void
}

const createMessagesSlice: StateCreator<AppState, [], [], MessagesSlice> = (set) => ({
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: state.messages.some((m) => m.id === message.id)
        ? state.messages.map((m) => (m.id === message.id ? { ...m, ...message } : m))
        : [...state.messages, message],
    })),
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
        if (existing.some(r => (reaction.id && r.id === reaction.id) || (r.emoji === reaction.emoji && r.user_id === reaction.userId))) {
           if (reaction.id) {
             return {
               ...m,
               reactions: existing.map(r => (r.emoji === reaction.emoji && r.user_id === reaction.userId) ? { ...r, id: reaction.id! } : r)
             }
           }
           return m
        }
        return {
          ...m,
          reactions: [
            ...existing,
            { id: reaction.id ?? "", message_id: messageId, user_id: reaction.userId, emoji: reaction.emoji },
          ],
        }
      }),
    })),
  removeReactionById: (reactionId) =>
    set((state) => ({
      messages: state.messages.map((m) => {
        if (!m.reactions?.some(r => r.id === reactionId)) return m
        return {
          ...m,
          reactions: m.reactions.filter(r => r.id !== reactionId),
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
})

interface ServersSlice {
  selectedServer: Server | null
  setSelectedServer: (server: Server | null) => void
  servers: Server[]
  setServers: (servers: Server[]) => void
  selectedChannel: Channel | null
  setSelectedChannel: (channel: Channel | null) => void
  channels: Channel[]
  setChannels: (channels: Channel[]) => void
  members: ServerMember[]
  setMembers: (members: ServerMember[]) => void
}

const createServersSlice: StateCreator<AppState, [], [], ServersSlice> = (set) => ({
  selectedServer: null,
  setSelectedServer: (server) => set({ selectedServer: server }),
  servers: [],
  setServers: (servers) => set({ servers }),
  selectedChannel: null,
  setSelectedChannel: (channel) => set({ selectedChannel: channel }),
  channels: [],
  setChannels: (channels) => set({ channels }),
  members: [],
  setMembers: (members) => set({ members }),
})

interface DMSlice {
  dmView: boolean
  setDmView: (view: boolean) => void
  selectedDmUser: Profile | null
  setSelectedDmUser: (user: Profile | null) => void
  dmMessages: DirectMessage[]
  setDmMessages: (messages: DirectMessage[]) => void
  addDmMessage: (message: DirectMessage) => void
  updateDmMessage: (id: string, updates: Partial<DirectMessage>) => void
  deleteDmMessage: (id: string) => void
}

const createDMSlice: StateCreator<AppState, [], [], DMSlice> = (set) => ({
  dmView: false,
  setDmView: (view) => set({ dmView: view }),
  selectedDmUser: null,
  setSelectedDmUser: (user) => set({ selectedDmUser: user }),
  dmMessages: [],
  setDmMessages: (messages) => set({ dmMessages: messages }),
  addDmMessage: (message) =>
    set((state) => ({
      dmMessages: state.dmMessages.some((m) => m.id === message.id)
        ? state.dmMessages.map((m) => (m.id === message.id ? { ...m, ...message } : m))
        : [...state.dmMessages, message],
    })),
  updateDmMessage: (id, updates) =>
    set((state) => ({
      dmMessages: state.dmMessages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  deleteDmMessage: (id) =>
    set((state) => ({
      dmMessages: state.dmMessages.filter((m) => m.id !== id),
    })),
})

interface VoiceSlice {
  connectedVoiceChannelId: string | null
  setConnectedVoiceChannelId: (id: string | null) => void
  micOn: boolean
  setMicOn: (on: boolean) => void
  deafened: boolean
  setDeafened: (on: boolean) => void
}

const createVoiceSlice: StateCreator<AppState, [], [], VoiceSlice> = (set) => ({
  connectedVoiceChannelId: null,
  setConnectedVoiceChannelId: (id) => set({ connectedVoiceChannelId: id }),
  micOn: true,
  setMicOn: (on) => set({ micOn: on }),
  deafened: false,
  setDeafened: (on) => set({ deafened: on }),
})

interface UserSlice {
  currentUser: Profile | null
  setCurrentUser: (user: Profile | null) => void
  friends: Friend[]
  setFriends: (friends: Friend[]) => void
  addFriend: (friend: Friend) => void
  removeFriend: (id: string) => void
  updateFriendStatus: (id: string, status: "pending" | "accepted" | "blocked") => void
  pendingRequests: Friend[]
  setPendingRequests: (requests: Friend[]) => void
  joinRequests: JoinRequest[]
  setJoinRequests: (requests: JoinRequest[]) => void
}

const createUserSlice: StateCreator<AppState, [], [], UserSlice> = (set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  friends: [],
  setFriends: (friends) => set({ friends }),
  addFriend: (friend) =>
    set((state) => {
      const exists = state.friends.find((f) => f.id === friend.id)
      if (exists) {
        return {
          friends: state.friends.map((f) => (f.id === friend.id ? { ...f, ...friend } : f)),
        }
      }
      return { friends: [...state.friends, friend] }
    }),
  removeFriend: (id) =>
    set((state) => ({ friends: state.friends.filter((f) => f.id !== id) })),
  updateFriendStatus: (id, status) =>
    set((state) => ({
      friends: state.friends.map((f) => (f.id === id ? { ...f, status } : f)),
    })),
  pendingRequests: [],
  setPendingRequests: (requests) => set({ pendingRequests: requests }),
  joinRequests: [],
  setJoinRequests: (requests) => set({ joinRequests: requests }),
})

interface UISlice {
  isConnected: boolean
  setIsConnected: (connected: boolean) => void
  storageError: boolean
  setStorageError: (error: boolean) => void
}

const createUISlice: StateCreator<AppState, [], [], UISlice> = (set) => ({
  isConnected: true,
  setIsConnected: (connected) => set({ isConnected: connected }),
  storageError: false,
  setStorageError: (error) => set({ storageError: error }),
})

type AppState = MessagesSlice & ServersSlice & DMSlice & VoiceSlice & UserSlice & UISlice

export const useAppStore = create<AppState>()((...a) => ({
  ...createMessagesSlice(...a),
  ...createServersSlice(...a),
  ...createDMSlice(...a),
  ...createVoiceSlice(...a),
  ...createUserSlice(...a),
  ...createUISlice(...a),
}))

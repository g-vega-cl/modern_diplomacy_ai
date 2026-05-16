import type { Message, ChatChannel } from './types'

const MAX_HISTORY_PER_CHANNEL = 200
const GLOBAL_CHANNEL_ID = 'global'

export class ChatManager {
  private channels = new Map<string, ChatChannel>()
  private messages = new Map<string, Message[]>()

  constructor() {
    this.channels.set(GLOBAL_CHANNEL_ID, {
      id: GLOBAL_CHANNEL_ID,
      name: 'Global Diplomacy',
      type: 'global',
      memberIds: [],
    })
    this.messages.set(GLOBAL_CHANNEL_ID, [])
  }

  createGroup(name: string, createdBy: string, memberIds: string[]): ChatChannel {
    const id = `group_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const allMembers = [...new Set([createdBy, ...memberIds])]
    const channel: ChatChannel = { id, name, type: 'group', memberIds: allMembers, createdBy }
    this.channels.set(id, channel)
    this.messages.set(id, [])
    return channel
  }

  sendMessage(channelId: string, senderId: string, senderName: string, content: string): Message {
    const channel = this.channels.get(channelId)
    if (!channel) throw new Error(`Channel not found: ${channelId}`)

    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      senderId,
      senderName,
      content,
      channelId,
      timestamp: Date.now(),
    }

    let channelMessages = this.messages.get(channelId)
    if (!channelMessages) {
      channelMessages = []
      this.messages.set(channelId, channelMessages)
    }
    channelMessages.push(message)

    if (channelMessages.length > MAX_HISTORY_PER_CHANNEL) {
      channelMessages.splice(0, channelMessages.length - MAX_HISTORY_PER_CHANNEL)
    }

    return message
  }

  inviteToGroup(channelId: string, playerIds: string[]): ChatChannel {
    const channel = this.channels.get(channelId)
    if (!channel || channel.type !== 'group') throw new Error('Group not found')

    channel.memberIds = [...new Set([...channel.memberIds, ...playerIds])]
    this.channels.set(channelId, channel)
    return channel
  }

  joinGroup(channelId: string, playerId: string): ChatChannel {
    const channel = this.channels.get(channelId)
    if (!channel) throw new Error(`Channel not found: ${channelId}`)
    if (channel.type === 'global') {
      if (!channel.memberIds.includes(playerId)) {
        channel.memberIds.push(playerId)
      }
      return channel
    }
    return this.inviteToGroup(channelId, [playerId])
  }

  leaveGroup(channelId: string, playerId: string): ChatChannel | null {
    const channel = this.channels.get(channelId)
    if (!channel || channel.type !== 'group') throw new Error('Group not found')

    channel.memberIds = channel.memberIds.filter((id) => id !== playerId)
    this.channels.set(channelId, channel)

    if (channel.memberIds.length === 0) {
      this.channels.delete(channelId)
      this.messages.delete(channelId)
      return null
    }

    return channel
  }

  getPlayerChannels(playerId: string): ChatChannel[] {
    const result: ChatChannel[] = []
    for (const channel of this.channels.values()) {
      if (channel.type === 'global' || channel.memberIds.includes(playerId)) {
        result.push(channel)
      }
    }
    return result
  }

  getChannel(channelId: string): ChatChannel | undefined {
    return this.channels.get(channelId)
  }

  getHistory(channelId: string): Message[] {
    return this.messages.get(channelId) ?? []
  }

  getMessagesSince(channelId: string, since: number): Message[] {
    const msgs = this.messages.get(channelId) ?? []
    return msgs.filter((m) => m.timestamp > since)
  }

  reset(): void {
    this.channels.clear()
    this.messages.clear()
    this.channels.set(GLOBAL_CHANNEL_ID, {
      id: GLOBAL_CHANNEL_ID,
      name: 'Global Diplomacy',
      type: 'global',
      memberIds: [],
    })
    this.messages.set(GLOBAL_CHANNEL_ID, [])
  }

  isPlayerInChannel(playerId: string, channelId: string): boolean {
    const channel = this.channels.get(channelId)
    if (!channel) return false
    if (channel.type === 'global') return true
    return channel.memberIds.includes(playerId)
  }
}

export const chatManager = new ChatManager()

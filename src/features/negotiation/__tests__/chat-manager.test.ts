import { describe, it, expect, beforeEach } from 'vitest'
import { chatManager } from '../chat-manager'

describe('ChatManager', () => {
  beforeEach(() => {
    chatManager.reset()
  })
  describe('initialization', () => {
    it('has a global channel on startup', () => {
      const channel = chatManager.getChannel('global')
      expect(channel).toBeDefined()
      expect(channel!.id).toBe('global')
      expect(channel!.name).toBe('Global Diplomacy')
      expect(channel!.type).toBe('global')
    })

    it('global channel has empty member list initially', () => {
      const channel = chatManager.getChannel('global')!
      expect(channel.memberIds).toEqual([])
    })

    it('global channel has empty history initially', () => {
      const messages = chatManager.getHistory('global')
      expect(messages).toEqual([])
    })
  })

  describe('sendMessage', () => {
    it('sends a message to a channel', () => {
      chatManager.joinGroup('global', 'france')
      const msg = chatManager.sendMessage('global', 'france', 'France', 'Hello world')
      expect(msg.senderId).toBe('france')
      expect(msg.senderName).toBe('France')
      expect(msg.content).toBe('Hello world')
      expect(msg.channelId).toBe('global')
      expect(msg.timestamp).toBeGreaterThan(0)
    })

    it('appends message to channel history', () => {
      chatManager.sendMessage('global', 'england', 'England', 'First')
      chatManager.sendMessage('global', 'england', 'England', 'Second')
      const history = chatManager.getHistory('global')
      expect(history.length).toBeGreaterThanOrEqual(2)
      expect(history[history.length - 1].content).toBe('Second')
    })

    it('throws when sending to a non-existent channel', () => {
      expect(() =>
        chatManager.sendMessage('nonexistent', 'england', 'England', 'test'),
      ).toThrow('Channel not found')
    })

    it('caps history at 200 messages and keeps the most recent', () => {
      for (let i = 0; i < 250; i++) {
        chatManager.sendMessage('global', 'england', 'England', `Message ${i}`)
      }
      const history = chatManager.getHistory('global')
      expect(history.length).toBeLessThanOrEqual(200)
      expect(history[history.length - 1].content).toBe('Message 249')
    })
  })

  describe('createGroup', () => {
    it('creates a new group chat', () => {
      const channel = chatManager.createGroup('Test Alliance', 'england', ['france', 'germany'])
      expect(channel.id).toMatch(/^group_/)
      expect(channel.name).toBe('Test Alliance')
      expect(channel.type).toBe('group')
      expect(channel.createdBy).toBe('england')
    })

    it('includes creator and all memberIds in the group', () => {
      const channel = chatManager.createGroup('Pact', 'italy', ['austria', 'turkey'])
      expect(channel.memberIds).toContain('italy')
      expect(channel.memberIds).toContain('austria')
      expect(channel.memberIds).toContain('turkey')
    })

    it('deduplicates memberIds', () => {
      const channel = chatManager.createGroup('Test', 'england', ['france', 'england', 'france'])
      const englandCount = channel.memberIds.filter((id) => id === 'england').length
      expect(englandCount).toBe(1)
    })

    it('initializes empty message history for new groups', () => {
      const channel = chatManager.createGroup('New', 'england', ['france'])
      const history = chatManager.getHistory(channel.id)
      expect(history).toEqual([])
    })

    it('generates unique group IDs', () => {
      const a = chatManager.createGroup('A', 'england', [])
      const b = chatManager.createGroup('B', 'england', [])
      expect(a.id).not.toBe(b.id)
    })
  })

  describe('inviteToGroup', () => {
    it('adds players to an existing group', () => {
      const channel = chatManager.createGroup('Alliance', 'england', ['france'])
      const updated = chatManager.inviteToGroup(channel.id, ['germany', 'italy'])
      expect(updated.memberIds).toContain('germany')
      expect(updated.memberIds).toContain('italy')
      expect(updated.memberIds).toContain('france')
    })

    it('does not duplicate existing members', () => {
      const channel = chatManager.createGroup('Alliance', 'england', ['france'])
      const updated = chatManager.inviteToGroup(channel.id, ['france'])
      expect(updated.memberIds.filter((id) => id === 'france').length).toBe(1)
    })

    it('throws when inviting to a non-existent group', () => {
      expect(() => chatManager.inviteToGroup('nonexistent', ['england'])).toThrow(
        'Group not found',
      )
    })
  })

  describe('joinGroup', () => {
    it('adds a single player to a group', () => {
      const channel = chatManager.createGroup('Secret', 'england', [])
      const updated = chatManager.joinGroup(channel.id, 'russia')
      expect(updated.memberIds).toContain('russia')
    })

    it('allows any player to join the global channel', () => {
      chatManager.joinGroup('global', 'turkey')
      const channels = chatManager.getPlayerChannels('turkey')
      expect(channels.some((c) => c.id === 'global')).toBe(true)
    })
  })

  describe('leaveGroup', () => {
    it('removes a player from a group', () => {
      const channel = chatManager.createGroup('Team', 'england', ['france', 'germany'])
      const updated = chatManager.leaveGroup(channel.id, 'france')
      expect(updated).not.toBeNull()
      expect(updated!.memberIds).not.toContain('france')
      expect(updated!.memberIds).toContain('germany')
    })

    it('deletes the group when the last member leaves', () => {
      const channel = chatManager.createGroup('Solo', 'england', [])
      const result = chatManager.leaveGroup(channel.id, 'england')
      expect(result).toBeNull()
      expect(chatManager.getChannel(channel.id)).toBeUndefined()
    })

    it('throws when leaving a non-existent group', () => {
      expect(() => chatManager.leaveGroup('nonexistent', 'england')).toThrow('Group not found')
    })
  })

  describe('getPlayerChannels', () => {
    it('returns global channel for any player', () => {
      const channels = chatManager.getPlayerChannels('russia')
      expect(channels.some((c) => c.id === 'global')).toBe(true)
    })

    it('returns a player\'s group channels', () => {
      const channel = chatManager.createGroup('My Group', 'austria', ['italy'])
      const channels = chatManager.getPlayerChannels('austria')
      expect(channels.some((c) => c.id === channel.id)).toBe(true)
    })

    it('does not return groups the player is not a member of', () => {
      const channel = chatManager.createGroup('Private', 'england', ['france'])
      const channels = chatManager.getPlayerChannels('germany')
      expect(channels.some((c) => c.id === channel.id)).toBe(false)
    })

    it('still returns global channel even if player not in memberIds', () => {
      const channels = chatManager.getPlayerChannels('unknown_player')
      expect(channels.some((c) => c.id === 'global')).toBe(true)
    })
  })

  describe('getHistory', () => {
    it('returns an empty array for a channel with no messages', () => {
      const channel = chatManager.createGroup('Empty', 'england', [])
      expect(chatManager.getHistory(channel.id)).toEqual([])
    })

    it('returns messages in chronological order', () => {
      const channel = chatManager.createGroup('Ordered', 'england', ['france'])
      chatManager.sendMessage(channel.id, 'england', 'England', 'First')
      chatManager.sendMessage(channel.id, 'france', 'France', 'Second')
      const history = chatManager.getHistory(channel.id)
      expect(history.length).toBe(2)
      expect(history[0].content).toBe('First')
      expect(history[1].content).toBe('Second')
      expect(history[0].timestamp).toBeLessThanOrEqual(history[1].timestamp)
    })
  })

  describe('getMessagesSince', () => {
    it('returns only messages after the given timestamp', async () => {
      const channel = chatManager.createGroup('Since', 'england', [])
      chatManager.sendMessage(channel.id, 'england', 'England', 'Old')
      
      const middleTimestamp = Date.now()
      // Ensure time moves forward
      await new Promise(resolve => setTimeout(resolve, 5))
      
      chatManager.sendMessage(channel.id, 'england', 'England', 'New')
      
      const messages = chatManager.getMessagesSince(channel.id, middleTimestamp)
      expect(messages.length).toBe(1)
      expect(messages[0].content).toBe('New')
    })

    it('returns empty array if no messages since timestamp', () => {
      const channel = chatManager.createGroup('SinceEmpty', 'england', [])
      chatManager.sendMessage(channel.id, 'england', 'England', 'Past')
      const messages = chatManager.getMessagesSince(channel.id, Date.now())
      expect(messages).toEqual([])
    })

    it('returns empty array for non-existent channel', () => {
      const messages = chatManager.getMessagesSince('nonexistent', 0)
      expect(messages).toEqual([])
    })
  })

  describe('isPlayerInChannel', () => {
    it('returns true for any player in the global channel', () => {
      expect(chatManager.isPlayerInChannel('anyone', 'global')).toBe(true)
    })

    it('returns true for a member of a group channel', () => {
      const channel = chatManager.createGroup('Test', 'england', ['france'])
      expect(chatManager.isPlayerInChannel('france', channel.id)).toBe(true)
    })

    it('returns false for a non-member of a group channel', () => {
      const channel = chatManager.createGroup('Test', 'england', ['france'])
      expect(chatManager.isPlayerInChannel('germany', channel.id)).toBe(false)
    })

    it('returns false for a non-existent channel', () => {
      expect(chatManager.isPlayerInChannel('england', 'nonexistent')).toBe(false)
    })
  })

  describe('message properties', () => {
    it('generates unique message IDs', () => {
      chatManager.joinGroup('global', 'england')
      const a = chatManager.sendMessage('global', 'england', 'England', 'A')
      const b = chatManager.sendMessage('global', 'england', 'England', 'B')
      expect(a.id).not.toBe(b.id)
    })

    it('includes a timestamp', () => {
      chatManager.joinGroup('global', 'france')
      const before = Date.now()
      const msg = chatManager.sendMessage('global', 'france', 'France', 'Hi')
      const after = Date.now()
      expect(msg.timestamp).toBeGreaterThanOrEqual(before)
      expect(msg.timestamp).toBeLessThanOrEqual(after)
    })
  })
})

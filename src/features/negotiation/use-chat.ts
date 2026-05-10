import { useState, useEffect, useRef, useCallback } from 'react'
import type { Message, ChatChannel } from './types'

const POLL_MS = 2000
const CHANNEL_POLL_MS = 5000

export function useChat(playerId: string, playerName: string) {
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [messagesByChannel, setMessagesByChannel] = useState<Map<string, Message[]>>(new Map())
  const [activeChannelId, setActiveChannelId] = useState('global')
  const [connected, setConnected] = useState(false)

  const lastTsRef = useRef<Map<string, number>>(new Map())
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const channelPollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const fetchJSON = useCallback(async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }, [])

  const fetchMessages = useCallback(async (channelId: string, sinceOnly: boolean) => {
    const lastTs = lastTsRef.current.get(channelId) ?? 0
    const url = sinceOnly && lastTs > 0
      ? `/api/chat/channels/${channelId}/messages?since=${lastTs}`
      : `/api/chat/channels/${channelId}/messages`

    try {
      const data: Message[] = await fetchJSON(url)
      if (data.length > 0) {
        lastTsRef.current.set(channelId, data[data.length - 1].timestamp)
        setMessagesByChannel((prev) => {
          const next = new Map(prev)
          const existing = sinceOnly ? (next.get(channelId) ?? []) : []
          next.set(channelId, [...existing, ...data])
          return next
        })
      }
      setConnected(true)
    } catch {
      setConnected(false)
    }
  }, [fetchJSON])

  const fetchChannels = useCallback(async () => {
    try {
      const data: ChatChannel[] = await fetchJSON(`/api/chat/channels?playerId=${playerId}`)
      setChannels(data)
    } catch {
      // will retry on next poll
    }
  }, [playerId, fetchJSON])

  useEffect(() => {
    fetchChannels()
    fetchMessages('global', false)

    pollRef.current = setInterval(() => {
      fetchMessages(activeChannelId, true)
    }, POLL_MS)

    channelPollRef.current = setInterval(fetchChannels, CHANNEL_POLL_MS)

    return () => {
      clearInterval(pollRef.current)
      clearInterval(channelPollRef.current)
    }
  }, [])

  useEffect(() => {
    if (!messagesByChannel.has(activeChannelId)) {
      fetchMessages(activeChannelId, false)
    }
  }, [activeChannelId])

  const sendMessage = useCallback(async (channelId: string, content: string) => {
    if (!content.trim()) return
    await fetchJSON(`/api/chat/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: playerId, senderName: playerName, content }),
    })
    await fetchMessages(channelId, false)
  }, [playerId, playerName, fetchJSON, fetchMessages])

  const createGroup = useCallback(async (name: string, memberIds: string[]) => {
    const channel: ChatChannel = await fetchJSON('/api/chat/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, createdBy: playerId, memberIds }),
    })
    setChannels((prev) => [...prev, channel])
  }, [playerId, fetchJSON])

  const inviteToGroup = useCallback(async (channelId: string, playerIds: string[]) => {
    await fetchJSON(`/api/chat/channels/${channelId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitedBy: playerId, playerIds }),
    })
    await fetchChannels()
  }, [playerId, fetchJSON, fetchChannels])

  const joinGroup = useCallback(async (channelId: string) => {
    await fetchJSON(`/api/chat/channels/${channelId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    })
    await fetchChannels()
  }, [playerId, fetchJSON, fetchChannels])

  const leaveGroup = useCallback(async (channelId: string) => {
    await fetchJSON(`/api/chat/channels/${channelId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    })
    setChannels((prev) => prev.filter((c) => c.id !== channelId))
    if (activeChannelId === channelId) {
      setActiveChannelId('global')
    }
  }, [playerId, activeChannelId, fetchJSON])

  const activeMessages = messagesByChannel.get(activeChannelId) ?? []

  return {
    channels,
    messagesByChannel,
    activeChannelId,
    activeMessages,
    connected,
    setActiveChannelId,
    sendMessage,
    createGroup,
    inviteToGroup,
    joinGroup,
    leaveGroup,
  }
}

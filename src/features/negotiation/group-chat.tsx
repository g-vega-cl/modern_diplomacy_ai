import { useState, useRef, useEffect } from 'react'
import type { Message, ChatChannel } from './types'

interface GroupChatProps {
  channel: ChatChannel
  messages: Message[]
  playerName: string
  playerId: string
  allPlayerIds: { id: string; name: string }[]
  onSend: (content: string) => void
  onInvite: (playerIds: string[]) => void
  onLeave: () => void
}

export function GroupChat({
  channel,
  messages,
  playerName,
  playerId,
  allPlayerIds,
  onSend,
  onInvite,
  onLeave,
}: GroupChatProps) {
  const [input, setInput] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [selectedInvite, setSelectedInvite] = useState<Set<string>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  function handleInvite() {
    if (selectedInvite.size === 0) return
    onInvite([...selectedInvite])
    setSelectedInvite(new Set())
    setShowInvite(false)
  }

  const nonMembers = allPlayerIds.filter(
    (p) => !channel.memberIds.includes(p.id) && p.id !== playerId,
  )

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-zinc-700 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">{channel.name}</h2>
          <p className="text-xs text-zinc-500">
            {channel.memberIds.map((id) => allPlayerIds.find((p) => p.id === id)?.name ?? id).join(', ')}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="px-2 py-1 text-xs rounded bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
          >
            + Invite
          </button>
          <button
            onClick={onLeave}
            className="px-2 py-1 text-xs rounded bg-red-900/50 text-red-300 hover:bg-red-800/50"
          >
            Leave
          </button>
        </div>
      </div>

      {showInvite && nonMembers.length > 0 && (
        <div className="px-4 py-2 bg-zinc-800 border-b border-zinc-700">
          <div className="flex flex-wrap gap-1 mb-2">
            {nonMembers.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedInvite((prev) => {
                    const next = new Set(prev)
                    if (next.has(p.id)) next.delete(p.id)
                    else next.add(p.id)
                    return next
                  })
                }}
                className={`px-2 py-0.5 rounded text-xs capitalize ${
                  selectedInvite.has(p.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <button
            onClick={handleInvite}
            disabled={selectedInvite.size === 0}
            className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
          >
            Send Invites
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-zinc-500 text-sm italic text-center mt-8">
            No messages yet. Start negotiating.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.senderId === playerId ? 'items-end' : 'items-start'}`}
          >
            <span className="text-xs text-zinc-500 mb-0.5 capitalize">{msg.senderName}</span>
            <div
              className={`px-3 py-1.5 rounded-lg max-w-[75%] text-sm ${
                msg.senderId === playerId
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 text-zinc-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-zinc-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 rounded bg-zinc-700 text-white border border-zinc-600 focus:outline-none focus:border-blue-500 text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 text-sm"
        >
          Send
        </button>
      </form>
    </div>
  )
}

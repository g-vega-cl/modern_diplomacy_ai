import { useState, useRef, useEffect } from 'react'
import type { Message } from './types'

interface GlobalChatProps {
  messages: Message[]
  playerName: string
  onSend: (content: string) => void
}

export function GlobalChat({ messages, playerName, onSend }: GlobalChatProps) {
  const [input, setInput] = useState('')
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

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-zinc-700">
        <h2 className="text-white font-semibold">Global Diplomacy</h2>
        <p className="text-xs text-zinc-500">All players can see these messages</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-zinc-500 text-sm italic text-center mt-8">
            No messages yet. Start the negotiations.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.senderName === playerName ? 'items-end' : 'items-start'}`}
          >
            <span className="text-xs text-zinc-500 mb-0.5 capitalize">{msg.senderName}</span>
            <div
              className={`px-3 py-1.5 rounded-lg max-w-[75%] text-sm ${
                msg.senderName === playerName
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

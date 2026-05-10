import { useState } from 'react'
import { ChatPanel } from './chat-panel'

const PLAYERS = [
  { id: 'england', name: 'England' },
  { id: 'france', name: 'France' },
  { id: 'germany', name: 'Germany' },
  { id: 'italy', name: 'Italy' },
  { id: 'austria', name: 'Austria' },
  { id: 'russia', name: 'Russia' },
  { id: 'turkey', name: 'Turkey' },
]

export function NegotiationPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string } | null>(null)

  if (!selectedPlayer) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-zinc-900 flex items-center justify-center">
        <div className="bg-zinc-800 rounded-lg p-8 w-96">
          <h1 className="text-xl font-semibold text-white mb-2">Diplomacy Negotiations</h1>
          <p className="text-sm text-zinc-400 mb-6">
            Select your nation to enter the negotiation chamber.
          </p>

          <div className="space-y-2">
            {PLAYERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlayer(p)}
                className="w-full px-4 py-3 rounded bg-zinc-700 text-white hover:bg-zinc-600 text-left capitalize transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return <ChatPanel playerId={selectedPlayer.id} playerName={selectedPlayer.name} />
}

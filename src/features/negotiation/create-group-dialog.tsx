import { useState } from 'react'
import type { ChatChannel } from './types'

const DIPLOMACY_PLAYERS = [
  { id: 'england', name: 'England' },
  { id: 'france', name: 'France' },
  { id: 'germany', name: 'Germany' },
  { id: 'italy', name: 'Italy' },
  { id: 'austria', name: 'Austria' },
  { id: 'russia', name: 'Russia' },
  { id: 'turkey', name: 'Turkey' },
]

interface CreateGroupDialogProps {
  open: boolean
  channels: ChatChannel[]
  playerId: string
  onCreate: (name: string, memberIds: string[]) => void
  onClose: () => void
}

export function CreateGroupDialog({ open, playerId, onCreate, onClose }: CreateGroupDialogProps) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  if (!open) return null

  const available = DIPLOMACY_PLAYERS.filter((p) => p.id !== playerId)

  function togglePlayer(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleCreate() {
    if (!name.trim() || selected.size === 0) return
    onCreate(name.trim(), [...selected])
    setName('')
    setSelected(new Set())
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-white mb-4">Create Negotiation Group</h2>

        <label className="block text-sm text-zinc-400 mb-1">Group Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Franco-German Alliance"
          className="w-full px-3 py-2 rounded bg-zinc-700 text-white border border-zinc-600 mb-4 focus:outline-none focus:border-blue-500"
          autoFocus
        />

        <label className="block text-sm text-zinc-400 mb-2">Select Players</label>
        <div className="space-y-1 mb-4">
          {available.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 px-3 py-2 rounded hover:bg-zinc-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => togglePlayer(p.id)}
                className="rounded"
              />
              <span className="text-white capitalize">{p.name}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || selected.size === 0}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

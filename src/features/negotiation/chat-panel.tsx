import { useState } from 'react'
import type { ChatChannel } from './types'
import { useChat } from './use-chat'
import { GlobalChat } from './global-chat'
import { GroupChat } from './group-chat'
import { CreateGroupDialog } from './create-group-dialog'

interface ChatPanelProps {
  playerId: string
  playerName: string
}

const DIPLOMACY_PLAYERS = [
  { id: 'england', name: 'England' },
  { id: 'france', name: 'France' },
  { id: 'germany', name: 'Germany' },
  { id: 'italy', name: 'Italy' },
  { id: 'austria', name: 'Austria' },
  { id: 'russia', name: 'Russia' },
  { id: 'turkey', name: 'Turkey' },
]

export function ChatPanel({ playerId, playerName }: ChatPanelProps) {
  const {
    channels,
    activeChannelId,
    activeMessages,
    connected,
    setActiveChannelId,
    sendMessage,
    createGroup,
    inviteToGroup,
    leaveGroup,
  } = useChat(playerId, playerName)

  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const activeChannel = channels.find((c) => c.id === activeChannelId)

  const globalChannel = channels.find((c) => c.id === 'global')
  const groupChannels = channels.filter((c) => c.type === 'group')

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-900">
      <div className="w-64 border-r border-zinc-700 flex flex-col">
        <div className="px-4 py-3 border-b border-zinc-700 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Channels</span>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-2 py-0.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-500"
          >
            + New
          </button>
        </div>

        <div className="px-2 py-2 border-b border-zinc-700">
          <span className="px-2 text-xs text-zinc-500 uppercase tracking-wider">Global</span>
        </div>

        {globalChannel && (
          <button
            onClick={() => setActiveChannelId('global')}
            className={`w-full text-left px-4 py-2 text-sm ${
              activeChannelId === 'global'
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <span className="truncate block">
              {globalChannel.name}
            </span>
          </button>
        )}

        {groupChannels.length > 0 && (
          <div className="px-2 py-2 border-b border-zinc-700">
            <span className="px-2 text-xs text-zinc-500 uppercase tracking-wider">Groups</span>
          </div>
        )}

        {groupChannels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setActiveChannelId(ch.id)}
            className={`w-full text-left px-4 py-2 text-sm ${
              activeChannelId === ch.id
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <span className="truncate block">{ch.name}</span>
            <span className="text-xs text-zinc-500">
              {ch.memberIds.length} members
            </span>
          </button>
        ))}

        <div className="mt-auto px-4 py-2 border-t border-zinc-700">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-xs text-zinc-400">
              {connected ? 'Connected' : 'Reconnecting...'}
            </span>
          </div>
          <span className="text-xs text-zinc-500 capitalize">Playing as {playerName}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-zinc-900">
        {!activeChannel && (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            Select a channel to start negotiating
          </div>
        )}

        {activeChannel?.type === 'global' && (
          <GlobalChat
            messages={activeMessages}
            playerName={playerName}
            onSend={(content) => sendMessage('global', content)}
          />
        )}

        {activeChannel?.type === 'group' && (
          <GroupChat
            channel={activeChannel}
            messages={activeMessages}
            playerName={playerName}
            playerId={playerId}
            allPlayerIds={DIPLOMACY_PLAYERS}
            onSend={(content) => sendMessage(activeChannel.id, content)}
            onInvite={(playerIds) => inviteToGroup(activeChannel.id, playerIds)}
            onLeave={() => leaveGroup(activeChannel.id)}
          />
        )}
      </div>

      <CreateGroupDialog
        open={showCreateDialog}
        channels={channels}
        playerId={playerId}
        onCreate={createGroup}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  )
}

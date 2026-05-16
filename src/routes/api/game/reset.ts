import { createFileRoute } from '@tanstack/react-router'
import { gameManager } from '~/features/game/game-manager'
import { chatManager } from '~/features/negotiation/chat-manager'

export const Route = createFileRoute('/api/game/reset')({
  server: {
    handlers: {
      POST: async () => {
        gameManager.reset()
        chatManager.reset()
        return Response.json({ success: true })
      },
    },
  },
})

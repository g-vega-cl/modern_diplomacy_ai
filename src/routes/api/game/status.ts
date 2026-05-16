import { createFileRoute } from '@tanstack/react-router'
import { gameManager } from '~/features/game/game-manager'

export const Route = createFileRoute('/api/game/status')({
  server: {
    handlers: {
      GET: async () => {
        const status = gameManager.getGameStatus()
        return Response.json(status)
      },
    },
  },
})

import { createFileRoute } from '@tanstack/react-router'
import { gameManager } from '~/features/game/game-manager'

export const Route = createFileRoute('/api/game/player/$playerId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { playerId } = params
        if (!playerId) {
          return Response.json({ error: 'playerId is required' }, { status: 400 })
        }
        const view = gameManager.getPlayerView(playerId)
        return Response.json(view)
      },
    },
  },
})

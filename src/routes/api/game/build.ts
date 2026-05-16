import { createFileRoute } from '@tanstack/react-router'
import { gameManager } from '~/features/game/game-manager'

export const Route = createFileRoute('/api/game/build')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        const { playerId, builds } = body

        if (!playerId || !builds) {
          return new Response('playerId and builds are required', { status: 400 })
        }

        gameManager.submitBuild(playerId, builds)
        return Response.json({ success: true })
      },
    },
  },
})

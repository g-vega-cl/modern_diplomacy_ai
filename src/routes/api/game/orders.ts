import { createFileRoute } from '@tanstack/react-router'
import { gameManager } from '~/features/game/game-manager'

export const Route = createFileRoute('/api/game/orders')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        const { playerId, orders } = body

        if (!playerId || !orders) {
          return new Response('playerId and orders are required', { status: 400 })
        }

        gameManager.submitOrders(playerId, orders)
        return Response.json({ success: true })
      },
    },
  },
})

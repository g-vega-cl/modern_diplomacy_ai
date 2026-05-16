import { createFileRoute } from '@tanstack/react-router'
import { gameManager } from '~/features/game/game-manager'

export const Route = createFileRoute('/api/game/retreat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        const { unitId, locationId, disband } = body

        if (!unitId) {
          return new Response('unitId is required', { status: 400 })
        }

        if (disband) {
          gameManager.submitRetreat(unitId, '')
          return Response.json({ success: true, action: 'disbanded' })
        }

        if (!locationId) {
          return new Response('locationId or disband is required', { status: 400 })
        }

        gameManager.submitRetreat(unitId, locationId)
        return Response.json({ success: true, action: 'retreated', locationId })
      },
    },
  },
})

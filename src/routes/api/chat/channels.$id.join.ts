import { createFileRoute } from '@tanstack/react-router'
import { chatManager } from '~/features/negotiation/chat-manager'

export const Route = createFileRoute('/api/chat/channels/$id/join')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { id } = params
        const body = await request.json()
        const { playerId } = body

        if (!playerId) {
          return new Response('playerId is required', { status: 400 })
        }

        const channel = chatManager.joinGroup(id, playerId)
        return Response.json(channel)
      },
    },
  },
})

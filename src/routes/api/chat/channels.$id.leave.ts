import { createFileRoute } from '@tanstack/react-router'
import { chatManager } from '~/features/negotiation/chat-manager'

export const Route = createFileRoute('/api/chat/channels/$id/leave')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { id } = params
        const body = await request.json()
        const { playerId } = body

        if (!playerId) {
          return new Response('playerId is required', { status: 400 })
        }

        const channel = chatManager.leaveGroup(id, playerId)
        return Response.json({ ok: true, removed: channel === null })
      },
    },
  },
})

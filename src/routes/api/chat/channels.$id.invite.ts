import { createFileRoute } from '@tanstack/react-router'
import { chatManager } from '~/features/negotiation/chat-manager'

export const Route = createFileRoute('/api/chat/channels/$id/invite')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { id } = params
        const body = await request.json()
        const { invitedBy, playerIds } = body

        if (!invitedBy || !Array.isArray(playerIds)) {
          return new Response('invitedBy and playerIds are required', { status: 400 })
        }

        const channel = chatManager.getChannel(id)
        if (!channel) {
          return new Response('Channel not found', { status: 404 })
        }
        if (channel.type !== 'group') {
          return new Response('Can only invite to group channels', { status: 400 })
        }

        const updatedChannel = chatManager.inviteToGroup(id, playerIds)
        return Response.json(updatedChannel)
      },
    },
  },
})

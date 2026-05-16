import { createFileRoute } from '@tanstack/react-router'
import { chatManager } from '~/features/negotiation/chat-manager'

export const Route = createFileRoute('/api/chat/channels/$id/messages')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { id } = params
        const url = new URL(request.url)
        const since = url.searchParams.get('since')

        if (since) {
          const ts = Number(since)
          if (Number.isNaN(ts)) {
            return new Response('since must be a number', { status: 400 })
          }
          const messages = chatManager.getMessagesSince(id, ts)
          return Response.json(messages)
        }

        const history = chatManager.getHistory(id)
        return Response.json(history)
      },
      POST: async ({ request, params }) => {
        const { id } = params
        const body = await request.json()
        const { senderId, senderName, content } = body

        if (!senderId || !senderName || !content) {
          return new Response('senderId, senderName, and content are required', { status: 400 })
        }

        const message = chatManager.sendMessage(id, senderId, senderName, content)
        return Response.json(message)
      },
    },
  },
})

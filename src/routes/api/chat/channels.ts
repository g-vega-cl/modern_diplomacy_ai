import { createFileRoute } from '@tanstack/react-router'
import { getQuery } from '@tanstack/react-start/server'
import { chatManager } from '~/features/negotiation/chat-manager'

export const Route = createFileRoute('/api/chat/channels')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const playerId = url.searchParams.get('playerId')
        
        if (!playerId) {
          return new Response('playerId is required', { status: 400 })
        }
        
        const channels = chatManager.getPlayerChannels(playerId)
        return Response.json(channels)
      },
      POST: async ({ request }) => {
        const body = await request.json()
        const { name, createdBy, memberIds } = body
        
        if (!name || !createdBy || !memberIds) {
          return new Response('Missing required fields', { status: 400 })
        }
        
        const channel = chatManager.createGroup(name, createdBy, memberIds)
        return Response.json(channel)
      }
    }
  }
})

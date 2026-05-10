import { defineEventHandler, readBody, createError } from 'h3'
import { chatManager } from '~/features/negotiation/chat-manager'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, message: 'channel id is required' })

  const body = await readBody<{ senderId: string; senderName: string; content: string }>(event)
  if (!body || !body.senderId || !body.senderName || !body.content) {
    throw createError({ statusCode: 400, message: 'senderId, senderName, and content are required' })
  }

  return chatManager.sendMessage(id, body.senderId, body.senderName, body.content)
})

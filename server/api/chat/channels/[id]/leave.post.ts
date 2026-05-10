import { defineEventHandler, readBody, createError } from 'h3'
import { chatManager } from '~/features/negotiation/chat-manager'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, message: 'channel id is required' })

  const body = await readBody<{ playerId: string }>(event)
  if (!body || !body.playerId) throw createError({ statusCode: 400, message: 'playerId is required' })

  const channel = chatManager.leaveGroup(id, body.playerId)
  return { ok: true, removed: channel === null }
})

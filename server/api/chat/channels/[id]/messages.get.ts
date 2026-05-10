import { defineEventHandler, getQuery, createError } from 'h3'
import { chatManager } from '~/features/negotiation/chat-manager'

export default defineEventHandler((event) => {
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, message: 'channel id is required' })

  const { since } = getQuery(event)

  if (since && typeof since === 'string') {
    const ts = Number(since)
    if (Number.isNaN(ts)) throw createError({ statusCode: 400, message: 'since must be a number' })
    return chatManager.getMessagesSince(id, ts)
  }

  return chatManager.getHistory(id)
})

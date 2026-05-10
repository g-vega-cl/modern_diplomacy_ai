import { defineEventHandler, getQuery, createError } from 'h3'
import { chatManager } from '~/features/negotiation/chat-manager'

export default defineEventHandler((event) => {
  const { playerId } = getQuery(event)
  if (!playerId || typeof playerId !== 'string') {
    throw createError({ statusCode: 400, message: 'playerId is required' })
  }
  return chatManager.getPlayerChannels(playerId)
})

import { defineEventHandler, readBody, createError } from 'h3'
import { chatManager } from '~/features/negotiation/chat-manager'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string; createdBy: string; memberIds: string[] }>(event)
  if (!body || !body.name || !body.createdBy || !Array.isArray(body.memberIds)) {
    throw createError({ statusCode: 400, message: 'name, createdBy, and memberIds are required' })
  }
  return chatManager.createGroup(body.name, body.createdBy, body.memberIds)
})

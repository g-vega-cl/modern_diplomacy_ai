import { defineEventHandler, readBody, createError } from 'h3'
import { chatManager } from '~/features/negotiation/chat-manager'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, message: 'channel id is required' })

  const body = await readBody<{ invitedBy: string; playerIds: string[] }>(event)
  if (!body || !body.invitedBy || !Array.isArray(body.playerIds)) {
    throw createError({ statusCode: 400, message: 'invitedBy and playerIds are required' })
  }

  const channel = chatManager.getChannel(id)
  if (!channel) throw createError({ statusCode: 404, message: 'Channel not found' })
  if (channel.type !== 'group') throw createError({ statusCode: 400, message: 'Can only invite to group channels' })

  return chatManager.inviteToGroup(id, body.playerIds)
})

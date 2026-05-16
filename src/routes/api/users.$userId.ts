import { createFileRoute } from '@tanstack/react-router'
import { fetchUserById } from '~/features/users/server/user-service'

export const Route = createFileRoute('/api/users/$userId')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        console.info(`Fetching users by id=${params.userId}... @`, request.url)
        try {
          const user = await fetchUserById(params.userId)
          return Response.json(user)
        } catch (e) {
          console.error(e)
          return Response.json({ error: 'User not found' }, { status: 404 })
        }
      },
    },
  },
})

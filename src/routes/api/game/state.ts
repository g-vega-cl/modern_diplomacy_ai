import { createFileRoute } from '@tanstack/react-router'
import { gameManager } from '~/features/game/game-manager'

export const Route = createFileRoute('/api/game/state')({
  server: {
    handlers: {
      GET: async () => {
        const state = gameManager.getState()

        const players: Record<string, any> = {}
        for (const [id, p] of state.players) {
          players[id] = {
            id: p.id,
            name: p.name,
            supplyCenterCount: p.supplyCenterCount,
            unitCount: p.units.size,
            eliminated: p.eliminated,
          }
        }

        const units: Record<string, any> = {}
        for (const [id, u] of state.units) {
          units[id] = {
            id: u.id,
            type: u.type,
            ownerId: u.ownerId,
            locationId: u.locationId,
            mustRetreat: u.mustRetreat,
          }
        }

        return Response.json({
          year: state.year,
          season: state.season,
          phase: state.phase,
          players,
          units,
          retreatsNeeded: state.retreatsNeeded,
        })
      },
    },
  },
})

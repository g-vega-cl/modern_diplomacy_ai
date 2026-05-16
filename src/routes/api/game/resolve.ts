import { createFileRoute } from '@tanstack/react-router'
import { gameManager } from '~/features/game/game-manager'

export const Route = createFileRoute('/api/game/resolve')({
  server: {
    handlers: {
      POST: async () => {
        const { result, winner, nextPhase } = gameManager.resolvePhase()
        return Response.json({
          successfulMoves: result.successfulMoves,
          bouncedMoves: result.bouncedMoves,
          dislodgedUnits: result.dislodgedUnits,
          destroyedUnits: result.destroyedUnits,
          combatLog: result.combatLog,
          winner: winner ? { id: winner.id, name: winner.name } : null,
          nextPhase,
        })
      },
    },
  },
})

import type { Clock, World } from '../../ports/world.ts'
import {
  memoryAssessments,
  memoryDeployments,
  memoryLeasingRequests,
  memoryMachines,
  memoryMachineryNeeds,
  memoryOperations,
} from './repositories.ts'

/**
 * Reloj fijo.
 *
 * La transcripción de la corrida se versiona como evidencia (Principio V). Un reloj real haría que
 * cada corrida produjera un diff distinto sin que nada hubiera cambiado, y una evidencia que
 * cambia sola no es evidencia. La fecha es la de ratificación de la constitución.
 */
export function fixedClock(iso = '2026-08-19T00:00:00.000Z'): Clock {
  const instant = new Date(iso)
  return { now: () => instant }
}

export function memoryWorld(): World {
  return {
    clock: fixedClock(),
    needs: memoryMachineryNeeds(),
    requests: memoryLeasingRequests(),
    assessments: memoryAssessments(),
    operations: memoryOperations(),
    machines: memoryMachines(),
    deployments: memoryDeployments(),
  }
}

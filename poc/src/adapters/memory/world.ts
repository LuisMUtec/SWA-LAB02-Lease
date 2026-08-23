import type { CertificationMilestone } from '../../domain/underwriting.ts'
import type { Clock, Ids, Milestones, World } from '../../ports/world.ts'
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
 * La transcripción del hilo se versiona como evidencia (Principio V). Un reloj real haría que cada
 * corrida produjera un diff distinto sin que nada hubiera cambiado, y una evidencia que cambia
 * sola no es evidencia. La fecha es la de ratificación de la constitución.
 */
export function fixedClock(iso = '2026-08-19T00:00:00.000Z'): Clock {
  const instant = new Date(iso)
  return { now: () => instant }
}

export function memoryIds(start = 0): Ids {
  let counter = start
  return { next: (prefix) => `${prefix}-${String(++counter).padStart(4, '0')}` }
}

export function memoryMilestones(initial: readonly CertificationMilestone[] = []): Milestones {
  let rows = [...initial]
  return {
    all: () => rows,
    replace: (milestones) => void (rows = [...milestones]),
    byName: (name) => rows.find((m) => m.name === name),
  }
}

export function memoryWorld(): World {
  return {
    clock: fixedClock(),
    ids: memoryIds(),
    milestones: memoryMilestones(),
    needs: memoryMachineryNeeds(),
    requests: memoryLeasingRequests(),
    assessments: memoryAssessments(),
    operations: memoryOperations(),
    machines: memoryMachines(),
    deployments: memoryDeployments(),
    commit: () => {},
  }
}

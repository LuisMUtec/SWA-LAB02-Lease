import type {
  Assessments,
  Deployments,
  LeasingRequests,
  Machines,
  MachineryNeeds,
  Operations,
} from './repositories.ts'

/**
 * Las costuras del POC.
 *
 * El núcleo de dominio no conoce Postgres ni Next.js. `World` es lo que el hilo lleva de un paso
 * al siguiente; los adaptadores lo construyen. Hoy solo existe el adaptador en memoria; el de Neon
 * entra detrás de las mismas interfaces sin tocar el dominio ni el hilo.
 */

export interface Clock {
  now(): Date
}

export interface World {
  readonly clock: Clock
  readonly needs: MachineryNeeds
  readonly requests: LeasingRequests
  readonly assessments: Assessments
  readonly operations: Operations
  readonly machines: Machines
  readonly deployments: Deployments
}

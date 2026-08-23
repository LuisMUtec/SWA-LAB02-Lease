import type { CertificationMilestone } from '../domain/underwriting.ts'
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
 * El núcleo de dominio no conoce SQLite, ni MCP, ni el SDK. `World` es lo que un caso de uso
 * necesita del mundo; los adaptadores lo construyen. El adaptador en memoria sirve al hilo
 * determinista; el de SQLite sirve a los tres servidores MCP, que son procesos distintos y
 * necesitan compartir estado.
 */

export interface Clock {
  now(): Date
}

/**
 * Los hitos de certificación del proyecto.
 *
 * Viven fuera de los repositorios porque los cruzan: `002` los crea al registrar el proyecto,
 * `002` los certifica cuando la obra avanza, y `001` los consulta para saber si una cuota es
 * exigible (BR-04). Con tres procesos, tienen que ser estado compartido.
 */
export interface Milestones {
  all(): readonly CertificationMilestone[]
  replace(milestones: readonly CertificationMilestone[]): void
  byName(name: string): CertificationMilestone | undefined
}

export interface Ids {
  next(prefix: string): string
}

export interface World {
  readonly clock: Clock
  readonly ids: Ids
  readonly milestones: Milestones
  readonly needs: MachineryNeeds
  readonly requests: LeasingRequests
  readonly assessments: Assessments
  readonly operations: Operations
  readonly machines: Machines
  readonly deployments: Deployments
  /** Persiste lo hecho. No-op en memoria; escribe el snapshot en SQLite. */
  commit(): void
}

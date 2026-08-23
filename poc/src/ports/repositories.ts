import type {
  LeasingRequest,
  LeasingRequestId,
  MachineryNeed,
  MachineryNeedId,
} from '../domain/leasing.ts'
import type { Assessment, AssessmentId } from '../domain/underwriting.ts'
import type { LeasingOperation, OperationId } from '../domain/operation.ts'
import type { Deployment, DeploymentId, Machine, MachineId } from '../domain/fleet.ts'

/**
 * Persistencia como interfaz.
 *
 * El adaptador en memoria la satisface hoy; el de Neon la satisface después. Ni el dominio ni el
 * hilo cambian cuando entre el segundo — que es la razón de que la costura exista.
 */

export interface MachineryNeeds {
  save(need: MachineryNeed): void
  byId(id: MachineryNeedId): MachineryNeed | undefined
}

export interface LeasingRequests {
  save(request: LeasingRequest): void
  byId(id: LeasingRequestId): LeasingRequest | undefined
  /** Las que esperan una decisión — la bandeja de Carlos, `002` paso 2. */
  awaitingDecision(): readonly LeasingRequest[]
}

export interface Assessments {
  save(assessment: Assessment): void
  byId(id: AssessmentId): Assessment | undefined
  byRequest(id: LeasingRequestId): Assessment | undefined
}

export interface Operations {
  save(operation: LeasingOperation): void
  byId(id: OperationId): LeasingOperation | undefined
  byRequest(id: LeasingRequestId): LeasingOperation | undefined
}

export interface Machines {
  save(machine: Machine): void
  byId(id: MachineId): Machine | undefined
}

export interface Deployments {
  save(deployment: Deployment): void
  byId(id: DeploymentId): Deployment | undefined
  /**
   * El despliegue de una operación.
   *
   * Lo necesita el custodio, que llega por el lado de su operación y no conoce identificadores de
   * flota — `003` FR-010b le debe el estado de servicio de *su* máquina.
   */
  byOperation(id: OperationId): Deployment | undefined
  /** Los despliegues abiertos — lo que Julia tiene a cargo ahora mismo. */
  open(): readonly Deployment[]
}

/**
 * La operación de leasing — `001-company-machinery-leasing`.
 *
 * El hilo que Pedro recorre: recibida la máquina, pagadas las cuotas, ejercida la opción.
 */

import { RuleViolation, SpecViolation } from './rules.ts'
import type { LeasingRequestId } from './leasing.ts'
import type { CertificationMilestone, Instalment, MilestoneId } from './underwriting.ts'

export type OperationId = string & { readonly __brand: 'OperationId' }

export type AcquisitionOptionStatus = 'not yet available' | 'available'
export type OperationState = 'in progress' | 'completed'

export interface LeasingOperation {
  readonly id: OperationId
  readonly requestId: LeasingRequestId
  readonly instalments: readonly Instalment[]
  /** Ausente mientras Pedro no haya confirmado que recibió la máquina. */
  receiptConfirmedAt?: Date
  acquisitionExercisedAt?: Date
}

export function confirmReceipt(operation: LeasingOperation, at: Date): void {
  if (operation.receiptConfirmedAt) {
    throw new SpecViolation('la recepción ya estaba confirmada')
  }
  operation.receiptConfirmedAt = at
}

/**
 * Paga una cuota.
 *
 * Dos reglas la gobiernan, y ninguna es una fecha:
 *
 *   BR-08 — nada es exigible antes de que el cliente confirme que recibió la máquina. Se paga por
 *           el uso, y antes de la entrega no hay uso.
 *   BR-04 — la cuota vence contra la certificación de su hito, no contra el calendario. Cobrar
 *           antes de que el hito se certifique recrea exactamente el faltante que impidió al
 *           cliente comprar la máquina, que es la brecha que Lea$e existe para cerrar.
 */
export function payInstalment(
  operation: LeasingOperation,
  instalmentId: string,
  milestones: readonly CertificationMilestone[],
): void {
  const instalment = operation.instalments.find((i) => i.id === instalmentId)
  if (!instalment) throw new SpecViolation(`la cuota ${instalmentId} no pertenece a la operación`)
  if (instalment.status === 'paid') throw new SpecViolation(`la cuota ${instalmentId} ya está pagada`)

  if (!operation.receiptConfirmedAt) {
    throw new RuleViolation('BR-08', 'ninguna cuota es exigible antes de confirmarse la recepción')
  }

  const milestone = milestones.find((m) => m.id === instalment.anchoredTo)
  if (!milestone) {
    throw new SpecViolation(`la cuota ${instalmentId} está anclada a un hito que no existe`)
  }
  if (!milestone.certifiedAt) {
    throw new RuleViolation(
      'BR-04',
      `la cuota vence contra la certificación de «${milestone.name}», que aún no ocurrió`,
    )
  }

  instalment.status = 'paid'
}

export function paidCount(operation: LeasingOperation): number {
  return operation.instalments.filter((i) => i.status === 'paid').length
}

export function pendingCount(operation: LeasingOperation): number {
  return operation.instalments.filter((i) => i.status === 'pending').length
}

/** Todas pagadas, y nunca antes. BR-07: es la única forma en que termina la propiedad de BR-01. */
export function acquisitionOptionStatus(operation: LeasingOperation): AcquisitionOptionStatus {
  return pendingCount(operation) === 0 ? 'available' : 'not yet available'
}

export function exerciseAcquisitionOption(operation: LeasingOperation, at: Date): void {
  if (acquisitionOptionStatus(operation) !== 'available') {
    throw new RuleViolation(
      'BR-07',
      `la opción se abre al pagarse todas las cuotas; quedan ${pendingCount(operation)} pendientes`,
    )
  }
  if (operation.acquisitionExercisedAt) {
    throw new SpecViolation('la opción ya fue ejercida')
  }
  operation.acquisitionExercisedAt = at
}

/** Ningún estado queda indeterminado: la operación está siempre en exactamente uno de los dos. */
export function operationState(operation: LeasingOperation): OperationState {
  return operation.acquisitionExercisedAt ? 'completed' : 'in progress'
}

export function instalmentFor(
  operation: LeasingOperation,
  milestoneId: MilestoneId,
): Instalment | undefined {
  return operation.instalments.find((i) => i.anchoredTo === milestoneId)
}

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
/**
 * Los tres estados que `001` exige de una cuota: `pending`, `due`, `paid`.
 *
 * `due` se agregó el 2026-08-21 y la spec dice por qué con todas las letras: una cuota que no lleva
 * noción de cuándo se debe «no puede expresar lo único que distingue a Lea$e de un prestamista con
 * calendario». Sin él, `pending` mezclaba dos situaciones que no se parecen — una cuota esperando a
 * que la obra avance y una cuota exigible que el cliente no pagó.
 */
export type InstalmentState = 'pending' | 'due' | 'paid'

/** Lo que le falta a una cuota para ser exigible, con la regla que lo manda. */
export interface Waiting {
  readonly rule: 'BR-04' | 'BR-08'
  readonly because: string
}

/**
 * Qué le falta a una cuota, o nada si ya es exigible.
 *
 * `001` paso 13 pide que de una cuota pendiente se sepa *qué está esperando*, no solo que espera.
 * El orden importa: BR-08 gobierna la operación entera y BR-04 la cuota, así que una recepción sin
 * confirmar se reporta antes que un hito sin certificar.
 */
export function waitingOn(
  instalment: Instalment,
  operation: LeasingOperation,
  milestones: readonly CertificationMilestone[],
): Waiting | undefined {
  if (!operation.receiptConfirmedAt) {
    return { rule: 'BR-08', because: 'ninguna cuota es exigible antes de confirmarse la recepción' }
  }
  const milestone = milestones.find((m) => m.id === instalment.anchoredTo)
  if (!milestone) {
    throw new SpecViolation(`la cuota ${instalment.id} está anclada a un hito que no existe`)
  }
  if (!milestone.certifiedAt) {
    return {
      rule: 'BR-04',
      because: `la cuota vence contra la certificación de «${milestone.name}», que aún no ocurrió`,
    }
  }
  return undefined
}

export function instalmentState(
  instalment: Instalment,
  operation: LeasingOperation,
  milestones: readonly CertificationMilestone[],
): InstalmentState {
  if (instalment.paidAt) return 'paid'
  return waitingOn(instalment, operation, milestones) ? 'pending' : 'due'
}

export function payInstalment(
  operation: LeasingOperation,
  instalmentId: string,
  milestones: readonly CertificationMilestone[],
  at: Date,
): void {
  const instalment = operation.instalments.find((i) => i.id === instalmentId)
  if (!instalment) throw new SpecViolation(`la cuota ${instalmentId} no pertenece a la operación`)
  if (instalment.paidAt) throw new SpecViolation(`la cuota ${instalmentId} ya está pagada`)

  // Solo se paga una cuota `due`. El rechazo cita la regla que la retiene, no un estado.
  const waiting = waitingOn(instalment, operation, milestones)
  if (waiting) throw new RuleViolation(waiting.rule, waiting.because)

  instalment.paidAt = at
}

export function paidCount(operation: LeasingOperation): number {
  return operation.instalments.filter((i) => i.paidAt).length
}

/** Las que faltan pagar — `pending` y `due` juntas. Es lo que BR-07 mira para abrir la opción. */
export function unpaidCount(operation: LeasingOperation): number {
  return operation.instalments.filter((i) => !i.paidAt).length
}

/** Las exigibles hoy: su hito se certificó y la máquina se recibió. */
export function dueCount(
  operation: LeasingOperation,
  milestones: readonly CertificationMilestone[],
): number {
  return operation.instalments.filter((i) => instalmentState(i, operation, milestones) === 'due').length
}

/** Las que todavía esperan algo. */
export function pendingCount(
  operation: LeasingOperation,
  milestones: readonly CertificationMilestone[],
): number {
  return operation.instalments.filter((i) => instalmentState(i, operation, milestones) === 'pending')
    .length
}

/** Todas pagadas, y nunca antes. BR-07: es la única forma en que termina la propiedad de BR-01. */
export function acquisitionOptionStatus(operation: LeasingOperation): AcquisitionOptionStatus {
  return unpaidCount(operation) === 0 ? 'available' : 'not yet available'
}

export function exerciseAcquisitionOption(operation: LeasingOperation, at: Date): void {
  if (acquisitionOptionStatus(operation) !== 'available') {
    throw new RuleViolation(
      'BR-07',
      `la opción se abre al pagarse todas las cuotas; quedan ${unpaidCount(operation)} sin pagar`,
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

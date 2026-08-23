/**
 * La operación de leasing — `001-company-machinery-leasing`.
 *
 * El hilo que Pedro recorre: recibida la máquina, pagadas las cuotas, ejercida la opción.
 */

import { RuleViolation, SpecViolation, type BusinessRule } from './rules.ts'
import type { LeasingRequestId } from './leasing.ts'
import type { CertificationMilestone, Conditions, Installment, MilestoneId } from './underwriting.ts'

export type OperationId = string & { readonly __brand: 'OperationId' }

/**
 * Los cinco valores que `001` paso 14-15 enumera para la opción.
 *
 * Ninguno se guarda: los cinco se derivan de hechos —cuántas cuotas quedan, si se ejerció, si se
 * rehusó, cuánto pasó desde que se abrió—. Guardar el estado sería poder contradecirlo, que es
 * exactamente lo que `001` prohíbe al pedir que ninguno quede indeterminado.
 */
export type AcquisitionOptionStatus =
  | 'not yet available'
  | 'available'
  | 'exercised'
  | 'declined'
  | 'lapsed'

/**
 * El estado terminal que `001` paso 16 nombra.
 *
 * `Acquired` con esa ortografía porque la spec la fija con todas las letras — «the unambiguous
 * terminal state `Acquired`». Los otros finales (devolución, incumplimiento) son de etapas
 * posteriores y no existen todavía como valores.
 */
export type OperationState = 'in progress' | 'Acquired'

/**
 * Las condiciones que la aprobación cargó, y su liquidación.
 *
 * `001` paso 9 y `002` paso 11 son el mismo acto visto desde los dos lados: Pedro ve las
 * condiciones (FR-022) y liquida las que deben cumplirse antes de que el calendario arranque —el
 * inicial, pagándolo (`001` FR-024)—, y Carlos registra la garantía en su lugar (`002` FR-012c).
 *
 * Viven en la operación y no en el expediente porque es Pedro quien las liquida, y el expediente
 * es de Carlos: la copia es lo que le da a Pedro qué mirar sin abrir la superficie de decisión.
 */
export interface OperationConditions {
  readonly downPaymentUSD: number
  readonly guarantees: string
  /** Cuándo Pedro pagó el inicial — `001` FR-024. */
  downPaymentSettledAt?: Date
  /** Cuándo Carlos registró la garantía en su lugar — `002` FR-012c. */
  guaranteesInPlaceAt?: Date
}

export interface LeasingOperation {
  readonly id: OperationId
  readonly requestId: LeasingRequestId
  readonly installments: readonly Installment[]
  readonly conditions: OperationConditions
  /** Ausente mientras Pedro no haya confirmado que recibió la máquina. */
  receiptConfirmedAt?: Date
  /**
   * Cuándo se pagó la última cuota, que es cuando la opción se abrió (BR-07) y arrancó la ventana
   * de treinta días que BR-11 concede.
   */
  optionAvailableSince?: Date
  acquisitionExercisedAt?: Date
  acquisitionDeclinedAt?: Date
}

export function confirmReceipt(operation: LeasingOperation, at: Date): void {
  if (operation.receiptConfirmedAt) {
    throw new SpecViolation('la recepción ya estaba confirmada')
  }
  operation.receiptConfirmedAt = at
}

/**
 * Copia a la operación las condiciones que la aprobación fijó, sin liquidar.
 *
 * Es una copia y no una referencia al expediente: la liquidación es un acto de Pedro, y el
 * expediente es de Carlos. Que el dato viaje es lo que le da a Pedro qué mirar y qué pagar sin
 * abrirle la superficie de decisión.
 */
export function conditionsOf(approved: Conditions): OperationConditions {
  return { downPaymentUSD: approved.downPaymentUSD, guarantees: approved.guarantees }
}

/** Lo que falta liquidar de las condiciones, o vacío si el calendario ya puede arrancar. */
export function unsettledConditions(operation: LeasingOperation): readonly string[] {
  const pending: string[] = []
  if (!operation.conditions.downPaymentSettledAt) pending.push('el pago inicial')
  if (!operation.conditions.guaranteesInPlaceAt) pending.push('la garantía')
  return pending
}

export function conditionsSettled(operation: LeasingOperation): boolean {
  return unsettledConditions(operation).length === 0
}

/**
 * Pedro paga el inicial que la aprobación fijó — `001` paso 9, FR-024.
 *
 * El monto tiene que ser el de la condición: pagar de menos dejaría la condición sin cumplir y
 * pagar de más rehace, en la línea de salida, la falta de liquidez que el leasing existe para
 * evitar — y BR-12 la topa justamente ahí.
 */
export function settleDownPayment(operation: LeasingOperation, amountUSD: number, at: Date): void {
  if (operation.conditions.downPaymentSettledAt) {
    throw new SpecViolation('el pago inicial ya estaba liquidado')
  }
  if (amountUSD !== operation.conditions.downPaymentUSD) {
    throw new SpecViolation(
      `el inicial es de USD ${operation.conditions.downPaymentUSD.toLocaleString('en-US')} y se ofrecieron ` +
        `USD ${amountUSD.toLocaleString('en-US')}`,
    )
  }
  operation.conditions.downPaymentSettledAt = at
}

/** Carlos registra la garantía en su lugar — `002` paso 11, FR-012c. */
export function recordGuaranteesInPlace(operation: LeasingOperation, at: Date): void {
  if (operation.conditions.guaranteesInPlaceAt) {
    throw new SpecViolation('la garantía ya estaba registrada en su lugar')
  }
  operation.conditions.guaranteesInPlaceAt = at
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
export type InstallmentState = 'pending' | 'due' | 'paid'

/**
 * Lo que le falta a una cuota para ser exigible, con lo que lo manda.
 *
 * `rule` está solo cuando quien la retiene es una regla de negocio. Las condiciones de la
 * aprobación las retiene un requisito de spec y no una regla, y `cite` es lo que hace que ambas
 * cosas se reporten igual sin fingir que existe una `BR-nn` que no existe.
 */
export interface Waiting {
  readonly rule?: BusinessRule
  /** `BR-08`, o `001 FR-024` cuando lo manda un requisito y no una regla. */
  readonly cite: string
  readonly because: string
}

/**
 * Qué le falta a una cuota, o nada si ya es exigible.
 *
 * `001` paso 13 pide que de una cuota pendiente se sepa *qué está esperando*, no solo que espera.
 * El orden es el de los pasos de `001`: la recepción es su paso 8, liquidar las condiciones su
 * paso 9, y recién su paso 11 hace vencer la cuota contra su hito. Se reporta lo primero que falta,
 * que es lo único accionable.
 */
export function waitingOn(
  installment: Installment,
  operation: LeasingOperation,
  milestones: readonly CertificationMilestone[],
): Waiting | undefined {
  if (!operation.receiptConfirmedAt) {
    return {
      rule: 'BR-08',
      cite: 'BR-08',
      because: 'ninguna cuota es exigible antes de confirmarse la recepción',
    }
  }
  const unsettled = unsettledConditions(operation)
  if (unsettled.length > 0) {
    return {
      cite: '001 FR-024',
      because: `el calendario no arranca hasta liquidarse ${unsettled.join(' y ')} que la aprobación fijó`,
    }
  }
  const milestone = milestones.find((m) => m.id === installment.anchoredTo)
  if (!milestone) {
    throw new SpecViolation(`la cuota ${installment.id} está anclada a un hito que no existe`)
  }
  if (!milestone.certifiedAt) {
    return {
      rule: 'BR-04',
      cite: 'BR-04',
      because: `la cuota vence contra la certificación de «${milestone.name}», que aún no ocurrió`,
    }
  }
  return undefined
}

export function installmentState(
  installment: Installment,
  operation: LeasingOperation,
  milestones: readonly CertificationMilestone[],
): InstallmentState {
  if (installment.paidAt) return 'paid'
  return waitingOn(installment, operation, milestones) ? 'pending' : 'due'
}

export function payInstallment(
  operation: LeasingOperation,
  installmentId: string,
  milestones: readonly CertificationMilestone[],
  at: Date,
): void {
  const installment = operation.installments.find((i) => i.id === installmentId)
  if (!installment) throw new SpecViolation(`la cuota ${installmentId} no pertenece a la operación`)
  if (installment.paidAt) throw new SpecViolation(`la cuota ${installmentId} ya está pagada`)

  // Solo se paga una cuota `due`. El rechazo cita lo que la retiene, no un estado.
  const waiting = waitingOn(installment, operation, milestones)
  if (waiting) {
    throw waiting.rule
      ? new RuleViolation(waiting.rule, waiting.because)
      : new SpecViolation(`${waiting.cite} — ${waiting.because}`)
  }

  installment.paidAt = at

  // BR-07: la última cuota pagada es lo que abre la opción, y ese mismo instante arranca la
  // ventana de treinta días que BR-11 concede. Registrarlo acá es lo que impide que «cuándo se
  // abrió» dependa de cuándo alguien pregunte.
  if (unpaidCount(operation) === 0) operation.optionAvailableSince = at
}

export function paidCount(operation: LeasingOperation): number {
  return operation.installments.filter((i) => i.paidAt).length
}

/** Las que faltan pagar — `pending` y `due` juntas. Es lo que BR-07 mira para abrir la opción. */
export function unpaidCount(operation: LeasingOperation): number {
  return operation.installments.filter((i) => !i.paidAt).length
}

/** Las exigibles hoy: su hito se certificó y la máquina se recibió. */
export function dueCount(
  operation: LeasingOperation,
  milestones: readonly CertificationMilestone[],
): number {
  return operation.installments.filter((i) => installmentState(i, operation, milestones) === 'due').length
}

/** Las que todavía esperan algo. */
export function pendingCount(
  operation: LeasingOperation,
  milestones: readonly CertificationMilestone[],
): number {
  return operation.installments.filter((i) => installmentState(i, operation, milestones) === 'pending')
    .length
}

/** Los días que BR-11 concede para ejercer una opción disponible antes de que caduque. */
export const ACQUISITION_WINDOW_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

/** Cuándo caduca la opción, o nada si todavía no se abrió — BR-11. */
export function acquisitionWindowEnds(operation: LeasingOperation): Date | undefined {
  const since = operation.optionAvailableSince
  return since ? new Date(since.getTime() + ACQUISITION_WINDOW_DAYS * DAY_MS) : undefined
}

/**
 * En cuál de sus cinco estados está la opción, en un instante dado.
 *
 * BR-07 la abre —todas las cuotas pagadas, y nunca antes— y BR-11 la cierra si nadie la ejerce
 * dentro de la ventana. `asOf` es explícito porque «caducada» no es un hecho sobre la operación
 * sino sobre la operación *y* el momento en que se pregunta: preguntarlo dos veces el mismo caso
 * puede dar dos respuestas, y sería un error que la respuesta dependiera de un reloj implícito.
 */
export function acquisitionOptionStatus(
  operation: LeasingOperation,
  asOf: Date,
): AcquisitionOptionStatus {
  if (operation.acquisitionExercisedAt) return 'exercised'
  if (operation.acquisitionDeclinedAt) return 'declined'
  if (unpaidCount(operation) > 0) return 'not yet available'

  const ends = acquisitionWindowEnds(operation)
  return ends && asOf > ends ? 'lapsed' : 'available'
}

export function exerciseAcquisitionOption(operation: LeasingOperation, at: Date): void {
  const status = acquisitionOptionStatus(operation, at)
  if (status === 'not yet available') {
    throw new RuleViolation(
      'BR-07',
      `la opción se abre al pagarse todas las cuotas; quedan ${unpaidCount(operation)} sin pagar`,
    )
  }
  if (status === 'lapsed') {
    throw new RuleViolation(
      'BR-11',
      `la opción caducó: los ${ACQUISITION_WINDOW_DAYS} días vencieron el ` +
        `${acquisitionWindowEnds(operation)!.toISOString().slice(0, 10)}`,
    )
  }
  if (status === 'exercised') throw new SpecViolation('la opción ya fue ejercida')
  if (status === 'declined') throw new SpecViolation('la opción ya fue rehusada')

  operation.acquisitionExercisedAt = at
}

/**
 * El cliente rehúsa la opción — `001` FR-019.
 *
 * Fuera de Stage 1, que la ejerce. Existe porque es lo que vuelve *definitiva* la respuesta de
 * `003` paso 9 por el otro lado, y sin ella `headingFor` no podría distinguir «todavía no se sabe»
 * de «vuelve».
 */
export function declineAcquisitionOption(operation: LeasingOperation, at: Date): void {
  const status = acquisitionOptionStatus(operation, at)
  if (status === 'exercised') throw new SpecViolation('la opción ya fue ejercida')
  if (status === 'declined') throw new SpecViolation('la opción ya fue rehusada')
  operation.acquisitionDeclinedAt = at
}

/**
 * Ningún estado queda indeterminado — `001` paso 16.
 *
 * `Acquired` es terminal y se alcanza ejerciendo la opción. Los otros finales que la feature
 * define —devolución, incumplimiento— son de etapas posteriores y todavía no existen como valores:
 * inventarlos acá sería afirmar un comportamiento que ninguna spec de Stage 1 manda.
 */
export function operationState(operation: LeasingOperation): OperationState {
  return operation.acquisitionExercisedAt ? 'Acquired' : 'in progress'
}

export function installmentFor(
  operation: LeasingOperation,
  milestoneId: MilestoneId,
): Installment | undefined {
  return operation.installments.find((i) => i.anchoredTo === milestoneId)
}

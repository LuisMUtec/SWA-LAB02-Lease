/**
 * La flota desplegada — `003-deployed-fleet-custody`.
 *
 * El intervalo que `001` salta entre «la máquina llega» y «Pedro la adquiere»: la máquina parada
 * en un terreno que Julia no controla, gastándose por horas y no por días.
 */

import { RuleViolation, SpecViolation } from './rules.ts'
import { acquisitionOptionStatus, type LeasingOperation, type OperationId } from './operation.ts'

export type MachineId = string & { readonly __brand: 'MachineId' }
export type DeploymentId = string & { readonly __brand: 'DeploymentId' }

export type FleetState = 'available' | 'deployed' | 'retired'

export interface Machine {
  readonly id: MachineId
  readonly description: string
  /** Las horas entre servicios. En horas, nunca en tiempo transcurrido — BR-06. */
  readonly serviceIntervalHours: number
  accumulatedHours: number
  /** Las horas acumuladas al completarse el último servicio. El intervalo cuenta desde aquí. */
  hoursAtLastService: number
  fleetState: FleetState
}

/**
 * La condición y las horas al momento de la entrega, aceptadas por ambos lados.
 *
 * Es la línea de base contra la que se liquida todo reclamo posterior, y lo que convierte una
 * discusión en una comparación. Inmutable una vez aceptada: puede ser reemplazada por un registro
 * posterior, nunca editada.
 */
export interface HandoverRecord {
  readonly condition: string
  readonly hours: number
  /** La persona nombrada del lado del cliente que la tiene y responde por ella — BR-05. */
  readonly custodian: string
  readonly contractedSite: string
  readonly acceptedByLease: string
  readonly acceptedByClient: string
  readonly at: Date
}

export interface OperatingHoursReading {
  readonly hours: number
  readonly at: Date
}

/**
 * Lo que Lea$e estima que la máquina vale, y cuándo — FR-031b.
 *
 * Se registra al entregar y se revalúa al completarse un servicio, que son los dos momentos en que
 * alguien la mira de verdad. **El cliente no la acepta**: `003` paso 2 lo dice expresamente, y por
 * eso vive en el `Deployment` y no dentro del `HandoverRecord`, que es lo que ambos lados firman.
 */
export interface AssessedValue {
  readonly amountUSD: number
  readonly at: Date
  /** Qué la produjo: la entrega, o el servicio que se completó. */
  readonly because: 'entrega' | 'servicio completado'
}

/**
 * La ventana de servicio, que son **dos** actos y no uno — `003` paso 7.
 *
 * Julia la pide (FR-010b) y el cliente la acuerda (FR-010). Modelarlos como un solo acto le daba a
 * Julia el poder de fijar cuándo se libera una máquina que no está en su terreno, que es
 * exactamente lo que la spec no le da: la máquina está en obra y la obra decide cuándo puede
 * pararla.
 */
export interface ServiceWindow {
  /** Cuándo Julia la pidió — FR-010b. */
  readonly requestedAt: Date
  /** El período que el cliente acordó — FR-010. Ausente mientras no lo haya acordado. */
  agreed?: { readonly from: Date; readonly to: Date; readonly at: Date }
  completedAt?: Date
  /** Las horas acumuladas al completarse. El siguiente intervalo cuenta desde aquí — BR-06. */
  completedAtHours?: number
}

export type Close =
  | { readonly kind: 'Return'; readonly at: Date; readonly condition: string; readonly hours: number }
  | { readonly kind: 'Acquisition Retirement'; readonly at: Date }

export interface Deployment {
  readonly id: DeploymentId
  readonly machineId: MachineId
  readonly operationId: OperationId
  readonly handover: HandoverRecord
  readonly readings: OperatingHoursReading[]
  readonly serviceWindows: ServiceWindow[]
  /** La valorización de entrega y cada revaluación posterior, en orden — FR-031b. */
  readonly assessedValues: AssessedValue[]
  close?: Close
}

export interface HandoverInput {
  readonly condition: string
  readonly hours: number
  readonly custodian: string
  readonly contractedSite: string
  readonly acceptedByLease: string
  readonly acceptedByClient: string
  /** Lo que Lea$e estima que vale al entregarla. No se le pide al cliente que lo acepte. */
  readonly assessedValueUSD: number
  readonly at: Date
}

/**
 * Abre un despliegue contra una entrega registrada.
 *
 * Los cuatro elementos y las dos aceptaciones son exigidos: una entrega a la que le falte alguno
 * no es una entrega que este dominio realice, porque el valor entero del registro está en haberse
 * acordado antes de que hubiera algo que discutir.
 */
export function recordHandover(
  id: DeploymentId,
  machine: Machine,
  operationId: OperationId,
  input: HandoverInput,
): Deployment {
  const missing: string[] = []
  if (!input.condition) missing.push('condición')
  if (!Number.isFinite(input.hours)) missing.push('horas')
  if (!input.custodian) missing.push('custodio')
  if (!input.contractedSite) missing.push('sitio contratado')
  if (missing.length > 0) {
    throw new RuleViolation('BR-05', `la entrega no queda registrada sin ${missing.join(', ')}`)
  }
  if (!input.acceptedByLease || !input.acceptedByClient) {
    throw new RuleViolation('BR-05', 'la entrega la aceptan ambos lados o no queda aceptada')
  }
  // FR-003 no abre un despliegue sin la valorización, y `003` paso 2 la pone junto a la entrega:
  // sin ella no habría línea de base contra la que revaluar en el paso 8.
  if (!Number.isFinite(input.assessedValueUSD) || input.assessedValueUSD <= 0) {
    throw new SpecViolation('la entrega no abre un despliegue sin el valor estimado de la máquina')
  }
  if (machine.fleetState !== 'available') {
    throw new SpecViolation(`la máquina está «${machine.fleetState}»; una entrega exige una disponible`)
  }

  machine.fleetState = 'deployed'
  machine.accumulatedHours = input.hours
  machine.hoursAtLastService = input.hours

  // El acta es lo que ambos lados aceptan; la valorización no. Se separan acá para que no puedan
  // confundirse después — `003` paso 2.
  const { assessedValueUSD, ...accepted } = input

  return {
    id,
    machineId: machine.id,
    operationId,
    // Congelada de hecho, no por convención: AC-004 exige que alterarla no sea posible.
    handover: Object.freeze({ ...accepted }),
    readings: [],
    serviceWindows: [],
    assessedValues: [{ amountUSD: assessedValueUSD, at: input.at, because: 'entrega' }],
  }
}

/** Lo último que Lea$e estimó que vale. */
export function currentAssessedValue(deployment: Deployment): AssessedValue {
  const last = deployment.assessedValues[deployment.assessedValues.length - 1]
  if (!last) throw new SpecViolation('el despliegue no tiene ninguna valorización')
  return last
}

/**
 * Registra una lectura de horas-motor.
 *
 * Las horas acumuladas no bajan. Una lectura menor a lo ya acumulado se conserva como lectura —
 * ocurrió, y borrarla sería perder información— pero no mueve el contador hacia atrás.
 */
export function recordReading(
  deployment: Deployment,
  machine: Machine,
  reading: OperatingHoursReading,
): void {
  if (deployment.close) throw new SpecViolation('el despliegue está cerrado')
  deployment.readings.push(reading)
  machine.accumulatedHours = Math.max(machine.accumulatedHours, reading.hours)
}

/** Las horas corridas desde el último servicio completado. El único reloj que gobierna — BR-06. */
export function hoursSinceLastService(machine: Machine): number {
  return machine.accumulatedHours - machine.hoursAtLastService
}

/** Un hecho sobre la máquina, levantado por las horas. No es una instrucción al cliente. */
export function isServiceDue(machine: Machine): boolean {
  return hoursSinceLastService(machine) >= machine.serviceIntervalHours
}

export function overdueHours(machine: Machine): number {
  return Math.max(0, hoursSinceLastService(machine) - machine.serviceIntervalHours)
}

/** La ventana viva: pedida y todavía sin servicio hecho. */
export function openServiceWindow(deployment: Deployment): ServiceWindow | undefined {
  return deployment.serviceWindows.find((w) => !w.completedAt)
}

/**
 * Julia pide una ventana contra el despliegue — `003` paso 7, FR-010b.
 *
 * Se pide porque la máquina lo necesita, no porque haya una fecha: sin servicio debido no hay nada
 * que pedirle al cliente, y pedirlo igual convertiría el mantenimiento por horas en uno por
 * calendario, que es lo que BR-06 rechaza.
 */
export function requestServiceWindow(
  deployment: Deployment,
  machine: Machine,
  at: Date,
): ServiceWindow {
  if (deployment.close) throw new SpecViolation('el despliegue está cerrado')
  if (openServiceWindow(deployment)) {
    throw new SpecViolation('ya hay una ventana de servicio pedida y sin completar')
  }
  if (!isServiceDue(machine)) {
    throw new RuleViolation(
      'BR-06',
      `la máquina no tiene servicio debido: lleva ${hoursSinceLastService(machine)} h de las ` +
        `${machine.serviceIntervalHours} de su intervalo`,
    )
  }
  const window: ServiceWindow = { requestedAt: at }
  deployment.serviceWindows.push(window)
  return window
}

/**
 * El cliente acuerda el período — `003` paso 7, FR-010.
 *
 * Solo se acuerda una ventana que alguien pidió. Que no exista forma de acordar sin pedido es lo
 * que mantiene los dos actos separados: si se pudiera, el acto de Julia volvería a ser suficiente.
 */
export function agreeServiceWindow(
  deployment: Deployment,
  from: Date,
  to: Date,
  at: Date,
): ServiceWindow {
  if (deployment.close) throw new SpecViolation('el despliegue está cerrado')
  const window = openServiceWindow(deployment)
  if (!window) throw new SpecViolation('no hay ninguna ventana de servicio pedida que acordar')
  if (window.agreed) throw new SpecViolation('esa ventana de servicio ya estaba acordada')
  if (to < from) throw new SpecViolation('la ventana termina antes de empezar')
  window.agreed = { from, to, at }
  return window
}

/**
 * Completa un servicio dentro de su ventana, y revalúa la máquina — `003` paso 8.
 *
 * El siguiente intervalo cuenta desde las horas al completarse, no desde la fecha: es la misma
 * regla que hizo vencer este servicio — BR-06. La revaluación va acá y no en un acto aparte porque
 * FR-031b la ata al mismo momento: es la única vez, entre entrega y cierre, que alguien la abre.
 */
export function completeService(
  deployment: Deployment,
  machine: Machine,
  at: Date,
  atHours: number,
  assessedValueUSD: number,
): void {
  const window = openServiceWindow(deployment)
  if (!window) throw new SpecViolation('no hay ninguna ventana de servicio pendiente')
  if (!window.agreed) {
    throw new SpecViolation('la ventana se pidió pero el cliente todavía no la acordó')
  }
  if (at < window.agreed.from || at > window.agreed.to) {
    throw new SpecViolation('el servicio se completó fuera de su ventana acordada')
  }
  if (!Number.isFinite(assessedValueUSD) || assessedValueUSD <= 0) {
    throw new SpecViolation('el servicio no se cierra sin revaluar la máquina')
  }
  window.completedAt = at
  window.completedAtHours = atHours
  machine.hoursAtLastService = atHours
  deployment.assessedValues.push({
    amountUSD: assessedValueUSD,
    at,
    because: 'servicio completado',
  })
}

/**
 * A qué final se dirige el despliegue — `003` paso 9.
 *
 * Lo decide el cliente (BR-07), no Julia y no el calendario — que es exactamente su queja:
 * planifica el siguiente contrato alrededor de una máquina que quizá no vuelva nunca. Este dominio
 * no lo decide, lo consulta: la conducta es de `001`.
 *
 * **`not yet determined` es una respuesta, no un hueco.** La spec la enumera junto a las otras y
 * amendó el paso el 2026-08-21 precisamente para retirar la promesa de saberlo antes de tiempo. Una
 * opción disponible y sin ejercer todavía puede rehusarse o caducar; contestar «vuelve» o «se la
 * queda» ahí sería inventarle a Julia una certeza que nadie tiene.
 */
export type DeploymentEnd = Close['kind'] | 'not yet determined'

export function headingFor(operation: LeasingOperation, asOf: Date): DeploymentEnd {
  switch (acquisitionOptionStatus(operation, asOf)) {
    case 'exercised':
      return 'Acquisition Retirement'
    // Rehusada o caducada, la máquina vuelve. Las dos vías son de etapas posteriores; la respuesta
    // que las nombra no lo es — `003` paso 9 corre «en cualquier punto».
    case 'declined':
    case 'lapsed':
      return 'Return'
    case 'not yet available':
    case 'available':
      return 'not yet determined'
  }
}

/**
 * Cierra por adquisición y retira la máquina de la flota.
 *
 * No admite ser rehusada, demorada ni condicionada: no recibe parámetro alguno con el que
 * hacerlo. Sobre una máquina que el cliente está adquiriendo no queda condición de retorno que
 * proteger, y su derecho no depende de la conformidad de Lea$e (BR-07).
 */
export function closeByAcquisitionRetirement(
  deployment: Deployment,
  machine: Machine,
  operation: LeasingOperation,
  at: Date,
): void {
  if (deployment.close) throw new SpecViolation('el despliegue ya está cerrado')
  if (!operation.acquisitionExercisedAt) {
    throw new SpecViolation('el cliente no ha ejercido la opción de adquisición')
  }
  deployment.close = { kind: 'Acquisition Retirement', at }
  // Aquí termina la propiedad que BR-01 conserva durante todo el contrato.
  machine.fleetState = 'retired'
}

/** El otro final: la máquina vuelve y su condición se liquida contra el acta de entrega. */
export function closeByReturn(
  deployment: Deployment,
  machine: Machine,
  at: Date,
  condition: string,
  hours: number,
): void {
  if (deployment.close) throw new SpecViolation('el despliegue ya está cerrado')
  deployment.close = { kind: 'Return', at, condition, hours }
  machine.fleetState = 'available'
}

/*
 * FR-021 de `003`: el sistema no le da a Julia capacidad alguna de declarar un incumplimiento ni de
 * registrar que un cliente dejó de pagar. Como en `domain/underwriting.ts`, el requisito se cumple
 * por ausencia — este módulo no exporta nada que declare un default ni que toque lo que se debe.
 */

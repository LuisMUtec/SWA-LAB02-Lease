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

export interface ServiceWindow {
  readonly from: Date
  readonly to: Date
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
  close?: Close
}

export interface HandoverInput {
  readonly condition: string
  readonly hours: number
  readonly custodian: string
  readonly contractedSite: string
  readonly acceptedByLease: string
  readonly acceptedByClient: string
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
  if (machine.fleetState !== 'available') {
    throw new SpecViolation(`la máquina está «${machine.fleetState}»; una entrega exige una disponible`)
  }

  machine.fleetState = 'deployed'
  machine.accumulatedHours = input.hours
  machine.hoursAtLastService = input.hours

  return {
    id,
    machineId: machine.id,
    operationId,
    // Congelada de hecho, no por convención: AC-004 exige que alterarla no sea posible.
    handover: Object.freeze({ ...input }),
    readings: [],
    serviceWindows: [],
  }
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

export function agreeServiceWindow(deployment: Deployment, from: Date, to: Date): ServiceWindow {
  if (deployment.close) throw new SpecViolation('el despliegue está cerrado')
  const window: ServiceWindow = { from, to }
  deployment.serviceWindows.push(window)
  return window
}

/**
 * Completa un servicio dentro de su ventana.
 *
 * El siguiente intervalo cuenta desde las horas al completarse, no desde la fecha: es la misma
 * regla que hizo vencer este servicio — BR-06.
 */
export function completeService(
  machine: Machine,
  window: ServiceWindow,
  at: Date,
  atHours: number,
): void {
  if (window.completedAt) throw new SpecViolation('el servicio ya estaba completado')
  if (at < window.from || at > window.to) {
    throw new SpecViolation('el servicio se completó fuera de su ventana acordada')
  }
  window.completedAt = at
  window.completedAtHours = atHours
  machine.hoursAtLastService = atHours
}

/**
 * A qué final se dirige el despliegue.
 *
 * Lo decide la última cuota del cliente (BR-07), no Julia y no el calendario — que es exactamente
 * su queja: planifica el siguiente contrato alrededor de una máquina que quizá no vuelva nunca.
 * Este dominio no lo decide, lo consulta: la conducta es de `001`.
 */
export function headingFor(operation: LeasingOperation): Close['kind'] {
  return acquisitionOptionStatus(operation) === 'available' ? 'Acquisition Retirement' : 'Return'
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

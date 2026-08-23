/**
 * El catálogo de reglas de negocio, tipado.
 *
 * `business-rules.md` es la fuente; esto es su proyección al código para que una cita no pueda
 * ser un typo. Los identificadores son estables y no se renumeran (business-rules.md,
 * Convenciones), así que este mapa solo crece.
 *
 * BR-03 está catalogada pero no aparece aquí como invariante: fija bajo qué régimen contrata
 * Lea$e, no un comportamiento del sistema. Ver poc/DOMAIN.md.
 */

export const BUSINESS_RULES = {
  'BR-01': 'Lea$e conserva la propiedad de la máquina durante todo el contrato.',
  'BR-02': 'Los clientes son empresas que trabajan por proyecto.',
  'BR-03': 'Lea$e contrata fuera del régimen de arrendamiento financiero.',
  'BR-04': 'Las cuotas vencen contra el avance del proyecto, no contra el calendario.',
  'BR-05': 'El cliente tiene la custodia y responde por los daños.',
  'BR-06': 'Las máquinas se sirven por horas corridas, no por tiempo transcurrido.',
  'BR-07': 'Pagar todas las cuotas abre la opción de adquirir la máquina.',
  'BR-08': 'Las cuotas vencen solo después de que el cliente confirma la recepción.',
  'BR-09': 'Un proyecto que se atrasa se vuelve elegible para incumplimiento pasada una tolerancia fija.',
  'BR-10': 'Una máquina muy atrasada de servicio es causa de seguridad.',
  'BR-11': 'Una opción de adquisición disponible caduca si no se ejerce.',
  'BR-12': 'Todo pago inicial está topado y no puede exceder un décimo del valor de la máquina.',
  'BR-13': 'Una máquina desplegada debe seguir valiendo al menos lo que su contrato aún debe.',
} as const

export type BusinessRule = keyof typeof BUSINESS_RULES

/**
 * Las reglas que Stage 1 ejerce.
 *
 * BR-03 no produce comportamiento. De las cinco que se agregaron el 2026-08-21 caen dentro dos:
 *
 *   BR-12 — `001` paso 9 liquida un pago inicial «within BR-12's cap».
 *   BR-11 — `001` paso 15 ejerce la opción «within the 30-day window BR-11 allows». La *caducidad*
 *           queda fuera —Stage 1 no deja caducar nada—, pero la ventana que la acota es lo que
 *           hace admisible ese ejercicio, y el dominio la mide antes de aceptarlo.
 *
 * Las otras tres son de etapas posteriores y las specs lo dicen ellas mismas: BR-09 y BR-10
 * gobiernan el incumplimiento y la parada por seguridad, que ningún Stage 1 asume; y de BR-13
 * Stage 1 ejerce el dato —el Assessed Value de `003` pasos 2 y 8— pero no su invariante, porque
 * `003` excluye el deterioro expresamente.
 */
export const STAGE_1_RULES: readonly BusinessRule[] = [
  'BR-01',
  'BR-02',
  'BR-04',
  'BR-05',
  'BR-06',
  'BR-07',
  'BR-08',
  'BR-11',
  'BR-12',
]

/**
 * El rechazo de una operación que una regla prohíbe.
 *
 * Lleva el identificador de la regla que la prohibió, de modo que el hilo pueda afirmar no solo
 * que algo falló, sino que falló *por la regla que corresponde*. Una cita que se ejecuta no puede
 * quedar desactualizada como puede quedarlo un comentario.
 */
export class RuleViolation extends Error {
  readonly rule: BusinessRule

  constructor(rule: BusinessRule, message: string) {
    super(`${rule} — ${message}`)
    this.name = 'RuleViolation'
    this.rule = rule
  }
}

/** El rechazo de una operación que la especificación prohíbe sin que medie una regla de negocio. */
export class SpecViolation extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SpecViolation'
  }
}

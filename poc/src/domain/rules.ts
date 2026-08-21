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
} as const

export type BusinessRule = keyof typeof BUSINESS_RULES

/** Las reglas que Stage 1 ejerce. BR-03 no produce comportamiento; el resto sí. */
export const STAGE_1_RULES: readonly BusinessRule[] = [
  'BR-01',
  'BR-02',
  'BR-04',
  'BR-05',
  'BR-06',
  'BR-07',
  'BR-08',
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

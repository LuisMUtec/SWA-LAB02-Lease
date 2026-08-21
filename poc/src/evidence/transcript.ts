/**
 * El arnés de evidencia.
 *
 * Principio V de la constitución: «"It compiles" and "it is scaffolded" are not delivery.
 * Evidence of an actual run is part of the deliverable.» Esto produce esa evidencia.
 *
 * Un paso sin `run` se reporta PENDIENTE, no se omite ni se finge. La transcripción dice la
 * verdad sobre cuánto del hilo está construido, y eso es exactamente lo que la hace evidencia.
 */

import { BUSINESS_RULES, STAGE_1_RULES, type BusinessRule } from '../domain/rules.ts'

export type Actor = 'Pedro' | 'Carlos' | 'Julia' | 'Lea$e'
export type SpecId = '001' | '002' | '003'

export interface Step<S> {
  /** Identificador estable del paso dentro del hilo. */
  id: string
  /** Quién actúa. `Lea$e` es la casa cuando ningún actor humano está en el paso. */
  actor: Actor
  /** La spec que manda sobre este paso. */
  spec: SpecId
  /** El número del paso dentro de `Phased Scope > Stage 1` de esa spec. */
  stage1: number
  /** Qué ocurre, en una línea. */
  what: string
  /** Las reglas que el paso ejerce. */
  rules?: readonly BusinessRule[]
  /** La implementación. Ausente = todavía no construido. */
  run?: (state: S) => void | Promise<void>
}

export class CheckFailed extends Error {}

/** Afirma un invariante dentro de un paso. Falla el paso y detiene la corrida. */
export function check(condition: boolean, message: string): asserts condition {
  if (!condition) throw new CheckFailed(message)
}

type Outcome = 'ok' | 'pending' | 'failed'

interface Options {
  color: boolean
  /** Si es true, un paso pendiente hace fallar la corrida. Para la entrega final. */
  strict: boolean
}

const ANSI = {
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
}

export async function runThread<S>(
  title: string,
  state: S,
  steps: readonly Step<S>[],
  options: Options,
): Promise<number> {
  const c = (code: string, text: string) => (options.color ? `${code}${text}${ANSI.reset}` : text)

  const outcomes = new Map<string, Outcome>()
  const exercised = new Set<BusinessRule>()
  let failure: { step: Step<S>; error: unknown } | undefined

  const widest = Math.max(...steps.map((s) => s.what.length))

  console.log(c(ANSI.bold, title))
  console.log(c(ANSI.dim, `Pasos declarados: ${steps.length} · 001 Pedro · 002 Carlos · 003 Julia`))
  console.log()

  for (const step of steps) {
    let outcome: Outcome

    if (!step.run) {
      outcome = 'pending'
    } else if (failure) {
      // Una vez que un paso falla, el resto del hilo no se ejecuta: el estado ya no es confiable.
      outcome = 'pending'
    } else {
      try {
        await step.run(state)
        outcome = 'ok'
        for (const rule of step.rules ?? []) exercised.add(rule)
      } catch (error) {
        outcome = 'failed'
        failure = { step, error }
      }
    }

    outcomes.set(step.id, outcome)

    const mark =
      outcome === 'ok'
        ? c(ANSI.green, '✓')
        : outcome === 'failed'
          ? c(ANSI.red, '✗')
          : c(ANSI.dim, '◦')

    const cites = (step.rules ?? []).join(' ')
    const trail = outcome === 'pending' && !step.run ? c(ANSI.dim, 'no construido') : ''

    console.log(
      `  ${mark} ${step.id}  ${step.actor.padEnd(6)} ${c(ANSI.dim, `${step.spec}·${String(step.stage1).padStart(2)}`)}  ` +
        `${step.what.padEnd(widest)}  ${c(ANSI.yellow, cites.padEnd(13))} ${trail}`,
    )
  }

  const built = [...outcomes.values()].filter((o) => o === 'ok').length
  const pending = [...outcomes.values()].filter((o) => o === 'pending').length
  const failed = [...outcomes.values()].filter((o) => o === 'failed').length

  console.log()
  console.log(c(ANSI.bold, 'Resumen'))
  console.log(
    `  ${steps.length} pasos · ${built} corridos · ${pending} pendientes · ${failed} fallidos`,
  )

  const missing = STAGE_1_RULES.filter((r) => !exercised.has(r))
  console.log(
    `  Reglas ejercidas: ${exercised.size}/${STAGE_1_RULES.length}` +
      (missing.length ? c(ANSI.dim, `  — faltan ${missing.join(' ')}`) : ''),
  )

  if (failure) {
    const { step, error } = failure
    const detail = error instanceof Error ? error.message : String(error)
    console.log()
    console.log(c(ANSI.red, `Falló en ${step.id} — ${step.what}`))
    console.log(`  ${detail}`)
    if (step.rules?.length) {
      for (const rule of step.rules) console.log(c(ANSI.dim, `  ${rule} — ${BUSINESS_RULES[rule]}`))
    }
    return 1
  }

  if (pending > 0) {
    console.log()
    console.log(
      options.strict
        ? c(ANSI.red, `El hilo no está completo: ${pending} pasos sin construir.`)
        : c(ANSI.dim, `El hilo todavía no está completo: ${pending} pasos sin construir.`),
    )
    return options.strict ? 1 : 0
  }

  console.log()
  console.log(c(ANSI.green, 'El hilo corre de extremo a extremo.'))
  return 0
}

/**
 * Los tres agentes sobre el dominio.
 *
 *   npm run agent:matrix          — imprime y verifica la frontera de autoridad (sin llave de API)
 *   npm run agent                 — la corrida completa: los tres agentes sobre un mundo compartido
 *   npm run agent -- --actor Julia --prompt "..."   — un solo turno
 *
 * El hilo determinista (`npm run demo`) sigue siendo la puerta del entregable: no necesita llave,
 * no depende de la red y corre igual si esto falla.
 */

import { memoryWorld } from '../adapters/memory/world.ts'
import { toolNames, type ActorName } from '../agents/tools.ts'
import { ROSTER } from '../agents/roster.ts'
import {
  FORBIDDEN_CROSSINGS,
  SURFACE_OF,
  SURFACE_OF_ACTOR,
  verifyAuthority,
} from '../agents/authority.ts'
import { createClient, MissingCredentials, runTurn, type Effort } from '../agents/run.ts'

const ACTORS: readonly ActorName[] = ['Pedro', 'Carlos', 'Julia']

const argv = process.argv.slice(2)
const flag = (name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? argv[i + 1] : undefined
}

/** El caso que la corrida recorre, dicho como se lo diría una persona. */
const SCRIPT: readonly { actor: ActorName; brief: string }[] = [
  {
    actor: 'Pedro',
    brief: `Nos adjudicaron el tramo II de la carretera Canta–Huayllay y necesitamos una excavadora
sobre orugas de 20 toneladas para ejecutarlo. Comprarla cuesta unos 128,000 dólares y no los
tenemos: cobramos por valorizaciones cuando la obra avanza. Registra la necesidad, envía la
solicitud de leasing a nombre de Constructora Andina S.A.C. y dime en qué estado queda.`,
  },
  {
    actor: 'Carlos',
    brief: `Revisa qué solicitudes están esperando decisión y toma la que encuentres.

Lo que averigüé del caso: Constructora Andina es una constructora vigente que trabaja por obra
adjudicada, con grado SBS Normal y sin atrasos en los últimos 24 meses. El proyecto es el tramo II
de la carretera Canta–Huayllay, adjudicado por Provías Descentralizado del MTC por 2,400,000
dólares, y se paga en seis valorizaciones mensuales con fechas esperadas 2026-09-30, 2026-10-31,
2026-11-30, 2026-12-31, 2027-01-31 y 2027-02-28. El pagador es el propio Provías; no tengo reporte
de su comportamiento de pago.

Arma el expediente, verifica que esté completo y que el caso esté dentro de tu autoridad, y si
corresponde apruébalo con una inicial del 20% y fianza solidaria del accionista principal. Después
produce el calendario de cuotas y dime el identificador de la operación.`,
  },
  {
    actor: 'Julia',
    brief: `Se aprobó una operación y hay que sacar la máquina. Incorpora a la flota una excavadora
sobre orugas de 20 toneladas con intervalo de servicio de 250 horas, y entrégala al cliente.

Datos de la entrega: la máquina está operativa, con rayaduras menores en la pluma y sin fugas, con
el horómetro en 0. El sitio contratado es el km 42+500 del tramo II. Del lado del cliente la recibe
y la tiene a su cargo Rosa Quispe, jefa de equipos. La operación es la que acaba de aprobarse —
búscala si necesitas el identificador, es OP-0001.`,
  },
  {
    actor: 'Pedro',
    brief: `Ya llegó la excavadora al frente de obra y está operando. Confirma la recepción de la
operación OP-0001 y muéstrame cómo quedaron las cuotas: cuántas son, de cuánto, y contra qué vence
cada una.`,
  },
  {
    actor: 'Julia',
    brief: `Pasé por la obra. El 2026-09-12 el horómetro marcaba 120 horas y el 2026-09-25 marcaba
265. Registra las dos lecturas y dime si la máquina necesita servicio.

Si le toca, acuerda con el cliente una ventana entre el 2026-09-26 y el 2026-09-30, y dala por
completada el 2026-09-28.`,
  },
  {
    actor: 'Carlos',
    brief: `Provías fue certificando y pagando las valorizaciones del tramo II en las fechas que
estaban previstas, las seis. Regístralas como certificadas.`,
  },
  {
    actor: 'Pedro',
    brief: `Ya nos pagaron las seis valorizaciones. Paga todas las cuotas pendientes de la operación
OP-0001, revisa si con eso se abre la opción de adquirir la excavadora, y si está disponible
ejércela.`,
  },
  {
    actor: 'Julia',
    brief: `Revisa los despliegues abiertos y dime a qué final se dirige el que encuentres. Si el
cliente ya adquirió la máquina, ciérralo como corresponde.`,
  },
]

function printMatrix(): number {
  console.log('Frontera de autoridad — qué herramientas ve cada agente\n')

  for (const actor of ACTORS) {
    const own = SURFACE_OF_ACTOR[actor]
    console.log(`  ${ROSTER[actor].title}   ·   superficie: ${own}`)
    for (const tool of toolNames(actor)) {
      const surface = SURFACE_OF[tool]
      const mark = surface === own ? '·' : '✗'
      console.log(`    ${mark} ${tool.padEnd(36)} ${surface ?? '—'}`)
    }
    console.log()
  }

  console.log('Cruces que las specs prohíben expresamente\n')
  for (const c of FORBIDDEN_CROSSINGS) {
    const held = toolNames(c.actor).filter((t) => SURFACE_OF[t] === c.surface)
    const mark = held.length === 0 ? '✓' : '✗'
    console.log(`  ${mark} ${c.actor} no sostiene ninguna herramienta de «${c.surface}»`)
    console.log(`      ${c.cite} — ${c.why}`)
    if (held.length > 0) console.log(`      sostiene: ${held.join(', ')}`)
  }

  const violations = verifyAuthority()
  console.log()
  if (violations.length === 0) {
    console.log('La frontera del dominio, la de los actores y la de las herramientas coinciden.')
    return 0
  }
  for (const v of violations) {
    console.log(`✗ ${v.actor} sostiene ${v.tool} (${v.surface}) — ${v.cite}`)
  }
  return 1
}

async function main(): Promise<number> {
  if (argv.includes('--matrix')) return printMatrix()

  const effort = (flag('effort') ?? 'medium') as Effort
  const world = memoryWorld()

  const violations = verifyAuthority()
  if (violations.length > 0) {
    console.error('La frontera de autoridad está rota; no se corre nada.')
    for (const v of violations) console.error(`  ✗ ${v.actor} sostiene ${v.tool} — ${v.cite}`)
    return 1
  }

  let client
  try {
    client = createClient()
  } catch (error) {
    if (error instanceof MissingCredentials) {
      console.error(error.message)
      return 2
    }
    throw error
  }

  const only = flag('actor') as ActorName | undefined
  const prompt = flag('prompt')
  const script =
    only && prompt ? [{ actor: only, brief: prompt }] : only ? SCRIPT.filter((s) => s.actor === only) : SCRIPT

  console.log(`Lea$e — tres agentes sobre un mundo compartido   ·   esfuerzo: ${effort}\n`)

  let inTokens = 0
  let outTokens = 0

  for (const [index, turn] of script.entries()) {
    console.log(`── ${index + 1}/${script.length}  ${ROSTER[turn.actor].title}`)
    const result = await runTurn(client, world, turn.actor, turn.brief, effort)
    inTokens += result.inputTokens
    outTokens += result.outputTokens

    for (const call of result.calls) console.log(`   → ${call.name}`)
    console.log()
    console.log(
      result.text
        .split('\n')
        .map((line) => `   ${line}`)
        .join('\n'),
    )
    console.log()
  }

  const cost = (inTokens / 1e6) * 5 + (outTokens / 1e6) * 25
  console.log(
    `Tokens: ${inTokens.toLocaleString('en-US')} entrada · ${outTokens.toLocaleString('en-US')} salida` +
      `  ≈ USD ${cost.toFixed(2)}`,
  )
  return 0
}

process.exit(await main())

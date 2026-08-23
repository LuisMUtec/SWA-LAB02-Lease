/**
 * Las mismas herramientas, por línea de comandos.
 *
 *   node src/cli/lease.ts                                   — los tres actores
 *   node src/cli/lease.ts carlos                            — sus herramientas
 *   node src/cli/lease.ts carlos registrar_aprobacion --help
 *   node src/cli/lease.ts carlos registrar_aprobacion --expedienteId AS-0003 --razon "..." ...
 *
 * Tercer adaptador sobre `agents/tools.ts`, junto a `sdk-adapter.ts` y `mcp/server.ts`. No hay
 * lógica de negocio aquí: parsea banderas, valida contra el mismo esquema Zod que MCP registra, y
 * deja que el dominio acepte o rechace.
 *
 * Lo que MCP no da y esto sí: corre sin cliente, sin protocolo y sin aprobación previa. Cualquiera
 * que clone el repo puede ejecutar el happy path completo con `npm run e2e`.
 *
 * El acotamiento por actor sigue siendo del binario, no del que lo invoca: `lease.ts carlos` no
 * despacha `registrar_entrega` — y al intentarlo cita el FR que lo prohíbe en vez de callar.
 */

import { z } from 'zod'

import { sqliteWorld } from '../adapters/sqlite/world.ts'
import { TOOLS, type ActorName, type ToolDef } from '../agents/tools.ts'
import { FORBIDDEN_CROSSINGS, SURFACE_OF_ACTOR, verifyAuthority } from '../agents/authority.ts'
import { describeTool, field, shapeOf, typeOf } from '../agents/schema.ts'

const ACTORS: readonly ActorName[] = ['Pedro', 'Carlos', 'Julia']

const die = (message: string, code = 2): never => {
  console.error(message)
  process.exit(code)
}

/** `carlos`, `Carlos` y `CARLOS` son el mismo actor. Nada más lo es. */
function resolveActor(raw: string): ActorName {
  const found = ACTORS.find((a) => a.toLowerCase() === raw.toLowerCase())
  return found ?? die(`Actor desconocido: ${raw}. Son ${ACTORS.join(', ')}.`)
}

/**
 * Por qué un actor no tiene una herramienta.
 *
 * Que exista y sea de otro no es lo mismo que no existir, y la diferencia es justo lo que las specs
 * afirman. El mensaje lo dice, con la cita.
 */
function explainMissing(actor: ActorName, name: string): string {
  const owner = ACTORS.find((a) => TOOLS[a].some((t) => t.name === name))
  if (!owner) {
    return `${actor} no tiene la herramienta ${name}, y ningún actor la tiene.\nSus herramientas: node src/cli/lease.ts ${actor.toLowerCase()}`
  }
  const crossing = FORBIDDEN_CROSSINGS.find(
    (c) => c.actor === actor && c.surface === SURFACE_OF_ACTOR[owner],
  )
  const cite = crossing ? `\n  ${crossing.cite} — ${crossing.why}` : ''
  return `${name} es una herramienta de ${owner}, no de ${actor}.${cite}`
}

/**
 * Una bandera se lee primero como texto y, si el esquema la rechaza, como JSON.
 *
 * Cubre los cuatro casos que las herramientas usan sin inspeccionar el esquema: texto tal cual,
 * `--valorUSD 128000`, `--trabajaPorProyecto true` y el `--hitos '[{...}]'` de `registrar_proyecto`.
 */
function coerce(schema: z.ZodType, raw: string, flag: string): unknown {
  const direct = schema.safeParse(raw)
  if (direct.success) return direct.data

  // Si era JSON válido y aun así el esquema lo rechazó, el que sabe por qué es el esquema. Decir
  // «se esperaba <array>» sobre un `[]` es mentir: era un array, y el problema era otro.
  let issue: string | undefined
  try {
    const parsed = schema.safeParse(JSON.parse(raw))
    if (parsed.success) return parsed.data
    issue = parsed.error.issues[0]?.message
  } catch {
    // No era JSON.
  }

  const detail = issue ?? `se esperaba <${typeOf(schema)}> y llegó ${JSON.stringify(raw)}`
  return die(`--${flag}: ${detail}\n      forma: '${shapeOf(schema)}'`)
}

function parseFlags(tool: ToolDef, argv: readonly string[]): Record<string, unknown> {
  const input: Record<string, unknown> = {}
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i]
    if (flag === undefined || !flag.startsWith('--')) die(`Se esperaba una bandera --nombre, y llegó ${flag}`)
    const name = flag!.slice(2)
    const schema = field(tool, name)
    if (!schema) {
      die(`${tool.name} no toma --${name}.\n\n${describeTool(tool)}`)
    }
    const raw = argv[i + 1]
    if (raw === undefined) die(`--${name} se quedó sin valor`)
    input[name] = coerce(schema!, raw!, name)
  }

  const missing = Object.keys(tool.shape).filter((k) => !(k in input))
  if (missing.length > 0) {
    die(`Faltan banderas: ${missing.map((m) => `--${m}`).join(', ')}\n\n${describeTool(tool)}`)
  }
  return input
}

// ─── main ────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)

// La misma comprobación que hace el servidor MCP antes de publicar: si la frontera estuviera rota,
// no se despacha nada.
const violations = verifyAuthority()
if (violations.length > 0) {
  for (const v of violations) console.error(`✗ ${v.actor} sostiene ${v.tool} — ${v.cite}`)
  process.exit(1)
}

if (argv.length === 0) {
  console.log('Uso: node src/cli/lease.ts <actor> <herramienta> [--bandera valor ...]\n')
  for (const a of ACTORS) {
    console.log(`  ${a.toLowerCase().padEnd(8)} ${SURFACE_OF_ACTOR[a].padEnd(9)} ${TOOLS[a].length} herramientas`)
  }
  process.exit(0)
}

const actor = resolveActor(argv[0]!)
const toolName = argv[1]

if (toolName === undefined) {
  console.log(`${actor} — superficie «${SURFACE_OF_ACTOR[actor]}», ${TOOLS[actor].length} herramientas\n`)
  for (const t of TOOLS[actor]) console.log(`  ${t.name}\n      ${t.description}`)
  process.exit(0)
}

const tool = TOOLS[actor].find((t) => t.name === toolName)
if (!tool) die(explainMissing(actor, toolName))

const rest = argv.slice(2)
// En cualquier posición, no solo la primera: quien se queda a mitad de una invocación larga
// agrega `--help` al final, y contestarle «no toma --help» es la peor respuesta posible.
if (rest.includes('--help')) {
  console.log(describeTool(tool!))
  process.exit(0)
}

const input = parseFlags(tool!, rest)
const world = sqliteWorld(process.env['LEASE_DB'] ?? 'lease.db')

try {
  const output = tool!.run(world, input)
  world.commit()
  console.log(output)
} catch (error) {
  // Un rechazo del dominio no es una falla del programa: es la regla haciendo su trabajo. Sale por
  // stderr con su cita y con código 1, para que un script lo note y una persona lo lea.
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

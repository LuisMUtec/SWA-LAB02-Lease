/**
 * Los artefactos de Claude Code, proyectados desde la definición única.
 *
 *   node src/cli/generate.ts            — los escribe
 *   node src/cli/generate.ts --check    — falla si lo escrito no corresponde
 *
 * Un skill escrito a mano sería un cuarto lugar donde vive la firma de veintisiete herramientas, y
 * la primera bandera que alguien agregue lo deja mintiendo en silencio. Acá el catálogo sale del
 * mismo `tools.ts` que sirven los tres transportes, y lo que el agente lee es literalmente lo que
 * el `--help` le diría — comparten el renderizador.
 *
 * Dos artefactos por actor, porque sirven a dos caminos distintos:
 *
 *   .claude/agents/lease-<actor>.md         el subagente que trabaja por MCP, donde las
 *                                           herramientas ya llegan tipadas y no hace falta catálogo
 *   .claude/skills/lease-<actor>/SKILL.md   el skill para trabajar por CLI, donde el catálogo es
 *                                           exactamente lo que evita gastar turnos descubriendo
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { TOOLS, type ActorName } from '../agents/tools.ts'
import { ROSTER } from '../agents/roster.ts'
import { flagLines } from '../agents/schema.ts'
import { FORBIDDEN_CROSSINGS, SURFACE_OF_ACTOR } from '../agents/authority.ts'

const ACTORS: readonly ActorName[] = ['Pedro', 'Carlos', 'Julia']
const ROOT = join(import.meta.dirname, '..', '..', '..')
const slug = (actor: ActorName) => `lease-${actor.toLowerCase()}`

const HEAD = '<!-- Generado por poc/src/cli/generate.ts. No editar a mano: corré `npm run generate`. -->'

/** El subagente que trabaja por MCP. Las herramientas le llegan tipadas; no lleva catálogo. */
function subagent(actor: ActorName): string {
  const { description, system } = ROSTER[actor]
  return `---
name: ${slug(actor)}
description: ${description}
mcpServers: ${slug(actor)}
tools: mcp__${slug(actor)}__*
---

${HEAD}

${system}
`
}

/** Lo que este actor no puede hacer, con la cita que lo prohíbe. Dicho antes de que lo intente. */
function boundary(actor: ActorName): string {
  const crossings = FORBIDDEN_CROSSINGS.filter((c) => c.actor === actor)
  if (crossings.length === 0) {
    return `No hay actos de Lea$e en tu superficie: todo lo que ves es tuyo, sobre tu propia operación.`
  }
  return crossings
    .map((c) => {
      const theirs = ACTORS.find((a) => SURFACE_OF_ACTOR[a] === c.surface)
      const names = theirs ? TOOLS[theirs].map((t) => `\`${t.name}\``).join(', ') : ''
      return `- La superficie **${c.surface}** es de ${theirs}, no tuya — *${c.cite}*: ${c.why}.\n  No vas a encontrar ${names}. Pedirlas al CLI devuelve la cita, no la herramienta.`
    })
    .join('\n')
}

/** El skill para trabajar por CLI, con el catálogo entero. */
function skill(actor: ActorName): string {
  const { title, description, system } = ROSTER[actor]
  const lower = actor.toLowerCase()
  const tools = TOOLS[actor]

  const catalogue = tools
    .map((t) => {
      const flags = flagLines(t, '')
      const usage = flags.length > 0 ? `\n\n\`\`\`\n${flags.join('\n')}\n\`\`\`` : '\n\nSin banderas.'
      return `### \`${t.name}\`\n\n${t.description}${usage}`
    })
    .join('\n\n')

  return `---
name: ${slug(actor)}
description: ${description} Cárgala para actuar como ${actor} sobre el CLI de Lea$e.
---

${HEAD}

# ${title}

${system}

## Cómo invocar

Desde \`poc/\`, con el mundo compartido en \`LEASE_DB\`:

\`\`\`
node src/cli/lease.ts ${lower} <herramienta> [--bandera valor ...]
\`\`\`

El catálogo de abajo es completo: **no necesitás \`--help\` ni listar nada**. Una bandera de tipo
\`array\` u \`object\` se pasa como JSON entre comillas simples, en una sola cadena.

Los identificadores no se inventan — salen de la salida del paso anterior o de una herramienta de
consulta. Un rechazo del dominio sale por stderr con la regla que lo manda y código 1: es una regla
del negocio, no un error técnico.

## Tus ${tools.length} herramientas

${catalogue}

## Lo que no vas a encontrar

${boundary(actor)}
`
}

// ─── escritura ───────────────────────────────────────────────────────────────

const artifacts = ACTORS.flatMap((actor) => [
  { path: join(ROOT, '.claude', 'agents', `${slug(actor)}.md`), body: subagent(actor) },
  { path: join(ROOT, '.claude', 'skills', slug(actor), 'SKILL.md'), body: skill(actor) },
])

const check = process.argv.includes('--check')
let stale = 0

for (const { path, body } of artifacts) {
  const shown = path.slice(ROOT.length + 1)
  if (check) {
    let current: string | undefined
    try {
      current = readFileSync(path, 'utf8')
    } catch {
      current = undefined
    }
    if (current === body) {
      console.log(`  ✓ ${shown}`)
    } else {
      stale++
      console.log(`  ✗ ${shown} — ${current === undefined ? 'no existe' : 'no corresponde a la definición'}`)
    }
  } else {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, body)
    console.log(`  ${shown}`)
  }
}

if (check && stale > 0) {
  console.log()
  console.log(`${stale} artefacto(s) sin regenerar — corré 'npm run generate' y commiteá.`)
  process.exit(1)
}

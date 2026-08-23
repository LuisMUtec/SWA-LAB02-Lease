/**
 * El guardián de las citas.
 *
 *   node src/cli/citations.ts            — escribe la correspondencia
 *   node src/cli/citations.ts --check    — falla si dejó de valer
 *
 * Cada paso del hilo cita una spec y un número de paso de Stage 1. Esa cita es la afirmación de
 * D4 —que el código construye exactamente la primera etapa del alcance— y hasta ahora no la
 * cuidaba nadie: cuando `001` insertó dos pasos, seis citas quedaron apuntando al lugar equivocado
 * y el build siguió verde.
 *
 * Un guardián no puede verificar significado. Puede verificar tres cosas, y la tercera es la que
 * atrapa lo que pasó:
 *
 *   1. Que el paso citado exista.
 *   2. Que el texto de ese paso sea el que era la última vez que alguien lo leyó — snapshot
 *      versionado, el mismo trato que `evidence/run.txt`. Cuando cambia, el diff muestra el texto
 *      nuevo y obliga a releer; no dice si la correspondencia sigue valiendo, dice que hay que
 *      volver a mirarla.
 *   3. Que **ningún paso de Stage 1 quede sin cubrir en silencio**. Un paso puede no tener paso de
 *      hilo, pero entonces hay que declararlo y decir por qué. Un paso nuevo aparece sin declarar
 *      y esto falla.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { THREAD, UNCOVERED } from '../thread.ts'
import type { SpecId } from '../evidence/transcript.ts'

const ROOT = join(import.meta.dirname, '..', '..', '..')
const SPECS: readonly SpecId[] = ['001', '002', '003']
const LOCK = join(ROOT, 'poc', 'evidence', 'citations.md')

/** Dónde vive cada spec, sin fijar el nombre completo: el prefijo es lo estable. */
function specPath(id: SpecId): string {
  const dir = readdirSync(join(ROOT, 'specs')).find((d) => d.startsWith(`${id}-`))
  if (!dir) throw new Error(`No hay carpeta de spec para ${id}`)
  return join(ROOT, 'specs', dir, 'spec.md')
}

/**
 * Los pasos numerados de `### Stage 1`, hasta el siguiente encabezado.
 *
 * Cada paso es una línea. Si alguna spec empieza a partirlos en varias, esto los truncaría en
 * silencio — por eso además se comprueba que la numeración sea 1..N sin huecos.
 */
function stage1(id: SpecId): readonly string[] {
  const lines = readFileSync(specPath(id), 'utf8').split('\n')
  const from = lines.findIndex((l) => l.startsWith('### Stage 1'))
  if (from < 0) throw new Error(`${id}: no hay sección '### Stage 1'`)
  const rest = lines.slice(from + 1)
  const to = rest.findIndex((l) => l.startsWith('### '))
  const section = to < 0 ? rest : rest.slice(0, to)

  const steps: string[] = []
  for (const line of section) {
    const m = /^(\d+)\.\s+(.*)$/.exec(line)
    if (!m) continue
    if (Number(m[1]) !== steps.length + 1) {
      throw new Error(`${id}: Stage 1 salta del paso ${steps.length} al ${m[1]}`)
    }
    steps.push(m[2]!)
  }
  if (steps.length === 0) throw new Error(`${id}: Stage 1 no tiene pasos numerados`)
  return steps
}

// ─── la correspondencia ──────────────────────────────────────────────────────

interface Problem {
  spec: SpecId
  step: number
  what: string
}

const problems: Problem[] = []
const out: string[] = [
  '# Correspondencia — Stage 1 ↔ el hilo',
  '',
  '<!-- Generado por poc/src/cli/citations.ts. No editar a mano: corré `npm run citations`. -->',
  '',
  'Qué paso del hilo construye cada paso de Stage 1, y con el texto que la spec tenía cuando',
  'alguien lo leyó por última vez. Si un paso de una spec cambia, esto cambia con él y el diff',
  'obliga a releer la correspondencia — no afirma que siga valiendo, afirma que hay que mirarla.',
  '',
]

for (const spec of SPECS) {
  const steps = stage1(spec)
  const declared = UNCOVERED[spec] ?? {}

  out.push(`## \`${spec}\` — ${steps.length} pasos`, '')

  for (const [index, text] of steps.entries()) {
    const number = index + 1
    const carriers = THREAD.filter((s) => s.spec === spec && s.stage1 === number)
    const reason = declared[number]

    if (carriers.length > 0 && reason !== undefined) {
      problems.push({ spec, step: number, what: `declarado sin cubrir, pero ${carriers.map((c) => c.id).join(', ')} lo cita` })
    }
    if (carriers.length === 0 && reason === undefined) {
      problems.push({ spec, step: number, what: 'sin paso de hilo y sin declarar por qué' })
    }

    const by =
      carriers.length > 0
        ? carriers.map((c) => `\`${c.id}\` ${c.actor} — ${c.what}`).join(' · ')
        : `*sin construir* — ${reason ?? '**SIN DECLARAR**'}`

    out.push(`${number}. ${text}`, `   → ${by}`, '')
  }
}

// Una cita a un paso que no existe. Se detecta aparte porque no aparece recorriendo los pasos.
for (const step of THREAD) {
  const total = stage1(step.spec).length
  if (step.stage1 < 1 || step.stage1 > total) {
    problems.push({ spec: step.spec, step: step.stage1, what: `${step.id} cita un paso que no existe (Stage 1 tiene ${total})` })
  }
}

const body = out.join('\n').replace(/\n+$/, '\n')

// ─── salida ──────────────────────────────────────────────────────────────────

const check = process.argv.includes('--check')

for (const p of problems) console.error(`  ✗ ${p.spec}·${String(p.step).padStart(2)}  ${p.what}`)

if (check) {
  let current: string | undefined
  try {
    current = readFileSync(LOCK, 'utf8')
  } catch {
    current = undefined
  }
  if (current !== body) {
    console.error('  ✗ evidence/citations.md no corresponde a las specs de hoy')
    console.error("    Corré 'npm run citations', leé el diff y confirmá que cada paso del hilo")
    console.error('    sigue construyendo lo que su paso de Stage 1 dice.')
    process.exit(1)
  }
  if (problems.length > 0) process.exit(1)
  console.log(`  ✓ ${THREAD.length} citas contra ${SPECS.length} specs — la correspondencia se sostiene`)
} else {
  writeFileSync(LOCK, body)
  console.log(`  evidence/citations.md`)
  if (problems.length > 0) process.exit(1)
}

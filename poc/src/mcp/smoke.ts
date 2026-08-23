/**
 * Prueba de humo de los tres servidores MCP.
 *
 * No necesita Claude Code, ni llave de API, ni red. Comprueba las dos cosas de las que depende el
 * diseño:
 *
 *   1. Cada servidor publica **solo** las herramientas de su actor — el acotamiento vive en el
 *      servidor, no en la confianza de que el cliente respete una allowlist.
 *   2. Los tres procesos comparten estado — lo que Pedro envía es lo que Carlos encuentra.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { TOOLS, type ActorName } from '../agents/tools.ts'

const db = join(mkdtempSync(join(tmpdir(), 'lease-smoke-')), 'lease.db')
const serverPath = new URL('./server.ts', import.meta.url).pathname

let failures = 0
const check = (ok: boolean, what: string) => {
  console.log(`  ${ok ? '✓' : '✗'} ${what}`)
  if (!ok) failures++
}

async function connect(actor: ActorName) {
  const client = new Client({ name: 'smoke', version: '0.1.0' })
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [serverPath, actor],
      env: { ...process.env, LEASE_DB: db } as Record<string, string>,
    }),
  )
  return client
}

const textOf = (result: unknown): string => {
  const content = (result as { content?: { type: string; text?: string }[] }).content ?? []
  return content.map((c) => c.text ?? '').join('')
}

console.log(`Servidores MCP — prueba de humo\n  db: ${db}\n`)

// ─── Pedro ───────────────────────────────────────────────────────────────────
console.log('Pedro')
const pedro = await connect('Pedro')
const pedroTools = (await pedro.listTools()).tools.map((t) => t.name)

// El número sale del catálogo, no de acá: una cifra escrita a mano se desactualiza sola con la
// primera herramienta que alguien agregue, y lo que importa comprobar es que el servidor publique
// **exactamente** la superficie de su actor — ni una de más, ni una de menos.
const pedroExpected = TOOLS.Pedro.length
check(
  pedroTools.length === pedroExpected,
  `publica las ${pedroExpected} herramientas de su actor (${pedroTools.length})`,
)
check(
  TOOLS.Pedro.every((t) => pedroTools.includes(t.name)),
  'publica todas las de Pedro y ninguna ajena',
)
check(!pedroTools.includes('registrar_aprobacion'), 'no publica registrar_aprobacion — 002 es de Carlos')
check(!pedroTools.includes('registrar_entrega'), 'no publica registrar_entrega — 003 es de Julia')

const need = textOf(
  await pedro.callTool({
    name: 'registrar_necesidad_maquinaria',
    arguments: { proyecto: 'Carretera Canta–Huayllay II', descripcion: 'Excavadora 20 t', valorUSD: 128_000 },
  }),
)
check(need.includes('MN-'), `registra la necesidad (${need.trim()})`)

const submitted = textOf(
  await pedro.callTool({
    name: 'enviar_solicitud_leasing',
    arguments: { empresa: 'Constructora Andina S.A.C.', necesidadId: need.split(': ')[1]?.trim() ?? '' },
  }),
)
check(submitted.includes('LR-'), `envía la solicitud (${submitted.trim()})`)
await pedro.close()

// ─── Carlos — otro proceso, mismo mundo ──────────────────────────────────────
console.log('\nCarlos')
const carlos = await connect('Carlos')
const carlosTools = (await carlos.listTools()).tools.map((t) => t.name)

check(carlosTools.includes('registrar_aprobacion'), 'publica registrar_aprobacion')
check(!carlosTools.includes('registrar_entrega'), 'no publica registrar_entrega — 002 FR-021')
check(
  !carlosTools.some((t) => t.startsWith('cerrar_despliegue')),
  'no publica nada que cierre un despliegue — 002 FR-021',
)

const waiting = textOf(await carlos.callTool({ name: 'listar_solicitudes_pendientes', arguments: {} }))
check(
  waiting.includes('Constructora Andina'),
  've la solicitud que Pedro envió desde otro proceso — el estado es compartido',
)
await carlos.close()

// ─── Julia ───────────────────────────────────────────────────────────────────
console.log('\nJulia')
const julia = await connect('Julia')
const juliaTools = (await julia.listTools()).tools.map((t) => t.name)

check(juliaTools.includes('registrar_entrega'), 'publica registrar_entrega')
check(!juliaTools.includes('registrar_aprobacion'), 'no publica registrar_aprobacion — 003 FR-021')
check(!juliaTools.includes('pagar_cuota'), 'no publica pagar_cuota — no cambia lo que el cliente debe')
await julia.close()

console.log(`\n${failures === 0 ? 'Los tres servidores sirven su superficie y comparten el mundo.' : `${failures} comprobaciones fallaron.`}`)
process.exit(failures === 0 ? 0 : 1)

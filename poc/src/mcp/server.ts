/**
 * Un servidor MCP por actor.
 *
 *   node src/mcp/server.ts Carlos
 *
 * El acotamiento vive **aquí**, no en la configuración del cliente: este proceso solo publica las
 * herramientas de su actor, así que el agente de Carlos no puede llamar a `registrar_entrega`
 * aunque quiera, y la garantía no depende de que el harness respete una allowlist. Eso también es
 * lo que la hace portable a cualquier cliente MCP, no solo a Claude Code.
 *
 * Tres servidores son tres procesos, así que el mundo vive en SQLite: lo que Carlos aprueba tiene
 * que ser lo que Julia entrega. Cada llamada abre el mundo, actúa y confirma.
 *
 * stdout es el transporte MCP — nada se imprime ahí. Los diagnósticos van por stderr.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { sqliteWorld } from '../adapters/sqlite/world.ts'
import { TOOLS, type ActorName } from '../agents/tools.ts'
import { verifyAuthority } from '../agents/authority.ts'

const ACTORS: readonly ActorName[] = ['Pedro', 'Carlos', 'Julia']

const actor = process.argv[2] as ActorName
if (!ACTORS.includes(actor)) {
  console.error(`Uso: node src/mcp/server.ts <${ACTORS.join('|')}>`)
  process.exit(1)
}

// La frontera se comprueba antes de publicar nada. Si estuviera rota, el servidor no arranca.
const violations = verifyAuthority()
if (violations.length > 0) {
  for (const v of violations) console.error(`✗ ${v.actor} sostiene ${v.tool} — ${v.cite}`)
  process.exit(1)
}

const dbPath = process.env['LEASE_DB'] ?? 'lease.db'

const server = new McpServer({ name: `lease-${actor.toLowerCase()}`, version: '0.1.0' })

for (const tool of TOOLS[actor]) {
  server.registerTool(
    tool.name,
    { description: tool.description, inputSchema: tool.shape },
    (args: unknown) => {
      const world = sqliteWorld(dbPath)
      try {
        const text = tool.run(world, args)
        world.commit()
        return { content: [{ type: 'text' as const, text }] }
      } catch (error) {
        // Un rechazo del dominio es una regla de negocio, y vuelve citándola. El agente la reporta;
        // no la rodea.
        const message = error instanceof Error ? error.message : String(error)
        return { content: [{ type: 'text' as const, text: message }], isError: true }
      }
    },
  )
}

console.error(`lease-${actor.toLowerCase()}: ${TOOLS[actor].length} herramientas · db ${dbPath}`)
await server.connect(new StdioServerTransport())

/**
 * Adaptador al SDK de Anthropic.
 *
 * Envuelve las definiciones neutrales de `tools.ts` en herramientas del tool runner. El mundo vive
 * en el proceso, así que `commit()` es no-op; el adaptador MCP, en cambio, abre uno por llamada.
 */

import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'

import type { World } from '../ports/world.ts'
import { TOOLS, type ActorName } from './tools.ts'

export function betaToolsFor(actor: ActorName, world: World) {
  return TOOLS[actor].map((tool) =>
    betaZodTool({
      name: tool.name,
      description: tool.description,
      inputSchema: z.object(tool.shape),
      run: (input) => {
        const out = tool.run(world, input)
        world.commit()
        return out
      },
    }),
  )
}

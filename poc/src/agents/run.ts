/**
 * El bucle. Corre un turno de un agente sobre el mundo compartido y devuelve lo que hizo.
 */

import Anthropic from '@anthropic-ai/sdk'

import { ROSTER } from './roster.ts'
import type { ActorName } from './tools.ts'
import type { World } from '../ports/world.ts'
import { betaToolsFor } from './sdk-adapter.ts'

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

export interface ToolCall {
  name: string
  input: unknown
}

export interface TurnResult {
  actor: ActorName
  text: string
  calls: readonly ToolCall[]
  inputTokens: number
  outputTokens: number
}

export class MissingCredentials extends Error {}

export function createClient(): Anthropic {
  if (!process.env['ANTHROPIC_API_KEY']) {
    throw new MissingCredentials(
      'Falta ANTHROPIC_API_KEY.\n' +
        '  Crea una cuenta en console.anthropic.com (trae USD 5 de crédito) y exporta la llave:\n' +
        '    export ANTHROPIC_API_KEY=sk-ant-...\n' +
        '  El hilo determinista (`npm run demo`) no necesita llave y sigue corriendo.',
    )
  }
  return new Anthropic()
}

export async function runTurn(
  client: Anthropic,
  world: World,
  actor: ActorName,
  brief: string,
  effort: Effort,
): Promise<TurnResult> {
  const calls: ToolCall[] = []

  const runner = client.beta.messages.toolRunner({
    model: 'claude-opus-5',
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: { effort },
    system: ROSTER[actor].system,
    // Aquí ocurre el acotamiento: el agente solo ve las herramientas de su superficie.
    tools: betaToolsFor(actor, world),
    messages: [{ role: 'user', content: brief }],
  })

  let inputTokens = 0
  let outputTokens = 0

  for await (const message of runner) {
    inputTokens += message.usage.input_tokens
    outputTokens += message.usage.output_tokens
    for (const block of message.content) {
      if (block.type === 'tool_use') calls.push({ name: block.name, input: block.input })
    }
  }

  const final = await runner.done()
  const text = final.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()

  return { actor, text, calls, inputTokens, outputTokens }
}

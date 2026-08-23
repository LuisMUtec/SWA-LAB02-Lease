/**
 * La corrida.
 *
 *   npm run demo              — la transcripción en pantalla
 *   npm run demo:evidence     — la misma, sin color, versionada en evidence/run.txt
 *   npm run demo -- --strict  — falla si algún paso sigue sin construir (para la entrega)
 */

import { runThread } from '../evidence/transcript.ts'
import { memoryWorld } from '../adapters/memory/world.ts'
import { THREAD } from '../thread.ts'

const argv = process.argv.slice(2)

const code = await runThread('Lea$e — POC · Stage 1 de extremo a extremo', memoryWorld(), THREAD, {
  color: !argv.includes('--no-color') && process.stdout.isTTY,
  strict: argv.includes('--strict'),
})

process.exit(code)

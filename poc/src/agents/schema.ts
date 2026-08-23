/**
 * Cómo se lee y se muestra un esquema de herramienta.
 *
 * Lo comparten el CLI —que lo imprime en `--help`— y el generador de artefactos de Claude Code
 * —que lo escribe en el catálogo de cada skill—. Una sola forma de describir una bandera, para que
 * lo que el agente lee en el skill sea literalmente lo que el `--help` le diría.
 */

import type { z } from 'zod'

import type { ToolDef } from './tools.ts'

/**
 * `ZodRawShape` guarda los campos como el tipo del núcleo, sin los métodos públicos. Se recuperan
 * aquí, en un solo punto, para que quien las use trabaje con `ZodType` normal.
 */
export const fields = (tool: ToolDef): [string, z.ZodType][] => Object.entries(tool.shape) as [string, z.ZodType][]
export const field = (tool: ToolDef, name: string): z.ZodType | undefined =>
  tool.shape[name] as z.ZodType | undefined

type Def = { type?: string; element?: z.ZodType; shape?: Record<string, z.ZodType> }
const defOf = (schema: z.ZodType): Def => (schema as unknown as { def?: Def }).def ?? {}
export const typeOf = (schema: z.ZodType): string => defOf(schema).type ?? '?'

/**
 * La forma que hay que escribir para satisfacer un esquema.
 *
 * `<array>` a secas no le sirve a nadie: un agente con la instruccion de no inventar nada se queda
 * sin manera de averiguar que lleva adentro, y termina probando formatos hasta acertar. Esto baja
 * hasta el elemento y devuelve algo copiable.
 */
export function shapeOf(schema: z.ZodType): string {
  const def = defOf(schema)
  switch (def.type) {
    case 'array':
      return def.element ? `[${shapeOf(def.element)}, ...]` : '[...]'
    case 'object': {
      const inner = Object.entries(def.shape ?? {}).map(([k, v]) => `"${k}": ${shapeOf(v)}`)
      return `{${inner.join(', ')}}`
    }
    case 'string':
      return '"texto"'
    case 'number':
      return '123'
    case 'boolean':
      return 'true|false'
    default:
      return `<${def.type ?? '?'}>`
  }
}

/** Las descripciones de los campos anidados, que de otro modo no se ven en ninguna parte. */
export function innerHints(schema: z.ZodType, path: string): string[] {
  const def = defOf(schema)
  if (def.type === 'array' && def.element) return innerHints(def.element, `${path}[]`)
  if (def.type === 'object') {
    return Object.entries(def.shape ?? {}).flatMap(([k, v]) =>
      v.description ? [`      ${path}.${k} — ${v.description}`] : [],
    )
  }
  return []
}

/** Las banderas de una herramienta, una por línea, con su tipo y lo que se sabe de ella. */
export function flagLines(tool: ToolDef, indent = '  '): string[] {
  const lines: string[] = []
  for (const [name, schema] of fields(tool)) {
    const hint = schema.description ? ` — ${schema.description}` : ''
    const nested = typeOf(schema) === 'array' || typeOf(schema) === 'object'
    lines.push(`${indent}--${name} <${typeOf(schema)}>${hint}`)
    if (nested) {
      // Una bandera anidada se pasa como JSON en una sola cadena. Se muestra tal cual se escribe.
      lines.push(`${indent}    forma: '${shapeOf(schema)}'`)
      lines.push(...innerHints(schema, `--${name}`).map((h) => `${indent}    ${h.trimStart()}`))
    }
  }
  return lines
}

export function describeTool(tool: ToolDef): string {
  return [`${tool.name}`, ``, `  ${tool.description}`, ``, ...flagLines(tool)].join('\n')
}

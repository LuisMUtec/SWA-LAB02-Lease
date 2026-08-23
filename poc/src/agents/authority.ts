/**
 * La frontera de autoridad, como dato verificable.
 *
 * En el dominio, la separación de funciones se cumple por ausencia: `underwriting.ts` no exporta
 * nada que toque la flota y `fleet.ts` nada que decida una operación. Con agentes, esa misma
 * frontera se vuelve el límite de lo que cada uno puede *ver*.
 *
 *   FR-021 de `002` — el sistema no le da al analista capacidad de liberar, entregar ni recuperar
 *                     una máquina. El agente de Carlos no ve `registrar_entrega`.
 *   FR-021 de `003` — el sistema no le da a la responsable de flota capacidad de declarar un
 *                     incumplimiento ni de cambiar lo que se debe. El agente de Julia no ve
 *                     `registrar_aprobacion` ni `pagar_cuota`.
 *
 * La frontera del dominio, la de los actores y la de las herramientas son la misma línea, en tres
 * capas. Esto lo comprueba, y corre sin llave de API.
 */

import { toolNames, type ActorName } from './tools.ts'

/** A qué superficie del negocio pertenece cada herramienta. */
export type Surface = 'cliente' | 'decision' | 'flota'

export const SURFACE_OF: Readonly<Record<string, Surface>> = {
  // Actos de la empresa cliente sobre su propia operación.
  registrar_necesidad_maquinaria: 'cliente',
  enviar_solicitud_leasing: 'cliente',
  consultar_estado_solicitud: 'cliente',
  confirmar_recepcion_maquina: 'cliente',
  ver_cuotas: 'cliente',
  pagar_cuota: 'cliente',
  consultar_opcion_adquisicion: 'cliente',
  ejercer_opcion_adquisicion: 'cliente',

  // Actos que deciden una operación o fijan lo que se debe.
  listar_solicitudes_pendientes: 'decision',
  tomar_solicitud: 'decision',
  registrar_elegibilidad: 'decision',
  registrar_standing_crediticio: 'decision',
  registrar_proyecto: 'decision',
  registrar_pagador: 'decision',
  revisar_evidencia: 'decision',
  consultar_limite_autoridad: 'decision',
  registrar_aprobacion: 'decision',
  producir_calendario_cuotas: 'decision',
  certificar_hito: 'decision',

  // Actos sobre la máquina física.
  incorporar_maquina_flota: 'flota',
  registrar_entrega: 'flota',
  listar_despliegues_abiertos: 'flota',
  registrar_lectura_horas: 'flota',
  acordar_ventana_servicio: 'flota',
  completar_servicio: 'flota',
  consultar_final_despliegue: 'flota',
  cerrar_despliegue_por_adquisicion: 'flota',
}

/** Qué superficie le corresponde a cada actor. Exactamente una: ahí está el punto. */
export const SURFACE_OF_ACTOR: Readonly<Record<ActorName, Surface>> = {
  Pedro: 'cliente',
  Carlos: 'decision',
  Julia: 'flota',
}

/** Los cruces que dos specs prohíben expresamente, con la cita que los prohíbe. */
export const FORBIDDEN_CROSSINGS: readonly {
  actor: ActorName
  surface: Surface
  cite: string
  why: string
}[] = [
  {
    actor: 'Carlos',
    surface: 'flota',
    cite: '002 FR-021',
    why: 'decidir prestar y prestar no pueden ser el acto de la misma persona',
  },
  {
    actor: 'Julia',
    surface: 'decision',
    cite: '003 FR-021',
    why: 'ella ejecuta sobre la máquina; nunca decide que un cliente dejó de pagar',
  },
]

export interface Violation {
  actor: ActorName
  tool: string
  surface: Surface
  cite: string
}

/** Verifica que ningún agente sostenga una herramienta fuera de su superficie. */
export function verifyAuthority(): readonly Violation[] {
  const violations: Violation[] = []
  const actors: readonly ActorName[] = ['Pedro', 'Carlos', 'Julia']

  for (const actor of actors) {
    const own = SURFACE_OF_ACTOR[actor]
    for (const tool of toolNames(actor)) {
      const surface = SURFACE_OF[tool]
      if (surface === undefined) {
        violations.push({ actor, tool, surface: own, cite: 'sin superficie declarada' })
        continue
      }
      if (surface !== own) {
        const crossing = FORBIDDEN_CROSSINGS.find(
          (c) => c.actor === actor && c.surface === surface,
        )
        violations.push({ actor, tool, surface, cite: crossing?.cite ?? 'fuera de su superficie' })
      }
    }
  }

  return violations
}

/**
 * Estado compartido entre procesos.
 *
 * Los tres servidores MCP son procesos distintos, así que el mundo no puede vivir en memoria: lo
 * que Carlos aprueba tiene que ser lo que Julia entrega. Esto lo guarda en un SQLite que Node trae
 * incorporado — cero dependencias.
 *
 * Es un almacén de POC, no un modelo de datos: guarda el mundo entero como un documento y lo
 * reescribe en cada commit. Con un caso y un usuario alcanza y sobra, y cuando haga falta un
 * esquema real entra detrás de estos mismos puertos sin tocar el dominio.
 */

import { DatabaseSync } from 'node:sqlite'

import type { LeasingRequest, LeasingRequestId, MachineryNeed, MachineryNeedId } from '../../domain/leasing.ts'
import { statusOf } from '../../domain/leasing.ts'
import type { Assessment, AssessmentId, CertificationMilestone } from '../../domain/underwriting.ts'
import type { LeasingOperation, OperationId } from '../../domain/operation.ts'
import type { Deployment, DeploymentId, Machine, MachineId } from '../../domain/fleet.ts'
import type { World } from '../../ports/world.ts'

interface Snapshot {
  counter: number
  milestones: CertificationMilestone[]
  needs: MachineryNeed[]
  requests: LeasingRequest[]
  assessments: Assessment[]
  operations: LeasingOperation[]
  machines: Machine[]
  deployments: Deployment[]
}

const EMPTY: Snapshot = {
  counter: 0,
  milestones: [],
  needs: [],
  requests: [],
  assessments: [],
  operations: [],
  machines: [],
  deployments: [],
}

/**
 * Las fechas no sobreviven un viaje por JSON; se marcan para poder revivirlas.
 *
 * El valor hay que leerlo del contenedor y no del argumento: `JSON.stringify` invoca `toJSON()`
 * antes que el replacer, así que para cuando llega aquí una `Date` ya es un string y un
 * `value instanceof Date` no acierta nunca. Sin esto el marcador no se escribía, el reviver no
 * disparaba y toda fecha volvía como texto — con lo que `at < window.from` comparaba `Date` contra
 * string, coaccionaba a NaN y daba falso en ambos sentidos: la ventana de servicio dejaba pasar
 * cualquier cosa.
 */
const replacer = function (this: Record<string, unknown>, key: string, value: unknown): unknown {
  const raw = this[key]
  return raw instanceof Date ? { $date: raw.toISOString() } : value
}

const reviver = (_key: string, value: unknown): unknown => {
  if (value && typeof value === 'object' && '$date' in value) {
    return new Date((value as { $date: string }).$date)
  }
  return value
}

/** Upsert por identidad sobre un arreglo. */
function put<T extends { id: string }>(rows: T[], row: T): void {
  const at = rows.findIndex((r) => r.id === row.id)
  if (at >= 0) rows[at] = row
  else rows.push(row)
}

export function sqliteWorld(path: string, now = new Date('2026-08-19T00:00:00.000Z')): World {
  const db = new DatabaseSync(path)
  db.exec('CREATE TABLE IF NOT EXISTS world (id INTEGER PRIMARY KEY CHECK (id = 1), doc TEXT NOT NULL)')

  const row = db.prepare('SELECT doc FROM world WHERE id = 1').get() as { doc: string } | undefined
  const snap: Snapshot = row ? { ...EMPTY, ...(JSON.parse(row.doc, reviver) as Snapshot) } : { ...EMPTY }

  // `Object.freeze` no sobrevive la serialización, y el acta de entrega tiene que seguir siendo
  // inalterable después de recargarse: ahí está todo su valor.
  for (const deployment of snap.deployments) Object.freeze(deployment.handover)

  return {
    clock: { now: () => now },

    ids: { next: (prefix) => `${prefix}-${String(++snap.counter).padStart(4, '0')}` },

    milestones: {
      all: () => snap.milestones,
      replace: (milestones) => void (snap.milestones = [...milestones]),
      byName: (name) => snap.milestones.find((m) => m.name === name),
    },

    needs: {
      save: (need) => put(snap.needs, need),
      byId: (id: MachineryNeedId) => snap.needs.find((n) => n.id === id),
    },

    requests: {
      save: (request) => put(snap.requests, request),
      byId: (id: LeasingRequestId) => snap.requests.find((r) => r.id === id),
      awaitingDecision: () => snap.requests.filter((r) => statusOf(r) === 'pending'),
    },

    assessments: {
      save: (assessment) => put(snap.assessments, assessment),
      byId: (id: AssessmentId) => snap.assessments.find((a) => a.id === id),
      byRequest: (id: LeasingRequestId) => snap.assessments.find((a) => a.requestId === id),
    },

    operations: {
      save: (operation) => put(snap.operations, operation),
      byId: (id: OperationId) => snap.operations.find((o) => o.id === id),
      byRequest: (id: LeasingRequestId) => snap.operations.find((o) => o.requestId === id),
    },

    machines: {
      save: (machine) => put(snap.machines, machine),
      byId: (id: MachineId) => snap.machines.find((m) => m.id === id),
    },

    deployments: {
      save: (deployment) => put(snap.deployments, deployment),
      byId: (id: DeploymentId) => snap.deployments.find((d) => d.id === id),
      open: () => snap.deployments.filter((d) => !d.close),
    },

    commit: () => {
      db.prepare('INSERT INTO world (id, doc) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET doc = excluded.doc').run(
        JSON.stringify(snap, replacer),
      )
    },
  }
}

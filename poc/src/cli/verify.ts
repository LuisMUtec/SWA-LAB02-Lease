/**
 * La comprobación de extremo a extremo: en qué estado quedó el mundo.
 *
 *   node src/cli/verify.ts --solicitud LR-0002 --operacion OP-0004 \
 *                          --despliegue DP-0006 --maquina MQ-0005
 *
 * `scripts/happy-path.sh` recorre Stage 1 por línea de comandos, un proceso por paso. Que ningún
 * comando devuelva error no dice nada sobre el resultado: dice que nada explotó. Esto abre el
 * mundo en un proceso nuevo —la primera lectura que no comparte memoria con ninguna escritura— y
 * afirma el desenlace regla por regla.
 *
 * Las siete reglas que Stage 1 ejerce tienen que quedar afirmadas por algo. Si una queda sin
 * cubrir, esto falla: una prueba que no puede fallar no es evidencia de nada.
 */

import { sqliteWorld } from '../adapters/sqlite/world.ts'
import { BUSINESS_RULES, STAGE_1_RULES, type BusinessRule } from '../domain/rules.ts'
import { check, CheckFailed } from '../evidence/transcript.ts'
import { statusOf } from '../domain/leasing.ts'
import type { LeasingRequestId } from '../domain/leasing.ts'
import { AUTHORITY_LIMIT_USD, isFullyEvidenced } from '../domain/underwriting.ts'
import { acquisitionOptionStatus, operationState, paidCount, pendingCount } from '../domain/operation.ts'
import type { OperationId } from '../domain/operation.ts'
import { headingFor } from '../domain/fleet.ts'
import type { DeploymentId, MachineId } from '../domain/fleet.ts'

const argv = process.argv.slice(2)
const flag = (name: string): string => {
  const i = argv.indexOf(`--${name}`)
  const value = i >= 0 ? argv[i + 1] : undefined
  if (!value) {
    console.error(`Falta --${name}`)
    process.exit(2)
  }
  return value
}
const color = !argv.includes('--no-color')
const c = (code: string, text: string) => (color ? `\x1b[${code}m${text}\x1b[0m` : text)

const world = sqliteWorld(process.env['LEASE_DB'] ?? 'lease.db')

const request = world.requests.byId(flag('solicitud') as LeasingRequestId)
const operation = world.operations.byId(flag('operacion') as OperationId)
const deployment = world.deployments.byId(flag('despliegue') as DeploymentId)
const machine = world.machines.byId(flag('maquina') as MachineId)

if (!request || !operation || !deployment || !machine) {
  console.error('El mundo no contiene lo que la corrida dice haber creado.')
  process.exit(1)
}
const assessment = world.assessments.byRequest(request.id)
if (!assessment) {
  console.error(`No hay expediente para ${request.id}.`)
  process.exit(1)
}
const milestones = world.milestones.all()
const certifiedOf = (id: string) => milestones.find((m) => m.id === id)?.certifiedAt

interface Assertion {
  /** La regla que esta afirmación cubre. Sin regla, es una afirmación de coherencia. */
  rule?: BusinessRule
  what: string
  run: () => void
}

const ASSERTIONS: readonly Assertion[] = [
  // ── La decisión ───────────────────────────────────────────────────────────
  {
    rule: 'BR-02',
    what: 'el solicitante quedó registrado como empresa que trabaja por proyecto',
    run: () => check(assessment.eligibility?.worksByProject === true, 'la elegibilidad no lo afirma'),
  },
  {
    what: 'el expediente quedó plenamente evidenciado antes de decidirse',
    run: () => check(isFullyEvidenced(assessment), 'falta evidencia exigida'),
  },
  {
    what: 'la decisión se tomó dentro del límite de autoridad',
    run: () => {
      check(assessment.machineryValueUSD <= AUTHORITY_LIMIT_USD, 'el valor excede el límite y aun así se decidió')
      check(assessment.decision?.outcome === 'approved', 'la decisión no es una aprobación')
    },
  },
  {
    what: 'la aprobación lleva razón y condiciones',
    run: () => {
      check(!!assessment.decision?.reason, 'la aprobación no dice por qué')
      check(!!assessment.decision?.conditions, 'una aprobación sin condiciones no es la decisión')
    },
  },
  {
    what: 'la solicitud le quedó a Pedro como «approved»',
    run: () => check(statusOf(request) === 'approved', `quedó ${statusOf(request)}`),
  },

  // ── El calendario y los pagos ─────────────────────────────────────────────
  {
    rule: 'BR-04',
    what: 'cada cuota está anclada a un hito, y ese hito se certificó',
    run: () => {
      check(operation.instalments.length > 0, 'la operación no tiene cuotas')
      for (const i of operation.instalments) {
        check(!!i.anchoredTo, `la cuota ${i.id} no lleva ancla`)
        check(!!certifiedOf(i.anchoredTo), `la cuota ${i.id} se pagó sin certificarse «${i.anchoredTo}»`)
      }
    },
  },
  {
    rule: 'BR-08',
    what: 'la recepción se confirmó, que es lo que hizo exigibles las cuotas',
    run: () => check(!!operation.receiptConfirmedAt, 'no hay recepción confirmada y hay cuotas pagadas'),
  },
  {
    what: 'las cuotas están todas pagadas',
    run: () => {
      check(pendingCount(operation) === 0, `quedan ${pendingCount(operation)} pendientes`)
      check(paidCount(operation) === operation.instalments.length, 'la cuenta de pagadas no cuadra')
    },
  },

  // ── La máquina ────────────────────────────────────────────────────────────
  {
    rule: 'BR-05',
    what: 'la entrega tiene acta aceptada por ambos lados, con custodio y sitio',
    run: () => {
      const h = deployment.handover
      check(!!h.acceptedByClient && !!h.acceptedByLease, 'el acta no la aceptaron ambos lados')
      check(!!h.custodian, 'nadie quedó nombrado como custodio')
      check(!!h.contractedSite, 'no consta el sitio contratado')
      check(!!h.condition, 'no consta la condición de entrega')
    },
  },
  {
    what: 'el acta de entrega quedó inalterable',
    run: () => check(Object.isFrozen(deployment.handover), 'el acta se puede reescribir'),
  },
  {
    rule: 'BR-06',
    what: 'el acumulado es la marca más alta, y el servicio se completó dentro de su ventana',
    run: () => {
      // El dominio conserva una lectura menor a propósito —ocurrió— y solo promete que el
      // acumulado no baja. La afirmación es sobre el contador, no sobre el orden de las lecturas.
      const marks = [deployment.handover.hours, ...deployment.readings.map((r) => r.hours)]
      check(deployment.readings.length > 0, 'no se registró ninguna lectura de horas')
      check(
        machine.accumulatedHours === Math.max(...marks),
        `el acumulado es ${machine.accumulatedHours} y la marca más alta es ${Math.max(...marks)}`,
      )
      check(deployment.serviceWindows.length > 0, 'no se acordó ninguna ventana de servicio')
      for (const w of deployment.serviceWindows) {
        check(!!w.completedAt, 'quedó una ventana sin servicio hecho')
        // Las fechas tienen que volver como fechas: comparar `Date` contra string coacciona a NaN
        // y la guarda de ventana deja pasar cualquier cosa. Ver «Lo que el CLI destapó».
        check(w.from instanceof Date && w.to instanceof Date, 'la ventana no volvió como fechas')
        check(w.completedAt! >= w.from && w.completedAt! <= w.to, 'el servicio quedó fuera de su ventana')
      }
      check(machine.hoursAtLastService > 0, 'el intervalo no cuenta desde el último servicio')
    },
  },

  // ── El cierre ─────────────────────────────────────────────────────────────
  {
    rule: 'BR-07',
    what: 'pagadas todas, la opción se abrió y el cliente la ejerció',
    run: () => {
      check(acquisitionOptionStatus(operation) === 'available', 'la opción no está disponible')
      check(!!operation.acquisitionExercisedAt, 'la opción no se ejerció')
      check(operationState(operation) === 'completed', `la operación quedó ${operationState(operation)}`)
      check(headingFor(operation) === 'Acquisition Retirement', 'el despliegue no apuntaba a la adquisición')
    },
  },
  {
    rule: 'BR-01',
    what: 'la máquina fue de Lea$e hasta el cierre, y salió de la flota al adquirirse',
    run: () => {
      check(deployment.close?.kind === 'Acquisition Retirement', 'el despliegue no cerró por adquisición')
      check(machine.fleetState === 'retired', `la máquina quedó ${machine.fleetState}`)
    },
  },
  {
    what: 'el despliegue corresponde a la operación y a la máquina de la corrida',
    run: () => {
      check(deployment.operationId === operation.id, 'el despliegue apunta a otra operación')
      check(deployment.machineId === machine.id, 'el despliegue apunta a otra máquina')
      check(operation.requestId === request.id, 'la operación apunta a otra solicitud')
    },
  },
]

// ─── corrida ─────────────────────────────────────────────────────────────────

console.log(c('1', 'Estado final — leído en un proceso nuevo'))
console.log()

let failed = 0
const covered = new Set<BusinessRule>()

for (const a of ASSERTIONS) {
  try {
    a.run()
    if (a.rule) covered.add(a.rule)
    console.log(`  ${c('32', '✓')} ${c('33', (a.rule ?? '').padEnd(6))} ${a.what}`)
  } catch (error) {
    failed++
    const detail = error instanceof CheckFailed ? error.message : String(error)
    console.log(`  ${c('31', '✗')} ${c('33', (a.rule ?? '').padEnd(6))} ${a.what}`)
    console.log(`      ${c('31', detail)}`)
    if (a.rule) console.log(`      ${c('2', `${a.rule} — ${BUSINESS_RULES[a.rule]}`)}`)
  }
}

const missing = STAGE_1_RULES.filter((r) => !covered.has(r))

console.log()
console.log(`  ${ASSERTIONS.length} afirmaciones · ${ASSERTIONS.length - failed} sostenidas · ${failed} rotas`)
console.log(`  Reglas cubiertas: ${covered.size}/${STAGE_1_RULES.length}${missing.length ? c('2', `  — faltan ${missing.join(' ')}`) : ''}`)

if (failed > 0 || missing.length > 0) {
  console.log()
  console.log(c('31', failed > 0 ? 'El estado final no es el que Stage 1 describe.' : 'Hay reglas de Stage 1 que nada afirma.'))
  process.exit(1)
}

console.log()
console.log(c('32', 'El estado final es el que Stage 1 describe, y las siete reglas quedan afirmadas.'))

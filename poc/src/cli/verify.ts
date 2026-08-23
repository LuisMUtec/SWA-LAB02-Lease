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
 * Las reglas que Stage 1 ejerce tienen que quedar afirmadas por algo — `STAGE_1_RULES` las
 * enumera. Si una queda sin cubrir, esto falla: una prueba que no puede fallar no es evidencia
 * de nada.
 */

import { sqliteWorld } from '../adapters/sqlite/world.ts'
import { BUSINESS_RULES, STAGE_1_RULES, type BusinessRule } from '../domain/rules.ts'
import { check, CheckFailed } from '../evidence/transcript.ts'
import { statusOf } from '../domain/leasing.ts'
import type { LeasingRequestId } from '../domain/leasing.ts'
import {
  AUTHORITY_LIMIT_USD,
  DOWN_PAYMENT_CAP,
  isFullyEvidenced,
  machineryValueOf,
} from '../domain/underwriting.ts'
import {
  acquisitionOptionStatus,
  acquisitionWindowEnds,
  conditionsSettled,
  installmentState,
  operationState,
  paidCount,
  unpaidCount,
  unsettledConditions,
} from '../domain/operation.ts'
import type { OperationId } from '../domain/operation.ts'
import { currentAssessedValue, headingFor } from '../domain/fleet.ts'
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
      check(machineryValueOf(assessment) <= AUTHORITY_LIMIT_USD, 'el valor excede el límite y aun así se decidió')
      check(assessment.decision?.outcome === 'approved', 'la decisión no es una aprobación')
    },
  },
  {
    what: 'el valor sobre el que se decidió es el que el analista confirmó, no el declarado',
    run: () => {
      const confirmed = assessment.machineryValueConfirmation
      check(confirmed !== undefined, 'nadie confirmó el valor que el solicitante declaró')
      check(Boolean(confirmed.note), 'la confirmación no dice contra qué se confirmó')
      check(
        machineryValueOf(assessment) === confirmed.amountUSD,
        'el valor que decide no es el confirmado',
      )
      check(
        confirmed.amountUSD === assessment.machineryValueStatedUSD,
        'el confirmado y el declarado difieren, y Stage 1 no admite esa discrepancia',
      )
    },
  },
  {
    rule: 'BR-12',
    what: 'el inicial que la aprobación fijó no pasa de un décimo de la máquina',
    run: () => {
      const down = assessment.decision?.conditions?.downPaymentUSD
      check(down !== undefined, 'la aprobación no fijó un pago inicial')
      check(
        down <= machineryValueOf(assessment) * DOWN_PAYMENT_CAP,
        `un inicial de USD ${down.toLocaleString('en-US')} sobre una máquina de ` +
          `USD ${machineryValueOf(assessment).toLocaleString('en-US')}`,
      )
    },
  },
  {
    what: 'las condiciones de la aprobación quedaron liquidadas antes de que corriera el calendario',
    run: () => {
      const c = operation.conditions
      check(c.downPaymentUSD === assessment.decision?.conditions?.downPaymentUSD, 'la operación no lleva el inicial aprobado')
      check(!!c.downPaymentSettledAt, 'el pago inicial nunca se liquidó')
      check(!!c.guaranteesInPlaceAt, 'la garantía nunca quedó en su lugar')
      check(conditionsSettled(operation), `quedó sin liquidar ${unsettledConditions(operation).join(' y ')}`)
      // Y se liquidaron *antes*: una cuota pagada sobre condiciones abiertas sería el calendario
      // corriendo antes de arrancar.
      for (const i of operation.installments) {
        check(!i.paidAt || i.paidAt >= c.downPaymentSettledAt!, `${i.id} se pagó antes de liquidarse el inicial`)
      }
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
      check(operation.installments.length > 0, 'la operación no tiene cuotas')
      for (const i of operation.installments) {
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
    what: 'las cuotas están todas pagadas, y ninguna quedó en otro estado',
    run: () => {
      check(unpaidCount(operation) === 0, `quedan ${unpaidCount(operation)} sin pagar`)
      check(paidCount(operation) === operation.installments.length, 'la cuenta de pagadas no cuadra')
      // `001` exige que toda cuota esté siempre en exactamente uno de `pending`, `due` o `paid`.
      for (const i of operation.installments) {
        check(
          installmentState(i, operation, milestones) === 'paid',
          `${i.id} no quedó en 'paid' sino en '${installmentState(i, operation, milestones)}'`,
        )
      }
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
        // Pedirla y acordarla son dos actos — `003` paso 7. Una ventana servida sin acuerdo del
        // cliente sería Julia fijando cuándo se para una máquina que no está en su terreno.
        check(w.requestedAt instanceof Date, 'la ventana no dice cuándo se pidió')
        check(w.agreed !== undefined, 'la ventana se sirvió sin que el cliente acordara el período')
        check(w.agreed.at >= w.requestedAt, 'el cliente acordó la ventana antes de que se la pidieran')
        check(w.agreed.from instanceof Date && w.agreed.to instanceof Date, 'la ventana no volvió como fechas')
        check(w.completedAt! >= w.agreed.from && w.completedAt! <= w.agreed.to, 'el servicio quedó fuera de su ventana')
      }
      check(machine.hoursAtLastService > 0, 'el intervalo no cuenta desde el último servicio')
    },
  },

  // ── El cierre ─────────────────────────────────────────────────────────────
  {
    rule: 'BR-07',
    what: 'pagadas todas, la opción se abrió y el cliente la ejerció',
    run: () => {
      const at = operation.acquisitionExercisedAt
      check(!!at, 'la opción no se ejerció')
      check(!!operation.optionAvailableSince, 'la opción no registra cuándo se abrió')
      check(
        acquisitionOptionStatus(operation, at) === 'exercised',
        `la opción quedó en ${acquisitionOptionStatus(operation, at)}`,
      )
      // `001` paso 16 fija el nombre del estado terminal, y es éste.
      check(operationState(operation) === 'Acquired', `la operación quedó ${operationState(operation)}`)
      check(
        headingFor(operation, at) === 'Acquisition Retirement',
        'ejercida la opción, el despliegue no apuntaba a la adquisición',
      )
    },
  },
  {
    rule: 'BR-11',
    what: 'la opción se ejerció dentro de los treinta días que se le conceden',
    run: () => {
      const at = operation.acquisitionExercisedAt
      check(!!at, 'la opción no se ejerció')
      const since = operation.optionAvailableSince
      check(!!since, 'la opción no registra cuándo se abrió')
      // Se abre con la última cuota pagada, y no antes: ahí arranca la ventana.
      const lastPaid = operation.installments
        .map((i) => i.paidAt)
        .filter((d): d is Date => d !== undefined)
        .reduce((a, b) => (a > b ? a : b))
      check(since.getTime() === lastPaid.getTime(), 'la ventana no arranca con el pago de la última cuota')
      const ends = acquisitionWindowEnds(operation)
      check(!!ends, 'la opción disponible no dice cuándo caduca')
      check(at >= since && at <= ends, `se ejerció el ${at.toISOString().slice(0, 10)}, fuera de la ventana`)
    },
  },
  {
    what: 'la máquina se valorizó al entregarse y se revaluó al completarse el servicio',
    run: () => {
      // FR-031b pide las dos: la línea de base y la revaluación. Y ninguna la acepta el cliente.
      check(deployment.assessedValues.length >= 2, 'falta una de las dos valorizaciones que FR-031b pide')
      const [first] = deployment.assessedValues
      check(first?.because === 'entrega', 'la primera valorización no es la de entrega')
      check(
        deployment.assessedValues.some((v) => v.because === 'servicio completado'),
        'el servicio se completó sin revaluar la máquina',
      )
      check(currentAssessedValue(deployment).amountUSD > 0, 'la valorización vigente no es un monto')
      check(
        !Object.hasOwn(deployment.handover, 'assessedValueUSD'),
        'el valor estimado quedó dentro del acta que el cliente acepta',
      )
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
console.log(
  c('32', `El estado final es el que Stage 1 describe, y sus ${STAGE_1_RULES.length} reglas quedan afirmadas.`),
)

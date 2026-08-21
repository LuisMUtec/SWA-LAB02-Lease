/**
 * El hilo de Stage 1.
 *
 * Las tres specs se escribieron una por actor, y sus `Phased Scope > Stage 1` no son tres POCs:
 * son una sola corrida. Lo que `001` declara fuera de alcance es exactamente lo que `002` y `003`
 * producen —
 *
 *   · `001` paso 5 dice «la solicitud es aprobada» y manda el razonamiento fuera de alcance;
 *     `002` pasos 3-9 es ese razonamiento.
 *   · `001` paso 9 dice que Pedro ve sus cuotas; `002` paso 10 es quien las produce, ancladas a
 *     hitos de certificación (BR-04).
 *   · `001` pasos 6-8 dicen que la máquina llega y Pedro confirma; `003` pasos 2-3 es la entrega
 *     contra un registro que ambos lados aceptan (BR-05).
 *   · `001` paso 13 dice que Pedro ejerce la opción; `003` paso 10 es la máquina saliendo de la
 *     flota por ese mismo hecho (BR-07).
 *
 * Cada paso cita la spec y el número que le manda. Eso hace que D4 —«su primera etapa es
 * exactamente el happy path que el POC construye»— sea verificable corriendo algo, en vez de
 * afirmable. Si Johar mueve un paso de Stage 1, este archivo deja de corresponder y se nota.
 *
 * Solo happy path. Los tres Stage 1 dicen que nada en ellos supone un rechazo, una demora ni un
 * incumplimiento; un hilo que afirmara caminos negativos ya no sería Stage 1. Las guardas que las
 * reglas imponen viven en el dominio, que es donde son la regla y no una prueba de ella.
 */

import { check, type Step } from './evidence/transcript.ts'
import type { World } from './ports/world.ts'
import type { CompanyId, LeasingRequestId, MachineryNeedId, ProjectId } from './domain/leasing.ts'
import { statusOf } from './domain/leasing.ts'
import type { AssessmentId, CertificationMilestone, MilestoneId } from './domain/underwriting.ts'
import {
  AUTHORITY_LIMIT_USD,
  availableOutcomes,
  certify,
  isFullyEvidenced,
  missingEvidence,
  produceInstalmentSchedule,
  recordDecision,
} from './domain/underwriting.ts'
import type { OperationId } from './domain/operation.ts'
import {
  acquisitionOptionStatus,
  confirmReceipt,
  exerciseAcquisitionOption,
  operationState,
  paidCount,
  payInstalment,
  pendingCount,
} from './domain/operation.ts'
import type { DeploymentId, MachineId } from './domain/fleet.ts'
import {
  agreeServiceWindow,
  closeByAcquisitionRetirement,
  completeService,
  headingFor,
  hoursSinceLastService,
  isServiceDue,
  overdueHours,
  recordHandover,
  recordReading,
} from './domain/fleet.ts'

/**
 * El caso concreto que la corrida recorre.
 *
 * Identificadores y fechas literales, no generados: la transcripción se versiona como evidencia y
 * tiene que salir idéntica en cada corrida.
 *
 * Los pasos van en el orden de las capacidades que los tres Stage 1 enumeran, no en orden
 * cronológico estricto. Cada hecho lleva su propia fecha: la máquina se entrega el 1 de setiembre,
 * su servicio cae a fin de mes por las horas que corrió, y las seis valorizaciones se certifican
 * entre setiembre y febrero.
 */
const CASE = {
  company: 'CO-CONSTRUCTORA-ANDINA' as CompanyId,
  project: 'PR-CARRETERA-CANTA' as ProjectId,
  need: 'MN-EXCAVADORA-20T' as MachineryNeedId,
  request: 'LR-0001' as LeasingRequestId,
  assessment: 'AS-0001' as AssessmentId,
  operation: 'OP-0001' as OperationId,
  machine: 'MQ-EXC-0417' as MachineId,
  deployment: 'DP-0001' as DeploymentId,

  machineryValueUSD: 128_000,
  downPaymentUSD: 25_600,
  serviceIntervalHours: 250,

  handoverAt: new Date('2026-09-01T00:00:00.000Z'),
  readings: [
    { hours: 120, at: new Date('2026-09-12T00:00:00.000Z') },
    { hours: 265, at: new Date('2026-09-25T00:00:00.000Z') },
  ],
  serviceWindow: {
    from: new Date('2026-09-26T00:00:00.000Z'),
    to: new Date('2026-09-30T00:00:00.000Z'),
    completedAt: new Date('2026-09-28T00:00:00.000Z'),
  },
  acquisitionAt: new Date('2027-03-05T00:00:00.000Z'),
} as const

/** Las seis valorizaciones del tramo. BR-04 ancla una cuota a cada una. */
const MILESTONES: readonly CertificationMilestone[] = [
  { id: 'MS-V1' as MilestoneId, name: 'Valorización 1', expectedAt: new Date('2026-09-30T00:00:00.000Z') },
  { id: 'MS-V2' as MilestoneId, name: 'Valorización 2', expectedAt: new Date('2026-10-31T00:00:00.000Z') },
  { id: 'MS-V3' as MilestoneId, name: 'Valorización 3', expectedAt: new Date('2026-11-30T00:00:00.000Z') },
  { id: 'MS-V4' as MilestoneId, name: 'Valorización 4', expectedAt: new Date('2026-12-31T00:00:00.000Z') },
  { id: 'MS-V5' as MilestoneId, name: 'Valorización 5', expectedAt: new Date('2027-01-31T00:00:00.000Z') },
  { id: 'MS-V6' as MilestoneId, name: 'Valorización 6', expectedAt: new Date('2027-02-28T00:00:00.000Z') },
]

function assessment(w: World) {
  const found = w.assessments.byId(CASE.assessment)
  check(found !== undefined, 'la evaluación no existe')
  return found
}

function operation(w: World) {
  const found = w.operations.byId(CASE.operation)
  check(found !== undefined, 'la operación no existe')
  return found
}

function machine(w: World) {
  const found = w.machines.byId(CASE.machine)
  check(found !== undefined, 'la máquina no está en la flota')
  return found
}

function deployment(w: World) {
  const found = w.deployments.byId(CASE.deployment)
  check(found !== undefined, 'el despliegue no existe')
  return found
}

export const THREAD: readonly Step<World>[] = [
  // ─── La solicitud ────────────────────────────────────────────────────────────
  {
    id: 'S01',
    actor: 'Pedro',
    spec: '001',
    stage1: 2,
    what: 'registra la necesidad de maquinaria del proyecto',
    run: (w) => {
      w.needs.save({
        id: CASE.need,
        projectId: CASE.project,
        description: 'Excavadora sobre orugas, 20 t',
        machineryValueUSD: CASE.machineryValueUSD,
      })
      check(w.needs.byId(CASE.need) !== undefined, 'la necesidad registrada no es recuperable')
    },
  },
  {
    id: 'S02',
    actor: 'Pedro',
    spec: '001',
    stage1: 3,
    what: 'envía la solicitud de leasing',
    run: (w) => {
      const need = w.needs.byId(CASE.need)
      check(need !== undefined, 'no se puede solicitar sobre una necesidad que no existe')
      w.requests.save({
        id: CASE.request,
        companyId: CASE.company,
        projectId: need.projectId,
        needId: need.id,
        submittedAt: w.clock.now(),
      })
    },
  },
  {
    id: 'S03',
    actor: 'Pedro',
    spec: '001',
    stage1: 4,
    what: 'consulta el estado: pendiente',
    run: (w) => {
      const request = w.requests.byId(CASE.request)
      check(request !== undefined, 'la solicitud enviada no es recuperable')
      // `001` fija que el estado nunca queda indeterminado: siempre exactamente uno de los tres.
      check(statusOf(request) === 'pending', `estado inesperado: ${statusOf(request)}`)
    },
  },

  // ─── El underwriting ─────────────────────────────────────────────────────────
  {
    id: 'S04',
    actor: 'Carlos',
    spec: '002',
    stage1: 2,
    what: 've la solicitud entre las que lo esperan y la toma',
    run: (w) => {
      // El traspaso de `001` a `002`: lo que Pedro envió es lo que Carlos encuentra esperando.
      const waiting = w.requests.awaitingDecision()
      check(
        waiting.some((r) => r.id === CASE.request),
        'la solicitud enviada no aparece en la bandeja del analista',
      )
      // Tomarla abre exactamente una evaluación, trazable a la solicitud.
      w.assessments.save({
        id: CASE.assessment,
        requestId: CASE.request,
        machineryValueUSD: CASE.machineryValueUSD,
      })
      check(
        w.assessments.byRequest(CASE.request)?.id === CASE.assessment,
        'la evaluación no es trazable a su solicitud',
      )
    },
  },
  {
    id: 'S05',
    actor: 'Carlos',
    spec: '002',
    stage1: 3,
    what: 'registra al solicitante como empresa por proyecto',
    rules: ['BR-02'],
    run: (w) => {
      assessment(w).eligibility = {
        worksByProject: true,
        note: 'Constructora vigente; obra pública adjudicada por concurso',
      }
      check(
        assessment(w).eligibility?.worksByProject === true,
        'la elegibilidad bajo BR-02 no quedó registrada',
      )
    },
  },
  {
    id: 'S06',
    actor: 'Carlos',
    spec: '002',
    stage1: 4,
    what: 'registra el standing crediticio',
    run: (w) => {
      assessment(w).creditStanding = {
        grade: 'Normal',
        note: 'Sin atrasos en los últimos 24 meses; describe el pasado, no este proyecto',
      }
      check(assessment(w).creditStanding !== undefined, 'el standing no quedó adjunto')
    },
  },
  {
    id: 'S07',
    actor: 'Carlos',
    spec: '002',
    stage1: 5,
    what: 'registra el proyecto y su calendario de certificación',
    run: (w) => {
      assessment(w).project = {
        awarded: 'Carretera Canta–Huayllay, tramo II',
        awardedBy: 'Provías Descentralizado',
        amountUSD: 2_400_000,
        schedule: MILESTONES,
      }
      const schedule = assessment(w).project?.schedule ?? []
      check(schedule.length === 6, `se esperaban 6 valorizaciones, hay ${schedule.length}`)
      check(
        schedule.every((m) => m.expectedAt instanceof Date),
        'un hito no dice cuándo se espera certificarlo y pagarlo',
      )
    },
  },
  {
    id: 'S08',
    actor: 'Carlos',
    spec: '002',
    stage1: 6,
    what: 'registra al pagador y su comportamiento de pago',
    run: (w) => {
      assessment(w).payer = {
        name: 'Provías Descentralizado — MTC',
        // Admisible y frecuente: nadie vende un reporte del pagador. Lo inadmisible es no nombrarlo.
        behaviour: 'unknown',
      }
      check(Boolean(assessment(w).payer?.name), 'el pagador quedó sin nombrar')
    },
  },
  {
    id: 'S09',
    actor: 'Lea$e',
    spec: '002',
    stage1: 7,
    what: 'declara el expediente plenamente evidenciado',
    run: (w) => {
      const missing = missingEvidence(assessment(w))
      check(missing.length === 0, `falta evidencia: ${missing.join(', ')}`)
      check(isFullyEvidenced(assessment(w)), 'el expediente no se declara evidenciado')
    },
  },
  {
    id: 'S10',
    actor: 'Lea$e',
    spec: '002',
    stage1: 8,
    what: 'verifica el valor contra el límite de autoridad',
    run: (w) => {
      const value = assessment(w).machineryValueUSD
      check(
        value <= AUTHORITY_LIMIT_USD,
        `USD ${value.toLocaleString('en-US')} excede el límite de USD ${AUTHORITY_LIMIT_USD.toLocaleString('en-US')}`,
      )
      // El límite se siente, no se recuerda: dentro de él, aprobar está disponible.
      check(
        availableOutcomes(assessment(w)).includes('approved'),
        'aprobar no está disponible dentro del límite',
      )
    },
  },
  {
    id: 'S11',
    actor: 'Carlos',
    spec: '002',
    stage1: 9,
    what: 'registra la aprobación con razón y condiciones',
    run: (w) => {
      recordDecision(assessment(w), {
        outcome: 'approved',
        reason:
          'Obra adjudicada con valorizaciones mensuales; el calendario cubre las cuotas y el valor está dentro del límite',
        conditions: {
          downPaymentUSD: CASE.downPaymentUSD,
          termMilestones: MILESTONES.length,
          guarantees: 'Fianza solidaria del accionista principal',
          machineryNeedId: CASE.need,
        },
        decidedBy: 'Carlos',
      })
      // Una aprobación es lo que hace `approved` a la solicitud en los términos de `001`.
      const request = w.requests.byId(CASE.request)
      check(request !== undefined, 'la solicitud desapareció')
      request.decision = 'approved'

      const decision = assessment(w).decision
      check(decision?.conditions !== undefined, 'una aprobación sin condiciones no es la decisión')
      check(Boolean(decision?.reason), 'la decisión quedó sin razón registrada')
    },
  },
  {
    id: 'S12',
    actor: 'Lea$e',
    spec: '002',
    stage1: 10,
    what: 'produce el calendario anclado a hitos',
    rules: ['BR-04'],
    run: (w) => {
      const instalments = produceInstalmentSchedule(assessment(w))
      w.operations.save({
        id: CASE.operation,
        requestId: CASE.request,
        instalments,
      })

      check(instalments.length === MILESTONES.length, 'una valorización quedó sin cuota')
      // Cada cuota nombra el hito cuya certificación la hace exigible, y ninguna una fecha propia.
      for (const instalment of instalments) {
        const milestone = MILESTONES.find((m) => m.id === instalment.anchoredTo)
        check(milestone !== undefined, `la cuota ${instalment.id} no ancla a un hito del proyecto`)
      }
      const financed = CASE.machineryValueUSD - CASE.downPaymentUSD
      const total = instalments.reduce((sum, i) => sum + i.amountUSD, 0)
      check(total === financed, `el calendario suma ${total} y lo financiado es ${financed}`)
    },
  },
  {
    id: 'S13',
    actor: 'Pedro',
    spec: '001',
    stage1: 5,
    what: 'consulta el estado: aprobada',
    run: (w) => {
      const request = w.requests.byId(CASE.request)
      check(request !== undefined, 'la solicitud no es recuperable')
      check(statusOf(request) === 'approved', `estado inesperado: ${statusOf(request)}`)
    },
  },

  // ─── La entrega ──────────────────────────────────────────────────────────────
  {
    id: 'S14',
    actor: 'Lea$e',
    spec: '001',
    stage1: 6,
    what: 'compra la máquina al proveedor',
    rules: ['BR-01'],
    run: (w) => {
      // La máquina entra a la flota de Lea$e, que conserva su propiedad todo el contrato.
      w.machines.save({
        id: CASE.machine,
        description: 'Excavadora sobre orugas, 20 t',
        serviceIntervalHours: CASE.serviceIntervalHours,
        accumulatedHours: 0,
        hoursAtLastService: 0,
        fleetState: 'available',
      })
      check(machine(w).fleetState === 'available', 'la máquina comprada no quedó disponible')
    },
  },
  {
    id: 'S15',
    actor: 'Julia',
    spec: '003',
    stage1: 2,
    what: 'registra la entrega y ambos lados la aceptan',
    rules: ['BR-05'],
    run: (w) => {
      const created = recordHandover(CASE.deployment, machine(w), CASE.operation, {
        condition: 'Operativa; rayaduras menores en pluma, sin fugas',
        hours: 0,
        custodian: 'Rosa Quispe — jefa de equipos de la constructora',
        contractedSite: 'Km 42+500, tramo II',
        acceptedByLease: 'Julia',
        acceptedByClient: 'Rosa Quispe',
        at: CASE.handoverAt,
      })
      w.deployments.save(created)

      check(Boolean(created.handover.custodian), 'la entrega quedó sin custodio nombrado')
      check(Boolean(created.handover.acceptedByLease), 'Lea$e no aceptó el acta')
      check(Boolean(created.handover.acceptedByClient), 'el cliente no aceptó el acta')
    },
  },
  {
    id: 'S16',
    actor: 'Lea$e',
    spec: '003',
    stage1: 3,
    what: 'abre el despliegue y fija el acta de entrega',
    rules: ['BR-05'],
    run: (w) => {
      check(
        w.deployments.open().some((d) => d.id === CASE.deployment),
        'el despliegue no figura entre los abiertos',
      )
      check(machine(w).fleetState === 'deployed', 'la máquina no quedó como desplegada')
      // Fija: la línea de base tiene valor porque nadie puede revisarla después del hecho.
      check(Object.isFrozen(deployment(w).handover), 'el acta de entrega no quedó fijada')
    },
  },
  {
    id: 'S17',
    actor: 'Pedro',
    spec: '001',
    stage1: 8,
    what: 'confirma la recepción: las cuotas se hacen exigibles',
    rules: ['BR-08'],
    run: (w) => {
      confirmReceipt(operation(w), CASE.handoverAt)
      check(
        operation(w).receiptConfirmedAt !== undefined,
        'la recepción no quedó confirmada, y antes de eso nada es exigible',
      )
    },
  },
  {
    id: 'S18',
    actor: 'Pedro',
    spec: '001',
    stage1: 9,
    what: 've sus cuotas y el estado de cada una',
    run: (w) => {
      const op = operation(w)
      check(op.instalments.length === MILESTONES.length, 'no ve todas sus cuotas')
      check(paidCount(op) === 0, 'hay cuotas pagadas antes de tiempo')
      check(pendingCount(op) === MILESTONES.length, 'las pendientes no son todas')
      check(
        acquisitionOptionStatus(op) === 'not yet available',
        'la opción de adquisición no puede estar disponible aún',
      )
    },
  },

  // ─── La máquina trabajando ───────────────────────────────────────────────────
  {
    id: 'S19',
    actor: 'Julia',
    spec: '003',
    stage1: 4,
    what: 'acumula lecturas de horas-motor',
    rules: ['BR-06'],
    run: (w) => {
      for (const reading of CASE.readings) {
        recordReading(deployment(w), machine(w), reading)
      }
      check(deployment(w).readings.length === 2, 'las lecturas no quedaron registradas')
      // Las horas están disponibles para Julia sin tener que pedírselas al sitio.
      check(machine(w).accumulatedHours === 265, `acumuladas inesperadas: ${machine(w).accumulatedHours}`)
    },
  },
  {
    id: 'S20',
    actor: 'Lea$e',
    spec: '003',
    stage1: 5,
    what: 'marca servicio debido al alcanzar el intervalo',
    rules: ['BR-06'],
    run: (w) => {
      // 265 horas corridas contra un intervalo de 250: vence por uso, no por tiempo transcurrido.
      check(hoursSinceLastService(machine(w)) === 265, 'las horas desde el último servicio no cuadran')
      check(isServiceDue(machine(w)), 'la máquina alcanzó su intervalo y no figura como debida')
      check(overdueHours(machine(w)) === 15, `horas de exceso inesperadas: ${overdueHours(machine(w))}`)
    },
  },
  {
    id: 'S21',
    actor: 'Julia',
    spec: '003',
    stage1: 6,
    what: 'la ve entre las que necesitan servicio, con sus horas',
    run: (w) => {
      const due = w.deployments
        .open()
        .map((d) => w.machines.byId(d.machineId))
        .filter((m) => m !== undefined)
        .filter((m) => isServiceDue(m))
      check(due.length === 1, `se esperaba una máquina debida, hay ${due.length}`)
      check(due[0]?.id === CASE.machine, 'la máquina debida no es la desplegada')
      check(due[0]?.accumulatedHours === 265, 'la lista no reporta las horas de la máquina')
    },
  },
  {
    id: 'S22',
    actor: 'Julia',
    spec: '003',
    stage1: 7,
    what: 'acuerda una ventana de servicio con el cliente',
    run: (w) => {
      agreeServiceWindow(deployment(w), CASE.serviceWindow.from, CASE.serviceWindow.to)
      check(deployment(w).serviceWindows.length === 1, 'la ventana no quedó registrada')
    },
  },
  {
    id: 'S23',
    actor: 'Julia',
    spec: '003',
    stage1: 8,
    what: 'completa el servicio dentro de la ventana',
    rules: ['BR-06'],
    run: (w) => {
      const window = deployment(w).serviceWindows[0]
      check(window !== undefined, 'no hay ventana acordada')
      completeService(machine(w), window, CASE.serviceWindow.completedAt, machine(w).accumulatedHours)

      check(!isServiceDue(machine(w)), 'la máquina sigue debiendo servicio')
      // El siguiente intervalo cuenta desde las horas al completarse, no desde la fecha.
      check(machine(w).hoursAtLastService === 265, 'el intervalo no se recontó desde las horas')
      check(hoursSinceLastService(machine(w)) === 0, 'quedaron horas colgando del servicio anterior')
    },
  },

  // ─── El pago ─────────────────────────────────────────────────────────────────
  {
    id: 'S24',
    actor: 'Pedro',
    spec: '001',
    stage1: 10,
    what: 'paga cada cuota al certificarse su hito',
    rules: ['BR-04'],
    run: (w) => {
      const op = operation(w)
      for (const milestone of MILESTONES) {
        // El proyecto avanza y la valorización se certifica; recién entonces la cuota es exigible.
        certify(milestone, milestone.expectedAt)
        const instalment = op.instalments.find((i) => i.anchoredTo === milestone.id)
        check(instalment !== undefined, `${milestone.name} no tiene cuota anclada`)
        payInstalment(op, instalment.id, MILESTONES)
      }
      check(paidCount(op) === MILESTONES.length, 'quedaron cuotas sin pagar')
    },
  },
  {
    id: 'S25',
    actor: 'Pedro',
    spec: '001',
    stage1: 11,
    what: 'distingue pagadas de pendientes en cualquier punto',
    run: (w) => {
      const op = operation(w)
      check(paidCount(op) === 6, `pagadas inesperadas: ${paidCount(op)}`)
      check(pendingCount(op) === 0, `pendientes inesperadas: ${pendingCount(op)}`)
      // Las dos cifras dan cuenta de todas las cuotas, siempre.
      check(
        paidCount(op) + pendingCount(op) === op.instalments.length,
        'las cuentas no dan cuenta de todas las cuotas',
      )
    },
  },

  // ─── El cierre ───────────────────────────────────────────────────────────────
  {
    id: 'S26',
    actor: 'Lea$e',
    spec: '001',
    stage1: 12,
    what: 'abre la opción de adquisición al pagarse todas',
    rules: ['BR-07'],
    run: (w) => {
      check(
        acquisitionOptionStatus(operation(w)) === 'available',
        'pagadas todas las cuotas, la opción sigue sin abrirse',
      )
    },
  },
  {
    id: 'S27',
    actor: 'Julia',
    spec: '003',
    stage1: 9,
    what: 'sabe a qué final se dirige el despliegue',
    run: (w) => {
      // Antes de que el término acabe, y sin que ella lo decida: lo decidió la última cuota.
      check(
        headingFor(operation(w)) === 'Acquisition Retirement',
        'no puede anticipar que la máquina deja la flota',
      )
      check(deployment(w).close === undefined, 'el despliegue ya estaba cerrado')
    },
  },
  {
    id: 'S28',
    actor: 'Pedro',
    spec: '001',
    stage1: 13,
    what: 'ejerce la opción de adquisición',
    rules: ['BR-07'],
    run: (w) => {
      exerciseAcquisitionOption(operation(w), CASE.acquisitionAt)
      check(operation(w).acquisitionExercisedAt !== undefined, 'la opción no quedó ejercida')
    },
  },
  {
    id: 'S29',
    actor: 'Julia',
    spec: '003',
    stage1: 10,
    what: 'cierra el despliegue y retira la máquina de la flota',
    rules: ['BR-01', 'BR-07'],
    run: (w) => {
      closeByAcquisitionRetirement(deployment(w), machine(w), operation(w), CASE.acquisitionAt)

      check(deployment(w).close?.kind === 'Acquisition Retirement', 'cerró por el final equivocado')
      // Aquí termina la propiedad que Lea$e conservó todo el contrato.
      check(machine(w).fleetState === 'retired', 'la máquina no salió de la flota')
      check(
        !w.deployments.open().some((d) => d.id === CASE.deployment),
        'el despliegue cerrado sigue figurando como abierto',
      )
    },
  },
  {
    id: 'S30',
    actor: 'Pedro',
    spec: '001',
    stage1: 14,
    what: 'la operación llega a estado completo',
    run: (w) => {
      check(
        operationState(operation(w)) === 'completed',
        `la operación quedó en ${operationState(operation(w))}`,
      )
    },
  },
]

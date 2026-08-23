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
 * afirmable. Si una spec mueve un paso de Stage 1, este archivo deja de corresponder y se nota —
 * `src/cli/citations.ts` lo comprueba contra el texto de las tres.
 *
 * Solo happy path. Los tres Stage 1 dicen que nada en ellos supone un rechazo, una demora ni un
 * incumplimiento; un hilo que afirmara caminos negativos ya no sería Stage 1. Las guardas que las
 * reglas imponen viven en el dominio, que es donde son la regla y no una prueba de ella.
 */

import { check, type SpecId, type Step } from './evidence/transcript.ts'
import type { World } from './ports/world.ts'
import type { CompanyId, LeasingRequestId, MachineryNeedId, ProjectId } from './domain/leasing.ts'
import { statusOf } from './domain/leasing.ts'
import type { AssessmentId, CertificationMilestone, MilestoneId } from './domain/underwriting.ts'
import {
  AUTHORITY_LIMIT_USD,
  DOWN_PAYMENT_CAP,
  availableOutcomes,
  certify,
  confirmMachineryValue,
  isFullyEvidenced,
  machineryValueOf,
  missingEvidence,
  produceInstallmentSchedule,
  recordDecision,
} from './domain/underwriting.ts'
import type { OperationId } from './domain/operation.ts'
import {
  acquisitionOptionStatus,
  acquisitionWindowEnds,
  conditionsOf,
  conditionsSettled,
  confirmReceipt,
  exerciseAcquisitionOption,
  operationState,
  dueCount,
  installmentFor,
  installmentState,
  paidCount,
  payInstallment,
  pendingCount,
  recordGuaranteesInPlace,
  settleDownPayment,
  unsettledConditions,
  waitingOn,
} from './domain/operation.ts'
import type { DeploymentId, MachineId } from './domain/fleet.ts'
import {
  agreeServiceWindow,
  closeByAcquisitionRetirement,
  completeService,
  currentAssessedValue,
  headingFor,
  hoursSinceLastService,
  isServiceDue,
  openServiceWindow,
  overdueHours,
  recordHandover,
  recordReading,
  requestServiceWindow,
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
  // FR-031b: lo que Lea$e estima que vale al entregarla, y otra vez al completarse el servicio.
  // El cliente no acepta ninguna de las dos — `003` paso 2 lo dice expresamente.
  assessedValueAtHandoverUSD: 128_000,
  assessedValueAfterServiceUSD: 121_000,
  // Un décimo, que es el tope de BR-12. Antes eran 25.600 —un quinto—, escritos cuando la regla
  // todavía no existía: la iteración del 2026-08-21 la agregó y este caso pasó a violarla.
  downPaymentUSD: 12_800,
  serviceIntervalHours: 250,

  handoverAt: new Date('2026-09-01T00:00:00.000Z'),
  readings: [
    { hours: 120, at: new Date('2026-09-12T00:00:00.000Z') },
    { hours: 265, at: new Date('2026-09-25T00:00:00.000Z') },
  ],
  serviceWindow: {
    requestedAt: new Date('2026-09-25T00:00:00.000Z'),
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

/**
 * Los pasos de Stage 1 que ningún paso del hilo carga, y por qué.
 *
 * `src/cli/citations.ts` exige que cada paso de las tres specs esté citado por el hilo o declarado
 * acá. Un paso nuevo que aparezca en una spec cae sin declarar y rompe el build — que es lo que no
 * pasó cuando `001` insertó dos pasos y seis citas quedaron corridas.
 *
 * Una declaración no es una excusa: dice si el paso lo construye otra spec desde su lado, si es una
 * precondición del caso, o si sencillamente no está hecho.
 */
export const UNCOVERED: Readonly<Record<SpecId, Readonly<Record<number, string>>>> = {
  '001': {
    1: 'precondición: el caso arranca con el proyecto ya adjudicado',
    7: 'el mismo momento que `003`·2 —la spec lo dice así— y el hilo lo construye del lado de Julia',
  },
  '002': {
    1: 'precondición: la solicitud la envía `001`, y el hilo la construye ahí',
  },
  '003': {
    1: 'precondición: la aprobación es de `002` y la compra de la máquina es un paso de `001`',
  },
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
        machineryValueStatedUSD: CASE.machineryValueUSD,
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
    stage1: 4,
    what: 'confirma el valor de maquinaria que el solicitante declaró',
    run: (w) => {
      // Declarar y confirmar son dos actos: el primero lo hace quien pide, el segundo quien
      // arriesga. El paso 4 de `002` los pone juntos porque el límite del paso 8 y el tope de
      // BR-12 se miden contra el confirmado — medir contra el declarado sería dejar que el
      // solicitante elija su propio límite.
      confirmMachineryValue(assessment(w), {
        amountUSD: CASE.machineryValueUSD,
        note: 'Cotización del distribuidor autorizado, vigente 30 días',
        at: w.clock.now(),
      })
      check(
        machineryValueOf(assessment(w)) === CASE.machineryValueUSD,
        'el valor sobre el que se decide no es el confirmado',
      )
    },
  },
  {
    id: 'S08',
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
    id: 'S09',
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
    id: 'S10',
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
    id: 'S11',
    actor: 'Lea$e',
    spec: '002',
    stage1: 8,
    what: 'verifica el valor contra el límite de autoridad',
    run: (w) => {
      const value = machineryValueOf(assessment(w))
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
    id: 'S12',
    actor: 'Carlos',
    spec: '002',
    stage1: 9,
    what: 'registra la aprobación con razón y condiciones',
    // El inicial es una condición, y BR-12 la topa en un décimo de la máquina: es acá donde la
    // regla muerde, porque `001` paso 9 liquida ese pago contra lo que esta decisión fijó.
    rules: ['BR-02', 'BR-12'],
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
      check(
        decision.conditions.downPaymentUSD <= CASE.machineryValueUSD * DOWN_PAYMENT_CAP,
        'el inicial excede el décimo que BR-12 tolera',
      )
    },
  },
  {
    id: 'S13',
    actor: 'Lea$e',
    spec: '002',
    stage1: 10,
    what: 'produce el calendario anclado a hitos',
    rules: ['BR-04'],
    run: (w) => {
      const installments = produceInstallmentSchedule(assessment(w))
      const approved = assessment(w).decision?.conditions
      check(approved !== undefined, 'la aprobación no dejó condiciones que copiar')
      w.operations.save({
        id: CASE.operation,
        requestId: CASE.request,
        installments,
        // La operación se lleva copia de las condiciones: liquidarlas es acto de Pedro y el
        // expediente es de Carlos — `001` paso 9 contra `002` paso 11.
        conditions: conditionsOf(approved),
      })

      check(installments.length === MILESTONES.length, 'una valorización quedó sin cuota')
      // Cada cuota nombra el hito cuya certificación la hace exigible, y ninguna una fecha propia.
      for (const installment of installments) {
        const milestone = MILESTONES.find((m) => m.id === installment.anchoredTo)
        check(milestone !== undefined, `la cuota ${installment.id} no ancla a un hito del proyecto`)
      }
      const financed = CASE.machineryValueUSD - CASE.downPaymentUSD
      const total = installments.reduce((sum, i) => sum + i.amountUSD, 0)
      check(total === financed, `el calendario suma ${total} y lo financiado es ${financed}`)
    },
  },
  {
    id: 'S14',
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
    id: 'S15',
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
    id: 'S16',
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
        assessedValueUSD: CASE.assessedValueAtHandoverUSD,
        at: CASE.handoverAt,
      })
      w.deployments.save(created)

      check(Boolean(created.handover.custodian), 'la entrega quedó sin custodio nombrado')
      check(Boolean(created.handover.acceptedByLease), 'Lea$e no aceptó el acta')
      check(Boolean(created.handover.acceptedByClient), 'el cliente no aceptó el acta')
      // FR-031b: la valorización va junto a la entrega, y **fuera** del acta que ambos firman.
      check(
        currentAssessedValue(created).amountUSD === CASE.assessedValueAtHandoverUSD,
        'la entrega no dejó registrado el valor estimado de la máquina',
      )
      check(
        !Object.hasOwn(created.handover, 'assessedValueUSD'),
        'el valor estimado se coló en el acta que el cliente acepta',
      )
    },
  },
  {
    id: 'S17',
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
    id: 'S18',
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
    id: 'S19',
    actor: 'Pedro',
    spec: '001',
    stage1: 9,
    what: 've las condiciones que la aprobación cargó y paga el inicial',
    rules: ['BR-12'],
    run: (w) => {
      const op = operation(w)
      // FR-022: las condiciones son suyas de ver, no solo de cumplir. Un cliente que no puede
      // leerlas no puede saber qué le falta para que el calendario arranque.
      check(op.conditions.downPaymentUSD === CASE.downPaymentUSD, 'la operación no lleva el inicial que se aprobó')
      check(Boolean(op.conditions.guarantees), 'la operación no dice qué garantía se exigió')
      check(
        op.conditions.downPaymentUSD <= CASE.machineryValueUSD * DOWN_PAYMENT_CAP,
        'el inicial que hay que liquidar excede el décimo que BR-12 tolera',
      )

      // Mientras haya condición sin liquidar, el calendario no arranca: la cuota espera eso y no
      // su hito, y `001` paso 13 pide que la cuota sepa decir cuál de las dos cosas espera.
      const first = op.installments[0]
      check(first !== undefined, 'la operación no tiene cuotas')
      check(waitingOn(first, op, MILESTONES)?.cite === '001 FR-024', 'la cuota no espera las condiciones')

      settleDownPayment(op, CASE.downPaymentUSD, CASE.handoverAt)
      check(op.conditions.downPaymentSettledAt !== undefined, 'el inicial no quedó liquidado')
      check(!conditionsSettled(op), 'las condiciones no pueden estar completas: falta la garantía')
    },
  },
  {
    id: 'S20',
    actor: 'Carlos',
    spec: '002',
    stage1: 11,
    what: 'registra la garantía en su lugar y las condiciones quedan liquidadas',
    run: (w) => {
      const op = operation(w)
      // FR-012c: la garantía la constata quien la exigió. Es la otra mitad del paso 9 de `001`,
      // y hasta que las dos estén no hay calendario que corra.
      recordGuaranteesInPlace(op, CASE.handoverAt)
      check(conditionsSettled(op), `todavía falta ${unsettledConditions(op).join(' y ')}`)
      check(unsettledConditions(op).length === 0, 'quedó una condición sin liquidar')
    },
  },
  {
    id: 'S21',
    actor: 'Pedro',
    spec: '001',
    stage1: 10,
    what: 've sus cuotas y el estado de cada una',
    run: (w) => {
      const op = operation(w)
      check(op.installments.length === MILESTONES.length, 'no ve todas sus cuotas')
      check(paidCount(op) === 0, 'hay cuotas pagadas antes de tiempo')
      // Recibida la máquina y liquidadas las condiciones, pero sin ninguna valorización
      // certificada, las seis están `pending` y todas esperan lo mismo: su hito. Eso es lo que
      // `001` paso 13 pide poder decir de cada una.
      check(pendingCount(op, MILESTONES) === MILESTONES.length, 'las pendientes no son todas')
      check(dueCount(op, MILESTONES) === 0, 'hay cuotas exigibles sin hito certificado')
      for (const i of op.installments) {
        check(waitingOn(i, op, MILESTONES)?.rule === 'BR-04', `${i.id} no espera su certificación`)
      }
      check(
        acquisitionOptionStatus(op, w.clock.now()) === 'not yet available',
        'la opción de adquisición no puede estar disponible aún',
      )
    },
  },

  // ─── La máquina trabajando ───────────────────────────────────────────────────
  {
    id: 'S22',
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
    id: 'S23',
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
    id: 'S24',
    actor: 'Pedro',
    spec: '003',
    stage1: 5,
    what: 'el custodio ve que su máquina necesita servicio',
    rules: ['BR-06'],
    run: (w) => {
      // FR-010b: el estado es observable **por el custodio**, que está del lado del cliente y no
      // pertenece a Lea$e. Si solo Julia pudiera verlo, quien tiene la máquina en el terreno se
      // enteraría de que hay que pararla cuando alguien lo llame — y es él quien decide cuándo
      // puede pararla.
      const d = w.deployments.byOperation(CASE.operation)
      check(d !== undefined, 'la operación del custodio no tiene despliegue')
      check(d.id === CASE.deployment, 'el despliegue hallado no es el de la operación')
      check(d.handover.custodian === 'Rosa Quispe — jefa de equipos de la constructora', 'el custodio no es el del acta')

      const m = w.machines.byId(d.machineId)
      check(m !== undefined, 'el despliegue no tiene máquina')
      check(isServiceDue(m), 'el custodio no ve el servicio debido que Lea$e sí ve')
      check(hoursSinceLastService(m) === 265, 'el custodio no ve las horas que lo hicieron vencer')
      check(openServiceWindow(d) === undefined, 'hay una ventana pedida antes de pedirla')
    },
  },
  {
    id: 'S25',
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
    id: 'S26',
    actor: 'Julia',
    spec: '003',
    stage1: 7,
    what: 'pide una ventana de servicio contra el despliegue',
    rules: ['BR-06'],
    run: (w) => {
      // FR-010b. Pedirla es lo único que puede hacer sola: la máquina está en una obra que no
      // controla, y fijar cuándo se para es del que la tiene.
      requestServiceWindow(deployment(w), machine(w), CASE.serviceWindow.requestedAt)
      const window = openServiceWindow(deployment(w))
      check(window !== undefined, 'la ventana pedida no quedó registrada')
      check(window.agreed === undefined, 'la ventana quedó acordada sin que el cliente la acordara')
    },
  },
  {
    id: 'S27',
    actor: 'Pedro',
    spec: '003',
    stage1: 7,
    what: 'el cliente acuerda el período en que liberará la máquina',
    run: (w) => {
      // FR-010: el acto es del cliente. Que sea un paso aparte es lo que impide que el pedido de
      // Julia valga por el acuerdo.
      agreeServiceWindow(
        deployment(w),
        CASE.serviceWindow.from,
        CASE.serviceWindow.to,
        CASE.serviceWindow.requestedAt,
      )
      const window = openServiceWindow(deployment(w))
      check(window?.agreed !== undefined, 'la ventana no quedó acordada')
      check(window.agreed.from.getTime() === CASE.serviceWindow.from.getTime(), 'la ventana empieza en otra fecha')
      check(deployment(w).serviceWindows.length === 1, 'se abrió más de una ventana')
    },
  },
  {
    id: 'S28',
    actor: 'Julia',
    spec: '003',
    stage1: 8,
    what: 'completa el servicio dentro de la ventana y revalúa la máquina',
    rules: ['BR-06'],
    run: (w) => {
      completeService(
        deployment(w),
        machine(w),
        CASE.serviceWindow.completedAt,
        machine(w).accumulatedHours,
        CASE.assessedValueAfterServiceUSD,
      )

      check(!isServiceDue(machine(w)), 'la máquina sigue debiendo servicio')
      // El siguiente intervalo cuenta desde las horas al completarse, no desde la fecha.
      check(machine(w).hoursAtLastService === 265, 'el intervalo no se recontó desde las horas')
      check(hoursSinceLastService(machine(w)) === 0, 'quedaron horas colgando del servicio anterior')
      // FR-031b: el otro momento en que alguien la mira de verdad, y por eso el otro en que se
      // revalúa. Dos valorizaciones, no una: la de entrega y ésta.
      check(deployment(w).assessedValues.length === 2, 'el servicio no dejó una revaluación')
      check(
        currentAssessedValue(deployment(w)).amountUSD === CASE.assessedValueAfterServiceUSD,
        'la máquina no quedó revaluada al completarse el servicio',
      )
      check(currentAssessedValue(deployment(w)).because === 'servicio completado', 'la revaluación no dice qué la produjo')
    },
  },

  // ─── El pago ─────────────────────────────────────────────────────────────────
  {
    id: 'S29',
    actor: 'Carlos',
    spec: '002',
    stage1: 12,
    what: 'relee la decisión, sus condiciones y la evidencia que la sostuvo',
    run: (w) => {
      // Una decisión que no se puede releer no se puede sostener, y es lo que se le pide a un
      // analista cuando alguien pregunta por qué prestó. Sigue entera después de decidida.
      const a = assessment(w)
      check(a.decision?.outcome === 'approved', 'la decisión no es recuperable')
      check(Boolean(a.decision?.reason), 'la decisión perdió su razón')
      check(a.decision?.conditions?.downPaymentUSD === CASE.downPaymentUSD, 'las condiciones no son recuperables')
      check(isFullyEvidenced(a), 'la evidencia sobre la que se decidió ya no está completa')
      check(a.machineryValueConfirmation !== undefined, 'la confirmación del valor no quedó en el expediente')
      check(a.project?.schedule.length === MILESTONES.length, 'el calendario de certificación no es recuperable')
    },
  },
  {
    id: 'S30',
    actor: 'Carlos',
    spec: '002',
    stage1: 13,
    what: 'registra la primera valorización como certificada y pagada',
    rules: ['BR-04'],
    run: (w) => {
      // FR-024. Es el acto de Lea$e del que depende `001` paso 11: sin él ningún hito se certifica,
      // ninguna cuota vence, y el POC pagaría contra el almanaque — el prestamista genérico que
      // el Principio III prohíbe.
      const first = MILESTONES[0]
      check(first !== undefined, 'el proyecto no tiene valorizaciones')
      certify(first, first.expectedAt)
      check(first.certifiedAt !== undefined, 'la valorización no quedó certificada')
    },
  },
  {
    id: 'S31',
    actor: 'Pedro',
    spec: '001',
    stage1: 11,
    what: 'la cuota anclada a esa valorización se vuelve exigible',
    rules: ['BR-04', 'BR-08'],
    run: (w) => {
      const op = operation(w)
      const first = MILESTONES[0]
      check(first !== undefined, 'el proyecto no tiene valorizaciones')
      const installment = installmentFor(op, first.id)
      check(installment !== undefined, `${first.name} no tiene cuota anclada`)

      // Éste es el paso por el que el POC demuestra la brecha en vez de un libro mayor: el pago
      // sigue el avance certificado de la obra, no una fecha. Y las dos condiciones son las que
      // `001` paso 11 nombra — el hito certificado *y* la recepción confirmada.
      check(op.receiptConfirmedAt !== undefined, 'la recepción no está confirmada')
      check(
        installmentState(installment, op, MILESTONES) === 'due',
        `${installment.id} no se volvió exigible al certificarse ${first.name}`,
      )
      // Las otras cinco siguen esperando la suya: lo que venció es una cuota, no el calendario.
      check(dueCount(op, MILESTONES) === 1, `exigibles inesperadas: ${dueCount(op, MILESTONES)}`)
      check(pendingCount(op, MILESTONES) === MILESTONES.length - 1, 'las pendientes no son las cinco restantes')
    },
  },
  {
    id: 'S32',
    actor: 'Pedro',
    spec: '001',
    stage1: 12,
    what: 'paga cada cuota al certificarse su hito',
    rules: ['BR-04'],
    run: (w) => {
      const op = operation(w)
      for (const milestone of MILESTONES) {
        // El proyecto avanza y la valorización se certifica; recién entonces la cuota es exigible.
        // La primera ya se certificó en su propio paso — el acto es de `002`·13, no de éste.
        if (!milestone.certifiedAt) certify(milestone, milestone.expectedAt)
        const installment = op.installments.find((i) => i.anchoredTo === milestone.id)
        check(installment !== undefined, `${milestone.name} no tiene cuota anclada`)
        // Certificar es lo que la vuelve `due`. Ese estado intermedio es el que separa a Lea$e de
        // un prestamista con calendario, así que se observa antes de pagarla y no después.
        check(
          installmentState(installment, op, MILESTONES) === 'due',
          `${installment.id} no se volvió exigible al certificarse ${milestone.name}`,
        )
        payInstallment(op, installment.id, MILESTONES, milestone.expectedAt)
      }
      check(paidCount(op) === MILESTONES.length, 'quedaron cuotas sin pagar')
    },
  },
  {
    id: 'S33',
    actor: 'Pedro',
    spec: '001',
    stage1: 13,
    what: 'distingue pagadas de pendientes en cualquier punto',
    run: (w) => {
      const op = operation(w)
      check(paidCount(op) === 6, `pagadas inesperadas: ${paidCount(op)}`)
      check(dueCount(op, MILESTONES) === 0, `exigibles inesperadas: ${dueCount(op, MILESTONES)}`)
      check(pendingCount(op, MILESTONES) === 0, `pendientes inesperadas: ${pendingCount(op, MILESTONES)}`)
      // Las tres cifras dan cuenta de todas las cuotas, siempre: no hay una cuarta situación.
      check(
        paidCount(op) + dueCount(op, MILESTONES) + pendingCount(op, MILESTONES) === op.installments.length,
        'las cuentas no dan cuenta de todas las cuotas',
      )
    },
  },

  // ─── El cierre ───────────────────────────────────────────────────────────────
  {
    id: 'S34',
    actor: 'Lea$e',
    spec: '001',
    stage1: 14,
    what: 'abre la opción de adquisición al pagarse todas',
    rules: ['BR-07', 'BR-11'],
    run: (w) => {
      const op = operation(w)
      check(
        acquisitionOptionStatus(op, CASE.acquisitionAt) === 'available',
        'pagadas todas las cuotas, la opción sigue sin abrirse',
      )
      // BR-11: se abre con la última cuota, y esa misma fecha arranca los treinta días. Que la
      // ventana se ancle al hecho y no a cuándo alguien pregunte es lo que la hace afirmable.
      const last = MILESTONES[MILESTONES.length - 1]
      check(last !== undefined, 'el proyecto no tiene valorizaciones')
      check(
        op.optionAvailableSince?.getTime() === last.expectedAt.getTime(),
        'la opción no se abrió con el pago de la última cuota',
      )
      const ends = acquisitionWindowEnds(op)
      check(ends !== undefined, 'la opción disponible no dice cuándo caduca')
      check(CASE.acquisitionAt < ends, 'el caso ejerce la opción fuera de la ventana de BR-11')
    },
  },
  {
    id: 'S35',
    actor: 'Julia',
    spec: '003',
    stage1: 9,
    what: 'consulta el final y todavía no está determinado',
    run: (w) => {
      const op = operation(w)
      // La spec amendó este paso el 2026-08-21 para retirar la promesa de saberlo antes de tiempo,
      // y `not yet determined` es una de sus cuatro respuestas, no un hueco. Con la opción abierta
      // y sin ejercer, el cliente todavía puede rehusarla o dejarla caducar: contestarle a Julia
      // «vuelve» o «se la queda» sería inventarle una certeza que nadie tiene. Ésa es exactamente
      // su queja, y el sistema no la resuelve fingiendo.
      check(acquisitionOptionStatus(op, CASE.acquisitionAt) === 'available', 'la opción no está disponible')
      check(
        headingFor(op, CASE.acquisitionAt) === 'not yet determined',
        'el final se dio por determinado antes de que el cliente decidiera',
      )
      check(deployment(w).close === undefined, 'el despliegue ya estaba cerrado')
    },
  },
  {
    id: 'S36',
    actor: 'Pedro',
    spec: '001',
    stage1: 15,
    what: 'ejerce la opción dentro de la ventana de treinta días',
    rules: ['BR-07', 'BR-11'],
    run: (w) => {
      const op = operation(w)
      exerciseAcquisitionOption(op, CASE.acquisitionAt)
      check(op.acquisitionExercisedAt !== undefined, 'la opción no quedó ejercida')
      check(acquisitionOptionStatus(op, CASE.acquisitionAt) === 'exercised', 'la opción no quedó en «exercised»')
      // Y con eso la respuesta de `003` paso 9 se vuelve definitiva, que es lo que ese paso dice:
      // deja de ser «todavía no se sabe» en el mismo acto.
      check(
        headingFor(op, CASE.acquisitionAt) === 'Acquisition Retirement',
        'ejercida la opción, el final sigue sin determinarse',
      )
    },
  },
  {
    id: 'S37',
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
    id: 'S38',
    actor: 'Pedro',
    spec: '001',
    stage1: 16,
    what: 'la operación llega al estado terminal Acquired',
    run: (w) => {
      // `001` paso 16 fija el nombre con todas las letras: «the unambiguous terminal state
      // `Acquired`». Llamarlo `completed` era una palabra nuestra sobre un estado suyo.
      check(
        operationState(operation(w)) === 'Acquired',
        `la operación quedó en ${operationState(operation(w))}`,
      )
    },
  },
]

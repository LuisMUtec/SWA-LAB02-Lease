/**
 * Las herramientas de los agentes, neutrales al transporte.
 *
 * No son una capa nueva: son el dominio expuesto. Y por eso las guardas siguen vigentes —
 * `pagar_cuota` llama a `payInstalment`, que rechaza un pago sin recepción confirmada (BR-08) o
 * sin hito certificado (BR-04). Un agente que alucine no puede violar una regla de negocio: la
 * guarda no está en el prompt, está en el código.
 *
 * El agente propone; el dominio dispone.
 *
 * Cada herramienta recibe el mundo en lugar de capturarlo, para que un servidor MCP pueda abrir
 * uno fresco por llamada y confirmarlo al terminar. La definición se declara una vez y la sirven
 * dos adaptadores: `sdk-adapter.ts` y `mcp/server.ts`.
 */

import { z } from 'zod'

import type { World } from '../ports/world.ts'
import type { CompanyId, LeasingRequestId, MachineryNeedId, ProjectId } from '../domain/leasing.ts'
import { statusOf } from '../domain/leasing.ts'
import type { AssessmentId, MilestoneId } from '../domain/underwriting.ts'
import {
  AUTHORITY_LIMIT_USD,
  availableOutcomes,
  certify,
  missingEvidence,
  produceInstalmentSchedule,
  recordDecision,
} from '../domain/underwriting.ts'
import type { OperationId } from '../domain/operation.ts'
import {
  acquisitionOptionStatus,
  confirmReceipt,
  exerciseAcquisitionOption,
  operationState,
  paidCount,
  payInstalment,
  pendingCount,
} from '../domain/operation.ts'
import type { DeploymentId, MachineId } from '../domain/fleet.ts'
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
} from '../domain/fleet.ts'

export type ActorName = 'Pedro' | 'Carlos' | 'Julia'

/**
 * Una referencia que no resuelve.
 *
 * El dominio nunca busca por identificador —recibe objetos—, así que esto solo puede nacer aquí, al
 * traducir el id que trae la llamada. Es un error, no un resultado: devolverlo como texto exitoso
 * hacía que un script viera código 0 sobre una máquina inexistente. Los tres adaptadores lo
 * distinguen igual: MCP lo marca `isError`, el CLI sale con 1.
 */
export class NotFound extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFound'
  }
}

/** Un valor que no es lo que dice ser. */
export class BadInput extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BadInput'
  }
}

/**
 * Una fecha ISO que el llamador afirma.
 *
 * `new Date(basura)` no falla: devuelve una fecha inválida, que `toJSON()` convierte en `null` al
 * persistirla y deja al llamador creyendo que el acto ocurrió. Certificar un hito con una fecha
 * vacía informaba «certificada» sobre un hito que seguía sin certificar, y la cuota anclada a él
 * rebotaba después contra BR-04 sin que nada explicara por qué.
 */
function parseDate(raw: string, field: string): Date {
  const at = new Date(raw)
  if (Number.isNaN(at.getTime())) throw new BadInput(`${field}: «${raw}» no es una fecha`)
  return at
}

/**
 * Una herramienta declarada.
 *
 * `shape` es un raw shape de Zod porque es lo que MCP registra directamente; el adaptador del SDK
 * lo envuelve en `z.object`. La entrada del `run` se borra a `any` solo en este tipo colectivo —
 * `def()` la conserva tipada en el punto de declaración, que es donde importa.
 */
export interface ToolDef {
  name: string
  description: string
  shape: z.ZodRawShape
  run: (world: World, input: any) => string
}

function def<S extends z.ZodRawShape>(t: {
  name: string
  description: string
  shape: S
  run: (world: World, input: z.infer<z.ZodObject<S>>) => string
}): ToolDef {
  return t as ToolDef
}

const json = (value: unknown) => JSON.stringify(value, null, 2)

// ─── Pedro — `001-company-machinery-leasing` ─────────────────────────────────
const PEDRO: readonly ToolDef[] = [
  def({
    name: 'registrar_necesidad_maquinaria',
    description: 'Registra la maquinaria que un proyecto de la empresa requiere. Devuelve su identificador.',
    shape: {
      proyecto: z.string().describe('Nombre del proyecto que necesita la máquina'),
      descripcion: z.string().describe('Qué máquina se necesita'),
      valorUSD: z.number().describe('Lo que costaría comprarla, en dólares'),
    },
    run: (w, input) => {
      const id = w.ids.next('MN') as MachineryNeedId
      w.needs.save({
        id,
        projectId: input.proyecto as ProjectId,
        description: input.descripcion,
        machineryValueUSD: input.valorUSD,
      })
      return `Necesidad registrada: ${id}`
    },
  }),

  def({
    name: 'enviar_solicitud_leasing',
    description: 'Envía a Lea$e una solicitud de financiamiento para una necesidad de maquinaria ya registrada.',
    shape: {
      empresa: z.string().describe('Nombre de la empresa solicitante'),
      necesidadId: z.string().describe('Identificador devuelto al registrar la necesidad'),
    },
    run: (w, input) => {
      const need = w.needs.byId(input.necesidadId as MachineryNeedId)
      if (!need) throw new NotFound(`No existe la necesidad ${input.necesidadId}`)
      const id = w.ids.next('LR') as LeasingRequestId
      w.requests.save({
        id,
        companyId: input.empresa as CompanyId,
        projectId: need.projectId,
        needId: need.id,
        submittedAt: w.clock.now(),
      })
      return `Solicitud enviada: ${id} (estado: pending)`
    },
  }),

  def({
    name: 'consultar_estado_solicitud',
    description:
      'Consulta el estado de una solicitud: pending, approved o rejected. Si fue aprobada, devuelve también el identificador de la operación.',
    shape: { solicitudId: z.string() },
    run: (w, input) => {
      const request = w.requests.byId(input.solicitudId as LeasingRequestId)
      if (!request) throw new NotFound(`No existe la solicitud ${input.solicitudId}`)
      const operation = w.operations.byRequest(request.id)
      return json({ estado: statusOf(request), operacionId: operation?.id ?? null })
    },
  }),

  def({
    name: 'confirmar_recepcion_maquina',
    description: 'La empresa confirma que recibió la máquina. Hasta que esto ocurre, ninguna cuota es exigible.',
    shape: { operacionId: z.string() },
    run: (w, input) => {
      const operation = w.operations.byId(input.operacionId as OperationId)
      if (!operation) throw new NotFound(`No existe la operación ${input.operacionId}`)
      confirmReceipt(operation, w.clock.now())
      w.operations.save(operation)
      return 'Recepción confirmada. Las cuotas quedan exigibles contra la certificación de sus hitos.'
    },
  }),

  def({
    name: 'ver_cuotas',
    description:
      'Lista las cuotas de una operación con su estado y el hito de certificación contra el que vence cada una.',
    shape: { operacionId: z.string() },
    run: (w, input) => {
      const operation = w.operations.byId(input.operacionId as OperationId)
      if (!operation) throw new NotFound(`No existe la operación ${input.operacionId}`)
      const milestones = w.milestones.all()
      return json({
        pagadas: paidCount(operation),
        pendientes: pendingCount(operation),
        cuotas: operation.instalments.map((i) => {
          const milestone = milestones.find((m) => m.id === i.anchoredTo)
          return {
            id: i.id,
            montoUSD: i.amountUSD,
            estado: i.status,
            anclada_a: milestone?.name ?? i.anchoredTo,
            hito_certificado: Boolean(milestone?.certifiedAt),
          }
        }),
      })
    },
  }),

  def({
    name: 'pagar_cuota',
    description:
      'Paga una cuota. Solo procede si la empresa ya confirmó la recepción y si el hito de certificación al que la cuota está anclada ya fue certificado.',
    shape: { operacionId: z.string(), cuotaId: z.string() },
    run: (w, input) => {
      const operation = w.operations.byId(input.operacionId as OperationId)
      if (!operation) throw new NotFound(`No existe la operación ${input.operacionId}`)
      payInstalment(operation, input.cuotaId, w.milestones.all())
      w.operations.save(operation)
      return `Cuota ${input.cuotaId} pagada. Quedan ${pendingCount(operation)} pendientes.`
    },
  }),

  def({
    name: 'consultar_opcion_adquisicion',
    description: 'Dice si la opción de adquirir la máquina está disponible. Se abre al pagarse todas las cuotas.',
    shape: { operacionId: z.string() },
    run: (w, input) => {
      const operation = w.operations.byId(input.operacionId as OperationId)
      if (!operation) throw new NotFound(`No existe la operación ${input.operacionId}`)
      return json({
        opcion: acquisitionOptionStatus(operation),
        pendientes: pendingCount(operation),
        operacion: operationState(operation),
      })
    },
  }),

  def({
    name: 'ejercer_opcion_adquisicion',
    description: 'La empresa ejerce la opción y adquiere la máquina. Solo procede si todas las cuotas están pagadas.',
    shape: { operacionId: z.string() },
    run: (w, input) => {
      const operation = w.operations.byId(input.operacionId as OperationId)
      if (!operation) throw new NotFound(`No existe la operación ${input.operacionId}`)
      exerciseAcquisitionOption(operation, w.clock.now())
      w.operations.save(operation)
      return `Opción ejercida. La operación queda en estado ${operationState(operation)}.`
    },
  }),
]

// ─── Carlos — `002-leasing-request-underwriting` ─────────────────────────────
const CARLOS: readonly ToolDef[] = [
  def({
    name: 'listar_solicitudes_pendientes',
    description: 'Lista las solicitudes enviadas que todavía no tienen decisión — lo que espera al analista.',
    shape: {},
    run: (w) =>
      json(
        w.requests.awaitingDecision().map((r) => {
          const need = w.needs.byId(r.needId)
          return {
            solicitudId: r.id,
            empresa: r.companyId,
            proyecto: r.projectId,
            maquina: need?.description,
            valorUSD: need?.machineryValueUSD,
          }
        }),
      ),
  }),

  def({
    name: 'tomar_solicitud',
    description: 'Toma una solicitud para evaluarla. Abre exactamente un expediente, trazable a la solicitud.',
    shape: { solicitudId: z.string() },
    run: (w, input) => {
      const request = w.requests.byId(input.solicitudId as LeasingRequestId)
      if (!request) throw new NotFound(`No existe la solicitud ${input.solicitudId}`)
      const existing = w.assessments.byRequest(request.id)
      if (existing) return `Esa solicitud ya tiene el expediente ${existing.id}`
      const need = w.needs.byId(request.needId)
      const id = w.ids.next('AS') as AssessmentId
      w.assessments.save({ id, requestId: request.id, machineryValueUSD: need?.machineryValueUSD ?? 0 })
      return `Expediente abierto: ${id}`
    },
  }),

  def({
    name: 'registrar_elegibilidad',
    description: 'Registra si el solicitante es una empresa que trabaja por proyecto, que es a quien Lea$e financia.',
    shape: { expedienteId: z.string(), trabajaPorProyecto: z.boolean(), nota: z.string() },
    run: (w, input) => {
      const a = w.assessments.byId(input.expedienteId as AssessmentId)
      if (!a) throw new NotFound(`No existe el expediente ${input.expedienteId}`)
      a.eligibility = { worksByProject: input.trabajaPorProyecto, note: input.nota }
      w.assessments.save(a)
      return 'Elegibilidad registrada'
    },
  }),

  def({
    name: 'registrar_standing_crediticio',
    description: 'Registra la conducta crediticia del solicitante y su grado SBS actual, como evidencia.',
    shape: {
      expedienteId: z.string(),
      grado: z.string().describe('Grado SBS: Normal, CPP, Deficiente, Dudoso o Pérdida'),
      nota: z.string(),
    },
    run: (w, input) => {
      const a = w.assessments.byId(input.expedienteId as AssessmentId)
      if (!a) throw new NotFound(`No existe el expediente ${input.expedienteId}`)
      a.creditStanding = { grade: input.grado, note: input.nota }
      w.assessments.save(a)
      return 'Standing crediticio registrado'
    },
  }),

  def({
    name: 'registrar_proyecto',
    description:
      'Registra el proyecto como evidencia: qué se adjudicó, quién lo adjudicó, por cuánto, y su calendario de valorizaciones. Las cuotas se anclarán a esos hitos.',
    shape: {
      expedienteId: z.string(),
      adjudicado: z.string(),
      adjudicadoPor: z.string(),
      montoUSD: z.number(),
      hitos: z
        .array(
          z.object({
            nombre: z.string(),
            fechaEsperada: z.string().describe('Fecha ISO en que se espera certificar y pagar, ej. 2026-09-30'),
          }),
        )
        .min(1)
        .describe('Las valorizaciones esperadas del proyecto. Al menos una.'),
    },
    run: (w, input) => {
      const a = w.assessments.byId(input.expedienteId as AssessmentId)
      if (!a) throw new NotFound(`No existe el expediente ${input.expedienteId}`)
      const milestones = input.hitos.map((h, i) => ({
        id: `MS-${String(i + 1).padStart(2, '0')}` as MilestoneId,
        name: h.nombre,
        expectedAt: parseDate(h.fechaEsperada, `hitos[${i}].fechaEsperada`),
      }))
      w.milestones.replace(milestones)
      a.project = {
        awarded: input.adjudicado,
        awardedBy: input.adjudicadoPor,
        amountUSD: input.montoUSD,
        schedule: milestones,
      }
      w.assessments.save(a)
      return `Proyecto registrado con ${milestones.length} hitos de certificación`
    },
  }),

  def({
    name: 'registrar_pagador',
    description:
      'Registra al pagador detrás del solicitante. Debe estar nombrado; su comportamiento de pago puede quedar como desconocido.',
    shape: {
      expedienteId: z.string(),
      nombre: z.string(),
      comportamiento: z.string().describe('Lo que se sabe de su comportamiento de pago, o "unknown"'),
    },
    run: (w, input) => {
      const a = w.assessments.byId(input.expedienteId as AssessmentId)
      if (!a) throw new NotFound(`No existe el expediente ${input.expedienteId}`)
      a.payer = { name: input.nombre, behaviour: input.comportamiento }
      w.assessments.save(a)
      return 'Pagador registrado'
    },
  }),

  def({
    name: 'revisar_evidencia',
    description: 'Dice qué evidencia le falta al expediente. Sin el conjunto completo no puede registrarse decisión.',
    shape: { expedienteId: z.string() },
    run: (w, input) => {
      const a = w.assessments.byId(input.expedienteId as AssessmentId)
      if (!a) throw new NotFound(`No existe el expediente ${input.expedienteId}`)
      const missing = missingEvidence(a)
      return json({ completo: missing.length === 0, falta: missing })
    },
  }),

  def({
    name: 'consultar_limite_autoridad',
    description:
      'Dice qué desenlaces están disponibles para este expediente según el valor de la máquina y el límite de autoridad del analista.',
    shape: { expedienteId: z.string() },
    run: (w, input) => {
      const a = w.assessments.byId(input.expedienteId as AssessmentId)
      if (!a) throw new NotFound(`No existe el expediente ${input.expedienteId}`)
      return json({ valorUSD: a.machineryValueUSD, limiteUSD: AUTHORITY_LIMIT_USD, disponibles: availableOutcomes(a) })
    },
  }),

  def({
    name: 'registrar_aprobacion',
    description:
      'Registra una aprobación con su razón y sus condiciones. Requiere evidencia completa y que el valor esté dentro del límite de autoridad.',
    shape: {
      expedienteId: z.string(),
      razon: z.string(),
      inicialUSD: z.number().describe('Cuota inicial exigida'),
      garantias: z.string(),
    },
    run: (w, input) => {
      const a = w.assessments.byId(input.expedienteId as AssessmentId)
      if (!a) throw new NotFound(`No existe el expediente ${input.expedienteId}`)
      const request = w.requests.byId(a.requestId)
      if (!request) return 'El expediente no tiene solicitud'
      recordDecision(a, {
        outcome: 'approved',
        reason: input.razon,
        conditions: {
          downPaymentUSD: input.inicialUSD,
          termMilestones: a.project?.schedule.length ?? 0,
          guarantees: input.garantias,
          machineryNeedId: request.needId,
        },
        decidedBy: 'Carlos',
      })
      request.decision = 'approved'
      w.assessments.save(a)
      w.requests.save(request)
      return 'Aprobación registrada con su razón y condiciones'
    },
  }),

  def({
    name: 'producir_calendario_cuotas',
    description:
      'Produce el calendario de cuotas de la operación aprobada, con cada cuota anclada a un hito de certificación del proyecto. Devuelve el identificador de la operación.',
    shape: { expedienteId: z.string() },
    run: (w, input) => {
      const a = w.assessments.byId(input.expedienteId as AssessmentId)
      if (!a) throw new NotFound(`No existe el expediente ${input.expedienteId}`)
      const instalments = produceInstalmentSchedule(a)
      const id = w.ids.next('OP') as OperationId
      w.operations.save({ id, requestId: a.requestId, instalments })
      const milestones = w.milestones.all()
      return json({
        operacionId: id,
        cuotas: instalments.map((i) => ({
          id: i.id,
          montoUSD: i.amountUSD,
          anclada_a: milestones.find((m) => m.id === i.anchoredTo)?.name,
        })),
      })
    },
  }),

  def({
    name: 'certificar_hito',
    description:
      'Registra que una valorización del proyecto fue certificada y pagada al cliente. Es lo que hace exigible la cuota anclada a ella.',
    shape: { nombreHito: z.string(), fecha: z.string().describe('Fecha ISO de la certificación') },
    run: (w, input) => {
      const milestone = w.milestones.byName(input.nombreHito)
      if (!milestone) throw new NotFound(`No existe el hito ${input.nombreHito}`)
      certify(milestone, parseDate(input.fecha, 'fecha'))
      w.milestones.replace(w.milestones.all())
      return `${milestone.name} certificada`
    },
  }),
]

// ─── Julia — `003-deployed-fleet-custody` ────────────────────────────────────
const JULIA: readonly ToolDef[] = [
  def({
    name: 'incorporar_maquina_flota',
    description:
      'Incorpora a la flota de Lea$e una máquina comprada al proveedor. Lea$e conserva su propiedad durante todo el contrato.',
    shape: {
      descripcion: z.string(),
      intervaloServicioHoras: z.number().describe('Horas de operación entre servicios'),
    },
    run: (w, input) => {
      const id = w.ids.next('MQ') as MachineId
      w.machines.save({
        id,
        description: input.descripcion,
        serviceIntervalHours: input.intervaloServicioHoras,
        accumulatedHours: 0,
        hoursAtLastService: 0,
        fleetState: 'available',
      })
      return `Máquina incorporada: ${id} (disponible)`
    },
  }),

  def({
    name: 'registrar_entrega',
    description:
      'Entrega la máquina al cliente contra un acta de condición y horas aceptada por ambos lados, con un custodio nombrado y un sitio contratado. Abre el despliegue.',
    shape: {
      maquinaId: z.string(),
      operacionId: z.string(),
      condicion: z.string(),
      horas: z.number(),
      custodio: z.string().describe('Persona nombrada del lado del cliente que responde por la custodia'),
      sitioContratado: z.string(),
      aceptadoPorCliente: z.string().describe('Quién acepta el acta del lado del cliente'),
    },
    run: (w, input) => {
      const m = w.machines.byId(input.maquinaId as MachineId)
      if (!m) throw new NotFound(`No existe la máquina ${input.maquinaId}`)
      const id = w.ids.next('DP') as DeploymentId
      const created = recordHandover(id, m, input.operacionId as OperationId, {
        condition: input.condicion,
        hours: input.horas,
        custodian: input.custodio,
        contractedSite: input.sitioContratado,
        acceptedByLease: 'Julia',
        acceptedByClient: input.aceptadoPorCliente,
        at: w.clock.now(),
      })
      w.deployments.save(created)
      w.machines.save(m)
      return `Despliegue abierto: ${id}. Acta fijada e inalterable.`
    },
  }),

  def({
    name: 'listar_despliegues_abiertos',
    description: 'Lista los despliegues abiertos con las horas de cada máquina y si tiene servicio debido.',
    shape: {},
    run: (w) =>
      json(
        w.deployments.open().map((d) => {
          const m = w.machines.byId(d.machineId)
          return {
            despliegueId: d.id,
            maquinaId: d.machineId,
            operacionId: d.operationId,
            sitio: d.handover.contractedSite,
            custodio: d.handover.custodian,
            horasAcumuladas: m?.accumulatedHours,
            servicioDebido: m ? isServiceDue(m) : null,
            horasDeExceso: m ? overdueHours(m) : null,
          }
        }),
      ),
  }),

  def({
    name: 'registrar_lectura_horas',
    description:
      'Registra una lectura de horas-motor acumuladas de la máquina desplegada. Las horas son el único reloj que gobierna el mantenimiento.',
    shape: {
      despliegueId: z.string(),
      horas: z.number(),
      fecha: z.string().describe('Fecha ISO del momento al que se refiere la lectura'),
    },
    run: (w, input) => {
      const d = w.deployments.byId(input.despliegueId as DeploymentId)
      if (!d) throw new NotFound(`No existe el despliegue ${input.despliegueId}`)
      const m = w.machines.byId(d.machineId)
      if (!m) return 'El despliegue no tiene máquina'
      recordReading(d, m, { hours: input.horas, at: parseDate(input.fecha, 'fecha') })
      w.deployments.save(d)
      w.machines.save(m)
      return json({
        horasAcumuladas: m.accumulatedHours,
        horasDesdeUltimoServicio: hoursSinceLastService(m),
        servicioDebido: isServiceDue(m),
        horasDeExceso: overdueHours(m),
      })
    },
  }),

  def({
    name: 'acordar_ventana_servicio',
    description: 'Acuerda con el cliente un período dentro del cual liberará la máquina para el servicio debido.',
    shape: {
      despliegueId: z.string(),
      desde: z.string().describe('Fecha ISO de inicio'),
      hasta: z.string().describe('Fecha ISO de fin'),
    },
    run: (w, input) => {
      const d = w.deployments.byId(input.despliegueId as DeploymentId)
      if (!d) throw new NotFound(`No existe el despliegue ${input.despliegueId}`)
      agreeServiceWindow(d, parseDate(input.desde, 'desde'), parseDate(input.hasta, 'hasta'))
      w.deployments.save(d)
      return 'Ventana de servicio acordada'
    },
  }),

  def({
    name: 'completar_servicio',
    description:
      'Registra el servicio como completado. Debe caer dentro de la ventana acordada. El siguiente intervalo cuenta desde las horas al completarse.',
    shape: { despliegueId: z.string(), fecha: z.string().describe('Fecha ISO en que se completó') },
    run: (w, input) => {
      const d = w.deployments.byId(input.despliegueId as DeploymentId)
      if (!d) throw new NotFound(`No existe el despliegue ${input.despliegueId}`)
      const m = w.machines.byId(d.machineId)
      if (!m) return 'El despliegue no tiene máquina'
      const window = d.serviceWindows.find((sw) => !sw.completedAt)
      if (!window) return 'No hay una ventana de servicio pendiente'
      completeService(m, window, parseDate(input.fecha, 'fecha'), m.accumulatedHours)
      w.deployments.save(d)
      w.machines.save(m)
      return json({ servicioDebido: isServiceDue(m), intervaloCuentaDesdeHoras: m.hoursAtLastService })
    },
  }),

  def({
    name: 'consultar_final_despliegue',
    description:
      'Dice a qué final se dirige el despliegue: la máquina vuelve a la flota, o el cliente la adquiere y sale de ella. Lo decide la última cuota del cliente, no la responsable de flota.',
    shape: { despliegueId: z.string() },
    run: (w, input) => {
      const d = w.deployments.byId(input.despliegueId as DeploymentId)
      if (!d) throw new NotFound(`No existe el despliegue ${input.despliegueId}`)
      const operation = w.operations.byId(d.operationId)
      if (!operation) return 'El despliegue no tiene operación'
      return json({ finalPrevisto: headingFor(operation), cerrado: Boolean(d.close) })
    },
  }),

  def({
    name: 'cerrar_despliegue_por_adquisicion',
    description:
      'Cierra el despliegue porque el cliente adquirió la máquina, y la retira de la flota. No puede rehusarse, demorarse ni condicionarse.',
    shape: { despliegueId: z.string() },
    run: (w, input) => {
      const d = w.deployments.byId(input.despliegueId as DeploymentId)
      if (!d) throw new NotFound(`No existe el despliegue ${input.despliegueId}`)
      const m = w.machines.byId(d.machineId)
      const operation = w.operations.byId(d.operationId)
      if (!m || !operation) return 'El despliegue está incompleto'
      closeByAcquisitionRetirement(d, m, operation, w.clock.now())
      w.deployments.save(d)
      w.machines.save(m)
      return `Despliegue cerrado por adquisición. La máquina ${m.id} queda ${m.fleetState}.`
    },
  }),
]

export const TOOLS: Readonly<Record<ActorName, readonly ToolDef[]>> = {
  Pedro: PEDRO,
  Carlos: CARLOS,
  Julia: JULIA,
}

export const toolNames = (actor: ActorName): readonly string[] =>
  TOOLS[actor].map((t) => t.name).sort()

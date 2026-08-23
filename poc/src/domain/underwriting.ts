/**
 * El underwriting — `002-leasing-request-underwriting`.
 *
 * Lo que `001` declara fuera de alcance con «la solicitud es aprobada» ocurre aquí.
 */

import { RuleViolation, SpecViolation } from './rules.ts'
import type { DecisionOutcome, LeasingRequestId, MachineryNeedId } from './leasing.ts'

export type AssessmentId = string & { readonly __brand: 'AssessmentId' }
export type MilestoneId = string & { readonly __brand: 'MilestoneId' }

/**
 * El límite de autoridad de Carlos.
 *
 * `[ASSUMPTION]` de `002`, tomada de `personas/Carlos.MD`: USD 150,000 de valor de máquina. La
 * cifra es nuestra — el enunciado no fija delegación alguna.
 */
export const AUTHORITY_LIMIT_USD = 150_000

/** Un punto en que el avance del solicitante se certifica y se hace cobrable — la valorización. */
export interface CertificationMilestone {
  readonly id: MilestoneId
  readonly name: string
  /** Cuándo se espera que se certifique y pague. */
  readonly expectedAt: Date
  /** Cuándo se certificó de hecho. Ausente mientras no ocurra. */
  certifiedAt?: Date
}

export interface CreditStanding {
  /** El grado de la SBS: Normal, CPP, Deficiente, Dudoso, Pérdida. */
  readonly grade: string
  readonly note: string
}

export interface ProjectEvidence {
  readonly awarded: string
  readonly awardedBy: string
  readonly amountUSD: number
  /** Los hitos esperados. BR-04 ancla el calendario a estos y a nada más. */
  readonly schedule: readonly CertificationMilestone[]
}

export interface Payer {
  readonly name: string
  /**
   * Lo que se sabe de su comportamiento de pago. `unknown` es admisible y frecuente: nadie vende
   * un reporte del pagador. Lo que no es admisible es no nombrarlo.
   */
  readonly behaviour: string
}

export interface Eligibility {
  readonly worksByProject: boolean
  readonly note: string
}

/** Los términos bajo los que se concede una aprobación. Una aprobación sin ellos no es la decisión. */
export interface Conditions {
  readonly downPaymentUSD: number
  readonly termMilestones: number
  readonly guarantees: string
  readonly machineryNeedId: MachineryNeedId
}

export interface Decision {
  readonly outcome: DecisionOutcome
  readonly reason: string
  /** Presentes exactamente cuando la decisión es una aprobación. */
  readonly conditions?: Conditions
  readonly decidedBy: string
}

/**
 * Lo que el analista confirmó del valor que el solicitante declaró — `002` paso 4.
 *
 * Declarar y confirmar son dos actos distintos: el primero lo hace quien pide y el segundo quien
 * arriesga. El límite de autoridad y el tope de BR-12 se miden contra el confirmado, porque medir
 * contra el declarado sería dejar que el solicitante elija su propio límite.
 */
export interface MachineryValueConfirmation {
  readonly amountUSD: number
  readonly note: string
  readonly at: Date
}

export interface Assessment {
  readonly id: AssessmentId
  readonly requestId: LeasingRequestId
  /** Lo que el solicitante declaró al enviar. Inmutable: es el dicho, no el hecho. */
  readonly machineryValueStatedUSD: number
  /** Lo que el analista confirmó. Ausente mientras no lo haya confirmado. */
  machineryValueConfirmation?: MachineryValueConfirmation
  eligibility?: Eligibility
  creditStanding?: CreditStanding
  project?: ProjectEvidence
  payer?: Payer
  decision?: Decision
}

/**
 * El valor sobre el que se decide.
 *
 * El confirmado en cuanto exista; hasta entonces, el declarado. Nada se decide antes de la
 * confirmación —`missingEvidence` la exige— así que en toda decisión este valor es el confirmado.
 */
export function machineryValueOf(assessment: Assessment): number {
  return assessment.machineryValueConfirmation?.amountUSD ?? assessment.machineryValueStatedUSD
}

/**
 * Confirma el valor de la máquina — `002` paso 4.
 *
 * Stage 1 no supone una discrepancia: `001` manda su tratamiento a FR-009b y FR-028, que sus dos
 * Stage 1 excluyen expresamente. Confirmar otro número no es un caso del happy path, y el rechazo
 * lo dice en vez de dejar correr una operación sobre una máquina que no es la evaluada.
 */
export function confirmMachineryValue(
  assessment: Assessment,
  confirmation: MachineryValueConfirmation,
): void {
  if (assessment.machineryValueConfirmation) {
    throw new SpecViolation('el valor de maquinaria ya estaba confirmado')
  }
  if (confirmation.amountUSD !== assessment.machineryValueStatedUSD) {
    throw new SpecViolation(
      `el valor confirmado (USD ${confirmation.amountUSD.toLocaleString('en-US')}) no es el declarado ` +
        `(USD ${assessment.machineryValueStatedUSD.toLocaleString('en-US')}); una discrepancia queda fuera de Stage 1`,
    )
  }
  assessment.machineryValueConfirmation = confirmation
}

/** El conjunto exigido a *toda* evaluación, para que dos casos se comparen por contenido y no por forma. */
const REQUIRED_EVIDENCE = [
  'elegibilidad',
  'standing crediticio',
  'valor de maquinaria confirmado',
  'proyecto con su calendario de certificación',
  'pagador',
] as const

export function missingEvidence(assessment: Assessment): readonly string[] {
  const missing: string[] = []
  if (!assessment.eligibility) missing.push(REQUIRED_EVIDENCE[0])
  if (!assessment.creditStanding) missing.push(REQUIRED_EVIDENCE[1])
  // `002` paso 4 pone la confirmación del valor junto al standing, antes del paso 7 que declara el
  // expediente evidenciado. Sin ella, el límite de autoridad y el tope de BR-12 se medirían contra
  // un número que nadie verificó.
  if (!assessment.machineryValueConfirmation) missing.push(REQUIRED_EVIDENCE[2])
  // Un proyecto sin calendario de certificación no es evidencia de un proyecto: BR-04 ancla cada
  // cuota a un hito, así que sin hitos no hay nada contra lo que la cuota pueda vencer. Exigirlo
  // recién al producir el calendario deja la aprobación ya registrada sobre evidencia que no
  // sostiene una operación.
  if (!assessment.project || assessment.project.schedule.length === 0) {
    missing.push(REQUIRED_EVIDENCE[3])
  }
  if (!assessment.payer) missing.push(REQUIRED_EVIDENCE[4])
  return missing
}

export function isFullyEvidenced(assessment: Assessment): boolean {
  return missingEvidence(assessment).length === 0
}

/**
 * Los desenlaces que Carlos puede registrar sobre esta evaluación.
 *
 * El límite se hace *sentir*, no recordar: por encima de él, aprobar y rechazar sencillamente no
 * están disponibles, y lo único que puede registrar es una elevación.
 */
export function availableOutcomes(assessment: Assessment): readonly DecisionOutcome[] {
  return machineryValueOf(assessment) <= AUTHORITY_LIMIT_USD
    ? ['approved', 'refused']
    : ['escalated']
}

/**
 * El tope del pago inicial, como fracción del valor de la máquina — BR-12.
 *
 * No es una política de precios: es lo que impide que la condición reconstruya, en la línea de
 * salida, la misma falta de liquidez que las cuotas existen para resolver. Un cliente que pudiera
 * pagar un tercio de la máquina por adelantado no necesitaba a Lea$e para ese tercio.
 */
export const DOWN_PAYMENT_CAP = 0.1

export function recordDecision(assessment: Assessment, decision: Decision): void {
  if (assessment.decision) {
    throw new SpecViolation('la evaluación ya tiene una decisión registrada')
  }

  const missing = missingEvidence(assessment)
  if (missing.length > 0) {
    throw new SpecViolation(`falta evidencia: ${missing.join(', ')}`)
  }

  if (!availableOutcomes(assessment).includes(decision.outcome)) {
    throw new SpecViolation(
      `«${decision.outcome}» no está disponible: USD ${machineryValueOf(assessment).toLocaleString('en-US')} ` +
        `contra un límite de autoridad de USD ${AUTHORITY_LIMIT_USD.toLocaleString('en-US')}`,
    )
  }

  if (decision.outcome === 'approved') {
    if (!assessment.eligibility?.worksByProject) {
      throw new RuleViolation('BR-02', 'Lea$e financia empresas que trabajan por proyecto')
    }
    if (!decision.conditions) {
      throw new SpecViolation('una aprobación no se registra sin sus condiciones')
    }
    const cap = machineryValueOf(assessment) * DOWN_PAYMENT_CAP
    if (decision.conditions.downPaymentUSD > cap) {
      throw new RuleViolation(
        'BR-12',
        `un inicial de USD ${decision.conditions.downPaymentUSD.toLocaleString('en-US')} excede el tope de ` +
          `USD ${cap.toLocaleString('en-US')} — un décimo de la máquina`,
      )
    }
  }

  assessment.decision = decision
}

/** Una cuota. No lleva fecha de vencimiento: lleva el hito cuya certificación la hace exigible. */
export interface Installment {
  readonly id: string
  /**
   * El hito de certificación contra el que vence. BR-04 — y la razón de que Lea$e exista.
   *
   * `001` describe su `Installment` solo con `pending`/`paid`, sin ancla. Ver D-2 en DOMAIN.md.
   */
  readonly anchoredTo: MilestoneId
  readonly amountUSD: number
  /**
   * Cuándo se pagó. Ausente mientras no se haya pagado.
   *
   * El estado que `001` exige —`pending` / `due` / `paid`— no se guarda: se deriva, porque `due`
   * no es algo que alguien escriba sino un hecho sobre el mundo (su hito se certificó y la máquina
   * se recibió). Guardarlo sería poder contradecirlo. Ver `installmentState` en `operation.ts`.
   */
  paidAt?: Date
}

/**
 * Produce el calendario de una operación aprobada.
 *
 * Cada cuota se ancla a un hito. Si el proyecto no tiene calendario de certificación, no se
 * produce un calendario: no existe una versión anclada al almanaque a la que caer de vuelta, que
 * es justamente lo que BR-04 prohíbe.
 */
export function produceInstallmentSchedule(assessment: Assessment): readonly Installment[] {
  const decision = assessment.decision
  if (decision?.outcome !== 'approved' || !decision.conditions) {
    throw new SpecViolation('solo una aprobación produce un calendario de cuotas')
  }

  const milestones = assessment.project?.schedule ?? []
  if (milestones.length === 0) {
    throw new RuleViolation(
      'BR-04',
      'sin calendario de certificación no hay a qué anclar, y el almanaque no es un sustituto',
    )
  }

  const financed = machineryValueOf(assessment) - decision.conditions.downPaymentUSD
  const each = Math.round(financed / milestones.length)

  return milestones.map((milestone, index) => ({
    id: `IN-${String(index + 1).padStart(2, '0')}`,
    anchoredTo: milestone.id,
    // La última absorbe el redondeo. El costo del financiamiento no lo fija ninguna spec y
    // deliberadamente no se inventa aquí.
    amountUSD: index === milestones.length - 1 ? financed - each * (milestones.length - 1) : each,
  }))
}

export function certify(milestone: CertificationMilestone, at: Date): void {
  if (milestone.certifiedAt) {
    throw new SpecViolation(`el hito ${milestone.name} ya estaba certificado`)
  }
  milestone.certifiedAt = at
}

/*
 * FR-021 de `002`: el sistema no le da a Carlos capacidad alguna de liberar, entregar o recuperar
 * una máquina. Ese requisito se cumple aquí por ausencia — este módulo no exporta ninguna función
 * que toque la flota, y `domain/fleet.ts` no exporta ninguna que declare un incumplimiento.
 * La separación de funciones no es una advertencia: es lo que no existe.
 */

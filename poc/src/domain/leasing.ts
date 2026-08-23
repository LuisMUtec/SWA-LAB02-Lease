/**
 * El tramo de dominio que el hilo ejerce en sus primeros pasos.
 *
 * Vocabulario según poc/DOMAIN.md. Donde `001` y `002` nombran distinto, manda DOMAIN.md; donde
 * DOMAIN.md y una spec discrepan, manda la spec.
 */

export type CompanyId = string & { readonly __brand: 'CompanyId' }
export type ProjectId = string & { readonly __brand: 'ProjectId' }
export type MachineryNeedId = string & { readonly __brand: 'MachineryNeedId' }
export type LeasingRequestId = string & { readonly __brand: 'LeasingRequestId' }

/** Lo que `002` resuelve. Sus tres valores, tal como esa spec los nombra. */
export type DecisionOutcome = 'approved' | 'refused' | 'escalated'

/** Lo que Pedro ve. Sus tres valores, tal como `001` los nombra. */
export type RequestStatus = 'pending' | 'approved' | 'rejected'

/**
 * D-1 en poc/DOMAIN.md.
 *
 * `001` fija que una solicitud está siempre en exactamente uno de sus tres estados y que ninguno
 * queda indeterminado. `002` puede escalar. Desde donde Pedro está, un caso escalado sigue
 * esperando resolución, así que se proyecta a `pending` — nunca a un cuarto valor.
 */
export function visibleStatus(decision: DecisionOutcome | undefined): RequestStatus {
  switch (decision) {
    case 'approved':
      return 'approved'
    case 'refused':
      return 'rejected'
    case 'escalated':
    case undefined:
      return 'pending'
  }
}

/** El equipo que un proyecto requiere. Una *necesidad*, no la unidad física — ver DOMAIN.md. */
export interface MachineryNeed {
  readonly id: MachineryNeedId
  readonly projectId: ProjectId
  readonly description: string
  /**
   * Lo que costaría comprarla. `002` la contrasta contra el límite de autoridad, que
   * `personas/Carlos.MD` fija en USD — de ahí la moneda.
   */
  readonly machineryValueUSD: number
}

export interface LeasingRequest {
  readonly id: LeasingRequestId
  readonly companyId: CompanyId
  readonly projectId: ProjectId
  readonly needId: MachineryNeedId
  readonly submittedAt: Date
  /** Ausente mientras `002` no la haya resuelto. */
  decision?: DecisionOutcome
}

export function statusOf(request: LeasingRequest): RequestStatus {
  return visibleStatus(request.decision)
}

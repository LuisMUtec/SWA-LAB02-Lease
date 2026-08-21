import type { LeasingRequest, LeasingRequestId, MachineryNeed, MachineryNeedId } from '../../domain/leasing.ts'
import { statusOf } from '../../domain/leasing.ts'
import type { Assessment, AssessmentId } from '../../domain/underwriting.ts'
import type { LeasingOperation, OperationId } from '../../domain/operation.ts'
import type { Deployment, DeploymentId, Machine, MachineId } from '../../domain/fleet.ts'
import type {
  Assessments,
  Deployments,
  LeasingRequests,
  Machines,
  MachineryNeeds,
  Operations,
} from '../../ports/repositories.ts'

export function memoryMachineryNeeds(): MachineryNeeds {
  const rows = new Map<MachineryNeedId, MachineryNeed>()
  return {
    save: (need) => void rows.set(need.id, need),
    byId: (id) => rows.get(id),
  }
}

export function memoryLeasingRequests(): LeasingRequests {
  const rows = new Map<LeasingRequestId, LeasingRequest>()
  return {
    save: (request) => void rows.set(request.id, request),
    byId: (id) => rows.get(id),
    awaitingDecision: () => [...rows.values()].filter((r) => statusOf(r) === 'pending'),
  }
}

export function memoryAssessments(): Assessments {
  const rows = new Map<AssessmentId, Assessment>()
  return {
    save: (assessment) => void rows.set(assessment.id, assessment),
    byId: (id) => rows.get(id),
    byRequest: (id) => [...rows.values()].find((a) => a.requestId === id),
  }
}

export function memoryOperations(): Operations {
  const rows = new Map<OperationId, LeasingOperation>()
  return {
    save: (operation) => void rows.set(operation.id, operation),
    byId: (id) => rows.get(id),
  }
}

export function memoryMachines(): Machines {
  const rows = new Map<MachineId, Machine>()
  return {
    save: (machine) => void rows.set(machine.id, machine),
    byId: (id) => rows.get(id),
  }
}

export function memoryDeployments(): Deployments {
  const rows = new Map<DeploymentId, Deployment>()
  return {
    save: (deployment) => void rows.set(deployment.id, deployment),
    byId: (id) => rows.get(id),
    open: () => [...rows.values()].filter((d) => !d.close),
  }
}

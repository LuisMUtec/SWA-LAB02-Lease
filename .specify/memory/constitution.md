<!--
Sync Impact Report
Version change: none → 1.0.0 (initial ratification)
Modified principles: none (first version)
Added sections:
  - Core Principles I–V
  - Ambiguity and Assumptions
  - Development Workflow
  - Governance
Removed sections: none
Templates requiring updates:
  - .specify/templates/spec-template.md — no change; Problem and Out of Scope are supplied as
    input to /speckit-specify rather than by overriding the template
Follow-up TODOs: none
-->

# Lea$e Constitution

## Core Principles

### I. Requirements Before Design (NON-NEGOTIABLE)

The brief gives exactly one hint — *identify the requirements correctly before designing* — and it
is binding. No architecture decision, component boundary, diagram, or line of POC code may be
produced before the requirement it serves exists in the spec chain.

A requirement states the guarantee the system offers, never the mechanism. A queue, a cloud
product, or a topology named inside a requirement is a design decision in disguise: it is moved to
the design record, not deleted.

### II. Every Behavior Has an Owner

Every behavior the system exhibits traces either to a need of a named persona —
[Pedro](../../personas/Pedro.MD), [Carlos](../../personas/Carlos.MD),
[Julia](../../personas/Julia.MD) — or to a business rule. Behavior that traces to neither is
removed or given an owner; it is never kept "just in case".

Business rules form **one cohesive body** in [`business-rules.md`](../../business-rules.md), cited
by stable identifier. Identifiers are never renumbered and never reused, even when the wording of a
rule is revised. An acceptance criterion **states the rule's effect and cites the identifier**; it
never cites alone, because a sentence that cannot be understood without following the pointer makes
the reference load-bearing.

### III. The Problem Governs

Lea$e exists for one reason: companies that work by project need machinery now and are paid only
when the project ends, so they cannot finance the equipment the project requires. Every behavior
must narrow that gap.

The failure mode this principle exists to prevent is a generic leasing CRUD — a system that manages
contracts competently and never addresses why the customer could not pay up front. Any feature that
would survive unchanged if the financing gap disappeared is out of scope.

### IV. The Evaluation Gate Is 8/10 (NON-NEGOTIABLE)

`specs/<n>-<feature>/spec.md` is the only document with authority over what the system does, and
the only one scored. It is scored by the apparatus in [`evals/`](../../evals/README.md) across four
dimensions worth ten points, and it must reach eight.

Persona agents may only deduct, never add: their job is to detect the failure, not to certify the
success. A score below the gate corrects the spec, never the rubric. Every iteration is recorded
under version control, so that the improvement is evidence rather than assertion.

### V. The POC Must Run

A happy path that executes end to end for one persona outweighs breadth that executes for nobody.
The first stage of the staged scope is exactly what the POC builds; anything the happy path does
not exercise is outside the POC.

"It compiles" and "it is scaffolded" are not delivery. Evidence of an actual run is part of the
deliverable.

## Ambiguity and Assumptions

The brief fixes no leasing mechanics. Terms, instalments, guarantees, residual value, custody of
the machine, default handling and eligibility are all open, and the Peruvian context adds
constraints the brief does not state. Most business rules in this project will therefore be
invented by us.

What is undefined carries one of two markers and is never resolved in silence:

- `[CLARIFY: specific question]` when the answer determines the content.
- `[ASSUMPTION: statement]` when work continues under a declared hypothesis.

An invented business rule that is not marked is a defect, not a shortcut. Marking is what lets a
reader tell the domain from our guesses.

## Development Workflow

The same theme may appear at more than one altitude without being duplicated, as long as each
altitude asserts something different. **Each statement occurs once at its appropriate altitude.**

| Altitude | Home | Asserts |
|---|---|---|
| Governance | this constitution | Why the project exists and how work is judged |
| Domain | `business-rules.md` | The rules the business obeys, outliving any spec |
| People | `personas/*.MD` | Who each person is and what they need |
| Feature | `specs/<n>/spec.md` | What the system does, and which slice of the gap it closes |
| Plan and tasks | `specs/<n>/plan.md`, `tasks.md` | How it gets built |

Spec Kit drives the chain: `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` →
`/speckit-tasks` → `/speckit-implement`, with `/speckit-analyze` and `/speckit-checklist` guarding
drift between spec, plan and tasks. The evaluation gate of Principle IV runs outside that chain,
by hand, against the spec.

## Governance

This constitution supersedes other practices in this repository. Where a downstream document
conflicts with it, the downstream document is wrong.

Amendments require a commit that states what changed and why, a version bump under the policy
below, and an updated Sync Impact Report at the top of this file.

Versioning follows semantic versioning: MAJOR for a principle removed or redefined in a
backward-incompatible way, MINOR for a principle or section added or materially expanded, PATCH for
clarifications and wording that do not change meaning.

Compliance is reviewed at each Spec Kit gate. A plan or task set that violates a principle is
corrected before it advances; complexity that a principle forbids must be justified in writing or
dropped.

**Version**: 1.0.0 | **Ratified**: 2026-08-19 | **Last Amended**: 2026-08-19

# Specification Quality Checklist: Leasing Request Underwriting

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-20
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No `[NEEDS CLARIFICATION]` markers remain — this project uses `[CLARIFY: ...]` / `[ASSUMPTION: ...]` per `evals/README.md` and the constitution instead; no `[CLARIFY: ...]` markers remain (closed 2026-08-21, see Notes)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`.
- This project's governing documents (`evals/README.md`, `.specify/memory/constitution.md`) define
  `[CLARIFY: specific question]` and `[ASSUMPTION: statement]` as the two markers for
  underspecified domain areas, and require that ambiguity be marked rather than resolved in
  silence. The generic Spec Kit item above is read against that convention: the check is that no
  ambiguity was filled in *without* a marker, not that zero markers exist.
- **Closed (2026-08-21, issue #5):** the `[CLARIFY: ...]` marker this spec previously carried, in
  **Key Product Decisions** — how far an Instalment Schedule may bend before a slipping operation
  is treated as defaulted — is resolved by the new BR-09 (30 days uncertified on one milestone, or
  two milestones uncertified at once, whichever comes first). Reaching that threshold makes an
  operation eligible for a Default Declaration; it does not create one, per FR-023/AC-026.
  `personas/Carlos.MD`'s requirement that the tolerance be settled in advance and identical for
  every operation is what BR-09 is for. This does not block or move Stage 1: the happy path never
  reaches a slip.
- Coverage was checked by hand. Every Functional Requirement (FR-001–FR-024) is cited by at least
  one Acceptance Criterion (AC-001–AC-027), and every Acceptance Scenario in User Stories 1–4 has a
  corresponding criterion.
- **Persona-agent review (2026-08-21, issue #5, EVAL iteration 01).** The Carlos agent found two
  defects against `personas/Carlos.MD`, both now closed:
  1. *Nothing recorded that a Certification Milestone had been certified.* FR-017's Slippage
     Warning tested for its absence, FR-018 depended on it arriving, FR-023/BR-09 computed
     eligibility from it, and FR-014's whole due condition rested on it — but no requirement let
     anyone create it. Read literally, every milestone slipped on every operation and no instalment
     ever fell due. Closed: FR-024 / AC-027 and the Certification Record concept.
  2. *The fast refusal was blocked.* FR-010 forbade recording any Decision — including `refused` —
     on an incompletely evidenced Assessment, so the applicant with no certification schedule, the
     case most deserving an immediate no, could not be closed at all. This contradicted Carlos's
     stated permission to "refuse with a reason" and his stated obstacle that speed is itself a
     decision. Closed: FR-010 now bounds only `approved` and `escalated` (AC-008, AC-009).
  Reservations the agent raised that are **not** closed, and why: the instalment due-date offset
  stays an open business decision (Assumptions); cross-Assessment Payer history stays deferred
  (Later stages, "Portfolio-level views"); committee-approved operations are not explicitly bound
  by FR-012's Conditions or FR-014's anchoring; and no requirement backs "demand further evidence
  before deciding." Each is recorded here rather than silently dropped.
- Where an Acceptance Criterion states a business rule's effect it cites the identifier per
  `business-rules.md`'s convention: AC-003 and AC-004 cite BR-02, AC-016 and AC-017 cite BR-04,
  AC-026 cites BR-09. BR-01 is cited in the Problem statement rather than in a criterion, because
  what it constrains here is the *stake* of the decision, not an observable behaviour of this
  feature.
- One new `BR-nn` entry was needed to close CLARIFY #3 of issue #5: **BR-09**, catalogued in
  `business-rules.md`, sets the default-eligibility tolerance this feature previously left open.
  BR-02 and BR-04 were already catalogued before this pass. The two constraints that are ours
  rather than the brief's — the Authority Limit and the separation of deciding from executing — are
  marked as assumptions in **Assumptions** and stated as behaviour in **Authority and Separation of
  Duties**, because they are properties of Lea$e's internal organisation rather than rules of the
  leasing business.
- **Boundary with `001-company-machinery-leasing`**: this feature specifies what `001` explicitly
  declares out of scope (*"the reasoning that produces an outcome is not"*). The two meet at one
  seam: `001`'s FR-005 creates a Lease when a Leasing Request becomes `approved`, and this
  feature's FR-012 and FR-014 state what that approval consists of and what schedule it produces.
  Neither restates the other's flow.
- **Boundary with `003-deployed-fleet-custody`**: the separation of duties is deliberately
  specified from both sides. Here, FR-021 denies Underwriter any capability to act on a machine.
  There, Julia is denied any capability to declare a default. `evals/README.md`'s D4 reads the
  `Permissions` of both personas for exactly this kind of tension; it is resolved rather than left
  standing.

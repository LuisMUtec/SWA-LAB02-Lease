# Specification Quality Checklist: Deployed Fleet Custody

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-20
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No `[NEEDS CLARIFICATION]` markers remain — this project uses `[CLARIFY: ...]` / `[ASSUMPTION: ...]` per `evals/README.md` and the constitution instead; one `[CLARIFY: ...]` marker remains by design (see Notes)
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
- One `[CLARIFY: ...]` marker remains in `spec.md`, in **Key Product Decisions**: what Lea$e does
  about a service left overdue past its window. It is left open deliberately.
  `personas/Julia.MD` is explicit that postponing a service window costs the client nothing, so a
  consequence has to exist somewhere — but choosing it is a business decision this specification
  has no authority to invent. It does not block Stage 1, whose happy path completes the service
  inside its window.
- Coverage was checked by hand. Every Functional Requirement (FR-001–FR-024) is cited by at least
  one Acceptance Criterion (AC-001–AC-029), and every Acceptance Scenario in User Stories 1–6 has a
  corresponding criterion.
- Where an Acceptance Criterion states a business rule's effect it cites the identifier per
  `business-rules.md`'s convention: AC-003 cites BR-05, AC-008, AC-009 and AC-013 cite BR-06, and
  AC-018, AC-020 and AC-021 cite BR-07. BR-01 is cited in Summary and Key Product Concepts rather
  than in a criterion, because what it establishes here is why Fleet Manager is accountable at all,
  not a behaviour this feature exhibits.
- No new `BR-nn` entries were needed. Every rule this feature leans on — BR-01, BR-05, BR-06,
  BR-07 — was already catalogued, and no Functional Requirement carries an uncatalogued business
  rule inside it. The constraints that are ours rather than the brief's are marked in
  **Assumptions** and stated as behaviour in **Authority and Separation of Duties**.
- **Boundary with `001-company-machinery-leasing`**: this feature occupies the interval `001`
  passes over between Company confirming receipt and exercising the Acquisition Option. The two
  meet at exactly two seams, and neither restates the other: `001`'s confirmed-receipt milestone is
  what this feature's handover produces, and `001`'s exercise of the Acquisition Option is what
  determines which end a Deployment closes by (FR-016, FR-017).
- **Stage 1 coherence with `001`**: `001`'s Stage 1 ends in acquisition. This feature's Stage 1
  closing step covers both ends because it is one behaviour with two outcomes and Fleet Manager's
  difficulty is not knowing which applies; the shared end-to-end POC run exercises the acquisition
  end so that the two Stage 1 definitions describe the same run rather than two different ones.
- **Boundary with `002-leasing-request-underwriting`**: the separation of duties is specified from
  both sides on purpose. Here, FR-021 denies Fleet Manager any capability to declare a default and
  FR-023 makes a Recovery impossible without one. There, FR-021 denies Underwriter any capability
  to act on a machine. `evals/README.md`'s D4 reads the `Permissions` of both personas for exactly
  this tension; it is resolved in the specs rather than left standing between them.
- **On `personas/Julia.MD`'s remaining obstacles**: two are deliberately not resolved by this
  feature and are recorded as later-stage scope rather than silently dropped — machines idle on one
  site while another contract waits (fleet-wide utilisation), and the fact that the operator at the
  controls is not Lea$e's and cannot be checked. The second is bounded by BR-05 placing custody and
  cover on the client; this feature records Incidents so a claim has a record to rest on, and stops
  there, because insurance is out of scope.

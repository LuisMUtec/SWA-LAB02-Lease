# Specification Quality Checklist: Company Machinery Leasing

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-20
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No `[NEEDS CLARIFICATION]` markers remain — this project uses `[CLARIFY: ...]` / `[ASSUMPTION: ...]` per `evals/README.md` and the constitution instead; no `[CLARIFY: ...]` markers remain (both closed 2026-08-21, see Notes)
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
- This project's governing documents (`evals/README.md`, `.specify/memory/constitution.md`)
  define `[CLARIFY: specific question]` and `[ASSUMPTION: statement]` as the two markers for
  underspecified domain areas, and require that ambiguity be marked rather than resolved in
  silence. The generic Spec Kit item above is read against that convention: the check is that no
  ambiguity was filled in *without* a marker, not that zero markers exist.
- **Closed (2026-08-21, issue #5):** the two `[CLARIFY: ...]` markers this spec previously carried,
  both in **Key Product Decisions**, are now resolved:
  1. Whether exercising the Acquisition Option requires anything beyond every Installment being
     paid — resolved by BR-07: no further cost.
  2. What terminal state a Leasing Operation reaches if Company does not exercise an available
     Acquisition Option — resolved as a named non-terminal state (`available, not yet exercised`)
     with no forced deadline; the `Return` outcome, if it never is exercised, is
     `003-deployed-fleet-custody`'s behavior, not this feature's.
  Neither resolution moves Stage 1: Stage 1's happy path (User Story 1) always exercises the option
  once available and never exercises it before all installments are paid.
- Every Functional Requirement (FR-001–FR-018) is cited by at least one Acceptance Criterion
  (AC-001–AC-017), and every Acceptance Scenario in User Stories 1–3 is covered by the
  corresponding Functional Requirements. **Correction (PR #1 review, 2026-08-20):** the first pass
  of this checklist claimed this was checked by hand and found no gaps — that was false. FR-011 had
  no citing AC. AC-009 was added to close the gap; this note is left here, rather than silently
  rewritten, so the correction is traceable.
- Where an Acceptance Criterion states a business rule's effect, it cites the rule's identifier per
  `business-rules.md`'s convention (AC-001 cites BR-02, AC-016 cites BR-01, AC-009 cites BR-08,
  AC-014 cites BR-07). **Resolved (2026-08-20):** the deferral noted in the first pass — waiting on
  BR-03–BR-06 to land before promoting FRs to rules — is closed. FR-011 and FR-015 carried business
  rules inside them and now cite BR-08 and BR-07 instead. FR-013 (an Installment cannot be paid
  twice) and FR-018 (a Company sees only its own records) were *not* promoted: the first is an
  idempotency invariant and the second an access-scope constraint, neither of which any persona or
  business decision reads as a rule of the Lea$e business.
- Carlos and Julia are intentionally absent from Users and Their Needs, Acceptance Criteria, and
  Functional Requirements — they are Lease Company-side actors, out of scope for this feature by
  design (see spec.md's Out of Scope). This is a scope decision, not an omission. It carries a
  measurable cost against `evals/README.md`'s D1 (their persona agents can only deduct, never
  certify, and score 0 for a flow this spec does not cover), capping D1 at ≤ 1/3 for this feature
  read alone. **Decided (2026-08-20):** Carlos and Julia each get their own feature rather than
  being folded into this one. The EVAL is therefore run against the three specs together, not
  against `001` alone — running it on `001` by itself would cap the total at 8/10, exactly the
  gate, with no margin.

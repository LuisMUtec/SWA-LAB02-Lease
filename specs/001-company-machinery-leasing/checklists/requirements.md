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
- Every Functional Requirement (FR-001–FR-022, including FR-009b) is cited by at least one
  Acceptance Criterion (AC-001–AC-021, including AC-008b), and every Acceptance Scenario in User
  Stories 1–3 is covered by the corresponding Functional Requirements. **Correction (PR #1 review,
  2026-08-20):** the first pass of this checklist claimed this was checked by hand and found no
  gaps — that was false. FR-011 had no citing AC. AC-009 was added to close the gap; this note is
  left here, rather than silently rewritten, so the correction is traceable.
- **Persona-agent review (2026-08-21, issue #5, EVAL iteration 01).** The Pedro agent found four
  gaps against `personas/Pedro.MD`, three of which are now closed in this spec:
  1. *Installment amounts were never visible to Company* — Key Entities gave an Installment only a
     status, and FR-014 gave counts, while Users and Their Needs promised "how much of the Lease's
     obligation remains." Closed: FR-010 and FR-014 now carry amounts (AC-008, AC-012).
  2. *A Machinery mismatch had nowhere to go* — Company's only action at delivery was to confirm
     receipt, though Out of Scope names "that the *expected* machinery arrived" as an observable
     result. Closed: FR-009b / AC-008b.
  3. *An unexercised Acquisition Option was indistinguishable from a declined one*, which made
     `003`'s FR-016 answer "Return" for every live Deployment. Closed: FR-019–FR-021 and
     AC-018–AC-020 split `available` (undecided) from `exercised` and `declined`.
  The fourth — that the slippage/default/recovery path specified in `002` and `003` is not visible
  to Company at all — is **not** closed here. It is a genuine scope question (whether Company sees
  Lea$e's internal risk assessment of its own operation), not an oversight, and Out of Scope
  already defers "any consequence of a missed installment." Recorded rather than silently dropped.
- **Second persona-agent pass (2026-08-21).** Pedro's re-read of the corrected spec confirmed all
  three fixes landed, and raised three further defects, all closed:
  1. *A genuine cross-spec contradiction*: `002`'s AC-027 made a certified milestone's instalment
     fall due unconditionally, while FR-011/AC-009 here forbid any instalment falling due before
     Company confirms receipt (BR-08) — and a milestone can certify before the machine arrives.
     Closed in `002` (FR-024, AC-027): certification is necessary, never sufficient.
  2. *AC-007 did not test the FR-009 it cited* — its Given was an already-approved request, so
     Pedro's "must not confirm receipt on a request that is not approved" had a requirement and no
     valid criterion. Closed: AC-007 now tests a `pending` or `rejected` request.
  3. *"Pending too long" was absorbed in silence* — this feature guarantees Company always knows
     which state a request is in, but nothing makes elapsed time visible, commits Lea$e to a
     turnaround, or gives Company a move when waiting itself becomes the problem, and unlike every
     other gap it was not even named. Closed as *named deferred scope* in Later stages, not resolved:
     a turnaround commitment is a business decision about what Lea$e promises applicants.
- **Third persona-agent pass (2026-08-21).** Pedro confirmed every earlier fix landed and his whole
  main flow now runs end to end. One further concrete gap, now closed: `002`'s FR-012 forbids an
  approval without Conditions and a down payment is one of them, yet FR-004 surfaced only the word
  `approved` — so the actor whose defining constraint is that he cannot front cash could learn of an
  upfront charge late, and FR-014's "total obligation" (the sum of Installment amounts) does not
  include it. Closed: FR-022 / AC-021.
- Reservations that remain open, recorded rather than dropped: an Installment has `pending`/`paid`
  and no `due` state, so the moment payment is owed — anchored in `002` to a Certification Record —
  is not visible to Company; and "pending too long to threaten the Project" remains detectable only
  as a state, never as elapsed time, which is named deferred scope in Later stages rather than
  resolved, because a turnaround commitment is a business decision about what Lea$e promises.
  `002`'s FR-025 (a request for further evidence, observable to the Applicant) covers one cause of
  the silence but not a complete file simply sitting undecided.
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

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
  **Key Product Decisions** — what Lea$e does about a service left overdue past its window — is
  resolved by the new BR-10: overdue hours beyond 20% of the Service Interval become a Safety Stop
  cause, reusing the capability Fleet Manager already has rather than adding a new one (FR-025,
  AC-030). Below that threshold, the fact is recorded with no further consequence specified. This
  does not block or move Stage 1, whose happy path completes the service inside its window.
- Coverage was checked by hand. Every Functional Requirement (FR-001–FR-025) is cited by at least
  one Acceptance Criterion (AC-001–AC-030, including AC-018b), and every Acceptance Scenario in
  User Stories 1–6 has a corresponding criterion.
- **Persona-agent review (2026-08-21, issue #5, EVAL iteration 01).** The Julia agent found that
  FR-016 — "which end is this Deployment heading for" — could only ever answer **Return** for the
  entire life of every Deployment, because it read "has the Acquisition Option been exercised", and
  under `001` that cannot become true until the final instalment is paid. The requirement whose
  whole purpose was to let Fleet Manager plan around a machine that will not come back reproduced
  her stated obstacle instead of solving it, and it threatened her hardest Must-nots: closing by
  Return while a client still held a live, unexercised right to acquire. Closed: `001` now
  distinguishes `declined` from `available` (its FR-019–FR-021), and FR-016 here reads three states
  — heading for Return, heading for Acquisition Retirement, or not yet determined (AC-018,
  AC-018b).
- Reservations the Julia agent raised that are **not** closed, recorded rather than dropped: no
  requirement causes an Operating-Hours Reading or a Site Departure to *arrive* (Out of Scope
  removes how a reading or location is obtained, and the inspection the spec leans on has no FR);
  FR-022's "last known location" is not produced by any requirement, since a Site Departure records
  only that the machine is away and when it left, not where it went; the transport/access/route
  that Out of Scope says is "recorded so the work can start from something" is backed by no FR; a
  completed Recovery does not close its Deployment, so FR-002 would block redeploying that machine;
  and no requirement lets anyone set a machine's Service Interval, though Key Entities reads it.
  These are real and belong to this feature's later stages or to a follow-up pass, not to Stage 1.
- Where an Acceptance Criterion states a business rule's effect it cites the identifier per
  `business-rules.md`'s convention: AC-003 cites BR-05, AC-008, AC-009 and AC-013 cite BR-06,
  AC-018, AC-020 and AC-021 cite BR-07, and AC-030 cites BR-10. BR-01 is cited in Summary and Key
  Product Concepts rather than in a criterion, because what it establishes here is why Fleet
  Manager is accountable at all, not a behaviour this feature exhibits.
- One new `BR-nn` entry was needed to close CLARIFY #4 of issue #5: **BR-10**, catalogued in
  `business-rules.md`. BR-01, BR-05, BR-06 and BR-07 were already catalogued before this pass. The
  constraints that are ours rather than the brief's are marked in **Assumptions** and stated as
  behaviour in **Authority and Separation of Duties**.
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

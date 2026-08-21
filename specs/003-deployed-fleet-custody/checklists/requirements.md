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
- Coverage was checked by hand. Every Functional Requirement (FR-001–FR-027, including FR-017b and
  FR-018b) is cited by at least one Acceptance Criterion (AC-001–AC-032, including AC-018b, AC-020b
  and AC-022b), and every Acceptance Scenario in User Stories 1–6 has a corresponding criterion.
- **Third persona-agent pass (2026-08-21).** Julia confirmed both failure paths now resolve and
  raised three further concrete gaps, all closed: Acquisition Retirement carried no condition-and-
  hours settlement though her Permissions grant it and her own flow ends by handing that record over
  (closed, FR-017 / AC-020, following FR-015's precedent of recording a difference without deciding
  who pays); no requirement let anyone set a machine's Service Interval though FR-007 depends on it
  (closed, FR-017b / AC-020b); and `001`'s FR-008 let a machine be delivered, confirmed and paid
  against with no Deployment ever opened, which is the one route by which her worst case — nothing
  recorded at handover — was still reachable across the seam (closed in `001` FR-008, which now
  states that Company's receipt confirmation and its acceptance of the handover record are one act).
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
- **Second persona-agent pass (2026-08-21).** Julia's re-read of the corrected spec raised five more
  defects, four now closed:
  1. *FR-022's Recovery promised a "last known location" no requirement produced* — a Site Departure
     recorded only that the machine had left and when. Closed: FR-014 now carries where it went when
     known, and FR-026's Inspection records a location too.
  2. *A recovered Deployment could never close.* FR-018 allowed only Return or Acquisition
     Retirement, both gated on an Acquisition Option that a defaulted operation's can never reach
     (permanently `not yet available` under `001` FR-015), so a recovered machine's Deployment stayed
     open and FR-002 blocked its redeployment forever. Closed: FR-018/FR-018b add Recovery Close
     (AC-022, AC-022b).
  3. *FR-016 was silent on `not yet available`* — the state of every Deployment for most of its life.
     Closed: FR-016 and AC-018b now account for all four of `001` FR-021's states.
  4. *Out of Scope claimed transport, access and a route were "recorded"; no FR did so.* Closed by
     withdrawing the claim rather than inventing scope — arranging a recovery is field logistics.
  5. *SC-007 promised the end could be determined "before its term ends"*, which no requirement
     delivers, since nothing forces Company to decide and neither spec fixes when a term ends.
     Closed by restating SC-007 as what is actually guaranteed: an answer that is always present and
     never wrong, definite from the moment Company acts.
  Also added from her Permissions: FR-026 (inspection with notice — a right `personas/Julia.MD`
  grants and this feature had leaned on twice without providing) and FR-027 (the age of a machine's
  most recent reading, so a machine that stopped reporting is distinguishable from one that is idle).
- Reservations that remain open, recorded rather than dropped: no requirement makes an
  Operating-Hours Reading or a Site Departure *arrive* on any cadence (Out of Scope keeps the source
  unspecified so Stage 1 is buildable without hardware; FR-027 makes the silence visible rather than
  filling it); a return difference reaches nobody who may act on it, since settlement is out of scope
  entirely and neither Julia (FR-020) nor Underwriter (`002` FR-015) may move money; Julia's
  permission to *require* a service window is granted only as *agree* (FR-010), a deliberate product
  decision — Lea$e cannot compel a jobsite — with BR-10/FR-025 as the only lever at the far end; and
  no requirement lets anyone set a machine's Service Interval, though Key Entities reads it.
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

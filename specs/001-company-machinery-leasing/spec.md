# Feature Specification: Company Machinery Leasing

**Feature Branch**: `001-company-machinery-leasing`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Create the first specification for the Lea$e project focused exclusively on the Company actor (Empresa): a Peruvian corporate or SME client that needs machinery to execute a project but cannot pay for it upfront because the project's revenue arrives later. The feature must cover the full observable journey from Company's side — machinery need, leasing request, financing decision, machinery delivery, installments, and the acquisition option — following the flow shown in the Lab 2 brief's diagrams (Company → Supplier / Company → Lease Company → Supplier → Company). Internal processes of Lease Company and Supplier are described only to the extent Company needs to observe their result."

## Summary

Company is a Peruvian corporate or SME that works by project (BR-02). When a project requires machinery, Company frequently cannot pay for that machinery in full before starting, because the project itself is what will produce the funds — and those funds arrive only when the project is paid, which is after the machinery is needed. This feature specifies the journey Company follows to close that gap through Lea$e: identify the machinery a project needs, request leasing financing for it, learn the outcome of that request, receive the machinery once approved, track and pay the resulting installments, and — once every installment is paid — exercise the option to acquire the machinery, reaching an unambiguous completed state.

This is the first feature specified for the project. It covers the Company side of the transaction only; the internal decision-making of Lease Company (how it evaluates a request, how it purchases from the Supplier) and of Supplier (its own delivery logistics) are addressed only insofar as their result is something Company must be able to observe. Full specifications for Lease Company's and Supplier's own actors are separate, future work (see Out of Scope).

## Problem

Companies that work by project need machinery to execute a project, but the project's payment is received only at the end. Between the moment the machinery is needed and the moment the project pays out, Company does not necessarily have the liquidity to buy every piece of equipment the project requires (Constitution, Principle III; brief). Without a way to obtain the machinery now and pay for it as the project's own economics allow, Company either cannot take on the project or must absorb financing risk itself. Lea$e exists to close specifically this gap — not to offer general-purpose credit unrelated to a machinery need tied to a project.

## Goal

Enable a Company that needs machinery now but expects project revenue later to obtain that machinery through a leasing process, and to complete the corresponding obligations through to acquisition, always with an unambiguous view of where the operation stands.

## Out of Scope

- Software architecture, technology selection, and any implementation detail (Constitution, Principle I) — this belongs to `/speckit-plan`.
- Real banking, payment-network, or accounting integrations. Installment payment is a business-observable event this feature defines; how a payment is technically captured is not.
- Automated credit scoring or any algorithm for deciding a Leasing Request's outcome — the decision's existence and its states are in scope, the method that produces it is Lease Company's internal domain.
- Lease Company's full internal operation (purchasing workflow, supplier negotiation, portfolio and risk management) beyond the result Company must observe (that the request was decided, and that machinery was delivered).
- Supplier's full internal operation (catalog management, its own fulfillment logistics) beyond the result Company must observe (that the expected machinery arrived).
- Tax, accounting, or regulatory-compliance behavior beyond what this feature already requires to track a leasing obligation.
- Collections management for overdue installments, and any consequence of a missed installment (deferred to a later stage; see Phased Scope).
- Fleet management across multiple, simultaneous machinery items or projects (deferred to a later stage; see Phased Scope).
- Carlos's and Julia's flows — they represent Lease Company-side actors (credit/risk analysis and fleet management respectively, per `personas/Carlos.MD` and `personas/Julia.MD`), not Company. Their own features are [`002-leasing-request-underwriting`](../002-leasing-request-underwriting/spec.md) and [`003-deployed-fleet-custody`](../003-deployed-fleet-custody/spec.md), not part of this specification.

## Key Product Concepts

- **Company**: a Peruvian corporate or SME client of Lea$e that works by project (BR-02) and needs machinery to execute one of those projects. Company is the actor this feature is written for.
- **Project**: a bounded undertaking Company carries out, which is the reason a machinery need exists and the thing whose eventual payment is what Company is waiting on. A Project is referenced by this feature only as the context a machinery need belongs to; managing a Project's own lifecycle is not part of this feature.
- **Machinery** (equipment): the physical item(s) Company needs in order to execute a Project. It is what Supplier provides and what Lease Company finances.
- **Supplier**: the party Company would otherwise buy or rent the Machinery from directly, and the party Lease Company purchases the Machinery from once a Leasing Request is approved. Supplier's own operation is out of scope; it appears here only as the origin of the Machinery Company expects to receive.
- **Leasing Request**: Company's formal ask that Lease Company finance a specific Machinery need tied to a Project. It has an identity and an observable status; it is not yet a financing agreement.
- **Financing Decision**: the resolution of a Leasing Request — whether Lease Company will finance it or not. Its possible outcomes are in scope; the reasoning that produces an outcome is not.
- **Lease**: the financing arrangement that exists once a Leasing Request is approved. Lea$e retains ownership of the Machinery for the life of the Lease (BR-01); Company holds the right to use it. A Lease is what an Installment schedule and the Acquisition Option belong to.
- **Certification Milestone**: a point at which Company's progress on its Project is certified and becomes payable by whoever is paying for that Project — in Peruvian construction, a *valorización*. It is what an Installment falls due against (BR-04), and it is the reason Lea$e's payment schedule tracks Company's cash rather than a calendar. How a milestone comes to be certified is Lease Company's process, specified in [`002-leasing-request-underwriting`](../002-leasing-request-underwriting/spec.md); what this feature specifies is that Company can see which milestone each of its Installments waits on.
- **Installment**: one scheduled payment obligation belonging to a Lease, anchored to one Certification Milestone of Company's Project (BR-04). Each Installment has its own status — `pending` until the conditions that make it payable hold, `due` once they do, `paid` once Company pays it — and its own amount; a Lease's Installments together represent Company's full payment obligation.
- **Acquisition Option**: the right Company gains, once every Installment of a Lease is paid, to acquire the Machinery it has been leasing. It is the mechanism through which BR-01's "Lea$e retains ownership" ends.
- **Leasing Operation**: the end-to-end thread this feature tracks for one machinery need — from the Leasing Request through the Lease's Installments to acquisition or another terminal outcome. Used in this specification to talk about "where things stand" as a whole, not as a separate record Company creates.

## Users and Their Needs

This feature is written for **Company** alone. Its human perspective is [`personas/Pedro.MD`](../../personas/Pedro.MD) — `[ASSUMPTION: Pedro, as owner/responsible manager of the Company, is the human perspective used to validate this feature; the brief names Pedro without describing his role, and personas/Pedro.MD already carries this working hypothesis]`.

Carlos ([`personas/Carlos.MD`](../../personas/Carlos.MD)) and Julia ([`personas/Julia.MD`](../../personas/Julia.MD)) represent Lease Company-side actors. Their needs are not addressed by this feature; they are addressed by [`002-leasing-request-underwriting`](../002-leasing-request-underwriting/spec.md) and [`003-deployed-fleet-custody`](../003-deployed-fleet-custody/spec.md) respectively (see Out of Scope).

Company's needs, as covered by this feature:

- Identify which Machinery a Project requires, so a Leasing Request can be built around a real need.
- Request leasing financing for that Machinery, associated with the Company, the Project, and the Machinery — and the Supplier when known.
- Know, unambiguously, the outcome of that request.
- Receive the Machinery corresponding to an approved request, and confirm that what arrived is what the operation expected.
- Know what payment obligations (Installments) the resulting Lease carries, and which point of its own Project's certified progress each one falls due against (BR-04).
- Pay those Installments once they fall due, and settle any amount the approval requires before the schedule begins.
- Respond when Lease Company asks for more evidence, rather than only being told that it did.
- See what Lease Company requires of it while the contract is live — including a requirement to restore the security behind the operation (BR-13) — and answer on the record, rather than being bound by a demand it cannot see or discharge.
- Distinguish which Installments are paid and which remain pending.
- Know how much of the Lease's obligation remains.
- Know, unambiguously, when the conditions to exercise the Acquisition Option are met.
- Exercise the Acquisition Option once available.
- Reach a final state for the Leasing Operation that leaves no doubt about the state of the Machinery and of the Lease.

## Key Product Decisions

- **What constitutes a Leasing Request**: an identified ask that references one Company, one Project, and the Machinery need it is for, with the Supplier recorded when it is already known. It receives its own identity and a status the moment it is submitted — it does not require the Machinery, the Supplier, or the Financing Decision to already exist. `[ASSUMPTION: in Stage 1, a Leasing Request is associated with exactly one machinery need; requests spanning multiple machinery items belong to a later stage]`.
- **States that must be visible to Company**: a Leasing Request is always in exactly one of `pending`, `approved`, or `rejected`. An Installment is always in exactly one of `pending`, `due` or `paid` — **amended 2026-08-21** to add `due`, because an Installment that carries no notion of when it is owed cannot express the one thing that distinguishes Lea$e from a lender with a calendar: the obligation follows the Project's certified progress (BR-04). The Acquisition Option is always in exactly one of `not yet available`, `available` (undecided, and time-bounded by BR-11), `exercised`, `declined`, or `lapsed` — **amended 2026-08-21** to split what was one `available` state into "undecided" and the two outcomes Company can choose from it, so that whoever reads the Option's state (including `003-deployed-fleet-custody`) is never told "not yet exercised" when what is actually true is "will not be." The Leasing Operation as a whole is always either still in progress or in a defined terminal state (see Acceptance Criteria). No state is left undetermined.
- **When an approved request moves the operation forward**: approval is itself the trigger. Once a Leasing Request is `approved`, Company does not need to take a separate action for Lease Company to proceed toward purchasing and delivering the Machinery — the internal purchase from Supplier is Lease Company's process, and what this feature specifies is that its result (the Machinery arriving) becomes observable and confirmable by Company.
- **What a rejected request means**: a `rejected` Leasing Request never produces a Lease. Whether Company may submit a new Leasing Request for the same machinery need after a rejection is a later-stage decision (see Phased Scope), not part of Stage 1.
- **How Machinery receipt is recognized**: Company explicitly confirms that it received the Machinery for a specific Leasing Operation. `[ASSUMPTION: receipt becomes an observable, confirmed milestone through an explicit Company action, rather than being inferred automatically from Supplier-side data the brief does not describe]`.
- **When the Acquisition Option becomes available, and what exercising it costs**: exactly when every Installment belonging to the Lease is `paid`, and exercising it then requires no payment beyond those Installments. Neither half is this spec's decision — both are BR-07, catalogued in [`business-rules.md`](../../business-rules.md) from the brief's own diagram (*"Pago TODAS las cuotas → opciones de adquisición"*). **Resolved (2026-08-21):** the earlier open question — whether exercising needed an additional residual-value payment — is closed by BR-07 itself: no further cost. A residual charge at the finish line would recreate the exact liquidity gap the Installments exist to close (Constitution, Principle III), so Stage 1 requires none.
- **What constitutes a completed Leasing Operation, and what happens if Company never exercises**: for Stage 1, a Leasing Operation is complete once Company exercises an available Acquisition Option and the system confirms the exercise. **Resolved (2026-08-21):** if Company instead explicitly declines (FR-019), the Leasing Operation reaches a second, equally unambiguous terminal state, `Returned`, distinct from `Acquired`. An available Option Company has neither exercised nor declined is not left ambiguous either — it is the named, non-terminal state `available` (undecided) — but it is no longer what [`003-deployed-fleet-custody`](../003-deployed-fleet-custody/spec.md) reads as "will end in Return," because that spec's Close now distinguishes `declined` from merely-not-yet-exercised (see its own FR-016). **Resolved (2026-08-21, EVAL iteration 02):** what happens if Company does neither is no longer open. BR-11 gives the available Option 30 calendar days; if the window closes with no decision it lapses, and the operation reaches `Returned` exactly as an explicit decline does (FR-026, AC-025). This replaces what both specs had recorded as shared unresolved scope — a deferral that was not merely undecided but harmful, since an Option left sitting kept `003`'s Deployment open with no end and its FR-002 then blocked that machine from every later contract.
- **What belongs to Stage 1**: exactly the happy-path journey enumerated in Phased Scope below — nothing that assumes a rejection, a delay, or a dispute.

## Expected User Experience

From Company's side, the experience this feature must produce is defined by what Company can always determine, not by any particular screen:

- **Clarity of status**: at any point, Company can state which of the defined states its Leasing Request, its Lease's Installments, and its Acquisition Option are in, without needing to ask anyone.
- **Continuity of the journey**: a machinery need, its Leasing Request, the resulting Lease, its Installments and its Acquisition Option are all traceable back to one another — Company is never left to guess which Lease an Installment belongs to, or which Project a Leasing Request was for.
- **Visibility of outstanding obligations**: Company can always tell how many Installments remain unpaid for a given Lease and how many have been paid — and, for each unpaid one, whether it is already `due` or still waiting on its Certification Milestone (BR-04) or on confirmed delivery (BR-08).
- **Explicit confirmation of milestones**: the Financing Decision, the Machinery receipt, each Installment payment, and the exercise of the Acquisition Option are each confirmed events Company can point to — none of them is left implicit.
- **No ambiguity about acquisition availability**: Company is never in a state where it cannot tell whether the Acquisition Option is available yet.
- **No ambiguity about completion**: once a Leasing Operation is complete, Company can tell that it is complete, and can tell the state of the Machinery (acquired) and of the Lease (closed) without contradiction.

## User Scenarios & Testing *(mandatory)*

Each user story below is independently testable and is written from Company's side. Each Acceptance Scenario is the atomic, Given/When/Then form of the corresponding need; the **Acceptance Criteria** section restates and cross-references the same guarantees against Functional Requirements for traceability, without repeating their narrative.

### User Story 1 - Company completes a full leasing journey for a project's machinery need (Priority: P1)

Pedro's company has a Project that requires a specific Machinery item it cannot pay for upfront. He identifies the need, requests leasing, and — once approved — receives the Machinery, pays the resulting Installments, and exercises the Acquisition Option once all of them are paid, reaching a completed Leasing Operation.

**Why this priority**: this is the entire reason Lea$e exists (Constitution, Principle III) and it is the exact Happy Path the Stage 1 POC must demonstrate end to end (Constitution, Principle V). Without this story, no other story has anything to build on.

**Independent Test**: can be fully tested by taking one Company, one Project, and one Machinery need through submission, approval, settlement of the approval's up-front conditions, delivery confirmation, payment of every Installment, and exercise of the Acquisition Option, and observing that the Leasing Operation reaches a completed state — delivers the entire value this feature exists for.

**Acceptance Scenarios**:

1. **Given** Company has a Project that requires Machinery it has not yet leased, **When** Company records that machinery need, **Then** the need is associated with that Project and is available to build a Leasing Request from.
2. **Given** a recorded machinery need, **When** Company submits a Leasing Request for it, **Then** the request is created with a unique identity, references the Company, the Project, and the Machinery need, and has status `pending`.
3. **Given** a `pending` Leasing Request that is approved, **When** Company checks its status, **Then** Company sees `approved` and a Lease now exists for that request.
4. **Given** an approved Leasing Request whose Machinery has arrived, **When** Company confirms receipt, **Then** the Leasing Operation records the Machinery as received for that specific operation.
4b. **Given** an approved Leasing Request whose conditions require an amount before the Installment schedule begins, **When** Company views those conditions and pays that amount, **Then** the schedule begins and Company can see that it has.
5. **Given** a Lease with Machinery received, **When** Company views its Installments, **Then** Company sees every Installment belonging to that Lease, each one's status, and the Certification Milestone of its Project each one falls due against.
6. **Given** an Installment whose Certification Milestone has been certified and whose Machinery receipt has been confirmed, **When** Company views it, **Then** it is `due`; **and when** Company pays it, **Then** its status becomes `paid` and Company can see it as paid from then on.
7. **Given** a Lease whose last unpaid Installment is paid, **When** Company checks the Acquisition Option, **Then** it is now `available`.
8. **Given** an `available` Acquisition Option, **When** Company exercises it, **Then** the exercise is confirmed and the Leasing Operation reaches a completed state.

---

### User Story 2 - Company tracks the outcome of a Leasing Request while it is being decided (Priority: P2)

Pedro submits a Leasing Request and needs to know, without ambiguity, whether it is still being decided, was approved, or was rejected — without that answer depending on anything else in the journey having happened yet.

**Why this priority**: Company's very first need after requesting financing is knowing where the request stands; this must hold on its own, independent of what happens after approval.

**Independent Test**: can be fully tested by submitting a Leasing Request and querying its status while `pending`, then again after it is set to `approved` or to `rejected` — delivers the value of an unambiguous financing-decision result on its own.

**Acceptance Scenarios**:

1. **Given** a newly submitted Leasing Request, **When** Company checks its status, **Then** Company sees `pending` and no Lease exists yet for it.
2. **Given** a Leasing Request that is rejected, **When** Company checks its status, **Then** Company sees `rejected` and no Lease is created for it.
3. **Given** a Leasing Request that is approved, **When** Company checks its status, **Then** Company sees `approved`, distinguishable from both `pending` and `rejected`.

---

### User Story 3 - Company tracks installment progress at any point in the Lease (Priority: P3)

Pedro's company is partway through paying a Lease's Installments and needs to know, at any moment, which are paid, which remain, and how much of the obligation is left — independent of whether the Lease has reached acquisition yet.

**Why this priority**: this need recurs throughout the life of a Lease, not only at its end, and must be answerable on its own without requiring the Acquisition Option to be reached first.

**Independent Test**: can be fully tested by creating a Lease with multiple Installments, paying some but not all of them, and confirming Company can distinguish paid from pending and see the remaining count at that point — delivers ongoing obligation visibility on its own, without completing the Lease.

**Acceptance Scenarios**:

1. **Given** a Lease with several Installments, none yet paid and none of their Milestones certified, **When** Company views them, **Then** every Installment shows status `pending`, each naming the Certification Milestone it waits on.
2. **Given** a Lease with some Installments paid, one `due`, and others still `pending`, **When** Company views them, **Then** Company can tell exactly which is which, and for each `pending` one what it is waiting on.
3. **Given** a Lease with at least one Installment not yet paid, **When** Company checks the Acquisition Option, **Then** it shows `not yet available`.

---

### Edge Cases

- **Rejected Leasing Request**: Company sees `rejected` and no Lease is created; whether Company may submit a new request for the same machinery need is deferred to a later stage (see Phased Scope) and is not part of Stage 1.
- **Request still pending**: Company sees `pending`; no Lease, Installments, or Acquisition Option exist yet for that machinery need, and the system does not present any of them as if they did.
- **Delivery has not occurred**: for an approved Leasing Request whose Machinery has not been confirmed received, Company can see that the request is approved but cannot confirm receipt, and the operation does not present Installments as due for payment ahead of that confirmation (see FR-011).
- **Attempt to pay an already-paid Installment**: the system does not allow it to be paid a second time; the Installment's status remains `paid` and this does not change the count of paid or pending Installments (FR-013).
- **Attempt to exercise the Acquisition Option while Installments remain pending**: the system does not allow the exercise; the Acquisition Option remains `not yet available` and the Leasing Operation does not reach a completed state (FR-016). The same holds for an attempt to decline it (FR-020).
- **Machinery that arrives does not match what was approved**: Company reports the mismatch rather than being forced to confirm receipt of the wrong machine; no receipt is recorded, so no Installment becomes payable (FR-009b, BR-08). What Lease Company then does about it is later-stage scope.
- **Acquisition Option available but Company has decided neither way**: the Option sits in `available` (undecided) for the 30 calendar days BR-11 allows — a named state, not an error, which `003-deployed-fleet-custody` reads as "not yet determined" rather than as a Return (FR-021). If the window closes with no decision the Option lapses and the operation reaches `Returned` (FR-026).
- **Inconsistent operation state**: Company can only see the Leasing Requests, Leases, and Installments associated with its own company; a request to view one that is not associated with it does not return another company's data (FR-018).

## Acceptance Criteria

Each criterion is atomic, observable, and traceable to a Functional Requirement. Where a criterion states a business rule's effect, it cites the rule's identifier per `business-rules.md`'s convention.

- **AC-001**: **Given** a Project that requires Machinery Company has not yet leased, **When** Company records the need, **Then** the need is retrievable as associated with that Project. *(FR-001)*
- **AC-002**: **Given** a recorded machinery need, **When** Company submits a Leasing Request, **Then** the request exists with a unique identity, status `pending`, and references to the Company, Project, Machinery need, the Project's certification schedule and the machinery's value. *(FR-002, FR-003)*
- **AC-003**: **Given** any Leasing Request belonging to Company, **When** Company queries its status, **Then** the result is exactly one of `pending`, `approved`, or `rejected` — never more than one, never none. *(FR-004)*
- **AC-004**: **Given** a Leasing Request that becomes `approved`, **When** Company checks for a corresponding Lease, **Then** exactly one Lease now exists, traceable back to that Leasing Request. *(FR-005, FR-006)*
- **AC-005**: **Given** a Leasing Request that becomes `rejected`, **When** Company checks for a corresponding Lease, **Then** none exists for that request. *(FR-007)*
- **AC-006**: **Given** an approved Leasing Request whose Machinery has arrived, **When** Company confirms receipt — which is the same act as accepting whatever `003-deployed-fleet-custody` requires the client to accept of a handover (its FR-003) — **Then** the confirmation is recorded against that specific Leasing Operation and is retrievable afterward, carrying everything that handover record required Company to accept. *(FR-008)*
- **AC-007**: **Given** a Leasing Request that is `pending` or `rejected`, **When** Company attempts to confirm Machinery receipt for it, **Then** the system does not record a receipt confirmation. *(FR-009)*
- **AC-008**: **Given** a Lease, **When** Company views its Installments, **Then** every Installment belonging to that Lease is listed with its own status, its own amount, and the named Certification Milestone of its Project whose certification makes it fall due — instalments are anchored to the project's certified progress, never to a calendar date (BR-04). *(FR-010)*
- **AC-008c**: **Given** an Installment whose Certification Milestone has been certified and whose Leasing Operation has a confirmed Machinery receipt, **When** Company views it, **Then** its status is `due` (BR-04, BR-08). *(FR-010b)*
- **AC-008d**: **Given** an Installment for which either its Milestone's certification or its Machinery receipt is unmet, **When** Company views it, **Then** its status is `pending`. *(FR-010b)*
- **AC-008e**: **Given** a `pending` Installment, **When** Company retrieves it, **Then** which of the two conditions it is still waiting on is retrievable. *(FR-010c)*
- **AC-008b**: **Given** an approved Leasing Operation for which the arriving Machinery is not the machine named in that operation's approval conditions, **When** Company reports the mismatch instead of confirming receipt, **Then** the report is recorded against that operation and no receipt confirmation is recorded for it. *(FR-009b)*
- **AC-009**: **Given** a Lease whose Machinery receipt has not been confirmed, **When** Company attempts to pay any of its Installments, **Then** the system rejects the attempt — installments are not payable ahead of confirmed delivery (BR-08). *(FR-011)*
- **AC-010**: **Given** a Lease and one of its `due` Installments, **When** Company pays it, **Then** that Installment's status becomes `paid`, and no other Installment's status changes. *(FR-012)*
- **AC-010b**: **Given** an Installment that is still `pending` because its Certification Milestone has not been certified, **When** Company attempts to pay it, **Then** the system rejects the attempt — an instalment is not payable before the project progress it is anchored to has been certified (BR-04). *(FR-012)*
- **AC-011**: **Given** an Installment already `paid`, **When** Company attempts to pay it again, **Then** the system rejects the attempt. *(FR-013)*
- **AC-011b**: **Given** a rejected second payment on a `paid` Installment, **When** Company retrieves the Lease, **Then** that Installment's status and the Lease's paid, due and pending counts are unchanged. *(FR-013)*
- **AC-012**: **Given** a Lease, **When** Company requests the counts of its `paid`, `due` and `pending` Installments, **Then** the three counts sum to the Lease's total number of Installments. *(FR-014)*
- **AC-012b**: **Given** a Lease, **When** Company requests the total amounts of its `paid`, `due` and `pending` Installments, **Then** the three amounts sum to the Lease's total obligation. *(FR-014)*
- **AC-013**: **Given** a Lease with at least one Installment not yet `paid`, **When** Company checks the Acquisition Option, **Then** it is `not yet available`. *(FR-015)*
- **AC-014**: **Given** a Lease whose Installments are all `paid`, **When** Company checks the Acquisition Option, **Then** it is `available` (BR-07). *(FR-015)*
- **AC-014b**: **Given** an `available` Acquisition Option, **When** Company exercises it, **Then** the system requires no payment beyond the Installments already paid — the option to acquire costs nothing further once every instalment is settled (BR-07). *(FR-017)*
- **AC-015**: **Given** an Acquisition Option that is `not yet available`, **When** Company attempts to exercise it, **Then** the system rejects the attempt and the Leasing Operation does not reach a completed state. *(FR-016)*
- **AC-016**: **Given** an `available` Acquisition Option, **When** Company exercises it, **Then** the exercise is confirmed. *(FR-017)*
- **AC-016c**: **Given** an exercised Acquisition Option, **When** Company retrieves the Leasing Operation, **Then** it is `Acquired` — a terminal state distinguishable from every non-terminal state this feature defines. *(FR-017)*
- **AC-017**: **Given** two different Companies, **When** either queries Leasing Requests, Leases, or Installments, **Then** each sees only the records associated with itself. *(FR-018)*
- **AC-018**: **Given** an Acquisition Option that is `available`, **When** Company declines it, **Then** the decline is confirmed and the Leasing Operation's state becomes unambiguously `Returned`, distinguishable from `Acquired` and from `available` (undecided). *(FR-019)*
- **AC-019**: **Given** an Acquisition Option that is `not yet available`, **When** Company attempts to decline it, **Then** the system rejects the attempt. *(FR-020)*
- **AC-020**: **Given** any of Company's Leases, **When** Company queries its Acquisition Option, **Then** the result is exactly one of `not yet available`, `available`, `exercised`, `declined`, or `lapsed` — never more than one, never none. *(FR-021)*
- **AC-025**: **Given** an Acquisition Option that has been `available` for 30 calendar days without Company exercising or declining it, **When** the window closes, **Then** the Option is `lapsed` and the Leasing Operation is `Returned` — closed without acquisition (BR-11). *(FR-026)*
- **AC-025b**: **Given** an `available` Acquisition Option inside BR-11's window, **When** Company retrieves it, **Then** how much of the window remains is retrievable. *(FR-026)*
- **AC-027**: **Given** a Leasing Operation for which Company has reported a machinery mismatch, **When** Company retrieves it, **Then** it is in the named state `awaiting resolution of a reported mismatch` — not unnamed and not complete. *(FR-028)*
- **AC-028**: **Given** a Leasing Operation against which Lease Company has recorded a Default Declaration, **When** Company retrieves it, **Then** it is in the named terminal state `terminated for default`, distinct from `Acquired` and from `Returned`. *(FR-028)*
- **AC-028b**: **Given** a requirement to restore cover raised against its own Leasing Operation, **When** Company retrieves that operation, **Then** what is being asked for and why is stated to it. *(FR-029)*
- **AC-028c**: **Given** a requirement to restore cover it can see, **When** Company records what it supplies in answer, **Then** the answer is observable to the Underwriter who raised the requirement (`002` FR-030b). *(FR-029)*
- **AC-026**: **Given** a Certification Milestone of Company's Project that has been certified and paid, **When** Company reports it, **Then** the report is recorded against the operation and is observable to the Underwriter who records certifications for it. *(FR-027)*
- **AC-024**: **Given** a `pending` Leasing Request against which a request for further evidence has been raised, **When** Company supplies what was asked for, **Then** the response is recorded against that request and is observable to the Underwriter who raised it. *(FR-025)*
- **AC-023**: **Given** an approved Leasing Request whose conditions require an amount payable before the Installment schedule begins, **When** Company pays it, **Then** the payment is recorded and Company can retrieve that the Installment schedule has begun. *(FR-024, FR-022)*
- **AC-023b**: **Given** an approved Leasing Request whose conditions require no amount before the schedule begins, **When** Company retrieves it, **Then** the Installment schedule has begun without one. *(FR-024)*
- **AC-022**: **Given** a `pending` Leasing Request, **When** Company retrieves it, **Then** the time elapsed since it was submitted is retrievable, so a request pending for six weeks is distinguishable from one submitted today. *(FR-023)*
- **AC-021**: **Given** a Leasing Request that becomes `approved`, **When** Company retrieves it, **Then** the conditions it was approved under are retrievable with it, including any amount payable before the Installment schedule begins. *(FR-022)*

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow Company to record a machinery need associated with one of its Projects.
- **FR-002**: The system MUST allow Company to submit a Leasing Request for a recorded machinery need, referencing the Company, the Project, the machinery need, the Supplier when it is already known, the Project's certification schedule — the points at which Company expects its Project to be certified and paid, with the date and amount it expects from each — and the machinery's value, the price Company would pay to buy it outright. **Amended 2026-08-21, per EVAL iteration 02:** the certification schedule is what an Installment is anchored to (BR-04) and what `002`'s FR-007 requires before any approval, and it was described there as "disclosed by the Applicant at application" while nothing here asked Company for it — so the most load-bearing evidence of the whole decision had no intake path and reached Lease Company only by request.
- **FR-003**: The system MUST assign each Leasing Request a unique identity and an initial status of `pending` at submission.
- **FR-004**: The system MUST allow Company to retrieve the current status — `pending`, `approved`, or `rejected` — of any Leasing Request it submitted, at any time.
- **FR-005**: When a Leasing Request's status becomes `approved`, the system MUST create a corresponding Lease without requiring a further action from Company.
- **FR-006**: The system MUST make an approved Leasing Request's resulting Lease traceable back to that Leasing Request, its Project, and its machinery need.
- **FR-007**: When a Leasing Request's status becomes `rejected`, the system MUST make that status observable to Company and MUST NOT create a Lease for that request.
- **FR-008**: The system MUST allow Company to confirm that it received the Machinery for a specific Leasing Operation whose Leasing Request is `approved`. Company's confirmation of receipt and its acceptance of the handover record described in [`003-deployed-fleet-custody`](../003-deployed-fleet-custody/spec.md) (its FR-003) are the same act, not two: Company accepts, in the same moment it confirms it received the machine, everything that handover record requires the client to accept. This feature does not enumerate those elements and does not restate which of them the client accepts: `003` FR-003 is where that list lives and where it changes. **Amended 2026-08-21, per EVAL iteration 07:** an earlier version of this sentence promised exactly that and then enumerated anyway, including the machine's assessed value among what Company accepts — which `003` FR-003 expressly excludes, since the assessed value is Lea$e's own view of its security rather than a term of the contract. The enumeration is removed rather than corrected: keeping one list in one place is the point. **Amended 2026-08-21, per persona-agent review of issue #5:** stated here because otherwise nothing forbade a machine being delivered, confirmed and paid against with no handover baseline ever recorded — which is precisely the dispute `003` exists to make impossible.
- **FR-009**: The system MUST NOT allow Company to confirm Machinery receipt for a Leasing Operation whose Leasing Request is not `approved`.
- **FR-009b**: The system MUST allow Company, instead of confirming receipt, to report that the Machinery arriving for an approved Leasing Operation is not the machine that operation was approved for — that is, that it is not the machine named in the approval's conditions (`002` FR-012), which Company can see under FR-022. **Amended 2026-08-21, per EVAL iteration 01:** "does not match" was previously undefined and load-bearing, so no one could declare the criterion met or unmet; the approval names a machine, and that name is the comparison. `[ASSUMPTION: whether a machine of the same model but a different unit counts as the approved machine is left to the approval's own conditions, which is where "which machine" is stated; this feature compares against whatever those conditions named rather than inventing a matching rule.]` **Added 2026-08-21, per persona-agent review of issue #5:** Company previously had exactly one action at delivery — confirm receipt — with no way to record that the wrong machine arrived, despite this feature's own Out of Scope naming "that the *expected* machinery arrived" as a result Company must be able to observe. What happens after a mismatch report — replacement, a fresh Leasing Request, a Lease Company review — is a later-stage decision (see Phased Scope); this feature only guarantees the report itself is not lost in a forced confirmation.
- **FR-010**: The system MUST make every Installment belonging to a Lease individually identifiable to Company, including its own status of `pending`, `due` or `paid`, its own amount, and the Certification Milestone of Company's Project whose certification makes it fall due (BR-04).
- **FR-010b**: The system MUST make an Installment `due` when, and only when, both the Certification Milestone it is anchored to has been certified (BR-04) and Company has confirmed Machinery receipt for that Leasing Operation (BR-08); until both hold it stays `pending`. **Added 2026-08-21, per EVAL iteration 01:** this feature previously gave an Installment a status and an amount and no due condition at all, so the actor whose entire problem is that his project pays at the end had a payment model that did not mention his project. An Installment that falls due on a date rather than on certified progress recreates exactly the shortfall that stopped Company from buying the machine outright (Constitution, Principle III).
- **FR-010c**: The system MUST make retrievable, for any `pending` Installment of Company's Leases, which of the two conditions of FR-010b it is still waiting on — the certification of its Milestone, the confirmation of Machinery receipt, or both.
- **FR-011**: The system MUST NOT present a Lease's Installments as due for payment before Company has confirmed Machinery receipt for that Leasing Operation (BR-08). `[ASSUMPTION: the Installment schedule exists once the Lease exists; what BR-08 gates is Company's ability to pay against it, not the schedule's existence]`
- **FR-012**: The system MUST allow Company to pay a `due` Installment belonging to one of its Leases, changing that Installment's status to `paid`, and MUST NOT allow it to pay one that is still `pending`.
- **FR-013**: The system MUST NOT allow an Installment already `paid` to be paid again.
- **FR-014**: The system MUST allow Company to determine, at any time, both the number and the total amount of `paid`, of `due`, and of `pending` Installments for any of its Leases, such that the three together account for every Installment of that Lease. **Amended 2026-08-21:** the earlier wording gave counts only, which did not satisfy this feature's own stated need — "Know how much of the Lease's obligation remains" — for an actor whose entire problem is cash flow.
- **FR-015**: The system MUST make the Acquisition Option of a Lease reach `available` when, and only when, every Installment belonging to that Lease is `paid` (BR-07); before that it MUST be `not yet available`. Once `available`, the Option leaves that state only by Company exercising it (FR-017), declining it (FR-019), or letting BR-11's 30-day window close so that it lapses (FR-026) — never by returning to `not yet available`. **Amended 2026-08-21, per EVAL iterations 01 and 03:** the original "if and only if … otherwise `not yet available`" contradicted the state model, since after an exercise or a decline every Installment is still paid and the biconditional demanded `available`; a later pass then listed only two exits and omitted the lapse this feature's own FR-026 produces.
- **FR-016**: The system MUST NOT allow Company to exercise an Acquisition Option that is `not yet available`.
- **FR-017**: The system MUST allow Company to exercise an `available` Acquisition Option at no cost beyond the Installments already paid (BR-07), and MUST bring the corresponding Leasing Operation to an unambiguous completed state once exercised.
- **FR-018**: The system MUST restrict a Company's visibility of Leasing Requests, Leases, and Installments to those associated with that Company.
- **FR-028**: The system MUST make every Leasing Operation retrievable in exactly one named state at all times, including the states it reaches when the journey does not complete: `awaiting resolution of a reported mismatch` after Company reports the arriving machine is not the one approved (FR-009b), and `terminated for default` once Lease Company records a Default Declaration against it (`002` FR-020). **Added 2026-08-21, per EVAL iteration 03:** SC-005 promises every Leasing Operation reaches exactly one state this specification defines, and two paths escaped it — a mismatch report left the operation with no name at all, and a defaulted operation could never reach `Acquired` or `Returned`, since both require instalments that a default means were never all paid. `003` had already added Recovery Close for the same reason on its side; this is the matching state on Company's.
- **FR-019**: The system MUST allow Company to explicitly decline an `available` Acquisition Option, bringing the Leasing Operation to a `Returned` terminal state distinct from the `Acquired` state FR-017 produces. **Added 2026-08-21, per persona-agent review of issue #5:** without an explicit decline, `003-deployed-fleet-custody` had no way to distinguish "not yet exercised, still open" from "not exercised, will not be" — every Deployment read as heading for `Return` for its entire life, which defeated Julia's need to know which end applies before the term ends. A decline is Company's own act, symmetric with exercising: neither is inferred from the mere passage of time.
- **FR-020**: The system MUST NOT allow Company to decline an Acquisition Option that is `not yet available`, mirroring FR-016.
- **FR-021**: The system MUST make it retrievable, for any of Company's Leases, whether its Acquisition Option is `not yet available`, `available` (undecided), `exercised`, `declined`, or `lapsed`.
- **FR-026**: The system MUST make an `available` Acquisition Option lapse if Company neither exercises nor declines it within 30 calendar days of it becoming available, bringing the Leasing Operation to the same terminal outcome as a decline — the machine returns and the operation closes without acquisition (BR-11). The system MUST make the remaining time retrievable to Company throughout that window. **Added 2026-08-21, per EVAL iteration 02:** an Option that could sit `available` forever left the Leasing Operation with no terminal state and, on `003`'s side, a Deployment that could never close and a machine its FR-002 would block from any later contract permanently. Both specs had recorded this as shared unresolved scope; BR-11 resolves it rather than deferring it again.
- **FR-029**: The system MUST make a requirement to restore cover raised against Company's own Leasing Operation (`002` FR-030) observable to Company, stating what is being asked for and why, and MUST allow Company to record what it supplies in answer, making that answer observable to the Underwriter who raised it (`002` FR-030b). **Added 2026-08-21, per EVAL iteration 07:** `002` gave Underwriter a demand and gave Company no way to see it or answer it — the same defect FR-025 was added to close for a lesser demand, where the request for further evidence terminated at Company's end. A demand the party bound by it cannot see is a note to file, and one it cannot answer on the record is a state with no exit.
- **FR-027**: The system MUST allow Company to report that a Certification Milestone of its own Project has been certified and paid, and MUST make that report observable to the Underwriter who records certifications for the operation (`002` FR-024). **Added 2026-08-21, per EVAL iteration 03:** certification is the single event that makes any of Company's Installments payable, and Company — whose project it is — had no way to report it, so FR-010c would tell Company it was waiting on a certification and Company would then have to go and ask someone, which is the posture this feature exists to remove. `[ASSUMPTION: the report does not itself certify anything — Underwriter still records the Certification Record under `002` FR-024, because it is evidence of the operation and its recorder is the same person who records every other Evidence Item. What this closes is the absence of any path from the party who knows first.]`
- **FR-025**: The system MUST allow Company to respond to a request for further evidence raised against its Leasing Request (`002` FR-025), supplying what was asked for, and MUST make the response observable to the Underwriter who asked. **Added 2026-08-21, per EVAL iteration 02:** `002` made the request observable to Company and gave Company no way to answer it, so the one mechanism that could unstick a long-`pending` request terminated at Company's end — which is the opposite of what it was added for.
- **FR-024**: The system MUST allow Company to pay any amount its approval conditions require before the Installment schedule begins (FR-022), MUST NOT begin the Installment schedule until every condition the approval requires to be met beforehand has been met, and MUST make retrievable whether that amount has been paid, which conditions remain outstanding, and whether the Installment schedule has therefore begun. Where the conditions require no such amount, the schedule begins without one. **Added 2026-08-21, per EVAL iteration 02:** `002`'s FR-012 makes a down payment a condition an approval may carry and FR-022 here makes it visible to Company, but no requirement let Company discharge it or read its state — leaving a sum Company had been told it owed, at the one moment between confirming receipt and paying instalments, with no way to settle it. An unpayable upfront charge is the liquidity gap this feature exists to close, reintroduced at the front (Constitution, Principle III).
- **FR-023**: The system MUST record when a Leasing Request was submitted and make the elapsed time since submission retrievable to Company for as long as the request is `pending`. **Added 2026-08-21, per EVAL iteration 01:** Company could tell *which* state a request was in but never *how long* it had been there, so `pending` submitted yesterday and `pending` submitted six weeks ago read identically — while the failure `personas/Pedro.MD` names is not "pending" but "pending long enough to threaten the project's timeline". Making the wait visible is what lets Company act on it at all. `[ASSUMPTION: this makes the wait observable; it does not commit Lea$e to any turnaround, which stays a business decision about what Lea$e promises applicants (see Later stages).]`
- **FR-022**: The system MUST make the conditions an approved Leasing Request was granted under — including any amount Company must pay before the Installment schedule begins — observable to Company at the moment the request becomes `approved`. **Added 2026-08-21, per persona-agent review of issue #5:** `002`'s FR-012 forbids an approval without Conditions, and a down payment is one of them; FR-004 previously surfaced only the word `approved`. An upfront charge Company learns about late is the same liquidity gap this feature exists to close (Constitution, Principle III), arriving at the front instead of the finish line — and FR-014's total obligation, being the sum of Installment amounts, does not include it.

### Key Entities

- **Company**: the Peruvian corporate or SME client this feature is written for. Owns Projects, machinery needs, Leasing Requests, Leases, and the Installments and Acquisition Option that belong to those Leases.
- **Project**: the undertaking of Company that a machinery need is tied to. Referenced by a Leasing Request; not otherwise managed by this feature.
- **Machinery (need)**: the equipment Company needs for a Project. Referenced by a Leasing Request and, once delivered, by the confirmed-receipt milestone of a Leasing Operation.
- **Supplier**: the origin of the Machinery. Recorded on a Leasing Request when known; the party Lease Company purchases from once a request is approved (result-only, see Out of Scope).
- **Leasing Request**: Company's ask for financing. Has an identity, a status (`pending` / `approved` / `rejected`), and references to Company, Project, Machinery need, and optionally Supplier. Produces a Lease only when `approved`.
- **Lease**: the financing arrangement created from an approved Leasing Request. Owns a set of Installments and one Acquisition Option; carries the confirmed-receipt milestone for its Machinery.
- **Installment**: one payment obligation belonging to a Lease. Has a status (`pending` / `due` / `paid`), an amount, and the Certification Milestone of Company's Project it is anchored to (BR-04). A Lease's Installments collectively determine when its Acquisition Option becomes available.
- **Certification Milestone**: the point of Company's Project whose certification makes an anchored Installment fall due. Referenced by this feature as the thing Company can see an Installment waiting on; the recording of its certification belongs to `002-leasing-request-underwriting`.
- **Acquisition Option**: the right, belonging to a Lease, to acquire its Machinery. Has exactly one status at any time — `not yet available`, `available` (undecided), `exercised`, `declined`, or `lapsed`. Availability is determined entirely by whether all of the Lease's Installments are `paid` (BR-07); the choice between `exercised` and `declined` is Company's own act, and letting the 30-day window of BR-11 close without either is what produces `lapsed`. `exercised` ends the Leasing Operation `Acquired`; `declined` and `lapsed` both end it `Returned`.

## Phased Scope

### Stage 1 — POC Happy Path

Stage 1 is the happy path User Story 1 describes, taken in order and with the two points where it touches the other stories made explicit — step 4 is where User Story 2's status check lands once the decision is made, and step 13 is User Story 3's mid-lease view. It is exactly what the POC referenced by Constitution Principle V builds:

1. Company has a Project that requires Machinery.
2. Company records the machinery need.
3. Company submits a Leasing Request for it.
4. Company can query the request's status.
5. The request is approved (the Financing Decision's own reasoning is out of scope; for Stage 1 it need only be reachable as a business-decided outcome — see Key Product Decisions).
6. Lease Company purchases the Machinery from Supplier (result-only: this step exists so step 7 can happen; its internal mechanics are out of scope).
7. The Machinery reaches Company, and Lease Company's fleet manager conducts the handover — the same moment `003-deployed-fleet-custody`'s Stage 1 step 2 describes from its own side. Whether the machine travels from Supplier directly or through Lea$e is result-only here.
8. Company confirms it received the Machinery for that Leasing Operation, which is the same act as accepting the handover record (FR-008).
9. Company sees the conditions the approval carried (FR-022) and settles any that must be met before the schedule begins — in the POC scenario a down payment within BR-12's cap (FR-024).
10. Company can view the Lease's Installments — each one's status, its amount, and the Certification Milestone of its Project whose certification makes it fall due (BR-04).
11. Each Installment becomes `due` when its Certification Milestone is certified — a step Lease Company performs, staged as step 13 of [`002`](../002-leasing-request-underwriting/spec.md)'s own Stage 1 — and Company has confirmed receipt. **This is the step that makes the POC demonstrate the gap rather than a generic ledger:** payment follows the project's certified progress, not a date.
12. Company pays each Installment once it is `due`.
13. Company can tell, at any point, which Installments are paid, which are due, and which are still pending — and for the pending ones, what they are waiting on.
14. Once every Installment is paid, the Acquisition Option becomes `available`.
15. Company exercises the Acquisition Option, within the 30-day window BR-11 allows.
16. The Leasing Operation reaches the unambiguous terminal state `Acquired`.

Nothing in Stage 1 assumes a rejection, a delay, a partial delivery, or more than one machinery need per Leasing Request.

**Requirements this feature defines that Stage 1 does *not* exercise**, listed so Principle V's boundary can actually be applied: FR-019 and FR-026 (declining an Option, and letting it lapse — Stage 1 exercises it), FR-023 (elapsed time on a `pending` request — Stage 1's request is decided without a wait worth measuring), FR-025 (answering a request for further evidence — Stage 1's file is complete), FR-027 (Company reporting a certification — in Stage 1 Lease Company records it under `002` FR-024), FR-009b and the mismatch state of FR-028 (Stage 1's machine is the approved one), FR-028's `terminated for default` (Stage 1 never defaults), and FR-029 (answering a requirement to restore cover — Stage 1's operation never becomes impaired, since `002`'s own Stage 1 excludes impairment for the same reason). Each is specified here and demonstrated later.

### Later stages (not Stage 1)

The following are real, useful boundaries for future scope, not commitments made by this feature:

- Handling a `rejected` Leasing Request beyond observing its status — including whether and how Company may resubmit.
- Cancellation or withdrawal of a Leasing Request, or of a Lease already in progress.
- Any commitment by Lea$e to decide a Leasing Request within a stated time, and any move Company can make when a decision is taking too long — withdrawing the request, escalating it, or taking the machinery need elsewhere. FR-023 now makes the wait *visible*, which is what lets Company act on it at all; what Lea$e promises about it, and what Company may do in response, stay deferred. `[ASSUMPTION: a turnaround commitment is a business decision about what Lea$e offers applicants, not a fact this specification can derive.]`
- Overdue Installments and any consequence of a missed payment.
- A Leasing Request or Lease spanning more than one Machinery item.
- Multiple concurrent Projects or Leases for the same Company.
- Partial Machinery delivery.
- What Lease Company does about a reported Machinery mismatch (FR-009b) — replacement, a fresh Leasing Request, or a review of the approval. This feature guarantees only that Company can report it.
- Exceptional payment scenarios (e.g., early payoff, partial Installment payment).
- Any extension of BR-11's 30-day decision window, and whether a Company whose Option lapsed may re-open it.
- What Lease Company does with the Machine once the Leasing Operation reaches `Returned` — the actual return logistics are `003-deployed-fleet-custody`'s `Return`, not this feature's.
- Richer Supplier interactions beyond the result Company observes.
- Carlos's and Julia's own flows, as Lease Company-side actors — specified separately in `002-leasing-request-underwriting` and `003-deployed-fleet-custody` (see Out of Scope).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For one Company, one Project, and one machinery need, the entire Stage 1 journey — from recording the need through a completed Leasing Operation — can be walked through end to end using only the capabilities this feature defines, with no step requiring information from outside the system.
- **SC-002**: For any Leasing Request Company has submitted, Company can determine its status (`pending` / `approved` / `rejected`) without that determination ever being undefined or contradictory.
- **SC-003**: For any Lease, Company can determine the exact number of `paid`, `due` and `pending` Installments at any point in the Lease's life, and the three numbers always account for every Installment in the Lease.
- **SC-004**: For any Lease, Company can determine whether the Acquisition Option is `available` with no state in which availability cannot be determined.
- **SC-005**: Every Leasing Request and every Leasing Operation defined by this feature reaches exactly one of the states this specification defines — none is left in a state this specification does not name.

## Assumptions

- `[ASSUMPTION]` Pedro represents Company; see Users and Their Needs.
- Company operates through projects — this is not an invented assumption, it restates BR-02 directly.
- `[ASSUMPTION]` In Stage 1, one machinery need is associated with one Leasing Request; multi-item requests are later-stage scope.
- `[ASSUMPTION]` Stage 1 treats an approved Leasing Request as a reachable, business-decided outcome; the method Lease Company uses to decide is not part of this feature.
- `[ASSUMPTION]` Machinery receipt becomes an observable milestone through an explicit confirmation action by Company, rather than being inferred automatically from Supplier-side data.
- `[ASSUMPTION]` All Installments needed to demonstrate Stage 1 can be completed within the POC scenario without a real banking integration (Constitution, Ambiguity and Assumptions).
- Acquisition becomes available strictly after every Installment of the Lease is paid, at no further cost — this restates BR-07 directly (see `docs/LAB-02-ARQ-2026.2.md` for the diagram it derives from), not an invented assumption.
- An available Acquisition Option Company has neither exercised nor declined is a named, non-terminal state (`available`) that stands for 30 calendar days and then lapses to `Returned` — this restates BR-11, not an invented assumption. Company may also decline explicitly (FR-019), reaching `Returned` sooner; exercising reaches `Acquired`.
- `[ASSUMPTION]` A Leasing Request, once `rejected`, is not retried within Stage 1; resubmission is later-stage scope.

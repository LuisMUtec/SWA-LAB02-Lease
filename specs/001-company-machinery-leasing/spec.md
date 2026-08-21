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
- **Installment**: one scheduled payment obligation belonging to a Lease. Each Installment has its own status (pending or paid); a Lease's Installments together represent Company's full payment obligation.
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
- Know what payment obligations (Installments) the resulting Lease carries.
- Pay those Installments.
- Distinguish which Installments are paid and which remain pending.
- Know how much of the Lease's obligation remains.
- Know, unambiguously, when the conditions to exercise the Acquisition Option are met.
- Exercise the Acquisition Option once available.
- Reach a final state for the Leasing Operation that leaves no doubt about the state of the Machinery and of the Lease.

## Key Product Decisions

- **What constitutes a Leasing Request**: an identified ask that references one Company, one Project, and the Machinery need it is for, with the Supplier recorded when it is already known. It receives its own identity and a status the moment it is submitted — it does not require the Machinery, the Supplier, or the Financing Decision to already exist. `[ASSUMPTION: in Stage 1, a Leasing Request is associated with exactly one machinery need; requests spanning multiple machinery items belong to a later stage]`.
- **States that must be visible to Company**: a Leasing Request is always in exactly one of `pending`, `approved`, or `rejected`. An Installment is always in exactly one of `pending` or `paid`. The Acquisition Option is always either `not yet available` or `available`. The Leasing Operation as a whole is always either still in progress or in a defined terminal state (see Acceptance Criteria). No state is left undetermined.
- **When an approved request moves the operation forward**: approval is itself the trigger. Once a Leasing Request is `approved`, Company does not need to take a separate action for Lease Company to proceed toward purchasing and delivering the Machinery — the internal purchase from Supplier is Lease Company's process, and what this feature specifies is that its result (the Machinery arriving) becomes observable and confirmable by Company.
- **What a rejected request means**: a `rejected` Leasing Request never produces a Lease. Whether Company may submit a new Leasing Request for the same machinery need after a rejection is a later-stage decision (see Phased Scope), not part of Stage 1.
- **How Machinery receipt is recognized**: Company explicitly confirms that it received the Machinery for a specific Leasing Operation. `[ASSUMPTION: receipt becomes an observable, confirmed milestone through an explicit Company action, rather than being inferred automatically from Supplier-side data the brief does not describe]`.
- **When the Acquisition Option becomes available**: exactly when every Installment belonging to the Lease is `paid`. This is not a decision this spec makes — it is BR-07, catalogued in [`business-rules.md`](../../business-rules.md) from the brief's own diagram (*"Pago TODAS las cuotas → opciones de adquisición"*). `[CLARIFY: does exercising the Acquisition Option require anything beyond every Installment being paid — for example, an additional residual-value payment — or is it available at no further cost once Installments are complete? BR-07 carries the same question as an open assumption; it is a business decision, not a spec decision, and Stage 1 assumes no further cost.]`
- **What constitutes a completed Leasing Operation**: for Stage 1, a Leasing Operation is complete once Company exercises an available Acquisition Option and the system confirms the exercise. `[CLARIFY: if Company does not exercise an available Acquisition Option, what terminal state does the Leasing Operation reach? The brief's diagram only shows the path through acquisition, so Stage 1 treats exercising the option as part of the happy path itself; a distinct "available but not exercised" terminal outcome is left for a later stage.]`
- **What belongs to Stage 1**: exactly the happy-path journey enumerated in Phased Scope below — nothing that assumes a rejection, a delay, or a dispute.

## Expected User Experience

From Company's side, the experience this feature must produce is defined by what Company can always determine, not by any particular screen:

- **Clarity of status**: at any point, Company can state which of the defined states its Leasing Request, its Lease's Installments, and its Acquisition Option are in, without needing to ask anyone.
- **Continuity of the journey**: a machinery need, its Leasing Request, the resulting Lease, its Installments and its Acquisition Option are all traceable back to one another — Company is never left to guess which Lease an Installment belongs to, or which Project a Leasing Request was for.
- **Visibility of outstanding obligations**: Company can always tell how many Installments remain pending for a given Lease and how many have been paid.
- **Explicit confirmation of milestones**: the Financing Decision, the Machinery receipt, each Installment payment, and the exercise of the Acquisition Option are each confirmed events Company can point to — none of them is left implicit.
- **No ambiguity about acquisition availability**: Company is never in a state where it cannot tell whether the Acquisition Option is available yet.
- **No ambiguity about completion**: once a Leasing Operation is complete, Company can tell that it is complete, and can tell the state of the Machinery (acquired) and of the Lease (closed) without contradiction.

## User Scenarios & Testing *(mandatory)*

Each user story below is independently testable and is written from Company's side. Each Acceptance Scenario is the atomic, Given/When/Then form of the corresponding need; the **Acceptance Criteria** section restates and cross-references the same guarantees against Functional Requirements for traceability, without repeating their narrative.

### User Story 1 - Company completes a full leasing journey for a project's machinery need (Priority: P1)

Pedro's company has a Project that requires a specific Machinery item it cannot pay for upfront. He identifies the need, requests leasing, and — once approved — receives the Machinery, pays the resulting Installments, and exercises the Acquisition Option once all of them are paid, reaching a completed Leasing Operation.

**Why this priority**: this is the entire reason Lea$e exists (Constitution, Principle III) and it is the exact Happy Path the Stage 1 POC must demonstrate end to end (Constitution, Principle V). Without this story, no other story has anything to build on.

**Independent Test**: can be fully tested by taking one Company, one Project, and one Machinery need through submission, approval, delivery confirmation, payment of every Installment, and exercise of the Acquisition Option, and observing that the Leasing Operation reaches a completed state — delivers the entire value this feature exists for.

**Acceptance Scenarios**:

1. **Given** Company has a Project that requires Machinery it has not yet leased, **When** Company records that machinery need, **Then** the need is associated with that Project and is available to build a Leasing Request from.
2. **Given** a recorded machinery need, **When** Company submits a Leasing Request for it, **Then** the request is created with a unique identity, references the Company, the Project, and the Machinery need, and has status `pending`.
3. **Given** a `pending` Leasing Request that is approved, **When** Company checks its status, **Then** Company sees `approved` and a Lease now exists for that request.
4. **Given** an approved Leasing Request whose Machinery has arrived, **When** Company confirms receipt, **Then** the Leasing Operation records the Machinery as received for that specific operation.
5. **Given** a Lease with Machinery received, **When** Company views its Installments, **Then** Company sees every Installment belonging to that Lease and each one's status.
6. **Given** a Lease with at least one `pending` Installment, **When** Company pays that Installment, **Then** its status becomes `paid` and Company can see it as paid from then on.
7. **Given** a Lease whose last `pending` Installment is paid, **When** Company checks the Acquisition Option, **Then** it is now `available`.
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

1. **Given** a Lease with several Installments, none yet paid, **When** Company views them, **Then** every Installment shows status `pending`.
2. **Given** a Lease with some Installments paid and some pending, **When** Company views them, **Then** Company can tell exactly which are `paid` and which are `pending`.
3. **Given** a Lease with at least one Installment still pending, **When** Company checks the Acquisition Option, **Then** it shows `not yet available`.

---

### Edge Cases

- **Rejected Leasing Request**: Company sees `rejected` and no Lease is created; whether Company may submit a new request for the same machinery need is deferred to a later stage (see Phased Scope) and is not part of Stage 1.
- **Request still pending**: Company sees `pending`; no Lease, Installments, or Acquisition Option exist yet for that machinery need, and the system does not present any of them as if they did.
- **Delivery has not occurred**: for an approved Leasing Request whose Machinery has not been confirmed received, Company can see that the request is approved but cannot confirm receipt, and the operation does not present Installments as due for payment ahead of that confirmation (see FR-011).
- **Attempt to pay an already-paid Installment**: the system does not allow it to be paid a second time; the Installment's status remains `paid` and this does not change the count of paid or pending Installments (FR-013).
- **Attempt to exercise the Acquisition Option while Installments remain pending**: the system does not allow the exercise; the Acquisition Option remains `not yet available` and the Leasing Operation does not reach a completed state (FR-016).
- **Inconsistent operation state**: Company can only see the Leasing Requests, Leases, and Installments associated with its own company; a request to view one that is not associated with it does not return another company's data (FR-018).

## Acceptance Criteria

Each criterion is atomic, observable, and traceable to a Functional Requirement. Where a criterion states a business rule's effect, it cites the rule's identifier per `business-rules.md`'s convention.

- **AC-001**: **Given** a Project that requires Machinery Company has not yet leased, **When** Company records the need, **Then** the need is retrievable as associated with that Project — Company is eligible to do this because it is a company that works by project (BR-02). *(FR-001)*
- **AC-002**: **Given** a recorded machinery need, **When** Company submits a Leasing Request, **Then** the request exists with a unique identity, status `pending`, and references to the Company, Project, and Machinery need. *(FR-002, FR-003)*
- **AC-003**: **Given** any Leasing Request belonging to Company, **When** Company queries its status, **Then** the result is exactly one of `pending`, `approved`, or `rejected` — never more than one, never none. *(FR-004)*
- **AC-004**: **Given** a Leasing Request that becomes `approved`, **When** Company checks for a corresponding Lease, **Then** exactly one Lease now exists, traceable back to that Leasing Request. *(FR-005, FR-006)*
- **AC-005**: **Given** a Leasing Request that becomes `rejected`, **When** Company checks for a corresponding Lease, **Then** none exists for that request. *(FR-007)*
- **AC-006**: **Given** an approved Leasing Request whose Machinery has arrived, **When** Company confirms receipt, **Then** the confirmation is recorded against that specific Leasing Operation and is retrievable afterward. *(FR-008)*
- **AC-007**: **Given** an approved Leasing Request whose Machinery receipt has not been confirmed, **When** Company attempts to confirm receipt for it before that Machinery exists for the operation, **Then** the system does not record a receipt confirmation. *(FR-009)*
- **AC-008**: **Given** a Lease, **When** Company views its Installments, **Then** every Installment belonging to that Lease is listed with its own status. *(FR-010)*
- **AC-009**: **Given** a Lease whose Machinery receipt has not been confirmed, **When** Company attempts to pay any of its Installments, **Then** the system rejects the attempt — installments are not payable ahead of confirmed delivery (BR-08). *(FR-011)*
- **AC-010**: **Given** a Lease and one of its `pending` Installments, **When** Company pays it, **Then** that Installment's status becomes `paid`, and no other Installment's status changes. *(FR-012)*
- **AC-011**: **Given** an Installment already `paid`, **When** Company attempts to pay it again, **Then** the system rejects the attempt and the Installment's status and the Lease's paid/pending counts remain unchanged. *(FR-013)*
- **AC-012**: **Given** a Lease, **When** Company requests the count of paid and pending Installments, **Then** the two counts always sum to the Lease's total number of Installments. *(FR-014)*
- **AC-013**: **Given** a Lease with at least one `pending` Installment, **When** Company checks the Acquisition Option, **Then** it is `not yet available`. *(FR-015)*
- **AC-014**: **Given** a Lease whose Installments are all `paid`, **When** Company checks the Acquisition Option, **Then** it is `available` (BR-07). *(FR-015)*
- **AC-015**: **Given** an Acquisition Option that is `not yet available`, **When** Company attempts to exercise it, **Then** the system rejects the attempt and the Leasing Operation does not reach a completed state. *(FR-016)*
- **AC-016**: **Given** an Acquisition Option that is `available`, **When** Company exercises it, **Then** the exercise is confirmed and the Leasing Operation's state becomes unambiguously completed, distinguishable from every non-terminal state used in this feature. *(FR-017)*
- **AC-017**: **Given** two different Companies, **When** either queries Leasing Requests, Leases, or Installments, **Then** each sees only the records associated with itself. *(FR-018)*

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow Company to record a machinery need associated with one of its Projects.
- **FR-002**: The system MUST allow Company to submit a Leasing Request for a recorded machinery need, referencing the Company, the Project, the machinery need, and the Supplier when it is already known.
- **FR-003**: The system MUST assign each Leasing Request a unique identity and an initial status of `pending` at submission.
- **FR-004**: The system MUST allow Company to retrieve the current status — `pending`, `approved`, or `rejected` — of any Leasing Request it submitted, at any time.
- **FR-005**: When a Leasing Request's status becomes `approved`, the system MUST create a corresponding Lease without requiring a further action from Company.
- **FR-006**: The system MUST make an approved Leasing Request's resulting Lease traceable back to that Leasing Request, its Project, and its machinery need.
- **FR-007**: When a Leasing Request's status becomes `rejected`, the system MUST make that status observable to Company and MUST NOT create a Lease for that request.
- **FR-008**: The system MUST allow Company to confirm that it received the Machinery for a specific Leasing Operation whose Leasing Request is `approved`.
- **FR-009**: The system MUST NOT allow Company to confirm Machinery receipt for a Leasing Operation whose Leasing Request is not `approved`.
- **FR-010**: The system MUST make every Installment belonging to a Lease individually identifiable to Company, including its own status of `pending` or `paid`.
- **FR-011**: The system MUST NOT present a Lease's Installments as due for payment before Company has confirmed Machinery receipt for that Leasing Operation (BR-08). `[ASSUMPTION: the Installment schedule exists once the Lease exists; what BR-08 gates is Company's ability to pay against it, not the schedule's existence]`
- **FR-012**: The system MUST allow Company to pay a `pending` Installment belonging to one of its Leases, changing that Installment's status to `paid`.
- **FR-013**: The system MUST NOT allow an Installment already `paid` to be paid again.
- **FR-014**: The system MUST allow Company to determine, at any time, the number of `paid` and the number of `pending` Installments for any of its Leases.
- **FR-015**: The system MUST make the Acquisition Option `available` for a Lease if and only if every Installment belonging to that Lease is `paid`; otherwise it MUST be `not yet available` (BR-07).
- **FR-016**: The system MUST NOT allow Company to exercise an Acquisition Option that is `not yet available`.
- **FR-017**: The system MUST allow Company to exercise an `available` Acquisition Option, and MUST bring the corresponding Leasing Operation to an unambiguous completed state once exercised.
- **FR-018**: The system MUST restrict a Company's visibility of Leasing Requests, Leases, and Installments to those associated with that Company.

### Key Entities

- **Company**: the Peruvian corporate or SME client this feature is written for. Owns Projects, machinery needs, Leasing Requests, Leases, and the Installments and Acquisition Option that belong to those Leases.
- **Project**: the undertaking of Company that a machinery need is tied to. Referenced by a Leasing Request; not otherwise managed by this feature.
- **Machinery (need)**: the equipment Company needs for a Project. Referenced by a Leasing Request and, once delivered, by the confirmed-receipt milestone of a Leasing Operation.
- **Supplier**: the origin of the Machinery. Recorded on a Leasing Request when known; the party Lease Company purchases from once a request is approved (result-only, see Out of Scope).
- **Leasing Request**: Company's ask for financing. Has an identity, a status (`pending` / `approved` / `rejected`), and references to Company, Project, Machinery need, and optionally Supplier. Produces a Lease only when `approved`.
- **Lease**: the financing arrangement created from an approved Leasing Request. Owns a set of Installments and one Acquisition Option; carries the confirmed-receipt milestone for its Machinery.
- **Installment**: one payment obligation belonging to a Lease. Has a status (`pending` / `paid`). A Lease's Installments collectively determine when its Acquisition Option becomes available.
- **Acquisition Option**: the right, belonging to a Lease, to acquire its Machinery. Has a status (`not yet available` / `available`) determined entirely by whether all of the Lease's Installments are `paid`, and an exercised/not-exercised outcome that determines whether the Leasing Operation is complete.

## Phased Scope

### Stage 1 — POC Happy Path

Stage 1 is exactly the happy path User Story 1 describes, and is exactly what the POC referenced by Constitution Principle V builds:

1. Company has a Project that requires Machinery.
2. Company records the machinery need.
3. Company submits a Leasing Request for it.
4. Company can query the request's status.
5. The request is approved (the Financing Decision's own reasoning is out of scope; for Stage 1 it need only be reachable as a business-decided outcome — see Key Product Decisions).
6. Lease Company purchases the Machinery from Supplier (result-only: this step exists so step 7 can happen; its internal mechanics are out of scope).
7. Supplier delivers the Machinery to Company.
8. Company confirms it received the Machinery for that Leasing Operation.
9. Company can view the Lease's Installments and each one's status.
10. Company pays each Installment.
11. Company can tell which Installments are paid and which are pending at any point in this process.
12. Once every Installment is paid, the Acquisition Option becomes `available`.
13. Company exercises the Acquisition Option.
14. The Leasing Operation reaches an unambiguous completed state.

Nothing in Stage 1 assumes a rejection, a delay, a partial delivery, or more than one machinery need per Leasing Request.

### Later stages (not Stage 1)

The following are real, useful boundaries for future scope, not commitments made by this feature:

- Handling a `rejected` Leasing Request beyond observing its status — including whether and how Company may resubmit.
- Cancellation of a Leasing Request or of a Lease already in progress.
- Overdue Installments and any consequence of a missed payment.
- A Leasing Request or Lease spanning more than one Machinery item.
- Multiple concurrent Projects or Leases for the same Company.
- Partial Machinery delivery.
- Exceptional payment scenarios (e.g., early payoff, partial Installment payment).
- Alternative Acquisition Option outcomes beyond exercising it (e.g., declining it once available — see the open `[CLARIFY]` in Key Product Decisions).
- Richer Supplier interactions beyond the result Company observes.
- Carlos's and Julia's own flows, as Lease Company-side actors — specified separately in `002-leasing-request-underwriting` and `003-deployed-fleet-custody` (see Out of Scope).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For one Company, one Project, and one machinery need, the entire Stage 1 journey — from recording the need through a completed Leasing Operation — can be walked through end to end using only the capabilities this feature defines, with no step requiring information from outside the system.
- **SC-002**: For any Leasing Request Company has submitted, Company can determine its status (`pending` / `approved` / `rejected`) without that determination ever being undefined or contradictory.
- **SC-003**: For any Lease, Company can determine the exact number of paid and of pending Installments at any point in the Lease's life, and the two numbers always account for every Installment in the Lease.
- **SC-004**: For any Lease, Company can determine whether the Acquisition Option is `available` with no state in which availability cannot be determined.
- **SC-005**: Every Leasing Request and every Leasing Operation defined by this feature reaches exactly one of the states this specification defines — none is left in a state this specification does not name.

## Assumptions

- `[ASSUMPTION]` Pedro represents Company; see Users and Their Needs.
- Company operates through projects — this is not an invented assumption, it restates BR-02 directly.
- `[ASSUMPTION]` In Stage 1, one machinery need is associated with one Leasing Request; multi-item requests are later-stage scope.
- `[ASSUMPTION]` Stage 1 treats an approved Leasing Request as a reachable, business-decided outcome; the method Lease Company uses to decide is not part of this feature.
- `[ASSUMPTION]` Machinery receipt becomes an observable milestone through an explicit confirmation action by Company, rather than being inferred automatically from Supplier-side data.
- `[ASSUMPTION]` All Installments needed to demonstrate Stage 1 can be completed within the POC scenario without a real banking integration (Constitution, Ambiguity and Assumptions).
- Acquisition becomes available strictly after every Installment of the Lease is paid — this restates the brief's own diagram directly (see `docs/LAB-02-ARQ-2026.2.md`), not an invented assumption; whether anything beyond that is required is the open `[CLARIFY]` in Key Product Decisions.
- `[ASSUMPTION]` A Leasing Request, once `rejected`, is not retried within Stage 1; resubmission is later-stage scope.

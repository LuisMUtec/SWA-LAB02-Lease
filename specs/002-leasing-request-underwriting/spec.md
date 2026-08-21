# Feature Specification: Leasing Request Underwriting

**Feature Branch**: `002-leasing-request-underwriting`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Underwriting de operaciones de leasing para el actor Carlos (analista de riesgo de Lea$e): recibir y evaluar una solicitud de leasing, juzgar el proyecto y al pagador detras del solicitante, decidir aprobar con condiciones / rechazar / escalar sobre su limite, anclar el calendario de cuotas a los hitos de certificacion del proyecto (BR-04), y ver una alerta cuando el proyecto se atrasa mientras el contrato sigue vigente."

## Summary

`001-company-machinery-leasing` specifies a Leasing Request arriving at Lea$e and, later, becoming `approved` or `rejected` — and it deliberately treats that outcome as given: *"the Financing Decision's own reasoning is out of scope"*. This feature specifies the reasoning. It is the same Leasing Request seen from the other side of the counter, by the person who has to decide it.

That person is Underwriter, whose human perspective is [`personas/Carlos.MD`](../../personas/Carlos.MD). His decision is not an ordinary credit decision, and the difference is the whole point of this feature. Because instalments fall due against the certification milestones of one named project (BR-04), repayment depends on whether *that project* is certified and paid on time — which depends less on the Applicant than on whoever pays the Applicant. Underwriter is judging two companies and has a file on one.

The feature therefore covers: receiving a Leasing Request for assessment; assembling the evidence a decision must rest on, about the Applicant, the Project, and the Project's Payer; reaching a decision inside a delegated authority limit — approve under stated conditions, refuse with a stated reason, or escalate above the limit; anchoring an approved operation's instalment schedule to the Project's certification milestones rather than to the calendar; and surfacing a warning when a live operation's Project starts slipping against those milestones, while the contract is still current and before anything is overdue.

## Problem

Lea$e buys the machine and owns it for the life of the contract (BR-01). An approval therefore does not put a number at risk on a balance sheet — it puts a machine Lea$e paid for onto a jobsite that may stop paying for it. The decision to do that is made today with instruments that answer a different question.

Financial statements are annual, arrive late, describe a company that no longer exists by the time they are read, and never describe the project being financed. Credit bureaus report the Applicant and never the Applicant's Payer, which is the risk that actually determines repayment under BR-04. A clean record proves past obligations were met out of past projects; it does not prove this project generates enough, on time, to pay for this machine. And the first signal that something is wrong arrives as a movement in a supervisory grade — which is weeks after the moment that mattered.

The result is a decision made on the wrong evidence, and a failure discovered too late: an Applicant who is neither fraudulent nor insolvent, simply not holding money that has not arrived, whose situation reaches Underwriter already classified as an overdue account rather than as a warning. Closing the financing gap (Constitution, Principle III) requires that the decision and the monitoring both look at the project's payment schedule, because that is what the instalments are anchored to.

## Goal

Enable Underwriter to decide a Leasing Request on evidence about the Project and its Payer rather than on the Applicant's history alone, to record the decision and its conditions so it can be reviewed later by someone who was not there, to anchor an approved operation's instalments to the Project's certification milestones, and to be warned that a live Project is slipping while the contract is still current.

## Out of Scope

- Software architecture, technology selection, and any implementation detail (Constitution, Principle I) — this belongs to `/speckit-plan`.
- Automated credit scoring, risk models, or any algorithm that produces a decision. This feature specifies the evidence a decision rests on, the authority that bounds it, and the record it leaves; the judgement itself stays with Underwriter.
- Integrations with credit bureaus, supervisory registries, or public-procurement systems. Where this feature says Underwriter records a credit standing or a certification schedule, how that information reaches him is not specified here.
- Pricing: how a rate, a fee, or a residual is calculated. Which conditions an approval carries is in scope; what they should be is Underwriter's judgement.
- Company's own journey — submitting the request, confirming delivery, paying instalments, exercising acquisition. That is `001-company-machinery-leasing`, and this feature does not restate it.
- Everything downstream of a declared default: recovering the machine, its transport, its condition on return. Underwriter declares; he never executes (see Authority and Separation of Duties). Recovery belongs to Julia's feature.
- Handover of the machine to the Applicant, and any part of it. Underwriter is barred from it by the same separation of duties.
- Collections, restructuring, and renegotiation of a signed contract's schedule. This feature specifies the warning that a Project is slipping and who must be told; what is then done about the schedule is a later stage and, in part, an open business decision (see Key Product Decisions).
- Julia's fleet flows.

## Key Product Concepts

- **Underwriter**: the person at Lea$e who decides whether a Leasing Request becomes a financed operation. The actor this feature is written for; his human perspective is [`personas/Carlos.MD`](../../personas/Carlos.MD).
- **Applicant**: the company that submitted the Leasing Request — the same actor `001` calls Company. This feature looks at the Applicant as a subject of assessment, not as a user.
- **Project**: the Applicant's named undertaking that the machinery is needed for, and whose certification payments are what the instalments will be anchored to (BR-04). Unlike in `001`, where a Project is only context, here the Project is a subject of assessment in its own right.
- **Payer**: the party that owes the Applicant for the Project — the Applicant's own client. The party whose payment behaviour determines whether the Applicant can meet an instalment, and about whom no report exists.
- **Certification Milestone**: a point at which the Applicant's progress on the Project is certified and becomes payable — in Peruvian construction, a *valorización*. A Project's Certification Milestones are what BR-04 anchors an instalment schedule to.
- **Certification Schedule**: the set of Certification Milestones expected for a Project, with the date each is expected to be certified and paid. Disclosed by the Applicant at application.
- **Assessment**: the working file Underwriter builds for one Leasing Request — the evidence gathered about Applicant, Project and Payer, and the state of his review of it. An Assessment exists from the moment a request is taken up until a Decision is recorded.
- **Evidence Item**: one piece of recorded support for an Assessment — the Applicant's credit standing, the Project's award, the Certification Schedule, what is known about the Payer. Every Evidence Item is retrievable afterward as part of the Decision's record.
- **Credit Standing**: what is known about the Applicant's past credit conduct, including its current supervisory grade. In scope as an Evidence Item; how it is obtained is not.
- **Authority Limit**: the maximum machinery value Underwriter may decide alone. Above it, he prepares the case and escalates. `[ASSUMPTION: USD 150,000 of machinery value, per personas/Carlos.MD. The figure is ours — the brief fixes no delegation.]`
- **Decision**: the recorded resolution of an Assessment — `approved`, `refused`, or `escalated`. A Decision always carries a stated reason, and an approval always carries its Conditions.
- **Conditions**: the terms an approval is granted under — down payment, term, guarantees, and which machine. Set by Underwriter, and part of what makes an approval reviewable.
- **Instalment Schedule**: the sequence of instalments an approved operation carries, each anchored to a Certification Milestone of the Project (BR-04). What `001` sees as a Lease's Installments is what this feature produces.
- **Certification Record**: the fact, entered against a Certification Milestone, that it was certified and paid, with the date. Without it a milestone is presumed uncertified indefinitely — a Certification Record is what a Slippage Warning tests for and what an Instalment Schedule's due condition tests for.
- **Slippage Warning**: the signal raised for a live operation whose Project has passed an expected Certification Milestone without it being certified and paid. Raised while the contract is still current, before any instalment is overdue.
- **Default Declaration**: Underwriter's recorded determination that a contract has defaulted. It is a decision, never an act on the machine.

## Users and Their Needs

This feature is written for **Underwriter** alone. His human perspective is [`personas/Carlos.MD`](../../personas/Carlos.MD).

Pedro ([`personas/Pedro.MD`](../../personas/Pedro.MD)) appears here only as the Applicant being assessed — his own journey is `001-company-machinery-leasing`. Julia ([`personas/Julia.MD`](../../personas/Julia.MD)) appears only as the person who acts on a Default Declaration this feature produces; her flows are `003-deployed-fleet-custody`.

Underwriter's needs, as covered by this feature:

- Take up a submitted Leasing Request for assessment and know which requests are waiting on him.
- Establish that the Applicant is a real, current company that works by project, because that is who Lea$e lends to (BR-02).
- Record the Applicant's credit standing as evidence, knowing it describes the past and not this Project.
- Record what the Project is: what was awarded, by whom, for how much, and on what Certification Schedule the Applicant will be paid.
- Record what is known about the Payer behind the Applicant — the risk nobody sells a report on.
- Reach a Decision within his Authority Limit, or escalate above it, and never be able to decide above it by accident.
- Attach Conditions to an approval, because an approval without conditions is not the decision he actually makes.
- Leave behind, for every Decision, the evidence it rested on and the conditions it carried, so it can be reviewed months later by someone who was not in the room.
- Anchor an approved operation's Instalment Schedule to the Project's Certification Milestones (BR-04), rather than to dates he chose.
- Be told that a live operation's Project is slipping against those milestones while the contract is still current.
- Declare a contract in default — and never be the one who goes to get the machine.
- Compare two applications of the same size against each other, so the reason one was approved and another refused is the case and not the format.

## Key Product Decisions

- **What an Assessment is anchored to**: exactly one Leasing Request. An Assessment does not exist before a request is submitted, and a request has at most one Assessment. `[ASSUMPTION: in Stage 1 a Leasing Request concerns one machinery need and one Project, matching the same assumption in 001.]`
- **What evidence a Decision requires**: an Assessment may not reach a Decision until it carries, at minimum, the Applicant's identity and eligibility under BR-02, its Credit Standing, the Project's identification, its Certification Schedule, and an identified Payer. This is what makes "approve without evidence I can point to" impossible rather than merely discouraged, and it is what makes two applications comparable.
- **What "an identified Payer" means**: the Payer is named and recorded, together with what is known of its payment behaviour. It does not mean a report exists — there is none. `[ASSUMPTION: an Assessment may proceed with the Payer named and its behaviour recorded as unknown, because refusing every case where no Payer report exists would refuse every case. What is not permitted is leaving the Payer unnamed.]`
- **How the Authority Limit binds**: it is evaluated against the machinery value of the request. At or below it, Underwriter may record `approved` or `refused`. Above it, those outcomes are not available to him at all — the only Decision he can record is `escalated`. The limit is enforced, not advisory.
- **What escalation produces**: an `escalated` Decision closes Underwriter's part and hands the prepared Assessment on. The committee's own deliberation is outside this feature; what is in scope is that its outcome returns onto the same Assessment, so the file remains one thread. `[ASSUMPTION: a credit committee exists above the Authority Limit and its resolution is recorded against the Assessment that was escalated; personas/Carlos.MD names the committee, the brief does not.]`
- **What an approval produces**: an approved Decision with its Conditions is what makes a Leasing Request `approved` in `001`'s terms, and it is what produces the Instalment Schedule. `001` states that approval creates a Lease without further action from Company; this feature states what the approval itself consists of.
- **How the Instalment Schedule is anchored**: each instalment is tied to a Certification Milestone of the Project and falls due on the certification of that milestone, not on a calendar date (BR-04). A schedule that cannot be anchored — because the Project has no Certification Schedule — is not a schedule this feature produces. `[ASSUMPTION: an instalment falls due a fixed number of working days after its milestone is certified, rather than on the certification instant, so that certification and payment are not assumed simultaneous. Public-works valorizaciones are paid within six working days of presentation, which is the shortest anchor available; the exact offset is a business decision.]`
- **How a Certification Milestone becomes certified**: Underwriter records a Certification Record against it, with the date — the same recorder as every other Evidence Item of the operation (FR-006–FR-008), so the fact has an owner rather than an implied one. **Added 2026-08-21, per persona-agent review of issue #5:** the earlier text left the Slippage Warning and the Instalment Schedule's due condition testing for a fact — "certified" — that no requirement allowed anyone to create, which made every milestone slip on every operation and made every instalment's due condition permanently unmet. `[ASSUMPTION: how the certification reaches Lea$e — the Applicant disclosing it, a site visit, a public-procurement registry lookup for public works — is not specified here, on the same footing as Credit Standing and the Certification Schedule itself (Out of Scope).]`
- **When a Slippage Warning is raised**: when an expected Certification Milestone of a live operation's Project passes its expected date without being certified and paid. It is raised against the operation and directed to the Underwriter who decided it, while the contract is still current — this is the point of the whole thing, and it is what distinguishes a warning from the overdue-account notice Underwriter gets today.
- **What a Slippage Warning does not do**: it does not change what the Applicant owes, does not move an instalment, and does not by itself constitute a default. **Resolved (2026-08-21):** how far a schedule may bend before default-eligibility is reached is now BR-09, catalogued in [`business-rules.md`](../../business-rules.md) — a single Certification Milestone uncertified more than 30 calendar days past its expected date, or two milestones of the same Project simultaneously past their expected dates, whichever comes first. Reaching that threshold makes the operation eligible for a Default Declaration; it does not, by itself, produce one — Underwriter still decides (see Default Declaration below).
- **What a Default Declaration is**: a recorded decision by Underwriter, with its reason, that a contract has defaulted. It authorises recovery; it never performs it. What happens to the machine afterward is Julia's, in `003-deployed-fleet-custody`.
- **What belongs to Stage 1**: exactly the happy path in Phased Scope below — a request assessed on complete evidence, approved within the Authority Limit under stated conditions, with its Instalment Schedule anchored to the Project's Certification Milestones. Refusal, escalation, slippage and default are specified here but are not what the POC demonstrates.

## Authority and Separation of Duties

This section exists because Underwriter's authority is bounded on two sides, and both bounds are behaviour this feature must produce rather than advice it gives.

**Bounded above by value.** Underwriter decides alone at or below his Authority Limit and not above it. Above it he prepares and escalates. The system must make the forbidden outcome unavailable rather than merely warn against it.

**Bounded across by role.** Deciding to lend and lending must not be the same person's act. Underwriter may declare a contract in default; he may take no part in recovering the machine. He may approve an operation; he may take no part in handing the machine over. The mirror of this constraint lives in [`personas/Julia.MD`](../../personas/Julia.MD): Julia may recover a machine once a default has been declared and may never declare one herself. Neither of them can both decide and execute, and this feature and `003-deployed-fleet-custody` must not create a path that lets either of them do so.

**Bounded in time.** A signed contract's Instalment Schedule is not Underwriter's to change afterward. He may raise a Slippage Warning against it; he may not resolve the slip by moving what the Applicant owes.

## Expected User Experience

From Underwriter's side, this feature is defined by what he can always establish, not by any particular screen:

- **A case is a case, not a format.** Two Assessments of the same size present the same evidence in the same shape, so a comparison between them is a comparison of the cases.
- **Nothing decided on nothing.** At the moment a Decision is recorded, the evidence it rests on is already attached to it, and it stays attached.
- **The limit is felt, not remembered.** Underwriter never has to recall his Authority Limit to stay inside it.
- **An approval says what it costs.** An approved Decision is never separable from the Conditions it was granted under.
- **The schedule belongs to the project.** For any approved operation, Underwriter can point at each instalment and name the Certification Milestone it falls due against.
- **A slip is news, not history.** A Project falling behind reaches Underwriter as a warning on a current contract, not as an overdue account after the fact.
- **A decision survives its author.** Months later, someone who was not in the room can reconstruct why a Decision went the way it did, from the record alone.

## User Scenarios & Testing *(mandatory)*

Each user story below is independently testable and is written from Underwriter's side. Each Acceptance Scenario is the atomic Given/When/Then form of the corresponding need; the **Acceptance Criteria** section restates and cross-references the same guarantees against Functional Requirements for traceability, without repeating their narrative.

### User Story 1 - Underwriter decides a request within his authority, on evidence, with conditions (Priority: P1)

Carlos takes up a submitted Leasing Request. He establishes that the Applicant is a current company that works by project, records its credit standing, records what the Project is and the Certification Schedule the Applicant will be paid on, and names the Payer behind it. With that evidence attached, and the request's machinery value inside his Authority Limit, he approves it under stated Conditions — and the decision, its reason, its evidence and its conditions remain retrievable afterward.

**Why this priority**: this is the decision `001` treats as given, and without it no operation exists to deliver, pay or acquire. It is also where Underwriter's central failure is prevented — approving on the Applicant's history without ever looking at the Project or its Payer.

**Independent Test**: can be fully tested by taking one submitted Leasing Request through assessment, attaching each required Evidence Item, and recording an approval with Conditions inside the Authority Limit, then retrieving the Decision with its evidence and conditions intact — delivers a defensible, reviewable financing decision, which is the whole of Underwriter's job.

**Acceptance Scenarios**:

1. **Given** a submitted Leasing Request with no Assessment, **When** Underwriter takes it up, **Then** an Assessment exists for that request and appears among the requests waiting on him.
2. **Given** an Assessment, **When** Underwriter records the Applicant's eligibility, credit standing, the Project's identification and Certification Schedule, and the named Payer, **Then** each is attached to the Assessment and retrievable from it.
3. **Given** an Assessment missing any required Evidence Item, **When** Underwriter attempts to record a Decision, **Then** the system does not record one and identifies what is missing.
4. **Given** a fully evidenced Assessment whose machinery value is within the Authority Limit, **When** Underwriter records an approval with its Conditions and reason, **Then** the Decision is `approved` and carries both.
5. **Given** a recorded Decision, **When** anyone retrieves it later, **Then** its reason, its Conditions and every Evidence Item it rested on are retrievable with it.

---

### User Story 2 - Underwriter anchors the instalment schedule to the project's certification milestones (Priority: P2)

Having approved an operation, Carlos sets its Instalment Schedule against the Certification Milestones of the Project rather than against dates he picked. Each instalment names the milestone whose certification makes it fall due.

**Why this priority**: this is the behaviour that makes Lea$e something other than a lender with a calendar (Constitution, Principle III; BR-04). An operation approved but scheduled on the calendar recreates the exact shortfall the Applicant came to Lea$e to avoid. It is second only because there must be an approval for a schedule to belong to.

**Independent Test**: can be fully tested by taking one approved operation whose Project has a Certification Schedule, producing its Instalment Schedule, and confirming every instalment names the Certification Milestone it is anchored to and none carries a bare calendar date.

**Acceptance Scenarios**:

1. **Given** an approved operation whose Project has a Certification Schedule, **When** its Instalment Schedule is produced, **Then** every instalment is anchored to a named Certification Milestone of that Project.
2. **Given** an approved operation whose Project has no Certification Schedule, **When** an Instalment Schedule is attempted, **Then** the system does not produce one anchored to the calendar instead.
3. **Given** an operation with a signed Instalment Schedule, **When** Underwriter attempts to change what is owed or when, **Then** the system does not allow it.

---

### User Story 3 - Underwriter escalates a request above his authority (Priority: P3)

The request Carlos is holding is for a machine worth more than his Authority Limit. He cannot decide it, and the system does not let him. He prepares the same evidenced Assessment and escalates it, and when the committee resolves it, the resolution lands on that same Assessment rather than in a separate thread.

**Why this priority**: it is a real and frequent boundary of Underwriter's job, and the constraint it enforces is one the persona states as an absolute. It is below the schedule anchoring because it changes who decides, not what Lea$e is for.

**Independent Test**: can be fully tested by taking one fully evidenced Assessment whose machinery value exceeds the Authority Limit, confirming that approval and refusal are unavailable, recording an escalation, and confirming the returned committee resolution attaches to the same Assessment.

**Acceptance Scenarios**:

1. **Given** a fully evidenced Assessment whose machinery value exceeds the Authority Limit, **When** Underwriter attempts to record an approval or a refusal, **Then** the system does not record one.
2. **Given** that same Assessment, **When** Underwriter escalates it, **Then** its Decision is `escalated` and the Assessment with all its evidence is what is handed on.
3. **Given** an escalated Assessment whose committee resolution has been recorded, **When** Underwriter retrieves the Assessment, **Then** the resolution is part of that same Assessment's record.

---

### User Story 4 - Underwriter is warned that a live project is slipping (Priority: P4)

An operation Carlos approved is running. A Certification Milestone of its Project passes its expected date without being certified and paid. Carlos is warned, against that operation, while the contract is still current — not after an instalment has gone unpaid and the account has been classified as overdue.

**Why this priority**: it is the failure `personas/Carlos.MD` says he lives with, and the spec must handle it. It is last because it presupposes an operation that has been approved, scheduled and delivered — everything the three stories above produce — and because a warning is not a happy path and therefore not what the POC demonstrates.

**Independent Test**: can be fully tested by taking one live operation whose Project has a Certification Milestone with a passed expected date and no recorded certification, and confirming a Slippage Warning is raised against that operation, directed to the Underwriter who decided it, with no instalment yet overdue.

**Acceptance Scenarios**:

1. **Given** a live operation whose Project has a Certification Milestone past its expected date and not certified, **When** the state of the Project is evaluated, **Then** a Slippage Warning exists against that operation.
2. **Given** a Slippage Warning, **When** Underwriter retrieves it, **Then** it names the operation, the Project, and the milestone that slipped.
3. **Given** a Slippage Warning, **When** it is raised, **Then** nothing the Applicant owes changes and no instalment becomes overdue as a result of the warning itself.
4. **Given** an operation Underwriter determines has defaulted, **When** he records a Default Declaration with its reason, **Then** the declaration exists against that operation and authorises recovery without performing it.

### Edge Cases

- **Applicant is not a company that works by project**: the Assessment records the Applicant as ineligible and no approval is available for it, because Lea$e's clients are companies that work by project (BR-02).
- **Applicant's Payer cannot be assessed**: the Payer is named and its payment behaviour recorded as unknown; the Assessment proceeds. An unnamed Payer blocks a Decision (FR-008).
- **Project has no Certification Schedule**: the Assessment cannot reach the evidence completeness an approval or an escalation requires (FR-010) — though it can still be refused on that basis alone — and no calendar-anchored schedule is offered as a substitute (FR-014).
- **Machinery value is exactly at the Authority Limit**: Underwriter may decide it — the limit is inclusive (FR-011).
- **A refusal**: the Decision is `refused` and carries its reason; no operation and no Instalment Schedule are produced (FR-013).
- **A milestone slips and is later certified**: the Slippage Warning records that the milestone was subsequently certified; a warning is never silently removed, because the record of a Project having slipped is itself evidence for the next decision (FR-018).
- **Underwriter attempts to act on the machine**: no capability of this feature lets Underwriter release, hand over or recover a machine, whether or not a default has been declared (FR-020, FR-021).

## Acceptance Criteria

Each criterion is atomic, observable, and traceable to a Functional Requirement. Where a criterion states a business rule's effect, it cites the rule's identifier per `business-rules.md`'s convention.

- **AC-001**: **Given** a submitted Leasing Request with no Assessment, **When** Underwriter takes it up, **Then** exactly one Assessment exists for that request, traceable back to it. *(FR-001, FR-002)*
- **AC-002**: **Given** Leasing Requests awaiting assessment, **When** Underwriter queries what is waiting on him, **Then** every submitted request without a recorded Decision is listed and no other. *(FR-003)*
- **AC-003**: **Given** an Assessment, **When** Underwriter records the Applicant's eligibility, **Then** the Assessment states whether the Applicant is a company that works by project, which is who Lea$e finances (BR-02). *(FR-004)*
- **AC-004**: **Given** an Applicant recorded as not working by project, **When** Underwriter attempts to approve the Assessment, **Then** the system does not record an approval (BR-02). *(FR-005)*
- **AC-005**: **Given** an Assessment, **When** Underwriter records the Applicant's Credit Standing, **Then** it is attached to the Assessment as an Evidence Item and retrievable from it. *(FR-006)*
- **AC-006**: **Given** an Assessment, **When** Underwriter records the Project — what was awarded, by whom, for how much, and its Certification Schedule — **Then** each is attached to the Assessment as Evidence and the Certification Schedule lists the Project's expected Certification Milestones with the date each is expected to be certified and paid and the amount each is expected to release. *(FR-007)*
- **AC-007**: **Given** an Assessment, **When** Underwriter records the Payer, **Then** the Payer is named and what is known of its payment behaviour is recorded, including that it is unknown. *(FR-008)*
- **AC-008**: **Given** an Assessment with no named Payer, **When** Underwriter attempts to record an approval or an escalation, **Then** the system does not record one; a refusal remains available regardless. *(FR-008, FR-010)*
- **AC-009**: **Given** an Assessment missing any required Evidence Item, **When** Underwriter attempts to record an approval or an escalation, **Then** the system does not record one and states which items are missing; a refusal remains available regardless. *(FR-010)*
- **AC-010**: **Given** a fully evidenced Assessment whose machinery value is at or below the Authority Limit, **When** Underwriter records an approval, **Then** the Decision is `approved` and carries its reason and its Conditions. *(FR-011, FR-012)*
- **AC-011**: **Given** a fully evidenced Assessment, **When** Underwriter records a refusal, **Then** the Decision is `refused`, carries its reason, and no operation and no Instalment Schedule are produced from it. *(FR-013)*
- **AC-012**: **Given** an Assessment whose machinery value exceeds the Authority Limit, **When** Underwriter attempts to record `approved` or `refused`, **Then** the system does not record either. *(FR-011)*
- **AC-013**: **Given** an Assessment whose machinery value exceeds the Authority Limit, **When** Underwriter escalates it, **Then** the Decision is `escalated` and the Assessment's evidence is part of what is escalated. *(FR-011, FR-022)*
- **AC-014**: **Given** an escalated Assessment, **When** the committee's resolution is recorded, **Then** it is attached to that same Assessment and retrievable from it. *(FR-022)*
- **AC-015**: **Given** any recorded Decision, **When** it is retrieved at any later time, **Then** its reason, its Conditions where it is an approval, and every Evidence Item it rested on are retrievable with it. *(FR-016)*
- **AC-016**: **Given** an approved operation whose Project has a Certification Schedule, **When** its Instalment Schedule is produced, **Then** every instalment names the Certification Milestone whose certification makes it fall due, and none falls due on a fixed calendar date — instalments are anchored to the project's certified progress (BR-04). *(FR-014)*
- **AC-017**: **Given** an approved operation whose Project has no Certification Schedule, **When** an Instalment Schedule is attempted, **Then** the system does not produce a calendar-anchored schedule in its place (BR-04). *(FR-014)*
- **AC-018**: **Given** an operation with a signed Instalment Schedule, **When** Underwriter attempts to change what is owed or when it falls due, **Then** the system does not allow the change. *(FR-015)*
- **AC-019**: **Given** two Assessments of comparable machinery value, **When** Underwriter retrieves both, **Then** both present the same set of required Evidence Items, so they can be compared on their content. *(FR-009, FR-010)*
- **AC-020**: **Given** a live operation whose Project has a Certification Milestone past its expected date with no recorded certification, **When** the Project's state is evaluated, **Then** a Slippage Warning exists against that operation, naming the operation, the Project and the milestone. *(FR-017)*
- **AC-021**: **Given** a Slippage Warning, **When** it is raised, **Then** it is directed to the Underwriter who recorded that operation's Decision, and the operation has not yet been closed by any of the three ends `003-deployed-fleet-custody` defines (its FR-018) and carries no Default Declaration — which is what "while the contract is still current" means here, stated rather than assumed. *(FR-017, FR-019)*
- **AC-022**: **Given** a Slippage Warning, **When** it is raised, **Then** no instalment amount and no instalment due condition changes as a result. *(FR-019)*
- **AC-023**: **Given** a Slippage Warning whose milestone is later certified, **When** Underwriter retrieves the operation, **Then** the warning is still retrievable and records that the milestone was subsequently certified. *(FR-018)*
- **AC-024**: **Given** an operation Underwriter determines has defaulted, **When** he records a Default Declaration with its reason, **Then** the declaration exists against that operation and is retrievable with its reason. *(FR-020)*
- **AC-025**: **Given** a Default Declaration, **When** Underwriter acts on the declared operation, **Then** no capability of this feature allows him to recover, release or hand over the machine — deciding a default and acting on the machine are separate roles. *(FR-020, FR-021)*
- **AC-026**: **Given** a live operation with either one Certification Milestone more than 30 calendar days past its expected date and still uncertified, or two Certification Milestones of the same Project simultaneously past their expected dates and still uncertified, **When** Underwriter retrieves the operation, **Then** it is shown as eligible for a Default Declaration (BR-09), and no Default Declaration exists for it unless Underwriter has separately recorded one. *(FR-023)*
- **AC-028**: **Given** an Assessment whose evidence Underwriter considers insufficient, **When** he records a request for further evidence stating what he is asking for, **Then** the request is retrievable against that Assessment and is observable to the Applicant. *(FR-025)*
- **AC-027**: **Given** a Certification Milestone, **When** Underwriter records it as certified and paid, **Then** it is no longer counted as uncertified by any Slippage Warning evaluation, and any instalment anchored to it becomes due provided the client has already confirmed receipt of the machine — an instalment never falls due ahead of delivery (BR-08). *(FR-024)*

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow Underwriter to take up a submitted Leasing Request for assessment, creating exactly one Assessment for it.
- **FR-002**: The system MUST make an Assessment traceable to the Leasing Request it belongs to, and MUST NOT allow more than one Assessment per request.
- **FR-003**: The system MUST allow Underwriter to retrieve the submitted Leasing Requests that have no recorded Decision.
- **FR-004**: The system MUST allow Underwriter to record, as part of an Assessment, whether the Applicant is a company that works by project (BR-02).
- **FR-005**: The system MUST NOT allow an approval to be recorded for an Assessment whose Applicant is recorded as not working by project (BR-02).
- **FR-006**: The system MUST allow Underwriter to record the Applicant's Credit Standing as an Evidence Item of the Assessment.
- **FR-007**: The system MUST allow Underwriter to record the Project as Evidence — what was awarded, by whom, for how much, and its Certification Schedule, where the Certification Schedule names each expected Certification Milestone, the date it is expected to be certified and paid, and the amount it is expected to release. **Amended 2026-08-21, per persona-agent review of issue #5:** a milestone previously carried only its date, so Underwriter could anchor an instalment to a milestone (FR-014) without being able to check that the milestone covers it — which is the whole of the judgement `personas/Carlos.MD` describes ("does this project generate enough, *on time*, to pay this machine"). The date answered "on time" and nothing answered "enough".
- **FR-008**: The system MUST allow Underwriter to record the Payer as Evidence, requiring the Payer to be named and allowing its payment behaviour to be recorded as unknown.
- **FR-009**: The system MUST require the same set of Evidence Items for every Assessment, so that two Assessments are comparable on content rather than on form.
- **FR-010**: The system MUST NOT allow `approved` or `escalated` to be recorded for an Assessment that is missing any required Evidence Item, and MUST state which items are missing. **Amended 2026-08-21, per persona-agent review of issue #5:** this bound does not apply to `refused` — Underwriter may refuse on whatever evidence he already has, since a fast refusal protects him and costs the Applicant nothing that an eventual, evidenced refusal would not have cost anyway.
- **FR-011**: The system MUST evaluate the request's machinery value against the Authority Limit, MUST allow `approved` and `refused` only at or below it, and MUST allow only `escalated` above it.
- **FR-012**: The system MUST allow Underwriter to record an approval carrying its reason and its Conditions — down payment, term, guarantees, and which machine — and MUST NOT allow an approval without Conditions.
- **FR-013**: The system MUST allow Underwriter to record a refusal carrying its reason, and MUST NOT produce an operation or an Instalment Schedule from it.
- **FR-014**: The system MUST produce an approved operation's Instalment Schedule with every instalment anchored to a named Certification Milestone of the Project, and MUST NOT produce a calendar-anchored schedule when the Project has no Certification Schedule (BR-04).
- **FR-015**: The system MUST NOT allow Underwriter to alter what is owed, or when it falls due, on an operation whose Instalment Schedule is signed.
- **FR-016**: The system MUST keep a Decision's reason, its Conditions, and every Evidence Item it rested on retrievable with that Decision after it is recorded.
- **FR-017**: The system MUST raise a Slippage Warning against a live operation when a Certification Milestone of its Project passes its expected date without a recorded certification, naming the operation, the Project and the milestone, and directing it to the Underwriter who recorded that operation's Decision.
- **FR-018**: The system MUST keep a Slippage Warning retrievable after its milestone is subsequently certified, recording that it was.
- **FR-019**: The system MUST NOT change any instalment's amount or due condition as a consequence of a Slippage Warning.
- **FR-020**: The system MUST allow Underwriter to record a Default Declaration with its reason against an operation, and that declaration MUST authorise recovery without performing it.
- **FR-021**: The system MUST NOT provide Underwriter any capability to release, hand over, or recover a machine, whether or not a default has been declared.
- **FR-022**: The system MUST allow an escalated Assessment's committee resolution to be recorded against that same Assessment, retrievable with it.
- **FR-023**: The system MUST make it retrievable, for a live operation carrying a Slippage Warning, whether the operation has reached Default-Declaration eligibility under BR-09, and MUST NOT record a Default Declaration by itself when that threshold is reached.
- **FR-025**: The system MUST allow Underwriter to record, against an Assessment, a request for further evidence from the Applicant, stating what is being asked for, and MUST make that request observable to the Applicant. **Added 2026-08-21, per persona-agent review of issue #5:** `personas/Carlos.MD` grants Underwriter the right to "demand further evidence before deciding", and nothing in this feature realised it — his only instrument for an incomplete file was to hold the Assessment silently, which is a stalemate rather than a delegated authority, and which leaves the Applicant waiting without knowing why.
- **FR-024**: The system MUST allow Underwriter to record a Certification Milestone as certified and paid, with the date, and MUST treat a Certification Milestone as uncertified until this is recorded — this is what FR-017's Slippage Warning and the Instalment Schedule's due condition (FR-014) both test against. Certification is a necessary condition for its anchored instalment to fall due, never a sufficient one: the instalment falls due on the **later** of its milestone's certification (BR-04) and the client's confirmation that it received the machine (BR-08), so neither event alone makes it payable.

### Key Entities

- **Assessment**: the working file for one Leasing Request. Holds Evidence Items, carries at most one Decision, and remains the single thread a case lives on, including after escalation.
- **Evidence Item**: one recorded piece of support attached to an Assessment — Applicant eligibility, Credit Standing, Project identification, Certification Schedule, Payer. Required set is the same for every Assessment.
- **Applicant**: the company under assessment. Carries an eligibility determination under BR-02 and a Credit Standing.
- **Project**: the Applicant's undertaking under assessment. Carries what was awarded, by whom and for how much, and a Certification Schedule.
- **Certification Milestone**: one expected certification point of a Project, with the date it is expected to be certified and paid, the amount it is expected to release, and whether it has been certified. Instalments anchor to it, and its amount is what makes an anchoring checkable rather than merely stated.
- **Payer**: the party that owes the Applicant for the Project. Named, with what is known of its payment behaviour, including unknown.
- **Decision**: the resolution of an Assessment — `approved`, `refused` or `escalated` — carrying a reason, Conditions when it is an approval, and the identity of the Underwriter who recorded it.
- **Conditions**: the terms an approval was granted under: down payment, term, guarantees, and which machine.
- **Instalment Schedule**: the sequence of instalments of an approved operation, each anchored to a Certification Milestone. Signed schedules are immutable to Underwriter.
- **Slippage Warning**: a signal against a live operation that a Certification Milestone passed its expected date uncertified. Names operation, Project and milestone; records subsequent certification; changes nothing owed.
- **Default Declaration**: Underwriter's recorded determination, with reason, that an operation has defaulted. Authorises recovery; performs nothing.

## Phased Scope

### Stage 1 — POC Happy Path

Stage 1 is exactly the happy path User Stories 1 and 2 describe together, and is exactly what the POC referenced by Constitution Principle V builds for this actor:

1. A Leasing Request has been submitted (by `001`'s flow).
2. Underwriter sees it among the requests waiting on him and takes it up.
3. He records the Applicant as a company that works by project (BR-02).
4. He records the Applicant's Credit Standing.
5. He records the Project: what was awarded, by whom, for how much, and its Certification Schedule.
6. He records the named Payer and what is known of its payment behaviour.
7. The Assessment is now fully evidenced, and the system says so.
8. The request's machinery value is at or below the Authority Limit.
9. He records an approval with its reason and its Conditions.
10. The operation's Instalment Schedule is produced, every instalment anchored to a Certification Milestone of the Project (BR-04).
11. The Decision, its Conditions and its evidence remain retrievable afterward.
12. As the Project progresses, Underwriter records each Certification Milestone as certified and paid (FR-024). Each recording makes the instalment anchored to that milestone fall due on `001`'s side, provided the machine has been received (BR-08). **Added 2026-08-21, per EVAL iteration 01:** without this step no milestone is ever certified, so no instalment ever falls due, and `001`'s Stage 1 — which pays every instalment — could not complete. The POC would then either skip the anchoring entirely or pay instalments that never became payable, in both cases demonstrating the generic ledger Principle III forbids instead of the mechanism the whole system exists for.

Nothing in Stage 1 assumes a refusal, an escalation, a Project without a Certification Schedule, a slip, or a default. Step 12's milestones are certified **on time** in the happy path; a milestone passing its expected date uncertified is the Slippage Warning of User Story 4, which is later-stage.

### Later stages (not Stage 1)

The following are real boundaries for future scope, not commitments made by this feature:

- Refusal and what an Applicant may do after one, including resubmission.
- Escalation above the Authority Limit and the recording of a committee resolution (User Story 3).
- Slippage Warnings and Default Declarations (User Story 4).
- What Underwriter, or Lea$e, actually does once an operation reaches Default-Declaration eligibility (BR-09) beyond his standing option to declare a default — collections action, renegotiation, or anything short of default remains unspecified here.
- Reassessment of a live operation when the Applicant's Credit Standing changes.
- More than one Project, or more than one machinery need, on a single Assessment.
- Any automated evaluation of evidence, scoring, or recommendation.
- Portfolio-level views across many operations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For one submitted Leasing Request, the entire Stage 1 assessment — from taking it up through an approval whose Instalment Schedule is anchored to the Project's Certification Milestones — can be walked through end to end using only the capabilities this feature defines.
- **SC-002**: No Decision exists anywhere in the system without a retrievable reason and, where it is an approval, retrievable Conditions and the complete set of Evidence Items it rested on.
- **SC-003**: No `approved` or `refused` Decision exists for a request whose machinery value exceeds the Authority Limit.
- **SC-004**: For every instalment of every approved operation, the Certification Milestone it falls due against can be named, and no instalment falls due on a date unconnected to the Project's certification.
- **SC-005**: For a Project whose milestone passes its expected date uncertified, the warning reaches the deciding Underwriter while the operation's contract is still current and before any instalment is overdue.
- **SC-006**: Two Assessments of comparable size present the same required Evidence Items, so the difference between their outcomes is attributable to their content.
- **SC-007**: No capability of this feature lets the same person both decide an operation's fate and act on its machine.

## Assumptions

- `[ASSUMPTION]` Carlos represents Underwriter; see Users and Their Needs.
- `[ASSUMPTION]` The Authority Limit is USD 150,000 of machinery value, per `personas/Carlos.MD`. The figure is ours; the brief fixes no delegation. The limit is inclusive at its boundary.
- `[ASSUMPTION]` A credit committee exists above the Authority Limit, and its resolution is recorded against the escalated Assessment.
- Instalments are anchored to the Project's certified progress rather than to the calendar — this restates BR-04, not an invented assumption.
- Lea$e finances companies that work by project — this restates BR-02, not an invented assumption.
- `[ASSUMPTION]` An Assessment may proceed with the Payer named and its payment behaviour recorded as unknown; what is not permitted is leaving the Payer unnamed. No report on the Payer exists to require.
- `[ASSUMPTION]` An instalment falls due a fixed number of working days after its Certification Milestone is certified, rather than at the instant of certification. The offset itself is a business decision, not fixed here.
- `[ASSUMPTION]` A Slippage Warning is evaluated against the expected date recorded in the Certification Schedule the Applicant disclosed at application, which `personas/Carlos.MD` notes is the only forward-looking information Underwriter has.
- `[ASSUMPTION]` Default-Declaration eligibility follows BR-09's thirty-day / two-milestone tolerance. The figures are ours — the brief fixes no tolerance — chosen to be settled in advance and identical for every operation, per `personas/Carlos.MD`'s own requirement.
- `[ASSUMPTION]` In Stage 1 one Assessment concerns one Leasing Request, one Project and one machinery need, matching the same assumption in `001-company-machinery-leasing`.
- `[ASSUMPTION]` The separation of duties between deciding and executing — Underwriter declares a default, Julia recovers the machine — is ours, derived from the `Permissions` sections of both personas. The brief describes no internal organisation of Lea$e.

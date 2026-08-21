# Feature Specification: Deployed Fleet Custody

**Feature Branch**: `003-deployed-fleet-custody`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Custodia y seguimiento de la flota desplegada para el actor Julia (responsable de flota de Lea$e): entrega de la maquina con condicion y horas acordadas por ambas partes y un responsable nombrado del lado del cliente (BR-05), seguimiento de las horas-motor acumuladas que son el reloj de mantenimiento (BR-06), acordar y cumplir la ventana de servicio, saber cuando la maquina sale del sitio contratado, y cerrar el contrato por uno de sus dos finales: devolucion contra el registro de entrega, o adquisicion por el cliente que pago todas las cuotas (BR-07). Incluye recuperar la maquina cuando Carlos declara el incumplimiento, sin poder declararlo ella."

## Summary

Lea$e owns the machine for the life of the contract (BR-01), and the machine spends that life on ground Lea$e does not control, run by operators who do not work for it. This feature is written for the person who answers for it anyway: Fleet Manager, whose human perspective is [`personas/Julia.MD`](../../personas/Julia.MD).

Its subject is the interval that `001-company-machinery-leasing` passes over in a single step. In `001`, Company confirms it received the Machinery and later exercises the Acquisition Option; between those two events lies a year or more in which the machine wears, is serviced or is not, moves or does not, and either comes back or does not. Ownership without custody is only bearable if what happens in that interval is recorded rather than remembered.

The feature therefore covers: handing the machine over against a condition and hours record both parties accepted, with a named person on the client side holding it (BR-05); following the accumulated operating hours that are the machine's real maintenance clock (BR-06); raising a service when the interval is reached and completing it inside an agreed window; knowing when a machine leaves the site it was contracted to; recording incidents while the machine is deployed rather than discovering them at the end; and closing the deployment by one of its three ends — return settled against the handover record, retirement from the fleet because the client paid every instalment and acquired it (BR-07), or recovery after a declared default. It also covers recovering a machine after a default has been declared — a default Fleet Manager acts on and may never declare herself.

## Problem

Between handover and the end of a contract, Lea$e's asset is invisible to the party that owns it. Its use is learned when someone chooses to report it, which is usually after something has broken. Its maintenance falls due on accumulated hours (BR-06), so the clock advances at a speed only the site knows, and a service window costs the client a day of production and costs him nothing to postpone — he is optimising his project, Lea$e is optimising an asset he gives back. Damage is discovered at return, which is the worst possible moment to establish when it happened: with no condition both parties accepted at handover, every claim becomes a negotiation Lea$e loses by default.

The consequences land on the same asset the financing gap was closed with. A machine that comes back worth less than the next contract needs it to be worth makes the next contract more expensive, which raises the cost of closing the gap for the next Company. And when an operation fails, recovery is logistics rather than law: by the time anyone decides a machine must come back, Lea$e still needs transport, access and a route, and starts from nothing.

**Why condition work here is not rental condition work.** A rental firm and Lea$e both record hours and condition, so the *form* of FR-003 to FR-014 is not what distinguishes them. What the machine **is** distinguishes them, and it changes what those records are for. A rental firm owns its fleet by choice and watches wear to price the next rental: a worn machine simply rents for less, and nothing already committed is lost. Lea$e paid the supplier in full before the client paid anything (BR-01), and recovers that money over instalments the client pays only as its project certifies (BR-04) — so the machine is the security for money already out the door, and wear is not a pricing input but the erosion of the only collateral behind an outstanding balance. That is what BR-13 states and FR-031 makes observable: for a deployed machine, whether its condition and hours have carried it below what the contract still owes. No rental business has that question, because no rental business has a balance.

That is also why the servicing obligation runs the wrong way for a rental. Lea$e is repaid out of the client's project, and only as that project is certified (BR-04). A machine standing idle for want of a service does not cost Lea$e a day's rent — it stops the progress that certifies, and an uncertified milestone is an instalment that does not fall due (`001` FR-010b). A rental firm's downed machine costs it revenue directly; Lea$e's costs it the event its own repayment depends on. That is why the hours clock (BR-06), the service window and BR-10's threshold sit in a leasing company at all, and it is why FR-028 exposes instalment progress to a fleet manager who in a rental business would have no business seeing it.

Two of the three ends are financing events: Acquisition Retirement happens only because instalments finished (BR-07), Recovery Close only because they stopped. Return — the third — is the ordinary end a rental would also have, and this feature does not pretend otherwise.

## Goal

Enable Fleet Manager to know the condition, use, location and maintenance state of every deployed machine without depending on the site to volunteer it, to settle what changed against a record both parties accepted rather than against memory, and to know whether the machine still covers what its contract owes, and to close every deployment by one of its three defined ends with the asset's state unambiguous.

## Out of Scope

- Software architecture, technology selection, and any implementation detail (Constitution, Principle I) — this belongs to `/speckit-plan`.
- Telemetry hardware, sensors, GPS units and how an hours reading or a location is physically obtained. This feature specifies that a reading exists, what it means and what depends on it; where it comes from is not specified here. `[ASSUMPTION: readings may be captured by an inspection, by the client, or by a device — this specification is deliberately indifferent, so that Stage 1 is buildable without hardware.]`
- Maintenance execution itself: parts, labour, workshop scheduling, technician assignment, cost of a service. That a service falls due, is scheduled into a window and is completed is in scope; how it is performed is not.
- Insurance: policies, premiums, claims and their settlement. BR-05 places the cost of cover on the client; this feature records the incidents a claim would be built from and goes no further.
- How a machine's worth is *arrived at* — depreciation method, market comparables, residual-value modelling — and any pricing consequence of wear. What is in scope is that an **Assessed Value** exists as a recorded figure (FR-031b) so BR-13's comparison can be made; how someone reaches that figure is not this feature's business.
- The financing decision, the authority to make it, and the declaration that a contract has defaulted. That is `002-leasing-request-underwriting`, and Fleet Manager is barred from all of it (see Authority and Separation of Duties).
- Company's own journey — requesting, confirming receipt, paying, exercising acquisition. That is `001-company-machinery-leasing`.
- Procurement of machines into the fleet, and disposal of machines out of it other than by acquisition.
- **Arranging** a recovery — contracting the transport, obtaining the access permits, planning the route. What a Recovery *carries* is in scope and fixed by FR-022 and FR-030 — required at handover, not left to whoever thinks of it; hiring the lowboy is not. `[ASSUMPTION: an earlier draft claimed transport, access and route were recorded when no requirement did so; rather than withdraw the claim, FR-030 now makes them recordable, because personas/Julia.MD's success signal is that she knows what it takes to get the machine back rather than starting to find out — and that is a fact about the deployment, not field logistics.]`

## Key Product Concepts

- **Fleet Manager**: the person at Lea$e accountable for machines that are deployed on clients' sites. The actor this feature is written for; her human perspective is [`personas/Julia.MD`](../../personas/Julia.MD).
- **Machine**: one machinery unit owned by Lea$e (BR-01). It has an identity that outlives any single contract, an accumulated operating-hours figure, a condition history, and a fleet state (available, deployed, or retired).
- **Deployment**: one machine placed with one client under one operation, from handover to close. The thread this feature tracks. A Machine has at most one open Deployment at a time.
- **Contracted Site**: the location a Deployment's machine is contracted to work at, recorded at handover.
- **Custodian**: the named person on the client's side who is holding the machine and answers for its custody (BR-05). A Deployment always has one.
- **Handover Record**: the machine's condition and its operating-hours reading at the moment of handover, accepted by both Lea$e and the client. It is the baseline every later claim is settled against, and it is what turns a dispute into an assessment.
- **Operating-Hours Reading**: a recorded figure of the machine's accumulated running hours at a moment in time. The measure of wear, and the only clock that governs maintenance (BR-06).
- **Service Interval**: the number of accumulated operating hours between services for a machine. Expressed in hours, never in elapsed time (BR-06).
- **Service Due**: the state a Deployment's machine enters when its accumulated hours reach its Service Interval. It is a fact about the machine, not a request to the client.
- **Service Window**: an agreed period during which the client will release the machine so a due service can be completed.
- **Assessed Value**: a recorded figure for what a machine is currently worth, set at handover and updated when an inspection or an incident gives reason to. It is an input this feature records, never one it calculates — how a valuer arrives at it is out of scope.
- **Collateral Adequacy**: whether a deployed machine's Assessed Value is still at least what its operation has left to pay (BR-13). The question that makes this feature's condition and hours records a financing instrument rather than asset care — a rental firm has no outstanding balance for a machine's condition to fall below.
- **Site Departure**: a recorded fact that a Deployment's machine is no longer at its Contracted Site.
- **Incident**: a recorded event affecting a deployed machine — damage, a safety event, a breakdown — with when it was recorded and what was known then. Recorded in flight, so that condition at return is assessed rather than argued.
- **Safety Stop**: Fleet Manager's recorded instruction that a machine must not work, on a safety cause. The only cause on which she may stop a working machine absent a declared default.
- **Close**: the end of a Deployment, by exactly one of three ends — **Return**, where the machine comes back and its condition is settled against the Handover Record; **Acquisition Retirement**, where the client has paid every instalment and acquired the machine (BR-07) and it leaves the fleet; or **Recovery Close**, where the machine came back under a Recovery after a declared default and its condition is settled as a Return's is. The first two are the ends Company's own decision produces; the third is the end that exists because that decision never came.
- **Recovery**: the work of bringing a machine back after a Default Declaration recorded in `002-leasing-request-underwriting`. Fleet Manager performs it; she never declares the default that authorises it.

## Users and Their Needs

This feature is written for **Fleet Manager** alone. Her human perspective is [`personas/Julia.MD`](../../personas/Julia.MD).

Pedro ([`personas/Pedro.MD`](../../personas/Pedro.MD)) appears here as the client side of a handover and as the party who may acquire the machine; his own journey is `001-company-machinery-leasing`. Carlos ([`personas/Carlos.MD`](../../personas/Carlos.MD)) appears only as the person whose Default Declaration authorises a Recovery; his flows are `002-leasing-request-underwriting`.

Fleet Manager's needs, as covered by this feature:

- Hand a machine over against a condition and hours record both sides accepted, with the Custodian named, because custody and damage sit with the client (BR-05).
- Know the accumulated operating hours of every deployed machine without having to ask the site for them.
- Know when a machine's service falls due, in hours (BR-06), while there is still time to schedule it.
- Ask a site that has no reason to stop for a Service Window, have that ask on the record whether or not it is answered, and know whether the service was completed inside the window that was agreed.
- Record an incident while the machine is deployed, so condition at return is assessed against a record rather than argued from memory.
- Know when a machine has left the site it was contracted to, at the time it happens.
- Know, before a term ends, whether a machine is coming back or leaving the fleet by acquisition (BR-07), so the next contract is not planned around a machine that will never return.
- Service the machines whose security is already impaired before those whose is not, and know whether a deployed machine is still worth at least what its contract has left to pay (BR-13) — she is measured on machines coming back "still worth what the next contract needs it to be worth", and while the contract runs that worth is what secures money Lea$e has already paid out.
- Settle a return against the same Handover Record both parties accepted.
- Retire an acquired machine from the fleet cleanly, without being able to hold it back.
- Stop a machine from working on a safety cause — and on no other cause, unless a default has been declared.
- Recover a machine once a default has been declared, starting from what is already known about where it is and what getting it back requires.
- Never be the one who decides that a client has stopped paying.
- Have a machine standing idle counted against the project milestone it was standing under, and have that reach the person carrying the exposure — because a stopped machine here does not cost a day's rent, it costs the certification Lea$e is repaid by (BR-04).

## Key Product Decisions

- **What a Deployment is anchored to**: exactly one machine and one approved operation. A Deployment opens at handover and closes at exactly one end. `[ASSUMPTION: in Stage 1 one operation concerns one machine, matching the same assumption in 001 and 002.]`
- **What a handover requires**: a condition record, an Operating-Hours Reading, a named Custodian, a Contracted Site, the Custodian's acceptance of the obligation to report a departure from that site (FR-014b), and what recovering the machine from that site would take (FR-030) — all six, accepted by both sides — plus the machine's Assessed Value (FR-031b), which Lea$e records without asking the client to agree it. The last is there because the day it is needed is the day nobody will help gather it. A handover missing any of them is not a handover this feature performs, because the whole value of the record is that it was agreed before there was anything to argue about.
- **What "accepted by both sides" means**: both Lea$e and the client are recorded as having accepted the Handover Record's contents at handover, and the record is thereafter immutable. It may be superseded by a later record, never edited. `[ASSUMPTION: acceptance is an explicit act by a named person on each side. The brief describes no handover procedure; this is ours, and it is the minimum that makes a later assessment possible.]`
- **What governs maintenance**: accumulated operating hours, never elapsed time (BR-06). A machine reaches Service Due when its accumulated hours since its last completed service reach its Service Interval, regardless of how long it has held the contract.
- **What a Service Due is and is not**: it is a fact about the machine's state, raised by the hours. It is not an instruction to the client and it does not by itself stop the machine. Agreeing the Service Window is a separate act, and a client who postpones is not thereby in breach of anything this feature defines.
- **What happens when a service is not completed in its window**: the Deployment records that the window passed with the service outstanding, and the machine remains Service Due with its overdue hours visible. **Resolved (2026-08-21):** once the overdue hours exceed 20% of the machine's Service Interval, BR-10, catalogued in [`business-rules.md`](../../business-rules.md), makes this a Safety Stop cause — the same capability Fleet Manager already has for any safety ground, not a new one. Below that threshold, the fact is recorded and nothing forces the machine to stop; Stage 1 never reaches the threshold, since its happy path completes the service inside its window.
- **Where the hours come from**: an Operating-Hours Reading is recorded against a Deployment with the moment it refers to. This feature does not specify who or what records it, and deliberately supports a reading taken at an inspection as well as one arriving continuously — so that Stage 1 does not depend on hardware.
- **What a Site Departure means**: that the machine is not at its Contracted Site. This feature records the fact and makes it known to Fleet Manager; it does not decide whether the departure was permitted. `[ASSUMPTION: a machine working a second site is common and not by itself a breach — personas/Julia.MD's complaint is that she does not know, not that it is forbidden. Whether the contract permits it is a matter for the contract, not for this feature.]`
- **How a Deployment closes**: by exactly one of Return, Acquisition Retirement or Recovery Close, never more than one and never none. Which of the first two applies follows from whether the operation's Acquisition Option was exercised, declined, or left to lapse (BR-07, BR-11) — `001`'s behaviour, not this feature's; Recovery Close is this feature's own, for a machine brought back after a declared default. **Amended 2026-08-21 (EVAL iterations 02 and 03):** while the Option is merely `available`, a live Deployment does not close at all — Fleet Manager sees "not yet determined" (FR-016) rather than a premature Return. What once made that dangerous was that nothing bounded it; BR-11 now does, giving Company 30 calendar days before the Option lapses, so "not yet determined" is a wait with an end rather than a machine stranded indefinitely.
- **What Fleet Manager may withhold at close**: nothing. A Return settles condition against the Handover Record and may record a difference; an Acquisition Retirement may not be refused, delayed, or made conditional on a damage or missed-service claim. On a machine the client is acquiring there is no return condition left to protect, and the client's right to it does not depend on Lea$e's satisfaction (BR-07).
- **What a Recovery is**: work authorised by a Default Declaration recorded elsewhere. It carries the machine's last known location, its last Operating-Hours Reading, its Custodian, and its Contracted Site, so that the work starts from what is already known.
- **What belongs to Stage 1**: exactly the happy path in Phased Scope below — handover recorded and accepted, hours followed, a service raised and completed inside its window, and the Deployment closed by the end its operation reached. Departures, incidents, safety stops and recovery are specified here but are not what the POC demonstrates.

## Authority and Separation of Duties

This section exists because Fleet Manager's authority is bounded in a way that is behaviour, not advice — and because it is the mirror of a bound specified in `002-leasing-request-underwriting`.

**She executes; she does not decide.** Fleet Manager may recover a machine once a default has been declared. She may not declare one, and she may not record that a client has stopped paying. That determination belongs to Underwriter, in `002`, whose FR-021 correspondingly denies him any capability to act on a machine. Neither of them can both decide an operation's fate and act on its asset, and neither feature may create a path that lets them.

**She may stop a machine only on safety.** Absent a declared default, a Safety Stop is the only ground on which Fleet Manager may stop a working machine. She may not stop one to force a service window, to settle a dispute, or to apply pressure over a payment.

**She may not move money.** Fleet Manager may not change what a client owes or when it falls due — not to compensate for a service stop, not for a breakdown, not for damage. What a client owes is fixed by the operation's Instalment Schedule and anchored to the project's certification milestones (BR-04); a machine's condition is not an input to it in this feature.

**She may not hold what is owed to the client.** Once a client has met the contract, Fleet Manager may not hold the machine or refuse its release; where the client has acquired it under BR-07, she may not refuse or delay the acquisition at all.

## Expected User Experience

From Fleet Manager's side, this feature is defined by what she can always establish about a machine she cannot see:

- **The baseline exists before the dispute.** For every deployed machine, the condition and hours both sides accepted at handover are retrievable, and nobody can revise them after the fact.
- **The clock is hers, not the site's.** The accumulated hours of every deployed machine are known to her without her having to ask for them.
- **A service is news before it is a problem.** She learns a service is due while there is still time to schedule it, not after it has been missed.
- **Damage has a date.** An incident recorded in flight is what a return is assessed against, so condition at return is a comparison rather than an argument.
- **A machine is where she believes it is.** If it is not, she knows that at the time it happens.
- **Wear is measured against what is owed.** For any deployed machine she can tell whether its condition and hours have carried it below the balance it secures, rather than learning it at return.
- **The end is known before it arrives.** She can tell which end a live Deployment is heading for, and BR-11 bounds how long "not yet determined" can last.
- **Recovery starts from something.** When a default is declared, what is already known about the machine — where it was, who held it, how many hours it had run — is already in her hands.

## User Scenarios & Testing *(mandatory)*

Each user story below is independently testable and is written from Fleet Manager's side. Each Acceptance Scenario is the atomic Given/When/Then form of the corresponding need; the **Acceptance Criteria** section restates and cross-references the same guarantees against Functional Requirements for traceability, without repeating their narrative.

### User Story 1 - Fleet Manager hands a machine over against a record both sides accepted (Priority: P1)

Julia hands a machine to a client for an approved operation. Everything FR-003 requires is recorded and accepted by both sides — condition, operating hours, a named Custodian, the Contracted Site, that Custodian's obligation to report a departure from it, and what recovering the machine from there would take — and Lea$e records the machine's Assessed Value alongside. From that moment the machine is deployed, and the record is fixed.

**Why this priority**: every other guarantee in this feature is settled against this record. Without it, wear cannot be attributed, damage cannot be dated, and a return is a negotiation. It is also what makes the client's custody under BR-05 mean something concrete rather than a clause.

**Independent Test**: can be fully tested by handing over one machine for one approved operation, recording every element FR-003 requires, having both sides accept those they must, and confirming the record is thereafter retrievable and immutable — delivers the baseline that every later assessment depends on.

**Acceptance Scenarios**:

1. **Given** an approved operation and an available machine, **When** Fleet Manager records the handover with everything FR-003 requires and both sides accept what they must, **Then** a Deployment exists and the Handover Record is retrievable from it.
2. **Given** a handover missing any element FR-003 requires, **When** Fleet Manager attempts to complete it, **Then** the system does not open a Deployment, and states which element was missing.
3. **Given** an accepted Handover Record, **When** anyone attempts to alter its contents, **Then** the system does not allow the change.

---

### User Story 2 - Fleet Manager follows the hours and learns a service is due before it is missed (Priority: P2)

Julia follows the operating hours a deployed machine accumulates. When those hours reach the machine's Service Interval, the machine becomes Service Due and she knows it — because the hours say so, not because the site called. The Custodian holding the machine learns it in the same moment, so the state is not something Lea$e knows alone.

**Why this priority**: it is the only clock that governs wear (BR-06), and it is the difference between servicing on time and servicing after damage. It comes second because a reading is meaningless without the handover baseline it counts from.

**Independent Test**: can be fully tested by recording successive Operating-Hours Readings against one Deployment until its Service Interval is reached, and confirming the machine becomes Service Due and appears among the machines needing a service, with its overdue hours visible as they grow.

**Acceptance Scenarios**:

1. **Given** a Deployment, **When** an Operating-Hours Reading is recorded, **Then** the machine's accumulated hours reflect it and the reading is retrievable with the moment it refers to.
2. **Given** a deployed machine whose accumulated hours since its last completed service reach its Service Interval, **When** its state is evaluated, **Then** it is Service Due regardless of how long it has held the contract.
3. **Given** any deployed machine, **When** Fleet Manager queries its accumulated hours, **Then** they are available to her without a request to the site.
4. **Given** a machine that is Service Due, **When** further hours accumulate, **Then** the hours it is overdue by are retrievable.
5. **Given** a deployed machine that reaches its Service Interval, **When** it becomes Service Due, **Then** that state is observable to its named Custodian.

---

### User Story 3 - Fleet Manager gets a due service completed inside an agreed window (Priority: P3)

Julia asks the client for a Service Window for a machine that is Service Due — an ask that is on record whether or not it is answered — agrees one, and the service is completed inside it, at which point the machine's worth is reassessed while someone competent has it in front of them. If the window passes with the service outstanding, that fact is recorded and the machine stays due.

**Why this priority**: a Service Due that never becomes a completed service protects nothing. It is third because it presupposes the due state that Story 2 produces.

**Independent Test**: can be fully tested by taking one Service Due machine, agreeing a Service Window, recording the service as completed within it, and confirming the machine's service clock restarts from the hours at completion — then repeating with a window that passes uncompleted and confirming the machine remains due.

**Acceptance Scenarios**:

1. **Given** a machine that is Service Due, **When** Fleet Manager records a request for a Service Window, **Then** the request is recorded against the Deployment whether or not the client answers it.
1b. **Given** a recorded request for a Service Window, **When** the client agrees one, **Then** the window is recorded against the Deployment.
2. **Given** an agreed Service Window, **When** the service is recorded as completed within it, **Then** the machine is no longer Service Due and its Service Interval counts from the hours at completion.
2b. **Given** a service being recorded as completed, **When** the completion is recorded, **Then** the machine's Assessed Value is reassessed.
3. **Given** an agreed Service Window that passes with the service outstanding, **When** the Deployment is retrieved, **Then** it records that the window passed uncompleted and the machine is still Service Due.

---

### User Story 4 - Fleet Manager closes a deployment by the end its operation reached (Priority: P4)

The term ends. Julia can already tell which end this Deployment is heading for. If the machine returns, its condition is settled against the Handover Record and any difference is recorded. If the client paid every instalment and acquired it (BR-07), the machine is retired from the fleet and Julia cannot hold it back.

**Why this priority**: it is what she is measured on, and it is where the value of every earlier record is realised. It is fourth because it presupposes all of them.

**Independent Test**: can be fully tested over one Deployment per end — closing by Return with a condition difference recorded against the Handover Record, by Acquisition Retirement with the machine leaving the fleet, and by Recovery Close after a declared default — confirming that exactly one end applies and that none can be refused.

**Acceptance Scenarios**:

1. **Given** a live Deployment, **When** Fleet Manager asks which end it is heading for, **Then** the answer is Recovery Close if a Default Declaration stands against the operation, otherwise Acquisition Retirement if the Option has been exercised, Return if it has been declined or has lapsed, or "not yet determined" (BR-07, BR-11).
2. **Given** a Deployment closing by Return, **When** the machine's condition and hours at return are recorded, **Then** they are settled against the Handover Record and any difference is retrievable.
3. **Given** a Deployment whose client has acquired the machine, **When** it closes, **Then** the machine is retired from the fleet and no damage or missed-service claim can delay or refuse the acquisition (BR-07).
4. **Given** a closed Deployment, **When** it is retrieved, **Then** it closed by exactly one end.

---

### User Story 5 - Fleet Manager knows a machine has left its contracted site (Priority: P5)

The machine is working somewhere other than the site it was contracted to. Julia knows, at the time it happens, rather than when it comes back from a place nobody mentioned.

**Why this priority**: it is a standing hole in her knowledge rather than a step in her flow — a machine at an unknown location is one she cannot inspect, service or recover. It is fifth because the Deployment must exist before its location can be wrong.

**Independent Test**: can be fully tested by recording a Site Departure against one live Deployment and confirming Fleet Manager can retrieve, for that Deployment, that the machine is away from its Contracted Site and when it left.

**Acceptance Scenarios**:

1. **Given** a live Deployment, **When** a Site Departure is recorded, **Then** the Deployment shows the machine as away from its Contracted Site, with when it left.
2. **Given** a Deployment with a recorded Site Departure, **When** Fleet Manager retrieves her deployed machines, **Then** that machine is distinguishable from those at their Contracted Sites.

---

### User Story 6 - Fleet Manager recovers a machine after a default is declared (Priority: P6)

Carlos declares a contract in default. Julia recovers the machine — and can only do so because he declared it. What she needs to start is already in her hands: where the machine was, who was holding it, and how many hours it had run.

**Why this priority**: it is the end nobody plans for and the one that costs most when unprepared. It is last because it is the exceptional path, and it depends on a declaration that another feature produces.

**Independent Test**: can be fully tested by recording a Default Declaration against one live Deployment's operation, confirming a Recovery becomes available to Fleet Manager carrying the machine's last known location, Custodian and hours, and confirming that no Recovery is available for a Deployment without such a declaration.

**Acceptance Scenarios**:

1. **Given** a live Deployment whose operation has a recorded Default Declaration, **When** Fleet Manager opens a Recovery, **Then** it carries the machine's last known location, its last Operating-Hours Reading, its Custodian and its Contracted Site.
2. **Given** a live Deployment with no Default Declaration, **When** Fleet Manager attempts to open a Recovery, **Then** the system does not open one.
3. **Given** any Deployment, **When** Fleet Manager attempts to declare a default or to record that a client has stopped paying, **Then** the system provides her no capability to do so.

### Edge Cases

- **Handover attempted for a machine already deployed**: no second Deployment opens for a machine whose Deployment is still open (FR-002).
- **An hours reading lower than the machine's accumulated hours**: the reading is rejected rather than lowering the machine's accumulated total, because hours only ever go up (FR-006).
- **A machine reaches its Service Interval while it is away from its Contracted Site**: it becomes Service Due exactly as it would at home; being away does not suspend the hours clock (BR-06, FR-007).
- **A service completed outside its agreed window**: the completion is recorded with the hours at completion and the machine is no longer due; the record still shows the window passed uncompleted (FR-011).
- **Damage discovered at return that was never recorded as an Incident**: the difference against the Handover Record is recorded as a difference; this feature does not decide who pays for it, because custody and cover sit with the client (BR-05) and the settlement itself is out of scope (FR-015).
- **Client acquires a machine that is Service Due or has an open Incident**: the acquisition proceeds and the machine is retired; neither can be used to refuse or delay it (BR-07, FR-017).
- **A Safety Stop on a machine whose client is current**: permitted, because safety is the one ground that does not depend on the state of the contract (FR-019).
- **Fleet Manager attempts to stop a machine over an unpaid instalment**: no capability of this feature allows it, whether or not she believes the client has stopped paying (FR-019, FR-021).

## Acceptance Criteria

Each criterion is atomic, observable, and traceable to a Functional Requirement. Where a criterion states a business rule's effect, it cites the rule's identifier per `business-rules.md`'s convention.

- **AC-001**: **Given** an approved operation and an available machine, **When** Fleet Manager completes a handover carrying every element FR-003 requires, **Then** a Deployment exists, traceable to that operation and that machine. *(FR-001, FR-003)*
- **AC-002**: **Given** a handover missing any element FR-003 requires, **When** Fleet Manager attempts to complete it, **Then** no Deployment opens. *(FR-003)*
- **AC-002b**: **Given** a handover attempt refused for a missing element, **When** Fleet Manager retrieves the refusal, **Then** which element was missing is stated. *(FR-003)*
- **AC-002c**: **Given** a handover carrying every element FR-003 requires, one of **those FR-003 asks the client to accept** left unaccepted by the client, **When** Fleet Manager attempts to complete it, **Then** no Deployment opens — the record is worth having only because both sides agreed it before there was anything to argue about (BR-05). *(FR-003)*
- **AC-002d**: **Given** a handover whose Assessed Value the client has not accepted, all elements FR-003 asks the client to accept being accepted, **When** Fleet Manager completes it, **Then** the Deployment opens — the Assessed Value is Lea$e's own view of its security and is not offered to the client to agree. *(FR-003, FR-031b)*
- **AC-003**: **Given** a Deployment, **When** its Handover Record is retrieved, **Then** it names the Custodian who holds the machine, who answers for its custody and for damage caused by or with it (BR-05). *(FR-004)*
- **AC-004**: **Given** an accepted Handover Record, **When** any party attempts to alter its contents, **Then** the system does not allow the change. *(FR-005)*
- **AC-005**: **Given** a machine whose Deployment is open, **When** a second handover is attempted for it, **Then** no second Deployment opens. *(FR-002)*
- **AC-005b**: **Given** an approved operation whose Conditions name a particular machine, **When** a handover is attempted with a different machine, **Then** no Deployment opens. *(FR-001b)*
- **AC-006**: **Given** a Deployment, **When** an Operating-Hours Reading is recorded, **Then** it is retrievable with the moment it refers to and the machine's accumulated hours reflect it. *(FR-006)*
- **AC-007**: **Given** a machine's accumulated hours, **When** a reading lower than them is submitted, **Then** the accumulated hours do not decrease. *(FR-006)*
- **AC-008**: **Given** a deployed machine whose accumulated hours since its last completed service reach its Service Interval, **When** its state is evaluated, **Then** it is Service Due — maintenance falls due on hours run, not on time elapsed (BR-06). *(FR-007)*
- **AC-009**: **Given** two deployed machines with the same elapsed contract time and different accumulated hours, **When** their states are evaluated, **Then** only the one that reached its Service Interval is Service Due (BR-06). *(FR-007)*
- **AC-010**: **Given** any deployed machine, **When** Fleet Manager queries its accumulated hours, **Then** they are available to her without a request to the client. *(FR-008)*
- **AC-011**: **Given** a machine that is Service Due, **When** further hours accumulate, **Then** the hours it is overdue by are retrievable. *(FR-009)*
- **AC-012**: **Given** a Service Due machine, **When** Fleet Manager and the client agree a Service Window, **Then** it is recorded against the Deployment with its period. *(FR-010)*
- **AC-012b**: **Given** a machine that reaches Service Due, **When** its state is evaluated, **Then** that state is observable to its Custodian. *(FR-010b)*
- **AC-012c**: **Given** a Service Due machine whose Custodian has agreed no window, **When** Fleet Manager records a request for one, **Then** the request is retrievable against the Deployment — a client who did not answer is distinguishable from one who was never asked. *(FR-010b)*
- **AC-013**: **Given** an agreed Service Window, **When** the service is recorded as completed, **Then** the machine is no longer Service Due. *(FR-011)*
- **AC-013b**: **Given** a service recorded as completed, **When** the machine's next Service Due is evaluated, **Then** its Service Interval counts from the accumulated hours at completion, not from the hours at which it fell due (BR-06). *(FR-011)*
- **AC-014**: **Given** an agreed Service Window that passes with the service outstanding, **When** the Deployment is retrieved, **Then** it records that the window passed uncompleted. *(FR-012)*
- **AC-014b**: **Given** a Service Window that passed uncompleted, **When** the machine's state is evaluated, **Then** it is still Service Due. *(FR-012)*
- **AC-015**: **Given** a live Deployment, **When** Fleet Manager records an Incident, **Then** it is retrievable against that Deployment with when it was recorded and what was known then. *(FR-013)*
- **AC-016**: **Given** a live Deployment, **When** a Site Departure is recorded, **Then** the Deployment shows the machine as away from its Contracted Site with when it left. *(FR-014)*
- **AC-017**: **Given** deployed machines, **When** Fleet Manager retrieves them, **Then** those away from their Contracted Sites are distinguishable from those at them. *(FR-014)*
- **AC-018**: **Given** a live Deployment whose operation's Acquisition Option has been exercised or declined, **When** Fleet Manager asks which end it is heading for, **Then** the answer is Acquisition Retirement or Return respectively (BR-07). *(FR-016)*
- **AC-018d**: **Given** a live Deployment whose operation carries a Default Declaration, **When** Fleet Manager asks which end it is heading for, **Then** the answer is Recovery Close — not "not yet determined", because no decision of Company's can arrive. *(FR-016)*
- **AC-018c**: **Given** a live Deployment whose operation's Acquisition Option has lapsed unexercised (BR-11), **When** Fleet Manager asks which end it is heading for, **Then** the answer is Return — a lapse ends the operation exactly where an explicit decline does. *(FR-016)*
- **AC-018b**: **Given** a live Deployment carrying no Default Declaration whose operation's Acquisition Option is either `not yet available` or `available` without having been exercised or declined, **When** Fleet Manager asks which end it is heading for, **Then** the answer is "not yet determined" — distinguishable from both Return and Acquisition Retirement, and never absent. *(FR-016)*
- **AC-019**: **Given** a Deployment closing by Return, **When** the machine's condition and hours at return are recorded, **Then** the difference against the Handover Record is retrievable. *(FR-015)*
- **AC-020**: **Given** a Deployment whose client has acquired the machine, **When** it closes, **Then** the machine is retired from the fleet — the client's right to acquire follows from having paid every instalment (BR-07). *(FR-017)*
- **AC-020d**: **Given** a Deployment closing by Acquisition Retirement, **When** it closes, **Then** the machine's condition and hours at retirement are settled against its Handover Record. *(FR-017)*
- **AC-020b**: **Given** a machine, **When** Fleet Manager sets its Service Interval, **Then** that interval governs its Service Due determination (BR-06). *(FR-017b, FR-007)*
- **AC-020c**: **Given** a machine whose Service Interval was set under one Deployment, **When** it moves to a later Deployment, **Then** the same interval still governs it — the interval belongs to the machine, not to the contract. *(FR-017b)*
- **AC-021**: **Given** a Deployment whose client has acquired the machine and which has an open Incident or a Service Due state, **When** Fleet Manager attempts to refuse, delay or condition the acquisition on either, **Then** the system does not allow it (BR-07). *(FR-017)*
- **AC-022**: **Given** a closed Deployment, **When** it is retrieved, **Then** it closed by exactly one of Return, Acquisition Retirement, or Recovery Close. *(FR-018)*
- **AC-022b**: **Given** a Deployment whose machine came back under a Recovery, **When** it is closed by Recovery Close, **Then** the machine's condition and hours at recovery are settled against its Handover Record. *(FR-018b)*
- **AC-022c**: **Given** a Deployment closed by Recovery Close, **When** the machine is considered for a later Deployment, **Then** it is no longer blocked — a recovered machine returns to the fleet rather than being stranded by its closed Deployment. *(FR-018b, FR-002)*
- **AC-023**: **Given** a live Deployment, **When** Fleet Manager records a Safety Stop with its cause, **Then** the machine is recorded as not to be worked and the stop is retrievable. *(FR-019)*
- **AC-024**: **Given** a live Deployment with no declared default, **When** Fleet Manager attempts to stop the machine citing a cause that is not a risk to people or to the machine — to force a service window, to settle a dispute, or over an unpaid instalment — **Then** the system does not allow it. *(FR-019)*
- **AC-025**: **Given** any Deployment, **When** Fleet Manager attempts to change what the client owes or when it falls due, **Then** the system provides her no capability to do so. *(FR-020)*
- **AC-026**: **Given** any Deployment, **When** Fleet Manager attempts to declare a default or record that a client has stopped paying, **Then** the system provides her no capability to do so. *(FR-021)*
- **AC-027**: **Given** a live Deployment whose operation has a recorded Default Declaration, **When** Fleet Manager opens a Recovery, **Then** it carries the machine's last known location, its last Operating-Hours Reading, its Custodian and its Contracted Site. *(FR-022)*
- **AC-028**: **Given** a live Deployment with no Default Declaration, **When** Fleet Manager attempts to open a Recovery, **Then** no Recovery opens. *(FR-023)*
- **AC-029**: **Given** a client who has met the contract, **When** Fleet Manager attempts to hold the machine or refuse its release, **Then** the system does not allow it. *(FR-024)*
- **AC-030**: **Given** a Service Due machine whose overdue hours exceed 20% of its Service Interval, **When** Fleet Manager records a Safety Stop citing that condition as its cause, **Then** the system accepts it as a valid safety ground (BR-10). *(FR-025)*
- **AC-035**: **Given** any live Deployment, **When** Fleet Manager retrieves it, **Then** what its recovery would require — transport, access and route — is retrievable, because it was required at handover. *(FR-030, FR-003)*
- **AC-035c**: **Given** a Recovery opened for a Deployment, **When** Fleet Manager retrieves it, **Then** it carries that Deployment's current record of what the recovery takes. *(FR-030, FR-022)*
- **AC-036**: **Given** a handover being completed, **When** the Handover Record is accepted, **Then** it includes the Custodian's obligation to report a departure from the Contracted Site. *(FR-014b, FR-003)*
- **AC-034**: **Given** a deployed machine whose location has not been confirmed since its handover and another confirmed by an inspection this week, **When** Fleet Manager retrieves her deployed machines, **Then** each carries how long since its location was last confirmed, so the two are distinguishable. *(FR-029)*
- **AC-035b**: **Given** a handover being completed, **When** what a recovery of that machine from that site would take is absent, **Then** no Deployment opens — the record is required, not optional. *(FR-030, FR-003)*
- **AC-037**: **Given** a deployed machine whose current Assessed Value is below what its operation still owes, **When** Fleet Manager retrieves her deployed machines, **Then** that machine is distinguishable from one whose Assessed Value is at least its outstanding balance (BR-13). *(FR-031)*
- **AC-037e**: **Given** a deployed machine whose Assessed Value has not been revalued since handover and another revalued at its last completed service, **When** Fleet Manager retrieves her deployed machines, **Then** how old each machine's Assessed Value is is retrievable. *(FR-031d)*
- **AC-037f**: **Given** a deployed machine whose service is being completed, **When** the completion is recorded, **Then** the machine's Assessed Value is revalued. *(FR-031b)*
- **AC-037g**: **Given** a deployed machine on which an Incident is being recorded, **When** the Incident is recorded, **Then** the machine's Assessed Value is revalued. *(FR-031b)*
- **AC-038**: **Given** an agreed Service Window that passes with the service outstanding, **When** the Deployment is retrieved, **Then** an Unavailability is open against it. *(FR-032, FR-012)*
- **AC-038b**: **Given** a machine placed under a Safety Stop, **When** the stop is recorded, **Then** an Unavailability is open against its Deployment. *(FR-032, FR-019)*
- **AC-038c**: **Given** an Incident recorded as stopping work, **When** it is recorded, **Then** an Unavailability is open against its Deployment. *(FR-032, FR-013)*
- **AC-038d**: **Given** an open Unavailability, **When** the machine becomes available to work again, **Then** it is closed and how long it ran is retrievable. *(FR-032)*
- **AC-038e**: **Given** an Unavailability and a Certification Milestone of the operation's Project whose expected date falls inside it, **When** the Unavailability is retrieved, **Then** that Milestone is retrievable from it — the machine was standing when the event Lea$e is repaid by was due (BR-04). *(FR-032)*
- **AC-039**: **Given** an operation carrying an Unavailability, **When** the Underwriter who recorded that operation's Decision retrieves the operation, **Then** the Unavailability is observable to him. *(FR-033)*
- **AC-037d**: **Given** two Service Due machines, one whose Assessed Value is below its operation's outstanding balance and one whose is above, **When** Fleet Manager retrieves the machines needing service, **Then** the impaired one is ordered ahead of the other (BR-13). *(FR-031c)*
- **AC-037b**: **Given** a handover being completed with no Assessed Value for the machine, **When** Fleet Manager attempts to complete it, **Then** no Deployment opens. *(FR-031b, FR-003)*
- **AC-037c**: **Given** an inspection or a recorded Incident that gives reason to revise a machine's worth, **When** Fleet Manager updates its Assessed Value, **Then** the new figure is what BR-13's comparison uses from that point. *(FR-031b, FR-031)*
- **AC-033**: **Given** two live Deployments, one whose operation has every instalment but the last paid and one on its third of twenty-four, **When** Fleet Manager retrieves her deployed machines, **Then** each carries its instalment progress, so the two are distinguishable before either reaches its end. *(FR-028)*
- **AC-031**: **Given** a deployed machine, **When** Fleet Manager records an inspection of it with notice to the client, **Then** the inspection's findings, its Operating-Hours Reading and the machine's location at that moment are retrievable against that Deployment. *(FR-026)*
- **AC-032**: **Given** a deployed machine whose most recent Operating-Hours Reading is older than any other machine's, **When** Fleet Manager retrieves her deployed machines, **Then** the age of each machine's most recent reading is retrievable, so a machine that has stopped reporting is distinguishable from one that is idle. *(FR-027)*

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow Fleet Manager to open a Deployment by handing a machine over for an approved operation, and MUST make the Deployment traceable to both.
- **FR-001b**: The system MUST NOT allow a Deployment to open for a machine other than the one that operation's approval Conditions name (`002` FR-012). **Added 2026-08-21, per EVAL iteration 02:** "which machine" is a Condition Underwriter sets, and nothing checked it at the one moment it could be checked — the only backstop was Company reporting a mismatch after the machine reached the site (`001` FR-009b), which is after the fact and is Company's act, not Lea$e's.
- **FR-002**: The system MUST NOT allow a machine to have more than one open Deployment at a time.
- **FR-003**: The system MUST require a handover to carry the machine's condition, an Operating-Hours Reading, a named Custodian, a Contracted Site, the Custodian's acceptance of the departure-reporting obligation of FR-014b, and what a recovery of that machine from that site would take (FR-030), each accepted by both Lea$e and the client, and MUST additionally carry the machine's Assessed Value (FR-031b), which Lea$e records and the client is not asked to accept — it is Lea$e's own view of its security, not a term of the contract. The system MUST NOT open a Deployment when any of them is missing.
- **FR-004**: The system MUST record the Custodian as the person on the client's side holding the machine and answering for its custody and for damage (BR-05).
- **FR-005**: The system MUST keep an accepted Handover Record immutable after acceptance, allowing it to be superseded by a later record but never edited.
- **FR-006**: The system MUST allow an Operating-Hours Reading to be recorded against a Deployment with the moment it refers to, MUST reflect it in the machine's accumulated hours, and MUST NOT allow accumulated hours to decrease.
- **FR-007**: The system MUST place a machine in Service Due when its accumulated hours since its last completed service reach its Service Interval, independently of elapsed contract time (BR-06).
- **FR-008**: The system MUST make every deployed machine's accumulated operating hours available to Fleet Manager without requiring a request to the client.
- **FR-009**: The system MUST make retrievable, for a Service Due machine, the number of hours by which it is overdue.
- **FR-010**: The system MUST allow a Service Window to be agreed and recorded against a Deployment for a Service Due machine.
- **FR-010b**: The system MUST make a machine's Service Due state observable to its Custodian when it is reached, and MUST allow Fleet Manager to record a request for a Service Window against the Deployment, retrievable afterward whether or not the client agrees one. **Added 2026-08-21, per EVAL iteration 07:** `personas/Julia.MD` permits her to "set when a machine is due for service and require a window for it", and the requirement to *agree* one had no path to the client at all — Service Due reached nobody outside Lea$e and an unanswered ask left no trace, so a client who never responded was indistinguishable from one who was never asked. This does not make a Service Due an instruction, and it does not put the client in breach: it gives the ask a producer and a record, which is what the same defect got at FR-014b, FR-030 and `001` FR-025.
- **FR-011**: The system MUST allow a service to be recorded as completed with the accumulated hours at completion, MUST clear the Service Due state, and MUST count the next Service Interval from those hours (BR-06).
- **FR-012**: The system MUST open an Unavailability (FR-032) for the period the machine stands unserviced, and MUST record that an agreed Service Window passed with the service outstanding, and MUST keep the machine Service Due when it does.
- **FR-013**: The system MUST open an Unavailability (FR-032) where the Incident is recorded as stopping work, and MUST allow Fleet Manager to record an Incident against a live Deployment, retrievable afterward with when it was recorded and what was known then.
- **FR-014b**: The system MUST make the Custodian's obligation to report a Site Departure part of what is accepted at handover (FR-003), so that a machine leaving its Contracted Site is reported by the person holding it rather than discovered later. **Added 2026-08-21, per EVAL iteration 03:** FR-014 allowed a departure to be recorded and nothing caused one to be, so `personas/Julia.MD`'s "known to be somewhere else, at the time it happens" was delivered only as "when someone happens to record it." The Custodian already answers for the machine's custody (BR-05); reporting where it went is the smallest extension of that, and it gives the requirement a producer. `[ASSUMPTION: this makes the obligation part of the accepted handover rather than a system capability that detects movement — no telemetry is assumed, consistent with Out of Scope.]`
- **FR-014**: The system MUST allow a Site Departure to be recorded against a live Deployment, carrying where the machine went when that is known and recording it as unknown when it is not, and MUST make a machine away from its Contracted Site distinguishable from one at it. **Amended 2026-08-21, per persona-agent review of issue #5:** a Site Departure previously recorded only that the machine had left and when, which left FR-022's Recovery promising a "last known location" that no requirement produced — in exactly the case where the Contracted Site is the one address the machine is known *not* to be at.
- **FR-015**: The system MUST allow a Deployment closing by Return to record the machine's condition and hours at return, and MUST make the difference against the Handover Record retrievable.
- **FR-016**: The system MUST make retrievable, for a live Deployment, whether it is heading for Return (the operation's Acquisition Option was declined), heading for Acquisition Retirement (the Option was exercised), heading for Recovery Close (a Default Declaration stands against the operation, `002` FR-020 — its Option can never become available, so no decision of Company's is coming), or not yet determined — which covers an Option still `not yet available` on an operation carrying no Default Declaration, and one `available` inside the window Company has to decide in (BR-07, BR-11). A Default Declaration settles the end whatever the Option's state, and takes precedence over it. An Option that lapses unexercised (BR-11) heads for Return exactly as a declined one does. **Amended 2026-08-21, per EVAL iteration 05:** FR-018 gained Recovery Close as a third end and this signal kept the two-ended model, so a Deployment under a declared default answered "not yet determined" indefinitely for an end that was in fact settled. Together these account for all five states `001`'s FR-021 defines, leaving none unanswered, and none of them can leave a Deployment without an end: the undecided case is time-bounded rather than open indefinitely. **Amended 2026-08-21, per persona-agent review of issue #5:** before this, "not yet exercised" and "will not be exercised" were the same reading, so this requirement answered Return for the entire life of every Deployment that would in fact end in Acquisition Retirement — defeating the requirement's own purpose. It now answers every state `001-company-machinery-leasing`'s Acquisition Option can hold, because that spec distinguishes `available` (undecided) from `declined`, `exercised` and `lapsed`.
- **FR-017**: The system MUST retire a machine from the fleet when its client has acquired it, recording its condition and hours at retirement against the Handover Record as a Return does, and MUST NOT allow Fleet Manager to refuse, delay, or condition that retirement on a damage or missed-service claim, or on any difference that settlement records (BR-07). **Amended 2026-08-21, per persona-agent review of issue #5:** `personas/Julia.MD` permits her to "settle the condition and hours record when a machine is acquired instead of returned" and her own flow ends by handing that record over for good; Acquisition Retirement previously carried no settlement at all. Recording it changes nothing the client owes — FR-015's precedent is the same: it records a difference and does not decide who pays.
- **FR-017b**: The system MUST allow Fleet Manager to set a machine's Service Interval, which is a property of the machine rather than of any one contract, and MUST use it in the Service Due determination of FR-007 (BR-06).
- **FR-018**: The system MUST close every Deployment by exactly one of Return, Acquisition Retirement, or Recovery Close. **Amended 2026-08-21, per persona-agent review of issue #5:** a defaulted operation's Acquisition Option is permanently `not yet available` under `001`'s FR-015, since its instalments were never all paid — so it can never be exercised or declined, and the two-ended rule left a recovered machine's Deployment open forever, which FR-002 would then block from redeployment. Recovery Close is that third end: it closes a Deployment whose machine came back under a Recovery rather than under either of the two ends Company's own decision produces.
- **FR-018b**: The system MUST allow a Deployment to be closed by Recovery Close only where a Recovery was opened for it under FR-022, and MUST settle the machine's condition and hours at recovery against the Handover Record as a Return does.
- **FR-019**: The system MUST open an Unavailability (FR-032) for as long as the stop holds, and MUST allow Fleet Manager to record a Safety Stop against a live Deployment, citing as its cause a risk to the physical safety of people or of the machine itself — a recorded Incident of that kind (FR-013), a finding of an Inspection (FR-026), or a machine overdue for service past BR-10's threshold (FR-025). The system MUST NOT allow her to stop a machine on a cause outside that class unless a Default Declaration exists for its operation. **Amended 2026-08-21, per EVAL iteration 01:** "a cause that is not safety" was previously undefined while carrying the whole weight of AC-024, so no one could declare that criterion met or unmet. `[ASSUMPTION: the class is stated by what it protects — people or the machine — rather than by an exhaustive list, because a list would be wrong the first time the field produced a hazard nobody enumerated. What it excludes is what personas/Julia.MD forbids her: stopping a machine to force a service window, to settle a dispute, or to apply pressure over a payment.]`
- **FR-020**: The system MUST NOT provide Fleet Manager any capability to change what a client owes or when it falls due.
- **FR-021**: The system MUST NOT provide Fleet Manager any capability to declare a default or to record that a client has stopped paying.
- **FR-022**: The system MUST allow Fleet Manager to open a Recovery for a Deployment whose operation has a recorded Default Declaration, carrying the machine's last known location, last Operating-Hours Reading, Custodian and Contracted Site.
- **FR-023**: The system MUST NOT allow a Recovery to be opened for a Deployment whose operation has no recorded Default Declaration.
- **FR-030**: The system MUST require what a recovery would take — the transport a machine of its size needs, the access its site imposes, and the route to it — to be recorded at handover as part of the Handover Record (FR-003), MUST allow it to be updated while the Deployment is live, and MUST carry the current record into any Recovery opened for it. **Amended 2026-08-21, per EVAL iteration 05:** this was previously a capability nobody was obliged to use and it sat outside FR-003's required elements, so the Recovery meant to save Fleet Manager's worst day could open with it empty — which is the precise failure it was added to prevent. FR-014b is the precedent: a fact the deployment depends on gets a producer, not a place to be written down. These are facts known at handover, when the machine is delivered to the site and both parties are standing on it. **Added 2026-08-21, per EVAL iteration 03:** `personas/Julia.MD`'s success signal is that when a default is declared she "already knows where the machine is **and what it takes to get it back**, instead of starting to find out." FR-022 delivered the first half and an earlier revision explicitly withdrew the second from scope, which left her worst day — a machine at a site nobody mentioned, held by people with no reason to help — answered with a location field that may read unknown and nothing else. Recording what a recovery takes is a fact about a deployed machine, known at handover and updatable by inspection; only the arranging is logistics.
- **FR-024**: The system MUST NOT allow Fleet Manager to hold a machine or refuse its release once the client has met the contract.
- **FR-025**: The system MUST make it retrievable, for a Service Due machine, whether its overdue hours exceed 20% of its Service Interval, and MUST allow that condition to serve as the cause of a Safety Stop (BR-10).
- **FR-031d**: The system MUST make retrievable, for every deployed machine, how old its current Assessed Value is, so that a machine whose worth has not been reassessed in a long deployment is distinguishable from one revalued at its last service. **Added 2026-08-21, per EVAL iteration 06:** this spec gives hours a staleness signal (FR-027) and location one (FR-029) for exactly this reason, and the Assessed Value — which BR-13's whole comparison rests on — had none, so a machine could wear through a two-year deployment never revalued while FR-031 answered "not impaired" forever.
- **FR-031c**: The system MUST order the machines Fleet Manager sees as needing a service by whether their Assessed Value has fallen below their operation's outstanding balance, so that a machine whose security is already impaired is serviced ahead of one whose is not (BR-13). **Added 2026-08-21, per EVAL iteration 05:** collateral adequacy was observable and acted on nothing, which left it a report rather than a rule. This is what makes the hours clock a financing instrument here: a rental firm services by utilisation because a downed machine stops earning; Lea$e services by exposure, because a machine below its balance is security that is still shrinking on a debt still owed.
- **FR-031b**: The system MUST require an Assessed Value for a machine at handover, recorded by Lea$e as part of the Handover Record (FR-003), MUST require it to be revalued whenever a service is completed (FR-011) or an Incident is recorded (FR-013), and MUST allow it to be revalued at any inspection (FR-026). `[ASSUMPTION: pinning revaluation to service completion and incidents is ours. Those are the two moments when someone competent already has the machine in front of them, so the obligation costs no visit that was not happening anyway — which is what makes it an obligation rather than an aspiration.]` **Added 2026-08-21, per EVAL iteration 05:** FR-031's comparison previously turned on "the machine's value given its recorded condition and hours", a figure no requirement produced and which this spec's own Out of Scope excluded — the same defect as the earlier "signed" schedule, reintroduced. The Assessed Value is a recorded input, not a calculation: what BR-13 needs is that the comparison be possible, and what stays out of scope is how a valuer reaches the number.
- **FR-032**: The system MUST open an **Unavailability** against a Deployment whenever its machine stops being available to work — a Service Window that passes with the service outstanding (FR-012), a Safety Stop (FR-019), or an Incident recorded as stopping work (FR-013) — MUST close it when the machine is available again, and MUST make retrievable, for each one, how long it ran and which Certification Milestones of the operation's Project (`002` FR-014) had their expected date fall inside it. **Added 2026-08-21, per EVAL iteration 08:** the aggregator's standing D2 finding is that most of this feature's body would survive the financing gap disappearing, and it named FR-012, FR-013 and FR-019 among them. This is what makes those three Lea$e's requirements rather than a rental firm's. This spec's Problem has argued it in prose since iteration 04 and never made it a requirement: *a machine standing idle for want of a service does not cost Lea$e a day's rent — it stops the progress that certifies, and an uncertified milestone is an instalment that does not fall due* (`001` FR-010b, BR-04). A rental firm records downtime to credit rental days against an invoice it would otherwise raise; Lea$e records it because the event its own repayment depends on may not happen. Same fact, opposite consequence, and only one of the two has any reason to know which milestone was standing underneath.
- **FR-033**: The system MUST make an operation's Unavailabilities, open and closed, observable to the Underwriter who recorded that operation's Decision (`002` FR-017, `002` FR-031), so that a project slipping because Lea$e's own machine was standing is distinguishable from one slipping for reasons of the client's own. **Added 2026-08-21, per EVAL iteration 08:** FR-032 without this would be a fact recorded for nobody — the defect iteration 07 charged half a point for at `002` FR-030, where an act reached no one who could use it. The consumer is named, and `002` FR-031 is the requirement that consumes it.
- **FR-031**: The system MUST make retrievable, for every live Deployment, whether the machine's current Assessed Value (FR-031b) has fallen below the amount its operation still owes (BR-13), and MUST make a machine that has fallen below that line distinguishable from one that has not. **Added 2026-08-21, per EVAL iteration 04:** the aggregator's standing D2 finding was that this feature's condition work would survive the financing gap disappearing. This is the requirement that would not: it exists because Lea$e paid the supplier before the client paid anything and holds the machine as security for that outlay (BR-01, BR-13), so wear erodes collateral behind a live balance rather than merely reducing what the asset could next earn. `[ASSUMPTION: the valuation method is deliberately unspecified, as Out of Scope already excludes pricing and residual value; what this requires is that the comparison exist and be visible, not how a figure is reached.]` **Amended 2026-08-21, per EVAL iteration 07:** this comparison is the machine against the balance and stays so deliberately, while `002` FR-029 measures the operation's *cover* — the machine plus any Additional Security. The two differ on purpose: a guarantee posted to a lender does not repair a worn machine, so Fleet Manager orders service by the machine (FR-031c) and Underwriter carries the exposure by the cover.
- **FR-028**: The system MUST make retrievable, for every live Deployment, how far its operation's instalments have progressed — how many are paid and how many remain. **Added 2026-08-21, per EVAL iteration 01:** FR-016 tells Fleet Manager which end a Deployment is heading for, but that answer is "not yet determined" until the last instalment is paid and Company acts, so it arrives too late to plan the next contract around. `personas/Julia.MD` names exactly this: "I plan the next contract around a machine that may never come back, and nothing tells me which ones those are until it is done." Instalment progress is the forward signal — a machine one payment from acquisition is visibly different from one on its third of twenty-four — and it is a fact `001` already holds (its FR-014). `[ASSUMPTION: this gives Fleet Manager a count of her own operation's progress, not a view into the client's finances; `001`'s FR-018 scopes Company's own data to Company, and this is Lea$e reading the state of its own asset's contract.]`
- **FR-026**: The system MUST allow Fleet Manager to record an inspection of a deployed machine, having given the client notice at least one working day beforehand `[ASSUMPTION: one working day is ours — the brief fixes no notice period; long enough for the site to arrange access, short enough that a machine cannot be repositioned for the visit]`, carrying what the inspection found — including an Operating-Hours Reading and the machine's location at that moment. **Added 2026-08-21, per persona-agent review of issue #5:** `personas/Julia.MD` grants her the right to "inspect a machine on site with notice to the client", and this feature relied on inspection twice as the hardware-free way an hours reading arrives while never providing it. It is the one route to information that does not depend on the site volunteering it.
- **FR-029**: The system MUST make retrievable, for every deployed machine, how long it has been since its location was last confirmed — by a handover (FR-003), an inspection (FR-026), or a Site Departure (FR-014) — so that a machine assumed to be at its Contracted Site is distinguishable from one whose location nobody has confirmed recently. **Added 2026-08-21, per EVAL iteration 02:** FR-027 gave hours a staleness signal and location had none, so a machine quietly at its site read identically to one nobody had looked at in four months — while `personas/Julia.MD`'s stated need is to know a machine has moved *at the time it happens*.
- **FR-027**: The system MUST make retrievable, for every deployed machine, how old its most recent Operating-Hours Reading is, so that a machine whose readings have stopped is distinguishable from one that is genuinely idle. `[ASSUMPTION: this does not require readings to arrive on any cadence — Out of Scope keeps the source unspecified — but it does stop a silent absence of readings from being indistinguishable from a machine that is not accruing hours, which is what would otherwise leave a machine silently never due under FR-007.]`

### Key Entities

- **Machine**: one unit owned by Lea$e (BR-01). Has an identity outliving any contract, accumulated operating hours, a Service Interval in hours, a condition history, and a fleet state of available, deployed or retired. While deployed, it carries whether its value has fallen below its operation's outstanding balance (BR-13).
- **Unavailability**: a recorded period during which a deployed machine was not available to work, carrying its cause, its length, and the Certification Milestones whose expected date fell inside it (FR-032).
- **Deployment**: one machine with one client under one operation, from handover to close. Holds the Handover Record, readings, service history, incidents, departures, and exactly one Close.
- **Handover Record**: condition, Operating-Hours Reading, Custodian, Contracted Site, the Custodian's departure-reporting obligation and what a recovery would take, at handover, accepted by both sides, plus the machine's Assessed Value, recorded by Lea$e alone. Immutable; supersedable.
- **Custodian**: the named person on the client's side holding the machine and answering for custody and damage (BR-05).
- **Operating-Hours Reading**: an accumulated-hours figure with the moment it refers to. Monotonic.
- **Service Interval**: the hours between services for a machine. Counted from the hours at the last completed service.
- **Service Window**: an agreed period for completing a due service, recorded against a Deployment, with whether the service was completed inside it.
- **Incident**: a recorded event affecting a deployed machine, with when it was recorded and what was known then.
- **Site Departure**: a recorded fact that the machine is away from its Contracted Site, with when it left and where it went when that is known.
- **Inspection**: a visit Fleet Manager records against a Deployment, with notice to the client, carrying what was found, an Operating-Hours Reading and the machine's location at that moment.
- **Safety Stop**: Fleet Manager's recorded instruction, with cause, that a machine must not be worked.
- **Close**: the single end of a Deployment — Return, carrying condition and hours at return and the difference against the Handover Record; Acquisition Retirement, carrying the machine's retirement from the fleet; or Recovery Close, where the machine came back under a Recovery and its condition is settled as a Return's is.
- **Recovery**: work authorised by a Default Declaration recorded in `002-leasing-request-underwriting`, carrying the machine's last known location, hours, Custodian and Contracted Site, together with what its retrieval requires — transport, access and route (FR-030).

## Phased Scope

### Stage 1 — POC Happy Path

Stage 1 is exactly the happy path User Stories 1 to 4 describe together, and is exactly what the POC referenced by Constitution Principle V builds for this actor:

1. An operation has been approved and its machine is available.
2. Fleet Manager records the handover carrying everything FR-003 requires, and both sides accept those elements FR-003 asks them to accept; Lea$e records the machine's Assessed Value alongside, which the client is not asked to accept (FR-003, FR-031b).
3. The Deployment is open and the Handover Record is fixed.
4. Operating-Hours Readings accumulate against the Deployment.
5. The machine reaches its Service Interval and becomes Service Due, and that state is observable to its Custodian (FR-010b).
6. Fleet Manager sees it among the machines needing a service, with its hours.
7. Fleet Manager records a request for a Service Window against the Deployment (FR-010b), and the client agrees one (FR-010).
8. The service is completed inside the window; the machine is no longer due, its next interval counts from the hours at completion, and the machine's Assessed Value is revalued at that completion (FR-031b).
9. At any point, Fleet Manager can retrieve which end the Deployment is heading for — Return, Acquisition Retirement, Recovery Close, or not yet determined — and the answer becomes definite once Company exercises or declines its Acquisition Option, once that Option lapses, or once a Default Declaration is recorded. **Amended 2026-08-21, per EVAL iteration 01:** this step previously promised the end was knowable *before the term ends*, which SC-007's own amendment had already withdrawn as undeliverable; the withdrawal was applied to the criterion and not to the step it governs.
10. The Deployment closes by **Acquisition Retirement**: Company exercised its Acquisition Option, the machine's condition and hours are settled against the Handover Record, and it leaves the fleet (BR-07).

**Amended 2026-08-21 (EVAL iteration 02):** this step previously offered both ends. Return requires `001`'s Option to be `declined` (its FR-019) or `lapsed` (its FR-026), and neither is in `001`'s Stage 1 — so Stage 1 admitted a branch no Stage 1 in the set could reach. Stage 1 now closes by the one end the shared POC run actually produces, matching where `001`'s own Stage 1 finishes. Return and Recovery Close are exercised by their own scenarios, in later stages.

Nothing in Stage 1 assumes a site departure, an incident, a safety stop, a missed window, a lapsed or declined Acquisition Option, or a default.

**Requirements this feature defines that Stage 1 does *not* exercise**, so Principle V's boundary is applicable to the whole set: FR-013 (incidents), FR-014 and FR-014b's reporting path (departures — Stage 1's machine stays at its Contracted Site), FR-019 and FR-025 (safety stops, including BR-10's overdue-hours ground — Stage 1's service completes inside its window), FR-015 and FR-018b (the Return and Recovery Close ends — Stage 1 closes by Acquisition Retirement), FR-022 and FR-023 with **FR-030's update and Recovery clauses** (recovery and what it requires — FR-030's *handover* clause **is** exercised, at Stage 1 step 2, because FR-003 will not open a Deployment without the recovery record and AC-035b tests exactly that; this list previously named FR-030 whole, so a builder reading it would have shipped a handover that fails FR-003), FR-012 (a Service Window that passes uncompleted — Stage 1's service completes inside its window), FR-026 (inspection — Stage 1's readings arrive without one), FR-027 and FR-029 (reading and location staleness — Stage 1's Deployment is short and continuously observed), FR-028 (instalment progress as a forward planning signal), and FR-031, FR-031c and FR-031d (collateral adequacy, the service ordering that follows from it, and the age of an Assessed Value — Stage 1 runs one machine, so an ordering over one machine is vacuous, and `[ASSUMPTION: a new machine's outstanding balance amortises faster than its value depreciates across a single short deployment, so Stage 1's machine never crosses BR-13's line. This is an empirical hypothesis about machinery and schedules rather than a fact the brief supplies, and it is what keeps impairment out of the happy path.]`). FR-031b and FR-010b **are** exercised, and their steps now say so: the Assessed Value is required at handover (step 2) and revalued when the service completes (step 8); Service Due reaches its Custodian and the window is asked for (steps 5 and 7). **Amended 2026-08-21, per EVAL iteration 07:** this list asserted only FR-031b's handover half while step 8 triggered its revaluation half in silence, and FR-010b appeared in neither the steps nor this list — so a builder working from the stage would have shipped a POC that fails AC-037f and AC-012b. It is iteration 06's FR-031c finding inverted: there a requirement no stage exercised was missing from this list; here requirements the stage does exercise were missing from the stage. FR-032 and FR-033 (Unavailability and its route to the deciding Underwriter) are **not** exercised: Stage 1's service completes inside its agreed window and its machine is never stopped, so no Unavailability opens — which is also why FR-012, FR-019 and FR-013 are excluded above. Each of the rest is specified here and demonstrated later.

### Later stages (not Stage 1)

The following are real boundaries for future scope, not commitments made by this feature:

- Closing a Deployment by Return (FR-015) or by Recovery Close (FR-018b) — the ends reached when Company declines or lets its Option lapse, or when an operation defaults.
- Incidents recorded in flight (FR-013). How a difference at return is then settled between the parties is out of scope entirely, not merely deferred.
- Site Departures (User Story 5).
- Safety Stops.
- Default and Recovery (User Story 6).
- What Lea$e does about a service left overdue below the Safety Stop threshold (BR-10) — recorded and visible, but no consequence beyond visibility is specified for it.
- Continuous or device-sourced hours readings, as opposed to readings recorded at a moment.
- More than one machine on a single operation.
- Fleet-wide planning: which machine goes to which next contract, and utilisation across the fleet.
- Machines idle on site while another contract waits.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For one approved operation and one machine, the entire Stage 1 deployment — from an accepted handover through a completed service to a closed Deployment — can be walked through end to end using only the capabilities this feature defines.
- **SC-002**: Every open Deployment has a Handover Record that both sides accepted, and no accepted Handover Record in the system has been altered after acceptance.
- **SC-003**: For every deployed machine, Fleet Manager can obtain its accumulated operating hours without a request to the client.
- **SC-004**: No machine is Service Due because of elapsed time, and no machine that has reached its Service Interval in hours is anything other than Service Due.
- **SC-005**: Every difference recorded at a Return is a difference against that Deployment's own Handover Record, not against an unrecorded expectation.
- **SC-006**: Every closed Deployment closed by exactly one of Return, Acquisition Retirement, or Recovery Close, and no acquisition was refused, delayed or made conditional. Every live Deployment heading for one of the three was identifiable as such before it closed.
- **SC-007**: For every live Deployment, the end it is heading for is retrievable at any moment as exactly one of heading-for-Return, heading-for-Acquisition-Retirement, heading-for-Recovery-Close, or not-yet-determined — never absent and never wrong. It becomes definite when Company exercises or declines, when a Default Declaration is recorded, or at the latest 30 calendar days after the Acquisition Option becomes available, since an Option not acted on within that window lapses (BR-11). **Amended 2026-08-21 (EVAL iteration 02):** an earlier wording promised the end was knowable before the term ends with nothing to deliver it, and a later one withdrew the promise entirely; BR-11 now bounds the wait, so the guarantee can be stated as a time rather than withdrawn.
- **SC-008**: No Recovery exists without a Default Declaration recorded against its operation, and no capability of this feature let Fleet Manager declare one.

## Assumptions

- `[ASSUMPTION]` Julia represents Fleet Manager; see Users and Their Needs.
- Machines belong to Lea$e for the life of the contract — this restates BR-01, not an invented assumption.
- Custody and damage sit with the client, who also bears the cost of insuring the machine — this restates BR-05, not an invented assumption.
- Maintenance falls due on accumulated operating hours rather than elapsed time — this restates BR-06, not an invented assumption.
- A client who has paid every instalment may acquire the machine — this restates BR-07, not an invented assumption.
- `[ASSUMPTION]` Acceptance of a Handover Record is an explicit act by a named person on each side. The brief describes no handover procedure; this is the minimum that makes a later assessment possible.
- `[ASSUMPTION]` Operating-Hours Readings are recorded against a moment and may originate from an inspection, from the client, or from a device. Stage 1 is deliberately buildable without hardware.
- `[ASSUMPTION]` Accumulated operating hours are monotonic: a lower reading is an error, not a correction. Replacing a machine's hour meter is outside Stage 1.
- `[ASSUMPTION]` A machine working away from its Contracted Site is not by itself a breach; whether the contract permits it is a matter for the contract. What this feature fixes is that Fleet Manager does not know.
- `[ASSUMPTION]` A Service Interval is a property of the machine rather than of the contract, so it does not change when a machine moves between operations.
- `[ASSUMPTION]` Overdue hours beyond 20% of the Service Interval constitute a Safety Stop cause (BR-10). The figure is ours — the brief fixes no overdue tolerance — and is intentionally not a new capability, only a defined trigger for the Safety Stop Fleet Manager already has.
- `[ASSUMPTION]` The separation of duties between deciding and executing — Underwriter declares a default, Fleet Manager recovers the machine — is ours, derived from the `Permissions` sections of both personas. It is specified from both sides: here in FR-021 and FR-023, and in `002-leasing-request-underwriting`'s FR-021.
- `[ASSUMPTION]` In Stage 1 one operation concerns one machine, matching the same assumption in `001-company-machinery-leasing` and `002-leasing-request-underwriting`.

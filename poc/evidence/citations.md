# Correspondencia — Stage 1 ↔ el hilo

<!-- Generado por poc/src/cli/citations.ts. No editar a mano: corré `npm run citations`. -->

Qué paso del hilo construye cada paso de Stage 1, y con el texto que la spec tenía cuando
alguien lo leyó por última vez. Si un paso de una spec cambia, esto cambia con él y el diff
obliga a releer la correspondencia — no afirma que siga valiendo, afirma que hay que mirarla.

## `001` — 16 pasos

1. Company has a Project that requires Machinery.
   → *sin construir* — precondición: el caso arranca con el proyecto ya adjudicado

2. Company records the machinery need.
   → `S01` Pedro — registra la necesidad de maquinaria del proyecto

3. Company submits a Leasing Request for it.
   → `S02` Pedro — envía la solicitud de leasing

4. Company can query the request's status.
   → `S03` Pedro — consulta el estado: pendiente

5. The request is approved (the Financing Decision's own reasoning is out of scope; for Stage 1 it need only be reachable as a business-decided outcome — see Key Product Decisions).
   → `S13` Pedro — consulta el estado: aprobada

6. Lease Company purchases the Machinery from Supplier (result-only: this step exists so step 7 can happen; its internal mechanics are out of scope).
   → `S14` Lea$e — compra la máquina al proveedor

7. The Machinery reaches Company, and Lease Company's fleet manager conducts the handover — the same moment `003-deployed-fleet-custody`'s Stage 1 step 2 describes from its own side. Whether the machine travels from Supplier directly or through Lea$e is result-only here.
   → *sin construir* — el mismo momento que `003`·2, y el hilo lo construye desde el lado de Julia (S15)

8. Company confirms it received the Machinery for that Leasing Operation, which is the same act as accepting the handover record (FR-008).
   → `S17` Pedro — confirma la recepción: las cuotas se hacen exigibles

9. Company sees the conditions the approval carried (FR-022) and settles any that must be met before the schedule begins — in the POC scenario a down payment within BR-12's cap (FR-024).
   → *sin construir* — NO CONSTRUIDO — liquidar las condiciones antes de que arranque el calendario

10. Company can view the Lease's Installments — each one's status, its amount, and the Certification Milestone of its Project whose certification makes it fall due (BR-04).
   → `S18` Pedro — ve sus cuotas y el estado de cada una

11. Each Installment becomes `due` when its Certification Milestone is certified — a step Lease Company performs, staged as step 13 of [`002`](../002-leasing-request-underwriting/spec.md)'s own Stage 1 — and Company has confirmed receipt. **This is the step that makes the POC demonstrate the gap rather than a generic ledger:** payment follows the project's certified progress, not a date.
   → *sin construir* — el hilo afirma la transición a `due` dentro de S24, que cita el paso 12; merecería paso propio

12. Company pays each Installment once it is `due`.
   → `S24` Pedro — paga cada cuota al certificarse su hito

13. Company can tell, at any point, which Installments are paid, which are due, and which are still pending — and for the pending ones, what they are waiting on.
   → `S25` Pedro — distingue pagadas de pendientes en cualquier punto

14. Once every Installment is paid, the Acquisition Option becomes `available`.
   → `S26` Lea$e — abre la opción de adquisición al pagarse todas

15. Company exercises the Acquisition Option, within the 30-day window BR-11 allows.
   → `S28` Pedro — ejerce la opción de adquisición

16. The Leasing Operation reaches the unambiguous terminal state `Acquired`.
   → `S30` Pedro — la operación llega a estado completo

## `002` — 13 pasos

1. A Leasing Request has been submitted (by `001`'s flow).
   → *sin construir* — precondición: la solicitud la envía `001`, y el hilo la construye ahí (S02)

2. Underwriter sees it among the requests waiting on him and takes it up.
   → `S04` Carlos — ve la solicitud entre las que lo esperan y la toma

3. He records the Applicant as a company that works by project (BR-02).
   → `S05` Carlos — registra al solicitante como empresa por proyecto

4. He records the Applicant's Credit Standing, and confirms the machinery value the Applicant stated at submission.
   → `S06` Carlos — registra el standing crediticio

5. He records the Project: what was awarded, by whom, for how much, and its Certification Schedule.
   → `S07` Carlos — registra el proyecto y su calendario de certificación

6. He records the named Payer and what is known of its payment behaviour.
   → `S08` Carlos — registra al pagador y su comportamiento de pago

7. The Assessment is now fully evidenced, and the system says so.
   → `S09` Lea$e — declara el expediente plenamente evidenciado

8. The machinery value recorded for the Assessment is at or below the Authority Limit.
   → `S10` Lea$e — verifica el valor contra el límite de autoridad

9. He records an approval with its reason and its Conditions.
   → `S11` Carlos — registra la aprobación con razón y condiciones

10. The operation's Instalment Schedule is produced, every instalment anchored to a Certification Milestone of the Project (BR-04).
   → `S12` Lea$e — produce el calendario anclado a hitos

11. Any Condition that must be met before the operation proceeds is recorded as met — an amount by Company paying it (`001` FR-024), a guarantee by Underwriter recording it in place (FR-012c).
   → *sin construir* — NO CONSTRUIDO — registrar como cumplida una condición de la aprobación

12. The Decision, its Conditions and its evidence remain retrievable afterward.
   → *sin construir* — el hilo relee el expediente en pasos posteriores, así que la retención se ejerce sin paso propio

13. As the Project progresses, Underwriter records each Certification Milestone as certified and paid (FR-024). Each recording makes the instalment anchored to that milestone fall due on `001`'s side, provided the machine has been received (BR-08). **Added 2026-08-21, per EVAL iteration 01:** without this step no milestone is ever certified, so no instalment ever falls due, and `001`'s Stage 1 — which pays every instalment — could not complete. The POC would then either skip the anchoring entirely or pay instalments that never became payable, in both cases demonstrating the generic ledger Principle III forbids instead of the mechanism the whole system exists for.
   → *sin construir* — la certificación ocurre dentro de S24, que cita `001`·12; merecería paso propio

## `003` — 10 pasos

1. An operation has been approved and its machine is available.
   → *sin construir* — precondición: la aprobación es de `002` y la compra de la máquina es S14

2. Fleet Manager records the handover carrying everything FR-003 requires, and both sides accept those elements FR-003 asks them to accept; Lea$e records the machine's Assessed Value alongside, which the client is not asked to accept (FR-003, FR-031b).
   → `S15` Julia — registra la entrega y ambos lados la aceptan

3. The Deployment is open and the Handover Record is fixed.
   → `S16` Lea$e — abre el despliegue y fija el acta de entrega

4. Operating-Hours Readings accumulate against the Deployment.
   → `S19` Julia — acumula lecturas de horas-motor

5. The machine reaches its Service Interval and becomes Service Due, and that state is observable to its Custodian (FR-010b).
   → `S20` Lea$e — marca servicio debido al alcanzar el intervalo

6. Fleet Manager sees it among the machines needing a service, with its hours.
   → `S21` Julia — la ve entre las que necesitan servicio, con sus horas

7. Fleet Manager records a request for a Service Window against the Deployment (FR-010b), and the client agrees one (FR-010).
   → `S22` Julia — acuerda una ventana de servicio con el cliente

8. The service is completed inside the window; the machine is no longer due, its next interval counts from the hours at completion, and the machine's Assessed Value is revalued at that completion (FR-031b).
   → `S23` Julia — completa el servicio dentro de la ventana

9. At any point, Fleet Manager can retrieve which end the Deployment is heading for — Return, Acquisition Retirement, Recovery Close, or not yet determined — and the answer becomes definite once Company exercises or declines its Acquisition Option, once that Option lapses, or once a Default Declaration is recorded. **Amended 2026-08-21, per EVAL iteration 01:** this step previously promised the end was knowable *before the term ends*, which SC-007's own amendment had already withdrawn as undeliverable; the withdrawal was applied to the criterion and not to the step it governs.
   → `S27` Julia — sabe a qué final se dirige el despliegue

10. The Deployment closes by **Acquisition Retirement**: Company exercised its Acquisition Option, the machine's condition and hours are settled against the Handover Record, and it leaves the fleet (BR-07).
   → `S29` Julia — cierra el despliegue y retira la máquina de la flota

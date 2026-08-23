# Domain Contract — POC

The shared vocabulary the POC compiles against. It exists because `001`, `002` and `003` were
written one per actor and name the same things differently, and one schema cannot hold both
spellings.

**This document states** which name the code uses when the three specs disagree, and why.
**It does not state** what the system does — that is `specs/<n>/spec.md`, the only document with
authority (Constitution, Principle IV). Where this file and a spec disagree, **the spec is right
and this file is a defect.**

Divergences between specs that the code had to resolve in order to compile are also **D4
deductions** waiting to happen — D4 scores "no contradictions … between personas". They are
resolved upstream, in the specs, and this file then records the settled name rather than the
disagreement.

**No entry here is outstanding.** Every divergence the POC found has been carried back into the
specs; what remains below is vocabulary that is settled and the reasoning that settled it.

## Resolved names

| Concepto | `001` (Pedro) | `002` (Carlos) | `003` (Julia) | En código | Por qué |
|---|---|---|---|---|---|
| El cliente | `Company` | `Applicant` | "client" | `Company` | Una entidad. `Applicant` es el **rol** que `Company` juega dentro de un Assessment, no otra cosa. |
| La cuota | `Installment` | `Installment` | `Installment` | `Installment` | **Unificada en las specs el 2026-08-23.** Las tres decían lo mismo con dos ortografías: `001` escribía `Installment` 108 veces y `002` y `003` `Instalment` 32 entre las dos, y el código había quedado del lado minoritario. Manda la mayoría, que además es la spec donde la entidad se define. Se reescribieron `002` y `003` y se renombró el símbolo. |
| El hilo completo | `Leasing Operation` | "operation" | "operation" | `LeasingOperation` | `001` ya lo nombra; es la raíz que las tres specs comparten. |
| El acuerdo financiero | `Lease` | `Installment Schedule` | — | `Lease` | El `Lease` posee el `InstallmentSchedule`; no son sinónimos. |
| La máquina en sitio | — | — | `Deployment` | `Deployment` | Intervalo *dentro* de un `Lease`, de la entrega al cierre. No es el `Lease`. |
| El caso en estudio | `Leasing Request` | `Assessment` | — | ambos | `Assessment` es el expediente de trabajo **sobre** una `LeasingRequest`, 1:1. Dos entidades reales. |
| El equipo | `Machinery (need)` | "machine" | `Machine` | `MachineryNeed` + `Machine` | `001` describe una **necesidad**; `003` una **unidad con identidad que sobrevive contratos**. Distintas. |

## Divergencias que el código tuvo que resolver

### D-1 — `escalated` no existe para Pedro — **RESUELTA 2026-08-21**

`001` ahora enumera exactamente `pending` / `approved` / `rejected` y afirma que ningún estado
queda indeterminado. `002` sigue produciendo `escalated` como desenlace de una `Decision`, pero eso
ya no deja a una solicitud sin estado visible: la escalación es un estado del expediente, no de la
solicitud, y `001` no la ofrece porque para Pedro sigue estando pendiente. El mapeo que el código
eligió —`escalated` → `pending`— es el que las specs ahora describen.

`visibleStatus()` se queda como está. Deja de ser una resolución del POC y pasa a ser una
proyección de lo que `001` dice.

### D-2 — La `Installment` de `001` no tiene ancla — **RESUELTA 2026-08-21**

`001` ahora define la `Installment` como *"anchored to one Certification Milestone of Company's
Project (BR-04)"*, y su paso 13 de Stage 1 exige que de una cuota pendiente se sepa **qué** está
esperando. Era exactamente el hallazgo: el ancla que BR-04 exige y `002` produce no existía del
lado de `001`.

`anchoredTo` deja de ser una decisión del POC. Y con el mismo cambio llegó el tri-estado
`pending` / `due` / `paid`, que el código ahora deriva en `installmentState()`.

### D-3 — La adquisición se cierra en dos specs — **RESUELTA: no era una divergencia**

Pedro ejerce la `Acquisition Option` (`001`, paso 13). Julia cierra el `Deployment` por
`Acquisition Retirement` y la máquina sale de la flota (`003`, paso 10). Ambas citan BR-07.

**No es una contradicción** — son las dos caras del mismo hecho, y cada spec afirma su lado. El
código lo trata como **un** evento con dos efectos, para que no puedan divergir: ejercer la opción
retira la máquina de la flota en la misma transición.

## Reglas de negocio como invariantes

Las que Stage 1 ejerce, cada una verificable en la corrida:

| Regla | Invariante en código |
|---|---|
| BR-01 | Lea$e posee la `Machine` hasta `AcquisitionRetirement`; el `Deployment` nunca transfiere título. |
| BR-02 | Un `Assessment` no queda evidenciado sin la determinación de elegibilidad del `Applicant`. |
| BR-04 | Todo `Installment` tiene `anchoredTo`; un schedule con una cuota sin ancla es inválido. |
| BR-05 | Un `HandoverRecord` no queda fijado sin `Custodian` nombrado y `ContractedSite`. |
| BR-06 | `ServiceDue` se deriva de horas acumuladas contra `ServiceInterval`, nunca de tiempo transcurrido. |
| BR-07 | `AcquisitionOption` pasa a `available` exactamente cuando toda `Installment` está `paid`. |
| BR-08 | Ninguna `Installment` es pagable antes de que `Company` confirme la recepción. |
| BR-11 | Ejercer una `AcquisitionOption` fuera de sus treinta días es un rechazo, no un caso límite. |
| BR-12 | Ninguna condición de aprobación fija un inicial mayor a un décimo del valor confirmado. |

BR-03 no produce invariante: fija bajo qué régimen Lea$e contrata, no un comportamiento del sistema.
BR-09, BR-10 y BR-13 gobiernan etapas posteriores y las specs las excluyen de Stage 1 ellas mismas;
de BR-13 el POC ejerce el dato —el `AssessedValue` de `003` pasos 2 y 8— pero no su invariante.

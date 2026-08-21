# Domain Contract — POC

The shared vocabulary the POC compiles against. It exists because `001`, `002` and `003` were
written one per actor and name the same things differently, and one schema cannot hold both
spellings.

**This document states** which name the code uses when the three specs disagree, and why.
**It does not state** what the system does — that is `specs/<n>/spec.md`, the only document with
authority (Constitution, Principle IV). Where this file and a spec disagree, **the spec is right
and this file is a defect.**

Every entry marked `[PENDIENTE Johar]` is a divergence between specs that the code had to resolve
in order to compile. Each is also a **D4 deduction** waiting to happen — D4 scores "no
contradictions … between personas". Resolving them upstream raises the score and deletes the
corresponding row here.

## Resolved names

| Concepto | `001` (Pedro) | `002` (Carlos) | `003` (Julia) | En código | Por qué |
|---|---|---|---|---|---|
| El cliente | `Company` | `Applicant` | "client" | `Company` | Una entidad. `Applicant` es el **rol** que `Company` juega dentro de un Assessment, no otra cosa. |
| La cuota | `Installment` (83×) | `Instalment` (57×) | `instalment` (8×) | `Instalment` | Dos specs de tres, y es `002` quien **produce** el calendario. `[PENDIENTE Johar]` — unificar la ortografía en las specs; en código es un rename de un símbolo. |
| El hilo completo | `Leasing Operation` | "operation" | "operation" | `LeasingOperation` | `001` ya lo nombra; es la raíz que las tres specs comparten. |
| El acuerdo financiero | `Lease` | `Instalment Schedule` | — | `Lease` | El `Lease` posee el `InstalmentSchedule`; no son sinónimos. |
| La máquina en sitio | — | — | `Deployment` | `Deployment` | Intervalo *dentro* de un `Lease`, de la entrega al cierre. No es el `Lease`. |
| El caso en estudio | `Leasing Request` | `Assessment` | — | ambos | `Assessment` es el expediente de trabajo **sobre** una `LeasingRequest`, 1:1. Dos entidades reales. |
| El equipo | `Machinery (need)` | "machine" | `Machine` | `MachineryNeed` + `Machine` | `001` describe una **necesidad**; `003` una **unidad con identidad que sobrevive contratos**. Distintas. |

## Divergencias que el código tuvo que resolver

### D-1 — `escalated` no existe para Pedro `[PENDIENTE Johar]`

`001` fija que una `Leasing Request` está siempre en exactamente uno de `pending` / `approved` /
`rejected`, y que ningún estado queda indeterminado. `002` permite que una `Decision` sea
`approved` / `refused` / `escalated`.

Un caso escalado deja a Pedro sin estado válido: `escalated` no es ninguno de sus tres.

**Resolución en código:** la `Decision` conserva sus tres valores; lo que Pedro ve es una
proyección.

| `Decision` (002) | `LeasingRequest.status` (001) |
|---|---|
| `approved` | `approved` |
| `refused` | `rejected` |
| `escalated` | `pending` — sigue en decisión |
| *(sin decisión)* | `pending` |

Se sostiene porque, desde donde Pedro está, un caso escalado **sigue esperando resolución**. Fuera
de Stage 1 de todos modos (`002` lo manda a etapas posteriores), pero el tipo tenía que cerrar.

### D-2 — La `Installment` de `001` no tiene ancla `[PENDIENTE Johar]`

BR-04 es *la* regla que cierra la brecha del problema: las cuotas vencen contra el avance
certificado del proyecto, no contra el calendario. `002` la implementa — cada instalment se ancla a
un `Certification Milestone`.

Pero `Installment` en `001` solo tiene `pending` / `paid`. Ni fecha, ni ancla, ni referencia al
hito. La entidad que Pedro ve no lleva rastro de la única regla que hace que Lea$e exista.

**Resolución en código:** `Instalment` lleva `anchoredTo: CertificationMilestoneId`, poblado por
`002`. Es lo que `002` ya afirma producir.

> Esta es la más cara de las dos. `002` cita BR-04 y `001` no puede — D2 mide "fit to the problem"
> sobre las tres juntas, y es la spec de Pedro la que se lee primero.

### D-3 — La adquisición se cierra en dos specs

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
| BR-04 | Todo `Instalment` tiene `anchoredTo`; un schedule con una cuota sin ancla es inválido. |
| BR-05 | Un `HandoverRecord` no queda fijado sin `Custodian` nombrado y `ContractedSite`. |
| BR-06 | `ServiceDue` se deriva de horas acumuladas contra `ServiceInterval`, nunca de tiempo transcurrido. |
| BR-07 | `AcquisitionOption` pasa a `available` exactamente cuando toda `Instalment` está `paid`. |
| BR-08 | Ninguna `Instalment` es pagable antes de que `Company` confirme la recepción. |

BR-03 no produce invariante: fija bajo qué régimen Lea$e contrata, no un comportamiento del sistema.

# SWA — Caso de Estudio #2: Lea$e

Arquitectura de Software — UTEC 2026-II.
Diseño de la arquitectura para una empresa de **leasing de maquinarias en Perú**.

## Contexto

Las empresas corporativas y pymes trabajan por proyectos y necesitan maquinaria, pero el
pago del proyecto llega al final, por lo que no pueden financiar por adelantado todos los
equipos requeridos. Este caso aborda la arquitectura de la empresa de leasing que cubre esa
brecha.

- **Dificultad:** Alta
- **Duración estimada:** 4 h
- **Puntaje:** 20 ptos

## Entregables

| Entregable | Criterio |
|---|---|
| **EVAL** | Resultados positivos o aproximados a **8/10** |
| **POC** | Código implementado y **corriendo** para un Happy Path de algunos usuarios |

## Estructura del SPEC

El spec se redacta en inglés (`/// translate to english first`) siguiendo el template del
enunciado:

Resumen · Problema · Objetivo · Fuera del objetivo · Conceptos clave de producto ·
Usuarios y sus necesidades (`Pedro.MD`, `Carlos.MD`, `Julia.MD`) · Decisiones claves de
producto · Experiencia de usuario esperada · Flujos principales · Alcance por etapas ·
Criterios de aceptación

## Flujo de trabajo

El proyecto usa [Spec Kit](https://github.com/github/spec-kit) para desarrollo dirigido por
especificación. Las skills quedan en `.claude/skills/` y las plantillas en `.specify/`:

| Skill | Para qué |
|---|---|
| `/speckit-constitution` | Fijar los principios del proyecto — ya escrita, v1.0.0 |
| `/speckit-specify` | Redactar la especificación base |
| `/speckit-clarify` | Resolver ambigüedades antes de planificar |
| `/speckit-plan` | Plan de implementación |
| `/speckit-tasks` | Tareas accionables |
| `/speckit-analyze` | Consistencia entre artefactos |
| `/speckit-checklist` | Checklists de calidad de requerimientos |
| `/speckit-implement` | Ejecutar la implementación (POC) |
| `/speckit-converge` | Detectar trabajo pendiente sobre el código |

## Dónde vive cada cosa

Un mismo tema puede aparecer a más de una altitud sin duplicarse, mientras cada altitud afirme algo
distinto. **Cada afirmación ocurre una sola vez, en su altitud.**

| Altitud | Documento | Afirma |
|---|---|---|
| Gobierno | [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | Por qué existe el proyecto y cómo se juzga el trabajo |
| Dominio | [`business-rules.md`](business-rules.md) | Las reglas que obedece el negocio, `BR-nn`, sobreviven a cualquier spec |
| Personas | [`personas/`](personas/) | Quién es cada persona y qué necesita — cinco campos fijos, ver [`_TEMPLATE.MD`](personas/_TEMPLATE.MD) |
| Feature | `specs/<n>/spec.md` | Qué hace el sistema y qué porción de la brecha cierra |
| Plan | `specs/<n>/plan.md`, `tasks.md` | Cómo se construye |

Los criterios de aceptación **enuncian el efecto de la regla y citan su ID** —*"rejects an
instalment payment before receipt is confirmed (BR-08)"*— para que ninguna referencia sea
portante.

## EVAL

El enunciado exige un EVAL con resultado ≈8/10. Spec Kit no puntúa nada (`/speckit-analyze` y
`/speckit-checklist` emiten hallazgos, no un número), así que el EVAL vive aparte en
[`evals/`](evals/README.md) y se corre a mano sobre `specs/<n>-<feature>/spec.md`, que es la única
fuente de verdad sobre qué hace el sistema.

Rúbrica sobre 10 puntos: **D1** satisfacción de las personas (3, la juzgan los agentes de
[Pedro](personas/Pedro.MD), [Carlos](personas/Carlos.MD) y [Julia](personas/Julia.MD), y solo
pueden restar) · **D2** ajuste al problema (3) · **D3** criterios de aceptación demostrables (2) ·
**D4** coherencia y alcance por etapas (2). Gate: ≥ 8.

El POC no entra en el puntaje —son dos entregables distintos—, pero D4 exige que la primera etapa
del alcance sea exactamente el happy path que el POC construye, de modo que spec y código no
puedan divergir.

## Estado

Constitución v1.0.0 escrita, aparato de EVAL definido y catálogo de reglas de negocio con doce
entradas (BR-01 a BR-12). Las tres personas están redactadas: Pedro, Carlos y Julia.

Las tres especificaciones están escritas, una por actor:

| Spec | Actor | Cubre |
|---|---|---|
| `001-company-machinery-leasing` | Empresa (Pedro) | Solicitud, entrega, cuotas y adquisición, desde el lado del cliente |
| `002-leasing-request-underwriting` | Analista de riesgo (Carlos) | La decisión que la 001 declara fuera de alcance: evidencia, límite de autoridad, calendario anclado a hitos (BR-04) y alerta de atraso |
| `003-deployed-fleet-custody` | Responsable de flota (Julia) | El intervalo que la 001 salta: entrega con registro aceptado (BR-05), horas-motor (BR-06), servicio, y cierre por devolución, adquisición (BR-07) o recuperación |

El EVAL se corre contra las tres juntas, no contra una: `evals/README.md` da un punto de D1 por
persona y solo permite deducciones, de modo que evaluar una sola especificación deja el total en el
gate de 8/10 sin margen.

**EVAL corrido: [8.25/10](evals/iterations/2026-08-21-04.md) — pasa el gate.** Cuatro iteraciones, de
4.5 a 8.25, cada una registrada en [`evals/iterations/`](evals/iterations/) y resumida en
[`HISTORY.md`](evals/HISTORY.md).

| Iter | D1 | D2 | D3 | D4 | Total |
|---|---|---|---|---|---|
| [01](evals/iterations/2026-08-21-01.md) | 1.5 | 1.5 | 0.75 | 0.75 | 4.5 |
| [02](evals/iterations/2026-08-21-02.md) | 1.5 | 2.25 | 0.75 | 0.50 | 5.0 |
| [03](evals/iterations/2026-08-21-03.md) | 1.5 | 2.25 | 1.25 | 0.50 | 5.5 |
| [04](evals/iterations/2026-08-21-04.md) | **3.0** | **2.5** | **1.5** | **1.25** | **8.25** |

Lo que movió el puntaje, en orden: darle `BR-04` a `001` —la spec del actor cuyo problema *es* la
brecha no ancla­ba ninguna cuota al avance de su proyecto y habría sobrevivido sin cambios si la
brecha desapareciera—; acotar la brecha en las dos puntas, con `BR-12` al frente y `BR-07` al
final; y un barrido de propagación, que fue el hallazgo de fondo: se enmendaba un requisito y
quedaban la decisión de producto, la entidad, la historia de usuario o el criterio de éxito
afirmando lo viejo.

En la cuarta iteración los tres agentes de persona devolvieron `Works` sin deducciones. Las specs
siguen en Draft y ninguna ha pasado por `/speckit-clarify`.

## Documentos

- [`docs/LAB-02-ARQ-2026.2.md`](docs/LAB-02-ARQ-2026.2.md) — enunciado (markdown)
- `docs/LAB-02-ARQ-2026.2.docx` — enunciado (original)

## Proyecto hermano

El Caso de Estudio #1 (UCI Essalud) vive en la carpeta hermana `../LAB01-UCI-Essalud/`,
repo [SWA-LAB01-UCI-Essalud](https://github.com/LuisMUtec/SWA-LAB01-UCI-Essalud).

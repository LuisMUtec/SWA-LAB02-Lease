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
| POC | [`poc/`](poc/README.md) | El código que corre el happy path, y la evidencia de que corrió |

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

Constitución v1.0.0 escrita, aparato de EVAL definido y catálogo de reglas de negocio con ocho
entradas (BR-01 a BR-08). Las tres personas están redactadas: Pedro, Carlos y Julia.

Las tres especificaciones están escritas, una por actor:

| Spec | Actor | Cubre |
|---|---|---|
| `001-company-machinery-leasing` | Empresa (Pedro) | Solicitud, entrega, cuotas y adquisición, desde el lado del cliente |
| `002-leasing-request-underwriting` | Analista de riesgo (Carlos) | La decisión que la 001 declara fuera de alcance: evidencia, límite de autoridad, calendario anclado a hitos (BR-04) y alerta de atraso |
| `003-deployed-fleet-custody` | Responsable de flota (Julia) | El intervalo que la 001 salta: entrega con registro aceptado (BR-05), horas-motor (BR-06), servicio, y cierre por devolución o adquisición (BR-07) |

El EVAL se corre contra las tres juntas, no contra una: `evals/README.md` da un punto de D1 por
persona y solo permite deducciones, de modo que evaluar una sola especificación deja el total en el
gate de 8/10 sin margen.

Falta correr el EVAL. Las tres specs están en Draft y ninguna ha pasado por `/speckit-clarify`.

El POC corre. Sus `Stage 1` no son tres entregas sino una sola corrida —lo que `001` declara fuera
de alcance es exactamente lo que `002` y `003` producen—, y [`poc/`](poc/README.md) la construye
completa: 30 pasos, cada uno citando la spec y el número de Stage 1 que le manda, con las siete
reglas que Stage 1 ejerce. La transcripción queda versionada en `poc/evidence/run.txt`.

Dos divergencias entre specs quedaron marcadas en [`poc/DOMAIN.md`](poc/DOMAIN.md) porque el código
tuvo que resolverlas para compilar, y son deducciones de D4 esperando: `escalated` deja una
solicitud sin estado válido en `001`, y la `Installment` de `001` no lleva el ancla al hito de
certificación que BR-04 exige y `002` produce.

## Documentos

- [`docs/LAB-02-ARQ-2026.2.md`](docs/LAB-02-ARQ-2026.2.md) — enunciado (markdown)
- `docs/LAB-02-ARQ-2026.2.docx` — enunciado (original)

## Proyecto hermano

El Caso de Estudio #1 (UCI Essalud) vive en la carpeta hermana `../LAB01-UCI-Essalud/`,
repo [SWA-LAB01-UCI-Essalud](https://github.com/LuisMUtec/SWA-LAB01-UCI-Essalud).

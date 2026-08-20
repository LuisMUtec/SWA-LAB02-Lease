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
| `/speckit-constitution` | Fijar los principios del proyecto (aún es plantilla) |
| `/speckit-specify` | Redactar la especificación base |
| `/speckit-clarify` | Resolver ambigüedades antes de planificar |
| `/speckit-plan` | Plan de implementación |
| `/speckit-tasks` | Tareas accionables |
| `/speckit-analyze` | Consistencia entre artefactos |
| `/speckit-checklist` | Checklists de calidad de requerimientos |
| `/speckit-implement` | Ejecutar la implementación (POC) |
| `/speckit-converge` | Detectar trabajo pendiente sobre el código |

## Estado

Andamiaje listo: enunciado cargado y Spec Kit instalado. Falta redactar la constitución
y la especificación.

## Documentos

- [`docs/LAB-02-ARQ-2026.2.md`](docs/LAB-02-ARQ-2026.2.md) — enunciado (markdown)
- `docs/LAB-02-ARQ-2026.2.docx` — enunciado (original)

## Proyecto hermano

El Caso de Estudio #1 (UCI Essalud) vive en la carpeta hermana `../LAB01-UCI-Essalud/`,
repo [SWA-LAB01-UCI-Essalud](https://github.com/LuisMUtec/SWA-LAB01-UCI-Essalud).

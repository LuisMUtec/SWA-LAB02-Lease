# EVAL — Especificación de Lea$e

Aparato de evaluación de la especificación. Corre a mano, fuera del flujo de Spec Kit.

## Qué puntúa y qué no

Puntúa **`specs/<n>-<feature>/spec.md`**: el único documento con autoridad sobre qué hace el
sistema. Todo lo demás (plan, tasks, código) deriva de ahí y no se puntúa aquí.

**El POC no entra en el puntaje.** Son dos entregables distintos: el spec se puntúa, el POC corre
o no corre. Lo que sí exige esta rúbrica es que no puedan divergir — ver D4.

## Rúbrica — 10 puntos

| Dim | Pts | Qué mide | Quién juzga |
|---|---|---|---|
| **D1** Satisfacción de las personas | 3 | El spec resuelve el día de [Pedro](../personas/Pedro.MD), [Carlos](../personas/Carlos.MD) y [Julia](../personas/Julia.MD): su flujo principal se recorre entero. 1 pt por persona, **solo se resta** | Los 3 agentes |
| **D2** Ajuste al problema | 3 | Ataca la brecha real del enunciado —maquinaria necesaria hoy, cobro al final del proyecto— y no un leasing genérico | Agregador |
| **D3** Criterios de aceptación demostrables | 2 | Cada flujo principal tiene criterios que alguien puede declarar cumplidos o incumplidos | Agregador |
| **D4** Coherencia y alcance por etapas | 2 | Sin contradicciones ni duplicados encubiertos; el alcance por etapas es real **y su primera etapa es exactamente el happy path del POC** | Agregador |

**Gate: ≥ 8/10.** Se pueden perder 2 puntos, no más.

Un puntaje bajo el gate no baja la barra: se corrige el spec y se vuelve a correr.

## Regla de asimetría

**Un agente de persona solo puede restar en D1. Nunca sumar.** Su función es detectar la falla, no
certificar el acierto. Si ningún agente objeta, D1 vale 3. Un puntaje alto debe costar.

## Quién juzga qué

| Pregunta | Quién responde | Por qué |
|---|---|---|
| ¿Este spec le sirve a esta persona? | Su agente | Solo quien opera desde esa posición reconoce si le resuelve el día |
| ¿Resuelve la brecha de financiamiento del enunciado? | Agregador | Cada persona ve un ángulo; ninguna ve el problema completo |
| ¿Los criterios de aceptación son demostrables? | Agregador | La forma es ajena a la perspectiva de la persona |
| ¿Hay contradicciones o duplicados? | Agregador | Requiere el documento entero a la vista |
| ¿La primera etapa es construible como POC? | Agregador | Comparativa entre etapas, no dentro de una |

## Protocolo del agente de persona

Se corre **una vez por persona, por separado**. Cada agente lee exactamente dos cosas y nada más:
su archivo en `personas/` y `spec.md`. No lee los veredictos de los otros ni el historial.

Cada agente responde, en este orden:

1. **Mi flujo principal, ¿se recorre entero en el spec?** Cita las secciones que lo cubren. Si se
   corta, di dónde.
2. **¿Qué me frustra del spec?** Lo que el spec decide en tu contra, o deja sin decidir y te toca
   sufrir a ti.
3. **Veredicto:** `Sirve` (resta 0) · `Sirve con reservas` (resta 0,5) · `No sirve` (resta 1).

Un veredicto sin cita al spec no es admisible: se trata como `No sirve`.

## Procedimiento de una iteración

1. Correr los 3 agentes de persona por separado sobre el `spec.md` vigente.
2. Correr el agregador: D2, D3 y D4 sobre el mismo documento.
3. Calcular `D1 = 3 − Σ(descuentos)` y el total sobre 10.
4. Escribir `EVAL/iteraciones/AAAA-MM-DD-NN.md` siguiendo [la plantilla](iteraciones/_PLANTILLA.md).
5. Agregar una fila a [`HISTORIAL.md`](HISTORIAL.md).
6. Si el total < 8: corregir `spec.md` y volver a 1. El spec cambia; la rúbrica no.

## Reglas de redacción que el agregador exige al spec

Son las que D3 y D4 verifican. Deliberadamente pocas.

- **Verificable.** «Rápido», «intuitivo» y «confiable» se sustituyen por su medida. Un enunciado
  que nadie puede declarar cumplido o incumplido no es un criterio de aceptación.
- **Atómico.** Una cosa verdadera o falsa, modificable por separado.
- **Sin mecanismo.** El spec enuncia la garantía, no la tecnología. Una cola, un producto cloud o
  una topología dentro de un criterio es una decisión de arquitectura disfrazada.
- **La ambigüedad se marca, no se rellena.** El enunciado deja abierta buena parte del dominio.
  Lo indefinido lleva uno de dos marcadores, nunca se resuelve en silencio:
  - `[CLARIFY: pregunta concreta]` cuando la respuesta condiciona el contenido.
  - `[ASSUMPTION: enunciado]` cuando el trabajo continúa bajo hipótesis declarada.
- **Nada se nombra por su texto visible.** La etiqueta de un botón cambia sin que cambie el spec.

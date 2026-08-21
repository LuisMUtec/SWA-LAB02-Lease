# POC — Lea$e

Código implementado y corriendo para el happy path, según el segundo entregable del enunciado y el
Principio V de la [constitución](../.specify/memory/constitution.md).

## Correrlo

Requiere Node ≥ 22.18 — el runner es TypeScript ejecutado nativamente, sin build ni dependencias
de runtime.

```sh
cd poc
npm ci
npm run demo
```

| Comando | Qué hace |
|---|---|
| `npm run demo` | Corre el hilo e imprime la transcripción |
| `npm run demo:evidence` | La misma corrida, sin color, versionada en `evidence/run.txt` |
| `npm run demo -- --strict` | Falla si algún paso sigue sin construir — **la puerta de la entrega** |
| `npm run typecheck` | `tsc --noEmit` |

## Qué construye

Las tres specs se escribieron una por actor, pero sus `Phased Scope > Stage 1` **no son tres POCs:
son una sola corrida**. Lo que `001` declara fuera de alcance es exactamente lo que `002` y `003`
producen.

| `001` (Pedro) | dice | `002` / `003` | producen |
|---|---|---|---|
| paso 5 | «la solicitud es aprobada» | `002` pasos 3-9 | el razonamiento que la aprueba |
| paso 9 | «Pedro ve sus cuotas» | `002` paso 10 | el calendario anclado a hitos (BR-04) |
| pasos 6-8 | «la máquina llega y la confirma» | `003` pasos 2-3 | la entrega aceptada por ambos (BR-05) |
| paso 13 | «ejerce la opción» | `003` paso 10 | la máquina saliendo de la flota (BR-07) |

[`src/thread.ts`](src/thread.ts) es esa fusión: 30 pasos, cada uno citando **la spec y el número de
Stage 1 que le manda**, más las reglas `BR-nn` que ejerce.

Eso hace verificable a D4 —*«su primera etapa es exactamente el happy path que el POC
construye»*— corriendo algo, en vez de afirmándolo. Si Stage 1 se mueve en una spec, `thread.ts`
deja de corresponder y se nota en la transcripción.

## Cómo está armado

```
src/
  domain/            núcleo puro — sin IO, sin framework, sin base de datos
    rules.ts           el catálogo BR-nn, tipado
    leasing.ts         solicitud y estado visible          `001`
    underwriting.ts    evidencia, autoridad, calendario     `002`
    operation.ts       cuotas, recepción, adquisición       `001`
    fleet.ts           entrega, horas, servicio, cierre     `003`
  ports/             las interfaces que el dominio necesita del mundo
  adapters/
    memory/          la implementación de hoy
    neon/            la de después, detrás de las mismas interfaces
  evidence/          el arnés que produce la transcripción
  cli/               la entrada
  thread.ts          el hilo de Stage 1
evidence/
  run.txt            la corrida, versionada
```

El dominio no conoce Postgres ni Next.js. Cuando entre Neon, ni el dominio ni el hilo cambian —
solo aparece un adaptador más. Esa es la razón de que la costura exista.

## Solo happy path

Los tres `Stage 1` dicen que nada en ellos supone un rechazo, una demora ni un incumplimiento. El
hilo no afirma caminos negativos: si lo hiciera, dejaría de corresponder a Stage 1, que es la
propiedad por la que existe.

Las guardas que las reglas imponen sí viven en el dominio —`payInstalment` verifica la recepción
(BR-08) y la certificación del hito (BR-04) antes de aceptar un pago— porque ahí no son una prueba
de la regla: son la regla.

## Un paso sin construir se reporta pendiente

No se omite ni se finge. La transcripción dice la verdad sobre cuánto del hilo está construido, y
eso es exactamente lo que la hace evidencia: *«"It compiles" and "it is scaffolded" are not
delivery»* (Principio V).

Hoy corre completo: **30 de 30 pasos, 7 de 7 reglas ejercidas**, y `npm run demo -- --strict` pasa.

## Vocabulario

Las tres specs nombran las mismas cosas distinto —`Installment` / `Instalment`, `Company` /
`Applicant`— y un esquema no puede tener las dos. [`DOMAIN.md`](DOMAIN.md) fija cuál usa el código
y por qué, y lista las divergencias que siguen abiertas contra las specs.

**Donde `DOMAIN.md` y una spec discrepan, manda la spec** — es el único documento con autoridad
sobre qué hace el sistema (Principio IV).

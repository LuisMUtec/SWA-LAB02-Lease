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
| `npm run agent:matrix` | Imprime y verifica la frontera de autoridad — **sin llave de API** |
| `npm run mcp:smoke` | Levanta los tres servidores MCP y comprueba que sirven su superficie — **sin llave** |
| `npm run e2e` | Recorre Stage 1 por CLI y afirma el estado final regla por regla — **sin llave** |
| `npm run generate` | Proyecta los subagentes y los skills de Claude Code desde la definición |
| `npm run lease -- <actor> [herramienta] [--bandera valor]` | Una herramienta suelta; sin argumentos, lista lo que hay |
| `npm run agent` | La corrida vía SDK de Anthropic (requiere `ANTHROPIC_API_KEY`) |

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

## Los tres agentes

Sobre el mismo dominio corren tres agentes, uno por persona. **Las funciones del dominio son sus
herramientas** — no hay una capa nueva entre medio, y por eso las guardas siguen vigentes:
`pagar_cuota` llama a `payInstalment`, que rechaza un pago sin recepción confirmada (BR-08) o sin
hito certificado (BR-04).

> **El agente propone; el dominio dispone.** Un agente que alucine no puede violar una regla de
> negocio: la guarda no está en el prompt, está en el código.

### La frontera de autoridad

En el dominio, la separación de funciones se cumple por ausencia. Con agentes se vuelve el límite
de lo que cada uno puede **ver**:

| Agente | Superficie | No ve |
|---|---|---|
| Pedro | `cliente` — sus propios actos sobre su operación | nada del lado de Lea$e |
| Carlos | `decision` — evidencia, autoridad, aprobación, calendario | `registrar_entrega`, `cerrar_despliegue_por_adquisicion` — *002 FR-021* |
| Julia | `flota` — entrega, horas, servicio, cierre | `registrar_aprobacion`, `pagar_cuota` — *003 FR-021* |

La frontera del dominio, la de los actores y la de las herramientas son **la misma línea, en tres
capas**. `npm run agent:matrix` lo comprueba y CI lo exige — es una comprobación estructural sobre
datos, así que no necesita llave ni red.

### El estado compartido es el dominio, no la conversación

Cada turno arranca con el contexto limpio y descubre dónde están las cosas preguntándoselas al
mundo. Por eso el hilo cruza a los tres agentes sin que ninguno arrastre la historia de los otros —
y por eso el costo no crece con el largo del hilo.

### Tres transportes, una sola definición de herramienta

Las herramientas se declaran una vez en [`src/agents/tools.ts`](src/agents/tools.ts), neutrales al
transporte, y las sirven tres adaptadores de veintitantas líneas cada uno:

| Vía | Cómo corre | Necesita | Para quién |
|---|---|---|---|
| **CLI** — `npm run lease` | Un proceso por invocación | nada | una persona, un script, CI, cualquier agente con terminal |
| **MCP** — `.mcp.json` + `.claude/agents/` | Tres servidores, uno por actor | nada: usa la suscripción del cliente | Claude Code, Codex, cualquier cliente MCP |
| **SDK** — `npm run agent` | El tool runner de Anthropic en proceso | `ANTHROPIC_API_KEY` | la corrida con modelo, sin harness |

**El acotamiento vive en el binario, no en quien lo invoca.** El servidor MCP de Carlos publica
once herramientas y ninguna toca la flota; `lease.ts carlos` despacha esas mismas once y no
reconoce `registrar_entrega`. La garantía no depende de que el harness respete una allowlist — por
eso el frontmatter `tools:` de los subagentes es refuerzo, no el mecanismo.

Ninguno de los dos es una frontera de seguridad: cualquiera con `Bash` puede importar el dominio
directamente. Son una frontera de diseño, y como tal responden citando el requisito que las manda:

```
$ npm run lease -- carlos registrar_entrega
registrar_entrega es una herramienta de Julia, no de Carlos.
  002 FR-021 — decidir prestar y prestar no pueden ser el acto de la misma persona
```

Lo que cada vía compra distinto: MCP le pone al modelo la lista de herramientas tipada en su
contexto, y el cliente valida los argumentos contra el esquema. El CLI le pone una terminal y unas
banderas, así que el acotamiento se apoya en qué binario puede correr — más blando, pero corre en
cualquier parte y sin aprobar nada.

`npm run mcp:smoke` levanta los tres procesos y comprueba que sirven su superficie y comparten el
mundo. `npm run e2e` recorre Stage 1 entero por CLI y comprueba en qué estado quedó.

### El estado compartido cruza procesos

Tres servidores son tres procesos, así que el mundo vive en SQLite —el que Node trae incorporado,
cero dependencias— y entra detrás de los mismos puertos que ya existían: ni el dominio ni el hilo
determinista cambiaron una línea. Cada llamada abre el mundo, actúa y confirma.

Es un almacén de POC, no un modelo de datos: guarda el mundo entero como documento. Cuando haga
falta un esquema real, entra por la misma costura.

### Lo que el CLI destapó

El hilo determinista corre sobre un mundo en memoria, así que nada del estado pasa nunca por una
serialización. El CLI lo hace en cada paso, y eso sacó a la luz dos defectos que ni el hilo ni la
prueba de humo MCP podían ver:

- **Las fechas volvían de SQLite como texto.** `JSON.stringify` invoca `toJSON()` *antes* que el
  replacer, así que el `value instanceof Date` del marcador `$date` no acertaba nunca. Consecuencia
  real: `at < window.from` comparaba `Date` contra string, coaccionaba a NaN y daba falso en ambos
  sentidos — **la ventana de servicio dejaba pasar cualquier fecha**. La guarda existía y estaba
  inoperante por MCP y por CLI; solo funcionaba en memoria.
- **Una fecha inválida se reportaba como éxito.** `new Date(basura)` no falla, y `certificar_hito`
  informaba «certificada» sobre un hito que quedaba en `null`, con la cuota anclada rebotando
  después contra BR-04 sin que nada dijera por qué. Ahora las cinco entradas de fecha se validan.

Un tercero, más chico: las herramientas devolvían `No existe X` como resultado exitoso. Para un
agente da igual —lo lee y reintenta—, pero un script veía código 0 sobre una referencia rota. Los
23 sitios ahora lanzan `NotFound`, que MCP marca `isError` y el CLI convierte en código 1.

Ninguno se veía compilando. Los tres se vieron corriendo.

### El catálogo se proyecta, no se escribe

Un agente que trabaja por CLI gasta la mitad de sus comandos averiguando qué puede hacer. En la
corrida con modelo, certificar seis valorizaciones costó trece comandos: siete de descubrimiento y
seis de trabajo.

Un skill lo resuelve, pero un `SKILL.md` escrito a mano sería el cuarto lugar donde vive la firma de
veintisiete herramientas, y la primera bandera que alguien agregue lo deja mintiendo en silencio.
Así que `npm run generate` los proyecta desde `roster.ts` —la identidad— y `tools.ts` —el catálogo—,
compartiendo el renderizador que imprime `--help`: **lo que el agente lee en el skill es literalmente
lo que el `--help` le diría.** `generate.ts --check` está en CI.

| Artefacto | Para qué camino |
|---|---|
| `.claude/agents/lease-<actor>.md` | El subagente que trabaja por MCP, donde las herramientas ya llegan tipadas |
| `.claude/skills/lease-<actor>/SKILL.md` | Trabajar por CLI, donde el catálogo es lo que evita gastar turnos |

Cada skill lleva además algo que el `--help` no puede dar: **«Lo que no vas a encontrar»**, con los
nombres de las herramientas ajenas y la cita que las prohíbe. Carlos lee de entrada que las ocho de
flota son de Julia por *002 FR-021*, en vez de descubrirlo chocando.

Medido sobre el mismo turno, mismo estado de partida y mismo encargo:

| | Comandos | De descubrimiento |
|---|---|---|
| Sin skill | 13 | 7 |
| Con skill | 6 | 0 |

### La prueba de extremo a extremo

`npm run e2e` hace dos cosas distintas. Primero recorre Stage 1 completo por línea de comandos: un
proceso por paso, ids capturados de la salida del paso anterior, todo contra un SQLite compartido.
Después —y esto es lo que la vuelve una prueba— abre el mundo en **un proceso nuevo**, la primera
lectura que no comparte memoria con ninguna escritura, y afirma el desenlace:

```
  ✓ BR-02  el solicitante quedó registrado como empresa que trabaja por proyecto
  ✓ BR-04  cada cuota está anclada a un hito, y ese hito se certificó
  ✓ BR-08  la recepción se confirmó, que es lo que hizo exigibles las cuotas
  ✓ BR-05  la entrega tiene acta aceptada por ambos lados, con custodio y sitio
  ✓ BR-06  el acumulado es la marca más alta, y el servicio se completó dentro de su ventana
  ✓ BR-07  pagadas todas, la opción se abrió y el cliente la ejerció
  ✓ BR-01  la máquina fue de Lea$e hasta el cierre, y salió de la flota al adquirirse

  14 afirmaciones · 14 sostenidas · 0 rotas
  Reglas cubiertas: 7/7
```

Si una de las siete reglas de Stage 1 queda sin afirmar, falla igual que si una afirmación se
rompe: borrar una comprobación no puede ser una forma de aprobar.

**Sabe fallar.** Cinco mutaciones deliberadas, cuatro cazadas nombrando su regla: reintroducir el
replacer de fechas roto (BR-06), no retirar la máquina al cerrar por adquisición (BR-01), borrar la
afirmación de BR-08 (cobertura 6/7), y una lectura de horas menor —que *no* falla, porque el
dominio la acepta a propósito y la prueba afirma lo que el dominio promete, no más.

La quinta se escapa, y conviene decir por qué: cambiar `Math.max(acumulado, lectura)` por
`lectura` a secas no rompe nada, porque las horas del caso son estrictamente crecientes y el
`Math.max` nunca hace trabajo. Ninguna afirmación sobre el estado final puede distinguirlo. Es un
límite de los datos del caso, no de la prueba.

### El agente no reemplaza la puerta

`npm run demo` sigue siendo el entregable garantizado: determinista, sin llave, sin red, con su
evidencia versionada y su gate en CI. `npm run agent` es la demostración. Si el agente falla el día
de la entrega, el POC igual corre.

Ni la vía CLI ni la MCP necesitan llave. La vía SDK sí (`ANTHROPIC_API_KEY`; una cuenta nueva en Console trae
USD 5, ~10 corridas completas), y sin ella el comando lo dice y sale con código 2 en vez de
reventar. Modelo `claude-opus-5` con pensamiento adaptativo; `--effort low|medium|high|xhigh|max`
regula gasto — por defecto `medium`.

### Usarlo desde Claude Code

Los tres servidores están declarados en [`.mcp.json`](../.mcp.json) y los tres subagentes en
[`.claude/agents/`](../.claude/agents/), ambos versionados. Al abrir el repo, Claude Code pide
aprobar los servidores del proyecto una vez. Después basta con pedirle el trabajo al subagente que
corresponda.

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
    memory/          para el hilo determinista, en proceso
    sqlite/          para todo lo que cruza procesos: CLI y servidores MCP
  agents/            los tres agentes sobre el dominio
    tools.ts           las herramientas, neutrales al transporte, agrupadas por actor
    authority.ts       la frontera de autoridad, verificable
    roster.ts          quién es cada agente y bajo qué reglas trabaja (vía SDK)
    sdk-adapter.ts     adaptador al tool runner de Anthropic
    run.ts             el bucle de un turno
  mcp/               un servidor MCP por actor
    server.ts          el servidor; publica solo la superficie de su actor
    smoke.ts           prueba de humo: levanta los tres y comprueba el acotamiento
  evidence/          el arnés que produce la transcripción
  cli/               las entradas
    demo.ts            el hilo determinista contra el dominio
    lease.ts           una herramienta por invocación, acotada por actor
    agent.ts           la corrida vía SDK, y la matriz de autoridad
  thread.ts          el hilo de Stage 1
    verify.ts          el estado final, afirmado regla por regla
scripts/
  happy-path.sh      Stage 1 entero por CLI, un proceso por paso, y después verify.ts
evidence/
  run.txt            la corrida determinista, versionada
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

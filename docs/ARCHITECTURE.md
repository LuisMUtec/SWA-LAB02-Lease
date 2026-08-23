# Arquitectura — Lea$e

Cuatro vistas. Cada una responde una pregunta que ninguna otra responde.

| Vista | Pregunta |
|---|---|
| [V1 · Contexto de negocio](#v1--contexto-de-negocio) | ¿Quién es quién alrededor de Lea$e, y qué se mueve entre ellos? |
| [V2 · Frontera de autoridad](#v2--frontera-de-autoridad) | ¿Quién puede hacer qué, y por qué no puede hacer lo otro? |
| [V3 · Capas y transportes](#v3--capas-y-transportes) | ¿Cómo está construido, y qué sobrevive a un cambio de infraestructura? |
| [V4 · Stage 1 corriendo](#v4--stage-1-corriendo) | ¿Esto funciona de punta a punta? |

## Qué afirma este documento, y qué no

Afirma **una sola cosa: dónde están las fronteras y por qué están ahí.**

No redefine reglas de negocio —las cita a [`business-rules.md`](../business-rules.md)—, no dice qué
hace el sistema —eso es [`specs/`](../specs/), el único documento con autoridad sobre eso
(Principio IV)— y no explica cómo correr el POC —eso es [`poc/README.md`](../poc/README.md).

Es el **design record** que el Principio I nombra y nunca ubica:

> *No architecture decision, component boundary, diagram, or line of POC code may be produced before
> the requirement it serves exists in the spec chain.* […] *A queue, a cloud product, or a topology
> named inside a requirement is a design decision in disguise: it is moved to the **design record**,
> not deleted.*

De ahí sale la regla de redacción de este archivo: **cada caja y cada flecha cita el `FR-nnn` o el
`BR-nn` que la manda.** Un elemento sin cita es un defecto, no un adorno. Al pie está
[cómo comprobarlo](#cómo-se-verifica-este-documento) sin creerle a nadie.

---

## V1 · Contexto de negocio

El enunciado trae dos diagramas hechos a mano
([1](lab-02-diagram-1-request-purchase.png), [2](lab-02-diagram-2-delivery-payment-acquisition.png))
con tres actores y seis flechas. Las seis están abajo, numeradas. **La séptima no está en el
enunciado, y es el aporte de esta vista.**

```mermaid
flowchart TB
    subgraph obra["La obra — de donde sale el dinero que paga todo"]
        direction LR
        PG["Pagador del proyecto<br/>002 FR-008"]
        PR["Proyecto y sus valorizaciones<br/>002 FR-007"]
        PG ==>|"7bis · certifica y paga"| PR
    end

    E["Empresa cliente — Pedro<br/>BR-02 · trabaja por proyecto<br/>BR-05 · custodia la máquina"]
    P["Proveedor"]
    L["Lea$e<br/>BR-01 · dueña de la máquina<br/>BR-03 · fuera del D.L. 299"]

    PR -.->|"su certificación hace exigible la cuota"| L

    E -->|"1 · solicita maquinaria"| P
    E -->|"2 · solicita financiamiento"| L
    L -->|"3 · compra el equipo"| P
    P -->|"4 · entrega el equipo"| E
    E -->|"5 · confirma recepción"| L
    E -->|"6 · paga cuotas"| L
    E -->|"7 · ejerce la opción"| L
```

| # | Quién a quién | Qué | Lo manda |
|---|---|---|---|
| 1 | Empresa → Proveedor | solicita maquinaria | `001` FR-001 |
| 2 | Empresa → Lea$e | solicita financiamiento | `001` FR-002 |
| 3 | Lea$e → Proveedor | compra el equipo — y se queda dueña | **BR-01** |
| 4 | Proveedor → Empresa | entrega el equipo | `003` FR-001 · **BR-05** |
| 5 | Empresa → Lea$e | confirma recepción | `001` FR-008 · **BR-08** |
| 6 | Empresa → Lea$e | paga cuotas | `001` FR-012 · **BR-04** |
| 7 | Empresa → Lea$e | ejerce la opción al pagarlas todas | `001` FR-017 · **BR-07** |
| **7bis** | **Pagador → Proyecto** | **certifica y paga la valorización** | **BR-04** · `002` FR-007, FR-008 |
| — | Proyecto ⇢ Lea$e | la certificación del hito hace exigible la cuota anclada a él | `002` FR-014 · `001` FR-010b |

Las siete primeras son las del enunciado. **La 7bis no está ahí, y es el aporte de esta vista.**

**La flecha que falta en el enunciado.** El brief dibuja tres actores; la arquitectura necesita un
cuarto. Si las cuotas vencen contra la certificación de la obra (**BR-04**), entonces el repago no
depende del solicitante sino de **quien le paga al solicitante** — el `Payer`. Por eso `002` FR-008
lo hace obligatorio: un pagador sin nombrar bloquea la decisión, aunque su comportamiento de pago se
registre como desconocido. Es la tensión que define a Carlos en
[`personas/Carlos.MD`](../personas/Carlos.MD): *«He is underwriting two companies and only has a
file on one»*.

Sin esa flecha, **BR-04 no tiene de dónde colgarse**, y el sistema vuelve a ser el CRUD de leasing
que el Principio III prohíbe: uno que administra contratos competentemente y nunca toca la razón por
la que el cliente no podía pagar por adelantado.

**BR-03 no es una integración, es una restricción.** Lea$e no es banco, financiera, cooperativa
registrada ni empresa inscrita en el registro SBS de arrendamiento, así que el régimen del D.L. 299
está cerrado. Eso no impide que un arriendo comercial termine en adquisición —es estipulación
civil—, pero fija la forma del contrato. Por eso está catalogada y **no aparece entre las reglas que
el código ejerce**: gobierna bajo qué régimen se contrata, no un comportamiento del sistema.

---

## V2 · Frontera de autoridad

La tesis arquitectónica del proyecto. La separación de funciones no es un comentario ni una
convención de equipo: es un **invariante que CI ejecuta en cada push**.

```mermaid
flowchart TB
    subgraph dec["superficie · decision — Carlos — 14 herramientas"]
        CAX["registrar_aprobacion · producir_calendario_cuotas<br/>certificar_hito · consultar_limite_autoridad<br/>registrar_pagador · revisar_evidencia"]
    end

    subgraph flo["superficie · flota — Julia — 9 herramientas"]
        JUX["registrar_entrega · registrar_lectura_horas<br/>solicitar_ventana_servicio · completar_servicio<br/>cerrar_despliegue_por_adquisicion"]
    end

    subgraph cli["superficie · cliente — Pedro — 11 herramientas"]
        PEX["enviar_solicitud_leasing · confirmar_recepcion_maquina<br/>pagar_inicial · pagar_cuota · ejercer_opcion_adquisicion<br/>consultar_estado_servicio"]
    end

    dec -.->|"✗ 002 FR-021"| flo
    flo -.->|"✗ 003 FR-021"| dec
```

| Cruce | Qué queda prohibido | Lo prohíbe |
|---|---|---|
| Carlos → `flota` | no ve `registrar_entrega` ni `cerrar_despliegue_por_adquisicion` — *decidir prestar y prestar no pueden ser el acto de la misma persona* | `002` FR-021 |
| Julia → `decision` | no ve `registrar_aprobacion` ni `pagar_cuota` — *ella ejecuta sobre la máquina; nunca decide que un cliente dejó de pagar* | `003` FR-021 |

`cliente` no aparece en ningún cruce prohibido, y no es un olvido: **`cliente` no es una superficie de
Lea$e.** La línea que las specs prohíben cruzar corre por dentro de la empresa, entre decidir y
ejecutar.

### La misma línea, en tres capas

| Capa | Cómo se sostiene | Dónde |
|---|---|---|
| **Dominio** | Por **ausencia**: `underwriting.ts` no exporta nada que toque la flota, `fleet.ts` nada que decida una operación | [`poc/src/domain/`](../poc/src/domain/) |
| **Actores** | `SURFACE_OF_ACTOR` — exactamente una superficie por actor, ahí está el punto | [`authority.ts`](../poc/src/agents/authority.ts) |
| **Herramientas** | El acotamiento vive **en el binario**: `mcp/server.ts` publica solo `TOOLS[actor]`, y `lease.ts` no reconoce una herramienta ajena | [`mcp/server.ts`](../poc/src/mcp/server.ts) |

`npm run agent:matrix` imprime la matriz y **falla si la frontera no se sostiene**. Es una
comprobación estructural sobre datos: sin llave de API y sin red. `npm run mcp:smoke` levanta los
tres servidores de verdad y comprueba que cada uno sirve solo su superficie.

### El caso que afina la regla

`consultar_estado_servicio` es de **Pedro**, no de Julia — y parece un error hasta que se lee qué
acto es. `003` FR-010b exige que el estado `Service Due` sea observable **por el custodio**, que está
del lado del cliente.

> **La superficie la fija el acto, no de quién habla la herramienta.** Esto lee el estado de la
> máquina que la empresa ya tiene en custodia, y no mueve nada de la flota: no incorpora, no
> entrega, no acuerda ventanas, no cierra. Los actos siguen siendo de Julia.

La línea que las specs prohíben cruzar es otra —**decidir contra ejecutar**— y ninguno de los dos
cruces prohibidos toca a Pedro, porque `cliente` no es una superficie de Lea$e.

### Lo que esta frontera no es

**No es una frontera de seguridad.** Cualquiera con `Bash` importa el dominio directamente. Es una
frontera de **diseño**, y como tal responde citando el requisito que la manda:

```
$ npm run lease -- carlos registrar_entrega
registrar_entrega es una herramienta de Julia, no de Carlos.
  002 FR-021 — decidir prestar y prestar no pueden ser el acto de la misma persona
```

El frontmatter `tools:` de los subagentes en `.claude/agents/` es **refuerzo, no el mecanismo**: la
garantía no depende de que el harness respete una allowlist.

---

## V3 · Capas y transportes

Hexagonal. **Toda flecha es un `import`, y ninguna sale del dominio.**

```mermaid
flowchart TB
    subgraph ada["Adaptadores del mundo — lo único que sabe de infraestructura"]
        MW["memory/ — en proceso, reloj fijo"]
        SW["sqlite/ — cruza procesos, node:sqlite"]
    end

    subgraph por["Puertos"]
        WO["ports/world.ts — Clock · Ids · Milestones · 6 repos · commit"]
    end

    subgraph ent["Entradas"]
        LE["cli/lease.ts<br/>vía CLI"]
        MS["mcp/server.ts × 3<br/>vía MCP"]
        AG["cli/agent.ts + sdk-adapter.ts<br/>vía SDK"]
        DE["cli/demo.ts + thread.ts<br/>el hilo determinista"]
        VE["cli/verify.ts<br/>el estado final"]
    end

    subgraph reg["Una sola definición de herramienta"]
        TO["agents/tools.ts — 34 ToolDef, neutrales al transporte"]
        AU["agents/authority.ts — la frontera, como dato"]
    end

    subgraph dom["Dominio — puro: sin IO, sin zod, sin SQLite, sin SDK"]
        DOM["rules.ts · BR-01…BR-13<br/>leasing.ts 001 · underwriting.ts 002<br/>operation.ts 001 · fleet.ts 003"]
    end

    MW --> WO
    SW --> WO
    WO --> DOM

    LE --> TO
    MS --> TO
    AG --> TO
    AU -.->|"verifyAuthority antes de despachar"| TO
    TO --> DOM
    DE -.->|"sin pasar por tools.ts"| DOM
    VE -.-> DOM
```

### No son tres vías

[`poc/README.md`](../poc/README.md) habla de **tres transportes sobre una sola definición de
herramienta**, y es cierto — pero el grafo muestra algo que esa frase no dice: hay **cinco entradas,
y dos no pasan por `tools.ts`**.

| Entrada | Pasa por `tools.ts` | Mundo | Necesita llave |
|---|---|---|---|
| `cli/lease.ts` — **vía CLI** | sí | SQLite, uno por proceso | no |
| `mcp/server.ts` ×3 — **vía MCP** | sí | SQLite, **uno fresco por llamada** | no |
| `cli/agent.ts` — **vía SDK** | sí, vía `sdk-adapter.ts` | memoria, en proceso | sí |
| `cli/demo.ts` + `thread.ts` | **no — llama al dominio directo** | memoria, reloj fijo | no |
| `cli/verify.ts` | no — solo lectura | SQLite, **proceso nuevo** | no |

Dibujar «tres vías» a secas sería más limpio y sería falso. La cuarta entrada es justamente **la
puerta del entregable**: determinista, sin red, con su transcripción versionada en
[`poc/evidence/run.txt`](../poc/evidence/run.txt), que CI compara byte a byte.

### El detalle que hace posible todo lo demás

`ToolDef.run` **recibe** el `World` en vez de capturarlo. Por eso un servidor MCP puede abrir uno
fresco por llamada, actuar y confirmar — y por eso la misma definición sirve a un proceso de vida
larga y a uno de una sola invocación, sin ramificarse.

### Por qué `Milestones` está en `World` y no entre los repositorios

Porque **los hitos cruzan agregados y procesos**: `002` los crea al registrar el proyecto, `002` los
certifica cuando la obra avanza, y `001` los consulta para saber si una cuota es exigible
(**BR-04**). Con tres servidores MCP corriendo como tres procesos, tienen que ser estado compartido.

### El estado compartido es el dominio, no la conversación

Cada turno de agente arranca con el contexto limpio y descubre dónde están las cosas
preguntándoselas al mundo. Por eso el hilo cruza a los tres agentes sin que ninguno arrastre la
historia de los otros, y por eso el costo no crece con el largo del hilo.

### Qué cambia cuando esto crece

Nada del dominio y nada del hilo. El almacén de SQLite guarda el mundo entero como un documento en
una fila: es un almacén de POC, no un modelo de datos. **Cuando entre Postgres o Neon, entra como un
adaptador más detrás de `ports/world.ts`** — la misma costura por la que ya entraron dos.

Esa es la razón de que la costura exista, y es lo que separa esto del CRUD de leasing genérico.

---

## V4 · Stage 1 corriendo

Los tres `Stage 1` no son tres entregas: **son una sola corrida**. Lo que `001` declara fuera de
alcance es exactamente lo que `002` y `003` producen.

```mermaid
sequenceDiagram
    autonumber
    actor P as Pedro · empresa
    actor C as Carlos · riesgo
    actor J as Julia · flota
    participant W as El mundo · Lea$e

    P->>W: registra la necesidad, envía la solicitud, la ve pendiente
    Note right of P: 001·2-4 — S01-S03

    C->>W: la toma y arma el expediente — elegibilidad, standing, valor, proyecto, pagador
    Note right of C: 002·2-6 — S04-S09 · BR-02 · el pagador es obligatorio, 002 FR-008

    W-->>C: expediente completo, valor dentro del límite de USD 150 000
    C->>W: aprueba con razón y condiciones
    Note right of C: 002·7-9 — S10-S12 · BR-02 BR-12
    W-->>W: produce el calendario anclado a hitos, no a fechas
    Note right of W: 002·10 — S13 · BR-04 — la regla que cierra la brecha

    P->>W: consulta el estado — aprobada
    W-->>W: Lea$e compra la máquina al proveedor
    Note right of W: 001·5-6 — S14-S15 · BR-01

    J->>W: registra la entrega, ambos lados la aceptan y el acta queda fija
    Note right of J: 003·2-3 — S16-S17 · BR-05 — la línea de base de todo reclamo posterior

    P->>W: confirma la recepción
    Note right of P: 001·8 — S18 · BR-08 — recién aquí las cuotas se hacen exigibles
    P->>W: ve las condiciones y paga el inicial
    C->>W: registra la garantía y las condiciones quedan liquidadas
    Note right of P: 001·9 / 002·11 — S19-S20 · BR-12 — el inicial está topado en un décimo

    J->>W: acumula lecturas de horas-motor
    W-->>P: el custodio ve que su máquina necesita servicio
    Note right of J: 003·4-5 — S22-S24 · BR-06 · 003 FR-010b — se gasta por horas, no por días
    J->>P: pide una ventana de servicio
    P-->>J: acuerda el período en que liberará la máquina
    J->>W: completa el servicio dentro de la ventana y revalúa la máquina
    Note right of J: 003·6-8 — S25-S28 · BR-06

    C->>W: registra la primera valorización como certificada y pagada
    Note right of C: 002·13 — S30 · BR-04
    W-->>P: la cuota anclada a esa valorización se vuelve exigible
    Note right of P: 001·11 — S31 · BR-04 + BR-08 — hacen falta las dos
    P->>W: paga cada cuota al certificarse su hito
    W-->>W: pagadas todas, se abre la opción de adquisición
    Note right of W: 001·12-14 — S32-S34 · BR-07 BR-11

    P->>W: ejerce la opción dentro de la ventana de treinta días
    J->>W: cierra el despliegue y retira la máquina de la flota
    W-->>P: la operación llega al estado terminal Acquired
    Note right of J: 001·15-16 / 003·9-10 — S35-S38 · BR-01 BR-07 BR-11
```

**38 pasos · 38 corridos · 0 pendientes · 0 fallidos · reglas ejercidas 9/9.**

### Las guardas están en el código, no en el prompt

Los dos rechazos que definen el diseño entero:

- `payInstalment` **rechaza** un pago sin recepción confirmada (**BR-08**) o sin hito certificado
  (**BR-04**).
- `exerciseAcquisitionOption` **rechaza** un ejercicio con cuotas pendientes (**BR-07**) o fuera de
  los treinta días (**BR-11**).

> **El agente propone; el dominio dispone.** Un agente que alucine no puede violar una regla de
> negocio.

### Por qué esta vista es la que hace verificable a D4

D4 exige *«que la primera etapa del alcance sea exactamente el happy path que el POC construye»*. La
fuente de esta vista **no es la spec**: es [`poc/evidence/run.txt`](../poc/evidence/run.txt), la
transcripción versionada.

Y la correspondencia tiene guardián propio. `npm run citations -- --check` comprueba tres cosas: que
el paso citado **exista**, que su texto sea el que era la última vez que alguien lo leyó (snapshot
versionado), y que **ningún paso de Stage 1 quede sin cubrir en silencio** — un paso puede no tener
paso de hilo, pero hay que declararlo y decir por qué. Existe porque cuando `001` insertó dos pasos,
seis citas quedaron apuntando al lugar equivocado y el build siguió verde.

### De las trece reglas, nueve

`STAGE_1_RULES` son nueve: BR-01, 02, 04, 05, 06, 07, 08, 11 y 12. Las otras cuatro quedan fuera, y
las specs lo dicen ellas mismas: **BR-03** no produce comportamiento; **BR-09** y **BR-10** gobiernan
el incumplimiento y la parada por seguridad, que ningún Stage 1 asume; y de **BR-13** Stage 1 ejerce
el dato —el `Assessed Value`— pero no su invariante, porque `003` excluye el deterioro expresamente.

---

## Cómo se verifica este documento

Como el resto del repo: **corriendo algo**, no afirmándolo.

```sh
cd poc && npm ci

npm run agent:matrix           # V2 — imprime la frontera y falla si no se sostiene
npm run demo                   # V4 — 38/38 pasos, 9/9 reglas
npm run mcp:smoke              # V3 — los tres servidores sirven su superficie y comparten el mundo
npm run e2e                    # V3+V4 — Stage 1 por CLI, y el estado final afirmado regla por regla
npm run citations -- --check   # V4 — las citas a Stage 1 siguen valiendo
```

Y sobre el texto de este archivo:

| Comprobación | Cómo |
|---|---|
| Ninguna regla citada es inventada | cada `BR-nn` de aquí está en [`business-rules.md`](../business-rules.md) |
| Ningún `FR` citado es inventado | cada `00n FR-mmm` está en `specs/00n-*/spec.md` |
| Ningún nombre de herramienta es inventado | cada nombre en `snake_case` está en [`authority.ts`](../poc/src/agents/authority.ts) |
| Los conteos por superficie | 11 · 14 · 9 = 34, y `npm run agent:matrix` los lista |
| Los dos cruces prohibidos | son exactamente los de `FORBIDDEN_CROSSINGS` |

Si una vista deja de corresponder al código, el comando de esa fila lo dice. Un diagrama que no se
puede desmentir no es un diagrama de arquitectura: es un dibujo.

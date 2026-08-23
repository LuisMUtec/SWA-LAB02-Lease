#!/usr/bin/env bash
#
# El happy path de Stage 1, recorrido por línea de comandos.
#
#   npm run happy-path
#
# Cada paso es un proceso distinto sobre un mundo compartido en SQLite, invocado como lo invocaría
# una persona o un agente con acceso a una terminal. No hay llave de API, no hay red y no hay
# cliente que hable un protocolo: quien clone el repo puede correr esto.
#
# El hilo determinista (`npm run demo`) prueba lo mismo contra el dominio, paso por paso y citando
# spec y Stage 1. Esto prueba algo que aquel no puede: que las tres superficies de herramientas
# alcanzan para llevar el caso de punta a punta, y que el estado cruza procesos.
#
# Los números son los de `CASE` en `src/thread.ts` — 128.000 de máquina, 12.800 de inicial (el tope
# de BR-12). Cuando divergían, dos cosas que decíamos «el mismo caso» corrían con datos distintos.
#
set -euo pipefail
cd "$(dirname "$0")/.."

export LEASE_DB="${LEASE_DB:-$(mktemp -d)/lease.db}"
rm -f "$LEASE_DB"

lease() { node src/cli/lease.ts "$@"; }

# Ejecuta un paso anunciando quién actúa. El identificador que la salida nombre queda en LAST_ID,
# para que el paso siguiente lo use como lo usaría quien está leyendo la terminal.
LAST_ID=""
step() {
  local actor=$1 tool=$2 out; shift 2
  printf '\n%-7s %s\n' "$actor" "$tool"
  out=$(lease "$actor" "$tool" "$@")
  printf '%s\n' "$out" | sed 's/^/    /'
  LAST_ID=$(printf '%s' "$out" | grep -oE '[A-Z]{2}-[0-9]{4}' | head -1 || true)
}

echo "════ Stage 1 por CLI — un proceso por paso, un solo mundo ════"

# ── Pedro necesita la máquina y la pide ──────────────────────────────────────
step pedro registrar_necesidad_maquinaria \
  --proyecto "Carretera Canta-Huayllay tramo II" \
  --descripcion "Excavadora sobre orugas 20 t" \
  --valorUSD 128000; NEED=$LAST_ID
step pedro enviar_solicitud_leasing \
  --empresa "Constructora Andina S.A.C." --necesidadId "$NEED"; REQ=$LAST_ID
step pedro consultar_estado_solicitud --solicitudId "$REQ"

# ── Carlos decide: evidencia, límite de autoridad, calendario anclado ────────
step carlos listar_solicitudes_pendientes
step carlos tomar_solicitud --solicitudId "$REQ"; AS=$LAST_ID
step carlos registrar_elegibilidad --expedienteId "$AS" --trabajaPorProyecto true \
  --nota "Constructora vigente que trabaja por obra adjudicada"
step carlos registrar_standing_crediticio --expedienteId "$AS" --grado "Normal" \
  --nota "Sin atrasos en los ultimos 24 meses"
step carlos registrar_proyecto --expedienteId "$AS" \
  --adjudicado "Carretera Canta-Huayllay tramo II" \
  --adjudicadoPor "Gobierno Regional de Lima" --montoUSD 4200000 \
  --hitos '[{"nombre":"Valorización 1","fechaEsperada":"2026-09-30"},
            {"nombre":"Valorización 2","fechaEsperada":"2026-10-31"},
            {"nombre":"Valorización 3","fechaEsperada":"2026-11-30"},
            {"nombre":"Valorización 4","fechaEsperada":"2026-12-31"},
            {"nombre":"Valorización 5","fechaEsperada":"2027-01-31"},
            {"nombre":"Valorización 6","fechaEsperada":"2027-02-28"}]'
step carlos registrar_pagador --expedienteId "$AS" --nombre "Gobierno Regional de Lima" \
  --comportamiento "Paga valorizaciones a 30 dias de certificadas"
step carlos revisar_evidencia --expedienteId "$AS"
step carlos consultar_limite_autoridad --expedienteId "$AS"
step carlos registrar_aprobacion --expedienteId "$AS" \
  --razon "Proyecto adjudicado con calendario de valorizaciones y pagador publico" \
  --inicialUSD 12800 --garantias "Prenda sobre la maquina y seguro con Lease como beneficiario"
step carlos producir_calendario_cuotas --expedienteId "$AS"; OP=$LAST_ID
step pedro consultar_estado_solicitud --solicitudId "$REQ"

# ── Julia entrega contra un acta que ambos lados aceptan ─────────────────────
step julia incorporar_maquina_flota \
  --descripcion "Excavadora sobre orugas 20 t" --intervaloServicioHoras 500; MQ=$LAST_ID
step julia registrar_entrega --maquinaId "$MQ" --operacionId "$OP" \
  --condicion "Operativa, sin danos, tren de rodaje 85%" --horas 1240 \
  --custodio "Ing. Rosa Quispe, residente de obra" --sitioContratado "Km 42, tramo II" \
  --aceptadoPorCliente "Ing. Rosa Quispe"; DP=$LAST_ID

# ── Recibida la máquina, las cuotas se hacen exigibles ───────────────────────
step pedro confirmar_recepcion_maquina --operacionId "$OP"
step pedro ver_cuotas --operacionId "$OP"

# ── El reloj de la máquina son sus horas, no los días ────────────────────────
step julia registrar_lectura_horas --despliegueId "$DP" --horas 1400 --fecha 2026-09-05
step julia registrar_lectura_horas --despliegueId "$DP" --horas 1620 --fecha 2026-09-15
step julia registrar_lectura_horas --despliegueId "$DP" --horas 1780 --fecha 2026-09-22
step julia listar_despliegues_abiertos
step julia acordar_ventana_servicio --despliegueId "$DP" --desde 2026-09-25 --hasta 2026-09-27
step julia completar_servicio --despliegueId "$DP" --fecha 2026-09-26

# ── Cada cuota vence contra la certificación de su hito (BR-04) ──────────────
cuota() {
  step carlos certificar_hito --nombreHito "Valorización $1" --fecha "$2"
  step pedro pagar_cuota --operacionId "$OP" --cuotaId "IN-0$1"
}
cuota 1 2026-09-30
cuota 2 2026-10-31
cuota 3 2026-11-30
cuota 4 2026-12-31
cuota 5 2027-01-31
cuota 6 2027-02-28

# ── Pagadas todas, la opción se abre y la máquina deja la flota (BR-07) ──────
step pedro consultar_opcion_adquisicion --operacionId "$OP"
step julia consultar_final_despliegue --despliegueId "$DP"
step pedro ejercer_opcion_adquisicion --operacionId "$OP"
step julia cerrar_despliegue_por_adquisicion --despliegueId "$DP"

# ── Y ahora, en un proceso nuevo: ¿en qué estado quedó el mundo? ─────────────
#
# Que ningún comando de arriba devolviera error dice que nada explotó, no que el resultado sea el
# correcto. Esto lo abre de cero y lo afirma regla por regla.
printf '\n════ %s ════\n\n' "Stage 1 recorrido. Comprobando el estado final"
node src/cli/verify.ts --solicitud "$REQ" --operacion "$OP" --despliegue "$DP" --maquina "$MQ" "$@"

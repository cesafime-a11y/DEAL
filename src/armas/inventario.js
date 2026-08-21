/* ── armas/inventario.js ────────────────────────────────────
   Ocho espacios de armas — no siempre traes algo en la mano,
   los espacios vacíos se quedan vacíos hasta que armes algo ahí.
   Cada espacio guarda una SELECCIÓN de piezas (o null). El peso
   es la suma de TODO lo que cargas, no solo lo que tienes
   equipado en ese momento — llenarte de armas de verdad cuesta.
──────────────────────────────────────────────────────────── */
import { CUERPOS, CAÑONES, CARGADORES, MIRAS, BOCAS, EMPUÑADURAS, GATILLOS, MUNICIONES } from './piezas.js';

const NUM_ESPACIOS = 8;
export const PESO_MAXIMO = 12;   // kg

function pesoDeSeleccion(seleccion) {
  return CUERPOS[seleccion.cuerpo].peso
    + CAÑONES[seleccion.cañon].peso
    + CARGADORES[seleccion.cargador].peso
    + MIRAS[seleccion.mira].peso
    + (BOCAS[seleccion.boca]?.peso || 0)
    + (EMPUÑADURAS[seleccion.empuñadura]?.peso || 0)
    + (GATILLOS[seleccion.gatillo]?.peso || 0)
    + (MUNICIONES[seleccion.municion]?.peso || 0);
}

/* seleccionInicial ocupa el espacio 1 — los otros 7 arrancan
   vacíos, así que de entrada ya hay espacios "sin arma".        */
export function crearInventario(seleccionInicial) {
  const espacios = new Array(NUM_ESPACIOS).fill(null);
  espacios[0] = { ...seleccionInicial };
  let activo = 0;

  function seleccionar(indice) {
    if (indice < 0 || indice >= NUM_ESPACIOS) return false;
    activo = indice;
    return true;
  }

  /* Guarda una nueva selección en el espacio ACTIVO — sea cual
     sea el que tengas elegido al momento de confirmar en el
     banco de trabajo, incluso si estaba vacío.                  */
  function actualizarActivo(nuevaSeleccion) {
    espacios[activo] = { ...nuevaSeleccion };
  }

  /* null si el espacio activo está vacío — así es como el resto
     del juego sabe que "no hay arma en la mano".                */
  function armaActiva() {
    return espacios[activo];
  }

  function pesoTotal() {
    return espacios.reduce((total, sel) => total + (sel ? pesoDeSeleccion(sel) : 0), 0);
  }

  /* 1 = sin penalización, baja según qué tan cerca estés del
     máximo — hasta 50% más lento (movimiento Y apuntado) al tope. */
  function factorPeso() {
    const proporcion = Math.min(1, pesoTotal() / PESO_MAXIMO);
    return 1 - proporcion * 0.5;
  }

  /* Para el HUD — un resumen liviano de cada espacio, sin exponer
     las piezas completas (el HUD no necesita tanto detalle).     */
  function espaciosInfo() {
    return espacios.map((sel, i) => ({
      indice: i,
      ocupado: sel !== null,
      activo: i === activo,
      nombreCuerpo: sel ? CUERPOS[sel.cuerpo].nombre : null,
    }));
  }

  return {
    seleccionar, actualizarActivo, armaActiva, pesoTotal, factorPeso, espaciosInfo,
    get activo() { return activo; },
    PESO_MAXIMO,
  };
}

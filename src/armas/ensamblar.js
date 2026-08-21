/* ── armas/ensamblar.js ────────────────────────────────────
   Combina las piezas elegidas en las estadísticas finales de
   un arma lista para usarse. Es lógica pura — mismos datos de
   entrada, siempre el mismo resultado — por eso se puede probar
   sin necesidad de simular un disparo de verdad.

   Solo cuerpo/cañon/cargador/mira son obligatorios — boca,
   empuñadura, gatillo, munición y acabado son opcionales, así
   las combinaciones de antes de que existieran siguen
   funcionando igual (sin ningún efecto de más).
──────────────────────────────────────────────────────────── */

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

const BOCA_NEUTRA = { modRetroceso: 0, modDaño: 0, modAlcance: 0 };
const EMPUÑADURA_NEUTRA = { modRetroceso: 0, modCadencia: 0, modPrecision: 0, modVelocidadApuntado: 1 };
const GATILLO_NEUTRO = { modCadencia: 0 };
const MUNICION_NEUTRA = { modDaño: 0, modAlcance: 0, modRetroceso: 0, colorTrazadora: 0xfff4c2 };
const ACABADO_NEUTRO = { modPrecision: 0, color: 0x2a2a2e };

export function ensamblarArma({ cuerpo, cañon, cargador, mira, boca, empuñadura, gatillo, municion, acabado }) {
  const bocaEf = boca || BOCA_NEUTRA;
  const empuñaduraEf = empuñadura || EMPUÑADURA_NEUTRA;
  const gatilloEf = gatillo || GATILLO_NEUTRO;
  const municionEf = municion || MUNICION_NEUTRA;
  const acabadoEf = acabado || ACABADO_NEUTRO;

  const cadencia = Math.max(0.5, cuerpo.cadencia + cañon.modCadencia + empuñaduraEf.modCadencia + gatilloEf.modCadencia);
  const precision = clamp01(cuerpo.precision + cañon.modPrecision + mira.modPrecision + empuñaduraEf.modPrecision + acabadoEf.modPrecision);
  const retroceso = Math.max(0.15, cuerpo.retroceso + bocaEf.modRetroceso + empuñaduraEf.modRetroceso + municionEf.modRetroceso);
  const daño = Math.max(5, cañon.daño + bocaEf.modDaño + municionEf.modDaño);
  const alcance = Math.max(10, cañon.alcance + bocaEf.modAlcance + municionEf.modAlcance);

  return {
    nombre: `${cuerpo.nombre} · ${cañon.nombre}`,
    cadencia,
    daño,
    alcance,
    precision,
    capacidad: cargador.capacidad,
    tiempoRecarga: cargador.tiempoRecarga,
    retroceso,
    zoomApuntado: mira.zoom,
    // velocidad a la que transiciona a apuntar — multiplicador,
    // 1 = normal. Solo el bípode lo cambia por ahora.
    velocidadApuntado: empuñaduraEf.modVelocidadApuntado,
    // 0 si la mira no ayuda sin apuntar (todas, salvo el láser)
    reduccionDispersionCadera: mira.reduccionDispersionCadera || 0,
    colorTrazadora: municionEf.colorTrazadora,
    // mecánica de perdigones — solo la trae el cuerpo escopeta;
    // en cualquier otro caso quedan undefined, y quien dispare
    // sabe que eso significa "un solo proyectil normal"
    perdigones: cuerpo.perdigones,
    factorDañoPerdigon: cuerpo.factorDañoPerdigon,
    factorDispersion: cuerpo.factorDispersion,
  };
}

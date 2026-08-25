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

  const base = {
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

  // las estadísticas DERIVADAS se calculan sobre las básicas ya
  // combinadas — separado a propósito, para que sea evidente qué
  // viene de las piezas y qué se deduce de eso
  return Object.assign(base, derivarEstadisticas(base));
}

/* ── estadísticas derivadas ──────────────────────────────────
   Las seis estadísticas básicas (daño, cadencia, alcance...) no
   alcanzan para comparar dos armas de verdad: un arma de daño 40
   que dispara una vez por segundo y otra de daño 12 que dispara
   diez veces no se pueden comparar mirando solo el daño. Esto
   calcula los números que sí responden "¿cuál mata más rápido?"
   y "¿cuál me deja moverme mejor?".                             */
export function derivarEstadisticas(est) {
  // un disparo completo — la escopeta suelta varios perdigones a
  // la vez, así que su daño real por disparo es la suma
  const dañoPorDisparo = est.perdigones
    ? est.daño * est.factorDañoPerdigon * est.perdigones
    : est.daño;

  // daño por segundo sostenido, SIN contar recargas
  const dps = dañoPorDisparo * est.cadencia;

  /* DPS sostenido: incluye el tiempo de recarga repartido a lo
     largo del cargador. Es la diferencia entre un tambor de 40 y
     un cargador de 7 con la misma arma — el segundo pasa mucho
     más tiempo recargando y su daño real cae.                   */
  const tiempoVaciar = est.capacidad / est.cadencia;
  const dpsSostenido = (dañoPorDisparo * est.capacidad) / (tiempoVaciar + est.tiempoRecarga);

  // disparos necesarios para abatir un objetivo estándar (100 de
  // vida) y cuánto tiempo toma eso
  const VIDA_OBJETIVO = 100;
  const disparosParaAbatir = Math.max(1, Math.ceil(VIDA_OBJETIVO / Math.max(1, dañoPorDisparo)));
  const tiempoParaAbatir = (disparosParaAbatir - 1) / est.cadencia;

  /* Movilidad: qué tan ágil se siente el arma, de 0 a 1. Junta el
     retroceso (armas fuertes son más pesadas de manejar) con la
     velocidad de apuntado. No es una estadística "real" del arma
     sino una lectura de manejo, útil para comparar de un vistazo. */
  const movilidad = Math.max(0, Math.min(1,
    (1 - Math.min(1, est.retroceso / 1.3)) * 0.6
    + Math.min(1, est.velocidadApuntado) * 0.4
  ));

  /* Control: qué tan fácil es mantener el tiro donde apuntas.
     Combina precisión con retroceso — un arma muy precisa pero con
     retroceso brutal no es controlable en la práctica.            */
  const control = Math.max(0, Math.min(1,
    est.precision * 0.55 + (1 - Math.min(1, est.retroceso / 1.3)) * 0.45
  ));

  /* Alcance efectivo: hasta dónde el arma de verdad sirve, no su
     alcance máximo teórico. Una escopeta con alcance 30 pero
     dispersión enorme no es útil a 30m — este número lo refleja. */
  const penalizacionDispersion = est.factorDispersion ? 1 / est.factorDispersion : 1;
  const alcanceEfectivo = Math.round(est.alcance * (0.55 + est.precision * 0.45) * penalizacionDispersion);

  return {
    dañoPorDisparo: Math.round(dañoPorDisparo * 10) / 10,
    dps: Math.round(dps * 10) / 10,
    dpsSostenido: Math.round(dpsSostenido * 10) / 10,
    disparosParaAbatir,
    tiempoParaAbatir: Math.round(tiempoParaAbatir * 100) / 100,
    movilidad: Math.round(movilidad * 100) / 100,
    control: Math.round(control * 100) / 100,
    alcanceEfectivo,
    clasificacion: clasificarArma(est, dps, movilidad),
  };
}

/* Le pone un nombre al perfil del arma que armaste — "Cañonera de
   corto alcance", "Tirador de precisión"... Sirve para que el
   jugador entienda de un vistazo QUÉ construyó, sin tener que
   interpretar seis números.                                     */
export function clasificarArma(est, dps, movilidad) {
  if (est.perdigones) {
    return movilidad > 0.5 ? 'Asalto cercano' : 'Cañonera pesada';
  }
  if (est.zoomApuntado >= 1.7 && est.daño >= 24) return 'Tirador de precisión';
  if (est.cadencia >= 10) return movilidad > 0.55 ? 'Fuego rápido' : 'Supresión';
  if (est.cadencia <= 2.5 && est.daño >= 26) return 'Golpe único';
  if (est.alcance >= 50 && est.precision >= 0.85) return 'Alcance extendido';
  if (movilidad >= 0.7) return 'Ligera y ágil';
  if (est.capacidad >= 30) return 'Fuego sostenido';
  return 'Equilibrada';
}

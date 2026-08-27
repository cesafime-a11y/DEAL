/* ── armas/piezas.js ───────────────────────────────────────
   El catálogo de piezas intercambiables. Cada arma se arma
   combinando una de cada categoría — esto es lo que después va
   a alimentar tanto la mesa de trabajo del taller como el
   sandbox. Son solo datos, nada de 3D ni de lógica de disparo
   aquí — eso lo combina ensamblar.js.

   Tres piezas traen una mecánica propia además de sus números:
   - CUERPOS.escopeta: dispara varios perdigones a la vez (ver
     `perdigones`/`factorDañoPerdigon`/`factorDispersion`)
   - MIRAS.laser: reduce la dispersión SIN apuntar (ver
     `reduccionDispersionCadera` en ensamblar.js/arma.js)
   - EMPUÑADURAS.bipode: hace más lenta la transición al apuntar
     (ver `modVelocidadApuntado`)
──────────────────────────────────────────────────────────── */

export const CUERPOS = {
  pistola: {
    nombre: 'Cuerpo de pistola',
    calibre: '9mm',
    escalaCasquillo: 0.85,
    peso: 0.7,          // kg
    cadencia: 4,          // disparos por segundo
    precision: 0.85,      // 0 a 1 — más alto es más certero
    retroceso: 0.55,      // multiplicador del golpe visual al disparar
  },
  subfusil: {
    nombre: 'Cuerpo de subfusil',
    calibre: '9mm',
    escalaCasquillo: 0.85,
    peso: 2.3,
    cadencia: 9,
    precision: 0.65,
    retroceso: 0.8,
  },
  rifle: {
    nombre: 'Cuerpo de rifle',
    calibre: '5.56mm',
    escalaCasquillo: 1.15,
    peso: 3.2,
    cadencia: 5.5,
    precision: 0.78,
    retroceso: 0.9,
  },
  escopeta: {
    nombre: 'Cuerpo de escopeta',
    calibre: 'Calibre 12',
    escalaCasquillo: 2.0,
    peso: 3.0,
    cadencia: 1.1,         // tipo bombeo — la más lenta del juego
    precision: 0.6,
    retroceso: 1.1,        // el más alto del juego
    // mecánica propia: cada disparo son varios perdigones, no una
    // sola bala — cada uno hace solo una fracción del daño del
    // cañón, y se dispersan mucho más que un disparo normal
    perdigones: 8,
    factorDañoPerdigon: 0.35,
    factorDispersion: 3.2,
  },
  revolver: {
    nombre: 'Cuerpo de revólver',
    calibre: '.357 Magnum',
    escalaCasquillo: 1.0,
    peso: 0.9,
    cadencia: 2.2,
    precision: 0.93,       // el más alto del juego — no necesita mira
    retroceso: 0.7,
  },
  automatica: {
    nombre: 'Cuerpo de pistola automática',
    calibre: '9mm',
    escalaCasquillo: 0.85,
    peso: 0.65,
    cadencia: 13,          // la cadencia más alta del juego
    precision: 0.55,       // la más baja — corta distancia, de emergencia
    retroceso: 0.75,
  },
  lmg: {
    nombre: 'Cuerpo de ametralladora ligera',
    calibre: '7.62mm',
    escalaCasquillo: 1.5,
    peso: 5.5,          // la más pesada del juego
    cadencia: 7.5,         // sostenida, para suprimir, no para precisión
    precision: 0.58,
    retroceso: 0.8,
  },
  francotirador: {
    nombre: 'Cuerpo de francotirador',
    calibre: '.308 Winchester',
    escalaCasquillo: 1.35,
    peso: 4.2,
    cadencia: 0.9,         // cerrojo — la más lenta del juego
    precision: 0.55,       // base modesta a propósito: sin cañón largo
                            // ni mira telescópica ni apuntar, no rinde —
                            // premia armarlo bien y apuntar siempre
    retroceso: 0.65,
  },
  // PDW: compacta, entre la pistola automática y el subfusil —
  // el ritmo de fuego más alto de las armas "largas" (no cuenta
  // como pistola), con menos retroceso que el subfusil porque su
  // calibre real (5.7x28mm) es más chico y rápido, no más potente
  pdw: {
    nombre: 'Cuerpo de PDW',
    calibre: '5.7x28mm',
    escalaCasquillo: 0.7,
    peso: 1.6,
    cadencia: 11,
    precision: 0.62,
    retroceso: 0.6,
  },
};

export const CAÑONES = {
  corto: {
    nombre: 'Cañón corto',
    peso: 0.15,
    daño: 16,
    alcance: 22,
    modPrecision: -0.08,
    modCadencia: 0.5,     // los cortos permiten disparar un poco más rápido
  },
  estandar: {
    nombre: 'Cañón estándar',
    peso: 0.35,
    daño: 22,
    alcance: 38,
    modPrecision: 0,
    modCadencia: 0,
  },
  largo: {
    nombre: 'Cañón largo',
    peso: 0.55,
    daño: 28,
    alcance: 55,
    modPrecision: 0.1,
    modCadencia: -0.8,
  },
  pesado: {
    nombre: 'Cañón pesado',
    peso: 0.85,         // el más pesado
    daño: 34,              // el daño más alto del juego
    alcance: 48,
    modPrecision: 0.05,
    modCadencia: -1.3,     // el que más castiga la cadencia
  },
  // más extremo que el corto: el más ligero y rápido del juego,
  // pero también el de menor daño y alcance — la opción para
  // quien construye alrededor de la cadencia, no del alcance
  ultraligero: {
    nombre: 'Cañón ultraligero',
    peso: 0.08,
    daño: 12,
    alcance: 16,
    modPrecision: -0.14,
    modCadencia: 0.8,
  },
};

export const CARGADORES = {
  pequeño: { nombre: 'Cargador pequeño', peso: 0.1, capacidad: 7, tiempoRecarga: 1.0 },
  medio: { nombre: 'Cargador medio', peso: 0.2, capacidad: 14, tiempoRecarga: 1.4 },
  grande: { nombre: 'Cargador grande', peso: 0.35, capacidad: 24, tiempoRecarga: 2.0 },
  tambor: { nombre: 'Cargador de tambor', peso: 0.9, capacidad: 40, tiempoRecarga: 3.2 },
};

export const MIRAS = {
  ninguna: { nombre: 'Sin mira', peso: 0, modPrecision: 0, zoom: 1 },
  hierro: { nombre: 'Mira de hierro', peso: 0.05, modPrecision: 0.03, zoom: 1 },
  reflex: { nombre: 'Mira reflex', peso: 0.15, modPrecision: 0.07, zoom: 1.15 },
  holografica: { nombre: 'Mira holográfica', peso: 0.2, modPrecision: 0.09, zoom: 1.15 },
  telescopica: { nombre: 'Mira telescópica', peso: 0.4, modPrecision: 0.14, zoom: 1.8 },
  // punto medio real entre un punto rojo y un visor completo:
  // zoom fijo moderado, más precisión que el reflex, más ligera
  // que la telescópica — para quien no quiere el compromiso de
  // ninguna de las dos
  prismatica: { nombre: 'Mira prismática', peso: 0.28, modPrecision: 0.11, zoom: 1.4 },
  // mecánica propia: apuntando casi no aporta (por eso zoom=1 y
  // modPrecision chico) — su función real es ayudar SIN apuntar,
  // algo que ninguna otra mira hace
  laser: {
    nombre: 'Mira láser',
    peso: 0.1,
    modPrecision: 0.02,
    zoom: 1,
    reduccionDispersionCadera: 0.55,
  },
};

export const BOCAS = {
  ninguna: { nombre: 'Sin boca de cañón', peso: 0, modRetroceso: 0, modDaño: 0, modAlcance: 0 },
  // la opción "barata": casi no ayuda, pero tampoco cuesta nada
  rompellamas: { nombre: 'Rompellamas', peso: 0.08, modRetroceso: -0.06, modDaño: 0, modAlcance: 0 },
  // reduce bastante el retroceso, sin costo — la opción "gratis"
  // cuando el retroceso es lo único que te preocupa
  compensador: { nombre: 'Compensador', peso: 0.12, modRetroceso: -0.22, modDaño: 0, modAlcance: 0 },
  // reduce el retroceso menos que el compensador, pero SÍ cuesta
  // daño y alcance — el intercambio real, no hay opción dominante
  silenciador: { nombre: 'Silenciador', peso: 0.35, modRetroceso: -0.12, modDaño: -3, modAlcance: -5 },
  // ranurado a los lados en vez de por delante: control de retroceso
  // decente, casi sin costo de alcance — pero SÍ es ruidoso (no
  // tiene ningún beneficio de sigilo, a diferencia del silenciador)
  frenoRanurado: { nombre: 'Freno ranurado', peso: 0.15, modRetroceso: -0.16, modDaño: 0, modAlcance: -1 },
  // el mejor control de retroceso de las 4 — pero es la más
  // pesada, así que sí cuesta algo (afecta el peso total del
  // inventario, no una estadística directa del arma)
  compensadorPesado: { nombre: 'Compensador pesado', peso: 0.26, modRetroceso: -0.3, modDaño: 0, modAlcance: 0 },
  // el supresor más pesado y con más baffles que el silenciador —
  // controla el retroceso casi tan bien como el compensador pesado,
  // pero cuesta más alcance que cualquier otra boca del juego
  supresorIntegral: { nombre: 'Supresor integral', peso: 0.5, modRetroceso: -0.28, modDaño: -2, modAlcance: -9 },
};

export const EMPUÑADURAS = {
  ninguna: { nombre: 'Sin empuñadura inferior', peso: 0, modRetroceso: 0, modCadencia: 0, modPrecision: 0, modVelocidadApuntado: 1 },
  // favorece un estilo agresivo: más cadencia, pero controla el
  // retroceso mucho menos que la vertical
  angulada: { nombre: 'Empuñadura angulada', peso: 0.1, modRetroceso: -0.03, modCadencia: 0.4, modPrecision: 0, modVelocidadApuntado: 1 },
  vertical: { nombre: 'Empuñadura vertical', peso: 0.12, modRetroceso: -0.1, modCadencia: 0, modPrecision: 0, modVelocidadApuntado: 1 },
  // tope de mano: casi no controla retroceso, pero es la más
  // ligera de las tres y no cuesta nada de velocidad de apuntado
  topeMano: { nombre: 'Tope de mano', peso: 0.04, modRetroceso: -0.02, modCadencia: 0, modPrecision: 0.01, modVelocidadApuntado: 1 },
  // el mejor control de retroceso y algo de precisión, pero el
  // peso tiene costo real: apuntar se vuelve notablemente más lento
  bipode: { nombre: 'Bípode', peso: 0.45, modRetroceso: -0.16, modCadencia: 0, modPrecision: 0.04, modVelocidadApuntado: 0.65 },
  // el extremo opuesto al bípode: prácticamente no controla
  // retroceso, pero es la más ligera de todas y la única que hace
  // el apuntado MÁS rápido que sin empuñadura — para builds que
  // priorizan la movilidad por encima de todo
  cortaCombate: { nombre: 'Empuñadura corta de combate', peso: 0.03, modRetroceso: -0.01, modCadencia: 0.2, modPrecision: 0, modVelocidadApuntado: 1.08 },
};

export const GATILLOS = {
  ninguno: { nombre: 'Gatillo de fábrica', peso: 0, modCadencia: 0 },
  deportivo: { nombre: 'Gatillo deportivo', peso: 0.02, modCadencia: 0.3 },
  competicion: { nombre: 'Gatillo de competición', peso: 0.03, modCadencia: 0.6 },
};

export const MUNICIONES = {
  estandar: { nombre: 'Munición estándar', peso: 0.15, modDaño: 0, modAlcance: 0, modRetroceso: 0, colorTrazadora: 0xfff4c2 },
  expansiva: { nombre: 'Munición expansiva', peso: 0.16, modDaño: 5, modAlcance: -6, modRetroceso: 0, colorTrazadora: 0xfff4c2 },
  subsonica: { nombre: 'Munición subsónica', peso: 0.14, modDaño: -4, modAlcance: -3, modRetroceso: -0.15, colorTrazadora: 0xfff4c2 },
  // casi sin efecto en estadísticas — la razón de elegirla es puramente
  // visual, ver de verdad por dónde fue cada disparo
  trazadora: { nombre: 'Munición trazadora', peso: 0.15, modDaño: 0, modAlcance: 0, modRetroceso: 0, colorTrazadora: 0xff3b3b },
};

export const ACABADOS = {
  // solo colorean el material — cero efecto en estadísticas, salvo
  // el artesanal, que sí cuesta precisión: se ve como si lo hubieras
  // hecho tú mismo con prisa, y se comporta así
  fabrica: { nombre: 'De fábrica', peso: 0, modPrecision: 0, color: 0x2a2a2e },
  tactico: { nombre: 'Táctico', peso: 0, modPrecision: 0, color: 0x3a3f34 },
  camuflaje: { nombre: 'Camuflaje', peso: 0, modPrecision: 0, color: 0x5a5240 },
  pulido: { nombre: 'Pulido', peso: 0, modPrecision: 0, color: 0x8a8f96 },
  artesanal: { nombre: 'Artesanal', peso: 0, modPrecision: -0.03, color: 0x6b3a28 },
  envejecido: { nombre: 'Envejecido', peso: 0, modPrecision: 0, color: 0x4a4642 },
  digital: { nombre: 'Camuflaje digital', peso: 0, modPrecision: 0, color: 0x4d5245 },
  cromado: { nombre: 'Cromado espejo', peso: 0, modPrecision: 0, color: 0xc8ccd0 },
};

/* No toda pieza cabe en toda arma — armas de mano (pistola,
   revólver, automática) no tienen riel para empuñadura inferior
   ni espacio para una mira telescópica o un cañón pesado; un
   revólver ni siquiera usa cargador de caja. Si una categoría o
   clave no aparece aquí, esa pieza es compatible con TODOS los
   cuerpos (así "ninguna"/"ninguno" nunca necesita listarse).    */
const CUERPOS_LARGOS = ['subfusil', 'rifle', 'escopeta', 'lmg', 'francotirador', 'pdw'];

export const COMPATIBILIDAD = {
  mira: {
    telescopica: CUERPOS_LARGOS,
    prismatica: CUERPOS_LARGOS,
  },
  empuñadura: {
    vertical: CUERPOS_LARGOS,
    angulada: CUERPOS_LARGOS,
    bipode: CUERPOS_LARGOS,
  },
  cargador: {
    // el revólver no usa cargador de caja — nunca cabría un tambor
    // un francotirador de cerrojo no combina con un cargador de
    // disparo sostenido, y una pistola es demasiado chica para
    // sostener algo tan grande
    tambor: ['subfusil', 'rifle', 'escopeta', 'automatica', 'lmg'],
  },
  cañon: {
    pesado: CUERPOS_LARGOS,
  },
  boca: {
    // demasiado pesado para un arma de mano compacta
    compensadorPesado: CUERPOS_LARGOS,
  },
};

export function esPiezaCompatible(categoria, clave, cuerpoClave) {
  const restriccion = COMPATIBILIDAD[categoria]?.[clave];
  return !restriccion || restriccion.includes(cuerpoClave);
}

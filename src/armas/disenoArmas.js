/* ── armas/disenoArmas.js ───────────────────────────────────
   El lenguaje visual de todo lo que se monta en un arma, en un
   solo lugar. Antes esto vivía disperso dentro de modeloArma.js:
   cada material y cada medida estaba escrita a mano en la función
   que la usaba, así que cambiar "cómo se ve el metal" o "qué tan
   gruesa es una pieza de riel" significaba buscar y editar en
   veinte lugares distintos, con el riesgo de dejar la mitad
   desincronizada.

   Aquí viven tres cosas:
     · PALETA y MATERIALES — el acabado de cada tipo de superficie
     · MEDIDAS — las proporciones compartidas entre piezas
     · generadores de detalle — remaches, estrías, rieles, etc.

   modeloArma.js sigue siendo quien arma cada pieza; este módulo
   solo le da los ladrillos con los que construirlas, de forma
   consistente.
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';

/* ── paleta ──────────────────────────────────────────────────
   Los colores base del armamento. Se nombran por FUNCIÓN, no por
   color literal: así cambiar la identidad visual del juego es
   tocar estos valores, no rastrear hexadecimales por el código. */
export const PALETA = {
  metalBase: 0x2f2f33,        // acero mate — el cuerpo de casi todo
  metalClaro: 0x6d7076,       // piezas mecanizadas, tornillería
  metalOscuro: 0x1b1b1e,      // huecos, ranuras, sombras internas
  polimero: 0x24262a,         // empuñaduras, guardamanos
  polimeroCalido: 0x3a3128,   // culatas y cachas de tono cálido
  latonMunicion: 0xc9a227,    // casquillos y munición
  lenteAmbar: 0x8a6428,
  lenteAzul: 0x6ba8e8,
  puntoRojo: 0xff2a18,
  reticula: 0x101418,
};

/* ── materiales compartidos ──────────────────────────────────
   Son SINGLETONS: una sola instancia reutilizada por todas las
   armas del juego. Eso es lo que mantiene el rendimiento bien con
   miles de combinaciones posibles — pero significa que NUNCA hay
   que mutarlos directamente. El sistema de acabados los clona por
   modelo antes de recolorear (ver aplicarAcabado en modeloArma). */
export const MATERIALES = {
  metal: new THREE.MeshStandardMaterial({
    color: PALETA.metalBase, roughness: 0.5, metalness: 0.8,
  }),
  metalClaro: new THREE.MeshStandardMaterial({
    color: PALETA.metalClaro, roughness: 0.35, metalness: 0.9,
  }),
  metalOscuro: new THREE.MeshStandardMaterial({
    color: PALETA.metalOscuro, roughness: 0.7, metalness: 0.5,
  }),
  polimero: new THREE.MeshStandardMaterial({
    color: PALETA.polimero, roughness: 0.9, metalness: 0.1,
  }),
  polimeroCalido: new THREE.MeshStandardMaterial({
    color: PALETA.polimeroCalido, roughness: 0.85, metalness: 0.05,
  }),
  /* Tubos de mira: SIN tapas y con ambas caras visibles. Un
     cilindro cerrado normal tiene tapas circulares que, apuntando
     hacia adelante, bloquean justo por donde miras — y uno hueco
     con una sola cara se ve transparente desde fuera. Esta
     combinación resuelve las dos cosas a la vez.                */
  tuboMira: new THREE.MeshStandardMaterial({
    color: PALETA.metalBase, roughness: 0.5, metalness: 0.8,
    side: THREE.DoubleSide,
  }),
  reticula: new THREE.MeshBasicMaterial({ color: PALETA.reticula }),
  puntoRojo: new THREE.MeshBasicMaterial({ color: PALETA.puntoRojo }),
};

/* Cristal de mira: muy tenue a propósito. Con opacidad alta la
   mira se ve bien desde fuera pero deja de dejar ver a través,
   que es exactamente para lo que sirve. El marco sólido de cada
   mira es lo que le da presencia visual; el cristal solo tiñe.  */
export function crearCristalMira(color, opacidad = 0.14) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: opacidad, depthWrite: false,
  });
}

/* ── medidas compartidas ─────────────────────────────────────
   Proporciones que varias piezas necesitan coordinar entre sí.
   Tenerlas aquí evita el problema clásico de que una pieza se
   ajuste y la de al lado se quede con el valor viejo.          */
export const MEDIDAS = {
  // cuánto debe meterse una pieza dentro de otra para que se lea
  // conectada — verificado que menos que esto deja ver la costura
  traslapeMinimo: 0.005,
  // grosor estándar de una base de riel
  grosorRiel: 0.007,
  // radio de un remache/tornillo visible
  radioRemache: 0.0025,
  // separación entre crestas de un riel picatinny
  pasoCrestas: 0.013,
  // qué tanto sobresale el punto de mira sobre el cañón
  alturaLineaMira: 0.026,
};

/* ── generadores de detalle ──────────────────────────────────
   Piezas chicas y repetitivas que aparecen en muchas armas. Son
   lo que separa "una caja" de "algo fabricado", y tenerlas como
   funciones significa que mejorar el detalle de una mejora TODAS
   las armas a la vez.                                          */

/* Remaches o cabezas de tornillo. */
export function remaches(grupo, posiciones, material = MATERIALES.metalClaro) {
  const geo = new THREE.SphereGeometry(MEDIDAS.radioRemache, 6, 5);
  for (const [x, y, z] of posiciones) {
    const r = new THREE.Mesh(geo, material);
    r.position.set(x, y, z);
    grupo.add(r);
  }
}

/* Una línea de panel: el corte fino que sugiere dónde se unen dos
   piezas de metal. Casi invisible de cerca, pero es lo que quita
   la sensación de bloque macizo. */
export function lineaPanel(grupo, x, y, z, longitud, ejeZ = true) {
  const geo = ejeZ
    ? new THREE.BoxGeometry(0.0012, 0.002, longitud)
    : new THREE.BoxGeometry(longitud, 0.002, 0.0012);
  const l = new THREE.Mesh(geo, MATERIALES.metalOscuro);
  l.position.set(x, y, z);
  grupo.add(l);
}

/* Riel picatinny: la fila de crestas donde se montan accesorios. */
export function rielPicatinny(grupo, x, yTope, zInicio, zFin, material = MATERIALES.metalClaro) {
  const longitud = Math.abs(zFin - zInicio);
  const num = Math.max(3, Math.round(longitud / MEDIDAS.pasoCrestas));
  const paso = longitud / num;
  const signo = zFin >= zInicio ? 1 : -1;
  for (let i = 0; i < num; i++) {
    const z = zInicio + signo * (i + 0.5) * paso;
    const cresta = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.004, Math.max(0.006, paso * 0.55)), material
    );
    cresta.position.set(x, yTope + 0.002, z);
    grupo.add(cresta);
  }
}

/* Estrías alrededor de un cilindro — anillos de zoom, agarres,
   compensadores. Se generan en círculo sobre el eje Z. */
export function estriasRadiales(grupo, { x = 0, y = 0, z = 0, radio, cantidad = 8, largo = 0.02, material = MATERIALES.metalClaro }) {
  for (let i = 0; i < cantidad; i++) {
    const a = (i / cantidad) * Math.PI * 2;
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, largo), material);
    e.position.set(x + Math.cos(a) * radio, y + Math.sin(a) * radio, z);
    e.rotation.z = a;
    grupo.add(e);
  }
}

/* Ranuras de ventilación/gas: cortes oscuros en fila, típicos de
   guardamanos y frenos de boca. */
export function ranurasVentilacion(grupo, { x = 0, y = 0, zInicio, zFin, cantidad = 5, ancho = 0.008, alto = 0.012 }) {
  const paso = (zFin - zInicio) / Math.max(1, cantidad - 1);
  for (let i = 0; i < cantidad; i++) {
    const r = new THREE.Mesh(
      new THREE.BoxGeometry(ancho, alto, 0.005), MATERIALES.metalOscuro
    );
    r.position.set(x, y, zInicio + paso * i);
    grupo.add(r);
  }
}

/* Guardamonte: el arco que protege el gatillo. Se arma con
   segmentos rectos siguiendo una curva, en vez de un toro cerrado,
   para poder abrirlo por arriba donde se une al cuerpo. */
export function guardamonte(grupo, x, y, z, radio = 0.022, material = MATERIALES.metal) {
  const SEGMENTOS = 7;
  const a0 = Math.PI * 0.05, a1 = Math.PI * 0.95;
  for (let i = 0; i < SEGMENTOS; i++) {
    const ai = a0 + (a1 - a0) * (i / SEGMENTOS);
    const aj = a0 + (a1 - a0) * ((i + 1) / SEGMENTOS);
    const z1 = z + Math.cos(ai) * radio, y1 = y - Math.sin(ai) * radio;
    const z2 = z + Math.cos(aj) * radio, y2 = y - Math.sin(aj) * radio;
    const largo = Math.hypot(z2 - z1, y2 - y1);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.005, largo * 1.15), material);
    seg.position.set(x, (y1 + y2) / 2, (z1 + z2) / 2);
    seg.rotation.x = -Math.atan2(y2 - y1, z2 - z1);
    grupo.add(seg);
  }
}

/* Textura de agarre: cuadrícula de puntos en relieve, para
   empuñaduras y guardamanos. Es lo que hace que una empuñadura se
   lea como algo que se agarra y no como un bloque liso. */
export function texturaAgarre(grupo, { x = 0, y = 0, z = 0, ancho, alto, filas = 4, columnas = 3, material = MATERIALES.metalOscuro }) {
  const geo = new THREE.BoxGeometry(0.0018, 0.0035, 0.0035);
  for (let f = 0; f < filas; f++) {
    for (let col = 0; col < columnas; col++) {
      const punto = new THREE.Mesh(geo, material);
      punto.position.set(
        x,
        y - alto / 2 + (alto / (filas - 1 || 1)) * f,
        z - ancho / 2 + (ancho / (columnas - 1 || 1)) * col
      );
      grupo.add(punto);
    }
  }
}

/* Calcula qué tan profunda debe ser la base de un accesorio para
   cubrir el hueco real del cuerpo al que se monta, con traslape.
   Antes cada mira usaba un valor fijo, y eso fallaba en las armas
   cuyo punto de montaje está más elevado (la LMG, por su asa). */
export function profundidadMontaje(topeVisible, huecoCuerpo) {
  return topeVisible + (huecoCuerpo ?? 0.008) + MEDIDAS.traslapeMinimo;
}

/* Dado un tope y una profundidad, devuelve dónde centrar la pieza
   para que su cara superior quede exactamente en el tope. */
export function centroMontaje(topeVisible, profundidad) {
  return (topeVisible - profundidad) / 2;
}

/* ════════════════════════════════════════════════════════════
   GEOMETRÍA DE FORMA REAL
   ────────────────────────────────────────────────────────────
   Todo lo anterior sigue siendo cajas y cilindros pegados. Eso es
   lo que hace que las armas se lean "toscas": en la vida real casi
   ninguna superficie de un arma es una caja perfecta — hay
   biseles, conicidades, cortes en ángulo y perfiles curvos.

   Estas funciones construyen a partir de SILUETAS y PERFILES en
   vez de primitivas sueltas:

     · perfilExtruido — dibujas el contorno lateral del arma y se
       extruye a lo ancho, con bisel en los bordes. Es como se
       modela un receptor de verdad.
     · torneado — dibujas el perfil de radio a lo largo del eje y
       se revuelve. Así se hacen cañones, silenciadores y tubos
       con conicidades reales, no cilindros rectos.
     · cajaBiselada — una caja cuyos bordes están matados, que es
       lo mínimo para que deje de parecer un cubo de juguete.
   ════════════════════════════════════════════════════════════ */

/* Extruye una silueta 2D (en el plano Z-Y, el perfil lateral del
   arma) a lo ancho del eje X, con bisel en los cantos.
   `puntos` es una lista [z, y] recorriendo el contorno.          */
export function perfilExtruido(puntos, ancho, material, { bisel = 0.0025, curvaBisel = 2 } = {}) {
  const forma = new THREE.Shape();
  forma.moveTo(puntos[0][0], puntos[0][1]);
  for (let i = 1; i < puntos.length; i++) forma.lineTo(puntos[i][0], puntos[i][1]);
  forma.closePath();

  const geo = new THREE.ExtrudeGeometry(forma, {
    depth: ancho - bisel * 2,
    bevelEnabled: bisel > 0,
    bevelThickness: bisel,
    bevelSize: bisel,
    bevelSegments: curvaBisel,
    curveSegments: 6,
  });
  // ExtrudeGeometry crece en +Z desde el plano; hay que rotarla
  // para que el ancho quede sobre X y centrarla
  geo.rotateY(Math.PI / 2);
  geo.translate(-(ancho - bisel * 2) / 2 - bisel, 0, 0);
  return new THREE.Mesh(geo, material);
}

/* Revoluciona un perfil de radios a lo largo del eje del cañón.
   `secciones` es una lista [z, radio] — el resultado es una pieza
   con conicidades y escalones reales, no un tubo recto.          */
export function torneado(secciones, material, { segmentos = 20, abierto = false } = {}) {
  const puntos = secciones.map(([z, r]) => new THREE.Vector2(Math.max(r, 0.0001), z));
  const geo = new THREE.LatheGeometry(puntos, segmentos);
  // LatheGeometry gira sobre Y; el cañón va sobre Z
  geo.rotateX(Math.PI / 2);
  const mat = abierto
    ? material.clone()
    : material;
  if (abierto) mat.side = THREE.DoubleSide;
  return new THREE.Mesh(geo, mat);
}

/* Caja con los bordes matados. Es el reemplazo directo de
   BoxGeometry para cualquier pieza que hoy se vea como un cubo. */
export function cajaBiselada(ancho, alto, profundo, material, bisel = 0.003) {
  const b = Math.min(bisel, ancho / 2.5, alto / 2.5, profundo / 2.5);
  const forma = new THREE.Shape();
  // se encoge la silueta por el bisel, porque el bisel crece HACIA
  // AFUERA — sin esto la pieza terminaba más grande de lo pedido y
  // se desalineaba con todo lo que la rodea
  const hz = profundo / 2 - b, hy = alto / 2 - b;
  forma.moveTo(-hz + b, -hy);
  forma.lineTo(hz - b, -hy);
  forma.quadraticCurveTo(hz, -hy, hz, -hy + b);
  forma.lineTo(hz, hy - b);
  forma.quadraticCurveTo(hz, hy, hz - b, hy);
  forma.lineTo(-hz + b, hy);
  forma.quadraticCurveTo(-hz, hy, -hz, hy - b);
  forma.lineTo(-hz, -hy + b);
  forma.quadraticCurveTo(-hz, -hy, -hz + b, -hy);

  const geo = new THREE.ExtrudeGeometry(forma, {
    depth: ancho - b * 2,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 2,
    curveSegments: 3,
  });
  geo.rotateY(Math.PI / 2);
  geo.translate(-(ancho - b * 2) / 2 - b, 0, 0);
  return new THREE.Mesh(geo, material);
}

/* ── perfiles de cañón listos ────────────────────────────────
   Los cañones reales no son tubos rectos: tienen una recámara más
   gruesa atrás, un escalón donde termina, y a veces una boca
   ensanchada. Estos perfiles lo reproducen.                     */
export function perfilCañon(longitud, radioBase) {
  const r = radioBase;
  return [
    [0.012, 0],              // cierre trasero
    [0.012, r * 1.42],       // recámara — la parte gruesa
    [-0.006, r * 1.42],
    [-0.010, r * 1.15],      // escalón de transición
    [-longitud * 0.35, r * 1.06],
    [-longitud * 0.86, r],   // el tubo, con conicidad muy leve
    [-longitud, r * 0.97],
    [-longitud, r * 0.62],   // boca — el labio del cañón
    [-longitud + 0.004, r * 0.60],
    [-longitud + 0.004, 0],
  ];
}

/* Perfil de un silenciador: cuerpo cilíndrico con los extremos
   redondeados, no un tubo cortado a escuadra.                   */
export function perfilSilenciador(longitud, radio) {
  return [
    [0, 0],
    [0, radio * 0.72],
    [-0.008, radio],
    [-longitud + 0.012, radio],
    [-longitud + 0.004, radio * 0.88],
    [-longitud, radio * 0.55],
    [-longitud, 0],
  ];
}

/* ── siluetas de receptor ────────────────────────────────────
   El contorno lateral de cada tipo de arma. Aquí es donde de
   verdad se gana el realismo: en vez de un bloque rectangular,
   cada arma tiene su perfil característico — con la parte trasera
   más baja, el corte de la ventana de expulsión, la caída hacia
   el guardamonte y el ángulo de la empuñadura.                  */
export function siluetaReceptor(tipo, largo, alto) {
  const hz = largo / 2, hy = alto / 2;
  switch (tipo) {
    case 'pistola':
      // corredera arriba y marco abajo: el escalón lateral es lo
      // que hace inconfundible la silueta de una pistola
      return [
        [-hz, hy * 0.42], [-hz, hy],
        [hz * 0.72, hy], [hz, hy * 0.72],
        [hz, -hy * 0.30], [hz * 0.52, -hy],
        [-hz * 0.28, -hy], [-hz * 0.62, -hy * 0.45],
        [-hz, -hy * 0.20],
      ];
    case 'compacto':
      // subfusil / automática: caja más limpia pero con los
      // cantos delanteros cortados y caída trasera
      return [
        [-hz, hy * 0.30], [-hz * 0.86, hy],
        [hz * 0.60, hy], [hz, hy * 0.60],
        [hz, -hy * 0.55], [hz * 0.70, -hy],
        [-hz * 0.55, -hy], [-hz, -hy * 0.35],
      ];
    case 'fusil':
      // receptor largo, con la parte superior recta (para el riel)
      // y el frente adelgazado hacia el guardamanos
      return [
        [-hz, hy * 0.18], [-hz * 0.90, hy * 0.62],
        [-hz * 0.55, hy], [hz * 0.66, hy],
        [hz, hy * 0.55], [hz, -hy * 0.42],
        [hz * 0.60, -hy], [-hz * 0.45, -hy],
        [-hz * 0.88, -hy * 0.50],
      ];
    case 'escopeta':
      // receptor grueso y corto, con hombros marcados
      return [
        [-hz, hy * 0.35], [-hz * 0.80, hy],
        [hz * 0.72, hy], [hz, hy * 0.48],
        [hz, -hy * 0.48], [hz * 0.70, -hy],
        [-hz * 0.72, -hy], [-hz, -hy * 0.30],
      ];
    case 'precision':
      // receptor de cerrojo: perfil bajo y alargado, con el lomo
      // recto y la parte trasera cayendo hacia la culata
      return [
        [-hz, -hy * 0.10], [-hz * 0.92, hy * 0.55],
        [-hz * 0.40, hy], [hz * 0.72, hy],
        [hz, hy * 0.40], [hz, -hy * 0.50],
        [hz * 0.55, -hy], [-hz * 0.60, -hy],
      ];
    case 'ametralladora':
      // receptor masivo, con el lomo alto y el frente escalonado
      return [
        [-hz, hy * 0.25], [-hz * 0.88, hy * 0.80],
        [-hz * 0.50, hy], [hz * 0.55, hy],
        [hz * 0.80, hy * 0.70], [hz, hy * 0.20],
        [hz, -hy * 0.60], [hz * 0.62, -hy],
        [-hz * 0.65, -hy], [-hz, -hy * 0.45],
      ];
    default:
      return [[-hz, -hy], [hz, -hy], [hz, hy], [-hz, hy]];
  }
}

/* Silueta de una empuñadura de pistola: no es un bloque inclinado,
   tiene panza al frente y el talón más ancho abajo.             */
export function siluetaEmpuñadura(alto, profundo) {
  const hy = alto / 2, hz = profundo / 2;
  return [
    [-hz * 0.85, hy], [hz, hy],
    [hz * 0.92, hy * 0.10], [hz * 0.78, -hy * 0.55],
    [hz * 0.55, -hy], [-hz * 0.72, -hy],
    [-hz * 0.95, -hy * 0.30], [-hz, hy * 0.45],
  ];
}

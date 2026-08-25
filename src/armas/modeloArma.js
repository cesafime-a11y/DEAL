/* ── armas/modeloArma.js ───────────────────────────────────
   Construye el modelo 3D del arma A PARTIR de las piezas
   elegidas. Cada categoría tiene su propia fábrica de
   geometría, independiente de las demás. El cuerpo define
   CUATRO puntos de anclaje (cañón, cargador, mira, empuñadura
   inferior) — cualquier combinación encaja sin piezas flotando
   o enterradas unas en otras.

   El acabado es un caso especial: los materiales metálicos
   (MAT_METAL, MAT_METAL_CLARO) se COMPARTEN entre todas las
   armas del juego para no crear cientos de instancias. Si
   coloreáramos ese material compartido directamente, cambiaría
   el color de TODAS las armas a la vez, no solo la que estás
   armando — por eso, cuando el acabado no es el de fábrica, se
   clonan y recolorean solo los materiales DE ESTE modelo en
   particular (ver aplicarAcabado, al final).

   Todo son primitivas — mismo lenguaje visual que el resto del
   juego, nada de texturas ni modelos importados.
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import {
  perfilExtruido, torneado, cajaBiselada, perfilSilenciador,
  siluetaReceptor, siluetaEmpuñadura, perfilCañon,
  texturaAgarre as texturaAgarreDiseno,
} from './disenoArmas.js';
import { ACABADOS } from './piezas.js';

const MAT_METAL = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.4, metalness: 0.6 });
const MAT_METAL_CLARO = new THREE.MeshStandardMaterial({ color: 0x3c3c40, roughness: 0.3, metalness: 0.75 });
const MAT_GRIP = new THREE.MeshStandardMaterial({ color: 0x1c1b19, roughness: 0.85, metalness: 0.1 });
/* Lentes: antes eran casi transparentes (opacidad 0.3-0.4), lo que
   en un fondo oscuro hacía que las miras se leyeran como si no
   tuvieran nada — se veía a través de ellas hasta desaparecer.
   Ahora tienen cuerpo real y brillo propio, que es lo que hace que
   una óptica se distinga de un tubo vacío. Siguen dejando pasar
   algo de luz, pero ya se ven.                                    */
const MAT_LENTE_ROJA = new THREE.MeshBasicMaterial({ color: 0xff4433, transparent: true, opacity: 0.82 });
const MAT_LENTE_ESCOPE = new THREE.MeshBasicMaterial({ color: 0x6ba8e8, transparent: true, opacity: 0.78 });
const MAT_LENTE_FRONTAL = new THREE.MeshBasicMaterial({ color: 0x2a4a70, transparent: true, opacity: 0.7 });
/* La retícula — la cruz que ves al apuntar. Antes no existía como
   pieza: parte de que la mira "no tuviera nada" era justamente que
   no había ninguna marca dentro del lente.                        */
const MAT_RETICULA = new THREE.MeshBasicMaterial({ color: 0x101418 });
/* Para tubos de mira: SIN tapas (openEnded) para poder ver a través,
   pero con las dos caras visibles — así desde fuera el tubo se ve
   macizo y desde dentro el camino está despejado. Un cilindro
   cerrado normal tiene tapas circulares que, con el tubo apuntando
   hacia adelante, quedaban justo tapando por donde miras.        */
const MAT_TUBO = new THREE.MeshStandardMaterial({
  color: 0x2f2f33, roughness: 0.5, metalness: 0.8, side: THREE.DoubleSide,
});
const MAT_PUNTO_ROJO = new THREE.MeshBasicMaterial({ color: 0xff2a18 });
const MAT_LENTE_OSCURA = new THREE.MeshBasicMaterial({ color: 0x0c1220 });   // opaco a propósito — ventanas de expulsión y el emisor del láser, NUNCA se mira a través de estos

/* ── funciones de detalle reutilizables ──────────────────────
   Pequeños generadores que agregan remaches, líneas de panel, y
   textura de riel — se aplican a los 8 cuerpos de forma
   consistente, así el esfuerzo rinde en todas partes en vez de
   rediseñar cada arma a mano por separado. Es lo que hace que
   se lean como piezas fabricadas, no cajas lisas.               */

function agregarRemaches(grupo, posiciones, material = MAT_METAL_CLARO) {
  for (const [x, y, z] of posiciones) {
    const remache = new THREE.Mesh(new THREE.SphereGeometry(0.0025, 6, 5), material);
    remache.position.set(x, y, z);
    grupo.add(remache);
  }
}

function agregarLineaPanel(grupo, x, y, z, longitud, ejeZ = true) {
  const geo = ejeZ
    ? new THREE.BoxGeometry(0.0012, 0.002, longitud)
    : new THREE.BoxGeometry(longitud, 0.002, 0.0012);
  const linea = new THREE.Mesh(geo, MAT_LENTE_OSCURA);
  linea.position.set(x, y, z);
  grupo.add(linea);
}

/* Una fila de crestas delgadas, estilo riel picatinny — donde
   antes había una superficie lisa arriba del cuerpo. Va justo
   donde se monta la mira, así conecta visualmente con lo que
   representa: el riel real de donde cuelga el accesorio.       */
function agregarRielSuperior(grupo, x, yTope, zInicio, zFin, material = MAT_METAL_CLARO) {
  const longitud = Math.abs(zFin - zInicio);
  const numCrestas = Math.max(3, Math.round(longitud / 0.013));
  const paso = longitud / numCrestas;
  const signo = zFin >= zInicio ? 1 : -1;
  for (let i = 0; i < numCrestas; i++) {
    const z = zInicio + signo * (i + 0.5) * paso;
    const cresta = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.004, Math.max(0.006, paso * 0.55)), material);
    cresta.position.set(x, yTope + 0.002, z);
    grupo.add(cresta);
  }
}

/* El arco que rodea el gatillo. Ninguna arma lo tenía, y es de
   las piezas más reconocibles de un arma real — su ausencia era
   parte de lo que las hacía leerse como bloques geométricos.
   Se arma con segmentos rectos siguiendo una curva, en vez de
   con un toro completo, para poder abrirlo por arriba (donde se
   une al cuerpo) y que el dedo "entre" de verdad.               */
function agregarGuardamonte(grupo, x, y, z, radio = 0.022, material = MAT_METAL) {
  const SEGMENTOS = 7;
  const anguloInicio = Math.PI * 0.05;
  const anguloFin = Math.PI * 0.95;
  for (let i = 0; i < SEGMENTOS; i++) {
    const a1 = anguloInicio + (anguloFin - anguloInicio) * (i / SEGMENTOS);
    const a2 = anguloInicio + (anguloFin - anguloInicio) * ((i + 1) / SEGMENTOS);
    const z1 = z + Math.cos(a1) * radio, y1 = y - Math.sin(a1) * radio;
    const z2 = z + Math.cos(a2) * radio, y2 = y - Math.sin(a2) * radio;
    const largo = Math.hypot(z2 - z1, y2 - y1);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.005, largo * 1.15), material);
    seg.position.set(x, (y1 + y2) / 2, (z1 + z2) / 2);
    seg.rotation.x = -Math.atan2(y2 - y1, z2 - z1);
    grupo.add(seg);
  }
}

/* ── cuerpos ─────────────────────────────────────────────── */

function cuerpoPistola() {
  const grupo = new THREE.Group();
  const LARGO = 0.19, ALTO = 0.10, ANCHO = 0.075;

  /* Receptor a partir de una SILUETA, no de una caja: la pistola
     tiene corredera arriba y marco abajo, con un escalón lateral
     característico. Extruido con bisel, así los cantos están
     matados en vez de ser aristas vivas de cubo.                */
  const receptor = perfilExtruido(
    siluetaReceptor('pistola', LARGO, ALTO), ANCHO, MAT_METAL, { bisel: 0.0035 }
  );
  grupo.add(receptor);

  // corredera: pieza propia encima, con su corte de alivio — es lo
  // que de verdad distingue una pistola vista de lado
  const corredera = cajaBiselada(ANCHO * 0.92, 0.028, LARGO * 0.88, MAT_METAL_CLARO, 0.004);
  corredera.position.set(0, ALTO / 2 - 0.006, -0.006);
  grupo.add(corredera);

  // estrías de amartillado en la parte trasera de la corredera
  for (let i = 0; i < 6; i++) {
    const estria = new THREE.Mesh(new THREE.BoxGeometry(ANCHO * 0.94, 0.016, 0.0035), MAT_METAL);
    estria.position.set(0, ALTO / 2 - 0.008, 0.052 + i * 0.008);
    grupo.add(estria);
  }

  agregarRielSuperior(grupo, 0, 0.05, -0.075, 0.03);
  agregarLineaPanel(grupo, 0.0376, -0.012, -0.04, 0.09);
  agregarLineaPanel(grupo, -0.0376, -0.012, -0.04, 0.09);

  const ventanaExpulsion = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.019, 0.045), MAT_LENTE_OSCURA);
  ventanaExpulsion.position.set(0.032, 0.026, -0.008);
  grupo.add(ventanaExpulsion);

  /* Empuñadura con silueta propia: panza al frente y talón más
     ancho abajo, en vez de un prisma inclinado.                 */
  const grip = perfilExtruido(
    siluetaEmpuñadura(0.13, 0.062), 0.052, MAT_GRIP, { bisel: 0.004 }
  );
  grip.position.set(0, -0.10, 0.055);
  grip.rotation.x = 0.22;
  grupo.add(grip);

  // cachas texturizadas a los lados de la empuñadura
  for (const lado of [-1, 1]) {
    const cacha = new THREE.Group();
    texturaAgarreDiseno(cacha, {
      x: lado * 0.027, y: 0, z: 0,
      ancho: 0.045, alto: 0.075, filas: 5, columnas: 4,
    });
    cacha.position.set(0, -0.10, 0.055);
    cacha.rotation.x = 0.22;
    grupo.add(cacha);
  }

  const gatillo = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.026, 0.008), MAT_METAL_CLARO);
  gatillo.position.set(0, -0.045, 0.01);
  gatillo.rotation.x = -0.15;
  grupo.add(gatillo);
  agregarGuardamonte(grupo, 0, -0.032, 0.01, 0.021);

  return {
    grupo,
    puntoCañon: new THREE.Vector3(0, 0.01, -0.095),
    puntoCargador: new THREE.Vector3(0, -0.16, 0.06),
    puntoMira: new THREE.Vector3(0, 0.058, -0.02),
    puntoEmpuñadura: new THREE.Vector3(0, -0.048, -0.05),
    huecoMira: 0.008,   // qué tan por debajo del punto de mira empieza el cuerpo real
  };
}

function cuerpoSubfusil() {
  const grupo = new THREE.Group();

  const receptor = perfilExtruido(
    siluetaReceptor('compacto', 0.27, 0.115), 0.09, MAT_METAL, { bisel: 0.0035 }
  );
  grupo.add(receptor);
  // tapa superior del receptor, pieza aparte con su propio canto
  const tapa = cajaBiselada(0.084, 0.014, 0.20, MAT_METAL_CLARO, 0.003);
  tapa.position.set(0, 0.0545, -0.01);
  grupo.add(tapa);

  agregarRielSuperior(grupo, 0, 0.0575, -0.11, 0.09);
  agregarRemaches(grupo, [
    [0.04, 0.055, -0.12], [-0.04, 0.055, -0.12],
    [0.04, 0.055, 0.1], [-0.04, 0.055, 0.1],
  ]);
  agregarLineaPanel(grupo, 0.0451, 0, -0.07, 0.14);
  agregarLineaPanel(grupo, -0.0451, 0, -0.07, 0.14);

  const ventanaExpulsion = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.026, 0.07), MAT_LENTE_OSCURA);
  ventanaExpulsion.position.set(0.043, 0.022, -0.02);
  grupo.add(ventanaExpulsion);

  const grip = perfilExtruido(siluetaEmpuñadura(0.14, 0.06), 0.06, MAT_GRIP, { bisel: 0.004 });
  grip.position.set(0, -0.11, 0.06);
  grip.rotation.x = 0.2;
  grupo.add(grip);

  // culata corta, plegada — más ancho de cuerpo, más presencia que la pistola
  const culata = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.09), MAT_METAL);
  culata.position.set(0, -0.01, 0.175);
  grupo.add(culata);

  const gatillo = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.028, 0.01), MAT_GRIP);
  gatillo.position.set(0, -0.05, 0.02);
  grupo.add(gatillo);
  agregarGuardamonte(grupo, 0, -0.036, 0.02, 0.023);

  return {
    grupo,
    puntoCañon: new THREE.Vector3(0, 0.015, -0.135),
    puntoCargador: new THREE.Vector3(0, -0.175, 0.06),
    puntoMira: new THREE.Vector3(0, 0.0655, -0.03),
    puntoEmpuñadura: new THREE.Vector3(0, -0.052, -0.075),
    huecoMira: 0.008,   // qué tan por debajo del punto de mira empieza el cuerpo real
  };
}

function cuerpoRifle() {
  const grupo = new THREE.Group();

  const receptor = perfilExtruido(
    siluetaReceptor('fusil', 0.34, 0.12), 0.095, MAT_METAL, { bisel: 0.0035 }
  );
  grupo.add(receptor);
  // guardamanos delantero, con ranuras de ventilación — la parte
  // que de verdad rompe la silueta de "un solo bloque largo"
  const guardamanos = cajaBiselada(0.078, 0.072, 0.14, MAT_GRIP, 0.005);
  guardamanos.position.set(0, -0.004, -0.115);
  grupo.add(guardamanos);
  for (const lado of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const ranura = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.026, 0.016), MAT_LENTE_OSCURA);
      ranura.position.set(lado * 0.038, -0.004, -0.16 + i * 0.026);
      grupo.add(ranura);
    }
  }

  agregarRielSuperior(grupo, 0, 0.06, -0.14, 0.11);
  agregarRemaches(grupo, [
    [0.043, 0.058, -0.15], [-0.043, 0.058, -0.15],
    [0.043, 0.058, 0.12], [-0.043, 0.058, 0.12],
  ]);
  agregarLineaPanel(grupo, 0.0476, 0, -0.09, 0.17);
  agregarLineaPanel(grupo, -0.0476, 0, -0.09, 0.17);

  const ventanaExpulsion = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.028, 0.08), MAT_LENTE_OSCURA);
  ventanaExpulsion.position.set(0.0455, 0.023, -0.03);
  grupo.add(ventanaExpulsion);

  const grip = perfilExtruido(siluetaEmpuñadura(0.15, 0.06), 0.06, MAT_GRIP, { bisel: 0.004 });
  grip.position.set(0, -0.115, 0.03);
  grip.rotation.x = 0.18;
  grupo.add(grip);

  // culata larga, angulada para hombro — la silueta más distinta de las tres
  const culata = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.075, 0.19), MAT_METAL);
  culata.position.set(0, -0.01, 0.245);
  culata.rotation.x = -0.05;
  grupo.add(culata);

  const almohadilla = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.02), MAT_GRIP);
  almohadilla.position.set(0, -0.015, 0.335);
  grupo.add(almohadilla);

  const gatillo = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.028, 0.01), MAT_GRIP);
  gatillo.position.set(0, -0.05, 0.0);
  grupo.add(gatillo);
  agregarGuardamonte(grupo, 0, -0.036, 0.0, 0.023);

  return {
    grupo,
    puntoCañon: new THREE.Vector3(0, 0.02, -0.17),
    puntoCargador: new THREE.Vector3(0, -0.185, 0.03),
    puntoMira: new THREE.Vector3(0, 0.068, -0.05),
    puntoEmpuñadura: new THREE.Vector3(0, -0.055, -0.1),
    huecoMira: 0.008,   // qué tan por debajo del punto de mira empieza el cuerpo real
  };
}

function cuerpoEscopeta() {
  const grupo = new THREE.Group();

  const receptor = perfilExtruido(
    siluetaReceptor('escopeta', 0.22, 0.105), 0.088, MAT_METAL, { bisel: 0.004 }
  );
  grupo.add(receptor);

  agregarRielSuperior(grupo, 0, 0.0525, -0.09, 0.08);
  agregarRemaches(grupo, [
    [0.041, 0.05, -0.09], [-0.041, 0.05, -0.09],
    [0.041, 0.05, 0.08], [-0.041, 0.05, 0.08],
  ]);
  agregarLineaPanel(grupo, 0.0441, 0, -0.05, 0.13);
  agregarLineaPanel(grupo, -0.0441, 0, -0.05, 0.13);

  // guardamanos ancho, característico de una escopeta
  const guardamanos = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.14), MAT_GRIP);
  guardamanos.position.set(0, -0.02, -0.15);
  grupo.add(guardamanos);

  // culata robusta y recta
  const culata = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.085, 0.17), MAT_GRIP);
  culata.position.set(0, 0.005, 0.185);
  grupo.add(culata);

  const grip = perfilExtruido(siluetaEmpuñadura(0.13, 0.06), 0.058, MAT_GRIP, { bisel: 0.004 });
  grip.position.set(0, -0.1, 0.07);
  grip.rotation.x = 0.2;
  grupo.add(grip);

  const gatillo = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.026, 0.01), MAT_GRIP);
  gatillo.position.set(0, -0.045, 0.03);
  grupo.add(gatillo);
  agregarGuardamonte(grupo, 0, -0.032, 0.03, 0.022);

  return {
    grupo,
    puntoCañon: new THREE.Vector3(0, 0.012, -0.11),
    puntoCargador: new THREE.Vector3(0, -0.16, 0.02),
    puntoMira: new THREE.Vector3(0, 0.0605, -0.03),
    puntoEmpuñadura: new THREE.Vector3(0, -0.052, -0.14),
    huecoMira: 0.008,   // qué tan por debajo del punto de mira empieza el cuerpo real
  };
}

function cuerpoRevolver() {
  const grupo = new THREE.Group();

  const marco = perfilExtruido(
    siluetaReceptor('pistola', 0.1, 0.09), 0.07, MAT_METAL, { bisel: 0.004 }
  );
  marco.position.z = 0.02;
  grupo.add(marco);

  // tornillos de placa lateral — detalle clásico de revólver, sin
  // riel (sería anacrónico en un arma de este estilo)
  agregarRemaches(grupo, [
    [0.0351, 0.02, 0.0], [0.0351, -0.015, 0.03],
  ], MAT_METAL_CLARO);
  agregarLineaPanel(grupo, 0.0351, 0, 0.02, 0.07);

  // el tambor — lo que hace inconfundible a un revólver
  const tambor = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.05, 8), MAT_METAL_CLARO);
  tambor.rotation.x = Math.PI / 2;
  tambor.position.set(0, 0.005, -0.045);
  grupo.add(tambor);

  // martillo expuesto, atrás — nada lo cubre, a diferencia de una pistola
  const martillo = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.02, 0.014), MAT_METAL);
  martillo.position.set(0, 0.05, 0.045);
  martillo.rotation.x = -0.3;
  grupo.add(martillo);

  const grip = perfilExtruido(siluetaEmpuñadura(0.115, 0.055), 0.05, MAT_GRIP, { bisel: 0.004 });
  grip.position.set(0, -0.09, 0.05);
  grip.rotation.x = 0.28;
  grupo.add(grip);

  const gatillo = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.024, 0.009), MAT_GRIP);
  gatillo.position.set(0, -0.035, 0.015);
  grupo.add(gatillo);
  agregarGuardamonte(grupo, 0, -0.024, 0.015, 0.019);

  return {
    grupo,
    puntoCañon: new THREE.Vector3(0, 0.005, -0.07),
    puntoCargador: new THREE.Vector3(0, -0.1425, 0.05),
    puntoMira: new THREE.Vector3(0, 0.053, 0.02),
    puntoEmpuñadura: new THREE.Vector3(0, -0.045, -0.04),
    huecoMira: 0.008,   // qué tan por debajo del punto de mira empieza el cuerpo real
  };
}

function cuerpoAutomatica() {
  const grupo = new THREE.Group();

  const receptor = perfilExtruido(
    siluetaReceptor('pistola', 0.15, 0.095), 0.07, MAT_METAL, { bisel: 0.0035 }
  );
  grupo.add(receptor);
  const corredera = cajaBiselada(0.066, 0.024, 0.13, MAT_METAL_CLARO, 0.003);
  corredera.position.set(0, 0.0415, -0.004);
  grupo.add(corredera);

  agregarRielSuperior(grupo, 0, 0.0475, -0.06, 0.05);
  agregarRemaches(grupo, [
    [0.031, 0.045, -0.065], [-0.031, 0.045, -0.065],
    [0.031, 0.045, 0.05], [-0.031, 0.045, 0.05],
  ]);
  agregarLineaPanel(grupo, 0.0351, 0, -0.03, 0.08);
  agregarLineaPanel(grupo, -0.0351, 0, -0.03, 0.08);

  const ventanaExpulsion = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.02, 0.04), MAT_LENTE_OSCURA);
  ventanaExpulsion.position.set(0.034, 0.018, -0.01);
  grupo.add(ventanaExpulsion);

  // grip más inclinado que la pistola normal — perfil compacto,
  // de disparo rápido a corta distancia
  const grip = perfilExtruido(siluetaEmpuñadura(0.115, 0.055), 0.05, MAT_GRIP, { bisel: 0.004 });
  grip.position.set(0, -0.09, 0.045);
  grip.rotation.x = 0.32;
  grupo.add(grip);

  const gatillo = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.024, 0.009), MAT_GRIP);
  gatillo.position.set(0, -0.038, 0.005);
  grupo.add(gatillo);
  agregarGuardamonte(grupo, 0, -0.026, 0.005, 0.019);

  return {
    grupo,
    puntoCañon: new THREE.Vector3(0, 0.008, -0.075),
    puntoCargador: new THREE.Vector3(0, -0.1425, 0.045),
    puntoMira: new THREE.Vector3(0, 0.0555, -0.015),
    puntoEmpuñadura: new THREE.Vector3(0, -0.042, -0.045),
    huecoMira: 0.008,   // qué tan por debajo del punto de mira empieza el cuerpo real
  };
}

function cuerpoLmg() {
  const grupo = new THREE.Group();

  const receptor = perfilExtruido(
    siluetaReceptor('ametralladora', 0.3, 0.13), 0.1, MAT_METAL, { bisel: 0.004 }
  );
  grupo.add(receptor);

  // sin riel superior — ahí ya va el asa de transporte, agregar
  // uno encima se vería encimado. Remaches lejos del asa, en las
  // zonas despejadas del receptor.
  agregarRemaches(grupo, [
    [0.046, 0.06, -0.13], [-0.046, 0.06, -0.13],
    [0.046, 0.06, 0.13], [-0.046, 0.06, 0.13],
  ]);
  agregarLineaPanel(grupo, 0.0501, 0, -0.08, 0.2);
  agregarLineaPanel(grupo, -0.0501, 0, -0.08, 0.2);

  // asa de transporte arriba — distintiva de una ametralladora ligera
  const asa = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.03, 0.08), MAT_METAL);
  asa.position.set(0, 0.08, -0.02);
  grupo.add(asa);
  const asaSoporteA = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.015, 0.008), MAT_METAL);
  asaSoporteA.position.set(0, 0.068, -0.05);
  grupo.add(asaSoporteA);
  const asaSoporteB = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.015, 0.008), MAT_METAL);
  asaSoporteB.position.set(0, 0.068, 0.01);
  grupo.add(asaSoporteB);

  const culata = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.2), MAT_GRIP);
  culata.position.set(0, -0.015, 0.245);
  grupo.add(culata);

  const grip = perfilExtruido(siluetaEmpuñadura(0.14, 0.06), 0.06, MAT_GRIP, { bisel: 0.004 });
  grip.position.set(0, -0.115, 0.05);
  grip.rotation.x = 0.16;
  grupo.add(grip);

  const gatillo = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.028, 0.01), MAT_GRIP);
  gatillo.position.set(0, -0.048, 0.015);
  grupo.add(gatillo);
  agregarGuardamonte(grupo, 0, -0.034, 0.015, 0.023);

  return {
    grupo,
    puntoCañon: new THREE.Vector3(0, 0.02, -0.15),
    // más al frente que en los demás cuerpos — la caja de munición
    // de una LMG suele ir bajo el receptor, no detrás del grip
    puntoCargador: new THREE.Vector3(0, -0.06, -0.02),
    puntoMira: new THREE.Vector3(0, 0.09, -0.05),
    puntoEmpuñadura: new THREE.Vector3(0, -0.062, -0.11),
    huecoMira: 0.025,   // qué tan por debajo del punto de mira empieza el cuerpo real
  };
}

function cuerpoFrancotirador() {
  const grupo = new THREE.Group();

  const receptor = perfilExtruido(
    siluetaReceptor('precision', 0.24, 0.09), 0.075, MAT_METAL, { bisel: 0.0035 }
  );
  grupo.add(receptor);
  // culata de madera/polímero con caída — el perfil clásico de un
  // rifle de cerrojo, imposible de sugerir con una sola caja
  const perfilCulata = perfilExtruido(
    [[-0.02,0.03],[0.10,0.045],[0.155,0.005],[0.155,-0.05],[0.09,-0.055],[-0.02,-0.035]],
    0.062, MAT_GRIP, { bisel: 0.005 }
  );
  perfilCulata.position.set(0, -0.012, 0.115);
  grupo.add(perfilCulata);

  agregarRielSuperior(grupo, 0, 0.045, -0.09, 0.07);
  agregarRemaches(grupo, [
    [0.0376, 0.043, -0.1], [-0.0376, 0.043, -0.1],
    [0.0376, 0.043, 0.09], [-0.0376, 0.043, 0.09],
  ]);
  agregarLineaPanel(grupo, 0.0376, 0, -0.05, 0.15);
  agregarLineaPanel(grupo, -0.0376, 0, -0.05, 0.15);

  // manija de cerrojo lateral — lo que distingue a un rifle de
  // cerrojo de todo lo demás en el juego
  const cerrojo = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 8), MAT_METAL_CLARO);
  cerrojo.rotation.z = Math.PI / 2;
  cerrojo.position.set(0.045, 0.02, 0.06);
  grupo.add(cerrojo);
  const perillaCerrojo = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), MAT_METAL_CLARO);
  perillaCerrojo.position.set(0.07, 0.02, 0.06);
  grupo.add(perillaCerrojo);

  // culata larga, con carrillera elevada para alinear con la mira
  const culata = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.075, 0.24), MAT_GRIP);
  culata.position.set(0, 0.005, 0.28);
  grupo.add(culata);
  const carrillera = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.14), MAT_GRIP);
  carrillera.position.set(0, 0.05, 0.24);
  grupo.add(carrillera);

  const grip = perfilExtruido(siluetaEmpuñadura(0.12, 0.055), 0.055, MAT_GRIP, { bisel: 0.004 });
  grip.position.set(0, -0.1, 0.06);
  grip.rotation.x = 0.14;
  grupo.add(grip);

  const gatillo = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.026, 0.01), MAT_GRIP);
  gatillo.position.set(0, -0.042, 0.025);
  grupo.add(gatillo);
  agregarGuardamonte(grupo, 0, -0.03, 0.025, 0.021);

  return {
    grupo,
    puntoCañon: new THREE.Vector3(0, 0.018, -0.12),
    puntoCargador: new THREE.Vector3(0, -0.155, 0.06),
    puntoMira: new THREE.Vector3(0, 0.053, -0.04),
    puntoEmpuñadura: new THREE.Vector3(0, -0.05, -0.08),
    huecoMira: 0.008,   // qué tan por debajo del punto de mira empieza el cuerpo real
  };
}

const FABRICAS_CUERPO = {
  pistola: cuerpoPistola, subfusil: cuerpoSubfusil, rifle: cuerpoRifle,
  escopeta: cuerpoEscopeta, revolver: cuerpoRevolver, automatica: cuerpoAutomatica,
  lmg: cuerpoLmg, francotirador: cuerpoFrancotirador,
};

/* ── cañones — cada uno reporta su longitud real, para saber   ─
   dónde termina la punta (ahí sale la trazadora/fogonazo)      */

function cañonCorto() {
  const grupo = new THREE.Group();
  const longitud = 0.13;
  /* Perfil torneado en vez de un cilindro recto: recámara gruesa
     atrás, escalón de transición, conicidad leve a lo largo y
     labio en la boca. Es la diferencia entre un tubo de juguete y
     algo que parece mecanizado.                                  */
  const tubo = torneado(perfilCañon(longitud, 0.017), MAT_METAL, { segmentos: 18 });
  grupo.add(tubo);
  return { grupo, longitud, radioPunta: 0.017 };
}

function cañonEstandar() {
  const grupo = new THREE.Group();
  const longitud = 0.22;
  /* Perfil torneado en vez de un cilindro recto: recámara gruesa
     atrás, escalón de transición, conicidad leve a lo largo y
     labio en la boca. Es la diferencia entre un tubo de juguete y
     algo que parece mecanizado.                                  */
  const tubo = torneado(perfilCañon(longitud, 0.018), MAT_METAL, { segmentos: 18 });
  grupo.add(tubo);
  return { grupo, longitud, radioPunta: 0.018 };
}

function cañonLargo() {
  const grupo = new THREE.Group();
  const longitud = 0.36;
  /* Perfil torneado en vez de un cilindro recto: recámara gruesa
     atrás, escalón de transición, conicidad leve a lo largo y
     labio en la boca. Es la diferencia entre un tubo de juguete y
     algo que parece mecanizado.                                  */
  const tubo = torneado(perfilCañon(longitud, 0.019), MAT_METAL, { segmentos: 18 });
  grupo.add(tubo);

  const guardamanos = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.045, 0.24), MAT_GRIP);
  guardamanos.position.set(0, -0.028, -0.12);
  grupo.add(guardamanos);

  return { grupo, longitud, radioPunta: 0.019 };
}

function cañonPesado() {
  const grupo = new THREE.Group();
  const longitud = 0.26;
  /* Perfil torneado en vez de un cilindro recto: recámara gruesa
     atrás, escalón de transición, conicidad leve a lo largo y
     labio en la boca. Es la diferencia entre un tubo de juguete y
     algo que parece mecanizado.                                  */
  const tubo = torneado(perfilCañon(longitud, 0.024), MAT_METAL, { segmentos: 18 });
  grupo.add(tubo);

  // aletas de disipación — más ancho que cualquier otro cañón,
  // se lee como "pesado" a simple vista
  for (let i = 0; i < 3; i++) {
    const aleta = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.006, 0.022), MAT_METAL_CLARO);
    aleta.position.set(0, 0.022, -0.05 - i * 0.055);
    grupo.add(aleta);
  }

  return { grupo, longitud, radioPunta: 0.024 };
}

const FABRICAS_CAÑON = { corto: cañonCorto, estandar: cañonEstandar, largo: cañonLargo, pesado: cañonPesado };

/* ── cargadores — cuelgan del punto de cargador del cuerpo ──── */

function cargadorPequeño() {
  const grupo = new THREE.Group();
  const alto = 0.062;
  const cuerpo = cajaBiselada(0.032, alto, 0.045, MAT_METAL, 0.003);
  cuerpo.position.y = -alto / 2;
  grupo.add(cuerpo);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.008, 0.05), MAT_METAL_CLARO);
  base.position.y = -alto - 0.004;
  grupo.add(base);
  return grupo;
}

function cargadorMedio() {
  const grupo = new THREE.Group();
  const alto = 0.11;
  const cuerpo = cajaBiselada(0.032, alto, 0.045, MAT_METAL, 0.0035);
  cuerpo.position.y = -alto / 2;
  grupo.add(cuerpo);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.009, 0.05), MAT_METAL_CLARO);
  base.position.y = -alto - 0.0045;
  grupo.add(base);
  return grupo;
}

function cargadorGrande() {
  /* Curva de "banana" REAL, no solo una caja inclinada: la
     silueta se dobla hacia adelante conforme baja, como un
     cargador curvo de verdad — usando la misma técnica de perfil
     extruido que los cuerpos, solo que en el plano X (a lo ancho)
     en vez de Z.                                                */
  const grupo = new THREE.Group();
  const alto = 0.175;
  const cuerpo = perfilExtruido(
    [[0, 0.016], [0.006, -alto * 0.4], [0.018, -alto * 0.75], [0.03, -alto],
     [0.022, -alto], [0.012, -alto * 0.73], [0.001, -alto * 0.4], [-0.006, 0]],
    0.045, MAT_METAL, { bisel: 0.003 }
  );
  cuerpo.rotation.y = Math.PI / 2;   // el perfil se dibujó en X-Y; rotar para que la curva quede en Z
  grupo.add(cuerpo);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.052), MAT_METAL_CLARO);
  base.position.set(0.026, -alto - 0.005, 0);
  grupo.add(base);
  return grupo;
}

function cargadorTambor() {
  const grupo = new THREE.Group();
  const radio = 0.05;
  // eje del cilindro apuntando de lado (no hacia arriba/abajo),
  // así la cara circular del tambor se ve de frente — la silueta
  // más distinta de las cuatro
  const disco = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, 0.038, 18), MAT_METAL);
  disco.rotation.x = Math.PI / 2;
  disco.position.y = -radio - 0.015;
  grupo.add(disco);
  const cuello = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.04), MAT_METAL_CLARO);
  cuello.position.y = -0.015;
  grupo.add(cuello);
  return grupo;
}

const FABRICAS_CARGADOR = {
  pequeño: cargadorPequeño, medio: cargadorMedio, grande: cargadorGrande, tambor: cargadorTambor,
};

/* ── miras — montadas en el punto de mira del cuerpo ─────────── */

function miraNinguna() {
  return { grupo: new THREE.Group(), puntoOcular: new THREE.Vector3(0, 0.02, 0.04) };
}

function miraHierro(puntaCañonLocal, huecoMira) {
  const grupo = new THREE.Group();

  /* ALZA TRASERA. Antes era diminuta (2cm de ancho, 9mm de alto),
     y contra cuerpos tan gruesos y cuadrados prácticamente no se
     alcanzaba a ver. Ahora va sobre una base elevada que la separa
     del cuerpo, y las orejas son bastante más altas — que es lo
     que de verdad enmarca el punto delantero al apuntar.         */
  const TOPE_BASE = 0.006;
  const profundidad = TOPE_BASE + (huecoMira ?? 0.008) + 0.005;
  const baseAlza = new THREE.Mesh(new THREE.BoxGeometry(0.026, profundidad, 0.016), MAT_METAL);
  baseAlza.position.set(0, (TOPE_BASE - profundidad) / 2, 0.02);
  grupo.add(baseAlza);

  const ALTO_OREJAS = 0.019;
  const Y_OREJAS = TOPE_BASE + ALTO_OREJAS / 2;
  for (const x of [-0.011, 0.011]) {
    const oreja = new THREE.Mesh(new THREE.BoxGeometry(0.006, ALTO_OREJAS, 0.012), MAT_METAL);
    oreja.position.set(x, Y_OREJAS, 0.02);
    grupo.add(oreja);
  }
  // puente que une las orejas por abajo — deja la muesca en U por
  // donde de verdad miras
  const puente = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.005, 0.012), MAT_METAL);
  puente.position.set(0, TOPE_BASE + 0.003, 0.02);
  grupo.add(puente);

  /* POSTE DELANTERO. Va sobre el CAÑÓN, bastante más abajo que el
     punto de mira. Se sube hasta quedar a la MISMA altura que la
     muesca del alza — si no, al apuntar el poste no aparece dentro
     de la mira, que era justo lo que pasaba.                     */
  const puntaZ = puntaCañonLocal ? puntaCañonLocal.z + 0.014 : -0.16;
  const alturaCañon = puntaCañonLocal ? puntaCañonLocal.y : -0.045;
  const alturaPuntoMira = Y_OREJAS + 0.002;   // línea de mira real

  // torre que sube desde el cañón hasta la línea de mira
  const alturaTorre = alturaPuntoMira - alturaCañon;
  const torre = new THREE.Mesh(new THREE.BoxGeometry(0.009, alturaTorre, 0.011), MAT_METAL);
  torre.position.set(0, alturaCañon + alturaTorre / 2, puntaZ);
  grupo.add(torre);

  // collar que abraza el cañón en la base de la torre
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.014, 12), MAT_METAL);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, alturaCañon, puntaZ);
  grupo.add(collar);

  // el poste en sí, en la línea de mira
  const poste = new THREE.Mesh(new THREE.BoxGeometry(0.0045, 0.011, 0.0045), MAT_METAL_CLARO);
  poste.position.set(0, alturaPuntoMira + 0.004, puntaZ);
  grupo.add(poste);
  const bola = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 6), MAT_METAL_CLARO);
  bola.position.set(0, alturaPuntoMira + 0.011, puntaZ);
  grupo.add(bola);

  // orejas protectoras del poste — detalle de arma real, y ayudan a
  // ubicarlo visualmente a distancia
  for (const x of [-0.012, 0.012]) {
    const protector = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.016, 0.008), MAT_METAL);
    protector.position.set(x, alturaPuntoMira + 0.006, puntaZ);
    grupo.add(protector);
  }

  // el ojo va detrás de la muesca, a su misma altura, para que el
  // poste delantero caiga justo en medio de las orejas
  return { grupo, puntoOcular: new THREE.Vector3(0, Y_OREJAS + 0.002, 0.055) };
}

function miraReflex(_puntaCañonLocal, huecoMira) {
  const grupo = new THREE.Group();

  const TOPE_RIEL = 0.007;
  const profundidad = TOPE_RIEL + (huecoMira ?? 0.008) + 0.004;
  const riel = new THREE.Mesh(new THREE.BoxGeometry(0.032, profundidad, 0.044), MAT_METAL);
  riel.position.y = (TOPE_RIEL - profundidad) / 2;
  grupo.add(riel);

  /* Perfil de "gota": una base sólida y una ventana inclinada hacia
     atrás, sostenida por dos brazos. Antes era una caja con una
     ventana casi transparente encima, que en fondo oscuro se leía
     como si no hubiera nada.                                       */
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.014, 0.042), MAT_METAL);
  base.position.set(0, 0.014, 0.004);
  grupo.add(base);

  for (const x of [-0.014, 0.014]) {
    const brazo = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.026, 0.006), MAT_METAL);
    brazo.position.set(x, 0.031, 0.014);
    brazo.rotation.x = -0.22;   // ligeramente reclinado, como los reflex reales
    grupo.add(brazo);
  }
  // capucha superior, protege la ventana
  const capucha = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.005, 0.016), MAT_METAL);
  capucha.position.set(0, 0.044, 0.008);
  grupo.add(capucha);

  // la ventana, inclinada y con cuerpo real
  const MAT_VENTANA_REFLEX = new THREE.MeshBasicMaterial({
    color: 0x9fd8c8, transparent: true, opacity: 0.14, depthWrite: false,
  });
  const ventana = new THREE.Mesh(new THREE.PlaneGeometry(0.026, 0.026), MAT_VENTANA_REFLEX);
  ventana.position.set(0, 0.031, -0.004);
  ventana.rotation.x = -0.22;
  grupo.add(ventana);
  // el punto rojo, lo que de verdad usas para apuntar
  const punto = new THREE.Mesh(new THREE.CircleGeometry(0.0022, 8), MAT_PUNTO_ROJO);
  punto.position.set(0, 0.031, -0.002);
  punto.rotation.x = -0.22;
  grupo.add(punto);

  // perilla de ajuste lateral
  const perilla = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.007, 10), MAT_METAL_CLARO);
  perilla.rotation.z = Math.PI / 2;
  perilla.position.set(0.016, 0.014, 0.01);
  grupo.add(perilla);

  // reflex/holográfica en la vida real tienen distancia ocular
  // ILIMITADA (por eso son tan usados) — se puede ser generoso
  return { grupo, puntoOcular: new THREE.Vector3(0, 0.031, 0.11) };
}

function miraHolografica(_puntaCañonLocal, huecoMira) {
  const grupo = new THREE.Group();

  const TOPE_RIEL = 0.007;
  const profundidad = TOPE_RIEL + (huecoMira ?? 0.008) + 0.004;
  const riel = new THREE.Mesh(new THREE.BoxGeometry(0.036, profundidad, 0.052), MAT_METAL);
  riel.position.y = (TOPE_RIEL - profundidad) / 2;
  grupo.add(riel);

  // carcasa de caja abierta: dos paredes laterales y un techo, con
  // la ventana suspendida en medio — es lo que le da el perfil
  // rectangular inconfundible de una holográfica
  for (const x of [-0.019, 0.019]) {
    const pared = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.032, 0.05), MAT_METAL);
    pared.position.set(x, 0.021, 0);
    grupo.add(pared);
  }
  const techo = new THREE.Mesh(new THREE.BoxGeometry(0.043, 0.006, 0.05), MAT_METAL);
  techo.position.set(0, 0.04, 0);
  grupo.add(techo);
  // bloque trasero (electrónica) — cierra la silueta por atrás
  /* El bloque de electrónica va ARRIBA, no atrás: puesto detrás
     quedaba justo en la línea de mira y tapaba la vista por
     completo (confirmado con raycasting desde el punto ocular).  */
  const bloqueTrasero = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.012, 0.022), MAT_METAL_CLARO);
  bloqueTrasero.position.set(0, 0.046, 0.024);
  grupo.add(bloqueTrasero);

  // ventana grande, ahora con cuerpo visible
  /* Ventana MUY tenue: con opacidad alta se veía la mira pero no se
     podía ver a través, que es justo para lo que sirve. El marco
     sólido (paredes + techo + bloque trasero) ya le da presencia
     visual, así que el cristal puede ser casi limpio.            */
  const MAT_VENTANA_HOLO = new THREE.MeshBasicMaterial({
    color: 0x8fd0e8, transparent: true, opacity: 0.13, depthWrite: false,
  });
  const ventana = new THREE.Mesh(new THREE.PlaneGeometry(0.032, 0.028), MAT_VENTANA_HOLO);
  ventana.position.set(0, 0.022, -0.008);
  grupo.add(ventana);
  // el punto de puntería, en el centro de la ventana
  const punto = new THREE.Mesh(new THREE.CircleGeometry(0.0025, 8), MAT_PUNTO_ROJO);
  punto.position.set(0, 0.022, -0.006);
  grupo.add(punto);
  // retícula de círculo partido, típica de las holográficas
  for (const [dx, dy] of [[-0.011, 0], [0.011, 0], [0, 0.011]]) {
    const marca = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.0012, 0.001), MAT_PUNTO_ROJO);
    marca.position.set(dx, 0.022 + dy, -0.006);
    if (dy !== 0) marca.rotation.z = Math.PI / 2;
    grupo.add(marca);
  }

  return { grupo, puntoOcular: new THREE.Vector3(0, 0.022, 0.12) };
}

function miraLaser() {
  const grupo = new THREE.Group();

  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.017, 0.017, 0.05), MAT_METAL);
  cuerpo.position.y = 0.0085;
  grupo.add(cuerpo);

  // lente emisora, oscura salvo cuando dispara la luz de verdad
  const emisor = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.01, 10), MAT_LENTE_OSCURA);
  emisor.rotation.x = Math.PI / 2;
  emisor.position.set(0, 0.0085, -0.03);
  grupo.add(emisor);

  const boton = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.004, 8), MAT_METAL_CLARO);
  boton.position.set(0.007, 0.017, 0.01);
  grupo.add(boton);

  // no es un óptico — no hay nada que "mirar a través", se
  // comporta como apuntar sin mira
  return { grupo, puntoOcular: new THREE.Vector3(0, 0.02, 0.04) };
}

function miraPrismatica(_puntaCañonLocal, huecoMira) {
  const grupo = new THREE.Group();

  const TOPE_BASE = 0.007;
  const profundidad = TOPE_BASE + (huecoMira ?? 0.008) + 0.005;
  const base = cajaBiselada(0.026, profundidad, 0.03, MAT_METAL, 0.0025);
  base.position.set(0, (TOPE_BASE - profundidad) / 2, 0.008);
  grupo.add(base);

  const ALTO_CUERPO = 0.035;
  /* Marco hueco, no un bloque sólido: paredes laterales, techo y
     piso, con el CENTRO abierto — un bloque macizo aquí tapaba por
     completo el camino óptico entre el ocular de atrás y la
     ventana de adelante (confirmado con raycasting: bloqueaba
     100% del campo de visión, sin importar el ángulo).           */
  for (const x of [-0.014, 0.014]) {
    const pared = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.032, 0.058), MAT_METAL);
    pared.position.set(x, ALTO_CUERPO, 0);
    grupo.add(pared);
  }
  const techo = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.005, 0.058), MAT_METAL);
  techo.position.set(0, ALTO_CUERPO + 0.0185, 0);
  grupo.add(techo);
  const piso = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.004, 0.058), MAT_METAL_CLARO);
  piso.position.set(0, ALTO_CUERPO - 0.0185, 0);
  grupo.add(piso);

  // la ventana del prisma, angulada — el detalle que la distingue
  // de cualquier otra mira: el "vidrio" no queda perpendicular al
  // cañón, va inclinado, como el prisma real que hay adentro
  const MAT_PRISMA = new THREE.MeshBasicMaterial({
    color: 0x7fd8b0, transparent: true, opacity: 0.16, depthWrite: false,
  });
  const ventanaPrisma = new THREE.Mesh(new THREE.PlaneGeometry(0.024, 0.03), MAT_PRISMA);
  ventanaPrisma.position.set(0, ALTO_CUERPO + 0.002, -0.028);
  ventanaPrisma.rotation.x = 0.32;
  grupo.add(ventanaPrisma);

  // capuchón del ocular, sobresale un poco atrás del cuerpo
  const ocular = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.018, 12, 1, true), MAT_TUBO);
  ocular.rotation.x = Math.PI / 2;
  ocular.position.set(0, ALTO_CUERPO, 0.04);
  grupo.add(ocular);

  // tapa de batería arriba — detalle chico, típico de estas miras
  const tapaBateria = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.006, 10), MAT_METAL_CLARO);
  tapaBateria.position.set(0, ALTO_CUERPO + 0.021, 0.015);
  grupo.add(tapaBateria);
  // ranuras de la tapa, para que no se vea un cilindro liso
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const ranura = new THREE.Mesh(new THREE.BoxGeometry(0.0012, 0.0062, 0.0012), MAT_METAL);
    ranura.position.set(Math.cos(a) * 0.0055, ALTO_CUERPO + 0.021, 0.015 + Math.sin(a) * 0.0055);
    grupo.add(ranura);
  }

  // retícula grabada — cruz simple, visible al centro del ocular
  const Z_RETICULA = 0.038;
  const cruzV = new THREE.Mesh(new THREE.BoxGeometry(0.0011, 0.02, 0.0006), MAT_RETICULA);
  cruzV.position.set(0, ALTO_CUERPO, Z_RETICULA);
  grupo.add(cruzV);
  const cruzH = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.0011, 0.0006), MAT_RETICULA);
  cruzH.position.set(0, ALTO_CUERPO, Z_RETICULA);
  grupo.add(cruzH);
  const puntoCentro = new THREE.Mesh(new THREE.CircleGeometry(0.0018, 8), MAT_PUNTO_ROJO);
  puntoCentro.position.set(0, ALTO_CUERPO, Z_RETICULA + 0.0004);
  grupo.add(puntoCentro);

  // distancia ocular generosa — lección aprendida de las otras
  // tres miras: con poca distancia, el borde del ocular tapa casi
  // todo el campo de visión real al apuntar.
  return { grupo, puntoOcular: new THREE.Vector3(0, ALTO_CUERPO, 0.15) };
}

function miraTelescopica(_puntaCañonLocal, huecoMira) {
  const grupo = new THREE.Group();
  const ALTO_TUBO = 0.03;    // eje del tubo sobre el punto de montaje

  // Patas de montaje: bajan lo justo para cubrir el hueco real del
  // cuerpo al que se monta, con traslape.
  const TOPE_PATA = 0.009;
  const profundidad = TOPE_PATA + (huecoMira ?? 0.008) + 0.006;
  const centroPata = (TOPE_PATA - profundidad) / 2;

  for (const z of [-0.03, 0.034]) {
    const pata = new THREE.Mesh(new THREE.BoxGeometry(0.022, profundidad, 0.016), MAT_METAL);
    pata.position.set(0, centroPata, z);
    grupo.add(pata);
    // anillo que abraza el tubo — cerrado por fuera, así se ve
    // como una montura de verdad y no como un aro flotando
    const anillo = new THREE.Mesh(new THREE.CylinderGeometry(0.0205, 0.0205, 0.014, 16, 1, true), MAT_TUBO);
    anillo.rotation.x = Math.PI / 2;
    anillo.position.set(0, ALTO_TUBO, z);
    grupo.add(anillo);
  }

  /* El tubo. Antes estaba hueco (openEnded) para poder "ver a
     través", pero eso lo volvía casi invisible desde fuera: se veía
     el fondo oscuro por dentro y parecía que no había nada. Ahora es
     un tubo SÓLIDO por fuera — la vista a través se resuelve con el
     punto ocular (arma.js coloca tu ojo justo en el lente trasero),
     no dejando el tubo transparente.                              */
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.125, 16, 1, true), MAT_TUBO);
  tubo.rotation.x = Math.PI / 2;
  tubo.position.set(0, ALTO_TUBO, 0.004);
  grupo.add(tubo);

  // campana delantera (objetivo) — más ancha, es lo que da la
  // silueta reconocible de un visor
  const campanaDelantera = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.0185, 0.038, 16, 1, true), MAT_TUBO);
  campanaDelantera.rotation.x = Math.PI / 2;
  campanaDelantera.position.set(0, ALTO_TUBO, -0.078);
  grupo.add(campanaDelantera);

  // campana trasera (ocular)
  const campanaTrasera = new THREE.Mesh(new THREE.CylinderGeometry(0.0235, 0.021, 0.036, 16, 1, true), MAT_TUBO);
  campanaTrasera.rotation.x = Math.PI / 2;
  campanaTrasera.position.set(0, ALTO_TUBO, 0.082);
  grupo.add(campanaTrasera);

  // torreta de elevación (arriba) y de deriva (lado) — detalle que
  // hace que se lea como óptica ajustable, no como un tubo liso
  const torretaArriba = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.016, 12), MAT_METAL_CLARO);
  torretaArriba.position.set(0, ALTO_TUBO + 0.019, 0.004);
  grupo.add(torretaArriba);
  const torretaLado = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.014, 12), MAT_METAL_CLARO);
  torretaLado.rotation.z = Math.PI / 2;
  torretaLado.position.set(0.019, ALTO_TUBO, 0.004);
  grupo.add(torretaLado);

  // anillo de zoom, con estrías
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const estria = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.02), MAT_METAL_CLARO);
    estria.position.set(Math.cos(a) * 0.0165, ALTO_TUBO + Math.sin(a) * 0.0165, 0.048);
    estria.rotation.z = a;
    grupo.add(estria);
  }

  // lente delantera y trasera, ahora con cuerpo visible
  /* Sin lente delantera: igual que la ocular, un disco ahí tapaba
     el camino de la vista. El tubo hueco ya se lee como óptica.  */

  /* Sin lente ocular: un disco de color ahí tapaba justo por donde
     miras. Se deja el hueco limpio y la cruceta hace todo el
     trabajo — es lo que de verdad usas para apuntar.             */

  /* La RETÍCULA: la cruz dentro del lente. Antes no existía — parte
     de que la mira "no tuviera nada" era literalmente eso: mirabas
     y no había ninguna marca. Va justo delante del lente ocular,
     para que se vea al apuntar.                                    */
  const Z_RETICULA = 0.094;
  const cruzV = new THREE.Mesh(new THREE.BoxGeometry(0.0016, 0.038, 0.0008), MAT_RETICULA);
  cruzV.position.set(0, ALTO_TUBO, Z_RETICULA);
  grupo.add(cruzV);
  const cruzH = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.0016, 0.0008), MAT_RETICULA);
  cruzH.position.set(0, ALTO_TUBO, Z_RETICULA);
  grupo.add(cruzH);
  // marcas de rango sobre el eje vertical — el detalle que hace que
  // se lea como retícula de francotirador y no como una cruz simple
  for (const dy of [-0.012, -0.008, -0.004, 0.008]) {
    const marca = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.0013, 0.0008), MAT_RETICULA);
    marca.position.set(0, ALTO_TUBO + dy, Z_RETICULA);
    grupo.add(marca);
  }
  const puntoCentro = new THREE.Mesh(new THREE.CircleGeometry(0.0018, 8), MAT_PUNTO_ROJO);
  puntoCentro.position.set(0, ALTO_TUBO, Z_RETICULA + 0.0006);
  grupo.add(puntoCentro);

  // el ojo va en el lente ocular, mirando a lo largo del tubo
  /* Distancia ocular real: antes el ojo quedaba a solo 1.4cm de la
     boca del tubo — prácticamente tocándola. Con eso, CUALQUIER
     ángulo que no fuera el centro exacto chocaba contra el borde
     del tubo (verificado con una rejilla de rayos cubriendo el
     campo de visión real: 100% bloqueado). Un visor de verdad
     tiene 6-10cm de distancia ocular — con eso el ojo queda lo
     bastante lejos como para que el borde del tubo no estorbe.  */
  return { grupo, puntoOcular: new THREE.Vector3(0, ALTO_TUBO, 0.17) };
}

const FABRICAS_MIRA = {
  ninguna: miraNinguna, hierro: miraHierro, reflex: miraReflex,
  holografica: miraHolografica, laser: miraLaser, telescopica: miraTelescopica,
  prismatica: miraPrismatica,
};

/* ── bocas de cañón — se montan en la PUNTA real del cañón       ─
   elegido (no en un punto fijo), así que reportan cuánto se
   alargan, igual que los cañones reportan su propia longitud.  */

function bocaNinguna() {
  return { grupo: new THREE.Group(), longitudExtra: 0 };
}

function bocaRompellamas(radioPunta = 0.017) {
  const grupo = new THREE.Group();
  const longitudExtra = 0.055;
  const radioBase = Math.max(0.018, radioPunta + 0.001);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(radioBase, radioBase, 0.015, 10), MAT_METAL);
  base.rotation.x = Math.PI / 2;
  base.position.z = -0.008;
  grupo.add(base);

  // jaula abierta: barras delgadas en vez de un cilindro sólido —
  // por eso se distingue tan claramente del compensador/silenciador
  const NUM_BARRAS = 6;
  const RADIO_BARRAS = Math.max(0.016, radioPunta - 0.001);
  for (let i = 0; i < NUM_BARRAS; i++) {
    const angulo = (i / NUM_BARRAS) * Math.PI * 2;
    const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, longitudExtra, 6), MAT_METAL);
    barra.rotation.x = Math.PI / 2;   // el bug: sin esto quedaban paradas, no a lo largo del cañón
    barra.position.set(
      Math.cos(angulo) * RADIO_BARRAS,
      Math.sin(angulo) * RADIO_BARRAS,
      -longitudExtra / 2 - 0.014
    );
    grupo.add(barra);
  }
  const anilloFrontal = new THREE.Mesh(new THREE.TorusGeometry(RADIO_BARRAS, 0.0025, 6, 12), MAT_METAL);
  anilloFrontal.position.z = -longitudExtra - 0.014;
  grupo.add(anilloFrontal);

  return { grupo, longitudExtra: longitudExtra + 0.014 };
}

function bocaCompensador(radioPunta = 0.017) {
  const grupo = new THREE.Group();
  const longitudExtra = 0.045;
  const radio = Math.max(0.021, radioPunta + 0.001);
  /* Perfil torneado en vez de cilindro recto: collar de montaje
     donde se une al cañón, cuerpo principal, y una leve conicidad
     hacia la punta — como un compensador mecanizado de verdad. */
  const cuerpo = torneado([
    [0.006, radio * 0.82],
    [0.006, radio],
    [-0.008, radio],
    [-longitudExtra * 0.5, radio * 0.98],
    [-longitudExtra + 0.006, radio * 0.9],
    [-longitudExtra, radio * 0.72],
    [-longitudExtra, 0],
  ], MAT_METAL, { segmentos: 14 });
  cuerpo.position.z = 0;
  grupo.add(cuerpo);
  return { grupo, longitudExtra };
}

function bocaSilenciador(radioPunta = 0.017) {
  const grupo = new THREE.Group();
  const longitudExtra = 0.16;
  const radio = Math.max(0.024, radioPunta + 0.001);
  // extremos redondeados en vez de un tubo cortado a escuadra
  const cuerpo = torneado(perfilSilenciador(longitudExtra, radio), MAT_METAL, { segmentos: 16 });
  grupo.add(cuerpo);
  // anillos de agarre — detalle que rompe la superficie lisa
  for (let i = 1; i <= 3; i++) {
    const anillo = new THREE.Mesh(new THREE.TorusGeometry(radio * 0.94, 0.0015, 6, 16), MAT_METAL_CLARO);
    anillo.rotation.y = Math.PI / 2;
    anillo.position.z = -longitudExtra * (i / 4);
    grupo.add(anillo);
  }
  return { grupo, longitudExtra };
}

function bocaCompensadorPesado(radioPunta = 0.017) {
  const grupo = new THREE.Group();
  const longitudExtra = 0.07;
  const radio = Math.max(0.026, radioPunta + 0.001);
  // torneado, con un collar de montaje más ancho donde se une al
  // cañón — antes era un cilindro recto sin ninguna transición
  const cuerpo = torneado([
    [0.006, radio * 0.78], [0.006, radio * 1.08], [-0.006, radio * 1.08],
    [-0.01, radio], [-longitudExtra + 0.006, radio * 0.97],
    [-longitudExtra, radio * 0.8], [-longitudExtra, 0],
  ], MAT_METAL_CLARO, { segmentos: 12 });
  grupo.add(cuerpo);

  // ranuras de gas — dos filas de cortes, lo que más distingue
  // a este del compensador simple (que es liso)
  for (const z of [-0.02, -0.045]) {
    for (const angulo of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const ranura = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.006), MAT_LENTE_OSCURA);
      ranura.position.set(Math.cos(angulo) * (radio + 0.001), Math.sin(angulo) * (radio + 0.001), z);
      ranura.rotation.z = angulo;
      grupo.add(ranura);
    }
  }

  return { grupo, longitudExtra };
}

/* Freno ranurado: perfil torneado con dos filas de ranuras
   LARGAS a los costados (no cortes chicos como el compensador
   pesado) — más parecido a un freno de competición real, con la
   silueta abierta a los lados en vez de perforaciones redondas. */
function bocaFrenoRanurado(radioPunta = 0.017) {
  const grupo = new THREE.Group();
  const longitudExtra = 0.06;
  const radio = Math.max(0.022, radioPunta + 0.001);
  const cuerpo = torneado([
    [0.006, radio * 0.85], [0.006, radio], [-0.01, radio],
    [-longitudExtra + 0.008, radio * 0.96], [-longitudExtra, radio * 0.7], [-longitudExtra, 0],
  ], MAT_METAL, { segmentos: 14 });
  grupo.add(cuerpo);

  // dos ranuras largas a cada lado, no perforaciones redondas —
  // es lo que lo distingue de un vistazo del compensador pesado
  for (const lado of [-1, 1]) {
    for (const zCentro of [-0.018, -0.04]) {
      const ranura = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.009, 0.02), MAT_LENTE_OSCURA);
      ranura.position.set(lado * (radio * 0.7), 0, zCentro);
      grupo.add(ranura);
    }
  }
  return { grupo, longitudExtra };
}

const FABRICAS_BOCA = {
  ninguna: bocaNinguna, rompellamas: bocaRompellamas,
  compensador: bocaCompensador, silenciador: bocaSilenciador,
  compensadorPesado: bocaCompensadorPesado, frenoRanurado: bocaFrenoRanurado,
};

/* ── empuñaduras inferiores — se montan bajo el cañón,          ─
   en el punto de empuñadura del cuerpo (independiente de la
   boca de cañón, que va en la punta)                            */

function empuñaduraNinguna() {
  return new THREE.Group();
}

function empuñaduraVertical() {
  const grupo = new THREE.Group();
  const cuerpo = cajaBiselada(0.028, 0.06, 0.03, MAT_GRIP, 0.004);
  cuerpo.position.y = -0.03;
  grupo.add(cuerpo);
  texturaAgarreDiseno(grupo, { x:0, y:-0.03, z:0, ancho:0.024, alto:0.05, filas:5, columnas:3 });
  return grupo;
}

function empuñaduraAngulada() {
  const grupo = new THREE.Group();
  const cuerpo = cajaBiselada(0.026, 0.05, 0.032, MAT_GRIP, 0.0035);
  cuerpo.position.y = -0.024;
  cuerpo.rotation.x = 0.5;   // angulada hacia adelante — perfil distinto a la vertical
  grupo.add(cuerpo);
  return grupo;
}

function empuñaduraBipode() {
  const grupo = new THREE.Group();
  const base = cajaBiselada(0.024, 0.014, 0.03, MAT_METAL, 0.002);
  grupo.add(base);
  // dos patas plegables en ángulo — lo que más distingue al bípode
  // de cualquier otra empuñadura
  for (const lado of [-1, 1]) {
    const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.0035, 0.075, 6), MAT_METAL);
    pata.position.set(lado * 0.02, -0.04, 0);
    pata.rotation.z = lado * 0.35;
    grupo.add(pata);
    const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.006, 8), MAT_GRIP);
    pie.position.set(lado * 0.045, -0.075, 0);
    grupo.add(pie);
  }
  return grupo;
}

/* Tope de mano: mucho más corto que una empuñadura vertical, sin
   forma de sostener toda la mano — solo un tope contra el que
   apoyar la palma, con textura de agarre en el frente.          */
function empuñaduraTopeMano() {
  const grupo = new THREE.Group();
  const cuerpo = cajaBiselada(0.03, 0.024, 0.026, MAT_GRIP, 0.004);
  cuerpo.position.y = -0.012;
  grupo.add(cuerpo);
  texturaAgarreDiseno(grupo, { x: 0, y: -0.012, z: 0.011, ancho: 0.024, alto: 0.018, filas: 3, columnas: 3 });
  return grupo;
}

const FABRICAS_EMPUÑADURA = {
  ninguna: empuñaduraNinguna, vertical: empuñaduraVertical,
  angulada: empuñaduraAngulada, bipode: empuñaduraBipode,
  topeMano: empuñaduraTopeMano,
};

/* ── ensamblado final ─────────────────────────────────────────
   Recibe las CLAVES elegidas (strings como 'pistola', 'largo' —
   no los objetos de estadísticas de piezas.js) y arma el grupo
   3D completo, ya posicionado pieza por pieza según los puntos
   de anclaje del cuerpo elegido.                                */
export function construirModeloArma({ cuerpo, cañon, cargador, mira, boca, empuñadura, acabado }) {
  const fabricaCuerpo = FABRICAS_CUERPO[cuerpo] || FABRICAS_CUERPO.pistola;
  const fabricaCañon = FABRICAS_CAÑON[cañon] || FABRICAS_CAÑON.estandar;
  const fabricaCargador = FABRICAS_CARGADOR[cargador] || FABRICAS_CARGADOR.medio;
  const fabricaMira = FABRICAS_MIRA[mira] || FABRICAS_MIRA.ninguna;
  const fabricaBoca = FABRICAS_BOCA[boca] || FABRICAS_BOCA.ninguna;
  const fabricaEmpuñadura = FABRICAS_EMPUÑADURA[empuñadura] || FABRICAS_EMPUÑADURA.ninguna;

  const grupo = new THREE.Group();

  const partesCuerpo = fabricaCuerpo();
  grupo.add(partesCuerpo.grupo);

  const partesCañon = fabricaCañon();
  partesCañon.grupo.position.copy(partesCuerpo.puntoCañon);
  grupo.add(partesCañon.grupo);

  const cargadorMesh = fabricaCargador();
  cargadorMesh.position.add(partesCuerpo.puntoCargador);
  grupo.add(cargadorMesh);

  // la punta REAL del cañón elegido — se necesita ANTES de armar
  // la mira, porque el poste delantero de la mira de hierro debe
  // colocarse ahí (antes estaba en una posición fija sin importar
  // el cañón, y con uno largo quedaba 27cm atrás de la punta real)
  const puntaCañonBase = partesCuerpo.puntoCañon.clone();
  puntaCañonBase.z -= partesCañon.longitud;
  // convertido al espacio LOCAL de la mira: la mira se agrega en
  // puntoMira, así que su punto delantero debe compensar esa resta
  const puntaCañonLocalAMira = puntaCañonBase.clone().sub(partesCuerpo.puntoMira);

  const partesMira = fabricaMira(puntaCañonLocalAMira, partesCuerpo.huecoMira);
  partesMira.grupo.position.add(partesCuerpo.puntoMira);
  grupo.add(partesMira.grupo);

  const empuñaduraMesh = fabricaEmpuñadura();
  empuñaduraMesh.position.add(partesCuerpo.puntoEmpuñadura);
  grupo.add(empuñaduraMesh);

  // la boca de cañón también se monta en la punta real
  // la boca también recibe el radio real de la punta — antes tenía
  // un radio fijo, y con el cañón pesado (el más grueso) quedaba
  // hasta 25% más angosta que el cañón, viéndose claramente rota
  const partesBoca = fabricaBoca(partesCañon.radioPunta);
  partesBoca.grupo.position.copy(puntaCañonBase);
  grupo.add(partesBoca.grupo);

  grupo.traverse((o) => { if (o.isMesh) o.castShadow = true; });

  // el acabado recolorea SOLO este modelo — nunca el material
  // compartido, o cambiaría todas las armas del juego a la vez
  if (acabado && acabado !== 'fabrica' && ACABADOS[acabado]) {
    aplicarAcabado(grupo, ACABADOS[acabado].color);
  }

  const puntaCañon = puntaCañonBase.clone();
  puntaCañon.z -= partesBoca.longitudExtra;

  // dónde va tu ojo al apuntar — el punto de montaje de la mira
  // MÁS el punto ocular propio de esa mira específica. Partiendo de
  // ahí, arma.js movería TODA el arma para que ese punto exacto
  // quedara frente a la cámara — pero eso podía empujar partes
  // traseras del arma (el grip, sobre todo en armas grandes) hasta
  // quedar DETRÁS de la cámara, viéndose como si la atravesaras.
  const puntoOcular = partesCuerpo.puntoMira.clone().add(partesMira.puntoOcular);

  // el punto más "atrás" (Z más alta) de todo el modelo — el que
  // primero se arriesga a cruzar la cámara al mover el arma
  /* El punto más "atrás" que de verdad importa es hasta donde
     llega el GRIP — ahí está tu mano, y eso sí se ve mal si
     atraviesa la cámara. Una culata o guardamanos que se extiendan
     más allá NO deben contar: contra el hombro, es normal y
     realista que queden detrás de tu cabeza al apuntar, igual que
     en cualquier juego en primera persona. Antes esto escaneaba
     TODA la geometría, y con las culatas nuevas del rediseño el
     margen se disparaba hasta 0.55m — la mira dejaba de alinearse
     con la cámara por completo, que es justo por lo que ya no se
     veía nada al apuntar con la telescópica ni la holográfica.  */
  const LIMITE_ZONA_GRIP = partesCuerpo.puntoEmpuñadura.z + 0.06;
  let zMasAtras = -Infinity;
  grupo.traverse((o) => {
    if (!o.isMesh) return;
    const caja = new THREE.Box3().setFromObject(o);
    if (caja.max.z > zMasAtras && caja.max.z <= LIMITE_ZONA_GRIP) zMasAtras = caja.max.z;
  });
  if (zMasAtras === -Infinity) zMasAtras = LIMITE_ZONA_GRIP;

  const posApuntando = puntoOcular.clone().negate();
  const MARGEN_SEGURIDAD_Z = -0.03;   // qué tan cerca de la cámara se permite el punto más atrás
  // — recalibrado: antes escaneaba TODA la geometría (hasta 0.4m de
  // extensión real), ahora que el escaneo se limita a la zona del
  // grip, los valores encontrados son mucho más chicos, y el margen
  // viejo (-0.16) era excesivo para eso, rompiendo la alineación de
  // las miras por completo.
  const zFinalPuntoMasAtras = zMasAtras + posApuntando.z;
  if (zFinalPuntoMasAtras > MARGEN_SEGURIDAD_Z) {
    // empuja el punto de apuntado más lejos (más negativo en Z) lo
    // justo para que el punto más atrás quede a salvo — la mira ya
    // no queda perfecta al centro, pero nunca atraviesas el arma
    posApuntando.z -= (zFinalPuntoMasAtras - MARGEN_SEGURIDAD_Z);
  }

  return { grupo, puntaCañon, puntoOcular, posApuntando };
}

/* Clona y recolorea solo los materiales metálicos DE ESTE grupo —
   identificados por referencia a los materiales compartidos, no
   por nombre ni por color (así funciona sin importar qué piezas
   se hayan combinado).                                           */
function aplicarAcabado(grupo, colorHex) {
  const colorBase = new THREE.Color(colorHex);
  const colorClaro = colorBase.clone().lerp(new THREE.Color(0xffffff), 0.22);
  grupo.traverse((o) => {
    if (!o.isMesh) return;
    if (o.material === MAT_METAL) {
      o.material = MAT_METAL.clone();
      o.material.color.copy(colorBase);
    } else if (o.material === MAT_METAL_CLARO) {
      o.material = MAT_METAL_CLARO.clone();
      o.material.color.copy(colorClaro);
    }
  });
}

/* Libera la geometría/materiales de un modelo que ya no se usa —
   evita fugas de memoria cada vez que cambias de arma en la mesa. */
export function liberarModeloArma(modelo) {
  modelo.grupo.traverse((o) => {
    if (o.isMesh) {
      o.geometry.dispose();
      // los materiales compartidos (MAT_METAL, etc.) NO se liberan
      // aquí a propósito — los sigue usando el resto de armas. Los
      // materiales CLONADOS por un acabado sí son exclusivos de
      // este modelo, así que también se liberan.
      if (o.material && o.material !== MAT_METAL && o.material !== MAT_METAL_CLARO
        && o.material !== MAT_GRIP && o.material !== MAT_LENTE_ROJA
        && o.material !== MAT_LENTE_ESCOPE && o.material !== MAT_LENTE_OSCURA) {
        o.material.dispose();
      }
    }
  });
}

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
import { ACABADOS } from './piezas.js';

const MAT_METAL = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.4, metalness: 0.6 });
const MAT_METAL_CLARO = new THREE.MeshStandardMaterial({ color: 0x3c3c40, roughness: 0.3, metalness: 0.75 });
const MAT_GRIP = new THREE.MeshStandardMaterial({ color: 0x1c1b19, roughness: 0.85, metalness: 0.1 });
const MAT_LENTE_ROJA = new THREE.MeshBasicMaterial({ color: 0xff3322 });
const MAT_LENTE_ESCOPE = new THREE.MeshBasicMaterial({ color: 0x3d6fb0 });
const MAT_LENTE_OSCURA = new THREE.MeshBasicMaterial({ color: 0x0c1220 });

/* ── cuerpos ─────────────────────────────────────────────── */

function cuerpoPistola() {
  const grupo = new THREE.Group();

  const bloque = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.10, 0.19), MAT_METAL);
  grupo.add(bloque);

  const ventanaExpulsion = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.022, 0.05), MAT_LENTE_OSCURA);
  ventanaExpulsion.position.set(0.036, 0.02, -0.01);
  grupo.add(ventanaExpulsion);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.13, 0.06), MAT_GRIP);
  grip.position.set(0, -0.10, 0.055);
  grip.rotation.x = 0.22;
  grupo.add(grip);

  const gatillo = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.028, 0.01), MAT_GRIP);
  gatillo.position.set(0, -0.045, 0.01);
  grupo.add(gatillo);

  return {
    grupo,
    puntoCañon: new THREE.Vector3(0, 0.01, -0.095),
    puntoCargador: new THREE.Vector3(0, -0.14, 0.06),
    puntoMira: new THREE.Vector3(0, 0.058, -0.02),
    puntoEmpuñadura: new THREE.Vector3(0, -0.048, -0.05),
  };
}

function cuerpoSubfusil() {
  const grupo = new THREE.Group();

  const bloque = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.115, 0.27), MAT_METAL);
  grupo.add(bloque);

  const ventanaExpulsion = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.026, 0.07), MAT_LENTE_OSCURA);
  ventanaExpulsion.position.set(0.043, 0.022, -0.02);
  grupo.add(ventanaExpulsion);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.06), MAT_GRIP);
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

  return {
    grupo,
    puntoCañon: new THREE.Vector3(0, 0.015, -0.135),
    puntoCargador: new THREE.Vector3(0, -0.15, 0.06),
    puntoMira: new THREE.Vector3(0, 0.0655, -0.03),
    puntoEmpuñadura: new THREE.Vector3(0, -0.052, -0.075),
  };
}

function cuerpoRifle() {
  const grupo = new THREE.Group();

  const bloque = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.12, 0.34), MAT_METAL);
  grupo.add(bloque);

  const ventanaExpulsion = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.028, 0.08), MAT_LENTE_OSCURA);
  ventanaExpulsion.position.set(0.0455, 0.023, -0.03);
  grupo.add(ventanaExpulsion);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.06), MAT_GRIP);
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

  return {
    grupo,
    puntoCañon: new THREE.Vector3(0, 0.02, -0.17),
    puntoCargador: new THREE.Vector3(0, -0.155, 0.03),
    puntoMira: new THREE.Vector3(0, 0.068, -0.05),
    puntoEmpuñadura: new THREE.Vector3(0, -0.055, -0.1),
  };
}

function cuerpoEscopeta() {
  const grupo = new THREE.Group();

  const receptor = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.105, 0.22), MAT_METAL);
  grupo.add(receptor);

  // guardamanos ancho, característico de una escopeta
  const guardamanos = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.14), MAT_GRIP);
  guardamanos.position.set(0, -0.02, -0.15);
  grupo.add(guardamanos);

  // culata robusta y recta
  const culata = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.085, 0.17), MAT_GRIP);
  culata.position.set(0, 0.005, 0.185);
  grupo.add(culata);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.13, 0.06), MAT_GRIP);
  grip.position.set(0, -0.1, 0.07);
  grip.rotation.x = 0.2;
  grupo.add(grip);

  const gatillo = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.026, 0.01), MAT_GRIP);
  gatillo.position.set(0, -0.045, 0.03);
  grupo.add(gatillo);

  return {
    grupo,
    puntoCañon: new THREE.Vector3(0, 0.012, -0.11),
    puntoCargador: new THREE.Vector3(0, -0.155, 0.02),
    puntoMira: new THREE.Vector3(0, 0.0605, -0.03),
    puntoEmpuñadura: new THREE.Vector3(0, -0.052, -0.14),
  };
}

function cuerpoRevolver() {
  const grupo = new THREE.Group();

  const marco = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.1), MAT_METAL);
  marco.position.z = 0.02;
  grupo.add(marco);

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

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.115, 0.055), MAT_GRIP);
  grip.position.set(0, -0.09, 0.05);
  grip.rotation.x = 0.28;
  grupo.add(grip);

  const gatillo = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.024, 0.009), MAT_GRIP);
  gatillo.position.set(0, -0.035, 0.015);
  grupo.add(gatillo);

  return {
    grupo,
    puntoCañon: new THREE.Vector3(0, 0.005, -0.07),
    puntoCargador: new THREE.Vector3(0, -0.13, 0.05),
    puntoMira: new THREE.Vector3(0, 0.053, 0.02),
    puntoEmpuñadura: new THREE.Vector3(0, -0.045, -0.04),
  };
}

function cuerpoAutomatica() {
  const grupo = new THREE.Group();

  const bloque = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.095, 0.15), MAT_METAL);
  grupo.add(bloque);

  const ventanaExpulsion = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.02, 0.04), MAT_LENTE_OSCURA);
  ventanaExpulsion.position.set(0.034, 0.018, -0.01);
  grupo.add(ventanaExpulsion);

  // grip más inclinado que la pistola normal — perfil compacto,
  // de disparo rápido a corta distancia
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.115, 0.055), MAT_GRIP);
  grip.position.set(0, -0.09, 0.045);
  grip.rotation.x = 0.32;
  grupo.add(grip);

  const gatillo = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.024, 0.009), MAT_GRIP);
  gatillo.position.set(0, -0.038, 0.005);
  grupo.add(gatillo);

  return {
    grupo,
    puntoCañon: new THREE.Vector3(0, 0.008, -0.075),
    puntoCargador: new THREE.Vector3(0, -0.11, 0.045),
    puntoMira: new THREE.Vector3(0, 0.0555, -0.015),
    puntoEmpuñadura: new THREE.Vector3(0, -0.042, -0.045),
  };
}

function cuerpoLmg() {
  const grupo = new THREE.Group();

  const receptor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.13, 0.3), MAT_METAL);
  grupo.add(receptor);

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

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.06), MAT_GRIP);
  grip.position.set(0, -0.115, 0.05);
  grip.rotation.x = 0.16;
  grupo.add(grip);

  const gatillo = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.028, 0.01), MAT_GRIP);
  gatillo.position.set(0, -0.048, 0.015);
  grupo.add(gatillo);

  return {
    grupo,
    puntoCañon: new THREE.Vector3(0, 0.02, -0.15),
    // más al frente que en los demás cuerpos — la caja de munición
    // de una LMG suele ir bajo el receptor, no detrás del grip
    puntoCargador: new THREE.Vector3(0, -0.16, -0.02),
    puntoMira: new THREE.Vector3(0, 0.09, -0.05),
    puntoEmpuñadura: new THREE.Vector3(0, -0.062, -0.11),
  };
}

function cuerpoFrancotirador() {
  const grupo = new THREE.Group();

  const receptor = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.09, 0.24), MAT_METAL);
  grupo.add(receptor);

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

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.12, 0.055), MAT_GRIP);
  grip.position.set(0, -0.1, 0.06);
  grip.rotation.x = 0.14;
  grupo.add(grip);

  const gatillo = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.026, 0.01), MAT_GRIP);
  gatillo.position.set(0, -0.042, 0.025);
  grupo.add(gatillo);

  return {
    grupo,
    puntoCañon: new THREE.Vector3(0, 0.018, -0.12),
    puntoCargador: new THREE.Vector3(0, -0.14, 0.06),
    puntoMira: new THREE.Vector3(0, 0.053, -0.04),
    puntoEmpuñadura: new THREE.Vector3(0, -0.05, -0.08),
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
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.017, longitud, 12), MAT_METAL);
  tubo.rotation.x = Math.PI / 2;
  tubo.position.z = -longitud / 2;
  grupo.add(tubo);
  return { grupo, longitud };
}

function cañonEstandar() {
  const grupo = new THREE.Group();
  const longitud = 0.22;
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, longitud, 12), MAT_METAL);
  tubo.rotation.x = Math.PI / 2;
  tubo.position.z = -longitud / 2;
  grupo.add(tubo);
  return { grupo, longitud };
}

function cañonLargo() {
  const grupo = new THREE.Group();
  const longitud = 0.36;
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.019, longitud, 12), MAT_METAL);
  tubo.rotation.x = Math.PI / 2;
  tubo.position.z = -longitud / 2;
  grupo.add(tubo);

  const guardamanos = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.045, 0.24), MAT_GRIP);
  guardamanos.position.set(0, -0.028, -0.12);
  grupo.add(guardamanos);

  return { grupo, longitud };
}

function cañonPesado() {
  const grupo = new THREE.Group();
  const longitud = 0.26;
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.024, longitud, 12), MAT_METAL);
  tubo.rotation.x = Math.PI / 2;
  tubo.position.z = -longitud / 2;
  grupo.add(tubo);

  // aletas de disipación — más ancho que cualquier otro cañón,
  // se lee como "pesado" a simple vista
  for (let i = 0; i < 3; i++) {
    const aleta = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.006, 0.022), MAT_METAL_CLARO);
    aleta.position.set(0, 0.022, -0.05 - i * 0.055);
    grupo.add(aleta);
  }

  return { grupo, longitud };
}

const FABRICAS_CAÑON = { corto: cañonCorto, estandar: cañonEstandar, largo: cañonLargo, pesado: cañonPesado };

/* ── cargadores — cuelgan del punto de cargador del cuerpo ──── */

function cargadorPequeño() {
  const grupo = new THREE.Group();
  const alto = 0.062;
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.032, alto, 0.045), MAT_METAL);
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
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.032, alto, 0.045), MAT_METAL);
  cuerpo.position.y = -alto / 2;
  grupo.add(cuerpo);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.009, 0.05), MAT_METAL_CLARO);
  base.position.y = -alto - 0.0045;
  grupo.add(base);
  return grupo;
}

function cargadorGrande() {
  // ligera inclinación hacia adelante — sugiere cargador "banana"
  // sin necesitar geometría curva de verdad
  const grupo = new THREE.Group();
  const alto = 0.175;
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.032, alto, 0.045), MAT_METAL);
  cuerpo.position.y = -alto / 2;
  grupo.add(cuerpo);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.052), MAT_METAL_CLARO);
  base.position.y = -alto - 0.005;
  grupo.add(base);
  grupo.rotation.x = -0.09;
  return grupo;
}

function cargadorTambor() {
  const grupo = new THREE.Group();
  const radio = 0.05;
  // eje del cilindro apuntando de lado (no hacia arriba/abajo),
  // así la cara circular del tambor se ve de frente — la silueta
  // más distinta de las cuatro
  const disco = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, 0.038, 18), MAT_METAL);
  disco.rotation.z = Math.PI / 2;
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

function miraHierro() {
  const grupo = new THREE.Group();

  const alzaBase = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.005, 0.01), MAT_METAL);
  alzaBase.position.set(0, 0.0045, 0.02);
  grupo.add(alzaBase);
  const alzaPostIzq = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.009, 0.008), MAT_METAL);
  alzaPostIzq.position.set(-0.007, 0.011, 0.02);
  grupo.add(alzaPostIzq);
  const alzaPostDer = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.009, 0.008), MAT_METAL);
  alzaPostDer.position.set(0.007, 0.011, 0.02);
  grupo.add(alzaPostDer);

  const puntoPoste = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.013, 0.005), MAT_METAL);
  puntoPoste.position.set(0, 0.0075, -0.16);
  grupo.add(puntoPoste);
  const puntoBola = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 6), MAT_METAL);
  puntoBola.position.set(0, 0.015, -0.16);
  grupo.add(puntoBola);

  // el ojo va DETRÁS de la muesca trasera, mirando a través de
  // ella hacia el punto delantero — no en el punto delantero
  return { grupo, puntoOcular: new THREE.Vector3(0, 0.011, 0.05) };
}

function miraReflex() {
  const grupo = new THREE.Group();

  const riel = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.007, 0.042), MAT_METAL);
  riel.position.y = 0.0035;
  grupo.add(riel);

  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.023, 0.044), MAT_METAL_CLARO);
  cuerpo.position.set(0, 0.0185, 0.003);
  grupo.add(cuerpo);

  const ventana = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.017), MAT_LENTE_ROJA);
  ventana.position.set(0, 0.019, -0.02);
  ventana.rotation.x = -0.2;
  grupo.add(ventana);

  const perilla = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.006, 8), MAT_METAL);
  perilla.rotation.z = Math.PI / 2;
  perilla.position.set(0.014, 0.019, 0.008);
  grupo.add(perilla);

  // el ojo va justo detrás de la ventana, no dentro del cuerpo sólido
  return { grupo, puntoOcular: new THREE.Vector3(0, 0.019, 0.018) };
}

function miraHolografica() {
  const grupo = new THREE.Group();

  const riel = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.007, 0.05), MAT_METAL);
  riel.position.y = 0.0035;
  grupo.add(riel);

  // cuerpo más grande y recto que el reflex — perfil de caja, no
  // de gota
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.027, 0.052), MAT_METAL_CLARO);
  cuerpo.position.set(0, 0.0205, 0.002);
  grupo.add(cuerpo);

  // ventana grande y vertical, sin inclinar — el holográfico se
  // mira derecho, no en ángulo como el reflex
  const ventana = new THREE.Mesh(new THREE.PlaneGeometry(0.024, 0.022), MAT_LENTE_ROJA);
  ventana.position.set(0, 0.021, -0.025);
  grupo.add(ventana);

  return { grupo, puntoOcular: new THREE.Vector3(0, 0.021, 0.015) };
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

function miraTelescopica() {
  const grupo = new THREE.Group();
  const ALTO_TUBO = 0.026;   // altura del eje del tubo sobre el riel

  for (const z of [-0.028, 0.032]) {
    // más alta que antes, y bajando por debajo del punto de anclaje
    // — antes se quedaba justo en el punto de montaje sin llegar
    // a tocar el cuerpo, dejando un hueco visible ("se veía partida")
    const pata = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.024, 0.014), MAT_METAL);
    pata.position.set(0, -0.003, z);
    grupo.add(pata);
    const anillo = new THREE.Mesh(new THREE.CylinderGeometry(0.0175, 0.0175, 0.012, 14), MAT_METAL);
    anillo.rotation.x = Math.PI / 2;
    anillo.position.set(0, ALTO_TUBO, z);
    grupo.add(anillo);
  }

  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.11, 14), MAT_METAL);
  tubo.rotation.x = Math.PI / 2;
  tubo.position.set(0, ALTO_TUBO, 0.003);
  grupo.add(tubo);

  const campanaDelantera = new THREE.Mesh(new THREE.CylinderGeometry(0.0185, 0.0165, 0.032, 14), MAT_METAL);
  campanaDelantera.rotation.x = Math.PI / 2;
  campanaDelantera.position.set(0, ALTO_TUBO, -0.055);
  grupo.add(campanaDelantera);

  const campanaTrasera = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.0185, 0.034, 14), MAT_METAL);
  campanaTrasera.rotation.x = Math.PI / 2;
  campanaTrasera.position.set(0, ALTO_TUBO, 0.058);
  grupo.add(campanaTrasera);

  const torretaElevacion = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.008, 0.015, 10), MAT_METAL);
  torretaElevacion.position.set(0, ALTO_TUBO + 0.019, 0.003);
  grupo.add(torretaElevacion);
  const perillaElevacion = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 10), MAT_METAL_CLARO);
  perillaElevacion.position.set(0, ALTO_TUBO + 0.028, 0.003);
  grupo.add(perillaElevacion);

  const torretaLateral = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.007, 0.012, 10), MAT_METAL);
  torretaLateral.rotation.z = Math.PI / 2;
  torretaLateral.position.set(0.019, ALTO_TUBO, 0.016);
  grupo.add(torretaLateral);

  const lenteDelantera = new THREE.Mesh(new THREE.CircleGeometry(0.015, 14), MAT_LENTE_OSCURA);
  lenteDelantera.position.set(0, ALTO_TUBO, -0.0705);
  lenteDelantera.rotation.x = Math.PI / 2;
  grupo.add(lenteDelantera);

  const lenteOcular = new THREE.Mesh(new THREE.CircleGeometry(0.0185, 14), MAT_LENTE_ESCOPE);
  lenteOcular.position.set(0, ALTO_TUBO, 0.075);
  lenteOcular.rotation.x = -Math.PI / 2;
  grupo.add(lenteOcular);

  // el ojo va justo en el lente ocular, mirando a través del tubo —
  // sin esto, apuntar con la telescópica mostraba el tubo sólido
  // de lado en vez de mirar de verdad a través de ella
  return { grupo, puntoOcular: new THREE.Vector3(0, ALTO_TUBO, 0.082) };
}

const FABRICAS_MIRA = {
  ninguna: miraNinguna, hierro: miraHierro, reflex: miraReflex,
  holografica: miraHolografica, laser: miraLaser, telescopica: miraTelescopica,
};

/* ── bocas de cañón — se montan en la PUNTA real del cañón       ─
   elegido (no en un punto fijo), así que reportan cuánto se
   alargan, igual que los cañones reportan su propia longitud.  */

function bocaNinguna() {
  return { grupo: new THREE.Group(), longitudExtra: 0 };
}

function bocaRompellamas() {
  const grupo = new THREE.Group();
  const longitudExtra = 0.055;

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.015, 10), MAT_METAL);
  base.rotation.x = Math.PI / 2;
  base.position.z = -0.008;
  grupo.add(base);

  // jaula abierta: barras delgadas en vez de un cilindro sólido —
  // por eso se distingue tan claramente del compensador/silenciador
  const NUM_BARRAS = 6;
  const RADIO_BARRAS = 0.016;
  for (let i = 0; i < NUM_BARRAS; i++) {
    const angulo = (i / NUM_BARRAS) * Math.PI * 2;
    const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, longitudExtra, 6), MAT_METAL);
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

function bocaCompensador() {
  const grupo = new THREE.Group();
  const longitudExtra = 0.045;
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, longitudExtra, 10), MAT_METAL);
  cuerpo.rotation.x = Math.PI / 2;
  cuerpo.position.z = -longitudExtra / 2;
  grupo.add(cuerpo);
  return { grupo, longitudExtra };
}

function bocaSilenciador() {
  const grupo = new THREE.Group();
  const longitudExtra = 0.16;
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, longitudExtra, 12), MAT_METAL);
  cuerpo.rotation.x = Math.PI / 2;
  cuerpo.position.z = -longitudExtra / 2;
  grupo.add(cuerpo);
  return { grupo, longitudExtra };
}

const FABRICAS_BOCA = {
  ninguna: bocaNinguna, rompellamas: bocaRompellamas,
  compensador: bocaCompensador, silenciador: bocaSilenciador,
};

/* ── empuñaduras inferiores — se montan bajo el cañón,          ─
   en el punto de empuñadura del cuerpo (independiente de la
   boca de cañón, que va en la punta)                            */

function empuñaduraNinguna() {
  return new THREE.Group();
}

function empuñaduraVertical() {
  const grupo = new THREE.Group();
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.06, 0.03), MAT_GRIP);
  cuerpo.position.y = -0.03;
  grupo.add(cuerpo);
  return grupo;
}

function empuñaduraAngulada() {
  const grupo = new THREE.Group();
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.05, 0.032), MAT_GRIP);
  cuerpo.position.y = -0.024;
  cuerpo.rotation.x = 0.5;   // angulada hacia adelante — perfil distinto a la vertical
  grupo.add(cuerpo);
  return grupo;
}

function empuñaduraBipode() {
  const grupo = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.014, 0.03), MAT_METAL);
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

const FABRICAS_EMPUÑADURA = {
  ninguna: empuñaduraNinguna, vertical: empuñaduraVertical,
  angulada: empuñaduraAngulada, bipode: empuñaduraBipode,
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

  const partesMira = fabricaMira();
  partesMira.grupo.position.add(partesCuerpo.puntoMira);
  grupo.add(partesMira.grupo);

  const empuñaduraMesh = fabricaEmpuñadura();
  empuñaduraMesh.position.add(partesCuerpo.puntoEmpuñadura);
  grupo.add(empuñaduraMesh);

  // la boca de cañón se monta en la punta REAL del cañón elegido
  const puntaCañonBase = partesCuerpo.puntoCañon.clone();
  puntaCañonBase.z -= partesCañon.longitud;
  const partesBoca = fabricaBoca();
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
  // MÁS el punto ocular propio de esa mira específica. arma.js usa
  // esto para mover el arma de manera que ese punto exacto quede
  // frente a la cámara al apuntar — así de verdad ves A TRAVÉS de
  // la mira, no un tubo o caja sólida tapando la vista.
  const puntoOcular = partesCuerpo.puntoMira.clone().add(partesMira.puntoOcular);

  return { grupo, puntaCañon, puntoOcular };
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

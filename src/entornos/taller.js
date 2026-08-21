/* ── entornos/taller.js ────────────────────────────────────
   El taller: un cuarto cerrado con mesa de trabajo, cerca del
   punto de aparición. Todavía no arma nada de verdad —la lógica
   de fabricación es el siguiente paso— pero ya está el lugar
   físico donde va a pasar.

   Las paredes usan un truco: como nuestro sistema de colisión
   solo sabe empujar lejos de puntos redondos (para cajas), una
   pared larga se aproxima con una fila de círculos superpuestos
   en vez de construir un sistema de colisión nuevo para cajas
   rectangulares. Es un poco tosco, pero reutiliza lo que ya
   está probado en vez de sumar una segunda forma de detectar
   choques.
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';

const ALTO_PARED = 3.2;
const GROSOR_PARED = 0.3;

function generarColisionesPared(x1, z1, x2, z2, radio = 0.55, espaciado = 0.9) {
  const dx = x2 - x1, dz = z2 - z1;
  const longitud = Math.hypot(dx, dz);
  const pasos = Math.max(1, Math.ceil(longitud / espaciado));
  const puntos = [];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    // objeto sencillo — el sistema de colisión solo lee .position.x/.z,
    // no hace falta que sea un Mesh de verdad para las paredes invisibles
    puntos.push({ mesh: { position: { x: x1 + dx * t, z: z1 + dz * t } }, radio });
  }
  return puntos;
}

function construirPared(scene, x1, z1, x2, z2, material) {
  const longitud = Math.hypot(x2 - x1, z2 - z1);
  const pared = new THREE.Mesh(
    new THREE.BoxGeometry(longitud, ALTO_PARED, GROSOR_PARED),
    material
  );
  pared.position.set((x1 + x2) / 2, ALTO_PARED / 2, (z1 + z2) / 2);
  pared.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
  pared.castShadow = true;
  pared.receiveShadow = true;
  scene.add(pared);
  return pared;
}

export function crearTaller(scene) {
  const colisionablesJugador = [];
  const meshesDisparables = [];
  const materialPared = new THREE.MeshStandardMaterial({ color: 0x4a4640, roughness: 0.9 });
  const materialMadera = new THREE.MeshStandardMaterial({ color: 0x6b4a30, roughness: 0.8 });

  // el cuarto: X de -5 a 5, Z de 4 a 16 — la puerta está en la pared
  // sur (Z=4), mirando hacia el corredor que lleva a la cabina
  // 1.6, no un número cualquiera: el punto de colisión más cercano
  // a cada lado invade hacia el hueco con su propio radio (0.55) MÁS
  // el radio del jugador (0.4) — sin ese margen, el "hueco" geométrico
  // existe pero es imposible de cruzar caminando
  const HUECO_PUERTA = 1.6;   // mitad del ancho del hueco

  // pared sur, en dos tramos (deja el hueco de la puerta en medio)
  meshesDisparables.push(construirPared(scene, -5, 4, -HUECO_PUERTA, 4, materialPared));
  meshesDisparables.push(construirPared(scene, HUECO_PUERTA, 4, 5, 4, materialPared));
  colisionablesJugador.push(...generarColisionesPared(-5, 4, -HUECO_PUERTA, 4));
  colisionablesJugador.push(...generarColisionesPared(HUECO_PUERTA, 4, 5, 4));

  // pared norte: ahora con puerta interna hacia la cabina (mismo
  // edificio, un solo recorrido cerrado de principio a fin)
  meshesDisparables.push(construirPared(scene, -5, 16, -HUECO_PUERTA, 16, materialPared));
  meshesDisparables.push(construirPared(scene, HUECO_PUERTA, 16, 5, 16, materialPared));
  colisionablesJugador.push(...generarColisionesPared(-5, 16, -HUECO_PUERTA, 16));
  colisionablesJugador.push(...generarColisionesPared(HUECO_PUERTA, 16, 5, 16));

  // pared este y oeste — sólidas, sin huecos
  meshesDisparables.push(construirPared(scene, -5, 4, -5, 16, materialPared));
  colisionablesJugador.push(...generarColisionesPared(-5, 4, -5, 16));
  meshesDisparables.push(construirPared(scene, 5, 4, 5, 16, materialPared));
  colisionablesJugador.push(...generarColisionesPared(5, 4, 5, 16));

  // techo — bloquea la luz del sol de afuera (con sombra), así el
  // cuarto de verdad se ve más oscuro por dentro y las luces
  // interiores son las que de verdad lo iluminan
  const techo = new THREE.Mesh(
    new THREE.BoxGeometry(10, GROSOR_PARED, 12),
    materialPared
  );
  techo.position.set(0, ALTO_PARED, 10);
  techo.castShadow = true;
  scene.add(techo);

  // piso del taller (un poco distinto al piso exterior, para que
  // se sienta como un lugar aparte)
  const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 12),
    new THREE.MeshStandardMaterial({ color: 0x3a3833, roughness: 0.85 })
  );
  piso.rotation.x = -Math.PI / 2;
  piso.position.set(0, 0.01, 10);   // un poco arriba del piso general, para que no compitan
  piso.receiveShadow = true;
  scene.add(piso);

  // luces interiores — más cálidas que la luz nublada de afuera
  const lampara1 = new THREE.PointLight(0xffcf94, 12, 9, 2);
  lampara1.position.set(-2, 2.8, 7);
  lampara1.castShadow = true;
  scene.add(lampara1);
  const lampara2 = new THREE.PointLight(0xffcf94, 12, 9, 2);
  lampara2.position.set(2, 2.8, 13);
  lampara2.castShadow = true;
  scene.add(lampara2);

  // la mesa de trabajo — todavía sin lógica real detrás, es el
  // lugar físico donde va a vivir la fabricación cuando exista
  const mesa = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.85, 1),
    materialMadera
  );
  mesa.position.set(0, 0.425, 14.5);
  mesa.castShadow = true;
  mesa.receiveShadow = true;
  scene.add(mesa);
  // 3 puntos en vez de un solo círculo grande — la mesa es rectangular
  // y alargada (2.2m), un solo círculo centrado se queda flotando
  // bastante más allá de la orilla real y no dejaba acercarse
  for (const dx of [-0.7, 0, 0.7]) {
    colisionablesJugador.push({ mesh: { position: { x: dx, z: 14.5 } }, radio: 0.55 });
  }
  meshesDisparables.push(mesa);

  return {
    colisionablesJugador,
    meshesDisparables,
    puntoAparicion: new THREE.Vector3(0, 0, 10),
    posicionMesa: mesa.position.clone(),
  };
}

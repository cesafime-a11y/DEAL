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

/* El marco de una puerta — jambas a los lados y dintel arriba.
   Sin esto las puertas eran huecos pelados en la pared, que es
   parte de lo que hacía que todo se leyera como cajas lisas.    */
function construirMarcoPuerta(scene, z, medioAncho, material) {
  const GROSOR_MARCO = 0.09;
  const ALTO_PUERTA = 2.25;

  for (const lado of [-1, 1]) {
    const jamba = new THREE.Mesh(
      new THREE.BoxGeometry(GROSOR_MARCO, ALTO_PUERTA, GROSOR_PARED + 0.06),
      material
    );
    jamba.position.set(lado * medioAncho, ALTO_PUERTA / 2, z);
    jamba.castShadow = true;
    jamba.receiveShadow = true;
    scene.add(jamba);
  }

  const dintel = new THREE.Mesh(
    new THREE.BoxGeometry(medioAncho * 2 + GROSOR_MARCO, GROSOR_MARCO, GROSOR_PARED + 0.06),
    material
  );
  dintel.position.set(0, ALTO_PUERTA, z);
  dintel.castShadow = true;
  dintel.receiveShadow = true;
  scene.add(dintel);

  // el trozo de pared que va ARRIBA del dintel — antes el hueco
  // llegaba hasta el techo, lo que se veía como un boquete
  const cabecero = new THREE.Mesh(
    new THREE.BoxGeometry(medioAncho * 2, ALTO_PARED - ALTO_PUERTA, GROSOR_PARED),
    material
  );
  cabecero.position.set(0, (ALTO_PARED + ALTO_PUERTA) / 2, z);
  cabecero.castShadow = true;
  cabecero.receiveShadow = true;
  scene.add(cabecero);
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
  construirMarcoPuerta(scene, 4, HUECO_PUERTA, materialPared);

  // pared norte: ahora con puerta interna hacia la cabina (mismo
  // edificio, un solo recorrido cerrado de principio a fin)
  meshesDisparables.push(construirPared(scene, -5, 16, -HUECO_PUERTA, 16, materialPared));
  meshesDisparables.push(construirPared(scene, HUECO_PUERTA, 16, 5, 16, materialPared));
  colisionablesJugador.push(...generarColisionesPared(-5, 16, -HUECO_PUERTA, 16));
  colisionablesJugador.push(...generarColisionesPared(HUECO_PUERTA, 16, 5, 16));
  construirMarcoPuerta(scene, 16, HUECO_PUERTA, materialPared);

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

  // la mesa de trabajo — tablero con patas, no un bloque macizo
  // hasta el suelo como estaba antes
  const mesa = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.09, 1),
    materialMadera
  );
  mesa.position.set(0, 0.805, 14.5);
  mesa.castShadow = true;
  mesa.receiveShadow = true;
  scene.add(mesa);

  const materialPata = new THREE.MeshStandardMaterial({ color: 0x2e2b26, roughness: 0.7, metalness: 0.4 });
  for (const dx of [-1.0, 1.0]) {
    for (const dz of [-0.42, 0.42]) {
      const pata = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.76, 0.07), materialPata);
      pata.position.set(dx, 0.38, 14.5 + dz);
      pata.castShadow = true;
      scene.add(pata);
    }
  }
  // travesaño inferior, une las patas — detalle chico que hace
  // que se lea como un mueble armado y no cuatro palos sueltos
  for (const dz of [-0.42, 0.42]) {
    const travesano = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 0.05), materialPata);
    travesano.position.set(0, 0.15, 14.5 + dz);
    travesano.castShadow = true;
    scene.add(travesano);
  }

  // 3 puntos en vez de un solo círculo grande — la mesa es rectangular
  // y alargada (2.2m), un solo círculo centrado se queda flotando
  // bastante más allá de la orilla real y no dejaba acercarse
  for (const dx of [-0.7, 0, 0.7]) {
    colisionablesJugador.push({ mesh: { position: { x: dx, z: 14.5 } }, radio: 0.55 });
  }
  meshesDisparables.push(mesa);

  /* ── mobiliario del taller ────────────────────────────────
     Estantería contra la pared oeste, con cajas encima, y un
     banco de herramientas en la esquina. El cuarto era cuatro
     paredes lisas y una mesa — esto es lo que lo hace leerse
     como un taller de verdad donde alguien trabaja.            */
  const materialEstante = new THREE.MeshStandardMaterial({ color: 0x3d3a34, roughness: 0.8, metalness: 0.3 });
  const materialCaja = new THREE.MeshStandardMaterial({ color: 0x6b5a3e, roughness: 0.9 });

  for (const alturaEstante of [0.5, 1.05, 1.6]) {
    const tabla = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 3.2), materialEstante);
    tabla.position.set(-4.6, alturaEstante, 9.5);
    tabla.castShadow = true;
    tabla.receiveShadow = true;
    scene.add(tabla);
    meshesDisparables.push(tabla);
  }
  for (const dz of [-1.5, 1.5]) {
    const montante = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.9, 0.06), materialEstante);
    montante.position.set(-4.6, 0.95, 9.5 + dz);
    montante.castShadow = true;
    scene.add(montante);
  }
  colisionablesJugador.push(
    { mesh: { position: { x: -4.6, z: 8.3 } }, radio: 0.5 },
    { mesh: { position: { x: -4.6, z: 9.5 } }, radio: 0.5 },
    { mesh: { position: { x: -4.6, z: 10.7 } }, radio: 0.5 },
  );

  // cajas sobre los estantes, de tamaños variados
  const cajasEstante = [
    [-4.6, 0.63, 8.6, 0.22], [-4.6, 0.66, 9.4, 0.28],
    [-4.6, 1.19, 10.3, 0.24], [-4.6, 1.16, 9.0, 0.18],
    [-4.6, 1.74, 8.7, 0.22],
  ];
  for (const [x, y, z, tam] of cajasEstante) {
    const caja = new THREE.Mesh(new THREE.BoxGeometry(0.34, tam, tam * 1.3), materialCaja);
    caja.position.set(x, y, z);
    caja.castShadow = true;
    caja.receiveShadow = true;
    scene.add(caja);
    meshesDisparables.push(caja);
  }

  // banco de herramientas en la esquina noreste
  const bancoHerramientas = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.6), materialEstante);
  bancoHerramientas.position.set(4.1, 0.45, 15.4);
  bancoHerramientas.castShadow = true;
  bancoHerramientas.receiveShadow = true;
  scene.add(bancoHerramientas);
  meshesDisparables.push(bancoHerramientas);
  colisionablesJugador.push({ mesh: { position: { x: 4.1, z: 15.4 } }, radio: 0.85 });

  // panel perforado sobre el banco, con siluetas de herramientas
  const panelHerramientas = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.0, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x33302b, roughness: 0.85 })
  );
  panelHerramientas.position.set(4.1, 1.65, 15.72);
  panelHerramientas.receiveShadow = true;
  scene.add(panelHerramientas);
  const materialHerramienta = new THREE.MeshStandardMaterial({ color: 0x21201d, roughness: 0.6, metalness: 0.5 });
  for (const [dx, dy, ancho, alto] of [[-0.5, 0.2, 0.06, 0.34], [-0.2, 0.16, 0.1, 0.26], [0.15, 0.22, 0.05, 0.38], [0.48, 0.14, 0.13, 0.22]]) {
    const herramienta = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, 0.03), materialHerramienta);
    herramienta.position.set(4.1 + dx, 1.65 + dy, 15.69);
    scene.add(herramienta);
  }

  return {
    colisionablesJugador,
    meshesDisparables,
    puntoAparicion: new THREE.Vector3(0, 0, 10),
    posicionMesa: mesa.position.clone(),
    // la SUPERFICIE real donde se apoyan las cosas — antes cada
    // módulo la calculaba por su cuenta sumando un valor fijo, y
    // al cambiar la mesa (de bloque macizo a tablero con patas)
    // todo eso se desalineaba. Exponerla aquí lo hace a prueba
    // de futuros cambios de la mesa.
    superficieMesa: mesa.position.clone().setY(mesa.position.y + 0.045),
  };
}

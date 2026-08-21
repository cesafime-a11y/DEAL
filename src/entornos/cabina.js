/* ── entornos/cabina.js ─────────────────────────────────────
   La cabina de prueba de tiro: un cuarto cerrado, parte del
   mismo edificio que el taller — se entra por una puerta
   interna, no caminando al aire libre. Misma técnica de paredes
   con círculos superpuestos que el taller (ver taller.js para
   la explicación completa del truco).

   Antes esto era un polígono circular al aire libre con un
   límite invisible que no dejaba salir bien — un cuarto de
   verdad, con una puerta de verdad, resuelve eso de raíz.
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';

const ALTO_PARED = 3.2;
const GROSOR_PARED = 0.3;
const HUECO_PUERTA = 1.6;   // mismo criterio que en taller.js — el radio
                            // de colisión invade el hueco desde ambos lados

function generarColisionesPared(x1, z1, x2, z2, radio = 0.55, espaciado = 0.9) {
  const dx = x2 - x1, dz = z2 - z1;
  const longitud = Math.hypot(dx, dz);
  const pasos = Math.max(1, Math.ceil(longitud / espaciado));
  const puntos = [];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
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

function crearObjetivo(scene, colisionablesJugador, meshesDisparables, x, z) {
  const poste = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x3a3530, roughness: 0.9 })
  );
  poste.position.set(x, 0.75, z);
  poste.castShadow = true;
  scene.add(poste);

  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.3, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xd8cfa8, roughness: 0.85 })
  );
  panel.position.set(x, 1.75, z);
  panel.castShadow = true;
  panel.receiveShadow = true;
  scene.add(panel);

  const centro = new THREE.Mesh(
    new THREE.CircleGeometry(0.22, 20),
    new THREE.MeshStandardMaterial({ color: 0x8a2020, roughness: 0.8 })
  );
  centro.position.set(x, 1.75, z + 0.026);
  scene.add(centro);

  colisionablesJugador.push({ mesh: panel, radio: 0.5 });
  meshesDisparables.push(panel);
}

export function crearCabina(scene) {
  const colisionablesJugador = [];
  const meshesDisparables = [];
  const materialPared = new THREE.MeshStandardMaterial({ color: 0x3a3d40, roughness: 0.85 });

  // el cuarto: mismo ancho que el taller (X de -5 a 5), continúa
  // hacia el norte desde donde el taller termina — Z de 16 a 50.
  // La puerta sur (Z=16) es la misma abertura que ya dejó el
  // taller en su pared norte — un solo edificio, un solo hueco.
  meshesDisparables.push(construirPared(scene, -5, 16, -HUECO_PUERTA, 16, materialPared));
  meshesDisparables.push(construirPared(scene, HUECO_PUERTA, 16, 5, 16, materialPared));
  colisionablesJugador.push(...generarColisionesPared(-5, 16, -HUECO_PUERTA, 16));
  colisionablesJugador.push(...generarColisionesPared(HUECO_PUERTA, 16, 5, 16));

  // pared norte (fondo del cuarto) — sólida
  meshesDisparables.push(construirPared(scene, -5, 50, 5, 50, materialPared));
  colisionablesJugador.push(...generarColisionesPared(-5, 50, 5, 50));

  // este y oeste — sólidas, sin huecos
  meshesDisparables.push(construirPared(scene, -5, 16, -5, 50, materialPared));
  colisionablesJugador.push(...generarColisionesPared(-5, 16, -5, 50));
  meshesDisparables.push(construirPared(scene, 5, 16, 5, 50, materialPared));
  colisionablesJugador.push(...generarColisionesPared(5, 16, 5, 50));

  // techo — igual que el taller, bloquea la luz de afuera
  const techo = new THREE.Mesh(
    new THREE.BoxGeometry(10, GROSOR_PARED, 34),
    materialPared
  );
  techo.position.set(0, ALTO_PARED, 33);
  techo.castShadow = true;
  scene.add(techo);

  // piso propio, distinto al del taller — más frío, de instalación
  const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 34),
    new THREE.MeshStandardMaterial({ color: 0x2c2e30, roughness: 0.8 })
  );
  piso.rotation.x = -Math.PI / 2;
  piso.position.set(0, 0.011, 33);
  piso.receiveShadow = true;
  scene.add(piso);

  // luz interior más fría/clínica que la del taller — se siente
  // como una instalación de pruebas, no un cuarto para trabajar
  for (const z of [22, 32, 42]) {
    const lampara = new THREE.PointLight(0xdce8ff, 10, 12, 2);
    lampara.position.set(0, 2.9, z);
    lampara.castShadow = true;
    scene.add(lampara);
  }

  // objetivos alineados, a distancias crecientes desde la puerta
  for (const z of [26, 36, 46]) {
    crearObjetivo(scene, colisionablesJugador, meshesDisparables, 0, z);
  }

  return { colisionablesJugador, meshesDisparables };
}

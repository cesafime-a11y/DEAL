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

  /* Pivote en la BASE del panel, no en su centro: al tumbarse tiene
     que girar sobre su borde inferior, como una bisagra, no flotar
     rotando sobre sí mismo en el aire.                            */
  const pivote = new THREE.Group();
  pivote.position.set(x, 1.1, z);
  scene.add(pivote);

  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.3, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xd8cfa8, roughness: 0.85 })
  );
  panel.position.set(0, 0.65, 0);   // relativo al pivote
  panel.castShadow = true;
  panel.receiveShadow = true;
  pivote.add(panel);

  /* Anillos de puntuación concéntricos, en vez de un solo círculo
     rojo — así se puede apreciar qué tan al centro pegaste, que es
     justo lo que hace útil un campo de tiro para comparar armas.  */
  const ANILLOS = [
    [0.30, 0xb8ae90], [0.22, 0xa03030], [0.13, 0x8a2020], [0.055, 0xe8d8a0],
  ];
  ANILLOS.forEach(([radio, color], i) => {
    const anillo = new THREE.Mesh(
      new THREE.CircleGeometry(radio, 22),
      new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
    );
    // cada anillo un pelo más adelante, para que no peleen entre sí
    anillo.position.set(0, 0.65, 0.026 + i * 0.0012);
    pivote.add(anillo);
  });

  // número de identificación arriba del panel
  const placa = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.09, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.7 })
  );
  placa.position.set(0, 1.36, 0.02);
  pivote.add(placa);

  colisionablesJugador.push({ mesh: { position: { x, z } }, radio: 0.5 });
  meshesDisparables.push(panel);

  return { panel, pivote, poste };
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

  /* ── objetivos reactivos ───────────────────────────────────
     Antes eran postes fijos: les disparabas y no pasaba nada, así
     que no había forma de saber si acertaste más allá de la marca
     de impacto. Ahora se tumban hacia atrás al recibir un tiro y
     se vuelven a levantar solos, que es como funciona un campo de
     tiro de verdad — y de paso te dice al instante si diste.     */
  const objetivos = [];
  const DISTANCIAS = [26, 36, 46];

  for (const z of DISTANCIAS) {
    const partes = crearObjetivo(scene, colisionablesJugador, meshesDisparables, 0, z);
    // crearObjetivo puede no devolver nada (versión antigua) — en
    // ese caso simplemente no hay reacción, sin romper nada
    if (partes && partes.panel) {
      objetivos.push({
        panel: partes.panel,
        pivote: partes.pivote || partes.panel,
        anguloActual: 0,
        objetivoAngulo: 0,
        tiempoTumbado: 0,
      });
    }
  }

  /* Marcas de distancia en el piso: una línea clara frente a cada
     objetivo. Sin esto no había ninguna referencia de a qué
     distancia estabas tirando, y el alcance de las armas (que sí
     varía mucho entre piezas) no se podía apreciar.              */
  const materialMarca = new THREE.MeshStandardMaterial({
    color: 0x7e8890, roughness: 0.9, transparent: true, opacity: 0.5,
  });
  for (const z of DISTANCIAS) {
    const linea = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 0.06), materialMarca);
    linea.rotation.x = -Math.PI / 2;
    linea.position.set(0, 0.013, z);
    scene.add(linea);
    // dos marcas cortas a los lados, como topes de carril
    for (const x of [-4.2, 4.2]) {
      const tope = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.22), materialMarca);
      tope.rotation.x = -Math.PI / 2;
      tope.position.set(x, 0.013, z);
      scene.add(tope);
    }
  }

  /* Avisa que un objetivo recibió un impacto — main.js lo llama
     cuando el raycast pega en alguna de sus mallas. Devuelve true
     si de verdad correspondía a un objetivo, para que quien llama
     sepa si contarlo como acierto.                               */
  function registrarImpacto(meshGolpeada) {
    for (const obj of objetivos) {
      let corresponde = false;
      obj.panel.traverse((o) => { if (o === meshGolpeada) corresponde = true; });
      if (obj.panel === meshGolpeada) corresponde = true;
      if (!corresponde) continue;
      obj.objetivoAngulo = -Math.PI / 2.1;   // se tumba hacia atrás
      obj.tiempoTumbado = 1.6;               // segundos antes de levantarse
      return true;
    }
    return false;
  }

  /* Se llama cada cuadro desde main.js — anima el tumbado y el
     levantado de los objetivos.                                  */
  function actualizar(dt) {
    for (const obj of objetivos) {
      if (obj.tiempoTumbado > 0) {
        obj.tiempoTumbado -= dt;
        if (obj.tiempoTumbado <= 0) obj.objetivoAngulo = 0;   // se vuelve a parar
      }
      const dif = obj.objetivoAngulo - obj.anguloActual;
      if (Math.abs(dif) < 0.001) continue;
      // cae rápido, se levanta más despacio — se siente con peso
      const velocidad = obj.objetivoAngulo < obj.anguloActual ? 13 : 4.5;
      obj.anguloActual += dif * Math.min(1, velocidad * dt);
      obj.pivote.rotation.x = obj.anguloActual;
    }
  }

  return { colisionablesJugador, meshesDisparables, registrarImpacto, actualizar };
}

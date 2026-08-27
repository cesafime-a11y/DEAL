/* ── personaje/personajeVisual.js ───────────────────────────
   PERSONAJE V2

   Este es el CUERPO DEL MUNDO, NO los brazos en primera persona.

   Durante gameplay normal:
   - se ven pelvis + piernas + pies al mirar hacia abajo
   - cabeza, pecho y brazos superiores NO se renderizan al jugador
     local, evitando meterse dentro del torso o tapar el arma

   Para ragdoll:
   - TODAS las piezas siguen existiendo internamente
   - obtenerPartesRagdoll() entrega el cuerpo completo
   - ragdoll.js puede crear cabeza/torso/brazos aunque aquí estén
     ocultos durante la vista FPS
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';

const PARTES = {
  pelvis: {
    forma: 'caja',
    tamano: [0.34, 0.20, 0.24],
    offset: [0, 0, 0],
    color: 0x262a30,
    visibleFPS: true,
  },
  pecho: {
    forma: 'caja',
    tamano: [0.42, 0.42, 0.25],
    offset: [0, 0.31, 0],
    color: 0x343a43,
    visibleFPS: false,
  },
  cabeza: {
    forma: 'esfera',
    radio: 0.145,
    offset: [0, 0.66, 0],
    color: 0xb98764,
    visibleFPS: false,
  },

  brazoSupIzq: {
    forma: 'capsula',
    radio: 0.072,
    largo: 0.22,
    offset: [-0.30, 0.27, 0],
    color: 0x343a43,
    visibleFPS: false,
  },
  brazoInfIzq: {
    forma: 'capsula',
    radio: 0.062,
    largo: 0.20,
    offset: [-0.30, -0.01, 0],
    color: 0xb98764,
    visibleFPS: false,
  },
  brazoSupDer: {
    forma: 'capsula',
    radio: 0.072,
    largo: 0.22,
    offset: [0.30, 0.27, 0],
    color: 0x343a43,
    visibleFPS: false,
  },
  brazoInfDer: {
    forma: 'capsula',
    radio: 0.062,
    largo: 0.20,
    offset: [0.30, -0.01, 0],
    color: 0xb98764,
    visibleFPS: false,
  },

  musloIzq: {
    forma: 'capsula',
    radio: 0.095,
    largo: 0.29,
    offset: [-0.115, -0.29, 0],
    color: 0x24272d,
    visibleFPS: true,
  },
  piernaIzq: {
    forma: 'capsula',
    radio: 0.082,
    largo: 0.28,
    offset: [-0.115, -0.67, 0],
    color: 0x202329,
    visibleFPS: true,
  },
  pieIzq: {
    forma: 'caja',
    tamano: [0.19, 0.12, 0.34],
    offset: [-0.115, -0.91, -0.075],
    color: 0x15171b,
    visibleFPS: true,
  },

  musloDer: {
    forma: 'capsula',
    radio: 0.095,
    largo: 0.29,
    offset: [0.115, -0.29, 0],
    color: 0x24272d,
    visibleFPS: true,
  },
  piernaDer: {
    forma: 'capsula',
    radio: 0.082,
    largo: 0.28,
    offset: [0.115, -0.67, 0],
    color: 0x202329,
    visibleFPS: true,
  },
  pieDer: {
    forma: 'caja',
    tamano: [0.19, 0.12, 0.34],
    offset: [0.115, -0.91, -0.075],
    color: 0x15171b,
    visibleFPS: true,
  },
};

function geometriaParte(datos) {
  if (datos.forma === 'esfera') {
    return new THREE.SphereGeometry(datos.radio, 22, 16);
  }

  if (datos.forma === 'capsula') {
    return new THREE.CapsuleGeometry(
      datos.radio,
      datos.largo,
      6,
      12
    );
  }

  return new THREE.BoxGeometry(...datos.tamano);
}

function materialParte(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.78,
    metalness: 0.02,
  });
}

export function crearPersonajeVisual(scene) {
  const grupo = new THREE.Group();
  grupo.name = 'JugadorWorldBodyV2';
  scene.add(grupo);

  const meshes = {};

  for (const [nombre, datos] of Object.entries(PARTES)) {
    const mesh = new THREE.Mesh(
      geometriaParte(datos),
      materialParte(datos.color)
    );

    mesh.name = `Jugador_${nombre}`;
    mesh.position.fromArray(datos.offset);

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;

    // Aquí está la corrección más importante:
    // el jugador local solo ve su parte inferior.
    mesh.visible = datos.visibleFPS;

    grupo.add(mesh);
    meshes[nombre] = mesh;
  }

  // Pequeña cintura para que al mirar abajo no haya un corte
  // abrupto entre cámara y piernas.
  const cintura = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.18, 0.18, 12),
    new THREE.MeshStandardMaterial({
      color: 0x252930,
      roughness: 0.82,
    })
  );
  cintura.position.y = 0.07;
  cintura.castShadow = true;
  grupo.add(cintura);

  let tiempoPaso = 0;
  let faseSuavizada = 0;

  const eulerCamara = new THREE.Euler(0, 0, 0, 'YXZ');

  function actualizar(camera, velocidad, dt) {
    if (!grupo.visible) return;

    // La raíz queda alrededor de la pelvis. Con ojos a 1.70 m,
    // esto pone los pies prácticamente sobre y=0.
    grupo.position.set(
      camera.position.x,
      camera.position.y - 0.79,
      camera.position.z
    );

    // El cuerpo sigue SOLO el yaw.
    // Mirar arriba/abajo no mete el torso en la cámara.
    eulerCamara.setFromQuaternion(camera.quaternion);
    grupo.rotation.set(0, eulerCamara.y, 0);

    const movimiento = THREE.MathUtils.clamp(
      (velocidad || 0) / 5.5,
      0,
      1
    );

    if (movimiento > 0.015) {
      tiempoPaso += dt * (6.2 + movimiento * 3.8);
    }

    faseSuavizada = THREE.MathUtils.lerp(
      faseSuavizada,
      movimiento,
      Math.min(1, dt * 9)
    );

    const pasoIzq = Math.sin(tiempoPaso) * faseSuavizada;
    const pasoDer = Math.sin(tiempoPaso + Math.PI) * faseSuavizada;

    meshes.musloIzq.rotation.x = pasoIzq * 0.44;
    meshes.musloDer.rotation.x = pasoDer * 0.44;

    meshes.piernaIzq.rotation.x =
      Math.max(0, -pasoIzq) * 0.30;
    meshes.piernaDer.rotation.x =
      Math.max(0, -pasoDer) * 0.30;

    meshes.pieIzq.rotation.x =
      Math.max(0, pasoIzq) * -0.11;
    meshes.pieDer.rotation.x =
      Math.max(0, pasoDer) * -0.11;

    // Leve movimiento de pelvis, mucho más discreto que V1.
    grupo.position.y +=
      Math.abs(Math.sin(tiempoPaso * 2)) *
      0.009 *
      faseSuavizada;

    grupo.updateMatrixWorld(true);
  }

  function mostrarAnimado(visible) {
    grupo.visible = visible;

    if (visible) {
      for (const [nombre, datos] of Object.entries(PARTES)) {
        meshes[nombre].visible = datos.visibleFPS;
      }
      cintura.visible = true;
    }
  }

  function obtenerPartesRagdoll() {
    grupo.updateMatrixWorld(true);

    return Object.entries(PARTES).map(([nombre, datos]) => {
      const mesh = meshes[nombre];

      const posicion = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const escala = new THREE.Vector3();

      mesh.matrixWorld.decompose(
        posicion,
        quaternion,
        escala
      );

      return {
        nombre,
        datos,
        meshOriginal: mesh,
        posicion,
        quaternion,
      };
    });
  }

  return {
    grupo,
    meshes,
    actualizar,
    mostrarAnimado,
    obtenerPartesRagdoll,
  };
}


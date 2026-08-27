import * as THREE from 'three';

/*
  Representación visual del jugador en el mundo.

  IMPORTANTE:
  - No controla movimiento.
  - No controla cámara.
  - No sabe nada del arma.
  - Solamente sigue a la cámara cuando está en modo animado.
  - El ragdoll puede ocultar este modelo y crear su versión física.

  Esto permite sustituir este muñeco procedural por un GLB riggeado
  más adelante sin reescribir core/jugador.js.
*/

const PARTES = {
  pelvis: {
    forma: 'caja',
    tamano: [0.34, 0.22, 0.24],
    offset: [0, 0, 0],
    color: 0x292d33,
  },
  pecho: {
    forma: 'caja',
    tamano: [0.43, 0.43, 0.25],
    offset: [0, 0.325, 0],
    color: 0x343941,
  },
  cabeza: {
    forma: 'esfera',
    radio: 0.145,
    offset: [0, 0.69, 0],
    color: 0xc49570,
  },

  brazoSupIzq: {
    forma: 'caja',
    tamano: [0.15, 0.37, 0.16],
    offset: [-0.31, 0.30, 0],
    color: 0x343941,
  },
  brazoInfIzq: {
    forma: 'caja',
    tamano: [0.135, 0.34, 0.145],
    offset: [-0.31, -0.045, -0.005],
    color: 0xc49570,
  },
  brazoSupDer: {
    forma: 'caja',
    tamano: [0.15, 0.37, 0.16],
    offset: [0.31, 0.30, 0],
    color: 0x343941,
  },
  brazoInfDer: {
    forma: 'caja',
    tamano: [0.135, 0.34, 0.145],
    offset: [0.31, -0.045, -0.005],
    color: 0xc49570,
  },

  musloIzq: {
    forma: 'caja',
    tamano: [0.19, 0.47, 0.21],
    offset: [-0.115, -0.345, 0],
    color: 0x25282d,
  },
  piernaIzq: {
    forma: 'caja',
    tamano: [0.17, 0.40, 0.19],
    offset: [-0.115, -0.78, 0],
    color: 0x202328,
  },
  pieIzq: {
    forma: 'caja',
    tamano: [0.20, 0.13, 0.37],
    offset: [-0.115, -1.035, -0.075],
    color: 0x17191d,
  },

  musloDer: {
    forma: 'caja',
    tamano: [0.19, 0.47, 0.21],
    offset: [0.115, -0.345, 0],
    color: 0x25282d,
  },
  piernaDer: {
    forma: 'caja',
    tamano: [0.17, 0.40, 0.19],
    offset: [0.115, -0.78, 0],
    color: 0x202328,
  },
  pieDer: {
    forma: 'caja',
    tamano: [0.20, 0.13, 0.37],
    offset: [0.115, -1.035, -0.075],
    color: 0x17191d,
  },
};

function crearGeometria(datos) {
  if (datos.forma === 'esfera') {
    return new THREE.SphereGeometry(datos.radio, 20, 14);
  }

  return new THREE.BoxGeometry(...datos.tamano);
}

function crearMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.03,
  });
}

export function crearPersonajeVisual(scene) {
  const grupo = new THREE.Group();
  grupo.name = 'JugadorVisual';
  scene.add(grupo);

  const meshes = {};

  for (const [nombre, datos] of Object.entries(PARTES)) {
    const mesh = new THREE.Mesh(
      crearGeometria(datos),
      crearMaterial(datos.color)
    );

    mesh.name = `Jugador_${nombre}`;
    mesh.position.fromArray(datos.offset);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;

    grupo.add(mesh);
    meshes[nombre] = mesh;
  }

  // La cabeza estaría literalmente alrededor de la cámara en primera
  // persona. La ocultamos durante gameplay normal. En ragdoll sí aparece.
  meshes.cabeza.visible = false;

  let tiempoPaso = 0;
  const eulerCamara = new THREE.Euler(0, 0, 0, 'YXZ');

  function actualizar(camera, velocidad, dt) {
    if (!grupo.visible) return;

    // Pelvis 60cm por debajo de los ojos — con la altura de ojos
    // real del juego (1.7m, mundo.js) y la distancia real pelvis→
    // planta del pie de este muñeco (1.1m), es el valor que deja
    // los pies exactamente en el piso. El valor anterior (0.76)
    // los dejaba 16cm hundidos bajo el suelo.
    grupo.position.set(
      camera.position.x,
      camera.position.y - 0.6,
      camera.position.z
    );

    eulerCamara.setFromQuaternion(camera.quaternion);
    grupo.rotation.set(0, eulerCamara.y, 0);

    const movimiento = THREE.MathUtils.clamp(velocidad / 5.5, 0, 1);

    if (movimiento > 0.02) {
      tiempoPaso += dt * (7.0 + movimiento * 3.0);
    }

    const oscilacion = Math.sin(tiempoPaso) * movimiento;
    const oscilacion2 = Math.sin(tiempoPaso + Math.PI) * movimiento;

    meshes.musloIzq.rotation.x = oscilacion * 0.48;
    meshes.piernaIzq.rotation.x = Math.max(0, -oscilacion) * 0.28;
    meshes.musloDer.rotation.x = oscilacion2 * 0.48;
    meshes.piernaDer.rotation.x = Math.max(0, -oscilacion2) * 0.28;

    meshes.brazoSupIzq.rotation.x = oscilacion2 * 0.22;
    meshes.brazoSupDer.rotation.x = oscilacion * 0.22;

    const bob = Math.abs(Math.sin(tiempoPaso * 2)) * 0.012 * movimiento;
    meshes.pelvis.position.y = PARTES.pelvis.offset[1] + bob;
    meshes.pecho.position.y = PARTES.pecho.offset[1] + bob * 0.7;

    if (movimiento <= 0.02) {
      meshes.musloIzq.rotation.x *= Math.max(0, 1 - dt * 12);
      meshes.musloDer.rotation.x *= Math.max(0, 1 - dt * 12);
      meshes.piernaIzq.rotation.x *= Math.max(0, 1 - dt * 12);
      meshes.piernaDer.rotation.x *= Math.max(0, 1 - dt * 12);
      meshes.brazoSupIzq.rotation.x *= Math.max(0, 1 - dt * 12);
      meshes.brazoSupDer.rotation.x *= Math.max(0, 1 - dt * 12);
    }

    grupo.updateMatrixWorld(true);
  }

  function mostrarAnimado(visible) {
    grupo.visible = visible;
    meshes.cabeza.visible = false;
  }

  function obtenerPartesRagdoll() {
    grupo.updateMatrixWorld(true);

    return Object.entries(PARTES).map(([nombre, datos]) => {
      const mesh = meshes[nombre];

      const posicion = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const escala = new THREE.Vector3();

      mesh.matrixWorld.decompose(posicion, quaternion, escala);

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

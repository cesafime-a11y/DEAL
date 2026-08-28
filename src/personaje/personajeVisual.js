/* ── personaje/personajeVisual.js ───────────────────────────
   DEAL — CUERPO MUNDIAL V3

   El jugador local NO ve este cuerpo durante gameplay.
   Existe para:
   - mantener la posición corporal real;
   - generar el ragdoll;
   - futura tercera persona / NPCs.

   La vista local usa:
   - cuerpoFPS.js
   - brazosFPS.js
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import {
  cajaBiselada,
} from '../armas/disenoArmas.js';

const MAT_ROPA =
  new THREE.MeshStandardMaterial({
    color: 0x293038,
    roughness: 0.90,
    metalness: 0.01,
  });

const MAT_ROPA_OSCURA =
  new THREE.MeshStandardMaterial({
    color: 0x20252b,
    roughness: 0.94,
    metalness: 0.01,
  });

const MAT_PIEL =
  new THREE.MeshStandardMaterial({
    color: 0xb98967,
    roughness: 0.78,
    metalness: 0.0,
  });

const MAT_BOTA =
  new THREE.MeshStandardMaterial({
    color: 0x14171b,
    roughness: 0.96,
    metalness: 0.01,
  });

const PARTES = {
  pelvis: {
    forma: 'caja',
    tamano:
      [0.27, 0.18, 0.20],
    offset:
      [0, 0, 0],
    material:
      MAT_ROPA_OSCURA,
  },

  pecho: {
    forma: 'caja',
    tamano:
      [0.40, 0.39, 0.22],
    offset:
      [0, 0.30, 0],
    material:
      MAT_ROPA,
  },

  cabeza: {
    forma: 'esfera',
    radio: 0.145,
    offset:
      [0, 0.65, 0],
    material:
      MAT_PIEL,
  },

  brazoSupIzq: {
    forma: 'capsula',
    radio: 0.068,
    largo: 0.20,
    offset:
      [-0.27, 0.25, 0],
    material:
      MAT_ROPA,
  },

  brazoInfIzq: {
    forma: 'capsula',
    radio: 0.055,
    largo: 0.19,
    offset:
      [-0.27, -0.01, 0],
    material:
      MAT_ROPA,
  },

  brazoSupDer: {
    forma: 'capsula',
    radio: 0.068,
    largo: 0.20,
    offset:
      [0.27, 0.25, 0],
    material:
      MAT_ROPA,
  },

  brazoInfDer: {
    forma: 'capsula',
    radio: 0.055,
    largo: 0.19,
    offset:
      [0.27, -0.01, 0],
    material:
      MAT_ROPA,
  },

  musloIzq: {
    forma: 'capsula',
    radio: 0.085,
    largo: 0.29,
    offset:
      [-0.12, -0.27, 0],
    material:
      MAT_ROPA,
  },

  piernaIzq: {
    forma: 'capsula',
    radio: 0.065,
    largo: 0.27,
    offset:
      [-0.12, -0.64, 0],
    material:
      MAT_ROPA_OSCURA,
  },

  pieIzq: {
    forma: 'caja',
    tamano:
      [0.16, 0.10, 0.27],
    offset:
      [-0.12, -0.90, -0.06],
    material:
      MAT_BOTA,
  },

  musloDer: {
    forma: 'capsula',
    radio: 0.085,
    largo: 0.29,
    offset:
      [0.12, -0.27, 0],
    material:
      MAT_ROPA,
  },

  piernaDer: {
    forma: 'capsula',
    radio: 0.065,
    largo: 0.27,
    offset:
      [0.12, -0.64, 0],
    material:
      MAT_ROPA_OSCURA,
  },

  pieDer: {
    forma: 'caja',
    tamano:
      [0.16, 0.10, 0.27],
    offset:
      [0.12, -0.90, -0.06],
    material:
      MAT_BOTA,
  },
};

function geometriaParte(
  datos
) {
  if (
    datos.forma ===
    'esfera'
  ) {
    return new THREE
      .SphereGeometry(
        datos.radio,
        20,
        14
      );
  }

  if (
    datos.forma ===
    'capsula'
  ) {
    return new THREE
      .CapsuleGeometry(
        datos.radio,
        datos.largo,
        6,
        12
      );
  }

  return new THREE
    .BoxGeometry(
      ...datos.tamano
    );
}

export function crearPersonajeVisual(
  scene
) {
  const grupo =
    new THREE.Group();

  grupo.name =
    'JugadorWorldBody_V3';

  scene.add(grupo);

  const meshes = {};

  for (
    const [nombre, datos]
    of Object.entries(PARTES)
  ) {
    let mesh;

    if (
      nombre === 'pelvis' ||
      nombre === 'pecho'
    ) {
      mesh =
        cajaBiselada(
          datos.tamano[0],
          datos.tamano[1],
          datos.tamano[2],
          datos.material,

          nombre === 'pecho'
            ? 0.025
            : 0.018
        );
    } else {
      mesh =
        new THREE.Mesh(
          geometriaParte(
            datos
          ),

          datos.material
        );
    }

    mesh.name =
      `Jugador_${nombre}`;

    mesh.position.fromArray(
      datos.offset
    );

    mesh.castShadow =
      true;

    mesh.receiveShadow =
      true;

    mesh.frustumCulled =
      false;

    /*
      No visible durante primera persona.
    */
    mesh.visible = false;

    grupo.add(mesh);

    meshes[nombre] =
      mesh;
  }

  const hombroIzq =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.085,
        12,
        8
      ),

      MAT_ROPA
    );

  hombroIzq.position.set(
    -0.225,
    0.405,
    0
  );

  hombroIzq.visible =
    false;

  grupo.add(hombroIzq);

  const hombroDer =
    hombroIzq.clone();

  hombroDer.position.x =
    0.225;

  grupo.add(hombroDer);

  let tiempo = 0;
  let fase = 0;

  const direccion =
    new THREE.Vector3();

  const direccionPlana =
    new THREE.Vector3();

  const euler =
    new THREE.Euler(
      0,
      0,
      0,
      'YXZ'
    );

  function actualizar(
    camera,
    velocidad,
    dt
  ) {
    camera.getWorldDirection(
      direccion
    );

    direccionPlana
      .copy(direccion)
      .setY(0);

    if (
      direccionPlana
        .lengthSq() <
      1e-6
    ) {
      direccionPlana.set(
        0,
        0,
        -1
      );
    }

    direccionPlana
      .normalize();

    grupo.position.copy(
      camera.position
    );

    grupo.position
      .addScaledVector(
        direccionPlana,
        -0.04
      );

    grupo.position.y =
      camera.position.y -
      0.91;

    euler.setFromQuaternion(
      camera.quaternion
    );

    grupo.rotation.set(
      0,
      euler.y,
      0
    );

    const movimiento =
      THREE.MathUtils.clamp(
        (velocidad || 0) /
          5.4,

        0,
        1
      );

    fase =
      THREE.MathUtils.lerp(
        fase,
        movimiento,

        Math.min(
          1,
          dt * 10
        )
      );

    if (
      fase > 0.01
    ) {
      tiempo +=
        dt *
        (
          6 +
          fase * 4
        );
    }

    const izq =
      Math.sin(tiempo) *
      fase;

    const der =
      Math.sin(
        tiempo +
        Math.PI
      ) *
      fase;

    meshes
      .musloIzq
      .rotation.x =
        izq * 0.35;

    meshes
      .musloDer
      .rotation.x =
        der * 0.35;

    meshes
      .piernaIzq
      .rotation.x =
        Math.max(
          0,
          -izq
        ) * 0.25;

    meshes
      .piernaDer
      .rotation.x =
        Math.max(
          0,
          -der
        ) * 0.25;

    grupo.updateMatrixWorld(
      true
    );
  }

  function mostrarAnimado(
    visible
  ) {
    /*
      El grupo necesita existir para que sus transformaciones
      sirvan al ragdoll.

      Las piezas individuales siguen sin mostrarse al jugador.
    */
    grupo.visible =
      visible;

    if (visible) {
      for (
        const mesh
        of Object.values(meshes)
      ) {
        mesh.visible =
          false;
      }

      hombroIzq.visible =
        false;

      hombroDer.visible =
        false;
    }
  }

  function obtenerPartesRagdoll() {
    grupo.updateMatrixWorld(
      true
    );

    return Object
      .entries(PARTES)
      .map(
        ([nombre, datos]) => {
          const mesh =
            meshes[nombre];

          const posicion =
            new THREE.Vector3();

          const quaternion =
            new THREE.Quaternion();

          const escala =
            new THREE.Vector3();

          mesh.matrixWorld
            .decompose(
              posicion,
              quaternion,
              escala
            );

          return {
            nombre,
            datos,
            meshOriginal:
              mesh,
            posicion,
            quaternion,
          };
        }
      );
  }

  return {
    grupo,
    meshes,
    actualizar,
    mostrarAnimado,
    obtenerPartesRagdoll,
  };
}

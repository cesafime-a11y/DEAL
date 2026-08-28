/* ── personaje/brazosFPS.js ─────────────────────────────────
   DEAL — BRAZOS FPS V3
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import {
  cajaBiselada,
  perfilExtruido,
} from '../armas/disenoArmas.js';

const MAT_MANGA =
  new THREE.MeshStandardMaterial({
    color: 0x293038,
    roughness: 0.90,
    metalness: 0.01,
  });

const MAT_MANGA_OSCURA =
  new THREE.MeshStandardMaterial({
    color: 0x1e2329,
    roughness: 0.94,
    metalness: 0.01,
  });

const MAT_GUANTE =
  new THREE.MeshStandardMaterial({
    color: 0x14181d,
    roughness: 0.92,
    metalness: 0.04,
  });

const MAT_GUANTE_PLACA =
  new THREE.MeshStandardMaterial({
    color: 0x252b32,
    roughness: 0.74,
    metalness: 0.12,
  });

const MAT_COSTURA =
  new THREE.MeshStandardMaterial({
    color: 0x404852,
    roughness: 0.88,
    metalness: 0.02,
  });

const POSES = {
  pistola: {
    manoDer:
      [0.054, -0.096, 0.082],

    codoDer:
      [0.178, -0.274, 0.330],

    hombroDer:
      [0.286, -0.410, 0.585],

    manoIzq:
      [-0.028, -0.098, 0.042],

    codoIzq:
      [-0.150, -0.254, 0.288],

    hombroIzq:
      [-0.250, -0.397, 0.557],

    rotDer:
      [-0.16, 0.02, -0.06],

    rotIzq:
      [-0.13, 0.08, 0.13],
  },

  automatica: {
    manoDer:
      [0.054, -0.099, 0.084],

    codoDer:
      [0.182, -0.278, 0.337],

    hombroDer:
      [0.292, -0.414, 0.595],

    manoIzq:
      [-0.030, -0.100, 0.035],

    codoIzq:
      [-0.154, -0.255, 0.282],

    hombroIzq:
      [-0.255, -0.400, 0.560],

    rotDer:
      [-0.17, 0.02, -0.06],

    rotIzq:
      [-0.14, 0.08, 0.14],
  },

  revolver: {
    manoDer:
      [0.054, -0.097, 0.080],

    codoDer:
      [0.180, -0.278, 0.340],

    hombroDer:
      [0.290, -0.414, 0.595],

    manoIzq:
      [-0.030, -0.094, 0.018],

    codoIzq:
      [-0.158, -0.246, 0.276],

    hombroIzq:
      [-0.258, -0.396, 0.556],

    rotDer:
      [-0.16, 0.02, -0.05],

    rotIzq:
      [-0.11, 0.10, 0.11],
  },

  subfusil: {
    manoDer:
      [0.055, -0.103, 0.090],

    codoDer:
      [0.180, -0.286, 0.350],

    hombroDer:
      [0.295, -0.418, 0.606],

    manoIzq:
      [-0.044, -0.078, -0.105],

    codoIzq:
      [-0.160, -0.220, 0.202],

    hombroIzq:
      [-0.268, -0.388, 0.548],

    rotDer:
      [-0.17, 0.01, -0.06],

    rotIzq:
      [-0.20, 0.08, 0.16],
  },

  pdw: {
    manoDer:
      [0.055, -0.102, 0.088],

    codoDer:
      [0.180, -0.284, 0.348],

    hombroDer:
      [0.294, -0.416, 0.602],

    manoIzq:
      [-0.043, -0.074, -0.130],

    codoIzq:
      [-0.160, -0.214, 0.184],

    hombroIzq:
      [-0.270, -0.386, 0.542],

    rotDer:
      [-0.17, 0.01, -0.06],

    rotIzq:
      [-0.21, 0.07, 0.17],
  },

  rifle: {
    manoDer:
      [0.055, -0.108, 0.096],

    codoDer:
      [0.180, -0.294, 0.360],

    hombroDer:
      [0.300, -0.425, 0.625],

    manoIzq:
      [-0.046, -0.061, -0.225],

    codoIzq:
      [-0.160, -0.202, 0.116],

    hombroIzq:
      [-0.278, -0.382, 0.525],

    rotDer:
      [-0.18, 0.00, -0.06],

    rotIzq:
      [-0.22, 0.06, 0.18],
  },

  escopeta: {
    manoDer:
      [0.056, -0.110, 0.100],

    codoDer:
      [0.184, -0.300, 0.368],

    hombroDer:
      [0.304, -0.430, 0.630],

    manoIzq:
      [-0.048, -0.073, -0.245],

    codoIzq:
      [-0.164, -0.212, 0.098],

    hombroIzq:
      [-0.282, -0.386, 0.520],

    rotDer:
      [-0.18, 0.00, -0.06],

    rotIzq:
      [-0.24, 0.05, 0.20],
  },

  francotirador: {
    manoDer:
      [0.056, -0.108, 0.098],

    codoDer:
      [0.182, -0.296, 0.362],

    hombroDer:
      [0.300, -0.425, 0.624],

    manoIzq:
      [-0.048, -0.056, -0.255],

    codoIzq:
      [-0.164, -0.196, 0.090],

    hombroIzq:
      [-0.282, -0.378, 0.516],

    rotDer:
      [-0.18, 0.00, -0.06],

    rotIzq:
      [-0.23, 0.05, 0.18],
  },

  lmg: {
    manoDer:
      [0.057, -0.113, 0.102],

    codoDer:
      [0.190, -0.305, 0.375],

    hombroDer:
      [0.310, -0.435, 0.638],

    manoIzq:
      [-0.050, -0.074, -0.230],

    codoIzq:
      [-0.174, -0.222, 0.106],

    hombroIzq:
      [-0.292, -0.392, 0.530],

    rotDer:
      [-0.19, 0.00, -0.07],

    rotIzq:
      [-0.24, 0.05, 0.20],
  },
};

function v3(v) {
  return new THREE.Vector3(...v);
}

function preparar(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  return mesh;
}

function crearSegmentoConico({
  radioInicio,
  radioFin,
  material,
  nombre,
}) {
  const mesh =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        radioInicio,
        radioFin,
        0.24,
        12,
        1,
        false
      ),
      material
    );

  mesh.name = nombre;

  return preparar(mesh);
}

function orientarSegmento(
  mesh,
  inicio,
  fin
) {
  const direccion =
    fin.clone().sub(inicio);

  const longitud =
    Math.max(
      0.001,
      direccion.length()
    );

  mesh.position
    .copy(inicio)
    .add(fin)
    .multiplyScalar(0.5);

  mesh.quaternion
    .setFromUnitVectors(
      new THREE.Vector3(
        0,
        1,
        0
      ),

      direccion
        .clone()
        .normalize()
    );

  mesh.scale.y =
    longitud / 0.24;
}

function crearFalange({
  largo,
  radio,
  material = MAT_GUANTE,
}) {
  const mesh =
    new THREE.Mesh(
      new THREE.CapsuleGeometry(
        radio,

        Math.max(
          0.003,
          largo - radio * 2
        ),

        4,
        7
      ),

      material
    );

  return preparar(mesh);
}

function crearDedo({
  nombre,
  largo1,
  largo2,
  radio,
  separacionX,
  tipo,
}) {
  const grupo =
    new THREE.Group();

  grupo.name = nombre;

  const falange1 =
    crearFalange({
      largo: largo1,
      radio,
    });

  const falange2 =
    crearFalange({
      largo: largo2,
      radio:
        radio * 0.90,
    });

  falange1.position.set(
    separacionX,
    0.031,
    -0.026
  );

  falange1.rotation.x =
    tipo === 'gatillo'
      ? 1.05
      : 0.88;

  falange1.rotation.z =
    separacionX * -1.2;

  falange2.position.set(
    separacionX,
    0.019,
    -0.050
  );

  falange2.rotation.x =
    tipo === 'gatillo'
      ? 1.30
      : 1.18;

  falange2.rotation.z =
    separacionX * -1.1;

  grupo.add(
    falange1,
    falange2
  );

  return grupo;
}

function crearMano({
  nombre,
  tipo = 'soporte',
  espejo = 1,
}) {
  const grupo =
    new THREE.Group();

  grupo.name = nombre;

  const siluetaPalma = [
    [-0.027, -0.038],
    [ 0.010, -0.043],
    [ 0.028, -0.026],
    [ 0.031,  0.018],
    [ 0.021,  0.039],
    [-0.016,  0.043],
    [-0.030,  0.020],
  ];

  const palma =
    perfilExtruido(
      siluetaPalma,
      0.078,
      MAT_GUANTE,
      {
        bisel: 0.006,
        curvaBisel: 3,
      }
    );

  palma.name =
    `${nombre}_palma`;

  grupo.add(
    preparar(palma)
  );

  const nudillera =
    cajaBiselada(
      0.070,
      0.018,
      0.032,
      MAT_GUANTE_PLACA,
      0.005
    );

  nudillera.position.set(
    0,
    0.030,
    -0.010
  );

  nudillera.rotation.x =
    -0.12;

  grupo.add(
    preparar(nudillera)
  );

  const cuff =
    cajaBiselada(
      0.060,
      0.043,
      0.056,
      MAT_MANGA_OSCURA,
      0.008
    );

  cuff.position.set(
    0,
    -0.055,
    0.005
  );

  grupo.add(
    preparar(cuff)
  );

  const cinta =
    cajaBiselada(
      0.064,
      0.011,
      0.058,
      MAT_COSTURA,
      0.003
    );

  cinta.position.set(
    0,
    -0.058,
    0.005
  );

  grupo.add(
    preparar(cinta)
  );

  const xs = [
    -0.026,
    -0.009,
     0.009,
     0.026,
  ];

  for (
    let i = 0;
    i < 4;
    i++
  ) {
    const esIndice =
      tipo === 'gatillo' &&
      i === 0;

    const dedo =
      crearDedo({
        nombre:
          `${nombre}_dedo_${i}`,

        largo1:
          i === 0 ||
          i === 3
            ? 0.034
            : 0.038,

        largo2:
          i === 0 ||
          i === 3
            ? 0.026
            : 0.030,

        radio: 0.0062,

        separacionX:
          xs[i] *
          espejo,

        tipo:
          esIndice
            ? 'gatillo'
            : 'normal',
      });

    grupo.add(dedo);
  }

  const pulgar1 =
    crearFalange({
      largo: 0.038,
      radio: 0.0075,
    });

  const pulgar2 =
    crearFalange({
      largo: 0.028,
      radio: 0.0065,
    });

  pulgar1.position.set(
    0.040 * espejo,
    -0.002,
    -0.002
  );

  pulgar1.rotation.z =
    -0.78 * espejo;

  pulgar1.rotation.x =
    0.46;

  pulgar2.position.set(
    0.051 * espejo,
    -0.015,
    -0.018
  );

  pulgar2.rotation.z =
    -0.94 * espejo;

  pulgar2.rotation.x =
    0.72;

  grupo.add(
    pulgar1,
    pulgar2
  );

  return grupo;
}

export function crearBrazosFPS(
  grupoArma,
  seleccionInicial
) {
  const rig =
    new THREE.Group();

  rig.name =
    'BrazosFPS_V3';

  grupoArma.add(rig);

  const brazoSupDer =
    crearSegmentoConico({
      radioInicio: 0.070,
      radioFin: 0.061,
      material: MAT_MANGA,
      nombre:
        'FPS_brazoSupDer',
    });

  const antebrazoDer =
    crearSegmentoConico({
      radioInicio: 0.061,
      radioFin: 0.047,
      material: MAT_MANGA,
      nombre:
        'FPS_antebrazoDer',
    });

  const brazoSupIzq =
    crearSegmentoConico({
      radioInicio: 0.070,
      radioFin: 0.061,
      material: MAT_MANGA,
      nombre:
        'FPS_brazoSupIzq',
    });

  const antebrazoIzq =
    crearSegmentoConico({
      radioInicio: 0.061,
      radioFin: 0.047,
      material: MAT_MANGA,
      nombre:
        'FPS_antebrazoIzq',
    });

  const codoDer =
    preparar(
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.050,
          12,
          8
        ),

        MAT_MANGA_OSCURA
      )
    );

  const codoIzq =
    codoDer.clone();

  const manoDer =
    crearMano({
      nombre:
        'FPS_manoDerecha',

      tipo:
        'gatillo',

      espejo: 1,
    });

  const manoIzq =
    crearMano({
      nombre:
        'FPS_manoIzquierda',

      tipo:
        'soporte',

      espejo: -1,
    });

  rig.add(
    brazoSupDer,
    antebrazoDer,

    brazoSupIzq,
    antebrazoIzq,

    codoDer,
    codoIzq,

    manoDer,
    manoIzq
  );

  let seleccion =
    seleccionInicial;

  function poseActual() {
    const cuerpo =
      seleccion?.cuerpo ??
      'pistola';

    return (
      POSES[cuerpo] ??
      POSES.rifle
    );
  }

  function aplicarPose() {
    const pose =
      poseActual();

    const manoD =
      v3(pose.manoDer);

    const codoD =
      v3(pose.codoDer);

    const hombroD =
      v3(pose.hombroDer);

    const manoI =
      v3(pose.manoIzq);

    const codoI =
      v3(pose.codoIzq);

    const hombroI =
      v3(pose.hombroIzq);

    orientarSegmento(
      brazoSupDer,
      hombroD,
      codoD
    );

    orientarSegmento(
      antebrazoDer,
      codoD,
      manoD
    );

    orientarSegmento(
      brazoSupIzq,
      hombroI,
      codoI
    );

    orientarSegmento(
      antebrazoIzq,
      codoI,
      manoI
    );

    codoDer.position.copy(
      codoD
    );

    codoIzq.position.copy(
      codoI
    );

    manoDer.position.copy(
      manoD
    );

    manoIzq.position.copy(
      manoI
    );

    manoDer.rotation.set(
      ...pose.rotDer
    );

    manoIzq.rotation.set(
      ...pose.rotIzq
    );
  }

  function actualizarSeleccion(
    nuevaSeleccion
  ) {
    seleccion =
      nuevaSeleccion;

    rig.visible =
      Boolean(
        nuevaSeleccion
      );

    if (nuevaSeleccion) {
      aplicarPose();
    }
  }

  function actualizar({
    visible = true,
  } = {}) {
    rig.visible =
      visible &&
      Boolean(seleccion);
  }

  function destruir() {
    grupoArma.remove(rig);

    rig.traverse(
      (obj) => {
        obj.geometry
          ?.dispose?.();
      }
    );
  }

  aplicarPose();

  return {
    grupo: rig,
    actualizar,
    actualizarSeleccion,
    destruir,
  };
}

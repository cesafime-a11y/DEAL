import * as THREE from 'three';

import {
  cajaBiselada,
  perfilExtruido,
} from '../armas/disenoArmas.js';


const MAT_MANGA =
  new THREE.MeshStandardMaterial({
    color: 0x303741,
    roughness: 0.90,
    metalness: 0.01,
  });


const MAT_MANGA_OSCURA =
  new THREE.MeshStandardMaterial({
    color: 0x232931,
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

    manoIzq:
      [-0.028, -0.098, 0.040],

    rotDer:
      [-0.16, 0.02, -0.06],

    rotIzq:
      [-0.13, 0.08, 0.13],

    aperturaCodo:
      0.090,
  },


  automatica: {
    manoDer:
      [0.054, -0.099, 0.084],

    manoIzq:
      [-0.030, -0.100, 0.034],

    rotDer:
      [-0.17, 0.02, -0.06],

    rotIzq:
      [-0.14, 0.08, 0.14],

    aperturaCodo:
      0.095,
  },


  revolver: {
    manoDer:
      [0.054, -0.097, 0.080],

    manoIzq:
      [-0.030, -0.094, 0.018],

    rotDer:
      [-0.16, 0.02, -0.05],

    rotIzq:
      [-0.11, 0.10, 0.11],

    aperturaCodo:
      0.095,
  },


  subfusil: {
    manoDer:
      [0.055, -0.103, 0.090],

    manoIzq:
      [-0.044, -0.078, -0.105],

    rotDer:
      [-0.17, 0.01, -0.06],

    rotIzq:
      [-0.20, 0.08, 0.16],

    aperturaCodo:
      0.105,
  },


  pdw: {
    manoDer:
      [0.055, -0.102, 0.088],

    manoIzq:
      [-0.043, -0.074, -0.130],

    rotDer:
      [-0.17, 0.01, -0.06],

    rotIzq:
      [-0.21, 0.07, 0.17],

    aperturaCodo:
      0.110,
  },


  rifle: {
    manoDer:
      [0.055, -0.108, 0.096],

    manoIzq:
      [-0.046, -0.061, -0.225],

    rotDer:
      [-0.18, 0.00, -0.06],

    rotIzq:
      [-0.22, 0.06, 0.18],

    aperturaCodo:
      0.115,
  },


  escopeta: {
    manoDer:
      [0.056, -0.110, 0.100],

    manoIzq:
      [-0.048, -0.073, -0.245],

    rotDer:
      [-0.18, 0.00, -0.06],

    rotIzq:
      [-0.24, 0.05, 0.20],

    aperturaCodo:
      0.120,
  },


  francotirador: {
    manoDer:
      [0.056, -0.108, 0.098],

    manoIzq:
      [-0.048, -0.056, -0.255],

    rotDer:
      [-0.18, 0.00, -0.06],

    rotIzq:
      [-0.23, 0.05, 0.18],

    aperturaCodo:
      0.115,
  },


  lmg: {
    manoDer:
      [0.057, -0.113, 0.102],

    manoIzq:
      [-0.050, -0.074, -0.230],

    rotDer:
      [-0.19, 0.00, -0.07],

    rotIzq:
      [-0.24, 0.05, 0.20],

    aperturaCodo:
      0.135,
  },
};


function preparar(
  mesh
) {
  mesh.castShadow =
    false;

  mesh.receiveShadow =
    false;

  mesh.frustumCulled =
    false;

  return mesh;
}


function crearSegmentoConico(
  radioInicio,
  radioFin,
  material,
  nombre
) {
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

  mesh.name =
    nombre;

  return preparar(
    mesh
  );
}


function orientarSegmento(
  mesh,
  inicio,
  fin
) {
  const direccion =
    fin
      .clone()
      .sub(
        inicio
      );


  const longitud =
    Math.max(
      0.001,
      direccion.length()
    );


  mesh.position
    .copy(
      inicio
    )
    .add(
      fin
    )
    .multiplyScalar(
      0.5
    );


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


  mesh.scale.set(
    1,
    longitud / 0.24,
    1
  );
}


function crearFalange(
  largo,
  radio
) {
  return preparar(
    new THREE.Mesh(
      new THREE.CapsuleGeometry(
        radio,

        Math.max(
          0.003,
          largo -
          radio * 2
        ),

        4,

        7
      ),

      MAT_GUANTE
    )
  );
}


function crearDedo(
  x,
  gatillo = false
) {
  const grupo =
    new THREE.Group();


  const f1 =
    crearFalange(
      0.036,
      0.0062
    );


  const f2 =
    crearFalange(
      0.028,
      0.0057
    );


  f1.position.set(
    x,
    0.030,
    -0.026
  );


  f1.rotation.x =
    gatillo
      ? 1.05
      : 0.88;


  f2.position.set(
    x,
    0.018,
    -0.050
  );


  f2.rotation.x =
    gatillo
      ? 1.30
      : 1.18;


  grupo.add(
    f1,
    f2
  );


  return grupo;
}


function crearMano(
  nombre,
  izquierda = false,
  manoGatillo = false
) {
  const grupo =
    new THREE.Group();


  grupo.name =
    nombre;


  const palma =
    perfilExtruido(
      [
        [-0.030, -0.039],
        [ 0.012, -0.043],
        [ 0.030, -0.025],
        [ 0.031,  0.018],
        [ 0.020,  0.041],
        [-0.017,  0.044],
        [-0.031,  0.020],
      ],

      0.078,

      MAT_GUANTE,

      {
        bisel:
          0.006,

        curvaBisel:
          3,
      }
    );


  preparar(
    palma
  );


  grupo.add(
    palma
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


  preparar(
    nudillera
  );


  grupo.add(
    nudillera
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


  preparar(
    cuff
  );


  grupo.add(
    cuff
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


  preparar(
    cinta
  );


  grupo.add(
    cinta
  );


  const signo =
    izquierda
      ? -1
      : 1;


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
    grupo.add(
      crearDedo(
        xs[i] *
          signo,

        manoGatillo &&
          i === 0
      )
    );
  }


  const pulgar1 =
    crearFalange(
      0.038,
      0.0075
    );


  const pulgar2 =
    crearFalange(
      0.028,
      0.0065
    );


  pulgar1.position.set(
    0.040 *
      signo,
    -0.002,
    -0.002
  );


  pulgar1.rotation.z =
    -0.78 *
    signo;


  pulgar1.rotation.x =
    0.46;


  pulgar2.position.set(
    0.051 *
      signo,
    -0.015,
    -0.018
  );


  pulgar2.rotation.z =
    -0.94 *
    signo;


  pulgar2.rotation.x =
    0.72;


  grupo.add(
    pulgar1,
    pulgar2
  );


  return grupo;
}


export function crearBrazosFPS(
  camera,
  grupoArma,
  seleccionInicial
) {
  const rig =
    new THREE.Group();


  rig.name =
    'BrazosFPS_V4';


  camera.add(
    rig
  );


  const HOMBRO_DER =
    new THREE.Vector3(
      0.215,
      -0.245,
      0.105
    );


  const HOMBRO_IZQ =
    new THREE.Vector3(
      -0.215,
      -0.245,
      0.105
    );


  const brazoSupDer =
    crearSegmentoConico(
      0.068,
      0.058,
      MAT_MANGA,
      'FPS_brazoSupDer_V4'
    );


  const antebrazoDer =
    crearSegmentoConico(
      0.058,
      0.045,
      MAT_MANGA_OSCURA,
      'FPS_antebrazoDer_V4'
    );


  const brazoSupIzq =
    crearSegmentoConico(
      0.068,
      0.058,
      MAT_MANGA,
      'FPS_brazoSupIzq_V4'
    );


  const antebrazoIzq =
    crearSegmentoConico(
      0.058,
      0.045,
      MAT_MANGA_OSCURA,
      'FPS_antebrazoIzq_V4'
    );


  const codoDer =
    preparar(
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.047,
          12,
          8
        ),

        MAT_MANGA_OSCURA
      )
    );


  const codoIzq =
    preparar(
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.047,
          12,
          8
        ),

        MAT_MANGA_OSCURA
      )
    );


  const manoDer =
    crearMano(
      'FPS_manoDerecha_V4',
      false,
      true
    );


  const manoIzq =
    crearMano(
      'FPS_manoIzquierda_V4',
      true,
      false
    );


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


  const manoDerLocalArma =
    new THREE.Vector3();


  const manoIzqLocalArma =
    new THREE.Vector3();


  const manoDerCamara =
    new THREE.Vector3();


  const manoIzqCamara =
    new THREE.Vector3();


  const codoDerPos =
    new THREE.Vector3();


  const codoIzqPos =
    new THREE.Vector3();


  const rotLocalDer =
    new THREE.Quaternion();


  const rotLocalIzq =
    new THREE.Quaternion();


  const rotFinalDer =
    new THREE.Quaternion();


  const rotFinalIzq =
    new THREE.Quaternion();


  const eulerTemp =
    new THREE.Euler();


  function poseActual() {
    const clave =
      seleccion?.cuerpo ??
      'pistola';


    return (
      POSES[clave] ??
      POSES.rifle
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
  }


  function actualizar({
    visible = true,
  } = {}) {
    rig.visible =
      visible &&
      Boolean(
        seleccion
      );


    if (
      !rig.visible
    ) {
      return;
    }


    const pose =
      poseActual();


    grupoArma.updateMatrix();


    manoDerLocalArma
      .fromArray(
        pose.manoDer
      );


    manoIzqLocalArma
      .fromArray(
        pose.manoIzq
      );


    manoDerCamara
      .copy(
        manoDerLocalArma
      )
      .applyMatrix4(
        grupoArma.matrix
      );


    manoIzqCamara
      .copy(
        manoIzqLocalArma
      )
      .applyMatrix4(
        grupoArma.matrix
      );


    codoDerPos
      .copy(
        HOMBRO_DER
      )
      .lerp(
        manoDerCamara,
        0.54
      );


    codoDerPos.x +=
      pose.aperturaCodo;


    codoDerPos.y -=
      0.045;


    codoDerPos.z +=
      0.025;


    codoIzqPos
      .copy(
        HOMBRO_IZQ
      )
      .lerp(
        manoIzqCamara,
        0.54
      );


    codoIzqPos.x -=
      pose.aperturaCodo;


    codoIzqPos.y -=
      0.045;


    codoIzqPos.z +=
      0.025;


    orientarSegmento(
      brazoSupDer,
      HOMBRO_DER,
      codoDerPos
    );


    orientarSegmento(
      antebrazoDer,
      codoDerPos,
      manoDerCamara
    );


    orientarSegmento(
      brazoSupIzq,
      HOMBRO_IZQ,
      codoIzqPos
    );


    orientarSegmento(
      antebrazoIzq,
      codoIzqPos,
      manoIzqCamara
    );


    codoDer.position.copy(
      codoDerPos
    );


    codoIzq.position.copy(
      codoIzqPos
    );


    manoDer.position.copy(
      manoDerCamara
    );


    manoIzq.position.copy(
      manoIzqCamara
    );


    eulerTemp.set(
      ...pose.rotDer
    );


    rotLocalDer.setFromEuler(
      eulerTemp
    );


    rotFinalDer
      .copy(
        grupoArma.quaternion
      )
      .multiply(
        rotLocalDer
      );


    manoDer.quaternion.copy(
      rotFinalDer
    );


    eulerTemp.set(
      ...pose.rotIzq
    );


    rotLocalIzq.setFromEuler(
      eulerTemp
    );


    rotFinalIzq
      .copy(
        grupoArma.quaternion
      )
      .multiply(
        rotLocalIzq
      );


    manoIzq.quaternion.copy(
      rotFinalIzq
    );
  }


  function destruir() {
    camera.remove(
      rig
    );


    rig.traverse(
      (obj) => {
        obj.geometry
          ?.dispose?.();
      }
    );
  }


  return {
    grupo:
      rig,

    actualizar,

    actualizarSeleccion,

    destruir,
  };
}

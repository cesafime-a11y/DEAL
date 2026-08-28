import * as THREE from 'three';

import {
  cajaBiselada,
  perfilExtruido,
} from '../armas/disenoArmas.js';


export const ALTURA_OJOS_DESDE_PIES =
  1.70;


/* ═══════════════════════════════════
   MATERIALES
═══════════════════════════════════ */

const MAT_CHAQUETA =
  new THREE.MeshStandardMaterial({
    color:
      0x343c47,

    roughness:
      0.86,

    metalness:
      0.01,
  });


const MAT_CHAQUETA_OSCURA =
  new THREE.MeshStandardMaterial({
    color:
      0x242a32,

    roughness:
      0.92,

    metalness:
      0.01,
  });


const MAT_INTERIOR =
  new THREE.MeshStandardMaterial({
    color:
      0x151a20,

    roughness:
      0.96,

    metalness:
      0,

    side:
      THREE.DoubleSide,
  });


const MAT_PANTALON =
  new THREE.MeshStandardMaterial({
    color:
      0x2b3138,

    roughness:
      0.90,

    metalness:
      0.02,
  });


const MAT_PANTALON_OSCURO =
  new THREE.MeshStandardMaterial({
    color:
      0x20252b,

    roughness:
      0.94,

    metalness:
      0.02,
  });


const MAT_CINTURON =
  new THREE.MeshStandardMaterial({
    color:
      0x121519,

    roughness:
      0.91,

    metalness:
      0.06,
  });


const MAT_METAL =
  new THREE.MeshStandardMaterial({
    color:
      0x777064,

    roughness:
      0.34,

    metalness:
      0.68,
  });


const MAT_PIEL =
  new THREE.MeshStandardMaterial({
    color:
      0xb98868,

    roughness:
      0.78,

    metalness:
      0,
  });


const MAT_GUANTE =
  new THREE.MeshStandardMaterial({
    color:
      0x15191e,

    roughness:
      0.92,

    metalness:
      0.03,
  });


const MAT_RODILLERA =
  new THREE.MeshStandardMaterial({
    color:
      0x15191e,

    roughness:
      0.86,

    metalness:
      0.08,
  });


const MAT_BOTA =
  new THREE.MeshStandardMaterial({
    color:
      0x171a1f,

    roughness:
      0.95,

    metalness:
      0.02,
  });


const MAT_SUELA =
  new THREE.MeshStandardMaterial({
    color:
      0x090b0e,

    roughness:
      0.98,

    metalness:
      0.01,
  });


/*
  Proxy invisible para sombras.

  No usa transparencia.
*/
const MAT_SHADOW_PROXY =
  new THREE.MeshBasicMaterial({
    color:
      0x000000,

    colorWrite:
      false,

    depthWrite:
      false,

    side:
      THREE.DoubleSide,
  });



/* ═══════════════════════════════════
   HELPERS
═══════════════════════════════════ */

function preparar(
  mesh,
  {
    sombra = true,
    recibeSombra = true,
  } = {}
) {

  mesh.castShadow =
    sombra;


  mesh.receiveShadow =
    recibeSombra;


  mesh.frustumCulled =
    false;


  return mesh;
}



function segmentoConico({
  radioArriba,
  radioAbajo,
  largo,
  material,
  segmentos = 14,
}) {

  return preparar(

    new THREE.Mesh(

      new THREE.CylinderGeometry(
        radioArriba,
        radioAbajo,
        largo,
        segmentos,
        1,
        false
      ),

      material
    )
  );
}



function capsulaVisual({
  radio,
  largo,
  material,
}) {

  return preparar(

    new THREE.Mesh(

      new THREE.CapsuleGeometry(
        radio,
        largo,
        6,
        12
      ),

      material
    )
  );
}



function crearProxySombra(
  meshOriginal
) {

  const proxy =
    new THREE.Mesh(

      meshOriginal
        .geometry
        .clone(),

      MAT_SHADOW_PROXY
    );


  proxy.position.copy(
    meshOriginal.position
  );


  proxy.quaternion.copy(
    meshOriginal.quaternion
  );


  proxy.scale.copy(
    meshOriginal.scale
  );


  proxy.castShadow =
    true;


  proxy.receiveShadow =
    false;


  proxy.frustumCulled =
    false;


  return proxy;
}



/*
  TORSO ABIERTO.

  No genera cara superior.
*/
function geometriaTorsoAbierto({

  anchoSuperior,

  anchoInferior,

  profundidadSuperior,

  profundidadInferior,

  alto,

}) {

  const yt =
    alto / 2;


  const yb =
    -alto / 2;


  const xt =
    anchoSuperior / 2;


  const xb =
    anchoInferior / 2;


  const zt =
    profundidadSuperior / 2;


  const zb =
    profundidadInferior / 2;


  const v = {

    tlf:
      [-xt, yt, -zt],

    trf:
      [xt, yt, -zt],

    tlb:
      [-xt, yt, zt],

    trb:
      [xt, yt, zt],

    blf:
      [-xb, yb, -zb],

    brf:
      [xb, yb, -zb],

    blb:
      [-xb, yb, zb],

    brb:
      [xb, yb, zb],
  };


  const posiciones =
    [];


  function tri(
    a,
    b,
    c
  ) {

    posiciones.push(
      ...a,
      ...b,
      ...c
    );
  }


  function quad(
    a,
    b,
    c,
    d
  ) {

    tri(
      a,
      b,
      c
    );

    tri(
      a,
      c,
      d
    );
  }


  /* frente */

  quad(
    v.tlf,
    v.blf,
    v.brf,
    v.trf
  );


  /* espalda */

  quad(
    v.trb,
    v.brb,
    v.blb,
    v.tlb
  );


  /* izquierda */

  quad(
    v.tlb,
    v.blb,
    v.blf,
    v.tlf
  );


  /* derecha */

  quad(
    v.trf,
    v.brf,
    v.brb,
    v.trb
  );


  /* fondo */

  quad(
    v.blf,
    v.blb,
    v.brb,
    v.brf
  );


  /*
    NO hay cara superior.
  */


  const geo =
    new THREE.BufferGeometry();


  geo.setAttribute(

    'position',

    new THREE.Float32BufferAttribute(
      posiciones,
      3
    )
  );


  geo.computeVertexNormals();

  geo.computeBoundingBox();

  geo.computeBoundingSphere();


  return geo;
}



function crearBota() {

  const grupo =
    new THREE.Group();


  const perfil = [

    [-0.145, -0.035],

    [-0.118, -0.070],

    [0.070, -0.070],

    [0.105, -0.040],

    [0.092, 0.052],

    [0.045, 0.094],

    [-0.052, 0.094],

    [-0.112, 0.058],
  ];


  const cuerpo =
    perfilExtruido(

      perfil,

      0.17,

      MAT_BOTA,

      {
        bisel:
          0.010,

        curvaBisel:
          3,
      }
    );


  preparar(
    cuerpo
  );


  grupo.add(
    cuerpo
  );


  const suela =
    cajaBiselada(

      0.18,

      0.030,

      0.255,

      MAT_SUELA,

      0.006
    );


  suela.position.set(
    0,
    -0.076,
    -0.020
  );


  preparar(
    suela
  );


  grupo.add(
    suela
  );


  const puntera =
    cajaBiselada(

      0.15,

      0.046,

      0.09,

      MAT_BOTA,

      0.012
    );


  puntera.position.set(
    0,
    -0.004,
    -0.112
  );


  puntera.rotation.x =
    -0.08;


  preparar(
    puntera
  );


  grupo.add(
    puntera
  );


  for (
    let i = 0;
    i < 3;
    i++
  ) {

    const cordon =
      cajaBiselada(

        0.12,

        0.008,

        0.014,

        MAT_PANTALON_OSCURO,

        0.002
      );


    cordon.position.set(

      0,

      0.053 -
      i * 0.021,

      -0.022 -
      i * 0.006
    );


    cordon.rotation.z =
      i % 2 === 0
        ? 0.11
        : -0.11;


    preparar(
      cordon
    );


    grupo.add(
      cordon
    );
  }


  return grupo;
}



/* ═══════════════════════════════════
   PERSONAJE
═══════════════════════════════════ */

export function crearPersonajeVisual(

  scene,

  {
    alturaOjos =
      ALTURA_OJOS_DESDE_PIES,
  } = {}

) {

  const grupo =
    new THREE.Group();


  grupo.name =
    'JugadorFullBody_V41';


  scene.add(
    grupo
  );


  const partes =
    {};


  const pelvisPivot =
    new THREE.Group();


  const abdomenPivot =
    new THREE.Group();


  const pechoPivot =
    new THREE.Group();


  grupo.add(

    pelvisPivot,

    abdomenPivot,

    pechoPivot
  );


  /*
    Nuevas alturas.
  */

  pelvisPivot.position.set(
    0,
    0.91,
    0.025
  );


  abdomenPivot.position.set(
    0,
    1.075,
    0.018
  );


  pechoPivot.position.set(
    0,
    1.305,
    0.020
  );



  /* ── PELVIS ───────────────────── */

  const pelvis =
    perfilExtruido(

      [

        [-0.084, -0.090],

        [0.076, -0.090],

        [0.090, -0.040],

        [0.086, 0.075],

        [0.064, 0.094],

        [-0.066, 0.094],

        [-0.090, 0.055],
      ],

      0.275,

      MAT_PANTALON,

      {
        bisel:
          0.012,

        curvaBisel:
          3,
      }
    );


  preparar(
    pelvis
  );


  pelvisPivot.add(
    pelvis
  );


  partes.pelvis = {

    mesh:
      pelvis,

    collider: {

      tipo:
        'caja',

      tamano: [
        0.275,
        0.19,
        0.17,
      ],
    },
  };


  const cinturon =
    cajaBiselada(

      0.292,

      0.040,

      0.17,

      MAT_CINTURON,

      0.006
    );


  cinturon.position.y =
    0.070;


  preparar(
    cinturon
  );


  pelvisPivot.add(
    cinturon
  );


  const hebilla =
    cajaBiselada(

      0.045,

      0.032,

      0.016,

      MAT_METAL,

      0.004
    );


  hebilla.position.set(
    0,
    0.070,
    -0.094
  );


  preparar(
    hebilla
  );


  pelvisPivot.add(
    hebilla
  );



  /* ── ABDOMEN ──────────────────── */

  const abdomen =
    perfilExtruido(

      [

        [-0.072, -0.105],

        [0.068, -0.105],

        [0.078, -0.060],

        [0.078, 0.075],

        [0.064, 0.110],

        [-0.066, 0.110],

        [-0.080, 0.060],
      ],

      0.300,

      MAT_CHAQUETA_OSCURA,

      {
        bisel:
          0.012,

        curvaBisel:
          3,
      }
    );


  preparar(
    abdomen
  );


  abdomenPivot.add(
    abdomen
  );


  partes.abdomen = {

    mesh:
      abdomen,

    collider: {

      tipo:
        'caja',

      tamano: [
        0.30,
        0.22,
        0.16,
      ],
    },
  };


  const bordeAbdomen =
    cajaBiselada(

      0.292,

      0.020,

      0.155,

      MAT_CHAQUETA,

      0.0035
    );


  bordeAbdomen.position.y =
    -0.096;


  preparar(
    bordeAbdomen
  );


  abdomenPivot.add(
    bordeAbdomen
  );



  /* ── PECHO ABIERTO ────────────── */

  const pecho =
    new THREE.Mesh(

      geometriaTorsoAbierto({

        anchoSuperior:
          0.355,

        anchoInferior:
          0.315,

        profundidadSuperior:
          0.145,

        profundidadInferior:
          0.165,

        alto:
          0.270,
      }),

      MAT_CHAQUETA
    );


  preparar(
    pecho
  );


  pechoPivot.add(
    pecho
  );


  partes.pecho = {

    mesh:
      pecho,

    collider: {

      tipo:
        'caja',

      tamano: [
        0.355,
        0.27,
        0.165,
      ],
    },
  };


  /*
    Interior hundido.
  */

  const interiorPecho =
    cajaBiselada(

      0.225,

      0.012,

      0.105,

      MAT_INTERIOR,

      0.003
    );


  interiorPecho.position.set(
    0,
    0.055,
    0.005
  );


  preparar(
    interiorPecho
  );


  pechoPivot.add(
    interiorPecho
  );


  const cremallera =
    cajaBiselada(

      0.018,

      0.210,

      0.009,

      MAT_CHAQUETA_OSCURA,

      0.0025
    );


  cremallera.position.set(
    0,
    -0.010,
    -0.086
  );


  preparar(
    cremallera
  );


  pechoPivot.add(
    cremallera
  );


  const bolsilloPechoIzq =
    cajaBiselada(

      0.100,

      0.058,

      0.010,

      MAT_CHAQUETA_OSCURA,

      0.004
    );


  bolsilloPechoIzq.position.set(
    -0.080,
    0.035,
    -0.086
  );


  preparar(
    bolsilloPechoIzq
  );


  pechoPivot.add(
    bolsilloPechoIzq
  );


  const bolsilloPechoDer =
    bolsilloPechoIzq.clone();


  bolsilloPechoDer.position.x =
    0.080;


  pechoPivot.add(
    bolsilloPechoDer
  );



  /* ── CUELLO / CABEZA ──────────── */

  const cuelloPivot =
    new THREE.Group();


  cuelloPivot.position.set(
    0,
    1.515,
    0.035
  );


  grupo.add(
    cuelloPivot
  );


  const cuello =
    segmentoConico({

      radioArriba:
        0.057,

      radioAbajo:
        0.064,

      largo:
        0.090,

      material:
        MAT_PIEL,
    });


  cuelloPivot.add(
    cuello
  );


  cuello.visible =
    false;


  const cabezaPivot =
    new THREE.Group();


  cabezaPivot.position.set(
    0,
    1.625,
    0.030
  );


  grupo.add(
    cabezaPivot
  );


  const cabeza =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        0.135,
        20,
        16
      ),

      MAT_PIEL
    );


  cabeza.scale.set(
    0.90,
    1.08,
    0.94
  );


  preparar(
    cabeza
  );


  cabezaPivot.add(
    cabeza
  );


  cabeza.visible =
    false;


  partes.cabeza = {

    mesh:
      cabeza,

    collider: {

      tipo:
        'esfera',

      radio:
        0.135,
    },
  };


  cabezaPivot.add(
    crearProxySombra(
      cabeza
    )
  );


  cuelloPivot.add(
    crearProxySombra(
      cuello
    )
  );



  /* ── PIERNAS ──────────────────── */

  function crearPierna(
    lado
  ) {

    const hipPivot =
      new THREE.Group();


    hipPivot.position.set(
      lado * 0.108,
      0.855,
      0.025
    );


    grupo.add(
      hipPivot
    );


    const muslo =
      segmentoConico({

        radioArriba:
          0.085,

        radioAbajo:
          0.071,

        largo:
          0.335,

        material:
          MAT_PANTALON,
      });


    muslo.position.y =
      -0.1675;


    hipPivot.add(
      muslo
    );


    const bolsillo =
      cajaBiselada(

        0.018,

        0.108,

        0.100,

        MAT_PANTALON_OSCURO,

        0.005
      );


    bolsillo.position.set(

      lado * 0.077,

      -0.14,

      0.010
    );


    preparar(
      bolsillo
    );


    hipPivot.add(
      bolsillo
    );


    const rodillaPivot =
      new THREE.Group();


    rodillaPivot.position.y =
      -0.335;


    hipPivot.add(
      rodillaPivot
    );


    const rodillera =
      cajaBiselada(

        0.118,

        0.082,

        0.052,

        MAT_RODILLERA,

        0.011
      );


    rodillera.position.set(
      0,
      -0.010,
      -0.048
    );


    rodillera.rotation.x =
      0.10;


    preparar(
      rodillera
    );


    rodillaPivot.add(
      rodillera
    );


    const pierna =
      segmentoConico({

        radioArriba:
          0.064,

        radioAbajo:
          0.051,

        largo:
          0.295,

        material:
          MAT_PANTALON_OSCURO,
      });


    pierna.position.y =
      -0.165;


    rodillaPivot.add(
      pierna
    );


    const tobilloPivot =
      new THREE.Group();


    tobilloPivot.position.y =
      -0.315;


    rodillaPivot.add(
      tobilloPivot
    );


    const pie =
      crearBota();


    pie.position.set(
      0,
      -0.030,
      -0.068
    );


    tobilloPivot.add(
      pie
    );


    const pieFisico =
      pie.children.find(
        child =>
          child.isMesh
      );


    return {

      hipPivot,

      rodillaPivot,

      tobilloPivot,

      muslo,

      pierna,

      pieFisico,
    };
  }


  const piernaIzq =
    crearPierna(
      -1
    );


  const piernaDer =
    crearPierna(
      1
    );


  partes.musloIzq = {

    mesh:
      piernaIzq.muslo,

    collider: {

      tipo:
        'capsula',

      radio:
        0.078,

      largo:
        0.25,
    },
  };


  partes.piernaIzq = {

    mesh:
      piernaIzq.pierna,

    collider: {

      tipo:
        'capsula',

      radio:
        0.056,

      largo:
        0.22,
    },
  };


  partes.pieIzq = {

    mesh:
      piernaIzq.pieFisico,

    collider: {

      tipo:
        'caja',

      tamano: [
        0.17,
        0.11,
        0.255,
      ],
    },
  };


  partes.musloDer = {

    mesh:
      piernaDer.muslo,

    collider: {

      tipo:
        'capsula',

      radio:
        0.078,

      largo:
        0.25,
    },
  };


  partes.piernaDer = {

    mesh:
      piernaDer.pierna,

    collider: {

      tipo:
        'capsula',

      radio:
        0.056,

      largo:
        0.22,
    },
  };


  partes.pieDer = {

    mesh:
      piernaDer.pieFisico,

    collider: {

      tipo:
        'caja',

      tamano: [
        0.17,
        0.11,
        0.255,
      ],
    },
  };



  /* ── BRAZOS DEL CUERPO ────────── */

  function crearBrazo(
    lado
  ) {

    const hombroPivot =
      new THREE.Group();


    hombroPivot.position.set(

      lado * 0.225,

      1.405,

      0.035
    );


    grupo.add(
      hombroPivot
    );


    const hombro =
      new THREE.Mesh(

        new THREE.SphereGeometry(
          0.074,
          12,
          9
        ),

        MAT_CHAQUETA
      );


    preparar(
      hombro
    );


    hombroPivot.add(
      hombro
    );


    const brazoSup =
      capsulaVisual({

        radio:
          0.059,

        largo:
          0.195,

        material:
          MAT_CHAQUETA,
      });


    brazoSup.position.y =
      -0.140;


    hombroPivot.add(
      brazoSup
    );


    const codoPivot =
      new THREE.Group();


    codoPivot.position.y =
      -0.280;


    hombroPivot.add(
      codoPivot
    );


    const codo =
      new THREE.Mesh(

        new THREE.SphereGeometry(
          0.052,
          10,
          8
        ),

        MAT_CHAQUETA_OSCURA
      );


    preparar(
      codo
    );


    codoPivot.add(
      codo
    );


    const brazoInf =
      capsulaVisual({

        radio:
          0.049,

        largo:
          0.185,

        material:
          MAT_CHAQUETA_OSCURA,
      });


    brazoInf.position.y =
      -0.132;


    codoPivot.add(
      brazoInf
    );


    const mano =
      cajaBiselada(

        0.070,

        0.082,

        0.048,

        MAT_GUANTE,

        0.009
      );


    mano.position.y =
      -0.275;


    preparar(
      mano
    );


    codoPivot.add(
      mano
    );


    hombro.visible =
      false;


    brazoSup.visible =
      false;


    codo.visible =
      false;


    brazoInf.visible =
      false;


    mano.visible =
      false;


    hombroPivot.add(

      crearProxySombra(
        hombro
      ),

      crearProxySombra(
        brazoSup
      )
    );


    codoPivot.add(

      crearProxySombra(
        codo
      ),

      crearProxySombra(
        brazoInf
      ),

      crearProxySombra(
        mano
      )
    );


    return {

      hombroPivot,

      codoPivot,

      brazoSup,

      brazoInf,
    };
  }


  const brazoIzq =
    crearBrazo(
      -1
    );


  const brazoDer =
    crearBrazo(
      1
    );


  partes.brazoSupIzq = {

    mesh:
      brazoIzq.brazoSup,

    collider: {

      tipo:
        'capsula',

      radio:
        0.055,

      largo:
        0.18,
    },
  };


  partes.brazoInfIzq = {

    mesh:
      brazoIzq.brazoInf,

    collider: {

      tipo:
        'capsula',

      radio:
        0.046,

      largo:
        0.17,
    },
  };


  partes.brazoSupDer = {

    mesh:
      brazoDer.brazoSup,

    collider: {

      tipo:
        'capsula',

      radio:
        0.055,

      largo:
        0.18,
    },
  };


  partes.brazoInfDer = {

    mesh:
      brazoDer.brazoInf,

    collider: {

      tipo:
        'capsula',

      radio:
        0.046,

      largo:
        0.17,
    },
  };



  /* ═══════════════════════════════════
     ANIMACIÓN
  ═══════════════════════════════════ */

  let tiempoPaso =
    0;


  let intensidadPaso =
    0;


  const posCamara =
    new THREE.Vector3();


  const dirCamara =
    new THREE.Vector3();


  const dirPlana =
    new THREE.Vector3();


  const quatCamara =
    new THREE.Quaternion();


  const eulerCamara =
    new THREE.Euler(
      0,
      0,
      0,
      'YXZ'
    );



  function actualizar(

    camera,

    velocidad,

    dt,

    {
      armado = false,
      apuntando = false,
    } = {}

  ) {

    camera.updateMatrixWorld(
      true
    );


    camera.getWorldPosition(
      posCamara
    );


    camera.getWorldDirection(
      dirCamara
    );


    camera.getWorldQuaternion(
      quatCamara
    );


    dirPlana
      .copy(
        dirCamara
      )
      .setY(
        0
      );


    if (
      dirPlana.lengthSq() <
      1e-6
    ) {

      dirPlana.set(
        0,
        0,
        -1
      );
    }


    dirPlana.normalize();


    eulerCamara
      .setFromQuaternion(
        quatCamara
      );


    /*
      El cuerpo queda bastante
      más atrás que V4.
    */

    const retrocesoCuerpo =

      0.105 +

      (
        armado
          ? 0.045
          : 0
      )

      +

      (
        apuntando
          ? 0.010
          : 0
      );


    grupo.position.copy(
      posCamara
    );


    grupo.position
      .addScaledVector(

        dirPlana,

        -retrocesoCuerpo
      );


    grupo.position.y =

      posCamara.y

      -

      alturaOjos

      -

      0.005;


    grupo.rotation.set(
      0,
      eulerCamara.y,
      0
    );


    const pitch =
      THREE.MathUtils.clamp(

        eulerCamara.x,

        -0.75,

        1.25
      );


    pechoPivot.rotation.x =
      -pitch *
      0.035;


    abdomenPivot.rotation.x =
      -pitch *
      0.018;


    pechoPivot.position.y =

      1.305

      -

      (
        armado
          ? 0.020
          : 0
      )

      -

      (
        apuntando
          ? 0.008
          : 0
      );


    abdomenPivot.position.y =

      1.075

      -

      (
        armado
          ? 0.008
          : 0
      );


    /* locomoción */

    const v =
      THREE.MathUtils.clamp(

        (velocidad || 0)
        /
        5.5,

        0,

        1
      );


    intensidadPaso =
      THREE.MathUtils.lerp(

        intensidadPaso,

        v,

        Math.min(
          1,
          dt * 10
        )
      );


    if (
      intensidadPaso >
      0.01
    ) {

      tiempoPaso +=

        dt

        *

        (
          6.0

          +

          intensidadPaso *
          4.0
        );
    }


    const pasoIzq =

      Math.sin(
        tiempoPaso
      )

      *

      intensidadPaso;


    const pasoDer =

      Math.sin(
        tiempoPaso +
        Math.PI
      )

      *

      intensidadPaso;


    piernaIzq
      .hipPivot
      .rotation
      .x =

        pasoIzq *
        0.40;


    piernaDer
      .hipPivot
      .rotation
      .x =

        pasoDer *
        0.40;


    piernaIzq
      .rodillaPivot
      .rotation
      .x =

        Math.max(
          0,
          -pasoIzq
        )

        *

        0.36;


    piernaDer
      .rodillaPivot
      .rotation
      .x =

        Math.max(
          0,
          -pasoDer
        )

        *

        0.36;


    piernaIzq
      .tobilloPivot
      .rotation
      .x =

        Math.max(
          0,
          pasoIzq
        )

        *

        -0.12;


    piernaDer
      .tobilloPivot
      .rotation
      .x =

        Math.max(
          0,
          pasoDer
        )

        *

        -0.12;


    brazoIzq
      .hombroPivot
      .rotation
      .x =

        pasoDer *
        0.16;


    brazoDer
      .hombroPivot
      .rotation
      .x =

        pasoIzq *
        0.16;


    brazoIzq
      .codoPivot
      .rotation
      .x =
        -0.10;


    brazoDer
      .codoPivot
      .rotation
      .x =
        -0.10;


    pelvisPivot.position.y =

      0.91

      +

      Math.abs(
        Math.sin(
          tiempoPaso * 2
        )
      )

      *

      0.005

      *

      intensidadPaso;


    abdomenPivot.rotation.z =

      Math.sin(
        tiempoPaso
      )

      *

      0.008

      *

      intensidadPaso;


    pechoPivot.rotation.z =

      Math.sin(
        tiempoPaso
      )

      *

      0.006

      *

      intensidadPaso;


    grupo.updateMatrixWorld(
      true
    );
  }



  function mostrarAnimado(
    visible
  ) {

    grupo.visible =
      visible;
  }



  function obtenerPartesRagdoll() {

    grupo.updateMatrixWorld(
      true
    );


    return Object
      .entries(
        partes
      )
      .map(
        (
          [
            nombre,
            parte,
          ]
        ) => {

          const posicion =
            new THREE.Vector3();


          const quaternion =
            new THREE.Quaternion();


          const escala =
            new THREE.Vector3();


          parte.mesh
            .matrixWorld
            .decompose(

              posicion,

              quaternion,

              escala
            );


          return {

            nombre,

            datos: {
              collider:
                parte.collider,
            },

            meshOriginal:
              parte.mesh,

            posicion,

            quaternion,
          };
        }
      );
  }



  function obtenerHombrosWorld() {

    const izquierda =
      new THREE.Vector3();


    const derecha =
      new THREE.Vector3();


    brazoIzq
      .hombroPivot
      .getWorldPosition(
        izquierda
      );


    brazoDer
      .hombroPivot
      .getWorldPosition(
        derecha
      );


    return {
      izquierda,
      derecha,
    };
  }



  return {

    grupo,

    partes,

    actualizar,

    mostrarAnimado,

    obtenerPartesRagdoll,

    obtenerHombrosWorld,
  };
}

import * as THREE from 'three';

import {
  cajaBiselada,
  perfilExtruido,
} from '../armas/disenoArmas.js';


const MAT_PANTALON =
  new THREE.MeshStandardMaterial({
    color: 0x2b3037,
    roughness: 0.90,
    metalness: 0.02,
  });


const MAT_PANTALON_OSCURO =
  new THREE.MeshStandardMaterial({
    color: 0x20242a,
    roughness: 0.94,
    metalness: 0.02,
  });


const MAT_CINTURON =
  new THREE.MeshStandardMaterial({
    color: 0x121519,
    roughness: 0.90,
    metalness: 0.08,
  });


const MAT_HEBILLA =
  new THREE.MeshStandardMaterial({
    color: 0x716651,
    roughness: 0.38,
    metalness: 0.60,
  });


const MAT_RODILLERA =
  new THREE.MeshStandardMaterial({
    color: 0x15191e,
    roughness: 0.85,
    metalness: 0.08,
  });


const MAT_BOTA =
  new THREE.MeshStandardMaterial({
    color: 0x181b20,
    roughness: 0.95,
    metalness: 0.02,
  });


const MAT_SUELA =
  new THREE.MeshStandardMaterial({
    color: 0x090b0e,
    roughness: 0.98,
    metalness: 0.01,
  });


function preparar(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  return mesh;
}


function crearSegmentoPierna({
  radioArriba,
  radioAbajo,
  largo,
  material,
}) {

  return preparar(
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        radioArriba,
        radioAbajo,
        largo,
        14,
        1,
        false
      ),

      material
    )
  );
}


function crearBota() {

  const grupo =
    new THREE.Group();


  const silueta = [

    [-0.145, -0.035],

    [-0.118, -0.068],

    [ 0.065, -0.068],

    [ 0.100, -0.038],

    [ 0.088,  0.050],

    [ 0.042,  0.090],

    [-0.050,  0.090],

    [-0.110,  0.055],
  ];


  const cuerpo =
    perfilExtruido(

      silueta,

      0.17,

      MAT_BOTA,

      {
        bisel: 0.01,
        curvaBisel: 3,
      }
    );


  grupo.add(
    preparar(cuerpo)
  );


  const suela =
    cajaBiselada(

      0.18,

      0.028,

      0.255,

      MAT_SUELA,

      0.006
    );


  suela.position.set(
    0,
    -0.074,
    -0.02
  );


  grupo.add(
    preparar(suela)
  );


  const puntera =
    cajaBiselada(

      0.15,

      0.045,

      0.09,

      MAT_BOTA,

      0.012
    );


  puntera.position.set(
    0,
    -0.004,
    -0.11
  );


  puntera.rotation.x =
    -0.08;


  grupo.add(
    preparar(puntera)
  );


  for (
    let i = 0;
    i < 3;
    i++
  ) {

    const banda =
      cajaBiselada(

        0.12,

        0.008,

        0.014,

        MAT_PANTALON_OSCURO,

        0.002
      );


    banda.position.set(

      0,

      0.052 -
      i * 0.021,

      -0.022 -
      i * 0.006
    );


    banda.rotation.z =
      i % 2 === 0
        ? 0.11
        : -0.11;


    grupo.add(
      preparar(banda)
    );
  }


  return grupo;
}


function crearPierna(lado) {

  const raiz =
    new THREE.Group();

  const cadera =
    new THREE.Group();

  const rodilla =
    new THREE.Group();

  const tobillo =
    new THREE.Group();


  raiz.add(cadera);

  cadera.add(rodilla);

  rodilla.add(tobillo);


  /* MUSLO */

  const muslo =
    crearSegmentoPierna({

      radioArriba:
        0.09,

      radioAbajo:
        0.075,

      largo:
        0.32,

      material:
        MAT_PANTALON,
    });


  muslo.position.y =
    -0.16;


  cadera.add(muslo);


  /* BOLSILLO */

  const bolsillo =
    cajaBiselada(

      0.018,

      0.105,

      0.105,

      MAT_PANTALON_OSCURO,

      0.006
    );


  bolsillo.position.set(

    lado * 0.082,

    -0.13,

    0.012
  );


  cadera.add(
    preparar(bolsillo)
  );


  /* RODILLA */

  rodilla.position.y =
    -0.315;


  const rodillera =
    cajaBiselada(

      0.125,

      0.085,

      0.055,

      MAT_RODILLERA,

      0.012
    );


  rodillera.position.set(

    0,

    -0.01,

    -0.052
  );


  rodillera.rotation.x =
    0.10;


  rodilla.add(
    preparar(rodillera)
  );


  /* PANTORRILLA */

  const pantorrilla =
    crearSegmentoPierna({

      radioArriba:
        0.068,

      radioAbajo:
        0.054,

      largo:
        0.285,

      material:
        MAT_PANTALON_OSCURO,
    });


  pantorrilla.position.y =
    -0.165;


  rodilla.add(
    pantorrilla
  );


  /* TOBILLO */

  tobillo.position.y =
    -0.315;


  const bota =
    crearBota();


  bota.position.set(

    0,

    -0.022,

    -0.07
  );


  tobillo.add(bota);


  return {

    raiz,

    cadera,

    rodilla,

    tobillo,
  };
}



export function crearCuerpoFPS(
  scene
) {

  /*
    V3.1:

    MUY IMPORTANTE:

    El cuerpo ya NO es hijo
    de camera.

    Vive directamente
    en el mundo.
  */

  const rig =
    new THREE.Group();


  rig.name =
    'CuerpoFPS_V31';


  scene.add(rig);


  const pelvis =
    new THREE.Group();


  rig.add(pelvis);


  /* CINTURÓN FINO */

  const cinturon =
    cajaBiselada(

      0.27,

      0.042,

      0.13,

      MAT_CINTURON,

      0.008
    );


  cinturon.position.y =
    0.045;


  pelvis.add(
    preparar(cinturon)
  );


  /* HEBILLA */

  const hebilla =
    cajaBiselada(

      0.042,

      0.032,

      0.015,

      MAT_HEBILLA,

      0.004
    );


  hebilla.position.set(

    0,

    0.045,

    -0.071
  );


  pelvis.add(
    preparar(hebilla)
  );


  /*
    DOS CADERAS SEPARADAS.

    Ya no existe una caja
    enorme atravesando
    toda la pantalla.
  */

  for (
    const lado
    of [-1, 1]
  ) {

    const panel =
      cajaBiselada(

        0.105,

        0.09,

        0.135,

        MAT_PANTALON,

        0.014
      );


    panel.position.set(

      lado * 0.082,

      -0.02,

      0
    );


    pelvis.add(
      preparar(panel)
    );
  }


  const izquierda =
    crearPierna(-1);


  const derecha =
    crearPierna(1);


  izquierda
    .raiz
    .position
    .set(

      -0.105,

      -0.07,

      0.005
    );


  derecha
    .raiz
    .position
    .set(

      0.105,

      -0.07,

      0.005
    );


  pelvis.add(

    izquierda.raiz,

    derecha.raiz
  );


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
    dt
  ) {

    camera
      .updateMatrixWorld(
        true
      );


    camera
      .getWorldPosition(
        posCamara
      );


    camera
      .getWorldDirection(
        dirCamara
      );


    camera
      .getWorldQuaternion(
        quatCamara
      );


    /*
      Quitamos Y.

      Esta es la dirección
      horizontal real del jugador.
    */

    dirPlana
      .copy(dirCamara)
      .setY(0);


    if (
      dirPlana.lengthSq()
      <
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


    const mirandoAbajo =
      THREE.MathUtils.clamp(

        (
          -dirCamara.y -
          0.08
        )
        /
        0.90,

        0,

        1
      );


    /*
      POSICIÓN REAL DEL CUERPO.

      La pelvis está 90 cm
      debajo de los ojos.

      Solo se adelanta 10 cm
      cuando miras totalmente abajo.
    */

    rig.position
      .copy(
        posCamara
      );


    rig.position
      .addScaledVector(

        dirPlana,

        THREE.MathUtils.lerp(

          -0.035,

          0.10,

          mirandoAbajo
        )
      );


    rig.position.y =
      posCamara.y -
      0.90;


    /*
      SOLO YAW.

      El pitch de cámara
      jamás rota el cuerpo.
    */

    rig.rotation.set(

      0,

      eulerCamara.y,

      0
    );


    /* ── CAMINAR ── */

    const v =
      THREE.MathUtils.clamp(

        (velocidad || 0)
        /
        5.4,

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

        dt *

        (
          6.1 +

          intensidadPaso *
          4.1
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


    izquierda
      .cadera
      .rotation
      .set(

        pasoIzq * 0.40,

        0,

        0.025
      );


    derecha
      .cadera
      .rotation
      .set(

        pasoDer * 0.40,

        0,

        -0.025
      );


    izquierda
      .rodilla
      .rotation
      .x =

        Math.max(
          0,
          -pasoIzq
        )
        *
        0.36;


    derecha
      .rodilla
      .rotation
      .x =

        Math.max(
          0,
          -pasoDer
        )
        *
        0.36;


    izquierda
      .tobillo
      .rotation
      .x =

        Math.max(
          0,
          pasoIzq
        )
        *
        -0.13;


    derecha
      .tobillo
      .rotation
      .x =

        Math.max(
          0,
          pasoDer
        )
        *
        -0.13;


    pelvis.position.y =

      Math.abs(

        Math.sin(
          tiempoPaso *
          2
        )
      )

      *

      0.006

      *

      intensidadPaso;


    pelvis.rotation.z =

      Math.sin(
        tiempoPaso
      )

      *

      0.014

      *

      intensidadPaso;
  }


  function setVisible(
    visible
  ) {

    rig.visible =
      visible;
  }


  return {

    grupo:
      rig,

    actualizar,

    setVisible,
  };
}

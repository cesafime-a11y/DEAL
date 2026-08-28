import * as THREE from 'three';

import {
  Sky,
} from 'three/examples/jsm/objects/Sky.js';


export function crearCielo(
  scene
) {

  const sky =
    new Sky();


  sky.scale.setScalar(
    4500
  );


  scene.add(sky);


  const u =
    sky.material.uniforms;


  /*
    ATMÓSFERA

    Nublado / industrial,
    pero con suficiente
    luminosidad para leer
    las formas.
  */

  u.turbidity.value =
    10.0;


  u.rayleigh.value =
    1.65;


  u.mieCoefficient.value =
    0.006;


  u.mieDirectionalG.value =
    0.82;


  /*
    SOL

    Lo subimos respecto
    a la versión anterior.

    Sigue generando sombras
    largas, pero ilumina
    mucho mejor las armas.
  */

  const elevacion =
    21;


  const azimut =
    215;


  const phi =
    THREE.MathUtils
      .degToRad(

        90 -
        elevacion
      );


  const theta =
    THREE.MathUtils
      .degToRad(
        azimut
      );


  const direccionSol =
    new THREE.Vector3()

      .setFromSphericalCoords(

        1,

        phi,

        theta
      )

      .normalize();


  u.sunPosition
    .value
    .copy(
      direccionSol
    );


  return {

    sky,

    direccionSol,
  };
}

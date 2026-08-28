import * as THREE from 'three';

import {
  construirModeloArma as construirModeloBase,
  liberarModeloArma as liberarModeloBase,
} from './modeloArmaBase.js';

import {
  cajaBiselada,
  perfilExtruido,
  torneado,
  texturaAgarre,
} from './disenoArmas.js';


/* ═══════════════════════════════════
   MATERIALES
═══════════════════════════════════ */

const MAT_METAL =
  new THREE.MeshStandardMaterial({
    color:
      0x202328,

    roughness:
      0.30,

    metalness:
      0.88,
  });


const MAT_METAL_2 =
  new THREE.MeshStandardMaterial({
    color:
      0x3f454d,

    roughness:
      0.24,

    metalness:
      0.92,
  });


const MAT_ACERO =
  new THREE.MeshStandardMaterial({
    color:
      0x707781,

    roughness:
      0.22,

    metalness:
      0.94,
  });


const MAT_POLIMERO =
  new THREE.MeshStandardMaterial({
    color:
      0x181b20,

    roughness:
      0.89,

    metalness:
      0.05,
  });


const MAT_GOMA =
  new THREE.MeshStandardMaterial({
    color:
      0x0f1114,

    roughness:
      0.98,

    metalness:
      0.01,
  });


const MAT_INTERIOR =
  new THREE.MeshStandardMaterial({
    color:
      0x07090c,

    roughness:
      0.94,

    metalness:
      0.10,

    side:
      THREE.DoubleSide,
  });


const MAT_AZUL_OPTICO =
  new THREE.MeshStandardMaterial({
    color:
      0x29445f,

    roughness:
      0.24,

    metalness:
      0.68,
  });


const MAT_RETICULA_ROJA =
  new THREE.MeshBasicMaterial({
    color:
      0xff2d20,

    toneMapped:
      false,
  });


const MAT_RETICULA_VERDE =
  new THREE.MeshBasicMaterial({
    color:
      0x63ff88,

    toneMapped:
      false,
  });



/* ═══════════════════════════════════
   HELPERS
═══════════════════════════════════ */

function preparar(
  obj
) {

  obj.traverse(
    n => {

      if (
        !n.isMesh
      ) {
        return;
      }


      n.castShadow =
        true;


      n.receiveShadow =
        true;


      n.frustumCulled =
        false;
    }
  );


  return obj;
}



function marcarUltra(
  grupo,
  tipo
) {

  grupo.name =
    `AccesorioUltra_${tipo}`;


  grupo.userData.accesorioUltra =
    true;


  grupo.userData.tipoAccesorio =
    tipo;


  return preparar(
    grupo
  );
}



function tornillo(

  grupo,

  x,

  y,

  z,

  radio =
    0.0032,

  profundidad =
    0.003

) {

  const mesh =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        radio,
        radio,
        profundidad,
        10
      ),

      MAT_ACERO
    );


  mesh.rotation.x =
    Math.PI / 2;


  mesh.position.set(
    x,
    y,
    z
  );


  grupo.add(
    mesh
  );


  const ranura =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        radio * 1.25,
        0.0011,
        0.0011
      ),

      MAT_INTERIOR
    );


  ranura.position.set(

    x,

    y,

    z -
    profundidad / 2 -
    0.0006
  );


  grupo.add(
    ranura
  );
}



function basePicatinny({

  ancho =
    0.042,

  largo =
    0.060,

  alto =
    0.014,

} = {}) {

  const grupo =
    new THREE.Group();


  const base =
    cajaBiselada(

      ancho,

      alto,

      largo,

      MAT_METAL,

      0.003
    );


  base.position.y =
    -alto / 2 +
    0.002;


  grupo.add(
    base
  );


  const mordazaIzq =
    cajaBiselada(

      0.008,

      0.010,

      largo * 0.88,

      MAT_METAL_2,

      0.002
    );


  mordazaIzq.position.set(

    -ancho / 2 +
    0.004,

    -alto -
    0.002,

    0
  );


  grupo.add(
    mordazaIzq
  );


  const mordazaDer =
    mordazaIzq.clone();


  mordazaDer.position.x =

    ancho / 2 -
    0.004;


  grupo.add(
    mordazaDer
  );


  tornillo(

    grupo,

    ancho / 2 +
    0.004,

    -alto * 0.55,

    0,

    0.0035,

    0.004
  );


  return grupo;
}



function marcoRectangularAbierto({

  ancho,

  alto,

  profundo,

  grosor,

  material =
    MAT_METAL,

}) {

  const grupo =
    new THREE.Group();


  const superior =
    cajaBiselada(

      ancho,

      grosor,

      profundo,

      material,

      Math.min(
        0.003,
        grosor / 3
      )
    );


  superior.position.y =

    alto / 2

    -

    grosor / 2;


  grupo.add(
    superior
  );


  const inferior =
    superior.clone();


  inferior.position.y =

    -alto / 2

    +

    grosor / 2;


  grupo.add(
    inferior
  );


  const lateralIzq =
    cajaBiselada(

      grosor,

      alto -
      grosor * 2,

      profundo,

      material,

      Math.min(
        0.003,
        grosor / 3
      )
    );


  lateralIzq.position.x =

    -ancho / 2

    +

    grosor / 2;


  grupo.add(
    lateralIzq
  );


  const lateralDer =
    lateralIzq.clone();


  lateralDer.position.x =

    ancho / 2

    -

    grosor / 2;


  grupo.add(
    lateralDer
  );


  return grupo;
}



function tuboHueco({

  radio,

  largo,

  material =
    MAT_METAL,

  segmentos =
    24,

}) {

  const mat =
    material.clone();


  mat.side =
    THREE.DoubleSide;


  const mesh =
    new THREE.Mesh(

      new THREE.CylinderGeometry(

        radio,

        radio,

        largo,

        segmentos,

        1,

        true
      ),

      mat
    );


  mesh.rotation.x =
    Math.PI / 2;


  return mesh;
}



function anilloOptico(

  radio,

  tubo =
    0.0032,

  material =
    MAT_AZUL_OPTICO

) {

  return new THREE.Mesh(

    new THREE.TorusGeometry(
      radio,
      tubo,
      8,
      28
    ),

    material
  );
}



function reticulaCruz(

  grupo,

  z,

  radio =
    0.018,

  color =
    'rojo',

  y =
    0

) {

  const mat =

    color ===
    'verde'

      ? MAT_RETICULA_VERDE

      : MAT_RETICULA_ROJA;


  const h =
    new THREE.Mesh(

      new THREE.BoxGeometry(

        radio * 1.55,

        0.0016,

        0.0016
      ),

      mat
    );


  h.position.set(
    0,
    y,
    z
  );


  grupo.add(
    h
  );


  const v =
    new THREE.Mesh(

      new THREE.BoxGeometry(

        0.0016,

        radio * 1.55,

        0.0016
      ),

      mat
    );


  v.position.set(
    0,
    y,
    z
  );


  grupo.add(
    v
  );


  const punto =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        0.0023,
        10,
        8
      ),

      mat
    );


  punto.position.set(
    0,
    y,
    z - 0.001
  );


  grupo.add(
    punto
  );
}



function puntoRojo(

  grupo,

  x,

  y,

  z,

  radio =
    0.0026

) {

  const p =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        radio,
        10,
        8
      ),

      MAT_RETICULA_ROJA
    );


  p.position.set(
    x,
    y,
    z
  );


  grupo.add(
    p
  );
}



function bandaEstriada(

  grupo,

  z,

  radio,

  cantidad =
    18,

  largo =
    0.010

) {

  for (
    let i = 0;
    i < cantidad;
    i++
  ) {

    const a =

      (
        i /
        cantidad
      )

      *

      Math.PI *
      2;


    const e =
      new THREE.Mesh(

        new THREE.BoxGeometry(
          0.0028,
          0.0028,
          largo
        ),

        MAT_ACERO
      );


    e.position.set(

      Math.cos(a) *
      radio,

      Math.sin(a) *
      radio,

      z
    );


    e.rotation.z =
      a;


    grupo.add(
      e
    );
  }
}



function ranuraOscura(

  grupo,

  {

    x,

    y,

    z,

    ancho,

    alto,

    profundo,

    rotZ =
      0,

  }

) {

  const r =
    cajaBiselada(

      ancho,

      alto,

      profundo,

      MAT_INTERIOR,

      Math.min(

        0.002,

        ancho / 5,

        alto / 5,

        profundo / 5
      )
    );


  r.position.set(
    x,
    y,
    z
  );


  r.rotation.z =
    rotZ;


  grupo.add(
    r
  );
}



function limpiarGeometrias(
  obj
) {

  obj.traverse(
    n => {

      if (
        n.isMesh
      ) {

        n.geometry
          ?.dispose?.();
      }
    }
  );
}



/* ═══════════════════════════════════
   CARGADORES
═══════════════════════════════════ */

function cargadorCaja({

  alto,

  ancho,

  profundo,

  inclinacion =
    0.05,

  curvatura =
    0,

  nervios =
    3,

}) {

  const grupo =
    new THREE.Group();


  const h =
    alto / 2;


  const p =
    profundo / 2;


  const perfil = [

    [
      -p * 0.86,
      h
    ],

    [
      p * 0.86,
      h
    ],

    [
      p,
      h * 0.45
    ],

    [
      p *
      (
        0.90 +
        curvatura
      ),

      -h * 0.45
    ],

    [
      p * 0.65,
      -h
    ],

    [
      -p * 0.72,
      -h
    ],

    [
      -p *
      (
        0.95 -
        curvatura
      ),

      -h * 0.35
    ],

    [
      -p,
      h * 0.40
    ],
  ];


  const cuerpo =
    perfilExtruido(

      perfil,

      ancho,

      MAT_METAL,

      {
        bisel:
          0.004,

        curvaBisel:
          3,
      }
    );


  cuerpo.rotation.x =
    inclinacion;


  cuerpo.position.y =
    -alto / 2;


  grupo.add(
    cuerpo
  );


  const base =
    cajaBiselada(

      ancho * 1.08,

      0.010,

      profundo * 1.10,

      MAT_POLIMERO,

      0.003
    );


  base.position.y =
    -alto -
    0.004;


  base.rotation.x =
    inclinacion;


  grupo.add(
    base
  );


  const labio =
    cajaBiselada(

      ancho * 0.90,

      0.012,

      profundo * 0.82,

      MAT_ACERO,

      0.002
    );


  labio.position.y =
    -0.004;


  grupo.add(
    labio
  );


  for (
    let i = 0;
    i < nervios;
    i++
  ) {

    const y =

      -alto

      *

      (
        0.25 +
        i * 0.18
      );


    const nervio =
      cajaBiselada(

        ancho +
        0.002,

        0.007,

        profundo *
        0.90,

        MAT_METAL_2,

        0.002
      );


    nervio.position.y =
      y;


    nervio.rotation.x =
      inclinacion;


    grupo.add(
      nervio
    );
  }


  return grupo;
}



function crearCargadorUltra(
  clave
) {

  let grupo;


  switch (
    clave
  ) {

    case 'pequeño':

      grupo =
        cargadorCaja({

          alto:
            0.085,

          ancho:
            0.034,

          profundo:
            0.038,

          inclinacion:
            0.035,

          curvatura:
            0.02,

          nervios:
            2,
        });

      break;


    case 'grande':

      grupo =
        cargadorCaja({

          alto:
            0.165,

          ancho:
            0.040,

          profundo:
            0.052,

          inclinacion:
            0.10,

          curvatura:
            0.14,

          nervios:
            5,
        });

      break;


    case 'tambor': {

      grupo =
        new THREE.Group();


      const cuello =
        cargadorCaja({

          alto:
            0.045,

          ancho:
            0.036,

          profundo:
            0.042,

          inclinacion:
            0.03,

          nervios:
            1,
        });


      grupo.add(
        cuello
      );


      const tambor =
        new THREE.Mesh(

          new THREE.CylinderGeometry(
            0.058,
            0.058,
            0.044,
            28
          ),

          MAT_METAL
        );


      tambor.rotation.z =
        Math.PI / 2;


      tambor.position.set(
        0,
        -0.090,
        0.003
      );


      grupo.add(
        tambor
      );


      const tapaL =
        new THREE.Mesh(

          new THREE.CylinderGeometry(
            0.049,
            0.049,
            0.004,
            28
          ),

          MAT_METAL_2
        );


      tapaL.rotation.z =
        Math.PI / 2;


      tapaL.position.set(
        -0.024,
        -0.090,
        0.003
      );


      grupo.add(
        tapaL
      );


      const tapaR =
        tapaL.clone();


      tapaR.position.x =
        0.024;


      grupo.add(
        tapaR
      );


      const centro =
        new THREE.Mesh(

          new THREE.CylinderGeometry(
            0.010,
            0.010,
            0.050,
            14
          ),

          MAT_ACERO
        );


      centro.rotation.z =
        Math.PI / 2;


      centro.position.set(
        0,
        -0.090,
        0.003
      );


      grupo.add(
        centro
      );


      for (
        let i = 0;
        i < 8;
        i++
      ) {

        const a =

          (
            i /
            8
          )

          *

          Math.PI *
          2;


        const rem =
          new THREE.Mesh(

            new THREE.SphereGeometry(
              0.0027,
              8,
              6
            ),

            MAT_ACERO
          );


        rem.position.set(

          -0.025,

          -0.090 +
          Math.sin(a) *
          0.039,

          0.003 +
          Math.cos(a) *
          0.039
        );


        grupo.add(
          rem
        );
      }

      break;
    }


    case 'medio':

    default:

      grupo =
        cargadorCaja({

          alto:
            0.122,

          ancho:
            0.037,

          profundo:
            0.046,

          inclinacion:
            0.07,

          curvatura:
            0.08,

          nervios:
            3,
        });

      break;
  }


  return marcarUltra(

    grupo,

    `cargador_${clave}`
  );
}



/* ═══════════════════════════════════
   MIRAS
═══════════════════════════════════ */

function miraNingunaUltra() {

  return {

    grupo:
      marcarUltra(
        new THREE.Group(),
        'mira_ninguna'
      ),

    puntoOcular:
      new THREE.Vector3(
        0,
        0.020,
        0.050
      ),
  };
}



function miraHierroUltra(
  puntaCañonLocal
) {

  const grupo =
    new THREE.Group();


  const base =
    basePicatinny({

      ancho:
        0.034,

      largo:
        0.030,

      alto:
        0.010,
    });


  base.position.z =
    0.025;


  grupo.add(
    base
  );


  const puente =
    cajaBiselada(

      0.034,

      0.006,

      0.010,

      MAT_METAL_2,

      0.002
    );


  puente.position.set(
    0,
    0.014,
    0.025
  );


  grupo.add(
    puente
  );


  for (
    const x
    of [-0.013, 0.013]
  ) {

    const oreja =
      cajaBiselada(

        0.006,

        0.026,

        0.010,

        MAT_METAL,

        0.002
      );


    oreja.position.set(
      x,
      0.027,
      0.025
    );


    grupo.add(
      oreja
    );
  }


  const inserto =
    cajaBiselada(

      0.020,

      0.004,

      0.004,

      MAT_INTERIOR,

      0.001
    );


  inserto.position.set(
    0,
    0.026,
    0.020
  );


  grupo.add(
    inserto
  );


  const puntaZ =

    puntaCañonLocal
      ?.z

    ??

    -0.18;


  const alturaCanon =

    puntaCañonLocal
      ?.y

    ??

    -0.045;


  const alturaLinea =
    0.029;


  const torreAlto =

    Math.max(

      0.020,

      alturaLinea -
      alturaCanon
    );


  const torre =
    cajaBiselada(

      0.010,

      torreAlto,

      0.012,

      MAT_METAL,

      0.002
    );


  torre.position.set(

    0,

    alturaCanon +
    torreAlto / 2,

    puntaZ +
    0.012
  );


  grupo.add(
    torre
  );


  const poste =
    cajaBiselada(

      0.004,

      0.018,

      0.005,

      MAT_ACERO,

      0.001
    );


  poste.position.set(

    0,

    alturaLinea +
    0.006,

    puntaZ +
    0.012
  );


  grupo.add(
    poste
  );


  return {

    grupo:
      marcarUltra(
        grupo,
        'mira_hierro'
      ),

    puntoOcular:
      new THREE.Vector3(
        0,
        0.029,
        0.110
      ),
  };
}



function miraReflexUltra() {

  const grupo =
    new THREE.Group();


  const base =
    basePicatinny({

      ancho:
        0.044,

      largo:
        0.060,

      alto:
        0.013,
    });


  grupo.add(
    base
  );


  const soporte =
    cajaBiselada(

      0.038,

      0.017,

      0.045,

      MAT_METAL_2,

      0.004
    );


  soporte.position.set(
    0,
    0.016,
    0
  );


  grupo.add(
    soporte
  );


  /*
    VENTANA ABIERTA.

    No hay plano transparente.
  */

  const marco =
    marcoRectangularAbierto({

      ancho:
        0.054,

      alto:
        0.045,

      profundo:
        0.012,

      grosor:
        0.007,

      material:
        MAT_METAL,
    });


  marco.position.set(
    0,
    0.048,
    -0.010
  );


  grupo.add(
    marco
  );


  const frenteAzul =
    marcoRectangularAbierto({

      ancho:
        0.041,

      alto:
        0.032,

      profundo:
        0.003,

      grosor:
        0.0025,

      material:
        MAT_AZUL_OPTICO,
    });


  frenteAzul.position.set(
    0,
    0.048,
    -0.017
  );


  grupo.add(
    frenteAzul
  );


  puntoRojo(

    grupo,

    0,

    0.048,

    -0.021,

    0.0025
  );


  const bateria =
    cajaBiselada(

      0.017,

      0.020,

      0.028,

      MAT_POLIMERO,

      0.004
    );


  bateria.position.set(
    0.027,
    0.025,
    0.008
  );


  grupo.add(
    bateria
  );


  tornillo(

    grupo,

    0.036,

    0.025,

    0.008,

    0.003,

    0.003
  );


  return {

    grupo:
      marcarUltra(
        grupo,
        'mira_reflex'
      ),

    puntoOcular:
      new THREE.Vector3(
        0,
        0.048,
        0.165
      ),
  };
}



function miraHolograficaUltra() {

  const grupo =
    new THREE.Group();


  const base =
    basePicatinny({

      ancho:
        0.050,

      largo:
        0.088,

      alto:
        0.015,
    });


  grupo.add(
    base
  );


  const cuerpo =
    cajaBiselada(

      0.050,

      0.033,

      0.075,

      MAT_METAL,

      0.006
    );


  cuerpo.position.set(
    0,
    0.025,
    0.004
  );


  grupo.add(
    cuerpo
  );


  const ventana =
    marcoRectangularAbierto({

      ancho:
        0.056,

      alto:
        0.052,

      profundo:
        0.018,

      grosor:
        0.008,

      material:
        MAT_METAL_2,
    });


  ventana.position.set(
    0,
    0.066,
    -0.012
  );


  grupo.add(
    ventana
  );


  const aroInterno =
    marcoRectangularAbierto({

      ancho:
        0.041,

      alto:
        0.037,

      profundo:
        0.003,

      grosor:
        0.0025,

      material:
        MAT_AZUL_OPTICO,
    });


  aroInterno.position.set(
    0,
    0.066,
    -0.022
  );


  grupo.add(
    aroInterno
  );


  const reticulaAro =
    new THREE.Mesh(

      new THREE.TorusGeometry(
        0.011,
        0.0012,
        6,
        24
      ),

      MAT_RETICULA_ROJA
    );


  reticulaAro.position.set(
    0,
    0.066,
    -0.025
  );


  grupo.add(
    reticulaAro
  );


  puntoRojo(
    grupo,
    0,
    0.066,
    -0.026,
    0.0020
  );


  const moduloLateral =
    cajaBiselada(

      0.012,

      0.028,

      0.054,

      MAT_POLIMERO,

      0.003
    );


  moduloLateral.position.set(
    -0.031,
    0.029,
    0.008
  );


  grupo.add(
    moduloLateral
  );


  for (
    const z
    of [-0.012, 0.008, 0.028]
  ) {

    const boton =
      new THREE.Mesh(

        new THREE.CylinderGeometry(
          0.0033,
          0.0033,
          0.003,
          10
        ),

        MAT_GOMA
      );


    boton.rotation.z =
      Math.PI / 2;


    boton.position.set(
      -0.038,
      0.029,
      z
    );


    grupo.add(
      boton
    );
  }


  tornillo(
    grupo,
    0.027,
    0.027,
    0.026,
    0.003,
    0.003
  );


  tornillo(
    grupo,
    0.027,
    0.027,
    -0.020,
    0.003,
    0.003
  );


  return {

    grupo:
      marcarUltra(
        grupo,
        'mira_holografica'
      ),

    puntoOcular:
      new THREE.Vector3(
        0,
        0.066,
        0.185
      ),
  };
}



function miraLaserUltra() {

  const grupo =
    new THREE.Group();


  const base =
    basePicatinny({

      ancho:
        0.034,

      largo:
        0.060,

      alto:
        0.012,
    });


  grupo.add(
    base
  );


  const carcasa =
    cajaBiselada(

      0.034,

      0.026,

      0.070,

      MAT_POLIMERO,

      0.005
    );


  carcasa.position.set(
    0,
    0.021,
    -0.003
  );


  grupo.add(
    carcasa
  );


  const frente =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        0.009,
        0.009,
        0.008,
        16
      ),

      MAT_METAL_2
    );


  frente.rotation.x =
    Math.PI / 2;


  frente.position.set(
    0,
    0.021,
    -0.041
  );


  grupo.add(
    frente
  );


  const emisor =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        0.0055,
        0.0055,
        0.0025,
        16
      ),

      MAT_RETICULA_ROJA
    );


  emisor.rotation.x =
    Math.PI / 2;


  emisor.position.set(
    0,
    0.021,
    -0.046
  );


  grupo.add(
    emisor
  );


  const tapa =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        0.008,
        0.008,
        0.006,
        14
      ),

      MAT_METAL_2
    );


  tapa.position.set(
    0.020,
    0.024,
    0.010
  );


  tapa.rotation.z =
    Math.PI / 2;


  grupo.add(
    tapa
  );


  tornillo(
    grupo,
    -0.019,
    0.020,
    -0.018,
    0.003,
    0.003
  );


  return {

    grupo:
      marcarUltra(
        grupo,
        'mira_laser'
      ),

    puntoOcular:
      new THREE.Vector3(
        0,
        0.026,
        0.160
      ),
  };
}



function miraPrismaticaUltra() {

  const grupo =
    new THREE.Group();


  const base =
    basePicatinny({

      ancho:
        0.046,

      largo:
        0.095,

      alto:
        0.015,
    });


  grupo.add(
    base
  );


  const montura =
    cajaBiselada(

      0.036,

      0.030,

      0.070,

      MAT_METAL_2,

      0.005
    );


  montura.position.set(
    0,
    0.027,
    0
  );


  grupo.add(
    montura
  );


  const tubo =
    tuboHueco({

      radio:
        0.025,

      largo:
        0.105,

      material:
        MAT_METAL,

      segmentos:
        24,
    });


  tubo.position.set(
    0,
    0.058,
    0
  );


  grupo.add(
    tubo
  );


  const aroTrasero =
    anilloOptico(
      0.025,
      0.0045
    );


  aroTrasero.position.set(
    0,
    0.058,
    0.054
  );


  grupo.add(
    aroTrasero
  );


  const aroDelantero =
    anilloOptico(
      0.027,
      0.0045
    );


  aroDelantero.position.set(
    0,
    0.058,
    -0.054
  );


  grupo.add(
    aroDelantero
  );


  reticulaCruz(
    grupo,
    -0.010,
    0.015,
    'rojo',
    0.058
  );


  const torre =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        0.008,
        0.008,
        0.012,
        14
      ),

      MAT_METAL_2
    );


  torre.position.set(
    0,
    0.090,
    0.005
  );


  grupo.add(
    torre
  );


  const tapa =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        0.009,
        0.009,
        0.004,
        14
      ),

      MAT_ACERO
    );


  tapa.position.set(
    0,
    0.097,
    0.005
  );


  grupo.add(
    tapa
  );


  bandaEstriada(
    grupo,
    0.040,
    0.027,
    14,
    0.006
  );


  return {

    grupo:
      marcarUltra(
        grupo,
        'mira_prismatica'
      ),

    puntoOcular:
      new THREE.Vector3(
        0,
        0.058,
        0.225
      ),
  };
}



function miraTelescopicaUltra() {

  const grupo =
    new THREE.Group();


  const base =
    basePicatinny({

      ancho:
        0.050,

      largo:
        0.160,

      alto:
        0.014,
    });


  grupo.add(
    base
  );


  const puente =
    cajaBiselada(

      0.032,

      0.025,

      0.125,

      MAT_METAL_2,

      0.004
    );


  puente.position.set(
    0,
    0.025,
    0
  );


  grupo.add(
    puente
  );


  const tubo =
    tuboHueco({

      radio:
        0.022,

      largo:
        0.205,

      material:
        MAT_METAL,

      segmentos:
        28,
    });


  tubo.position.set(
    0,
    0.065,
    -0.008
  );


  grupo.add(
    tubo
  );


  const campanaTrasera =
    tuboHueco({

      radio:
        0.030,

      largo:
        0.045,

      material:
        MAT_METAL_2,

      segmentos:
        28,
    });


  campanaTrasera.position.set(
    0,
    0.065,
    0.112
  );


  grupo.add(
    campanaTrasera
  );


  const campanaFrontal =
    tuboHueco({

      radio:
        0.035,

      largo:
        0.060,

      material:
        MAT_METAL_2,

      segmentos:
        28,
    });


  campanaFrontal.position.set(
    0,
    0.065,
    -0.130
  );


  grupo.add(
    campanaFrontal
  );


  const aroTrasero =
    anilloOptico(
      0.030,
      0.005
    );


  aroTrasero.position.set(
    0,
    0.065,
    0.136
  );


  grupo.add(
    aroTrasero
  );


  const aroFrontal =
    anilloOptico(
      0.035,
      0.005
    );


  aroFrontal.position.set(
    0,
    0.065,
    -0.162
  );


  grupo.add(
    aroFrontal
  );


  reticulaCruz(
    grupo,
    -0.020,
    0.018,
    'rojo',
    0.065
  );


  for (
    const z
    of [-0.060, 0.060]
  ) {

    const aroMontura =
      new THREE.Mesh(

        new THREE.TorusGeometry(
          0.025,
          0.0045,
          8,
          28
        ),

        MAT_ACERO
      );


    aroMontura.position.set(
      0,
      0.065,
      z
    );


    grupo.add(
      aroMontura
    );


    const pata =
      cajaBiselada(

        0.030,

        0.028,

        0.012,

        MAT_METAL_2,

        0.003
      );


    pata.position.set(
      0,
      0.040,
      z
    );


    grupo.add(
      pata
    );
  }


  const torreVertical =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        0.010,
        0.010,
        0.020,
        16
      ),

      MAT_METAL_2
    );


  torreVertical.position.set(
    0,
    0.099,
    0
  );


  grupo.add(
    torreVertical
  );


  const torreLateral =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        0.009,
        0.009,
        0.018,
        16
      ),

      MAT_METAL_2
    );


  torreLateral.rotation.z =
    Math.PI / 2;


  torreLateral.position.set(
    0.030,
    0.065,
    0
  );


  grupo.add(
    torreLateral
  );


  bandaEstriada(
    grupo,
    0.105,
    0.032,
    22,
    0.012
  );


  return {

    grupo:
      marcarUltra(
        grupo,
        'mira_telescopica'
      ),

    puntoOcular:
      new THREE.Vector3(
        0,
        0.065,
        0.315
      ),
  };
}



function crearMiraUltra(

  clave,

  puntaCañonLocal

) {

  switch (
    clave
  ) {

    case 'hierro':
      return miraHierroUltra(
        puntaCañonLocal
      );


    case 'reflex':
      return miraReflexUltra();


    case 'holografica':
      return miraHolograficaUltra();


    case 'laser':
      return miraLaserUltra();


    case 'prismatica':
      return miraPrismaticaUltra();


    case 'telescopica':
      return miraTelescopicaUltra();


    case 'ninguna':

    default:
      return miraNingunaUltra();
  }
}



/* ═══════════════════════════════════
   BOCAS DE CAÑÓN
═══════════════════════════════════ */

function radioCanonEstimado(

  canon,

  cuerpo

) {

  let r = {

    ultraligero:
      0.012,

    corto:
      0.014,

    estandar:
      0.0155,

    largo:
      0.016,

    pesado:
      0.0195,

  }[canon]

  ??

  0.0155;


  if (
    cuerpo ===
    'escopeta'
  ) {

    r +=
      0.0035;
  }


  if (
    cuerpo ===
    'lmg'
  ) {

    r +=
      0.0018;
  }


  if (
    cuerpo ===
    'francotirador'
  ) {

    r +=
      0.001;
  }


  return r;
}



function bocaNingunaUltra() {

  return {

    grupo:
      marcarUltra(
        new THREE.Group(),
        'boca_ninguna'
      ),

    longitudExtra:
      0,
  };
}



function bocaRompellamasUltra(
  radioPunta
) {

  const grupo =
    new THREE.Group();


  const longitudExtra =
    0.062;


  const r =
    Math.max(
      0.019,
      radioPunta +
      0.002
    );


  const collar =
    torneado(

      [

        [0.006, r * 0.78],

        [0.006, r],

        [-0.012, r],

        [-0.018, r * 0.92],
      ],

      MAT_METAL_2,

      {
        segmentos:
          20,
      }
    );


  grupo.add(
    collar
  );


  const radioProng =
    r * 0.82;


  const prongs =
    5;


  for (
    let i = 0;
    i < prongs;
    i++
  ) {

    const a =

      (
        i /
        prongs
      )

      *

      Math.PI *
      2;


    const barra =
      cajaBiselada(

        0.0055,

        0.0055,

        0.050,

        MAT_METAL,

        0.0015
      );


    barra.position.set(

      Math.cos(a) *
      radioProng,

      Math.sin(a) *
      radioProng,

      -0.042
    );


    barra.rotation.z =
      a;


    grupo.add(
      barra
    );
  }


  const aroFinal =
    new THREE.Mesh(

      new THREE.TorusGeometry(
        radioProng,
        0.0025,
        6,
        24
      ),

      MAT_ACERO
    );


  aroFinal.position.z =
    -0.066;


  grupo.add(
    aroFinal
  );


  return {

    grupo:
      marcarUltra(
        grupo,
        'boca_rompellamas'
      ),

    longitudExtra,
  };
}



function bocaCompensadorUltra(
  radioPunta
) {

  const grupo =
    new THREE.Group();


  const longitudExtra =
    0.058;


  const r =
    Math.max(
      0.022,
      radioPunta +
      0.003
    );


  const cuerpo =
    torneado(

      [

        [0.006, r * 0.76],

        [0.006, r],

        [-0.010, r],

        [-0.020, r * 1.04],

        [-0.050, r * 0.98],

        [-0.058, r * 0.80],
      ],

      MAT_METAL,

      {
        segmentos:
          22,
      }
    );


  grupo.add(
    cuerpo
  );


  for (
    const z
    of [-0.022, -0.038]
  ) {

    ranuraOscura(

      grupo,

      {

        x:
          0,

        y:
          r * 0.76,

        z,

        ancho:
          r * 1.25,

        alto:
          0.006,

        profundo:
          0.010,
      }
    );
  }


  for (
    const lado
    of [-1, 1]
  ) {

    ranuraOscura(

      grupo,

      {

        x:
          lado * r * 0.77,

        y:
          0,

        z:
          -0.038,

        ancho:
          0.006,

        alto:
          r * 1.05,

        profundo:
          0.014,
      }
    );
  }


  bandaEstriada(

    grupo,

    -0.010,

    r * 1.01,

    16,

    0.008
  );


  return {

    grupo:
      marcarUltra(
        grupo,
        'boca_compensador'
      ),

    longitudExtra,
  };
}



function bocaSilenciadorUltra(

  radioPunta,

  integral =
    false

) {

  const grupo =
    new THREE.Group();


  const longitudExtra =

    integral
      ? 0.225
      : 0.165;


  const r =
    Math.max(

      integral
        ? 0.029
        : 0.025,

      radioPunta

      +

      (
        integral
          ? 0.006
          : 0.004
      )
    );


  const cuerpo =
    torneado(

      [

        [0.008, r * 0.70],

        [0.008, r * 0.92],

        [-0.010, r],

        [
          -longitudExtra * 0.78,
          r
        ],

        [
          -longitudExtra * 0.93,
          r * 0.94
        ],

        [
          -longitudExtra,
          r * 0.78
        ],
      ],

      MAT_METAL,

      {
        segmentos:
          28,
      }
    );


  grupo.add(
    cuerpo
  );


  const secciones =

    integral
      ? 6
      : 4;


  for (
    let i = 1;
    i <= secciones;
    i++
  ) {

    const z =

      -longitudExtra

      *

      (
        i /
        (
          secciones +
          1
        )
      );


    const aro =
      new THREE.Mesh(

        new THREE.TorusGeometry(

          r * 0.96,

          0.0018,

          6,

          26
        ),

        i === 1
          ? MAT_ACERO
          : MAT_METAL_2
      );


    aro.position.z =
      z;


    grupo.add(
      aro
    );
  }


  bandaEstriada(

    grupo,

    -0.018,

    r * 1.02,

    integral
      ? 24
      : 18,

    integral
      ? 0.014
      : 0.010
  );


  const boca =
    new THREE.Mesh(

      new THREE.TorusGeometry(

        r * 0.67,

        0.0032,

        8,

        26
      ),

      MAT_INTERIOR
    );


  boca.position.z =

    -longitudExtra

    -

    0.001;


  grupo.add(
    boca
  );


  return {

    grupo:
      marcarUltra(

        grupo,

        integral
          ? 'boca_supresorIntegral'
          : 'boca_silenciador'
      ),

    longitudExtra,
  };
}



function bocaCompensadorPesadoUltra(
  radioPunta
) {

  const grupo =
    new THREE.Group();


  const longitudExtra =
    0.078;


  const r =
    Math.max(
      0.027,
      radioPunta +
      0.005
    );


  const cuerpo =
    torneado(

      [

        [0.006, r * 0.72],

        [0.006, r * 1.05],

        [-0.012, r * 1.05],

        [-0.020, r],

        [-0.068, r * 0.98],

        [-0.078, r * 0.78],
      ],

      MAT_METAL_2,

      {
        segmentos:
          20,
      }
    );


  grupo.add(
    cuerpo
  );


  for (
    const z
    of [-0.025, -0.048]
  ) {

    for (
      const lado
      of [-1, 1]
    ) {

      ranuraOscura(

        grupo,

        {

          x:
            lado * r * 0.86,

          y:
            0,

          z,

          ancho:
            0.007,

          alto:
            0.018,

          profundo:
            0.018,
        }
      );
    }


    ranuraOscura(

      grupo,

      {

        x:
          0,

        y:
          r * 0.85,

        z,

        ancho:
          0.018,

        alto:
          0.007,

        profundo:
          0.016,
      }
    );
  }


  for (
    const z
    of [-0.016, -0.063]
  ) {

    const aro =
      new THREE.Mesh(

        new THREE.TorusGeometry(
          r,
          0.0024,
          6,
          24
        ),

        MAT_ACERO
      );


    aro.position.z =
      z;


    grupo.add(
      aro
    );
  }


  return {

    grupo:
      marcarUltra(
        grupo,
        'boca_compensadorPesado'
      ),

    longitudExtra,
  };
}



function bocaFrenoRanuradoUltra(
  radioPunta
) {

  const grupo =
    new THREE.Group();


  const longitudExtra =
    0.070;


  const r =
    Math.max(
      0.023,
      radioPunta +
      0.0035
    );


  const cuerpo =
    cajaBiselada(

      r * 2.15,

      r * 1.72,

      longitudExtra,

      MAT_METAL,

      0.005
    );


  cuerpo.position.z =
    -longitudExtra / 2;


  grupo.add(
    cuerpo
  );


  const collar =
    torneado(

      [

        [0.006, r * 0.74],

        [0.006, r * 0.96],

        [-0.012, r * 0.96],
      ],

      MAT_METAL_2,

      {
        segmentos:
          20,
      }
    );


  grupo.add(
    collar
  );


  for (
    const lado
    of [-1, 1]
  ) {

    for (
      const z
      of [-0.020, -0.047]
    ) {

      ranuraOscura(

        grupo,

        {

          x:
            lado * r * 1.05,

          y:
            0,

          z,

          ancho:
            0.008,

          alto:
            r * 1.05,

          profundo:
            0.019,
        }
      );
    }
  }


  const salida =
    new THREE.Mesh(

      new THREE.TorusGeometry(

        r * 0.58,

        0.003,

        8,

        22
      ),

      MAT_INTERIOR
    );


  salida.position.z =

    -longitudExtra

    -

    0.001;


  grupo.add(
    salida
  );


  return {

    grupo:
      marcarUltra(
        grupo,
        'boca_frenoRanurado'
      ),

    longitudExtra,
  };
}



function crearBocaUltra(

  clave,

  radioPunta

) {

  switch (
    clave
  ) {

    case 'rompellamas':

      return bocaRompellamasUltra(
        radioPunta
      );


    case 'compensador':

      return bocaCompensadorUltra(
        radioPunta
      );


    case 'silenciador':

      return bocaSilenciadorUltra(
        radioPunta,
        false
      );


    case 'compensadorPesado':

      return bocaCompensadorPesadoUltra(
        radioPunta
      );


    case 'frenoRanurado':

      return bocaFrenoRanuradoUltra(
        radioPunta
      );


    case 'supresorIntegral':

      return bocaSilenciadorUltra(
        radioPunta,
        true
      );


    case 'ninguna':

    default:

      return bocaNingunaUltra();
  }
}



/* ═══════════════════════════════════
   EMPUÑADURAS
═══════════════════════════════════ */

function baseGrip(

  ancho =
    0.032,

  profundo =
    0.042

) {

  const base =
    new THREE.Group();


  const clamp =
    cajaBiselada(

      ancho,

      0.014,

      profundo,

      MAT_METAL_2,

      0.003
    );


  clamp.position.y =
    -0.006;


  base.add(
    clamp
  );


  const torn =
    new THREE.Mesh(

      new THREE.CylinderGeometry(

        0.0035,

        0.0035,

        ancho +
        0.006,

        10
      ),

      MAT_ACERO
    );


  torn.rotation.z =
    Math.PI / 2;


  torn.position.set(
    0,
    -0.006,
    0.008
  );


  base.add(
    torn
  );


  return base;
}



function empunaduraVerticalUltra() {

  const grupo =
    baseGrip(
      0.036,
      0.044
    );


  const perfil = [

    [-0.018, 0.008],

    [0.018, 0.008],

    [0.016, -0.032],

    [0.012, -0.072],

    [-0.010, -0.076],

    [-0.016, -0.050],
  ];


  const cuerpo =
    perfilExtruido(

      perfil,

      0.034,

      MAT_POLIMERO,

      {
        bisel:
          0.004,

        curvaBisel:
          3,
      }
    );


  cuerpo.position.y =
    -0.010;


  grupo.add(
    cuerpo
  );


  texturaAgarre(

    grupo,

    {

      x:
        0.018,

      y:
        -0.046,

      z:
        0,

      ancho:
        0.028,

      alto:
        0.044,

      filas:
        6,

      columnas:
        3,

      material:
        MAT_GOMA,
    }
  );


  const tapa =
    cajaBiselada(

      0.036,

      0.009,

      0.035,

      MAT_GOMA,

      0.003
    );


  tapa.position.y =
    -0.086;


  grupo.add(
    tapa
  );


  return marcarUltra(
    grupo,
    'empunadura_vertical'
  );
}



function empunaduraAnguladaUltra() {

  const grupo =
    baseGrip(
      0.037,
      0.060
    );


  const perfil = [

    [-0.030, 0.005],

    [0.028, 0.005],

    [0.020, -0.020],

    [-0.002, -0.048],

    [-0.030, -0.041],

    [-0.036, -0.020],
  ];


  const cuerpo =
    perfilExtruido(

      perfil,

      0.036,

      MAT_POLIMERO,

      {
        bisel:
          0.004,

        curvaBisel:
          3,
      }
    );


  cuerpo.position.y =
    -0.012;


  grupo.add(
    cuerpo
  );


  for (
    let i = 0;
    i < 4;
    i++
  ) {

    const nervio =
      cajaBiselada(

        0.038,

        0.004,

        0.008,

        MAT_GOMA,

        0.001
      );


    nervio.position.set(

      0,

      -0.023 -
      i * 0.007,

      -0.008 +
      i * 0.008
    );


    nervio.rotation.x =
      0.38;


    grupo.add(
      nervio
    );
  }


  return marcarUltra(
    grupo,
    'empunadura_angulada'
  );
}



function empunaduraTopeUltra() {

  const grupo =
    baseGrip(
      0.035,
      0.034
    );


  const perfil = [

    [-0.017, 0.004],

    [0.017, 0.004],

    [0.015, -0.016],

    [0.005, -0.032],

    [-0.014, -0.030],

    [-0.020, -0.014],
  ];


  const cuerpo =
    perfilExtruido(

      perfil,

      0.034,

      MAT_POLIMERO,

      {
        bisel:
          0.004,

        curvaBisel:
          3,
      }
    );


  cuerpo.position.y =
    -0.010;


  grupo.add(
    cuerpo
  );


  const frente =
    cajaBiselada(

      0.036,

      0.020,

      0.008,

      MAT_GOMA,

      0.002
    );


  frente.position.set(
    0,
    -0.023,
    -0.020
  );


  grupo.add(
    frente
  );


  return marcarUltra(
    grupo,
    'empunadura_topeMano'
  );
}



function empunaduraCortaUltra() {

  const grupo =
    baseGrip(
      0.034,
      0.032
    );


  const cuerpo =
    cajaBiselada(

      0.032,

      0.026,

      0.030,

      MAT_POLIMERO,

      0.006
    );


  cuerpo.position.y =
    -0.022;


  cuerpo.rotation.x =
    0.12;


  grupo.add(
    cuerpo
  );


  const goma =
    cajaBiselada(

      0.034,

      0.007,

      0.028,

      MAT_GOMA,

      0.002
    );


  goma.position.y =
    -0.036;


  grupo.add(
    goma
  );


  return marcarUltra(
    grupo,
    'empunadura_cortaCombate'
  );
}



function empunaduraBipodeUltra() {

  const grupo =
    baseGrip(
      0.044,
      0.052
    );


  const bloque =
    cajaBiselada(

      0.040,

      0.023,

      0.044,

      MAT_METAL,

      0.004
    );


  bloque.position.y =
    -0.020;


  grupo.add(
    bloque
  );


  for (
    const lado
    of [-1, 1]
  ) {

    const bisagra =
      new THREE.Mesh(

        new THREE.CylinderGeometry(
          0.007,
          0.007,
          0.010,
          14
        ),

        MAT_ACERO
      );


    bisagra.rotation.z =
      Math.PI / 2;


    bisagra.position.set(

      lado * 0.021,

      -0.032,

      0.008
    );


    grupo.add(
      bisagra
    );


    const pata =
      new THREE.Mesh(

        new THREE.CylinderGeometry(
          0.0042,
          0.0050,
          0.095,
          8
        ),

        MAT_METAL_2
      );


    pata.position.set(

      lado * 0.040,

      -0.079,

      0.012
    );


    pata.rotation.z =
      lado *
      0.38;


    grupo.add(
      pata
    );


    const pie =
      cajaBiselada(

        0.018,

        0.008,

        0.024,

        MAT_GOMA,

        0.003
      );


    pie.position.set(

      lado * 0.057,

      -0.126,

      0.012
    );


    grupo.add(
      pie
    );
  }


  return marcarUltra(
    grupo,
    'empunadura_bipode'
  );
}



function crearEmpunaduraUltra(
  clave
) {

  switch (
    clave
  ) {

    case 'vertical':

      return empunaduraVerticalUltra();


    case 'angulada':

      return empunaduraAnguladaUltra();


    case 'bipode':

      return empunaduraBipodeUltra();


    case 'topeMano':

      return empunaduraTopeUltra();


    case 'cortaCombate':

      return empunaduraCortaUltra();


    case 'ninguna':

    default:

      return marcarUltra(
        new THREE.Group(),
        'empunadura_ninguna'
      );
  }
}



/* ═══════════════════════════════════
   WRAPPER DEL MODELO BASE
═══════════════════════════════════ */

function reemplazarAccesorios(

  modelo,

  seleccion

) {

  const grupo =
    modelo.grupo;


  /*
    MODELO BASE:

    0 cuerpo
    1 cañón
    2 cargador
    3 mira
    4 empuñadura
    5 boca
  */

  const hijos =
    grupo.children
      .slice(
        0,
        6
      );


  if (
    hijos.length <
    6
  ) {

    console.warn(
      '[DEAL] estructura inesperada en modeloArmaBase'
    );

    return modelo;
  }


  const cargadorViejo =
    hijos[2];


  const miraVieja =
    hijos[3];


  const empunaduraVieja =
    hijos[4];


  const bocaVieja =
    hijos[5];


  const puntoCargador =
    cargadorViejo
      .position
      .clone();


  const puntoMira =
    miraVieja
      .position
      .clone();


  const puntoEmpunadura =
    empunaduraVieja
      .position
      .clone();


  const puntaCanonBase =
    bocaVieja
      .position
      .clone();


  for (
    const viejo
    of [

      cargadorViejo,

      miraVieja,

      empunaduraVieja,

      bocaVieja,
    ]
  ) {

    grupo.remove(
      viejo
    );


    limpiarGeometrias(
      viejo
    );
  }


  /* CARGADOR */

  const cargador =
    crearCargadorUltra(

      seleccion.cargador

      ??

      'medio'
    );


  cargador.position.copy(
    puntoCargador
  );


  grupo.add(
    cargador
  );


  /* MIRA */

  const puntaLocalMira =

    puntaCanonBase
      .clone()
      .sub(
        puntoMira
      );


  const partesMira =
    crearMiraUltra(

      seleccion.mira

      ??

      'ninguna',

      puntaLocalMira
    );


  partesMira
    .grupo
    .position
    .copy(
      puntoMira
    );


  grupo.add(
    partesMira.grupo
  );


  /* EMPUÑADURA */

  const emp =
    crearEmpunaduraUltra(

      seleccion.empuñadura

      ??

      'ninguna'
    );


  emp.position.copy(
    puntoEmpunadura
  );


  grupo.add(
    emp
  );


  /* BOCA */

  const radioPunta =
    radioCanonEstimado(

      seleccion.cañon,

      seleccion.cuerpo
    );


  const partesBoca =
    crearBocaUltra(

      seleccion.boca

      ??

      'ninguna',

      radioPunta
    );


  partesBoca
    .grupo
    .position
    .copy(
      puntaCanonBase
    );


  grupo.add(
    partesBoca.grupo
  );


  /* PUNTA REAL */

  const puntaCañon =
    puntaCanonBase.clone();


  puntaCañon.z -=
    partesBoca.longitudExtra;


  /* PUNTO OCULAR */

  const puntoOcular =

    puntoMira
      .clone()
      .add(
        partesMira.puntoOcular
      );


  /*
    Recalcular posición ADS.

    Near = 0.035.

    Reservamos margen para recoil.
  */

  const LIMITE_Z =
    -0.090;


  let zMasAtras =
    -Infinity;


  grupo.updateMatrixWorld(
    true
  );


  grupo.traverse(
    o => {

      if (
        !o.isMesh ||
        o.userData.esCulata
      ) {
        return;
      }


      const caja =
        new THREE.Box3()
          .setFromObject(
            o
          );


      if (
        caja.max.z >
        zMasAtras
      ) {

        zMasAtras =
          caja.max.z;
      }
    }
  );


  if (
    zMasAtras ===
    -Infinity
  ) {

    zMasAtras =
      0;
  }


  const posApuntando =
    puntoOcular
      .clone()
      .negate();


  const zFinal =

    zMasAtras

    +

    posApuntando.z;


  if (
    zFinal >
    LIMITE_Z
  ) {

    posApuntando.z -=

      zFinal

      -

      LIMITE_Z;
  }


  modelo.puntaCañon =
    puntaCañon;


  modelo.puntoOcular =
    puntoOcular;


  modelo.posApuntando =
    posApuntando;


  preparar(
    grupo
  );


  return modelo;
}



export function construirModeloArma(
  seleccion
) {

  const modelo =
    construirModeloBase(
      seleccion
    );


  return reemplazarAccesorios(

    modelo,

    seleccion
  );
}



export function liberarModeloArma(
  modelo
) {

  if (
    !modelo?.grupo
  ) {
    return;
  }


  const ultras =
    modelo
      .grupo
      .children
      .filter(

        h =>
          h.userData
            ?.accesorioUltra
      );


  for (
    const ultra
    of ultras
  ) {

    modelo
      .grupo
      .remove(
        ultra
      );


    limpiarGeometrias(
      ultra
    );
  }


  liberarModeloBase(
    modelo
  );
}

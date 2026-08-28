import * as THREE from 'three';

import {
  crearMundo,
} from './core/mundo.js';

import {
  crearJugador,
} from './core/jugador.js';

import {
  crearArma,
} from './armas/arma.js';

import {
  ensamblarArma,
} from './armas/ensamblar.js';

import {

  CUERPOS,

  CAÑONES,

  CARGADORES,

  MIRAS,

  BOCAS,

  EMPUÑADURAS,

  GATILLOS,

  MUNICIONES,

  ACABADOS,

} from './armas/piezas.js';

import {
  crearInventario,
} from './armas/inventario.js';

import {
  crearCielo,
} from './graficos/cielo.js';

import {
  crearAnimador,
} from './graficos/animacion.js';

import {
  crearEfectos,
} from './graficos/efectos.js';

import {
  crearTaller,
} from './entornos/taller.js';

import {
  crearCabina,
} from './entornos/cabina.js';

import {
  crearExhibidorArma,
} from './entornos/exhibidorArma.js';

import {
  crearBancoTrabajo,
} from './ui/bancoTrabajo.js';

import {
  crearHud,
} from './ui/hud.js';

import {

  iniciarAudio,

  sonidoDisparo,

  sonidoVacio,

  sonidoRecarga,

  sonidoPaso,

  sonidoConfirmar,

  parametrosDisparoDeArma,

} from './audio/sfx.js';

import {
  crearMundoFisico,
} from './fisica/mundoFisico.js';

import {
  crearPersonajeVisual,
} from './personaje/personajeVisual.js';

import {
  crearRagdoll,
} from './personaje/ragdoll.js';

import {
  crearBrazosFPS,
} from './personaje/brazosFPS.js';



/* ═══════════════════════════════════
   MUNDO
═══════════════════════════════════ */

const {

  scene,

  camera,

  renderer,

  sol,

  ALTURA_OJOS,

  configurarDireccionSol,

  actualizarIluminacion,

} =
  crearMundo();


const efectos =
  crearEfectos(
    scene
  );


const fisica =
  await crearMundoFisico();


const {
  direccionSol,
} =
  crearCielo(
    scene
  );


if (
  configurarDireccionSol
) {

  configurarDireccionSol(
    direccionSol
  );
}
else if (
  sol
) {

  sol.position
    .copy(
      direccionSol
    )
    .multiplyScalar(
      60
    );
}



/* ═══════════════════════════════════
   ENTORNOS
═══════════════════════════════════ */

const taller =
  crearTaller(
    scene
  );


const cabina =
  crearCabina(
    scene
  );


camera.position
  .copy(
    taller.puntoAparicion
  )
  .setY(
    ALTURA_OJOS
  );


const colisionablesJugador = [

  ...taller
    .colisionablesJugador,

  ...cabina
    .colisionablesJugador,
];


const meshesDisparables = [

  ...taller
    .meshesDisparables,

  ...cabina
    .meshesDisparables,
];



/* ═══════════════════════════════════
   JUGADOR
═══════════════════════════════════ */

const animador =
  crearAnimador();


const jugador =
  crearJugador(

    camera,

    document.body,

    {

      colisionables:
        colisionablesJugador,

      alturaOjos:
        ALTURA_OJOS,

      animador,
    }
  );



/* ═══════════════════════════════════
   PERSONAJE
═══════════════════════════════════ */

const personaje =
  crearPersonajeVisual(

    scene,

    {
      alturaOjos:
        ALTURA_OJOS,
    }
  );


personaje.actualizar(

  camera,

  0,

  0,

  {
    armado:
      false,

    apuntando:
      false,
  }
);


const ragdoll =
  crearRagdoll({

    scene,

    fisica,

    personaje,
  });



/* ═══════════════════════════════════
   ARMA
═══════════════════════════════════ */

function estadisticasDeSeleccion(
  seleccion
) {

  if (
    !seleccion
  ) {

    return null;
  }


  return ensamblarArma({

    cuerpo:
      CUERPOS[
        seleccion.cuerpo
      ],

    cañon:
      CAÑONES[
        seleccion.cañon
      ],

    cargador:
      CARGADORES[
        seleccion.cargador
      ],

    mira:
      MIRAS[
        seleccion.mira
      ],

    boca:
      BOCAS[
        seleccion.boca
      ],

    empuñadura:
      EMPUÑADURAS[
        seleccion.empuñadura
      ],

    gatillo:
      GATILLOS[
        seleccion.gatillo
      ],

    municion:
      MUNICIONES[
        seleccion.municion
      ],

    acabado:
      ACABADOS[
        seleccion.acabado
      ],
  });
}



const seleccionInicial = {

  cuerpo:
    'pistola',

  cañon:
    'estandar',

  cargador:
    'medio',

  mira:
    'ninguna',

  boca:
    'ninguna',

  empuñadura:
    'ninguna',

  gatillo:
    'ninguno',

  municion:
    'estandar',

  acabado:
    'fabrica',
};



const estadisticasArma =
  estadisticasDeSeleccion(
    seleccionInicial
  );


const arma =
  crearArma(

    camera,

    animador,

    estadisticasArma,

    seleccionInicial
  );



const brazosFPS =
  crearBrazosFPS(

    camera,

    arma.grupo,

    seleccionInicial
  );


brazosFPS.actualizar({
  visible:
    false,
});



/*
  SOMBRA DEL ARMA RESTAURADA.
*/

function configurarSombrasArmaFPS() {

  arma.grupo.traverse(

    obj => {

      if (
        !obj.isMesh
      ) {
        return;
      }


      obj.castShadow =
        true;


      obj.receiveShadow =
        false;


      obj.frustumCulled =
        false;
    }
  );
}


configurarSombrasArmaFPS();



const inventario =
  crearInventario(
    seleccionInicial
  );


const hud =
  crearHud();



/* ═══════════════════════════════════
   BANCO
═══════════════════════════════════ */

const exhibidor =
  crearExhibidorArma(

    scene,

    taller.superficieMesa
  );


const posicionMesaJugador =
  taller
    .posicionMesa
    .clone()
    .setY(
      ALTURA_OJOS
    );


const banco =
  crearBancoTrabajo({

    posicionMesa:
      posicionMesaJugador,


    posicionExhibidor:

      taller
        .superficieMesa
        .clone()
        .setY(

          taller
            .superficieMesa
            .y

          +

          0.05
        ),


    radioInteraccion:
      2.2,


    controls:
      jugador.controls,


    camera,


    exhibidor,


    onAplicar: (

      nuevasEstadisticas,

      nuevaSeleccion

    ) => {

      sonidoConfirmar();


      inventario
        .actualizarActivo(
          nuevaSeleccion
        );


      arma.actualizarArma(

        nuevasEstadisticas,

        nuevaSeleccion
      );


      brazosFPS
        .actualizarSeleccion(
          nuevaSeleccion
        );


      configurarSombrasArmaFPS();
    },
  });


let cercaDeLaMesa =
  false;



/* ═══════════════════════════════════
   MENÚ
═══════════════════════════════════ */

const menuPrincipal =
  document.getElementById(
    'menuPrincipal'
  );


const menuPausa =
  document.getElementById(
    'menuPausa'
  );


let juegoIniciado =
  false;


let apuntando =
  false;


let gatilloPresionado =
  false;



const btnJugar =
  document.getElementById(
    'btnJugar'
  );


const btnReanudar =
  document.getElementById(
    'btnReanudar'
  );


btnJugar.onclick =
  () => {

    iniciarAudio();


    juegoIniciado =
      true;


    menuPrincipal
      .style
      .display =
        'none';


    jugador
      .controls
      .lock();
  };


btnReanudar.onclick =
  () =>

    jugador
      .controls
      .lock();



document.addEventListener(

  'click',

  () => {

    if (

      juegoIniciado

      &&

      !banco.abierto

      &&

      !ragdoll.activo
    ) {

      jugador
        .controls
        .lock();
    }
  }
);



jugador.controls
  .addEventListener(

    'lock',

    () => {

      menuPausa
        .style
        .display =
          'none';
    }
  );



jugador.controls
  .addEventListener(

    'unlock',

    () => {

      if (

        juegoIniciado

        &&

        !banco.abierto

        &&

        !ragdoll.activo
      ) {

        menuPausa
          .style
          .display =
            'flex';
      }


      apuntando =
        false;


      gatilloPresionado =
        false;
    }
  );



/* ═══════════════════════════════════
   MOUSE
═══════════════════════════════════ */

document.addEventListener(

  'contextmenu',

  e =>
    e.preventDefault()
);



document.addEventListener(

  'mousedown',

  e => {

    if (

      !jugador
        .controls
        .isLocked

      ||

      banco.abierto

      ||

      ragdoll.activo
    ) {

      return;
    }


    if (
      e.button ===
      0
    ) {

      gatilloPresionado =
        true;
    }


    if (
      e.button ===
      2
    ) {

      apuntando =
        true;
    }
  }
);



document.addEventListener(

  'mouseup',

  e => {

    if (
      e.button ===
      0
    ) {

      gatilloPresionado =
        false;
    }


    if (
      e.button ===
      2
    ) {

      apuntando =
        false;
    }
  }
);



/* ═══════════════════════════════════
   INVENTARIO
═══════════════════════════════════ */

const TECLAS_INVENTARIO = {

  Digit1:
    0,

  Digit2:
    1,

  Digit3:
    2,

  Digit4:
    3,

  Digit5:
    4,

  Digit6:
    5,

  Digit7:
    6,

  Digit8:
    7,
};



document.addEventListener(

  'keydown',

  e => {


    /* RECARGA */

    if (

      e.code ===
      'KeyR'

      &&

      jugador
        .controls
        .isLocked

      &&

      !ragdoll.activo
    ) {

      const antes =
        arma.estado();


      arma.recargar();


      if (

        !antes.recargando

        &&

        arma
          .estado()
          .recargando
      ) {

        const sel =
          inventario
            .armaActiva();


        sonidoRecarga(

          sel

            ? (

                CARGADORES[
                  sel.cargador
                ]

                ?.peso

                ??

                0.2
              )

            : 0.2
        );
      }
    }



    /* BANCO */

    if (

      e.code ===
      'KeyE'

      &&

      jugador
        .controls
        .isLocked

      &&

      cercaDeLaMesa

      &&

      !ragdoll.activo
    ) {

      banco.abrir();
    }



    /* INSPECCIÓN */

    if (

      e.code ===
      'KeyF'

      &&

      jugador
        .controls
        .isLocked

      &&

      !banco.abierto

      &&

      !ragdoll.activo
    ) {

      arma.inspeccionar(
        true
      );
    }



    /* RAGDOLL */

    if (

      e.code ===
      'F8'

      &&

      juegoIniciado

      &&

      !banco.abierto
    ) {

      e.preventDefault();


      apuntando =
        false;


      gatilloPresionado =
        false;


      const direccion =
        new THREE.Vector3();


      camera
        .getWorldDirection(
          direccion
        );


      direccion
        .multiplyScalar(
          2.4
        );


      direccion.y +=
        0.65;


      ragdoll.alternar({

        impulso:
          direccion,

        puntoImpulso:
          'pecho',
      });


      const estado =
        arma.estado();


      const fpsActivo =

        jugador
          .controls
          .isLocked

        &&

        !ragdoll.activo;


      brazosFPS
        .actualizar({

          visible:

            fpsActivo

            &&

            !estado
              .sinArma,
        });


      arma.grupo.visible =

        fpsActivo

        &&

        !estado.sinArma;
    }
  }
);



document.addEventListener(

  'keyup',

  e => {


    if (
      e.code ===
      'KeyF'
    ) {

      arma.inspeccionar(
        false
      );
    }


    if (

      jugador
        .controls
        .isLocked

      &&

      !ragdoll.activo

      &&

      e.code in
      TECLAS_INVENTARIO
    ) {

      inventario
        .seleccionar(

          TECLAS_INVENTARIO[
            e.code
          ]
        );


      const seleccionActiva =
        inventario
          .armaActiva();


      arma.actualizarArma(

        estadisticasDeSeleccion(
          seleccionActiva
        ),

        seleccionActiva
      );


      brazosFPS
        .actualizarSeleccion(
          seleccionActiva
        );


      configurarSombrasArmaFPS();
    }
  }
);



/* ═══════════════════════════════════
   DISPARO
═══════════════════════════════════ */

const raycaster =
  new THREE.Raycaster();


const direccionArma =
  new THREE.Vector3();



function intentarDisparar() {

  if (
    ragdoll.activo
  ) {

    return;
  }


  const disparo =
    arma.disparar();


  if (
    !disparo
  ) {

    const est =
      arma.estado();


    if (

      !est.sinArma

      &&

      !est.recargando

      &&

      est.balas ===
      0
    ) {

      sonidoVacio();
    }


    return;
  }


  const seleccionActual =
    inventario
      .armaActiva();


  if (
    !seleccionActual
  ) {

    return;
  }


  sonidoDisparo(

    parametrosDisparoDeArma(

      null,

      seleccionActual
        .cuerpo,

      seleccionActual
        .boca
    )
  );


  const puntaCanon =
    arma
      .obtenerPuntaCanon();


  camera
    .getWorldDirection(
      direccionArma
    );


  efectos.destelloBoca?.(

    puntaCanon,

    direccionArma,

    seleccionActual
      .boca ===
      'silenciador'

      ? 0.20

      : 1
  );


  for (

    const proyectil

    of disparo.proyectiles
  ) {

    raycaster.set(

      disparo.origen,

      proyectil.direccion
    );


    raycaster.far =
      disparo.alcance;


    const impactos =
      raycaster
        .intersectObjects(
          meshesDisparables
        );


    const destino =

      impactos.length >
      0

        ? impactos[0]
            .point

        : disparo
            .origen
            .clone()
            .addScaledVector(

              proyectil
                .direccion,

              disparo
                .alcance
            );


    if (
      impactos.length >
      0
    ) {

      const normal =

        impactos[0]
          .face

          ? impactos[0]
              .face
              .normal
              .clone()
              .transformDirection(

                impactos[0]
                  .object
                  .matrixWorld
              )

          : proyectil
              .direccion
              .clone()
              .negate();


      efectos
        .marcaImpacto(

          destino,

          normal
        );


      cabina
        .registrarImpacto(

          impactos[0]
            .object
        );
    }


    efectos
      .trazadoraBala(

        puntaCanon,

        destino,

        disparo
          .colorTrazadora
      );
  }


  const datosCuerpo =
    CUERPOS[
      seleccionActual
        .cuerpo
    ];


  efectos
    .eyectarCasquillo(

      puntaCanon
        .clone()
        .addScaledVector(

          direccionArma,

          -0.15
        ),

      direccionArma,

      0.05,

      datosCuerpo
        ?.escalaCasquillo

      ??

      1,

      datosCuerpo
        ?.calibre ===
        'Calibre 12'
    );


  efectos
    .humoCañon(

      puntaCanon,

      seleccionActual
        .boca ===
        'silenciador'

        ? 0.12

        : 0.72,

      direccionArma
    );
}



/* ═══════════════════════════════════
   LOOP
═══════════════════════════════════ */

let distanciaCaminada =
  0;


const DISTANCIA_POR_PASO =
  1.9;


const reloj =
  new THREE.Clock();



function animar() {

  requestAnimationFrame(
    animar
  );


  const dt =
    Math.min(

      reloj.getDelta(),

      0.1
    );


  if (

    gatilloPresionado

    &&

    !ragdoll.activo
  ) {

    intentarDisparar();
  }


  cercaDeLaMesa =
    banco
      .actualizarProximidad(
        camera.position
      );


  banco
    .actualizarVista3D();


  animador
    .actualizar(
      dt
    );


  efectos
    .actualizar(
      dt
    );


  cabina
    .actualizar(
      dt
    );


  const factorPeso =
    inventario
      .factorPeso();


  const {
    velocidad,
  } =
    jugador
      .actualizar(

        dt,

        apuntando
        &&
        !ragdoll.activo,

        factorPeso
      );


  if (

    !banco.abierto

    &&

    !ragdoll.activo
  ) {

    arma
      .actualizar(

        dt,

        velocidad,

        apuntando,

        factorPeso
      );
  }
  else {

    arma
      .reiniciarSacudida();
  }


  const estadoArma =
    arma.estado();


  if (
    !ragdoll.activo
  ) {

    personaje
      .actualizar(

        camera,

        velocidad,

        dt,

        {

          armado:
            !estadoArma
              .sinArma,

          apuntando,
        }
      );
  }


  fisica
    .actualizar(
      dt
    );


  ragdoll
    .actualizar();


  actualizarIluminacion?.(
    camera.position
  );


  const vistaFPSActiva =

    jugador
      .controls
      .isLocked

    &&

    !banco.abierto

    &&

    !ragdoll.activo;


  personaje
    .mostrarAnimado(
      vistaFPSActiva
    );


  brazosFPS
    .actualizar({

      visible:

        vistaFPSActiva

        &&

        !estadoArma
          .sinArma,
    });


  arma.grupo.visible =

    vistaFPSActiva

    &&

    !estadoArma
      .sinArma;


  hud
    .actualizar(

      estadoArma,

      inventario
    );


  if (
    vistaFPSActiva
  ) {

    distanciaCaminada +=

      velocidad

      *

      dt;


    if (

      distanciaCaminada >=
      DISTANCIA_POR_PASO
    ) {

      distanciaCaminada =
        0;


      sonidoPaso();
    }
  }


  renderer.render(
    scene,
    camera
  );
}


animar();

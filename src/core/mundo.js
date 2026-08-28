import * as THREE from 'three';


export function crearMundo() {

  const scene =
    new THREE.Scene();


  const COLOR_AMBIENTE =
    0x8e98a3;


  scene.background =
    new THREE.Color(
      COLOR_AMBIENTE
    );


  /*
    Niebla exponencial.

    Mucho menos agresiva
    que la niebla anterior.
  */

  scene.fog =
    new THREE.FogExp2(

      COLOR_AMBIENTE,

      0.0055
    );


  /* ─────────────────────
     CÁMARA
  ───────────────────── */

  const camera =
    new THREE.PerspectiveCamera(

      75,

      window.innerWidth /
      window.innerHeight,

      0.05,

      6000
    );


  const ALTURA_OJOS =
    1.7;


  camera.position.set(

    0,

    ALTURA_OJOS,

    10
  );


  scene.add(camera);


  /* ─────────────────────
     RENDERER
  ───────────────────── */

  const renderer =
    new THREE.WebGLRenderer({

      antialias:
        true,

      powerPreference:
        'high-performance',
    });


  renderer.setSize(

    window.innerWidth,

    window.innerHeight
  );


  /*
    1.75 mantiene buena
    calidad sin matar GPU
    en monitores 4K/retina.
  */

  renderer.setPixelRatio(

    Math.min(

      window.devicePixelRatio,

      1.75
    )
  );


  /*
    COLOR MANAGEMENT
  */

  renderer.outputColorSpace =
    THREE.SRGBColorSpace;


  /*
    Tone Mapping.

    Hace especialmente
    diferencia en:

    - metal
    - fogonazos
    - cielo
    - interiores
    - casquillos
  */

  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;


  renderer.toneMappingExposure =
    1.16;


  /* ─────────────────────
     SOMBRAS
  ───────────────────── */

  renderer.shadowMap.enabled =
    true;


  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


  document.body.prepend(
    renderer.domElement
  );


  /* ─────────────────────
     ILUMINACIÓN AMBIENTE
  ───────────────────── */

  /*
    Antes AmbientLight era
    muy fuerte y aplastaba
    el contraste.

    Ahora la bajamos.
  */

  const ambiente =
    new THREE.AmbientLight(

      0x9ca6b1,

      0.42
    );


  scene.add(
    ambiente
  );


  /*
    HemisphereLight.

    Cielo frío arriba,
    suelo cálido abajo.

    Esto ayuda muchísimo
    a que el arma no se vea
    completamente negra.
  */

  const hemisferica =
    new THREE.HemisphereLight(

      0xc8d8e8,

      0x4b4439,

      1.05
    );


  scene.add(
    hemisferica
  );


  /* ─────────────────────
     SOL
  ───────────────────── */

  const sol =
    new THREE.DirectionalLight(

      0xe5edf6,

      2.15
    );


  sol.castShadow =
    true;


  /*
    2048 puede parecer menor
    que 4096, pero el frustum
    ahora es MUCHÍSIMO menor.

    Resultado:
    más píxeles de sombra
    por metro.
  */

  sol.shadow
    .mapSize
    .set(

      2048,

      2048
    );


  /*
    La cámara de sombras
    cubre solo 36m.

    Antes cubría alrededor
    de 80m constantemente.
  */

  sol.shadow.camera.left =
    -18;


  sol.shadow.camera.right =
    18;


  sol.shadow.camera.top =
    18;


  sol.shadow.camera.bottom =
    -18;


  sol.shadow.camera.near =
    1;


  sol.shadow.camera.far =
    95;


  /*
    Reduce acne
    y shadow peter-panning.
  */

  sol.shadow.bias =
    -0.00022;


  sol.shadow.normalBias =
    0.025;


  scene.add(sol);


  scene.add(
    sol.target
  );


  /* ─────────────────────
     PISO EXTERIOR
  ───────────────────── */

  const suelo =
    new THREE.Mesh(

      new THREE.PlaneGeometry(

        70,

        90
      ),

      new THREE.MeshStandardMaterial({

        color:
          0x5a574e,

        roughness:
          0.94,

        metalness:
          0.0,
      })
    );


  suelo.rotation.x =
    -Math.PI / 2;


  suelo.position.set(

    0,

    0,

    20
  );


  suelo.receiveShadow =
    true;


  scene.add(
    suelo
  );


  /* ─────────────────────
     SOMBRA DINÁMICA
  ───────────────────── */

  const direccionSolActual =
    new THREE.Vector3(

      0.4,

      0.7,

      0.25
    )
    .normalize();


  function configurarDireccionSol(
    direccion
  ) {

    direccionSolActual
      .copy(
        direccion
      )
      .normalize();
  }


  /*
    El sol sigue al jugador.

    NO cambia su ángulo.

    Solo mueve la cámara
    de sombras alrededor
    de donde estás.
  */

  function actualizarIluminacion(
    posicionJugador
  ) {

    sol.target
      .position
      .set(

        posicionJugador.x,

        0.8,

        posicionJugador.z
      );


    sol.position
      .copy(
        sol.target.position
      )
      .addScaledVector(

        direccionSolActual,

        42
      );


    sol.target
      .updateMatrixWorld();
  }


  /* ─────────────────────
     RESIZE
  ───────────────────── */

  window.addEventListener(
    'resize',

    () => {

      camera.aspect =

        window.innerWidth
        /
        window.innerHeight;


      camera
        .updateProjectionMatrix();


      renderer.setSize(

        window.innerWidth,

        window.innerHeight
      );


      renderer.setPixelRatio(

        Math.min(

          window.devicePixelRatio,

          1.75
        )
      );
    }
  );


  return {

    scene,

    camera,

    renderer,

    sol,

    ambiente,

    hemisferica,

    ALTURA_OJOS,

    configurarDireccionSol,

    actualizarIluminacion,
  };
}


/*
  Compatibilidad con
  código anterior.
*/

const _colorImpacto =
  new THREE.Color(
    0xff3b3b
  );


export function marcarImpacto(
  mesh
) {

  if (
    !mesh.material ||
    !mesh.material.color ||
    mesh.userData.flasheando
  ) {
    return;
  }


  mesh.userData.flasheando =
    true;


  const colorOriginal =
    mesh.material
      .color
      .clone();


  mesh.material
    .color
    .copy(
      _colorImpacto
    );


  setTimeout(
    () => {

      if (
        mesh.material?.color
      ) {

        mesh.material
          .color
          .copy(
            colorOriginal
          );
      }


      mesh.userData.flasheando =
        false;

    },

    90
  );
}

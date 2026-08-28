import * as THREE from 'three';

/* ── core/mundo.js ───────────────────────────────────────────
   DEAL — GRAPHICS PASS V4.1

   Objetivos:
   - near plane más pequeño para viewmodel/cuerpo cercano;
   - sRGB + ACES Filmic;
   - luz ambiental que no aplaste el contraste;
   - sombras direccionales de alta resolución alrededor del jugador;
   - arma y cuerpo legibles tanto en interior como exterior.
──────────────────────────────────────────────────────────── */

export function crearMundo() {
  const scene = new THREE.Scene();

  const COLOR_CIELO = 0x9099a3;

  scene.background =
    new THREE.Color(
      COLOR_CIELO
    );

  scene.fog =
    new THREE.FogExp2(
      COLOR_CIELO,
      0.0048
    );


  /* ── CÁMARA ───────────────────────── */

  const ALTURA_OJOS =
    1.70;

  const camera =
    new THREE.PerspectiveCamera(
      75,

      window.innerWidth /
      window.innerHeight,

      0.035,

      6000
    );

  camera.position.set(
    0,
    ALTURA_OJOS,
    10
  );

  scene.add(
    camera
  );


  /* ── RENDERER ─────────────────────── */

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


  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      1.65
    )
  );


  renderer.outputColorSpace =
    THREE.SRGBColorSpace;


  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;


  renderer.toneMappingExposure =
    1.20;


  renderer.shadowMap.enabled =
    true;


  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


  renderer.shadowMap.autoUpdate =
    true;


  document.body.prepend(
    renderer.domElement
  );


  /* ── ILUMINACIÓN GLOBAL ───────────── */

  const ambiente =
    new THREE.AmbientLight(
      0x9ca6b3,
      0.34
    );

  scene.add(
    ambiente
  );


  const hemisferica =
    new THREE.HemisphereLight(
      0xd5e2ef,
      0x494236,
      1.12
    );

  scene.add(
    hemisferica
  );


  /* ── SOL ──────────────────────────── */

  const sol =
    new THREE.DirectionalLight(
      0xeaf1f8,
      2.35
    );


  sol.castShadow =
    true;


  sol.shadow.mapSize.set(
    4096,
    4096
  );


  sol.shadow.camera.left =
    -16;

  sol.shadow.camera.right =
    16;

  sol.shadow.camera.top =
    16;

  sol.shadow.camera.bottom =
    -16;


  sol.shadow.camera.near =
    0.5;

  sol.shadow.camera.far =
    90;


  sol.shadow.bias =
    -0.00018;


  sol.shadow.normalBias =
    0.018;


  sol.shadow.radius =
    2;


  scene.add(
    sol
  );

  scene.add(
    sol.target
  );


  /* ── PISO ─────────────────────────── */

  const suelo =
    new THREE.Mesh(

      new THREE.PlaneGeometry(
        70,
        90
      ),

      new THREE.MeshStandardMaterial({
        color:
          0x5b584f,

        roughness:
          0.93,

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


  /* ── SOMBRAS DINÁMICAS ───────────── */

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

    if (!direccion) {
      return;
    }

    direccionSolActual
      .copy(
        direccion
      )
      .normalize();
  }


  function actualizarIluminacion(
    posicionJugador
  ) {

    if (!posicionJugador) {
      return;
    }


    sol.target.position.set(
      posicionJugador.x,
      0.9,
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


  /* ── RESIZE ───────────────────────── */

  window.addEventListener(
    'resize',

    () => {

      camera.aspect =
        window.innerWidth /
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
          1.65
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


/* Compatibilidad */
const _colorImpacto =
  new THREE.Color(
    0xff3b3b
  );


export function marcarImpacto(
  mesh
) {

  if (
    !mesh?.material?.color ||
    mesh.userData.flasheando
  ) {
    return;
  }


  mesh.userData.flasheando =
    true;


  const original =
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
            original
          );
      }


      mesh.userData.flasheando =
        false;

    },

    90
  );
}

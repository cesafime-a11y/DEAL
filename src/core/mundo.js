/* ── core/mundo.js ─────────────────────────────────────────
   Motor visual base de DEAL.

   V2 gráfica:
   - sRGB correcto
   - ACES Filmic tone mapping
   - exposición calibrada
   - sombras suaves con mejor precisión
   - luz hemisférica para exteriores/interiores
   - niebla algo más natural
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';

export function crearMundo() {
  const scene = new THREE.Scene();

  const COLOR_CIELO = 0x98a1aa;
  scene.background = new THREE.Color(COLOR_CIELO);
  scene.fog = new THREE.FogExp2(COLOR_CIELO, 0.0085);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.06,     // más cerca que antes: reduce clipping del arma/manos
    6000
  );

  const ALTURA_OJOS = 1.7;
  camera.position.set(0, ALTURA_OJOS, 10);
  scene.add(camera);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

  // Pipeline de color moderno. Esto evita el aspecto lavado/gris
  // de materiales PBR mostrados sin conversión sRGB.
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.body.prepend(renderer.domElement);

  /* Iluminación global.
     Ambient se mantiene moderada para no aplastar el contraste.
     Hemisphere da rebote frío del cielo y cálido del suelo. */
  const ambient = new THREE.AmbientLight(0xb7bec7, 0.72);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(
    0xc8d7e5,
    0x4a4338,
    1.15
  );
  scene.add(hemi);

  const sol = new THREE.DirectionalLight(0xe7edf5, 2.0);
  sol.position.set(12, 22, 8);
  sol.castShadow = true;

  sol.shadow.mapSize.set(4096, 4096);
  sol.shadow.camera.left = -38;
  sol.shadow.camera.right = 38;
  sol.shadow.camera.top = 38;
  sol.shadow.camera.bottom = -38;
  sol.shadow.camera.near = 1;
  sol.shadow.camera.far = 130;

  // Ayuda con acne/peter-panning sin despegar demasiado las sombras.
  sol.shadow.bias = -0.00025;
  sol.shadow.normalBias = 0.025;

  scene.add(sol);

  /* Piso general */
  const suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 90),
    new THREE.MeshStandardMaterial({
      color: 0x5a5648,
      roughness: 0.92,
      metalness: 0.0,
    })
  );

  suelo.rotation.x = -Math.PI / 2;
  suelo.position.set(0, 0, 20);
  suelo.receiveShadow = true;
  scene.add(suelo);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  });

  return {
    scene,
    camera,
    renderer,
    sol,
    ambient,
    hemi,
    ALTURA_OJOS,
  };
}

/* Se conserva por compatibilidad con código viejo. */
const _colorImpacto = new THREE.Color(0xff3b3b);

export function marcarImpacto(mesh) {
  if (!mesh.material || mesh.userData.flasheando) return;

  mesh.userData.flasheando = true;
  const colorOriginal = mesh.material.color.clone();

  mesh.material.color.copy(_colorImpacto);

  setTimeout(() => {
    if (mesh.material?.color) {
      mesh.material.color.copy(colorOriginal);
    }
    mesh.userData.flasheando = false;
  }, 110);
}


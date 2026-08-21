/* ── core/mundo.js ─────────────────────────────────────────
   El motor genérico: escena, cámara, renderer, luces base, un
   piso grande que cubre todo el recorrido, y resize. Ya NO
   arma ningún entorno específico — eso vive en entornos/taller.js
   y entornos/cabina.js, que agregan su propio contenido a esta
   misma escena compartida. El cielo vive aparte, en
   graficos/cielo.js.
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';

export function crearMundo() {
  const scene = new THREE.Scene();
  // gris azulado de día nublado — no negro; el cielo real lo pone
  // graficos/cielo.js, esto es solo respaldo por si algo no lo cubre
  scene.background = new THREE.Color(0x8b9098);
  scene.fog = new THREE.Fog(0x8b9098, 20, 140);

  const camera = new THREE.PerspectiveCamera(
    // el plano lejano se amplió: el cielo (graficos/cielo.js) es
    // enorme (escala 4500) y con 1000 se hubiera recortado
    75, window.innerWidth / window.innerHeight, 0.1, 6000
  );
  const ALTURA_OJOS = 1.7;   // metros — altura de cámara al caminar
  // arranca DENTRO del taller, mirando hacia la puerta (el taller
  // vive cerca del origen — ver entornos/taller.js)
  camera.position.set(0, ALTURA_OJOS, 10);
  // la cámara tiene que ser parte de la escena para que lo que se
  // le cuelgue encima (el arma) también se dibuje
  scene.add(camera);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.prepend(renderer.domElement);

  /* luces — de día nublado: ambiente brillante y neutro, sol
     suave y frío. El taller bloquea esta luz con su techo y usa
     sus propias lámparas interiores (ver entornos/taller.js).  */
  scene.add(new THREE.AmbientLight(0x9aa0a8, 1.5));
  const sol = new THREE.DirectionalLight(0xd8dee4, 1.25);
  sol.position.set(12, 22, 8);   // graficos/cielo.js la reacomoda para que combine con el sol del cielo
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  // sombra ampliada para cubrir taller + corredor + cabina, que
  // ahora están repartidos en un tramo largo del mapa
  // sombra ajustada al tamaño real del edificio — ya no hay un
  // tramo largo al aire libre, todo cabe en una zona más chica
  sol.shadow.camera.left = -40; sol.shadow.camera.right = 40;
  sol.shadow.camera.top = 40; sol.shadow.camera.bottom = -40;
  scene.add(sol);

  /* piso general — cubre el edificio (taller + cabina, ahora un
     solo cuarto largo) más algo de exterior alrededor de la
     entrada; cada cuarto pone su propio piso encima por dentro. */
  const suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 90),
    new THREE.MeshStandardMaterial({ color: 0x5a5648, roughness: 0.95 })
  );
  suelo.rotation.x = -Math.PI / 2;
  suelo.position.set(0, 0, 20);
  suelo.receiveShadow = true;
  scene.add(suelo);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, sol, ALTURA_OJOS };
}

/* Tiñe brevemente de rojo el objeto golpeado, como confirmación
   visual de que el disparo sí conectó — nada elaborado todavía. */
const _colorImpacto = new THREE.Color(0xff3b3b);
export function marcarImpacto(mesh) {
  if (!mesh.material || mesh.userData.flasheando) return;
  mesh.userData.flasheando = true;
  const colorOriginal = mesh.material.color.clone();
  mesh.material.color.copy(_colorImpacto);
  setTimeout(() => {
    mesh.material.color.copy(colorOriginal);
    mesh.userData.flasheando = false;
  }, 110);
}

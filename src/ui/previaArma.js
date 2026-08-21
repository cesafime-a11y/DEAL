/* ── ui/previaArma.js ──────────────────────────────────────
   Una escena de Three.js aparte y pequeña, dedicada solo a
   mostrar el arma dentro del panel del banco de trabajo — así
   ves el resultado de cada cambio al instante, sin tener que
   cerrar el panel y disparar para sentirlo. Completamente
   independiente de la escena principal del juego (su propio
   renderer, cámara, luces) — lo único que comparte es la
   función que arma el modelo (construirModeloArma).
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import { construirModeloArma, liberarModeloArma } from '../armas/modeloArma.js';

export function crearPreviaArma(canvasEl) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14120f);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 5);
  camera.position.set(0.34, 0.16, 0.5);
  camera.lookAt(0, -0.02, 0);

  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // luces propias — nada de sol/cielo aquí, esto vive aparte del
  // mundo del juego. Dos direccionales cruzadas para que el metal
  // se lea bien desde cualquier ángulo mientras gira.
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const luzPrincipal = new THREE.DirectionalLight(0xffe4bd, 1.7);
  luzPrincipal.position.set(1.4, 1.8, 1.2);
  scene.add(luzPrincipal);
  const luzRelleno = new THREE.DirectionalLight(0x7f96ff, 0.55);
  luzRelleno.position.set(-1.3, 0.4, -0.8);
  scene.add(luzRelleno);

  let modeloActual = null;
  let rotacionExtra = 0;
  const ROTACION_BASE = Math.PI * 0.62;   // vista de 3/4, no de perfil directo
  let anchoPrevio = -1, altoPrevio = -1;

  /* Reemplaza el arma que se muestra — misma función que arma el
     modelo de verdad en el juego, así lo que ves aquí es EXACTO
     a lo que vas a traer en mano, no una aproximación.           */
  function mostrarArma(seleccion) {
    if (modeloActual) {
      scene.remove(modeloActual.grupo);
      liberarModeloArma(modeloActual);
    }
    modeloActual = construirModeloArma(seleccion);
    modeloActual.grupo.rotation.y = ROTACION_BASE + rotacionExtra;
    scene.add(modeloActual.grupo);
  }

  function ajustarTamaño() {
    const ancho = canvasEl.clientWidth, alto = canvasEl.clientHeight;
    if (ancho === 0 || alto === 0 || (ancho === anchoPrevio && alto === altoPrevio)) return;
    anchoPrevio = ancho; altoPrevio = alto;
    renderer.setSize(ancho, alto, false);
    camera.aspect = ancho / alto;
    camera.updateProjectionMatrix();
  }

  /* Se llama cada cuadro SOLO mientras el banco está abierto — no
     tiene sentido gastar en renderizar esto si nadie lo ve.       */
  function actualizar(dt) {
    ajustarTamaño();
    rotacionExtra += dt * 0.4;   // giro lento y constante, para verla desde todos lados
    if (modeloActual) modeloActual.grupo.rotation.y = ROTACION_BASE + rotacionExtra;
    renderer.render(scene, camera);
  }

  return { mostrarArma, actualizar };
}

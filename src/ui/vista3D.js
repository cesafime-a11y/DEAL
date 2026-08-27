/* ── ui/vista3D.js ──────────────────────────────────────────
   Ventana de inspección: el arma terminada, en su propia escena
   aparte, que puedes arrastrar con el mouse para girarla y verla
   desde cualquier ángulo — no es el mismo render que la mesa
   (que solo la muestra tendida de un lado), esto es para
   inspeccionarla de verdad antes de confirmar.
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import { construirModeloArma, liberarModeloArma } from '../armas/modeloArma.js';

export function crearVista3D(canvasEl) {
  const scene = new THREE.Scene();
  /* Fondo gris claro tipo estudio de producto, en vez de casi negro:
     contra un fondo oscuro, el metal oscuro del arma (MAT_METAL es
     casi negro, 0x2a2a2e) se perdía y era difícil distinguir bordes
     o huecos reales. Con un fondo claro la silueta se lee de
     inmediato, que es justo el punto de esta ventana — poder
     revisar la geometría de verdad.                                */
  scene.background = new THREE.Color(0xc7cbd1);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 5);
  const DISTANCIA = 0.55;
  let rotY = Math.PI * 0.65;   // vista de 3/4 al abrir, no de perfil directo
  let rotX = 0.22;             // ligera inclinación desde arriba

  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene.add(new THREE.AmbientLight(0xffffff, 1.35));
  const luzPrincipal = new THREE.DirectionalLight(0xffe4bd, 1.9);
  luzPrincipal.position.set(1.4, 1.8, 1.2);
  luzPrincipal.castShadow = true;
  luzPrincipal.shadow.mapSize.set(1024, 1024);
  luzPrincipal.shadow.camera.left = -0.4; luzPrincipal.shadow.camera.right = 0.4;
  luzPrincipal.shadow.camera.top = 0.4; luzPrincipal.shadow.camera.bottom = -0.4;
  luzPrincipal.shadow.bias = -0.002;
  scene.add(luzPrincipal);
  // relleno más fuerte que antes: contra el fondo claro, las caras
  // en sombra del arma se veían como manchas negras sin detalle —
  // esto les da suficiente luz para distinguir su propia forma.
  const luzRelleno = new THREE.DirectionalLight(0x8fa2ff, 0.85);
  luzRelleno.position.set(-1.3, 0.3, -0.8);
  scene.add(luzRelleno);
  const luzTrasera = new THREE.DirectionalLight(0xffffff, 0.5);
  luzTrasera.position.set(0, 0.5, -1.5);
  scene.add(luzTrasera);

  // un plano de apoyo, sutil — sin esto el arma se sentía flotando
  // en el vacío, sin ningún punto de contacto con nada. Tono un
  // poco más oscuro que el fondo (no negro): con fondo claro, un
  // disco casi negro se veía como un hoyo, no como una base.
  const piso = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 24),
    new THREE.MeshStandardMaterial({ color: 0x9a9ea4, roughness: 0.95 })
  );
  piso.rotation.x = -Math.PI / 2;
  piso.position.y = -0.4;   // verificado contra la combinación más grande posible (francotirador+cargador grande llega a Y=-0.342)
  piso.receiveShadow = true;
  scene.add(piso);

  let modeloActual = null;
  let activo = false;

  function actualizarCamara() {
    camera.position.set(
      DISTANCIA * Math.sin(rotY) * Math.cos(rotX),
      DISTANCIA * Math.sin(rotX) + 0.02,
      DISTANCIA * Math.cos(rotY) * Math.cos(rotX)
    );
    camera.lookAt(0, 0, 0);
  }
  actualizarCamara();

  /* Reemplaza el arma que se inspecciona — misma función que
     arma el modelo de verdad, así lo que ves aquí es exacto.    */
  function mostrarArma(seleccion) {
    if (modeloActual) {
      scene.remove(modeloActual.grupo);
      liberarModeloArma(modeloActual);
    }
    modeloActual = construirModeloArma(seleccion);
    scene.add(modeloActual.grupo);
  }

  // arrastrar con el mouse para girar — solo mientras esta vista
  // está activa, para no interferir con el resto de la interfaz
  let arrastrando = false;
  let ultimoX = 0, ultimoY = 0;
  canvasEl.addEventListener('mousedown', (e) => {
    if (!activo) return;
    arrastrando = true;
    ultimoX = e.clientX; ultimoY = e.clientY;
    e.stopPropagation();
  });
  window.addEventListener('mousemove', (e) => {
    if (!activo || !arrastrando) return;
    const dx = e.clientX - ultimoX, dy = e.clientY - ultimoY;
    ultimoX = e.clientX; ultimoY = e.clientY;
    rotY += dx * 0.008;
    rotX = Math.max(-1.3, Math.min(1.3, rotX + dy * 0.008));
    actualizarCamara();
  });
  window.addEventListener('mouseup', () => { arrastrando = false; });

  function activar(seleccion) {
    activo = true;
    rotY = Math.PI * 0.65;
    rotX = 0.22;
    actualizarCamara();
    mostrarArma(seleccion);
  }

  function desactivar() {
    activo = false;
    if (modeloActual) {
      scene.remove(modeloActual.grupo);
      liberarModeloArma(modeloActual);
      modeloActual = null;
    }
  }

  let anchoPrevio = -1, altoPrevio = -1;
  function ajustarTamaño() {
    const ancho = canvasEl.clientWidth, alto = canvasEl.clientHeight;
    if (ancho === 0 || alto === 0 || (ancho === anchoPrevio && alto === altoPrevio)) return;
    anchoPrevio = ancho; altoPrevio = alto;
    renderer.setSize(ancho, alto, false);
    camera.aspect = ancho / alto;
    camera.updateProjectionMatrix();
  }

  /* Se llama cada cuadro desde main.js — solo hace algo mientras
     esta vista está activa.                                     */
  function actualizar() {
    if (!activo) return;
    ajustarTamaño();
    renderer.render(scene, camera);
  }

  return { activar, desactivar, mostrarArma, actualizar };
}

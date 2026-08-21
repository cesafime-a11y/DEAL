/* ── entornos/exhibidorArma.js ─────────────────────────────
   El arma tendida sobre la mesa de trabajo, dentro del mundo
   real del juego — ya no una vista previa aparte en un panel
   flotante, sino el arma de verdad, en el lugar de verdad,
   actualizándose en vivo mientras la armas en el banco. Como
   vive en la escena principal, puedes caminar alrededor de la
   mesa y verla desde cualquier ángulo, no solo el que decida
   una cámara de vista previa.
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import { construirModeloArma, liberarModeloArma } from '../armas/modeloArma.js';

export function crearExhibidorArma(scene, posicionMesa) {
  let modeloActual = null;

  // la mesa (taller.js) mide 0.85 de alto y `posicionMesa` es su
  // CENTRO, no su superficie — la superficie de arriba está a la
  // mitad de esa altura por encima del centro. Sin este ajuste,
  // tanto el arma como el tapete quedaban enterrados a la mitad
  // de la mesa sólida, tapados por su propia geometría (confirmado
  // con el diagnóstico: posición Y=0.47 real vs 0.85 de superficie).
  const ALTO_SUPERFICIE_MESA = 0.425;   // la mitad de 0.85
  const superficieMesa = posicionMesa.clone().setY(posicionMesa.y + ALTO_SUPERFICIE_MESA);

  // el tapete de exhibición y el foco son fijos — se prenden y
  // apagan, no se reconstruyen cada vez que cambias de pieza
  const tapete = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.006, 0.24),
    new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.95 })
  );
  tapete.position.set(superficieMesa.x, superficieMesa.y + 0.003, superficieMesa.z);
  tapete.receiveShadow = true;
  tapete.visible = false;
  scene.add(tapete);

  const foco = new THREE.SpotLight(0xffe4bd, 0, 6, Math.PI / 7, 0.4, 1.5);
  foco.position.set(superficieMesa.x, superficieMesa.y + 1.1, superficieMesa.z);
  foco.castShadow = true;
  scene.add(foco);
  foco.target.position.copy(superficieMesa);
  scene.add(foco.target);

  /* Reemplaza el arma tendida sobre la mesa — misma función que
     arma el modelo de verdad que traes en mano, así lo que ves
     aquí es EXACTO a lo que vas a llevarte al confirmar.        */
  function mostrarArma(seleccion) {
    if (modeloActual) {
      scene.remove(modeloActual.grupo);
      liberarModeloArma(modeloActual);
    }
    modeloActual = construirModeloArma(seleccion);

    // acostada de lado sobre la mesa: el cañón queda a lo largo
    // (eje X del mundo, el lado largo de la mesa), "arriba" del
    // arma apunta de lado (Z) — verificado numéricamente antes
    // de escribir esto, no a ojo
    modeloActual.grupo.rotation.set(Math.PI / 2, Math.PI / 2, 0);
    modeloActual.grupo.position.set(
      superficieMesa.x,
      superficieMesa.y + 0.05,   // un poco arriba de la superficie real, para que no se entierre
      superficieMesa.z
    );
    modeloActual.grupo.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
    scene.add(modeloActual.grupo);

    tapete.visible = true;
    foco.intensity = 5.5;
  }

  /* Quita el arma de la mesa — se llama al cerrar el banco, para
     no dejar una copia "fantasma" mientras traes la de verdad
     en mano.                                                     */
  function ocultar() {
    if (modeloActual) {
      scene.remove(modeloActual.grupo);
      liberarModeloArma(modeloActual);
      modeloActual = null;
    }
    tapete.visible = false;
    foco.intensity = 0;
  }

  return { mostrarArma, ocultar };
}

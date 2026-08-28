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
import { construirModeloArma, liberarModeloArma } from '../armas/modeloArmaBase.js';

export function crearExhibidorArma(scene, superficieMesa) {
  let modeloActual = null;

  // `superficieMesa` viene ya calculada desde taller.js — antes se
  // calculaba aquí sumando un valor fijo al centro de la mesa, y
  // eso se rompía cada vez que la mesa cambiaba de forma (pasó al
  // convertirla de bloque macizo a tablero con patas).

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
  foco.shadow.mapSize.set(1024, 1024);
  foco.shadow.bias = -0.0015;
  scene.add(foco);
  foco.target.position.copy(superficieMesa);
  scene.add(foco.target);

  // luz de relleno suave, desde el lado contrario — sin ella, el
  // foco solo (muy direccional) dejaba el lado no iluminado del
  // arma casi negro, perdiendo todo el detalle nuevo (remaches,
  // líneas de panel, riel) de ese lado
  const relleno = new THREE.PointLight(0x8fa8d8, 0, 2.2, 2);
  relleno.position.set(superficieMesa.x - 0.35, superficieMesa.y + 0.35, superficieMesa.z + 0.25);
  scene.add(relleno);

  /* Luz de borde ("rim light"): un tercer punto detrás del arma,
     con un tono cálido — perfila la silueta del arma contra la
     mesa oscura, y es lo que en fotos de producto se ve como el
     brillo dorado que separa el objeto del fondo. Sin esto, los
     bordes del arma se fundían con el fondo del taller. Se prende
     y apaga junto con el foco principal.                          */
  const rim = new THREE.PointLight(0xffb96e, 0, 1.4, 2.2);
  rim.position.set(superficieMesa.x + 0.3, superficieMesa.y + 0.18, superficieMesa.z - 0.35);
  scene.add(rim);

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
    relleno.intensity = 1.4;
    rim.intensity = 2.2;
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
    relleno.intensity = 0;
    rim.intensity = 0;
  }

  return { mostrarArma, ocultar };
}

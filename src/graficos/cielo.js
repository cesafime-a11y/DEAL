/* ── graficos/cielo.js ─────────────────────────────────────
   Módulo de gráficos/atmósfera: cielo, sol, y todo lo que haga
   falta después (clima, hora del día). Separado de mundo.js a
   propósito — "cómo se ve el ambiente" es un problema distinto
   de "qué objetos hay en la escena".

   Día nublado a propósito, no cielo despejado y alegre — encaja
   con el tono del negocio. Usa el modelo Preetham (el mismo que
   trae Three.js de fábrica para cielos realistas).
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

export function crearCielo(scene) {
  const sky = new Sky();
  sky.scale.setScalar(4500);
  scene.add(sky);

  const u = sky.material.uniforms;
  u.turbidity.value = 6;
  u.rayleigh.value = 1.2;
  u.mieCoefficient.value = 0.015;
  u.mieDirectionalG.value = 0.85;
  // nublado: cobertura y densidad altas, nada de cielo limpio
  u.cloudCoverage.value = 0.78;
  u.cloudDensity.value = 0.55;
  u.showSunDisc.value = 0;   // sin disco de sol visible — luz difusa, no un sol marcado

  // sol bajo, como media tarde nublada — luz rasante y suave
  const elevacion = 14;   // grados sobre el horizonte
  const azimut = 205;     // grados de dirección
  const phi = THREE.MathUtils.degToRad(90 - elevacion);
  const theta = THREE.MathUtils.degToRad(azimut);
  const direccionSol = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
  u.sunPosition.value.copy(direccionSol);

  return { sky, direccionSol };
}

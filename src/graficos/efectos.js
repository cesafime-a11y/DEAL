/* ── graficos/efectos.js ────────────────────────────────────
   Efectos visuales temporales que se agregan a la escena, viven
   un ratito, y se limpian solos. Por ahora solo la trazadora de
   bala, pero pensado para servir después a impactos, chispas,
   lo que haga falta — mismo patrón para todos.
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';

const _EJE_Y = new THREE.Vector3(0, 1, 0);
const _direccion = new THREE.Vector3();

export function crearEfectos(scene) {
  const activos = [];   // { mesh, vida, vidaMax }

  /* Una línea breve y brillante del punto A al punto B — el
     "trayecto" visual de un disparo que ya se resolvió al
     instante (el impacto real ya pasó; esto es solo la
     confirmación visual de por dónde fue).                    */
  function trazadoraBala(origen, destino) {
    _direccion.subVectors(destino, origen);
    const distancia = _direccion.length();
    if (distancia < 0.02) return;   // evita geometría de largo casi cero
    _direccion.normalize();

    const geo = new THREE.CylinderGeometry(0.006, 0.006, distancia, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xfff4c2, transparent: true, opacity: 0.85, depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);

    mesh.position.copy(origen).addScaledVector(_direccion, distancia / 2);
    mesh.quaternion.setFromUnitVectors(_EJE_Y, _direccion);

    scene.add(mesh);
    console.log('[DIAG] trazadora agregada a la escena, longitud:', distancia.toFixed(2), 'posición:', mesh.position.toArray().map(n => n.toFixed(2)));
    activos.push({ mesh, vida: 0.07, vidaMax: 0.07 });
  }

  function actualizar(dt) {
    for (let i = activos.length - 1; i >= 0; i--) {
      const efecto = activos[i];
      efecto.vida -= dt;
      if (efecto.vida <= 0) {
        scene.remove(efecto.mesh);
        efecto.mesh.geometry.dispose();
        efecto.mesh.material.dispose();
        activos.splice(i, 1);
      } else {
        efecto.mesh.material.opacity = (efecto.vida / efecto.vidaMax) * 0.85;
      }
    }
  }

  return { trazadoraBala, actualizar };
}
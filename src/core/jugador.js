/* ── core/jugador.js ───────────────────────────────────────
   Todo lo del jugador: bloqueo de mouse, movimiento con inercia
   (aceleración/fricción), salto con gravedad, y colisión simple
   contra lo que le pases en `colisionables`. No sabe nada de la
   escena ni del arma — solo mueve la cámara que le dan.
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Easing } from '../graficos/animacion.js';

export function crearJugador(camera, domElement, { colisionables, alturaOjos, animador }) {
  const controls = new PointerLockControls(camera, domElement);

  const teclas = { adelante: false, atras: false, izq: false, der: false };
  const VELOCIDAD_MAX = 5.5;   // m/s, tope al caminar
  const ACELERACION = 45;      // m/s², qué tan rápido llega al tope
  const FRICCION = 12;         // m/s², qué tan rápido frena sin teclas

  const GRAVEDAD = -22;        // m/s²
  const FUERZA_SALTO = 7.6;    // m/s de impulso vertical al saltar
  let velocidadY = 0;
  let enSuelo = true;
  let offsetAterrizaje = 0;   // 0 a 1, el módulo de animación lo anima al aterrizar

  document.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'KeyW': teclas.adelante = true; break;
      case 'KeyS': teclas.atras = true; break;
      case 'KeyA': teclas.izq = true; break;
      case 'KeyD': teclas.der = true; break;
      case 'Space':
        e.preventDefault();
        if (enSuelo && controls.isLocked) { velocidadY = FUERZA_SALTO; enSuelo = false; }
        break;
    }
  });
  document.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW': teclas.adelante = false; break;
      case 'KeyS': teclas.atras = false; break;
      case 'KeyA': teclas.izq = false; break;
      case 'KeyD': teclas.der = false; break;
    }
  });

  // direcciones de la cámara en espacio-mundo, mismas fórmulas que
  // usa PointerLockControls internamente
  const _right = new THREE.Vector3();
  const _forward = new THREE.Vector3();
  const velocidadPlano = new THREE.Vector3();   // x/z, espacio-mundo

  function resolverColisiones() {
    // en esta versión de Three.js, controls.object ES la cámara —
    // no existe controls.getObject() (API de versiones viejas)
    const pos = camera.position;
    for (const c of colisionables) {
      // blindaje: si alguna colisión llega mal formada (por ejemplo,
      // por una mezcla de versiones entre archivos), la ignoramos en
      // vez de tronar TODO el juego cada cuadro — antes esto dejaba
      // la pantalla congelada sin ningún aviso claro de qué pasaba
      if (!c || !c.mesh || !c.mesh.position) continue;
      const { mesh, radio } = c;
      const dx = pos.x - mesh.position.x;
      const dz = pos.z - mesh.position.z;
      const distXZ = Math.hypot(dx, dz);
      const minDist = radio + 0.4;   // 0.4 = radio aprox. del jugador
      if (distXZ < minDist && distXZ > 0.0001) {
        const empuje = (minDist - distXZ) / distXZ;
        pos.x += dx * empuje;
        pos.z += dz * empuje;
      }
    }
    // ya no hace falta un límite especial aquí — antes la cabina
    // era un círculo al aire libre con un borde invisible que no
    // dejaba salir bien; ahora es un cuarto de verdad con paredes
    // y puertas, igual que el taller, así que las paredes de arriba
    // ya contienen al jugador en todo el edificio.
  }

  /* Se llama cada cuadro. Devuelve qué tan rápido va caminando
     (m/s horizontal) — lo usa el arma para el balanceo al andar.
     `apuntando` reduce el tope de velocidad — apuntar y correr
     no deberían ir juntos. `factorPeso` (1 = sin penalización)
     viene del inventario — cargar mucho también te hace más lento. */
  function actualizar(dt, apuntando, factorPeso) {
    if (!controls.isLocked) return { velocidad: 0 };

    _right.setFromMatrixColumn(camera.matrix, 0);
    _forward.crossVectors(camera.up, _right);

    const dirDeseada = new THREE.Vector3()
      .addScaledVector(_forward, Number(teclas.adelante) - Number(teclas.atras))
      .addScaledVector(_right, Number(teclas.der) - Number(teclas.izq));
    const hayInput = dirDeseada.lengthSq() > 0;
    if (hayInput) dirDeseada.normalize();

    const topeActual = (apuntando ? VELOCIDAD_MAX * 0.45 : VELOCIDAD_MAX) * (factorPeso ?? 1);

    if (hayInput) {
      velocidadPlano.addScaledVector(dirDeseada, ACELERACION * dt);
      if (velocidadPlano.length() > topeActual) velocidadPlano.setLength(topeActual);
    } else if (velocidadPlano.lengthSq() > 0) {
      const frenado = FRICCION * dt;
      if (velocidadPlano.length() <= frenado) velocidadPlano.set(0, 0, 0);
      else velocidadPlano.addScaledVector(velocidadPlano.clone().normalize(), -frenado);
    }
    camera.position.addScaledVector(velocidadPlano, dt);

    velocidadY += GRAVEDAD * dt;
    camera.position.y += velocidadY * dt;
    if (camera.position.y <= alturaOjos) {
      // rebote de aterrizaje: solo si de verdad venía cayendo (no
      // un roce mínimo), y solo la primera vez que toca el suelo
      // (antes enSuelo nunca bajaba a false al caer de una repisa,
      // solo al saltar — así que una caída sin salto no se detectaba)
      if (!enSuelo && velocidadY < -3) {
        animador.animar(1, 0, 0.22, Easing.easeOutQuad, (v) => { offsetAterrizaje = v; });
      }
      camera.position.y = alturaOjos;
      velocidadY = 0;
      enSuelo = true;
    } else {
      enSuelo = false;
    }
    camera.position.y -= offsetAterrizaje * 0.12;   // el rebote visual se aplica encima, no reemplaza la base

    resolverColisiones();

    return { velocidad: velocidadPlano.length() };
  }

  return { controls, actualizar };
}

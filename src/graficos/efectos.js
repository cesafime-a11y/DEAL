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
  function trazadoraBala(origen, destino, colorHex) {
    _direccion.subVectors(destino, origen);
    const distancia = _direccion.length();
    if (distancia < 0.02) return;   // evita geometría de largo casi cero
    _direccion.normalize();

    const geo = new THREE.CylinderGeometry(0.006, 0.006, distancia, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex || 0xfff4c2, transparent: true, opacity: 0.85, depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);

    mesh.position.copy(origen).addScaledVector(_direccion, distancia / 2);
    mesh.quaternion.setFromUnitVectors(_EJE_Y, _direccion);

    scene.add(mesh);
    activos.push({ mesh, vida: 0.07, vidaMax: 0.07 });
  }

  /* ── casquillos ────────────────────────────────────────────
     Salen despedidos del arma con física simple (gravedad +
     rebote) y desaparecen tras unos segundos. No colisionan con
     nada del mundo — solo con un "suelo" a la altura de los pies,
     que es suficiente para venderlo sin costar rendimiento.     */
  const casquillos = [];
  const GRAVEDAD_CASQUILLO = -9.5;
  const GEO_CASQUILLO = new THREE.CylinderGeometry(0.004, 0.0045, 0.016, 6);
  const MAT_CASQUILLO = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.35, metalness: 0.85 });

  function eyectarCasquillo(posicion, direccionArma, alturaSuelo) {
    const mesh = new THREE.Mesh(GEO_CASQUILLO, MAT_CASQUILLO);
    mesh.position.copy(posicion);
    mesh.castShadow = true;
    scene.add(mesh);

    // sale hacia la derecha del arma y un poco hacia arriba/atrás
    const derecha = new THREE.Vector3().crossVectors(direccionArma, new THREE.Vector3(0, 1, 0)).normalize();
    const velocidad = derecha.multiplyScalar(1.6 + Math.random() * 0.8);
    velocidad.y = 1.5 + Math.random() * 0.7;
    velocidad.addScaledVector(direccionArma, -0.4);

    casquillos.push({
      mesh, velocidad,
      giro: new THREE.Vector3((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18),
      vida: 3.5, alturaSuelo, rebotes: 0,
    });
  }

  /* ── humo de cañón ─────────────────────────────────────────
     Una bocanada que crece y se desvanece — más notoria en armas
     con más retroceso, y casi nula con silenciador puesto.      */
  const humos = [];
  const MAX_HUMOS = 5;   // tope: disparar rápido apilaba bocanadas hasta tapar la vista
  const GEO_HUMO = new THREE.SphereGeometry(0.016, 8, 6);

  function humoCañon(posicion, intensidad = 1, direccion = null) {
    if (intensidad < 0.05) return;
    const mat = new THREE.MeshBasicMaterial({
      color: 0xb8b0a4, transparent: true, opacity: 0.16 * intensidad, depthWrite: false,
    });
    const mesh = new THREE.Mesh(GEO_HUMO, mat);
    mesh.position.copy(posicion);
    // se aleja de la cámara a lo largo del disparo — pegado a la
    // punta del cañón quedaba a medio metro de la cara y tapaba
    // buena parte de la pantalla al crecer
    if (direccion) mesh.position.addScaledVector(direccion, 0.28);
    scene.add(mesh);
    humos.push({
      mesh, vida: 0.45, vidaMax: 0.45,
      deriva: new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.3 + Math.random() * 0.15, (Math.random() - 0.5) * 0.2),
      opacidadInicial: 0.16 * intensidad,
    });

    while (humos.length > MAX_HUMOS) {
      const viejo = humos.shift();
      scene.remove(viejo.mesh);
      viejo.mesh.material.dispose();
    }
  }

  /* ── marcas de impacto ─────────────────────────────────────
     Se quedan pegadas donde pegó el disparo, y se desvanecen
     lento — antes el objeto solo parpadeaba un instante y no
     quedaba ningún rastro de dónde habías estado tirando.       */
  const marcas = [];
  const MAX_MARCAS = 40;   // tope duro: las viejas se borran solas
  const GEO_MARCA = new THREE.CircleGeometry(0.022, 8);

  function marcaImpacto(punto, normal) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x14100c, transparent: true, opacity: 0.75, depthWrite: false,
    });
    const mesh = new THREE.Mesh(GEO_MARCA, mat);
    mesh.position.copy(punto).addScaledVector(normal, 0.004);   // ligeramente separada, para no pelear con la superficie
    mesh.lookAt(punto.clone().add(normal));
    scene.add(mesh);
    marcas.push({ mesh, vida: 14, vidaMax: 14 });

    while (marcas.length > MAX_MARCAS) {
      const vieja = marcas.shift();
      scene.remove(vieja.mesh);
      vieja.mesh.material.dispose();
    }
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

    for (let i = casquillos.length - 1; i >= 0; i--) {
      const c = casquillos[i];
      c.vida -= dt;
      if (c.vida <= 0) {
        scene.remove(c.mesh);
        casquillos.splice(i, 1);   // geometría y material COMPARTIDOS, no se liberan
        continue;
      }
      c.velocidad.y += GRAVEDAD_CASQUILLO * dt;
      c.mesh.position.addScaledVector(c.velocidad, dt);
      c.mesh.rotation.x += c.giro.x * dt;
      c.mesh.rotation.y += c.giro.y * dt;
      c.mesh.rotation.z += c.giro.z * dt;

      if (c.mesh.position.y <= c.alturaSuelo && c.velocidad.y < 0) {
        c.mesh.position.y = c.alturaSuelo;
        if (c.rebotes < 2) {
          c.velocidad.y *= -0.35;       // rebota, perdiendo energía
          c.velocidad.x *= 0.6;
          c.velocidad.z *= 0.6;
          c.giro.multiplyScalar(0.5);
          c.rebotes++;
        } else {
          c.velocidad.set(0, 0, 0);     // ya se quedó quieto
          c.giro.set(0, 0, 0);
        }
      }
    }

    for (let i = humos.length - 1; i >= 0; i--) {
      const h = humos[i];
      h.vida -= dt;
      if (h.vida <= 0) {
        scene.remove(h.mesh);
        h.mesh.material.dispose();
        humos.splice(i, 1);
        continue;
      }
      const proporcion = h.vida / h.vidaMax;
      h.mesh.position.addScaledVector(h.deriva, dt);
      const escala = 1 + (1 - proporcion) * 1.4;
      h.mesh.scale.set(escala, escala, escala);
      h.mesh.material.opacity = h.opacidadInicial * proporcion;
    }

    for (let i = marcas.length - 1; i >= 0; i--) {
      const m = marcas[i];
      m.vida -= dt;
      if (m.vida <= 0) {
        scene.remove(m.mesh);
        m.mesh.material.dispose();
        marcas.splice(i, 1);
        continue;
      }
      // se mantiene sólida casi todo su tiempo, y se desvanece al final
      const proporcion = m.vida / m.vidaMax;
      m.mesh.material.opacity = proporcion < 0.3 ? 0.75 * (proporcion / 0.3) : 0.75;
    }
  }

  return { trazadoraBala, eyectarCasquillo, humoCañon, marcaImpacto, actualizar };
}

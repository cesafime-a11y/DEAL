import * as THREE from 'three';

/*
  Ragdoll procedural del jugador.

  Flujo:
    personaje animado -> snapshot de cada parte -> rigid bodies Rapier
    -> meshes visuales siguen a los rigid bodies.

  F8 en main.js lo activa como prueba. Cuando exista salud/muerte,
  basta con llamar ragdoll.activar(...) desde ese sistema.
*/

const CONEXIONES = [
  ['pelvis', 'pecho',        [0,  0.11, 0], [0, -0.215, 0]],
  ['pecho',  'cabeza',       [0,  0.215, 0], [0, -0.145, 0]],

  ['pecho', 'brazoSupIzq',  [-0.215,  0.11, 0], [ 0.075,  0.12, 0]],
  ['brazoSupIzq', 'brazoInfIzq', [0, -0.185, 0], [0, 0.17, 0]],

  ['pecho', 'brazoSupDer',  [ 0.215,  0.11, 0], [-0.075,  0.12, 0]],
  ['brazoSupDer', 'brazoInfDer', [0, -0.185, 0], [0, 0.17, 0]],

  ['pelvis', 'musloIzq',    [-0.115, -0.11, 0], [0, 0.235, 0]],
  ['musloIzq', 'piernaIzq', [0, -0.235, 0], [0, 0.20, 0]],
  ['piernaIzq', 'pieIzq',   [0, -0.20, 0], [0, 0.065, 0.09]],

  ['pelvis', 'musloDer',    [0.115, -0.11, 0], [0, 0.235, 0]],
  ['musloDer', 'piernaDer', [0, -0.235, 0], [0, 0.20, 0]],
  ['piernaDer', 'pieDer',   [0, -0.20, 0], [0, 0.065, 0.09]],
];

export function crearRagdoll({
  scene,
  fisica,
  personaje,
}) {
  const { RAPIER, world } = fisica;

  let activo = false;
  const cuerpos = new Map();
  const visuales = new Map();
  const joints = [];

  function vec3(v) {
    return { x: v[0], y: v[1], z: v[2] };
  }

  function limpiar() {
    // Remover joints primero.
    for (const joint of joints.splice(0)) {
      try {
        world.removeImpulseJoint(joint, true);
      } catch (_) {}
    }

    for (const body of cuerpos.values()) {
      try {
        world.removeRigidBody(body);
      } catch (_) {}
    }
    cuerpos.clear();

    for (const mesh of visuales.values()) {
      scene.remove(mesh);
      mesh.geometry?.dispose?.();

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose?.());
      } else {
        mesh.material?.dispose?.();
      }
    }
    visuales.clear();
  }

  function activar({
    impulso = new THREE.Vector3(0, 0.5, -1.5),
    puntoImpulso = 'pecho',
  } = {}) {
    if (activo) return;

    const partes = personaje.obtenerPartesRagdoll();

    personaje.mostrarAnimado(false);

    for (const parte of partes) {
      const { nombre, datos, meshOriginal, posicion, quaternion } = parte;

      const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(posicion.x, posicion.y, posicion.z)
        .setRotation({
          x: quaternion.x,
          y: quaternion.y,
          z: quaternion.z,
          w: quaternion.w,
        })
        .setLinearDamping(0.45)
        .setAngularDamping(0.9)
        .setCanSleep(true);

      const body = world.createRigidBody(bodyDesc);

      let colliderDesc;

      if (datos.forma === 'esfera') {
        colliderDesc = RAPIER.ColliderDesc.ball(datos.radio);
      } else {
        colliderDesc = RAPIER.ColliderDesc.cuboid(
          datos.tamano[0] / 2,
          datos.tamano[1] / 2,
          datos.tamano[2] / 2
        );
      }

      colliderDesc
        .setDensity(nombre === 'pelvis' || nombre === 'pecho' ? 3.0 : 1.6)
        .setFriction(0.75)
        .setRestitution(0.02);

      world.createCollider(colliderDesc, body);
      cuerpos.set(nombre, body);

      // Clon visual independiente para que el modelo animado pueda
      // ocultarse sin afectar el ragdoll.
      const visual = new THREE.Mesh(
        meshOriginal.geometry.clone(),
        meshOriginal.material.clone()
      );

      visual.name = `Ragdoll_${nombre}`;
      visual.position.copy(posicion);
      visual.quaternion.copy(quaternion);
      visual.castShadow = true;
      visual.receiveShadow = true;
      visual.frustumCulled = false;

      scene.add(visual);
      visuales.set(nombre, visual);
    }

    // Conectar el esqueleto.
    for (const [a, b, anchorA, anchorB] of CONEXIONES) {
      const bodyA = cuerpos.get(a);
      const bodyB = cuerpos.get(b);
      if (!bodyA || !bodyB) continue;

      const params = RAPIER.JointData.spherical(
        vec3(anchorA),
        vec3(anchorB)
      );

      const joint = world.createImpulseJoint(params, bodyA, bodyB, true);
      joints.push(joint);
    }

    const bodyImpulso = cuerpos.get(puntoImpulso) ?? cuerpos.get('pecho');

    if (bodyImpulso) {
      bodyImpulso.applyImpulse(
        { x: impulso.x, y: impulso.y, z: impulso.z },
        true
      );

      // Un poco de giro hace que la caída no se sienta completamente
      // mecánica cuando se prueba con F8.
      bodyImpulso.applyTorqueImpulse(
        {
          x: (Math.random() - 0.5) * 0.9,
          y: (Math.random() - 0.5) * 0.55,
          z: (Math.random() - 0.5) * 0.9,
        },
        true
      );
    }

    activo = true;
  }

  function desactivar() {
    if (!activo) return;
    limpiar();
    personaje.mostrarAnimado(true);
    activo = false;
  }

  function actualizar() {
    if (!activo) return;

    for (const [nombre, body] of cuerpos.entries()) {
      const visual = visuales.get(nombre);
      if (!visual) continue;

      const t = body.translation();
      const r = body.rotation();

      visual.position.set(t.x, t.y, t.z);
      visual.quaternion.set(r.x, r.y, r.z, r.w);
    }
  }

  function alternar(opciones = {}) {
    if (activo) desactivar();
    else activar(opciones);
  }

  return {
    activar,
    desactivar,
    alternar,
    actualizar,
    get activo() {
      return activo;
    },
  };
}


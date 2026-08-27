import RAPIER from '@dimforge/rapier3d-compat';

/*
  Mundo físico independiente del renderer de Three.js.

  Por ahora solamente se usa para ragdolls. Más adelante este mismo
  mundo puede recibir objetos físicos, casquillos, puertas, props,
  enemigos, etc.
*/
export async function crearMundoFisico() {
  await RAPIER.init();

  const gravedad = { x: 0, y: -9.81, z: 0 };
  const world = new RAPIER.World(gravedad);

  // Piso físico general. Coincide con y = 0 del mundo visual.
  const sueloBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.05, 20)
  );

  world.createCollider(
    RAPIER.ColliderDesc.cuboid(35, 0.05, 45)
      .setFriction(0.9)
      .setRestitution(0.05),
    sueloBody
  );

  function actualizar(dt) {
    // Rapier permite modificar timestep. Lo limitamos para evitar
    // explosiones físicas si la pestaña pierde foco.
    world.timestep = Math.min(Math.max(dt, 1 / 240), 1 / 30);
    world.step();
  }

  return {
    RAPIER,
    world,
    actualizar,
  };
}


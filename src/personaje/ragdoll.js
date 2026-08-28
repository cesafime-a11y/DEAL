import * as THREE from 'three';


const CONEXIONES = [

  [
    'pelvis',
    'abdomen',

    [0, 0.095, 0],

    [0, -0.115, 0],
  ],


  [
    'abdomen',
    'pecho',

    [0, 0.115, 0],

    [0, -0.145, 0],
  ],


  [
    'pecho',
    'cabeza',

    [0, 0.145, 0],

    [0, -0.140, 0],
  ],


  [
    'pecho',
    'brazoSupIzq',

    [-0.195, 0.080, 0],

    [0, 0.150, 0],
  ],


  [
    'brazoSupIzq',
    'brazoInfIzq',

    [0, -0.150, 0],

    [0, 0.145, 0],
  ],


  [
    'pecho',
    'brazoSupDer',

    [0.195, 0.080, 0],

    [0, 0.150, 0],
  ],


  [
    'brazoSupDer',
    'brazoInfDer',

    [0, -0.150, 0],

    [0, 0.145, 0],
  ],


  [
    'pelvis',
    'musloIzq',

    [-0.105, -0.085, 0],

    [0, 0.170, 0],
  ],


  [
    'musloIzq',
    'piernaIzq',

    [0, -0.170, 0],

    [0, 0.160, 0],
  ],


  [
    'piernaIzq',
    'pieIzq',

    [0, -0.160, 0],

    [0, 0.040, 0.075],
  ],


  [
    'pelvis',
    'musloDer',

    [0.105, -0.085, 0],

    [0, 0.170, 0],
  ],


  [
    'musloDer',
    'piernaDer',

    [0, -0.170, 0],

    [0, 0.160, 0],
  ],


  [
    'piernaDer',
    'pieDer',

    [0, -0.160, 0],

    [0, 0.040, 0.075],
  ],
];


export function crearRagdoll({
  scene,
  fisica,
  personaje,
}) {
  const {
    RAPIER,
    world,
  } =
    fisica;


  let activo =
    false;


  const cuerpos =
    new Map();


  const visuales =
    new Map();


  const joints =
    [];


  function vec3(v) {
    return {
      x:
        v[0],

      y:
        v[1],

      z:
        v[2],
    };
  }


  function materialClonado(
    material
  ) {
    if (
      Array.isArray(
        material
      )
    ) {
      return material.map(
        (m) =>
          m.clone()
      );
    }


    return material.clone();
  }


  function crearCollider(
    collider
  ) {
    if (
      collider.tipo ===
      'esfera'
    ) {
      return RAPIER
        .ColliderDesc
        .ball(
          collider.radio
        );
    }


    if (
      collider.tipo ===
      'capsula'
    ) {
      return RAPIER
        .ColliderDesc
        .capsule(
          collider.largo /
            2,

          collider.radio
        );
    }


    return RAPIER
      .ColliderDesc
      .cuboid(

        collider
          .tamano[0] /
          2,

        collider
          .tamano[1] /
          2,

        collider
          .tamano[2] /
          2
      );
  }


  function limpiar() {

    for (
      const joint
      of joints.splice(0)
    ) {
      try {
        world.removeImpulseJoint(
          joint,
          true
        );
      }
      catch (_) {}
    }


    for (
      const body
      of cuerpos.values()
    ) {
      try {
        world.removeRigidBody(
          body
        );
      }
      catch (_) {}
    }


    cuerpos.clear();


    for (
      const mesh
      of visuales.values()
    ) {

      scene.remove(
        mesh
      );


      mesh.geometry
        ?.dispose?.();


      if (
        Array.isArray(
          mesh.material
        )
      ) {
        mesh.material
          .forEach(
            (m) =>
              m.dispose?.()
          );
      }
      else {
        mesh.material
          ?.dispose?.();
      }
    }


    visuales.clear();
  }


  function activar({
    impulso =
      new THREE.Vector3(
        0,
        0.5,
        -1.5
      ),

    puntoImpulso =
      'pecho',
  } = {}) {

    if (
      activo
    ) {
      return;
    }


    const partes =
      personaje
        .obtenerPartesRagdoll();


    personaje
      .mostrarAnimado(
        false
      );


    for (
      const parte
      of partes
    ) {

      const {
        nombre,
        datos,
        meshOriginal,
        posicion,
        quaternion,
      } =
        parte;


      const bodyDesc =
        RAPIER
          .RigidBodyDesc
          .dynamic()

          .setTranslation(
            posicion.x,
            posicion.y,
            posicion.z
          )

          .setRotation({
            x:
              quaternion.x,

            y:
              quaternion.y,

            z:
              quaternion.z,

            w:
              quaternion.w,
          })

          .setLinearDamping(
            0.48
          )

          .setAngularDamping(
            0.92
          )

          .setCanSleep(
            true
          );


      const body =
        world.createRigidBody(
          bodyDesc
        );


      const colliderDesc =
        crearCollider(
          datos.collider
        );


      const torso =

        nombre ===
          'pelvis'

        ||

        nombre ===
          'abdomen'

        ||

        nombre ===
          'pecho';


      colliderDesc
        .setDensity(
          torso
            ? 3.2
            : 1.55
        )

        .setFriction(
          0.78
        )

        .setRestitution(
          0.015
        );


      world.createCollider(
        colliderDesc,
        body
      );


      cuerpos.set(
        nombre,
        body
      );


      const visual =
        new THREE.Mesh(

          meshOriginal
            .geometry
            .clone(),

          materialClonado(
            meshOriginal
              .material
          )
        );


      visual.name =
        `Ragdoll_${nombre}`;


      visual.position.copy(
        posicion
      );


      visual.quaternion.copy(
        quaternion
      );


      const worldScale =
        new THREE.Vector3();


      meshOriginal
        .getWorldScale(
          worldScale
        );


      visual.scale.copy(
        worldScale
      );


      visual.visible =
        true;


      visual.castShadow =
        true;


      visual.receiveShadow =
        true;


      visual.frustumCulled =
        false;


      scene.add(
        visual
      );


      visuales.set(
        nombre,
        visual
      );
    }


    for (
      const [

        a,

        b,

        anchorA,

        anchorB,

      ]
      of CONEXIONES
    ) {

      const bodyA =
        cuerpos.get(
          a
        );


      const bodyB =
        cuerpos.get(
          b
        );


      if (
        !bodyA ||
        !bodyB
      ) {
        continue;
      }


      const params =
        RAPIER
          .JointData
          .spherical(
            vec3(
              anchorA
            ),

            vec3(
              anchorB
            )
          );


      const joint =
        world.createImpulseJoint(
          params,
          bodyA,
          bodyB,
          true
        );


      joints.push(
        joint
      );
    }


    const bodyImpulso =

      cuerpos.get(
        puntoImpulso
      )

      ??

      cuerpos.get(
        'pecho'
      );


    if (
      bodyImpulso
    ) {

      bodyImpulso
        .applyImpulse(
          {
            x:
              impulso.x,

            y:
              impulso.y,

            z:
              impulso.z,
          },

          true
        );


      bodyImpulso
        .applyTorqueImpulse(
          {
            x:
              (
                Math.random() -
                0.5
              ) *
              0.80,

            y:
              (
                Math.random() -
                0.5
              ) *
              0.48,

            z:
              (
                Math.random() -
                0.5
              ) *
              0.80,
          },

          true
        );
    }


    activo =
      true;
  }


  function desactivar() {

    if (
      !activo
    ) {
      return;
    }


    limpiar();


    personaje
      .mostrarAnimado(
        true
      );


    activo =
      false;
  }


  function actualizar() {

    if (
      !activo
    ) {
      return;
    }


    for (
      const [
        nombre,
        body,
      ]
      of cuerpos.entries()
    ) {

      const visual =
        visuales.get(
          nombre
        );


      if (
        !visual
      ) {
        continue;
      }


      const t =
        body.translation();


      const r =
        body.rotation();


      visual.position.set(
        t.x,
        t.y,
        t.z
      );


      visual.quaternion.set(
        r.x,
        r.y,
        r.z,
        r.w
      );
    }
  }


  function alternar(
    opciones = {}
  ) {

    if (
      activo
    ) {
      desactivar();
    }
    else {
      activar(
        opciones
      );
    }
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

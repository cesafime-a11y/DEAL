/* ── personaje/brazosFPS.js ─────────────────────────────────
   BRAZOS FPS V2

   Se montan DENTRO del grupo exterior del arma.

   Resultado:
   - ADS mueve arma + brazos
   - recoil mueve arma + brazos
   - recarga mueve arma + brazos
   - inspección mueve arma + brazos
   - el torso del cuerpo mundial jamás puede taparlos

   No intentamos simular un esqueleto IK completo todavía.
   Esta pasada crea una pose procedural limpia y ajustable por
   familia de arma.
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';

const COLOR_PIEL = 0xb98764;
const COLOR_MANGA = 0x2b3037;
const COLOR_GUANTE = 0x171a1f;

const MAT_PIEL = new THREE.MeshStandardMaterial({
  color: COLOR_PIEL,
  roughness: 0.72,
  metalness: 0.0,
});

const MAT_MANGA = new THREE.MeshStandardMaterial({
  color: COLOR_MANGA,
  roughness: 0.9,
  metalness: 0.0,
});

const MAT_GUANTE = new THREE.MeshStandardMaterial({
  color: COLOR_GUANTE,
  roughness: 0.92,
  metalness: 0.0,
});

const PRESETS = {
  pistola: {
    manoDer: [0.055, -0.095, 0.075],
    codoDer: [0.19, -0.27, 0.33],
    hombroDer: [0.29, -0.39, 0.59],

    manoIzq: [-0.045, -0.10, 0.035],
    codoIzq: [-0.17, -0.25, 0.30],
    hombroIzq: [-0.26, -0.39, 0.57],
  },

  revolver: {
    manoDer: [0.055, -0.095, 0.075],
    codoDer: [0.19, -0.28, 0.34],
    hombroDer: [0.29, -0.40, 0.60],

    manoIzq: [-0.045, -0.09, 0.005],
    codoIzq: [-0.18, -0.24, 0.29],
    hombroIzq: [-0.27, -0.39, 0.58],
  },

  corta: {
    manoDer: [0.055, -0.10, 0.08],
    codoDer: [0.19, -0.28, 0.35],
    hombroDer: [0.30, -0.40, 0.61],

    manoIzq: [-0.045, -0.075, -0.075],
    codoIzq: [-0.18, -0.22, 0.22],
    hombroIzq: [-0.28, -0.38, 0.57],
  },

  larga: {
    manoDer: [0.055, -0.105, 0.085],
    codoDer: [0.19, -0.29, 0.36],
    hombroDer: [0.30, -0.41, 0.62],

    manoIzq: [-0.045, -0.065, -0.20],
    codoIzq: [-0.18, -0.21, 0.15],
    hombroIzq: [-0.29, -0.38, 0.56],
  },
};

const MAPA_FAMILIAS = {
  pistola: 'pistola',
  revolver: 'revolver',
  subfusil: 'corta',
  smg: 'corta',
  pdw: 'corta',
  rifle: 'larga',
  escopeta: 'larga',
  sniper: 'larga',
  francotirador: 'larga',
  ametralladora: 'larga',
  lmg: 'larga',
};

function v3(array) {
  return new THREE.Vector3(...array);
}

function crearSegmento({
  radio = 0.055,
  material = MAT_MANGA,
  nombre = 'segmento',
} = {}) {
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(
      radio,
      0.25,
      5,
      10
    ),
    material
  );

  mesh.name = nombre;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  return mesh;
}

function orientarSegmento(mesh, inicio, fin, radio) {
  const centro = inicio.clone().add(fin).multiplyScalar(0.5);
  const direccion = fin.clone().sub(inicio);
  const longitud = direccion.length();

  mesh.position.copy(centro);

  // CapsuleGeometry está orientada en Y.
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direccion.clone().normalize()
  );

  // La geometría original tiene longitud central 0.25.
  // Ajustamos Y para conservar los radios/caps.
  const longitudCentral = Math.max(0.05, longitud - radio * 2);
  mesh.scale.set(1, longitudCentral / 0.25, 1);
}

function crearMano(nombre) {
  const grupo = new THREE.Group();
  grupo.name = nombre;

  const palma = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.095, 0.055),
    MAT_GUANTE
  );
  palma.rotation.x = -0.20;
  palma.castShadow = true;
  grupo.add(palma);

  // nudillos para que no parezca un bloque totalmente liso
  for (let i = 0; i < 4; i++) {
    const nudillo = new THREE.Mesh(
      new THREE.SphereGeometry(0.013, 8, 6),
      MAT_GUANTE
    );
    nudillo.position.set(
      -0.027 + i * 0.018,
      0.042,
      -0.018
    );
    grupo.add(nudillo);
  }

  return grupo;
}

export function crearBrazosFPS(grupoArma, seleccionInicial) {
  const rig = new THREE.Group();
  rig.name = 'BrazosFPS_V2';

  // Se dibuja como parte del mismo conjunto del arma.
  grupoArma.add(rig);

  const brazoSupDer = crearSegmento({
    radio: 0.068,
    material: MAT_MANGA,
    nombre: 'FPS_brazoSupDer',
  });

  const antebrazoDer = crearSegmento({
    radio: 0.057,
    material: MAT_PIEL,
    nombre: 'FPS_antebrazoDer',
  });

  const brazoSupIzq = crearSegmento({
    radio: 0.068,
    material: MAT_MANGA,
    nombre: 'FPS_brazoSupIzq',
  });

  const antebrazoIzq = crearSegmento({
    radio: 0.057,
    material: MAT_PIEL,
    nombre: 'FPS_antebrazoIzq',
  });

  const manoDer = crearMano('FPS_manoDerecha');
  const manoIzq = crearMano('FPS_manoIzquierda');

  rig.add(
    brazoSupDer,
    antebrazoDer,
    brazoSupIzq,
    antebrazoIzq,
    manoDer,
    manoIzq
  );

  let seleccion = seleccionInicial;
  let preset = PRESETS.pistola;

  function resolverPreset(sel) {
    const cuerpo = sel?.cuerpo ?? 'pistola';
    const clave = MAPA_FAMILIAS[cuerpo] ?? 'larga';
    return PRESETS[clave] ?? PRESETS.larga;
  }

  function aplicarPose() {
    preset = resolverPreset(seleccion);

    const manoD = v3(preset.manoDer);
    const codoD = v3(preset.codoDer);
    const hombroD = v3(preset.hombroDer);

    const manoI = v3(preset.manoIzq);
    const codoI = v3(preset.codoIzq);
    const hombroI = v3(preset.hombroIzq);

    orientarSegmento(
      brazoSupDer,
      hombroD,
      codoD,
      0.068
    );

    orientarSegmento(
      antebrazoDer,
      codoD,
      manoD,
      0.057
    );

    orientarSegmento(
      brazoSupIzq,
      hombroI,
      codoI,
      0.068
    );

    orientarSegmento(
      antebrazoIzq,
      codoI,
      manoI,
      0.057
    );

    manoDer.position.copy(manoD);
    manoIzq.position.copy(manoI);

    // Mano dominante envuelve la empuñadura.
    manoDer.rotation.set(-0.15, -0.02, -0.06);

    // Mano de apoyo rota un poco según arma larga/corta.
    const esLarga =
      resolverPreset(seleccion) === PRESETS.larga;

    manoIzq.rotation.set(
      esLarga ? -0.18 : -0.10,
      0.05,
      esLarga ? 0.12 : 0.08
    );
  }

  function actualizarSeleccion(nuevaSeleccion) {
    seleccion = nuevaSeleccion;
    aplicarPose();
    rig.visible = Boolean(nuevaSeleccion);
  }

  function actualizar({
    visible = true,
  } = {}) {
    rig.visible = visible && Boolean(seleccion);
  }

  function destruir() {
    grupoArma.remove(rig);

    rig.traverse((obj) => {
      obj.geometry?.dispose?.();

      // Materiales son compartidos, no los destruimos aquí.
    });
  }

  aplicarPose();

  return {
    grupo: rig,
    actualizar,
    actualizarSeleccion,
    destruir,
  };
}


import * as THREE from 'three';


const EJE_Y =
  new THREE.Vector3(
    0,
    1,
    0
  );


const TMP_DIR =
  new THREE.Vector3();


const TMP_NORMAL =
  new THREE.Vector3();



function texturaRadial({

  centro =
    '#ffffff',

  borde =
    'rgba(255,255,255,0)',

  tamaño =
    128,

} = {}) {

  const canvas =
    document.createElement(
      'canvas'
    );


  canvas.width =
    tamaño;


  canvas.height =
    tamaño;


  const ctx =
    canvas.getContext(
      '2d'
    );


  const g =
    ctx.createRadialGradient(

      tamaño / 2,

      tamaño / 2,

      0,

      tamaño / 2,

      tamaño / 2,

      tamaño / 2
    );


  g.addColorStop(
    0,
    centro
  );


  g.addColorStop(
    0.18,
    centro
  );


  g.addColorStop(
    1,
    borde
  );


  ctx.fillStyle =
    g;


  ctx.fillRect(

    0,

    0,

    tamaño,

    tamaño
  );


  const tex =
    new THREE.CanvasTexture(
      canvas
    );


  tex.colorSpace =
    THREE.SRGBColorSpace;


  return tex;
}



export function crearEfectos(
  scene
) {

  const temporales = [];

  const casquillos = [];

  const humos = [];

  const marcas = [];

  const chispas = [];

  const polvos = [];


  /* ───────────────────
     TEXTURAS
  ─────────────────── */

  const TEX_GLOW =
    texturaRadial({

      centro:
        'rgba(255,245,205,1)',

      borde:
        'rgba(255,130,20,0)',
    });


  const TEX_HUMO =
    texturaRadial({

      centro:
        'rgba(190,190,185,0.85)',

      borde:
        'rgba(80,80,80,0)',
    });


  const TEX_POLVO =
    texturaRadial({

      centro:
        'rgba(150,135,115,0.65)',

      borde:
        'rgba(90,80,65,0)',
    });


  /* ───────────────────
     GEOMETRÍAS
  ─────────────────── */

  const GEO_CASQUILLO =
    new THREE.CylinderGeometry(

      0.004,

      0.0045,

      0.016,

      8
    );


  const GEO_CARTUCHO =
    new THREE.CylinderGeometry(

      0.006,

      0.006,

      0.028,

      10
    );


  const GEO_CHISPA =
    new THREE.BoxGeometry(

      0.0035,

      0.0035,

      0.028
    );


  const GEO_MARCA =
    new THREE.CircleGeometry(

      0.022,

      12
    );


  /* ───────────────────
     MATERIALES
  ─────────────────── */

  const MAT_CASQUILLO =
    new THREE.MeshStandardMaterial({

      color:
        0xc9a227,

      roughness:
        0.28,

      metalness:
        0.90,
    });


  const MAT_CARTUCHO =
    new THREE.MeshStandardMaterial({

      color:
        0xb32121,

      roughness:
        0.50,

      metalness:
        0.12,
    });


  const MAT_CHISPA =
    new THREE.MeshBasicMaterial({

      color:
        0xffb347,

      transparent:
        true,

      opacity:
        1,

      blending:
        THREE.AdditiveBlending,

      depthWrite:
        false,
    });



  function destruirObjeto(

    obj,

    liberarGeo =
      true,

    liberarMat =
      true
  ) {

    scene.remove(
      obj
    );


    if (
      liberarGeo
    ) {

      obj.geometry
        ?.dispose?.();
    }


    if (
      liberarMat
    ) {

      obj.material
        ?.dispose?.();
    }
  }



  /* ═══════════════════
     TRAZADORA
  ═══════════════════ */

  function trazadoraBala(

    origen,

    destino,

    colorHex =
      0xfff0b0
  ) {

    TMP_DIR
      .subVectors(

        destino,

        origen
      );


    const distancia =
      TMP_DIR.length();


    if (
      distancia <
      0.05
    ) {
      return;
    }


    TMP_DIR.normalize();


    /*
      Antes era una línea
      desde cañón hasta blanco.

      Ahora es una estela
      corta.
    */

    const largo =
      THREE.MathUtils.clamp(

        distancia *
        0.22,

        0.35,

        2.2
      );


    const inicio =
      Math.min(

        0.35,

        distancia *
        0.08
      );


    const grupo =
      new THREE.Group();


    grupo.position
      .copy(origen)
      .addScaledVector(

        TMP_DIR,

        inicio +
        largo * 0.5
      );


    grupo.quaternion
      .setFromUnitVectors(

        EJE_Y,

        TMP_DIR
      );


    /* NÚCLEO */

    const core =
      new THREE.Mesh(

        new THREE.CylinderGeometry(

          0.003,

          0.003,

          largo,

          6
        ),

        new THREE.MeshBasicMaterial({

          color:
            colorHex,

          transparent:
            true,

          opacity:
            0.95,

          blending:
            THREE.AdditiveBlending,

          depthWrite:
            false,
        })
      );


    /* GLOW */

    const glow =
      new THREE.Mesh(

        new THREE.CylinderGeometry(

          0.009,

          0.009,

          largo,

          6
        ),

        new THREE.MeshBasicMaterial({

          color:
            colorHex,

          transparent:
            true,

          opacity:
            0.18,

          blending:
            THREE.AdditiveBlending,

          depthWrite:
            false,
        })
      );


    grupo.add(

      core,

      glow
    );


    scene.add(
      grupo
    );


    temporales.push({

      objeto:
        grupo,

      vida:
        0.055,

      vidaMax:
        0.055,

      tipo:
        'trazadora',

      materiales: [

        core.material,

        glow.material,
      ],

      geometrias: [

        core.geometry,

        glow.geometry,
      ],
    });
  }



  /* ═══════════════════
     MUZZLE FLASH
  ═══════════════════ */

  function destelloBoca(

    posicion,

    direccion,

    intensidad =
      1
  ) {

    if (
      intensidad <=
      0.03
    ) {
      return;
    }


    const material =
      new THREE.SpriteMaterial({

        map:
          TEX_GLOW,

        color:
          0xffc06a,

        transparent:
          true,

        opacity:
          Math.min(

            1,

            0.95 *
            intensidad
          ),

        blending:
          THREE.AdditiveBlending,

        depthWrite:
          false,
      });


    const sprite =
      new THREE.Sprite(
        material
      );


    sprite.position
      .copy(
        posicion
      );


    sprite.position
      .addScaledVector(

        direccion,

        0.025
      );


    const escala =
      0.13 *
      intensidad;


    sprite.scale.set(

      escala,

      escala,

      escala
    );


    scene.add(
      sprite
    );


    temporales.push({

      objeto:
        sprite,

      vida:
        0.045,

      vidaMax:
        0.045,

      tipo:
        'flash',

      materiales: [
        material
      ],

      geometrias: [],
    });
  }



  /* ═══════════════════
     CASQUILLOS
  ═══════════════════ */

  function eyectarCasquillo(

    posicion,

    direccionArma,

    alturaSuelo,

    escala =
      1,

    esEscopeta =
      false
  ) {

    const mesh =
      new THREE.Mesh(

        esEscopeta
          ? GEO_CARTUCHO
          : GEO_CASQUILLO,

        esEscopeta
          ? MAT_CARTUCHO
          : MAT_CASQUILLO
      );


    mesh.scale.setScalar(
      escala
    );


    mesh.position.copy(
      posicion
    );


    mesh.castShadow =
      true;


    mesh.receiveShadow =
      true;


    scene.add(
      mesh
    );


    const derecha =
      new THREE.Vector3()

        .crossVectors(

          direccionArma,

          EJE_Y
        )

        .normalize();


    const velocidad =
      derecha.multiplyScalar(

        1.55 +

        Math.random() *
        0.85
      );


    velocidad.y =

      1.45 +

      Math.random() *
      0.75;


    velocidad
      .addScaledVector(

        direccionArma,

        -0.35 -

        Math.random() *
        0.2
      );


    casquillos.push({

      mesh,

      velocidad,

      giro:
        new THREE.Vector3(

          (
            Math.random() -
            0.5
          ) * 20,

          (
            Math.random() -
            0.5
          ) * 20,

          (
            Math.random() -
            0.5
          ) * 20
        ),

      vida:
        4,

      alturaSuelo,

      rebotes:
        0,
    });
  }



  /* ═══════════════════
     HUMO
  ═══════════════════ */

  function humoCañon(

    posicion,

    intensidad =
      1,

    direccion =
      null
  ) {

    if (
      intensidad <
      0.05
    ) {
      return;
    }


    const material =
      new THREE.SpriteMaterial({

        map:
          TEX_HUMO,

        color:
          0xb9b5ad,

        transparent:
          true,

        opacity:
          0.20 *
          intensidad,

        depthWrite:
          false,
      });


    const sprite =
      new THREE.Sprite(
        material
      );


    sprite.position.copy(
      posicion
    );


    if (
      direccion
    ) {

      sprite.position
        .addScaledVector(

          direccion,

          0.18
        );
    }


    sprite.scale.setScalar(

      0.07 +

      0.03 *
      intensidad
    );


    scene.add(
      sprite
    );


    humos.push({

      sprite,

      material,

      vida:
        0.62,

      vidaMax:
        0.62,

      opacidadInicial:
        0.20 *
        intensidad,

      deriva:
        new THREE.Vector3(

          (
            Math.random() -
            0.5
          ) * 0.12,

          0.20 +
          Math.random() *
          0.12,

          (
            Math.random() -
            0.5
          ) * 0.12
        ),
    });


    while (
      humos.length >
      7
    ) {

      const viejo =
        humos.shift();


      destruirObjeto(

        viejo.sprite,

        false,

        true
      );
    }
  }



  /* ═══════════════════
     POLVO
  ═══════════════════ */

  function crearPolvoImpacto(

    punto,

    normal
  ) {

    const material =
      new THREE.SpriteMaterial({

        map:
          TEX_POLVO,

        color:
          0xb0a28f,

        transparent:
          true,

        opacity:
          0.28,

        depthWrite:
          false,
      });


    const sprite =
      new THREE.Sprite(
        material
      );


    sprite.position
      .copy(
        punto
      )
      .addScaledVector(

        normal,

        0.018
      );


    sprite.scale
      .setScalar(
        0.045
      );


    scene.add(sprite);


    polvos.push({

      sprite,

      material,

      velocidad:

        normal
          .clone()
          .multiplyScalar(
            0.10
          )
          .add(

            new THREE.Vector3(

              0,

              0.08,

              0
            )
          ),

      vida:
        0.32,

      vidaMax:
        0.32,
    });


    while (
      polvos.length >
      15
    ) {

      const viejo =
        polvos.shift();


      destruirObjeto(

        viejo.sprite,

        false,

        true
      );
    }
  }



  /* ═══════════════════
     CHISPAS
  ═══════════════════ */

  function crearChispas(

    punto,

    normal
  ) {

    const cantidad =

      3 +

      Math.floor(

        Math.random() *
        4
      );


    for (
      let i = 0;
      i < cantidad;
      i++
    ) {

      if (
        chispas.length >=
        32
      ) {
        break;
      }


      const mesh =
        new THREE.Mesh(

          GEO_CHISPA,

          MAT_CHISPA
            .clone()
        );


      mesh.position
        .copy(
          punto
        )
        .addScaledVector(

          normal,

          0.012
        );


      scene.add(
        mesh
      );


      const lateral =
        new THREE.Vector3(

          (
            Math.random() -
            0.5
          ) * 0.8,

          Math.random() *
          0.5,

          (
            Math.random() -
            0.5
          ) * 0.8
        );


      const velocidad =
        normal
          .clone()
          .multiplyScalar(

            0.5 +

            Math.random() *
            0.7
          )

          .add(
            lateral
          );


      chispas.push({

        mesh,

        velocidad,

        vida:

          0.13 +

          Math.random() *
          0.10,

        vidaMax:
          0.23,
      });
    }
  }



  /* ═══════════════════
     MARCA DE IMPACTO
  ═══════════════════ */

  function marcaImpacto(

    punto,

    normal
  ) {

    const mat =
      new THREE.MeshBasicMaterial({

        color:
          0x17120e,

        transparent:
          true,

        opacity:
          0.78,

        depthWrite:
          false,

        polygonOffset:
          true,

        polygonOffsetFactor:
          -1,

        polygonOffsetUnits:
          -1,
      });


    const mesh =
      new THREE.Mesh(

        GEO_MARCA,

        mat
      );


    mesh.position
      .copy(
        punto
      )
      .addScaledVector(

        normal,

        0.004
      );


    mesh.lookAt(

      punto
        .clone()
        .add(
          normal
        )
    );


    mesh.rotateZ(

      Math.random() *
      Math.PI *
      2
    );


    const escala =

      0.8 +

      Math.random() *
      0.45;


    mesh.scale.setScalar(
      escala
    );


    scene.add(
      mesh
    );


    marcas.push({

      mesh,

      vida:
        18,

      vidaMax:
        18,
    });


    crearPolvoImpacto(

      punto,

      normal
    );


    crearChispas(

      punto,

      normal
    );


    while (
      marcas.length >
      55
    ) {

      const vieja =
        marcas.shift();


      destruirObjeto(

        vieja.mesh,

        false,

        true
      );
    }
  }



  /* ═══════════════════
     UPDATE
  ═══════════════════ */

  function actualizar(dt) {

    /* FLASH + TRACERS */

    for (

      let i =
        temporales.length - 1;

      i >= 0;

      i--
    ) {

      const e =
        temporales[i];


      e.vida -=
        dt;


      const p =
        Math.max(

          0,

          e.vida /
          e.vidaMax
        );


      e.materiales
        .forEach(
          (m, idx) => {

            m.opacity =

              e.tipo ===
              'trazadora'

                ? (
                    idx === 0
                      ? 0.95
                      : 0.18
                  )
                  *
                  p

                : 0.95 *
                  p;
          }
        );


      if (
        e.vida <=
        0
      ) {

        scene.remove(
          e.objeto
        );


        e.geometrias
          .forEach(
            (g) =>
              g.dispose()
          );


        e.materiales
          .forEach(
            (m) =>
              m.dispose()
          );


        temporales.splice(
          i,
          1
        );
      }
    }


    /* CASQUILLOS */

    for (

      let i =
        casquillos.length - 1;

      i >= 0;

      i--
    ) {

      const c =
        casquillos[i];


      c.vida -=
        dt;


      if (
        c.vida <=
        0
      ) {

        scene.remove(
          c.mesh
        );


        casquillos.splice(
          i,
          1
        );


        continue;
      }


      c.velocidad.y +=
        -9.5 *
        dt;


      c.mesh.position
        .addScaledVector(

          c.velocidad,

          dt
        );


      c.mesh.rotation.x +=
        c.giro.x *
        dt;


      c.mesh.rotation.y +=
        c.giro.y *
        dt;


      c.mesh.rotation.z +=
        c.giro.z *
        dt;


      if (

        c.mesh.position.y <=
        c.alturaSuelo

        &&

        c.velocidad.y <
        0
      ) {

        c.mesh.position.y =
          c.alturaSuelo;


        if (
          c.rebotes <
          2
        ) {

          c.velocidad.y *=
            -0.32;


          c.velocidad.x *=
            0.62;


          c.velocidad.z *=
            0.62;


          c.giro
            .multiplyScalar(
              0.55
            );


          c.rebotes++;
        }
        else {

          c.velocidad.set(

            0,

            0,

            0
          );


          c.giro.set(

            0,

            0,

            0
          );
        }
      }
    }


    /* HUMO */

    for (

      let i =
        humos.length - 1;

      i >= 0;

      i--
    ) {

      const h =
        humos[i];


      h.vida -=
        dt;


      if (
        h.vida <=
        0
      ) {

        destruirObjeto(

          h.sprite,

          false,

          true
        );


        humos.splice(
          i,
          1
        );


        continue;
      }


      const p =

        h.vida /
        h.vidaMax;


      h.sprite.position
        .addScaledVector(

          h.deriva,

          dt
        );


      const s =

        0.08 +

        (
          1 -
          p
        )
        *
        0.26;


      h.sprite.scale
        .setScalar(
          s
        );


      h.material.opacity =

        h.opacidadInicial *

        p *

        p;
    }


    /* POLVO */

    for (

      let i =
        polvos.length - 1;

      i >= 0;

      i--
    ) {

      const d =
        polvos[i];


      d.vida -=
        dt;


      if (
        d.vida <=
        0
      ) {

        destruirObjeto(

          d.sprite,

          false,

          true
        );


        polvos.splice(
          i,
          1
        );


        continue;
      }


      const p =

        d.vida /
        d.vidaMax;


      d.sprite.position
        .addScaledVector(

          d.velocidad,

          dt
        );


      d.sprite.scale
        .setScalar(

          0.045 +

          (
            1 -
            p
          )
          *
          0.10
        );


      d.material.opacity =
        0.28 *
        p;
    }


    /* CHISPAS */

    for (

      let i =
        chispas.length - 1;

      i >= 0;

      i--
    ) {

      const s =
        chispas[i];


      s.vida -=
        dt;


      if (
        s.vida <=
        0
      ) {

        scene.remove(
          s.mesh
        );


        s.mesh.material
          .dispose();


        chispas.splice(
          i,
          1
        );


        continue;
      }


      s.velocidad.y -=
        5.2 *
        dt;


      s.mesh.position
        .addScaledVector(

          s.velocidad,

          dt
        );


      s.mesh.material.opacity =
        THREE.MathUtils.clamp(

          s.vida /
          s.vidaMax,

          0,

          1
        );


      TMP_NORMAL
        .copy(
          s.velocidad
        );


      if (
        TMP_NORMAL.lengthSq()
        >
        1e-6
      ) {

        TMP_NORMAL
          .normalize();


        s.mesh.quaternion
          .setFromUnitVectors(

            EJE_Y,

            TMP_NORMAL
          );
      }
    }


    /* DECALS */

    for (

      let i =
        marcas.length - 1;

      i >= 0;

      i--
    ) {

      const m =
        marcas[i];


      m.vida -=
        dt;


      if (
        m.vida <=
        0
      ) {

        destruirObjeto(

          m.mesh,

          false,

          true
        );


        marcas.splice(
          i,
          1
        );


        continue;
      }


      const p =

        m.vida /
        m.vidaMax;


      m.mesh.material.opacity =

        p < 0.2

          ? 0.78 *
            (
              p /
              0.2
            )

          : 0.78;
    }
  }


  return {

    trazadoraBala,

    destelloBoca,

    eyectarCasquillo,

    humoCañon,

    marcaImpacto,

    actualizar,
  };
}

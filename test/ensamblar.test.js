import { describe, it, expect } from 'vitest';
import { ensamblarArma } from '../src/armas/ensamblar.js';
import { CUERPOS, CAÑONES, CARGADORES, MIRAS, BOCAS, EMPUÑADURAS, GATILLOS, MUNICIONES, ACABADOS } from '../src/armas/piezas.js';

describe('ensamblarArma — combinaciones normales', () => {
  it('pistola + cañón estándar + cargador medio + sin mira', () => {
    const r = ensamblarArma({
      cuerpo: CUERPOS.pistola, cañon: CAÑONES.estandar,
      cargador: CARGADORES.medio, mira: MIRAS.ninguna,
    });
    expect(r.cadencia).toBe(4);
    expect(r.precision).toBeCloseTo(0.85);
    expect(r.daño).toBe(22);
    expect(r.alcance).toBe(38);
    expect(r.capacidad).toBe(14);
    expect(r.tiempoRecarga).toBe(1.4);
    expect(r.retroceso).toBe(0.55);
    expect(r.zoomApuntado).toBe(1);
    expect(r.nombre).toBe('Cuerpo de pistola · Cañón estándar');
  });

  it('subfusil + cañón corto + cargador pequeño + sin mira', () => {
    const r = ensamblarArma({
      cuerpo: CUERPOS.subfusil, cañon: CAÑONES.corto,
      cargador: CARGADORES.pequeño, mira: MIRAS.ninguna,
    });
    expect(r.cadencia).toBeCloseTo(9.5);   // 9 + 0.5 del cañón corto
    expect(r.precision).toBeCloseTo(0.57); // 0.65 - 0.08
    expect(r.daño).toBe(16);
    expect(r.capacidad).toBe(7);
  });

  it('el cañón largo resta cadencia pero suma precisión y alcance', () => {
    const r = ensamblarArma({
      cuerpo: CUERPOS.rifle, cañon: CAÑONES.largo,
      cargador: CARGADORES.grande, mira: MIRAS.hierro,
    });
    expect(r.cadencia).toBeCloseTo(4.7);   // 5.5 - 0.8
    expect(r.alcance).toBe(55);
    expect(r.precision).toBeCloseTo(0.91); // 0.78 + 0.1 + 0.03
  });
});

describe('ensamblarArma — límites', () => {
  it('la precisión nunca pasa de 1, aunque las piezas sumen más', () => {
    const r = ensamblarArma({
      cuerpo: CUERPOS.rifle, cañon: CAÑONES.largo,
      cargador: CARGADORES.grande, mira: MIRAS.telescopica,
    });
    // 0.78 + 0.1 + 0.14 = 1.02 sin el límite
    expect(r.precision).toBe(1);
  });

  it('la precisión nunca baja de 0, aunque las piezas resten mucho', () => {
    const r = ensamblarArma({
      cuerpo: { nombre: 'Prueba', cadencia: 4, precision: 0.1, retroceso: 0.5 },
      cañon: { nombre: 'Prueba', daño: 10, alcance: 10, modPrecision: -0.5, modCadencia: 0 },
      cargador: CARGADORES.medio,
      mira: { nombre: 'Prueba', modPrecision: -0.5, zoom: 1 },
    });
    expect(r.precision).toBe(0);
  });

  it('la cadencia nunca baja de 0.5, aunque el cañón la reste mucho', () => {
    const r = ensamblarArma({
      cuerpo: { nombre: 'Prueba', cadencia: 1, precision: 0.5, retroceso: 0.5 },
      cañon: { nombre: 'Prueba', daño: 10, alcance: 10, modPrecision: 0, modCadencia: -5 },
      cargador: CARGADORES.medio,
      mira: MIRAS.ninguna,
    });
    expect(r.cadencia).toBe(0.5);
  });
});

describe('ensamblarArma — boca de cañón', () => {
  it('sin boca de cañón (parámetro omitido) se comporta como antes', () => {
    const r = ensamblarArma({
      cuerpo: CUERPOS.pistola, cañon: CAÑONES.estandar,
      cargador: CARGADORES.medio, mira: MIRAS.ninguna,
    });
    expect(r.retroceso).toBe(0.55);
    expect(r.daño).toBe(22);
    expect(r.alcance).toBe(38);
  });

  it('el compensador reduce el retroceso sin costar nada más', () => {
    const r = ensamblarArma({
      cuerpo: CUERPOS.pistola, cañon: CAÑONES.estandar,
      cargador: CARGADORES.medio, mira: MIRAS.ninguna, boca: BOCAS.compensador,
    });
    expect(r.retroceso).toBeCloseTo(0.33);   // 0.55 - 0.22
    expect(r.daño).toBe(22);      // sin cambio
    expect(r.alcance).toBe(38);   // sin cambio
  });

  it('el silenciador reduce el retroceso PERO también daño y alcance — es un compromiso real', () => {
    const r = ensamblarArma({
      cuerpo: CUERPOS.pistola, cañon: CAÑONES.estandar,
      cargador: CARGADORES.medio, mira: MIRAS.ninguna, boca: BOCAS.silenciador,
    });
    expect(r.retroceso).toBeCloseTo(0.43);   // 0.55 - 0.12
    expect(r.daño).toBe(19);      // 22 - 3
    expect(r.alcance).toBe(33);   // 38 - 5
  });

  it('el retroceso nunca baja de 0.15, aunque la boca reste mucho', () => {
    const r = ensamblarArma({
      cuerpo: { nombre: 'Prueba', cadencia: 4, precision: 0.5, retroceso: 0.2 },
      cañon: CAÑONES.estandar, cargador: CARGADORES.medio, mira: MIRAS.ninguna,
      boca: { nombre: 'Prueba', modRetroceso: -5, modDaño: 0, modAlcance: 0 },
    });
    expect(r.retroceso).toBe(0.15);
  });

  it('el daño nunca baja de 5 ni el alcance de 10, aunque la boca reste mucho', () => {
    const r = ensamblarArma({
      cuerpo: CUERPOS.pistola,
      cañon: { nombre: 'Prueba', daño: 10, alcance: 12, modPrecision: 0, modCadencia: 0 },
      cargador: CARGADORES.medio, mira: MIRAS.ninguna,
      boca: { nombre: 'Prueba', modRetroceso: 0, modDaño: -50, modAlcance: -50 },
    });
    expect(r.daño).toBe(5);
    expect(r.alcance).toBe(10);
  });
});

describe('ensamblarArma — categorías nuevas (opcionales)', () => {
  it('sin ninguna de las 4 categorías nuevas, se comporta exactamente como antes', () => {
    const r = ensamblarArma({
      cuerpo: CUERPOS.pistola, cañon: CAÑONES.estandar,
      cargador: CARGADORES.medio, mira: MIRAS.ninguna,
    });
    expect(r.cadencia).toBe(4);
    expect(r.retroceso).toBe(0.55);
    expect(r.velocidadApuntado).toBe(1);
    expect(r.reduccionDispersionCadera).toBe(0);
  });

  it('la empuñadura angulada suma cadencia y resta algo de retroceso', () => {
    const r = ensamblarArma({
      cuerpo: CUERPOS.pistola, cañon: CAÑONES.estandar,
      cargador: CARGADORES.medio, mira: MIRAS.ninguna, empuñadura: EMPUÑADURAS.angulada,
    });
    expect(r.cadencia).toBeCloseTo(4.4);
    expect(r.retroceso).toBeCloseTo(0.52);
  });

  it('el bípode hace más lenta la velocidad de apuntado, a cambio de mucho control', () => {
    const r = ensamblarArma({
      cuerpo: CUERPOS.pistola, cañon: CAÑONES.estandar,
      cargador: CARGADORES.medio, mira: MIRAS.ninguna, empuñadura: EMPUÑADURAS.bipode,
    });
    expect(r.velocidadApuntado).toBe(0.65);
    expect(r.retroceso).toBeCloseTo(0.39);   // 0.55 - 0.16
    expect(r.precision).toBeCloseTo(0.89);   // 0.85 + 0.04
  });

  it('el gatillo de competición suma cadencia sin tocar nada más', () => {
    const r = ensamblarArma({
      cuerpo: CUERPOS.pistola, cañon: CAÑONES.estandar,
      cargador: CARGADORES.medio, mira: MIRAS.ninguna, gatillo: GATILLOS.competicion,
    });
    expect(r.cadencia).toBeCloseTo(4.6);
  });

  it('la munición expansiva suma daño pero resta alcance', () => {
    const r = ensamblarArma({
      cuerpo: CUERPOS.pistola, cañon: CAÑONES.estandar,
      cargador: CARGADORES.medio, mira: MIRAS.ninguna, municion: MUNICIONES.expansiva,
    });
    expect(r.daño).toBe(27);      // 22 + 5
    expect(r.alcance).toBe(32);   // 38 - 6
  });

  it('la munición trazadora casi no cambia estadísticas, pero sí trae un color propio', () => {
    const r = ensamblarArma({
      cuerpo: CUERPOS.pistola, cañon: CAÑONES.estandar,
      cargador: CARGADORES.medio, mira: MIRAS.ninguna, municion: MUNICIONES.trazadora,
    });
    expect(r.daño).toBe(22);
    expect(r.colorTrazadora).toBe(0xff3b3b);
  });

  it('el acabado artesanal resta precisión — es la única que cuesta algo', () => {
    const r = ensamblarArma({
      cuerpo: CUERPOS.pistola, cañon: CAÑONES.estandar,
      cargador: CARGADORES.medio, mira: MIRAS.ninguna, acabado: ACABADOS.artesanal,
    });
    expect(r.precision).toBeCloseTo(0.82);   // 0.85 - 0.03
  });

  it('los acabados que no son artesanal no tocan ninguna estadística', () => {
    for (const clave of ['fabrica', 'tactico', 'pulido']) {
      const r = ensamblarArma({
        cuerpo: CUERPOS.pistola, cañon: CAÑONES.estandar,
        cargador: CARGADORES.medio, mira: MIRAS.ninguna, acabado: ACABADOS[clave],
      });
      expect(r.precision).toBeCloseTo(0.85);
    }
  });

  it('la mira láser reduce la dispersión sin apuntar — ninguna otra mira lo hace', () => {
    const conLaser = ensamblarArma({
      cuerpo: CUERPOS.pistola, cañon: CAÑONES.estandar,
      cargador: CARGADORES.medio, mira: MIRAS.laser,
    });
    expect(conLaser.reduccionDispersionCadera).toBe(0.55);

    for (const clave of ['ninguna', 'hierro', 'reflex', 'holografica', 'telescopica']) {
      const r = ensamblarArma({
        cuerpo: CUERPOS.pistola, cañon: CAÑONES.estandar,
        cargador: CARGADORES.medio, mira: MIRAS[clave],
      });
      expect(r.reduccionDispersionCadera).toBe(0);
    }
  });

  it('la escopeta trae su mecánica de perdigones — ningún otro cuerpo la trae', () => {
    const escopeta = ensamblarArma({
      cuerpo: CUERPOS.escopeta, cañon: CAÑONES.estandar,
      cargador: CARGADORES.medio, mira: MIRAS.ninguna,
    });
    expect(escopeta.perdigones).toBe(8);
    expect(escopeta.factorDañoPerdigon).toBe(0.35);
    expect(escopeta.factorDispersion).toBe(3.2);

    const pistola = ensamblarArma({
      cuerpo: CUERPOS.pistola, cañon: CAÑONES.estandar,
      cargador: CARGADORES.medio, mira: MIRAS.ninguna,
    });
    expect(pistola.perdigones).toBeUndefined();
  });
});

describe('catálogo de piezas', () => {
  it('el conteo de las 4 categorías nuevas es el acordado', () => {
    // +1: cortaCombate (empuñadura corta de combate)
    expect(Object.keys(EMPUÑADURAS)).toHaveLength(6);
    expect(Object.keys(GATILLOS)).toHaveLength(3);
    expect(Object.keys(MUNICIONES)).toHaveLength(4);
    // +2: digital y cromado
    expect(Object.keys(ACABADOS)).toHaveLength(8);
  });

  it('el conteo de las categorías existentes creció como se acordó', () => {
    // +1: pdw
    expect(Object.keys(CUERPOS)).toHaveLength(9);
    // +1: ultraligero
    expect(Object.keys(CAÑONES)).toHaveLength(5);
    expect(Object.keys(CARGADORES)).toHaveLength(4);
    expect(Object.keys(MIRAS)).toHaveLength(7);
    // +1: supresorIntegral
    expect(Object.keys(BOCAS)).toHaveLength(7);
  });

  it('todas las bocas de cañón tienen los campos que ensamblar() necesita', () => {
    for (const clave of Object.keys(BOCAS)) {
      const b = BOCAS[clave];
      expect(typeof b.nombre).toBe('string');
      expect(typeof b.modRetroceso).toBe('number');
      expect(typeof b.modDaño).toBe('number');
      expect(typeof b.modAlcance).toBe('number');
    }
  });

  it('todos los cuerpos tienen los campos que ensamblar() necesita', () => {
    for (const clave of Object.keys(CUERPOS)) {
      const c = CUERPOS[clave];
      expect(typeof c.nombre).toBe('string');
      expect(typeof c.cadencia).toBe('number');
      expect(typeof c.precision).toBe('number');
      expect(typeof c.retroceso).toBe('number');
    }
  });

  it('todos los cañones tienen los campos que ensamblar() necesita', () => {
    for (const clave of Object.keys(CAÑONES)) {
      const c = CAÑONES[clave];
      expect(typeof c.daño).toBe('number');
      expect(typeof c.alcance).toBe('number');
      expect(typeof c.modPrecision).toBe('number');
      expect(typeof c.modCadencia).toBe('number');
    }
  });

  it('todos los cargadores tienen capacidad y tiempo de recarga positivos', () => {
    for (const clave of Object.keys(CARGADORES)) {
      const c = CARGADORES[clave];
      expect(c.capacidad).toBeGreaterThan(0);
      expect(c.tiempoRecarga).toBeGreaterThan(0);
    }
  });

  it('todas las miras tienen zoom de al menos 1 (nunca alejan la vista)', () => {
    for (const clave of Object.keys(MIRAS)) {
      expect(MIRAS[clave].zoom).toBeGreaterThanOrEqual(1);
    }
  });
});

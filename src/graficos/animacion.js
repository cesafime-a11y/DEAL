/* ── graficos/animacion.js ─────────────────────────────────
   Sistema de animación reutilizable: funciones de suavizado
   (easing) y un "animador" que lleva cualquier valor de un
   número a otro de forma suave en el tiempo. No sabe nada de
   armas, jugador, ni nada del juego — solo mueve números.

   Un módulo pide una animación con animar(...), y en su propio
   actualizar(dt) usa el valor que le vaya llegando para mover
   lo que necesite (posición, rotación, lo que sea).
──────────────────────────────────────────────────────────── */

export const Easing = {
  linear: (t) => t,
  easeOutQuad: (t) => 1 - (1 - t) * (1 - t),
  easeInQuad: (t) => t * t,
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2),
  // "rebota" un poco más allá del valor final antes de asentarse —
  // sirve para que algo se sienta con peso, no robótico
  easeOutBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  },
};

export function crearAnimador() {
  const activos = [];

  /* Anima un valor de `desde` a `hasta` en `duracion` segundos.
     `onActualizar(valor)` se llama cada cuadro con el valor
     actual; `onCompleto()` (opcional) al terminar — útil para
     encadenar una animación después de otra (bajar, luego subir). */
  function animar(desde, hasta, duracion, easing, onActualizar, onCompleto) {
    const tween = { t: 0, desde, hasta, duracion: Math.max(duracion, 0.0001), easing: easing || Easing.linear, onActualizar, onCompleto };
    activos.push(tween);
    return tween;   // por si hace falta cancelarla después
  }

  function cancelar(tween) {
    const i = activos.indexOf(tween);
    if (i >= 0) activos.splice(i, 1);
  }

  function actualizar(dt) {
    for (let i = activos.length - 1; i >= 0; i--) {
      const tw = activos[i];
      tw.t += dt / tw.duracion;
      const progreso = tw.easing(Math.min(tw.t, 1));
      tw.onActualizar(tw.desde + (tw.hasta - tw.desde) * progreso);
      if (tw.t >= 1) {
        activos.splice(i, 1);
        if (tw.onCompleto) tw.onCompleto();
      }
    }
  }

  /* ── resortes ────────────────────────────────────────────
     Un tween va de A a B en un tiempo fijo. Un RESORTE persigue un
     objetivo que puede cambiar en cualquier momento, y llega con
     inercia — rebasa un poco y regresa. Es la diferencia entre una
     animación que se siente mecánica y una que se siente física:
     sirve para el bamboleo del arma, el retroceso de la cámara, y
     cualquier cosa que deba "asentarse" en vez de solo llegar.   */
  const resortes = [];

  function crearResorte({ valor = 0, rigidez = 120, amortiguacion = 14, onActualizar } = {}) {
    const resorte = {
      valor, velocidad: 0, objetivo: valor,
      rigidez, amortiguacion, onActualizar, activo: true,
    };
    resortes.push(resorte);
    return {
      /* Mueve el objetivo — el valor lo perseguirá con inercia. */
      irA(nuevoObjetivo) { resorte.objetivo = nuevoObjetivo; },
      /* Da un golpe instantáneo de velocidad, sin mover el
         objetivo — es lo que produce un rebote al disparar o al
         aterrizar de un salto.                                   */
      impulsar(fuerza) { resorte.velocidad += fuerza; },
      /* Salta al valor sin animar — para reinicios. */
      fijar(v) { resorte.valor = v; resorte.objetivo = v; resorte.velocidad = 0; },
      get valor() { return resorte.valor; },
      liberar() {
        resorte.activo = false;
        const i = resortes.indexOf(resorte);
        if (i >= 0) resortes.splice(i, 1);
      },
    };
  }

  function actualizarResortes(dt) {
    // paso fijo: un resorte integrado con dt variable se vuelve
    // inestable si el cuadro se alarga (pestaña en segundo plano,
    // tirón de rendimiento). Se subdivide para que siempre se
    // comporte igual, sin importar los cuadros por segundo.
    const PASO_MAX = 1 / 120;
    let restante = Math.min(dt, 0.1);
    while (restante > 0) {
      const paso = Math.min(PASO_MAX, restante);
      restante -= paso;
      for (const r of resortes) {
        const desplazamiento = r.objetivo - r.valor;
        const aceleracion = desplazamiento * r.rigidez - r.velocidad * r.amortiguacion;
        r.velocidad += aceleracion * paso;
        r.valor += r.velocidad * paso;
      }
    }
    for (const r of resortes) if (r.onActualizar) r.onActualizar(r.valor);
  }

  /* Encadena varias animaciones una tras otra — útil para secuencias
     como una recarga (bajar arma, sacar cargador, meter otro, subir)
     sin tener que anidar callbacks a mano.                         */
  function secuencia(pasos) {
    let indice = 0;
    function siguiente() {
      if (indice >= pasos.length) return;
      const p = pasos[indice++];
      animar(
        p.desde, p.hasta, p.duracion, p.easing, p.onActualizar,
        () => { if (p.onCompleto) p.onCompleto(); siguiente(); }
      );
    }
    siguiente();
  }

  function actualizarTodo(dt) {
    actualizar(dt);
    actualizarResortes(dt);
  }

  return { animar, cancelar, actualizar: actualizarTodo, crearResorte, secuencia };
}

/* ── curvas de suavizado extra ───────────────────────────────
   Las que ya había cubren lo básico. Estas agregan carácter: un
   rebote al final, un retroceso antes de arrancar, un asentamiento
   elástico. Son lo que separa una interfaz que "aparece" de una
   que se siente viva.                                            */
Object.assign(Easing, {
  /* Se pasa de largo y regresa — bueno para algo que se acomoda. */
  atras(t) {
    const s = 1.70158;
    return t * t * ((s + 1) * t - s);
  },
  atrasSalida(t) {
    const s = 1.70158;
    const u = t - 1;
    return u * u * ((s + 1) * u + s) + 1;
  },
  /* Rebota al llegar, como algo que cae sobre una superficie. */
  reboteSalida(t) {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) { t -= 1.5 / d; return n * t * t + 0.75; }
    if (t < 2.5 / d) { t -= 2.25 / d; return n * t * t + 0.9375; }
    t -= 2.625 / d;
    return n * t * t + 0.984375;
  },
  /* Oscila al final antes de asentarse — más suave que el rebote. */
  elasticaSalida(t) {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  },
  /* Arranca lentísimo y acelera de golpe — para cosas que "cargan". */
  expoEntrada(t) {
    return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
  },
  expoSalida(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  },
});

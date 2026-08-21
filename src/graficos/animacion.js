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

  return { animar, cancelar, actualizar };
}
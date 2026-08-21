/* ── ui/hud.js ──────────────────────────────────────────────
   El HUD del juego: munición del arma activa, nombre del arma,
   la barra de 8 espacios del inventario, y el peso actual. Se
   actualiza cada cuadro desde main.js — no guarda ningún estado
   propio, solo pinta lo que le pasan.
──────────────────────────────────────────────────────────── */

export function crearHud() {
  const elMunicion = document.getElementById('hudMunicion');
  const elArmaNombre = document.getElementById('hudArmaNombre');
  const elInventario = document.getElementById('hudInventario');
  const elPeso = document.getElementById('hudPeso');

  // las 8 casillas se crean una sola vez, no en cada cuadro
  const casillas = [];
  for (let i = 0; i < 8; i++) {
    const casilla = document.createElement('div');
    casilla.className = 'espacio-inv';
    casilla.textContent = String(i + 1);
    elInventario.appendChild(casilla);
    casillas.push(casilla);
  }

  function actualizar(estadoArma, inventario) {
    if (estadoArma.sinArma) {
      elMunicion.innerHTML = '<span class="cap">manos vacías</span>';
      elArmaNombre.textContent = '';
    } else if (estadoArma.recargando) {
      elMunicion.innerHTML = `${estadoArma.balas}<span class="cap"> / ${estadoArma.capacidad}</span>`;
      elArmaNombre.textContent = 'recargando…';
    } else {
      elMunicion.innerHTML = `${estadoArma.balas}<span class="cap"> / ${estadoArma.capacidad}</span>`;
      elArmaNombre.textContent = estadoArma.nombre || '';
    }

    const info = inventario.espaciosInfo();
    for (let i = 0; i < 8; i++) {
      casillas[i].classList.toggle('ocupado', info[i].ocupado);
      casillas[i].classList.toggle('activo', info[i].activo);
    }

    const peso = inventario.pesoTotal();
    const max = inventario.PESO_MAXIMO;
    elPeso.textContent = `${peso.toFixed(1)} / ${max} kg`;
    elPeso.classList.toggle('saturado', peso / max > 0.8);
  }

  return { actualizar };
}

/* ── ui/bancoTrabajo.js ────────────────────────────────────
   La interfaz del banco de trabajo: eliges cuerpo, cañón,
   cargador, mira y boca de cañón con flechas, con las
   estadísticas resultantes en vivo. El arma en sí se ve tendida
   sobre la mesa de trabajo, en el mundo real del juego (ver
   entornos/exhibidorArma.js) — no en un panel flotante aparte.
   Al confirmar, avisa al que llamó (main.js) con las
   estadísticas Y la selección de piezas, para que el arma de
   verdad se reconstruya igual.
──────────────────────────────────────────────────────────── */
import { Euler } from 'three';
import { CUERPOS, CAÑONES, CARGADORES, MIRAS, BOCAS, EMPUÑADURAS, GATILLOS, MUNICIONES, ACABADOS, esPiezaCompatible } from '../armas/piezas.js';
import { ensamblarArma } from '../armas/ensamblar.js';
import { crearVista3D } from './vista3D.js';

/* La vista del banco es SIEMPRE la misma, sin importar desde
   dónde ni hacia dónde estabas parado al presionar E — mucho
   más simple y confiable que calcular un ángulo según tu
   posición (que fue el origen de varios bugs seguidos: gimbal
   lock, cámara mirando al pasillo o al cielo). Una vista cenital
   fija, encuadrada una sola vez con números reales (verificado
   que hasta el arma más larga posible cabe completa en cuadro),
   y se restaura tu posición/orientación real al cerrar.         */
const PITCH_VISTA_BANCO = -75 * Math.PI / 180;
const ALTURA_CAMARA_BANCO = 1.5;
const DESPLAZAMIENTO_Z_CAMARA_BANCO = 0.4;

const CATEGORIAS = [
  { clave: 'cuerpo', catalogo: CUERPOS, etiqueta: 'Cuerpo' },
  { clave: 'cañon', catalogo: CAÑONES, etiqueta: 'Cañón', porDefecto: 'estandar' },
  { clave: 'cargador', catalogo: CARGADORES, etiqueta: 'Cargador', porDefecto: 'medio' },
  { clave: 'mira', catalogo: MIRAS, etiqueta: 'Mira', porDefecto: 'ninguna' },
  { clave: 'boca', catalogo: BOCAS, etiqueta: 'Boca de cañón', porDefecto: 'ninguna' },
  { clave: 'empuñadura', catalogo: EMPUÑADURAS, etiqueta: 'Empuñadura inferior', porDefecto: 'ninguna' },
  { clave: 'gatillo', catalogo: GATILLOS, etiqueta: 'Gatillo', porDefecto: 'ninguno' },
  { clave: 'municion', catalogo: MUNICIONES, etiqueta: 'Munición', porDefecto: 'estandar' },
  { clave: 'acabado', catalogo: ACABADOS, etiqueta: 'Acabado', porDefecto: 'fabrica' },
];

export function crearBancoTrabajo({ posicionMesa, posicionExhibidor, radioInteraccion, controls, camera, exhibidor, onAplicar }) {
  const seleccion = {
    cuerpo: 'pistola', cañon: 'estandar', cargador: 'medio', mira: 'ninguna', boca: 'ninguna',
    empuñadura: 'ninguna', gatillo: 'ninguno', municion: 'estandar', acabado: 'fabrica',
  };

  const panel = document.getElementById('banco');
  // bloquea el mousedown en TODO el panel, no solo en los botones —
  // mousedown (no click) es el evento que de verdad dispara el
  // arma en main.js; sin esto, cualquier clic aquí adentro se
  // "filtraba" hacia el juego por debajo
  // bloquea mousedown (dispara el arma) Y click (re-bloquea el
  // mouse) en TODO el panel — antes solo mousedown estaba cubierto,
  // así que cualquier clic fuera de un botón (el título, el fondo,
  // las estadísticas) se filtraba y volvía a esconder el cursor
  panel.addEventListener('mousedown', (e) => e.stopPropagation());
  panel.addEventListener('click', (e) => e.stopPropagation());
  const contenido = document.getElementById('bancoContenido');
  const statsEl = document.getElementById('bancoStats');
  const aviso = document.getElementById('avisoMesa');
  let abierto = false;

  function piezasActuales() {
    return {
      cuerpo: CUERPOS[seleccion.cuerpo],
      cañon: CAÑONES[seleccion.cañon],
      cargador: CARGADORES[seleccion.cargador],
      mira: MIRAS[seleccion.mira],
      boca: BOCAS[seleccion.boca],
      empuñadura: EMPUÑADURAS[seleccion.empuñadura],
      gatillo: GATILLOS[seleccion.gatillo],
      municion: MUNICIONES[seleccion.municion],
      acabado: ACABADOS[seleccion.acabado],
    };
  }

  function renderizar() {
    contenido.innerHTML = '';
    for (const cat of CATEGORIAS) {
      const claves = Object.keys(cat.catalogo);
      const idxActual = claves.indexOf(seleccion[cat.clave]);

      const fila = document.createElement('div');
      fila.className = 'fila-pieza';

      const flechaIzq = document.createElement('button');
      flechaIzq.className = 'flecha';
      flechaIzq.textContent = '‹';
      flechaIzq.onclick = (e) => { e.stopPropagation(); cambiar(cat, idxActual, claves, -1); };

      const info = document.createElement('div');
      info.className = 'info-pieza';
      const etiqueta = document.createElement('span');
      etiqueta.className = 'etiqueta-pieza';
      etiqueta.textContent = cat.etiqueta;
      const nombre = document.createElement('span');
      nombre.className = 'nombre-pieza';
      nombre.textContent = cat.catalogo[seleccion[cat.clave]].nombre;
      info.append(etiqueta, nombre);

      const flechaDer = document.createElement('button');
      flechaDer.className = 'flecha';
      flechaDer.textContent = '›';
      flechaDer.onclick = (e) => { e.stopPropagation(); cambiar(cat, idxActual, claves, 1); };

      fila.append(flechaIzq, info, flechaDer);
      contenido.appendChild(fila);
    }

    // estadísticas en vivo — se recalculan con cada cambio
    const stats = ensamblarArma(piezasActuales());
    statsEl.innerHTML = `
      <div class="stat"><span>Daño</span><b>${stats.daño}</b></div>
      <div class="stat"><span>Cadencia</span><b>${stats.cadencia.toFixed(1)}/s</b></div>
      <div class="stat"><span>Alcance</span><b>${stats.alcance}m</b></div>
      <div class="stat"><span>Precisión</span><b>${Math.round(stats.precision * 100)}%</b></div>
      <div class="stat"><span>Cargador</span><b>${stats.capacidad}</b></div>
      <div class="stat"><span>Recarga</span><b>${stats.tiempoRecarga.toFixed(1)}s</b></div>
    `;

    // el arma tendida sobre la mesa, en el mundo real — misma
    // selección exacta, así se ve igual a lo que vas a llevarte
    exhibidor.mostrarArma({ ...seleccion });
    if (panelVista3D.style.display === 'flex') vista3D.mostrarArma({ ...seleccion });
  }

  function cambiar(cat, idxActual, claves, direccion) {
    if (cat.clave === 'cuerpo') {
      // cambiar el cuerpo puede volver incompatibles otras piezas
      // ya elegidas (un bípode no cabe en una pistola) — se
      // reajustan solas a su valor por defecto, nunca se quedan
      // con algo que ya no debería poder montarse
      const nuevoIdx = (idxActual + direccion + claves.length) % claves.length;
      seleccion.cuerpo = claves[nuevoIdx];
      reajustarIncompatibles();
      renderizar();
      return;
    }

    // para cualquier otra categoría, salta las opciones que no
    // sean compatibles con el cuerpo actual — nunca deja elegir
    // algo que no cabría de verdad en esa arma
    let idx = idxActual;
    for (let intentos = 0; intentos < claves.length; intentos++) {
      idx = (idx + direccion + claves.length) % claves.length;
      if (esPiezaCompatible(cat.clave, claves[idx], seleccion.cuerpo)) break;
    }
    seleccion[cat.clave] = claves[idx];
    renderizar();
  }

  function reajustarIncompatibles() {
    for (const cat of CATEGORIAS) {
      if (cat.clave === 'cuerpo') continue;
      if (!esPiezaCompatible(cat.clave, seleccion[cat.clave], seleccion.cuerpo)) {
        seleccion[cat.clave] = cat.porDefecto;
      }
    }
  }

  const crosshair = document.getElementById('crosshair');
  const vista3D = crearVista3D(document.getElementById('vista3DCanvas'));
  const panelVista3D = document.getElementById('vista3D');

  document.getElementById('btnVista3D').onclick = (e) => {
    e.stopPropagation();
    panelVista3D.style.display = 'flex';
    vista3D.activar(piezasActuales());
  };
  document.getElementById('btnCerrarVista3D').onclick = (e) => {
    e.stopPropagation();
    panelVista3D.style.display = 'none';
    vista3D.desactivar();
  };
  panelVista3D.addEventListener('mousedown', (e) => e.stopPropagation());
  panelVista3D.addEventListener('click', (e) => e.stopPropagation());
  let posicionGuardada = null;
  let quaternionGuardado = null;

  function abrir() {
    if (abierto) return;
    abierto = true;
    renderizar();
    panel.style.display = 'flex';
    controls.unlock();
    crosshair.style.display = 'none';

    // guarda dónde estabas parado y hacia dónde mirabas, para
    // devolverte exactamente ahí al cerrar
    if (camera && posicionExhibidor) {
      posicionGuardada = camera.position.clone();
      quaternionGuardado = camera.quaternion.clone();
      camera.position.set(
        posicionExhibidor.x,
        posicionExhibidor.y + ALTURA_CAMARA_BANCO,
        posicionExhibidor.z + DESPLAZAMIENTO_Z_CAMARA_BANCO
      );
      camera.quaternion.setFromEuler(new Euler(PITCH_VISTA_BANCO, 0, 0, 'YXZ'));
    }
  }

  function cerrar() {
    abierto = false;
    panel.style.display = 'none';
    crosshair.style.display = 'block';
    exhibidor.ocultar();
    panelVista3D.style.display = 'none';
    vista3D.desactivar();

    // te devuelve exactamente a donde estabas antes de abrir el banco
    if (camera && posicionGuardada) {
      camera.position.copy(posicionGuardada);
      camera.quaternion.copy(quaternionGuardado);
      posicionGuardada = null;
      quaternionGuardado = null;
    }
  }

  document.getElementById('btnCerrarBanco').onclick = (e) => { e.stopPropagation(); cerrar(); };
  document.getElementById('btnAplicarArma').onclick = (e) => {
    e.stopPropagation();
    onAplicar(ensamblarArma(piezasActuales()), { ...seleccion });
    cerrar();
  };

  /* Se llama cada cuadro desde main.js con la posición actual del
     jugador — muestra/oculta el aviso de "presiona E" según la
     distancia a la mesa.                                        */
  function actualizarProximidad(posicionJugador) {
    if (abierto) { aviso.style.display = 'none'; return; }
    const cerca = posicionJugador.distanceTo(posicionMesa) < radioInteraccion;
    aviso.style.display = cerca ? 'block' : 'none';
    return cerca;
  }

  /* Se llama cada cuadro desde main.js — anima y renderiza la
     vista 3D rotable, pero solo hace algo mientras está abierta
     (vista3D.actualizar() ya trae su propio chequeo interno).    */
  function actualizarVista3D() {
    vista3D.actualizar();
  }

  return { abrir, cerrar, actualizarProximidad, actualizarVista3D, get abierto() { return abierto; } };
}

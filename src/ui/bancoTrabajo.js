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
/* Con el rediseño de armería el arma va CENTRADA en pantalla, con
   las columnas de accesorios y estadísticas a los lados — así que
   la vista dejó de ser tan cenital (era casi desde arriba, para
   caber junto a un panel lateral) y ahora es un ángulo de 3/4 que
   lee mejor la silueta. Los valores salieron de proyectar el arma
   más larga posible y medir cuánto ocupa en pantalla: ~40% del
   ancho, que cabe cómodo entre las dos columnas.                 */
const PITCH_VISTA_BANCO = -25 * Math.PI / 180;
const ALTURA_CAMARA_BANCO = 0.4;
const DESPLAZAMIENTO_Z_CAMARA_BANCO = 0.9;

const CATEGORIAS = [
  { clave: 'cuerpo', catalogo: CUERPOS, etiqueta: 'Cuerpo', grupo: 'Plataforma' },
  { clave: 'cañon', catalogo: CAÑONES, etiqueta: 'Cañón', porDefecto: 'estandar', grupo: 'Plataforma' },
  { clave: 'cargador', catalogo: CARGADORES, etiqueta: 'Cargador', porDefecto: 'medio', grupo: 'Plataforma' },
  { clave: 'mira', catalogo: MIRAS, etiqueta: 'Mira', porDefecto: 'ninguna', grupo: 'Accesorios' },
  { clave: 'boca', catalogo: BOCAS, etiqueta: 'Boca de cañón', porDefecto: 'ninguna', grupo: 'Accesorios' },
  { clave: 'empuñadura', catalogo: EMPUÑADURAS, etiqueta: 'Empuñadura inferior', porDefecto: 'ninguna', grupo: 'Accesorios' },
  { clave: 'gatillo', catalogo: GATILLOS, etiqueta: 'Gatillo', porDefecto: 'ninguno', grupo: 'Ajuste fino' },
  { clave: 'municion', catalogo: MUNICIONES, etiqueta: 'Munición', porDefecto: 'estandar', grupo: 'Ajuste fino' },
  { clave: 'acabado', catalogo: ACABADOS, etiqueta: 'Acabado', porDefecto: 'fabrica', grupo: 'Ajuste fino' },
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
  const nombreArmaEl = document.getElementById('bancoNombreArma');
  const tipoArmaEl = document.getElementById('bancoTipoArma');
  const pesoRellenoEl = document.getElementById('bancoPesoRelleno');
  const pesoTextoEl = document.getElementById('bancoPesoTexto');

  /* Guarda las estadísticas ANTES del último cambio de pieza, para
     poder dibujar el "fantasma" en las barras y el delta de color:
     así ves de un vistazo si la pieza que acabas de montar te subió
     o te bajó cada número, en vez de tener que recordarlo.        */
  let statsPrevias = null;

  /* Rangos usados para dibujar las barras — no son límites duros
     del juego, solo la escala visual contra la que se compara cada
     estadística para que la barra signifique algo.                */
  const RANGOS_STATS = {
    daño: [8, 45], cadencia: [0.5, 15], alcance: [15, 65],
    precision: [0.45, 1], capacidad: [5, 45], tiempoRecarga: [0.8, 3.5],
  };

  function porcentajeStat(clave, valor) {
    const [min, max] = RANGOS_STATS[clave];
    return Math.max(0, Math.min(1, (valor - min) / (max - min))) * 100;
  }
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
    let grupoAnterior = null;
    for (const cat of CATEGORIAS) {
      if (cat.grupo !== grupoAnterior) {
        const encabezado = document.createElement('div');
        encabezado.className = 'encabezado-col' + (grupoAnterior === null ? '' : ' secundario');
        encabezado.textContent = cat.grupo;
        contenido.appendChild(encabezado);
        grupoAnterior = cat.grupo;
      }

      // solo las piezas que de verdad caben en este cuerpo — así el
      // contador ("2 / 5") refleja opciones REALES, no el catálogo
      // completo con opciones que nunca vas a poder montar
      const clavesCompatibles = Object.keys(cat.catalogo)
        .filter((k) => esPiezaCompatible(cat.clave, k, seleccion.cuerpo));
      const idxEnCompatibles = clavesCompatibles.indexOf(seleccion[cat.clave]);
      const claves = Object.keys(cat.catalogo);
      const idxActual = claves.indexOf(seleccion[cat.clave]);

      const pieza = cat.catalogo[seleccion[cat.clave]];
      const esVacio = /^(Sin |Ning)/i.test(pieza.nombre);

      const ranura = document.createElement('div');
      ranura.className = 'ranura' + (esVacio ? '' : ' ocupada');

      const flechaIzq = document.createElement('button');
      flechaIzq.className = 'flecha';
      flechaIzq.textContent = '‹';
      flechaIzq.onclick = (e) => { e.stopPropagation(); cambiar(cat, idxActual, claves, -1); };

      const datos = document.createElement('div');
      datos.className = 'datos';
      const cat_ = document.createElement('span');
      cat_.className = 'cat';
      cat_.textContent = cat.etiqueta;
      const val = document.createElement('span');
      val.className = 'val' + (esVacio ? ' vacio' : '');
      val.textContent = esVacio ? 'vacío' : pieza.nombre;
      const contador = document.createElement('span');
      contador.className = 'contador';
      contador.textContent = `${idxEnCompatibles + 1} / ${clavesCompatibles.length}`;
      datos.append(cat_, val, contador);

      const flechaDer = document.createElement('button');
      flechaDer.className = 'flecha';
      flechaDer.textContent = '›';
      flechaDer.onclick = (e) => { e.stopPropagation(); cambiar(cat, idxActual, claves, 1); };

      ranura.append(flechaIzq, datos, flechaDer);
      contenido.appendChild(ranura);
    }

    // estadísticas en vivo — se recalculan con cada cambio
    const stats = ensamblarArma(piezasActuales());

    // encabezado: nombre y tipo del arma que estás armando
    nombreArmaEl.textContent = CUERPOS[seleccion.cuerpo].nombre.replace(/^Cuerpo de /, '').toUpperCase();
    tipoArmaEl.textContent = `${CAÑONES[seleccion.cañon].nombre} · ${ACABADOS[seleccion.acabado].nombre}`;

    // peso del arma armada (solo esta, no el inventario completo)
    const pesoArma = CATEGORIAS.reduce(
      (t, c) => t + (c.catalogo[seleccion[c.clave]].peso || 0), 0
    );
    const PESO_REFERENCIA = 8;   // kg, para la escala de la barra
    const proporcionPeso = Math.min(1, pesoArma / PESO_REFERENCIA);
    pesoRellenoEl.style.width = `${proporcionPeso * 100}%`;
    pesoRellenoEl.classList.toggle('pesado', proporcionPeso > 0.72);
    pesoTextoEl.textContent = `${pesoArma.toFixed(1)} kg`;

    // barras de estadística, con "fantasma" del valor anterior para
    // ver si el último cambio de pieza subió o bajó cada número
    const definiciones = [
      ['daño', 'Daño', stats.daño, (v) => String(v), false],
      ['cadencia', 'Cadencia', stats.cadencia, (v) => v.toFixed(1) + '/s', false],
      ['alcance', 'Alcance', stats.alcance, (v) => v + 'm', false],
      ['precision', 'Precisión', stats.precision, (v) => Math.round(v * 100) + '%', false],
      ['capacidad', 'Cargador', stats.capacidad, (v) => String(v), false],
      // en la recarga, MENOS es mejor — se invierte para que la barra
      // llena siga significando "mejor" en las seis
      ['tiempoRecarga', 'Recarga', stats.tiempoRecarga, (v) => v.toFixed(1) + 's', true],
    ];

    let html = '<div class="encabezado-col">Estadísticas</div>';
    for (const [clave, etiqueta, valor, formato, invertida] of definiciones) {
      let pct = porcentajeStat(clave, valor);
      if (invertida) pct = 100 - pct;

      let fantasmaHtml = '', deltaHtml = '';
      if (statsPrevias && statsPrevias[clave] !== valor) {
        let pctPrevio = porcentajeStat(clave, statsPrevias[clave]);
        if (invertida) pctPrevio = 100 - pctPrevio;
        fantasmaHtml = `<div class="fantasma" style="width:${pctPrevio}%"></div>`;
        const mejoro = pct > pctPrevio;
        const dif = valor - statsPrevias[clave];
        const signo = dif > 0 ? '+' : '';
        deltaHtml = `<span class="delta ${mejoro ? 'sube' : 'baja'}">${signo}${
          Number.isInteger(dif) ? dif : dif.toFixed(1)
        }</span>`;
      }

      html += `
        <div class="stat-barra">
          <div class="fila">
            <span class="nombre">${etiqueta}</span>
            <span><span class="valor">${formato(valor)}</span>${deltaHtml}</span>
          </div>
          <div class="pista"><div class="lleno" style="width:${pct}%"></div>${fantasmaHtml}</div>
        </div>`;
    }
    statsEl.innerHTML = html;

    // el arma tendida sobre la mesa, en el mundo real — misma
    // selección exacta, así se ve igual a lo que vas a llevarte
    exhibidor.mostrarArma({ ...seleccion });
    if (panelVista3D.style.display === 'flex') vista3D.mostrarArma({ ...seleccion });
  }

  function cambiar(cat, idxActual, claves, direccion) {
    // guarda cómo estaban las estadísticas ANTES de este cambio —
    // es lo que alimenta el "fantasma" y el delta de color en las
    // barras, para ver de un vistazo qué mejoró y qué empeoró
    statsPrevias = ensamblarArma(piezasActuales());

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

  const vista3D = crearVista3D(document.getElementById('vista3DCanvas'));
  const panelVista3D = document.getElementById('vista3D');

  document.getElementById('btnVista3D').onclick = (e) => {
    e.stopPropagation();
    panelVista3D.style.display = 'flex';
    vista3D.activar({ ...seleccion });
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
    statsPrevias = null;   // sin deltas de una sesión anterior
    renderizar();
    panel.style.display = 'block';
    controls.unlock();

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

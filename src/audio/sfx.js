/* ── audio/sfx.js ───────────────────────────────────────────
   Todo el sonido del juego, sintetizado con WebAudio — nada de
   archivos de audio, cada sonido se genera con osciladores y
   ruido en el momento. Eso hace que el timbre pueda depender
   de las piezas montadas: un disparo de pistola suena distinto
   a uno de rifle, y un silenciador cambia el sonido de verdad,
   no solo baja el volumen.

   El contexto de audio arranca suspendido en el navegador
   (política de autoplay) — se despierta con el primer clic del
   jugador, que siempre existe porque el juego arranca con el
   botón JUGAR.
──────────────────────────────────────────────────────────── */

let ctx = null;
let masterGain = null;

export function iniciarAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;   // navegador sin soporte — el juego sigue funcionando, solo sin sonido
  ctx = new AudioCtx();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.5;
  masterGain.connect(ctx.destination);
}

/* Un búfer de ruido blanco, reutilizado por todos los sonidos que
   lo necesitan — generarlo una sola vez en vez de en cada disparo. */
let bufferRuido = null;
function obtenerRuido() {
  if (bufferRuido) return bufferRuido;
  const largo = ctx.sampleRate * 0.5;
  bufferRuido = ctx.createBuffer(1, largo, ctx.sampleRate);
  const datos = bufferRuido.getChannelData(0);
  for (let i = 0; i < largo; i++) datos[i] = Math.random() * 2 - 1;
  return bufferRuido;
}

function envolvente(nodo, ahora, ataque, decaimiento, pico) {
  nodo.gain.setValueAtTime(0.0001, ahora);
  nodo.gain.exponentialRampToValueAtTime(Math.max(0.0001, pico), ahora + ataque);
  nodo.gain.exponentialRampToValueAtTime(0.0001, ahora + ataque + decaimiento);
}

/* ── disparo ─────────────────────────────────────────────────
   Tres capas: un golpe grave (el "cuerpo" del disparo), un
   chasquido agudo de ruido (el crack), y una cola corta. Los
   parámetros dependen del arma — es lo que hace que un rifle
   suene distinto a una pistola sin necesitar archivos aparte. */
export function sonidoDisparo({ gravedad = 1, brillo = 1, volumen = 1, cola = 1 } = {}) {
  if (!ctx || ctx.state !== 'running') return;
  const ahora = ctx.currentTime;

  // capa 1: el golpe grave — un oscilador que cae rápido de tono
  const osc = ctx.createOscillator();
  const gOsc = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180 * gravedad, ahora);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, 42 * gravedad), ahora + 0.09);
  envolvente(gOsc, ahora, 0.002, 0.1, 0.55 * volumen);
  osc.connect(gOsc).connect(masterGain);
  osc.start(ahora);
  osc.stop(ahora + 0.16);

  // capa 2: el chasquido — ruido filtrado en agudos, muy corto
  const ruido = ctx.createBufferSource();
  ruido.buffer = obtenerRuido();
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'highpass';
  filtro.frequency.value = 900 * brillo;
  const gRuido = ctx.createGain();
  envolvente(gRuido, ahora, 0.001, 0.06 * cola, 0.4 * volumen);
  ruido.connect(filtro).connect(gRuido).connect(masterGain);
  ruido.start(ahora);
  ruido.stop(ahora + 0.12 * cola);

  // capa 3: cola de cuerpo medio, le da peso a las armas grandes
  if (cola > 0.5) {
    const ruidoCola = ctx.createBufferSource();
    ruidoCola.buffer = obtenerRuido();
    const filtroCola = ctx.createBiquadFilter();
    filtroCola.type = 'bandpass';
    filtroCola.frequency.value = 340 * gravedad;
    filtroCola.Q.value = 0.8;
    const gCola = ctx.createGain();
    envolvente(gCola, ahora, 0.005, 0.22 * cola, 0.22 * volumen);
    ruidoCola.connect(filtroCola).connect(gCola).connect(masterGain);
    ruidoCola.start(ahora);
    ruidoCola.stop(ahora + 0.3 * cola);
  }
}

/* Un click seco al intentar disparar sin balas — muy corto,
   metálico, sin nada de cuerpo grave.                          */
export function sonidoVacio() {
  if (!ctx || ctx.state !== 'running') return;
  const ahora = ctx.currentTime;
  const ruido = ctx.createBufferSource();
  ruido.buffer = obtenerRuido();
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'bandpass';
  filtro.frequency.value = 2600;
  filtro.Q.value = 3;
  const g = ctx.createGain();
  envolvente(g, ahora, 0.001, 0.03, 0.25);
  ruido.connect(filtro).connect(g).connect(masterGain);
  ruido.start(ahora);
  ruido.stop(ahora + 0.05);
}

/* Recarga: dos golpes — el cargador saliendo y el nuevo entrando.
   Un cargador más grande suena más pesado y más separado.       */
export function sonidoRecarga(pesoCargador = 0.2) {
  if (!ctx || ctx.state !== 'running') return;
  const ahora = ctx.currentTime;
  const gravedad = 1 + pesoCargador * 1.6;

  for (const [retraso, intensidad] of [[0, 0.7], [0.28, 1]]) {
    const t = ahora + retraso;
    const ruido = ctx.createBufferSource();
    ruido.buffer = obtenerRuido();
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.value = 1400 / gravedad;
    filtro.Q.value = 2.2;
    const g = ctx.createGain();
    envolvente(g, t, 0.002, 0.07, 0.3 * intensidad);
    ruido.connect(filtro).connect(g).connect(masterGain);
    ruido.start(t);
    ruido.stop(t + 0.12);
  }
}

/* Pasos — se llama desde main.js según la distancia recorrida,
   no por tiempo, así caminar despacio no suena igual de rápido. */
export function sonidoPaso() {
  if (!ctx || ctx.state !== 'running') return;
  const ahora = ctx.currentTime;
  const ruido = ctx.createBufferSource();
  ruido.buffer = obtenerRuido();
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = 420 + Math.random() * 180;
  const g = ctx.createGain();
  envolvente(g, ahora, 0.004, 0.09, 0.12);
  ruido.connect(filtro).connect(g).connect(masterGain);
  ruido.start(ahora);
  ruido.stop(ahora + 0.14);
}

/* Un tono corto de confirmación — al aplicar un arma en el banco. */
export function sonidoConfirmar() {
  if (!ctx || ctx.state !== 'running') return;
  const ahora = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, ahora);
  osc.frequency.exponentialRampToValueAtTime(780, ahora + 0.08);
  envolvente(g, ahora, 0.01, 0.12, 0.14);
  osc.connect(g).connect(masterGain);
  osc.start(ahora);
  osc.stop(ahora + 0.2);
}

/* Traduce las piezas montadas a los parámetros de timbre — esto
   es lo que hace que cada arma suene distinta de verdad.        */
export function parametrosDisparoDeArma(estadisticas, claveCuerpo, claveBoca) {
  // cuerpos más pesados suenan más graves y con más cola
  const gravedadPorCuerpo = {
    pistola: 1.15, automatica: 1.25, revolver: 0.95,
    subfusil: 1.05, escopeta: 0.7, rifle: 0.85,
    lmg: 0.72, francotirador: 0.68,
  };
  const colaPorCuerpo = {
    pistola: 0.6, automatica: 0.5, revolver: 0.8,
    subfusil: 0.55, escopeta: 1.3, rifle: 1.0,
    lmg: 1.1, francotirador: 1.4,
  };

  let gravedad = gravedadPorCuerpo[claveCuerpo] ?? 1;
  let cola = colaPorCuerpo[claveCuerpo] ?? 1;
  let brillo = 1;
  let volumen = 1;

  // el silenciador cambia el sonido de verdad: mucho menos
  // volumen, sin brillo agudo, y con un "thump" más grave
  if (claveBoca === 'silenciador') {
    volumen *= 0.34;
    brillo *= 0.35;
    gravedad *= 1.25;
    cola *= 0.4;
  } else if (claveBoca === 'compensadorPesado') {
    brillo *= 1.2;   // más agudo y seco, redirige el gas hacia los lados
    cola *= 0.85;
  }

  return { gravedad, brillo, volumen, cola };
}

/* ── DEAL — punto de entrada ───────────────────────────────
   Junta las piezas: mundo (motor genérico), los entornos
   (taller + cabina), jugador, arma, inventario, HUD, y los
   sistemas de gráficos. Aquí solo se conectan y corre el
   bucle principal.
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import { crearMundo } from './core/mundo.js';
import { crearJugador } from './core/jugador.js';
import { crearArma } from './armas/arma.js';
import { crearCielo } from './graficos/cielo.js';
import { crearAnimador } from './graficos/animacion.js';
import { crearEfectos } from './graficos/efectos.js';
import { crearTaller } from './entornos/taller.js';
import { crearCabina } from './entornos/cabina.js';
import { ensamblarArma } from './armas/ensamblar.js';
import { CUERPOS, CAÑONES, CARGADORES, MIRAS, BOCAS, EMPUÑADURAS, GATILLOS, MUNICIONES, ACABADOS } from './armas/piezas.js';
import { crearBancoTrabajo } from './ui/bancoTrabajo.js';
import { crearExhibidorArma } from './entornos/exhibidorArma.js';
import { crearInventario } from './armas/inventario.js';
import { crearHud } from './ui/hud.js';
import {
  iniciarAudio, sonidoDisparo, sonidoVacio, sonidoRecarga, sonidoPaso,
  sonidoConfirmar, parametrosDisparoDeArma,
} from './audio/sfx.js';

const { scene, camera, renderer, sol, ALTURA_OJOS } = crearMundo();
const efectos = crearEfectos(scene);

// el cielo decide de dónde viene la luz — se la pasamos a la luz
// direccional para que las sombras apunten para el lado correcto
const { direccionSol } = crearCielo(scene);
sol.position.copy(direccionSol).multiplyScalar(60);

// los dos entornos, cada uno agrega su propio contenido a la
// misma escena — el taller decide dónde apareces
const taller = crearTaller(scene);
const cabina = crearCabina(scene);
camera.position.copy(taller.puntoAparicion).setY(ALTURA_OJOS);

// una lista para el jugador (puede traer puntos falsos, para
// paredes) y otra para las balas (solo geometría real disparable)
const colisionablesJugador = [...taller.colisionablesJugador, ...cabina.colisionablesJugador];
const meshesDisparables = [...taller.meshesDisparables, ...cabina.meshesDisparables];

// un solo animador compartido — jugador y arma lo usan cada uno
// para lo suyo (rebote de aterrizaje, recarga), pero es UN sistema,
// no dos sueltos
const animador = crearAnimador();

const jugador = crearJugador(camera, document.body, {
  colisionables: colisionablesJugador,
  alturaOjos: ALTURA_OJOS,
  animador,
});

/* Arma las estadísticas finales de una selección de piezas — la
   misma función que usa el banco de trabajo, para que cambiar
   de espacio de inventario dé exactamente el mismo resultado
   que armarla ahí. Devuelve null si la selección es null (espacio
   vacío del inventario, "manos vacías").                        */
function estadisticasDeSeleccion(seleccion) {
  if (!seleccion) return null;
  return ensamblarArma({
    cuerpo: CUERPOS[seleccion.cuerpo],
    cañon: CAÑONES[seleccion.cañon],
    cargador: CARGADORES[seleccion.cargador],
    mira: MIRAS[seleccion.mira],
    boca: BOCAS[seleccion.boca],
    empuñadura: EMPUÑADURAS[seleccion.empuñadura],
    gatillo: GATILLOS[seleccion.gatillo],
    municion: MUNICIONES[seleccion.municion],
    acabado: ACABADOS[seleccion.acabado],
  });
}

// una pistola armada con el catálogo de piezas — el punto de
// partida por defecto, en el espacio 1 del inventario; los otros
// 7 espacios arrancan vacíos ("manos vacías" al seleccionarlos)
const seleccionInicial = {
  cuerpo: 'pistola', cañon: 'estandar', cargador: 'medio', mira: 'ninguna', boca: 'ninguna',
  empuñadura: 'ninguna', gatillo: 'ninguno', municion: 'estandar', acabado: 'fabrica',
};
const estadisticasArma = estadisticasDeSeleccion(seleccionInicial);
const arma = crearArma(camera, animador, estadisticasArma, seleccionInicial);
const inventario = crearInventario(seleccionInicial);
const hud = crearHud();

// el arma tendida sobre la mesa, en el mundo real — se actualiza
// en vivo mientras armas piezas en el banco de trabajo
const exhibidor = crearExhibidorArma(scene, taller.superficieMesa);

// el banco de trabajo — se abre con E cerca de la mesa, y al
// confirmar cambia el arma que traes cargada de verdad (estadísticas
// Y modelo visual juntos) Y actualiza el espacio activo del
// inventario, para que no se pierda al cambiar de espacio después
const posicionMesaJugador = taller.posicionMesa.clone().setY(ALTURA_OJOS);
const banco = crearBancoTrabajo({
  posicionMesa: posicionMesaJugador,
  posicionExhibidor: taller.superficieMesa.clone().setY(taller.superficieMesa.y + 0.05),   // la superficie ya viene calculada del taller, solo el margen del arma
  radioInteraccion: 2.2,
  controls: jugador.controls,
  camera,
  exhibidor,
  onAplicar: (nuevasEstadisticas, nuevaSeleccion) => {
    sonidoConfirmar();
    inventario.actualizarActivo(nuevaSeleccion);
    arma.actualizarArma(nuevasEstadisticas, nuevaSeleccion);
  },
});
let cercaDeLaMesa = false;

/* menú principal, menú de pausa, y HUD — el primer bloqueo SOLO
   pasa desde el botón JUGAR; después de eso, pausar (ESC) muestra
   el menú de pausa en vez del simple aviso de antes.             */
const menuPrincipal = document.getElementById('menuPrincipal');
const menuPausa = document.getElementById('menuPausa');
let juegoIniciado = false;

document.getElementById('btnJugar').onclick = () => {
  iniciarAudio();   // el navegador solo permite audio tras un gesto real del usuario
  juegoIniciado = true;
  menuPrincipal.style.display = 'none';
  jugador.controls.lock();
};
document.getElementById('btnReanudar').onclick = () => jugador.controls.lock();
document.addEventListener('click', () => { if (juegoIniciado && !banco.abierto) jugador.controls.lock(); });
jugador.controls.addEventListener('lock', () => { menuPausa.style.display = 'none'; });
jugador.controls.addEventListener('unlock', () => {
  if (juegoIniciado && !banco.abierto) menuPausa.style.display = 'flex';
  apuntando = false;
  gatilloPresionado = false;
});

/* apuntado (clic derecho, mantener) y disparo (clic izquierdo).
   Sin el preventDefault de contextmenu, el navegador abriría su
   menú de clic derecho encima de todo cada vez que apuntas.    */
let apuntando = false;
let gatilloPresionado = false;
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('mousedown', (e) => {
  if (!jugador.controls.isLocked || banco.abierto) return;
  if (e.button === 0) gatilloPresionado = true;
  if (e.button === 2) apuntando = true;
});
document.addEventListener('mouseup', (e) => {
  if (e.button === 0) gatilloPresionado = false;
  if (e.button === 2) apuntando = false;
});

const TECLAS_INVENTARIO = {
  Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3,
  Digit5: 4, Digit6: 5, Digit7: 6, Digit8: 7,
};
document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyR' && jugador.controls.isLocked) {
    const antes = arma.estado();
    arma.recargar();
    // solo suena si la recarga de verdad arrancó — presionar R con
    // el cargador lleno no hace nada, y tampoco debería sonar
    if (!antes.recargando && arma.estado().recargando) {
      const sel = inventario.armaActiva();
      sonidoRecarga(sel ? (CARGADORES[sel.cargador]?.peso ?? 0.2) : 0.2);
    }
  }
  if (e.code === 'KeyE' && jugador.controls.isLocked && cercaDeLaMesa) banco.abrir();
  if (e.code === 'KeyF' && jugador.controls.isLocked && !banco.abierto) arma.inspeccionar(true);
});
document.addEventListener('keyup', (e) => {
  if (e.code === 'KeyF') arma.inspeccionar(false);

  if (jugador.controls.isLocked && e.code in TECLAS_INVENTARIO) {
    inventario.seleccionar(TECLAS_INVENTARIO[e.code]);
    const seleccionActiva = inventario.armaActiva();
    arma.actualizarArma(estadisticasDeSeleccion(seleccionActiva), seleccionActiva);
  }
});

/* ── disparo: el arma decide SI puede tirar (cadencia, munición);
   aquí solo se hace el raycasting contra el mundo con lo que
   el arma entrega. Usa meshesDisparables — geometría real, no
   los puntos falsos que usan las paredes para el movimiento.   */
const raycaster = new THREE.Raycaster();
function intentarDisparar() {
  const disparo = arma.disparar();
  if (!disparo) {
    // click seco: solo si de verdad es por falta de balas, no por
    // estar recargando o esperando la cadencia
    const est = arma.estado();
    if (!est.sinArma && !est.recargando && est.balas === 0) sonidoVacio();
    return;
  }

  const seleccionActual = inventario.armaActiva();
  sonidoDisparo(parametrosDisparoDeArma(null, seleccionActual.cuerpo, seleccionActual.boca));

  // siempre es una LISTA — armas normales traen 1 proyectil, la
  // escopeta trae varios (perdigones) — el mismo código sirve para
  // ambos casos, no hace falta distinguir aquí qué arma es
  const puntaCanon = arma.obtenerPuntaCanon();
  for (const proyectil of disparo.proyectiles) {
    raycaster.set(disparo.origen, proyectil.direccion);
    raycaster.far = disparo.alcance;
    const impactos = raycaster.intersectObjects(meshesDisparables);
    const destino = impactos.length > 0
      ? impactos[0].point
      : disparo.origen.clone().addScaledVector(proyectil.direccion, disparo.alcance);
    if (impactos.length > 0) {
      // ya no se tiñe de rojo el objeto golpeado: en una pared
      // grande eso pintaba TODA la pared, que se veía muy mal.
      // La marca de impacto persistente comunica el acierto mucho
      // mejor, y en el lugar exacto donde pegó.
      const normal = impactos[0].face
        ? impactos[0].face.normal.clone().transformDirection(impactos[0].object.matrixWorld)
        : proyectil.direccion.clone().negate();
      efectos.marcaImpacto(destino, normal);
      // si fue un objetivo de la cabina, se tumba y se vuelve a
      // levantar solo — confirmación inmediata de que acertaste
      cabina.registrarImpacto(impactos[0].object);
    }
    efectos.trazadoraBala(puntaCanon, destino, disparo.colorTrazadora);
  }

  // casquillo y humo: uno por DISPARO, no por perdigón (una
  // escopeta expulsa un solo cartucho, no ocho)
  const direccionArma = new THREE.Vector3();
  camera.getWorldDirection(direccionArma);
  efectos.eyectarCasquillo(puntaCanon.clone().addScaledVector(direccionArma, -0.15), direccionArma, 0.05);
  const intensidadHumo = seleccionActual.boca === 'silenciador' ? 0.15 : 0.7;
  efectos.humoCañon(puntaCanon, intensidadHumo, direccionArma);
}

/* ── bucle principal ───────────────────────────────────────── */
let distanciaCaminada = 0;
const DISTANCIA_POR_PASO = 1.9;   // metros entre paso y paso
const reloj = new THREE.Clock();
function animar() {
  requestAnimationFrame(animar);
  const dt = Math.min(reloj.getDelta(), 0.1);   // por si la pestaña pierde foco

  if (gatilloPresionado) intentarDisparar();

  cercaDeLaMesa = banco.actualizarProximidad(camera.position);
  banco.actualizarVista3D();
  animador.actualizar(dt);
  efectos.actualizar(dt);
  cabina.actualizar(dt);

  const factorPeso = inventario.factorPeso();
  const { velocidad } = jugador.actualizar(dt, apuntando, factorPeso);
  if (!banco.abierto) arma.actualizar(dt, velocidad, apuntando, factorPeso);
  else arma.reiniciarSacudida();
  hud.actualizar(arma.estado(), inventario);

  // pasos por DISTANCIA, no por tiempo — caminar despacio da
  // pasos más espaciados, sin necesitar temporizadores aparte
  if (jugador.controls.isLocked && !banco.abierto) {
    distanciaCaminada += velocidad * dt;
    if (distanciaCaminada >= DISTANCIA_POR_PASO) {
      distanciaCaminada = 0;
      sonidoPaso();
    }
  }

  renderer.render(scene, camera);
}
animar();

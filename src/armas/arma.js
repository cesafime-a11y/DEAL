/* ── armas/arma.js ─────────────────────────────────────────
   El arma que ves en pantalla: modelo, balanceo, apuntado,
   disparo (con dispersión según precisión), recarga animada,
   y retroceso.

   El modelo visual YA NO es fijo — se construye a partir de las
   piezas elegidas (ver armas/modeloArma.js) y se puede
   RECONSTRUIR en caliente al cambiar de arma en la mesa de
   trabajo, sin perder ninguna animación: el grupo exterior
   (`grupo`, hijo de la cámara) es lo que se anima — balanceo,
   retroceso, apuntado — y nunca se destruye. Lo único que se
   reemplaza adentro es el modelo de piezas.
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import { Easing } from '../graficos/animacion.js';
import { construirModeloArma, liberarModeloArma } from './modeloArma.js';

const _arribaRef = new THREE.Vector3();
const _derecha = new THREE.Vector3();
const _arriba = new THREE.Vector3();

/* Perturba una dirección por un ángulo pequeño y aleatorio —
   así es como la precisión del arma se traduce en un disparo
   que sí puede fallar, no solo un número decorativo.          */
function aplicarDesviacion(direccion, magnitud) {
  _arribaRef.set(0, 1, 0);
  if (Math.abs(direccion.y) > 0.99) _arribaRef.set(1, 0, 0);
  _derecha.crossVectors(direccion, _arribaRef).normalize();
  _arriba.crossVectors(_derecha, direccion).normalize();
  const desvX = (Math.random() - 0.5) * 2 * magnitud;
  const desvY = (Math.random() - 0.5) * 2 * magnitud;
  return direccion.clone().addScaledVector(_derecha, desvX).addScaledVector(_arriba, desvY).normalize();
}

export function crearArma(camera, animador, estadisticasIniciales, seleccionInicial) {
  // el contenedor exterior — esto es lo que se anima (balanceo,
  // retroceso, apuntado). Nunca se destruye, solo cambia lo que
  // trae adentro cuando cambias de arma.
  const grupo = new THREE.Group();

  // luz del fogonazo — apagada casi siempre, se prende un instante
  // al disparar. Vive fuera del modelo intercambiable porque no
  // tiene sentido reconstruirla cada vez — solo se reposiciona.
  const fogonazo = new THREE.PointLight(0xffb347, 0, 3.5, 2);
  grupo.add(fogonazo);

  // punto de referencia en la punta del cañón — de aquí sale la
  // trazadora. También se reposiciona en vez de reconstruirse.
  const puntaCanon = new THREE.Object3D();
  grupo.add(puntaCanon);
  const _posPuntaCanon = new THREE.Vector3();
  function obtenerPuntaCanon() {
    puntaCanon.getWorldPosition(_posPuntaCanon);
    return _posPuntaCanon.clone();
  }

  // el modelo de piezas — esto sí se reemplaza por completo cada
  // vez que cambias de arma en la mesa de trabajo
  let modeloActual = null;
  let posApuntando = new THREE.Vector3();   // se recalcula por arma, ver más abajo
  function montarModelo(seleccion) {
    if (modeloActual) {
      grupo.remove(modeloActual.grupo);
      liberarModeloArma(modeloActual);
    }
    modeloActual = construirModeloArma(seleccion);
    grupo.add(modeloActual.grupo);
    fogonazo.position.copy(modeloActual.puntaCañon);
    puntaCanon.position.copy(modeloActual.puntaCañon);

    // dónde debe quedar el arma (grupo.position) para que el punto
    // ocular de la mira equipada termine exactamente frente a la
    // cámara al apuntar del todo — antes era un valor fijo para
    // todas las armas, así que con la telescópica terminabas viendo
    // el tubo sólido de lado en vez de mirar A TRAVÉS de ella.
    posApuntando.copy(modeloActual.posApuntando);
  }
  montarModelo(seleccionInicial);

  // posición de cadera — fija, es la misma para toda arma
  const posCadera = new THREE.Vector3(0.28, -0.24, -0.5);
  const rotCadera = -0.05;   // leve ángulo al cargar de cadera
  grupo.position.copy(posCadera);
  grupo.rotation.y = rotCadera;

  // hijo de la cámara: se mueve y rota con ella sin código extra
  camera.add(grupo);

  const FOV_NORMAL = camera.fov;      // el que ya trae la cámara de mundo.js
  let estadisticas = estadisticasIniciales;
  let FOV_APUNTANDO = FOV_NORMAL / estadisticas.zoomApuntado;
  const VELOCIDAD_TRANSICION_BASE = 6;   // qué tan rápido pasa de cadera a apuntado
                                          // — el bípode la multiplica por 0.65

  let t = 0;
  let apuntandoActual = 0;   // 0 = cadera, 1 = apuntando del todo — se anima suave

  /* ── disparo ─────────────────────────────────────────────── */
  let balas = estadisticas.capacidad;
  let cooldown = 0;          // segundos hasta poder disparar de nuevo
  let recargando = false;
  let tiempoRecargaRestante = 0;
  let retroceso = 0;         // 0 a 1, decae solo — mueve el arma al disparar
  const RECUPERACION_RETROCESO = 9;   // qué tan rápido vuelve el arma a su lugar

  /* Patrón de escalada: cada disparo seguido sube un poco más que
     el anterior, hasta un tope, y se resetea si dejas de disparar
     un momento. Antes cada disparo pegaba exactamente igual, así
     que aguantar el gatillo no se sentía distinto a tirar suelto. */
  let escalada = 0;
  const SUBIDA_ESCALADA = 0.22;      // cuánto sube por disparo seguido
  const RESET_ESCALADA = 3.2;        // qué tan rápido se calma al soltar

  /* Sacudida de la cámara — el arma sola no bastaba, la vista tiene
     que moverse también para que el disparo se sienta con peso. Se
     acumula al disparar y se recupera sola, y jamás toca la
     orientación real del jugador: se aplica como un desplazamiento
     encima, y se resta antes de volver a calcularla, para no pelear
     con PointerLockControls.                                       */
  let sacudidaX = 0, sacudidaY = 0;
  let sacudidaAplicadaX = 0, sacudidaAplicadaY = 0;
  const RECUPERACION_SACUDIDA = 11;

  // 0 = posición normal, 1 = totalmente "mirando el cargador" — el
  // módulo de animación anima esto de 0→1→0 durante la recarga
  let offsetRecarga = 0;

  /* Inspección: mantener la tecla acerca el arma y la gira para
     verle los detalles. Es puramente visual — no bloquea disparar
     (soltar el gatillo la cancela sola), solo es para apreciar lo
     que armaste.                                                  */
  let inspeccionando = 0;   // 0 a 1, se anima suave como el apuntado
  const VELOCIDAD_INSPECCION = 4.5;
  function inspeccionar(activa) {
    inspeccionObjetivo = activa ? 1 : 0;
  }
  let inspeccionObjetivo = 0;

  /* Intenta disparar. Devuelve los datos para que quien llame haga
     el raycasting de verdad — este módulo no sabe nada de la
     escena ni de qué hay que golpear, solo decide si el arma PUEDE
     tirar, y hacia dónde apunta cada proyectil, ya con dispersión.

     Siempre devuelve una LISTA de proyectiles, no uno solo: las
     armas normales disparan una lista de 1, la escopeta dispara
     varios a la vez (perdigones) — así quien llama (main.js) no
     necesita saber la diferencia, solo recorre la lista.           */
  function disparar() {
    if (!estadisticas || recargando || cooldown > 0 || balas <= 0) return null;

    balas--;
    cooldown = 1 / estadisticas.cadencia;
    escalada = Math.min(1, escalada + SUBIDA_ESCALADA);
    retroceso = estadisticas.retroceso * (0.5 + escalada * 0.9);
    fogonazo.intensity = 3.2;

    // la cámara se sacude hacia arriba, con algo de deriva
    // horizontal aleatoria — apuntando se siente bastante menos,
    // igual que el retroceso visual del arma
    const factorSacudida = (1 - apuntandoActual * 0.5) * estadisticas.retroceso;
    sacudidaX += (0.011 + escalada * 0.012) * factorSacudida;
    sacudidaY += (Math.random() - 0.5) * 0.014 * factorSacudida;

    const origen = new THREE.Vector3();
    const direccionRecta = new THREE.Vector3();
    camera.getWorldPosition(origen);
    camera.getWorldDirection(direccionRecta);

    // apuntar reduce la dispersión hasta un 75% — apuntar SÍ debe
    // ayudar a acertar, no ser solo un efecto visual de zoom
    const factorApuntado = 1 - apuntandoActual * 0.75;
    // la mira láser ayuda SOLO de cadera — su efecto se desvanece
    // según te acercas a apuntar del todo, hasta no hacer nada
    const factorLaser = 1 - (estadisticas.reduccionDispersionCadera || 0) * (1 - apuntandoActual);
    const magnitudBase = (1 - estadisticas.precision) * 0.09 * factorApuntado * factorLaser;

    // la escopeta (y solo ella) trae su propia mecánica: varios
    // perdigones por disparo, cada uno con menos daño y bastante
    // más dispersión que un proyectil normal
    const numProyectiles = estadisticas.perdigones || 1;
    const magnitudProyectil = estadisticas.perdigones
      ? magnitudBase * estadisticas.factorDispersion
      : magnitudBase;
    const dañoProyectil = estadisticas.perdigones
      ? estadisticas.daño * estadisticas.factorDañoPerdigon
      : estadisticas.daño;

    const proyectiles = [];
    for (let i = 0; i < numProyectiles; i++) {
      proyectiles.push({
        direccion: aplicarDesviacion(direccionRecta, magnitudProyectil),
        daño: dañoProyectil,
      });
    }

    return { origen, proyectiles, alcance: estadisticas.alcance, colorTrazadora: estadisticas.colorTrazadora };
  }

  function recargar() {
    if (!estadisticas || recargando || balas === estadisticas.capacidad) return;
    recargando = true;
    tiempoRecargaRestante = estadisticas.tiempoRecarga;

    // baja rápido (mirando el cargador), y sube con un pequeño
    // rebote — la subida está cronometrada para terminar justo
    // cuando las balas ya están listas
    const bajada = estadisticas.tiempoRecarga * 0.32;
    const subida = estadisticas.tiempoRecarga - bajada;
    animador.animar(0, 1, bajada, Easing.easeOutQuad, (v) => { offsetRecarga = v; }, () => {
      animador.animar(1, 0, subida, Easing.easeOutBack, (v) => { offsetRecarga = v; });
    });
  }

  /* Lo que pinta el HUD cada cuadro. */
  function estado() {
    if (!estadisticas) return { balas: 0, capacidad: 0, recargando: false, sinArma: true, nombre: null };
    return { balas, capacidad: estadisticas.capacidad, recargando, sinArma: false, nombre: estadisticas.nombre };
  }

  /* Cambia el arma que se está cargando por otra recién armada en
     la mesa de trabajo — estadísticas Y modelo visual juntos, para
     que nunca queden desincronizados entre sí. Si te pasan null en
     ambos, es "manos vacías" — se oculta el modelo, no truena.    */
  function actualizarArma(nuevasEstadisticas, nuevaSeleccion) {
    if (!nuevasEstadisticas || !nuevaSeleccion) {
      estadisticas = null;
      if (modeloActual) {
        grupo.remove(modeloActual.grupo);
        liberarModeloArma(modeloActual);
        modeloActual = null;
      }
      grupo.visible = false;
      return;
    }
    grupo.visible = true;
    estadisticas = nuevasEstadisticas;
    balas = estadisticas.capacidad;
    cooldown = 0;
    recargando = false;
    tiempoRecargaRestante = 0;
    offsetRecarga = 0;
    FOV_APUNTANDO = FOV_NORMAL / estadisticas.zoomApuntado;
    montarModelo(nuevaSeleccion);
  }

  /* Se llama cada cuadro con la velocidad horizontal del jugador
     (m/s), si se está manteniendo el apuntado, y el factor de peso
     del inventario completo (1 = sin penalización, baja según qué
     tanto cargues — afecta la velocidad de apuntado, además de la
     que ya trae la empuñadura puesta).                            */
  function actualizar(dt, velocidadCaminando, apuntando, factorPesoGlobal) {
    t += dt;

    if (!estadisticas) {
      // manos vacías — nada que animar, pero si el FOV se había
      // quedado apuntado de la última arma, hay que devolverlo
      if (Math.abs(camera.fov - FOV_NORMAL) > 0.01) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, FOV_NORMAL, Math.min(1, 10 * dt));
        camera.updateProjectionMatrix();
      }
      return;
    }

    const factorPeso = factorPesoGlobal ?? 1;

    // temporizadores de disparo/recarga
    if (cooldown > 0) cooldown = Math.max(0, cooldown - dt);
    if (recargando) {
      tiempoRecargaRestante -= dt;
      if (tiempoRecargaRestante <= 0) { balas = estadisticas.capacidad; recargando = false; }
    }
    retroceso = Math.max(0, retroceso - dt * RECUPERACION_RETROCESO);
    escalada = Math.max(0, escalada - dt * RESET_ESCALADA);

    /* Sacudida de cámara: primero se DESHACE la del cuadro anterior,
       y luego se aplica la nueva. Sin ese paso, la sacudida se
       acumularía sobre sí misma y la vista se iría desviando poco a
       poco de donde de verdad apuntas.                              */
    camera.rotation.x -= sacudidaAplicadaX;
    camera.rotation.y -= sacudidaAplicadaY;
    const decaimiento = Math.max(0, 1 - dt * RECUPERACION_SACUDIDA);
    sacudidaX *= decaimiento;
    sacudidaY *= decaimiento;
    if (Math.abs(sacudidaX) < 0.00005) sacudidaX = 0;
    if (Math.abs(sacudidaY) < 0.00005) sacudidaY = 0;
    camera.rotation.x += sacudidaX;
    camera.rotation.y += sacudidaY;
    sacudidaAplicadaX = sacudidaX;
    sacudidaAplicadaY = sacudidaY;
    fogonazo.intensity = Math.max(0, fogonazo.intensity - dt * 26);

    // transición suave hacia/desde apuntando, nunca de golpe — la
    // velocidad depende del arma (el bípode la hace más lenta) Y
    // de qué tan cargado vengas (el peso total del inventario)
    const objetivo = apuntando ? 1 : 0;
    const paso = VELOCIDAD_TRANSICION_BASE * (estadisticas.velocidadApuntado || 1) * factorPeso * dt;
    apuntandoActual = objetivo > apuntandoActual
      ? Math.min(objetivo, apuntandoActual + paso)
      : Math.max(objetivo, apuntandoActual - paso);

    // balanceo al caminar — más lento y con más recorrido que antes
    // (antes se sentía muy rápido); casi desaparece al apuntar
    const intensidad = THREE.MathUtils.clamp((velocidadCaminando || 0) / 5.5, 0, 1)
      * (1 - apuntandoActual * 0.85) * (1 - offsetRecarga);
    const balanceoX = Math.sin(t * 4.5) * 0.010 * intensidad;
    const balanceoY = Math.abs(Math.sin(t * 9)) * 0.016 * intensidad;
    const respiro = Math.sin(t * 1.3) * 0.003 * (1 - apuntandoActual * 0.6);   // sutil, incluso parado

    const posActual = new THREE.Vector3().lerpVectors(posCadera, posApuntando, apuntandoActual);
    // el mismo desplazamiento en el espacio se ve MÁS grande en
    // pantalla mientras apuntas (el campo de visión es más angosto,
    // como con un zoom) — sin este ajuste, el retroceso se sentía
    // como si el arma "se despegara" de golpe al apuntar. Se
    // atenúa hasta un 45% al apuntar del todo, nunca desaparece.
    const factorRetrocesoVisual = 1 - apuntandoActual * 0.45;
    /* El empuje en Z (el arma viene HACIA la cámara al disparar) es
       otra historia: ese es justo el que puede meter la carcasa de
       la mira dentro del plano near de la cámara — con un arma de
       retroceso alto disparando seguido, llegaba a empujar 7cm de
       más, y con eso CUALQUIER mira (no solo una) terminaba
       recortándose mientras disparabas apuntando, aunque en reposo
       (sin disparar) se viera perfecta. Se atenúa muchísimo más
       (85%) que el golpe en Y — el "vaivén" hacia arriba se
       conserva, pero el arma ya no se te viene encima de la cara.*/
    const factorRetrocesoVisualZ = 1 - apuntandoActual * 0.85;
    const retrocesoVisual = retroceso * factorRetrocesoVisual;
    const retrocesoVisualZ = retroceso * factorRetrocesoVisualZ;
    // animar la inspección igual que el apuntado, nunca de golpe
    const pasoInspeccion = VELOCIDAD_INSPECCION * dt;
    inspeccionando = inspeccionObjetivo > inspeccionando
      ? Math.min(inspeccionObjetivo, inspeccionando + pasoInspeccion)
      : Math.max(inspeccionObjetivo, inspeccionando - pasoInspeccion);

    grupo.position.set(
      posActual.x + balanceoX - inspeccionando * 0.1,
      posActual.y + balanceoY + respiro + retrocesoVisual * 0.042 - offsetRecarga * 0.14 + inspeccionando * 0.06,
      posActual.z + retrocesoVisualZ * 0.085 + offsetRecarga * 0.05 + inspeccionando * 0.16
    );
    grupo.rotation.y = THREE.MathUtils.lerp(rotCadera, 0, apuntandoActual) + inspeccionando * 0.85;
    grupo.rotation.x = -retrocesoVisual * 0.15 + offsetRecarga * 0.5 + inspeccionando * 0.22;
    grupo.rotation.z = offsetRecarga * 0.22 - inspeccionando * 0.35;

    // el campo de visión se acerca junto con el arma — es lo que
    // vende la sensación de "estar mirando a través de la mira"
    const fovObjetivo = THREE.MathUtils.lerp(FOV_NORMAL, FOV_APUNTANDO, apuntandoActual);
    if (Math.abs(camera.fov - fovObjetivo) > 0.01) {
      camera.fov = fovObjetivo;
      camera.updateProjectionMatrix();
    }
  }

  /* Pone en cero el estado de la sacudida — hace falta llamarla
     cuando el arma deja de animarse por un rato (banco abierto) y
     la cámara se reposiciona por completo desde afuera: sin esto,
     al reanudar se intentaría deshacer una sacudida vieja que ya
     no aplica a la nueva orientación de la cámara.               */
  function reiniciarSacudida() {
    sacudidaX = 0; sacudidaY = 0;
    sacudidaAplicadaX = 0; sacudidaAplicadaY = 0;
  }

  return { grupo, actualizar, disparar, recargar, estado, obtenerPuntaCanon, actualizarArma, inspeccionar, reiniciarSacudida };
}

# Script de Grabacion — Demo KRUMM

**Objetivo:** Video de 2:30–3:00 minutos para adjuntar a postulaciones (YC, aceleradoras, grants) y presentaciones a inversionistas.

**Setup tecnico:**
- Abrir `http://localhost:5174/?lang=es` en Chrome/Edge incognito (sin extensiones visibles)
- Resolucion: 1920x1080 (1080p) o 2560x1440 (1440p)
- Grabar con OBS Studio o Loom: solo la ventana del navegador, sin barra de tareas
- Microfono: silenciado (el video es visual + sonidos de la app)
- Antes de grabar: cerrar pestañas, silenciar notificaciones, fondo de escritorio neutro

**URLs a usar:**
- Landing: `http://localhost:5174/?lang=es`
- Demo grabable: `http://localhost:5174/demo?record=true&lang=es`
- Pitch deck: `http://localhost:5174/pitch?lang=es`

---

## Timeline

### 0:00–0:18 | Landing Page — Hero
- [ ] 0:00 — Abrir landing page. Cursor visible pero quieto.
- [ ] 0:02 — Scroll lento hacia abajo mostrando el hero completo: titulo "Evaluamos habilidades, talentos y destrezas", descripcion, logo KRUMM, botones CTA.
- [ ] 0:08 — Hacer hover sobre "Comenzar demo" (el boton con halo ring) para mostrar el efecto.
- [ ] 0:10 — Seguir scrolleando lentamente hasta que aparezca la seccion de "Diferenciadores" (categorias clave).
- [ ] 0:16 — Mostrar brevemente una tarjeta de capacidades ("Capacidad atencional y control inhibitorio").
- [ ] 0:18 — Scroll rapido de vuelta al hero.

### 0:18–0:28 | Landing → Demo
- [ ] 0:18 — Click en "Comenzar demo" (el boton del hero con icono de matraz).
- [ ] 0:20 — Se abre el overlay de la demo. Se muestra el GameGallery con los 3 juegos.
- [ ] 0:22 — Click en "Continuar a demo (3 actividades)".
- [ ] 0:24 — Aparece la pantalla de instrucciones de Balloon: "Iniciando protocolo de evaluacion de riesgo..."
- [ ] 0:26 — Click en "Comenzar actividad".

### 0:28–1:00 | Juego 1 — Balloon Risk Task (~32s reales)
- [ ] 0:28 — Comienza Balloon. Se ve el globo, el puntaje, los botones "Inflar" y "Cobrar".
- [ ] 0:30 — Inflar globo 3-4 veces (sonido pump cada vez).
- [ ] 0:35 — El globo crece visiblemente. Mostrar tension: hacer hover sobre "Inflar" una vez mas, dudar.
- [ ] 0:38 — Cobrar los puntos. Suena sonido de exito. El puntaje sube.
- [ ] 0:40 — Segundo globo: inflar mas agresivo (5-6 pumps rapidos).
- [ ] 0:48 — El globo EXPLOTA. Sonido pop + puntos perdidos. Mostrar la animacion de explosion.
- [ ] 0:50 — Tercer globo: enfoque conservador. 2-3 pumps y cobrar.
- [ ] 0:54 — Cuarto globo: moderate. 4 pumps y cobrar.
- [ ] 0:58 — Se acaba el tiempo (30s). Aparece toast "Protocolo balloon completado".
- [ ] 0:59 — Suena whoosh de transicion.

### 1:00–1:38 | Juego 2 — Grid Flow (~38s reales)
- [ ] 1:00 — Comienza Grid Flow. Se ve la cuadricula, el operador (punto azul), paquetes y destinos.
- [ ] 1:02 — Mover el operador hacia un paquete (usando teclas o clicks en celdas adyacentes). Suena click al mover.
- [ ] 1:08 — Recoger paquete. La celda se ilumina.
- [ ] 1:12 — Navegar hacia la estacion de destino. Mostrar ruta elegida (no necesariamente optima, se ve real).
- [ ] 1:20 — Entregar paquete. Sonido de exito. Puntos sumados.
- [ ] 1:22 — Segundo paquete: ruta diferente, mas rapido.
- [ ] 1:30 — La barra de energia (SAT) baja. Mostrar como afecta el juego.
- [ ] 1:34 — Pasar por estacion de recarga si esta disponible.
- [ ] 1:36 — Tercer paquete recogido. Suena whoosh.

### 1:38–2:10 | Juego 3 — Laser Puzzle (~32s reales)
- [ ] 1:38 — Comienza Laser Puzzle. Se ve la cuadricula con emisor, antenas, obstaculos.
- [ ] 1:40 — Arrastrar un espejo desde la barra lateral hacia la cuadricula.
- [ ] 1:44 — Colocar espejo en posicion. El haz de luz rebota. Suena click.
- [ ] 1:48 — El haz NO llega a la antena. Mover el espejo a otra posicion.
- [ ] 1:52 — El haz llega a la antena. Suena sonido de exito. Sube de nivel.
- [ ] 1:54 — Nivel 2: mas obstaculos. Usar bifurcador esta vez.
- [ ] 2:00 — Colocar bifurcador + reflector. El haz se divide y llega a 2 antenas.
- [ ] 2:04 — Nivel 3 rapido. Un solo movimiento certero.
- [ ] 2:08 — Se acaba el tiempo. Toast "Protocolo laser completado". Suena whoosh.

### 2:10–2:30 | Reporte Post-Demo
- [ ] 2:10 — Transicion a PostDemoScreen. Se ve "KRUMM DEMO · REC" y el checkmark verde.
- [ ] 2:12 — Aparece el grafico radar animado (Riesgo 72%, Ruteo 78%, Espacial 85%).
- [ ] 2:16 — Scroll lento mostrando las tarjetas por juego: Balloon con sus metricas, Grid Flow, Laser Puzzle.
- [ ] 2:22 — Señales destacadas visibles: "Toma de riesgo calibrada", "Ruteo espacial eficiente", "Priorizacion bajo presion".
- [ ] 2:26 — Mostrar brevemente el boton de "Contactar a ventas".
- [ ] 2:28 — Hacer hover sobre el boton (efecto)

### 2:30–3:00 | Pitch Deck + Cierre
- [ ] 2:30 — Navegar a `/pitch?lang=es` (escribir URL o hacer click si hay link)
- [ ] 2:32 — Slide 1: "The Behavioral Truth". Mostrar transicion animada.
- [ ] 2:35 — Flecha derecha → Slide 2: "Hiring is Broken"
- [ ] 2:38 — Flecha derecha → Slide 3: "Delivering the Truth"
- [ ] 2:41 — Flecha derecha → Slide 4: "Edge AI Advantage"
- [ ] 2:44 — Flecha derecha → Slide 5: "The Defensive Moat"
- [ ] 2:47 — Flecha derecha → Slide 6: "The Core Founders" (detenerse 3s aqui — es la slide del equipo)
- [ ] 2:52 — Navegar rapidamente slides 7-10 con clicks seguidos (mostrar que hay 10 slides)
- [ ] 2:56 — Volver a landing. Ultimo frame: logo KRUMM + "Evaluamos habilidades, talentos y destrezas"
- [ ] 3:00 — Fin del video.

---

## Notas para la grabacion

**Sonidos:** Todo es sintetizado via Web Audio API. No hay archivos de audio externos. Los sonidos funcionan en el primer click (se activa el AudioContext). En la grabacion se escucharan:
- Balloon: pump (tono ascendente), pop (ruido blanco filtrado), success (triada C-E-G)
- Grid Flow: click (E5 suave), success (triada)
- Laser Puzzle: click, flash, success, level up (G4-C5 square)
- Transiciones: whoosh (ruido rosa bandpass con decay)

**Lo que NO se ve en el video (y esta bien):**
- No hay camara ni microfono (la demo publica no los pide)
- No hay formulario de login (es modo demo)
- El badge REC rojo es sutil y no distrae — se ve profesional

**Post-produccion sugerida:**
- Cortar los momentos muertos entre juegos (toasts de "preparando modulo" duran 200ms)
- Agregar un fade in al inicio y fade out al final
- Si se quiere musica de fondo: agregarla en post (no en la app)
- Exportar en 1080p 30fps, codec H.264, audio AAC 128kbps

**Duracion total estimada:** 2:45–3:05 minutos segun ritmo de gameplay.
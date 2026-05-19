# Plan: Demo grabable para postulaciones y levantamiento de capital

**Objetivo:** Dejar la experiencia de demo impecable para grabar un playthrough que se pueda adjuntar a postulaciones (YC, aceleradoras, grants) y presentaciones a inversionistas.

**Fecha:** 2026-05-19
**Branch sugerida:** `demo-polish-v1`

---

## Diagnostico actual

1. **Build limpio:** `npm run build` compila sin errores (13.9s, 2808 modulos).
2. **Tests pasan:** Todos los tests existentes OK.
3. **Demo funcional:** `/demo` tiene 3 juegos (Balloon, Grid Flow, Laser Puzzle) con flujo completo.
4. **Landing:** LandingPageV3 con CTA, DemoSection embebida, pitch deck (`/pitch`) con 10 slides high-res WebP.
5. **Post-demo:** Pantalla dummy con CTA de contacto, sin reporte real funcional.
6. **CSS:** Los estilos estan modularizados y organizados.
7. **Audio:** Sistema de sonidos ya implementado para los juegos.
8. **Animaciones:** Framer Motion en toda la plataforma.

---

## Problemas identificados para una grabacion pulida

1. **El "reporte" final es un blur dummy** -- no muestra datos reales ni insights del playthrough. Para un video de inversionistas, la transicion demo->reporte deberia verse profesional, con datos coherentes del juego que acaba de ocurrir.

2. **No hay consent modal en la demo publica** -- la demo publica deliberadamente skipea camara/mic, pero al entrar a `/demo` no hay una pantalla de bienvenida clara que establezca el contexto "esto es una evaluacion de talento". Se va directo a la seleccion de juegos.

3. **Instrucciones de juegos desiguales** -- Balloon no muestra briefing (`showBriefing={false}`), mientras Grid y Laser si. Inconsistencia que se nota en grabacion.

4. **El HeroDemo (landing) tiene juegos placeholder simples** -- quiz de opcion multiple y ordenamiento. No son los juegos reales. Para una grabacion de landing, seria ideal que el hero muestre fragmentos reales de los juegos.

5. **No hay una "ruta dorada" optimizada para grabacion** -- idealmente un flujo `/demo?record=true` que:
   - Salte la seleccion de juegos
   - Use timers cortos optimizados para video (~30s por juego)
   - Tenga texto de instrucciones reducido
   - Genere un reporte falso pero coherente con los juegos jugados
   - Muestre transiciones fluidas entre juego y juego

6. **Falta un favicon/OG image pulido para compartir en redes** -- al compartir el link en postulaciones, la preview deberia verse profesional.

7. **El pitch deck es solo imagenes estaticas** -- no hay animaciones de transicion entre slides. Para video, se podria mejorar con un carrusel animado.

8. **No hay "About" o "Team" section en la landing** -- inversionistas quieren ver quien esta detras.

---

## Tareas

### Fase 1: Ruta dorada para grabacion (prioridad ALTA)

- [ ] **1.1** Crear modo `?record=true` en DemoShell que:
  - Salte el GameGallery/selector de juegos
  - Use `DEMO_FIXED_IDS` con timers reducidos (30s Balloon, 40s Grid, 35s Laser)
  - Muestre instrucciones ultra-breves (1 linea por juego)
  - Muestre un overlay sutil "REC" o "Modo grabacion" solo visible en desarrollo
  - Archiveivo: `src/components/DemoShell.jsx`

- [ ] **1.2** Hacer que PostDemoScreen en modo grabacion genere un reporte falso pero **coherente** con los 3 juegos:
  - Balloon -> "Toma de riesgo calibrada: N pumps promedio, N globos explotados"
  - Grid Flow -> "Eficiencia de ruteo: N paquetes entregados, energia remanente"
  - Laser Puzzle -> "Razonamiento espacial: N espejos colocados, tiempo por nivel"
  - Mostrar un pequeno grafico de radar con las 3 dimensiones (usar datos fake pero verosimiles)
  - Archiveivo: `src/components/PostDemoScreen.jsx`

- [ ] **1.3** Unificar briefing de juegos en demo: Balloon debe tener `showBriefing={true}` igual que Grid y Laser. Instrucciones maximas 2 lineas en modo grabacion.
  - Archiveivo: `src/components/DemoShell.jsx` (BalloonProtoWrapper)

### Fase 2: Landing page optimizada para video

- [ ] **2.1** Reemplazar HeroDemo con un video loop o una secuencia animada de los 3 juegos reales. Alternativa mas simple: crear un componente `DemoTeaser` que muestre clips estaticos estilizados de cada juego con animaciones de entrada.
  - Archivo: `src/components/HeroDemo.jsx` (refactorizar)

- [ ] **2.2** Agregar seccion "Equipo" o "Sobre KRUMM" minimalista en la landing (debajo de use cases). Con espacio para nombres/roles o al menos una descripcion de la compania.
  - Archivo: `src/components/LandingPageV3.jsx`

- [ ] **2.3** Agregar meta tags OG (Open Graph) en `index.html` para que al compartir el link se vea:
  - Titulo: "KRUMM - Evaluacion de Talento Basada en Juegos"
  - Descripcion: "Reemplaza pruebas psicometricas tradicionales con juegos cientificos que miden habilidades cognitivas reales."
  - Imagen: logo o un frame del pitch deck
  - Archiveivo: `index.html`

### Fase 3: Pitch deck animado

- [ ] **3.1** Agregar transiciones animadas entre slides del pitch deck (fade + slide). Actualmente es solo un carrusel de imagenes estaticas.
  - Archivo: `src/components/PitchDeckPage.jsx`

- [ ] **3.2** Opcional: overlay de navegacion con dots/miniaturas para que en video se vean todas las slides disponibles.
  - Archivo: `src/components/PitchDeckPage.jsx`

### Fase 4: Pulido visual y audio

- [ ] **4.1** Verificar que los sonidos de los juegos (Balloon pump/pop, Grid click/success, Laser flash/success) funcionen consistentemente y no se solapen.
  - Archivo: `src/utils/audio.js`

- [ ] **4.2** Agregar un sonido de transicion entre juegos en la demo (un "whoosh" sutil).
  - Archivo: `src/components/DemoShell.jsx`, `src/utils/audio.js`

- [ ] **4.3** Revisar que no haya texto placeholder, TODOs visibles, o console logs en produccion.
  - Buscar en todos los archivos: `TODO`, `FIXME`, `console.log`, `placeholder`

- [ ] **4.4** Favicon y assets de marca: verificar que apple-touch-icon, favicon-32, favicon-16, y site.webmanifest esten correctos.
  - Archivos: `public/`, `index.html`

### Fase 5: Script de grabacion

- [ ] **5.1** Escribir un script/guiion de grabacion con timestamps:
  - 0:00-0:15 → Landing page (scroll rapido por secciones clave)
  - 0:15-0:30 → Click en CTA "Probar demo"
  - 0:30-1:00 → Balloon Risk Task (gameplay)
  - 1:00-1:30 → Grid Flow (gameplay)
  - 1:30-2:00 → Laser Puzzle (gameplay)
  - 2:00-2:15 → Transicion a reporte post-demo
  - 2:15-2:30 → Pitch deck slides rapidas
  - 2:30-3:00 → Landing de nuevo con info de contacto/equipo

### Fase 6: Quick wins (opcional, si hay tiempo)

- [ ] **6.1** Agregar un boton "Compartir" en PostDemoScreen que copie un link pre-armado.
- [ ] **6.2** Agregar `/demo?lang=en` para grabar version en ingles.
- [ ] **6.3** Agregar un modo "kiosk" que oculte header/footer en la demo para grabacion limpia.

---

## Orden de ejecucion recomendado

1. **Fase 1** (ruta dorada) -- es lo que mas impacto tiene en el video final
2. **Fase 2.1 + 2.2** (landing hero + equipo) -- primera impresion en el video
3. **Fase 5** (script) -- definir exactamente que se graba
4. **Fase 3** (pitch deck animado) -- pulir la seccion de pitch
5. **Fase 2.3 + 4.3 + 4.4** (meta tags + limpieza + favicon)
6. **Fase 4.1 + 4.2** (audio) -- capa final de pulido
7. **Fase 6** (quick wins) -- solo si hay tiempo extra

---

## Notas tecnicas

- **No tocar backend:** La demo funciona 100% client-side. El unico backend necesario seria para Gemini en reportes reales, que no aplica aqui.
- **No tocar telemetria:** El sistema de tracking ya ignora la demo correctamente.
- **Variables de entorno:** Agregar `VITE_RECORD_MODE=false` para controlar si el modo grabacion esta disponible en prod (deberia estar deshabilitado en prod real).
- **Testing:** Despues de cada fase, correr `npm run build` para verificar que no se rompa la compilacion. No es necesario correr toda la suite de tests para cambios de UI en demo.
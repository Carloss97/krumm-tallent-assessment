# PLAN DE RESPONSIVENESS PARA DISPOSITIVOS MÓVILES
## Krumm Talent Assessment - Demo Shell

---

## PROBLEMA IDENTIFICADO

La demo actual está optimizada para **desktop/tablets grandes**, con problemas en móviles:

❌ **LiveDemoTelemetryHud** 
   - Posición fija derecha (280px de ancho)
   - Tapa ~25-30% de pantalla en móviles
   - Minimizar aún ocupa espacio
   - No scroll-aware

❌ **Game Selection Screen**
   - Grid de 3+ columnas no adapta a móvil
   - Header padding/font sizes muy grandes
   - Botones demasiado grandes para dedos

❌ **Instructions Overlay**
   - Padding/max-width fijos (580px)
   - No usa viewport height en móviles
   - Scroll bloqueado pero texto puede no caber

❌ **Game Stage**
   - Altura calc(100% - 60px) sin ajustes móviles
   - Overflow hidden puede recortar juegos

---

## SOLUCIONES POR CATEGORÍA

### 1. TELEMETRY HUD (LiveDemoTelemetryHud.jsx + CSS)

**Desktop (>1024px):**
   - Posición: absolute right, top
   - Ancho: 280px (actual)
   - Visible por defecto
   - Minimizable

**Tablet (768px - 1024px):**
   - Posición: absolute right, top
   - Ancho: 240px
   - Minimizable por defecto
   - Vertical stack en collapse

**Móvil (<768px):**
   ✅ CAMBIO 1: Mover a BOTTOM (encima de game stage)
   ✅ CAMBIO 2: Ancho: 100% - 16px padding
   ✅ CAMBIO 3: Altura máxima: 120px (minimizado) / 200px (expandido)
   ✅ CAMBIO 4: Componente tab/chevron para expandir/colapsar
   ✅ CAMBIO 5: Z-index manejado para no bloquear juegos
   ✅ CAMBIO 6: Scrollable interno si es necesario

**Implementación:**
   - Detectar viewport width con useEffect/window.matchMedia
   - CSS media queries: @media (max-width: 768px)
   - Estado local isMinimized manejado mejor en móviles
   - Grid de pills → single row scroll en móviles

---

### 2. GAME SELECTION SCREEN (DemoShell.jsx)

**Cambios:**
   ✅ CAMBIO 1: Header padding dinámico
      - Desktop: 60px 40px
      - Tablet: 40px 24px
      - Móvil: 24px 16px, font-size 70% en móvil

   ✅ CAMBIO 2: Game cards layout responsive
      - Desktop: grid-template-columns: repeat(3, 1fr)
      - Tablet: repeat(2, 1fr)
      - Móvil: repeat(1, 1fr) con scroll-y

   ✅ CAMBIO 3: Game card sizing
      - Aspect ratio consistente (16:9 o 4:3)
      - Touch-friendly min-height: 80px botones

   ✅ CAMBIO 4: Botón "Continuar" sticky en móvil
      - Position: sticky bottom para no requerer scroll

---

### 3. INSTRUCTIONS OVERLAY (DemoShell.jsx + CSS)

**Cambios:**
   ✅ CAMBIO 1: Responsive padding en instructions-box
      - Desktop: padding 48px
      - Tablet: 32px
      - Móvil: 20px, con max-height: 80vh (evita overflow)

   ✅ CAMBIO 2: Font sizes responsive
      - h4: 1.5rem → 1.2rem móvil
      - p: 1.1rem → 0.95rem móvil
      - Mantener legibilidad

   ✅ CAMBIO 3: Botón "Comenzar" touch-friendly
      - Padding: 18px → 16px móvil
      - Min-height: 48px (standard touch target)

   ✅ CAMBIO 4: Scrollable en móvil si es necesario
      - max-height: 90vh
      - overflow-y: auto

---

### 4. GAME STAGE (DemoShell.jsx + CSS)

**Cambios:**
   ✅ CAMBIO 1: Viewport-aware height
      - height: calc(100% - 60px) → altura dinámica
      - Account for mobile browser chrome
      - Safe area insets (notch handling)

   ✅ CAMBIO 2: Responsive grid sizing para GridFlow/LaserPuzzle
      - Desktop: CELL = 60px, 10x10 grid
      - Tablet: CELL = 45px, 10x10 grid
      - Móvil: CELL = 30px, 10x10 grid (vertical scroll si es necesario)

   ✅ CAMBIO 3: Landscape support
      - Detectar orientación change
      - Ajustar layout dinámicamente

---

### 5. PERMISSION MODAL (DemoShell.jsx)

**Cambios:**
   ✅ CAMBIO 1: Responsive modal width
      - Desktop: max-width 500px
      - Móvil: full-width - 32px padding

   ✅ CAMBIO 2: Font sizes legibles
      - Mantener min-height: 48px botones

---

## ARCHIVOS A MODIFICAR

1. **src/components/LiveDemoTelemetryHud.jsx**
   - Agregar hook useMediaQuery
   - Condicional layout: móvil bottom vs desktop right
   - State para expanded/minimized móvil

2. **src/components/LiveDemoTelemetryHud.css**
   - Media queries @media (max-width: 768px)
   - Reposicionar: bottom 0 en móvil
   - Ajustar ancho, altura, grid layout

3. **src/components/DemoShell.jsx**
   - useMediaQuery hook para detectar viewport
   - Pasar isMobile a componentes hijo
   - Ajustar font sizes dinámicas

4. **src/components/DemoShell.css**
   - Media queries para selection header
   - Game cards responsive grid
   - Instructions responsive padding/sizing
   - Game stage responsive height

5. **src/games/GridFlowGame.jsx**
   - Detectar ancho pantalla
   - Ajustar CELL dinámicamente
   - Responsive GRID_SIZE si es necesario

6. **src/games/LaserPuzzleGame.jsx**
   - Similar a GridFlow
   - Detectar viewport width
   - Ajustar CELL dinámicamente

---

## ORDEN DE IMPLEMENTACIÓN

**Fase 1: Fundacional (Media Queries Base)**
   1. Crear utility hook: useMediaQuery (768px, 1024px breakpoints)
   2. Agregar media queries base en DemoShell.css
   3. Agregar media queries en LiveDemoTelemetryHud.css

**Fase 2: Telemetry HUD (Prioridad Alta)**
   1. Reposicionar a bottom en móvil
   2. Hacer minimizable por defecto en móvil
   3. Ajustar grid pills → horizontal scroll

**Fase 3: Selection Screen (Prioridad Alta)**
   1. Game cards responsive grid
   2. Header padding responsive
   3. Sticky continuar button

**Fase 4: Instructions & Modals (Prioridad Media)**
   1. Responsive padding/font
   2. Scrollable en móvil si necesario
   3. Touch targets >= 48px

**Fase 5: Game Stages (Prioridad Media)**
   1. Detectar viewport en GridFlowGame
   2. Ajustar CELL dinámicamente
   3. Detectar viewport en LaserPuzzleGame

**Fase 6: Polish (Prioridad Baja)**
   1. Landscape orientation handling
   2. Safe area insets (notch handling)
   3. Full keyboard accessibility

---

## TESTING CHECKLIST

✅ Viewport sizes a probar:
   - iPhone SE (375px)
   - iPhone 12/13 (390px)
   - iPhone 14 Pro Max (430px)
   - Samsung Galaxy A50 (390px)
   - iPad (768px)
   - iPad Pro (1024px+)

✅ Orientaciones:
   - Portrait
   - Landscape

✅ Funcionalidad:
   - Selection → Juego → Report en móvil
   - Telemetry HUD no bloquea interacción
   - Instrucciones legibles sin scroll excesivo
   - Game playable sin cropping

---

## NOTAS ADICIONALES

- Usar CSS Grid/Flexbox, no absolutes en móvil
- rem units escalables (no px absolutos)
- Touch targets mínimo 48px x 48px
- Viewport meta tag ya presente en index.html
- Safe area insets para notches: env(safe-area-inset-*)

**Título:** Urgente — Separar Portal de Postulantes + Color-Blocking + Demo Full-Width + Mejora de Copy (Home)

Resumen
------
Esta PR separa el flujo de postulantes del sitio comercial, añade color-blocking por secciones, extrae la demo a una franja full-width con mockup y CTA grande, y transforma bloques de casos en bullets con iconos. Se incluyen cambios frontend, nuevas rutas y estilos. Build y tests locales pasan.

Cambios principales
------------------
- `src/components/PortalButton.jsx` + `.css` — botón fijo `Dar mi Test` en esquina superior derecha; dispara evento analytics `portal_click`.
- `src/components/PostulantesLogin.jsx` + `.css` — nueva página minimalista de login para postulantes (ruta `/postulantes`).
- `src/components/DemoSection.jsx` + `.css` — franja full-width que carga `HeroDemo` en lazy, CTA `Vive la Experiencia` y evento `demo_open`.
- `src/components/LandingPageV3.jsx` + `.css` — secciones con clases de color-blocking (`.section--white`, `.section--gray`, `.section--brand-dark`) y casos de uso convertidos a icon + title + bullets.
- `src/styles/tokens.css` — variables nuevas: `--brand-dark`, `--accent-portal`, `--section-bg-*`.
- `src/styles/color-blocking.css` — helpers de color-blocking.
- `src/index.css` — importa `color-blocking.css`.
- `src/App.jsx` — añade ruta `/postulantes` y render `PortalButton` global.

Estado del build y pruebas
--------------------------
- `npm run build`: OK (Vite build completed).
- `npm test` (Vitest): OK — 23 test files, 66 tests passed.

Cómo probar localmente (rápido)
--------------------------------
1. Instalar dependencias (si no están):
```bash
npm install
```
2. Levantar dev (frontend + server):
```bash
npm run dev
```
3. Alternativamente construir y servir preview:
```bash
npm run build
npm run preview
```
4. Probar rutas y flags:
- Portal postulantes: abrir `http://localhost:5173/postulantes` (o configurar `VITE_PORTAL_URL` a `https://test.krumm.cl` para que el botón vaya al subdominio).
- Habilitar hero demo: exportar `VITE_ENABLE_HERO_DEMO=true` o usar feature-flag runtime.

Variables de entorno útiles
---------------------------
- `VITE_PORTAL_URL` — URL absoluta del portal candidato (ej. `https://test.krumm.cl`). Default: `/postulantes`.
- `VITE_ENABLE_HERO_DEMO` — `true` para mostrar demo en hero.

QA Checklist (Criterios de aceptación)
-------------------------------------
- Portal visibility: `Dar mi Test` visible y clicable en desktop/tablet/mobile; evento `portal_click` disparado.
- Login page: `/postulantes` carga página limpia sin contenido comercial, con token/RUT + contraseña y link recuperación.
- Color blocking: Home alterna fondos por sección con clases `.section--white`, `.section--gray`, `.section--brand-dark`; transiciones suaves entre secciones.
- Demo prominence: demo ocupa franja full-width en desktop; mockup visible; CTA centrada y accesible; evento `demo_open` disparado.
- Copy & cases: al menos 4 casos de uso en formato icon + title (dolor) + 2 bullets cada uno.
- Accessibility: botones y contraste cumplen AA (WCAG 2.1), navegación por teclado y foco visible.
- Performance: demo carga lazy; lighthouse mobile ideal >= 80 (si baja, optimizar lazy/placeholder).

Entregables en esta PR
----------------------
- Componentes: `PortalButton`, `PostulantesLogin`, `DemoSection`.
- Estilos: variables y helpers para color-blocking.
- Actualización de `LandingPageV3` para usar las nuevas clases y formato de casos.
- Instrucciones de prueba y checklist (este archivo).

Assets y dependencias faltantes (para QA/UX)
-------------------------------------------
- Confirmar **HEX exacto** de color oscuro de marca para `--brand-dark` (current: `#072b4a` provisional).
- Confirmar **HEX** para color secundario (accent) del botón portal `--accent-portal` (current: `#f39c12` provisional).
- Pack de íconos preferido (Material / Feather / custom SVG) para reemplazar placeholders.
- Subdominio `test.krumm.cl` y forwarding backend (si se quiere redirigir desde `/postulantes` al subdominio en producción).

Notas técnicas y decisiones
---------------------------
- `PortalButton` está implementado como `position: fixed` para garantizar visibilidad en todos los breakpoints y se oculta automáticamente cuando la ruta empieza con `/postulantes`.
- `PostulantesLogin` usa el mismo `authenticateParticipant` service; en ausencia de backend el flujo puede ser QA/local.
- `DemoSection` lazy-loads `HeroDemo` para minimizar impacto inicial.
- Se añadieron variables en `tokens.css` para mantener consistencia con el sistema de diseño.

Pruebas automatizadas
----------------------
- Tests unitarios ejecutados: `npm test` (Vitest) — TODOS PASAN.

Pasos siguientes / tickets dependientes
--------------------------------------
1. Confirmar colores y pack de íconos para pulir estilos.
2. Decidir si provisionamos `test.krumm.cl` o mantenemos `/postulantes` y crear ticket de infra.
3. Integración final de auth endpoint y pruebas E2E (si procede).

Solicito revisión en frontend + diseño: validar paleta (`--brand-dark`, `--accent-portal`) y mockup de demo (si se va a reemplazar por iframe o demo real).

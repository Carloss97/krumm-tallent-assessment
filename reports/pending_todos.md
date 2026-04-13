# Resumen automático de TODO/FIXME detectados

Este archivo lista los hallazgos rápidos de `TODO`, `FIXME` y tareas pendientes detectadas por un barrido del código. Está pensado para revisarlo y —si confirmas— crear issues en GitHub y/o limpiar ramas relacionadas.

Detectados (archivo → línea → extracto / sugerencia):

- **.github/agents/telemetry-biometric-simulation-qa.agent.md** ([.github/agents/telemetry-biometric-simulation-qa.agent.md](.github/agents/telemetry-biometric-simulation-qa.agent.md#L5))
  - Línea 5: `tools: [read, search, execute, todo]`
  - Sugerencia: revisar y documentar tareas pendientes del agente; posible issue: "Revisar y completar tareas del agente telemetry-biometric-simulation-qa"

- **.github/agents/qa-auditor-juegos-profesional.agent.md** ([.github/agents/qa-auditor-juegos-profesional.agent.md](.github/agents/qa-auditor-juegos-profesional.agent.md#L5))
  - Línea 5: `tools: [read, search, execute, todo]`
  - Sugerencia: crear issue para tareas abiertas del agente QA

- **.github/agents/hrtech-senior-fullstack.agent.md** ([.github/agents/hrtech-senior-fullstack.agent.md](.github/agents/hrtech-senior-fullstack.agent.md#L5))
  - Línea 5: `tools: [read, search, edit, execute, todo]`
  - Sugerencia: revisar y listar subtareas

- **.github/agents/edge-local-ia-hrtech.agent.md** ([.github/agents/edge-local-ia-hrtech.agent.md](.github/agents/edge-local-ia-hrtech.agent.md#L5))
  - Línea 5: `tools: [read, search, edit, execute, todo]`
  - Sugerencia: tareas de integración edge-local

- **.gemini/skills/openspec-propose/SKILL.md** ([.gemini/skills/openspec-propose/SKILL.md](.gemini/skills/openspec-propose/SKILL.md#L52))
  - Línea 52: "Use the **TodoWrite tool** to track progress through the artifacts."
  - Sugerencia: generar issue para integrar TodoWrite en flujo de trabajo

- **corfo/01-roadmap-trl3-trl4-90-dias.md** ([corfo/01-roadmap-trl3-trl4-90-dias.md](corfo/01-roadmap-trl3-trl4-90-dias.md#L82))
  - Línea 82: "Decision log unico: todo cambio de scope o KPI queda registrado..."
  - Sugerencia: crear issue para definir proceso de decision log

- **corfo/03-kpis-hrtech-y-medicion.md** ([corfo/03-kpis-hrtech-y-medicion.md](corfo/03-kpis-hrtech-y-medicion.md#L59))
  - Línea 59: "Todo KPI informado debe incluir: periodo, N, fuente y limitacion."
  - Sugerencia: checklist/issue para estandarizar KPIs

- **ESLINT_ANALYSIS.md** ([ESLINT_ANALYSIS.md](ESLINT_ANALYSIS.md#L407))
  - Línea 407: "- Limpiar todos los imports `motion` de archivos de juegos"
  - Sugerencia: issue técnico para limpiar imports obsoletos

- **ESLINT_ANALYSIS_DETAILED.md** ([ESLINT_ANALYSIS_DETAILED.md](ESLINT_ANALYSIS_DETAILED.md#L184))
  - Línea 184: "// Calcular todos los valores primero"
  - Sugerencia: revisar cálculo de valores en análisis detallado

- **ESLINT_ANALYSIS_DETAILED.md** ([ESLINT_ANALYSIS_DETAILED.md](ESLINT_ANALYSIS_DETAILED.md#L191))
  - Línea 191: "// Actualizar todo en una funcionalidad lógica"
  - Sugerencia: issue para agrupación y refactor del análisis

- **GAME_SPECS_V2.md** ([GAME_SPECS_V2.md](GAME_SPECS_V2.md#L449))
  - Línea 449: "Accesibilidad: Todos los juegos accesibles con teclado + mouse..."
  - Sugerencia: checklist accesibilidad, issue por juego

- **PHASE2_ACTION_PLAN.md** ([PHASE2_ACTION_PLAN.md](PHASE2_ACTION_PLAN.md#L26))
  - Línea 26: "Todos con estructura básica funcional"
  - Sugerencia: validar y convertir en issues de QA

- **PHASE2_ACTION_PLAN.md** ([PHASE2_ACTION_PLAN.md](PHASE2_ACTION_PLAN.md#L212))
  - Línea 212: "- [ ] Demo mode maneja todo (sin webcam si no consiente)"
  - Sugerencia: issue/tarea con checkbox ya indicada en el doc

- **src/games/ComplementaryGames.jsx** ([src/games/ComplementaryGames.jsx](src/games/ComplementaryGames.jsx#L93))
  - Línea 93: Texto localizado que puede requerir revisión UX
  - Sugerencia: revisar texto y consistencia de localización

- **src/games/HRRHGames.jsx** ([src/games/HRRHGames.jsx](src/games/HRRHGames.jsx#L640))
  - Línea 640: Lista de opciones en español — revisar redacción
  - Sugerencia: UX copy review issue


---
Resumen: se detectaron 20 coincidencias (fichero/linea). He creado este reporte en `reports/pending_todos.md`.

Siguientes pasos recomendados (elige):
- [ ] Crear issues en GitHub para cada ítem listado (agrupados por archivo)
- [ ] Crear una etiqueta `automated:todo` y asignar a los issues creados
- [ ] Listar ramas remotas fusionadas y proponer borrado (revisión manual antes de borrar)
- [ ] Archivar/etiquetar issues cerrados antiguos

Escribe “crear issues” para que proceda a crear los issues en GitHub, o “proponer borrado” para que genere la lista de ramas remotas fusionadas aptas para borrar.

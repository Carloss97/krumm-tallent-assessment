# KRUMM Talent Assessment

Plataforma React/Vite + Express para presentar KRUMM, ejecutar una demo pública, mostrar el pitch deck y correr una batería de juegos cognitivos.

## Lo esencial del producto

- **Página pública**: `/` con propuesta de valor, CTA y entrada a demo/pitch.
- **Demo**: `/demo` con experiencia guiada y reporte teaser.
- **Pitch deck**: `/pitch`, embebido desde `src/assets/pitchdeck.html`.
- **Evaluación completa**: rutas de juegos definidas en `src/utils/gameFlow.js` y shell común en `src/components/GameShell.jsx`.
- **Reportes**: `/report` con inferencia local edge-first y fallback Gemini configurable.
- **Portales**: `/postulantes`, `/recruiter/login`, `/recruiter/dashboard`.

## Stack

- React 19 + Vite 8
- Express 5
- SQLite local por defecto; Postgres si existe `DATABASE_URL`
- Vitest + Testing Library
- ONNX Runtime Web para inferencia local del reporte demo

## Comandos

```bash
npm install
npm run dev              # frontend + backend; Vite en 5174 por script
npm run dev:frontend     # solo Vite; usa vite.config.js
npm run dev:server       # solo Express; puerto 4000 por defecto
npm test                 # tests
npm run lint             # ESLint
npm run build            # build frontend
npm run security:audit   # npm audit high+
```

## Variables de entorno mínimas

Copia el ejemplo que corresponda y ajusta sólo lo necesario:

```bash
cp .env.example .env.local
```

Frontend relevantes:

- `VITE_API_BASE_URL`: URL del backend cuando no se usa proxy local.
- `VITE_BASE_PATH`: basename del router si se despliega bajo subruta.
- `VITE_ALLOWED_DEV_HOSTS`: hosts permitidos para accesos de desarrollo.
- `VITE_USE_EDGE_LOCAL_INFERENCE`: `false` para desactivar inferencia local.
- `VITE_ENABLE_GEMINI_FALLBACK`: `true` para permitir fallback remoto.
- `VITE_USE_BACKEND_GEMINI_PROXY`: `true` para usar el proxy backend de Gemini.
- `VITE_GOOGLE_API_KEY`: sólo para fallback frontend controlado; preferir backend.

Backend relevantes:

- `PORT`: puerto Express, por defecto `4000`.
- `JWT_SECRET_KEY`: obligatorio en producción, mínimo 32 caracteres.
- `ALLOWED_ORIGINS`: orígenes permitidos por CORS.
- `GEMINI_API_KEY` / `GEMINI_MODEL`: reportes con Gemini desde backend.
- `DATABASE_URL`: activa Postgres; si no existe, usa SQLite local.
- `PARTICIPANT_ACCESS_CODE`, `RECRUITER_EMAIL`, `RECRUITER_PASSWORD`: acceso a portales.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: rate limiting distribuido opcional.

## Estructura viva

```text
src/
  assets/                 pitch deck y logo
  components/             landing, demo, shell, dashboards y UI compartida
  components/demo/        minijuegos/demo auxiliares
  games/                  juegos de la evaluación completa
  services/               backend, reportes, inferencia local
  utils/                  flujo, i18n y authoring de niveles
server/                   API Express, auth, DB, métricas y middleware
public/models/            modelo ONNX local y metadata
scripts/                  utilidades de build/postinstall
```

## Juegos priorizados del test completo y telemetría

Primera pasada implementada sobre juegos con respaldo psicométrico/documental claro y alto valor para talentos cognitivos/conductuales:

| Juego | Constructo principal | Métricas finales | Eventos por trial |
| --- | --- | --- | --- |
| OSPAN (`ospan_game_1`) | memoria de trabajo dual-task | `operationAccuracy`, `recallAccuracy`, `workingMemorySpan`, `totalTrials` | respuesta a operación con estímulo, respuesta esperada, corrección, RT y marcador `processing_hit/error` |
| Stop-Signal (`sst_game_2`) | inhibición de respuesta / control impulsivo | `correctGo`, `correctStop`, `accuracy`, errores de comisión/omisión | `GO/STOP`, acción `press/withhold`, esperado, corrección y marcador `commission_error`, `omission_error`, `successful_inhibition` |
| Task Switching (`tsw_game_3`) | flexibilidad cognitiva / cambio de regla | accuracy, errores de aplicación de regla, RT | regla activa, estímulo color/forma, respuesta, esperado y marcador `rule_applied/error` |

La taxonomía viva está en `src/utils/assessmentTelemetry.js`:

- `ASSESSMENT_TELEMETRY_SCHEMA`: catálogo versionado de juegos, constructos, dominios de talento y métricas núcleo.
- `buildAssessmentTrialEvent(gameId, event)`: normaliza eventos por trial con forma estable:

```js
{
  event: 'assessment_trial_response',
  schemaVersion: 'talent-telemetry-v1',
  gameId: 'sst_game_2',
  talentDomain: 'cognitive-behavioural',
  primaryConstruct: 'response_inhibition',
  phase: 'response',
  trialIndex: 1,
  stimulus: { signal: 'STOP' },
  response: { action: 'press' },
  expected: { action: 'withhold' },
  isCorrect: false,
  reactionTimeMs: 312,
  behaviouralMarkers: ['commission_error'],
}
```

Tests de telemetría priorizada:

```bash
npm test -- src/utils/assessmentTelemetry.test.js src/games/OSPANGame.test.jsx src/games/HRRHGames.test.jsx
```

## Algoritmo para introducir niveles externos

El módulo `src/utils/demoLevelAuthoring.js` normaliza niveles diseñados fuera del código y los convierte al formato que consumen juegos como GridFlow y LaserPuzzle. Para introducir varios niveles a la vez, usa `createDemoLevelPacks()` con un catálogo JSON/objeto que contenga `gridFlow` y/o `laserPuzzle`.

Objetivo del flujo:

1. Diseñar el nivel externamente como coordenadas simples (`[x, y]`).
2. Describir muros como rectángulos/celdas.
3. Marcar piezas clave: inicio, paquetes, destinos, estaciones, emisor, antenas, espejos, portales, etc.
4. Ejecutar el importador, que valida bounds, expande muros, evita tapar celdas reservadas y genera el objeto final del juego.
5. Correr tests de invariantes/solvabilidad antes de meterlo a la demo.

### GridFlow

```js
import { createGridFlowLevel } from './src/utils/demoLevelAuthoring.js';

const level = createGridFlowLevel({
  name: 'Sector propio 2',
  difficulty: 'hard',
  cols: 12,
  rows: 10,
  start: [0, 9],
  stations: [[6, 5]],
  targets: [
    { id: 'red', pickup: [1, 1], drop: [10, 8], color: '#ef4444', points: 120 },
    { id: 'blue', pickup: [10, 1], drop: [1, 8], color: '#3b82f6', points: 140 },
  ],
  walls: {
    rects: [[3, 0, 4, 5], [7, 4, 8, 9]],
    cells: [[5, 5]],
  },
  timeLimit: 70,
  energyDrain: 1.1,
});
```

Salida compatible: `{ cols, rows, startPos, stations, targets, walls, timeLimit, energyDrain }`.

### LaserPuzzle

```js
import { createLaserPuzzleLevel } from './src/utils/demoLevelAuthoring.js';

const level = createLaserPuzzleLevel({
  name: 'Haz propio 3',
  difficulty: 'hard',
  cols: 14,
  rows: 11,
  par: 7,
  objects: [
    { type: 'ship', at: [0, 5], dir: 'right' },
    { type: 'antenna', at: [13, 3] },
    { type: 'reflector_ne', at: [2, 9], movable: true },
    { type: 'bifurcator', at: [4, 9], movable: true },
  ],
  walls: { rects: [[2, 0, 3, 3]], cells: [[8, 5]] },
  solution: [
    { from: [2, 9], to: [5, 5] },
    [[4, 9], [8, 5]],
  ],
  hint: { es: 'Ubica primero el bifurcador.', en: 'Place the splitter first.' },
});
```

Salida compatible: `{ cols, rows, par, cells, solutionPlacements, hint, quiz }`.

Tests del importador:

```bash
npm test -- src/utils/demoLevelAuthoring.test.js
```

Formato de catálogo para meter niveles de los juegos 2 y 3 en lote:

```js
import { createDemoLevelPacks } from './src/utils/demoLevelAuthoring.js';

const packs = createDemoLevelPacks({
  schemaVersion: 1,
  gridFlow: [/* specs GridFlow como el ejemplo anterior */],
  laserPuzzle: [/* specs LaserPuzzle como el ejemplo anterior */],
});

// packs.gridFlow y packs.laserPuzzle ya salen validados y listos para el juego.
```

Para niveles nuevos de demo, añadir un test que verifique que las celdas de solución no quedan bloqueadas y que el nivel no nace resuelto accidentalmente.

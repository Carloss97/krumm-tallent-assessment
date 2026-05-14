# Plan — Krumm Talent Assessment: telemetría facial local + telemetría cognitivo-conductual

Fecha: 2026-05-13 16:12:23  
Proyecto: `/mnt/c/Users/sarlo/OneDrive/Escritorio/Proyectos/test`  
Repo/app: `krumm-talent-assessment` — React/Vite + Express, experiencia gamificada de evaluación.

## 1. Objetivo del proyecto

Construir una capa de captura e interpretación local en navegador para Krumm Talent Assessment que combine:

1. **Resultados cognitivos de juegos**: accuracy, reacción, errores, consistencia, score por tarea, tiempos, cambios de estrategia.
2. **Telemetría conductual de interacción**: cursor, clicks, pausas, hesitación, ritmo, foco/progreso por trial.
3. **Telemetría facial local**: presencia de rostro, calidad de señal, orientación de cabeza, parpadeo, estabilidad visual y señales derivadas de landmarks/blendshapes.

El requisito central es que **el video nunca salga del navegador del candidato**. El browser procesa frames localmente, descarta pixels/video y solo conserva/envía **metadata agregada, no reconstructiva y con score de calidad/confianza**.

El producto final debe generar reportes que separen claramente:

- Observaciones medibles.
- Métricas derivadas/proxies.
- Interpretación cautelosa con incertidumbre.
- Advertencias de baja calidad de señal.

No debe presentarse como lectura mental, detección de mentira, diagnóstico psicológico ni criterio único de contratación.

## 2. Contexto actual observado en el repo

### Stack actual

- `package.json`:
  - React `^19.2.4`, Vite `^8.0.0`.
  - `onnxruntime-web ^1.25.1` ya instalado.
  - Scripts disponibles: `npm run dev`, `npm run build`, `npm run lint`, `npm run test`, `npm run model:build`.
- Backend Express en `server/index.js`.
- Persistencia de sesiones vía `/api/session` con `server/validators.js` permisivo para `sessionData`.

### Telemetría existente

- `src/TelemetryContext.jsx`
  - Ya captura cursor/clicks con consentimiento.
  - Tiene `webcamFrames`, `webcamQualityScore`, `qualityFlags`.
  - Expone `recordWebcamFrame`, `getCurrentTelemetry`, `stopTracking`.
- `src/components/ConsentModal.jsx`
  - Ya tiene consentimiento granular para cursor y webcam.
  - Webcam está desactivada por defecto.
- `src/components/GameShellCore.jsx`
  - Integra `useWebcamCapture` cuando `isActive && consentState.webcam && featureFlags.enableWebcamTracking`.
- `src/hooks/useWebcamCapture.js`
  - Inicializa `WebcamCapture` y llama `recordWebcamFrame`.
- `src/utils/webcamCapture.js`
  - Implementa heurísticas simples sobre pixels: luminancia, “skin pixels”, blink por brillo, head pose aproximado.
  - Es útil como placeholder, pero no es suficientemente confiable para producto.
- `src/services/edgeLocalInferenceService.js` y `src/workers/onnxWorker.js`
  - Ya existe camino conceptual para inferencia local en WebWorker + ONNX fallback.
  - Hoy el modelo/report es más bien PoC/heurístico y trabaja con features agregadas simples.
- `src/components/LiveDemoTelemetryHud.jsx`
  - Visualiza señales en vivo basadas en la telemetría actual.

### Juegos / experiencia gamificada

- `src/utils/gameFlow.js` define 13 módulos:
  - OSPAN, Stop Signal, Task Switching, Balloon Risk, decisiones, Grid Flow, Laser Puzzle, módulos complementarios de metacognición, priorización, learning agility, coordinación social, resiliencia, riesgo.
- Esta estructura es buena para unir señales faciales/telemetría con eventos por trial y estado cognitivo de la tarea.

## 3. Principio arquitectónico

Separar el sistema en cuatro capas:

```text
Capa A — Captura local
  Webcam + cursor + eventos del juego

Capa B — Extracción local de features
  Face landmarks/blendshapes/head pose + calidad de imagen + cursor metrics + trial metrics

Capa C — Agregación por ventanas
  Ventanas de 5s y resumen por juego; descarta frames/pixels; conserva metadata no reconstructiva

Capa D — Inferencia/reporte
  Modelo local futuro + heurísticas calibradas + reporte con confianza y disclaimers
```

El primer hito debe concentrarse en A+B+C. No conviene entrenar ni prometer un modelo serio antes de tener features estables y medibles.

## 4. Roadmap propuesto

### Hito 1 — Facial Telemetry Local v1 + schema de metadata

**Objetivo:** reemplazar la captura facial heurística por extracción local robusta con MediaPipe Face Landmarker, generar ventanas agregadas cada 5 segundos, integrar esas ventanas con la telemetría de juegos y mostrar/validar el payload sin enviar video.

Resultado esperado:

- El candidato acepta consentimiento de webcam.
- El navegador abre cámara durante los juegos.
- La app procesa frames localmente a baja frecuencia controlada.
- Se extraen landmarks/blendshapes/head pose localmente.
- Se agregan métricas no reconstructivas en ventanas de 5s.
- `TelemetryContext` guarda `facialWindows`/`webcamWindows` agregadas, no frames por pixel.
- `LiveDemoTelemetryHud` muestra calidad/señales básicas.
- El reporte recibe un `signalAudit` más honesto: cobertura, calidad, presencia, estabilidad.
- Se verifica que ninguna imagen/video/frame sale por red.

### Hito 2 — Feature fusion cognitivo-conductual por juego

Unificar por `gameId` y `trialId`:

- resultados de juego,
- eventos por trial,
- cursor metrics,
- facial windows,
- quality flags.

Salida: `assessmentFeatureVectorV1` por juego y sesión.

### Hito 3 — Modelo local baseline interpretable

Entrenar un primer modelo pequeño offline con datos propios o dataset piloto:

- input: features agregadas, no video,
- output: métricas como engagement stability, cognitive load proxy, task regulation proxy,
- export ONNX,
- correr en `onnxWorker.js`,
- comparar contra heurística actual.

### Hito 4 — Dataset/labeling pipeline

Diseñar protocolo de captura, consentimiento, etiquetado, inter-rater agreement, fairness audit y validación psicométrica mínima.

### Hito 5 — Reporte final calibrado

Reporte con:

- observables,
- métricas derivadas,
- confidence intervals,
- quality caveats,
- comparación con baseline por tarea,
- lenguaje apto para revisión humana.

## 5. Hito 1 detallado

### 5.1 Alcance incluido

1. Integrar **MediaPipe Tasks Vision / Face Landmarker** en browser.
2. Procesar frames localmente, idealmente en un módulo aislado y luego Worker.
3. Reemplazar/encapsular `src/utils/webcamCapture.js` para que deje de basarse en heurísticas de color de piel.
4. Agregar ventanas de 5s con métricas faciales agregadas.
5. Reducir volumen de telemetry: no guardar 30 fps en `webcamFrames`; guardar ventanas agregadas y muestras diagnósticas muy pequeñas si hace falta.
6. Agregar schema/documento `facialTelemetrySchemaV1`.
7. Integrar output con `TelemetryContext`, HUD y reporte edge-local existente.
8. Agregar tests unitarios de agregación/schema y fallback sin cámara/MediaPipe.
9. Validar build/lint/test.

### 5.2 Fuera de alcance del Hito 1

- Entrenar un modelo real.
- Inferir personalidad, inteligencia, honestidad, salud mental o “fit” definitivo desde microgestos.
- Mandar video, imágenes, frames o landmarks completos al backend.
- Hacer scoring automático de contratación.
- Usar audio/micrófono.
- Publicar métricas faciales como determinísticas.

## 6. Diseño técnico del Hito 1

### 6.1 Dependencia recomendada

Agregar:

```bash
npm install @mediapipe/tasks-vision
```

Alternativa si el bundle crece demasiado: cargar assets desde `public/vendor/mediapipe/` y usar configuración explícita de WASM/modelos.

### 6.2 Archivos probables a modificar/crear

#### Crear

- `src/telemetry/facial/faceLandmarkerClient.js`
  - Carga MediaPipe FaceLandmarker.
  - Configura `runningMode: 'VIDEO'`.
  - Activa `outputFaceBlendshapes: true`.
  - Activa `outputFacialTransformationMatrixes: true` si está disponible.
  - Expone `initialize()`, `detect(video, timestampMs)`, `dispose()`.

- `src/telemetry/facial/facialFeatureExtractor.js`
  - Convierte resultado MediaPipe en features por frame:
    - `facePresent`
    - `detectionConfidence`
    - `blendshapes.eyeBlinkLeft/right`
    - `blendshapes.browDown/up`, `jawOpen`, etc. solo si se usan como agregados
    - `headPoseYaw/Pitch/Roll` derivado de transformation matrix cuando sea confiable
    - `landmarkConfidence`/`faceCount`
  - Nunca retorna imagen ni landmarks completos para persistencia.

- `src/telemetry/facial/facialWindowAggregator.js`
  - Agrega frames a ventanas de 5s.
  - Calcula coverage, blink rate, head pose stability, face absence ratio, quality flags.
  - Emite `facial_window_v1`.

- `src/telemetry/facial/facialTelemetrySchema.js`
  - Define schema/constantes de payload v1.
  - Puede usarse para validación simple en frontend y tests.

- `src/telemetry/facial/facialTelemetry.test.js`
  - Tests de agregación con frames sintéticos.

- Opcional: `src/workers/facialTelemetryWorker.js`
  - Si el rendimiento inicial se degrada, mover detección/agregación a worker.
  - Para Hito 1 se puede postergar si MediaPipe en main thread a 5-10 fps va fluido.

#### Modificar

- `src/utils/webcamCapture.js`
  - Transformarlo de heurística pixel-based a orquestador de cámara + analyzer.
  - Bajar sampling rate: 5-10 fps, no 30 fps.
  - Emitir ventanas agregadas o snapshots feature-only.
  - Mantener fallback heurístico solo como `source: 'legacy_heuristic_fallback'` y baja confianza.

- `src/hooks/useWebcamCapture.js`
  - Aceptar opciones: `sampleFps`, `windowMs`, `gameId`, `debug`.
  - Propagar errores/quality flags hacia `TelemetryContext`.

- `src/TelemetryContext.jsx`
  - Cambiar estructura de `currentDataRef.current`:
    - de `webcamFrames: []` a `facialWindows: []` o `webcamWindows: []`.
    - mantener `webcamFrames` solo como contador o compatibilidad temporal.
  - `recordWebcamFrame` podría renombrarse luego a `recordFacialWindow`, pero en Hito 1 se puede mantener adapter para no romper llamadas.
  - Añadir quality flags específicas:
    - `camera_denied`
    - `face_not_detected`
    - `low_light`
    - `low_detection_confidence`
    - `multiple_faces_detected`
    - `insufficient_facial_coverage`
    - `facial_model_unavailable`

- `src/components/GameShellCore.jsx`
  - Pasar `gameId`/`telemetryId` a `useWebcamCapture` para asociar ventanas al juego actual.

- `src/components/LiveDemoTelemetryHud.jsx`
  - Mostrar:
    - `Face %`
    - `Signal %`
    - `Blink/min` o `Visual stability`
    - flags de baja calidad.
  - Cambiar copy para que diga “señales locales observables”, no “aptitud” como inferencia fuerte.

- `src/services/edgeLocalInferenceService.js`
  - Calcular `biometricSignalQualityScore` desde `facialWindows` agregadas.
  - No usar `webcamQualityScore` único como si fuese suficiente.

- `src/Report.jsx`
  - Mostrar audit de señal si existe.
  - Si `facialCoverage < threshold`, degradar confianza y mostrar caveat.

- `server/validators.js`
  - Opcional en Hito 1: aceptar explícitamente `facialTelemetryVersion`, `facialWindows`, `qualityFlags` si se quiere mayor validación.
  - Hoy `additionalProperties: true` permite avanzar sin bloqueo.

### 6.3 Schema propuesto: `facial_window_v1`

Ejemplo de ventana cada 5s:

```json
{
  "type": "facial_window_v1",
  "version": "1.0.0",
  "sessionId": "local-session-id-or-participant-derived-id",
  "gameId": "sst_game_2",
  "windowIndex": 3,
  "startedAtMs": 15000,
  "endedAtMs": 20000,
  "durationMs": 5000,
  "sampleCount": 38,
  "source": "mediapipe_face_landmarker",
  "privacy": {
    "rawVideoStored": false,
    "rawFramesStored": false,
    "landmarksStored": false,
    "audioCaptured": false
  },
  "quality": {
    "facePresenceRatio": 0.94,
    "meanDetectionConfidence": 0.88,
    "meanIlluminationScore": 0.76,
    "signalQualityScore": 82,
    "multipleFaceRatio": 0,
    "flags": []
  },
  "facialSignals": {
    "blinkRatePerMin": 18,
    "blinkAsymmetryMean": 0.04,
    "headPose": {
      "yawMeanDeg": 3.2,
      "pitchMeanDeg": -1.4,
      "rollMeanDeg": 0.7,
      "yawStdDeg": 4.8,
      "pitchStdDeg": 3.1,
      "rollStdDeg": 2.2
    },
    "visualStabilityScore": 78,
    "offScreenOrFaceAwayRatio": 0.08
  },
  "derivedProxies": {
    "attentionStabilityProxy": 74,
    "cognitiveLoadProxy": null,
    "fatigueProxy": null
  },
  "confidence": {
    "windowConfidence": 0.81,
    "interpretationAllowed": true,
    "reasonIfLowConfidence": null
  }
}
```

Notas:

- `derivedProxies` puede ir `null` hasta tener calibración. Mejor nulo honesto que pseudociencia.
- `landmarksStored: false` es intencional: landmarks densos pueden ser biométricos/reconstructivos.
- Si se necesita debug local, que sea detrás de flag dev y sin persistir.

### 6.4 Sampling/performance

Presupuesto inicial:

- Captura de video: resolución ideal 640x480 o 720p como máximo.
- Detección facial: 5-10 fps, no 30 fps.
- Agregación: ventana de 5s.
- UI/HUD: update 1 Hz.
- Inferencia local futura: <100ms por ventana o por resumen de juego.
- Main thread: evitar stutter visible en juegos; si hay stutter, mover a Worker/OffscreenCanvas.

### 6.5 Privacidad por diseño

Reglas del Hito 1:

1. No guardar `ImageData` en objetos de sesión.
2. No serializar `canvas`, `blob`, `base64`, `video.srcObject`, landmarks completos o frames.
3. No enviar datos de webcam a `/api/telemetry`; solo ventanas agregadas al guardar sesión/report si corresponde.
4. Consentimiento granular webcam separado de cursor.
5. Si cámara es denegada, continuar evaluación con cursor/game telemetry y marcar `no_webcam_consent` o `camera_denied`.
6. Si calidad baja, degradar confianza del reporte.

## 7. Primer hito como backlog accionable

### Tarea 1 — Baseline de estructura y contratos

- Crear carpeta `src/telemetry/facial/`.
- Crear `facialTelemetrySchema.js` con tipos/constantes y helper `createEmptyFacialWindow()`.
- Crear tests unitarios del schema/agregador.

Criterio de aceptación:

- `npm run test -- facialTelemetry` pasa.
- El schema no contiene campos capaces de reconstruir imagen.

### Tarea 2 — MediaPipe FaceLandmarker client

- Instalar `@mediapipe/tasks-vision`.
- Crear `faceLandmarkerClient.js`.
- Resolver modelos/WASM desde ruta estable.
- Fallback si no carga: retornar `facial_model_unavailable`.

Criterio de aceptación:

- En navegador, con webcam permitida, se obtienen detecciones en consola/dev HUD.
- Si MediaPipe falla, la app no crashea.

### Tarea 3 — Feature extractor local

- Implementar mapping de blendshapes a features por frame.
- Normalizar head pose.
- Calcular calidad mínima sin guardar pixels.
- No persistir landmarks completos.

Criterio de aceptación:

- Un frame produce un objeto pequeño y serializable.
- No contiene arrays grandes de landmarks.

### Tarea 4 — Window aggregator 5s

- Implementar agregador de ventanas.
- Métricas mínimas:
  - `facePresenceRatio`
  - `meanDetectionConfidence`
  - `signalQualityScore`
  - `blinkRatePerMin`
  - `headPose mean/std`
  - `visualStabilityScore`
  - `offScreenOrFaceAwayRatio`
  - `flags`
- Tests con frames sintéticos.

Criterio de aceptación:

- Con 50 samples sintéticos genera 1 ventana válida.
- Con baja presencia facial marca `insufficient_facial_coverage`.

### Tarea 5 — Integración con `WebcamCapture`

- Refactorizar `src/utils/webcamCapture.js`:
  - abrir cámara,
  - correr analyzer a `sampleFps`,
  - mandar ventanas por callback.
- Mantener API compatible con `useWebcamCapture`.
- Agregar cleanup robusto.

Criterio de aceptación:

- Al iniciar un juego con consentimiento, `TelemetryContext` recibe ventanas, no frames 30fps.
- Al cambiar de juego o salir, la cámara se apaga.

### Tarea 6 — Integración con `TelemetryContext`

- Agregar `facialWindows: []` a `currentDataRef.current`.
- Adaptar `recordWebcamFrame` para aceptar:
  - eventos legacy frame-level, o
  - nueva ventana `type: facial_window_v1`.
- Actualizar `webcamQualityScore` desde promedio de ventanas.
- Agregar flags de calidad.

Criterio de aceptación:

- `stopTracking()` incluye `facialWindows` y `webcamQualityScore` agregado.
- No se guarda `ImageData` ni objetos no serializables.

### Tarea 7 — HUD y reporte audit-only

- Actualizar `LiveDemoTelemetryHud.jsx` para mostrar señal facial local sin claims fuertes.
- Actualizar `edgeLocalInferenceService.js` para calcular `biometricSignalQualityScore` desde ventanas.
- `Report.jsx` debe mostrar caveat si calidad/cobertura baja.

Criterio de aceptación:

- El candidato/reclutador ve calidad de señal, no una conclusión psicológica automática.
- Si webcam está deshabilitada, reporte sigue funcionando con menor confianza.

### Tarea 8 — Validación de privacidad/red

- Confirmar por inspección de código que no hay envío de frames.
- En ejecución local, abrir Network panel y verificar que `/api/session` no contiene frames/base64/landmarks completos.
- Agregar test utilitario que falle si payload serializado contiene claves prohibidas: `imageData`, `pixels`, `frame`, `canvas`, `base64`, `landmarks`.

Criterio de aceptación:

- Payload de sesión contiene solo ventanas agregadas.
- No hay blobs/base64/imágenes en JSON.

## 8. Validación técnica sugerida

Comandos al terminar implementación:

```bash
npm run lint
npm run test
npm run build
```

Tests específicos a crear/correr:

```bash
npm run test -- facialTelemetry
npm run test -- edgeLocalInferenceService
npm run test -- aiReportService
```

Prueba manual:

1. `npm run dev`.
2. Abrir `http://localhost:5174/game/1` o flujo candidato.
3. Aceptar cursor + webcam.
4. Completar 1-2 minutos de juego.
5. Ver HUD con `Face %`, `Signal %`, ventanas y flags.
6. Ir a report.
7. Inspeccionar `sessionData` y network payload.
8. Confirmar:
   - cámara se apaga al salir,
   - no hay video/frame/base64,
   - reporte degrada confianza si cobertura baja.

## 9. Riesgos y decisiones

### Riesgo: claims excesivos

Mitigación:

- En Hito 1 solo audit/quality/señales observables.
- Proxies como `cognitiveLoadProxy` quedan `null` o marcados experimental.

### Riesgo: sesgo facial/iluminación/dispositivo

Mitigación:

- Medir cobertura y calidad.
- Degradar confianza automáticamente.
- No penalizar al candidato por cámara mala; registrar caveat.

### Riesgo: performance

Mitigación:

- 5-10 fps.
- Ventanas de 5s.
- Worker si main thread afecta juegos.

### Riesgo: landmarks como biometría

Mitigación:

- No persistir landmarks completos.
- Solo agregados estadísticos.
- Debug local y temporal bajo flag dev.

### Riesgo: modelo sin dataset validado

Mitigación:

- No entrenar hasta tener feature schema estable.
- Hito posterior dedicado a dataset/labeling y validación.

## 10. Preguntas abiertas

1. ¿El flujo principal a instrumentar primero será `/game/*` completo, `/demo`, o portal de postulantes?
2. ¿Queremos permitir webcam en demo pública o mantener demo sin cámara y probar solo en flujo candidato privado?
3. ¿Qué retención de metadata agregada se quiere para sesiones reales: 30 días como dice el modal, menos, o configurable por cliente?
4. ¿Habrá un privacy policy/legal copy específico para Chile/LatAm/GDPR antes de habilitar webcam en producción?
5. ¿El backend debe rechazar payloads con campos prohibidos para reforzar privacidad?

## 11. Recomendación inmediata

Comenzar implementando **Hito 1 / Tareas 1-4** en una rama separada:

```bash
git checkout -b feature/facial-telemetry-v1
```

Pero antes de tocar código, definir el contrato `facial_window_v1` y tests de agregación. Eso evita contaminar el sistema con frames crudos y deja claro qué puede viajar al reporte/backend.

Entregable del primer sprint:

- `facialTelemetrySchema.js`
- `facialWindowAggregator.js`
- tests de agregación/privacidad
- integración mínima en `WebcamCapture` detrás de feature flag
- HUD mostrando señal facial local agregada

Criterio de éxito del Hito 1:

> En una sesión gamificada de 3 minutos, Krumm genera 30-40 ventanas faciales agregadas localmente, combinables con telemetry de juego/cursor, sin enviar video ni frames al servidor, con degradación explícita de confianza cuando la señal es mala.

## 12. Estado de limpieza y siguientes pasos posteriores a Tarea 7

Fecha de actualización: 2026-05-13.

### 12.1 Limpieza técnica aplicada

- `facial_window_v1` ahora tiene guardas explícitas para payloads completos, no solo para ventanas individuales.
- `Report.jsx` valida el payload justo antes de persistirlo con `saveSessionToBackend`; si aparece `rawFrame`, `imageData`, `base64`, `faceLandmarks`, `landmarks`, `srcObject` u otro campo prohibido, bloquea el envío.
- `TelemetryContext.jsx` valida eventos livianos antes de almacenarlos o enviarlos como telemetría demo.
- `WebcamCapture.cleanup()` libera cámara/modelo/timers aunque una ventana pendiente falle validación de privacidad.
- `recordWebcamFrame()` acepta una ventana facial final emitida inmediatamente después de `stopTracking()` para no perder el flush de cleanup, con ventana temporal corta y deduplicación por clave.
- Los tests cubren factory/schema, payload serializado, bloqueo de persistencia insegura, flush tardío, cleanup robusto y auditoría cautelosa de baja cobertura.

### 12.2 Tarea 8 — validación de privacidad/red

Estado: implementada a nivel de código/tests; queda pendiente la comprobación manual en navegador real.

Criterios ya cubiertos:

- Payload de sesión se valida antes de red.
- Tests fallan si aparece metadata reconstructiva o raw: frames, pixels, canvas, blobs/base64, landmarks completos o `srcObject`.
- La telemetría facial enviada al contexto/reporte queda como ventanas agregadas `facial_window_v1`.

Validación manual pendiente:

1. Ejecutar `npm run dev`.
2. Completar una sesión con consentimiento de webcam.
3. Revisar Network panel para `/api/session` y confirmar ausencia de video/frame/base64/landmarks.
4. Confirmar visualmente que el LED/captura de cámara se apaga al cambiar de juego, salir o llegar a reporte.
5. Verificar que la app degrada confianza cuando el rostro no está visible o hay mala iluminación.

### 12.3 Siguientes pasos después de tener limpio Hito 1

1. **Asset y carga real de MediaPipe**
   - Proveer/verificar `public/models/face_landmarker.task` o fijar `modelAssetPath` a un asset versionado.
   - Evitar depender de `@latest` en WASM CDN para producción; preferir versión fija o vendor local.

2. **QA browser con cámara real**
   - Probar Chrome/Edge/Firefox en laptop común.
   - Medir FPS, consumo CPU, latencia de juegos y estabilidad del cleanup.
   - Registrar matriz de resultados por dispositivo/navegador.

3. **Hardening backend**
   - Reforzar `server/validators.js` para rechazar payloads con campos prohibidos, además del guard frontend.
   - Registrar eventos de bloqueo sin guardar valores sensibles.

4. **Feature fusion cognitivo-conductual por juego — Hito 2**
   - Crear `assessmentFeatureVectorV1` por `gameId` con scores, tiempos, cursor metrics, trial events, facial windows y quality flags.
   - No entrenar modelo aún; primero estabilizar contrato y fixtures.

5. **Reporte calibrado y revisión humana**
   - Separar explícitamente observables, proxies y recomendaciones.
   - Mantener caveats de baja calidad y copy de “no usar como criterio único”.

6. **Dataset/validación posterior**
   - Definir protocolo de consentimiento, retención, labeling, fairness audit e inter-rater agreement antes de usar señales para decisiones reales.

### 12.4 Avance de pendientes recomendados e inicio de Hito 2

Estado de avance posterior:

- Se provisionó el asset real `public/models/face_landmarker.task` desde el bucket oficial de MediaPipe y se registró checksum local para trazabilidad.
- `faceLandmarkerClient` dejó de depender de `@latest` y usa WASM CDN versionado `@mediapipe/tasks-vision@0.10.35/wasm`.
- Se agregó prueba automatizada que simula `navigator.mediaDevices.getUserMedia`, stream/tracks y video element para verificar que `WebcamCapture` abre stream, emite solo metadata agregada privacy-safe y apaga tracks en cleanup.
- La prueba con webcam física real sigue siendo manual porque el entorno WSL/CI no expone una cámara real ni permisos de navegador interactivo.
- `server/validators.js` ahora rechaza payloads de sesión con claves o valores raw/reconstructivos dentro de `sessionData`, reforzando el guard frontend.
- Hito 2 comenzó con `src/telemetry/features/assessmentFeatureVector.js` y tests TDD: genera `assessment_feature_vector_v1` por juego/sesión fusionando score, duración, trial events, cursor metrics, ventanas faciales agregadas y flags de calidad.
- `generateEdgeLocalReport()` incluye `assessmentFeatureVector` para que el reporte edge-local pueda consumir el contrato de features sin entrenar modelo todavía.

Pendiente manual explícito:

1. Ejecutar una sesión real con cámara física en navegador.
2. Confirmar en Network panel que `/api/session` no contiene frames/base64/landmarks.
3. Confirmar LED/captura apagada al cambiar de juego, cerrar reporte o navegar fuera.
4. Registrar matriz de navegador/dispositivo antes de habilitar webcam en producción.

### 12.5 Continuación hasta bloqueo manual

Avance adicional automatizado:

- Se agregó `src/telemetry/persistence/sessionPersistencePayload.js` como seam testeable para construir el payload exacto de persistencia backend.
- El payload backend ahora incluye `sessionData.assessmentFeatureVector` generado desde la telemetría real, con `participantId`, `sessionId`, contrato `assessment_feature_vector_v1` y agregados por juego/sesión.
- `Report.jsx` usa ese builder para persistir sesiones, por lo que el vector de Hito 2 viaja junto a la sesión sin duplicar lógica inline ni saltarse el guard de privacidad.
- El builder falla cerrado si la telemetría, reporte o metadata contienen raw/reconstructivo.
- `server/validators.js` ahora escanea todo el request payload, no solo `sessionData`, para bloquear raw media escondida en `metadata` u otras ramas.
- Se agregó test de asset de producción para verificar que `public/models/face_landmarker.task` existe, pesa >3MB y coincide con checksum SHA-256 esperado.
- Revisión independiente detectó bypasses potenciales por alias/plurales (`rawFrames`, `webcamFrames`, `facialLandmarks`) y `data:image` no-base64; se reforzaron frontend/backend guards para cubrir esos casos.
- `sessionPersistencePayload` ahora resume `webcamFrames` legacy como `webcamFrameSummary` antes de persistir, en vez de enviar arrays frame-level.
- `assessmentFeatureVector.session.sessionId` ahora solo recibe IDs escalares string; metadata no escalar queda fuera del contrato del vector.
- Se actualizó la skill `browser-local-assessment-telemetry` con la lección de cubrir variantes/plurales y data URIs no-base64 en validadores.

Bloqueo restante no automatizable desde WSL/CI:

1. Prueba física de cámara + permisos reales de navegador.
2. Inspección manual de Network panel de `/api/session` durante una sesión real.
3. Confirmación visual del LED/captura apagada tras navegación/unmount.
4. Matriz real de rendimiento por navegador/dispositivo.

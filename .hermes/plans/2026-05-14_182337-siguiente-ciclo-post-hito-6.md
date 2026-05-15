# Ciclo siguiente post-Hito 6: Productización de señal browser-local y modelo edge-local

> **Para Hermes:** trabajar en modo Lean Engineering. No abrir frentes grandes en paralelo. Cada hito debe cerrar con tests focalizados primero y validación más amplia sólo al final del bloque.

**Goal:** Convertir la señal browser-local ya validada en un flujo productivo auditable: persistencia backend correcta, modelo ligero edge-local en navegador, reporte final basado sólo en metadatos seguros y dashboard recruiter útil sin perder garantías de privacidad.

**Contexto actual:**
- Hitos 1-6 cerraron el camino browser-local: captura/dev lab, `facial_window_v1`, privacidad, `assessment_feature_vector_v1`, reporte edge-local, E2E local y ajustes de scroll dev.
- El reporte final ya construye `buildSessionPersistencePayload()` y llama `saveSessionToBackend()` cuando hay token de participante.
- El backend guarda payload JSON completo en `sessions.payload` y expone recruiter endpoints.
- Ya existe una base edge-local: `src/services/edgeLocalInferenceService.js`, `src/workers/onnxWorker.js`, `public/models/edge-local-report.onnx` y `public/models/edge-local-report.meta.json`.
- Riesgo detectado para el siguiente ciclo: los adapters de DB extraen métricas desde `payload.sessionData`, pero el payload actual guarda los juegos bajo `payload.sessionData.telemetry`; por lo tanto `session_metrics` puede quedar incompleto aunque el JSON sí se guarde.

**Arquitectura propuesta:**
Primero cerrar persistencia y contrato backend. Luego formalizar el contrato del modelo edge-local: qué features entran, qué outputs salen, qué nunca se infiere, qué metadatos se pueden enviar. Después preparar/probar el runtime ONNX local y recién entonces exponer los resultados en reporte y recruiter dashboard.

**Principio de producto/ética:**
El modelo puede analizar señales observables y agregadas: resultados del juego, latencias, errores, cursor, estabilidad visual, cobertura facial, parpadeos, pose gruesa, micro-señales agregadas de blendshapes/microgestos, calidad/confianza y caveats. No debe afirmar detección de mentira, personalidad, inteligencia, salud mental, emoción verdadera ni decisión automática de contratación. Baja calidad de cámara debe reducir confianza, no castigar al candidato.

---

## Hito 7/12 — Persistencia backend real y contrato de privacidad

**Objetivo:** asegurar que una sesión real con `assessmentFeatureVector`, `signalAudit`, `facialWindows` agregadas y caveats se guarda y se recupera sin raw media, y que `session_metrics` indexa juegos reales.

**Archivos probables:**
- `server/db.sqlite.js`
- `server/db.pg.js`
- `server/db.memory.js`
- `server/validators.js`
- `server/validators.test.js`
- `server/middleware.test.js` o nuevo `server/sessionPersistence.test.js`
- `src/telemetry/persistence/sessionPersistencePayload.test.js`

**Pasos Lean:**
1. RED: agregar test backend con payload realista cuyo `sessionData.telemetry` contiene `ospan_game_1` o `game1` con `facialWindows` agregadas.
2. Verificar que hoy falla la extracción/indexación de `session_metrics` si no mira dentro de `sessionData.telemetry`.
3. Corregir `extractGamesFromPayload()` en SQLite/Postgres/memory para leer en orden:
   - `payload.sessionData.telemetry`
   - fallback `payload.sessionData`
   - fallback `payload`
4. Añadir test de privacidad backend: rechazar `rawFrame`, `faceLandmarks`, `data:image`, `webcamFrames` crudos.
5. Verificar payload frontend sigue reemplazando `webcamFrames` legacy por `webcamFrameSummary`.

**Validación:**
- `npm test -- server/validators.test.js server/middleware.test.js src/telemetry/persistence/sessionPersistencePayload.test.js`
- Si se agrega test nuevo: incluirlo en el comando focalizado.
- `npx eslint server/*.js src/telemetry/persistence/sessionPersistencePayload.js`

**Criterio de cierre:**
- Sesión guardada conserva sólo agregados.
- `session_metrics` se llena con juegos reales del payload nuevo.
- Backend rechaza raw media aunque el frontend falle.

---

## Hito 8/12 — Especificación del modelo edge-local y contrato de features

**Objetivo:** definir formalmente el modelo ligero que correrá en el navegador: inputs permitidos, outputs permitidos, metadata enviada al servidor, límites éticos, versionado y fallback.

**Archivos probables:**
- `src/telemetry/features/assessmentFeatureVector.js`
- `src/telemetry/features/assessmentFeatureVector.test.js`
- `src/telemetry/facial/facialTelemetrySchema.js`
- `src/telemetry/model/edgeFeatureContract.js` (nuevo si conviene)
- `src/telemetry/model/edgeFeatureContract.test.js` (nuevo)
- `public/models/edge-local-report.meta.json`
- documentación corta en `.hermes/plans/` o `docs/` si existe carpeta docs.

**Inputs permitidos del modelo:**
- Resultados de juego: score normalizado, errores, duración, accuracy, reacción media/p95, consistencia por trial, abandono/reintentos.
- Cursor/interacción: velocidad media, pausas/hesitación, movimientos bruscos agregados, clicks, precisión en targets, pero no trayectorias crudas si no son necesarias.
- Telemetría facial agregada: `facial_window_v1` con cobertura, calidad, parpadeos/min, estabilidad visual, pose media/desviación, flags y confianza.
- Microgestos/micro-señales: sólo como agregados no reconstructivos de blendshapes/coarse action groups por ventana, por ejemplo variabilidad de cejas/ojos/boca, no landmarks ni frames.
- Contexto de calidad: cámara denegada, modelo no disponible, baja luz, múltiples rostros, performance degradada.

**Outputs permitidos del modelo:**
- `edgeLocalModelOutput_v1` con:
  - `modelName`, `modelVersion`, `modelSizeMb`, `runtime`, `latencyMs`
  - `featureVectorVersion`
  - scores bounded 0-100 para dimensiones observables/derivadas: control de ejecución, estabilidad atencional observable, adaptabilidad de juego, calidad de decisión de tarea, aprendizaje/transferencia.
  - `confidenceScore`
  - `qualityFlags`
  - `caveats`
  - `interpretationAllowed`
- No output de “hire/no-hire” automático.
- No output de emoción verdadera, personalidad, mentira, salud mental o inteligencia innata.

**Pasos Lean:**
1. RED: test de contrato que valide feature order/version y prohíba campos crudos (`rawFrame`, `faceLandmarks`, `landmarks`, `canvas`, `base64`).
2. Extender `assessment_feature_vector_v1` o preparar `assessment_feature_vector_v2` sólo si v1 queda insuficiente. Preferencia Lean: mantener v1 y añadir `edgeLocalModelInput`/`modelReadyFeatures` si no rompe compatibilidad.
3. Actualizar `edge-local-report.meta.json` con feature order real, rangos, versión, fecha, tamaño y caveats.
4. Documentar que microgestos son “micro-señales visuales agregadas”, no lectura psicológica.
5. Agregar test de serialización: el metadata final que viaja al backend no contiene video, frames ni landmarks.

**Validación:**
- `npm test -- src/telemetry/features/assessmentFeatureVector.test.js src/telemetry/model/edgeFeatureContract.test.js`
- `npx eslint src/telemetry/features/assessmentFeatureVector.js src/telemetry/model/edgeFeatureContract.js`

**Criterio de cierre:**
- Hay contrato estable de features/model output.
- Se sabe exactamente qué metadata llega al servidor.
- La privacidad está testeada antes de entrenar o integrar más modelo.

---

## Hito 9/12 — Prototipo de modelo ligero y runtime local ONNX/Web Worker

**Objetivo:** preparar un modelo local liviano que combine video agregado + telemetría de juego/cursor sin bloquear el juego y sin enviar raw data.

**Archivos probables:**
- `scripts/build-edge-local-model.mjs`
- `src/workers/onnxWorker.js`
- `src/services/edgeLocalInferenceService.js`
- `src/services/edgeLocalInferenceService.liveInsight.test.js`
- `public/models/edge-local-report.onnx`
- `public/models/edge-local-report.meta.json`

**Modelo inicial recomendado:**
- Mantenerlo pequeño y explicable: regresión lineal calibrada, logistic/ordinal model, tiny MLP o gradient-free model exportado a ONNX.
- Input shape fijo, por ejemplo 16-40 features agregadas; no frames, no landmarks.
- Output multi-head opcional:
  - dimensión global de fit observable/competencia de tarea
  - confianza/calidad de señal
  - caveats/fallback
- Si no hay dataset real etiquetado, usar modelo baseline calibrado/heurístico y marcarlo como `calibrationStatus: baseline_not_validated`; no venderlo como predictor validado.

**Pasos Lean:**
1. RED: test del worker que carga metadata y rechaza feature vector con orden/shape incorrecto.
2. Actualizar `scripts/build-edge-local-model.mjs` para generar ONNX + meta coherentes con Hito 8.
3. Integrar runtime worker con fallback determinístico si ONNX falla.
4. Medir latencia local en test/mock o dev lab: objetivo inicial <50ms por inferencia post-window en laptop normal.
5. Añadir output `edgeLocalModelOutput_v1` al reporte local, no a cada frame.
6. Validar que sólo se infiere cada ventana o al final de juego, no en cada frame si afecta rendimiento.

**Validación:**
- `npm run model:build`
- `npm test -- src/services/edgeLocalInferenceService.liveInsight.test.js`
- test focalizado de worker si existe.
- `npm run build`

**Criterio de cierre:**
- Modelo ONNX y meta versionados.
- Runtime local funciona en worker o fallback.
- No hay raw media ni latencia visible durante el juego.

---

## Hito 10/12 — Integración del modelo en reporte final y payload metadata-only

**Objetivo:** usar el modelo local para producir el reporte candidato al terminar la prueba, enviando al backend sólo metadata segura y auditable.

**Archivos probables:**
- `src/Report.jsx`
- `src/Report.css`
- `src/services/edgeLocalInferenceService.js`
- `src/telemetry/persistence/sessionPersistencePayload.js`
- `src/telemetry/persistence/sessionPersistencePayload.test.js`
- `src/Report.test.jsx`

**Pasos Lean:**
1. RED: test de `Report` con data completa donde aparece `edgeLocalModelOutput_v1` y caveats cerca de la recomendación.
2. RED: test de cámara denegada/modelo no disponible: reporte se genera con game/cursor telemetry y confianza degradada.
3. Persistir en backend sólo:
   - `assessmentFeatureVector`
   - `edgeLocalModelOutput`
   - `signalAudit`
   - caveats/calibration metadata
   - telemetry agregada permitida
4. No persistir frames, landmarks, trayectorias crudas innecesarias ni snapshots de video.
5. Añadir microcopy bilingüe ES/EN: “modelo local”, “metadata-only”, “no decisión automática”.

**Validación:**
- `npm test -- src/Report.test.jsx src/telemetry/persistence/sessionPersistencePayload.test.js src/services/edgeLocalInferenceService.liveInsight.test.js`
- Lint focalizado.

**Criterio de cierre:**
- Reporte final usa salida local del modelo.
- El servidor recibe metadata suficiente para auditoría/reporte, no datos reconstructivos.
- La UI no sobredimensiona microgestos ni los convierte en diagnóstico.

---

## Hito 11/12 — Recruiter dashboard: señal auditable, no diagnóstica

**Objetivo:** que el recruiter pueda ver si una evaluación tiene señal visual completa/parcial/no disponible, salida modelo local, caveats y confianza, sin exponer JSON crudo ni datos biométricos sensibles.

**Archivos probables:**
- `src/components/RecruiterDashboard.jsx`
- `src/components/RecruiterDashboard.css`
- `src/services/backendService.js`
- tests existentes o nuevo `src/components/RecruiterDashboard.test.jsx`

**Pasos Lean:**
1. Inspeccionar shape actual de `getRecruiterSessions()` y `getRecruiterAnalyticsV2()`.
2. RED: test de dashboard con sesión que contiene `payload.sessionData.assessmentFeatureVector`, `edgeLocalModelOutput` y caveats.
3. Renderizar badge por sesión:
   - “Señal visual completa” si cobertura/calidad suficiente.
   - “Señal visual parcial” si hay flags/caveats.
   - “Cámara/modelo no disponible” si `camera_denied` o `facial_model_unavailable`.
4. Mostrar output modelo sólo como dimensiones observables y confianza; no JSON crudo.
5. Mostrar disclaimer fijo: “No usar como decisión automática; sólo auditoría de calidad de señal y apoyo a revisión humana”.

**Validación:**
- Test focalizado del dashboard.
- Lint focalizado.
- Smoke manual si hay ruta recruiter accesible localmente.

**Criterio de cierre:**
- Recruiter entiende calidad/confianza de señal y límites del modelo.
- No hay raw media ni JSON biométrico sensible en UI.

---

## Hito 12/12 — Smoke local/deploy y checklist de release

**Objetivo:** cerrar el ciclo con una comprobación realista de frontend + backend + modelo local, sin depender sólo de mocks.

**Archivos probables:**
- `.env.example` o documentación existente si falta reflejar flags reales.
- tests sólo si aparece una brecha.

**Pasos Lean:**
1. Levantar backend local y frontend local con flags mínimos.
2. Autenticar participante local.
3. Completar flujo corto o simular datos permitidos.
4. Verificar `/report` genera salida modelo edge-local y guarda sesión.
5. Verificar backend persiste metadata-only.
6. Verificar recruiter puede recuperar sesión y ver señal auditada/model output.
7. Ejecutar gates finales:
   - tests focalizados del ciclo
   - `npm test` sólo al cierre
   - `npm run security:audit`
   - `npm run build`

**Criterio de cierre:**
- Flujo candidato → modelo local → reporte → backend → recruiter funciona localmente.
- Privacidad raw-media bloqueada en frontend y backend.
- Listo para commit/PR/deploy.

---

## Estado actualizado y separación de tareas

Hitos 7-11 quedan separados en slices verificables:

- **Hito 7 — cerrado:** persistencia backend indexa `payload.sessionData.telemetry` con helper compartido.
- **Hito 8 — cerrado:** contrato metadata-only del modelo edge-local y feature order de 19 señales.
- **Hito 9 — cerrado:** runtime/modelo ONNX reconstruido contra el contrato y worker con `featureArray`.
- **Hito 10 — cerrado:** `edge_local_model_output_v1` aparece en reporte/payload metadata-only.
- **Hito 11 — cerrado en 2 slices:**
  1. panel recruiter de gobernanza edge-local y columnas por sesión;
  2. filtros `Edge Outputs Only`, `Baseline Not Validated`, `Human Review Only` y export CSV con columnas de modelo.

**Hito 12 — cerrado sin smoke HTTP automático:**

- **Hito 12A — smoke estático local:** validó build artifacts, modelo ONNX/meta, deck nativo React ES/EN, rutas/assets críticos y privacidad básica sin levantar servidores ni reintentar el health-check HTTP bloqueado previamente.
- **Hito 12B — smoke integración local sin HTTP:** agregó `src/hito12LocalSmoke.test.js`, que valida candidato → `generateEdgeLocalReport()` → `edge_local_model_output_v1` → `buildSessionPersistencePayload()` → `db.memory.saveSession()`/metrics → shape recruiter-readable.
- **Hito 12C — release gates:** `npm test`, `npm run lint`, `npm run security:audit`, `npm run build`, `git diff --check` y static scan quedaron verdes.
- El pitch deck dejó de depender de `src/assets/pitchdeck.html`: ahora es React nativo editable, con copy bilingüe en `src/components/pitchDeckContent.js` y UI en `src/components/PitchDeckPage.jsx`/`.css`.

**Post-Hito 12 recomendado:**

1. Commit/PR/deploy del ciclo cerrado.
2. Smoke manual en navegador real sobre deploy/dev domain: candidato → reporte → backend → recruiter, incluyendo cámara real/denegada. Esto requiere interacción humana y no debe repetir automáticamente el health-check HTTP bloqueado por herramienta.
3. Calibración con dataset real y fairness antes de claims predictivos fuertes.
4. Iteración del pitch deck nativo: narrativa comercial, métricas de negocio, casos de uso, screenshots/componentes vivos y export PDF/PPTX si se necesita.
5. Optimización avanzada de `onnxruntime-web`/WASM y plugin timings sólo si el deploy/performance budget lo exige.
6. Dashboard recruiter avanzado: detalle expandible por sesión, filtros por caveats/quality flags específicos y analytics históricos.

## Riesgos y tradeoffs

- No tocar dashboard antes de arreglar persistencia: si no, podemos diseñar UI sobre datos que luego no están indexados.
- No entrenar ni ampliar modelo antes de congelar contrato de features y metadata: evita fuga de datos y retrabajo.
- No crear migraciones complejas todavía: el payload JSON ya conserva datos; el primer fix debe limitarse a extracción/indexación y validación.
- Mantener la señal facial/microgestual como auditoría de señales observables y confianza; no convertirla en predictor psicológico independiente ni decisión automática.
- Si no hay dataset real validado, etiquetar el modelo como baseline/calibración inicial y evitar claims de validez predictiva.

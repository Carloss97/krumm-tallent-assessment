# KRUMM Talent Assessment — Recap, roadmap a MVP y presupuesto aproximado

Fecha: 2026-05-28
Proyecto: `/mnt/c/Users/sarlo/OneDrive/Escritorio/Proyectos/Test`

## 1. Definición operativa de MVP

Para KRUMM, el MVP no debería definirse como “la demo funciona”, porque eso ya está muy avanzado. El MVP recomendable es un producto piloto B2B utilizable con 1–3 empresas, 50–200 candidatos y revisión humana, con estas capacidades mínimas:

1. Un candidato puede entrar con código/invitación, aceptar consentimiento, completar una evaluación corta/mediana y obtener cierre de sesión sin fricción.
2. El sistema guarda una sesión metadata-only: resultados de juego, eventos por trial, features agregadas, salida edge-local, calidad/confianza y caveats; no guarda video, frames, landmarks ni datos reconstructivos.
3. Un recruiter puede autenticarse, ver sesiones, filtrar/descargar resultados, revisar reportes y entender límites del modelo.
4. Hay despliegue staging/producción con Postgres, secretos, backups, health checks, logs, monitoreo mínimo y rollback básico.
5. Hay consentimiento, privacidad, retención/eliminación de datos y copy legal/comercial coherente con “apoyo a revisión humana”, no decisión automática ni diagnóstico.
6. Hay un protocolo de piloto y baseline/calibración inicial: suficiente para aprender del mercado sin hacer claims psicométricos fuertes antes de validación real.

## 2. Recap de lo hecho hasta ahora

### Producto y experiencia pública

- Landing pública `/` con propuesta de valor, CTAs, branding KRUMM, assets, favicon/manifiesto y optimizaciones para compartir.
- Demo pública `/demo` con flujo guiado y modo grabable `/demo?record=true`.
- Pitch deck `/pitch` con slides/experiencia React nativa, transiciones y soporte bilingüe.
- Pantalla post-demo con radar/insights de muestra para narrativa comercial.
- Script de grabación preparado en `.hermes/plans/script-grabacion.md` para video de 2:30–3:00.

### Juegos y batería cognitiva

- Flujo completo definido en `src/utils/gameFlow.js` con 13 módulos:
  - OSPAN, Stop-Signal, Task Switching, Balloon Risk, Decision Under Time Pressure, Grid Flow, Laser Puzzle.
  - Módulos complementarios: metacognitive calibration, operational prioritization, learning agility, social coordination, cognitive resilience, risk under uncertainty.
- Demo pública prioriza 3 juegos: Balloon, Laser Puzzle y GridFlow.
- GridFlow fue rediseñado con niveles progresivos, reglas de energía realistas y solvability verificada:
  - energía base 30 km;
  - movimiento horizontal 1 km, vertical 2 km;
  - estaciones recargan a 30 km;
  - niveles 10×10 a 13×13 con centros abiertos y paredes principalmente de borde;
  - Dijkstra/BFS usado para confirmar viabilidad.
- LaserPuzzle recibió fix de mutación/aliasing para evitar artefactos visuales al mover piezas.
- Juegos con sonidos Web Audio API y transiciones sonoras en demo.

### Telemetría, privacidad y modelo edge-local

- Arquitectura browser-local: cámara/telemetría procesada en navegador, con persistencia sólo de metadata agregada.
- Esquemas y tests para `facial_window_v1`, `assessment_feature_vector_v1` y `edge_local_model_output_v1`.
- MediaPipe/face landmarker y agregación local: cobertura, calidad, blink rate, pose/estabilidad, flags y caveats.
- Modelo local ONNX + metadata en `public/models/edge-local-report.onnx` y `.meta.json`.
- Inferencia local vía `src/services/edgeLocalInferenceService.js` y worker ONNX.
- Validadores backend bloquean raw media: frames, base64, landmarks, blobs, video, etc.
- Reporte y payload usan salida local y metadata-only.

### Backend, auth y recruiter

- Backend Express 5 con endpoints de health, feature flags, auth participante/recruiter, sesión y analytics.
- SQLite local por defecto y Postgres si existe `DATABASE_URL`.
- JWT para participante y recruiter.
- Rate limiting global/auth/AI; Helmet, CORS, compresión y logs con request ID.
- Recruiter dashboard con sesiones, métricas, analytics y columnas/gobernanza de modelo edge-local.
- Export y filtros del dashboard orientados a revisión humana y baseline no validado.

### Validación actual

Verificado en el repo actual:

- `npm test`: 52 archivos, 191/191 tests passing.
- `npm run build`: build Vite OK en 14.61s.
- `npm run security:audit`: no vulnerabilidades high; queda 1 vulnerabilidad moderate en `qs` con fix vía `npm audit fix`.
- Git: rama `main` limpia, `main...origin/main [ahead 1]`; commit local pendiente de push: `00ed8865 feat: redesigned GridFlow levels for 30km energy budget (h=1/v=2 costs)`.

## 3. Roadmap recomendado hasta MVP piloto

### Hito 1 — Release candidate + staging deploy

Objetivo: convertir el estado actual en una versión desplegable y verificable fuera del entorno local.

Entregables:
- Push/PR del commit pendiente.
- Staging con frontend + backend + Postgres.
- Variables de entorno, secretos, CORS, JWT, dominios y health checks configurados.
- CI básico: test, build, audit, diff check.
- Smoke manual en navegador real: candidato → reporte → backend → recruiter.

Criterio de cierre:
- Staging accesible por URL.
- Sesión real se guarda y aparece en recruiter dashboard.
- No se persisten raw media ni datos reconstructivos.

Duración estimada: 1–2 semanas.
Presupuesto incremental: USD 2.950–6.010.

### Hito 2 — Candidate assessment MVP flow

Objetivo: dejar el flujo del candidato listo para piloto real, no sólo demo.

Entregables:
- Acceso por código/invitación con UX clara.
- Consentimiento granular, copy de privacidad y manejo de cámara denegada.
- Selección de batería MVP: probablemente 4–6 juegos, no los 13 al inicio.
- Duración objetivo de 20–35 minutos.
- Estados de error, finalización, retry controlado, abandono y sesión incompleta.
- Persistencia robusta del payload por juego/sesión.

Criterio de cierre:
- Un candidato externo puede completar una evaluación sin asistencia.
- El reporte se genera incluso sin cámara/modelo, degradando confianza.
- La experiencia funciona en desktop moderno y móvil/tablet razonable si se decide soportarlo.

Duración estimada: 2–3 semanas.
Presupuesto incremental: USD 5.040–10.040.

### Hito 3 — Recruiter portal + reports/export v1

Objetivo: hacer que el valor para el cliente B2B sea usable sin tocar JSON ni depender del desarrollador.

Entregables:
- Listado de candidatos/sesiones.
- Vista detalle por candidato: resultados, señales observables, calidad, caveats, recomendación no automática.
- Filtros: estado, completado/incompleto, calidad de señal, baseline, human-review-only.
- Export CSV y/o PDF simple.
- Microcopy de gobernanza: no diagnóstico, no decisión automática, confianza limitada.

Criterio de cierre:
- Recruiter entiende qué revisar y qué NO inferir.
- Export suficiente para piloto con cliente.
- Dashboard no expone raw telemetry ni datos biométricos sensibles.

Duración estimada: 2–4 semanas.
Presupuesto incremental: USD 6.920–14.040.

### Hito 4 — Privacidad, compliance y seguridad mínima para piloto

Objetivo: reducir riesgo legal/comercial antes de exponer candidatos reales.

Entregables:
- Política de privacidad y consentimiento específico para evaluación gamificada y procesamiento local.
- Términos / disclaimer de uso humano, no automatizado.
- Retención y eliminación de datos.
- Backup/restore y borrado por candidato/cliente.
- Hardening de auth, CORS, rate limits, headers, secretos y logs.
- Revisión de seguridad ligera o pentest acotado.
- Fix de `npm audit` moderate si no rompe dependencias.

Criterio de cierre:
- Se puede explicar a una empresa qué datos se capturan, qué no, cuánto se guardan y cómo se eliminan.
- No hay secretos expuestos ni endpoints obvios sin protección.
- Existe checklist de respuesta ante incidente.

Duración estimada: 2–3 semanas.
Presupuesto incremental: USD 7.460–17.810.

### Hito 5 — Instrumentación de piloto + baseline/calibración inicial

Objetivo: convertir el MVP en una herramienta de aprendizaje validable, evitando claims fuertes sin datos.

Entregables:
- Taxonomía final de métricas MVP: scores por juego, dimensiones observables, calidad/confianza.
- Protocolo de piloto: consentimiento, muestra objetivo, feedback recruiter/candidato, criterios de éxito.
- Dataset metadata-only exportable para análisis.
- Baseline/calibración inicial marcada como `baseline_not_validated`.
- Fairness/quality checks básicos: missingness, cámara denegada, diferencias por dispositivo/navegador, distribución de scores.
- Incentivos y soporte para participantes piloto si aplica.

Criterio de cierre:
- Hay datos de piloto suficientes para iterar el score sin venderlo como predictor validado.
- Métricas de calidad permiten diferenciar “bajo desempeño” de “baja señal”.
- Se documenta qué claims se pueden y no se pueden hacer.

Duración estimada: 2–4 semanas de implementación + 4–8 semanas de recolección piloto si depende de terceros.
Presupuesto incremental: USD 8.790–20.680.

### Hito 6 — Pilot launch + customer operations

Objetivo: ejecutar pilotos reales con control de soporte, feedback y bugs.

Entregables:
- Onboarding para 1–3 clientes piloto.
- Plantillas de invitación a candidatos.
- Guía de recruiter y FAQ.
- Canal de soporte y triage de bugs.
- Monitoreo de conversion funnel: invitado → iniciado → completado → reporte revisado.
- Iteraciones de UX basadas en feedback real.

Criterio de cierre:
- 50–200 sesiones reales o el volumen que se pacte para piloto.
- Tasa de completitud y feedback suficientes para decidir pricing/paquete.
- Lista priorizada de fixes post-piloto.

Duración estimada: 2–3 semanas de preparación + duración del piloto.
Presupuesto incremental: USD 5.645–14.440.

### Hito 7 — MVP packaging / private beta comercial

Objetivo: cerrar producto mínimo vendible: narrativa, onboarding, pricing y material comercial.

Entregables:
- Landing actualizada con oferta MVP clara.
- Demo pública estable y video actualizado.
- One-pager comercial y deck refinado.
- Pricing inicial para pilotos pagados.
- Documentación cliente: seguridad, privacidad, uso del dashboard, límites del modelo.
- Roadmap post-MVP basado en feedback real.

Criterio de cierre:
- KRUMM puede vender/firmar pilotos pagados sin prometer más de lo que el producto valida.
- El equipo puede operar el producto sin intervención técnica diaria.
- Hay métricas de tracción y aprendizaje para fundraising/ventas.

Duración estimada: 2–3 semanas.
Presupuesto incremental: USD 5.610–13.880.

## 4. Presupuesto consolidado

Supuestos usados:
- Moneda: USD.
- Modelo: equipo lean con IA/automatización, pero contabilizando trabajo profesional.
- Tarifas aproximadas: ingeniería USD 50/h, DevOps USD 60/h, UX USD 40/h, QA USD 30/h, data/psicometría USD 100/h, legal USD 130/h, seguridad USD 140/h, PM/customer success USD 45/h, marketing USD 50/h.
- Rangos incluyen mano de obra + costos fijos de herramientas, cloud inicial, revisión externa, incentivos piloto y contingencia por hito.

| Hito | Presupuesto aprox. |
| --- | ---: |
| H1 Release candidate + staging deploy | USD 2.950–6.010 |
| H2 Candidate assessment MVP flow | USD 5.040–10.040 |
| H3 Recruiter portal + reports/export | USD 6.920–14.040 |
| H4 Privacy/compliance/security hardening | USD 7.460–17.810 |
| H5 Pilot instrumentation + baseline calibration | USD 8.790–20.680 |
| H6 Pilot launch + customer operations | USD 5.645–14.440 |
| H7 MVP packaging/private beta | USD 5.610–13.880 |
| Subtotal | USD 42.415–96.900 |
| Contingencia recomendada | USD 6.362–24.225 |
| Total recomendado hasta MVP piloto | USD 48.777–121.125 |

Costos operativos mensuales esperados durante staging/piloto:

| Categoría | Rango mensual |
| --- | ---: |
| Hosting, DB, storage | USD 80–350 |
| Logs/monitoring | USD 40–150 |
| Email, dominio, herramientas menores | USD 30–100 |
| API IA/fallback Gemini si se usa | USD 50–500 |
| Backups/seguridad/herramientas | USD 50–250 |
| Soporte/contingencia operacional | USD 250–1.000 |
| Total mensual | USD 500–2.350 |

Lectura práctica:
- Si el fundador/equipo interno absorbe gran parte de ingeniería y PM, el cash-out puede bajar, pero el costo real sigue existiendo como tiempo/oportunidad.
- Para un MVP serio con candidatos reales, no conviene recortar H4: privacidad, seguridad y claims legales son parte del producto, no “extras”.
- La calibración estadística/psicométrica profunda queda post-MVP; en MVP se debe hablar de baseline y señales observables, no predicción validada.

## 5. Próximos pasos inmediatos recomendados

1. Push/PR del commit pendiente y etiquetar una release interna.
2. Crear staging con Postgres y secretos reales.
3. Ejecutar smoke manual en navegador real: candidato → reporte → backend → recruiter.
4. Resolver `npm audit fix` si no genera regresiones.
5. Congelar scope MVP: elegir 4–6 juegos máximos para piloto.
6. Redactar consentimiento/política de privacidad v1 antes de invitar candidatos reales.
7. Diseñar piloto: cliente objetivo, número de candidatos, feedback esperado, métricas de éxito y límites de claims.

## 6. Riesgos principales

- Riesgo de claim: vender el modelo como predictor validado antes de tener dataset y calibración real.
- Riesgo de privacidad: cualquier fuga de frames, landmarks o raw cursor/video destruiría la propuesta edge-local.
- Riesgo de scope: intentar lanzar los 13 juegos completos puede empeorar completitud; MVP debería ser una batería corta.
- Riesgo de UX: evaluación muy larga o con cámara mal explicada puede bajar conversión.
- Riesgo técnico: despliegue serverless/hosting mal elegido puede romper WebAssembly/ONNX, CORS o persistencia.
- Riesgo legal/comercial: clientes de RRHH pedirán privacidad, retención, consentimiento y explicación de scoring antes de usar candidatos reales.

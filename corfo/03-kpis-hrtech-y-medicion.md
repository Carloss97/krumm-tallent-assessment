# Marco KPI para postulacion (version comite)

## Objetivo
Definir indicadores minimos y defendibles para demostrar avance TRL3/4 en tres dimensiones: robustez tecnica, valor de producto y viabilidad de negocio temprano.

## KPI Core (los 8 que deben estar en portada)

| Dimension | KPI | Formula | Meta TRL4 | Frecuencia | Fuente |
| --- | --- | --- | --- | --- | --- |
| Tecnica | Disponibilidad | (tiempo operativo / tiempo total) * 100 | >= 98% | Semanal | Health checks + logs |
| Tecnica | Latencia p95 critica | p95 de respuesta endpoints clave | < 1200 ms | Semanal | API telemetry |
| Tecnica | Error rate API | (5xx + red) / total requests | < 2% | Semanal | Logs backend/frontend |
| Producto | Tasa de finalizacion | sesiones completas / iniciadas | >= 80% | Semanal | Eventos de flujo |
| Producto | Tiempo de evaluacion | promedio(fin - inicio) | 12-20 min | Semanal | Timestamps |
| Calidad | Alineacion con baseline | acuerdo o correlacion con evaluacion humana | >= 70% acuerdo | Por cohorte | Estudio comparativo |
| Calidad | Utilidad del reporte | % recruiters que declara "accionable" | >= 75% | Quincenal | Encuesta corta |
| Negocio | Conversion demo -> piloto | pilotos cerrados / demos realizadas | >= 20% | Mensual | CRM |

## KPIs de soporte (para anexos)

## 1) Confiabilidad tecnica
- Tasa de sesiones invalidadas por falla tecnica: < 5%.
- Integridad de eventos criticos capturados: >= 95%.
- MTTR en incidencias severas: < 24 horas.

## 2) Experiencia de usuario
- Drop-off por etapa del flujo: identificar top 2 fricciones y corregirlas.
- UX score post evaluacion (1-5): >= 4.0.
- Tiempo de onboarding de cliente piloto: <= 14 dias.

## 3) Impacto para decision de RRHH
- Consistencia test-retest en submuestra: r >= 0.7 cuando aplique.
- Claridad del reporte: % usuarios que entiende resultado en < 60 segundos.
- Recomendaciones aplicables: % de reportes con accion sugerida ejecutable.

## 4) Traccion y economics iniciales
- Costo por piloto ejecutado: tendencia decreciente mensual.
- NPS de stakeholders: > 20 en fase temprana.
- Ratio reuniones->demo->piloto para embudo comercial inicial.

## Plan de medicion minimo viable

## Event schema obligatorio
- Campos base: session_id, tenant_id, user_type, timestamp, stage, metric_name, metric_value, error_code.
- Versionado de evento: event_version en cada payload.
- Trazabilidad: cada KPI debe reconstruirse desde logs crudos.

## Dashboard minimo
- Vista 1 (tecnica): disponibilidad, latencia, error rate.
- Vista 2 (producto): finalizacion, drop-off, tiempo por sesion.
- Vista 3 (valor): alineacion baseline, utilidad de reporte, conversion a piloto.

## Semaforo de decision para comite
- Verde: KPI cumple o supera meta.
- Amarillo: desviacion <= 10% de meta, con plan de correccion activo.
- Rojo: desviacion > 10% o dato no confiable.

## Reglas de calidad de evidencia
- Todo KPI informado debe incluir: periodo, N, fuente y limitacion.
- No reportar fotos aisladas: mostrar tendencia minima de 4 semanas.
- Diferenciar evidencia de laboratorio vs entorno real.
- Mantener consistencia entre cifra presentada y dataset fuente.

## Plantilla de reporte mensual (1 pagina)
- Resumen ejecutivo: 3 hallazgos y 3 decisiones.
- Estado KPI Core: tabla con semaforo.
- Riesgos abiertos: impacto, probabilidad, mitigacion y fecha compromiso.
- Solicitud de decision: que necesita el equipo para la siguiente etapa.

# Roadmap Ejecutivo 90 dias (TRL3 -> TRL4)

## Resumen para comite evaluador
Este plan transforma un prototipo funcional en una validacion tecnica y operativa defendible ante fondos publicos y privados. El foco es cerrar evidencia TRL3 en 30 dias y completar una validacion TRL4 en entorno controlado al dia 90.

## Resultado comprometido al dia 90
- Flujo end-to-end validado: onboarding -> evaluacion gamificada -> reporte -> vista reclutador.
- Piloto controlado ejecutado con 10-30 participantes del segmento objetivo.
- Evidencia cuantitativa de desempeno tecnico y utilidad de negocio.
- Paquete de postulacion listo: one-pager, deck, KPIs, riesgos, presupuesto por hitos.

## Fase 1 (Dia 1-30): Cierre TRL3
## Objetivo
Demostrar prueba de concepto con hipotesis medibles y trazabilidad de datos.

## Entregables
- Documento de 3-5 hipotesis tecnicas con umbrales de aceptacion.
- Baseline de comparacion (proceso actual/manual).
- Telemetria operacional activa en flujo completo.
- Informe TRL3 con resultados, limites y plan de cierre de brechas.

## Metas de fase
- p95 de latencia en endpoints criticos < 1200 ms.
- Tasa de finalizacion de sesiones >= 80% en entorno controlado.
- Registro de eventos criticos >= 95% sin perdida de trazabilidad.

## Gate de salida
Se avanza a Fase 2 solo si se cumplen al menos 80% de objetivos de fase y no existe bloqueo tecnico severo abierto.

## Fase 2 (Dia 31-60): Validacion TRL4 en laboratorio
## Objetivo
Validar reproducibilidad, calidad de datos y experiencia de uso en entorno controlado.

## Entregables
- Entorno de validacion replicable (staging o setup controlado documentado).
- Protocolo de piloto con consentimiento y resguardo de privacidad.
- Primer dataset anonimo de sesiones reales.
- Reporte intermedio con hallazgos de usabilidad y confiabilidad.

## Metas de fase
- Al menos 10 sesiones validas end-to-end.
- Tasa de error operacional < 5%.
- Identificacion de top 3 fricciones de usuario con plan de mejora.

## Gate de salida
Se avanza a Fase 3 con evidencia de estabilidad operacional y calidad minima de dataset para analisis.

## Fase 3 (Dia 61-90): Cierre TRL4 y readiness de financiamiento
## Objetivo
Convertir evidencia tecnica en narrativa de inversion/postulacion con hitos financiables.

## Entregables
- Informe final TRL4 con conclusion por componente (validado/parcial/no validado).
- One-pager y deck ejecutivos listos para postulacion.
- Presupuesto por hitos (I+D, validacion, comercial temprano).
- Roadmap de 6-12 meses con riesgos y mitigaciones.

## Metas de fase
- 1 caso de uso defendible con impacto cuantificado en tiempo/calidad de decision.
- Dossier consistente entre evidencia tecnica, mercado objetivo y uso de fondos.
- Backlog priorizado para salto a TRL5.

## Tablero de control semanal (PMO)

| Indicador | Meta | Frecuencia | Responsable |
| --- | --- | --- | --- |
| Avance de hitos por fase | >= 90% cumplimiento planificado | Semanal | PM/Founder |
| Sesiones validas acumuladas | Curva creciente semana a semana | Semanal | Data/Producto |
| Tasa de finalizacion | >= 80% | Semanal | Producto |
| Incidencias severas abiertas | 0 sin plan de accion | Semanal | Tech Lead |
| Riesgos criticos sin mitigacion | 0 | Semanal | Founder/PM |

## Riesgos criticos y mitigaciones
- Baja recluta para piloto: asegurar 2-3 aliados con agenda comprometida antes de Fase 2.
- Calidad de datos insuficiente: checklist de captura obligatoria y validaciones automaticas.
- Inestabilidad tecnica: congelar scope de demo y priorizar hardening sobre nuevas features.
- Riesgo etico/regulatorio: consentimiento informado, anonimizado y control de acceso auditado.

## Gobernanza recomendada
- Comite tecnico semanal (60 min): avance, bloqueos, deuda critica.
- Comite producto/negocio quincenal (60 min): evidencia, narrativa y go-to-market.
- Decision log unico: todo cambio de scope o KPI queda registrado con responsable y fecha.

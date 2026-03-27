# Engagement Pulse A/B Plan v1

## Objetivo
Evaluar si la capa de gamificacion Engagement Pulse aumenta engagement sin degradar calidad de evaluacion.

## Experimento
- Key: `engagement-pulse-v1`
- Variantes:
  - `control`: experiencia base sin overlay Engagement Pulse
  - `gamified`: experiencia con overlay de misiones/hitos/progreso
- Asignacion: deterministica por `participantId` (fallback `anonymous`) via hash local.

## Metricas Primarias
- `completionRate`: porcentaje de sesiones que completan bateria completa (13 juegos).
- `abandonmentRate`: 1 - completionRate.
- `avgCompletedGames`: promedio de juegos completados por sesion.
- `avgModuleDurationSec`: duracion promedio por modulo (segundos).

## Guardrails De Calidad
- `avgQualityFlags`: promedio de quality flags de telemetria por sesion.
- Analisis de distribucion de score por modulo para verificar que la variante no desplaza artificialmente rendimiento.

## Interpretacion Recomendada
- Exito de engagement:
  - aumento de completionRate en `gamified` >= 5 puntos porcentuales
  - reduccion de abandonmentRate en `gamified` >= 5 puntos
- No degradacion:
  - cambio de avgQualityFlags <= +0.5
  - sin caida material en metricas cognitivas agregadas por modulo

## Implementacion
- Variant assignment y persistencia metadata:
  - `src/components/GameShellCore.jsx`
  - `src/TelemetryContext.jsx`
- Visualizacion comparativa control vs gamified:
  - `src/components/RecruiterDashboard.jsx`

## Notas
- El overlay no altera score ni logica de aciertos/errores.
- Hitos de engagement se registran como `trialEvents` con metadata de experimento.

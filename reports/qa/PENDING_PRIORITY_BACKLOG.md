# Backlog Pendiente Por Prioridad (Deferred)

Fecha de registro: 2026-03-27
Estado: diferido temporalmente para priorizar optimizacion y gamificacion de juegos.

## Prioridad Alta

1. Simulacion masiva reproducible por juego
- Implementar runner sintetico por perfiles (normal, alto rendimiento, bajo rendimiento, inconsistente)
- Preset rapido: 2,000 iteraciones por juego (3 seeds)
- Preset estandar: 10,000 iteraciones por juego (5 seeds)
- Salida estructurada por seed y por juego para comparabilidad

2. Metricas de clasificacion y estabilidad
- Accuracy, precision, recall, F1-score
- Matriz de confusion global y por perfil
- FPR y FNR
- Variacion de F1 entre seeds
- Evaluacion contra umbrales de aceptacion definidos

3. Ground truth explicito por trial
- Etiqueta esperada por perfil sintetico y reglas de juego
- Persistencia de ground truth junto a telemetria/scoring
- Trazabilidad para auditoria de validez

## Prioridad Media

4. Expandir cobertura de pruebas de juegos
- Assert de scoring y accuracy en juegos aun no cubiertos con el mismo nivel
- Validacion de transiciones de estado y condiciones de cierre por juego

5. Gate de CI para readiness integral
- Obligatorio: lint + build + test
- Trackeado/no bloqueante inicial: e2e + simulacion estadistica + quality alerts
- Escalar a bloqueante cuando exista estabilidad consistente

## Criterio De Reanudacion
- Reanudar este backlog cuando termine el bloque de optimizacion/gamificacion UX.
- Empezar por Prioridad Alta en orden 1 -> 2 -> 3.

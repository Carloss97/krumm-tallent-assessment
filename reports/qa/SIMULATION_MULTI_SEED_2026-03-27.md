# QA Simulation Multi-Seed Report - 2026-03-27

Generated at: 2026-03-27T17:23:10.232Z

## Resumen Ejecutivo
- Readiness: casi-listo
- Accuracy global promedio: 92.04%
- F1 global promedio: 0.9175
- FPR promedio: 4.44%
- FNR promedio: 11.48%
- Runtime error promedio: 0.25%
- Drift F1 entre seeds: 0.0060 (std=0.0026)

## Configuracion
- Seeds: 101, 202, 303, 404, 505
- Volumen por seed: 10000 (4 perfiles x 2500)
- Total iteraciones: 50,000
- Ground truth: Perfil sintetico: base_normal/alto_rendimiento=positivo; bajo_rendimiento/inconsistente=negativo
- Umbral de clasificacion (solid): 0.5533

## Cumplimiento Umbrales
- [PASS] minF1
- [PASS] minAccuracy
- [PASS] maxFpr
- [FAIL] maxFnr
- [PASS] maxRuntimeErr
- [PASS] maxF1Drift

## Resultados Por Seed
- Seed 101: acc=92.32% f1=0.9203 fpr=4.04% fnr=11.32% runtimeErr=0.28% cm=[tp:4434 tn:4798 fp:202 fn:566]
- Seed 202: acc=92.27% f1=0.9202 fpr=4.60% fnr=10.86% runtimeErr=0.24% cm=[tp:4457 tn:4770 fp:230 fn:543]
- Seed 303: acc=91.75% f1=0.9143 fpr=4.46% fnr=12.04% runtimeErr=0.22% cm=[tp:4398 tn:4777 fp:223 fn:602]
- Seed 404: acc=92.06% f1=0.9179 fpr=4.70% fnr=11.18% runtimeErr=0.31% cm=[tp:4441 tn:4765 fp:235 fn:559]
- Seed 505: acc=91.81% f1=0.9149 fpr=4.40% fnr=11.98% runtimeErr=0.20% cm=[tp:4401 tn:4780 fp:220 fn:599]

## Hallazgos por Severidad
- Severo: Ninguno
- Moderado: Falsos negativos por encima del maximo esperado.
- Leve: Ninguno

## Riesgo Residual y Limites
- Los outcomes usados por calibracion base pueden ser sinteticos; no sustituyen validacion con etiquetas HR reales.
- Esta corrida modela perfiles sinteticos con distribucion gaussiana y ruido controlado.
- Se recomienda repetir con outcomes historicos etiquetados cuando esten disponibles.

## Recomendaciones Priorizadas
- Alta: incorporar outcomes historicos etiquetados para reemplazar proxy deterministico en calibracion.
- Media: ejecutar smoke estadistico diario (2k por juego, 3 seeds) como gate no bloqueante.
- Baja: adicionar dashboard de drift por perfil para vigilar FN en segmento inconsistente.

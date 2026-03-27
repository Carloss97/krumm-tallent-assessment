# QA Simulation Multi-Seed Report - 2026-03-27

Generated at: 2026-03-27T18:01:30.899Z

## Resumen Ejecutivo
- Readiness: casi-listo
- Accuracy global promedio: 93.42%
- F1 global promedio: 0.9364
- FPR promedio: 10.07%
- FNR promedio: 3.10%
- Runtime error promedio: 0.25%
- Drift F1 entre seeds: 0.0045 (std=0.0016)

## Configuracion
- Seeds: 101, 202, 303, 404, 505
- Volumen por seed: 10000 (4 perfiles x 2500)
- Total iteraciones: 50,000
- Ground truth: Perfil sintetico: base_normal/alto_rendimiento=positivo; bajo_rendimiento/inconsistente=negativo
- Umbral de clasificacion (solid): 0.5233

## Cumplimiento Umbrales
- [PASS] minF1
- [PASS] minAccuracy
- [FAIL] maxFpr
- [PASS] maxFnr
- [PASS] maxRuntimeErr
- [PASS] maxF1Drift

## Resultados Por Seed
- Seed 101: acc=93.70% f1=0.9390 fpr=9.52% fnr=3.08% runtimeErr=0.28% cm=[tp:4846 tn:4524 fp:476 fn:154]
- Seed 202: acc=93.51% f1=0.9373 fpr=9.98% fnr=3.00% runtimeErr=0.24% cm=[tp:4850 tn:4501 fp:499 fn:150]
- Seed 303: acc=93.37% f1=0.9358 fpr=9.98% fnr=3.28% runtimeErr=0.22% cm=[tp:4836 tn:4501 fp:499 fn:164]
- Seed 404: acc=93.31% f1=0.9354 fpr=10.22% fnr=3.16% runtimeErr=0.31% cm=[tp:4842 tn:4489 fp:511 fn:158]
- Seed 505: acc=93.20% f1=0.9345 fpr=10.64% fnr=2.96% runtimeErr=0.20% cm=[tp:4852 tn:4468 fp:532 fn:148]

## Hallazgos por Severidad
- Severo: Ninguno
- Moderado: Falsos positivos por encima del maximo esperado.
- Leve: Ninguno

## Riesgo Residual y Limites
- Los outcomes usados por calibracion base pueden ser sinteticos; no sustituyen validacion con etiquetas HR reales.
- Esta corrida modela perfiles sinteticos con distribucion gaussiana y ruido controlado.
- Se recomienda repetir con outcomes historicos etiquetados cuando esten disponibles.

## Recomendaciones Priorizadas
- Alta: incorporar outcomes historicos etiquetados para reemplazar proxy deterministico en calibracion.
- Media: ejecutar smoke estadistico diario (2k por juego, 3 seeds) como gate no bloqueante.
- Baja: adicionar dashboard de drift por perfil para vigilar FN en segmento inconsistente.

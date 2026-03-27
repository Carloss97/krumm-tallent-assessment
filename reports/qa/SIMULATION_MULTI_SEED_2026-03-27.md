# QA Simulation Multi-Seed Report - 2026-03-27

Generated at: 2026-03-27T18:15:33.108Z

## Resumen Ejecutivo
- Readiness: listo
- Accuracy global promedio: 93.62%
- F1 global promedio: 0.9371
- FPR promedio: 7.80%
- FNR promedio: 4.95%
- Runtime error promedio: 0.25%
- Drift F1 entre seeds: 0.0058 (std=0.0022)

## Configuracion
- Seeds: 101, 202, 303, 404, 505
- Volumen por seed: 10000 (4 perfiles x 2500)
- Total iteraciones: 50,000
- Ground truth: Perfil sintetico: base_normal/alto_rendimiento=positivo; bajo_rendimiento/inconsistente=negativo
- Umbral de clasificacion (solid): 0.5330

## Cumplimiento Umbrales
- [PASS] minF1
- [PASS] minAccuracy
- [PASS] maxFpr
- [PASS] maxFnr
- [PASS] maxRuntimeErr
- [PASS] maxF1Drift

## Resultados Por Seed
- Seed 101: acc=93.97% f1=0.9404 fpr=7.20% fnr=4.86% runtimeErr=0.28% cm=[tp:4757 tn:4640 fp:360 fn:243]
- Seed 202: acc=93.77% f1=0.9386 fpr=7.70% fnr=4.76% runtimeErr=0.24% cm=[tp:4762 tn:4615 fp:385 fn:238]
- Seed 303: acc=93.43% f1=0.9352 fpr=7.90% fnr=5.24% runtimeErr=0.22% cm=[tp:4738 tn:4605 fp:395 fn:262]
- Seed 404: acc=93.59% f1=0.9369 fpr=8.04% fnr=4.78% runtimeErr=0.31% cm=[tp:4761 tn:4598 fp:402 fn:239]
- Seed 505: acc=93.36% f1=0.9346 fpr=8.16% fnr=5.12% runtimeErr=0.20% cm=[tp:4744 tn:4592 fp:408 fn:256]

## Hallazgos por Severidad
- Severo: Ninguno
- Moderado: Ninguno
- Leve: Sin hallazgos criticos; mantener monitoreo continuo por cambios de distribucion.

## Riesgo Residual y Limites
- Los outcomes usados por calibracion base pueden ser sinteticos; no sustituyen validacion con etiquetas HR reales.
- Esta corrida modela perfiles sinteticos con distribucion gaussiana y ruido controlado.
- Se recomienda repetir con outcomes historicos etiquetados cuando esten disponibles.

## Recomendaciones Priorizadas
- Alta: incorporar outcomes historicos etiquetados para reemplazar proxy deterministico en calibracion.
- Media: ejecutar smoke estadistico diario (2k por juego, 3 seeds) como gate no bloqueante.
- Baja: adicionar dashboard de drift por perfil para vigilar FN en segmento inconsistente.

# Threshold Sweep Report - 2026-03-27

## Objetivo
Encontrar un umbral `solid` que cumpla simultaneamente:
- FPR <= 0.08
- FNR <= 0.10
- Accuracy >= 0.88
- F1 >= 0.85

## Configuracion
- Seeds: 101, 202, 303, 404, 505
- Volumen: 50,000 iteraciones (4 perfiles x 2,500 x 5 seeds)
- Rango barrido: 0.520 a 0.565 (paso 0.001)

## Mejor Candidato
- Threshold: 0.533
- F1: 0.9368
- Accuracy: 0.9359
- FPR: 0.0784
- FNR: 0.0497
- Estado: constrained=true

## Top Candidatos
- 0.533 -> F1=0.9368, FPR=0.0784, FNR=0.0497
- 0.534 -> F1=0.9365, FPR=0.0762, FNR=0.0523
- 0.535 -> F1=0.9358, FPR=0.0745, FNR=0.0551
- 0.536 -> F1=0.9355, FPR=0.0724, FNR=0.0575
- 0.537 -> F1=0.9350, FPR=0.0706, FNR=0.0602
- 0.538 -> F1=0.9343, FPR=0.0692, FNR=0.0626

## Aplicacion
- Se aplico override controlado: `CALIBRATION_SOLID_OVERRIDE=0.533` en la corrida de calibracion.
- Resultado final de simulacion multi-seed: readiness=lista.

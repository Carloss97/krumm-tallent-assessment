# Especificación de Batería Cognitiva v2 para Talent Assessment en RRHH

**Última actualización**: Marzo 2026  
**Versión**: 2.0 (Reemplazo de juegos 1-7)  
**Propósito**: Evaluación de capacidades cognitivas y conductuales para selección y desarrollo de talento.

---

## Resumen Ejecutivo

Batería de 7 juegos que mide 6 constructos cognitivos con validez para desempeño laboral. Duración total: **30-40 minutos**. Cada juego captura telemetría de tiempo de reacción (RT), precisión, consistencia y patrones de interacción (cursor + webcam).

---

## Constructos Evaluados

| Constructo | Relevancia RRHH | Juego | Duración Target |
|---|---|---|---|
| Memoria de Trabajo | Multitarea, carga mental | OSPAN | 6 min |
| Inhibición (Control Impulsivo) | Evitar errores, presión | Stop-Signal | 5 min |
| Flexibilidad Cognitiva | Adaptación a cambios | Task Switching | 6 min |
| Atención Sostenida | Consistencia laboral | CPT Corto | 4 min |
| Decisión Bajo Presión | Judgment, rapidez | Decision Under Pressure | 6 min |
| Adaptación a Excepciones | Resolución de problemas | Rule Shift + Exceptions | 5 min |
| Juicio Situacional Laboral | Comportamiento organizacional | SJT | 4 min |

**Total batería**: 36-42 minutos (incluye instrucciones y transiciones).

---

## GAME 1: OSPAN (Operation Span - Memoria de Trabajo Dual-Task)

### Propósito
Medir capacidad de mantener y actualizar información mientras se procesa nueva información. Valida para roles con multitarea.

### Diseño
- **Fase 1**: Presentar operación matemática simple (ej: 2+3=5? Verdadero/Falso).
- **Fase 2**: Mostrar letra para recordar.
- **Fase 3**: Repetir fase 1 y 2 alternadas (trial).
- **Fase 4**: Al final del bloque, recordar todas las letras en orden.

### Parámetros
| Parámetro | Valor |
|---|---|
| Set sizes (letras) | 3, 4, 5, 6 (escalado adaptativo) |
| Operaciones por set | (set size) |
| Tiempo límite respuesta | 3 seg operación, 1.5 seg letra |
| Trials totales | 15 (3 por set size) |
| Duración | 6-7 min |

### Scoring
```
Score = Total letras recordadas correctas y en orden
Metrics:
- Accuracy operaciones (%)
- Recall accuracy (%)
- Operation RT mediano (ms)
- Working memory span final (máx letras en orden)
- Consistency: variabilidad intra-sujeto de RT
```

### Condiciones de Invalidez
- Abandono antes de 50% de trials.
- Accuracy operaciones <50% (no entiende tarea).

### Telemetría Obligatoria
- Cursor: posición, velocidad, hesitation, correcciones.
- Webcam: parpadeo, head pose, engagement visual.

---

## GAME 2: Stop-Signal Task (Inhibición)

### Propósito
Medir capacidad de inhibir respuesta motora bajo restricción temporal. Valida para control de errores y precisión.

### Diseño
- **Trials GO**: Estímulo verde → presionar botón lo antes posible.
- **Trials STOP**: Estímulo rojo + sonido → NO presionar.
- **Timing adaptativo**: Se ajusta el delay entre estímulo y stop para mantener ~50% correctos.

### Parámetros
| Parámetro | Valor |
|---|---|
| Trials GO | ~80 |
| Trials STOP | ~50 (40% de total) |
| Delay inicial | 200 ms |
| Rango delay | 100-600 ms (adaptativo) |
| Duración | 5-6 min |

### Scoring
```
Metrics:
- GO RT mediano (ms) y desv estándar
- STOP Accuracy (%)
- SSRT (Stop-Signal Reaction Time) = GO RT mediano - delay promedio
- Post-error slowing: RT aumento post-error
- Consistency: variabilidad GO RT
```

### Condiciones de Invalidez
- Abandono antes de 70% de trials.
- Variabilidad de RT extrema (no está prestando atención).

### Telemetría Obligatoria
- Cursor: trayectoria al target, velocidad, aceleración.
- Webcam: engagement, expresión (tensión vs relajación).

---

## GAME 3: Task Switching (Flexibilidad Cognitiva)

### Propósito
Medir capacidad de cambiar entre reglas/categorías. Valida para adaptación organizacional y resolución de conflictos.

### Diseño
- **Bloques repetición (REPEAT)**: Clasificar números (par/impar) O colores (rojo/azul).
- **Bloques cambio (SWITCH)**: Alternar entre regla de número y color cada 2-3 trials.
- **Cada trial**: Presentar estímulo, clasificar según regla actual, medir RT y error.

### Parámetros
| Parámetro | Valor |
|---|---|
| Trials por bloque | 24 (alternancia clara) |
| Bloques | 1 practice + 3 test |
| Proporción SWITCH | 50% (alternancia predecible) |
| ISI (Inter-stimulus) | 500 ms |
| Duración | 6-7 min |

### Scoring
```
Metrics:
- REPEAT RT mediano (ms)
- SWITCH RT mediano (ms)
- Switch Cost = SWITCH RT - REPEAT RT
- Accuracy REPEAT (%)
- Accuracy SWITCH (%)
- Post-switch slowing: incremento RT inmediato post-switch
- Consistency: variabilidad intra-bloque
```

### Condiciones de Invalidez
- Error rate >30% en bloques REPEAT.
- Abandonar antes de 2 bloques test.

### Telemetría Obligatoria
- Cursor: movimiento hesitante pre-respuesta, self-corrections.
- Webcam: cognitive load indicators (blink rate, head movement).

---

## GAME 4: CPT Corto (Continuous Performance Test - Atención Sostenida)

### Propósito
Medir capacidad de mantener vigilancia y detectar cambios a largo plazo. Valida para roles que requieren consistencia.

### Diseño
- **Presentación**: Secuencia de letras/números en rápida sucesión (~300ms cada una).
- **Tarea**: Presionar cuando aparece TARGET (ej: letra "X" seguida de "A").
- **Progresión**: 5 bloques de complejidad creciente.

### Parámetros
| Parámetro | Valor |
|---|---|
| Estímulos por bloque | 50 |
| Bloques | 5 progresivos |
| Proporción TARGET | 30% |
| ISI | 300-500 ms |
| Duración | 4-5 min |
| Fade effect | Bloques progresivamente más rápidos |

### Scoring
```
Metrics:
- Omissions (faltas de respuesta a targets)
- Commissions (respuestas falsas a no-targets)
- Omission rate (%)
- Commission rate (%)
- lapse rate (RT >500ms)
- RT mediano (ms)
- Variabilidad RT (coeficiente variación)
- Decay effect: comparar bloques 1 vs 5 (fatiga)
```

### Condiciones de Invalidez
- Abandono antes del 60% de estímulos.
- Comisiones >50% (no entiende instrucción).

### Telemetría Obligatoria
- Cursor: velocidad sostenida, errores de precisión.
- Webcam: parpadeo, cambios posturales (fatiga).

---

## GAME 5: Decision Under Time Pressure (Juicio Bajo Presión)

### Propósito
Evaluar calidad de decisión con información incompleta y límite temporal ajustado. Valida para liderazgo y sales.

### Diseño
- **Escenarios laborales miniaturizados**: Asignar recurso, priorizar ticket, resolver conflicto en equipo.
- **Información parcial**: No hay respuesta "perfecta".
- **Tiempo límite**: Presión progresiva (30s → 20s → 10s por escenario).
- **Feedback**: Mostrar consecuencia de decisión (pero sin corregir).

### Parámetros
| Parámetro | Valor |
|---|---|
| Escenarios | 6-8 progresivos |
| Límite tiempo | 30s / 20s / 10s por nivel |
| Opciones múltiples | 4-5 respuestas por escenario |
| Escenarios de validación | Base de datos con scoring claro |
| Revisiones permitidas | Max 2 antes de confirmar |
| Duración | 6-8 min |

### Scoring
```
Metrics:
- Quality score por escenario (0-100 basado en criterios: balance, riesgo, creatividad)
- Consistency score: variabilidad calidad entre escenarios
- Speed of decision (time to response)
- Revisions count (indecisión)
- Composite score = (Quality + Consistency) * (1 - hesitation factor)
```

### Condiciones de Invalidez
- Timeout en >30% de escenarios sin respuesta.
- Patrones de respuesta aleatorios detectados.

### Telemetría Obligatoria
- Cursor: trayectoria de búsqueda visual, cambios de target.
- Webcam: intensidad de concentración, micro-expresiones de duda.

---

## GAME 6: Rule Shift + Exception Handling (Adaptación)

### Propósito
Evaluar capacidad de aprender y aplicar reglas, y manejar excepciones. Valida para aprendizaje y adaptación organizacional.

### Diseño
- **Bloque 1 (LEARNING)**: Clasificar ítems por regla simple (ej: color).
- **Bloque 2 (SHIFT)**: Se cambia la regla sin aviso (ej: ahora es forma).
- **Bloque 3 (EXCEPTIONS)**: Se introduce excepción (ej: "rojo siempre es rojo incluso si la forma dice otra cosa").
- Cada bloque con feedback claro para acelerar aprendizaje.

### Parámetros
| Parámetro | Valor |
|---|---|
| Trials por bloque | 20 |
| Bloques | 3 (Learning, Shift, Exceptions) |
| Feedback inmediato | Sí |
| Criterio aprendizaje | 80% corrección en últimos 10 trials |
| Duración | 5-6 min |

### Scoring
```
Metrics:
- Bloque 1 (learning speed): trials hasta criterion
- Bloque 2 (shift cost): aumento errores inmediatos post-shift
- Bloque 2 (readaptation speed): trials hasta nuevo criterion
- Bloque 3 (exception learning): trials hasta criterion con excepciones
- Error pattern: por qué fallan (perseveración vs impulsividad)
- Flexibility index = (shift cost ^ -1) * learning speed
```

### Condiciones de Invalidez
- no alcanzar criterion en Bloque 1 (incomprehensión de tarea).
- Error rate 100% en cualquier bloque (no intenta).

### Telemetría Obligatoria
- Cursor: vacilación pre-respuesta en bloques SHIFT y EXCEPTIONS.
- Webcam: procesamiento (blink, focus) antes de cambro de regla.

---

## GAME 7: SJT - Situational Judgment Test (Criterio Laboral)

### Propósito
Evaluar juicio sobre situaciones laborales reales. Valida para alineación cultural y soft skills.

### Diseño
- **Presentación**: Escenario breve de conflicto/decisión laboral (ej: "Tu colega no comparte información").
- **Opciones**: 4-5 respuestas clasificadas internamente por:
  - Efectividad para resolver
  - Alineación con valores empresa
  - Riesgo interpersonal
- **Scoring**: Basándose en banco calibrado de expertos RRHH.
- **No hay feedback** inmediato (evitar sesgo de corrección).

### Parámetros
| Parámetro | Valor |
|---|---|
| Escenarios | 8-10 variados |
| Dominios cubiertos | Liderazgo, trabajo en equipo, integridad, iniciativa, gestión de conflicto |
| Opciones por escenario | 4-5 |
| Banco de escenarios | Versionado y calibrado con RRHH |
| Duración | 4-5 min |

### Scoring
```
Metrics:
- Total accuracy (% respuestas alineadas con expertos)
- Score por dimensión (Liderazgo, Equipo, Integridad, Iniciativa, Conflicto)
- Response time per scenario (impulso vs reflexión)
- Consistency: variabilidad inter-escenarios
- Confidence pattern: coherencia de puntuaciones altas vs bajas
- Cultural alignment index (agregado ponderado)
```

### Condiciones de Invalidez
- Respuestas demasiado rápidas (<2seg) en >50% de escenarios (no leyó).
- Patrón de respuesta determinista (siempre opción A).

### Telemetría Obligatoria
- Cursor: lectura visual scanning, fijaciones pre-decisión.
- Webcam: expresión facial (reflexión vs impulsividad).

---

## Secuencia de Batería (Flujo Completo)

```
1. Intro + Consentimiento (2 min)
   └─ Consentimiento granular (cursor, webcam)
   
2. Game 1: OSPAN (6-7 min)

3. Game 2: Stop-Signal (5-6 min)

4. Pausa opcional (1-2 min, usuario decide)

5. Game 3: Task Switching (6-7 min)

6. Game 4: CPT Corto (4-5 min)

7. Game 5: Decision Under Pressure (6-8 min)

8. Pausa opcional (1-2 min)

9. Game 6: Rule Shift + Exceptions (5-6 min)

10. Game 7: SJT (4-5 min)

11. Resumen de resultados (2-3 min)
    └─ Scorecard por constructo
    └─ Recomendación rol
    └─ Opciones de descarga/compartir

Total: 40-50 min (con pausas y transiciones)
```

---

## Telemetría Obligatoria (Global)

### Cursor/Mouse
- **Posición**: (x, y) cada 50ms
- **Derivadas**: velocidad (px/ms), aceleración, jerk
- **Eventos**: hesitation (baja velocidad >200ms), hover time, clicks, correcciones
- **Agregados por trial**: distancia normalizada, eficiencia de trayectoria, entropy

### Webcam
- **Presencia**: Face detected (boolean), confidence
- **Calidad de señal**: Luminancia, contraste, movimiento (para quality gate)
- **Oculometría básica**: Blink rate, blink duration, gaze direction (si disponible)
- **Postura**: Head pose (yaw, pitch), cambios posturales (proxy de inquietud)
- **Expresión**: Arousal general (tono muscular), micro-expresiones (si ML disponible)
- **Aggregates**: Fatiga index, cognitive load proxy

### Sincronización
- Timestamp Unix (ms) para cada evento
- Trial-level linking (qué telemetría corresponde a qué estímulo/respuesta)

### Quality Gates
- Si calidad webcam <60% → flag "insufficient signal", no usar para scoring
- Si conexión intermitente → buffer local y reintentar
- Si abandono antes de 50% → sesión inválida, flag claramente

---

## Criterios de Aceptación de Resultado

### Sesión Válida (requisitos mínimos)
1. Completitud: >80% de trials completados en cada juego
2. Validez de atención: No más de 2 sesiones inválidas flagged
3. Calidad de datos: Timestamp sincronizados, sin gaps >5 segundos
4. Consentimiento: Evidencia de consentimiento para cursor y webcam

### Score Reportable
- Dimensiones calculadas solo si criterios de validez cumplidos
- Bandas de confianza basadas en N de trials y variabilidad
- Riesgo de interpretación señalado cuando confidence baja

---

## Diccionario de Variables (Base de Datos)

```
Per Trial:
- trial_id (UUID)
- game_id (1-7)
- game_name (string)
- timestamp_start (unix ms)
- timestamp_end (unix ms)
- stimulus (string/code)
- response_type (keyboard, mouse, button)
- response_value (string/number)
- is_correct (boolean)
- reaction_time_ms (integer)
- cursor_x, cursor_y (float)
- cursor_velocity (float, px/ms)
- cursor_distance_traveled (float, px)
- n_corrections (integer)
- webcam_blink_count (integer)
- webcam_head_pose (yaw, pitch, roll)
- webcam_quality_score (0-100)

Per Game:
- game_score (integer/float)
- game_accuracy (%)
- game_rt_median (ms)
- game_rt_sd (ms)
- game_errors (integer)
- game_duration (ms)
- game_abandoned (boolean)
- quality_flags (array of strings)

Per Session:
- session_id (UUID)
- session_datetime (ISO 8601)
- user_id (string, hashed if needed)
- device_type (desktop/tablet/mobile)
- browser (string)
- network_latency (ms)
- consent_cursor (boolean), consent_webcam (boolean)
- completion_status (completed/abandoned/invalid)
- total_duration (ms)
- scorecard (JSON with dimensions)
```

---

## Restricciones y Fairness

1. **Normalización**: Puntajes ajustados por dispositivo, latencia de red y edad (si aplica).
2. **Sesgo de género**: Validar no discrepancia por género en cada juego.
3. **Idioma/Lectura**: SJT sin complejidad textual extrema, instructions en 2 idiomas si aplica.
4. **Accesibilidad**: Todos los juegos accesibles con teclado + mouse (no requieren webcam para score principal).
5. **GDPR**: Webcam solo con opt-in, datos borrados automáticamente tras 30 días si no aplicó candidato.

---

## Plan de Implementación (Roadmap)

| Sprint | Entregable | Estado |
|---|---|---|
| 1 | Spec v2 (este doc), Data contract v1 | ✅ En progreso |
| 1 | Extended TelemetryContext (cursor + webcam) | En progreso |
| 1 | Quality gates y feature flags base | Pendiente |
| 2 | Implementar OSPAN, Stop-Signal, Task Switching | Pendiente |
| 2 | Implementar CPT, Decision, Rule Shift, SJT | Pendiente |
| 2 | Integrar batería en gameFlow.js | Pendiente |
| 3 | Scorecard y dashboard | Pendiente |
| 3 | Piloto + validación fairness | Pendiente |

---

**Documento versionado y auditable. Cambios requerieren aprobación de Producto y RRHH.**

# AUDITORÍA UX - JUEGOS DE TRABAJO (Marzo 27, 2026)

## ✅ COMPLETADO

### InstructionInterstitial (Pantalla pre-juego)
**Cambio:** Eliminadas 4 secciones teóricas (Mission, Strategy Cue, Reward Track, Variety Layer)  
**Resultado:** Interfaz limpia con solo: tipo | título | descripción | tiempo | botón  
**Impacto:** Usuario llega al juego sin ruido cognitivo

---

## ⚠️ EN PROGRESO - JUEGOS ESPECÍFICOS

### 1. SST (Stop-Signal Task) - CRÍTICO
**Problema detectado:**
- Instrucciones iniciales dicen "GREEN/RED" pero juego muestra "GO/STOP"  
- Botón confuso "Inhibir" cuando debería ser "no presiones"  
- Usuario no sabe si presionar o no cuando ve STOP

**Solución:**
1. Reescribir instrucciones: "GO = presiona rápido / STOP = no hagas nada"
2. UI: Un botón PRESIONAR que se "grises" cuando es STOP
3. Feedback: Mensaje "Esperando..." cuando es STOP
4. (Opcional) Auto-advance después de 2 segundos en STOP

**Impacto esperado:** Claridad 100%, usuario entiende acción esperada

---

### 2. Task Switching (TSW) - IMPORTANTE
**Problema observado:**
- Regla alterna cada trial (COLOR ↔ FORMA)  
- User debe adivinar cuando es qué regla?  
- No hay pista visual clara de cuál regla activa

**Mejora propuesta:**
- Mostrar regla actual de forma prominente ANTES del estímulo
- Ejemplo: "REGLA: CLASIFICAR POR COLOR" (grande, visible)
- Luego: mostrar estímulo
- Luego: opciones (RED, BLUE, GREEN, CIRCLE, SQUARE, TRIANGLE)

**Impacto:** User no tiene ambigüedad sobre qué hacer

---

### 3. CPT (Continuous Performance Test) - IMPORTANTE
**Problema:**
- Letra objetivo puede cambiar por bloque pero user puede no notarlo
- Presenta letra aleatoria sin contexto

**Mejora propuesta:**
- ANTES de cada bloque: "Busca la letra: [GRANDE, ROJA] X"
- Durante bloque: Mostrar "Letra objetivo actual: X" arriba
- Feedback claro: "✓ Correcto" / "✗ Fallaste"

**Impacto:** User siempre sabe qué buscar

---

### 4. Decision Making (DEC) - IMPORTANTE
**Problema:**
- Escenarios pueden ser complejos
- Opciones pueden ser ambiguas

**Mejora propuesta:**
- Título clarísimo del escenario (ej: "COORDINACIÓN: Miembro no comparte info")
- Pregunta clara: "¿Qué DEBERÍAS hacer?"
- 4 alternativas ordenadas de mejor a peor (opcionalmente)

**Impacto:** User toma decisión estudiada, no aleatoria

---

### 5. Rule Shift (RSH) - MODERADO
**Problema:**
- Bloque 3 tiene una excepción ("ROJO siempre es ROJO")
- User puede no entender por qué su respuesta fue correcta/incorrecta

**Mejora propuesta:**
- ANTES de Bloque 3: Explicar la excepción con ejemplo
- DURANTE: Mostrar regla actual

**Impacto:** Transaction clara de reglas evita frustración

---

### 6. SJT (Situational Judgment Test) - MODERADO
**Problema:**
- Escenarios texto puro sin contexto visual
- 4 opciones pueden ser muy similares

**Mejora propuesta:**
- Cabecera: DOMINIO (ej: "LIDERAZGO")
- Escenario en una caja visual clara
- Opciones numeradas y espaciadas
- Ejemplo: ① Aceptar   ② Discutir   ③ Rechazar   ④ Escalar

**Impacto:** Información bien organizada, fácil de procesar

---

## 📊 MATRIZ DE PRIORIDADES

| Juego | Prioridad | Esfuerzo | Complejidad | Estatus |
|-------|-----------|----------|-------------|---------|
| **SST** | CRÍTICA | 2h | Media | EN PROGRESO |
| **Task Switching** | ALTA | 1h | Baja | NO INICIADO |
| **CPT** | ALTA | 1.5h | Baja | NO INICIADO |
| **Decision Make** | ALTA | 1h | Media | NO INICIADO |
| **Rule Shift** | MEDIA | 1h | Baja | NO INICIADO |
| **SJT** | MEDIA | 1.5h | Media | NO INICIADO |

---

## ✅ PLAN DE TRABAJO RECOMENDADO

### Fase 1 (HOY): SST
1. Reescribir instrucciones iniciales
2. Cambiar lógica de botones
3. Verificar tests pasan
4. Local test manual

### Fase 2 (MAÑANA): Task Switching + CPT
1. Mejora visual de regla/letra objetivo
2. Tests
3. Manual check

### Fase 3: Decision + Rule Shift + SJT
1. Mejora de presentación
2. Tests finales

### Fase 4: Validación final
1. Full test suite
2. Smoke test de gameplay end-to-end
3. Commit final

---

## 📝 NOTA PARA USER

La clave está en hacer que CADA juego sea tan guiado y claro que:
- Usuario NO se pregunta "¿Qué tengo que hacer?"
- Instrucciones + UI responden eso automáticamente
- Contexto de ENTREVISTA = baja fricción = usuario cómodo


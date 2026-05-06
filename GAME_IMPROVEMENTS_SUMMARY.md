# Resumen de Cambios: GridFlow & LaserPuzzle

## GRIDFLOW GAME UPDATES ✅

### 1. Reducción de SAT_DECAY
```javascript
// ANTES: const SAT_DECAY = 2; 
// AHORA: const SAT_DECAY = 1;
```
**Impacto**: La satisfacción de los paquetes decae más lentamente (1% por segundo en lugar de 2%), dando a jugadores más tiempo para responder sin presión excesiva.

---

### 2. Rediseño de Niveles (Progresión Clara)

#### NIVEL 1: "Introducción - Flujo Básico"
| Aspecto | Valor |
|---------|-------|
| Tamaño | 10×10 |
| Paredes | Ninguna |
| Objetivos | 1 (rojo, 100pts) |
| Pickup | (5,5) |
| Dropzone | (5,0) |
| Estaciones | Ninguna |
| Drenaje energético | 0 (sin restricción) |
| Tiempo límite | 40 segundos |
| Inicio | (5,9) |

**Propósito**: Enseñar controles y mecánica básica sin presión.

---

#### NIVEL 2: "Gestión de Energía - Primera Restricción"
| Aspecto | Valor |
|---------|-------|
| Tamaño | 10×10 |
| Paredes | Línea vertical bloquea centro (x=3) |
| Objetivos | 1 (azul, 120pts) |
| Pickup | (2,4) |
| Dropzone | (8,4) |
| Estaciones | 1 en (3,9) - EN LA RUTA DE RETORNO |
| Drenaje energético | 2 por movimiento |
| Tiempo límite | 50 segundos |
| Inicio | (0,0) |

**Propósito**: 
- Introducir restricción energética
- Ruta óptima ~18 movimientos = 36 energía consumida
- Estación es crítica para mantener energía
- Jugador aprende que energía es un recurso

---

#### NIVEL 3: "Múltiples Objetivos + Laberinto Complejo"
| Aspecto | Valor |
|---------|-------|
| Tamaño | 10×10 |
| Paredes | Matriz 2×2 en 3 ubicaciones (patrón dificultad) |
| Objetivos | 2 (verde 150pts, naranja 150pts) |
| Objetivo 1 | Pickup (2,8) → Dropzone (8,1) |
| Objetivo 2 | Pickup (8,8) → Dropzone (1,1) |
| Estaciones | 2 en (0,5) y (9,5) - EN RUTAS CRÍTICAS |
| Drenaje energético | 2.5 por movimiento |
| Tiempo límite | 70 segundos |
| Inicio | (0,9) |

**Propósito**:
- Múltiples objetivos requieren priorización
- Estaciones en ubicaciones estratégicas
- Jugador debe planificar ruta considerando energía AND satisfacción
- Máximo desafío sin ser imposible

---

### 3. Actualización de Quiz

Nuevo quiz con 3 preguntas (antes 2):
1. ¿Qué sucede con la satisfacción del paquete cuando no se entrega rápidamente?
   - ✓ Disminuye gradualmente (correcta)
   
2. ¿Cuál es el propósito principal de las estaciones con rayo?
   - ✓ Recargar energía del sistema (correcta)
   
3. ¿Qué estrategia es más eficiente con múltiples paquetes?
   - ✓ Priorizar según satisfacción y distancia (correcta)

---

## LASER PUZZLE GAME UPDATES ✅

### 1. Aumento de Dificultad (Par)

| Nivel | ANTES | AHORA | Razón |
|-------|-------|-------|-------|
| Alpha | Par=2 | Par=4 | Aumentar complejidad, evitar trivialidad |
| Beta | Par=3 | Par=6 | Incremento doble para bifurcadores |
| Gamma | Par=4 | Par=8 | Máxima complejidad con portales |

---

### 2. Introducción Gradual de Componentes

#### NIVEL 1: "Sector Alpha - Reflectores Básicos"
- **Componentes**: Solo reflectores (/ y \\)
- **Tamaño**: 8×7 (aumentado de 8×6)
- **Par**: 4 movimientos (requiere pensamiento)
- **Tiempo**: 50 segundos
- **Objetivo**: Aprender mecánica de reflexión con espacio para experimentar
- **Reflectores**: 3 disponibles (aumentado de 2)

```
Ship: (0,3) → right
Antenna: (7,0)
Reflectors: (3,3), (5,1), (2,5) - todos movibles
```

---

#### NIVEL 2: "Sector Beta - Bifurcadores Introducidos"
- **Componentes**: Bifurcadores + reflectores
- **Tamaño**: 10×7 (mucho más grande)
- **Par**: 6 movimientos (complejidad aumenta)
- **Tiempo**: 65 segundos
- **Objetivo**: Aprender que bifurcadores dividen el haz
- **Reflectores**: 3 disponibles
- **Bifurcadores**: 1 disponible

```
Ship: (0,3) → right
Antennas: (9,1) y (9,5)
Bifurcator: (3,3) - debe dividir haz
Reflectors: (6,1), (6,5), (1,0) - para cada rama
```

**Nota**: Bifurcador es el paso crítico; luego reflejar cada rama.

---

#### NIVEL 3: "Sector Gamma - Portales & Obstáculos"
- **Componentes**: Portales + bifurcadores + reflectores + obstáculos
- **Tamaño**: 10×8 (grid mayor para complejidad)
- **Par**: 8 movimientos (verdadero rompecabezas)
- **Tiempo**: 80 segundos
- **Objetivo**: Sistema de portales para atravesar obstáculos
- **Obstáculos**: Paredes verticales + cluster adicional
- **Quiz**: 2 preguntas (introducida como aprendizaje de nivel)

```
Ship: (0,3) → right
Portal Entry: (2,3) → Exit: (6,5)
Antenna: (9,0)
Walls: Barrera vertical en x=4 + cluster en (8,6-7)
Reflectors: (3,6), (7,2), (9,3) - múltiples rutas
```

**Estrategia**:
1. Pasar por portal para rodear barrera
2. Usar reflectores para ajustar dirección post-portal
3. Alcanzar antena en esquina

---

### 3. Nuevas Preguntas de Quiz

Nivel 3 ahora incluye 2 preguntas conceptuales:
1. ¿Cuál es el propósito del portal?
   - ✓ Trasladar el haz a otro punto (correcta)
   
2. ¿Qué hace el bifurcador?
   - ✓ Divide el haz en dos trayectorias (correcta)

---

## CURVA DE DIFICULTAD

### GridFlow
```
Nivel 1: ████░░░░░░ (Fácil - Aprender)
Nivel 2: ███████░░░ (Medio - Energía)
Nivel 3: █████████░ (Difícil - Múltiples objetivos)
```

**Tiempo de progresión esperado**:
- Nivel 1: 1-2 minutos (aprendizaje)
- Nivel 2: 2-3 minutos (energía + estrategia)
- Nivel 3: 3-5 minutos (optimización)
- **Total**: ~6-10 minutos para demo

---

### LaserPuzzle
```
Nivel 1: ███░░░░░░░ (Fácil - Reflejos)
Nivel 2: █████░░░░░ (Medio - Bifurcadores)
Nivel 3: ████████░░ (Difícil - Portales + Obstáculos)
```

**Tiempo de progresión esperado**:
- Nivel 1: 1-2 minutos
- Nivel 2: 2-3 minutos
- Nivel 3: 3-4 minutos
- **Total**: ~6-9 minutos para demo

---

## CAMBIOS COMPORTAMENTALES

### Para Jugadores
- ✅ Progresión clara de dificultad
- ✅ Cada nivel introduce UN concepto nuevo
- ✅ Puzzles más desafiantes pero justos
- ✅ Tiempo suficiente para resolver (con margen)
- ✅ Retroalimentación visual mejorada

### Para Telemetría
- ✅ Más puntos de decisión (mejor captura de datos)
- ✅ Mayor variabilidad de estrategias (menos coincidencias)
- ✅ Puntuaciones más diferenciadas (mejor discriminación)

---

## PRÓXIMAS PRUEBAS RECOMENDADAS

1. **Prueba Local**: Jugar los 3 niveles de cada juego
   - Verificar que son "justos" (solubles en tiempo límite)
   - Confirmar progresión de dificultad

2. **Medición de Tiempos**:
   - Registrar cuánto tarda cada nivel
   - Ajustar `timeLimit` si es necesario

3. **Feedback de Usuarios**:
   - Preguntar si los niveles "tienen sentido"
   - Ajustar posiciones/puntajes si es necesario

4. **Validación de Backend**:
   - Confirmar que `saveSessionToBackend` se ejecuta post-demo
   - Verificar que datos de demostración se guardan correctamente

---

## ARCHIVOS MODIFICADOS
- `src/games/GridFlowGame.jsx` (LEVELS, QUIZ, SAT_DECAY)
- `src/games/LaserPuzzleGame.jsx` (DEMO_LEVELS, quiz)
- `src/components/PostDemoScreen.jsx` (Report prop removido isDummy)

---

**Status**: ✅ Implementación completada
**Próximo paso**: Validación local + pruebas de usuario

# Análisis Exhaustivo: GridFlow & LaserPuzzle

## RESUMEN EJECUTIVO

Ambos juegos tienen estructura interesante pero sus **niveles carecen de progresión clara y balanceo**. Los niveles son muy simples para jugadores humanos y no proporcionan retroalimentación clara sobre dificultad progresiva.

---

## 1. GRIDFLOW GAME ANALYSIS

### Estructura Actual
- **GRID**: 10×10
- **SAT_DECAY**: 2% por segundo (cae rápidamente)
- **CELL SIZE**: 60px
- **3 NIVELES**

### Nivel 1: "Flujo Básico"
```
Tamaño: 10×10
Paredes: Ninguna
Objetivos: 1 (rojo, 150pts)
  - Pickup: (2,2)
  - Dropzone: (8,8)
  - Distancia: 12 casillas
Estaciones: Ninguna
Energía: Sin drenaje
Tiempo: 45 segundos
```
**PROBLEMAS**:
- Trivial: es solo ir en diagonal de 12 casillas
- SAT decay sin penalización (energyDrain=0 significa que no importa si se demora)
- No hay restricciones ni desafío
- Tiempo sobrante (~30 segundos si se juega óptimamente)

**IMPACTO**: Jugador aprende los controles pero **sin presión ni estrategia**.

---

### Nivel 2: "Obstrucción Vertical"
```
Tamaño: 10×10
Paredes: Línea vertical en x=4 (8 bloques desde arriba)
Objetivos: 1 (azul, 150pts)
  - Pickup: (2,8)
  - Dropzone: (8,2)
  - Distancia ~12 casillas con rodeo obligatorio
Estaciones: 1 en (5,5)
Energía: Drenaje de 3 por movimiento
Tiempo: 60 segundos
```

**ANÁLISIS DE VIABILIDAD**:
- Movimientos óptimos: ~14 casillas (rodeo alrededor de pared)
- Con drenaje 3 × 14 = 42 energía consumida
- Comienza con 100 energía → 58 energía restante → Viable
- Estación en (5,5) está fuera de ruta óptima
- Si no visita estación: energía baja pero viable

**PROBLEMAS**:
- La estación está colocada de forma que **no es crítica** para la solución óptima
- Si el jugador es ineficiente (toma 25+ movimientos), corre riesgo de quedarse sin energía
- **No hay incentivo para usar la estación**
- Transición abrupta de "sin restricciones" a "restricción energética"

**IMPACTO**: Jugador siente presión pero **no ve una estrategia clara** de cuándo usar la estación.

---

### Nivel 3: "Múltiples Objetivos + Matriz de Obstáculos"
```
Tamaño: 10×10
Paredes: Matriz de bloques 2×2 en 4 ubicaciones
  - (1,1)-(2,2), (4,1)-(5,2), (7,1)-(8,2)
  - (1,5)-(2,6), (4,5)-(5,6), (7,5)-(8,6)
  - Patrón similar a "checkerboard"
Objetivos: 2
  - Objetivo 1 (verde): Pickup (4,4) → Dropzone (0,9) = ~9 casillas
  - Objetivo 2 (naranja): Pickup (0,0) → Dropzone (9,9) = ~18 casillas
Estaciones: 2 en (5,4) y (9,0)
Energía: Drenaje 5 por movimiento
Tiempo: 75 segundos
Inicio: (5,9) - NO en (0,0)
```

**ANÁLISIS DE VIABILIDAD**:
- Total movimientos sin optimización: ~30 casillas
- Con drenaje 5: 150 energía consumida
- Comienza con 100 energía → **INSUFICIENTE sin visitar estaciones**
- **Estación en (5,4) está cerca del objetivo verde**
- **Estación en (9,0) está en la ruta del objetivo naranja**

**PROBLEMAS**:
- Combinación de 2 objetivos es caótica
- No está claro cuál recoger primero
- SAT decay significa que si toma mucho tiempo, pierde puntos
- Posición inicial fuera de (0,0) es confusa

**IMPACTO**: Jugador se siente **abrumado**, no hay progresión clara.

---

## 2. LASER PUZZLE GAME ANALYSIS

### Estructura Actual
- **TABLERO BASE**: 8×6 células
- **COMPONENTES**: Reflejos (/\\), Bifurcadores (+), Portales (P)
- **3 NIVELES**

### Nivel 1: "Alineación Básica"
```
Nombre: Sector Alpha
Tamaño: 8×6
Componentes:
  - Ship: (0,4) → dirección DERECHA
  - Antena: (6,1)
  - Reflectores movibles: (3,5) tipo NE, (5,3) tipo NE
Par (movimientos óptimos): 2
TimeLimit: 45 segundos
```

**SOLUCIÓN ESPERADA**:
1. Mover reflector en (3,5) a (5,4)
2. Mover reflector en (5,3) a (6,0)
3. Haz: (0,4)→derecha→(5,4)[reflejo arriba]→(5,0)[reflejo derecha]→(6,0)→antena

**PROBLEMAS**:
- Par=2 es muy bajo (solo 2 movimientos)
- Tablero muy pequeño (8×6)
- No hay obstáculos
- Muy evidente cuál es la solución
- **Demasiado fácil para un primer nivel "de demostración"**

**IMPACTO**: Jugador entiende mecánicas pero **no hay verdadero rompecabezas**.

---

### Nivel 2: "Bifurcación"
```
Nombre: Sector Beta
Tamaño: 8×6
Componentes:
  - Ship: (0,3) → dirección DERECHA
  - Antenas: (7,1) y (7,5)
  - Bifurcador movible: (3,2)
  - Reflectores movibles: (5,1) tipo NE, (5,5) tipo NW
Par (movimientos óptimos): 3
TimeLimit: 60 segundos
```

**SOLUCIÓN**:
1. Bifurcador divide en dos caminos
2. Un reflector para antena superior
3. Otro reflector para antena inferior

**PROBLEMAS**:
- Introducir bifurcación de repente sin preparación gradual
- Espacio muy apretado (8×6)
- Par=3 sigue siendo bajo
- Posiciones iniciales no están bien distribuidas

**IMPACTO**: Salto abrupto de dificultad. Jugador puede no entender cómo funciona la bifurcación.

---

### Nivel 3: "Portales y Obstáculos"
```
Nombre: Sector Gamma
Tamaño: 8×8 (ahora más grande)
Componentes:
  - Ship: (0,2) → dirección DERECHA
  - Portal de salida: (3,2)
  - Portal de entrada: (5,6)
  - Antena: (7,6)
  - Obstáculos (paredes): (4,0-4), bloquean ruta directa
  - Reflectores movibles: (1,6) tipo NE, (6,3) tipo NW
  - Quiz: 1 pregunta
Par (movimientos óptimos): 4
TimeLimit: 75 segundos
```

**SOLUCIÓN**:
- Usar portal para atravesar obstáculos
- Reflejos para alcanzar antena desde portal de salida

**PROBLEMAS**:
- Portales son un nuevo componente sin introducción gradual
- Paredes bloquean ruta pero no hay "pista visual" clara
- Par=4 es arbitrario
- Quiz al final no se conecta con el nivel

**IMPACTO**: Confuso. No hay motivación para usar portales.

---

## 3. PROBLEMAS TRANSVERSALES

### GridFlow
1. **SAT_DECAY constante**: Decae 2% cada segundo sin importar acciones
2. **Quiz desconectado**: Preguntas sobre "satisfacción" pero el mecanismo no es claro en la UI
3. **Movimientos totales no rastreados**: No hay feedback sobre eficiencia
4. **Niveles sin narrativa**: No hay conexión entre niveles

### LaserPuzzle
1. **Par muy bajo**: 2, 3, 4 movimientos es demasiado simple
2. **Componentes introducidos sin tutoriales**: Bifurcadores, portales aparecen de repente
3. **Heurística de búsqueda débil**: Jugador puede "probar" sin pensar
4. **Feedback visual insuficiente**: No hay indicadores de "casi correcto"

---

## 4. RECOMENDACIONES

### Para GridFlow
1. **Revisar SAT_DECAY**: Hacer que sea más lento (1% por segundo en lugar de 2%)
2. **Nivelar dificultad**:
   - Nivel 1: Sin energía, 1 objetivo simple, 30 segundos
   - Nivel 2: Energía baja, 1 objetivo con rodeo, 45 segundos, estación crítica
   - Nivel 3: Energía media, 2 objetivos con priorización, 60 segundos
3. **Mejorar posiciones**: Estaciones deben estar EN la ruta óptima, no fuera
4. **Agregar UI**: Mostrar "movimientos" y "eficiencia"

### Para LaserPuzzle
1. **Aumentar Par**:
   - Nivel 1: Par=4 (no 2)
   - Nivel 2: Par=6 (no 3)
   - Nivel 3: Par=8 (no 4)
2. **Introducir componentes gradualmente**:
   - Nivel 1: Solo reflejos (/\\)
   - Nivel 2: Agregar bifurcadores (+)
   - Nivel 3: Agregar portales (P)
3. **Aumentar tablero**:
   - Nivel 1: 8×6 (mantener)
   - Nivel 2: 10×7
   - Nivel 3: 10×8 o 12×8
4. **Mejorar obstáculos**: Hacer que sean visuales e inevitables
5. **Agregar hints**: Sistema de sugerencias progresivas

---

## 5. PRÓXIMOS PASOS

1. Implementar cambios en LEVELS (GridFlow) y DEMO_LEVELS (Laser)
2. Ajustar SAT_DECAY y tiempos límite
3. Agregar métricas de "movimientos" en UI
4. Pruebas de jugabilidad con usuarios reales

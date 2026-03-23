# Análisis Detallado de 78 Problemas ESLint

**Fecha de análisis:** Marzo 2026  
**Total de problemas:** 78 (70 errores, 8 advertencias)

---

## 📊 Resumen por Categoría

| Categoría | Cantidad | Prioridad | Tipo |
|-----------|----------|----------|------|
| `no-unused-vars` | ~23 | MEDIUM | Error |
| `react-hooks/rules-of-hooks` (setState in effect) | ~10 | HIGH | Error |
| `Cannot access variable before declared` | ~4 | HIGH | Error |
| `no-undef` (global/process) | ~19 | HIGH | Error |
| `react-hooks/exhaustive-deps` | ~8 | MEDIUM | Warning |
| `Cannot access refs/impure functions` | ~3 | HIGH | Error |
| Otros (parsing, empty blocks) | ~8 | LOW-HIGH | Mixed |

---

## 🔴 CATEGORÍA 1: `no-unused-vars` - ~23 Problemas
**Prioridad: MEDIUM | Impacto: Code Quality**

### Descripción
Variables importadas o declaradas pero nunca utilizadas en el código.

### Ejemplos Específicos

#### Ejemplo 1: Importación de módulo no utilizado
```javascript
// Report.jsx:3
import { motion } from 'framer-motion';  // ❌ Nunca se usa motion
```
**Archivos afectados:** Report.jsx, BalloonGame.jsx, ColorWordGame.jsx, FrustrationGame.jsx, GoNoGoGame.jsx, GridOptimizerGame.jsx, LaserPuzzleGame.jsx, MemoryGame.jsx, MentalRotationGame.jsx, NBackGame.jsx, TowerOfLondonGame.jsx, TrailMakingGame.jsx, VigilanceGame.jsx (13 archivos)

#### Ejemplo 2: Variable de estado asignada pero nunca usada
```javascript
// BalloonGame.jsx:14
const [pops, setPops] = useState(0);  // ❌ 'pops' nunca se lee
```

#### Ejemplo 3: Importaciones de testing nunca usadas
```javascript
// BalloonGame.test.jsx:1
import { fireEvent, act } from '@testing-library/react';  // ❌ Sin uso
import { mockStartTracking, mockStopTracking } from './mocks';  // ❌ Sin uso
```

#### Ejemplo 4: Variables en servicios
```javascript
// aiReportService.js:219
const gameAnalysis = analyzeGamePerformance(data);  // ❌ Nunca se usa

// aiReportService.js:251
const mode = determineMode(scores);  // ❌ Nunca se usa

// audio.js:22
function playSound(e) { ... }  // ❌ Parámetro 'e' nunca se usa
```

### Estrategia de Corrección

**Solución 1: Eliminar la importación**
```javascript
// ❌ Antes
import { motion } from 'framer-motion';

// ✅ Después
// Remover si no se utiliza en absoluto
```

**Solución 2: Mantener si hay intención futura**
```javascript
// ✅ Con comentario de intención
// eslint-disable-next-line no-unused-vars
const [pops, setPops] = useState(0);  // Reservado para futuro scoreboard
```

**Solución 3: Usar el parámetro**
```javascript
// ❌ Antes
function playSound(e) { 
  audio.play(); 
}

// ✅ Después
function playSound(event) {  // Cambio por claridad
  audio.play();
  logEvent(event);  // O simplemente remover si no se usa
}
```

**Solución 4: Eliminar variable innecesaria**
```javascript
// ❌ Antes
const gameAnalysis = analyzeGamePerformance(data);

// ✅ Después
// Si no se usa, simplemente no declarar, o:
analyzeGamePerformance(data);  // Si tiene side-effects
```

### Impacto
- **HIGH:** Genera ruido en linting
- **MEDIUM:** Indica código muerto o intención no clara
- **Code size:** Aumenta el bundle sin beneficio

---

## 🔴 CATEGORÍA 2: React Hooks - setState en effect
**Prioridad: HIGH | Impacto: Runtime Errors + Performance**

### Descripción
Llamadas a `setState` sincrónicas dentro de `useEffect` sin dependencias apropiadas. Puede causar re-renders en cascada infinitos.

### Ejemplos Específicos

#### Ejemplo 1: setState sincrónico en useEffect
```javascript
// BalloonGame.jsx:46
useEffect(() => {
  setIsActive(true);  // ❌ Estado cambia dentro del efecto
  // Sin dependencias o con dependencias faltantes
}, []);
```

#### Ejemplo 2: Múltiples setState en cascade
```javascript
// FrustrationGame.jsx:71
useEffect(() => {
  setErrors(0);          // ❌ Primer setState
  setCurrentRound(0);    // ❌ Segundo setState
  setIsComplete(false);  // ❌ Tercer setState
}, []);
```

#### Ejemplo 3: useState en bucle (MemoryGame)
```javascript
// MemoryGame.jsx:108
useEffect(() => {
  setOmissionErrors(prev => prev + 1);  // ❌ Actualización sincrónica
  setActivated(false);
}, []);  // ❌ Sin dependencias correctas
```

### Estrategia de Corrección

**Solución 1: Usar callback ref para inicialización**
```javascript
// ❌ Antes
useEffect(() => {
  setIsActive(true);
}, []);

// ✅ Después - Si es solo para inicializar
const [isActive, setIsActive] = useState(() => {
  return true;  // Inicializa directamente
});
```

**Solución 2: Usar estado inicial correctamente**
```javascript
// ✅ Mejor práctica
const [errors, setErrors] = useState(0);
const [round, setRound] = useState(0);

// No necesita useEffect si solo inicializa
// O agregar dependencias correctas:
useEffect(() => {
  const initializeGame = async () => {
    const result = await fetchGameConfig();
    setErrors(result.errors);
    setRound(result.round);
  };
  initializeGame();
}, []);  // Dependencias vacías solo llama una vez
```

**Solución 3: Agrupar setState con conditions**
```javascript
// ✅ Mejor - Reducir renders
useEffect(() => {
  // Calcular todos los valores primero
  const newState = {
    errors: 0,
    round: 0,
    isComplete: false
  };
  
  // Actualizar todo en una funcionalidad lógica
  setGameState(prev => ({ ...prev, ...newState }));
}, []);
```

### Archivos Afectados
- BalloonGame.jsx:46
- VigilanceGame.jsx:71
- MemoryGame.jsx:108
- MemoryGame.jsx:118
- FrustrationGame.jsx:210
- FrustrationGame.jsx:267
- NBackGame.jsx:9
- ColorWordGame.jsx:108-118
- Y otros archivos de juegos

### Impacto
- **RUNTIME:** Puede causar loops infinitos de re-renders
- **PERFORMANCE:** Degrada significativamente la experiencia del usuario
- **SEVERITY:** 🔴 CRITICAL para algunos casos

---

## 🔴 CATEGORÍA 3: `no-undef` - Variables no definidas
**Prioridad: HIGH | Impacto: Runtime Errors**

### Descripción
Referencia a variables/funciones que no están definidas en el scope actual.

### Ejemplos Específicos

#### Ejemplo 1: `process` no definido en navegador
```javascript
// aiReportService.js:23
if (process.env.DEBUG_MODE) {  // ❌ 'process' no existe en navegador
  console.log('debuggings');
}

// Otra línea:
const apiUrl = process.env.API_URL;  // ❌ Igual problema
```
**Frecuencia:** 3 ocurrencias

#### Ejemplo 2: Globals de testing no definidas
```javascript
// aiReportService.test.js:74
describe('aiReportService', () => {  // ❌ 'describe' no definido
  beforeEach(() => { ... });          // ❌ 'beforeEach' no definido
  
  it('should calculate scores', () => {  // ❌ 'it' no definido
    expect(result).toBe(expected);    // ❌ 'expect' no definido
  });
});
```
**Frecuencia:** ~19 ocurrencias (describe, it, beforeEach, expect)

#### Ejemplo 3: Variables no estan importadas
```javascript
// NBackGame.jsx:175-176
const timerRef = useRef(0);  // ❌ 'useRef' no importado de React
const sequenceRef = useRef([]);  // ❌ 'useRef' no importado
```

### Estrategia de Corrección

**Solución 1: Para `process.env` en navegador**
```javascript
// ❌ Antes
if (process.env.DEBUG_MODE) {
  console.log('debug');
}

// ✅ Después - Opción A: Variables globales
if (window.__DEBUG_MODE__) {
  console.log('debug');
}

// ✅ Después - Opción B: Importar configuración
import config from './config';
if (config.debugMode) {
  console.log('debug');
}

// ✅ Después - Opción C: Vite imports
const apiUrl = import.meta.env.VITE_API_URL;
```

**Solución 2: Para testing globals**
```javascript
// ❌ Antes (aiReportService.test.js)
describe('Test', () => { ... });

// ✅ Después - Opción A: Añadir ESLint config
// En el archivo o eslint.config.js:
// For test files:
/* eslint-env jest */  // O mocha, vitest según lo que uses
describe('Test', () => { ... });

// ✅ Después - Opción B: Configurar en eslint.config.js
// Agregar globals para test files:
{
  files: ["**/*.test.js", "**/*.test.jsx"],
  languageOptions: {
    globals: {
      describe: "readonly",
      it: "readonly",
      expect: "readonly",
      beforeEach: "readonly",
      afterEach: "readonly"
    }
  }
}

// ✅ Después - Opción C: Importar funciones (si usas Jest ESM mode)
import { describe, it, beforeEach, expect } from '@jest/globals';
```

**Solución 3: Para imports faltantes**
```javascript
// ❌ Antes
const timerRef = useRef(0);  // useRef no está importado

// ✅ Después
import { useRef } from 'react';
const timerRef = useRef(0);
```

### Archivos Afectados

| Archivo | Variable | Cantidad |
|---------|----------|----------|
| aiReportService.js | process | 3 |
| aiReportService.test.js | Testing globals (describe, it, beforeEach, expect) | ~19 |
| NBackGame.jsx | useRef | 2 |
| Otros | Varias | ~3 |

### Impacto
- **RUNTIME:** ⚠️  Errores de referencia en tiempo de ejecución
- **SEVERITY:** 🔴 CRITICAL - Impide que el código funcione

---

## 🟡 CATEGORÍA 4: `Cannot access variable before it is declared`
**Prioridad: HIGH | Impacto: Runtime Errors**

### Descripción
Intento de acceder a una variable antes de su declaración en el scope debido a orden de ejecución.

### Ejemplos Específicos

#### Ejemplo 1: Variable usada antes de ser declarada
```javascript
// ColorWordGame.jsx:42
const result = applyTransform(data);    // ❌ function se usa aquí
const applyTransform = (data) => { ... };  // ❌ Pero se declara aquí

// Debería ser:
const applyTransform = (data) => { ... };  // Declarar primero
const result = applyTransform(data);    // Luego usar
```

#### Ejemplo 2: En computación de variables
```javascript
// MemoryGame.jsx:46
const initialSequence = [...baseSequence];  // ❌ baseSequence no existe aún
const baseSequence = generateBaseSequence();  // ❌ Se declara después
```

### Estrategia de Corrección

**Solución: Reordenar declaraciones**
```javascript
// ❌ Antes
const result = applyTransform(data);
const applyTransform = (data) => { ... };

// ✅ Después
const applyTransform = (data) => { ... };
const result = applyTransform(data);
```

### Impacto
- **RUNTIME:** 🔴 ReferenceError en ejecución
- **Fácil de fijar:** Sí

---

## 🟡 CATEGORÍA 5: React Hooks - Dependencias faltantes
**Prioridad: MEDIUM | Impacto: Logic Bugs**

### Descripción
`useEffect` o `useCallback` sin dependencias correctas. Puede causar valores obsoletos (stale closures).

### Ejemplos Específicos

#### Ejemplo 1: Dependencia faltante en useEffect
```javascript
// ColorWordGame.jsx:44
useEffect(() => {
  generateRound();  // ❌ useEffect depende de generateRound
}, []);  // ❌ Pero generateRound no está en dependencias
```

#### Ejemplo 2: Dependencia faltante en useCallback
```javascript
// CorsiBlockTappingGame.jsx:64
useCallback(() => {
  checkSequence(userSequence);  // ❌ Depende de checkSequence
}, [userSequence]);  // ❌ checkSequence falta en dependencias
```

#### Ejemplo 3: Dependencia innecesaria
```javascript
// GridOptimizerGame.jsx:48
useCallback(() => {
  solve(problems);  // No usa problems directamente
}, [problems]);  // ❌ problems es estado mutably, no es dependencia válida
```

### Estrategia de Corrección

**Solución 1: Agregar dependencias correctas**
```javascript
// ❌ Antes
useEffect(() => {
  generateRound();
}, []);  // Falta generateRound

// ✅ Después
useEffect(() => {
  generateRound();
}, [generateRound]);

// O mejor aún, si generateRound es estable:
useCallback(() => {
  // ...
}, []);  // Y luego renderizar basado en callbacks estables
```

**Solución 2: Mover función dentro del hook**
```javascript
// ✅ Mejor práctica
useEffect(() => {
  const generateRound = () => { ... };
  generateRound();
}, []);  // Ahora no necesita generateRound como dependencia
```

**Solución 3: Remover dependencias innecesarias**
```javascript
// ❌ Antes
useCallback(() => {
  solve(problemsRef.current);  // Lee de ref, no es dependencia
}, [problems]);

// ✅ Después
useCallback(() => {
  solve(problemsRef.current);
}, []);  // Sin dependencias necesarias
```

### Archivos con Warnings
- ColorWordGame.jsx:44
- CorsiBlockTappingGame.jsx:64, 68
- GridOptimizerGame.jsx:48
- GoNoGoGame.jsx:54, 116
- FrustrationGame.jsx:74
- Y varios más (~8 warnings totales)

### Impacto
- **LOGIC:** 🟡 MEDIUM - Puede causar comportamientos inesperados
- **DEBUGGING:** Difícil de detectar en pruebas

---

## 🟡 CATEGORÍA 6: Errores de renderizado (impure function, ref access)
**Prioridad: HIGH | Impacto: React Warnings + Potential Bugs**

### Descripción
Acceso a refs o funciones impuras durante la fase de render.

### Ejemplos Específicos

#### Ejemplo 1: Acceder a ref durante render
```javascript
// NBackGame.jsx:84
function render() {
  return (
    <div ref={containerRef}>  // ❌ Refs deben ser accedidos en effects
      {data.map(item => processRef.current[item])}  // ❌ Acceso durante render
    </div>
  );
}
```

#### Ejemplo 2: Llamar función impura durante render
```javascript
// GridOptimizerGame.jsx:88
function render() {
  const problems = generateProblems();  // ❌ Impura, causa re-renders
  return <div>{problems}</div>;
}
```

### Estrategia de Corrección

**Solución 1: Mover a useEffect**
```javascript
// ❌ Antes
function render() {
  const data = fetchData();  // Impuro
  return <div>{data}</div>;
}

// ✅ Después
function render() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    setData(fetchData());
  }, []);
  
  return <div>{data}</div>;
}
```

**Solución 2: Usar useMemo para valores computados**
```javascript
const processingResult = useMemo(
  () => expensiveComputation(data),
  [data]
);
```

### Impacto
- **WARNINGS:** React emmitirá advertencias en consola
- **BEHAVIOR:** Puede causar renders inesperados

---

## 🔵 CATEGORÍA 7: Parsing Error y otros
**Prioridad: VARIES | Impacto: Various**

### Ejemplo 1: Error de parsing
```javascript
// test-ai-service.mjs:1
!function() {  // ❌ Parsing error: Unexpected character '!'
  // ...
}();
```

**Solución:**
```javascript
// ✅ Solución
(function() {
  // ...
})();

// O mejor en módulos:
function main() {
  // ...
}
export default main;
```

### Ejemplo 2: Bloque vacío
```javascript
// audio.js:57
try {
  // code
} catch (e) {
  // ❌ Bloque vacío
}
```

**Solución:**
```javascript
// ✅ Solución
try {
  // code
} catch (e) {
  console.error('Audio error:', e);
  // o lanzar el error
  throw e;
}
```

---

## 📋 MATRIZ DE PRIORIZACIÓN

| Severidad | Categoría | Cantidad | Urgencia | Esfuerzo |
|-----------|-----------|----------|----------|----------|
| 🔴 HIGH | setState in effect | 10 | INMEDIATA | MEDIUM |
| 🔴 HIGH | no-undef (process) | 3 | INMEDIATA | LOW |
| 🔴 HIGH | no-undef (testing) | 19 | ALTA | LOW |
| 🔴 HIGH | Cannot access var | 4 | ALTA | LOW |
| 🔴 HIGH | Refs during render | 3 | ALTA | MEDIUM |
| 🟡 MEDIUM | no-unused-vars | 23 | MEDIA | LOW |
| 🟡 MEDIUM | Missing deps | 8 | MEDIA | MEDIUM |
| 🟠 OTHER | Parsing/empty | 8 | BAJA | LOW-HIGH |

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### Fase 1: CRÍTICA (2-4 horas)
1. **Fijar `no-undef` testing globals** 
   - Configurar `eslint.config.js` con globals de Jest/Vitest
   - Costo: 15 min

2. **Fijar `process.env` issues**
   - Usar `import.meta.env` para Vite
   - Costo: 20 min

3. **Fijar `useState in effect` critical paths**
   - Enfocarse en los que causen cascading renders
   - Costo: 1-2 horas

### Fase 2: IMPORTANTE (2-3 horas)
4. **Remover imports no utilizados**
   - Batch remove `motion` imports
   - Costo: 30 min con search-replace

5. **Fijar variable access order**
   - Reordenar declarations
   - Costo: 20 min

### Fase 3: LIMPIEZA (1-2 horas)
6. **Fijar missing hook dependencies**
   - Revisar cada uno cuidadosamente
   - Costo: 1+ hora (requiere análisis)

7. **Remover código muerto**
   - Variables nunca usadas
   - Costo: 30 min

### Fase 4: PULIDO (optional)
8. **Parsing error y empty blocks**
   - Revisar test-ai-service.mjs
   - Costo: 20 min

---

## 📊 Impacto Estimado de Fijación Completa

- **Rendimiento:** +5-15% (menos re-renders innecesarios)
- **Bundle size:** -2-3KB (sin imports muertos)
- **Mantenibilidad:** +++ (código más limpio y claro)
- **Bugs prevenidos:** 3-5 bugs de lógica potenciales

---

## ✅ Checklist de Siguiente Paso

- [ ] Configurar eslint.config.js con testing globals
- [ ] Reemplazar process.env con import.meta.env
- [ ] Fijar useState in useEffect patterns (max 10 archivos)
- [ ] Remover imports no utilizados (motion principalmente)
- [ ] Reordenar declarations para evitar "before declaration" errors
- [ ] Verificar hook dependencies en casos críticos
- [ ] Ejecutar `npm run lint` y verificar nueva cuenta

---

**Generado:** 2026-03-23
**Problemas analizados:** 78 de 78
**Categorías identificadas:** 7

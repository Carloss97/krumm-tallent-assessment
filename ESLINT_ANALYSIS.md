# Análisis de 84 Problemas de ESLint

## 📊 Resumen Ejecutivo

| Categoría | Cantidad | % | Tipo |
|-----------|----------|-------|------|
| `no-unused-vars` | 23 | 27.4% | Error |
| `react-hooks/exhaustive-deps` | 9 | 10.7% | Warning |
| `react-hooks/set-state-in-effect` | 9 | 10.7% | Error |
| `react-hooks/immutability` | 6 | 7.1% | Error |
| `no-undef` | 19 | 22.6% | Error |
| `react-hooks/refs` | 1 | 1.2% | Error |
| `react-hooks/purity` | 3 | 3.6% | Error |
| `no-empty` | 1 | 1.2% | Error |
| `Unused eslint-disable directive` | 1 | 1.2% | Warning |
| `Parse error` | 1 | 1.2% | Error |
| `Unnecessary dependency` | 1 | 1.2% | Warning |

**Total: 74 Errores | 10 Warnings**

---

## 1️⃣ VARIABLES NO UTILIZADAS (`no-unused-vars`) - 23 problemas

### Ubicación en archivos:
```
load-test.js:198:12          'error'
Report.jsx:1:38              'useMemo'
BalloonGame.jsx:2:10         'motion'
BalloonGame.jsx:14:10        'pops'
BalloonGame.test.jsx:1:26    'fireEvent'
BalloonGame.test.jsx:1:37    'act'
BalloonGame.test.jsx:22:11   'mockStartTracking'
BalloonGame.test.jsx:23:11   'mockStopTracking'
ColorWordGame.jsx:2:10       'motion'
CorsiBlockTappingGame.jsx:2:10 'motion'
FrustrationGame.jsx:2:10     'motion'
GoNoGoGame.jsx:2:10          'motion'
GridOptimizerGame.jsx:2:10   'motion'
LaserPuzzleGame.jsx:2:10     'motion'
MemoryGame.jsx:2:10          'motion'
MentalRotationGame.jsx:2:10  'motion'
NBackGame.jsx:2:10           'motion'
TowerOfLondonGame.jsx:2:10   'motion'
TrailMakingGame.jsx:2:10     'motion'
VigilanceGame.jsx:2:10       'motion'
VigilanceGame.jsx:5:55       'timeLimit'
WisconsinCardSortingGame.jsx:2:10 'motion'
aiReportService.js:219:40    'gameAnalysis'
aiReportService.js:251:54    'mode'
audio.js:22:12               'e'
audio.js:57:11               'e'
```

### 🔧 Enfoque de Corrección:

**Opción A: Eliminar las variables**
- Si realmente no se usan, eliminar la declaración/import
- Revisar si fue código anterior que ya no es necesario

**Opción B: Utilizar las variables**
- Si son necesarias para lógica futura, usarlas
- Documentar por qué se importan si no se usan aún (con comentario)

**Opción C: Usar prefijo underscore (para variables que no se pueden quitar)**
```javascript
// Cambiar
import { fireEvent, act } from '@testing-library/react';

// A
import { fireEvent as _fireEvent, act as _act } from '@testing-library/react';
// O si realmente no se necesitan
// import { /* fireEvent, act */ } from '@testing-library/react';
```

---

## 2️⃣ VARIABLES NO DEFINIDAS (`no-undef`) - 19 problemas

### Ubicación en archivos:
```
App.jsx:11:16           'lazy' no definido
App.jsx:12:15           'lazy' no definido
LaserPuzzleGame.jsx:175:21   'useRef' no definido
LaserPuzzleGame.jsx:176:23   'useRef' no definido
aiReportService.js:23:58     'process' no definido
aiReportService.js:23:73     'process' no definido
aiReportService.js:24:9      'process' no definido
aiReportService.test.js:74:1    'describe' no definido
aiReportService.test.js:75:3    'beforeEach' no definido
aiReportService.test.js:79:3    'describe' no definido
aiReportService.test.js:80:5    'it' no definido
aiReportService.test.js:82:7    'expect' no definido
aiReportService.test.js:83:7    'expect' no definido
aiReportService.test.js:84:7    'expect' no definido
aiReportService.test.js:85:7    'expect' no definido
aiReportService.test.js:89:3    'describe' no definido
aiReportService.test.js:90:5    'it' no definido
aiReportService.test.js:93:7    'expect' no definido
aiReportService.test.js:94:7    'expect' no definido
...más en aiReportService.test.js (muchos 'describe', 'it', 'expect')
test-ai-service.mjs:1:4      Error de parsing - carácter inesperado '!'
```

### 🔧 Enfoque de Corrección:

**Para `lazy` en App.jsx:**
```javascript
// Cambiar
const BalloonGame = lazy(() => import('./games/BalloonGame'));

// A
import { lazy } from 'react';
const BalloonGame = lazy(() => import('./games/BalloonGame'));
```

**Para `useRef` en LaserPuzzleGame.jsx:**
```javascript
import { useRef } from 'react';
```

**Para `process` en aiReportService.js:**
- Revisar si está usando `process.env`
- Reemplazar con importación de variables de entorno o configuración
- O agregar: `/* global process */` al inicio del archivo

**Para `describe`, `it`, `expect` en archivos .test.js:**
- Agregar configuración en `eslint.config.js` para marcar Jest como entorno
- O agregar comentario: `/* global describe, beforeEach, it, expect */`

**Para error de parsing en test-ai-service.mjs:**
- Revisar el archivo y corregir el carácter inválido en línea 1

---

## 3️⃣ SETSTATE SINCRÓNICO EN EFFECTS (`react-hooks/set-state-in-effect`) - 9 PROBLEMAS

### Ubicación en archivos:
```
Report.jsx:30:7
LaserPuzzleGame.jsx:210:9
LaserPuzzleGame.jsx:267:7
TrailMakingGame.jsx:71:7
VigilanceGame.jsx:108:7
VigilanceGame.jsx:118:9
useGameTimer.js:9:7

Problema: setState sincrónico dentro de useEffect puede causar renders en cascada
```

### 🔧 Enfoque de Corrección:

**Patrón: Usar useEffect con inicialización separada**

❌ Incorrecto:
```javascript
useEffect(() => {
  if (condition) {
    setState(true);  // ← Evitar esto
    doSomethingAsync();
  }
}, []);
```

✅ Correcto:
```javascript
// Opción 1: Inicializar fuera del effect
useState(() => {
  if (condition) setState(true);
}, [condition]);

// Opción 2: Usar useCallback + useEffect para separar la lógica
useEffect(() => {
  if (condition) {
    const handler = async () => {
      doSomethingAsync();
    };
    handler();
  }
}, [condition]);

// Opción 3: Llamar setState en una Promise/callback
useEffect(() => {
  if (condition) {
    Promise.resolve().then(() => setState(true));
  }
}, []);
```

---

## 4️⃣ DEPENDENCIAS INCOMPLETAS EN HOOKS (`react-hooks/exhaustive-deps`) - 9 PROBLEMAS

### Ubicación en archivos:
```
BalloonGame.jsx:31:6        Falta 'initRound' en dependencias
ColorWordGame.jsx:44:6      Falta 'generateRound' en dependencias
CorsiBlockTappingGame.jsx:64:6  Falta 'checkSequence'
GoNoGoGame.jsx:54:6         Falta 'handleTimeout'
GoNoGoGame.jsx:116:6        Falta 'handleResponse'
MentalRotationGame.jsx:74:6  Falta 'handleTimeout'
NBackGame.jsx:78:6          Faltan 'advanceRound' y 'handleNoResponse'
TowerOfLondonGame.jsx:48:6   Dependencia innecesaria 'problems'
```

### 🔧 Enfoque de Corrección:

**Patrón: Agregar dependencias faltantes o usar useCallback**

❌ Incorrecto:
```javascript
useEffect(() => {
  generateRound();
}, []); // ← generateRound no está en las dependencias
```

✅ Correcto (Opción 1 - usar useCallback):
```javascript
const generateRound = useCallback((...) => {
  // ...
}, [dependencies]);

useEffect(() => {
  generateRound();
}, [generateRound]); // ← Ahora está incluida
```

✅ Correcto (Opción 2 - agregar dependencia):
```javascript
useEffect(() => {
  generateRound();
}, [generateRound]); // ← Declarar si proviene del scope
```

✅ Correcto (Opción 3 - si es realmente solo al montado):
```javascript
useEffect(() => {
  const generateRound = () => { /* ... */ };
  generateRound();
}, []); // ← Mover la función dentro del effect
```

---

## 5️⃣ ACCESO A VARIABLES ANTES DE DECLARACIÓN (`react-hooks/immutability`) - 6 PROBLEMAS

### Ubicación en archivos:
```
BalloonGame.jsx:29:7        'initRound' accedida antes de decl.
ColorWordGame.jsx:42:7      'generateRound' accedida antes de decl.
GoNoGoGame.jsx:53:51        'handleTimeout' accedida antes de decl.
MentalRotationGame.jsx:73:43  'handleTimeout' accedida antes de decl.
MemoryGame.jsx:46:5         'playSequence' accedida antes de decl.
NBackGame.jsx:75:112        'handleNoResponse' accedida antes de decl.
```

### 🔧 Enfoque de Corrección:

**Patrón: Mover declaración ANTES de usarla, o usar useCallback**

❌ Incorrecto:
```javascript
useEffect(() => {
  setTimeout(() => handleTimeout(), 1000);  // ← handleTimeout no existe aún
}, []);

const handleTimeout = () => { /* ... */ };
```

✅ Correcto:
```javascript
const handleTimeout = () => { /* ... */ };

useEffect(() => {
  setTimeout(() => handleTimeout(), 1000);
}, [handleTimeout]);
```

O con useCallback:
```javascript
const handleTimeout = useCallback(() => { /* ... */ }, [deps]);

useEffect(() => {
  setTimeout(() => handleTimeout(), 1000);
}, [handleTimeout]);
```

---

## 6️⃣ ACCESO A REFS DURANTE RENDER (`react-hooks/refs`) - 1 PROBLEMA

### Ubicación:
```
FrustrationGame.jsx:84:70   Acceso a ref während render
```

### 🔧 Enfoque de Corrección:

❌ Incorrecto:
```javascript
<span>{trackingTimeRef.current / 1000}s</span>  // ← En el render
```

✅ Correcto:
```javascript
const [displayTime, setDisplayTime] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    if (trackingTimeRef.current) {
      setDisplayTime(trackingTimeRef.current / 1000);
    }
  }, 100);
  return () => clearInterval(interval);
}, []);

<span>{displayTime.toFixed(1)}s</span>
```

---

## 7️⃣ FUNCIONES IMPURAS EN RENDER (`react-hooks/purity`) - 3 PROBLEMAS

### Ubicación:
```
TowerOfLondonGame.jsx:88:25      performance.now() durante render
WisconsinCardSortingGame.jsx:104:32  performance.now() durante render
```

### 🔧 Enfoque de Corrección:

❌ Incorrecto:
```javascript
if (condition) {
  const timeTaken = performance.now() - startTime;  // ← En el cuerpo del componente
  setProblemTimes([...problemTimes, timeTaken]);
}
```

✅ Correcto:
```javascript
if (condition) {
  // Mover dentro de useEffect o callback
  setProblemTimes(prev => [...prev, performance.now() - startTime]);
}

// O mejor aún:
useEffect(() => {
  if (condition) {
    const timeTaken = performance.now() - startTime.current;
    setProblemTimes(prev => [...prev, timeTaken]);
  }
}, [condition]);
```

---

## 8️⃣ OTRAS CATEGORÍAS MENORES

### Unused eslint-disable directive - 1 problema
```
load-test.js:11:1   Directiva eslint-disable no necesaria para 'no-console'
```
**Solución:** Eliminar el comentario `// eslint-disable-next-line no-console` si no hay console calls

### Empty block statement - 1 problema
```
audio.js:57:13   Bloque catch vacío `catch {}`
```
**Solución:**
```javascript
// Cambiar
try {
  // ...
} catch {}

// A
try {
  // ...
} catch (e) {
  console.error('Error:', e);
  // Manejar el error apropiadamente
}
```

### Parse error - 1 problema
```
test-ai-service.mjs:1:4   Carácter inesperado '!'
```
**Solución:** Revisar y corregir la línea 1 del archivo

---

## 🎯 ESTRATEGIA DE CORRECCIÓN RECOMENDADA

### Fase 1: Críticos (15 minutos)
1. **Arreglar imports faltantes** (`no-undef`):
   - Agregar `import { lazy } from 'react';` en App.jsx
   - Agregar `import { useRef } from 'react';` en LaserPuzzleGame.jsx
   - Configurar ESLint para Jest globals

2. **Corregir error de parsing**:
   - Revisar test-ai-service.mjs línea 1

### Fase 2: Importantes (30 minutos)
3. **Eliminar imports no utilizados** (`no-unused-vars`):
   - Limpiar todos los imports `motion` de archivos de juegos
   - Eliminar `fireEvent, act` de tests si no se usan
   - Eliminar `useMemo` de Report.jsx

4. **Corregir setState en effects** (`react-hooks/set-state-in-effect`):
   - Usar useCallback o mover lógica

### Fase 3: Mejoras (45 minutos)
5. **Agregar dependencias de hooks** (`react-hooks/exhaustive-deps`):
   - Actualizar arrays de dependencias
   - Usar useCallback donde sea apropiado

6. **Fix acceso a variables** (`react-hooks/immutability`):
   - Reorganizar declaraciones de funciones

---

## 📋 Archivo de Configuración ESLint Recomendado

Para reducir falsos positivos, actualizar `eslint.config.js`:

```javascript
// Para archivos de test
{
  files: ['**/*.test.js', '**/*.test.jsx'],
  languageOptions: {
    globals: {
      describe: 'readonly',
      it: 'readonly',
      beforeEach: 'readonly',
      afterEach: 'readonly',
      expect: 'readonly',
    }
  }
}

// Para usar process.env
{
  languageOptions: {
    globals: {
      process: 'readonly',
    }
  }
}
```

---

## 📊 Resumen por Severidad

| Severidad | Cantidad | Acción |
|-----------|----------|--------|
| 🔴 Críticas (se pueden romper) | ~10 | Corregir inmediatamente |
| 🟠 Importantes (bugs/performance) | ~30 | Corregir esta iteración |
| 🟡 Warnings (code quality) | ~10 | Corregir próximas iteraciones |
| 🟢 Minor (no-unused-vars limpios) | ~34 | Autofix (`eslint --fix`) |

---

## ✅ Checklist de Corrección

- [ ] Importar React hooks faltantes
- [ ] Configurar ESLint para globals de Jest y Node
- [ ] Remover imports no utilizados
- [ ] Envolver funciones en useCallback
- [ ] Agregar dependencias faltantes a hooks
- [ ] Corregir setState sincrónico
- [ ] Mover funciones impuras fuera del render
- [ ] Corregir acceso a refs
- [ ] Ejecutar `npm run lint -- --fix` para autofix
- [ ] Revisar y validar los cambios

---

**Generado:** 2026-03-23
**Total de problemas:** 84 (74 errores, 10 warnings)

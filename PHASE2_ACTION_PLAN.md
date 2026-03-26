# 📋 Plan de Acción Inmediato - Implementación Fase 2

**Documento**: Guía para continuar la implementación  
**Creado**: Marzo 26, 2026  
**Estado**: FASE 1 COMPLETADA ✅ → Listo para FASE 2

---

## 🎯 Resumen de lo Logrado (Fase 1)

### ✅ Base Técnica Completada
1. **Especificación de 7 juegos** (GAME_SPECS_V2.md)
   - Construccos claramente definidos
   - Scoring y métricas detalladas
   - Telemetría obligatoria especificada
   - Fairness guidelines

2. **Telemetría v2.0 Implementada**
   - TelemetryContext extendido: cursor + webcam + quality gates
   - WebcamCapture.js: captura de video con análisis
   - Consentimiento GDPR-compliant

3. **7 Juegos Creados**
   - Game 1: OSPAN (matriz memoria de trabajo)
   - Games 2-7: Stop-Signal, Task Switching, CPT, Decision, Rule Shift, SJT
   - Todos con estructura básica funcional
   - Integrados en gameFlow.js

---

## 🚀 Qué Hacer Ahora (Próximas 3-5 Días)

### PASO 1: Integración en Flujo Principal (Día 1)

**Objetivo**: ConsentModal aparece antes de empezar la batería.

**Tareas**:
1. Abre `src/components/GameLayout.jsx` (o donde controles el flujo)
2. Importa ConsentModal:
   ```jsx
   import ConsentModal from './ConsentModal';
   ```
3. Agrega estado para rastrear consentimiento:
   ```jsx
   const [consentsReady, setConsentsReady] = useState(false);
   ```
4. Muestra modal al iniciar:
   ```jsx
   <ConsentModal 
     isOpen={!consentsReady} 
     onConsentsReady={(consents) => setConsentsReady(true)}
     isDemo={isDemo}
   />
   ```
5. Bloquea gameplay hasta que `consentsReady === true`

**Testing**: 
- Abre app, verifica que modal aparece
- Acepta consentimientos, verifica que desaparece
- Demo mode debería saltarse modal

---

### PASO 2: Webcam Integration (Día 1-2)

**Objetivo**: Webcam captura datos durante juegos.

**Tareas**:
1. Crea hook `useWebcamCapture.js`:
   ```jsx
   import { useEffect, useRef } from 'react';
   import WebcamCapture from '../utils/webcamCapture';
   
   export const useWebcamCapture = (isActive, onFrameCapture) => {
     const webcamRef = useRef(null);
     const captureRef = useRef(null);

     useEffect(() => {
       if (!isActive) return;
       
       const init = async () => {
         captureRef.current = new WebcamCapture(onFrameCapture);
         await captureRef.current.initialize(webcamRef.current);
         captureRef.current.startCapture();
       };
       
       init();
       
       return () => {
         if (captureRef.current) {
           captureRef.current.cleanup();
         }
       };
     }, [isActive, onFrameCapture]);

     return webcamRef;
   };
   ```

2. En GameLayout o GameComponent:
   ```jsx
   const { recordWebcamFrame } = useTelemetry();
   const videoRef = useWebcamCapture(isActive, recordWebcamFrame);
   
   // Hidden video element
   <video ref={videoRef} style={{display: 'none'}} />
   ```

3. Agrega solicitud de permisos de cámara:
   ```jsx
   // Antes de mostrar ConsentModal, requiere permisos
   if (consentState.webcam) {
     const hasPermission = await navigator.permissions.query({name: 'camera'});
     if (hasPermission.state === 'denied') {
       // Mostrar aviso
     }
   }
   ```

**Testing**:
- Inicia juego con webcam consent=true
- Verifica que video se captura (logs en console)
- Revisa calidad de frames: `webcamFrames.length > 0`

---

### PASO 3: Testing de Flujo Completo (Día 2-3)

**Objetivo**: Ejecutar batería completa sin crashes.

**Tareas**:
1. Inicia app en demo mode:
   ```bash
   npm run dev
   # O cómo sea tu comando
   ```

2. Completa los 7 juegos seguidos:
   - Verifica que cada juego aparece
   - Verifica que instrucciones son claras
   - Verifica que telemetría se captura (check console logs)

3. Al final, verifica que sessionData contiene:
   - mouseMovements (cursor)
   - webcamFrames (video)
   - trialEvents (eventos de juego)

4. Documenta cualquier error o comportamiento extraño

**Criterios de Éxito**:
- ✅ Batería completa dura 30-40 min
- ✅ Sin crashes durante gameplay
- ✅ Telemetría se captura
- ✅ Quality gates funcional (desactiva webcam si baja calidad)

---

### PASO 4: Refinamiento de Juegos (Día 3-4)

**Objetivo**: Mejorar lógica de scoring de 2-3 juegos prioritarios.

**Prioridad 1** (Game 1 - OSPAN):
- Implementar scoring real: https://github.com/search?q=ospan+scoring
- Actualmente: `Math.random() > 0.5` (no real)
- Necesita: Validar operación matemática real

**Prioridad 2** (Game 2 - Stop-Signal):
- Implementar SSRT (Stop-Signal Reaction Time)
- Actualmente: Básico
- Necesita: Timing preciso, adaptive staircase para delay

**Prioridad 3** (Games 3-7):
- Mantener esqueletos por ahora
- Iteración future cuando se valide batch 1-2

**Cómo**:
1. Revisa GAME_SPECS_V2.md para scoring exacto
2. Actualiza lógica en juego
3. Test contra especificación

---

### PASO 5: Documentación para Recruiters (Día 4-5)

**Objetivo**: Crear guía corta para usar resultados.

**Artefactos**:
1. `RECRUITER_GUIDE.md` (2 páginas):
   - Qué mide cada juego
   - Cómo interpretar resultados
   - Qué preocupaciones de fairness avisar
   - Cómo contactar si hay preguntas

2. `TECH_GUIDE.md` (para tu equipo):
   - Cómo agregar nuevos juegos
   - Cómo calibrar thresholds
   - Cómo monitorear quality gates

---

## 📝 Ejemplo: Checklist para PR/Merge

Cuando hayas completado Pasos 1-5:

```markdown
## Phase 2 Completion Checklist

- [ ] ConsentModal integrado y funcional
- [ ] Webcam captura y tiene quality gates
- [ ] 7 juegos completables sin crashes
- [ ] Telemetría sale con estructura correcta
- [ ] Demo mode maneja todo (sin webcam si no consiente)
- [ ] Documentación para recruiters creada
- [ ] Tests básicos pasan (smoke tests)
- [ ] No hay regresiones en legacy games (8-14)

**Duración**: 3-5 días de 1 dev
**Bloqueadores**: Ninguno conocido (Fase 1 removió la mayoría)
**Riesgo**: Bajo (fallback a legacy games disponible)
```

---

## 🛠️ Herramientas & Tips Prácticos

### Debugging
```bash
# Ver telemetría en tiempo real
const { getCurrentTelemetry } = useTelemetry();
console.log(getCurrentTelemetry()); // Muestra data capturada

# Ver quality gates
console.log(currentDataRef.current.qualityFlags); 
# Debería mostrar arrays de warnings si hay problemas
```

### Desarrollo Local
- **Hot reload**: Cambios en CSS/componentes recarguen automáticamente
- **Demo mode**: Ajusta `isDemo={true}` en GameLayout para tests rápidos (timers más cortos)
- **Performance**: Usa React DevTools Profiler si hay lag en webcam

### Validación de Consentimiento
```jsx
// Verifica que consentimiento se registró
const { consentState } = useTelemetry();
console.log(consentState);
// {cursor: true, webcam: false, consentTimestamp: "...", consentVersionId: "v2.0"}
```

---

## ⚠️ Consideraciones de Fairness

Al hacer pruebas y refinamiento:

1. **No avances gaming**: Verifica que no es posible optimizar cursor/webcam artificialmente
2. **Accesibilidad**: Todos los juegos deben ser usables sin webcam (cursor suficiente)
3. **Tiempo**: Mide en Demo mode que dura ~10 min (full es 35-40 min)
4. **Lenguaje**: Instrucciones deben ser claras en 1-2 idiomas

---

## 📞 Contactos si Estancado

**Si ConsentModal no aparece:**
- Verifica import path
- Verifica que `isOpen={!consentsReady}` está correcto
- Revisa console para errores

**Si Webcam no captura:**
- Verifica permisos del navegador
- Revisa que `navigator.mediaDevices.getUserMedia` funciona
- Test en otro navegador si hay dudas (Safari vs Chrome)

**Si Scoring se ve incorrecto:**
- Revisa GAME_SPECS_V2.md para fórmula exact a
- Log cada paso del cálculo

---

## 🎓 Siguiente: Fase 3

Una vez Fase 2 lista:

1. **Backend & Persistencia** (1-2 semanas)
   - Endpoints para guardar sesiones
   - Validación de schema
   - Políticas de retención

2. **Analytics & Reporting** (1 semana)
   - Scorecard por constructo
   - Dashboard operativo
   - Guía recruiter

3. **Validación Psicométrica** (2-4 semanas)
   - Test-retest confiabilidad
   - Evaluación fairness
   - Piloto controlado

---

**¿Preguntas? Revisa GAME_SPECS_V2.md o IMPLEMENTATION_STATUS.md**

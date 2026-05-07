# Arreglar CORS en Render - Pasos Urgentes

## Problema
El reporte falla con errores CORS porque Render rechaza solicitudes desde `www.krumm.cl`.

```
Access to fetch at 'https://krumm-tallent-assessment.onrender.com/api/session' 
from origin 'https://www.krumm.cl' has been blocked by CORS policy
```

## Solución (Manual en Dashboard de Render)

### 1. Ve a Render Dashboard
- URL: https://dashboard.render.com
- Busca el servicio "krumm-tallent-assessment" (backend)

### 2. Abre Environment Variables
- Click en el servicio
- Sección: **Environment**

### 3. Busca o crea la variable `ALLOWED_ORIGINS`
- **Si ya existe**, edítala:
  - Valor actual (eliminar): `https://www.krumm.cl,https://www.krumm.cl:443`
  - **Nuevo valor**:
    ```
    https://www.krumm.cl,https://krumm-tallent-assessment.vercel.app
    ```

- **Si NO existe**, créala:
  - Key: `ALLOWED_ORIGINS`
  - Value: `https://www.krumm.cl,https://krumm-tallent-assessment.vercel.app`
  - Click **Add**

### 4. Deploy Manual
Después de guardar, Render automáticamente hará **re-deploy**. Espera 2-3 minutos.

Puedes ver el progreso en la sección **Deployments**.

### 5. Verifica
Una vez desplegado, vuelve a la demo en `https://www.krumm.cl/demo?lang=es`:
- Completa los 3 juegos
- Ve al reporte
- **Los datos debería aparecer y sin errores CORS**

---

## Alternativa: Si prefieres permitir CORS de cualquier origen (menos seguro)

En el dashboard de Render:
```
ALLOWED_ORIGINS = (dejar vacío)
```

Esto hace que Render acepte cualquier origen. **No recomendado para producción.**

---

## Confirmación
Después de aplicar, revisa la consola del navegador (F12 → Console):
- ✅ NO debería haber mensajes de "blocked by CORS"
- ✅ Las llamadas a `/api/session` y `/api/ai/generate` deberían funcionar
- ✅ El reporte debería mostrar datos reales (no 0%)

---

**Nota**: Los cambios en `render.yaml` que hicimos en código toman efecto solo en el **próximo push a GitHub + re-deploy automático**. Por ahora, hacer el cambio manual en el dashboard es más rápido.

# Migración a Azure: Vercel + Render + Neon + Upstash -> Azure

Este proyecto hoy separa frontend React/Vite y backend Express. La migración más limpia a Azure es mantener esa separación:

- Frontend: Azure Static Web Apps.
- Backend API: Azure App Service for Linux, Node 20.
- Base de datos: Azure Database for PostgreSQL Flexible Server.
- Redis/Upstash: Azure Cache for Redis, sólo si el código que usa Upstash se mantiene activo.
- Secretos: App Service Configuration al inicio; Key Vault cuando quieras endurecer producción.
- Observabilidad: Application Insights + Log Stream de App Service.

No copies secretos reales a este documento. Usa valores como `[REDACTED]` y cargalos desde Azure Portal, Azure CLI o GitHub Actions secrets.

## 1. Arquitectura objetivo recomendada

```
Usuario
  -> Azure Static Web Apps
       - build: npm run build
       - output: dist
       - VITE_API_BASE_URL=https://<api-app>.azurewebsites.net
  -> Azure App Service API
       - start: npm start
       - health: /health
       - DB_CLIENT=pg
       - DATABASE_URL=postgresql://... [REDACTED]
  -> Azure Database for PostgreSQL Flexible Server
  -> Azure Cache for Redis opcional
```

Por qué no meter todo en una sola Static Web App: el backend actual es Express completo (`server/index.js`) con `npm start`, conexión PostgreSQL, CORS, rate limit, JWT, Gemini proxy y health checks. App Service encaja mejor para esa API.

## 2. Variables de entorno a mapear

Frontend, Azure Static Web Apps:

```
VITE_API_BASE_URL=https://<api-app>.azurewebsites.net
VITE_USE_BACKEND_GEMINI_PROXY=true
VITE_ALLOW_BROWSER_GEMINI_FALLBACK=false
VITE_LLM_FALLBACK=true
VITE_GEMINI_MODEL=gemini-1.5-flash
```

Backend, Azure App Service:

```
NODE_ENV=production
PORT=8080
DB_CLIENT=pg
DATABASE_URL=[REDACTED]
ALLOWED_ORIGINS=https://<frontend>.azurestaticapps.net,https://<custom-domain>
JWT_SECRET_KEY=[REDACTED]
GEMINI_API_KEY=[REDACTED]
GEMINI_MODEL=gemini-1.5-flash-latest
RECRUITER_EMAIL=[REDACTED]
RECRUITER_PASSWORD=[REDACTED]
ENABLE_DB_KEEPALIVE=true
DB_KEEPALIVE_MS=180000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_GLOBAL_MAX_REQUESTS=180
RATE_LIMIT_AI_WINDOW_MS=60000
RATE_LIMIT_AI_MAX_REQUESTS=20
```

Si seguís usando Redis/Upstash en alguna ruta futura:

```
UPSTASH_REDIS_REST_URL=[REDACTED]
UPSTASH_REDIS_REST_TOKEN=[REDACTED]
```

Si migrás a Azure Cache for Redis, probablemente vas a necesitar adaptar el cliente, porque Azure Redis suele usarse con protocolo Redis/TLS, mientras Upstash REST usa URL/token HTTP.

## 3. Crear recursos con Azure CLI

Ejemplo con placeholders:

```bash
az login
az account set --subscription "<subscription-id>"

RG=krumm-prod-rg
LOC=eastus
API_APP=krumm-api-prod
PLAN=krumm-api-plan
PG=krumm-pg-prod
PG_ADMIN=krummadmin

az group create -n $RG -l $LOC

az appservice plan create \
  -g $RG \
  -n $PLAN \
  --is-linux \
  --sku B1

az webapp create \
  -g $RG \
  -p $PLAN \
  -n $API_APP \
  --runtime "NODE:20-lts"

az postgres flexible-server create \
  -g $RG \
  -n $PG \
  -l $LOC \
  --admin-user $PG_ADMIN \
  --admin-password "[REDACTED]" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --storage-size 32

az postgres flexible-server db create \
  -g $RG \
  -s $PG \
  -d krumm
```

Para producción real, ajustá red/firewall. El camino simple inicial es habilitar acceso desde Azure services y tu IP de administración; el camino más robusto es VNet integration/private endpoints.

## 4. Migrar datos desde Neon a Azure PostgreSQL

Desde una máquina con `pg_dump` y `psql`:

```bash
export NEON_DATABASE_URL='[REDACTED]'
export AZURE_DATABASE_URL='[REDACTED]'

pg_dump "$NEON_DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file=neon-backup.dump

pg_restore \
  --dbname="$AZURE_DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  neon-backup.dump

psql "$AZURE_DATABASE_URL" -c "select count(*) from sessions;"
psql "$AZURE_DATABASE_URL" -c "select count(*) from participants;"
```

Este backend también crea tablas con `CREATE TABLE IF NOT EXISTS`, pero para migrar datos existentes conviene usar dump/restore.

## 5. Configurar App Service backend

```bash
az webapp config appsettings set \
  -g $RG \
  -n $API_APP \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    DB_CLIENT=pg \
    DATABASE_URL='[REDACTED]' \
    ALLOWED_ORIGINS='https://<frontend>.azurestaticapps.net' \
    JWT_SECRET_KEY='[REDACTED]' \
    GEMINI_API_KEY='[REDACTED]' \
    GEMINI_MODEL='gemini-1.5-flash-latest' \
    RECRUITER_EMAIL='[REDACTED]' \
    RECRUITER_PASSWORD='[REDACTED]'

az webapp config set \
  -g $RG \
  -n $API_APP \
  --startup-file "npm start"
```

Health checks:

```bash
curl https://$API_APP.azurewebsites.net/health
curl https://$API_APP.azurewebsites.net/api/db/ping
```

## 6. Deploy backend desde GitHub Actions

Un workflow mínimo para App Service:

```yaml
name: deploy-api-azure

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npm run build
      - uses: azure/webapps-deploy@v3
        with:
          app-name: krumm-api-prod
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: .
```

Nota: esto sube todo el repo. Para optimizar, se puede empaquetar sólo backend + `package.json` + lockfile. Al inicio priorizá que funcione.

## 7. Crear Azure Static Web App para el frontend

Desde Azure Portal:

1. Crear Static Web App.
2. Conectar al repo GitHub.
3. Build preset: React/Vite.
4. App location: `/`.
5. Output location: `dist`.
6. API location: vacío.
7. Agregar variable de build:

```
VITE_API_BASE_URL=https://<api-app>.azurewebsites.net
VITE_USE_BACKEND_GEMINI_PROXY=true
VITE_ALLOW_BROWSER_GEMINI_FALLBACK=false
```

Verificá que el frontend no quede apuntando a Render.

## 8. CORS y dominios

Cuando tengas la URL final de Static Web Apps:

```bash
az webapp config appsettings set \
  -g $RG \
  -n $API_APP \
  --settings ALLOWED_ORIGINS='https://<frontend>.azurestaticapps.net,https://<dominio-final>'
```

Si usás dominio propio:

- Frontend: custom domain en Azure Static Web Apps.
- API: custom domain en App Service o detrás de Azure Front Door.
- TLS: certificados gestionados de Azure.

## 9. Cutover desde Vercel/Render/Neon/Upstash

Orden recomendado:

1. Deploy backend en Azure App Service.
2. Conectar backend Azure a Neon todavía, sólo para probar API sin mover datos.
3. Crear Azure PostgreSQL.
4. Migrar datos Neon -> Azure PostgreSQL.
5. Cambiar `DATABASE_URL` en App Service a Azure PostgreSQL.
6. Validar `/health`, `/api/db/ping`, login candidato/recruiter y guardado de sesiones.
7. Deploy frontend en Azure Static Web Apps apuntando al backend Azure.
8. Probar flujo completo.
9. Actualizar DNS del dominio frontend.
10. Mantener Render/Vercel/Neon en modo rollback 24-72h.
11. Apagar servicios anteriores cuando el tráfico y datos estén verificados.

## 10. Checklist de verificación

Antes del corte:

```bash
npm test
npm run lint
npm run build
curl https://<api-app>.azurewebsites.net/health
curl https://<api-app>.azurewebsites.net/api/db/ping
```

Validaciones manuales:

- Demo pública carga desde Azure.
- `VITE_API_BASE_URL` apunta a Azure, no a Render.
- CORS permite sólo el frontend esperado.
- Login candidato funciona.
- Login recruiter funciona.
- Se guarda una sesión en PostgreSQL.
- El reporte no expone secretos ni stack traces.
- Gemini proxy responde si `GEMINI_API_KEY` está configurada.
- App Service logs no imprimen tokens ni passwords.

## 11. Riesgos específicos de este repo

- `server/db.js` usa PostgreSQL si `DB_CLIENT=pg` o si existe `DATABASE_URL`; si no, cae a SQLite.
- `server/db.sqlite.js` ignora `DB_PATH` y usa `server/app.db`; no lo uses como storage de producción en App Service.
- `ALLOWED_ORIGINS` debe configurarse en producción; si queda vacío, el server advierte y permite todos los origins.
- `package.json` tiene `engines.node=20.x`; en Azure configurá Node 20.
- El frontend necesita variables `VITE_*` en build time, no sólo en runtime.
- Si mantenés Upstash REST, no lo reemplaces por Azure Redis sin adaptar el código cliente.
- No metas secretos en `.env`, README, commits ni GitHub Actions logs.

## 12. Rollback rápido

- Frontend: volver DNS o variable `VITE_API_BASE_URL` hacia Render y redeploy en Vercel/Azure Static Web Apps.
- Backend: cambiar `DATABASE_URL` de App Service de vuelta a Neon si Azure PostgreSQL falla.
- Datos: después del cutover, evitá escrituras simultáneas en Neon y Azure; si hay rollback, definí cuál DB queda como fuente de verdad.

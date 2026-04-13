Despliegue en Cloudflare (Pages) y correo gratuito
================================================

Resumen rápido
- Dominio: krumm.cl (registrado en NIC.cl)
- Objetivo: desplegar la web usando Cloudflare (gratuito) y tener correo asociado usando soluciones gratuitas cuando sea posible.

Prerequisitos
- Acceso a la cuenta NIC.cl (para cambiar nameservers).
- Cuenta Cloudflare (puedes crear una gratis).
- Acceso al repositorio (GitHub/GitLab) para conectar Cloudflare Pages, o un build estático listo (`dist`).

1) Añadir el dominio a Cloudflare
- Entra a Cloudflare → "Add site" → escribe `krumm.cl` → elige plan Free.
- Cloudflare hará un escaneo DNS y al final mostrará 2 nameservers (ej. `xxxx.ns.cloudflare.com`).
- Copia esos nameservers.

2) Cambiar nameservers en NIC.cl
- Accede a tu cuenta en NIC.cl → administrar el dominio `krumm.cl` → modificar servidores DNS.
- Pega los 2 nameservers que te dio Cloudflare y guarda.
- Espera la propagación (puede tardar desde minutos hasta 24 horas; normalmente es <1 h).

3) Preparar el build del sitio (local)
- En el repo del proyecto (este repo):
  - Instala dependencias: `npm install`
  - Genera build: `npm run build` (este proyecto usa Vite; salida en `dist`).
  - Probar localmente: `npm run preview`.

4) Desplegar en Cloudflare Pages (hosting estático gratuito)
- Cloudflare → Pages → "Create a project" → conecta tu cuenta de GitHub/GitLab y selecciona el repo.
- Configura:
  - Build command: `npm run build`
  - Build output directory: `dist`
  - Framework preset: Vite (opcional)
- Deploy. Cuando termine, en Pages → Custom domains agrega `krumm.cl` (Cloudflare administra certificados TLS automáticamente).

Nota: si no quieres conectar un repo, puedes usar la CLI `wrangler pages publish` o subir artefactos según la guía de Pages.

5) Correo (opciones gratuitas)

Opción A — Reenvío gratis (recomendado si quieres 0$ y usar Cloudflare)
- Cloudflare ofrece "Email Routing" (gratuito para reenviar correo entrante a otra dirección, p.ej. tu Gmail).
- Pasos:
  - En Cloudflare Dashboard → Email → crea una ruta: p.ej. `info@krumm.cl` → destino `tu.usuario@gmail.com`.
  - Cloudflare te indicará (o añadirá) los registros MX/TXT necesarios una vez el dominio esté en Cloudflare.
  - Prueba enviando correo a `info@krumm.cl` y verifica que llega a tu Gmail.

Limitaciones: es reenvío — no es un buzón web completo. Para enviar desde Gmail como `info@krumm.cl` puedes configurar "Send mail as" usando SMTP (requiere un SMTP provider o Google Workspace para envío oficial).

Opción B — Buzones gratuitos (Zoho Mail)
- Zoho Mail tiene un plan gratuito (usuarios limitados). Pasos generales:
  - Regístrate en Zoho Mail y añade `krumm.cl` como dominio.
  - Verifica dominio y agrega registros MX en Cloudflare:
    - `mx.zoho.com` priority 10
    - `mx2.zoho.com` priority 20
  - Añade SPF TXT: `v=spf1 include:zoho.com ~all`
  - Configura DKIM desde el panel de Zoho (te dará el valor TXT/CNAME específico).

6) Recomendaciones de seguridad y envío
- Añade un registro DMARC básico para monitoreo: `v=DMARC1; p=none; rua=mailto:tu@correo.com` (cámbialo cuando estés listo para políticas más estrictas).
- Para evitar problemas de entrega, configura SPF y DKIM según el proveedor de envío (Zoho, Google Workspace, SMTP externo).

7) Pruebas y verificación
- Verifica que los nameservers en NIC.cl apunten a Cloudflare (`whois`/`dig NS krumm.cl`).
- En Cloudflare verifica que las entradas DNS (A/CNAME/MX/TXT) estén presentes.
- En Pages, añade `krumm.cl` como dominio; confirma que el certificado TLS esté activo y que el sitio sirva en HTTPS.
- Prueba correo entrante (envía desde Gmail/otro) y confirma reenvío/recepción.

¿Qué puedo hacer por ti ahora?
- Si quieres, preparo los registros DNS exactos listos para pegar en Cloudflare según la opción de correo que elijas (reenvío Cloudflare o Zoho). Indica: ¿prefieres reenvío a Gmail (Cloudflare Email Routing) o buzones en Zoho Mail? También dime si quieres que te guíe paso a paso (puedo preparar los comandos y textos listos para NIC.cl).

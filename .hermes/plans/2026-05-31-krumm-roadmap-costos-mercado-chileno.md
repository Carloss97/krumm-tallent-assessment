# KRUMM Talent Assessment — revisión de costos para mercado chileno
Fecha de revisión: 2026-05-31
Roadmap base revisado: `2026-05-28-krumm-roadmap-mvp-presupuesto.md` y versión internalizada del 2026-05-31.
Moneda principal: pesos chilenos (CLP). Se agregan equivalencias en UF y USD para lectura ejecutiva.

## 1. Resumen ejecutivo
La revisión chilena cambia la lectura del presupuesto: la ingeniería interna/fundadora puede ser más barata que contratar equipos externos internacionales, pero los componentes que no conviene recortar —legal/privacy, seguridad, psicometría/data, reclutamiento de piloto e infraestructura dolarizada— siguen siendo relevantes y en varios casos se cotizan en UF o USD.

**Conclusión principal:** con equipo fundador/interno absorbido, el cash-out chileno recomendado para completar H1–H7 queda en **CLP 9,66 MM–50,54 MM**, equivalente a **238 UF–1.245 UF**. Si el IVA no es recuperable como crédito fiscal, el desembolso bruto puede subir a **CLP 11,50 MM–60,15 MM**.

El costo de oportunidad interno valorizado con sueldos/rates chilenos queda en **CLP 9,89 MM–41,18 MM**. El costo económico total —cash-out + oportunidad interna— queda en **CLP 19,55 MM–91,72 MM**.

## 2. Fuentes, tipo de cambio y metodología
- UF consultada en mindicador.cl: **CLP 40.611** por UF al 2026-05-31.
- Dólar observado consultado en mindicador.cl: **CLP 893** por USD, último dato disponible 2026-05-29.
- Muestra rápida de avisos tech en Get on Board consultada el 2026-05-31: programación mostró mediana publicada aproximada de CLP 2,23–2,81 MM/mes; diseño CLP 1,61–1,92 MM/mes; data CLP 2,01–2,54 MM/mes; sysadmin/devops/QA mixto CLP 1,79–2,32 MM/mes. Estos avisos suelen estar dolarizados y fueron convertidos con el dólar observado anterior.
- Los rates horarios usados no son sueldo líquido: son equivalentes de planificación para reemplazar capacidad founder/interna por contratación senior, considerando carga empleador, seniority, gestión, fricción part-time y margen de consultoría.
- Los montos cash se presentan **netos/sin IVA** salvo indicación. Para desembolso bruto, sumar hasta 19% en servicios afectos si la empresa no lo recupera como crédito fiscal.
- Legal, seguridad y psicometría se tratan como rangos de planificación; antes de compra real habría que cotizar con proveedores chilenos.

## 3. Rates y sueldos chilenos usados

| Rol | Sueldo bruto mensual de referencia | Rate horario de planificación | Uso en el roadmap |
| --- | ---: | ---: | --- |
| Ingeniería full-stack / product engineer senior | CLP 2,4–4,2 MM bruto/mes | CLP 25.000/h–45.000/h | desarrollo frontend/backend, producto técnico, bugs |
| DevOps / cloud engineer | CLP 2,8–4,8 MM bruto/mes | CLP 30.000/h–55.000/h | deploy, cloud, backups, secrets, observabilidad |
| UX / product design | CLP 1,6–3,0 MM bruto/mes | CLP 18.000/h–35.000/h | flujo candidato, reportes, copy UX, diseño de interacción |
| QA manual/automation | CLP 1,2–2,4 MM bruto/mes | CLP 14.000/h–28.000/h | smoke manual, regresión cross-browser, validación exports |
| PM / customer success / founder ops | CLP 1,5–3,0 MM bruto/mes | CLP 18.000/h–35.000/h | founder ops, PM, customer success, onboarding, ventas iniciales |
| Marketing / sales collateral | CLP 1,4–3,2 MM bruto/mes | CLP 18.000/h–40.000/h | deck, one-pager, collateral comercial |
| Data / psicometría consultiva | CLP 2,8–5,5 MM bruto/mes o consultoría | CLP 45.000/h–80.000/h | consultoría avanzada; en H5 se deja principalmente como cash externo |

## 4. Totales revisados para Chile

| Concepto | Rango CLP | Equivalencia UF | Equivalencia USD |
| --- | ---: | ---: | ---: |
| Presupuesto original 05-28 profesionalizado, antes de contingencia | CLP 37,87 MM–86,52 MM | 933 UF–2.130 UF | USD 42,4k–96,9k |
| Presupuesto original 05-28 profesionalizado, con contingencia | CLP 43,55 MM–108,15 MM | 1.072 UF–2.663 UF | USD 48,8k–121,1k |
| Cash-out directo externo Chile, antes de contingencia | CLP 8,40 MM–40,44 MM | 207 UF–996 UF | USD 9,4k–45,3k |
| Contingencia cash recomendada | CLP 1,26 MM–10,11 MM | 31 UF–249 UF | USD 1,4k–11,3k |
| Cash-out recomendado Chile, neto/sin IVA | CLP 9,66 MM–50,54 MM | 238 UF–1.245 UF | USD 10,8k–56,6k |
| Cash-out bruto si IVA 19% no recuperable | CLP 11,50 MM–60,15 MM | 283 UF–1.481 UF | USD 12,9k–67,4k |
| Costo de oportunidad interno valorizado Chile | CLP 9,89 MM–41,18 MM | 243 UF–1.014 UF | USD 11,1k–46,1k |
| Costo económico total Chile, cash + oportunidad | CLP 19,55 MM–91,72 MM | 481 UF–2.259 UF | USD 21,9k–102,7k |

Lectura por alcance:
- **H1–H3: staging + flujo candidato + recruiter básico:** CLP 0,91 MM–5,36 MM netos.
- **H1–H4: agrega privacidad/compliance/seguridad mínima:** CLP 4,65 MM–20,98 MM netos.
- **H1–H5: agrega piloto instrumentado y baseline inicial:** CLP 8,13 MM–37,29 MM netos.
- **H1–H7: MVP/private beta completo:** CLP 9,66 MM–50,54 MM netos.

## 5. Resumen por hito

| Hito | Original 05-28 convertido | Oportunidad interna Chile | Cash directo externo Chile | Contingencia | Cash-out recomendado Chile |
| --- | ---: | ---: | ---: | ---: | ---: |
| H1 Release candidate + staging deploy | CLP 2,63 MM–5,37 MM | CLP 0,74 MM–2,84 MM | CLP 0,36 MM–1,30 MM | CLP 54.000–325.000 | CLP 0,41 MM–1,62 MM |
| H2 Candidate assessment MVP flow | CLP 4,50 MM–8,96 MM | CLP 1,74 MM–6,49 MM | CLP 0,21 MM–1,28 MM | CLP 31.500–320.000 | CLP 0,24 MM–1,60 MM |
| H3 Recruiter portal + reports/export v1 | CLP 6,18 MM–12,54 MM | CLP 2,22 MM–7,85 MM | CLP 0,22 MM–1,71 MM | CLP 33.000–426.250 | CLP 0,25 MM–2,13 MM |
| H4 Privacy/compliance/security hardening | CLP 6,66 MM–15,90 MM | CLP 1,06 MM–4,48 MM | CLP 3,25 MM–12,50 MM | CLP 0,49 MM–3,12 MM | CLP 3,74 MM–15,62 MM |
| H5 Pilot instrumentation + baseline calibration | CLP 7,85 MM–18,46 MM | CLP 1,48 MM–6,15 MM | CLP 3,03 MM–13,05 MM | CLP 0,45 MM–3,26 MM | CLP 3,48 MM–16,31 MM |
| H6 Pilot launch + customer operations | CLP 5,04 MM–12,89 MM | CLP 1,42 MM–7,92 MM | CLP 0,48 MM–4,75 MM | CLP 0,07 MM–1,19 MM | CLP 0,55 MM–5,94 MM |
| H7 MVP packaging / private beta comercial | CLP 5,01 MM–12,39 MM | CLP 1,23 MM–5,45 MM | CLP 0,85 MM–5,85 MM | CLP 0,13 MM–1,46 MM | CLP 0,98 MM–7,31 MM |
| **Total** | **CLP 37,87 MM–86,52 MM** | **CLP 9,89 MM–41,18 MM** | **CLP 8,40 MM–40,44 MM** | **CLP 1,26 MM–10,11 MM** | **CLP 9,66 MM–50,54 MM** |

## 6. Desglose detallado por hito

### H1 — Release candidate + staging deploy

**Objetivo:** Pasar de repo local funcional a staging accesible y verificable fuera del entorno local.

#### Esfuerzo interno absorbido

| Partida interna | Horas | Rate CLP/h | Valor oportunidad |
| --- | ---: | ---: | ---: |
| Ingeniería release/push/CI/config | 12–24 h | CLP 25.000–45.000 | CLP 0,30 MM–1,08 MM |
| DevOps staging frontend + backend + Postgres | 10–22 h | CLP 30.000–55.000 | CLP 0,30 MM–1,21 MM |
| QA smoke candidato → reporte → backend → recruiter | 6–12 h | CLP 14.000–28.000 | CLP 84.000–336.000 |
| PM/release coordination | 3–6 h | CLP 18.000–35.000 | CLP 54.000–210.000 |
| **Subtotal interno absorbido** |  |  | **CLP 0,74 MM–2,84 MM** |

#### Cash-out externo Chile

| Partida cash | Rango neto CLP | Nota |
| --- | ---: | --- |
| Staging cloud/DB/storage, 1–2 meses | CLP 150.000–500.000 | dolarizado en parte; Vercel/Render/Fly/Railway/RDS/Supabase según arquitectura |
| Dominio/DNS/email/secrets/tooling | CLP 50.000–200.000 | dominio .cl/.com, correo transaccional básico, secret manager si aplica |
| Logs/monitoring/backups bootstrap | CLP 60.000–250.000 | Sentry/BetterStack/UptimeRobot/backups DB |
| Browser/device QA service opcional | CLP 100.000–350.000 | BrowserStack/Sauce o arriendo/pruebas puntuales |
| **Subtotal cash directo** | **CLP 0,36 MM–1,30 MM** |  |
| **Contingencia cash 15–25%** | **CLP 54.000–325.000** | mayor contingencia en tramo alto por proveedores/UF/dólar |
| **Cash-out recomendado H1** | **CLP 0,41 MM–1,62 MM** | neto/sin IVA |

**Comentario Chile:** En Chile este hito sigue siendo barato en cash si el equipo fundador ejecuta deploy y CI. El riesgo principal es no probar un flujo candidato→backend→recruiter en ambiente real.

### H2 — Candidate assessment MVP flow

**Objetivo:** Dejar el flujo candidato listo para piloto real: invitación, consentimiento, batería corta, errores y cierre.

#### Esfuerzo interno absorbido

| Partida interna | Horas | Rate CLP/h | Valor oportunidad |
| --- | ---: | ---: | ---: |
| Ingeniería invitación/auth/consent/session states/persistencia | 45–90 h | CLP 25.000–45.000 | CLP 1,12 MM–4,05 MM |
| UX/copy flujo candidato y cámara denegada | 12–25 h | CLP 18.000–35.000 | CLP 216.000–875.000 |
| QA cross-browser candidato | 18–36 h | CLP 14.000–28.000 | CLP 0,25 MM–1,01 MM |
| PM scope batería/criterios | 8–16 h | CLP 18.000–35.000 | CLP 144.000–560.000 |
| **Subtotal interno absorbido** |  |  | **CLP 1,74 MM–6,49 MM** |

#### Cash-out externo Chile

| Partida cash | Rango neto CLP | Nota |
| --- | ---: | --- |
| Incentivos usability test, 6–12 usuarios | CLP 90.000–420.000 | CLP 15k–35k por usuario según duración |
| Device/browser lab | CLP 80.000–300.000 | pruebas en equipos/navegadores fuera del stack del equipo |
| Servicio email/invitación setup | CLP 40.000–160.000 | dominio, SMTP/transaccional, plantillas |
| Accesibilidad/traducción/copy externo opcional | CLP 0–400.000 | sólo si no lo absorbe el equipo |
| **Subtotal cash directo** | **CLP 0,21 MM–1,28 MM** |  |
| **Contingencia cash 15–25%** | **CLP 31.500–320.000** | mayor contingencia en tramo alto por proveedores/UF/dólar |
| **Cash-out recomendado H2** | **CLP 0,24 MM–1,60 MM** | neto/sin IVA |

**Comentario Chile:** El desarrollo puede absorberse internamente, pero conviene pagar pruebas con usuarios chilenos reales: cámara, consentimiento, duración y abandono suelen fallar fuera del equipo.

### H3 — Recruiter portal + reports/export v1

**Objetivo:** Hacer usable el producto para cliente B2B sin mirar JSON ni depender del desarrollador.

#### Esfuerzo interno absorbido

| Partida interna | Horas | Rate CLP/h | Valor oportunidad |
| --- | ---: | ---: | ---: |
| Full-stack dashboard/reportes/export | 60–110 h | CLP 25.000–45.000 | CLP 1,50 MM–4,95 MM |
| UX/report IA/copy | 18–36 h | CLP 18.000–35.000 | CLP 0,32 MM–1,26 MM |
| QA dashboard + exports | 18–36 h | CLP 14.000–28.000 | CLP 0,25 MM–1,01 MM |
| PM/recruiter workflow | 8–18 h | CLP 18.000–35.000 | CLP 144.000–630.000 |
| **Subtotal interno absorbido** |  |  | **CLP 2,22 MM–7,85 MM** |

#### Cash-out externo Chile

| Partida cash | Rango neto CLP | Nota |
| --- | ---: | --- |
| PDF/export service/libs | CLP 0–250.000 | puede ser cero si se resuelve con librerías existentes |
| Incentivos entrevistas recruiters | CLP 100.000–375.000 | 2–5 recruiters, CLP 50k–75k o gift cards según perfil |
| Browser/device QA lab | CLP 80.000–300.000 | dashboard y exports en Chrome/Edge/Safari |
| Assets de diseño/reporte opcional | CLP 0–600.000 | pulido visual si se terceriza |
| Storage/email/monitoring incremental | CLP 40.000–180.000 | costos variables modestos |
| **Subtotal cash directo** | **CLP 0,22 MM–1,71 MM** |  |
| **Contingencia cash 15–25%** | **CLP 33.000–426.250** | mayor contingencia en tramo alto por proveedores/UF/dólar |
| **Cash-out recomendado H3** | **CLP 0,25 MM–2,13 MM** | neto/sin IVA |

**Comentario Chile:** El cash más valioso no es construir UI, sino validar con recruiters chilenos si entienden límites, caveats, calidad de señal y qué NO inferir.

### H4 — Privacy/compliance/security hardening

**Objetivo:** Reducir riesgo antes de exponer candidatos reales y conversaciones B2B serias.

#### Esfuerzo interno absorbido

| Partida interna | Horas | Rate CLP/h | Valor oportunidad |
| --- | ---: | ---: | ---: |
| Ingeniería delete/retention/audit fix | 20–45 h | CLP 25.000–45.000 | CLP 0,50 MM–2,02 MM |
| DevOps backup/restore/secrets/log hardening | 10–24 h | CLP 30.000–55.000 | CLP 0,30 MM–1,32 MM |
| QA/security regression | 8–18 h | CLP 14.000–28.000 | CLP 112.000–504.000 |
| PM inventario datos/incident checklist | 8–18 h | CLP 18.000–35.000 | CLP 144.000–630.000 |
| **Subtotal interno absorbido** |  |  | **CLP 1,06 MM–4,48 MM** |

#### Cash-out externo Chile

| Partida cash | Rango neto CLP | Nota |
| --- | ---: | --- |
| Legal/privacy counsel Chile | CLP 1,20 MM–3,50 MM | aprox. 30–86 UF para revisión privacidad, consentimiento, DPA y claims |
| Security review/light pentest | CLP 1,80 MM–6,00 MM | aprox. 44–148 UF para revisión acotada web/API/auth |
| Security tooling/scanners/secret management/backups | CLP 100.000–600.000 | herramientas y backups iniciales |
| Privacy docs/DPA/templates/translation | CLP 150.000–900.000 | documentos cliente/candidato y ajustes legales |
| Incident/insurance/compliance setup opcional | CLP 0,00 MM–1,50 MM | reserva si cliente enterprise lo exige |
| **Subtotal cash directo** | **CLP 3,25 MM–12,50 MM** |  |
| **Contingencia cash 15–25%** | **CLP 0,49 MM–3,12 MM** | mayor contingencia en tramo alto por proveedores/UF/dólar |
| **Cash-out recomendado H4** | **CLP 3,74 MM–15,62 MM** | neto/sin IVA |

**Comentario Chile:** H4 es donde Chile no necesariamente abarata el cash-out: abogados de datos, seguridad y documentos para RRHH se cotizan caro y muchas veces en UF.

### H5 — Pilot instrumentation + baseline calibration

**Objetivo:** Instrumentar piloto y baseline inicial sin vender predicción validada antes de datos reales.

#### Esfuerzo interno absorbido

| Partida interna | Horas | Rate CLP/h | Valor oportunidad |
| --- | ---: | ---: | ---: |
| Ingeniería métricas/export/instrumentación | 35–75 h | CLP 25.000–45.000 | CLP 0,88 MM–3,38 MM |
| Soporte interno data pipeline/notebooks | 10–25 h | CLP 25.000–45.000 | CLP 0,25 MM–1,12 MM |
| QA integridad datos/missingness/device | 10–24 h | CLP 14.000–28.000 | CLP 140.000–672.000 |
| PM protocolo piloto/coordinación | 12–28 h | CLP 18.000–35.000 | CLP 216.000–980.000 |
| **Subtotal interno absorbido** |  |  | **CLP 1,48 MM–6,15 MM** |

#### Cash-out externo Chile

| Partida cash | Rango neto CLP | Nota |
| --- | ---: | --- |
| Consultoría psicometría/data Chile | CLP 2,00 MM–7,00 MM | aprox. 49–172 UF según profundidad metodológica |
| Incentivos/reclutamiento participantes | CLP 0,50 MM–4,00 MM | 50–200 candidatos; CLP 5k–20k+ según canal |
| Survey/research tooling | CLP 50.000–250.000 | Typeform/Hotjar/Lookback/encuestas |
| Analytics/storage/compute | CLP 80.000–600.000 | almacenamiento, notebooks, exportación y análisis |
| Legal protocol/privacy addendum | CLP 0,40 MM–1,20 MM | ajuste de consentimiento/protocolo piloto |
| **Subtotal cash directo** | **CLP 3,03 MM–13,05 MM** |  |
| **Contingencia cash 15–25%** | **CLP 0,45 MM–3,26 MM** | mayor contingencia en tramo alto por proveedores/UF/dólar |
| **Cash-out recomendado H5** | **CLP 3,48 MM–16,31 MM** | neto/sin IVA |

**Comentario Chile:** Este hito debe llamarse baseline inicial. Para Chile/LatAm, la confianza comercial depende más de una muestra honesta y caveats claros que de prometer scoring psicométrico fuerte.

### H6 — Pilot launch + customer operations

**Objetivo:** Ejecutar pilotos reales con onboarding, soporte, feedback, triage y métricas de funnel.

#### Esfuerzo interno absorbido

| Partida interna | Horas | Rate CLP/h | Valor oportunidad |
| --- | ---: | ---: | ---: |
| Customer success/recruiter onboarding | 30–90 h | CLP 18.000–35.000 | CLP 0,54 MM–3,15 MM |
| Ingeniería live bugfix/triage | 20–60 h | CLP 25.000–45.000 | CLP 0,50 MM–2,70 MM |
| QA regression/reproducción live | 8–24 h | CLP 14.000–28.000 | CLP 112.000–672.000 |
| Founder sales/PM feedback loops | 15–40 h | CLP 18.000–35.000 | CLP 0,27 MM–1,40 MM |
| **Subtotal interno absorbido** |  |  | **CLP 1,42 MM–7,92 MM** |

#### Cash-out externo Chile

| Partida cash | Rango neto CLP | Nota |
| --- | ---: | --- |
| Helpdesk/CRM/email tooling | CLP 80.000–400.000 | HubSpot/Notion/Jira/Intercom/alternativas lean |
| Soporte/incentivos piloto no cubiertos en H5 | CLP 0,25 MM–1,50 MM | evitar doble conteo con H5 |
| Cloud/monitoring burst durante lanzamiento | CLP 150.000–750.000 | tráfico, logs, alertas y backups |
| Materiales cliente/traducción/video rápido | CLP 0–600.000 | si no lo hace el equipo |
| Soporte externo emergencia opcional | CLP 0,00 MM–1,50 MM | bolsa para incidentes o bugs críticos |
| **Subtotal cash directo** | **CLP 0,48 MM–4,75 MM** |  |
| **Contingencia cash 15–25%** | **CLP 0,07 MM–1,19 MM** | mayor contingencia en tramo alto por proveedores/UF/dólar |
| **Cash-out recomendado H6** | **CLP 0,55 MM–5,94 MM** | neto/sin IVA |

**Comentario Chile:** Si H5 ya cubre incentivos, no duplicarlos aquí. En Chile B2B conviene reservar caja para soporte humano cercano durante los primeros pilotos.

### H7 — MVP packaging / private beta comercial

**Objetivo:** Convertir el piloto en una beta privada vendible: narrativa, pricing, docs y materiales comerciales.

#### Esfuerzo interno absorbido

| Partida interna | Horas | Rate CLP/h | Valor oportunidad |
| --- | ---: | ---: | ---: |
| Ingeniería landing/demo/deck polish | 16–36 h | CLP 25.000–45.000 | CLP 0,40 MM–1,62 MM |
| Founder sales/pricing/copy/deck | 25–60 h | CLP 18.000–35.000 | CLP 0,45 MM–2,10 MM |
| UX/design polish | 15–35 h | CLP 18.000–35.000 | CLP 0,27 MM–1,23 MM |
| QA release smoke/assets | 8–18 h | CLP 14.000–28.000 | CLP 112.000–504.000 |
| **Subtotal interno absorbido** |  |  | **CLP 1,23 MM–5,45 MM** |

#### Cash-out externo Chile

| Partida cash | Rango neto CLP | Nota |
| --- | ---: | --- |
| Diseño/video/editorial externo opcional | CLP 0,30 MM–2,50 MM | video demo, motion simple, diseño de one-pager/deck |
| Legal review claims/pricing/deck | CLP 0,40 MM–1,20 MM | revisión de claims comerciales y límites de uso |
| CRM/analytics/sales tools | CLP 100.000–400.000 | herramientas de ventas y tracking |
| Stock/templates/domain/email | CLP 50.000–250.000 | assets y configuración comercial |
| Paid outreach/ad tests opcional | CLP 0,00 MM–1,50 MM | experimentos muy controlados; no obligatorio |
| **Subtotal cash directo** | **CLP 0,85 MM–5,85 MM** |  |
| **Contingencia cash 15–25%** | **CLP 0,13 MM–1,46 MM** | mayor contingencia en tramo alto por proveedores/UF/dólar |
| **Cash-out recomendado H7** | **CLP 0,98 MM–7,31 MM** | neto/sin IVA |

**Comentario Chile:** H7 puede ser barato si el fundador produce deck, pricing, landing y video. El tramo alto aparece al tercerizar video/diseño o hacer paid outreach.

## 7. Operación mensual chilena revisada

| Categoría mensual | Rango neto CLP | Nota |
| --- | ---: | --- |
| Hosting, DB, storage | CLP 70.000–320.000 | infra dolarizada o mixta |
| Logs/monitoring | CLP 35.000–140.000 | alertas, errores, uptime |
| Email, dominio, herramientas menores | CLP 30.000–120.000 | correo transaccional y dominios |
| API IA/fallback si se usa | CLP 45.000–450.000 | consumo dolarizado; mantener límites |
| Backups/seguridad/herramientas | CLP 50.000–250.000 | backups, scanners, storage |
| Reserva soporte/incentivos operativos | CLP 100.000–700.000 | soporte humano e incentivos puntuales |
| **Total mensual neto recomendado** | **CLP 0,33 MM–1,98 MM** | sin IVA; equivale a 8 UF–49 UF |
| **Total mensual bruto si IVA no recuperable** | **CLP 0,39 MM–2,36 MM** | escenario conservador de caja |

## 8. Recomendación para Chile

### Si el objetivo es demo/staging serio
- Priorizar H1–H3. Cash-out neto: **CLP 0,91 MM–5,36 MM**.
- Aún no abriría ampliamente a candidatos reales sin H4.

### Si el objetivo es piloto real con candidatos chilenos
- Priorizar H1–H5. Cash-out neto: **CLP 8,13 MM–37,29 MM**.
- No recortar legal/privacy, seguridad, baseline/data ni soporte de piloto.
- Mantener lenguaje: baseline inicial, apoyo a revisión humana, no decisión automática, no diagnóstico.

### Si el objetivo es private beta comercial vendible
- Completar H1–H7. Cash-out neto: **CLP 9,66 MM–50,54 MM**.
- Para venta B2B chilena, presupuestaría caja real más cerca del tramo medio: CLP 20–40 MM netos, porque compradores de RRHH pedirán privacidad, seguridad, explicación de datos y soporte.

## 9. Partidas que sí se pueden comprimir en Chile

- Desarrollo externo general si el equipo fundador ejecuta.
- PM externo y coordinación de release.
- UX/copy básico y collateral comercial inicial.
- QA manual básica, manteniendo pruebas selectivas con usuarios y navegadores.
- Diseño/video si el equipo acepta un nivel founder-led para primera beta.

## 10. Partidas que no conviene recortar

- Legal/privacy Chile: consentimiento, política, DPA, retención/eliminación, claims de RRHH.
- Security review/pentest ligero antes de candidatos reales.
- Backup/restore, monitoreo, secretos y logs.
- Baseline/calibración inicial con apoyo data/psicométrico local o LatAm.
- Incentivos/reclutamiento para feedback real.
- QA mínima en navegadores/dispositivos usados por candidatos chilenos.

## 11. Conclusión

La versión chilena del plan no debe leerse como una simple conversión USD→CLP. Al usar sueldos y proveedores chilenos, la oportunidad interna baja frente al presupuesto profesionalizado original, pero el cash-out sano para piloto B2B sigue concentrado en legal, seguridad, psicometría/data, incentivos, infraestructura y operación.

El rango recomendado para completar el roadmap con equipo fundador absorbido es **CLP 9,66 MM–50,54 MM netos** (238 UF–1.245 UF), más **CLP 0,33 MM–1,98 MM mensuales netos** de operación. Para candidatos reales y clientes B2B, el presupuesto prudente está más cerca de **CLP 20–40 MM netos** antes de venderlo como private beta seria.

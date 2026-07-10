# KRUMM Talent Assessment — revisión de costos del roadmap 2026-05-28 con equipo interno absorbido

Fecha de revisión: 2026-05-31
Roadmap base revisado: `/mnt/c/Users/sarlo/OneDrive/Escritorio/Proyectos/Test/.hermes/plans/2026-05-28-krumm-roadmap-mvp-presupuesto.md`

## 1. Lectura ejecutiva

El roadmap del 2026-05-28 estaba bien estructurado, pero el presupuesto mezclaba dos cosas distintas:

1. Costo económico total si casi todo se pagara como trabajo profesional externo o imputado.
2. Cash-out real necesario si el equipo fundador/interno absorbe ingeniería, PM, producto, parte de UX/copy, QA operativa y soporte inicial.

Bajo el supuesto pedido —el equipo fundador/interno absorbe su propio trabajo— el presupuesto deja de ser principalmente un presupuesto de desarrollo y pasa a ser un presupuesto de gastos externos inevitables o recomendables:

- infraestructura, hosting, DB, logs, backups y herramientas;
- legal/privacy;
- seguridad/pentest ligero;
- consultoría psicométrica/data para no sobreprometer validez;
- incentivos/reclutamiento de piloto;
- browser/device testing si se quiere reducir riesgo;
- materiales comerciales externos opcionales si el equipo no los produce internamente.

## 2. Supuestos usados

### 2.1 Interno absorbido como no-cash

Se asume como costo no desembolsado:

- ingeniería frontend/backend;
- DevOps básico si lo hace el equipo técnico fundador;
- PM/product ownership;
- coordinación de release;
- soporte inicial de clientes;
- copy/UX básico si lo puede resolver el equipo;
- QA manual básica si la hace el equipo.

Esto no significa que sea gratis: lo separo como costo de oportunidad interno, porque consume capacidad del equipo.

### 2.2 Cash-out externo que no conviene eliminar

Se conserva como desembolso:

- legal/privacy review;
- seguridad externa ligera antes de candidatos reales;
- consultoría data/psicometría para baseline/calibración inicial;
- cloud, DB, storage, monitoring, backups, email/dominio/herramientas;
- incentivos/reclutamiento/operación de piloto;
- QA cross-device o browser lab cuando haga falta;
- diseño/video/comercial externo sólo si el equipo no lo absorbe.

### 2.3 Tarifas de referencia para valorizar oportunidad interna

Se mantienen las tarifas del roadmap base:

- Ingeniería: USD 50/h
- DevOps: USD 60/h
- UX/product design: USD 40/h
- QA: USD 30/h
- Data/psicometría: USD 100/h
- Legal/privacy: USD 130/h
- Seguridad: USD 140/h
- PM/customer success: USD 45/h
- Marketing/sales collateral: USD 50/h

## 3. Totales revisados

| Concepto | Rango |
| --- | ---: |
| Presupuesto original del roadmap 05-28, con contingencia | USD 48.777–121.125 |
| Cash-out directo externo revisado, antes de contingencia | USD 6.840–35.350 |
| Contingencia cash recomendada | USD 1.026–8.838 |
| Cash-out recomendado con equipo interno absorbido | USD 7.866–44.188 |
| Costo de oportunidad interno valorizado, no cash | USD 21.085–47.310 |
| Costo económico total revisado, cash + oportunidad interna | USD 28.951–91.498 |

Lectura práctica:

- Si el objetivo es sólo llegar a staging y flujo usable con equipo interno, H1–H3 puede hacerse con cash-out muy bajo: USD 1.162–6.838.
- Si habrá candidatos reales, no conviene parar antes de H4: H1–H4 requiere USD 3.934–18.988 de cash-out recomendado.
- Para instrumentar piloto con baseline inicial, H1–H5 queda en USD 6.360–31.713.
- El camino completo H1–H7 queda en USD 7.866–44.188 de cash-out, más operación mensual.

## 4. Resumen por hito

| Hito | Presupuesto original 05-28 | Oportunidad interna absorbida | Cash directo externo | Contingencia cash | Cash-out recomendado |
| --- | ---: | ---: | ---: | ---: | ---: |
| H1 Release candidate + staging deploy | USD 2.950–6.010 | USD 1.515–3.150 | USD 380–1.300 | USD 57–325 | USD 437–1.625 |
| H2 Candidate assessment MVP flow | USD 5.040–10.040 | USD 3.630–7.300 | USD 330–1.820 | USD 50–455 | USD 380–2.275 |
| H3 Recruiter portal + reports/export v1 | USD 6.920–14.040 | USD 4.620–8.830 | USD 300–2.350 | USD 45–588 | USD 345–2.938 |
| H4 Privacy/compliance/security hardening | USD 7.460–17.810 | USD 2.200–5.040 | USD 2.410–9.720 | USD 362–2.430 | USD 2.772–12.150 |
| H5 Pilot instrumentation + baseline calibration | USD 8.790–20.680 | USD 3.090–6.980 | USD 2.110–10.180 | USD 316–2.545 | USD 2.426–12.725 |
| H6 Pilot launch + customer operations | USD 5.645–14.440 | USD 3.265–9.570 | USD 600–4.400 | USD 90–1.100 | USD 690–5.500 |
| H7 MVP packaging/private beta comercial | USD 5.610–13.880 | USD 2.765–6.440 | USD 710–5.580 | USD 106–1.395 | USD 816–6.975 |
| Total | USD 42.415–96.900 antes de contingencia | USD 21.085–47.310 | USD 6.840–35.350 | USD 1.026–8.838 | USD 7.866–44.188 |

## 5. Desglose detallado por hito

### H1 — Release candidate + staging deploy

Objetivo: pasar de repo local funcional a un staging accesible y verificable.

#### Esfuerzo interno absorbido

| Partida interna | Horas | Tarifa ref. | Valor oportunidad |
| --- | ---: | ---: | ---: |
| Ingeniería release/push/CI/config | 12–24 h | USD 50/h | USD 600–1.200 |
| DevOps staging frontend + backend + Postgres | 10–22 h | USD 60/h | USD 600–1.320 |
| QA smoke candidato → reporte → backend → recruiter | 6–12 h | USD 30/h | USD 180–360 |
| PM/release coordination | 3–6 h | USD 45/h | USD 135–270 |
| Subtotal interno absorbido | | | USD 1.515–3.150 |

#### Cash-out externo

| Partida cash | Rango |
| --- | ---: |
| Staging cloud/DB/storage, 1–2 meses | USD 150–500 |
| Domain/DNS/email/secrets/tooling | USD 50–200 |
| Logs/monitoring/backups bootstrap | USD 80–250 |
| Browser/device QA service opcional | USD 100–350 |
| Subtotal cash directo | USD 380–1.300 |
| Contingencia cash 15–25% | USD 57–325 |
| Cash-out recomendado H1 | USD 437–1.625 |

Comentario: con fundador técnico, H1 no debería ser caro en cash. El gasto real es infraestructura y una mínima reserva para pruebas en navegador/dispositivo.

### H2 — Candidate assessment MVP flow

Objetivo: que un candidato externo pueda completar la evaluación sin asistencia.

#### Esfuerzo interno absorbido

| Partida interna | Horas | Tarifa ref. | Valor oportunidad |
| --- | ---: | ---: | ---: |
| Ingeniería invitación/auth/consent/session states/persistencia | 45–90 h | USD 50/h | USD 2.250–4.500 |
| UX/copy flujo candidato y cámara denegada | 12–25 h | USD 40/h | USD 480–1.000 |
| QA cross-browser candidato | 18–36 h | USD 30/h | USD 540–1.080 |
| PM scope batería/criterios | 8–16 h | USD 45/h | USD 360–720 |
| Subtotal interno absorbido | | | USD 3.630–7.300 |

#### Cash-out externo

| Partida cash | Rango |
| --- | ---: |
| Incentivos usability test, 6–12 usuarios | USD 180–720 |
| Device/browser lab | USD 100–400 |
| Servicio email/invitación setup | USD 50–200 |
| Accesibilidad/traducción/copy externo opcional | USD 0–500 |
| Subtotal cash directo | USD 330–1.820 |
| Contingencia cash 15–25% | USD 50–455 |
| Cash-out recomendado H2 | USD 380–2.275 |

Comentario: este hito se puede internalizar casi completo. Lo que sí pagaría es testing con usuarios reales o semi-reales, porque los errores de consent/cámara/abandono aparecen rápido fuera del entorno del equipo.

### H3 — Recruiter portal + reports/export v1

Objetivo: hacer usable el producto para un cliente B2B sin depender del desarrollador.

#### Esfuerzo interno absorbido

| Partida interna | Horas | Tarifa ref. | Valor oportunidad |
| --- | ---: | ---: | ---: |
| Full-stack dashboard/reportes/export | 60–110 h | USD 50/h | USD 3.000–5.500 |
| UX/report IA/copy | 18–36 h | USD 40/h | USD 720–1.440 |
| QA dashboard + exports | 18–36 h | USD 30/h | USD 540–1.080 |
| PM/recruiter workflow | 8–18 h | USD 45/h | USD 360–810 |
| Subtotal interno absorbido | | | USD 4.620–8.830 |

#### Cash-out externo

| Partida cash | Rango |
| --- | ---: |
| PDF/export service/libs | USD 0–300 |
| Incentivos entrevistas recruiters | USD 150–750 |
| Browser/device QA lab | USD 100–400 |
| Assets de diseño/reporte opcional | USD 0–700 |
| Storage/email/monitoring incremental | USD 50–200 |
| Subtotal cash directo | USD 300–2.350 |
| Contingencia cash 15–25% | USD 45–588 |
| Cash-out recomendado H3 | USD 345–2.938 |

Comentario: el gasto externo más valioso aquí no es construir UI; es validar con 2–5 recruiters si entienden los límites del reporte, los caveats y qué NO inferir.

### H4 — Privacy/compliance/security hardening

Objetivo: bajar riesgo antes de candidatos reales.

#### Esfuerzo interno absorbido

| Partida interna | Horas | Tarifa ref. | Valor oportunidad |
| --- | ---: | ---: | ---: |
| Ingeniería delete/retention/audit fix | 20–45 h | USD 50/h | USD 1.000–2.250 |
| DevOps backup/restore/secrets/log hardening | 10–24 h | USD 60/h | USD 600–1.440 |
| QA/security regression | 8–18 h | USD 30/h | USD 240–540 |
| PM inventario datos/incident checklist | 8–18 h | USD 45/h | USD 360–810 |
| Subtotal interno absorbido | | | USD 2.200–5.040 |

#### Cash-out externo

| Partida cash | Rango |
| --- | ---: |
| Legal/privacy counsel | USD 1.040–3.120 |
| Security review/light pentest | USD 1.120–4.200 |
| Security tooling/scanners/secret management/backups | USD 150–700 |
| Privacy docs/DPA/templates/translation | USD 100–700 |
| Incident/insurance/compliance setup opcional | USD 0–1.000 |
| Subtotal cash directo | USD 2.410–9.720 |
| Contingencia cash 15–25% | USD 362–2.430 |
| Cash-out recomendado H4 | USD 2.772–12.150 |

Comentario: H4 es el primer hito donde el cash-out no debería comprimirse demasiado. Si hay candidatos reales, legal/privacy y seguridad no son “nice to have”; son parte de la confianza del producto.

### H5 — Pilot instrumentation + baseline calibration

Objetivo: aprender con datos reales sin vender el score como predictor validado.

#### Esfuerzo interno absorbido

| Partida interna | Horas | Tarifa ref. | Valor oportunidad |
| --- | ---: | ---: | ---: |
| Ingeniería métricas/export/instrumentación | 35–75 h | USD 50/h | USD 1.750–3.750 |
| Soporte interno data pipeline/notebooks | 10–25 h | USD 50/h | USD 500–1.250 |
| QA integridad datos/missingness/device | 10–24 h | USD 30/h | USD 300–720 |
| PM protocolo piloto/coordinación | 12–28 h | USD 45/h | USD 540–1.260 |
| Subtotal interno absorbido | | | USD 3.090–6.980 |

#### Cash-out externo

| Partida cash | Rango |
| --- | ---: |
| Consultoría psicometría/data | USD 1.200–4.500 |
| Incentivos/reclutamiento participantes | USD 500–4.000 |
| Survey/research tooling | USD 50–300 |
| Analytics/storage/compute | USD 100–600 |
| Legal protocol/privacy addendum | USD 260–780 |
| Subtotal cash directo | USD 2.110–10.180 |
| Contingencia cash 15–25% | USD 316–2.545 |
| Cash-out recomendado H5 | USD 2.426–12.725 |

Comentario: H5 no debería presentarse como validación psicométrica completa. Es baseline inicial, calidad de señal, missingness, diferencias por dispositivo/navegador y documentación honesta de claims permitidos/no permitidos.

### H6 — Pilot launch + customer operations

Objetivo: ejecutar pilotos reales con soporte, feedback y triage.

#### Esfuerzo interno absorbido

| Partida interna | Horas | Tarifa ref. | Valor oportunidad |
| --- | ---: | ---: | ---: |
| Customer success/recruiter onboarding | 30–90 h | USD 45/h | USD 1.350–4.050 |
| Ingeniería live bugfix/triage | 20–60 h | USD 50/h | USD 1.000–3.000 |
| QA regression/reproducción live | 8–24 h | USD 30/h | USD 240–720 |
| Founder sales/PM feedback loops | 15–40 h | USD 45/h | USD 675–1.800 |
| Subtotal interno absorbido | | | USD 3.265–9.570 |

#### Cash-out externo

| Partida cash | Rango |
| --- | ---: |
| Helpdesk/CRM/email tooling | USD 100–500 |
| Soporte/incentivos piloto no cubiertos en H5 | USD 300–1.500 |
| Cloud/monitoring burst durante lanzamiento | USD 200–900 |
| Materiales cliente/traducción/video rápido | USD 0–500 |
| Soporte externo emergencia opcional | USD 0–1.000 |
| Subtotal cash directo | USD 600–4.400 |
| Contingencia cash 15–25% | USD 90–1.100 |
| Cash-out recomendado H6 | USD 690–5.500 |

Comentario: si H5 ya cubre incentivos de participantes, no duplicar esta partida en H6. Aquí conviene dejar reserva para soporte operativo y bugs en vivo.

### H7 — MVP packaging / private beta comercial

Objetivo: convertir el piloto en una beta privada vendible y explicable.

#### Esfuerzo interno absorbido

| Partida interna | Horas | Tarifa ref. | Valor oportunidad |
| --- | ---: | ---: | ---: |
| Ingeniería landing/demo/deck polish | 16–36 h | USD 50/h | USD 800–1.800 |
| Founder sales/pricing/copy/deck | 25–60 h | USD 45/h | USD 1.125–2.700 |
| UX/design polish | 15–35 h | USD 40/h | USD 600–1.400 |
| QA release smoke/assets | 8–18 h | USD 30/h | USD 240–540 |
| Subtotal interno absorbido | | | USD 2.765–6.440 |

#### Cash-out externo

| Partida cash | Rango |
| --- | ---: |
| Diseño/video/editorial externo opcional | USD 300–2.500 |
| Legal review claims/pricing/deck | USD 260–780 |
| CRM/analytics/sales tools | USD 100–500 |
| Stock/templates/domain/email | USD 50–300 |
| Paid outreach/ad tests opcional | USD 0–1.500 |
| Subtotal cash directo | USD 710–5.580 |
| Contingencia cash 15–25% | USD 106–1.395 |
| Cash-out recomendado H7 | USD 816–6.975 |

Comentario: H7 puede ser barato si el equipo fundador hace deck, pricing, landing y demo. El gasto externo sólo se justifica si se quiere acelerar calidad visual/video o paid outreach.

## 6. Operación mensual revisada

El roadmap base estimaba USD 500–2.350/mes. Con soporte fundador absorbido, lo separaría así:

| Categoría mensual | Rango cash |
| --- | ---: |
| Hosting, DB, storage | USD 80–350 |
| Logs/monitoring | USD 40–150 |
| Email, dominio, herramientas menores | USD 30–100 |
| API IA/fallback si se usa | USD 50–500 |
| Backups/seguridad/herramientas | USD 50–250 |
| Subtotal infra/herramientas | USD 250–1.350 |
| Reserva soporte/incentivos operativos si aplica | USD 100–750 |
| Total mensual recomendado | USD 350–2.100 |

Si el piloto todavía no tiene candidatos reales, se puede operar más cerca del tramo bajo. Con 50–200 candidatos, clientes externos y soporte activo, presupuestaría el tramo medio/alto.

## 7. Recomendación de uso del presupuesto

### Si el objetivo es demo/staging serio, no piloto con candidatos reales

- Priorizar H1–H3.
- Cash-out aproximado: USD 1.162–6.838.
- Riesgo: todavía no es recomendable abrirlo ampliamente a candidatos reales sin H4.

### Si el objetivo es piloto real con candidatos

- Priorizar H1–H5 antes de venta fuerte.
- Cash-out aproximado: USD 6.360–31.713.
- No recortar legal/security/data baseline.
- Mantener lenguaje: baseline inicial, support for human review, no decisión automática.

### Si el objetivo es private beta comercial vendible

- Completar H1–H7.
- Cash-out aproximado: USD 7.866–44.188.
- La diferencia entre tramo bajo y alto depende de cuánto se tercerice en seguridad, legal, diseño/video, reclutamiento e incentivos.

## 8. Partidas que sí recortaría vs. roadmap original

- Desarrollo externo general: absorbido por founders/internal.
- PM externo: absorbido.
- UX/copy básico: absorbido salvo validación puntual.
- QA manual básica: absorbida salvo browser/device lab.
- Comercial/deck/one-pager: absorbido salvo diseño/video profesional.

## 9. Partidas que no recortaría para candidatos reales

- Legal/privacy review.
- Security review ligera.
- Retención/eliminación/backup/restore.
- Baseline/calibración inicial con apoyo data/psicométrico.
- Incentivos/reclutamiento para feedback real.
- Monitoring/logs/backups.
- QA mínima en navegadores/dispositivos.

## 10. Conclusión

La lectura revisada es:

- El presupuesto original de USD 48.777–121.125 era razonable como costo total profesionalizado.
- Si el equipo fundador absorbe el trabajo interno, el cash-out real para llegar a MVP piloto baja a USD 7.866–44.188, más USD 350–2.100/mes de operación.
- El tramo bajo sólo es defendible si el equipo hace casi todo y el piloto es muy controlado.
- Para candidatos reales y clientes B2B, el presupuesto sano está más cerca de USD 15k–35k cash antes de intentar venderlo como beta privada, porque legal, seguridad, baseline y operación no deberían improvisarse.

---
name: reportes-ai-ux
description: 'Disena y mejora la pagina de reportes en productos HR-Tech. Usar cuando necesites validar integracion con IA, crear analisis heuristico de respaldo, mejorar UI/UX del reporte, escribir prompts robustos para API y presentar resultados con recursos graficos claros.'
argument-hint: 'Describe el rol objetivo, datos disponibles, API de IA, estilo visual y restricciones de tiempo.'
user-invocable: true
---

# Reportes IA + UX

## Objetivo
Crear o mejorar una pagina de reportes que combine:
- Resultados generados por IA con API confiable
- Analisis heuristico reproducible como respaldo
- UI/UX clara y accionable para recruiters y hiring managers
- Recursos graficos para facilitar comprension y toma de decision

## Cuando usar esta skill
- Se requiere construir o redisenar la pagina de reportes
- Hay que verificar que la IA este conectada y respondiendo correctamente
- Se necesitan prompts de produccion con salida estructurada
- Hace falta una capa heuristica cuando IA falla o responde con baja calidad
- El reporte necesita visualizaciones y narrativa ejecutiva clara

## Entradas esperadas
- Objetivo del reporte y audiencia principal (recruiter/hiring manager)
- Datos disponibles (scores por juego, telemetria, percentiles, metadatos)
- Contrato de API de IA (modelo, endpoint, auth, limites, formato de salida)
- Restricciones de negocio (privacidad, explicabilidad, tiempo de respuesta)
- Requisitos visuales (desktop/mobile, branding, accesibilidad)

## Esquema de salida IA recomendado (JSON estricto)
- Formato obligatorio en la respuesta del modelo:
  - summary: string
  - strengths: array de strings
  - risks: array de strings
  - recommendations: array de strings
  - evidence: array de objetos { metric, value, interpretation }
  - confidence: number entre 0 y 1
  - source: string ("ai" | "heuristic" | "hybrid")
- Rechazar y regenerar si faltan campos requeridos o tipos invalidos.

## Flujo de trabajo
1. Definir alcance del reporte
- Identificar decisiones que el reporte debe habilitar.
- Establecer secciones minimas: resumen ejecutivo, fortalezas, riesgos, recomendaciones y evidencias.

2. Auditar datos y contratos
- Verificar fuentes de datos, campos obligatorios, unidades y rangos.
- Validar contrato de API IA: request, response, errores y timeouts.
- Definir esquema unico de salida para que UI no dependa de texto libre.

3. Disenar estrategia dual de analisis
- Capa IA: interpretacion narrativa, insights y recomendaciones.
- Capa heuristica: reglas por umbrales tipo semaforo para fallback y consistencia.
- Definir umbrales por competencia (ejemplo: bajo/medio/alto) y su texto de interpretacion asociado.
- Decision point: si IA falla, expira o devuelve salida invalida, activar fallback heuristico automaticamente.

4. Construir prompts robustos para API
- Definir prompt de sistema con rol, tono, limites y formato JSON estricto.
- Incluir guardrails: no inventar datos, citar evidencias disponibles, marcar incertidumbre.
- Agregar ejemplos de entrada/salida para estabilizar respuestas.
- Decision point: si el parseo falla, reintentar con prompt de reparacion estructural.

5. Implementar UX de reporte
- Ordenar la informacion de mayor impacto a mayor detalle.
- Separar claramente: dato observado, inferencia y recomendacion.
- Disenar estados de carga, error, datos incompletos y fallback activo.
- Incluir microcopy que explique origen del insight (IA, heuristica o mixto).

6. Integrar recursos graficos
- Seleccionar visualizaciones por objetivo:
  - Comparacion entre competencias: radar o barras.
  - Evolucion temporal: lineas o area.
  - Riesgo por dimension: heatmap o semaforos.
- Aplicar jerarquia visual y contraste accesible.
- Decision point: en mobile, priorizar tarjetas resumidas y graficos compactos.

7. Verificar calidad extremo a extremo
- Validar exactitud numerica entre backend y UI.
- Probar prompts con casos normales, extremos y datos faltantes.
- Confirmar que el fallback heuristico produce reporte util.
- Revisar accesibilidad (teclado, labels, contraste) y rendimiento.

## Criterios de completitud
- IA conectada con manejo de errores y timeouts.
- Prompts versionados con salida JSON estricta validable por schema.
- Fallback heuristico activo y documentado.
- Reporte entendible en menos de 60 segundos por un recruiter.
- Visualizaciones legibles en desktop y mobile.
- Trazabilidad del origen de cada conclusion (dato, regla o IA).

## Checklist rapido
- [ ] Contrato de datos y API validados
- [ ] Prompt principal y prompt de reparacion definidos
- [ ] Parser/validator de salida IA implementado con schema JSON fijo
- [ ] Reglas heuristicas por umbrales cubren casos minimos
- [ ] UI con estados loading/error/fallback
- [ ] Graficos clave con labels y leyendas claras
- [ ] QA funcional y de accesibilidad completado

## Ejemplo de invocacion
/reportes-ai-ux Mejorar pagina de reportes para recruiters en un flujo de seleccion junior, usando scores de juegos cognitivos, con IA para narrativa y fallback heuristico para alta disponibilidad.

export const PITCH_DECK_LANGUAGES = Object.freeze({
  es: 'Español',
  en: 'English',
});

export const PITCH_DECK_SLIDES = Object.freeze([
  {
    id: 'cover',
    accent: 'blue',
    es: {
      eyebrow: 'KRUMM Talent Assessment',
      title: 'Inteligencia de talento browser-local',
      subtitle: 'Modelo local, privacidad por diseño y evidencia auditable para decisiones humanas mejor informadas.',
      bullets: [
        'Evaluaciones gamificadas con telemetría agregada y no reconstructiva.',
        'Inferencia edge-local: el navegador procesa señales sensibles; el backend recibe sólo metadatos.',
        'Dashboard recruiter con confianza, caveats y trazabilidad, sin decisión automática.',
      ],
      metrics: [
        { label: 'Privacidad', value: 'metadata-only' },
        { label: 'Runtime', value: 'browser / edge' },
        { label: 'Política', value: 'human review' },
      ],
    },
    en: {
      eyebrow: 'KRUMM Talent Assessment',
      title: 'Browser-local talent intelligence',
      subtitle: 'Local model, privacy by design and auditable evidence for better human review.',
      bullets: [
        'Gamified assessments with aggregate, non-reconstructive telemetry.',
        'Edge-local inference: the browser processes sensitive signals; the backend receives metadata only.',
        'Recruiter dashboard with confidence, caveats and traceability, never automated selection.',
      ],
      metrics: [
        { label: 'Privacy', value: 'metadata-only' },
        { label: 'Runtime', value: 'browser / edge' },
        { label: 'Policy', value: 'human review' },
      ],
    },
  },
  {
    id: 'problem',
    accent: 'violet',
    es: {
      eyebrow: 'Problema',
      title: 'La selección tradicional pierde señales y aumenta sesgos operativos',
      subtitle: 'CVs, entrevistas no estructuradas y tests aislados entregan una mirada incompleta del comportamiento en tarea.',
      bullets: [
        'Poca observabilidad de consistencia, adaptación y ejecución bajo carga.',
        'Procesos difíciles de auditar: la evidencia queda dispersa o subjetiva.',
        'Sistemas centralizados elevan riesgo de privacidad si capturan datos sensibles crudos.',
      ],
      metrics: [
        { label: 'Dolor', value: 'baja trazabilidad' },
        { label: 'Riesgo', value: 'datos sensibles' },
        { label: 'Necesidad', value: 'evidencia usable' },
      ],
    },
    en: {
      eyebrow: 'Problem',
      title: 'Traditional hiring misses signals and increases operational bias',
      subtitle: 'CVs, unstructured interviews and isolated tests provide an incomplete view of task behavior.',
      bullets: [
        'Limited observability of consistency, adaptation and execution under load.',
        'Hard-to-audit processes: evidence remains scattered or subjective.',
        'Centralized systems increase privacy risk when they capture raw sensitive data.',
      ],
      metrics: [
        { label: 'Pain', value: 'low traceability' },
        { label: 'Risk', value: 'sensitive data' },
        { label: 'Need', value: 'usable evidence' },
      ],
    },
  },
  {
    id: 'solution',
    accent: 'emerald',
    es: {
      eyebrow: 'Solución',
      title: 'Evaluación gamificada con señales locales y reporte auditable',
      subtitle: 'El candidato juega módulos breves; el navegador fusiona resultados, latencias, errores, cursor y señal visual agregada.',
      bullets: [
        'Feature vector versionado: juegos, timing, interacción y calidad de señal.',
        'Modelo ONNX liviano corre en Web Worker con fallback determinístico.',
        'Reporte final separa observaciones, confianza, caveats y recomendación para revisión humana.',
      ],
      metrics: [
        { label: 'Contrato', value: '19 features' },
        { label: 'Modelo', value: 'ONNX local' },
        { label: 'Salida', value: 'edge_local_model_output_v1' },
      ],
    },
    en: {
      eyebrow: 'Solution',
      title: 'Gamified assessment with local signals and auditable reporting',
      subtitle: 'The candidate completes short modules; the browser fuses results, latency, errors, cursor and aggregate visual signal.',
      bullets: [
        'Versioned feature vector: games, timing, interaction and signal quality.',
        'Lightweight ONNX model runs in a Web Worker with deterministic fallback.',
        'Final report separates observations, confidence, caveats and human-review recommendation.',
      ],
      metrics: [
        { label: 'Contract', value: '19 features' },
        { label: 'Model', value: 'local ONNX' },
        { label: 'Output', value: 'edge_local_model_output_v1' },
      ],
    },
  },
  {
    id: 'privacy',
    accent: 'cyan',
    es: {
      eyebrow: 'Privacidad',
      title: 'La cámara y las señales sensibles nunca salen como media cruda',
      subtitle: 'El sistema persiste sólo ventanas agregadas, flags de calidad y metadatos no reconstructivos.',
      bullets: [
        'No video, frames, screenshots, blobs, base64 ni landmarks faciales crudos.',
        'Si cámara/modelo falla, baja la confianza y se agregan caveats; no se castiga al candidato.',
        'Validadores frontend y backend rechazan payloads reconstructivos aunque falle una capa.',
      ],
      metrics: [
        { label: 'Raw media', value: '0' },
        { label: 'Guard', value: 'frontend + backend' },
        { label: 'Caveats', value: 'explícitos' },
      ],
    },
    en: {
      eyebrow: 'Privacy',
      title: 'Camera and sensitive signals never leave as raw media',
      subtitle: 'The system persists only aggregate windows, quality flags and non-reconstructive metadata.',
      bullets: [
        'No video, frames, screenshots, blobs, base64 or raw facial landmarks.',
        'If camera/model fails, confidence decreases and caveats are added; candidates are not penalized.',
        'Frontend and backend validators reject reconstructive payloads even if one layer fails.',
      ],
      metrics: [
        { label: 'Raw media', value: '0' },
        { label: 'Guard', value: 'frontend + backend' },
        { label: 'Caveats', value: 'explicit' },
      ],
    },
  },
  {
    id: 'product',
    accent: 'amber',
    es: {
      eyebrow: 'Producto',
      title: 'Flujo completo: candidato, reporte y recruiter dashboard',
      subtitle: 'Un pipeline local-first que transforma juego y señal agregada en evidencia comprensible.',
      bullets: [
        'Candidato: experiencia breve, clara y compatible con consentimiento granular.',
        'Reporte: salida local del modelo, estado de calibración y política human-review-only.',
        'Recruiter: filtros por señal edge-local, calibración y revisión humana; export CSV seguro.',
      ],
      metrics: [
        { label: 'Candidato', value: 'gamificado' },
        { label: 'Reporte', value: 'auditable' },
        { label: 'Recruiter', value: 'metadata-only' },
      ],
    },
    en: {
      eyebrow: 'Product',
      title: 'Full flow: candidate, report and recruiter dashboard',
      subtitle: 'A local-first pipeline that turns game behavior and aggregate signal into understandable evidence.',
      bullets: [
        'Candidate: short, clear experience compatible with granular consent.',
        'Report: local model output, calibration status and human-review-only policy.',
        'Recruiter: filters by edge-local signal, calibration and human review; safe CSV export.',
      ],
      metrics: [
        { label: 'Candidate', value: 'gamified' },
        { label: 'Report', value: 'auditable' },
        { label: 'Recruiter', value: 'metadata-only' },
      ],
    },
  },
  {
    id: 'differentiation',
    accent: 'rose',
    es: {
      eyebrow: 'Diferenciación',
      title: 'Más señal útil, menos exposición de datos sensibles',
      subtitle: 'KRUMM combina UX gamificada, edge AI y gobierno de privacidad en una arquitectura trazable.',
      bullets: [
        'La señal se interpreta como calidad/observación, no como diagnóstico psicológico.',
        'Contratos versionados permiten auditar qué features entran y qué outputs salen.',
        'El equipo puede iterar el modelo sin cambiar el principio: metadata-only y revisión humana.',
      ],
      metrics: [
        { label: 'Gobierno', value: 'versionado' },
        { label: 'Iteración', value: 'modular' },
        { label: 'Confianza', value: 'caveats' },
      ],
    },
    en: {
      eyebrow: 'Differentiation',
      title: 'More useful signal, less sensitive-data exposure',
      subtitle: 'KRUMM combines gamified UX, edge AI and privacy governance in a traceable architecture.',
      bullets: [
        'Signals are interpreted as quality/observations, not psychological diagnosis.',
        'Versioned contracts make inputs and outputs auditable.',
        'The team can iterate the model without changing the principle: metadata-only and human review.',
      ],
      metrics: [
        { label: 'Governance', value: 'versioned' },
        { label: 'Iteration', value: 'modular' },
        { label: 'Confidence', value: 'caveats' },
      ],
    },
  },
  {
    id: 'roadmap',
    accent: 'slate',
    es: {
      eyebrow: 'Roadmap',
      title: 'Siguientes pasos hacia producto validado',
      subtitle: 'El baseline técnico ya permite validar flujo, privacidad y utilidad antes de escalar datasets o claims.',
      bullets: [
        'Smoke local/deploy: candidato → modelo local → reporte → backend → recruiter.',
        'Calibración con dataset real y métricas de fairness antes de claims predictivos fuertes.',
        'Deck nativo bilingüe editable para ventas, fundraising y demos ejecutivas.',
      ],
      metrics: [
        { label: 'Ahora', value: 'Hito 12' },
        { label: 'Después', value: 'calibración' },
        { label: 'Go-to-market', value: 'deck ES/EN' },
      ],
    },
    en: {
      eyebrow: 'Roadmap',
      title: 'Next steps toward validated product',
      subtitle: 'The technical baseline now supports validating flow, privacy and usefulness before scaling datasets or claims.',
      bullets: [
        'Local/deploy smoke: candidate → local model → report → backend → recruiter.',
        'Calibration with real datasets and fairness metrics before strong predictive claims.',
        'Editable bilingual native deck for sales, fundraising and executive demos.',
      ],
      metrics: [
        { label: 'Now', value: 'Milestone 12' },
        { label: 'Next', value: 'calibration' },
        { label: 'Go-to-market', value: 'ES/EN deck' },
      ],
    },
  },
]);

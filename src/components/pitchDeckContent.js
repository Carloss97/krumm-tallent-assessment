import page01 from '../assets/pitchdeck/page-01.png';
import page02 from '../assets/pitchdeck/page-02.png';
import page03 from '../assets/pitchdeck/page-03.png';
import page04 from '../assets/pitchdeck/page-04.png';
import page05 from '../assets/pitchdeck/page-05.png';
import page06 from '../assets/pitchdeck/page-06.png';
import page07 from '../assets/pitchdeck/page-07.png';
import page08 from '../assets/pitchdeck/page-08.png';
import page09 from '../assets/pitchdeck/page-09.png';
import page10 from '../assets/pitchdeck/page-10.png';

export const PITCH_DECK_LANGUAGES = Object.freeze({
  en: 'English',
  es: 'Español',
});

const PAGE_IMAGES = Object.freeze({
  page01,
  page02,
  page03,
  page04,
  page05,
  page06,
  page07,
  page08,
  page09,
  page10,
});

const RAW_SLIDES = [
  {
    "id": "cover",
    "label": "The Behavioral Truth",
    "image": "page01",
    "elements": [
      {
        "x": 321.76,
        "y": 359.0,
        "fontSize": 78.0,
        "color": "rgb(100,116,139)",
        "fontWeight": 700,
        "text": {
          "en": "The Behavioral Truth in B2B Hiring",
          "es": "La verdad conductual en contratación B2B"
        }
      },
      {
        "x": 242.5,
        "y": 427.87,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "Empirical Talent Validation based on Biometrics and Gamification.",
          "es": "Validación empírica de talento basada en biometría y gamificación."
        }
      }
    ]
  },
  {
    "id": "problem",
    "label": "Hiring is Broken",
    "image": "page02",
    "elements": [
      {
        "x": 94.5,
        "y": 266.43,
        "fontSize": 92.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 700,
        "text": {
          "en": "Subjective Bias",
          "es": "Sesgo subjetivo"
        }
      },
      {
        "x": 94.5,
        "y": 301.65,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "99% of companies hire based on subjective",
          "es": "El 99% de las empresas contrata según opiniones"
        }
      },
      {
        "x": 94.5,
        "y": 330.45,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "opinions that fail to predict actual",
          "es": "subjetivas que no predicen el"
        }
      },
      {
        "x": 94.5,
        "y": 359.25,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "performance.",
          "es": "desempeño real."
        }
      },
      {
        "x": 537.0,
        "y": 266.79,
        "fontSize": 96.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 700,
        "text": {
          "en": "The Human-to-Human Gap",
          "es": "La brecha humano-a-humano"
        }
      },
      {
        "x": 541.6,
        "y": 287.23,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "Modern hiring is a mechanical \"proxy war\"",
          "es": "La contratación moderna es una “guerra proxy”"
        }
      },
      {
        "x": 541.6,
        "y": 316.03,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "where AI-generated resumes are rejected",
          "es": "mecánica donde CVs generados por IA son"
        }
      },
      {
        "x": 541.6,
        "y": 344.83,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "by AI filters, wasting real human talent",
          "es": "rechazados por filtros de IA, desperdiciando"
        }
      },
      {
        "x": 541.6,
        "y": 373.63,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "because soft skills remain invisible until the",
          "es": "talento humano real porque las habilidades blandas"
        }
      },
      {
        "x": 541.6,
        "y": 402.43,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "final, costly interview stages.",
          "es": "siguen invisibles hasta entrevistas finales y costosas."
        }
      },
      {
        "x": 75.0,
        "y": 76.68,
        "fontSize": 132.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "Hiring is Broken",
          "es": "La contratación está rota"
        }
      }
    ]
  },
  {
    "id": "truth",
    "label": "Delivering the Truth",
    "image": "page03",
    "elements": [
      {
        "x": 87.0,
        "y": 300.57,
        "fontSize": 72.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "1. Immersive",
          "es": "1. Inmersiva"
        }
      },
      {
        "x": 87.0,
        "y": 330.03,
        "fontSize": 51.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "Candidates navigate interactive",
          "es": "Los candidatos navegan experiencias"
        }
      },
      {
        "x": 87.0,
        "y": 354.5,
        "fontSize": 51.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "experiences designed to evaluate",
          "es": "interactivas diseñadas para evaluar"
        }
      },
      {
        "x": 87.0,
        "y": 378.97,
        "fontSize": 51.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "real behavior under pressure.",
          "es": "conducta real bajo presión."
        }
      },
      {
        "x": 374.5,
        "y": 300.57,
        "fontSize": 72.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "2. Biometric",
          "es": "2. Biométrica"
        }
      },
      {
        "x": 374.5,
        "y": 330.03,
        "fontSize": 51.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "We capture micro-gestures and",
          "es": "Capturamos microgestos y telemetría"
        }
      },
      {
        "x": 374.5,
        "y": 354.5,
        "fontSize": 51.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "telemetry in real-time as users",
          "es": "en tiempo real mientras los usuarios"
        }
      },
      {
        "x": 374.5,
        "y": 378.97,
        "fontSize": 51.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "make critical decisions.",
          "es": "toman decisiones críticas."
        }
      },
      {
        "x": 661.99,
        "y": 300.57,
        "fontSize": 72.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "3. Unbiased",
          "es": "3. Imparcial"
        }
      },
      {
        "x": 661.99,
        "y": 330.03,
        "fontSize": 51.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "Empirical analytics on soft skills,",
          "es": "Analítica empírica de habilidades blandas,"
        }
      },
      {
        "x": 661.99,
        "y": 354.5,
        "fontSize": 51.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "stress tolerance, and leadership",
          "es": "tolerancia al estrés y liderazgo"
        }
      },
      {
        "x": 661.99,
        "y": 378.97,
        "fontSize": 51.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "delivered instantly to HR.",
          "es": "entregada instantáneamente a RR.HH."
        }
      },
      {
        "x": 75.0,
        "y": 76.68,
        "fontSize": 132.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "Delivering the Truth",
          "es": "Entregando la verdad"
        }
      }
    ]
  },
  {
    "id": "edge-ai",
    "label": "Edge AI Advantage",
    "image": "page04",
    "elements": [
      {
        "x": 75.0,
        "y": 91.68,
        "fontSize": 132.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "Edge AI Advantage",
          "es": "Ventaja Edge AI"
        }
      },
      {
        "x": 94.5,
        "y": 152.4,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "Zero Latency: 60fps inference directly in the",
          "es": "Latencia cero: inferencia a 60fps directamente en el"
        }
      },
      {
        "x": 94.5,
        "y": 181.2,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "browser. No lag, no downloads.",
          "es": "navegador. Sin lag, sin descargas."
        }
      },
      {
        "x": 94.5,
        "y": 219.15,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "Privacy by Design: EU AI Act compliant. Video",
          "es": "Privacidad por diseño: cumplimiento EU AI Act. El video"
        }
      },
      {
        "x": 94.5,
        "y": 247.95,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "stays on device; only tensors are sent.",
          "es": "permanece en el dispositivo; sólo se envían tensores."
        }
      },
      {
        "x": 94.5,
        "y": 285.9,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "Scalable: Leverages the candidate's hardware,",
          "es": "Escalable: aprovecha el hardware del candidato,"
        }
      },
      {
        "x": 94.5,
        "y": 314.7,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "reducing server costs to near zero.",
          "es": "reduciendo costos de servidor casi a cero."
        }
      }
    ]
  },
  {
    "id": "moat",
    "label": "The Defensive Moat",
    "image": "page05",
    "elements": [
      {
        "x": 60.0,
        "y": 344.25,
        "fontSize": 400.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "Proprietary .",
          "es": "Propietaria."
        }
      },
      {
        "x": 753.75,
        "y": 136.51,
        "fontSize": 56.16,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "Behavioral Intelligence",
          "es": "Inteligencia conductual"
        }
      },
      {
        "x": 753.75,
        "y": 165.52,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "Our strongest",
          "es": "Nuestra ventaja más"
        }
      },
      {
        "x": 753.75,
        "y": 194.32,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "advantage is a",
          "es": "fuerte es un dataset"
        }
      },
      {
        "x": 753.75,
        "y": 223.12,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "continuously",
          "es": "autoalimentado de"
        }
      },
      {
        "x": 753.75,
        "y": 251.93,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "self-feeding",
          "es": "forma continua. Capturamos"
        }
      },
      {
        "x": 753.75,
        "y": 280.73,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "dataset. We capture",
          "es": "datos conductuales reales"
        }
      },
      {
        "x": 753.75,
        "y": 309.52,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "real behavioral data",
          "es": "que los ATS tradicionales"
        }
      },
      {
        "x": 753.75,
        "y": 338.32,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "that traditional ATS",
          "es": "y competidores"
        }
      },
      {
        "x": 753.75,
        "y": 367.12,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "and competitors",
          "es": "no pueden"
        }
      },
      {
        "x": 753.75,
        "y": 395.93,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "cannot replicate.",
          "es": "replicar."
        }
      },
      {
        "x": 753.75,
        "y": 420.56,
        "fontSize": 60.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "Every interaction",
          "es": "Cada interacción"
        }
      },
      {
        "x": 753.75,
        "y": 449.36,
        "fontSize": 60.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "improves our global",
          "es": "mejora nuestro estándar"
        }
      },
      {
        "x": 753.75,
        "y": 478.16,
        "fontSize": 60.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "prediction",
          "es": "global de"
        }
      },
      {
        "x": 753.75,
        "y": 506.96,
        "fontSize": 60.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "standard.",
          "es": "predicción."
        }
      },
      {
        "x": 75.0,
        "y": 76.68,
        "fontSize": 132.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "The Defensive Moat",
          "es": "El moat defensivo"
        }
      }
    ]
  },
  {
    "id": "founders",
    "label": "The Core Founders",
    "image": "page06",
    "elements": [
      {
        "x": 87.0,
        "y": 255.5,
        "fontSize": 72.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "Nicolas Cowley",
          "es": "Nicolás Cowley"
        }
      },
      {
        "x": 87.0,
        "y": 284.96,
        "fontSize": 51.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 700,
        "text": {
          "en": "CEO & Commercial Director",
          "es": "CEO y Director Comercial"
        }
      },
      {
        "x": 87.0,
        "y": 318.1,
        "fontSize": 51.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "AI ethics expert. Leading",
          "es": "Experto en ética de IA. Lidera"
        }
      },
      {
        "x": 87.0,
        "y": 342.57,
        "fontSize": 51.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "commercial strategy and B2B",
          "es": "estrategia comercial y alianzas"
        }
      },
      {
        "x": 87.0,
        "y": 367.03,
        "fontSize": 51.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "partnerships.",
          "es": "B2B."
        }
      },
      {
        "x": 374.5,
        "y": 255.5,
        "fontSize": 72.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "Carlos Saldivia",
          "es": "Carlos Saldivia"
        }
      },
      {
        "x": 374.5,
        "y": 284.96,
        "fontSize": 51.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 700,
        "text": {
          "en": "CTO",
          "es": "CTO"
        }
      },
      {
        "x": 374.5,
        "y": 318.1,
        "fontSize": 51.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "MSc in Electronics. Specialist in",
          "es": "MSc en Electrónica. Especialista en"
        }
      },
      {
        "x": 374.5,
        "y": 342.57,
        "fontSize": 51.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "biometrics and signal processing.",
          "es": "biometría y procesamiento de señales."
        }
      },
      {
        "x": 661.99,
        "y": 255.5,
        "fontSize": 72.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "Gabriel Caro",
          "es": "Gabriel Caro"
        }
      },
      {
        "x": 661.99,
        "y": 284.96,
        "fontSize": 51.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 700,
        "text": {
          "en": "CPO",
          "es": "CPO"
        }
      },
      {
        "x": 661.99,
        "y": 318.1,
        "fontSize": 51.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "R&D specialist. Expert in active",
          "es": "Especialista en I+D. Experto en"
        }
      },
      {
        "x": 661.99,
        "y": 342.57,
        "fontSize": 51.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "methodologies and gamification.",
          "es": "metodologías activas y gamificación."
        }
      },
      {
        "x": 75.0,
        "y": 76.68,
        "fontSize": 132.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "The Core Founders",
          "es": "Fundadores core"
        }
      }
    ]
  },
  {
    "id": "market",
    "label": "Target Market",
    "image": "page07",
    "elements": [
      {
        "x": 64.5,
        "y": 244.98,
        "fontSize": 48.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "Segment Estimated Value Definition",
          "es": "Segmento Valor estimado Definición"
        }
      },
      {
        "x": 64.5,
        "y": 290.54,
        "fontSize": 48.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "TAM $32B Global HR Tech and Recruitment Market.",
          "es": "TAM $32B Mercado global de HR Tech y reclutamiento."
        }
      },
      {
        "x": 64.5,
        "y": 336.1,
        "fontSize": 48.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "SAM $2.5B Global critical recruitment sectors (Logistics, Finance).",
          "es": "SAM $2.5B Sectores globales de reclutamiento crítico (Logística, Finanzas)."
        }
      },
      {
        "x": 64.5,
        "y": 381.67,
        "fontSize": 48.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "SOM $100M Initial target LatAm market (Aquaculture and Fishing).",
          "es": "SOM $100M Mercado LatAm inicial (Acuicultura y Pesca)."
        }
      },
      {
        "x": 75.0,
        "y": 76.68,
        "fontSize": 132.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "Target Market",
          "es": "Mercado objetivo"
        }
      }
    ]
  },
  {
    "id": "value-capture",
    "label": "Value Capture Strategy",
    "image": "page08",
    "elements": [
      {
        "x": 60.0,
        "y": 344.25,
        "fontSize": 400.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "10:1",
          "es": "10:1"
        }
      },
      {
        "x": 295.5,
        "y": 262.85,
        "fontSize": 56.16,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "Client ROI",
          "es": "ROI del cliente"
        }
      },
      {
        "x": 295.5,
        "y": 296.02,
        "fontSize": 60.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 500,
        "text": {
          "en": "Pricing: Annual B2B SaaS subscription tiered by assessment volume (per candidate).",
          "es": "Precio: suscripción SaaS B2B anual por volumen de evaluaciones (por candidato)."
        }
      },
      {
        "x": 295.5,
        "y": 324.82,
        "fontSize": 60.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 500,
        "text": {
          "en": "Value: Designed to deliver a 10x ROI by reducing bad hires and interview hours.",
          "es": "Valor: diseñado para entregar ROI 10x reduciendo malas contrataciones y horas de entrevista."
        }
      },
      {
        "x": 295.5,
        "y": 353.62,
        "fontSize": 60.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 500,
        "text": {
          "en": "Go-To-Market: Land & Expand (Validate via pilot → Roll out to facility → Expand to",
          "es": "Go-To-Market: Land & Expand (validar piloto → desplegar en planta → expandir a"
        }
      },
      {
        "x": 295.5,
        "y": 382.43,
        "fontSize": 60.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 500,
        "text": {
          "en": "corporate)",
          "es": "corporativo)"
        }
      },
      {
        "x": 75.0,
        "y": 76.68,
        "fontSize": 132.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "Value Capture Strategy",
          "es": "Estrategia de captura de valor"
        }
      }
    ]
  },
  {
    "id": "dominates",
    "label": "Why KRUMM Dominates",
    "image": "page09",
    "elements": [
      {
        "x": 64.5,
        "y": 222.12,
        "fontSize": 48.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "Criteria Traditional ATS AI Avatars KRUMM",
          "es": "Criterio ATS tradicional Avatares IA KRUMM"
        }
      },
      {
        "x": 64.5,
        "y": 267.72,
        "fontSize": 48.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "Nature of Data Subjective Declarative Empirical (Biometrics)",
          "es": "Naturaleza del dato Subjetiva Declarativa Empírica (biometría)"
        }
      },
      {
        "x": 64.5,
        "y": 313.32,
        "fontSize": 48.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "Privacy Compliance Secure Cloud Risk Native (Edge AI)",
          "es": "Privacidad Seguro Riesgo cloud Nativa (Edge AI)"
        }
      },
      {
        "x": 64.5,
        "y": 358.92,
        "fontSize": 48.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "Experience High Friction Uncomfortable Gamified / Immersive",
          "es": "Experiencia Alta fricción Incómoda Gamificada / inmersiva"
        }
      },
      {
        "x": 64.5,
        "y": 404.52,
        "fontSize": 48.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "Soft Skills Accuracy None Limited High Precision",
          "es": "Precisión habilidades blandas Nula Limitada Alta precisión"
        }
      },
      {
        "x": 75.0,
        "y": 76.68,
        "fontSize": 132.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "Why KRUMM Dominates",
          "es": "Por qué KRUMM domina"
        }
      }
    ]
  },
  {
    "id": "milestones",
    "label": "Our Next Milestones",
    "image": "page10",
    "elements": [
      {
        "x": 95.56,
        "y": 152.6,
        "fontSize": 68.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 700,
        "text": {
          "en": "Pilot Execution: Successfully launch our first industrial pilot with Cermaq to validate our soft-skill",
          "es": "Ejecución piloto: lanzar con éxito nuestro primer piloto industrial con Cermaq para validar modelos"
        }
      },
      {
        "x": 294.05,
        "y": 173.0,
        "fontSize": 68.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 700,
        "text": {
          "en": "biometric models in a high-stakes environment.",
          "es": "biométricos de habilidades blandas en un entorno de alta exigencia."
        }
      },
      {
        "x": 75.0,
        "y": 213.8,
        "fontSize": 68.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 700,
        "text": {
          "en": "Sector Dominance: Leverage the Cermaq success to secure 5 additional Tier-1 contracts in the LatAm",
          "es": "Dominio sectorial: aprovechar el éxito con Cermaq para asegurar 5 contratos Tier-1 adicionales en"
        }
      },
      {
        "x": 352.96,
        "y": 234.2,
        "fontSize": 68.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 700,
        "text": {
          "en": "aquaculture and fishing industry.",
          "es": "la industria acuícola y pesquera LatAm."
        }
      },
      {
        "x": 106.95,
        "y": 275.0,
        "fontSize": 68.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 700,
        "text": {
          "en": "Product Calibration: Finalize Edge AI integration to ensure maximum privacy and zero-latency",
          "es": "Calibración de producto: finalizar la integración Edge AI para máxima privacidad y desempeño"
        }
      },
      {
        "x": 369.44,
        "y": 295.4,
        "fontSize": 68.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 700,
        "text": {
          "en": "performance for B2B clients.",
          "es": "de latencia cero para clientes B2B."
        }
      },
      {
        "x": 246.72,
        "y": 375.67,
        "fontSize": 78.0,
        "color": "rgb(100,116,139)",
        "fontWeight": 700,
        "text": {
          "en": "Accelerating our Go-To-Market with Smart Capital.",
          "es": "Acelerando nuestro Go-To-Market con capital inteligente."
        }
      },
      {
        "x": 323.58,
        "y": 435.38,
        "fontSize": 60.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 500,
        "text": {
          "en": "Join us in uncovering the Behavioral Truth.",
          "es": "Únete a descubrir la verdad conductual."
        }
      },
      {
        "x": 79.04,
        "y": 76.41,
        "fontSize": 132.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "text": {
          "en": "Our Next Milestones",
          "es": "Nuestros próximos hitos"
        }
      }
    ]
  }
];

export const PITCH_DECK_SLIDES = Object.freeze(RAW_SLIDES.map((slide) => Object.freeze({
  ...slide,
  background: PAGE_IMAGES[slide.image],
  elements: Object.freeze(slide.elements.map((element) => Object.freeze(element))),
})));

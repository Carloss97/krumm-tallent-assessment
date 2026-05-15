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
    "label": "The Behavioral Truth in B2B Hiring",
    "image": "page01",
    "elements": [
      {
        "x": 321.76,
        "y": 359.0,
        "width": 316.27,
        "fontSize": 19.5,
        "color": "rgb(100,116,139)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "The Behavioral Truth in B2B Hiring",
          "es": "La verdad conductual en contratación B2B"
        }
      },
      {
        "x": 242.5,
        "y": 427.87,
        "width": 474.45,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Empirical Talent Validation based on Biometrics and Gamification.",
          "es": "Validación empírica de talento basada en biometría y gamificación."
        }
      }
    ]
  },
  {
    "id": "problem",
    "label": "Subjective Bias",
    "image": "page02",
    "elements": [
      {
        "x": 94.5,
        "y": 266.43,
        "width": 157.21,
        "fontSize": 23.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Subjective Bias",
          "es": "Sesgo subjetivo"
        }
      },
      {
        "x": 94.5,
        "y": 301.65,
        "width": 315.24,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "99% of companies hire based on subjective",
          "es": "El 99% de las empresas contrata según opiniones"
        }
      },
      {
        "x": 94.5,
        "y": 330.45,
        "width": 239.55,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "opinions that fail to predict actual",
          "es": "subjetivas que no predicen el"
        }
      },
      {
        "x": 94.5,
        "y": 359.25,
        "width": 95.78,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "performance.",
          "es": "desempeño real."
        }
      },
      {
        "x": 537.0,
        "y": 266.79,
        "width": 286.52,
        "fontSize": 24.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "The Human-to-Human Gap",
          "es": "La brecha humano-a-humano"
        }
      },
      {
        "x": 541.59,
        "y": 287.23,
        "width": 305.62,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Modern hiring is a mechanical \"proxy war\"",
          "es": "La contratación moderna es una “guerra proxy”"
        }
      },
      {
        "x": 541.59,
        "y": 316.03,
        "width": 299.66,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "where AI-generated resumes are rejected",
          "es": "mecánica donde CVs generados por IA son"
        }
      },
      {
        "x": 541.59,
        "y": 344.83,
        "width": 274.71,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "by AI filters, wasting real human talent",
          "es": "rechazados por filtros de IA, desperdiciando"
        }
      },
      {
        "x": 541.59,
        "y": 373.63,
        "width": 309.79,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "because soft skills remain invisible until the",
          "es": "talento humano real porque las habilidades blandas"
        }
      },
      {
        "x": 541.59,
        "y": 402.43,
        "width": 209.85,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "final, costly interview stages.",
          "es": "siguen invisibles hasta entrevistas finales y costosas."
        }
      },
      {
        "x": 75.0,
        "y": 76.68,
        "width": 125.8,
        "fontSize": 33.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Hiring is",
          "es": "Hiring is"
        }
      },
      {
        "x": 200.71,
        "y": 76.68,
        "width": 98.18,
        "fontSize": 33.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 400,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Broken",
          "es": "Broken"
        }
      }
    ]
  },
  {
    "id": "solution",
    "label": "1. Immersive",
    "image": "page03",
    "elements": [
      {
        "x": 87.0,
        "y": 300.57,
        "width": 99.11,
        "fontSize": 18.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "1. Immersive",
          "es": "1. Inmersiva"
        }
      },
      {
        "x": 87.0,
        "y": 330.03,
        "width": 192.92,
        "fontSize": 12.75,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Candidates navigate interactive",
          "es": "Los candidatos navegan experiencias"
        }
      },
      {
        "x": 87.0,
        "y": 354.5,
        "width": 206.08,
        "fontSize": 12.75,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "experiences designed to evaluate",
          "es": "interactivas diseñadas para evaluar"
        }
      },
      {
        "x": 87.0,
        "y": 378.97,
        "width": 177.14,
        "fontSize": 12.75,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "real behavior under pressure.",
          "es": "conducta real bajo presión."
        }
      },
      {
        "x": 374.5,
        "y": 300.57,
        "width": 95.36,
        "fontSize": 18.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "2. Biometric",
          "es": "2. Biométrica"
        }
      },
      {
        "x": 374.5,
        "y": 330.03,
        "width": 194.26,
        "fontSize": 12.75,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "We capture micro-gestures and",
          "es": "Capturamos microgestos y telemetría"
        }
      },
      {
        "x": 374.5,
        "y": 354.5,
        "width": 186.58,
        "fontSize": 12.75,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "telemetry in real-time as users",
          "es": "en tiempo real mientras los usuarios"
        }
      },
      {
        "x": 374.5,
        "y": 378.97,
        "width": 140.73,
        "fontSize": 12.75,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "make critical decisions.",
          "es": "toman decisiones críticas."
        }
      },
      {
        "x": 661.99,
        "y": 300.57,
        "width": 94.03,
        "fontSize": 18.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "3. Unbiased",
          "es": "3. Imparcial"
        }
      },
      {
        "x": 661.99,
        "y": 330.03,
        "width": 198.14,
        "fontSize": 12.75,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Empirical analytics on soft skills,",
          "es": "Analítica empírica de habilidades blandas,"
        }
      },
      {
        "x": 661.99,
        "y": 354.5,
        "width": 196.18,
        "fontSize": 12.75,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "stress tolerance, and leadership",
          "es": "tolerancia al estrés y liderazgo"
        }
      },
      {
        "x": 661.99,
        "y": 378.97,
        "width": 150.07,
        "fontSize": 12.75,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "delivered instantly to HR.",
          "es": "entregada instantáneamente a RR.HH."
        }
      },
      {
        "x": 75.0,
        "y": 76.68,
        "width": 213.71,
        "fontSize": 33.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Delivering the",
          "es": "Delivering the"
        }
      },
      {
        "x": 288.63,
        "y": 76.68,
        "width": 75.5,
        "fontSize": 33.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 400,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Truth",
          "es": "Truth"
        }
      }
    ]
  },
  {
    "id": "differentiator",
    "label": "Edge AI",
    "image": "page04",
    "elements": [
      {
        "x": 75.0,
        "y": 91.68,
        "width": 124.44,
        "fontSize": 33.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Edge AI",
          "es": "Edge AI"
        }
      },
      {
        "x": 199.39,
        "y": 91.68,
        "width": 160.74,
        "fontSize": 33.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 400,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Advantage",
          "es": "Advantage"
        }
      },
      {
        "x": 93.75,
        "y": 152.4,
        "width": 100.73,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Zero Latency:",
          "es": "Zero Latency:"
        }
      },
      {
        "x": 194.55,
        "y": 152.4,
        "width": 220.86,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "60fps inference directly in the",
          "es": "60fps inference directly in the"
        }
      },
      {
        "x": 93.75,
        "y": 181.2,
        "width": 223.36,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "browser. No lag, no downloads.",
          "es": "navegador. Sin lag, sin descargas."
        }
      },
      {
        "x": 93.75,
        "y": 219.15,
        "width": 136.33,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Privacy by Design:",
          "es": "Privacy by Design:"
        }
      },
      {
        "x": 230.23,
        "y": 219.15,
        "width": 198.11,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "EU AI Act compliant. Video",
          "es": "EU AI Act compliant. Video"
        }
      },
      {
        "x": 93.75,
        "y": 247.95,
        "width": 272.1,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "stays on device; only tensors are sent.",
          "es": "permanece en el dispositivo; sólo se envían tensores."
        }
      },
      {
        "x": 93.75,
        "y": 285.9,
        "width": 67.63,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Scalable:",
          "es": "Scalable:"
        }
      },
      {
        "x": 161.49,
        "y": 285.9,
        "width": 270.39,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Leverages the candidate's hardware,",
          "es": "Leverages the candidate's hardware,"
        }
      },
      {
        "x": 93.75,
        "y": 314.7,
        "width": 247.74,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "reducing server costs to near zero.",
          "es": "reduciendo costos de servidor casi a cero."
        }
      }
    ]
  },
  {
    "id": "technology",
    "label": "Proprietary",
    "image": "page05",
    "elements": [
      {
        "x": 60.0,
        "y": 344.25,
        "width": 514.4,
        "fontSize": 100.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 800,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Proprietary",
          "es": "Proprietary"
        }
      },
      {
        "x": 608.27,
        "y": 344.25,
        "width": 23.9,
        "fontSize": 100.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 800,
        "fontFamily": "Urbanist",
        "text": {
          "en": ".",
          "es": "."
        }
      },
      {
        "x": 753.75,
        "y": 136.51,
        "width": 143.07,
        "fontSize": 14.04,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Behavioral Intelligence",
          "es": "Inteligencia conductual"
        }
      },
      {
        "x": 753.75,
        "y": 165.52,
        "width": 101.19,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Our strongest",
          "es": "Nuestra ventaja más"
        }
      },
      {
        "x": 753.75,
        "y": 194.32,
        "width": 107.21,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "advantage is a",
          "es": "fuerte es un dataset"
        }
      },
      {
        "x": 753.75,
        "y": 223.12,
        "width": 94.74,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "continuously",
          "es": "autoalimentado de"
        }
      },
      {
        "x": 753.75,
        "y": 251.92,
        "width": 89.97,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "self-feeding",
          "es": "forma continua. Capturamos"
        }
      },
      {
        "x": 753.75,
        "y": 280.72,
        "width": 146.48,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "dataset. We capture",
          "es": "datos conductuales reales"
        }
      },
      {
        "x": 753.75,
        "y": 309.52,
        "width": 143.67,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "real behavioral data",
          "es": "que los ATS tradicionales"
        }
      },
      {
        "x": 753.75,
        "y": 338.32,
        "width": 138.29,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "that traditional ATS",
          "es": "y competidores"
        }
      },
      {
        "x": 753.75,
        "y": 367.12,
        "width": 119.31,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "and competitors",
          "es": "no pueden"
        }
      },
      {
        "x": 753.75,
        "y": 395.92,
        "width": 118.46,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "cannot replicate.",
          "es": "replicar."
        }
      },
      {
        "x": 753.75,
        "y": 420.56,
        "width": 128.34,
        "fontSize": 15.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Every interaction",
          "es": "Cada interacción"
        }
      },
      {
        "x": 753.75,
        "y": 449.36,
        "width": 148.18,
        "fontSize": 15.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "improves our global",
          "es": "mejora nuestro estándar"
        }
      },
      {
        "x": 753.75,
        "y": 478.16,
        "width": 78.04,
        "fontSize": 15.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "prediction",
          "es": "global de"
        }
      },
      {
        "x": 753.75,
        "y": 506.96,
        "width": 70.32,
        "fontSize": 15.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "standard.",
          "es": "predicción."
        }
      },
      {
        "x": 75.0,
        "y": 76.68,
        "width": 219.29,
        "fontSize": 33.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "The Defensive",
          "es": "The Defensive"
        }
      },
      {
        "x": 294.29,
        "y": 76.68,
        "width": 76.59,
        "fontSize": 33.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 400,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Moat",
          "es": "Moat"
        }
      }
    ]
  },
  {
    "id": "market",
    "label": "Nicolas Cowley",
    "image": "page06",
    "elements": [
      {
        "x": 87.0,
        "y": 255.5,
        "width": 122.65,
        "fontSize": 18.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Nicolas Cowley",
          "es": "Nicolás Cowley"
        }
      },
      {
        "x": 87.0,
        "y": 284.96,
        "width": 169.47,
        "fontSize": 12.75,
        "color": "rgb(155,144,127)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "CEO & Commercial Director",
          "es": "CEO y Director Comercial"
        }
      },
      {
        "x": 87.0,
        "y": 318.1,
        "width": 153.05,
        "fontSize": 12.75,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "AI ethics expert. Leading",
          "es": "Experto en ética de IA. Lidera"
        }
      },
      {
        "x": 87.0,
        "y": 342.57,
        "width": 180.41,
        "fontSize": 12.75,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "commercial strategy and B2B",
          "es": "estrategia comercial y alianzas"
        }
      },
      {
        "x": 87.0,
        "y": 367.04,
        "width": 79.51,
        "fontSize": 12.75,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "partnerships.",
          "es": "B2B."
        }
      },
      {
        "x": 374.5,
        "y": 255.5,
        "width": 122.2,
        "fontSize": 18.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Carlos Saldivia",
          "es": "Carlos Saldivia"
        }
      },
      {
        "x": 374.5,
        "y": 284.96,
        "width": 27.35,
        "fontSize": 12.75,
        "color": "rgb(155,144,127)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "CTO",
          "es": "CTO"
        }
      },
      {
        "x": 374.5,
        "y": 318.1,
        "width": 194.22,
        "fontSize": 12.75,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "MSc in Electronics. Specialist in",
          "es": "MSc en Electrónica. Especialista en"
        }
      },
      {
        "x": 374.5,
        "y": 342.57,
        "width": 202.16,
        "fontSize": 12.75,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "biometrics and signal processing.",
          "es": "biometría y procesamiento de señales."
        }
      },
      {
        "x": 661.99,
        "y": 255.5,
        "width": 103.72,
        "fontSize": 18.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Gabriel Caro",
          "es": "Gabriel Caro"
        }
      },
      {
        "x": 661.99,
        "y": 284.96,
        "width": 27.49,
        "fontSize": 12.75,
        "color": "rgb(155,144,127)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "CPO",
          "es": "CPO"
        }
      },
      {
        "x": 661.99,
        "y": 318.1,
        "width": 189.38,
        "fontSize": 12.75,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "R&D specialist. Expert in active",
          "es": "Especialista en I+D. Experto en"
        }
      },
      {
        "x": 661.99,
        "y": 342.57,
        "width": 196.44,
        "fontSize": 12.75,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "methodologies and gamification.",
          "es": "metodologías activas y gamificación."
        }
      },
      {
        "x": 75.0,
        "y": 76.68,
        "width": 143.25,
        "fontSize": 33.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "The Core",
          "es": "The Core"
        }
      },
      {
        "x": 218.24,
        "y": 76.68,
        "width": 130.45,
        "fontSize": 33.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 400,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Founders",
          "es": "Founders"
        }
      }
    ]
  },
  {
    "id": "business-model",
    "label": "Segment",
    "image": "page07",
    "elements": [
      {
        "x": 64.5,
        "y": 244.98,
        "width": 52.5,
        "fontSize": 12.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Segment",
          "es": "Segment"
        }
      },
      {
        "x": 196.61,
        "y": 244.98,
        "width": 94.4,
        "fontSize": 12.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Estimated Value",
          "es": "Estimated Value"
        }
      },
      {
        "x": 407.98,
        "y": 244.98,
        "width": 57.06,
        "fontSize": 12.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Definition",
          "es": "Definition"
        }
      },
      {
        "x": 64.5,
        "y": 290.54,
        "width": 25.84,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "TAM",
          "es": "TAM"
        }
      },
      {
        "x": 196.61,
        "y": 290.54,
        "width": 31.07,
        "fontSize": 12.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "$32B",
          "es": "$32B"
        }
      },
      {
        "x": 407.98,
        "y": 290.54,
        "width": 229.8,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Global HR Tech and Recruitment Market.",
          "es": "Global HR Tech and Recruitment Market."
        }
      },
      {
        "x": 64.5,
        "y": 336.1,
        "width": 26.8,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "SAM",
          "es": "SAM"
        }
      },
      {
        "x": 196.61,
        "y": 336.1,
        "width": 34.72,
        "fontSize": 12.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "$2.5B",
          "es": "$2.5B"
        }
      },
      {
        "x": 407.98,
        "y": 336.1,
        "width": 308.7,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Global critical recruitment sectors Logistics, Finance).",
          "es": "Global critical recruitment sectors Logistics, Finance)."
        }
      },
      {
        "x": 64.5,
        "y": 381.67,
        "width": 27.7,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "SOM",
          "es": "SOM"
        }
      },
      {
        "x": 196.61,
        "y": 381.67,
        "width": 40.37,
        "fontSize": 12.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "$100M",
          "es": "$100M"
        }
      },
      {
        "x": 407.98,
        "y": 381.67,
        "width": 301.43,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Initial target LatAm market Aquaculture and Fishing).",
          "es": "Initial target LatAm market Aquaculture and Fishing)."
        }
      },
      {
        "x": 75.0,
        "y": 76.68,
        "width": 107.28,
        "fontSize": 33.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Target",
          "es": "Target"
        }
      },
      {
        "x": 182.2,
        "y": 76.68,
        "width": 102.8,
        "fontSize": 33.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 400,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Market",
          "es": "Market"
        }
      }
    ]
  },
  {
    "id": "roadmap",
    "label": "10",
    "image": "page08",
    "elements": [
      {
        "x": 60.0,
        "y": 344.25,
        "width": 95.7,
        "fontSize": 100.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 800,
        "fontFamily": "Urbanist",
        "text": {
          "en": "10",
          "es": "10"
        }
      },
      {
        "x": 161.93,
        "y": 344.25,
        "width": 23.9,
        "fontSize": 100.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 800,
        "fontFamily": "Urbanist",
        "text": {
          "en": ":",
          "es": ":"
        }
      },
      {
        "x": 189.0,
        "y": 344.25,
        "width": 35.0,
        "fontSize": 100.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 800,
        "fontFamily": "Urbanist",
        "text": {
          "en": "1",
          "es": "1"
        }
      },
      {
        "x": 295.5,
        "y": 262.85,
        "width": 62.91,
        "fontSize": 14.04,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Client ROI",
          "es": "ROI del cliente"
        }
      },
      {
        "x": 295.5,
        "y": 296.02,
        "width": 56.58,
        "fontSize": 15.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Pricing:",
          "es": "Pricing:"
        }
      },
      {
        "x": 352.17,
        "y": 296.02,
        "width": 545.64,
        "fontSize": 15.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Annual B2B SaaS subscription tiered by assessment volume (per candidate).",
          "es": "Annual B2B SaaS subscription tiered by assessment volume (per candidate)."
        }
      },
      {
        "x": 295.5,
        "y": 324.82,
        "width": 46.3,
        "fontSize": 15.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Value:",
          "es": "Value:"
        }
      },
      {
        "x": 341.87,
        "y": 324.82,
        "width": 517.48,
        "fontSize": 15.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Designed to deliver a 10x ROI by reducing bad hires and interview hours.",
          "es": "Designed to deliver a 10x ROI by reducing bad hires and interview hours."
        }
      },
      {
        "x": 295.5,
        "y": 353.62,
        "width": 108.12,
        "fontSize": 15.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Go-To-Market:",
          "es": "Go-To-Market:"
        }
      },
      {
        "x": 403.71,
        "y": 353.62,
        "width": 477.72,
        "fontSize": 15.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Land & Expand Validate via pilot → Roll out to facility → Expand to",
          "es": "Land & Expand Validate via pilot → Roll out to facility → Expand to"
        }
      },
      {
        "x": 295.5,
        "y": 382.42,
        "width": 74.45,
        "fontSize": 15.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "corporate)",
          "es": "corporativo)"
        }
      },
      {
        "x": 75.0,
        "y": 76.68,
        "width": 222.82,
        "fontSize": 33.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Value Capture",
          "es": "Value Capture"
        }
      },
      {
        "x": 297.8,
        "y": 76.68,
        "width": 125.57,
        "fontSize": 33.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 400,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Strategy",
          "es": "Strategy"
        }
      }
    ]
  },
  {
    "id": "team",
    "label": "Criteria",
    "image": "page09",
    "elements": [
      {
        "x": 64.5,
        "y": 222.12,
        "width": 43.6,
        "fontSize": 12.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Criteria",
          "es": "Criteria"
        }
      },
      {
        "x": 281.6,
        "y": 222.12,
        "width": 88.99,
        "fontSize": 12.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Traditional ATS",
          "es": "Traditional ATS"
        }
      },
      {
        "x": 491.88,
        "y": 222.12,
        "width": 60.34,
        "fontSize": 12.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "AI Avatars",
          "es": "AI Avatars"
        }
      },
      {
        "x": 666.93,
        "y": 222.12,
        "width": 47.21,
        "fontSize": 12.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "KRUMM",
          "es": "KRUMM"
        }
      },
      {
        "x": 64.5,
        "y": 267.72,
        "width": 82.56,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Nature of Data",
          "es": "Nature of Data"
        }
      },
      {
        "x": 281.6,
        "y": 267.72,
        "width": 59.22,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Subjective",
          "es": "Subjective"
        }
      },
      {
        "x": 491.88,
        "y": 267.72,
        "width": 63.72,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Declarative",
          "es": "Declarative"
        }
      },
      {
        "x": 666.93,
        "y": 267.72,
        "width": 127.7,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Empirical Biometrics)",
          "es": "Empirical Biometrics)"
        }
      },
      {
        "x": 64.5,
        "y": 313.32,
        "width": 112.61,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Privacy Compliance",
          "es": "Privacy Compliance"
        }
      },
      {
        "x": 281.6,
        "y": 313.32,
        "width": 39.95,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Secure",
          "es": "Secure"
        }
      },
      {
        "x": 491.88,
        "y": 313.32,
        "width": 60.18,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Cloud Risk",
          "es": "Cloud Risk"
        }
      },
      {
        "x": 666.93,
        "y": 313.32,
        "width": 93.62,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Native Edge AI",
          "es": "Native Edge AI"
        }
      },
      {
        "x": 64.5,
        "y": 358.92,
        "width": 63.54,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Experience",
          "es": "Experience"
        }
      },
      {
        "x": 281.6,
        "y": 358.92,
        "width": 71.84,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "High Friction",
          "es": "High Friction"
        }
      },
      {
        "x": 491.88,
        "y": 358.92,
        "width": 84.47,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Uncomfortable",
          "es": "Uncomfortable"
        }
      },
      {
        "x": 666.93,
        "y": 358.92,
        "width": 123.18,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Gamified / Immersive",
          "es": "Gamified / Immersive"
        }
      },
      {
        "x": 64.5,
        "y": 404.52,
        "width": 112.56,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Soft Skills Accuracy",
          "es": "Soft Skills Accuracy"
        }
      },
      {
        "x": 281.6,
        "y": 404.52,
        "width": 30.3,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "None",
          "es": "None"
        }
      },
      {
        "x": 491.88,
        "y": 404.52,
        "width": 41.24,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Limited",
          "es": "Limited"
        }
      },
      {
        "x": 666.93,
        "y": 404.52,
        "width": 83.72,
        "fontSize": 12.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "High Precision",
          "es": "High Precision"
        }
      },
      {
        "x": 75.0,
        "y": 76.68,
        "width": 205.85,
        "fontSize": 33.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Why KRUMM",
          "es": "Why KRUMM"
        }
      },
      {
        "x": 280.9,
        "y": 76.68,
        "width": 155.76,
        "fontSize": 33.0,
        "color": "rgb(155,144,127)",
        "fontWeight": 400,
        "fontFamily": "Urbanist",
        "text": {
          "en": "Dominates",
          "es": "Dominates"
        }
      }
    ]
  },
  {
    "id": "ask",
    "label": "Pilot Execution",
    "image": "page10",
    "elements": [
      {
        "x": 95.56,
        "y": 152.6,
        "width": 123.17,
        "fontSize": 17.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Pilot Execution",
          "es": "Pilot Execution"
        }
      },
      {
        "x": 218.81,
        "y": 152.6,
        "width": 659.23,
        "fontSize": 17.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": ": Successfully launch our first industrial pilot with Cermaq to validate our soft-skill",
          "es": ": Successfully launch our first industrial pilot with Cermaq to validate our soft-skill"
        }
      },
      {
        "x": 294.06,
        "y": 173.0,
        "width": 380.77,
        "fontSize": 17.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "biometric models in a high-stakes environment.",
          "es": "biométricos de habilidades blandas en un entorno de alta exigencia."
        }
      },
      {
        "x": 74.08,
        "y": 213.8,
        "width": 158.22,
        "fontSize": 17.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Sector Dominance:",
          "es": "Sector Dominance:"
        }
      },
      {
        "x": 232.37,
        "y": 213.8,
        "width": 667.2,
        "fontSize": 17.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Leverage the Cermaq success to secure 5 additional Tier-1 contracts in the LatAm",
          "es": "Leverage the Cermaq success to secure 5 additional Tier-1 contracts in the LatAm"
        }
      },
      {
        "x": 352.96,
        "y": 234.2,
        "width": 263.02,
        "fontSize": 17.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "aquaculture and fishing industry.",
          "es": "la industria acuícola y pesquera LatAm."
        }
      },
      {
        "x": 106.95,
        "y": 275.0,
        "width": 160.12,
        "fontSize": 17.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Product Calibration",
          "es": "Product Calibration"
        }
      },
      {
        "x": 267.16,
        "y": 275.0,
        "width": 599.61,
        "fontSize": 17.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": ": Finalize Edge AI integration to ensure maximum privacy and zero-latency",
          "es": ": Finalize Edge AI integration to ensure maximum privacy and zero-latency"
        }
      },
      {
        "x": 369.44,
        "y": 295.4,
        "width": 230.08,
        "fontSize": 17.0,
        "color": "rgb(0,0,0)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "performance for B2B clients.",
          "es": "de latencia cero para clientes B2B."
        }
      },
      {
        "x": 246.72,
        "y": 375.67,
        "width": 466.17,
        "fontSize": 19.5,
        "color": "rgb(100,116,139)",
        "fontWeight": 400,
        "fontFamily": "Inter",
        "text": {
          "en": "Accelerating our Go-To-Market with Smart Capital.",
          "es": "Acelerando nuestro Go-To-Market con capital inteligente."
        }
      },
      {
        "x": 323.58,
        "y": 435.38,
        "width": 312.47,
        "fontSize": 15.0,
        "color": "rgb(71,85,105)",
        "fontWeight": 700,
        "fontFamily": "Inter",
        "text": {
          "en": "Join us in uncovering the Behavioral Truth.",
          "es": "Únete a descubrir la verdad conductual."
        }
      },
      {
        "x": 79.04,
        "y": 76.41,
        "width": 300.0,
        "fontSize": 33.0,
        "color": "rgb(30,41,59)",
        "fontWeight": 700,
        "fontFamily": "Urbanist",
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

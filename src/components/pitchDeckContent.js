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

const t = (en, es) => Object.freeze({ en, es });

const RAW_SLIDES = [
  {
    id: 'cover',
    label: t('The Behavioral Truth in B2B Hiring', 'La verdad conductual en la contratación B2B'),
    image: 'page01',
    blocks: [
      {
        variant: 'kicker',
        x: 314,
        y: 336,
        width: 352,
        height: 58,
        content: t('The Behavioral Truth in B2B Hiring', 'La verdad conductual en la contratación B2B'),
      },
      {
        variant: 'subtitle',
        x: 228,
        y: 410,
        width: 504,
        height: 48,
        content: t(
          'Empirical Talent Validation based on Biometrics and Gamification.',
          'Validación empírica de talento basada en biometría y gamificación.',
        ),
      },
    ],
  },
  {
    id: 'problem',
    label: t('Hiring is Broken', 'Contratar está roto'),
    image: 'page02',
    blocks: [
      {
        variant: 'title',
        x: 74,
        y: 42,
        width: 360,
        height: 72,
        content: t('Hiring is Broken', 'Contratar está roto'),
      },
      {
        variant: 'card',
        x: 92,
        y: 235,
        width: 328,
        height: 152,
        title: t('Subjective Bias', 'Sesgo subjetivo'),
        body: t(
          '99% of companies hire based on subjective opinions that fail to predict actual performance.',
          'El 99% de las empresas contrata basándose en opiniones subjetivas que no predicen el desempeño real.',
        ),
      },
      {
        variant: 'card',
        x: 535,
        y: 235,
        width: 338,
        height: 190,
        title: t('The Human-to-Human Gap', 'La brecha humano-a-humano'),
        body: t(
          'Modern hiring is a mechanical “proxy war”: AI-generated resumes are rejected by AI filters, wasting real human talent because soft skills remain invisible until the final, costly interview stages.',
          'La contratación moderna es una “guerra de proxies”: CVs generados por IA son rechazados por filtros de IA, desperdiciando talento humano real porque las habilidades blandas siguen invisibles hasta las etapas finales y costosas de entrevista.',
        ),
      },
    ],
  },
  {
    id: 'solution',
    label: t('Delivering the Truth', 'Entregando la verdad'),
    image: 'page03',
    blocks: [
      {
        variant: 'title',
        x: 74,
        y: 42,
        width: 420,
        height: 72,
        content: t('Delivering the Truth', 'Entregando la verdad'),
      },
      {
        variant: 'card',
        x: 72,
        y: 234,
        width: 235,
        height: 148,
        title: t('1. Immersive', '1. Inmersivo'),
        body: t(
          'Candidates navigate interactive experiences designed to evaluate real behavior under pressure.',
          'Los candidatos navegan experiencias interactivas diseñadas para evaluar conducta real bajo presión.',
        ),
      },
      {
        variant: 'card',
        x: 362,
        y: 234,
        width: 235,
        height: 148,
        title: t('2. Biometric', '2. Biométrico'),
        body: t(
          'We capture micro-gestures and telemetry in real time as users make critical decisions.',
          'Capturamos microgestos y telemetría en tiempo real mientras los usuarios toman decisiones críticas.',
        ),
      },
      {
        variant: 'card',
        x: 652,
        y: 234,
        width: 235,
        height: 148,
        title: t('3. Unbiased', '3. Imparcial'),
        body: t(
          'Empirical analytics on soft skills, stress tolerance, and leadership delivered instantly to HR.',
          'Analítica empírica sobre habilidades blandas, tolerancia al estrés y liderazgo, entregada al instante a RR.HH.',
        ),
      },
    ],
  },
  {
    id: 'differentiator',
    label: t('Edge AI Advantage', 'Ventaja Edge AI'),
    image: 'page04',
    blocks: [
      {
        variant: 'title',
        x: 74,
        y: 42,
        width: 390,
        height: 72,
        content: t('Edge AI Advantage', 'Ventaja Edge AI'),
      },
      {
        variant: 'body',
        x: 520,
        y: 150,
        width: 350,
        height: 265,
        items: [
          {
            title: t('Zero Latency', 'Latencia cero'),
            body: t(
              '60fps inference directly in the browser. No lag, no downloads.',
              'Inferencia a 60 fps directamente en el navegador. Sin lag y sin descargas.',
            ),
          },
          {
            title: t('Privacy by Design', 'Privacidad por diseño'),
            body: t(
              'EU AI Act aligned. Video stays on device; only aggregate tensors are sent.',
              'Alineado con el EU AI Act. El video permanece en el dispositivo; sólo se envían tensores agregados.',
            ),
          },
          {
            title: t('Scalable', 'Escalable'),
            body: t(
              'Leverages the candidate’s hardware, reducing server costs to near zero.',
              'Aprovecha el hardware del candidato, reduciendo los costos de servidor casi a cero.',
            ),
          },
        ],
      },
    ],
  },
  {
    id: 'technology',
    label: t('The Defensive Moat', 'La ventaja defensiva'),
    image: 'page05',
    blocks: [
      {
        variant: 'metric',
        x: 74,
        y: 86,
        width: 435,
        height: 122,
        content: t('Proprietary.', 'Propietario.'),
      },
      {
        variant: 'card',
        x: 584,
        y: 168,
        width: 272,
        height: 248,
        title: t('Behavioral Intelligence', 'Inteligencia conductual'),
        body: t(
          'Our strongest advantage is a continuously self-feeding dataset. We capture real behavioral data that traditional ATS and competitors cannot replicate. Every interaction improves our global prediction standard.',
          'Nuestra ventaja más fuerte es un dataset que se retroalimenta continuamente. Capturamos datos conductuales reales que los ATS tradicionales y competidores no pueden replicar. Cada interacción mejora nuestro estándar global de predicción.',
        ),
      },
      {
        variant: 'title',
        x: 74,
        y: 404,
        width: 360,
        height: 72,
        content: t('The Defensive Moat', 'La ventaja defensiva'),
      },
    ],
  },
  {
    id: 'team',
    label: t('The Core Founders', 'Fundadores clave'),
    image: 'page06',
    blocks: [
      {
        variant: 'title',
        x: 74,
        y: 42,
        width: 390,
        height: 72,
        content: t('The Core Founders', 'Fundadores clave'),
      },
      {
        variant: 'card',
        x: 76,
        y: 232,
        width: 240,
        height: 165,
        title: t('Nicolas Cowley', 'Nicolás Cowley'),
        eyebrow: t('CEO & Commercial Director', 'CEO y Director Comercial'),
        body: t(
          'AI ethics expert. Leading commercial strategy and B2B partnerships.',
          'Experto en ética de IA. Lidera la estrategia comercial y las alianzas B2B.',
        ),
      },
      {
        variant: 'card',
        x: 362,
        y: 232,
        width: 240,
        height: 165,
        title: t('Carlos Saldivia', 'Carlos Saldivia'),
        eyebrow: t('CTO', 'CTO'),
        body: t(
          'MSc in Electronics. Specialist in biometrics and signal processing.',
          'MSc en Electrónica. Especialista en biometría y procesamiento de señales.',
        ),
      },
      {
        variant: 'card',
        x: 648,
        y: 232,
        width: 240,
        height: 165,
        title: t('Gabriel Caro', 'Gabriel Caro'),
        eyebrow: t('CPO', 'CPO'),
        body: t(
          'R&D specialist. Expert in active methodologies and gamification.',
          'Especialista en I+D. Experto en metodologías activas y gamificación.',
        ),
      },
    ],
  },
  {
    id: 'market',
    label: t('Target Market', 'Mercado objetivo'),
    image: 'page07',
    blocks: [
      {
        variant: 'title',
        x: 74,
        y: 42,
        width: 360,
        height: 72,
        content: t('Target Market', 'Mercado objetivo'),
      },
      {
        variant: 'table',
        x: 76,
        y: 156,
        width: 808,
        height: 248,
        columns: [t('Segment', 'Segmento'), t('Estimated Value', 'Valor estimado'), t('Definition', 'Definición')],
        rows: [
          [t('TAM', 'TAM'), t('$32B', '$32B'), t('Global HR Tech and Recruitment Market.', 'Mercado global de HR Tech y reclutamiento.')],
          [t('SAM', 'SAM'), t('$2.5B', '$2.5B'), t('Global critical recruitment sectors (Logistics, Finance).', 'Sectores globales críticos de reclutamiento (logística, finanzas).')],
          [t('SOM', 'SOM'), t('$100M', '$100M'), t('Initial target LatAm market (Aquaculture and Fishing).', 'Mercado inicial objetivo en LatAm (acuicultura y pesca).')],
        ],
      },
    ],
  },
  {
    id: 'business-model',
    label: t('Value Capture Strategy', 'Estrategia de captura de valor'),
    image: 'page08',
    blocks: [
      {
        variant: 'title',
        x: 74,
        y: 42,
        width: 450,
        height: 72,
        content: t('Value Capture Strategy', 'Estrategia de captura de valor'),
      },
      {
        variant: 'metric',
        x: 78,
        y: 130,
        width: 300,
        height: 112,
        content: t('10:1', '10:1'),
      },
      {
        variant: 'card',
        x: 500,
        y: 152,
        width: 350,
        height: 265,
        title: t('Client ROI', 'ROI del cliente'),
        items: [
          {
            title: t('Pricing', 'Precio'),
            body: t(
              'Annual B2B SaaS subscription tiered by assessment volume, priced per candidate.',
              'Suscripción SaaS B2B anual escalonada por volumen de evaluaciones, con precio por candidato.',
            ),
          },
          {
            title: t('Value', 'Valor'),
            body: t(
              'Designed to deliver 10x ROI by reducing bad hires and interview hours.',
              'Diseñado para entregar 10x ROI al reducir malas contrataciones y horas de entrevista.',
            ),
          },
          {
            title: t('Go-To-Market', 'Salida al mercado'),
            body: t(
              'Land & Expand: validate via pilot, roll out to facility, then expand to corporate.',
              'Land & Expand: validar con un piloto, desplegar en planta y luego expandir a nivel corporativo.',
            ),
          },
        ],
      },
    ],
  },
  {
    id: 'competition',
    label: t('Why KRUMM Dominates', 'Por qué KRUMM domina'),
    image: 'page09',
    blocks: [
      {
        variant: 'title',
        x: 74,
        y: 42,
        width: 430,
        height: 72,
        content: t('Why KRUMM Dominates', 'Por qué KRUMM domina'),
      },
      {
        variant: 'table',
        x: 68,
        y: 138,
        width: 824,
        height: 292,
        columns: [t('Criteria', 'Criterio'), t('Traditional ATS', 'ATS tradicional'), t('AI Avatars', 'Avatares IA'), t('KRUMM', 'KRUMM')],
        rows: [
          [t('Nature of Data', 'Naturaleza de datos'), t('Subjective', 'Subjetiva'), t('Declarative', 'Declarativa'), t('Empirical (Biometrics)', 'Empírica (biometría)')],
          [t('Privacy Compliance', 'Cumplimiento de privacidad'), t('Secure', 'Seguro'), t('Cloud Risk', 'Riesgo en la nube'), t('Native (Edge AI)', 'Nativo (Edge AI)')],
          [t('Experience', 'Experiencia'), t('High Friction', 'Alta fricción'), t('Uncomfortable', 'Incómoda'), t('Gamified / Immersive', 'Gamificada / inmersiva')],
          [t('Soft Skills Accuracy', 'Precisión en habilidades blandas'), t('None', 'Nula'), t('Limited', 'Limitada'), t('High Precision', 'Alta precisión')],
        ],
      },
    ],
  },
  {
    id: 'ask',
    label: t('Our Next Milestones', 'Nuestros próximos hitos'),
    image: 'page10',
    blocks: [
      {
        variant: 'title',
        x: 74,
        y: 42,
        width: 450,
        height: 72,
        content: t('Our Next Milestones', 'Nuestros próximos hitos'),
      },
      {
        variant: 'body',
        x: 96,
        y: 150,
        width: 760,
        height: 210,
        items: [
          {
            title: t('Pilot Execution', 'Ejecución del piloto'),
            body: t(
              'Successfully launch our first industrial pilot with Cermaq to validate soft-skill biometric models in a high-stakes environment.',
              'Lanzar con éxito nuestro primer piloto industrial con Cermaq para validar modelos biométricos de habilidades blandas en un entorno de alta exigencia.',
            ),
          },
          {
            title: t('Sector Dominance', 'Dominio sectorial'),
            body: t(
              'Leverage the Cermaq success to secure five additional Tier-1 contracts in the LatAm aquaculture and fishing industry.',
              'Aprovechar el éxito con Cermaq para asegurar cinco contratos Tier-1 adicionales en la industria acuícola y pesquera de LatAm.',
            ),
          },
          {
            title: t('Product Calibration', 'Calibración del producto'),
            body: t(
              'Finalize Edge AI integration to ensure maximum privacy and zero-latency performance for B2B clients.',
              'Finalizar la integración Edge AI para asegurar máxima privacidad y rendimiento de latencia cero para clientes B2B.',
            ),
          },
        ],
      },
      {
        variant: 'subtitle',
        x: 206,
        y: 384,
        width: 548,
        height: 44,
        content: t(
          'Accelerating our Go-To-Market with Smart Capital.',
          'Acelerando nuestra salida al mercado con capital inteligente.',
        ),
      },
      {
        variant: 'small',
        x: 270,
        y: 438,
        width: 420,
        height: 32,
        content: t(
          'Join us in uncovering the Behavioral Truth.',
          'Únete a descubrir la verdad conductual.',
        ),
      },
    ],
  },
];

export const PITCH_DECK_SLIDES = Object.freeze(RAW_SLIDES.map((slide) => Object.freeze({
  ...slide,
  background: PAGE_IMAGES[slide.image],
  blocks: Object.freeze(slide.blocks.map((block) => Object.freeze(block))),
})));

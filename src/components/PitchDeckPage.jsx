import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Brain,
  CircleDollarSign,
  Cpu,
  Database,
  Eye,
  Gamepad2,
  Globe2,
  Lock,
  ShieldCheck,
  Target,
  Users,
  Zap,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  Scale,
  MousePointer2,
  CheckCircle2,
  Clock,
  LineChart,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.jpg';
import './PitchDeckPage.css';

const coreCards = [
  {
    icon: Target,
    title: {
      es: 'Problema estructural en contratación',
      en: 'Structural hiring problem'
    },
    text: {
      es: 'La selección tradicional sigue dependiendo de señales subjetivas y entrevistas extensas con baja capacidad predictiva.',
      en: 'Traditional selection still depends on subjective signals and long interviews with weak predictive power.'
    }
  },
  {
    icon: Brain,
    title: {
      es: 'Tesis de KRUMM',
      en: 'KRUMM thesis'
    },
    text: {
      es: 'Medimos conducta observable en un entorno gamificado para estimar desempeño real en contexto laboral.',
      en: 'We measure observable behavior in a gamified environment to estimate real performance in work contexts.'
    }
  },
  {
    icon: CircleDollarSign,
    title: {
      es: 'Impacto económico',
      en: 'Economic impact'
    },
    text: {
      es: 'Atacamos ineficiencias multimillonarias del mercado HR Tech con decisiones más rápidas y basadas en evidencia.',
      en: 'We target multi-billion HR Tech inefficiencies with faster, evidence-based decisions.'
    }
  }
];

const processSteps = [
  {
    number: '01',
    icon: Gamepad2,
    title: {
      es: 'Experiencia inmersiva',
      en: 'Immersive experience'
    },
    text: {
      es: 'El candidato avanza por retos breves diseñados para activar habilidades cognitivas clave.',
      en: 'Candidates progress through short challenges designed to activate key cognitive skills.'
    }
  },
  {
    number: '02',
    icon: Eye,
    title: {
      es: 'Telemetría conductual',
      en: 'Behavioral telemetry'
    },
    text: {
      es: 'Registramos decisiones, tiempos de respuesta y consistencia sin invadir datos sensibles.',
      en: 'We capture decisions, response times, and consistency without invading sensitive data.'
    }
  },
  {
    number: '03',
    icon: BarChart3,
    title: {
      es: 'Reporte accionable',
      en: 'Actionable report'
    },
    text: {
      es: 'Entregamos señales claras para selección, desarrollo y movilidad interna.',
      en: 'We deliver clear signals for selection, development, and internal mobility.'
    }
  }
];

const edgeBenefits = [
  {
    icon: Zap,
    title: {
      es: 'Baja latencia',
      en: 'Low latency'
    },
    text: {
      es: 'Inferencia local para experiencia fluida durante toda la batería.',
      en: 'Local inference for a smooth experience across the full battery.'
    }
  },
  {
    icon: ShieldCheck,
    title: {
      es: 'Privacidad por diseño',
      en: 'Privacy by design'
    },
    text: {
      es: 'Datos sensibles permanecen en el dispositivo; solo viajan señales derivadas.',
      en: 'Sensitive data stays on-device; only derived signals travel.'
    }
  },
  {
    icon: Cpu,
    title: {
      es: 'Escalabilidad operativa',
      en: 'Operational scalability'
    },
    text: {
      es: 'Modelo eficiente que minimiza costos de infraestructura central.',
      en: 'Efficient model that minimizes central infrastructure costs.'
    }
  }
];

const moatItems = [
  {
    icon: Database,
    title: {
      es: 'Dataset propietario vivo',
      en: 'Living proprietary dataset'
    },
    text: {
      es: 'Cada evaluación retroalimenta la calibración del modelo y mejora su robustez.',
      en: 'Every assessment feeds back into model calibration and improves robustness.'
    }
  },
  {
    icon: Lock,
    title: {
      es: 'Barrera de entrada',
      en: 'Entry barrier'
    },
    text: {
      es: 'La señal conductual contextualizada es difícil de replicar por soluciones tradicionales.',
      en: 'Contextual behavioral signal is hard to replicate by traditional solutions.'
    }
  }
];

const marketRows = [
  {
    label: { es: 'TAM', en: 'TAM' },
    value: '$32B',
    icon: Globe2,
    text: {
      es: 'Mercado global de HR Tech.',
      en: 'Global HR Tech market.'
    }
  },
  {
    label: { es: 'SAM', en: 'SAM' },
    value: '$2.5B',
    icon: Activity,
    text: {
      es: 'Segmentos de reclutamiento crítico a escala global.',
      en: 'Critical recruitment segments at global scale.'
    }
  },
  {
    label: { es: 'SOM', en: 'SOM' },
    value: '$100M',
    icon: Target,
    text: {
      es: 'Objetivo inicial LatAm en industrias de alta rotación.',
      en: 'Initial LatAm target in high-turnover industries.'
    }
  }
];

const comparisonRows = [
  {
    metric: { es: 'Tipo de señal', en: 'Signal type' },
    icon: Activity,
    ats: { es: '❌ Subjetiva', en: '❌ Subjective' },
    avatars: { es: '⚠️ Declarativa', en: '⚠️ Declarative' },
    krumm: { es: '✅ Empírica', en: '✅ Empirical' }
  },
  {
    metric: { es: 'Privacidad', en: 'Privacy' },
    icon: ShieldCheck,
    ats: { es: '⚠️ Media', en: '⚠️ Medium' },
    avatars: { es: '❌ Riesgo cloud', en: '❌ Cloud risk' },
    krumm: { es: '✅ Edge-first', en: '✅ Edge-first' }
  },
  {
    metric: { es: 'Experiencia candidato', en: 'Candidate experience' },
    icon: Gamepad2,
    ats: { es: '❌ Fricción alta', en: '❌ High friction' },
    avatars: { es: '⚠️ Incómoda', en: '⚠️ Uncomfortable' },
    krumm: { es: '✅ Inmersiva', en: '✅ Immersive' }
  },
  {
    metric: { es: 'Valor para decisión', en: 'Decision value' },
    icon: TrendingUp,
    ats: { es: '⚠️ Limitado', en: '⚠️ Limited' },
    avatars: { es: '⚠️ Parcial', en: '⚠️ Partial' },
    krumm: { es: '✅ Accionable', en: '✅ Actionable' }
  }
];

const teamMembers = [
  {
    name: 'Nicolás Cowley',
    role: {
      es: 'CEO y Dirección Comercial',
      en: 'CEO and Commercial Director'
    },
    text: {
      es: 'Lidera estrategia comercial, compliance y alianzas corporativas B2B.',
      en: 'Leads commercial strategy, compliance, and B2B corporate partnerships.'
    }
  },
  {
    name: 'Carlos Saldivia',
    role: {
      es: 'CTO',
      en: 'CTO'
    },
    text: {
      es: 'Especialista en biometría, procesamiento de señales y arquitectura técnica de producto.',
      en: 'Specialist in biometrics, signal processing, and product technical architecture.'
    }
  },
  {
    name: 'Gabriel Caro',
    role: {
      es: 'CPO',
      en: 'CPO'
    },
    text: {
      es: 'Conduce investigación aplicada, diseño de experiencia y enfoque gamificado de evaluación.',
      en: 'Leads applied research, experience design, and gamified assessment approach.'
    }
  }
];

const pageCopy = {
  es: {
    heroTitle: 'La verdad conductual para decisiones de talento B2B',
    heroText:
      'Esta vista resume la tesis de producto, tracción esperada y modelo de captura de valor de KRUMM para reclutamiento y desarrollo.',
    sectionProblem: 'Problema y propuesta',
    sectionProcess: 'Cómo funciona',
    sectionEdge: 'Ventaja Edge AI',
    sectionMoat: 'Foso defensivo',
    sectionMarket: 'Mercado objetivo',
    sectionComparison: 'Comparativa estratégica',
    sectionTeam: 'Equipo core',
    roiTitle: 'Modelo de captura de valor',
    roiText: 'Por cada $10 de ahorro generado al cliente, KRUMM captura aproximadamente $1 vía SaaS B2B.',
    sectionMilestone: 'Próximo hito',
    milestoneText: 'Buscamos smart capital para acelerar go-to-market, calibración final y expansión comercial.',
    milestoneArr: 'Meta a 36 meses: $10M+ ARR'
  },
  en: {
    heroTitle: 'Behavioral truth for B2B talent decisions',
    heroText:
      'This view summarizes KRUMM\'s product thesis, expected traction, and value-capture model for hiring and talent development.',
    sectionProblem: 'Problem and thesis',
    sectionProcess: 'How it works',
    sectionEdge: 'Edge AI advantage',
    sectionMoat: 'Defensive moat',
    sectionMarket: 'Target market',
    sectionComparison: 'Strategic comparison',
    sectionTeam: 'Core team',
    roiTitle: 'Value capture model',
    roiText: 'For every $10 in customer savings, KRUMM captures roughly $1 through its B2B SaaS model.',
    sectionMilestone: 'Next milestone',
    milestoneText: 'We are looking for smart capital to accelerate go-to-market, final calibration, and commercial scale.',
    milestoneArr: '36-month target: $10M+ ARR'
  }
};

function PitchDeckPage() {
  // Mostrar la versión estática del pitch deck proporcionada en /public/pitchdeck.html
  useEffect(() => {
    document.title = 'KRUMM | Pitch Deck';
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <iframe
        src="/pitchdeck.html"
        title="KRUMM Pitch Deck"
        style={{ border: '0', width: '100%', height: '100%' }}
      />
    </div>
  );
}

export default PitchDeckPage;

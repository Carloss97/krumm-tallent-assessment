import { useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/logo.jpg';
import './PitchDeckPage.css';

const coreCards = [
  {
    icon: Target,
    title: {
      es: 'Problema estructural en contratacion',
      en: 'Structural hiring problem'
    },
    text: {
      es: 'La seleccion tradicional sigue dependiendo de senales subjetivas y entrevistas extensas con baja capacidad predictiva.',
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
      es: 'Medimos conducta observable en un entorno gamificado para estimar desempeno real en contexto laboral.',
      en: 'We measure observable behavior in a gamified environment to estimate real performance in work contexts.'
    }
  },
  {
    icon: CircleDollarSign,
    title: {
      es: 'Impacto economico',
      en: 'Economic impact'
    },
    text: {
      es: 'Atacamos ineficiencias multimillonarias del mercado HR Tech con decisiones mas rapidas y basadas en evidencia.',
      en: 'We target multi-billion HR Tech inefficiencies with faster, evidence-based decisions.'
    }
  }
];

const processSteps = [
  {
    icon: Gamepad2,
    title: {
      es: 'Experiencia inmersiva',
      en: 'Immersive experience'
    },
    text: {
      es: 'El candidato avanza por retos breves disenados para activar habilidades cognitivas clave.',
      en: 'Candidates progress through short challenges designed to activate key cognitive skills.'
    }
  },
  {
    icon: Eye,
    title: {
      es: 'Telemetria conductual',
      en: 'Behavioral telemetry'
    },
    text: {
      es: 'Registramos decisiones, tiempos de respuesta y consistencia sin invadir datos sensibles.',
      en: 'We capture decisions, response times, and consistency without invading sensitive data.'
    }
  },
  {
    icon: BarChart3,
    title: {
      es: 'Reporte accionable',
      en: 'Actionable report'
    },
    text: {
      es: 'Entregamos senales claras para seleccion, desarrollo y movilidad interna.',
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
      es: 'Inferencia local para experiencia fluida durante toda la bateria.',
      en: 'Local inference for a smooth experience across the full battery.'
    }
  },
  {
    icon: ShieldCheck,
    title: {
      es: 'Privacidad por diseno',
      en: 'Privacy by design'
    },
    text: {
      es: 'Datos sensibles permanecen en el dispositivo; solo viajan senales derivadas.',
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
      es: 'Cada evaluacion retroalimenta la calibracion del modelo y mejora su robustez.',
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
      es: 'La senal conductual contextualizada es dificil de replicar por soluciones tradicionales.',
      en: 'Contextual behavioral signal is hard to replicate by traditional solutions.'
    }
  }
];

const marketRows = [
  {
    label: { es: 'TAM', en: 'TAM' },
    value: '$32B',
    text: {
      es: 'Mercado global de HR Tech.',
      en: 'Global HR Tech market.'
    }
  },
  {
    label: { es: 'SAM', en: 'SAM' },
    value: '$2.5B',
    text: {
      es: 'Segmentos de reclutamiento critico a escala global.',
      en: 'Critical recruitment segments at global scale.'
    }
  },
  {
    label: { es: 'SOM', en: 'SOM' },
    value: '$100M',
    text: {
      es: 'Objetivo inicial LatAm en industrias de alta rotacion.',
      en: 'Initial LatAm target in high-turnover industries.'
    }
  }
];

const comparisonRows = [
  {
    metric: { es: 'Tipo de senal', en: 'Signal type' },
    ats: { es: 'Subjetiva', en: 'Subjective' },
    avatars: { es: 'Declarativa', en: 'Declarative' },
    krumm: { es: 'Empirica', en: 'Empirical' }
  },
  {
    metric: { es: 'Privacidad', en: 'Privacy' },
    ats: { es: 'Media', en: 'Medium' },
    avatars: { es: 'Riesgo cloud', en: 'Cloud risk' },
    krumm: { es: 'Edge-first', en: 'Edge-first' }
  },
  {
    metric: { es: 'Experiencia candidato', en: 'Candidate experience' },
    ats: { es: 'Friccion alta', en: 'High friction' },
    avatars: { es: 'Incomoda', en: 'Uncomfortable' },
    krumm: { es: 'Inmersiva', en: 'Immersive' }
  },
  {
    metric: { es: 'Valor para decision', en: 'Decision value' },
    ats: { es: 'Limitado', en: 'Limited' },
    avatars: { es: 'Parcial', en: 'Partial' },
    krumm: { es: 'Accionable', en: 'Actionable' }
  }
];

const teamMembers = [
  {
    name: 'Nicolas Cowley',
    role: {
      es: 'CEO y Direccion Comercial',
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
      es: 'Especialista en biometria, procesamiento de senales y arquitectura tecnica de producto.',
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
      es: 'Conduce investigacion aplicada, diseno de experiencia y enfoque gamificado de evaluacion.',
      en: 'Leads applied research, experience design, and gamified assessment approach.'
    }
  }
];

const pageCopy = {
  es: {
    heroTitle: 'La verdad conductual para decisiones de talento B2B',
    heroText:
      'Esta vista resume la tesis de producto, traccion esperada y modelo de captura de valor de KRUMM para reclutamiento y desarrollo.',
    sectionProblem: 'Problema y propuesta',
    sectionProcess: 'Como funciona',
    sectionEdge: 'Ventaja Edge AI',
    sectionMoat: 'Foso defensivo',
    sectionMarket: 'Mercado objetivo',
    sectionComparison: 'Comparativa estrategica',
    sectionTeam: 'Equipo core',
    roiTitle: 'Modelo de captura de valor',
    roiText: 'Por cada $10 de ahorro generado al cliente, KRUMM captura aproximadamente $1 via SaaS B2B.',
    sectionMilestone: 'Proximo hito',
    milestoneText: 'Buscamos smart capital para acelerar go-to-market, calibracion final y expansion comercial.',
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
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const t = pageCopy[language] || pageCopy.es;
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    document.title = language === 'en' ? 'KRUMM | Pitch Presentation' : 'KRUMM | Presentacion';
  }, [language]);

  const slides = [
    {
      type: 'hero',
      render: () => (
        <div className="pitch-slide-hero">
          <aside className="pitch-logo-card-hero" aria-label="KRUMM brand">
            <img src={logo} alt="KRUMM" />
            <h2>KRUMM</h2>
            <p>Behavioral Intelligence</p>
          </aside>
          <article className="pitch-hero-content">
            <h1>{t.heroTitle}</h1>
            <p>{t.heroText}</p>
            <div className="pitch-slide-footer-text">
              {language === 'es' ? 'Desliza para comenzar ->' : 'Swipe to begin ->'}
            </div>
          </article>
        </div>
      )
    },
    {
      type: 'cards',
      title: t.sectionProblem,
      cards: coreCards,
      columns: 3
    },
    {
      type: 'cards',
      title: t.sectionProcess,
      cards: processSteps,
      columns: 3,
      variant: 'process'
    },
    {
      type: 'cards',
      title: t.sectionEdge,
      cards: edgeBenefits,
      columns: 3,
      variant: 'dark'
    },
    {
      type: 'cards',
      title: t.sectionMoat,
      cards: moatItems,
      columns: 2
    },
    {
      type: 'market',
      title: t.sectionMarket,
      data: marketRows
    },
    {
      type: 'comparison',
      title: t.sectionComparison,
      data: comparisonRows
    },
    {
      type: 'cards',
      title: t.sectionTeam,
      cards: teamMembers.map((member) => ({
        icon: Users,
        title: { es: member.name, en: member.name },
        text: member.text,
        role: member.role
      })),
      columns: 3,
      variant: 'team'
    },
    {
      type: 'milestone',
      title: t.roiTitle,
      subtitle: t.sectionMilestone,
      text: t.roiText,
      cta: t.milestoneArr,
      milestoneText: t.milestoneText
    }
  ];

  const goNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const goPrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') navigate('/');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, navigate]);

  const slide = slides[currentSlide];

  return (
    <div className="pitch-presentation">
      <header className="pitch-pres-header">
        <button type="button" className="pitch-exit" onClick={() => navigate('/')} title="Exit (Esc)">
          <ArrowLeft size={20} />
        </button>

        <div className="pitch-lang-toggle" role="group" aria-label="Language">
          <button
            type="button"
            className={language === 'es' ? 'active' : ''}
            onClick={() => setLanguage('es')}
          >
            ES
          </button>
          <button
            type="button"
            className={language === 'en' ? 'active' : ''}
            onClick={() => setLanguage('en')}
          >
            EN
          </button>
        </div>
      </header>

      <main className="pitch-pres-main">
        <div className={`pitch-slide ${slide.variant || ''}`} key={currentSlide}>
          {slide.type === 'hero' && slide.render()}

          {slide.type === 'cards' && (
            <>
              <h2>{slide.title}</h2>
              <div className={`pitch-card-grid pitch-grid-${slide.columns}`}>
                {slide.cards.map((card, idx) => {
                  const Icon = card.icon;
                  const role = slide.variant === 'team' ? card.role : null;
                  return (
                    <article key={idx} className={`pitch-card ${slide.variant || ''}`}>
                      <Icon size={24} aria-hidden="true" />
                      <h3>{card.title[language]}</h3>
                      {role && <p className="pitch-role">{role[language]}</p>}
                      <p>{card.text[language]}</p>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {slide.type === 'market' && (
            <>
              <h2>{slide.title}</h2>
              <div className="pitch-market-grid-slide">
                {slide.data.map((row, idx) => (
                  <article key={idx} className="pitch-market-card-slide">
                    <span>{row.label[language]}</span>
                    <strong>{row.value}</strong>
                    <p>{row.text[language]}</p>
                  </article>
                ))}
              </div>
            </>
          )}

          {slide.type === 'comparison' && (
            <>
              <h2>{slide.title}</h2>
              <div className="pitch-table-slide">
                <table>
                  <thead>
                    <tr>
                      <th>{language === 'es' ? 'Criterio' : 'Criteria'}</th>
                      <th>ATS</th>
                      <th>{language === 'es' ? 'IA Avatares' : 'AI Avatars'}</th>
                      <th>KRUMM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slide.data.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.metric[language]}</td>
                        <td>{row.ats[language]}</td>
                        <td>{row.avatars[language]}</td>
                        <td className="pitch-td-highlight">{row.krumm[language]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {slide.type === 'milestone' && (
            <div className="pitch-milestone-slide">
              <div className="pitch-milestone-content">
                <h2>{slide.title}</h2>
                <p>{slide.text}</p>
                <p className="pitch-milestone-emphasis">{slide.milestoneText}</p>
                <div className="pitch-milestone-arr">
                  <Globe2 size={32} />
                  <div>
                    <p>{slide.cta}</p>
                    <strong>$10M+</strong>
                    <span>ARR</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="pitch-pres-footer">
        <div className="pitch-footer-left">
          <span className="pitch-slide-counter">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>

        <div className="pitch-footer-center">
          {language === 'es' ? 'Usa flechas o botones para navegar' : 'Use arrows or buttons to navigate'}
        </div>

        <div className="pitch-footer-right">
          <button
            type="button"
            className="pitch-nav-btn"
            onClick={goPrev}
            disabled={currentSlide === 0}
            title={language === 'es' ? 'Anterior (←)' : 'Previous (←)'}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="pitch-nav-btn"
            onClick={goNext}
            disabled={currentSlide === slides.length - 1}
            title={language === 'es' ? 'Siguiente (→)' : 'Next (→)'}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}

export default PitchDeckPage;

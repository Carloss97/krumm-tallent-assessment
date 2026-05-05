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
  CheckCircle2
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
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const t = pageCopy[language] || pageCopy.es;
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    document.title = language === 'en' ? 'KRUMM | Pitch Presentation' : 'KRUMM | Presentación';
  }, [language]);

  const slides = [
    {
      type: 'hero',
      render: () => (
        <div className="pitch-slide-hero">
          <aside className="pitch-logo-card-hero" aria-label="KRUMM brand">
            <motion.img 
              src={logo} 
              alt="KRUMM"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >KRUMM</motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >Behavioral Intelligence</motion.p>
          </aside>
          <article className="pitch-hero-content">
            <motion.h1 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {t.heroTitle}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {t.heroText}
            </motion.p>
            <motion.div 
              className="pitch-slide-footer-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1 }}
            >
              {language === 'es' ? 'Desliza para comenzar ->' : 'Swipe to begin ->'}
            </motion.div>
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

  const goNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  }, [currentSlide, slides.length]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  }, [currentSlide]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') navigate('/');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, navigate, goNext, goPrev]);

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
        <AnimatePresence mode="wait">
          <motion.div 
            className={`pitch-slide ${slide.variant || ''}`} 
            key={currentSlide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {slide.type === 'hero' && slide.render()}

            {slide.type === 'cards' && (
              <>
                <motion.h2 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >{slide.title}</motion.h2>
                <div className={`pitch-card-grid pitch-grid-${slide.columns}`}>
                  {slide.cards.map((card, idx) => {
                    const Icon = card.icon;
                    const role = slide.variant === 'team' ? card.role : null;
                    return (
                      <motion.article 
                        key={idx} 
                        className={`pitch-card ${slide.variant || ''}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <div className="pitch-card-icon">
                          <Icon size={32} strokeWidth={2.5} />
                        </div>
                        <h3>{card.title[language]}</h3>
                        {role && <p className="pitch-role">{role[language]}</p>}
                        <p>{card.text[language]}</p>
                      </motion.article>
                    );
                  })}
                </div>
              </>
            )}

            {slide.type === 'market' && (
              <>
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{slide.title}</motion.h2>
                <div className="pitch-market-slide-layout">
                  <div className="pitch-market-diagram" aria-hidden="true">
                    <div className="pitch-circle pitch-circle-tam">
                      <span>TAM</span>
                      <strong>{slide.data[0]?.value}</strong>
                    </div>
                    <div className="pitch-circle pitch-circle-sam">
                      <span>SAM</span>
                      <strong>{slide.data[1]?.value}</strong>
                    </div>
                    <div className="pitch-circle pitch-circle-som">
                      <span>SOM</span>
                      <strong>{slide.data[2]?.value}</strong>
                    </div>
                    <div className="pitch-market-diagram-label">
                      <TrendingUp size={16} />
                      <span>{language === 'es' ? 'Mercado por capas' : 'Layered market view'}</span>
                    </div>
                  </div>

                  <div className="pitch-market-copy">
                    <p className="pitch-market-lead">
                      {language === 'es'
                        ? 'Lectura visual del mercado objetivo para mostrar alcance, foco y aterrizaje comercial.'
                        : 'Visual market reading to show reach, focus, and commercial landing zone.'}
                    </p>
                    <div className="pitch-market-stack">
                      {slide.data.map((row, idx) => {
                        const Icon = row.icon;
                        const toneClass = idx === 0 ? 'tone-blue' : idx === 1 ? 'tone-indigo' : 'tone-emerald';
                        return (
                          <motion.article 
                            key={idx} 
                            className={`pitch-market-card-slide pitch-market-card-compact ${toneClass}`}
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.12 }}
                          >
                            <div className="pitch-market-card-top">
                              <div className="pitch-market-card-icon">
                                <Icon size={22} />
                              </div>
                              <span>{row.label[language]}</span>
                            </div>
                            <strong>{row.value}</strong>
                            <p>{row.text[language]}</p>
                          </motion.article>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {slide.type === 'comparison' && (
              <>
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{slide.title}</motion.h2>
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
                      {slide.data.map((row, idx) => {
                        const Icon = row.icon;
                        return (
                          <motion.tr 
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <td className="pitch-metric-cell">
                              <Icon size={20} style={{ marginRight: '12px', opacity: 0.8, color: '#60a5fa' }} />
                              {row.metric[language]}
                            </td>
                            <td>{row.ats[language]}</td>
                            <td>{row.avatars[language]}</td>
                            <td className="pitch-td-highlight">
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                              >
                                {row.krumm[language]}
                              </motion.span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '32px', display: 'flex', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                    <Gamepad2 size={16} /> <span>Inmersivo</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                    <ShieldCheck size={16} /> <span>Privacidad Edge</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                    <TrendingUp size={16} /> <span>Datos Empíricos</span>
                  </div>
                </div>
              </>
            )}

            {slide.type === 'milestone' && (
              <div className="pitch-milestone-slide">
                <motion.div 
                  className="pitch-milestone-content"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Layers size={56} style={{ color: '#60a5fa', marginBottom: '24px' }} />
                  <h2>{slide.title}</h2>
                  <p>{slide.text}</p>
                  
                  <div style={{ margin: '40px 0', display: 'flex', justifyContent: 'center', gap: '48px' }}>
                    <div className="milestone-stat">
                      <Scale size={32} color="#60a5fa" />
                      <strong style={{ fontSize: '2.5rem', display: 'block' }}>10:1</strong>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>ROI Savings</span>
                    </div>
                    <div className="milestone-stat">
                      <TrendingUp size={32} color="#60a5fa" />
                      <strong style={{ fontSize: '2.5rem', display: 'block' }}>$10M+</strong>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>ARR Target</span>
                    </div>
                  </div>

                  <p className="pitch-milestone-emphasis">{slide.milestoneText}</p>
                  <div className="pitch-milestone-arr" style={{ marginTop: '32px' }}>
                    <Globe2 size={32} />
                    <div>
                      <p>{slide.cta}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="pitch-pres-footer">
        <div className="pitch-footer-left">
          <span className="pitch-slide-counter">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>

        <div className="pitch-footer-center">
          {language === 'es' ? 'Usa flechas del teclado o los botones para navegar' : 'Use keyboard arrows or buttons to navigate'}
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

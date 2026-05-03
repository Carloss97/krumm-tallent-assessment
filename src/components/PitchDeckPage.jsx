import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
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
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
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
      es: 'Datos sensibles permanecen en el dispositivo; sólo viajan señales derivadas.',
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
    text: {
      es: 'Mercado global de HR Tech.',
      en: 'Global HR Tech market.'
    }
  },
  {
    label: { es: 'SAM', en: 'SAM' },
    value: '$2.5B',
    text: {
      es: 'Segmentos de reclutamiento crítico a escala global.',
      en: 'Critical recruitment segments at global scale.'
    }
  },
  {
    label: { es: 'SOM', en: 'SOM' },
    value: '$100M',
    text: {
      es: 'Objetivo inicial LatAm en industrias de alta rotación.',
      en: 'Initial LatAm target in high-turnover industries.'
    }
  }
];

const comparisonRows = [
  {
    metric: { es: 'Tipo de señal', en: 'Signal type' },
    ats: { es: 'Subjetiva', en: 'Subjective' },
    avatars: { es: 'Declarativa', en: 'Declarative' },
    krumm: { es: 'Empírica', en: 'Empirical' }
  },
  {
    metric: { es: 'Privacidad', en: 'Privacy' },
    ats: { es: 'Media', en: 'Medium' },
    avatars: { es: 'Riesgo cloud', en: 'Cloud risk' },
    krumm: { es: 'Edge-first', en: 'Edge-first' }
  },
  {
    metric: { es: 'Experiencia candidato', en: 'Candidate experience' },
    ats: { es: 'Fricción alta', en: 'High friction' },
    avatars: { es: 'Incómoda', en: 'Uncomfortable' },
    krumm: { es: 'Inmersiva', en: 'Immersive' }
  },
  {
    metric: { es: 'Valor para decisión', en: 'Decision value' },
    ats: { es: 'Limitado', en: 'Limited' },
    avatars: { es: 'Parcial', en: 'Partial' },
    krumm: { es: 'Accionable', en: 'Actionable' }
  }
];

const teamMembers = [
  {
    name: 'Nicolas Cowley',
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
    badge: 'Pitch Deck KRUMM',
    heroTitle: 'La verdad conductual para decisiones de talento B2B',
    heroText:
      'Esta vista resume la tesis de producto, tracción esperada y modelo de captura de valor de KRUMM para reclutamiento y desarrollo.',
    back: 'Volver al inicio',
    cta: 'Iniciar demo',
    sectionProblem: 'Problema y propuesta',
    sectionProcess: 'Cómo funciona',
    sectionEdge: 'Ventaja Edge AI',
    sectionMoat: 'Foso defensivo',
    sectionMarket: 'Mercado objetivo',
    sectionComparison: 'Comparativa estratégica',
    sectionTeam: 'Equipo core',
    sectionMilestone: 'Próximo hito',
    roiTitle: 'Modelo de captura de valor',
    roiText: 'Por cada $10 de ahorro generado al cliente, KRUMM captura aproximadamente $1 vía SaaS B2B.',
    milestoneText: 'Buscamos smart capital para acelerar go-to-market, calibración final y expansión comercial.',
    milestoneArr: 'Meta a 36 meses: $10M+ ARR'
  },
  en: {
    badge: 'KRUMM Pitch Deck',
    heroTitle: 'Behavioral truth for B2B talent decisions',
    heroText:
      'This view summarizes KRUMM\'s product thesis, expected traction, and value-capture model for hiring and talent development.',
    back: 'Back to home',
    cta: 'Start demo',
    sectionProblem: 'Problem and thesis',
    sectionProcess: 'How it works',
    sectionEdge: 'Edge AI advantage',
    sectionMoat: 'Defensive moat',
    sectionMarket: 'Target market',
    sectionComparison: 'Strategic comparison',
    sectionTeam: 'Core team',
    sectionMilestone: 'Next milestone',
    roiTitle: 'Value capture model',
    roiText: 'For every $10 in customer savings, KRUMM captures roughly $1 through its B2B SaaS model.',
    milestoneText: 'We are looking for smart capital to accelerate go-to-market, final calibration, and commercial scale.',
    milestoneArr: '36-month target: $10M+ ARR'
  }
};

function PitchDeckPage() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const t = pageCopy[language] || pageCopy.es;

  useEffect(() => {
    document.title = language === 'en' ? 'KRUMM | Pitch Deck' : 'KRUMM | Pitch';
  }, [language]);

  const sections = useMemo(
    () => [
      { id: 'pitch-problem', label: t.sectionProblem },
      { id: 'pitch-process', label: t.sectionProcess },
      { id: 'pitch-edge', label: t.sectionEdge },
      { id: 'pitch-moat', label: t.sectionMoat },
      { id: 'pitch-market', label: t.sectionMarket },
      { id: 'pitch-compare', label: t.sectionComparison },
      { id: 'pitch-team', label: t.sectionTeam },
      { id: 'pitch-milestone', label: t.sectionMilestone }
    ],
    [t]
  );

  const goToSection = (id) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="pitch-page">
      <header className="pitch-hero">
        <div className="pitch-noise" aria-hidden="true" />
        <div className="pitch-hero-content">
          <div className="pitch-topbar">
            <button type="button" className="pitch-outline" onClick={() => navigate('/')}>
              <ArrowLeft size={16} aria-hidden="true" />
              <span>{t.back}</span>
            </button>

            <div className="pitch-lang" role="group" aria-label="Language selector">
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
          </div>

          <div className="pitch-hero-grid">
            <article>
              <span className="pitch-badge">{t.badge}</span>
              <h1>{t.heroTitle}</h1>
              <p>{t.heroText}</p>
              <div className="pitch-hero-actions">
                <button type="button" className="pitch-solid" onClick={() => navigate('/demo')}>
                  <span>{t.cta}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                <button type="button" className="pitch-outline" onClick={() => goToSection('pitch-problem')}>
                  <span>{language === 'es' ? 'Explorar resumen' : 'Explore summary'}</span>
                </button>
              </div>
            </article>

            <aside className="pitch-logo-card" aria-label="KRUMM brand block">
              <img src={logo} alt="KRUMM" />
              <div>
                <h2>KRUMM</h2>
                <p>{language === 'es' ? 'Behavioral Intelligence Platform' : 'Behavioral Intelligence Platform'}</p>
              </div>
            </aside>
          </div>
        </div>
      </header>

      <nav className="pitch-sections" aria-label="Pitch sections">
        {sections.map((section) => (
          <button key={section.id} type="button" onClick={() => goToSection(section.id)}>
            {section.label}
          </button>
        ))}
      </nav>

      <main className="pitch-main">
        <section id="pitch-problem" className="pitch-block">
          <h2>{t.sectionProblem}</h2>
          <div className="pitch-card-grid pitch-card-grid-3">
            {coreCards.map((card) => (
              <article key={card.title.es} className="pitch-card">
                <card.icon size={20} aria-hidden="true" />
                <h3>{card.title[language]}</h3>
                <p>{card.text[language]}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pitch-process" className="pitch-block">
          <h2>{t.sectionProcess}</h2>
          <div className="pitch-card-grid pitch-card-grid-3">
            {processSteps.map((step) => (
              <article key={step.title.es} className="pitch-card pitch-card-process">
                <step.icon size={20} aria-hidden="true" />
                <h3>{step.title[language]}</h3>
                <p>{step.text[language]}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pitch-edge" className="pitch-block pitch-block-dark">
          <h2>{t.sectionEdge}</h2>
          <div className="pitch-card-grid pitch-card-grid-3">
            {edgeBenefits.map((item) => (
              <article key={item.title.es} className="pitch-card pitch-card-dark">
                <item.icon size={20} aria-hidden="true" />
                <h3>{item.title[language]}</h3>
                <p>{item.text[language]}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pitch-moat" className="pitch-block">
          <h2>{t.sectionMoat}</h2>
          <div className="pitch-card-grid pitch-card-grid-2">
            {moatItems.map((item) => (
              <article key={item.title.es} className="pitch-card">
                <item.icon size={20} aria-hidden="true" />
                <h3>{item.title[language]}</h3>
                <p>{item.text[language]}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pitch-market" className="pitch-block">
          <h2>{t.sectionMarket}</h2>
          <div className="pitch-market-grid">
            {marketRows.map((row) => (
              <article key={row.label.es} className="pitch-market-card">
                <span>{row.label[language]}</span>
                <strong>{row.value}</strong>
                <p>{row.text[language]}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pitch-compare" className="pitch-block">
          <h2>{t.sectionComparison}</h2>
          <div className="pitch-table-wrap" role="region" aria-label="Competitive comparison">
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
                {comparisonRows.map((row) => (
                  <tr key={row.metric.es}>
                    <td>{row.metric[language]}</td>
                    <td>{row.ats[language]}</td>
                    <td>{row.avatars[language]}</td>
                    <td className="pitch-td-krumm">{row.krumm[language]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="pitch-team" className="pitch-block">
          <h2>{t.sectionTeam}</h2>
          <div className="pitch-card-grid pitch-card-grid-3">
            {teamMembers.map((member) => (
              <article key={member.name} className="pitch-card">
                <Users size={20} aria-hidden="true" />
                <h3>{member.name}</h3>
                <p className="pitch-role">{member.role[language]}</p>
                <p>{member.text[language]}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pitch-milestone" className="pitch-block pitch-highlight">
          <div className="pitch-highlight-grid">
            <article>
              <h2>{t.roiTitle}</h2>
              <p>{t.roiText}</p>
              <p>{t.milestoneText}</p>
            </article>
            <aside>
              <Globe2 size={20} aria-hidden="true" />
              <p>{t.milestoneArr}</p>
              <strong>$10M+</strong>
              <span>ARR</span>
              <TrendingUp size={18} aria-hidden="true" />
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PitchDeckPage;

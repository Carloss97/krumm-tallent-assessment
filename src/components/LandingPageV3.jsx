import { useMemo, useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  Globe,
  LineChart,
  Lock,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCog,
  Users,
  Zap
} from 'lucide-react';
import { useTelemetry } from '../TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
import { authenticateParticipant } from '../services/backendService';
import { GAME_FLOW, DEMO_GAME_IDS } from '../utils/gameFlow';
import { getLocalizedGameInstruction } from '../utils/gameFlowI18n';
import { getQaMode } from '../utils/qaMode';
import logo from '../assets/logo.jpg';
import './LandingPageV3.css';
import TestAccessModal from './TestAccessModal';
import HeroDemo from './HeroDemo';

const capabilityAreas = [
  {
    icon: Brain,
    title: {
      es: 'Capacidad atencional y control inhibitorio',
      en: 'Attentional capacity and inhibitory control'
    },
    detail: {
      es: 'Medimos foco sostenido, respuesta a distractores y control de impulsos bajo carga temporal.',
      en: 'We measure sustained focus, distractor response, and impulse control under time pressure.'
    }
  },
  {
    icon: BarChart3,
    title: {
      es: 'Memoria de trabajo y destreza operativa',
      en: 'Working memory and operational dexterity'
    },
    detail: {
      es: 'Evaluamos retención activa, priorización y ejecución efectiva frente a tareas concurrentes.',
      en: 'We evaluate active retention, prioritization, and effective execution across concurrent tasks.'
    }
  },
  {
    icon: TrendingUp,
    title: {
      es: 'Adaptación y aprendizaje',
      en: 'Adaptation and learning'
    },
    detail: {
      es: 'Observamos cómo ajustas estrategia cuando cambian reglas, contexto o restricciones.',
      en: 'We observe how strategy adapts when rules, context, or constraints change.'
    }
  },
  {
    icon: Target,
    title: {
      es: 'Juicio y riesgo en incertidumbre',
      en: 'Judgment and risk under uncertainty'
    },
    detail: {
      es: 'Analizamos decisiones bajo información incompleta y equilibrio entre riesgo y cobertura.',
      en: 'We analyze decisions with incomplete information and balance between risk and coverage.'
    }
  }
];

// eslint-disable-next-line no-unused-vars
const differentiators = [
  {
    icon: ShieldCheck,
    label: {
      es: 'Privacidad como diferenciador',
      en: 'Privacy as a differentiator'
    },
    text: {
      es: 'No construimos perfiles personales. Evaluamos capacidades y resultados para decisiones con evidencia.',
      en: 'We do not build personal profiles. We assess capabilities and outcomes for evidence-based decisions.'
    }
  },
  {
    icon: Radar,
    label: {
      es: 'Evaluación de habilidades reales',
      en: 'Assessment of real skills'
    },
    text: {
      es: 'Nos enfocamos en talentos, destrezas y desempeño observable en situaciones de juego.',
      en: 'We focus on talents, dexterity, and observable performance in game-based situations.'
    }
  },
  {
    icon: Sparkles,
    label: {
      es: 'Gamificación con foco en finalización',
      en: 'Gamification focused on completion'
    },
    text: {
      es: 'Diseñamos experiencias gamificadas para elevar la participación y aumentar la finalización de la evaluación.',
      en: 'We design gamified experiences to increase engagement and improve assessment completion rates.'
    }
  },
  {
    icon: UserRoundCog,
    label: {
      es: 'Reporte accionable para decisión',
      en: 'Actionable report for decision-making'
    },
    text: {
      es: 'Cada resultado se traduce en señales claras para selección, desarrollo y movilidad interna.',
      en: 'Each result is translated into clear signals for selection, development, and internal mobility.'
    }
  }
];

const projectSignals = [
  {
    icon: TrendingUp,
    title: {
      es: 'Resultados que escalan',
      en: 'Results that scale'
    },
    text: {
      es: 'Diseño modular para operar en distintos contextos de talento sin rediseñar toda la experiencia.',
      en: 'Modular design to operate across talent contexts without redesigning the full experience.'
    }
  },
  {
    icon: CheckCircle2,
    title: {
      es: 'Evidencia que se entiende rápido',
      en: 'Evidence that is quickly understood'
    },
    text: {
      es: 'Conclusiones claras y trazables para acelerar conversaciones entre equipos de personas y negocio.',
      en: 'Clear and traceable conclusions to accelerate discussions between people and business teams.'
    }
  },
  {
    icon: Sparkles,
    title: {
      es: 'Innovación aplicable',
      en: 'Applied innovation'
    },
    text: {
      es: 'Combina IA, analítica conductual y UX gamificada en un flujo práctico de adopción.',
      en: 'Combines AI, behavioral analytics, and gamified UX in a practical adoption flow.'
    }
  },
  {
    icon: LineChart,
    title: {
      es: 'Valor visible desde el piloto',
      en: 'Visible value from pilot stage'
    },
    text: {
      es: 'Métricas de finalización, consistencia y calidad de señal para justificar expansión.',
      en: 'Completion, consistency, and signal quality metrics to justify expansion.'
    }
  }
];

const onePagerCategories = [
  {
    icon: Brain,
    title: { es: 'Ciencia cognitiva', en: 'Cognitive science' },
    subtitle: { es: 'Fundamento técnico', en: 'Technical foundation' },
    points: {
      es: ['Modelos psicométricos validados', 'Señales cognitivas observables'],
      en: ['Validated psychometric models', 'Observable cognitive signals']
    }
  },
  {
    icon: BarChart3,
    title: { es: 'Analítica conductual', en: 'Behavioral analytics' },
    subtitle: { es: 'Señal accionable', en: 'Actionable signal' },
    points: {
      es: ['Telemetría en tiempo real', 'Reportes listos para decidir'],
      en: ['Real-time telemetry', 'Decision-ready reporting']
    }
  },
  {
    icon: Lock,
    title: { es: 'Privacidad y seguridad', en: 'Privacy and security' },
    subtitle: { es: 'Confianza operativa', en: 'Operational trust' },
    points: {
      es: ['Sin perfilamiento invasivo', 'Protección de datos por diseño'],
      en: ['No invasive profiling', 'Privacy-by-design protection']
    }
  },
  {
    icon: Zap,
    title: { es: 'Experiencia gamificada', en: 'Gamified experience' },
    subtitle: { es: 'Mayor finalización', en: 'Higher completion' },
    points: {
      es: ['Interfaz dinámica y simple', 'Flujo continuo de evaluación'],
      en: ['Dynamic and simple interface', 'Continuous assessment flow']
    }
  }
];

const processSteps = [
  {
    number: '01',
    icon: ShieldCheck,
    title: { es: 'Acceso seguro', en: 'Secure access' },
    text: {
      es: 'Inicio con credenciales o demostración, manteniendo trazabilidad desde el primer evento.',
      en: 'Start with credentials or guided demo while preserving traceability from the first event.'
    }
  },
  {
    number: '02',
    icon: Brain,
    title: { es: 'Batería de evaluación', en: 'Assessment battery' },
    text: {
      es: 'Retos conectados que miden desempeño en memoria, atención, adaptación y toma de decisión.',
      en: 'Connected challenges that measure performance in memory, attention, adaptation, and decision-making.'
    }
  },
  {
    number: '03',
    icon: LineChart,
    title: { es: 'Informe accionable', en: 'Actionable report' },
    text: {
      es: 'Resultados sintetizados en señales claras para selección, desarrollo y movilidad interna.',
      en: 'Results synthesized into clear signals for selection, development, and internal mobility.'
    }
  }
];

const useCases = [
  {
    icon: Target,
    title: { es: 'Selección técnica', en: 'Technical selection' },
    text: {
      es: 'Compara evidencia de desempeño entre candidatos con criterios homogéneos.',
      en: 'Compare performance evidence between candidates using homogeneous criteria.'
    }
  },
  {
    icon: TrendingUp,
    title: { es: 'Desarrollo profesional', en: 'Professional development' },
    text: {
      es: 'Detecta oportunidades de crecimiento y entrenamiento focalizado.',
      en: 'Detect growth opportunities and targeted training paths.'
    }
  },
  {
    icon: Users,
    title: { es: 'Movilidad interna', en: 'Internal mobility' },
    text: {
      es: 'Apoya decisiones de promoción y rotación con datos comparables.',
      en: 'Support promotion and rotation decisions with comparable data.'
    }
  },
  {
    icon: LineChart,
    title: { es: 'Benchmarking', en: 'Benchmarking' },
    text: {
      es: 'Monitorea consistencia y evolución de talento entre cohortes.',
      en: 'Track consistency and talent evolution across cohorts.'
    }
  }
];

const copy = {
  es: {
    heroPill: 'Evaluación gamificada de talento',
    heroTitlePrefix: 'Evaluamos',
    heroTitleAccent: 'habilidades, talentos y destrezas',
    heroTitleSuffix: 'con pruebas gamificadas.',
    heroDescription:
      'Krumm transforma evaluaciones tradicionales en una experiencia con mayor participación para aumentar la finalización de la prueba y entregar reportes de evidencia conductual para decisiones de talento.',
    actionStart: 'Ingresar al test',
    actionDemo: 'Ver demostración guiada',
    actionRecruiter: 'Portal reclutador',
    statChallenges: 'retos gamificados',
    statParticipationTitle: 'Participación',
    statParticipationText: 'diseño centrado en finalización',
    statReportsTitle: 'Reportes claros',
    statReportsText: 'evidencia para decisión de talento',
    stageTitle: 'Flujo simple y continuo',
    stageDescription:
      'La experiencia mantiene el recorrido actual: ingreso, batería de juegos, reporte y revisión por reclutamiento.',
    stageStep1: 'Ingreso con credenciales o modo demostración',
    stageStep2: (games) => `${games} retos conectados en una sola sesión`,
    stageStep3: 'Reporte accionable para selección y desarrollo',
    formTitle: 'Acceso a la evaluación',
    formDescription: 'Completa tus datos para iniciar la batería gamificada.',
    validating: 'Validando...',
    startEvaluation: 'Comenzar evaluación',
    continueNoBackend: 'modo QA/offline (solo desarrollo)',
    continueLocal: 'Continuar en modo QA/offline',
    diffTitle: 'Diferenciadores de la experiencia',
    capabilitiesTitle: 'Qué se evalúa durante la prueba',
    capabilitiesIntro: 'De memoria y atención hasta riesgo, aprendizaje y coordinación social.',
    signalsTitle: 'Señales de tracción y valor',
    signalsIntro:
      'Impacto medible, evidencia comprensible y escalabilidad real.',
    devTitle: 'Accesos rápidos de desarrollo',
    devIntro: 'Entrar directo a cada juego integrado y al reporte final.',
    gameLabel: 'Juego',
    fallbackEval: 'Evaluación',
    finalReport: 'Ir al reporte final'
  },
  en: {
    heroPill: 'Gamified talent assessment',
    heroTitlePrefix: 'We assess',
    heroTitleAccent: 'skills, talents, and capabilities',
    heroTitleSuffix: 'through gamified challenges.',
    heroDescription:
      'Krumm transforms traditional assessments into high-engagement experiences to increase completion and deliver behavioral evidence for talent decisions.',
    actionStart: 'Start assessment',
    actionDemo: 'Watch guided demo',
    actionRecruiter: 'Recruiter portal',
    statChallenges: 'gamified challenges',
    statParticipationTitle: 'Engagement',
    statParticipationText: 'completion-focused design',
    statReportsTitle: 'Clear reports',
    statReportsText: 'evidence for talent decisions',
    stageTitle: 'Simple and continuous flow',
    stageDescription:
      'The experience preserves a clear journey: access, game battery, report, and recruiter review.',
    stageStep1: 'Credential-based access or guided demo mode',
    stageStep2: (games) => `${games} connected challenges in one session`,
    stageStep3: 'Actionable report for selection and development',
    formTitle: 'Assessment access',
    formDescription: 'Complete your details to begin the gamified battery.',
    validating: 'Validating...',
    startEvaluation: 'Start evaluation',
    continueNoBackend: 'QA/offline mode (development only)',
    continueLocal: 'Continue in QA/offline mode',
    diffTitle: 'Experience differentiators',
    capabilitiesTitle: 'What is evaluated during the assessment',
    capabilitiesIntro: 'From memory and attention to risk, learning, and social coordination.',
    signalsTitle: 'Traction and value signals',
    signalsIntro:
      'Measurable impact, understandable evidence, and real scalability.',
    devTitle: 'Development quick access',
    devIntro: 'Jump directly to each integrated game and final report.',
    gameLabel: 'Game',
    fallbackEval: 'Assessment',
    finalReport: 'Go to final report'
  }
};

const LandingPageV3 = () => {
  const navigate = useNavigate();
  const { setIsDemo, setParticipantProfile, recordTrialEvent, featureFlags } = useTelemetry();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const { language, setLanguage } = useLanguage();
  const [isQaMode, setIsQaMode] = useState(() => getQaMode());
  const [formData, setFormData] = useState({
    fullName: '',
    participantId: '',
    email: '',
    accessCode: ''
  });

  const isDev = (typeof import.meta !== 'undefined' && import.meta.env?.DEV) === true;
  const DevQuickAccess = lazy(() => import('./DevQuickAccess'));
  const [showDevQuickAccess, setShowDevQuickAccess] = useState(false);
  const t = copy[language] || copy.es;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = (window.location.hostname || '').toLowerCase();
    const raw = import.meta.env.VITE_ALLOWED_DEV_HOSTS || 'localhost,127.0.0.1,::1,dev.krumm.cl';
    const allowed = raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const matchesAllowed = allowed.includes(host) || allowed.some(p => p.startsWith('*.') && host.endsWith(p.replace('*.', '')));
    const isLocalSuffix = host.endsWith('.local');
    setShowDevQuickAccess(matchesAllowed || isLocalSuffix || window.location.port === '5173');
  }, []);

  const totalGames = useMemo(() => GAME_FLOW.length, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStartAssessment = (event) => {
    event.preventDefault();

    if (isQaMode) {
      setIsDemo(false);
      setParticipantProfile({
        fullName: formData.fullName.trim() || 'Usuario QA',
        participantId: formData.participantId.trim() || `QA-${Date.now()}`,
        email: formData.email.trim() || 'qa@local',
        authenticatedAt: new Date().toISOString(),
        participantToken: null,
        preferredLanguage: language,
        source: 'qa_offline'
      });
      navigate(`/game/1?lang=${language}`);
      return;
    }

    const authenticate = async () => {
      setIsSubmitting(true);
      setAuthError('');

      try {
        const authRes = await authenticateParticipant({
          fullName: formData.fullName.trim(),
          participantId: formData.participantId.trim(),
          email: formData.email.trim(),
          accessCode: formData.accessCode.trim()
        });

        setIsDemo(false);
        setParticipantProfile({
          fullName: authRes.participant.fullName,
          participantId: authRes.participant.participantId,
          email: authRes.participant.email,
          authenticatedAt: authRes.authenticatedAt,
          participantToken: authRes.participantToken,
          preferredLanguage: language,
          source: 'landing_credentials'
        });

        navigate(`/game/1?lang=${language}`);
      } catch (error) {
        setAuthError(error.message || 'No fue posible validar tus credenciales. Intenta nuevamente.');
      } finally {
        setIsSubmitting(false);
      }
    };

    authenticate();
  };

  const handleStartDemo = () => {
    setAuthError('');
    setIsDemo(true);
    setParticipantProfile({
      fullName: 'Usuario demo',
      participantId: 'DEMO-LOCAL',
      email: '',
      accessCode: '',
      authenticatedAt: new Date().toISOString(),
      preferredLanguage: language,
      source: 'demo'
    });
    // Navigate to first demo game defined in DEMO_GAME_IDS
    const firstDemo = (Array.isArray(DEMO_GAME_IDS) && DEMO_GAME_IDS.length > 0) ? DEMO_GAME_IDS[0] : 1;
    navigate(`/game/${firstDemo}?lang=${language}`);
  };

  const handleContinueLocal = () => {
    setIsDemo(false);
    setParticipantProfile({
      fullName: formData.fullName.trim() || 'Usuario local',
      participantId: formData.participantId.trim() || `LOCAL-${Date.now()}`,
      email: formData.email.trim(),
      authenticatedAt: new Date().toISOString(),
      participantToken: null,
      preferredLanguage: language,
      source: 'local_offline'
    });
    navigate(`/game/1?lang=${language}`);
  };

  // QA toggle removed from UI — QA mode can still be controlled via localStorage if needed

  const ensureQuickAccessProfile = () => {
    setIsDemo(true);
    setParticipantProfile({
      fullName: 'Acceso rapido dev',
      participantId: `DEV-${Date.now()}`,
      email: 'dev@krumm.local',
      authenticatedAt: new Date().toISOString(),
      participantToken: null,
      preferredLanguage: language,
      source: 'dev_quick_access'
    });
  };

  const handleQuickGoToGame = (path) => {
    ensureQuickAccessProfile();
    navigate(path);
  };

  const handleQuickGoToReport = () => {
    ensureQuickAccessProfile();
    navigate('/report?dummy=true');
  };

  return (
    <div className="landing-v3">
      <div className="lv3-lang-corner" role="group" aria-label="Cambiar idioma">
        <button
          type="button"
          className={`lv3-lang-btn ${language === 'es' ? 'active' : ''}`}
          onClick={() => setLanguage('es')}
        >
          ES
        </button>
        <button
          type="button"
          className={`lv3-lang-btn ${language === 'en' ? 'active' : ''}`}
          onClick={() => setLanguage('en')}
        >
          EN
        </button>
        {/* QA toggle removed from header */}
      </div>

      <header className="lv3-hero">
        <div className="lv3-hero-grid">
          <motion.section
            className="lv3-copy"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <span className="lv3-pill">{t.heroPill}</span>
            <h1>
              {`${t.heroTitlePrefix} `}
              <span>{t.heroTitleAccent}</span>
              {` ${t.heroTitleSuffix}`}
            </h1>
            <p>{t.heroDescription}</p>
          </motion.section>

          <motion.aside
            className="lv3-brand-stage"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <div className="lv3-stage-logo-wrap" aria-label="Identidad Krumm">
              <span className="lv3-stage-orbit lv3-stage-orbit-a" aria-hidden="true" />
              <span className="lv3-stage-orbit lv3-stage-orbit-b" aria-hidden="true" />
              <img src={logo} alt="Krumm - logo" className="lv3-stage-logo" />
            </div>
            <h2>{t.stageTitle}</h2>
            <p>{t.stageDescription}</p>
            <ul className="lv3-stage-list">
              <li>{t.stageStep1}</li>
              <li>{t.stageStep2(totalGames)}</li>
              <li>{t.stageStep3}</li>
            </ul>
          </motion.aside>
        </div>

        <motion.div
          className="lv3-action-dock"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
        >
          <div className="lv3-action-buttons">
            <button className="lv3-primary lv3-action-btn lv3-action-start" onClick={() => {
              recordTrialEvent && recordTrialEvent({ event: 'cta_quick_modal_opened' });
              // If hero demo feature is disabled, fall back to the original form overlay
              if (featureFlags?.enableHeroDemo) setShowQuickModal(true);
              else setShowForm(true);
            }}>
              <Sparkles size={18} aria-hidden="true" />
              <span>{language === 'es' ? 'Hacer test ya' : 'Start test now'}</span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
            <button className="lv3-ghost lv3-action-btn lv3-action-demo" onClick={() => { recordTrialEvent && recordTrialEvent({ event: 'cta_demo_clicked' }); handleStartDemo(); }}>
              <FlaskConical size={18} aria-hidden="true" />
              <span>{t.actionDemo}</span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
            <button
              className="lv3-recruiter-btn lv3-action-btn lv3-action-recruiter"
              onClick={() => { recordTrialEvent && recordTrialEvent({ event: 'cta_recruiter_clicked' }); navigate('/recruiter/login'); }}
            >
              <Globe size={18} aria-hidden="true" />
              <span>{t.actionRecruiter}</span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </motion.div>

      {/* Quick access modal for direct credential login */}
      {showQuickModal && (
        <TestAccessModal
          isOpen={showQuickModal}
          onClose={() => setShowQuickModal(false)}
        />
      )}

          {featureFlags?.enableHeroDemo && (
            <motion.div
              className="lv3-hero-demo-wrap"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18 }}
            >
              <div className="lv3-container">
                <div className="lv3-panel">
                  <HeroDemo />
                </div>
              </div>
            </motion.div>
          )}
      </header>

      {showForm && (
        <motion.section
          className="lv3-form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="lv3-form-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button className="lv3-close" onClick={() => setShowForm(false)}>✕</button>
            <h2>{t.formTitle}</h2>
            <p>{t.formDescription}</p>

            <form className="lv3-form" onSubmit={handleStartAssessment}>
              {/* QA status indicator removed from form overlay */}

              {isDev && isQaMode && (
                <div className="lv3-divider" style={{ marginBottom: '14px', color: '#0369a1', borderColor: 'rgba(2,132,199,0.35)' }}>
                  {language === 'en'
                    ? 'QA/offline enabled: credentials are optional and backend is skipped.'
                    : 'QA/offline activo: credenciales opcionales y sin llamada a backend.'}
                </div>
              )}

              <label htmlFor="fullName">Nombre completo</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Tu nombre"
                value={formData.fullName}
                onChange={handleChange}
              />

              <label htmlFor="participantId">ID de participante *</label>
              <input
                id="participantId"
                name="participantId"
                type="text"
                placeholder="KRUMM-2026-001"
                value={formData.participantId}
                onChange={handleChange}
                required={!isQaMode}
              />

              <label htmlFor="email">Correo electrónico *</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                required={!isQaMode}
              />

              <label htmlFor="accessCode">Código de acceso *</label>
              <input
                id="accessCode"
                name="accessCode"
                type="password"
                placeholder="••••••••"
                value={formData.accessCode}
                onChange={handleChange}
                required={!isQaMode}
                minLength={4}
              />

              {authError && <div className="lv3-error">{authError}</div>}

              <button type="submit" className="lv3-primary lv3-full" disabled={isSubmitting}>
                {isSubmitting ? t.validating : (isQaMode ? (language === 'en' ? 'Enter in QA mode' : 'Entrar en modo QA') : t.startEvaluation)}
              </button>

              {isDev && (
                <>
                  <div className="lv3-divider">{t.continueNoBackend}</div>

                  <button type="button" className="lv3-ghost lv3-full" onClick={handleContinueLocal}>
                    {t.continueLocal}
                  </button>
                </>
              )}
            </form>
          </motion.div>
        </motion.section>
      )}

      <section className="lv3-section lv3-categories">
        <div className="lv3-container">
          <div className="lv3-panel">
            <div className="lv3-section-head">
              <h2 className="lv3-section-title"><Radar size={20} aria-hidden="true" /> <span>{t.diffTitle}</span></h2>
              <p>{language === 'es' ? 'Categorías clave con señal clara para equipos de personas.' : 'Key categories with clear signal for people teams.'}</p>
            </div>
            <div className="lv3-cat-grid">
              {onePagerCategories.map((item) => (
                <article key={item.title.es} className="lv3-cat-card">
                  <div className="lv3-cat-top">
                    <span className="lv3-cat-icon"><item.icon size={19} aria-hidden="true" /></span>
                    <div>
                      <h3>{item.title[language]}</h3>
                      <p className="lv3-cat-subtitle">{item.subtitle[language]}</p>
                    </div>
                  </div>
                  <ul className="lv3-point-list">
                    {item.points[language].map((point) => (
                      <li key={point}>
                        <CheckCircle2 size={15} aria-hidden="true" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="lv3-section lv3-capabilities">
        <div className="lv3-container">
          <div className="lv3-panel">
            <div className="lv3-section-head">
              <h2 className="lv3-section-title"><Brain size={20} aria-hidden="true" /> <span>{t.capabilitiesTitle}</span></h2>
              <p>{t.capabilitiesIntro}</p>
            </div>
            <div className="lv3-cap-grid">
              {capabilityAreas.map((area) => (
                <article key={area.title.es} className="lv3-cap-card">
                  <h3>
                    <area.icon size={18} aria-hidden="true" />
                    <span>{area.title[language]}</span>
                  </h3>
                  <p>{area.detail[language]}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="lv3-section lv3-project-signals">
        <div className="lv3-container">
          <div className="lv3-panel">
            <div className="lv3-section-head">
              <h2 className="lv3-section-title"><TrendingUp size={20} aria-hidden="true" /> <span>{t.signalsTitle}</span></h2>
              <p>{t.signalsIntro}</p>
            </div>
            <div className="lv3-signal-grid">
              {projectSignals.map((signal) => (
                <article key={signal.title.es} className="lv3-signal-card">
                  <h3>
                    <signal.icon size={18} aria-hidden="true" />
                    <span>{signal.title[language]}</span>
                  </h3>
                  <p>{signal.text[language]}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="lv3-section lv3-process">
        <div className="lv3-container">
          <div className="lv3-panel">
            <div className="lv3-section-head">
              <h2 className="lv3-section-title"><FlaskConical size={20} aria-hidden="true" /> <span>{language === 'es' ? 'Cómo funciona' : 'How it works'}</span></h2>
              <p>
                {language === 'es'
                  ? 'Un flujo simple, medible y fácil de operar para equipos de talento.'
                  : 'A simple, measurable, and easy-to-operate flow for talent teams.'}
              </p>
            </div>
            <div className="lv3-process-grid">
              {processSteps.map((step) => (
                <article key={step.number} className="lv3-process-card">
                  <span className="lv3-step-number">{step.number}</span>
                  <h3>
                    <step.icon size={18} aria-hidden="true" />
                    <span>{step.title[language]}</span>
                  </h3>
                  <p>{step.text[language]}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="lv3-section lv3-usecases">
        <div className="lv3-container">
          <div className="lv3-panel">
            <div className="lv3-section-head">
              <h2 className="lv3-section-title"><Users size={20} aria-hidden="true" /> <span>{language === 'es' ? 'Casos de uso' : 'Use cases'}</span></h2>
              <p>
                {language === 'es'
                  ? 'Aplicaciones concretas para selección, desarrollo y estrategia de talento.'
                  : 'Concrete applications for selection, development, and talent strategy.'}
              </p>
            </div>
            <div className="lv3-usecase-grid">
              {useCases.map((item) => (
                <article key={item.title.es} className="lv3-usecase-card">
                  <item.icon size={20} aria-hidden="true" />
                  <h3>{item.title[language]}</h3>
                  <p>{item.text[language]}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {showDevQuickAccess && DevQuickAccess && (
        <Suspense fallback={null}>
          <DevQuickAccess t={t} language={language} />
        </Suspense>
      )}
    </div>
  );
};

export default LandingPageV3;

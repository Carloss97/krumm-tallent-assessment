import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, FlaskConical, Globe, Radar, ShieldCheck, Sparkles, UserRoundCog } from 'lucide-react';
import { useTelemetry } from '../TelemetryContext';
import { authenticateParticipant } from '../services/backendService';
import { GAME_FLOW } from '../utils/gameFlow';
import logo from '../assets/logo.jpg';
import './LandingPageV3.css';

const capabilityAreas = [
  {
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
    continueNoBackend: 'o continuar sin backend',
    continueLocal: 'Continuar localmente',
    diffTitle: 'Diferenciadores de la experiencia',
    capabilitiesTitle: 'Qué se evalúa durante la prueba',
    capabilitiesIntro: 'De memoria y atención hasta riesgo, aprendizaje y coordinación social.',
    signalsTitle: 'Señales de tracción y valor',
    signalsIntro:
      'Una propuesta diseñada para llamar la atención de revisores exigentes: impacto medible, evidencia comprensible y escalabilidad real.',
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
    continueNoBackend: 'or continue without backend',
    continueLocal: 'Continue locally',
    diffTitle: 'Experience differentiators',
    capabilitiesTitle: 'What is evaluated during the assessment',
    capabilitiesIntro: 'From memory and attention to risk, learning, and social coordination.',
    signalsTitle: 'Traction and value signals',
    signalsIntro:
      'A proposal built to stand out to demanding reviewers: measurable impact, understandable evidence, and real scalability.',
    devTitle: 'Development quick access',
    devIntro: 'Jump directly to each integrated game and final report.',
    gameLabel: 'Game',
    fallbackEval: 'Assessment',
    finalReport: 'Go to final report'
  }
};

const LandingPageV3 = () => {
  const navigate = useNavigate();
  const { setIsDemo, setParticipantProfile } = useTelemetry();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('krumm-lang') || 'es');
  const [formData, setFormData] = useState({
    fullName: '',
    participantId: '',
    email: '',
    accessCode: ''
  });

  const isDev = (typeof import.meta !== 'undefined' && import.meta.env?.DEV) === true;
  const t = copy[language] || copy.es;

  const totalGames = useMemo(() => GAME_FLOW.length, []);

  useEffect(() => {
    localStorage.setItem('krumm-lang', language);
  }, [language]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStartAssessment = (event) => {
    event.preventDefault();

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
    navigate(`/game/1?lang=${language}`);
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
          <div className="lv3-lang-toggle" role="group" aria-label="Cambiar idioma">
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
          </div>

          <div className="lv3-action-buttons">
            <button className="lv3-primary lv3-action-btn lv3-action-start" onClick={() => setShowForm(true)}>
              <Sparkles size={18} aria-hidden="true" />
              <span>{t.actionStart}</span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
            <button className="lv3-ghost lv3-action-btn lv3-action-demo" onClick={handleStartDemo}>
              <FlaskConical size={18} aria-hidden="true" />
              <span>{t.actionDemo}</span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
            <button
              className="lv3-recruiter-btn lv3-action-btn lv3-action-recruiter"
              onClick={() => navigate('/recruiter/login')}
            >
              <Globe size={18} aria-hidden="true" />
              <span>{t.actionRecruiter}</span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="lv3-stats">
            <article>
              <strong>{totalGames}</strong>
              <span>{t.statChallenges}</span>
            </article>
            <article>
              <strong>{t.statParticipationTitle}</strong>
              <span>{t.statParticipationText}</span>
            </article>
            <article>
              <strong>{t.statReportsTitle}</strong>
              <span>{t.statReportsText}</span>
            </article>
          </div>
        </motion.div>
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
                required
              />

              <label htmlFor="email">Correo electrónico *</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <label htmlFor="accessCode">Código de acceso *</label>
              <input
                id="accessCode"
                name="accessCode"
                type="password"
                placeholder="••••••••"
                value={formData.accessCode}
                onChange={handleChange}
                required
                minLength={4}
              />

              {authError && <div className="lv3-error">{authError}</div>}

              <button type="submit" className="lv3-primary lv3-full" disabled={isSubmitting}>
                {isSubmitting ? t.validating : t.startEvaluation}
              </button>

              <div className="lv3-divider">{t.continueNoBackend}</div>

              <button type="button" className="lv3-ghost lv3-full" onClick={handleContinueLocal}>
                {t.continueLocal}
              </button>
            </form>
          </motion.div>
        </motion.section>
      )}

      <section className="lv3-section lv3-diff">
        <div className="lv3-container">
          <h2>{t.diffTitle}</h2>
          <div className="lv3-diff-grid">
            {differentiators.map((item) => (
              <article key={item.label.es} className="lv3-diff-card">
                <h3>
                  <item.icon size={18} aria-hidden="true" />
                  <span>{item.label[language]}</span>
                </h3>
                <p>{item.text[language]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lv3-section lv3-capabilities">
        <div className="lv3-container">
          <h2>{t.capabilitiesTitle}</h2>
          <p className="lv3-intro">{t.capabilitiesIntro}</p>
          <div className="lv3-cap-grid">
            {capabilityAreas.map((area) => (
              <article key={area.title.es} className="lv3-cap-card">
                <h3>{area.title[language]}</h3>
                <p>{area.detail[language]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lv3-section lv3-project-signals">
        <div className="lv3-container">
          <h2>{t.signalsTitle}</h2>
          <p className="lv3-intro">{t.signalsIntro}</p>
          <div className="lv3-signal-grid">
            {projectSignals.map((signal) => (
              <article key={signal.title.es} className="lv3-signal-card">
                <h3>{signal.title[language]}</h3>
                <p>{signal.text[language]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {isDev && (
        <section className="lv3-section lv3-dev" aria-label="Accesos de desarrollo">
          <div className="lv3-container">
            <h2>{t.devTitle}</h2>
            <p className="lv3-intro">{t.devIntro}</p>
            <div className="lv3-dev-grid">
              {GAME_FLOW.map((game) => (
                <button
                  key={game.id}
                  className="lv3-dev-btn"
                  onClick={() => handleQuickGoToGame(game.path)}
                >
                  {`${t.gameLabel} ${game.id}: ${game.instruction?.title || t.fallbackEval}`}
                </button>
              ))}
              <button className="lv3-dev-btn lv3-dev-report" onClick={handleQuickGoToReport}>
                {t.finalReport}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default LandingPageV3;

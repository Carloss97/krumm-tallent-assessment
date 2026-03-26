import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { authenticateParticipant } from '../services/backendService';
import { GAME_FLOW } from '../utils/gameFlow';
import logo from '../assets/logo.jpg';
import './LandingPageV3.css';

const capabilityAreas = [
  {
    title: 'Capacidad atencional y control inhibitorio',
    detail: 'Medimos foco sostenido, respuesta a distractores y control de impulsos bajo carga temporal.'
  },
  {
    title: 'Memoria de trabajo y destreza operativa',
    detail: 'Evaluamos retencion activa, priorizacion y ejecucion efectiva frente a tareas concurrentes.'
  },
  {
    title: 'Adaptacion y aprendizaje',
    detail: 'Observamos como ajustas estrategia cuando cambian reglas, contexto o restricciones.'
  },
  {
    title: 'Juicio y riesgo en incertidumbre',
    detail: 'Analizamos decisiones bajo informacion incompleta y equilibrio entre riesgo y cobertura.'
  }
];

const differentiators = [
  {
    label: 'Privacidad como diferenciador',
    text: 'No construimos perfiles personales. Evaluamos capacidades y resultados para decisiones con evidencia.'
  },
  {
    label: 'Evaluacion de habilidades reales',
    text: 'Nos enfocamos en talentos, destrezas y desempeno observable en situaciones de juego.'
  },
  {
    label: 'Gamificacion con objetivo de finalizacion',
    text: 'Diseñamos experiencias gamificadas para elevar la participacion y aumentar el porcentaje de personas que terminan la evaluacion.'
  },
  {
    label: 'Reporte accionable para decision',
    text: 'Cada resultado se traduce en señales claras para seleccion, desarrollo y movilidad interna.'
  }
];

const projectSignals = [
  {
    title: 'Impacto esperado en finalizacion',
    text: 'Meta de piloto: aumentar finalizacion de evaluaciones en 20% a 30% frente a flujos tradicionales.'
  },
  {
    title: 'Trazabilidad para decision publica/privada',
    text: 'Cada conclusion del reporte puede auditarse por evidencia conductual y resultados por competencia.'
  },
  {
    title: 'Escalabilidad y transferencia sectorial',
    text: 'La bateria es modular: permite adaptar juegos y reportes a mineria, salud, servicios y formacion tecnica.'
  },
  {
    title: 'Propuesta de valor para financiamiento',
    text: 'Combina innovacion en IA aplicada, UX gamificada y medicion objetiva para acelerar adopcion en talento.'
  }
];

const LandingPageV3 = () => {
  const navigate = useNavigate();
  const { setIsDemo, setParticipantProfile } = useTelemetry();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    participantId: '',
    email: '',
    accessCode: ''
  });

  const isDev = (typeof import.meta !== 'undefined' && import.meta.env?.DEV) === true;

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
          source: 'landing_credentials'
        });

        navigate('/game/1');
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
      source: 'demo'
    });
    navigate('/game/1');
  };

  const handleContinueLocal = () => {
    setIsDemo(false);
    setParticipantProfile({
      fullName: formData.fullName.trim() || 'Usuario local',
      participantId: formData.participantId.trim() || `LOCAL-${Date.now()}`,
      email: formData.email.trim(),
      authenticatedAt: new Date().toISOString(),
      participantToken: null,
      source: 'local_offline'
    });
    navigate('/game/1');
  };

  const ensureQuickAccessProfile = () => {
    setIsDemo(true);
    setParticipantProfile({
      fullName: 'Acceso rapido dev',
      participantId: `DEV-${Date.now()}`,
      email: 'dev@krumm.local',
      authenticatedAt: new Date().toISOString(),
      participantToken: null,
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
            <span className="lv3-pill">Evaluacion gamificada de talento</span>
            <h1>
              Evaluamos <span>habilidades, talentos y destrezas</span> con pruebas gamificadas.
            </h1>
            <p>
              Krumm transforma evaluaciones tradicionales en una experiencia con mayor participacion para aumentar la
              finalizacion de la prueba y entregar reportes de evidencia conductual para decisiones de talento.
            </p>
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
            <h2>Flujo simple y continuo</h2>
            <p>
              La experiencia mantiene el recorrido actual: ingreso, bateria de juegos, reporte y revision por
              reclutamiento.
            </p>
            <ul className="lv3-stage-list">
              <li>Ingreso con credenciales o modo demostracion</li>
              <li>{`${totalGames} retos conectados en una sola sesion`}</li>
              <li>Reporte accionable para seleccion y desarrollo</li>
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
            <button className="lv3-primary lv3-action-btn lv3-action-start" onClick={() => setShowForm(true)}>
              Ingresar al test
            </button>
            <button className="lv3-ghost lv3-action-btn lv3-action-demo" onClick={handleStartDemo}>
              Ver demostracion guiada
            </button>
            <button
              className="lv3-recruiter-btn lv3-action-btn lv3-action-recruiter"
              onClick={() => navigate('/recruiter/login')}
            >
              Portal reclutador
            </button>
          </div>

          <div className="lv3-stats">
            <article>
              <strong>{totalGames}</strong>
              <span>retos gamificados</span>
            </article>
            <article>
              <strong>Participacion</strong>
              <span>diseno centrado en finalizacion</span>
            </article>
            <article>
              <strong>Reportes claros</strong>
              <span>evidencia para decision de talento</span>
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
            <h2>Acceso a la evaluacion</h2>
            <p>Completa tus datos para iniciar la bateria gamificada.</p>

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

              <label htmlFor="email">Correo electronico *</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <label htmlFor="accessCode">Codigo de acceso *</label>
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
                {isSubmitting ? 'Validando...' : 'Comenzar evaluacion'}
              </button>

              <div className="lv3-divider">o continuar sin backend</div>

              <button type="button" className="lv3-ghost lv3-full" onClick={handleContinueLocal}>
                Continuar localmente
              </button>
            </form>
          </motion.div>
        </motion.section>
      )}

      <section className="lv3-section lv3-diff">
        <div className="lv3-container">
          <h2>Diferenciadores de la experiencia</h2>
          <div className="lv3-diff-grid">
            {differentiators.map((item) => (
              <article key={item.label} className="lv3-diff-card">
                <h3>{item.label}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lv3-section lv3-capabilities">
        <div className="lv3-container">
          <h2>Que se evalua durante la prueba</h2>
          <p className="lv3-intro">De memoria y atencion hasta riesgo, aprendizaje y coordinacion social.</p>
          <div className="lv3-cap-grid">
            {capabilityAreas.map((area) => (
              <article key={area.title} className="lv3-cap-card">
                <h3>{area.title}</h3>
                <p>{area.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lv3-section lv3-project-signals">
        <div className="lv3-container">
          <h2>Senales de impacto para evaluacion de proyecto</h2>
          <p className="lv3-intro">
            Informacion clave para fondos de innovacion: escalabilidad, trazabilidad de resultados y potencial de
            adopcion.
          </p>
          <div className="lv3-signal-grid">
            {projectSignals.map((signal) => (
              <article key={signal.title} className="lv3-signal-card">
                <h3>{signal.title}</h3>
                <p>{signal.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {isDev && (
        <section className="lv3-section lv3-dev" aria-label="Accesos de desarrollo">
          <div className="lv3-container">
            <h2>Accesos rapidos de desarrollo</h2>
            <p className="lv3-intro">Entrar directo a cada juego integrado y al reporte final.</p>
            <div className="lv3-dev-grid">
              {GAME_FLOW.map((game) => (
                <button
                  key={game.id}
                  className="lv3-dev-btn"
                  onClick={() => handleQuickGoToGame(game.path)}
                >
                  {`Juego ${game.id}: ${game.instruction?.title || 'Evaluacion'}`}
                </button>
              ))}
              <button className="lv3-dev-btn lv3-dev-report" onClick={handleQuickGoToReport}>
                Ir al reporte final
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default LandingPageV3;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { authenticateParticipant } from '../services/backendService';
import logo from '../assets/logo.jpg';
import './LandingPage.css';

const assessmentTracks = [
  {
    title: 'Memoria de trabajo',
    detail: 'OSPAN y N-Back para medir manejo de carga cognitiva en contextos de multitarea.'
  },
  {
    title: 'Control inhibitorio',
    detail: 'Go/No-Go y Stop-Signal para observar precisión bajo presión e impulsividad.'
  },
  {
    title: 'Flexibilidad cognitiva',
    detail: 'Task Switching y Wisconsin para evaluar adaptación a cambios y excepciones.'
  },
  {
    title: 'Atención sostenida',
    detail: 'CPT y Vigilance para detectar consistencia, lapsos y fatiga operacional.'
  }
];

const processSteps = [
  {
    title: '1. Acceso del participante',
    detail: 'Ingreso por credenciales, consentimiento y activación de telemetría de sesión.'
  },
  {
    title: '2. Batería cognitiva',
    detail: 'Juegos validados con registro de tiempos, precisión, errores y trayectoria de respuesta.'
  },
  {
    title: '3. Analítica y reporte',
    detail: 'Consolidación de resultados, scoring por constructo y recomendación para talento.'
  }
];

const useCases = [
  'Preselección de candidatos para roles críticos.',
  'Mapeo de potencial para movilidad interna.',
  'Programas de desarrollo con línea base cognitiva.',
  'Comparación objetiva entre cohortes de talento.'
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { setIsDemo, setParticipantProfile } = useTelemetry();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    participantId: '',
    email: '',
    accessCode: ''
  });

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
      fullName: 'Demo User',
      participantId: 'DEMO-LOCAL',
      email: '',
      accessCode: '',
      authenticatedAt: new Date().toISOString(),
      source: 'demo'
    });
    navigate('/game/1');
  };

  const handleViewDemoReport = () => {
    navigate('/report?dummy=true');
  };

  const handleContinueLocal = () => {
    setIsDemo(false);
    setParticipantProfile({
      fullName: formData.fullName.trim(),
      participantId: formData.participantId.trim() || `LOCAL-${Date.now()}`,
      email: formData.email.trim(),
      authenticatedAt: new Date().toISOString(),
      participantToken: null,
      source: 'local_offline'
    });
    navigate('/game/1');
  };

  return (
    <div className="krumm-landing">
      <div className="krumm-bg-shape krumm-bg-shape-top" aria-hidden="true" />
      <div className="krumm-bg-shape krumm-bg-shape-bottom" aria-hidden="true" />

      <section className="krumm-hero">
        <motion.div
          className="krumm-brand-panel"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img src={logo} alt="Krumm logo" className="krumm-logo" />
          <p className="krumm-chip">Tech for talent assessment</p>
          <h1>Evaluaciones cognitivas para decisiones de talento con evidencia</h1>
          <p className="krumm-subtitle">
            Krumm ayuda a equipos de RRHH a medir capacidades cognitivas clave con juegos validados,
            telemetría conductual y reportes accionables para selección y desarrollo.
          </p>

          <div className="krumm-metrics" role="list" aria-label="Diferenciales Krumm">
            <div role="listitem">
              <strong>14</strong>
              <span>Pruebas cognitivas</span>
            </div>
            <div role="listitem">
              <strong>360°</strong>
              <span>Telemetría de sesión</span>
            </div>
            <div role="listitem">
              <strong>HR-Tech</strong>
              <span>Diseño para reclutamiento</span>
            </div>
          </div>
        </motion.div>

        <motion.aside
          className="krumm-auth-panel"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <h2>Ingresar al assessment</h2>
          <p>Ingresa tus credenciales para asociar tus resultados a tu perfil.</p>

          <form className="krumm-auth-form" onSubmit={handleStartAssessment}>
            <label htmlFor="fullName">Nombre completo (opcional)</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Ej: Ana Torres"
              value={formData.fullName}
              onChange={handleChange}
            />

            <label htmlFor="participantId">ID de participante</label>
            <input
              id="participantId"
              name="participantId"
              type="text"
              placeholder="Ej: KRUMM-2026-001"
              value={formData.participantId}
              onChange={handleChange}
              required
            />

            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@correo.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="accessCode">Código de acceso</label>
            <input
              id="accessCode"
              name="accessCode"
              type="password"
              placeholder="******"
              value={formData.accessCode}
              onChange={handleChange}
              required
              minLength={4}
            />

            {authError && <p className="krumm-auth-error">{authError}</p>}

            <button type="submit" className="krumm-primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Validando credenciales...' : 'Comenzar test'}
            </button>
          </form>

          <div className="krumm-secondary-actions">
            <button type="button" className="krumm-secondary-button" onClick={handleStartDemo}>
              Modo demo rápido
            </button>
            <button type="button" className="krumm-secondary-button" onClick={handleViewDemoReport}>
              Ver reporte demo
            </button>
            <button type="button" className="krumm-secondary-button" onClick={handleContinueLocal}>
              Continuar local sin backend
            </button>
          </div>
        </motion.aside>
      </section>

      <section className="krumm-sections-wrap" aria-label="Información de producto Krumm">
        <motion.article
          className="krumm-info-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3>Qué hacemos en Krumm</h3>
          <p>
            Combinamos ciencia cognitiva, diseño de experiencia y analítica HR-Tech para transformar pruebas
            psicométricas tradicionales en una evaluación digital, dinámica y trazable para equipos de talento.
          </p>
          <p>
            Nuestra plataforma integra 14 experiencias de evaluación con telemetría conductual y análisis
            automatizado para apoyar decisiones de selección, calibración y desarrollo profesional.
          </p>
        </motion.article>

        <motion.article
          className="krumm-info-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
        >
          <h3>Qué medimos</h3>
          <div className="krumm-track-grid">
            {assessmentTracks.map((item) => (
              <div key={item.title} className="krumm-track-item">
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
            ))}
          </div>
        </motion.article>

        <motion.article
          className="krumm-info-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.34 }}
        >
          <h3>Cómo funciona el flujo</h3>
          <div className="krumm-process-grid">
            {processSteps.map((step) => (
              <div key={step.title} className="krumm-process-item">
                <strong>{step.title}</strong>
                <span>{step.detail}</span>
              </div>
            ))}
          </div>
        </motion.article>

        <motion.article
          className="krumm-info-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.42 }}
        >
          <h3>Aplicaciones para RRHH</h3>
          <ul className="krumm-bullet-list">
            {useCases.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </motion.article>

        <motion.article
          className="krumm-info-card krumm-info-card-emphasis"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3>Lo que recibe el equipo de talento</h3>
          <p>
            Reporte por participante con constructos priorizados, fortalezas, alertas y recomendación.
            Además, una base estructurada para comparar cohortes, detectar patrones y mejorar decisiones.
          </p>
          <div className="krumm-mini-tags" role="list" aria-label="Entregables">
            <span role="listitem">Scoring por juego</span>
            <span role="listitem">Tiempos de reacción</span>
            <span role="listitem">Métricas de error</span>
            <span role="listitem">Resumen ejecutivo</span>
          </div>
        </motion.article>
      </section>
    </div>
  );
};

export default LandingPage;

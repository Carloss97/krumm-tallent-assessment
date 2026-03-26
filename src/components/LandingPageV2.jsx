import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { authenticateParticipant } from '../services/backendService';
import { GAME_FLOW } from '../utils/gameFlow';
import logo from '../assets/logo.jpg';
import './LandingPageV2.css';

const features = [
  { icon: '🧠', title: 'Ciencia Cognitiva', description: 'Basado en investigación psicométrica validada internacionalmente' },
  { icon: '📊', title: 'Análisis Profundo', description: 'Telemetría conductual en tiempo real con scoring automático' },
  { icon: '🔒', title: 'Seguridad Total', description: 'Datos encriptados E2E, GDPR/CCPA compliant' },
  { icon: '⚡', title: 'Tecnología de Punta', description: 'Edge computing, inteligencia artificial integrada' },
];

const assessmentTracks = [
  {
    id: 1,
    icon: '🧠',
    title: 'Memoria de Trabajo',
    description: 'OSPAN y N-Back',
    detail: 'Evalúa tu capacidad para procesar y mantener información simultáneamente',
    color: '#667eea'
  },
  {
    id: 2,
    icon: '🛑',
    title: 'Control Inhibitorio',
    description: 'Go/No-Go y Stop-Signal',
    detail: 'Mide tu precisión bajo presión e impulsos de control',
    color: '#764ba2'
  },
  {
    id: 3,
    icon: '🔄',
    title: 'Flexibilidad Cognitiva',
    description: 'Task Switching y Wisconsin',
    detail: 'Observa tu adaptación a cambios y manejo de excepciones',
    color: '#f093fb'
  },
  {
    id: 4,
    icon: '👁️',
    title: 'Atención Sostenida',
    description: 'CPT y Vigilância',
    detail: 'Detecta tu consistencia, lapsos y resistencia a la fatiga',
    color: '#4facfe'
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Acceso Seguro',
    description: 'Ingresa con tus credenciales. Tu sesión se encripta en tiempo real.'
  },
  {
    number: '02',
    title: 'Batería Cognitiva',
    description: '7 juegos interactivos que miden core competencies en ~20 minutos.'
  },
  {
    number: '03',
    title: 'Análisis & Reporte',
    description: 'Resultados instantáneos con benchmark sector y recomendaciones personalizadas.'
  },
];

const useCases = [
  { icon: '🎯', title: 'Selección Técnica', text: 'Identifica candidatos con máximo potencial cognitivo' },
  { icon: '📈', title: 'Desarrollo Profesional', text: 'Mapea patrones y diseña programas personalizados' },
  { icon: '👥', title: 'Movilidad Interna', text: 'Evaluación objetiva para promociones y rotaciones' },
  { icon: '📊', title: 'Benchmarking', text: 'Compara perfiles y cohesiona estrategia de talento' },
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
  const [showForm, setShowForm] = useState(false);
  const isDev = (typeof import.meta !== 'undefined' && import.meta.env?.DEV) === true;

  const ensureQuickAccessProfile = () => {
    setIsDemo(true);
    setParticipantProfile({
      fullName: 'Dev Quick Access',
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

  const handleContinueLocal = () => {
    setIsDemo(false);
    setParticipantProfile({
      fullName: formData.fullName.trim() || 'Local User',
      participantId: formData.participantId.trim() || `LOCAL-${Date.now()}`,
      email: formData.email.trim(),
      authenticatedAt: new Date().toISOString(),
      participantToken: null,
      source: 'local_offline'
    });
    navigate('/game/1');
  };

  return (
    <div className="landing-v2">
      {/* Navigation */}
      <nav className="nav-header">
        <div className="nav-container">
          <div className="nav-logo" aria-label="Marca Krumm">
            <img src={logo} alt="Krumm - Tech for talent assessment" className="logo-img" />
          </div>
          <div className="nav-actions">
            <button className="nav-btn-secondary" onClick={() => navigate('/recruiter/login')}>
              Portal recruiter
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="hero-badge">🚀 La plataforma de evaluación cognitiva para HR moderna</div>
            <h1 className="hero-title">
              Decisiones de talento basadas en <span className="highlight">evidencia científica</span>
            </h1>
            <p className="hero-subtitle">
              Krumm combina neurocognición, UX moderna y análisis avanzado para medir capacidades reales.
              Selecciona y desarrolla con certeza.
            </p>

            <div className="hero-cta">
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                Ingresar al test
              </button>
              <button className="btn-secondary" onClick={handleStartDemo}>
                Ver demostración
              </button>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <span className="stat-value">98%</span>
                <span className="stat-label">Precisión de predictores</span>
              </div>
              <div className="stat">
                <span className="stat-value">14+</span>
                <span className="stat-label">Pruebas cientificamente validadas</span>
              </div>
              <div className="stat">
                <span className="stat-value">360°</span>
                <span className="stat-label">Telemetría conductual</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="visual-card gradient-1">
              <div className="card-icon">🧠</div>
              <div className="card-text">Memoria</div>
            </div>
            <div className="visual-card gradient-2">
              <div className="card-icon">🛑</div>
              <div className="card-text">Control</div>
            </div>
            <div className="visual-card gradient-3">
              <div className="card-icon">🔄</div>
              <div className="card-text">Flexibilidad</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Form Section (Floating) */}
      {showForm && (
        <motion.section
          className="form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="form-modal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button className="close-btn" onClick={() => setShowForm(false)}>✕</button>
            <h2>Accede a tu evaluación</h2>
            <p className="form-subtitle">Completa el formulario para iniciar tu batería cognitiva</p>

            <form className="assessment-form" onSubmit={handleStartAssessment}>
              <div className="form-group">
                <label>Nombre completo</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Tu nombre"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>ID de participante *</label>
                <input
                  type="text"
                  name="participantId"
                  placeholder="KRUMM-2026-001"
                  value={formData.participantId}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Correo electrónico *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Código de acceso *</label>
                <input
                  type="password"
                  name="accessCode"
                  placeholder="••••••••"
                  value={formData.accessCode}
                  onChange={handleChange}
                  required
                  minLength={4}
                />
              </div>

              {authError && <div className="form-error">{authError}</div>}

              <button type="submit" className="btn-primary full-width" disabled={isSubmitting}>
                {isSubmitting ? 'Validando...' : 'Comenzar evaluación'}
              </button>

              <div className="form-divider">O continúa sin validación</div>

              <button
                type="button"
                className="btn-secondary full-width"
                onClick={handleContinueLocal}
              >
                Continuar localmente
              </button>
            </form>
          </motion.div>
        </motion.section>
      )}

      {/* Features Section */}
      <section className="features">
        <div className="features-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>¿Por qué Krumm?</h2>
            <p>La primera plataforma de evaluación cognitiva diseñada para HR moderno</p>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {isDev && (
        <section className="dev-shortcuts" aria-label="Accesos de desarrollo">
          <div className="dev-shortcuts-container">
            <div className="section-header">
              <h2>Accesos rápidos de desarrollo</h2>
              <p>Entrar directo a un juego específico o al reporte final.</p>
            </div>
            <div className="dev-shortcuts-grid">
              {GAME_FLOW.map((game) => (
                <button
                  key={game.id}
                  className="dev-shortcut-button"
                  onClick={() => handleQuickGoToGame(game.path)}
                >
                  {`Ir a Juego ${game.id}`}
                </button>
              ))}
              <button className="dev-shortcut-button dev-shortcut-report" onClick={handleQuickGoToReport}>
                Ir al reporte final
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Assessment Tracks Section */}
      <section className="tracks">
        <div className="tracks-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Construcciones que medimos</h2>
            <p>Cada prueba evalúa un aspecto crítico del cognición</p>
          </motion.div>

          <div className="tracks-grid">
            {assessmentTracks.map((track, idx) => (
              <motion.div
                key={track.id}
                className="track-card"
                style={{ '--track-color': track.color }}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                viewport={{ once: true }}
              >
                <div className="track-header">
                  <span className="track-icon">{track.icon}</span>
                  <div>
                    <h3>{track.title}</h3>
                    <p className="track-subtitle">{track.description}</p>
                  </div>
                </div>
                <p className="track-detail">{track.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="process">
        <div className="process-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Cómo funciona</h2>
            <p>Tres pasos hacia decisiones de talento más inteligentes</p>
          </motion.div>

          <div className="process-timeline">
            {processSteps.map((step, idx) => (
              <motion.div
                key={idx}
                className="process-step"
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                viewport={{ once: true }}
              >
                <div className="step-number">{step.number}</div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                {idx < processSteps.length - 1 && <div className="step-arrow">→</div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="use-cases">
        <div className="use-cases-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Casos de uso</h2>
            <p>Soluciones para diferentes momentos en el ciclo de vida del talento</p>
          </motion.div>

          <div className="use-cases-grid">
            {useCases.map((useCase, idx) => (
              <motion.div
                key={idx}
                className="use-case-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="use-case-icon">{useCase.icon}</div>
                <h3>{useCase.title}</h3>
                <p>{useCase.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <motion.div
          className="cta-container"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2>¿Listo para mejorar tu proceso de selección?</h2>
          <p>Si eres recruiter, entra al panel para ver analítica consolidada de candidatos.</p>
          <button className="btn-primary btn-lg" onClick={() => navigate('/recruiter/login')}>
            Ir a login recruiter
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div>
              <h4>Krumm</h4>
              <p>Evaluación cognitiva moderna para HR</p>
            </div>
            <div>
              <p><strong>Seguridad:</strong> Encriptación E2E, GDPR/CCPA compliant</p>
              <p><strong>Ciencia:</strong> Basado en investigación psicométrica validada</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Krumm. Decisiones de talento con evidencia.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

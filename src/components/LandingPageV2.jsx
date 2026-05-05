import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Brain, 
  ChevronRight, 
  Clock, 
  Database, 
  Eye, 
  Fingerprint, 
  Globe, 
  Layers, 
  LineChart, 
  Lock, 
  ShieldCheck, 
  Target, 
  TrendingUp, 
  Zap 
} from 'lucide-react';
import { useTelemetry } from '../TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/logo.jpg';
import './LandingPageV2.css';

const assessmentTracks = [
  {
    icon: Brain,
    title: 'Memoria y cognición',
    detail: 'Evaluamos retención activa y procesamiento de información bajo carga de trabajo.',
    color: '#6366f1'
  },
  {
    icon: Eye,
    title: 'Atención y control',
    detail: 'Descubre tu precisión bajo presión y tu manera de gestionar impulsos.',
    color: '#ec4899'
  },
  {
    icon: Target,
    title: 'Adaptabilidad',
    detail: 'Medimos qué tan rápido ajustas tu estrategia ante cambios en las reglas del juego.',
    color: '#10b981'
  },
  {
    icon: Zap,
    title: 'Resiliencia operativa',
    detail: 'Conoce tu energía atencional, consistencia y resistencia a la fatiga.',
    color: '#f59e0b'
  }
];

const stats = [
  { label: 'Pruebas validadas', value: '14' },
  { label: 'Puntos de datos/seg', value: '250+' },
  { label: 'Precisión de IA', value: '94%' }
];

const LandingPageV2 = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { setIsDemo, setParticipantProfile } = useTelemetry();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleQuickStart = () => {
    setIsDemo(true);
    setParticipantProfile({
      fullName: 'Usuario Demo',
      participantId: 'DEMO-V2',
      email: 'demo@krumm.cl',
      authenticatedAt: new Date().toISOString(),
      source: 'landing_v2_quick'
    });
    navigate('/game/1');
  };

  return (
    <div className="v2-landing">
      {/* Navigation */}
      <nav className={`v2-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="v2-container">
          <div className="v2-nav-inner">
            <div className="v2-logo">
              <img src={logo} alt="Krumm" />
              <span>KRUMM</span>
            </div>
            
            <div className="v2-nav-actions">
              <div className="v2-lang-toggle">
                <button 
                  className={language === 'es' ? 'active' : ''} 
                  onClick={() => setLanguage('es')}
                >ES</button>
                <button 
                  className={language === 'en' ? 'active' : ''} 
                  onClick={() => setLanguage('en')}
                >EN</button>
              </div>
              <button className="v2-btn-login" onClick={() => navigate('/postulantes')}>
                {language === 'es' ? 'Acceso Candidatos' : 'Candidate Access'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="v2-hero">
        <div className="v2-container">
          <div className="v2-hero-content">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="v2-badge">
                <Fingerprint size={14} />
                <span>Next-Gen Talent Assessment</span>
              </span>
              <h1>
                Decisiones de talento basadas en <span className="highlight">evidencia científica</span>
              </h1>
              <p>
                Krumm transforma la psicometría tradicional en una experiencia gamificada de alta fidelidad. 
                Selecciona y desarrolla con certeza.
              </p>
              
              <div className="v2-hero-btns">
                <button className="v2-btn-primary" onClick={handleQuickStart}>
                  {language === 'es' ? 'Iniciar Evaluación' : 'Start Assessment'}
                  <ChevronRight size={18} />
                </button>
                <button className="v2-btn-secondary" onClick={() => navigate('/pitch')}>
                  {language === 'es' ? 'Ver Propuesta de Valor' : 'View Value Proposition'}
                </button>
              </div>
            </motion.div>

            <motion.div 
              className="v2-hero-stats"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {stats.map((stat, i) => (
                <div key={i} className="v2-stat-card">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
        
        {/* Abstract shapes */}
        <div className="v2-shape v2-shape-1" />
        <div className="v2-shape v2-shape-2" />
      </section>

      {/* Features Grid */}
      <section className="v2-features">
        <div className="v2-container">
          <div className="v2-section-header">
            <h2>Lo que evaluamos</h2>
            <p>Batería de misiones diseñadas para activar constructos cognitivos específicos.</p>
          </div>

          <div className="v2-tracks-grid">
            {assessmentTracks.map((track, i) => (
              <motion.div 
                key={i} 
                className="v2-track-card"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="v2-track-icon" style={{ backgroundColor: `${track.color}15`, color: track.color }}>
                  <track.icon size={24} />
                </div>
                <h3>{track.title}</h3>
                <p>{track.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Section */}
      <section className="v2-data">
        <div className="v2-container">
          <div className="v2-data-split">
            <div className="v2-data-copy">
              <h2>Telemetría en tiempo real</h2>
              <p>
                No solo miramos el resultado final. Capturamos el <strong>recorrido conductual</strong>: 
                tiempos de reacción, vacilaciones, patrones de búsqueda y precisión rítmica.
              </p>
              
              <ul className="v2-data-list">
                <li>
                  <ShieldCheck size={20} />
                  <div>
                    <strong>Privacidad Edge-AI</strong>
                    <span>Procesamiento local de señales sin extraer datos sensibles.</span>
                  </div>
                </li>
                <li>
                  <Database size={20} />
                  <div>
                    <strong>Evidencia Empírica</strong>
                    <span>Datos objetivos para eliminar sesgos en la selección.</span>
                  </div>
                </li>
                <li>
                  <LineChart size={20} />
                  <div>
                    <strong>Reportes Ejecutivos</strong>
                    <span>Sintetizamos miles de puntos de datos en señales claras para decidir.</span>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="v2-data-visual">
              <div className="v2-radar-mockup">
                <ResponsiveRadarMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="v2-steps">
        <div className="v2-container">
          <div className="v2-section-header">
            <h2>El flujo Krumm</h2>
            <p>Tres pasos hacia decisiones de talento más inteligentes</p>
          </div>

          <div className="v2-steps-row">
            <div className="v2-step">
              <div className="v2-step-num">01</div>
              <h4>Acceso</h4>
              <span>Validación de identidad y consentimiento de datos.</span>
            </div>
            <div className="v2-step">
              <div className="v2-step-num">02</div>
              <h4>Evaluación</h4>
              <span>14 retos gamificados con monitoreo de señales.</span>
            </div>
            <div className="v2-step">
              <div className="v2-step-num">03</div>
              <h4>Reporte</h4>
              <span>Análisis de IA con recomendaciones de puesto y desarrollo.</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="v2-footer">
        <div className="v2-container">
          <div className="v2-footer-inner">
            <h2>¿Listo para medir el potencial real?</h2>
            <p>Únete a las empresas que ya deciden con evidencia cognitiva.</p>
            <button className="v2-btn-white" onClick={() => window.location.href = 'mailto:contacto@krumm.cl'}>
              Contactar a un experto
            </button>
            
            <div className="v2-footer-bottom">
              <div className="v2-logo">
                <img src={logo} alt="Krumm" />
                <span>KRUMM</span>
              </div>
              <p>&copy; 2026 Krumm. Decisiones de talento con evidencia.</p>
              <div className="v2-footer-links">
                <a href="#">Privacidad</a>
                <a href="#">Términos</a>
                <a href="#">LinkedIn</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const ResponsiveRadarMockup = () => (
  <div className="radar-mockup">
    <div className="radar-circle radar-circle-1" />
    <div className="radar-circle radar-circle-2" />
    <div className="radar-circle radar-circle-3" />
    <div className="radar-line radar-line-1" />
    <div className="radar-line radar-line-2" />
    <div className="radar-line radar-line-3" />
    <div className="radar-polygon" />
    <div className="radar-dot" style={{ top: '20%', left: '50%' }} />
    <div className="radar-dot" style={{ top: '40%', left: '80%' }} />
    <div className="radar-dot" style={{ top: '75%', left: '70%' }} />
    <div className="radar-dot" style={{ top: '80%', left: '30%' }} />
    <div className="radar-dot" style={{ top: '45%', left: '15%' }} />
  </div>
);

export default LandingPageV2;

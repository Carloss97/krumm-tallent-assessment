import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, ArrowRight, Mail, RefreshCcw } from 'lucide-react';
import Report from '../Report';

const PostDemoScreen = ({ summary = null, onRestart }) => {
  const { language } = useLanguage();
  const [showFullReport, setShowReport] = useState(false);

  const copy = {
    es: {
      title: '¡Simulación Completada!',
      subtitle: 'Hemos analizado tu perfil conductual durante la demo.',
      viewReport: 'Ver Reporte de IA',
      restartButton: 'Reiniciar Demo',
      contactTitle: '¿Te interesa para tu organización?',
      contactBody: 'Obtén la batería completa de 14 juegos y análisis avanzado de Google Gemini.',
      emailUs: 'Contactar a Ventas',
      generating: 'Generando informe final...',
      timeUsed: 'Tiempo utilizado',
      coverage: 'Cobertura de datos',
    },
    en: {
      title: 'Simulation Completed!',
      subtitle: 'We have analyzed your behavioral profile during the demo.',
      viewReport: 'View AI Report',
      restartButton: 'Restart Demo',
      contactTitle: 'Interested for your organization?',
      contactBody: 'Get the full 14-game battery and advanced Google Gemini analysis.',
      emailUs: 'Contact Sales',
      generating: 'Generating final report...',
      timeUsed: 'Time used',
      coverage: 'Data coverage',
    }
  };

  const c = copy[language] || copy.es;

  if (!summary) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%' }} />
        <span style={{ marginLeft: 16, fontWeight: 600, color: '#64748b' }}>{c.generating}</span>
      </div>
    );
  }

  if (showFullReport) {
    return (
      <div className="full-report-overlay" style={{ height: '100vh', overflow: 'auto', background: '#f8fafc', position: 'relative', zIndex: 1000 }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 100, padding: '12px 24px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, color: '#1e1b4b' }}>KRUMM <span style={{ color: '#6366f1' }}>INSIGHTS</span></span>
          <button className="btn" onClick={onRestart} style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCcw size={16} /> {c.restartButton}
          </button>
        </div>
        <Report demoSummary={summary} />
      </div>
    );
  }

  return (
    <div className="post-demo-container" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px', overflow: 'hidden' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel"
        style={{ maxWidth: '800px', width: '100%', padding: '48px', textAlign: 'center', borderRadius: '32px' }}
      >
        <div style={{ width: '80px', height: '80px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle2 size={48} color="#10b981" />
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 850, color: '#1e1b4b', marginBottom: '12px', letterSpacing: '-0.02em' }}>{c.title}</h1>
        <p style={{ fontSize: '1.15rem', color: '#64748b', marginBottom: '40px' }}>{c.subtitle}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <div style={{ padding: '24px', background: '#ffffff', borderRadius: '20px', border: '1px solid #f1f5f9', textAlign: 'left' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{c.timeUsed}</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e1b4b' }}>{Math.floor(summary.timeUsedSec / 60)}m {summary.timeUsedSec % 60}s</div>
          </div>
          <div style={{ padding: '24px', background: '#ffffff', borderRadius: '20px', border: '1px solid #f1f5f9', textAlign: 'left' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{c.coverage}</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#6366f1' }}>{summary.telemetry?.captureCoverage}%</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '48px' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowReport(true)}
            style={{ padding: '20px 48px', fontSize: '1.1rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            {c.viewReport} <ArrowRight size={20} />
          </button>
        </div>

        <div style={{ paddingTop: '40px', borderTop: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e1b4b', marginBottom: '8px' }}>{c.contactTitle}</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px' }}>{c.contactBody}</p>
          <a 
            href="mailto:ventas@krumm.cl" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6366f1', fontWeight: 700, textDecoration: 'none', background: 'rgba(99,102,241,0.06)', padding: '10px 20px', borderRadius: '12px' }}
          >
            <Mail size={18} /> {c.emailUs}
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default PostDemoScreen;

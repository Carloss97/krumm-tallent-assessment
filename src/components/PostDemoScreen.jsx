import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, Mail, RefreshCcw, LockKeyhole, FileText } from 'lucide-react';
import './PostDemoScreen.css';

const formatTime = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}m ${remainder}s`;
};

const DUMMY_REPORT = {
  es: {
    candidate: 'Candidata Demo',
    role: 'Perfil referencial · Analista de Operaciones',
    fit: '82%',
    confidence: 'Alta',
    topSignals: ['Toma de riesgo calibrada', 'Ruteo espacial eficiente', 'Priorización bajo presión'],
    sections: [
      { title: 'Resumen ejecutivo', body: 'El perfil muestra buena adaptación a tareas dinámicas, con consistencia en planificación y tolerancia al riesgo moderada.' },
      { title: 'Fortalezas observadas', body: 'Ejecución ordenada, lectura rápida de restricciones y mejora progresiva cuando se introducen nuevas reglas.' },
      { title: 'Áreas a profundizar', body: 'Validar el desempeño con la batería completa, entrevistas estructuradas y comparación contra benchmarks del cargo.' },
    ],
  },
  en: {
    candidate: 'Demo Candidate',
    role: 'Reference profile · Operations Analyst',
    fit: '82%',
    confidence: 'High',
    topSignals: ['Calibrated risk taking', 'Efficient spatial routing', 'Prioritization under pressure'],
    sections: [
      { title: 'Executive summary', body: 'The profile shows good adaptation to dynamic tasks, consistent planning, and moderate risk tolerance.' },
      { title: 'Observed strengths', body: 'Structured execution, fast constraint reading, and progressive improvement as new rules are introduced.' },
      { title: 'Areas to deepen', body: 'Validate performance with the full battery, structured interviews, and role benchmark comparison.' },
    ],
  },
};

const PostDemoScreen = ({ summary = null, onRestart }) => {
  const { language } = useLanguage();

  const copy = {
    es: {
      title: '¡Simulación completada!',
      subtitle: 'Esta demo muestra la experiencia de juego. El informe real requiere la batería completa y validación del contexto del cargo.',
      lockedTitle: 'Reporte demo bloqueado',
      lockedBody: 'Este documento está blurreado y usa datos referenciales. Para recibir el reporte real con datos de una evaluación completa, contactarnos y armamos una demo guiada.',
      dummyNotice: 'Vista previa con datos referenciales',
      restartButton: 'Reiniciar demo',
      contactTitle: '¿Quieres ver el reporte real?',
      contactBody: 'Te mostramos la batería completa, benchmarks por cargo y el informe sin bloqueo para tu organización.',
      emailUs: 'Contactar a ventas',
      generating: 'Preparando vista demo...',
      timeUsed: 'Tiempo demo',
      completed: 'Módulos completados',
      fitLabel: 'Ajuste estimado',
      confidenceLabel: 'Confianza',
      signalsLabel: 'Señales destacadas',
    },
    en: {
      title: 'Simulation completed!',
      subtitle: 'This demo shows the game experience. The real report requires the full battery and role-context validation.',
      lockedTitle: 'Locked demo report',
      lockedBody: 'This document is blurred and uses reference data. To receive the real report from a full assessment, contact us and we will set up a guided demo.',
      dummyNotice: 'Preview with reference dummy data',
      restartButton: 'Restart demo',
      contactTitle: 'Want to see the real report?',
      contactBody: 'We will show the full battery, role benchmarks, and the unlocked report for your organization.',
      emailUs: 'Contact sales',
      generating: 'Preparing demo preview...',
      timeUsed: 'Demo time',
      completed: 'Modules completed',
      fitLabel: 'Estimated fit',
      confidenceLabel: 'Confidence',
      signalsLabel: 'Highlighted signals',
    }
  };

  const c = copy[language] || copy.es;
  const report = DUMMY_REPORT[language] || DUMMY_REPORT.es;

  if (!summary) {
    return (
      <div className="post-demo-loading">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="post-demo-spinner" />
        <span>{c.generating}</span>
      </div>
    );
  }

  return (
    <div className="post-demo-container">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="post-demo-shell"
      >
        <header className="post-demo-hero">
          <div className="post-demo-success-icon">
            <CheckCircle2 size={42} color="#10b981" />
          </div>
          <div>
            <p className="post-demo-eyebrow">KRUMM DEMO</p>
            <h1>{c.title}</h1>
            <p>{c.subtitle}</p>
          </div>
        </header>

        <div className="post-demo-content-grid">
          <aside className="post-demo-summary-card">
            <div className="summary-metric">
              <span>{c.timeUsed}</span>
              <strong>{formatTime(summary.timeUsedSec)}</strong>
            </div>
            <div className="summary-metric">
              <span>{c.completed}</span>
              <strong>{summary.completedCount || 0}/{summary.totalActivities || 0}</strong>
            </div>
            <div className="summary-metric accent">
              <span>{c.dummyNotice}</span>
              <strong>Dummy</strong>
            </div>

            <div className="post-demo-contact-card">
              <h2>{c.contactTitle}</h2>
              <p>{c.contactBody}</p>
              <a href="mailto:contacto@krumm.cl?subject=Quiero%20ver%20el%20reporte%20Krumm" className="post-demo-mail-link">
                <Mail size={18} /> {c.emailUs}
              </a>
              <button type="button" className="post-demo-restart" onClick={onRestart}>
                <RefreshCcw size={18} /> {c.restartButton}
              </button>
            </div>
          </aside>

          <article className="demo-report-preview" aria-label={c.lockedTitle}>
            <div className="report-lock-overlay">
              <div className="report-lock-badge">
                <LockKeyhole size={24} />
              </div>
              <h2>{c.lockedTitle}</h2>
              <p>{c.lockedBody}</p>
              <a href="mailto:contacto@krumm.cl?subject=Quiero%20el%20reporte%20real%20Krumm" className="report-lock-cta">
                {c.emailUs}
              </a>
            </div>

            <div className="demo-report-document" aria-hidden="true">
              <div className="report-document-header">
                <div>
                  <div className="report-brand"><FileText size={18} /> KRUMM INSIGHTS</div>
                  <h3>{report.candidate}</h3>
                  <p>{report.role}</p>
                </div>
                <div className="report-fit-pill">
                  <span>{c.fitLabel}</span>
                  <strong>{report.fit}</strong>
                </div>
              </div>

              <div className="report-metrics-row">
                <div>
                  <span>{c.confidenceLabel}</span>
                  <strong>{report.confidence}</strong>
                </div>
                <div>
                  <span>{c.completed}</span>
                  <strong>{summary.completedCount || 3}/3</strong>
                </div>
              </div>

              <section className="report-section">
                <h4>{c.signalsLabel}</h4>
                <ul>
                  {report.topSignals.map((signal) => <li key={signal}>{signal}</li>)}
                </ul>
              </section>

              {report.sections.map((section) => (
                <section className="report-section" key={section.title}>
                  <h4>{section.title}</h4>
                  <p>{section.body}</p>
                </section>
              ))}
            </div>
          </article>
        </div>
      </motion.section>
    </div>
  );
};

export default PostDemoScreen;

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, Mail, RefreshCcw, LockKeyhole, FileText, Radar, TrendingUp, Target, Brain } from 'lucide-react';
import './PostDemoScreen.css';

const formatTime = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}m ${remainder}s`;
};

// Game-specific fake data that looks coherent with what was just played
const GAME_RESULTS = {
  balloon: {
    icon: TrendingUp,
    label: { es: 'Toma de Riesgo', en: 'Risk Taking' },
    metrics: { es: '8 pumps promedio · 2 globos explotados', en: '8 avg pumps · 2 popped balloons' },
    score: 72,
  },
  grid: {
    icon: Brain,
    label: { es: 'Ruteo Espacial', en: 'Spatial Routing' },
    metrics: { es: '5 paquetes entregados · 62% energia remanente', en: '5 packages delivered · 62% energy remaining' },
    score: 78,
  },
  laser: {
    icon: Target,
    label: { es: 'Razonamiento Espacial', en: 'Spatial Reasoning' },
    metrics: { es: '3 niveles resueltos · 2.1s por colocacion', en: '3 levels solved · 2.1s per placement' },
    score: 85,
  },
};

// Simple SVG radar chart component
const RadarChart = ({ scores = {}, size = 160, language = 'es' }) => {
  const labels = {
    balloon: { es: 'Riesgo', en: 'Risk' },
    grid: { es: 'Ruteo', en: 'Routing' },
    laser: { es: 'Espacial', en: 'Spatial' },
  };

  const entries = Object.entries(scores);
  if (entries.length === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.4;
  const angleStep = (2 * Math.PI) / entries.length;

  // Offset by -90deg so the first point is at the top
  const getPoint = (index, value) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      labelX: cx + (radius + 20) * Math.cos(angle),
      labelY: cy + (radius + 20) * Math.sin(angle),
    };
  };

  // Grid circles
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridPoints = entries.map((_, i) => {
    const angle = angleStep * i - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });

  const dataPoints = entries.map(([, value], i) => getPoint(i, value));
  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {/* Grid */}
      {gridLevels.map((level, li) => {
        const pts = gridPoints.map(p => {
          const angle = angleStep * p._i - Math.PI / 2;
          const r = radius * level;
          return `${cx + r * Math.cos(angleStep * entries.indexOf(entries.find(() => true)) - Math.PI / 2)},${cy + r * Math.sin(0)}`;
        });
        // Actually draw proper polygons for grid
        const polyPts = gridPoints.map((_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const r = radius * level;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
        return (
          <g key={`grid-${li}`}>
            <polygon points={polyPts} fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </g>
        );
      })}
      {/* Axis lines */}
      {entries.map((_, i) => {
        const pt = getPoint(i, 100);
        return (
          <line key={`axis-${i}`} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#e2e8f0" strokeWidth="1" />
        );
      })}
      {/* Data polygon */}
      <motion.polygon
        points={polygonPoints}
        fill="rgba(99, 102, 241, 0.2)"
        stroke="#6366f1"
        strokeWidth="2"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {/* Data points */}
      {dataPoints.map((pt, i) => (
        <motion.circle
          key={`dot-${i}`}
          cx={pt.x}
          cy={pt.y}
          r="5"
          fill="#6366f1"
          stroke="#ffffff"
          strokeWidth="2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.1 }}
        />
      ))}
      {/* Labels */}
      {entries.map(([id], i) => {
        const pt = getPoint(i, 100);
        const lbl = labels[id]?.[language] || id;
        return (
          <text
            key={`lbl-${i}`}
            x={pt.labelX}
            y={pt.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#64748b"
            fontSize="10"
            fontWeight="700"
          >
            {lbl}
          </text>
        );
      })}
    </svg>
  );
};

const DUMMY_REPORT = {
  es: {
    candidate: 'Candidata Demo',
    role: 'Perfil referencial · Analista de Operaciones',
    fit: '82%',
    confidence: 'Alta',
    topSignals: ['Toma de riesgo calibrada', 'Ruteo espacial eficiente', 'Priorizacion bajo presion'],
    sections: [
      { title: 'Resumen ejecutivo', body: 'El perfil muestra buena adaptacion a tareas dinamicas, con consistencia en planificacion y tolerancia al riesgo moderada.' },
      { title: 'Fortalezas observadas', body: 'Ejecucion ordenada, lectura rapida de restricciones y mejora progresiva cuando se introducen nuevas reglas.' },
      { title: 'Areas a profundizar', body: 'Validar el desempeno con la bateria completa, entrevistas estructuradas y comparacion contra benchmarks del cargo.' },
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

// Check if we're in record mode
const isRecordMode = () => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('record') === 'true';
};

const PostDemoScreen = ({ summary = null, onRestart }) => {
  const { language } = useLanguage();
  const recordMode = isRecordMode();

  const copy = {
    es: {
      title: 'Simulacion completada!',
      subtitle: 'Esta demo muestra la experiencia de juego. El informe real requiere la bateria completa y validacion del contexto del cargo.',
      lockedTitle: 'Reporte demo bloqueado',
      lockedBody: 'Este documento esta blurreado y usa datos referenciales. Para recibir el reporte real de una evaluacion completa, contactarnos y armamos una demo guiada.',
      dummyNotice: 'Vista previa con datos referenciales',
      restartButton: 'Reiniciar demo',
      contactTitle: 'Quieres ver el reporte real?',
      contactBody: 'Te mostramos la bateria completa, benchmarks por cargo y el informe sin bloqueo para tu organizacion.',
      emailUs: 'Contactar a ventas',
      generating: 'Preparando vista demo...',
      timeUsed: 'Tiempo demo',
      completed: 'Modulos completados',
      fitLabel: 'Ajuste estimado',
      confidenceLabel: 'Confianza',
      signalsLabel: 'Senales destacadas',
      gameResults: 'Resultados por juego',
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
      gameResults: 'Results by game',
    }
  };

  const c = copy[language] || copy.es;
  const report = DUMMY_REPORT[language] || DUMMY_REPORT.es;

  // Build radar scores from the games that were completed
  const completedIds = summary?.completedIds || [];
  const radarScores = {};
  completedIds.forEach(id => {
    if (GAME_RESULTS[id]) {
      radarScores[id] = GAME_RESULTS[id].score;
    }
  });

  if (!summary) {
    return (
      <div className="post-demo-loading">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="post-demo-spinner" />
        <span>{c.generating}</span>
      </div>
    );
  }

  // In record mode, show an unlocked, clean report (no blur overlay)
  const renderReportDocument = () => (
    <div className="demo-report-document" aria-hidden={!recordMode ? "true" : undefined} style={recordMode ? { filter: 'none', transform: 'none', userSelect: 'auto', pointerEvents: 'auto' } : undefined}>
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

      {/* Radar chart section - only in record mode */}
      {recordMode && Object.keys(radarScores).length > 0 && (
        <motion.section
          className="report-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h4>
            <Radar size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            {c.gameResults}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <RadarChart scores={radarScores} size={180} language={language} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(GAME_RESULTS).filter(([id]) => completedIds.includes(id)).map(([id, game]) => {
                const Icon = game.icon;
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569' }}>
                    <Icon size={14} color="#6366f1" />
                    <strong>{game.label[language] || game.label.es}:</strong>
                    <span>{game.score}/100</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {/* Per-game detail cards */}
      {recordMode && completedIds.map((id, idx) => {
        const game = GAME_RESULTS[id];
        if (!game) return null;
        const Icon = game.icon;
        return (
          <motion.section
            className="report-section"
            key={id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + idx * 0.1 }}
          >
            <h4><Icon size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />{game.label[language] || game.label.es}</h4>
            <p>{game.metrics[language] || game.metrics.es}</p>
          </motion.section>
        );
      })}

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
  );

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
            <p className="post-demo-eyebrow">KRUMM DEMO{recordMode ? ' · REC' : ''}</p>
            <h1>{c.title}</h1>
            <p>{c.subtitle}</p>
          </div>
        </header>

        {recordMode ? (
          /* Record mode: full-width clean report, no lock overlay */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="summary-metric" style={{ flex: 1, minWidth: 140 }}>
                <span>{c.timeUsed}</span>
                <strong>{formatTime(summary.timeUsedSec)}</strong>
              </div>
              <div className="summary-metric" style={{ flex: 1, minWidth: 140 }}>
                <span>{c.completed}</span>
                <strong>{summary.completedCount || 0}/{summary.totalActivities || 0}</strong>
              </div>
              <div className="summary-metric accent" style={{ flex: 1, minWidth: 140 }}>
                <span>{c.dummyNotice}</span>
                <strong>Demo</strong>
              </div>
            </div>

            <article className="demo-report-preview" style={{ minHeight: 'auto' }}>
              {renderReportDocument()}
            </article>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="mailto:contacto@krumm.cl?subject=Quiero%20ver%20el%20reporte%20Krumm" className="post-demo-mail-link" style={{ flex: '0 0 auto', padding: '0 32px' }}>
                <Mail size={18} /> {c.emailUs}
              </a>
              <button type="button" className="post-demo-restart" onClick={onRestart} style={{ flex: '0 0 auto', padding: '0 24px' }}>
                <RefreshCcw size={18} /> {c.restartButton}
              </button>
            </div>
          </div>
        ) : (
          /* Normal mode: sidebar + locked blurred report */
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
              {renderReportDocument()}
            </article>
          </div>
        )}
      </motion.section>
    </div>
  );
};

export default PostDemoScreen;
import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const PostDemoScreen = ({ summary = null, onRestart }) => {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');

  const copy = {
    es: {
      title: 'Informe de demo',
      preview: 'Resumen de la demo corta (3 juegos)',
      placeholder: 'Informe generado con telemetria y biometria local',
      heading: 'A partir de esta demo estimamos capacidades en:',
      skills: ['Toma de riesgos', 'Razonamiento espacial', 'Planificacion estrategica'],
      muted: 'El informe se genera localmente con las senales capturadas durante la demo. Si te interesa este sistema para tu empresa, contáctanos.',
      contactLabel: 'Dejanos tu correo para contactarte',
      contactButton: 'Contactar',
      restartButton: 'Probar otra demo',
      subject: 'Interés en sistema de demo',
      bodyPrefix: 'Me interesa el sistema.',
      statusCompleted: 'Completado',
      statusPending: 'No completado',
      summaryTitle: 'Resumen',
      completedLabel: 'Completados',
      selectedLabel: 'Seleccionados',
      durationLabel: 'Duración',
      reasonTimeout: 'Finalizada por tiempo',
      reasonCompleted: 'Finalizada por completar actividades',
      telemetryTitle: 'Telemetria y biometria usadas en el informe',
      timelineTitle: 'Linea temporal por juego',
      captureCoverage: 'Cobertura de captura',
      confidenceLabel: 'Confianza inferencial',
      reliabilityLabel: 'Fiabilidad local',
      durationScoreLabel: 'Ajuste temporal',
      attentionLabel: 'Estabilidad atencional',
      fatigueLabel: 'Fatiga cognitiva',
      stabilityLabel: 'Estabilidad local',
      readinessLabel: 'Readiness local',
      webcamQualityLabel: 'Calidad webcam',
      signalsTitle: 'Senales de calidad',
      noSignals: 'Sin alertas relevantes de calidad.'
    },
    en: {
      title: 'Demo Report',
      preview: 'Short demo summary (3 games)',
      placeholder: 'Report generated with local telemetry and biometrics',
      heading: 'From this demo we estimate strengths in:',
      skills: ['Risk taking', 'Spatial reasoning', 'Strategic planning'],
      muted: 'The report is generated locally with signals captured during the demo. If you are interested in this system for your organization, contact us.',
      contactLabel: 'Leave your email to be contacted',
      contactButton: 'Contact',
      restartButton: 'Try another demo',
      subject: 'Interest in demo system',
      bodyPrefix: 'I am interested in the system.',
      statusCompleted: 'Completed',
      statusPending: 'Not completed',
      summaryTitle: 'Summary',
      completedLabel: 'Completed',
      selectedLabel: 'Selected',
      durationLabel: 'Duration',
      reasonTimeout: 'Finished due to time limit',
      reasonCompleted: 'Finished after completing activities',
      telemetryTitle: 'Telemetry and biometrics used in the report',
      timelineTitle: 'Game timeline',
      captureCoverage: 'Capture coverage',
      confidenceLabel: 'Inference confidence',
      reliabilityLabel: 'Local reliability',
      durationScoreLabel: 'Time fit',
      attentionLabel: 'Attention stability',
      fatigueLabel: 'Cognitive fatigue',
      stabilityLabel: 'Local stability',
      readinessLabel: 'Local readiness',
      webcamQualityLabel: 'Webcam quality',
      signalsTitle: 'Quality signals',
      noSignals: 'No relevant quality alerts detected.'
    }
  };

  const c = copy[language] || copy.es;

  const reasonLabel = summary?.reason === 'timeout' ? c.reasonTimeout : c.reasonCompleted;

  const contactHref = () => {
    const to = 'info@example.com';
    const subject = encodeURIComponent(c.subject);
    const body = encodeURIComponent(email ? `${c.bodyPrefix} My email: ${email}` : c.bodyPrefix);
    return `mailto:${to}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="post-demo-screen">
      <div className="report-blur">
        <div className="report-card">
          <h2>{c.title}</h2>
          <p>{c.preview}</p>
          <div className="report-placeholder">{c.placeholder}</div>
          {summary && (
            <div style={{ marginTop: 16, textAlign: 'left', width: '90%' }}>
              <h4 style={{ marginBottom: 8 }}>{c.summaryTitle}</h4>
              <div>{c.completedLabel}: <strong>{summary.completedCount}</strong> / {summary.totalActivities}</div>
              <div>{c.durationLabel}: <strong>{Math.floor((summary.timeUsedSec || 0) / 60)}:{String((summary.timeUsedSec || 0) % 60).padStart(2, '0')}</strong></div>
              <div style={{ marginTop: 6, color: '#475569' }}>{reasonLabel}</div>
            </div>
          )}
        </div>
      </div>

      <div className="post-demo-panel">
        <h3>{c.heading}</h3>
        <ul>
          {c.skills.map(s => <li key={s}>{s}</li>)}
        </ul>
        <p className="muted">{c.muted}</p>

        {summary?.telemetry && (
          <div style={{ marginTop: 14 }}>
            <h4 style={{ marginBottom: 8 }}>{c.telemetryTitle}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
              <div>{c.captureCoverage}: <strong>{summary.telemetry.captureCoverage}%</strong></div>
              <div>{c.confidenceLabel}: <strong>{summary.telemetry.avgConfidence}%</strong></div>
              <div>{c.reliabilityLabel}: <strong>{summary.telemetry.avgReliability}%</strong></div>
              <div>{c.attentionLabel}: <strong>{summary.telemetry.attentionStability}%</strong></div>
              <div>{c.fatigueLabel}: <strong>{summary.telemetry.avgFatigue}%</strong></div>
              <div>{c.stabilityLabel}: <strong>{summary.telemetry.avgStability}%</strong></div>
              <div>{c.readinessLabel}: <strong>{summary.telemetry.avgReadiness}%</strong></div>
              <div>{c.webcamQualityLabel}: <strong>{summary.telemetry.avgWebcamQuality}%</strong></div>
            </div>

            <div style={{ marginTop: 10 }}>
              <h5 style={{ marginBottom: 6 }}>{c.signalsTitle}</h5>
              {Array.isArray(summary.telemetry.signals) && summary.telemetry.signals.length > 0 ? (
                <ul style={{ marginLeft: 18 }}>
                  {summary.telemetry.signals.map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, color: '#475569' }}>{c.noSignals}</p>
              )}
            </div>
          </div>
        )}

        {Array.isArray(summary?.activities) && summary.activities.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 10 }}>{c.timelineTitle}</h4>
            <div style={{ display: 'grid', gap: 12 }}>
              {summary.activities.map((activity) => {
                const analytics = activity.analytics;
                const activityName = typeof activity.title === 'object'
                  ? (activity.title[language] || activity.title.es)
                  : activity.title;
                const confidence = analytics?.confidence || 0;
                const durationScore = analytics?.durationTargetScore || 0;
                const statusColor = analytics?.status === 'completed' ? '#059669' : '#b45309';
                return (
                  <div
                    key={`${activity.id}-timeline`}
                    style={{
                      padding: '12px 14px',
                      background: '#ffffff',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                      <div>
                        <strong>{activity.order}. {activityName}</strong>
                        <div style={{ color: '#64748b', fontSize: 12 }}>{c.durationLabel}: {activity.est}s</div>
                      </div>
                      <span style={{ color: statusColor, fontWeight: 700 }}>
                        {analytics?.status === 'completed' ? c.statusCompleted : c.statusPending}
                      </span>
                    </div>

                    <div style={{ height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ width: `${confidence}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%)' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, color: '#475569', flexWrap: 'wrap' }}>
                      <span>{c.confidenceLabel}: <strong>{confidence}%</strong></span>
                      <span>{c.durationScoreLabel}: <strong>{durationScore}%</strong></span>
                      <span>{c.captureCoverage}: <strong>{analytics?.gameCoverage || 0}%</strong></span>
                      <span>{c.reliabilityLabel}: <strong>{analytics?.reliability || 0}%</strong></span>
                      <span>{c.readinessLabel}: <strong>{analytics?.readinessScore || 0}%</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {Array.isArray(summary?.activities) && summary.activities.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <h4 style={{ marginBottom: 8 }}>{c.selectedLabel}</h4>
            <ul style={{ marginLeft: 0, paddingLeft: 0, listStyle: 'none' }}>
              {summary.activities.map((activity) => {
                const activityName = typeof activity.title === 'object'
                  ? (activity.title[language] || activity.title.es)
                  : activity.title;
                const isDone = activity.status === 'completed';
                return (
                  <li
                    key={activity.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 0',
                      borderBottom: '1px solid #e2e8f0'
                    }}
                  >
                    <span>{activity.order}. {activityName}</span>
                    <span style={{ color: isDone ? '#059669' : '#b45309', fontWeight: 600 }}>
                      {isDone ? c.statusCompleted : c.statusPending}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {Array.isArray(summary?.activities) && summary.activities.some((activity) => activity.analytics) && (
          <div style={{ marginTop: 14 }}>
            <h4 style={{ marginBottom: 8 }}>{c.telemetryTitle}</h4>
            <div style={{ display: 'grid', gap: 10 }}>
              {summary.activities.map((activity) => {
                const analytics = activity.analytics;
                if (!analytics) return null;
                const activityName = typeof activity.title === 'object'
                  ? (activity.title[language] || activity.title.es)
                  : activity.title;
                return (
                  <div key={`${activity.id}-analytics`} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                      <strong>{activity.order}. {activityName}</strong>
                      <span style={{ color: analytics.status === 'completed' ? '#059669' : '#b45309' }}>
                        {analytics.status === 'completed' ? c.statusCompleted : c.statusPending}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, fontSize: 13, color: '#334155' }}>
                      <div>{c.captureCoverage}: <strong>{analytics.gameCoverage}%</strong></div>
                      <div>{c.confidenceLabel}: <strong>{analytics.confidence}%</strong></div>
                      <div>{c.reliabilityLabel}: <strong>{analytics.reliability}%</strong></div>
                      <div>{c.fatigueLabel}: <strong>{analytics.fatigueScore}%</strong></div>
                      <div>{c.readinessLabel}: <strong>{analytics.readinessScore}%</strong></div>
                      <div>{c.durationLabel}: <strong>{analytics.durationSec}s</strong></div>
                      <div>{c.durationScoreLabel}: <strong>{analytics.durationTargetScore}%</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="contact-box">
          <label style={{ display: 'block', marginBottom: 8 }}>{c.contactLabel}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input aria-label={c.contactLabel} placeholder="tu@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <a className="btn" href={contactHref()}>{c.contactButton}</a>
          </div>
        </div>

        {typeof onRestart === 'function' && (
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={onRestart}>{c.restartButton}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDemoScreen;

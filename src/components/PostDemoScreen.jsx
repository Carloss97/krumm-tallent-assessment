import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const PostDemoScreen = ({ completedIds = [], summary = null, onRestart }) => {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');

  const copy = {
    es: {
      title: 'Informe de demo',
      preview: 'Resumen de la demo ejecutada',
      placeholder: 'Estado por juego y cobertura de sesión',
      heading: 'A partir de esta sesión podemos estimar capacidades en:',
      skills: ['Atención', 'Memoria de trabajo', 'Velocidad de procesamiento', 'Flexibilidad cognitiva', 'Control de impulsos'],
      muted: 'Actualmente estamos en fase de desarrollo. Si te interesa este sistema para tu empresa, contáctanos.',
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
      reasonCompleted: 'Finalizada por completar actividades'
    },
    en: {
      title: 'Demo Report',
      preview: 'Summary of your completed demo',
      placeholder: 'Game-by-game status and session coverage',
      heading: 'From this session we can estimate skills in:',
      skills: ['Attention', 'Working memory', 'Processing speed', 'Cognitive flexibility', 'Impulse control'],
      muted: 'We are currently in development. If you are interested in this system for your organization, contact us.',
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
      reasonCompleted: 'Finished after completing activities'
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

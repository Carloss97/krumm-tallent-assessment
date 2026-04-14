import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const PostDemoScreen = ({ completedIds = [] }) => {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');

  const copy = {
    es: {
      title: 'Informe provisional',
      preview: 'Vista previa difuminada del informe.',
      placeholder: '[ Informe completo disponible tras registro ]',
      heading: 'A partir de este pequeño podemos medir tus capacidades en:',
      skills: ['Atención', 'Memoria de trabajo', 'Velocidad de procesamiento', 'Flexibilidad cognitiva', 'Control de impulsos'],
      muted: 'Actualmente estamos en fase de desarrollo. Si te interesa este sistema para tu empresa, contáctanos.',
      contactLabel: 'Dejanos tu correo para contactarte',
      contactButton: 'Contactar',
      subject: 'Interés en sistema de demo',
      bodyPrefix: 'Me interesa el sistema.'
    },
    en: {
      title: 'Preliminary report',
      preview: 'Blurred preview of the report.',
      placeholder: '[ Full report available after sign-up ]',
      heading: "From this short session we can estimate your skills in:",
      skills: ['Attention', 'Working memory', 'Processing speed', 'Cognitive flexibility', 'Impulse control'],
      muted: 'We are currently in development. If you are interested in this system for your organization, contact us.',
      contactLabel: 'Leave your email to be contacted',
      contactButton: 'Contact',
      subject: 'Interest in demo system',
      bodyPrefix: 'I am interested in the system.'
    }
  };

  const c = copy[language] || copy.es;

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
        </div>
      </div>

      <div className="post-demo-panel">
        <h3>{c.heading}</h3>
        <ul>
          {c.skills.map(s => <li key={s}>{s}</li>)}
        </ul>
        <p className="muted">{c.muted}</p>

        <div className="contact-box">
          <label style={{ display: 'block', marginBottom: 8 }}>{c.contactLabel}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input aria-label={c.contactLabel} placeholder="tu@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <a className="btn" href={contactHref()}>{c.contactButton}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDemoScreen;

import React, { useState } from 'react';

const PostDemoScreen = ({ completedIds = [] }) => {
  const [email, setEmail] = useState('');
  const skills = ['Atención', 'Memoria de trabajo', 'Velocidad de procesamiento', 'Flexibilidad cognitiva', 'Control de impulsos'];

  const contactHref = () => {
    const to = 'info@example.com';
    const subject = encodeURIComponent('Interés en sistema de demo');
    const body = encodeURIComponent(email ? `Me interesa el sistema. Mi correo: ${email}` : 'Me interesa el sistema.');
    return `mailto:${to}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="post-demo-screen">
      <div className="report-blur">
        <div className="report-card">
          <h2>Informe provisional</h2>
          <p>Vista previa difuminada del informe.</p>
          <div className="report-placeholder">[ Informe completo disponible tras registro ]</div>
        </div>
      </div>

      <div className="post-demo-panel">
        <h3>A partir de este pequeño podemos medir tus capacidades en:</h3>
        <ul>
          {skills.map(s => <li key={s}>{s}</li>)}
        </ul>
        <p className="muted">Actualmente estamos en fase de desarrollo. Si te interesa este sistema para tu empresa, contáctanos.</p>

        <div className="contact-box">
          <label style={{ display: 'block', marginBottom: 8 }}>Dejanos tu correo para contactarte</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input aria-label="Tu correo" placeholder="tu@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <a className="btn" href={contactHref()}>Contactar</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDemoScreen;

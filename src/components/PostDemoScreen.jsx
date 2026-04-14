import React from 'react';

const PostDemoScreen = ({ completedIds = [] }) => {
  const skills = ['Atención', 'Memoria de trabajo', 'Velocidad de procesamiento', 'Flexibilidad cognitiva', 'Control de impulsos'];
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
          <a className="btn" href="mailto:info@example.com?subject=Interés%20en%20sistema">Contactar</a>
        </div>
      </div>
    </div>
  );
};

export default PostDemoScreen;

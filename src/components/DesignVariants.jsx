import React from 'react';
import './DesignVariants.css';

const VariantCard = ({ title, children }) => (
  <article className="dv-card">
    <h4 className="dv-title">{title}</h4>
    <div className="dv-body">{children}</div>
  </article>
);

const DesignVariants = () => {
  return (
    <section className="dv-section" aria-label="Design variants preview">
      <h3>Design Variants Preview</h3>
      <div className="dv-grid">
        <VariantCard title="1 — Palette per section">
          <div className="dv-palette">
            <div className="dv-band a">Hero (accent)</div>
            <div className="dv-band b">Section A</div>
            <div className="dv-band c">Section B</div>
          </div>
        </VariantCard>

        <VariantCard title="2 — Collapsible panels">
          <div className="dv-collapse">
            <details open>
              <summary>Overview</summary>
              <div>Short intro content...</div>
            </details>
            <details>
              <summary>Details</summary>
              <div>Hidden content revealed</div>
            </details>
          </div>
        </VariantCard>

        <VariantCard title="3 — Single page + big CTA">
          <div className="dv-single">
            <div className="dv-hero">Hacer test ya</div>
            <div className="dv-demo">Demo • 3 actividades</div>
          </div>
        </VariantCard>
      </div>
    </section>
  );
};

export default DesignVariants;

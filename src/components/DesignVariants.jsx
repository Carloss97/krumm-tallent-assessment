import React from 'react';
import { useVariant } from '../contexts/VariantContext';
import './DesignVariants.css';

const VariantCard = ({ title, children, variantKey, current, onApply }) => (
  <article className="dv-card">
    <h4 className="dv-title">{title}</h4>
    <div className="dv-body">{children}</div>
    <div className="dv-actions">
      <button type="button" className={`dv-apply ${current ? 'applied' : ''}`} onClick={() => onApply(variantKey)}>
        {current ? 'Applied' : 'Apply variant'}
      </button>
    </div>
  </article>
);

const DesignVariants = () => {
  const { variant, setVariant } = useVariant();
  const apply = (v) => setVariant(v);

  return (
    <section className="dv-section" aria-label="Design variants preview">
      <h3>Design Variants Preview</h3>
      <div className="dv-grid">
        <VariantCard title="1 — Palette per section" variantKey="a" current={variant === 'a'} onApply={apply}>
          <div className="dv-palette">
            <div className="dv-band a">Hero (accent)</div>
            <div className="dv-band b">Section A</div>
            <div className="dv-band c">Section B</div>
          </div>
        </VariantCard>

        <VariantCard title="2 — Collapsible panels" variantKey="b" current={variant === 'b'} onApply={apply}>
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

        <VariantCard title="3 — Single page + big CTA" variantKey="c" current={variant === 'c'} onApply={apply}>
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

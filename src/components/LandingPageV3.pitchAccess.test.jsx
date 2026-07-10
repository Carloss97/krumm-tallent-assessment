import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('landing pitch access', () => {
  it('does not expose a visible pitch CTA from the landing page', () => {
    const landing = fs.readFileSync('src/components/LandingPageV3.jsx', 'utf8');

    expect(landing).not.toContain('lv3-action-pitch');
    expect(landing).not.toContain('cta_pitch_clicked');
    expect(landing).not.toContain("navigate('/pitch')");
  });

  it('keeps the direct /pitch route available', () => {
    const app = fs.readFileSync('src/App.jsx', 'utf8');

    expect(app).toContain('path="/pitch"');
    expect(app).toContain('<PitchDeckPage />');
  });
});

import { describe, expect, it } from 'vitest';
import { shouldEnableAppScroll } from './appScrollRoutes';

describe('shouldEnableAppScroll', () => {
  it('keeps long content routes scrollable, including dev camera diagnostics', () => {
    expect(shouldEnableAppScroll('/')).toBe(true);
    expect(shouldEnableAppScroll('/intro')).toBe(true);
    expect(shouldEnableAppScroll('/complementary/intro')).toBe(true);
    expect(shouldEnableAppScroll('/report')).toBe(true);
    expect(shouldEnableAppScroll('/dev/camera')).toBe(true);
    expect(shouldEnableAppScroll('/dev/report')).toBe(true);
  });

  it('keeps game/demo routes clipped to the shell when they manage their own viewport', () => {
    expect(shouldEnableAppScroll('/game/1')).toBe(false);
    expect(shouldEnableAppScroll('/demo')).toBe(false);
    expect(shouldEnableAppScroll('/future/lab')).toBe(false);
    expect(shouldEnableAppScroll(null)).toBe(false);
  });
});

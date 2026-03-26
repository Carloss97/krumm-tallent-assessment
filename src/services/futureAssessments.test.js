import { describe, it, expect } from 'vitest';
import {
  evaluateMetacognitiveCalibration,
  evaluateOperationalPrioritization,
  evaluateLearningAgility,
} from './futureAssessments';

describe('futureAssessments', () => {
  it('scores metacognitive calibration with aligned confidence', () => {
    const result = evaluateMetacognitiveCalibration([
      { confidence: 80, correct: true },
      { confidence: 20, correct: false },
      { confidence: 75, correct: true },
    ]);

    expect(result.score).toBeGreaterThan(65);
    expect(result.label).toContain('CALIBRATION');
  });

  it('scores operational prioritization from task alignment and deadlines', () => {
    const result = evaluateOperationalPrioritization([
      { expectedPriority: 'high', assignedPriority: 'high', completedWithinMs: 4000, deadlineMs: 5000 },
      { expectedPriority: 'low', assignedPriority: 'low', completedWithinMs: 3500, deadlineMs: 6000 },
      { expectedPriority: 'medium', assignedPriority: 'low', completedWithinMs: 7500, deadlineMs: 6000 },
    ]);

    expect(result.score).toBeGreaterThan(45);
    expect(result.priorityAccuracy).toBeGreaterThan(50);
  });

  it('scores learning agility from improvement and adaptation latency', () => {
    const result = evaluateLearningAgility([
      { accuracy: 52, adaptationMs: 2400 },
      { accuracy: 61, adaptationMs: 2000 },
      { accuracy: 68, adaptationMs: 1700 },
      { accuracy: 77, adaptationMs: 1500 },
    ]);

    expect(result.score).toBeGreaterThan(55);
    expect(result.improvementRate).toBeGreaterThan(10);
  });
});

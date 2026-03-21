import { vi } from 'vitest';
import { generateAIReport, generateHeuristicReport } from './aiReportService';

// Mock the Google Generative AI to avoid real API calls
vi.mock('@google/generative-ai', () => {
  const mockGenerateContent = vi.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify({
        summary: 'Mock AI summary',
        strengths: ['Mock strength'],
        areasToMonitor: ['Mock area'],
        careerRecommendations: [{ role: 'Mock Role', fit: 'Good fit' }],
        confidenceScore: 80,
        recommendation: 'HIGHLY RECOMMEND'
      })
    }
  });

  class MockGoogleGenerativeAI {
    getGenerativeModel() {
      return {
        generateContent: mockGenerateContent
      };
    }
  }

  return {
    GoogleGenerativeAI: MockGoogleGenerativeAI
  };
});
const mockSessionData = {
  game1: {
    score: 12,
    errors: 2,
    duration: 45000,
  },
  game2: {
    score: 18,
    errors: 3,
    duration: 25000,
  },
  game3: {
    score: 4,
    errors: 1,
    duration: 32000,
  },
  game4: {
    score: 245,
    errors: 1,
    duration: 120000,
  },
  game5: {
    score: 2850,
    errors: 0,
    duration: 35000,
    avgReactionTime: 320,
    falseStarts: 0,
  },
  game6: {
    score: 420,
    errors: 2,
    gridScore: 420,
    quizScore: 2,
    duration: 45000,
  },
  game7: {
    score: 85,
    errors: 1,
    efficiency: 85,
    duration: 60000,
  },
};

describe('AI Report Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAIReport', () => {
    it('should return valid AI report when API succeeds', async () => {
      const result = await generateAIReport(mockSessionData);
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('recommendation');
      expect(result.source).toBe('gemini');
    });
  });

  describe('generateHeuristicReport', () => {
    it('should generate a heuristic report with correct structure', () => {
      const result = generateHeuristicReport(mockSessionData);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('areasToMonitor');
      expect(result).toHaveProperty('careerRecommendations');
      expect(result).toHaveProperty('confidenceScore');
      expect(result).toHaveProperty('recommendation');
      expect(result.source).toBe('heuristic');
      expect(result).toHaveProperty('generatedAt');
    });

    it('should recommend "HIGHLY RECOMMEND" for strong performance', () => {
      const strongData = {
        game1: { score: 15, errors: 0 },
        game2: { score: 20, errors: 1 },
        game3: { score: 5, errors: 0 },
        game4: { score: 300, errors: 0 },
        game5: { score: 3000, errors: 0, avgReactionTime: 250, falseStarts: 0 },
        game6: { score: 500, errors: 0, gridScore: 500, quizScore: 3 },
        game7: { score: 95, errors: 0, efficiency: 95 }
      };

      const result = generateHeuristicReport(strongData);
      expect(result.recommendation).toBe('HIGHLY RECOMMEND');
    });

    it('should include appropriate strengths based on performance', () => {
      const result = generateHeuristicReport(mockSessionData);
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.strengths).toContain('Strong cognitive flexibility');
    });
  });
});

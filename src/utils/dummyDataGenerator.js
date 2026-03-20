// Dummy data generator for testing the report system with all 14 games
export const generateDummyReportData = () => {
  const games = [
    {
      id: 'game1',
      name: 'Color Word Game',
      score: 850,
      errors: 3,
      metrics: {
        totalCorrect: 42,
        totalErrors: 3,
        avgReactionTime: 1200,
        stressLevel: 2.1
      }
    },
    {
      id: 'game2',
      name: 'Frustration Game',
      score: 720,
      errors: 8,
      metrics: {
        totalCorrect: 36,
        totalErrors: 8,
        avgReactionTime: 950,
        frustrationTolerance: 3.2
      }
    },
    {
      id: 'game3',
      name: 'Memory Game',
      score: 680,
      errors: 5,
      metrics: {
        totalCorrect: 34,
        totalErrors: 5,
        avgReactionTime: 1800,
        memorySpan: 6
      }
    },
    {
      id: 'game4',
      name: 'Balloon Game',
      score: 590,
      errors: 12,
      metrics: {
        totalCorrect: 28,
        totalErrors: 12,
        avgReactionTime: 2100,
        riskStrategy: 2.8
      }
    },
    {
      id: 'game5',
      name: 'Vigilance Game',
      score: 780,
      errors: 4,
      metrics: {
        totalCorrect: 38,
        totalErrors: 4,
        avgReactionTime: 450,
        attentionSpan: 4.5
      }
    },
    {
      id: 'game6',
      name: 'Grid Optimizer',
      score: 650,
      errors: 7,
      metrics: {
        totalCorrect: 32,
        totalErrors: 7,
        avgReactionTime: 3200,
        planningAbility: 3.8
      }
    },
    {
      id: 'game7',
      name: 'Laser Puzzle',
      score: 710,
      errors: 6,
      metrics: {
        totalCorrect: 35,
        totalErrors: 6,
        avgReactionTime: 2800,
        spatialReasoning: 4.1
      }
    },
    {
      id: 'game8',
      name: 'N-Back Task',
      score: 620,
      errors: 9,
      metrics: {
        totalCorrect: 31,
        totalErrors: 9,
        avgReactionTime: 1600,
        nBackLevel: 2
      }
    },
    {
      id: 'game9',
      name: 'Tower of London',
      score: 580,
      errors: 11,
      metrics: {
        problemsCompleted: 4,
        totalMoves: 18,
        avgTimePerProblem: 4500,
        efficiency: 3.2
      }
    },
    {
      id: 'game10',
      name: 'Wisconsin Card Sorting',
      score: 690,
      errors: 6,
      metrics: {
        categoriesCompleted: 5,
        totalCorrect: 33,
        totalErrors: 6,
        perseverativeErrors: 2,
        avgReactionTime: 2200
      }
    },
    {
      id: 'game11',
      name: 'Go/No-Go Task',
      score: 740,
      errors: 5,
      metrics: {
        goAccuracy: 88,
        noGoAccuracy: 92,
        commissionErrors: 3,
        omissionErrors: 2,
        avgReactionTime: 380,
        totalTrials: 50
      }
    },
    {
      id: 'game12',
      name: 'Trail Making Test',
      score: 670,
      errors: 7,
      metrics: {
        partATime: 32000,
        partBTime: 45000,
        totalTime: 77000,
        avgTime: 38500,
        totalErrors: 7
      }
    },
    {
      id: 'game13',
      name: 'Corsi Block Tapping',
      score: 630,
      errors: 8,
      metrics: {
        maxSequenceLength: 6,
        finalLevel: 6,
        accuracy: 78,
        totalCorrect: 31,
        totalTrials: 40
      }
    },
    {
      id: 'game14',
      name: 'Mental Rotation',
      score: 700,
      errors: 6,
      metrics: {
        accuracy: 84,
        totalCorrect: 25,
        totalTrials: 30,
        avgReactionTime: 2900
      }
    }
  ];

  return games;
};

// Function to simulate adding dummy data to telemetry context
export const populateDummyData = (telemetryContext) => {
  const dummyData = generateDummyReportData();

  // Simulate the telemetry data structure
  dummyData.forEach(game => {
    // This would normally be called during actual gameplay
    telemetryContext.recordGameData(game.id, game.score, game.errors, game.metrics);
  });

  return dummyData;
};
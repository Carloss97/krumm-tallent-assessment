import { generateAIReport, generateHeuristicReport } from './aiReportService';

/**
 * Mock test data - simulates a complete assessment session
 */
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

/**
 * Test the AI report generation
 */
export async function testAIReportGeneration() {
  console.log('🧪 Testing AI Report Generation...\n');

  try {
    console.log('📋 Mock Session Data:', mockSessionData);
    console.log('\n⏳ Calling generateAIReport...');

    const aiReport = await generateAIReport(mockSessionData, 'recruitment');

    if (aiReport) {
      console.log('\n✅ AI Report Generated Successfully!\n');
      console.log('Summary:', aiReport.summary);
      console.log('Strengths:', aiReport.strengths);
      console.log('Areas to Monitor:', aiReport.areasToMonitor);
      console.log('Recommendation:', aiReport.recommendation);
      console.log('Confidence:', aiReport.confidenceScore);
      console.log('Source:', aiReport.source);
      return aiReport;
    } else {
      console.log('\n⚠️ AI Report returned null - testing fallback...');
      const heuristicReport = generateHeuristicReport(mockSessionData, 'recruitment');
      console.log('\n✅ Heuristic Report Generated Successfully!\n');
      console.log('Summary:', heuristicReport.summary);
      console.log('Recommendation:', heuristicReport.recommendation);
      console.log('Source:', heuristicReport.source);
      return heuristicReport;
    }
  } catch (error) {
    console.error('❌ Error testing AI report:', error);
    return null;
  }
}

/**
 * Test multiple scenarios with different performance levels
 */
export async function testMultipleScenarios() {
  console.log('\n🎯 Testing Multiple Scenarios...\n');

  const scenarios = [
    {
      name: 'High Performer',
      data: { ...mockSessionData, game1: { score: 15, errors: 0, duration: 45000 } },
    },
    {
      name: 'Average Performer',
      data: { ...mockSessionData, game1: { score: 8, errors: 4, duration: 45000 } },
    },
    {
      name: 'Low Performer',
      data: { ...mockSessionData, game1: { score: 3, errors: 8, duration: 45000 } },
    },
  ];

  for (const scenario of scenarios) {
    console.log(`\n📌 Scenario: ${scenario.name}`);
    try {
      const report = await generateAIReport(scenario.data, 'recruitment');
      if (report) {
        console.log(`   ✅ Recommendation: ${report.recommendation}`);
        console.log(`   📊 Confidence: ${report.confidenceScore}%`);
      }
    } catch (error) {
      console.error(`   ❌ Error:`, error.message);
    }
  }
}

/**
 * Validate report structure
 */
export function validateReportStructure(report) {
  console.log('\n🔍 Validating Report Structure...\n');

  const requiredFields = ['summary', 'strengths', 'areasToMonitor', 'recommendation', 'confidenceScore', 'source'];
  const missingFields = requiredFields.filter(field => !report[field]);

  if (missingFields.length === 0) {
    console.log('✅ All required fields present');
    return true;
  } else {
    console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
    return false;
  }
}

// Export for use in tests
export { mockSessionData };

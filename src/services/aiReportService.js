import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);

/**
 * Generate AI-powered assessment report using Gemini
 * @param {Object} sessionData - Game scores, errors, and telemetry from all 7 games
 * @returns {Promise<Object>} AI-generated report with summary, strengths, risks, and recommendation
 */
export async function generateAIReport(sessionData, mode = 'recruitment') {
  try {
    // Prepare input data for prompt
    const gameAnalysis = prepareGameAnalysis(sessionData);

    // Construct detailed prompt for Gemini
    const prompt = buildPrompt(gameAnalysis, mode);

    // Call Gemini API with fallback chain
    const viteModel = (typeof window !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_GEMINI_MODEL)
      ? import.meta.env.VITE_GEMINI_MODEL
      : null;

    const preferredModel = viteModel || 'gemini-1.5-flash';
    const fallbackModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'];
    const modelCandidates = Array.from(new Set([preferredModel, ...fallbackModels]));

    let lastError = null;
    let responseText = null;

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        // console.log('Using model', modelName);
        break;
      } catch (err) {
        lastError = err;
        const msg = err?.message?.toLowerCase() || '';
        if (msg.includes('not found') || msg.includes('404') || msg.includes('too many requests') || msg.includes('quota')) {
          // try next model
          continue;
        }
        // Not a known fallback condition, rethrow
        throw err;
      }
    }

    if (!responseText) {
      console.warn('No successful model call, falling back to heuristic. lastError:', lastError);
      return null;
    }

    // Parse and structure the response
    const aiReport = parseAIResponse(responseText);
    
    return aiReport;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // Return null to trigger fallback to heuristic in Report.jsx
    return null;
  }
}

/**
 * Prepare game-by-game analysis from session data
 * @param {Object} sessionData - Raw telemetry from all games
 * @returns {Object} Structured game metrics
 */
function prepareGameAnalysis(sessionData) {
  const games = {};
  
  // Game 1: Color-Word Stroop (Cognitive Flexibility, Stress Resilience)
  if (sessionData.game1) {
    games.game1 = {
      name: 'Color-Word Interference (Stroop)',
      metric: 'Cognitive Flexibility & Stress Resilience',
      score: sessionData.game1.score,
      errors: sessionData.game1.errors,
      duration: sessionData.game1.duration,
      interpretation: sessionData.game1.score > 10 ? 'High flexibility' : 
                      sessionData.game1.score > 6 ? 'Moderate flexibility' : 
                      'Needs improvement'
    };
  }
  
  // Game 2: Frustration Tolerance
  if (sessionData.game2) {
    games.game2 = {
      name: 'Dynamic Pursuit Task',
      metric: 'Frustration Tolerance & Emotional Control',
      score: sessionData.game2.score,
      errors: sessionData.game2.errors,
      duration: sessionData.game2.duration,
      interpretation: sessionData.game2.errors < 5 ? 'High tolerance' :
                      sessionData.game2.errors < 15 ? 'Moderate tolerance' :
                      'Easily frustrated'
    };
  }
  
  // Game 3: Working Memory
  if (sessionData.game3) {
    games.game3 = {
      name: 'Memory Array Task',
      metric: 'Working Memory Capacity',
      score: sessionData.game3.score,
      errors: sessionData.game3.errors,
      interpretation: sessionData.game3.score > 4 ? 'Exceptional memory' :
                      sessionData.game3.score > 2 ? 'Average memory' :
                      'Below average'
    };
  }
  
  // Game 4: Risk Profiling (BART)
  if (sessionData.game4) {
    games.game4 = {
      name: 'Balloon Analogue Risk Task',
      metric: 'Risk Strategy & Decision Making',
      pops: sessionData.game4.errors,
      score: sessionData.game4.score,
      interpretation: sessionData.game4.errors === 0 ? 'Risk averse' :
                      sessionData.game4.errors <= 2 ? 'Risk calculated' :
                      'Risk aggressive'
    };
  }
  
  // Game 5: Sustained Attention & Reaction Time
  if (sessionData.game5) {
    games.game5 = {
      name: 'Signal Vigilance Task',
      metric: 'Sustained Attention & Reaction Speed',
      avgReactionTime: sessionData.game5.avgReactionTime,
      falseStarts: sessionData.game5.falseStarts,
      interpretation: sessionData.game5.avgReactionTime < 350 ? 'Sharp vigilance' :
                      sessionData.game5.avgReactionTime < 600 ? 'Consistent vigilance' :
                      'Slower responses'
    };
  }
  
  // Game 6: Route Optimization & Selective Attention
  if (sessionData.game6) {
    games.game6 = {
      name: 'Grid Optimizer Task',
      metric: 'Optimization & Selective Attention',
      gridScore: sessionData.game6.gridScore,
      quizScore: sessionData.game6.quizScore,
      interpretation: sessionData.game6.gridScore > 500 ? 'Efficient optimizer' :
                      sessionData.game6.gridScore > 200 ? 'Adaptive approach' :
                      'Reactive strategy'
    };
  }
  
  // Game 7: Spatial Reasoning
  if (sessionData.game7) {
    games.game7 = {
      name: 'Laser Puzzle Task',
      metric: 'Spatial Reasoning & Problem Solving',
      efficiency: sessionData.game7.efficiency,
      moves: sessionData.game7.moves,
      interpretation: sessionData.game7.efficiency >= 90 ? 'Expert spatial reasoning' :
                      sessionData.game7.efficiency >= 60 ? 'Capable reasoning' :
                      'Developing skills'
    };
  }
  
  return games;
}

/**
 * Build detailed prompt for Gemini
 * @param {Object} gameAnalysis - Structured game metrics
 * @param {string} mode - 'recruitment' or 'reassignment'
 * @returns {string} Formatted prompt for LLM
 */
function buildPrompt(gameAnalysis, mode) {
  const gamesSummary = Object.values(gameAnalysis)
    .map(g => `${g.name}: ${g.metric} - Score: ${g.score || g.gridScore || g.efficiency || 'N/A'}, ${g.interpretation}`)
    .join('\n');

  return `You are an expert in talent assessment and cognitive psychology. Analyze the following cognitive assessment results and provide a professional evaluation.

ASSESSMENT RESULTS:
${gamesSummary}

MODE: ${mode === 'recruitment' ? 'Job recruitment evaluation' : 'Internal reassignment evaluation'}

TASK: Generate a professional assessment report including:

1. EXECUTIVE SUMMARY (2-3 sentences): Overall cognitive profile
2. KEY STRENGTHS (3-5 bullet points): Top 3-5 cognitive strengths demonstrated
3. AREAS TO MONITOR (2-3 bullet points): Any potential concerns or development areas
4. CAREER RECOMMENDATIONS (2-3 specific roles/departments this person would excel in)
5. CONFIDENCE SCORE: Rate your confidence in this assessment (0-100%)
6. OVERALL RECOMMENDATION: One of "HIGHLY RECOMMEND", "RECOMMEND WITH RESERVATIONS", "BORDERLINE FIT", or "REQUIRES FOLLOW-UP"

Format your response as valid JSON with these exact keys:
{
  "summary": "string",
  "strengths": ["strength1", "strength2", ...],
  "areasToMonitor": ["area1", "area2", ...],
  "careerRecommendations": [{"role": "Role Name", "fit": "explanation"}],
  "confidenceScore": number (0-100),
  "recommendation": "HIGHLY RECOMMEND | RECOMMEND WITH RESERVATIONS | BORDERLINE FIT | REQUIRES FOLLOW-UP"
}

Ensure the response is valid JSON only, no markdown or extra text.`;
}

/**
 * Parse Gemini response and structure as report
 * @param {string} responseText - Raw Gemini API response
 * @returns {Object} Structured AI report
 */
function parseAIResponse(responseText) {
  try {
    // Extract JSON from response (in case Gemini adds any extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const aiReport = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!aiReport.summary || !aiReport.strengths || !aiReport.recommendation) {
      throw new Error('Missing required fields in AI response');
    }
    
    return {
      ...aiReport,
      source: 'gemini',
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return null;
  }
}

/**
 * Generate fallback heuristic-based report (for when LLM fails)
 * @param {Object} sessionData - Game session data
 * @param {string} mode - 'recruitment' or 'reassignment'
 * @returns {Object} Heuristic report
 */
export function generateHeuristicReport(sessionData) {
  const gameAnalysis = prepareGameAnalysis(sessionData);
  
  // Calculate strengths
  const strengths = [];
  if (gameAnalysis.game1?.score > 8) strengths.push('Strong cognitive flexibility');
  if (gameAnalysis.game3?.score >= 3) strengths.push('Solid working memory');
  if (gameAnalysis.game5?.avgReactionTime < 400) strengths.push('Fast reaction time');
  if (gameAnalysis.game6?.gridScore > 300) strengths.push('Good strategic thinking');
  
  // Calculate risks
  const areasToMonitor = [];
  if (gameAnalysis.game1?.errors > 5) areasToMonitor.push('May struggle under stress');
  if (gameAnalysis.game2?.errors > 10) areasToMonitor.push('Frustration tolerance to develop');
  if (gameAnalysis.game4?.pops > 5) areasToMonitor.push('Risk-taking may need management');
  
  // Calculate overall score
  const overallScore = calculateOverallScore(gameAnalysis);
  
  return {
    summary: `Overall cognitive profile shows ${overallScore > 7 ? 'strong' : overallScore > 4 ? 'moderate' : 'developing'} capabilities across multiple domains.`,
    strengths: strengths.length > 0 ? strengths : ['Participates actively in assessments'],
    areasToMonitor: areasToMonitor.length > 0 ? areasToMonitor : ['Continue developing skills'],
    careerRecommendations: [
      { role: 'Analytical Role', fit: 'Shows problem-solving capability' },
      { role: 'Customer-Facing Role', fit: 'Demonstrates attention to detail' }
    ],
    confidenceScore: 60, // Heuristic lower confidence
    recommendation: overallScore >= 7 ? 'HIGHLY RECOMMEND' : 
                   overallScore >= 4 ? 'RECOMMEND WITH RESERVATIONS' : 
                   'REQUIRES FOLLOW-UP',
    source: 'heuristic',
    generatedAt: new Date().toISOString()
  };
}

/**
 * Calculate overall score from game analysis
 * @param {Object} gameAnalysis - Structured game metrics
 * @returns {number} Overall score 0-9
 */
function calculateOverallScore(gameAnalysis) {
  let score = 0;
  
  if (gameAnalysis.game1?.score > 8) score++;
  if (gameAnalysis.game1?.errors < 5) score++;
  if (gameAnalysis.game2?.errors < 10) score++;
  if (gameAnalysis.game3?.score >= 3) score++;
  if (gameAnalysis.game4?.pops <= 2) score++;
  if (gameAnalysis.game5?.avgReactionTime < 500 && gameAnalysis.game5?.falseStarts < 2) score++;
  if (gameAnalysis.game6?.gridScore > 300) score++;
  if (gameAnalysis.game6?.quizScore >= 1) score++;
  if (gameAnalysis.game7?.efficiency >= 60) score++;
  
  return score;
}

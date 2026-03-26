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

  const getGame = (newId, legacyId) => sessionData?.[newId] || sessionData?.[legacyId];
  
  // Game 1: OSPAN (Working Memory)
  const game1 = getGame('ospan_game_1', 'game1');
  if (game1) {
    games.game1 = {
      name: 'Operation Span (OSPAN)',
      metric: 'Working Memory Capacity',
      score: game1.score,
      errors: game1.errors,
      duration: game1.duration,
      interpretation: game1.details?.operationAccuracy >= 80 ? 'High dual-task control' :
                      game1.details?.operationAccuracy >= 60 ? 'Moderate dual-task control' :
                      'Working memory under load may need support'
    };
  }
  
  // Game 2: Stop-Signal (Inhibition)
  const game2 = getGame('sst_game_2', 'game2');
  if (game2) {
    games.game2 = {
      name: 'Stop-Signal Task',
      metric: 'Response Inhibition',
      score: game2.score,
      errors: game2.errors,
      duration: game2.duration,
      interpretation: game2.details?.accuracy >= 80 ? 'Strong inhibitory control' :
                      game2.details?.accuracy >= 60 ? 'Moderate inhibitory control' :
                      'Impulse control may fluctuate under pressure'
    };
  }
  
  // Game 3: Task Switching (Flexibility)
  const game3 = getGame('tsw_game_3', 'game3');
  if (game3) {
    games.game3 = {
      name: 'Task Switching',
      metric: 'Cognitive Flexibility',
      score: game3.score,
      errors: game3.errors,
      interpretation: game3.details?.accuracy >= 80 ? 'Fast adaptation between rules' :
                      game3.details?.accuracy >= 60 ? 'Reasonable adaptation speed' :
                      'Switch-cost may be elevated'
    };
  }
  
  // Game 4: CPT (Sustained Attention)
  const game4 = getGame('cpt_game_4', 'game4');
  if (game4) {
    games.game4 = {
      name: 'Continuous Performance Test',
      metric: 'Sustained Attention',
      score: game4.score,
      errors: game4.errors,
      interpretation: game4.errors <= 2 ? 'Consistent sustained attention' :
                      game4.errors <= 6 ? 'Moderate sustained attention' :
                      'Attention lapses detected'
    };
  }
  
  // Game 5: Decision under Pressure
  const game5 = getGame('dec_game_5', 'game5');
  if (game5) {
    games.game5 = {
      name: 'Decision Under Time Pressure',
      metric: 'Judgment and Prioritization',
      score: game5.score,
      errors: game5.errors,
      interpretation: game5.errors <= 2 ? 'Solid quality-speed balance' :
                      game5.errors <= 5 ? 'Acceptable quality under pressure' :
                      'Decision quality may degrade with time constraints'
    };
  }
  
  // Game 6: Rule Shift
  const game6 = getGame('rsh_game_6', 'game6');
  if (game6) {
    games.game6 = {
      name: 'Rule Shift + Exceptions',
      metric: 'Adaptation to Rule Changes',
      score: game6.score,
      errors: game6.errors,
      interpretation: game6.errors <= 2 ? 'Strong adaptation and exception handling' :
                      game6.errors <= 5 ? 'Moderate adaptation capacity' :
                      'Rule-shift adaptation may require coaching'
    };
  }
  
  // Game 7: SJT
  const game7 = getGame('sjt_game_7', 'game7');
  if (game7) {
    games.game7 = {
      name: 'Situational Judgment Test',
      metric: 'Workplace Judgment and Values Alignment',
      score: game7.score,
      errors: game7.errors,
      interpretation: game7.details?.accuracy >= 80 ? 'Strong situational judgment' :
                      game7.details?.accuracy >= 60 ? 'Acceptable situational judgment' :
                      'Judgment consistency may require follow-up'
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

1. EXECUTIVE SUMMARY (2-3 sentences): Strong and nuanced overall profile in development-oriented language.
2. KEY STRENGTHS (3-5 bullet points): Top cognitive strengths and likely workplace impact.
3. AREAS TO MONITOR (2-3 bullet points): Development areas framed as coachable opportunities.
4. CAREER RECOMMENDATIONS (2-3 specific roles/departments this person may align with), with rationale.
5. CONFIDENCE SCORE: Rate your confidence in this assessment (0-100%).
6. PROFILE ALIGNMENT: One of "STRONG ALIGNMENT", "SOLID ALIGNMENT WITH COACHING", "CONDITIONAL ALIGNMENT", or "EXPLORATORY FIT - NEEDS MORE DATA".

IMPORTANT:
- Avoid deterministic hiring language and avoid "hire/do not hire" wording.
- Keep conclusions probabilistic, contextual, and development-focused.
- Emphasize that this is one input among multiple evaluation sources.

Format your response as valid JSON with these exact keys:
{
  "summary": "string",
  "strengths": ["strength1", "strength2", ...],
  "areasToMonitor": ["area1", "area2", ...],
  "careerRecommendations": [{"role": "Role Name", "fit": "explanation"}],
  "confidenceScore": number (0-100),
  "recommendation": "STRONG ALIGNMENT | SOLID ALIGNMENT WITH COACHING | CONDITIONAL ALIGNMENT | EXPLORATORY FIT - NEEDS MORE DATA"
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
 * @returns {Object} Heuristic report
 */
export function generateHeuristicReport(sessionData) {
  const gameAnalysis = prepareGameAnalysis(sessionData);
  const normalized = normalizeGameScores(gameAnalysis);
  
  // Identify top 3 strengths from normalized scores
  const strengths = [];
  const sortedGames = Object.entries(normalized)
    .sort(([, a], [, b]) => (b || 0) - (a || 0))
    .slice(0, 3);
  
  const gameNames = {
    game1: 'Working memory and dual-task management',
    game2: 'Response inhibition and impulse control',
    game3: 'Cognitive flexibility and learning agility',
    game4: 'Sustained attention and reliability',
    game5: 'Decision quality under time pressure',
    game6: 'Rule adaptation and exception handling',
    game7: 'Workplace judgment and situational awareness'
  };
  
  sortedGames.forEach(([game, score]) => {
    if (score >= 7) {
      strengths.push(`Strong ${gameNames[game]}`);
    } else if (score >= 5) {
      strengths.push(`Solid ${gameNames[game]}`);
    }
  });
  
  // Identify development areas (lowest scores)
  const areasToMonitor = [];
  const lowestGames = Object.entries(normalized)
    .sort(([, a], [, b]) => (a || 0) - (b || 0))
    .slice(0, 2);
  
  lowestGames.forEach(([game, score]) => {
    if (score < 5) {
      const gameKey = game;
      const baseName = gameNames[gameKey];
      areasToMonitor.push(`Develop ${baseName} through targeted practice`);
    }
  });
  
  // Calculate overall score (0-10)
  const overallScore = calculateOverallScore(gameAnalysis);
  
  // Determine recommendation tier
  let recommendation, profileTier;
  if (overallScore >= 8) {
    recommendation = 'STRONG ALIGNMENT';
    profileTier = 'demonstrates consistently strong performance';
  } else if (overallScore >= 6.5) {
    recommendation = 'SOLID ALIGNMENT WITH COACHING';
    profileTier = 'shows solid fundamentals with specific growth areas';
  } else if (overallScore >= 4.5) {
    recommendation = 'CONDITIONAL ALIGNMENT';
    profileTier = 'indicates potential but requires targeted development';
  } else {
    recommendation = 'EXPLORATORY FIT - NEEDS MORE DATA';
    profileTier = 'may benefit from additional assessment or targeted development';
  }
  
  return {
    summary: `Executive summary: the profile ${profileTier} across core cognitive and workplace judgment domains. This is a developmental signal combining cognitive capacity, decision-making, learning agility, and workplace judgment. Interpret as one input among interviews, experience, and domain expertise for holistic talent decisions.`,
    strengths: strengths.length > 0 
      ? strengths 
      : ['Shows foundational cognitive engagement in assessments'],
    areasToMonitor: areasToMonitor.length > 0 
      ? areasToMonitor 
      : ['Continue developing core cognitive skills'],
    careerRecommendations: generateCareerRecommendations(normalized),
    confidenceScore: Math.round(55 + (overallScore * 5)), // Heuristic: 55-105%, cap at 80
    recommendation,
    source: 'heuristic',
    generatedAt: new Date().toISOString()
  };
}

/**
 * Generate career recommendations based on normalized cognitive profile
 * @param {Object} normalized - Normalized game scores
 * @returns {Array} Career fit recommendations
 */
function generateCareerRecommendations(normalized) {
  const recommendations = [];
  
  // High learning agility + rule shift = strong strategic/innovation fit
  if ((normalized.game3 || 0) >= 7 && (normalized.game6 || 0) >= 7) {
    recommendations.push({
      role: 'Strategic Analyst / Change Manager',
      fit: 'Strong learning agility and adaptation make this profile valuable for rapidly changing environments and innovation roles'
    });
  }
  
  // High attention + decision-making = operations/coordination fit
  if ((normalized.game4 || 0) >= 7 && (normalized.game5 || 0) >= 6.5) {
    recommendations.push({
      role: 'Operations / Process Coordination',
      fit: 'Reliable attention and sound judgment under pressure suit execution-focused roles with complex workflows'
    });
  }
  
  // High SJT + working memory = leadership potential
  if ((normalized.game7 || 0) >= 7 && (normalized.game1 || 0) >= 6 && (normalized.game2 || 0) >= 6) {
    recommendations.push({
      role: 'Team Lead / Middle Management',
      fit: 'Strong workplace judgment combined with reliable executive function and impulse control suggest readiness for collaborative leadership'
    });
  }
  
  // Default recommendations if no strong pattern emerges
  if (recommendations.length === 0) {
    recommendations.push(
      { role: 'Analytical/Technical Specialist', fit: 'Profile suggests value in roles emphasizing focused analysis and technical depth' },
      { role: 'Collaborative Team Member', fit: 'Adaptability and judgment align with team-based problem-solving environments' }
    );
  }
  
  return recommendations;
}

/**
 * Normalize performance across all games (0-10 scale)
 * Uses domain-specific expected ranges to create Z-score-like normalization
 * @param {Object} gameAnalysis - Structured game metrics
 * @returns {Object} Normalized scores for each game
 */
function normalizeGameScores(gameAnalysis) {
  const normalized = {};
  
  // Game 1: OSPAN - Expected range 0-15+ (letters recalled)
  if (gameAnalysis.game1) {
    const score = gameAnalysis.game1.score || 0;
    const errors = gameAnalysis.game1.errors || 0;
    // Score: max 15, Excellence >12, Good 9-12, Fair 6-9, Poor <6
    const scoreFit = Math.min(10, (score / 15) * 10);
    const errorPenalty = Math.min(5, errors * 0.5);
    normalized.game1 = Math.max(0, scoreFit - errorPenalty);
  }
  
  // Game 2: Stop-Signal - Expected range 0-200+ (SSRTs/accuracy)
  if (gameAnalysis.game2) {
    const score = gameAnalysis.game2.score || 0;
    const errors = gameAnalysis.game2.errors || 0;
    // Higher score is better here (fewer/faster stops)
    const scoreFit = Math.min(10, (score / 100) * 10);
    const errorPenalty = Math.min(5, errors * 0.4);
    normalized.game2 = Math.max(0, scoreFit - errorPenalty);
  }
  
  // Game 3: Task Switching - Expected range 0-5 (rule shifts completed)
  if (gameAnalysis.game3) {
    const score = gameAnalysis.game3.score || 0;
    const errors = gameAnalysis.game3.errors || 0;
    // Max 5 complete shifts
    const scoreFit = Math.min(10, (score / 5) * 10);
    const errorPenalty = Math.min(5, errors * 0.8);
    normalized.game3 = Math.max(0, scoreFit - errorPenalty);
  }
  
  // Game 4: CPT - Expected range 0-300+ accuracy rate
  if (gameAnalysis.game4) {
    const accuracy = gameAnalysis.game4.score || 0;
    const errors = gameAnalysis.game4.errors || 0;
    // Accuracy 0-100, excellent >90%, good 80-90%
    const accuracyFit = Math.min(10, (accuracy / 100) * 10);
    const errorPenalty = Math.min(3, errors * 0.15);
    normalized.game4 = Math.max(0, accuracyFit - errorPenalty);
  }
  
  // Game 5: Decision Under Pressure - Expected reaction time 200-2000ms
  if (gameAnalysis.game5) {
    const score = gameAnalysis.game5.score || 0;
    const avgRxn = gameAnalysis.game5.avgReactionTime || 500;
    const errors = gameAnalysis.game5.errors || 0;
    
    // Score fit (0-3000 expected max)
    const scoreFit = Math.min(10, (score / 2500) * 10);
    
    // Reaction time: 200-500ms is excellent (no penalty), 500-1000ms is good
    // Penalize only if excessively slow (>1000ms) or abnormally fast (<100ms, implies guessing)
    let rxnScore = 10;
    if (avgRxn < 100) {
      rxnScore = Math.max(3, 10 - ((100 - avgRxn) / 50) * 5); // Penalize abnormally fast reactions
    } else if (avgRxn > 1000) {
      rxnScore = Math.max(4, 10 - ((avgRxn - 1000) / 500) * 6); // Penalize very slow reactions
    }
    
    const errorPenalty = Math.min(3, errors * 0.3);
    
    normalized.game5 = Math.max(0, (scoreFit * 0.6 + rxnScore * 0.4) - errorPenalty);
  }
  
  // Game 6: Rule Shift - Expected range gridScore 0-500
  if (gameAnalysis.game6) {
    const gridScore = gameAnalysis.game6.gridScore || gameAnalysis.game6.score || 0;
    const quizScore = gameAnalysis.game6.quizScore || 0;
    const errors = gameAnalysis.game6.errors || 0;
    
    const gridFit = Math.min(10, (gridScore / 500) * 10);
    const quizFit = Math.min(10, (quizScore / 3) * 10);
    const errorPenalty = Math.min(4, errors * 0.5);
    
    normalized.game6 = Math.max(0, (gridFit + quizFit) / 2 - errorPenalty);
  }
  
  // Game 7: SJT - Expected range 0-100 (accuracy %)
  if (gameAnalysis.game7) {
    const score = gameAnalysis.game7.score || 0;
    const accuracy = gameAnalysis.game7.details?.accuracy || score;
    const errors = gameAnalysis.game7.errors || 0;
    
    const accuracyFit = Math.min(10, (accuracy / 100) * 10);
    const errorPenalty = Math.min(3, errors * 0.3);
    
    normalized.game7 = Math.max(0, accuracyFit - errorPenalty);
  }
  
  return normalized;
}

/**
 * Calculate weighted overall score from normalized game performance
 * Weighs games by predictive relevance (learning agility > risk of rash decisions > execution consistency)
 * @param {Object} normalizedScores - Normalized 0-10 scores per game
 * @returns {number} Weighted overall score 0-10
 */
function calculateOverallScore(gameAnalysis) {
  const normalized = normalizeGameScores(gameAnalysis);
  
  // Weights based on predictive validity for HR outcomes
  // Learning agility + Rule Shift: highest impact on long-term success
  // Decision-making + SJT: moderate impact on role fit
  // Working memory + Attention: baseline cognitive load handling
  const weights = {
    game1: 1.0,  // OSPAN: Working memory (baseline execution)
    game2: 0.8,  // Stop-Signal: Impulse control (risk mitigation)
    game3: 1.2,  // Task Switching: Learning agility (highest predictor of success)
    game4: 0.9,  // CPT: Attention reliability
    game5: 1.1,  // Decision: Judgment and speed-quality tradeoff
    game6: 1.3,  // Rule Shift: Adaptability + exception handling (highest novelty handling)
    game7: 1.0   // SJT: Workplace judgment
  };
  
  let totalWeight = 0;
  let weightedScore = 0;
  
  for (const game in normalized) {
    const weight = weights[game] || 1.0;
    weightedScore += (normalized[game] || 0) * weight;
    totalWeight += weight;
  }
  
  const avg = totalWeight > 0 ? weightedScore / totalWeight : 0;
  return Math.round(avg * 10) / 10; // Return 0-10 with 1 decimal
}

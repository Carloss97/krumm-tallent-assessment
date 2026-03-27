import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);
let lastAIFailureReason = '';
let lastAIDebugTrace = [];
const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash-latest';
const USE_BACKEND_GEMINI_PROXY = import.meta?.env?.VITE_USE_BACKEND_GEMINI_PROXY !== 'false';
const ALLOW_BROWSER_GEMINI_FALLBACK = import.meta?.env?.VITE_ALLOW_BROWSER_GEMINI_FALLBACK === 'true';
const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || '';

function normalizeBaseUrl(baseUrl) {
  const base = String(baseUrl || '').trim();
  if (!base) return '';
  return base.replace(/\/$/, '');
}

function getProxyBaseCandidates() {
  return Array.from(new Set([
    normalizeBaseUrl(API_BASE_URL),
    '',
    'http://localhost:4000',
  ]));
}

function buildApiUrl(path, baseUrl) {
  const base = normalizeBaseUrl(baseUrl);
  return base ? `${base}${path}` : path;
}

async function callGeminiProxy(path, options = {}) {
  const proxyBases = getProxyBaseCandidates();
  let lastResponseError = null;
  let lastNetworkError = null;

  for (const baseUrl of proxyBases) {
    const endpoint = buildApiUrl(path, baseUrl);
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        ...options,
      });

      const body = await response.json().catch(() => ({}));
      if (response.ok && body?.ok !== false) {
        return body;
      }

      const message = body?.message || body?.error || `Gemini proxy request failed (${response.status}).`;
      const error = new Error(message);
      error.status = response.status;
      error.code = body?.code || 'PROXY_ERROR';
      error.attempts = Array.isArray(body?.attempts) ? body.attempts : [];

      // If backend returned a structured code, stop and surface it.
      if (body?.code) {
        throw error;
      }

      lastResponseError = error;
      continue;
    } catch (error) {
      const isNetworkError = String(error?.message || '').toLowerCase().includes('failed to fetch') || String(error?.name || '').toLowerCase().includes('typeerror');
      if (isNetworkError) {
        lastNetworkError = error;
        continue;
      }
      throw error;
    }
  }

  const detail = proxyBases
    .map((base) => (base ? `${base}${path}` : path))
    .join(' | ');

  const proxyError = new Error(
    `Gemini backend proxy unreachable. Verify API server is running and VITE_API_BASE_URL is correct. Tried: ${detail}`
  );
  proxyError.status = lastResponseError?.status || 502;
  proxyError.code = 'PROXY_UNREACHABLE';
  proxyError.attempts = [];
  if (lastNetworkError) {
    proxyError.cause = lastNetworkError;
  }
  throw proxyError;
}

export function getLastAIFailureReason() {
  return lastAIFailureReason;
}

export function getLastAIDebugTrace() {
  return Array.isArray(lastAIDebugTrace) ? [...lastAIDebugTrace] : [];
}

export async function checkGeminiHealth(modelName) {
  lastAIDebugTrace = [];
  const key = import.meta?.env?.VITE_GOOGLE_API_KEY;
  const preferredModel = modelName || import.meta?.env?.VITE_GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const modelCandidates = Array.from(new Set([preferredModel, 'gemini-1.5-flash-latest']));

  if (USE_BACKEND_GEMINI_PROXY) {
    try {
      const proxyResult = await callGeminiProxy(`/api/ai/health?model=${encodeURIComponent(preferredModel)}`, {
        method: 'GET',
      });
      lastAIDebugTrace = Array.isArray(proxyResult.attempts) ? [...proxyResult.attempts] : [];
      return {
        ok: Boolean(proxyResult.ok),
        code: proxyResult.code || 'OK',
        message: proxyResult.message || 'Gemini health check completed via backend proxy.',
        model: proxyResult.model || preferredModel,
        status: 200,
      };
    } catch (error) {
      lastAIDebugTrace = Array.isArray(error?.attempts) ? [...error.attempts] : [];
      if (!ALLOW_BROWSER_GEMINI_FALLBACK) {
        return {
          ok: false,
          code: error?.code || 'PROXY_ERROR',
          message: error?.message || 'Gemini backend proxy is unavailable.',
          model: preferredModel,
          status: error?.status || 502,
        };
      }
    }
  }

  if (!key) {
    return {
      ok: false,
      code: 'MISSING_KEY',
      message: 'Missing VITE_GOOGLE_API_KEY in environment.',
      model: preferredModel,
    };
  }

  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const listResponse = await fetch(listUrl);

    if (!listResponse.ok) {
      const text = await listResponse.text();
      const mapped = mapGeminiFailure(text, listResponse.status);
      lastAIDebugTrace.push({
        stage: 'health:list-models',
        model: preferredModel,
        status: listResponse.status,
        code: mapped.code,
        message: mapped.message,
      });
      return {
        ok: false,
        code: mapped.code,
        message: mapped.message,
        model: preferredModel,
        status: listResponse.status,
      };
    }

    const failures = [];

    for (const candidate of modelCandidates) {
      const probeUrl = `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${key}`;
      const probeResponse = await fetch(probeUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with valid JSON only: {"ok":true}' }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (probeResponse.ok) {
        lastAIDebugTrace.push({
          stage: 'health:probe',
          model: candidate,
          status: 200,
          code: 'OK',
          message: 'Model probe succeeded.',
        });
        return {
          ok: true,
          code: 'OK',
          message: `Gemini connection healthy (${candidate}).`,
          model: candidate,
          status: 200,
        };
      }

      const text = await probeResponse.text();
      const mapped = mapGeminiFailure(text, probeResponse.status);
      lastAIDebugTrace.push({
        stage: 'health:probe',
        model: candidate,
        status: probeResponse.status,
        code: mapped.code,
        message: mapped.message,
      });

      // Stop immediately for global failures that won't be solved by model switching.
      if (mapped.code === 'KEY_INVALID' || mapped.code === 'KEY_LEAKED' || mapped.code === 'PERMISSION_DENIED' || mapped.code === 'QUOTA_EXCEEDED') {
        return {
          ok: false,
          code: mapped.code,
          message: mapped.message,
          model: candidate,
          status: probeResponse.status,
        };
      }

      failures.push({ candidate, ...mapped, status: probeResponse.status });
    }

    const hasQuota = failures.some((f) => f.code === 'QUOTA_EXCEEDED');
    const hasNotFound = failures.some((f) => f.code === 'MODEL_NOT_FOUND');

    if (hasQuota && hasNotFound) {
      return {
        ok: false,
        code: 'MODEL_AND_QUOTA_CONFLICT',
        message: 'Selected model alias is unavailable and available fallbacks are currently quota-limited.',
        model: preferredModel,
        status: 429,
      };
    }

    const primaryFailure = failures[0] || { code: 'UNKNOWN', message: 'Unknown Gemini API error during health check.' };
    return {
      ok: false,
      code: primaryFailure.code,
      message: primaryFailure.message,
      model: primaryFailure.candidate || preferredModel,
      status: primaryFailure.status,
    };
  } catch (error) {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: 'Network error while checking Gemini connectivity.',
      model: preferredModel,
      error: error?.message || String(error),
    };
  }
}

function mapGeminiFailure(responseText, statusCode) {
  const raw = String(responseText || '').toLowerCase();
  if (raw.includes('reported as leaked') || raw.includes('leaked')) {
    return {
      code: 'KEY_LEAKED',
      message: 'Gemini API key was reported as leaked. Rotate to a new key.',
    };
  }
  if (raw.includes('expired') || raw.includes('api_key_invalid')) {
    return {
      code: 'KEY_INVALID',
      message: 'Gemini API key is invalid or expired.',
    };
  }
  if (statusCode === 403 || raw.includes('permission_denied') || raw.includes('permission')) {
    return {
      code: 'PERMISSION_DENIED',
      message: 'Gemini key lacks required permissions for this project.',
    };
  }
  if (statusCode === 404 || raw.includes('not found') || raw.includes('not supported')) {
    return {
      code: 'MODEL_NOT_FOUND',
      message: 'Selected Gemini model is not available for this endpoint/version.',
    };
  }
  if (statusCode === 429 || raw.includes('quota') || raw.includes('rate limit')) {
    return {
      code: 'QUOTA_EXCEEDED',
      message: 'Gemini quota/rate limit reached for this project.',
    };
  }
  if (statusCode === 400) {
    return {
      code: 'BAD_REQUEST',
      message: 'Gemini request was rejected (bad request/configuration).',
    };
  }
  return {
    code: 'UNKNOWN',
    message: 'Unknown Gemini API error during health check.',
  };
}

/**
 * Generate AI-powered assessment report using Gemini
 * @param {Object} sessionData - Game scores, errors, and telemetry from all assessment games
 * @returns {Promise<Object>} AI-generated report with summary, strengths, risks, and recommendation
 */
export async function generateAIReport(sessionData, mode = 'recruitment', language = 'en') {
  lastAIFailureReason = '';
  lastAIDebugTrace = [];
  try {
    // Prepare input data for prompt
    const gameAnalysis = prepareGameAnalysis(sessionData);

    // Construct detailed prompt for Gemini
    const prompt = buildPrompt(gameAnalysis, mode, language);

    // Call Gemini API with fallback chain
    const viteModel = (typeof window !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_GEMINI_MODEL)
      ? import.meta.env.VITE_GEMINI_MODEL
      : null;
    const preferredModel = viteModel || DEFAULT_GEMINI_MODEL;

    if (USE_BACKEND_GEMINI_PROXY) {
      try {
        const proxyResult = await callGeminiProxy('/api/ai/generate', {
          method: 'POST',
          body: JSON.stringify({
            prompt,
            preferredModel,
          }),
        });

        if (Array.isArray(proxyResult.attempts)) {
          lastAIDebugTrace = [...proxyResult.attempts];
        }

        let aiReport = parseAIResponse(proxyResult.text || '');

        if (!aiReport && proxyResult.text && proxyResult.model) {
          try {
            const repairText = await requestJsonRepair(proxyResult.text, proxyResult.model);
            aiReport = parseAIResponse(repairText);
            lastAIDebugTrace.push({
              stage: 'generate:repair',
              model: proxyResult.model,
              status: aiReport ? 200 : null,
              code: aiReport ? 'OK' : 'PARSE_FAILED',
              message: aiReport ? 'Repair parse succeeded.' : 'Repair parse failed.',
            });
          } catch (repairError) {
            lastAIDebugTrace.push({
              stage: 'generate:repair',
              model: proxyResult.model,
              status: null,
              code: 'REPAIR_ERROR',
              message: 'JSON repair request failed.',
            });
          }
        }

        if (!aiReport) {
          lastAIFailureReason = 'AI returned malformed JSON that could not be repaired.';
        }

        return aiReport;
      } catch (proxyError) {
        if (Array.isArray(proxyError?.attempts)) {
          lastAIDebugTrace = [...proxyError.attempts];
        }

        if (proxyError?.code === 'KEY_INVALID') {
          lastAIFailureReason = 'Gemini API key is invalid or expired (confirmed by backend response).';
        } else if (proxyError?.code === 'PERMISSION_DENIED') {
          lastAIFailureReason = 'Gemini key lacks required permissions for this project.';
        } else if (proxyError?.code === 'QUOTA_EXCEEDED') {
          lastAIFailureReason = 'Gemini quota/rate limit reached for current key.';
        } else {
          lastAIFailureReason = proxyError?.message || 'Gemini backend proxy failed.';
        }

        if (!ALLOW_BROWSER_GEMINI_FALLBACK) {
          return null;
        }
      }
    }

    const modelCandidates = Array.from(new Set([preferredModel, 'gemini-1.5-flash']));

    let lastError = null;
    let responseText = null;
    let selectedModel = null;

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        });
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        selectedModel = modelName;
        lastAIDebugTrace.push({
          stage: 'generate:content',
          model: modelName,
          status: 200,
          code: 'OK',
          message: 'Generation succeeded.',
        });
        // console.log('Using model', modelName);
        break;
      } catch (err) {
        lastError = err;
        const msg = err?.message?.toLowerCase() || '';
        const mapped = mapGeminiFailure(msg, msg.includes('429') ? 429 : msg.includes('404') ? 404 : msg.includes('403') ? 403 : msg.includes('400') ? 400 : 0);
        lastAIDebugTrace.push({
          stage: 'generate:content',
          model: modelName,
          status: mapped.code === 'UNKNOWN' ? null : (mapped.code === 'QUOTA_EXCEEDED' ? 429 : mapped.code === 'MODEL_NOT_FOUND' ? 404 : mapped.code === 'PERMISSION_DENIED' ? 403 : mapped.code === 'KEY_INVALID' ? 400 : null),
          code: mapped.code,
          message: mapped.message,
        });
        if (msg.includes('too many requests') || msg.includes('quota') || msg.includes('429')) {
          // Quota errors are global for this key/project in the current window.
          break;
        }
        if (msg.includes('not found') || msg.includes('404')) {
          // try next model
          continue;
        }
        // Not a known fallback condition, rethrow
        throw err;
      }
    }

    if (!responseText) {
      console.warn('No successful model call, falling back to heuristic. lastError:', lastError);
      const msg = lastError?.message?.toLowerCase() || '';
      if (msg.includes('not found') || msg.includes('404')) {
        lastAIFailureReason = 'Configured Gemini model is unavailable for this API version/project.';
      } else if (msg.includes('quota') || msg.includes('429') || msg.includes('too many requests')) {
        lastAIFailureReason = 'Gemini quota/rate limit reached for current key.';
      } else {
        lastAIFailureReason = 'Gemini request failed before receiving usable output.';
      }
      return null;
    }

    // Parse and structure the response
    let aiReport = parseAIResponse(responseText);

    // If the first response is malformed, request strict JSON repair once.
    if (!aiReport && selectedModel) {
      try {
        const repairText = await requestJsonRepair(responseText, selectedModel);
        aiReport = parseAIResponse(repairText);
        lastAIDebugTrace.push({
          stage: 'generate:repair',
          model: selectedModel,
          status: aiReport ? 200 : null,
          code: aiReport ? 'OK' : 'PARSE_FAILED',
          message: aiReport ? 'Repair parse succeeded.' : 'Repair parse failed.',
        });
      } catch (repairError) {
        console.warn('JSON repair attempt failed:', repairError);
        lastAIDebugTrace.push({
          stage: 'generate:repair',
          model: selectedModel,
          status: null,
          code: 'REPAIR_ERROR',
          message: 'JSON repair request failed.',
        });
      }
    }

    if (!aiReport) {
      lastAIFailureReason = 'AI returned malformed JSON that could not be repaired.';
    }
    
    return aiReport;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    const msg = error?.message?.toLowerCase() || '';
    const inferredStatus = msg.includes('429')
      ? 429
      : msg.includes('404')
        ? 404
        : msg.includes('403')
          ? 403
          : msg.includes('400')
            ? 400
            : 0;
    const mappedFailure = mapGeminiFailure(msg, inferredStatus);

    lastAIDebugTrace.push({
      stage: 'generate:exception',
      model: null,
      status: inferredStatus || null,
      code: mappedFailure.code,
      message: mappedFailure.message,
    });

    if (msg.includes('reported as leaked') || msg.includes('leaked')) {
      lastAIFailureReason = 'Gemini API key was reported as leaked. Rotate to a new key and update environment variables.';
    } else if (mappedFailure.code === 'KEY_INVALID' || msg.includes('api key expired') || msg.includes('expired')) {
      lastAIFailureReason = 'Gemini API key is invalid or expired (confirmed by Google API response).';
    } else if (mappedFailure.code === 'PERMISSION_DENIED' || msg.includes('permission') || msg.includes('unauthorized') || msg.includes('403')) {
      lastAIFailureReason = 'Gemini API key lacks required permissions for this project.';
    } else if (msg.includes('quota') || msg.includes('429') || msg.includes('too many requests')) {
      lastAIFailureReason = 'Gemini quota/rate limit reached for current key.';
    } else {
      lastAIFailureReason = 'Runtime error during AI report generation.';
    }
    // Return null to trigger fallback to heuristic in Report.jsx
    return null;
  }
}

async function requestJsonRepair(rawResponse, modelName) {
  const repairModel = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json'
    }
  });

  const repairPrompt = `You are a JSON repair assistant. Convert the following content into valid JSON using exactly this schema and no markdown:\n{\n  "summary": "string",\n  "strengths": ["string"],\n  "areasToMonitor": ["string"],\n  "careerRecommendations": [{"role": "string", "fit": "string"}],\n  "confidenceScore": number,\n  "recommendation": "STRONG ALIGNMENT | SOLID ALIGNMENT WITH COACHING | CONDITIONAL ALIGNMENT | EXPLORATORY FIT - NEEDS MORE DATA"\n}\n\nContent to repair:\n${rawResponse}`;

  const repairResult = await repairModel.generateContent(repairPrompt);
  return repairResult.response.text();
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

  // Game 8: N-Back
  const game8 = getGame('cmp_meta_8', 'game8');
  if (game8) {
    games.game8 = {
      name: 'N-Back',
      metric: 'Updating and Metacognitive Calibration',
      score: game8.score,
      errors: game8.errors,
      duration: game8.duration,
      interpretation: game8.details?.nBackLevel >= 3 ? 'High updating demand managed effectively' :
                      game8.errors <= 4 ? 'Reasonable updating consistency' :
                      'Working memory updating may vary under load'
    };
  }

  // Game 9: Tower of London
  const game9 = getGame('cmp_ops_9', 'game9');
  if (game9) {
    games.game9 = {
      name: 'Tower of London',
      metric: 'Planning and Operational Sequencing',
      score: game9.score,
      errors: game9.errors,
      duration: game9.duration,
      interpretation: game9.details?.efficiency >= 75 ? 'Efficient planning and sequencing' :
                      game9.details?.efficiency >= 60 ? 'Adequate planning with minor inefficiencies' :
                      'Planning efficiency may benefit from structured workflows'
    };
  }

  // Game 10: Wisconsin Card Sorting
  const game10 = getGame('cmp_agility_10', 'game10');
  if (game10) {
    games.game10 = {
      name: 'Wisconsin Card Sorting',
      metric: 'Learning Agility and Rule Discovery',
      score: game10.score,
      errors: game10.errors,
      duration: game10.duration,
      interpretation: game10.details?.categoriesCompleted >= 5 ? 'Strong learning agility in changing conditions' :
                      game10.details?.categoriesCompleted >= 3 ? 'Moderate adaptation to shifting rules' :
                      'Rule-discovery consistency may require coaching'
    };
  }

  // Game 11: Go/No-Go
  const game11 = getGame('cmp_social_11', 'game11');
  if (game11) {
    games.game11 = {
      name: 'Go/No-Go',
      metric: 'Inhibition Consistency Under Repetition',
      score: game11.score,
      errors: game11.errors,
      duration: game11.duration,
      interpretation: game11.details?.noGoAccuracy >= 80 ? 'Consistent inhibitory control' :
                      game11.details?.noGoAccuracy >= 65 ? 'Moderate response-control stability' :
                      'Inhibitory control may fluctuate with repetitive load'
    };
  }

  // Game 12: Trail Making
  const game12 = getGame('cmp_resilience_12', 'game12');
  if (game12) {
    games.game12 = {
      name: 'Trail Making',
      metric: 'Processing Speed and Set-Shifting',
      score: game12.score,
      errors: game12.errors,
      duration: game12.duration,
      interpretation: game12.errors <= 2 ? 'Strong speed-accuracy balance' :
                      game12.errors <= 5 ? 'Acceptable balance under cognitive switching' :
                      'Set-shifting accuracy may drop under time pressure'
    };
  }

  // Game 13: Corsi Block Tapping
  const game13 = getGame('cmp_risk_13', 'game13');
  if (game13) {
    games.game13 = {
      name: 'Corsi Block Tapping',
      metric: 'Visuospatial Working Memory',
      score: game13.score,
      errors: game13.errors,
      duration: game13.duration,
      interpretation: game13.details?.maxSequenceLength >= 6 ? 'Strong visuospatial span' :
                      game13.details?.maxSequenceLength >= 4 ? 'Moderate visuospatial memory capacity' :
                      'Visuospatial working memory may need support'
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
function buildPrompt(gameAnalysis, mode, language = 'en') {
  const gamesSummary = Object.values(gameAnalysis)
    .map(g => `${g.name}: ${g.metric} - Score: ${g.score || g.gridScore || g.efficiency || 'N/A'}, ${g.interpretation}`)
    .join('\n');

  const outputLanguage = language === 'es' ? 'Spanish' : 'English';

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
- Write all natural language text in ${outputLanguage}.

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
    const cleaned = String(responseText || '')
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    if (!cleaned) {
      throw new Error('Empty AI response');
    }

    // Try direct parse first for strict JSON responses.
    try {
      const parsedDirect = JSON.parse(cleaned);
      if (isValidAIReport(parsedDirect)) {
        return {
          ...parsedDirect,
          source: 'gemini',
          generatedAt: new Date().toISOString()
        };
      }
    } catch {
      // Fall through to greedy object extraction.
    }

    // Extract JSON from response (in case Gemini adds any extra text)
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const aiReport = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!isValidAIReport(aiReport)) {
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

function isValidAIReport(aiReport) {
  return Boolean(
    aiReport
    && typeof aiReport.summary === 'string'
    && Array.isArray(aiReport.strengths)
    && Array.isArray(aiReport.areasToMonitor)
    && Array.isArray(aiReport.careerRecommendations)
    && typeof aiReport.recommendation === 'string'
  );
}

/**
 * Generate fallback heuristic-based report (for when LLM fails)
 * @param {Object} sessionData - Game session data
 * @returns {Object} Heuristic report
 */
export function generateHeuristicReport(sessionData, language = 'en') {
  const isEn = language === 'en';
  const gameAnalysis = prepareGameAnalysis(sessionData);
  const normalized = normalizeGameScores(gameAnalysis);
  
  // Identify top 3 strengths from normalized scores
  const strengths = [];
  const sortedGames = Object.entries(normalized)
    .sort(([, a], [, b]) => (b || 0) - (a || 0))
    .slice(0, 3);
  
  const gameNames = {
    game1: isEn ? 'Working memory and dual-task management' : 'memoria de trabajo y gestion de doble tarea',
    game2: isEn ? 'Response inhibition and impulse control' : 'inhibicion de respuesta y control de impulsos',
    game3: isEn ? 'Cognitive flexibility and learning agility' : 'flexibilidad cognitiva y agilidad de aprendizaje',
    game4: isEn ? 'Sustained attention and reliability' : 'atencion sostenida y confiabilidad',
    game5: isEn ? 'Decision quality under time pressure' : 'calidad de decision bajo presion de tiempo',
    game6: isEn ? 'Rule adaptation and exception handling' : 'adaptacion a reglas y manejo de excepciones',
    game7: isEn ? 'Workplace judgment and situational awareness' : 'juicio laboral y conciencia situacional',
    game8: isEn ? 'Updating and metacognitive calibration' : 'actualizacion y calibracion metacognitiva',
    game9: isEn ? 'Planning and operational sequencing' : 'planificacion y secuenciacion operativa',
    game10: isEn ? 'Learning agility and rule discovery' : 'agilidad de aprendizaje y descubrimiento de reglas',
    game11: isEn ? 'Inhibition consistency under repetition' : 'consistencia inhibitoria bajo repeticion',
    game12: isEn ? 'Processing speed and cognitive switching' : 'velocidad de procesamiento y cambio cognitivo',
    game13: isEn ? 'Visuospatial working memory capacity' : 'capacidad de memoria de trabajo visoespacial'
  };
  
  sortedGames.forEach(([game, score]) => {
    if (score >= 7) {
      strengths.push(isEn ? `Strong ${gameNames[game]}` : `Fortaleza en ${gameNames[game]}`);
    } else if (score >= 5) {
      strengths.push(isEn ? `Solid ${gameNames[game]}` : `Nivel solido en ${gameNames[game]}`);
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
      areasToMonitor.push(isEn ? `Develop ${baseName} through targeted practice` : `Desarrollar ${baseName} mediante practica focalizada`);
    }
  });
  
  // Calculate overall score (0-10)
  const overallScore = calculateOverallScore(gameAnalysis);
  
  // Determine recommendation tier
  let recommendation, profileTierEn, profileTierEs;
  if (overallScore >= 8) {
    recommendation = 'STRONG ALIGNMENT';
    profileTierEn = 'demonstrates consistently strong performance';
    profileTierEs = 'muestra desempeno consistentemente fuerte';
  } else if (overallScore >= 6.5) {
    recommendation = 'SOLID ALIGNMENT WITH COACHING';
    profileTierEn = 'shows solid fundamentals with specific growth areas';
    profileTierEs = 'muestra fundamentos solidos con areas especificas de mejora';
  } else if (overallScore >= 4.5) {
    recommendation = 'CONDITIONAL ALIGNMENT';
    profileTierEn = 'indicates potential but requires targeted development';
    profileTierEs = 'indica potencial pero requiere desarrollo focalizado';
  } else {
    recommendation = 'EXPLORATORY FIT - NEEDS MORE DATA';
    profileTierEn = 'may benefit from additional assessment or targeted development';
    profileTierEs = 'podria beneficiarse de evaluacion adicional o desarrollo dirigido';
  }

  const summary = isEn
    ? `Executive summary: the profile ${profileTierEn} across core cognitive and workplace judgment domains. This is a developmental signal combining cognitive capacity, decision-making, learning agility, and workplace judgment. Interpret as one input among interviews, experience, and domain expertise for holistic talent decisions.`
    : `Resumen ejecutivo: el perfil ${profileTierEs} en dominios nucleares de cognicion y juicio laboral. Esta es una senal de desarrollo que combina capacidad cognitiva, toma de decisiones, agilidad de aprendizaje y juicio situacional. Debe interpretarse como un insumo junto con entrevistas, experiencia y conocimiento del dominio para decisiones integrales.`;
  
  return {
    summary,
    strengths: strengths.length > 0 
      ? strengths 
      : [isEn ? 'Shows foundational cognitive engagement in assessments' : 'Muestra involucramiento cognitivo base en las evaluaciones'],
    areasToMonitor: areasToMonitor.length > 0 
      ? areasToMonitor 
      : [isEn ? 'Continue developing core cognitive skills' : 'Continuar desarrollando habilidades cognitivas centrales'],
    careerRecommendations: generateCareerRecommendations(normalized, language),
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
function generateCareerRecommendations(normalized, language = 'en') {
  const isEn = language === 'en';
  const recommendations = [];
  
  // High learning agility + rule shift = strong strategic/innovation fit
  if ((normalized.game3 || 0) >= 7 && (normalized.game6 || 0) >= 7) {
    recommendations.push({
      role: isEn ? 'Strategic Analyst / Change Manager' : 'Analista estrategico / Gestor de cambio',
      fit: isEn
        ? 'Strong learning agility and adaptation make this profile valuable for rapidly changing environments and innovation roles'
        : 'La agilidad de aprendizaje y adaptacion hacen valioso este perfil para entornos cambiantes y roles de innovacion'
    });
  }
  
  // High attention + decision-making = operations/coordination fit
  if ((normalized.game4 || 0) >= 7 && (normalized.game5 || 0) >= 6.5) {
    recommendations.push({
      role: isEn ? 'Operations / Process Coordination' : 'Operaciones / Coordinacion de procesos',
      fit: isEn
        ? 'Reliable attention and sound judgment under pressure suit execution-focused roles with complex workflows'
        : 'La atencion consistente y el buen juicio bajo presion encajan con roles de ejecucion y flujos complejos'
    });
  }
  
  // High SJT + working memory = leadership potential
  if ((normalized.game7 || 0) >= 7 && (normalized.game1 || 0) >= 6 && (normalized.game2 || 0) >= 6) {
    recommendations.push({
      role: isEn ? 'Team Lead / Middle Management' : 'Lider de equipo / Gestion media',
      fit: isEn
        ? 'Strong workplace judgment combined with reliable executive function and impulse control suggest readiness for collaborative leadership'
        : 'El juicio laboral fuerte junto con funciones ejecutivas confiables sugieren preparacion para liderazgo colaborativo'
    });
  }
  
  // Default recommendations if no strong pattern emerges
  if (recommendations.length === 0) {
    recommendations.push(
      {
        role: isEn ? 'Analytical/Technical Specialist' : 'Especialista analitico/tecnico',
        fit: isEn
          ? 'Profile suggests value in roles emphasizing focused analysis and technical depth'
          : 'El perfil sugiere valor en roles que exigen analisis focalizado y profundidad tecnica'
      },
      {
        role: isEn ? 'Collaborative Team Member' : 'Miembro colaborativo de equipo',
        fit: isEn
          ? 'Adaptability and judgment align with team-based problem-solving environments'
          : 'La adaptabilidad y el juicio se alinean con entornos de resolucion colaborativa de problemas'
      }
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

  // Game 8: N-Back - Score 0-100 with moderate sensitivity to errors
  if (gameAnalysis.game8) {
    const score = gameAnalysis.game8.score || 0;
    const errors = gameAnalysis.game8.errors || 0;
    const scoreFit = Math.min(10, (score / 100) * 10);
    const errorPenalty = Math.min(3, errors * 0.35);
    normalized.game8 = Math.max(0, scoreFit - errorPenalty);
  }

  // Game 9: Tower of London - planning efficiency and execution quality
  if (gameAnalysis.game9) {
    const score = gameAnalysis.game9.score || 0;
    const errors = gameAnalysis.game9.errors || 0;
    const scoreFit = Math.min(10, (score / 100) * 10);
    const errorPenalty = Math.min(3, errors * 0.35);
    normalized.game9 = Math.max(0, scoreFit - errorPenalty);
  }

  // Game 10: Wisconsin - learning agility under rule changes
  if (gameAnalysis.game10) {
    const score = gameAnalysis.game10.score || 0;
    const errors = gameAnalysis.game10.errors || 0;
    const scoreFit = Math.min(10, (score / 100) * 10);
    const errorPenalty = Math.min(3, errors * 0.4);
    normalized.game10 = Math.max(0, scoreFit - errorPenalty);
  }

  // Game 11: Go/No-Go - inhibition consistency
  if (gameAnalysis.game11) {
    const score = gameAnalysis.game11.score || 0;
    const errors = gameAnalysis.game11.errors || 0;
    const scoreFit = Math.min(10, (score / 100) * 10);
    const errorPenalty = Math.min(3, errors * 0.35);
    normalized.game11 = Math.max(0, scoreFit - errorPenalty);
  }

  // Game 12: Trail Making - speed and switching with error control
  if (gameAnalysis.game12) {
    const score = gameAnalysis.game12.score || 0;
    const errors = gameAnalysis.game12.errors || 0;
    const scoreFit = Math.min(10, (score / 100) * 10);
    const errorPenalty = Math.min(3, errors * 0.45);
    normalized.game12 = Math.max(0, scoreFit - errorPenalty);
  }

  // Game 13: Corsi - visuospatial span
  if (gameAnalysis.game13) {
    const score = gameAnalysis.game13.score || 0;
    const errors = gameAnalysis.game13.errors || 0;
    const scoreFit = Math.min(10, (score / 100) * 10);
    const errorPenalty = Math.min(3, errors * 0.35);
    normalized.game13 = Math.max(0, scoreFit - errorPenalty);
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
    game7: 1.0,  // SJT: Workplace judgment
    game8: 0.9,  // N-Back: updating and calibration
    game9: 1.0,  // Tower of London: planning and sequencing
    game10: 1.2, // Wisconsin: learning agility under shifts
    game11: 0.9, // Go/No-Go: inhibition consistency
    game12: 1.0, // Trail Making: switching speed and reliability
    game13: 0.9  // Corsi: visuospatial span
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

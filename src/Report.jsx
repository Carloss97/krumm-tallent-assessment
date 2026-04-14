import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { useTelemetry } from './TelemetryContext';
import { useLanguage } from './context/LanguageContext';
import {
  generateAIReport,
  generateHeuristicReport,
  getLastAIFailureReason,
  getLastAIDebugTrace,
  checkGeminiHealth,
} from './services/aiReportService';
import { generateEdgeLocalReport } from './services/edgeLocalInferenceService';
import { saveSessionToBackend } from './services/backendService';
import { generateDummyReportData } from './utils/dummyDataGenerator';
import { analyzeTelemetry, buildTelemetryRiskSignals } from './utils/telemetryAnalytics';
import {
  evaluateMetacognitiveCalibration,
  evaluateOperationalPrioritization,
  evaluateLearningAgility,
} from './services/futureAssessments';
import { getExperimentConfig } from './utils/abTesting';
import './Report.css';

const Report = () => {
  const { sessionData, participantProfile, getSessionMetadata } = useTelemetry();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Initialize modes from URL params (useful for deterministic QA scenarios).
  const initialDummyMode = searchParams.get('dummy') === 'true';
  const initialAiMode = searchParams.get('ai') !== 'false';
  
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [aiReport, setAiReport] = useState(null);
  const [useAI, setUseAI] = useState(initialAiMode); // Toggle between AI and heuristic
  const [useDummyData, setUseDummyData] = useState(initialDummyMode);
  const [showDevTelemetry, setShowDevTelemetry] = useState(false);
  const [isAiProbeRunning, setIsAiProbeRunning] = useState(false);
  const [generationNonce, setGenerationNonce] = useState(0);
  const [targetRole, setTargetRole] = useState('generalist');
  const [insightMeta, setInsightMeta] = useState({ mode: 'pending', reason: '' });
  const [geminiHealth, setGeminiHealth] = useState({ checked: false, ok: false, message: '', code: 'UNKNOWN' });
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [lastProbeAt, setLastProbeAt] = useState(null);
  const [aiDebugRows, setAiDebugRows] = useState([]);
  const [sessionSavedId, setSessionSavedId] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const reportGeneratedRef = useRef(false);
  const isTestEnv = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';
  const useBackendGeminiProxy = typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_BACKEND_GEMINI_PROXY !== 'false';
  const hasGeminiKey = Boolean(typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_API_KEY);
  const canUseGemini = useBackendGeminiProxy || hasGeminiKey;
  const preferEdgeLocalInference = typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_EDGE_LOCAL_INFERENCE !== 'false';
  const enableGeminiProbeInDev = typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_HEALTH_PROBE_DEV === 'true';
  const edgeGeminiEscalationEnabled = typeof import.meta !== 'undefined' && import.meta.env?.VITE_EDGE_ESCALATION_ENABLED !== 'false';
  const edgeEscalationMinConfidence = readEnvNumber('VITE_EDGE_ESCALATE_MIN_CONFIDENCE', 66);
  const edgeEscalationMinTelemetryCoverage = readEnvNumber('VITE_EDGE_ESCALATE_MIN_TELEMETRY_COVERAGE', 55);
  const edgeEscalationMinBiometricQuality = readEnvNumber('VITE_EDGE_ESCALATE_MIN_BIOMETRIC_QUALITY', 50);
  const edgeEscalationConfidenceBandMin = readEnvNumber('VITE_EDGE_ESCALATE_CONFIDENCE_BAND_MIN', 64);
  const edgeEscalationConfidenceBandMax = readEnvNumber('VITE_EDGE_ESCALATE_CONFIDENCE_BAND_MAX', 72);
  const edgeEscalationRecommendations = readEnvList(
    'VITE_EDGE_ESCALATE_ON_RECOMMENDATIONS',
    ['CONDITIONAL ALIGNMENT', 'EXPLORATORY FIT - NEEDS MORE DATA']
  );

  const isDevBuild = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

  // Check if we have sufficient data or should use dummy data
  const hasRealData = hasMinimumAssessmentData(sessionData);
  // Support demo-specific dummy subsets via ?demoCount=5 to show only N dummy games
  const demoCountParam = searchParams.get('demoCount');
  const demoCount = demoCountParam ? Number(demoCountParam) : null;

  const reportData = useMemo(() => {
    const base = (useDummyData || !hasRealData) ? generateDummyReportData() : sessionData;
    if (useDummyData && demoCount && typeof base === 'object' && Object.keys(base).length > 0) {
      const entries = Object.keys(base).filter((k) => k !== 'futureModules');
      const subsetKeys = entries.slice(0, Math.max(0, Math.floor(demoCount)));
      const filtered = {};
      subsetKeys.forEach((k) => { filtered[k] = base[k]; });
      if (base.futureModules) filtered.futureModules = base.futureModules;
      return filtered;
    }
    return base;
  }, [useDummyData, hasRealData, sessionData, demoCount]);

  const experimentConfig = useMemo(() => (
    getExperimentConfig('report-insight-panel-v1', participantProfile?.participantId || 'anonymous')
  ), [participantProfile?.participantId]);

  const telemetryAnalytics = useMemo(() => analyzeTelemetry(reportData), [reportData]);
  const telemetryRiskSignals = useMemo(() => buildTelemetryRiskSignals(telemetryAnalytics), [telemetryAnalytics]);
  const telemetryRiskSignalsLocalized = useMemo(
    () => telemetryRiskSignals.map((signal) => translateTelemetrySignal(signal, isEn)),
    [telemetryRiskSignals, isEn]
  );

  const futureAssessmentSummary = useMemo(() => {
    const modules = reportData?.futureModules || {};
    return {
      metacognitive: evaluateMetacognitiveCalibration(modules.metacognitive || []),
      prioritization: evaluateOperationalPrioritization(modules.prioritization || []),
      learningAgility: evaluateLearningAgility(modules.learningAgility || []),
    };
  }, [reportData]);

  const hasFutureModulesData = useMemo(() => {
    const modules = reportData?.futureModules || {};
    return Object.values(modules).some((collection) => Array.isArray(collection) && collection.length > 0);
  }, [reportData]);

  const extendedGameRows = useMemo(() => buildEnhancedRows(reportData, isEn), [reportData, isEn]);
  const devTelemetryOverview = useMemo(() => buildTelemetryOverview(reportData), [reportData]);
  const radarProfile = useMemo(() => buildRadarProfile(reportData, isEn, targetRole), [reportData, isEn, targetRole]);
  const competencyHighlights = useMemo(() => buildCompetencyHighlights(radarProfile), [radarProfile]);
  const roleOptions = useMemo(() => getTargetRoleOptions(isEn), [isEn]);
  const isCooldownActive = cooldownUntil > Date.now();
  const geminiActionHint = getGeminiActionHint(geminiHealth?.code, isEn);
  const isGeminiProbeSkipped = geminiHealth?.code === 'SKIPPED_EDGE_LOCAL';

  const triggerAiRetry = () => {
    if (isCooldownActive) return;
    reportGeneratedRef.current = false;
    setAiReport(null);
    setIsAnalyzing(true);
    setInsightMeta({ mode: 'pending', reason: '' });
    setGenerationNonce((prev) => prev + 1);
  };

  const runDevAiProbe = async () => {
    if (isAiProbeRunning) return;
    setIsAiProbeRunning(true);
    try {
      const health = await checkGeminiHealth();
      setGeminiHealth({
        checked: true,
        ok: Boolean(health?.ok),
        message: health?.message || (isEn ? 'Unknown Gemini health state.' : 'Estado de Gemini desconocido.'),
        code: health?.code || 'UNKNOWN',
      });
      setAiDebugRows(getLastAIDebugTrace());
      setLastProbeAt(new Date().toISOString());
    } finally {
      setIsAiProbeRunning(false);
    }
  };

  useEffect(() => {
    if (!isCooldownActive) return;
    const remainingMs = Math.max(0, cooldownUntil - Date.now());
    const timer = setTimeout(() => {
      setCooldownUntil(0);
    }, remainingMs + 25);
    return () => clearTimeout(timer);
  }, [isCooldownActive, cooldownUntil]);

  useEffect(() => {
    const reason = `${geminiHealth?.code || ''} ${geminiHealth?.message || ''} ${insightMeta?.reason || ''}`.toLowerCase();
    if (reason.includes('quota') || reason.includes('429') || reason.includes('rate limit')) {
      setCooldownUntil((current) => Math.max(current, Date.now() + 30000));
    }
  }, [geminiHealth, insightMeta]);

  useEffect(() => {
    let cancelled = false;

    const runHealthCheck = async () => {
      if (isTestEnv) return;
      if (preferEdgeLocalInference && (!isDevBuild || !enableGeminiProbeInDev)) {
        setGeminiHealth({
          checked: true,
          ok: true,
          message: isEn
            ? 'Edge-local inference active. Gemini health probe is on-demand to reduce backend load and quota usage.'
            : 'Inferencia edge-local activa. El chequeo de Gemini queda bajo demanda para reducir carga y uso de cuota.',
          code: 'SKIPPED_EDGE_LOCAL',
        });
        return;
      }
      if (isCooldownActive) {
        return;
      }
      if (!useAI) {
        setGeminiHealth({
          checked: true,
          ok: false,
          message: isEn ? 'AI mode disabled.' : 'Modo IA desactivado.',
          code: 'DISABLED',
        });
        return;
      }
      if (!canUseGemini) {
        setGeminiHealth({
          checked: true,
          ok: false,
          message: 'Missing Gemini configuration (proxy disabled and VITE_GOOGLE_API_KEY not found).',
          code: 'MISSING_KEY',
        });
        return;
      }

      const health = await checkGeminiHealth();
      if (!cancelled) {
        setGeminiHealth({
          checked: true,
          ok: Boolean(health?.ok),
          message: health?.message || (isEn ? 'Unknown Gemini health state.' : 'Estado de Gemini desconocido.'),
          code: health?.code || 'UNKNOWN',
        });
      }
    };

    runHealthCheck();

    return () => {
      cancelled = true;
    };
  }, [isEn, isTestEnv, useAI, canUseGemini, isCooldownActive, preferEdgeLocalInference, isDevBuild, enableGeminiProbeInDev]);

  // Reset generation state when switching AI/demo modes to avoid stale report output.
  useEffect(() => {
    reportGeneratedRef.current = false;
    setIsAnalyzing(true);
    setAiReport(null);
    setInsightMeta({ mode: 'pending', reason: '' });
    setBackendError(null);
    if (useDummyData) {
      setSessionSavedId(null);
    }
  }, [useDummyData, useAI]);

  // Generate AI report when data is ready
  useEffect(() => {
    if ((hasRealData || useDummyData) && !reportGeneratedRef.current) {
      reportGeneratedRef.current = true;
      const generateReport = async () => {
        try {
          let resolvedReport = null;

          if (useAI) {
            if (preferEdgeLocalInference) {
              const edgeReport = generateEdgeLocalReport(reportData, language, {
                participantId: participantProfile?.participantId || 'anonymous',
              });
              if (edgeReport) {
                resolvedReport = edgeReport;
                setInsightMeta({
                  mode: 'edge-local',
                  reason: isEn
                    ? `Local edge inference completed in browser without raw-data exfiltration (coverage ${edgeReport?.signalAudit?.telemetryCoverageScore ?? 0}%, biometric quality ${edgeReport?.signalAudit?.biometricSignalQualityScore ?? 0}%).`
                    : `Inferencia edge-local completada en navegador sin exfiltración de datos crudos (cobertura ${edgeReport?.signalAudit?.telemetryCoverageScore ?? 0}%, calidad biométrica ${edgeReport?.signalAudit?.biometricSignalQualityScore ?? 0}%).`
                });

                const escalation = evaluateEdgeGeminiEscalation(edgeReport, {
                  enabled: edgeGeminiEscalationEnabled,
                  minConfidence: edgeEscalationMinConfidence,
                  minTelemetryCoverage: edgeEscalationMinTelemetryCoverage,
                  minBiometricQuality: edgeEscalationMinBiometricQuality,
                  confidenceBandMin: edgeEscalationConfidenceBandMin,
                  confidenceBandMax: edgeEscalationConfidenceBandMax,
                  recommendationList: edgeEscalationRecommendations,
                  isEn,
                });

                if (escalation.shouldEscalate && canUseGemini) {
                  const report = await generateAIReport(reportData, 'recruitment', language);
                  if (report) {
                    resolvedReport = report;
                    setInsightMeta({
                      mode: 'ai',
                      reason: isEn
                        ? `Gemini escalation triggered after edge-local due to: ${escalation.reasons.join('; ')}.`
                        : `Escalamiento a Gemini activado tras edge-local por: ${escalation.reasons.join('; ')}.`
                    });
                  } else {
                    setInsightMeta({
                      mode: 'edge-local',
                      reason: isEn
                        ? `Edge-local retained after Gemini escalation attempt failed (${escalation.reasons.join('; ')}).`
                        : `Se mantiene edge-local tras fallo en el escalamiento de Gemini (${escalation.reasons.join('; ')}).`
                    });
                  }
                }
              }
            }

            if (!resolvedReport && canUseGemini) {
              const report = await generateAIReport(reportData, 'recruitment', language);
              if (report) {
                resolvedReport = report;
                setInsightMeta({ mode: 'ai', reason: 'Gemini response parsed successfully.' });
              }
            } else if (!resolvedReport && !preferEdgeLocalInference) {
              setInsightMeta({ mode: 'heuristic', reason: 'Missing Gemini configuration (proxy disabled and no frontend API key).' });
            }
          }

          if (!resolvedReport) {
            // Fallback to heuristic if AI fails or is disabled
            resolvedReport = generateHeuristicReport(reportData, language);
            if (!useAI) {
              setInsightMeta({ mode: 'heuristic', reason: isEn ? 'AI mode is disabled by user toggle.' : 'El modo IA está desactivado por el usuario.' });
            } else if (canUseGemini) {
              const fallbackReason = getLastAIFailureReason() || 'AI call failed or returned invalid JSON; fallback activated.';
              setInsightMeta({ mode: 'heuristic', reason: fallbackReason });
            } else {
              setInsightMeta({
                mode: 'heuristic',
                reason: isEn
                  ? 'Edge-local output unavailable and Gemini not configured; heuristic fallback activated.'
                  : 'Salida edge-local no disponible y Gemini no configurado; fallback heurístico activado.'
              });
            }
          }

          setAiReport(resolvedReport);
          setAiDebugRows(getLastAIDebugTrace());
          setIsAnalyzing(false);
        } catch (error) {
          console.error('Error generating AI report:', error);
          const heuristicReport = generateHeuristicReport(reportData, language);
          setAiReport(heuristicReport);
          setAiDebugRows(getLastAIDebugTrace());
          setInsightMeta({ mode: 'heuristic', reason: isEn ? 'Runtime error while generating AI report; fallback activated.' : 'Error de ejecución al generar reporte IA; fallback activado.' });
          setIsAnalyzing(false);
        }

        // Save session to backend
        if (!useDummyData && hasRealData && !sessionSavedId) {
          try {
            const safeMetadata = typeof getSessionMetadata === 'function'
              ? getSessionMetadata()
              : { timestamp: new Date().toISOString() };

            const saveRes = await saveSessionToBackend({
              participant: participantProfile,
              sessionData: reportData,
              metadata: safeMetadata
            });
            setSessionSavedId(saveRes.sessionId);
            setBackendError(null);
          } catch (error) {
            setBackendError('No se pudo guardar la sesión en backend');
            console.error('Backend save failure', error);
          }
        }
      };
      generateReport();
    }
  }, [
    hasRealData,
    useDummyData,
    useAI,
    language,
    reportData,
    participantProfile,
    getSessionMetadata,
    sessionSavedId,
    canUseGemini,
    generationNonce,
    isEn,
    preferEdgeLocalInference,
    edgeGeminiEscalationEnabled,
    edgeEscalationMinConfidence,
    edgeEscalationMinTelemetryCoverage,
    edgeEscalationMinBiometricQuality,
    edgeEscalationConfidenceBandMin,
    edgeEscalationConfidenceBandMax,
    edgeEscalationRecommendations
  ]);

  if (!hasRealData && !useDummyData) {
    return (
      <>
        <a href="#report-main" className="skip-link">{isEn ? 'Skip to report' : 'Saltar al reporte'}</a>
        <main id="report-main" className="flex-center glass-panel report-empty report-page report-empty-main" role="main" tabIndex={-1}>
          <h2>{isEn ? 'No Assessment Data Found' : 'No se encontraron datos de evaluación'}</h2>
          <p>{isEn ? 'Please complete the extended assessment to view the HR report.' : 'Completa la evaluación extendida para ver el reporte final.'}</p>
          <div className="report-inline-actions" style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
            <button className="btn" onClick={() => window.location.href = '/'}>{isEn ? 'Go to Start' : 'Ir al inicio'}</button>
            <button className="btn report-btn-muted" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', border: '1px solid #7c3aed' }} onClick={() => setUseDummyData(true)} aria-pressed={useDummyData}>
              {isEn ? 'View Demo Report' : 'Ver reporte demo'}
            </button>
          </div>
        </main>
      </>
    );
  }

  if (isAnalyzing) {
    return (
      <>
        <a href="#report-main" className="skip-link">{isEn ? 'Skip to report' : 'Saltar al reporte'}</a>
        <main id="report-main" className="flex-center report-loading report-page" role="main" tabIndex={-1}>
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="glass-panel report-loading-card"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="spinner"
            />
            <h2 className="text-gradient">{isEn ? 'Analyzing Telemetry Data...' : 'Analizando telemetría...'}</h2>
            <p className="loading-text">
              {useAI
                ? (isEn ? 'Calling AI model to interpret cognitive patterns...' : 'Consultando modelo IA para interpretar patrones cognitivos...')
                  : (isEn ? 'Processing behavioral metrics...' : 'Procesando métricas conductuales...')}
            </p>
          </motion.div>
        </main>
      </>
    );
  }

  // Use AI report if available, otherwise fallback to heuristic
  const report = aiReport || generateHeuristicReport(reportData, language);
  const recommendationLabel = getRecommendationLabel(report.recommendation, isEn);
  const actionPriorities = buildActionPriorities(report, competencyHighlights, isEn);
  const participantRadarColor = '#D55E00';
  const participantRadarFill = '#F4A261';
  const targetRadarColor = '#0072B2';
  const targetRadarFill = '#56B4E9';

  return (
      <>
      <a href="#report-main" className="skip-link">{isEn ? 'Skip to report' : 'Saltar al reporte'}</a>
      <main id="report-main" className="report-page" role="main" tabIndex={-1}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel report-shell"
        
        >
        <h1 className="text-gradient report-heading" style={{ fontSize: '2.5rem', marginBottom: '8px', textAlign: 'center' }}>
          {report.source === 'edge-local'
            ? (isEn ? 'Edge-Local Skills Assessment' : 'Evaluación de habilidades edge-local')
            : report.source === 'gemini'
            ? (isEn ? 'AI-Powered Skills Assessment' : 'Evaluación de habilidades con IA')
            : (isEn ? 'Skills Evaluation Matrix' : 'Matriz de evaluación de habilidades')}
        </h1>
        <p className="report-subheading" style={{ textAlign: 'center', color: '#374151', marginBottom: '40px' }}>
          {report.source === 'edge-local'
            ? (isEn ? 'Generated by local edge model in browser' : 'Generado por modelo edge local en el navegador')
            : report.source === 'gemini'
            ? (isEn ? 'Generated by Google Gemini AI' : 'Generado por Google Gemini AI')
            : (isEn ? 'Heuristic-Based Analysis' : 'Análisis basado en heurísticas')}
          {useDummyData && <span style={{ color: '#7c3aed', fontStyle: 'italic' }}>{isEn ? ' | Demo Data' : ' | Datos demo'}</span>}
        </p>

        {participantProfile?.participantId && (
          <div
            className="report-meta-pill"
            style={{
              margin: '0 auto 24px',
              width: 'fit-content',
              padding: '8px 14px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#065f46',
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          >
            {isEn ? 'Participant' : 'Participante'}: {participantProfile.participantId}
          </div>
        )}

        <div className="glass-panel-light report-section" style={{ padding: '24px', marginBottom: '32px' }}>
          <h3 className="report-section-title" style={{ marginBottom: '14px', color: '#1e1b4b', fontWeight: '700', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '8px' }}>
            {isEn ? 'Executive Capability Snapshot' : 'Resumen ejecutivo de capacidades'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '18px' }}>
            <TelemetryStatCard label={isEn ? 'Profile Signal' : 'Senal de perfil'} value={recommendationLabel || 'N/A'} />
            <TelemetryStatCard label={isEn ? 'Confidence' : 'Confianza'} value={report.confidenceScore ? `${report.confidenceScore}%` : 'N/A'} />
            {
              (() => {
                const covered = extendedGameRows.filter((row) => typeof row.score === 'number').length;
                const total = (useDummyData && demoCount) ? demoCount : GAME_ROWS.length;
                return (
                  <TelemetryStatCard label={isEn ? 'Coverage' : 'Cobertura'} value={`${covered}/${total} ${isEn ? 'games' : 'juegos'}`} />
                );
              })()
            }
            {report.source === 'edge-local' && report.runtime?.latencyMs != null && (
              <TelemetryStatCard label={isEn ? 'Edge p95 target' : 'Objetivo p95 edge'} value={`${report.runtime.latencyMs} ms`} />
            )}
            {report.source === 'edge-local' && report.signalAudit?.telemetryCoverageScore != null && (
              <TelemetryStatCard label={isEn ? 'Telemetry coverage' : 'Cobertura telemetrica'} value={`${report.signalAudit.telemetryCoverageScore}%`} />
            )}
            {report.source === 'edge-local' && report.signalAudit?.biometricSignalQualityScore != null && (
              <TelemetryStatCard label={isEn ? 'Biometric quality' : 'Calidad biométrica'} value={`${report.signalAudit.biometricSignalQualityScore}%`} />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <label htmlFor="target-role-select" style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 600 }}>
              {isEn ? 'Target Role Profile' : 'Perfil objetivo del puesto'}
            </label>
            <select
              id="target-role-select"
              value={targetRole}
              onChange={(event) => setTargetRole(event.target.value)}
              aria-label={isEn ? 'Target role profile' : 'Perfil objetivo del puesto'}
              style={{ borderRadius: '8px', border: '1px solid rgba(99,102,241,0.3)', padding: '6px 10px', color: '#1e293b', background: 'rgba(255,255,255,0.9)' }}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              {isEn ? 'Radar compares participant score vs target skill profile.' : 'El radar compara el puntaje del postulante contra el perfil objetivo.'}
            </div>
          </div>

          <div className="radar-grid">
            <div className="radar-panel">
              {isTestEnv ? (
                <RadarChart width={520} height={280} data={radarProfile} outerRadius="72%">
                  <PolarGrid stroke="rgba(99,102,241,0.28)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: '#334155', fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Radar name={isEn ? 'Participant' : 'Postulante'} dataKey="value" stroke={participantRadarColor} fill={participantRadarFill} fillOpacity={0.33} strokeWidth={2.5} />
                  <Radar name={isEn ? 'Target Profile' : 'Perfil objetivo'} dataKey="baseline" stroke={targetRadarColor} fill={targetRadarFill} fillOpacity={0.18} strokeWidth={2.5} />
                </RadarChart>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarProfile} outerRadius="72%">
                    <PolarGrid stroke="rgba(99,102,241,0.28)" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: '#334155', fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Radar name={isEn ? 'Participant' : 'Postulante'} dataKey="value" stroke={participantRadarColor} fill={participantRadarFill} fillOpacity={0.33} strokeWidth={2.5} />
                    <Radar name={isEn ? 'Target Profile' : 'Perfil objetivo'} dataKey="baseline" stroke={targetRadarColor} fill={targetRadarFill} fillOpacity={0.18} strokeWidth={2.5} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="stats-grid">
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div style={{ fontWeight: 700, color: '#065f46', marginBottom: '6px' }}>{isEn ? 'Top Strengths' : 'Fortalezas principales'}</div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#065f46', lineHeight: '1.55' }}>
                  {competencyHighlights.top.map((item) => (
                    <li key={item.axis}>{item.axis} ({item.value})</li>
                  ))}
                </ul>
              </div>

              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '6px' }}>{isEn ? 'Development Focus' : 'Foco de desarrollo'}</div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#92400e', lineHeight: '1.55' }}>
                  {competencyHighlights.watch.map((item) => (
                    <li key={item.axis}>{item.axis} ({item.value})</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px', justifyContent: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.86)', border: '1px solid rgba(148,163,184,0.35)' }}>
              <span style={{ width: 12, height: 12, borderRadius: 999, background: participantRadarColor, border: `2px solid ${participantRadarFill}` }} />
              <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 600 }}>{isEn ? 'Participant score' : 'Puntaje postulante'}</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.86)', border: '1px solid rgba(148,163,184,0.35)' }}>
              <span style={{ width: 12, height: 12, borderRadius: 999, background: targetRadarColor, border: `2px solid ${targetRadarFill}` }} />
              <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 600 }}>{isEn ? 'Target role profile' : 'Perfil objetivo del puesto'}</span>
            </div>
          </div>
        </div>

        {/* Extended Results for new battery */}
        <div className="glass-panel-light report-section" style={{ padding: '24px', marginBottom: '32px' }}>
          <h3 className="report-section-title" style={{ marginBottom: '16px', color: '#1e1b4b', fontWeight: '700', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '8px' }}>
            {isEn ? 'Integrated Battery Results (Games 1-13)' : 'Resultados integrados de bateria (juegos 1-13)'}
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ color: '#374151', textAlign: 'left' }}>
                  <th scope="col" style={{ padding: '8px', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>{isEn ? 'Game' : 'Juego'}</th>
                  <th scope="col" style={{ padding: '8px', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>{isEn ? 'Construct' : 'Constructo'}</th>
                  <th scope="col" style={{ padding: '8px', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>Score</th>
                  <th scope="col" style={{ padding: '8px', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>{isEn ? 'Errors' : 'Errores'}</th>
                  <th scope="col" style={{ padding: '8px', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>{isEn ? 'Duration' : 'Duracion'}</th>
                  <th scope="col" style={{ padding: '8px', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>{isEn ? 'Key Metric' : 'Metrica clave'}</th>
                </tr>
              </thead>
              <tbody>
                {extendedGameRows.map((row) => (
                  <tr key={row.id} style={{ color: '#374151' }}>
                    <th scope="row" style={{ padding: '8px', borderBottom: '1px solid rgba(148,163,184,0.15)', textAlign: 'left' }}>{row.name}</th>
                    <td style={{ padding: '8px', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>{row.construct}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>{row.score}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>{row.errors}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>{row.duration}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>{row.metric}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Skills and Talent Signal Panel */}
        <div className="report-ai-signal" style={{ 
          backgroundColor: 'rgba(255,255,255,0.7)', 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '32px',
          textAlign: 'center',
          border: `2px solid ${getRecommendationColor(report.recommendation)}`
        }}>
          <h2 style={{ color: '#374151', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {report.source === 'edge-local'
              ? (isEn ? 'Edge-Local Skills and Talent Signal' : 'Senal edge-local de talento y habilidades')
              : report.source === 'gemini'
              ? (isEn ? 'AI Skills and Talent Signal' : 'Senal de talento y habilidades por IA')
              : (isEn ? 'System Skills and Talent Signal' : 'Senal de talento y habilidades del sistema')}
          </h2>
          <div style={{ color: '#475569', marginTop: '10px', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {isEn
              ? 'This panel summarizes interpretation context. Primary recommendation and confidence are shown once in the executive snapshot to avoid duplication.'
              : 'Este panel resume el contexto de interpretacion. La recomendacion principal y confianza se muestran una sola vez para evitar duplicacion.'}
          </div>
          <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '999px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#3730a3', fontSize: '0.86rem', fontWeight: 600 }}>
            {isEn ? 'Insight Source' : 'Fuente de insight'}: {insightMeta.mode === 'edge-local' ? 'edge-local' : insightMeta.mode === 'ai' ? 'ai' : 'heuristic'}
          </div>
          {insightMeta.reason && (
            <div role="status" aria-live="polite" aria-atomic="true" style={{ marginTop: '8px', color: '#64748b', fontSize: '0.82rem', maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto' }}>
              {insightMeta.reason}
            </div>
          )}
          {report.source === 'edge-local' && report.model?.calibrationVersion && (
            <div style={{ marginTop: '8px', color: '#475569', fontSize: '0.8rem' }}>
              {isEn ? 'Calibration' : 'Calibración'}: {report.model.calibrationVersion} | {isEn ? 'cohort' : 'cohorte'} {report.model.calibrationCohort || 'general'} | A/B {report.model.calibrationVariant || 'calibrated'}
              {report.model.rollbackToStable ? ` (${isEn ? 'rollback to stable' : 'rollback a estable'})` : ''}
            </div>
          )}
        </div>

        <div className="glass-panel-light report-health" style={{ padding: '14px', marginBottom: '24px', border: geminiHealth.ok ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(245,158,11,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <strong style={{ color: geminiHealth.ok ? '#047857' : '#92400e' }}>
              {isEn ? 'Gemini Health Check' : 'Chequeo de salud Gemini'}: {isGeminiProbeSkipped ? (isEn ? 'ON-DEMAND' : 'BAJO DEMANDA') : geminiHealth.ok ? 'OK' : (isEn ? 'Warning' : 'Advertencia')}
            </strong>
            <span style={{ color: '#64748b', fontSize: '0.86rem' }}>
              {geminiHealth.checked ? geminiHealth.message : (isEn ? 'Checking...' : 'Verificando...')}
            </span>
          </div>
          {!geminiHealth.ok && geminiHealth.checked && geminiActionHint && (
            <div style={{ marginTop: '8px', color: '#92400e', fontSize: '0.84rem' }}>
              {isEn ? 'Next step' : 'Siguiente paso'}: {geminiActionHint}
            </div>
          )}
        </div>

        {report.source === 'edge-local' && report.signalAudit && (
          <div className="glass-panel-light report-health" style={{ padding: '14px', marginBottom: '24px', border: '1px solid rgba(2,132,199,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <strong style={{ color: '#0c4a6e' }}>
                {isEn ? 'Edge Telemetry/Biometric Audit' : 'Auditoría edge telemétrica/biométrica'}
              </strong>
              <span style={{ color: '#475569', fontSize: '0.86rem' }}>
                {isEn ? 'Derived signals only, no raw video exfiltration.' : 'Solo señales derivadas, sin exfiltración de video crudo.'}
              </span>
            </div>
            <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
              <TelemetryStatCard label={isEn ? 'Cursor events' : 'Eventos cursor'} value={report.signalAudit.cursorEvents} />
              <TelemetryStatCard label={isEn ? 'Webcam frames' : 'Frames webcam'} value={report.signalAudit.webcamFrames} />
              <TelemetryStatCard label={isEn ? 'Face presence' : 'Presencia facial'} value={`${report.signalAudit.facePresenceRatio}%`} />
              <TelemetryStatCard label={isEn ? 'Blink rate' : 'Tasa parpadeo'} value={report.signalAudit.avgBlinkRate} />
              <TelemetryStatCard label={isEn ? 'Webcam quality' : 'Calidad webcam'} value={report.signalAudit.avgWebcamQuality} />
              <TelemetryStatCard label={isEn ? 'Quality flags' : 'Señales de calidad'} value={report.signalAudit.qualityFlags} />
            </div>
          </div>
        )}

        {isDevBuild && aiDebugRows.length > 0 && (
          <div className="glass-panel-light report-debug" style={{ padding: '14px', marginBottom: '24px', border: '1px dashed rgba(51,65,85,0.35)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>
              {isEn ? 'Gemini Debug Attempts (Dev)' : 'Intentos debug Gemini (Dev)'}
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ color: '#334155', textAlign: 'left' }}>
                    <th style={{ padding: '6px', borderBottom: '1px solid rgba(148,163,184,0.3)' }}>{isEn ? 'Stage' : 'Etapa'}</th>
                    <th style={{ padding: '6px', borderBottom: '1px solid rgba(148,163,184,0.3)' }}>{isEn ? 'Model' : 'Modelo'}</th>
                    <th style={{ padding: '6px', borderBottom: '1px solid rgba(148,163,184,0.3)' }}>HTTP</th>
                    <th style={{ padding: '6px', borderBottom: '1px solid rgba(148,163,184,0.3)' }}>Code</th>
                    <th style={{ padding: '6px', borderBottom: '1px solid rgba(148,163,184,0.3)' }}>{isEn ? 'Message' : 'Mensaje'}</th>
                  </tr>
                </thead>
                <tbody>
                  {aiDebugRows.map((row, idx) => (
                    <tr key={`${row.stage}-${row.model}-${idx}`}>
                      <td style={{ padding: '6px', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>{row.stage || '-'}</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>{row.model || '-'}</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>{row.status ?? '-'}</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>{row.code || '-'}</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>{row.message || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {experimentConfig.showTelemetryInsightPanel && (
          <div className="glass-panel-light" style={{ padding: '24px', marginBottom: '32px', border: '1px solid rgba(14,165,233,0.35)' }}>
            <h3 style={{ marginBottom: '14px', color: '#0c4a6e', fontWeight: '700' }}>
              {isEn ? 'Behavioral Signal Insights (A/B Variant)' : 'Insights de señales conductuales (variante A/B)'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <TelemetryStatCard label={isEn ? 'Completion Rate' : 'Tasa de finalizacion'} value={`${telemetryAnalytics.completionRate}%`} />
              <TelemetryStatCard label={isEn ? 'Attention Stability' : 'Estabilidad atencional'} value={`${telemetryAnalytics.attentionStabilityScore}%`} />
              <TelemetryStatCard label={isEn ? 'Telemetry Density' : 'Densidad de telemetría'} value={telemetryAnalytics.telemetryDensity} />
              <TelemetryStatCard label={isEn ? 'Cursor Hesitation' : 'Hesitación de cursor'} value={telemetryAnalytics.hesitationCount} />
            </div>
            {telemetryRiskSignals.length > 0 && (
              <ul style={{ marginTop: '12px', color: '#334155', lineHeight: '1.6' }}>
                {telemetryRiskSignalsLocalized.map((signal, idx) => (
                  <li key={idx}>{signal}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="glass-panel-light report-section" style={{ padding: '24px', marginBottom: '32px' }}>
          <h3 className="report-section-title" style={{ marginBottom: '12px', color: '#1e1b4b', fontWeight: '700', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '8px' }}>
            {isEn ? 'Future Modules (High-Priority Plan) - Beta Scoring' : 'Módulos futuros (plan prioritario) - scoring beta'}
          </h3>
          {!hasFutureModulesData && (
            <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.25)', color: '#075985', fontSize: '0.9rem' }}>
              <div>
                {isEn
                  ? 'No future-module events were captured in this session yet. Scores stay as pending beta until telemetry is collected.'
                    : 'Aún no se capturaron eventos de módulos futuros en esta sesión. Los puntajes quedan pendientes en beta hasta recolectar telemetría.'}
              </div>
              <button
                type="button"
                onClick={() => navigate('/future/lab')}
                style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(2,132,199,0.35)', background: 'rgba(255,255,255,0.65)', color: '#0c4a6e', fontWeight: 600, cursor: 'pointer' }}
              >
                {isEn ? 'Capture Future Modules Now' : 'Capturar Future Modules ahora'}
              </button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(15,23,42,0.1)' }}>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>{isEn ? 'Metacognitive Calibration' : 'Calibración metacognitiva'}</div>
              <div style={{ color: '#334155', marginTop: 4 }}>{hasFutureModulesData ? futureAssessmentSummary.metacognitive.label : (isEn ? 'PENDING CAPTURE' : 'CAPTURA PENDIENTE')}</div>
              <div style={{ color: '#64748b', marginTop: 4 }}>{isEn ? 'Score' : 'Puntaje'}: {hasFutureModulesData ? futureAssessmentSummary.metacognitive.score : '--'}</div>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(15,23,42,0.1)' }}>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>{isEn ? 'Operational Prioritization' : 'Priorizacion operativa'}</div>
              <div style={{ color: '#334155', marginTop: 4 }}>{hasFutureModulesData ? futureAssessmentSummary.prioritization.label : (isEn ? 'PENDING CAPTURE' : 'CAPTURA PENDIENTE')}</div>
              <div style={{ color: '#64748b', marginTop: 4 }}>{isEn ? 'Score' : 'Puntaje'}: {hasFutureModulesData ? futureAssessmentSummary.prioritization.score : '--'}</div>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(15,23,42,0.1)' }}>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>{isEn ? 'Learning Agility' : 'Agilidad de aprendizaje'}</div>
              <div style={{ color: '#334155', marginTop: 4 }}>{hasFutureModulesData ? futureAssessmentSummary.learningAgility.label : (isEn ? 'PENDING CAPTURE' : 'CAPTURA PENDIENTE')}</div>
              <div style={{ color: '#64748b', marginTop: 4 }}>{isEn ? 'Score' : 'Puntaje'}: {hasFutureModulesData ? futureAssessmentSummary.learningAgility.score : '--'}</div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="glass-panel-light report-section" style={{ padding: '24px', marginBottom: '32px' }}>
          <h3 className="report-section-title" style={{ marginBottom: '16px', color: '#1e1b4b', fontWeight: '700', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '8px' }}>
            {isEn ? 'Executive Summary' : 'Resumen ejecutivo'}
          </h3>
          <p style={{ color: '#374151', lineHeight: '1.8', fontSize: '1.05rem' }}>
            {report.summary}
          </p>
        </div>

        {/* Strengths & Areas to Monitor */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {/* Strengths */}
          <div className="glass-panel-light" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: '#10b981', fontWeight: '700', fontSize: '1.15rem' }}>
              {isEn ? 'Key Strengths' : 'Fortalezas clave'}
            </h3>
            <ul style={{ color: '#374151', lineHeight: '1.8', listStyle: 'none', padding: 0 }}>
              {report.strengths && report.strengths.map((strength, idx) => (
                <li key={idx} style={{ marginBottom: '8px', paddingLeft: '24px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#10b981' }}>*</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* Areas to Monitor */}
          <div className="glass-panel-light" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: '#f59e0b', fontWeight: '700', fontSize: '1.15rem' }}>
              {isEn ? 'Areas to Monitor' : 'Areas a monitorear'}
            </h3>
            <ul style={{ color: '#374151', lineHeight: '1.8', listStyle: 'none', padding: 0 }}>
              {report.areasToMonitor && report.areasToMonitor.map((area, idx) => (
                <li key={idx} style={{ marginBottom: '8px', paddingLeft: '24px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#f59e0b' }}>*</span>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="glass-panel-light report-section" style={{ padding: '24px', marginBottom: '32px' }}>
          <h3 className="report-section-title" style={{ marginBottom: '16px', color: '#1e1b4b', fontWeight: '700', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '8px' }}>
            {isEn ? '90-Day Action Priorities' : 'Prioridades de accion a 90 dias'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {actionPriorities.map((priority, idx) => (
              <div key={idx} style={{ padding: '14px', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.28)', background: 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(244,247,255,0.9))' }}>
                <div style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                  {isEn ? `Priority ${idx + 1}` : `Prioridad ${idx + 1}`}
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{priority.title}</div>
                <div style={{ color: '#334155', fontSize: '0.9rem', lineHeight: '1.55' }}>{priority.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Career Fit */}
        {report.careerRecommendations && report.careerRecommendations.length > 0 && (
          <div className="glass-panel-light report-section" style={{ padding: '24px', marginBottom: '32px' }}>
            <h3 className="report-section-title" style={{ marginBottom: '16px', color: '#1e1b4b', fontWeight: '700', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '8px' }}>
              {isEn ? 'Career Fit Recommendations' : 'Recomendaciones de encaje de carrera'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {report.careerRecommendations.map((rec, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    padding: '16px', 
                    backgroundColor: 'rgba(99,102,241,0.08)',
                    borderRadius: '8px',
                    borderLeft: '4px solid #7c3aed'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#1e1b4b', marginBottom: '6px' }}>
                    {rec.role}
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#374151' }}>
                    {rec.fit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toggle AI/Heuristic */}
        <div className="report-toggle-zone" style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div className="report-toggle-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn"
              aria-pressed={useAI}
              style={{
                padding: '8px 16px',
                fontSize: '0.9rem',
                background: useAI ? '#7c3aed' : 'rgba(124, 58, 237, 0.2)',
                color: useAI ? 'white' : '#7c3aed',
                border: useAI ? '1px solid #7c3aed' : '1px solid rgba(124, 58, 237, 0.5)'
              }}
              onClick={() => setUseAI(!useAI)}
            >
              {useAI ? (isEn ? 'AI Mode' : 'Modo IA') : (isEn ? 'Heuristic Mode' : 'Modo heurístico')}
            </button>
            {isDevBuild && (
              <button
                className="btn"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  background: 'rgba(217, 119, 6, 0.15)',
                  color: '#92400e',
                  border: '1px solid rgba(217, 119, 6, 0.45)'
                }}
                onClick={runDevAiProbe}
                disabled={isAiProbeRunning || isCooldownActive}
              >
                {isAiProbeRunning
                  ? (isEn ? 'Testing Gemini...' : 'Probando Gemini...')
                  : isCooldownActive
                    ? (isEn ? 'Quota cooldown active' : 'Cooldown de cuota activo')
                    : (isEn ? 'Run Gemini Test' : 'Ejecutar prueba Gemini')}
              </button>
            )}
            {isDevBuild && useAI && (
              <button
                className="btn"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  background: 'rgba(2, 132, 199, 0.15)',
                  color: '#075985',
                  border: '1px solid rgba(2, 132, 199, 0.45)'
                }}
                onClick={triggerAiRetry}
                disabled={isCooldownActive}
              >
                {isCooldownActive
                  ? (isEn ? 'Retry locked by quota cooldown' : 'Reintento bloqueado por cooldown de cuota')
                  : (isEn ? 'Retry AI Generation' : 'Reintentar generación IA')}
              </button>
            )}
            {hasRealData && (
              <button
                className="btn"
                aria-pressed={useDummyData}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  background: useDummyData ? '#059669' : 'rgba(5, 150, 105, 0.2)',
                  color: useDummyData ? 'white' : '#059669',
                  border: useDummyData ? '1px solid #059669' : '1px solid rgba(5, 150, 105, 0.5)'
                }}
                onClick={() => setUseDummyData(!useDummyData)}
              >
                {useDummyData ? (isEn ? 'Demo Data' : 'Datos demo') : (isEn ? 'Real Data' : 'Datos reales')}
              </button>
            )}
            {isDevBuild && (
              <button
                className="btn"
                aria-pressed={showDevTelemetry}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  background: showDevTelemetry ? '#0ea5e9' : 'rgba(14, 165, 233, 0.2)',
                  color: showDevTelemetry ? 'white' : '#0369a1',
                  border: showDevTelemetry ? '1px solid #0ea5e9' : '1px solid rgba(14, 165, 233, 0.5)'
                }}
                onClick={() => setShowDevTelemetry(prev => !prev)}
              >
                {showDevTelemetry
                  ? (isEn ? 'Dev Telemetry: ON' : 'Telemetría dev: ON')
                  : (isEn ? 'Dev Telemetry: OFF' : 'Telemetría dev: OFF')}
              </button>
            )}
          </div>
          {isDevBuild && (isCooldownActive || lastProbeAt) && (
            <div style={{ marginTop: '10px', fontSize: '0.82rem', color: '#64748b' }}>
              {isCooldownActive && (isEn ? 'Quota cooldown active. Wait before the next Gemini probe.' : 'Cooldown por cuota activo. Espera antes del siguiente sondeo de Gemini.')}
              {!isCooldownActive && lastProbeAt && (isEn ? `Last Gemini probe: ${new Date(lastProbeAt).toLocaleTimeString()}` : `Último sondeo de Gemini: ${new Date(lastProbeAt).toLocaleTimeString()}`)}
            </div>
          )}
        </div>

        {/* Development-only telemetry visualization */}
        {isDevBuild && showDevTelemetry && (
          <div className="glass-panel-light" style={{ padding: '24px', marginBottom: '32px', border: '1px dashed rgba(14,165,233,0.5)' }}>
            <h3 style={{ marginBottom: '8px', color: '#0c4a6e', fontWeight: '700' }}>{isEn ? 'Development Telemetry Panel' : 'Panel de telemetría de desarrollo'}</h3>
            <p style={{ color: '#0f172a', fontSize: '0.9rem', marginBottom: '18px' }}>
              {isEn
                ? 'Debug-only panel for cursor/webcam telemetry validation. Do not use for production decisions.'
                : 'Panel solo de depuración para validar telemetría de cursor/webcam. No usar para decisiones de producción.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '18px' }}>
              <TelemetryStatCard label={isEn ? 'Cursor Events' : 'Eventos de cursor'} value={devTelemetryOverview.cursorEvents} />
              <TelemetryStatCard label={isEn ? 'Click Events' : 'Eventos de click'} value={devTelemetryOverview.clickEvents} />
              <TelemetryStatCard label={isEn ? 'Trial Events' : 'Eventos de prueba'} value={devTelemetryOverview.trialEvents} />
              <TelemetryStatCard label={isEn ? 'Webcam Frames' : 'Frames de webcam'} value={devTelemetryOverview.webcamFrames} />
              <TelemetryStatCard label={isEn ? 'Avg Webcam Quality' : 'Calidad media webcam'} value={devTelemetryOverview.avgWebcamQuality} />
              <TelemetryStatCard label={isEn ? 'Quality Flags' : 'Flags de calidad'} value={devTelemetryOverview.qualityFlags} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <h4 style={{ color: '#1e293b', margin: '0 0 10px 0' }}>{isEn ? 'Telemetry Coverage by Game' : 'Cobertura de telemetría por juego'}</h4>
              {devTelemetryOverview.perGameCoverage.map((row) => (
                <div key={row.id} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#334155' }}>
                    <span>{row.name}</span>
                    <span>{row.coverage}%</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: 'rgba(148,163,184,0.25)', borderRadius: 999 }}>
                    <div style={{ width: `${row.coverage}%`, height: 8, background: '#0ea5e9', borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>

            <details>
              <summary style={{ cursor: 'pointer', color: '#075985', fontWeight: 600 }}>{isEn ? 'View Raw Telemetry Snapshot' : 'Ver snapshot crudo de telemetría'}</summary>
              <pre style={{ marginTop: '10px', maxHeight: '260px', overflow: 'auto', background: '#0f172a', color: '#e2e8f0', padding: '12px', borderRadius: '8px', fontSize: '0.75rem' }}>
                {JSON.stringify(devTelemetryOverview.rawSnapshot, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="report-footer" style={{ textAlign: 'center', marginTop: '40px' }}>
          <div role="status" aria-live="polite" aria-atomic="true" style={{ marginBottom: '12px', color: '#475569' }}>
            {!useDummyData && backendError && <span style={{ color: '#dc2626' }}>[WARN] {backendError}</span>}
            {!useDummyData && !backendError && sessionSavedId && <span style={{ color: '#16a34a' }}>{isEn ? `[OK] Session saved with ID ${sessionSavedId}` : `[OK] Sesión guardada con ID ${sessionSavedId}`}</span>}
            {!useDummyData && !backendError && !sessionSavedId && <span style={{ color: '#0ea5e9' }}>{isEn ? 'Saving session to backend...' : 'Guardando sesión en backend...'}</span>}
            {useDummyData && <span style={{ color: '#7c3aed' }}>{isEn ? '[INFO] Demo mode: backend save disabled' : '[INFO] Modo demo: guardado en backend desactivado'}</span>}
          </div>
          <button className="btn" style={{ padding: '16px 40px', fontSize: '1.2rem' }} onClick={() => window.location.href = '/'}>
            {isEn ? 'Start Another Assessment' : 'Iniciar otra evaluación'}
          </button>
        </div>
        </motion.div>
      </main>
    </>
  );
};

const getRecommendationColor = (recommendation) => {
  switch(recommendation) {
    case 'STRONG ALIGNMENT':
      return '#10b981'; // green
    case 'SOLID ALIGNMENT WITH COACHING':
      return '#06b6d4'; // cyan
    case 'CONDITIONAL ALIGNMENT':
      return '#f59e0b'; // amber
    case 'EXPLORATORY FIT - NEEDS MORE DATA':
    default:
      return '#f43f5e'; // rose
  }
};

const TelemetryStatCard = ({ label, value }) => (
  <div className="report-stat-card" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(148,163,184,0.3)', borderRadius: '8px', padding: '10px' }}>
    <div style={{ color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
    <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.05rem' }}>{value}</div>
  </div>
);

const GAME_ROWS = [
  { id: 'ospan_game_1', legacyId: 'game1', name: { en: 'Game 1 - OSPAN', es: 'Juego 1 - OSPAN' }, construct: { en: 'Working Memory', es: 'Memoria de trabajo' } },
  { id: 'sst_game_2', legacyId: 'game2', name: { en: 'Game 2 - Stop-Signal', es: 'Juego 2 - Stop-Signal' }, construct: { en: 'Response Inhibition', es: 'Inhibición de respuesta' } },
  { id: 'tsw_game_3', legacyId: 'game3', name: { en: 'Game 3 - Task Switching', es: 'Juego 3 - Cambio de tareas' }, construct: { en: 'Cognitive Flexibility', es: 'Flexibilidad cognitiva' } },
  { id: 'cpt_game_4', legacyId: 'game4', name: { en: 'Game 4 - CPT', es: 'Juego 4 - CPT' }, construct: { en: 'Sustained Attention', es: 'Atención sostenida' } },
  { id: 'dec_game_5', legacyId: 'game5', name: { en: 'Game 5 - Decision', es: 'Juego 5 - Decisión' }, construct: { en: 'Decision Making', es: 'Toma de decisiones' } },
  { id: 'rsh_game_6', legacyId: 'game6', name: { en: 'Game 6 - Rule Shift', es: 'Juego 6 - Cambio de reglas' }, construct: { en: 'Adaptation', es: 'Adaptación' } },
  { id: 'sjt_game_7', legacyId: 'game7', name: { en: 'Game 7 - SJT', es: 'Juego 7 - SJT' }, construct: { en: 'Situational Judgment', es: 'Juicio situacional' } },
  { id: 'cmp_meta_8', legacyId: 'game8', name: { en: 'Game 8 - Metacognitive Calibration', es: 'Juego 8 - Calibración metacognitiva' }, construct: { en: 'Metacognitive Accuracy', es: 'Precisión metacognitiva' } },
  { id: 'cmp_ops_9', legacyId: 'game9', name: { en: 'Game 9 - Operational Prioritization', es: 'Juego 9 - Priorización operativa' }, construct: { en: 'Operational Prioritization', es: 'Priorización operativa' } },
  { id: 'cmp_agility_10', legacyId: 'game10', name: { en: 'Game 10 - Learning Agility', es: 'Juego 10 - Agilidad de aprendizaje' }, construct: { en: 'Adaptive Learning', es: 'Aprendizaje adaptativo' } },
  { id: 'cmp_social_11', legacyId: 'game11', name: { en: 'Game 11 - Social Coordination', es: 'Juego 11 - Coordinación social' }, construct: { en: 'Social Coordination', es: 'Coordinación social' } },
  { id: 'cmp_resilience_12', legacyId: 'game12', name: { en: 'Game 12 - Cognitive Resilience', es: 'Juego 12 - Resiliencia cognitiva' }, construct: { en: 'Resilience Under Load', es: 'Resiliencia bajo carga' } },
  { id: 'cmp_risk_13', legacyId: 'game13', name: { en: 'Game 13 - Risk Under Uncertainty', es: 'Juego 13 - Riesgo bajo incertidumbre' }, construct: { en: 'Risk Decision Framing', es: 'Marco de decisión en riesgo' } },
];

const RADAR_DIMENSIONS = [
  { key: 'memory', axis: { en: 'Memory', es: 'Memoria' }, keys: ['ospan_game_1', 'game1', 'cmp_meta_8', 'game8', 'cmp_risk_13', 'game13'] },
  { key: 'control', axis: { en: 'Control', es: 'Control' }, keys: ['sst_game_2', 'game2', 'cmp_social_11', 'game11'] },
  { key: 'agility', axis: { en: 'Agility', es: 'Agilidad' }, keys: ['tsw_game_3', 'game3', 'rsh_game_6', 'game6', 'cmp_agility_10', 'game10'] },
  { key: 'attention', axis: { en: 'Attention', es: 'Atención' }, keys: ['cpt_game_4', 'game4', 'cmp_resilience_12', 'game12'] },
  { key: 'decision', axis: { en: 'Decision', es: 'Decisión' }, keys: ['dec_game_5', 'game5', 'cmp_ops_9', 'game9'] },
  { key: 'judgment', axis: { en: 'Judgment', es: 'Juicio' }, keys: ['sjt_game_7', 'game7'] },
];

const TARGET_ROLE_PROFILES = {
  generalist: { memory: 72, control: 72, agility: 72, attention: 72, decision: 72, judgment: 72 },
  analyst: { memory: 82, control: 70, agility: 76, attention: 86, decision: 80, judgment: 72 },
  operations: { memory: 74, control: 74, agility: 72, attention: 80, decision: 84, judgment: 78 },
  sales: { memory: 68, control: 70, agility: 78, attention: 72, decision: 82, judgment: 84 },
  manager: { memory: 74, control: 76, agility: 80, attention: 74, decision: 82, judgment: 88 },
};

function getTargetRoleOptions(isEn) {
  return [
    { value: 'generalist', label: isEn ? 'Generalist (Balanced)' : 'Generalista (balanceado)' },
    { value: 'analyst', label: isEn ? 'Analyst / Data' : 'Analista / Datos' },
    { value: 'operations', label: isEn ? 'Operations / Process' : 'Operaciones / Procesos' },
    { value: 'sales', label: isEn ? 'Sales / Commercial' : 'Ventas / Comercial' },
    { value: 'manager', label: isEn ? 'People Manager' : 'Líder de equipo' },
  ];
}

function getRecommendationLabel(recommendation, isEn) {
  const labels = {
    'STRONG ALIGNMENT': isEn ? 'Strong Alignment' : 'Alineación fuerte',
    'SOLID ALIGNMENT WITH COACHING': isEn ? 'Solid Alignment With Coaching' : 'Alineación sólida con coaching',
    'CONDITIONAL ALIGNMENT': isEn ? 'Conditional Alignment' : 'Alineación condicional',
    'EXPLORATORY FIT - NEEDS MORE DATA': isEn ? 'Exploratory Fit - Needs More Data' : 'Encaje exploratorio - requiere más datos',
  };
  return labels[recommendation] || recommendation;
}

function getGeminiActionHint(code, isEn) {
  const hints = {
    MISSING_KEY: isEn
      ? 'Add VITE_GOOGLE_API_KEY to .env and restart Vite.'
      : 'Agrega VITE_GOOGLE_API_KEY en .env y reinicia Vite.',
    KEY_INVALID: isEn
      ? 'Rotate the API key and verify it belongs to the active Google Cloud project.'
      : 'Rota la API key y verifica que pertenezca al proyecto activo de Google Cloud.',
    KEY_LEAKED: isEn
      ? 'Create a new key immediately and restrict it by HTTP referrer and API scope.'
      : 'Crea una nueva key de inmediato y restringela por referrer HTTP y alcance de API.',
    PERMISSION_DENIED: isEn
      ? 'Enable Generative Language API and billing, then retry.'
      : 'Habilita Generative Language API y billing, luego reintenta.',
    MODEL_NOT_FOUND: isEn
      ? 'Use a model listed in health probe results or update VITE_GEMINI_MODEL.'
      : 'Usa un modelo listado en el probe de salud o actualiza VITE_GEMINI_MODEL.',
    QUOTA_EXCEEDED: isEn
      ? 'Wait for quota reset or route requests through backend with throttling/queue.'
      : 'Espera el reinicio de cuota o enruta requests por backend con throttling/cola.',
    MODEL_AND_QUOTA_CONFLICT: isEn
      ? 'Switch to an available model and reduce probe frequency to avoid quota lock.'
      : 'Cambia a un modelo disponible y reduce la frecuencia de probes para evitar bloqueo por cuota.',
    NETWORK_ERROR: isEn
      ? 'Check network/VPN/firewall rules and retry from backend to isolate browser restrictions.'
      : 'Revisa red/VPN/firewall y reintenta desde backend para aislar restricciones del navegador.',
    PROXY_UNREACHABLE: isEn
      ? 'Start backend server (npm run dev:server) and verify VITE_API_BASE_URL points to it.'
      : 'Inicia el backend (npm run dev:server) y verifica que VITE_API_BASE_URL apunte a ese servidor.',
  };

  return hints[code] || (isEn
    ? 'Inspect Gemini debug attempts and use heuristic fallback while connectivity is unstable.'
    : 'Inspecciona los intentos de depuración de Gemini y usa fallback heurístico mientras la conectividad sea inestable.');
}

function readEnvNumber(key, fallback) {
  const raw = typeof import.meta !== 'undefined' ? import.meta.env?.[key] : undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readEnvList(key, fallback) {
  const raw = typeof import.meta !== 'undefined' ? import.meta.env?.[key] : '';
  if (!raw || typeof raw !== 'string') return fallback;
  const values = raw
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
  return values.length > 0 ? values : fallback;
}

function evaluateEdgeGeminiEscalation(edgeReport, config) {
  if (!config?.enabled || !edgeReport || edgeReport.source !== 'edge-local') {
    return { shouldEscalate: false, reasons: [] };
  }

  const reasons = [];
  const confidence = Number(edgeReport?.confidenceScore ?? 0);
  const telemetryCoverage = Number(edgeReport?.signalAudit?.telemetryCoverageScore ?? 0);
  const biometricQuality = Number(edgeReport?.signalAudit?.biometricSignalQualityScore ?? 0);
  const recommendation = String(edgeReport?.recommendation || '').trim();

  if (confidence < config.minConfidence) {
    reasons.push(
      config.isEn
        ? `low confidence ${confidence}% < ${config.minConfidence}%`
        : `confianza baja ${confidence}% < ${config.minConfidence}%`
    );
  }

  if (telemetryCoverage < config.minTelemetryCoverage) {
    reasons.push(
      config.isEn
        ? `telemetry coverage ${telemetryCoverage}% < ${config.minTelemetryCoverage}%`
        : `cobertura telemétrica ${telemetryCoverage}% < ${config.minTelemetryCoverage}%`
    );
  }

  if (biometricQuality < config.minBiometricQuality) {
    reasons.push(
      config.isEn
        ? `biometric quality ${biometricQuality}% < ${config.minBiometricQuality}%`
        : `calidad biométrica ${biometricQuality}% < ${config.minBiometricQuality}%`
    );
  }

  const inBorderlineBand = confidence >= config.confidenceBandMin && confidence <= config.confidenceBandMax;
  if (inBorderlineBand && config.recommendationList.includes(recommendation)) {
    reasons.push(
      config.isEn
        ? `borderline recommendation ${recommendation} within confidence band ${config.confidenceBandMin}-${config.confidenceBandMax}%`
        : `recomendación borderline ${recommendation} dentro de banda de confianza ${config.confidenceBandMin}-${config.confidenceBandMax}%`
    );
  }

  return {
    shouldEscalate: reasons.length > 0,
    reasons,
  };
}

function translateTelemetrySignal(signal, isEn) {
  if (isEn) return signal;
  const map = {
    'Insufficient telemetry coverage for high-confidence behavioral inference': 'Cobertura de telemetría insuficiente para inferencias conductuales de alta confianza',
    'Partial assessment completion may reduce predictive confidence': 'La evaluación parcial puede reducir la confianza predictiva',
    'Webcam signal quality was low; visual attention features should be interpreted cautiously': 'La calidad de webcam fue baja; interpretar con cautela las señales de atención visual',
    'Frequent hesitation markers detected in cursor behavior under time pressure': 'Se detectaron marcadores frecuentes de hesitación en el cursor bajo presión temporal',
    'Multiple telemetry quality flags suggest unstable capture conditions': 'Múltiples alertas de calidad de telemetría sugieren condiciones de captura inestables',
  };
  return map[signal] || signal;
}

function hasMinimumAssessmentData(data) {
  if (!data) return false;
  const required = GAME_ROWS.filter((g) => data[g.id] || data[g.legacyId]);
  return required.length >= 4;
}

function getGameSnapshot(data, id, legacyId) {
  return data[id] || data[legacyId] || null;
}

function formatDuration(ms) {
  if (!ms || Number.isNaN(ms)) return 'N/A';
  return `${Math.round(ms / 1000)}s`;
}

function buildEnhancedRows(data, isEn) {
  return GAME_ROWS.map((game) => {
    const snapshot = getGameSnapshot(data, game.id, game.legacyId);
    const details = snapshot?.details || {};
    const metric =
      details.operationAccuracy !== undefined ? `${isEn ? 'Operation accuracy' : 'Precision operacional'} ${details.operationAccuracy}%` :
      details.accuracy !== undefined ? `${isEn ? 'Accuracy' : 'Precisión'} ${details.accuracy}%` :
      details.nBackLevel !== undefined ? `${isEn ? 'N-back level' : 'Nivel N-back'} ${details.nBackLevel}` :
      details.efficiency !== undefined ? `${isEn ? 'Efficiency' : 'Eficiencia'} ${details.efficiency}` :
      details.categoriesCompleted !== undefined ? `${isEn ? 'Categories' : 'Categorías'} ${details.categoriesCompleted}` :
      details.noGoAccuracy !== undefined ? `${isEn ? 'No-Go accuracy' : 'Precisión No-Go'} ${details.noGoAccuracy}%` :
      details.totalTime !== undefined ? `${isEn ? 'Total time' : 'Tiempo total'} ${Math.round(details.totalTime / 1000)}s` :
      details.maxSequenceLength !== undefined ? `${isEn ? 'Max sequence' : 'Secuencia máxima'} ${details.maxSequenceLength}` :
      details.blocksCompleted !== undefined ? `${isEn ? 'Blocks' : 'Bloques'} ${details.blocksCompleted}` :
      details.scenariosCompleted !== undefined ? `${isEn ? 'Scenarios' : 'Escenarios'} ${details.scenariosCompleted}` :
      (isEn ? 'Telemetry captured' : 'Telemetría capturada');

    return {
      id: game.id,
      name: isEn ? game.name.en : game.name.es,
      construct: isEn ? game.construct.en : game.construct.es,
      score: snapshot?.score ?? 'N/A',
      errors: snapshot?.errors ?? 'N/A',
      duration: formatDuration(snapshot?.duration),
      metric,
    };
  });
}

function buildTelemetryOverview(data) {
  const snapshots = GAME_ROWS.map((g) => ({
    id: g.id,
    name: g.name.en,
    snapshot: getGameSnapshot(data, g.id, g.legacyId),
  })).filter((item) => item.snapshot);

  const sum = (key) => snapshots.reduce((acc, item) => acc + (item.snapshot[key]?.length || 0), 0);
  const webcamQualityValues = snapshots
    .map((item) => item.snapshot.webcamQualityScore)
    .filter((v) => typeof v === 'number' && !Number.isNaN(v));

  const avgWebcamQuality = webcamQualityValues.length
    ? Math.round(webcamQualityValues.reduce((a, b) => a + b, 0) / webcamQualityValues.length)
    : 0;

  const perGameCoverage = snapshots.map((item) => {
    const hasCursor = (item.snapshot.mouseMovements?.length || 0) > 0;
    const hasClicks = (item.snapshot.clicks?.length || 0) > 0;
    const hasTrials = (item.snapshot.trialEvents?.length || 0) > 0;
    const hasWebcam = (item.snapshot.webcamFrames?.length || 0) > 0;
    const coverage = Math.round(([hasCursor, hasClicks, hasTrials, hasWebcam].filter(Boolean).length / 4) * 100);

    return {
      id: item.id,
      name: item.name,
      coverage,
    };
  });

  return {
    cursorEvents: sum('mouseMovements'),
    clickEvents: sum('clicks'),
    trialEvents: sum('trialEvents'),
    webcamFrames: sum('webcamFrames'),
    avgWebcamQuality,
    qualityFlags: snapshots.reduce((acc, item) => acc + (item.snapshot.qualityFlags?.length || 0), 0),
    perGameCoverage,
    rawSnapshot: snapshots.map((item) => ({
      id: item.id,
      score: item.snapshot.score,
      errors: item.snapshot.errors,
      cursorEvents: item.snapshot.mouseMovements?.length || 0,
      clickEvents: item.snapshot.clicks?.length || 0,
      trialEvents: item.snapshot.trialEvents?.length || 0,
      webcamFrames: item.snapshot.webcamFrames?.length || 0,
      webcamQualityScore: item.snapshot.webcamQualityScore || 0,
      qualityFlags: item.snapshot.qualityFlags || [],
      cursorMetrics: item.snapshot.cursorMetrics || null,
      details: item.snapshot.details || null,
    })),
  };
}

function buildRadarProfile(data, isEn, targetRole) {
  const targetProfile = TARGET_ROLE_PROFILES[targetRole] || TARGET_ROLE_PROFILES.generalist;

  return RADAR_DIMENSIONS.map((dim) => {
    const values = dim.keys
      .map((k) => data?.[k]?.score)
      .filter((v) => typeof v === 'number' && !Number.isNaN(v));

    const value = values.length
      ? Math.round(values.reduce((acc, current) => acc + current, 0) / values.length)
      : 0;

    return {
      axis: isEn ? dim.axis.en : dim.axis.es,
      value,
      baseline: targetProfile[dim.key] || 70,
    };
  });
}

function buildCompetencyHighlights(radarProfile) {
  const sorted = [...radarProfile].sort((a, b) => b.value - a.value);
  return {
    top: sorted.slice(0, 3),
    watch: [...sorted].reverse().slice(0, 2),
  };
}

function buildActionPriorities(report, competencyHighlights, isEn) {
  const top = competencyHighlights.top[0];
  const watch = competencyHighlights.watch[0];
  const monitor = report?.areasToMonitor?.[0];

  return [
    {
      title: top ? `${isEn ? 'Scale' : 'Escalar'} ${top.axis}` : (isEn ? 'Scale strongest capability' : 'Escalar capacidad más fuerte'),
      detail: top
        ? (isEn ? `Use ${top.axis} in high-impact tasks and mentoring flows to maximize current strengths.` : `Usa ${top.axis} en tareas de alto impacto y mentorías para maximizar fortalezas actuales.`)
        : (isEn ? 'Assign stretch tasks aligned with the strongest demonstrated capability.' : 'Asigna retos alineados con la capacidad más fuerte demostrada.'),
    },
    {
      title: watch ? `${isEn ? 'Coach' : 'Entrenar'} ${watch.axis}` : (isEn ? 'Targeted development sprint' : 'Sprint de desarrollo focalizado'),
      detail: watch
        ? (isEn ? `Set a focused coaching cycle for ${watch.axis} with weekly measurable checkpoints.` : `Define un ciclo de coaching para ${watch.axis} con checkpoints semanales medibles.`)
        : (isEn ? 'Run a 4-6 week development plan with practical rehearsal scenarios.' : 'Ejecuta un plan de 4-6 semanas con escenarios prácticos de entrenamiento.'),
    },
    {
      title: isEn ? 'Interview + manager alignment' : 'Alineación entrevista + manager',
      detail: monitor
        ? (isEn ? `Probe this signal in interviews and onboarding plan: ${monitor}` : `Profundiza esta señal en entrevistas y plan de onboarding: ${monitor}`)
        : (isEn ? 'Validate development hypotheses with structured behavioral interviews and manager rubric.' : 'Valida hipótesis de desarrollo con entrevistas conductuales estructuradas y rúbrica del manager.'),
    },
  ];
}

export default Report;




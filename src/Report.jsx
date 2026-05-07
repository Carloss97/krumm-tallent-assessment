import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import { useTelemetry } from './TelemetryContext';
import { useLanguage } from './context/LanguageContext';
import {
  generateAIReport,
  generateHeuristicReport,
  getLastAIDebugTrace,
  checkGeminiHealth,
} from './services/aiReportService';
import { generateEdgeLocalReport } from './services/edgeLocalInferenceService';
import { saveSessionToBackend, getCurrentToken } from './services/backendService';
import { generateDummyReportData } from './utils/dummyDataGenerator';
import './Report.css';

const Report = ({ isDummy = false, useDummyData = false, demoSummary = null }) => {
  const { sessionData, participantProfile, getSessionMetadata } = useTelemetry();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [searchParams] = useSearchParams();
  
  // Initialize modes from URL params or props.
  const initialDummyMode = isDummy || useDummyData || searchParams.get('dummy') === 'true';
  const initialAiMode = searchParams.get('ai') !== 'false';
  
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [aiReport, setAiReport] = useState(null);
  const [useAI] = useState(initialAiMode); // AI mode state
  const [dummyModeEnabled] = useState(initialDummyMode);
  const [showDummyReport, setShowDummyReport] = useState(false);
  const [showDevTelemetry] = useState(false);
  const [generationNonce] = useState(0);
  const [targetRole, setTargetRole] = useState('generalist');
  const [insightMeta, setInsightMeta] = useState({ mode: 'pending', reason: '' });
  const [geminiHealth, setGeminiHealth] = useState({ checked: false, ok: false, message: '', code: 'UNKNOWN' });
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [aiDebugRows, setAiDebugRows] = useState([]);
  const [sessionSavedId, setSessionSavedId] = useState(null);
  const reportGeneratedRef = useRef(false);
  const isTestEnv = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';
  const useBackendGeminiProxy = typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_BACKEND_GEMINI_PROXY !== 'false';
  const hasGeminiKey = Boolean(typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_API_KEY);
  const canUseGemini = useBackendGeminiProxy || hasGeminiKey;
  const geminiReady = canUseGemini && geminiHealth.checked && geminiHealth.ok;
  const preferEdgeLocalInference = typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_EDGE_LOCAL_INFERENCE !== 'false';
  const enableGeminiProbeInDev = typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_HEALTH_PROBE_DEV === 'true';
  const edgeGeminiEscalationEnabled = typeof import.meta !== 'undefined' && import.meta.env?.VITE_EDGE_ESCALATION_ENABLED === 'true';
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

  // Use passed demo data if available, otherwise fallback to sessionData
  const effectiveSessionData = useMemo(() => {
    if (demoSummary && demoSummary.activities && demoSummary.activities.length > 0) {
      // Reconstruct session data from demo activities
      const reconstructed = {};
      console.log('[Report] ===== RECONSTRUCTING FROM DEMO =====');
      console.log(`[Report] demoSummary.activities length: ${demoSummary.activities.length}`);
      demoSummary.activities.forEach((act, idx) => {
        const telKey = act.telemetryId || act.id;
        const data = act.analytics || act;
        console.log(`[Report]   [${idx}] ${act.id} (telKey: ${telKey}): has analytics=${!!act.analytics}`);
        if (act.analytics) {
          console.log(`        confidence=${act.analytics.confidence}, coverage=${act.analytics.gameCoverage}`);
        }
        if (telKey && (data.score !== undefined || data.duration !== undefined || data.confidence !== undefined || Object.keys(data).length > 2)) {
          reconstructed[telKey] = data;
        }
      });
      console.log('[Report] Reconstructed keys:', Object.keys(reconstructed));
      if (Object.keys(reconstructed).length > 0) {
        console.log('[Report] ✓ Using reconstructed demo data');
        return reconstructed;
      }
    }
    console.log('[Report] No valid demoSummary, using sessionData from context:', Object.keys(sessionData || {}));
    return sessionData;
  }, [demoSummary, sessionData]);

  // Check if we have sufficient data or should use dummy data
  const hasRealData = hasMinimumAssessmentData(effectiveSessionData);
  console.log('[Report] hasRealData:', hasRealData, 'effectiveSessionData keys:', Object.keys(effectiveSessionData || {}));
  // Support demo-specific dummy subsets via ?demoCount=5 to show only N dummy games
  const demoCountParam = searchParams.get('demoCount');
  const demoCount = demoCountParam ? Number(demoCountParam) : null;
  const shouldShowDummyData = dummyModeEnabled && (showDummyReport || hasRealData);

  const reportData = useMemo(() => {
    // Prefer real data if available, only use dummy as fallback
    if (hasRealData) {
      console.log('[Report] Using real data from assessment');
      return effectiveSessionData;
    }
    if (shouldShowDummyData) {
      console.log('[Report] Using dummy data (demo mode enabled)');
      const base = generateDummyReportData();
      if (demoCount && typeof base === 'object' && Object.keys(base).length > 0) {
        const entries = Object.keys(base).filter((k) => k !== 'futureModules');
        const subsetKeys = entries.slice(0, Math.max(0, Math.floor(demoCount)));
        const filtered = {};
        subsetKeys.forEach((k) => { filtered[k] = base[k]; });
        if (base.futureModules) filtered.filtered = base.futureModules;
        return filtered;
      }
      return base;
    }
    console.log('[Report] Using fallback heuristic (no real or dummy data)');
    return effectiveSessionData;
  }, [hasRealData, shouldShowDummyData, effectiveSessionData, demoCount]);

  const radarProfile = useMemo(() => buildRadarProfile(reportData, isEn, targetRole), [reportData, isEn, targetRole]);
  const competencyHighlights = useMemo(() => buildCompetencyHighlights(radarProfile), [radarProfile]);
  const roleOptions = useMemo(() => getTargetRoleOptions(isEn), [isEn]);
  const isCooldownActive = cooldownUntil > now;

  useEffect(() => {
    if (cooldownUntil <= 0) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

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
      const timer = setTimeout(() => {
        setCooldownUntil((current) => Math.max(current, Date.now() + 30000));
      }, 0);
      return () => clearTimeout(timer);
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
    const timer = setTimeout(() => {
      setIsAnalyzing(true);
      setAiReport(null);
      setInsightMeta({ mode: 'pending', reason: '' });
      if (dummyModeEnabled) {
        setSessionSavedId(null);
      }
      setShowDummyReport(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [dummyModeEnabled, useAI]);

  // Generate AI report when data is ready
  useEffect(() => {
    if ((hasRealData || shouldShowDummyData) && !reportGeneratedRef.current) {
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

                // Only escalate when explicitly enabled. Local report is the default path.
                if (edgeGeminiEscalationEnabled) {
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

                  if (escalation.shouldEscalate && geminiReady) {
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
            }

            if (!resolvedReport && geminiReady) {
              const report = await generateAIReport(reportData, 'recruitment', language);
              if (report) {
                resolvedReport = report;
                setInsightMeta({ mode: 'ai', reason: 'Gemini response parsed successfully.' });
              }
            }
          }

          if (!resolvedReport) {
            // Fallback to heuristic if AI fails or is disabled
            resolvedReport = generateHeuristicReport(reportData, language);
            if (!useAI) {
              setInsightMeta({ mode: 'heuristic', reason: isEn ? 'AI mode is disabled by user toggle.' : 'El modo IA está desactivado por el usuario.' });
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
        } catch (error) {
          console.error('Error generating AI report:', error);
          const heuristicReport = generateHeuristicReport(reportData, language);
          setAiReport(heuristicReport);
          setAiDebugRows(getLastAIDebugTrace());
          setInsightMeta({ mode: 'heuristic', reason: isEn ? 'Runtime error while generating AI report; fallback activated.' : 'Error de ejecución al generar reporte IA; fallback activado.' });
        } finally {
          setIsAnalyzing(false);
        }

        // Save session to backend in background with retries (don't block UI)
        if (!dummyModeEnabled && hasRealData && !sessionSavedId) {
          (async () => {
            const safeMetadata = typeof getSessionMetadata === 'function'
              ? getSessionMetadata()
              : { timestamp: new Date().toISOString() };

            const token = getCurrentToken();
            if (!token || !participantProfile?.participantId) {
              console.info('[Report] Skipping backend session save because no authenticated participant token is available.');
              return;
            }

            const sessionDataPayload = {
              startedAt: safeMetadata.startedAt || new Date().toISOString(),
              completedAt: new Date().toISOString(),
              participantId: participantProfile.participantId,
              telemetry: effectiveSessionData,
              report: reportData,
              demoSummary,
            };

            const maxAttempts = 3;
            let attempt = 0;
            while (attempt < maxAttempts) {
              attempt += 1;
              try {
                const saveRes = await saveSessionToBackend({
                  participant: participantProfile,
                  sessionData: sessionDataPayload,
                  metadata: safeMetadata
                });
                if (saveRes && saveRes.sessionId) {
                  setSessionSavedId(saveRes.sessionId);
                }
                break;
              } catch (err) {
                const backoff = 500 * Math.pow(2, attempt);
                console.warn('[Report] save attempt failed, retrying', { attempt, err: err?.message, backoff });
                await new Promise((r) => setTimeout(r, backoff));
              }
            }
          })();
        }
      };
      generateReport();
    }
  }, [
    hasRealData,
    shouldShowDummyData,
    useAI,
    language,
    reportData,
    effectiveSessionData,
    demoSummary,
    participantProfile,
    getSessionMetadata,
    sessionSavedId,
    canUseGemini,
    geminiReady,
    generationNonce,
    isEn,
    preferEdgeLocalInference,
    edgeGeminiEscalationEnabled,
    edgeEscalationMinConfidence,
    edgeEscalationMinTelemetryCoverage,
    edgeEscalationMinBiometricQuality,
    edgeEscalationConfidenceBandMin,
    edgeEscalationConfidenceBandMax,
    edgeEscalationRecommendations,
    geminiHealth,
    dummyModeEnabled
  ]);

  if (!hasRealData && !shouldShowDummyData) {
    return (
      <main id="report-main" className="flex-center glass-panel report-empty report-page report-empty-main" role="main" tabIndex={-1}>
        <h2>{isEn ? 'No Assessment Data Found' : 'No se encontraron datos de evaluación'}</h2>
        <p>{isEn ? 'Please complete the extended assessment to view the HR report.' : 'Completa la evaluación extendida para ver el reporte final.'}</p>
        {dummyModeEnabled && (
          <button className="btn btn-primary" onClick={() => setShowDummyReport(true)} style={{ marginTop: '20px' }}>
            {isEn ? 'View Demo Report' : 'Ver reporte demo'}
          </button>
        )}
      </main>
    );
  }

  if (isAnalyzing) {
    return (
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
        </motion.div>
      </main>
    );
  }

  // Use AI report if available, otherwise fallback to heuristic
  const report = aiReport || generateHeuristicReport(reportData, language);
  const recommendationLabel = getRecommendationLabel(report.recommendation, isEn);
  const extendedGameRows = buildEnhancedRows(reportData, isEn);
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
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="report-shell"
        >
        <h1 className="report-heading" style={{ fontSize: '3.2rem', marginBottom: '12px', textAlign: 'center' }}>
          {report.source === 'edge-local'
            ? (isEn ? 'Edge-Local Skills Assessment' : 'Evaluación de habilidades edge-local')
            : report.source === 'gemini'
            ? (isEn ? 'AI-Powered Talent Analysis' : 'Análisis de talento con IA')
            : (isEn ? 'Executive Skills Matrix' : 'Matriz ejecutiva de habilidades')}
        </h1>
        <p className="report-subheading" style={{ textAlign: 'center', marginBottom: '48px', fontSize: '1.1rem' }}>
          {report.source === 'edge-local'
            ? (isEn ? 'Local neural interpretation engine' : 'Interpretación neuronal local')
            : report.source === 'gemini'
            ? (isEn ? 'Powered by Google Gemini Enterprise' : 'Potenciado por Google Gemini Enterprise')
            : (isEn ? 'Heuristic Analysis' : 'Análisis heurístico')}
          {dummyModeEnabled && <span style={{ color: '#6366f1', fontWeight: 700 }}>{isEn ? ' • Verified Demo' : ' • Demo verificada'}</span>}
        </p>

        {dummyModeEnabled && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="demo-cta-panel" 
            role="region" 
            aria-label={isEn ? 'Demo information' : 'Información demo'}
          >
            <div className="demo-cta-inner">
              <h3 className="demo-cta-title">{isEn ? 'Cognitive Competencies Estimated:' : 'Capacidades cognitivas estimadas:'}</h3>
              <ul className="demo-skills" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: 0, margin: '24px 0', listStyle: 'none' }}>
                {(
                  isEn
                    ? ['Selective Attention', 'Spatial Reasoning', 'Risk Calibration', 'Process Optimization', 'Cognitive Control']
                    : ['Atención selectiva', 'Razonamiento espacial', 'Calibración de riesgo', 'Optimización de procesos', 'Control cognitivo']
                ).map((s) => <li key={s}>{s}</li>)}
              </ul>

              <p style={{ marginTop: 24, color: '#a5b4fc', fontSize: '1rem', lineHeight: 1.6 }}>{isEn ? 'This system is currently in advanced preview. For organizational deployment or pilot programs, please contact our talent engineering team.' : 'Este sistema se encuentra en fase de vista previa avanzada. Para despliegues organizacionales o programas piloto, contacte a nuestro equipo de ingeniería de talento.'}</p>

              <div style={{ marginTop: 32, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <a className="report-contact-link" href="mailto:info@krumm.cl">info@krumm.cl</a>
                <a className="report-contact-link" href="mailto:contacto@krumm.cl">contacto@krumm.cl</a>
              </div>
            </div>
          </motion.div>
        )}

        {participantProfile?.participantId && (
          <div className="report-meta-pill" style={{ margin: '0 auto 32px', display: 'flex' }}>
            <span style={{ opacity: 0.7 }}>{isEn ? 'PARTICIPANT ID' : 'ID PARTICIPANTE'}:</span>
            <span style={{ color: '#1e1b4b' }}>{participantProfile.participantId}</span>
          </div>
        )}

        <div className="report-section">
          <h3 className="report-section-title">
            {isEn ? 'Executive Capability Snapshot' : 'Resumen ejecutivo de capacidades'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <TelemetryStatCard label={isEn ? 'Profile Signal' : 'Señal de perfil'} value={recommendationLabel || 'N/A'} />
            <TelemetryStatCard label={isEn ? 'Confidence' : 'Confianza'} value={report.confidenceScore ? `${report.confidenceScore}%` : 'N/A'} />
            {
              (() => {
                const covered = extendedGameRows.filter((row) => typeof row.score === 'number').length;
                const total = (dummyModeEnabled && demoCount) ? demoCount : GAME_ROWS.length;
                return (
                  <TelemetryStatCard label={isEn ? 'Coverage' : 'Cobertura'} value={`${covered}/${total} ${isEn ? 'units' : 'módulos'}`} />
                );
              })()
            }
            {report.source === 'edge-local' && (
              <TelemetryStatCard label={isEn ? 'Latency' : 'Latencia'} value={`${report.runtime?.latencyMs || 0}ms`} />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <label htmlFor="target-role-select" style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 700 }}>
              {isEn ? 'Target Role Benchmark:' : 'Benchmark de puesto:'}
            </label>
            <select
              id="target-role-select"
              className="target-role-select"
              value={targetRole}
              onChange={(event) => setTargetRole(event.target.value)}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="radar-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            <div className="radar-panel">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarProfile} outerRadius="80%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                  <Radar name={isEn ? 'Participant' : 'Postulante'} dataKey="value" stroke={participantRadarColor} fill={participantRadarFill} fillOpacity={0.4} strokeWidth={3} />
                  <Radar name={isEn ? 'Target' : 'Objetivo'} dataKey="baseline" stroke={targetRadarColor} fill={targetRadarFill} fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="stats-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ padding: '20px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <div style={{ fontWeight: 800, color: '#059669', marginBottom: '12px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{isEn ? 'Top Strengths' : 'Fortalezas clave'}</div>
                <ul style={{ margin: 0, paddingLeft: '0', color: '#065f46', lineHeight: '1.8', listStyle: 'none' }}>
                  {competencyHighlights.top.map((item) => (
                    <li key={item.axis} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>{item.axis}</span>
                      <span style={{ color: '#059669' }}>{item.value}%</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} style={{ padding: '20px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                <div style={{ fontWeight: 800, color: '#d97706', marginBottom: '12px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{isEn ? 'Growth Areas' : 'Áreas de crecimiento'}</div>
                <ul style={{ margin: 0, paddingLeft: '0', color: '#92400e', lineHeight: '1.8', listStyle: 'none' }}>
                  {competencyHighlights.watch.map((item) => (
                    <li key={item.axis} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>{item.axis}</span>
                      <span style={{ color: '#d97706' }}>{item.value}%</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="report-section">
          <h3 className="report-section-title">
            {isEn ? 'Performance Metrics' : 'Métricas de desempeño'}
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: '16px 12px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>{isEn ? 'Module' : 'Módulo'}</th>
                  <th style={{ padding: '16px 12px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Score</th>
                  <th style={{ padding: '16px 12px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>{isEn ? 'Duration' : 'Duración'}</th>
                  <th style={{ padding: '16px 12px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>{isEn ? 'Primary Signal' : 'Señal primaria'}</th>
                </tr>
              </thead>
              <tbody>
                {extendedGameRows.filter(r => r.score !== 'N/A').map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: '16px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#1e1b4b' }}>{row.name}</td>
                    <td style={{ padding: '16px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 800, color: '#4f46e5' }}>{row.score}</td>
                    <td style={{ padding: '16px 12px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{row.duration}</td>
                    <td style={{ padding: '16px 12px', borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: '0.85rem' }}>{row.metric}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="report-ai-signal">
          <h2 style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>
            {isEn ? 'Talent Signal Context' : 'Contexto de la señal de talento'}
          </h2>
          <div className="report-meta-pill" style={{ background: '#fff' }}>
            {isEn ? 'Engine' : 'Motor'}: {insightMeta.mode}
          </div>
          <p style={{ marginTop: '20px', color: '#64748b', fontSize: '0.9rem', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto', fontStyle: 'italic', lineHeight: 1.6 }}>
            "{insightMeta.reason}"
          </p>
        </div>

        <div className="report-section" style={{ marginTop: '40px' }}>
          <h3 className="report-section-title">{isEn ? 'Executive Summary' : 'Resumen ejecutivo'}</h3>
          <p style={{ color: '#334155', lineHeight: '2', fontSize: '1.1rem', letterSpacing: '0.01em' }}>
            {report.summary}
          </p>
        </div>

        <div className="report-section">
          <h3 className="report-section-title">{isEn ? '90-Day Action Priorities' : 'Prioridades de acción a 90 días'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {actionPriorities.map((priority, idx) => (
              <div key={idx} style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', marginBottom: '8px' }}>{isEn ? `Priority ${idx+1}` : `Prioridad ${idx+1}`}</div>
                <div style={{ fontWeight: 800, color: '#1e1b4b', marginBottom: '8px' }}>{priority.title}</div>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>{priority.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <div className="report-section" style={{ marginBottom: 0, borderTop: '4px solid #10b981' }}>
            <h3 style={{ marginBottom: '20px', color: '#059669', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>★</span> {isEn ? 'Core Strengths' : 'Fortalezas clave'}
            </h3>
            <ul style={{ color: '#334155', lineHeight: '2', listStyle: 'none', padding: 0 }}>
              {report.strengths?.map((s, idx) => (
                <motion.li initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:idx*0.1 }} key={idx} style={{ marginBottom: '12px', paddingLeft: '12px', borderLeft: '2px solid #10b981' }}>{s}</motion.li>
              ))}
            </ul>
          </div>

          <div className="report-section" style={{ marginBottom: 0, borderTop: '4px solid #f59e0b' }}>
            <h3 style={{ marginBottom: '20px', color: '#d97706', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>⚠</span> {isEn ? 'Risk Mitigation' : 'Gestión de riesgos'}
            </h3>
            <ul style={{ color: '#334155', lineHeight: '2', listStyle: 'none', padding: 0 }}>
              {report.areasToMonitor?.map((a, idx) => (
                <motion.li initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:idx*0.1 }} key={idx} style={{ marginBottom: '12px', paddingLeft: '12px', borderLeft: '2px solid #f59e0b' }}>{a}</motion.li>
              ))}
            </ul>
          </div>
        </div>

        <div className="report-footer" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '32px' }}>
            {!dummyModeEnabled && sessionSavedId && (
              <div className="report-meta-pill" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#10b981' }}>
                ✓ {isEn ? `Record archived: ${sessionSavedId}` : `Registro archivado: ${sessionSavedId}`}
              </div>
            )}
          </div>
          <button className="btn btn-primary" style={{ padding: '20px 64px', fontSize: '1.2rem', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(99,102,241,0.4)' }} onClick={() => window.location.href = '/'}>
            {isEn ? 'Initiate New Assessment' : 'Iniciar nueva evaluación'}
          </button>
        </div>
        </motion.div>

        {isDevBuild && showDevTelemetry && (
          <div className="glass-panel-light report-debug" style={{ padding: '24px', margin: '40px auto', maxWidth: '1000px', border: '1px dashed rgba(14,165,233,0.5)' }}>
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
      </main>
    </>
  );

};

const getRecommendationLabel = (recommendation, isEn) => {
  const labels = {
    'STRONG ALIGNMENT': isEn ? 'Strong Alignment' : 'Alineación fuerte',
    'SOLID ALIGNMENT WITH COACHING': isEn ? 'Solid Alignment With Coaching' : 'Alineación sólida con coaching',
    'CONDITIONAL ALIGNMENT': isEn ? 'Conditional Alignment' : 'Alineación condicional',
    'EXPLORATORY FIT - NEEDS MORE DATA': isEn ? 'Exploratory Fit - Needs More Data' : 'Encaje exploratorio - requiere más datos',
  };
  return labels[recommendation] || recommendation;
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
  { id: 'cpt_game_4', legacyId: 'game4', name: { en: 'Balloon Game', es: 'Juego del Globo' }, construct: { en: 'Risk Assessment', es: 'Evaluación de riesgo' } },
  { id: 'dec_game_5', legacyId: 'game5', name: { en: 'Game 5 - Decision', es: 'Juego 5 - Decisión' }, construct: { en: 'Decision Making', es: 'Toma de decisiones' } },
  { id: 'rsh_game_6', legacyId: 'game6', name: { en: 'Grid Flow', es: 'Grid Flow' }, construct: { en: 'Planning & Logic', es: 'Planeación y lógica' } },
  { id: 'sjt_game_7', legacyId: 'game7', name: { en: 'Laser Puzzle', es: 'Láser y Espejos' }, construct: { en: 'Spatial Reasoning', es: 'Razonamiento espacial' } },
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

function hasMinimumAssessmentData(data) {
  if (!data) return false;
  const required = GAME_ROWS.filter((g) => data[g.id] || data[g.legacyId]);
  return required.length >= 3; // Reduced for demo consistency
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
      details.operationAccuracy !== undefined ? `${isEn ? 'Operation accuracy' : 'Precisión operacional'} ${details.operationAccuracy}%` :
      details.efficiency !== undefined ? `${isEn ? 'Efficiency index' : 'Índice de eficiencia'} ${details.efficiency}%` :
      details.pops !== undefined ? `${isEn ? 'Risk incidents (pops)' : 'Incidentes de riesgo'} ${details.pops}` :
      details.totalMoves !== undefined ? `${isEn ? 'Sequence optimization' : 'Optimización de secuencia'} ${details.totalMoves} mv` :
      details.accuracy !== undefined ? `${isEn ? 'Accuracy' : 'Precisión'} ${details.accuracy}%` :
      details.nBackLevel !== undefined ? `${isEn ? 'N-back level' : 'Nivel N-back'} ${details.nBackLevel}` :
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

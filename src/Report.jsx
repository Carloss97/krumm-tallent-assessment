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
import { generateAIReport, generateHeuristicReport, getLastAIFailureReason } from './services/aiReportService';
import { saveSessionToBackend } from './services/backendService';
import { generateDummyReportData } from './utils/dummyDataGenerator';
import { analyzeTelemetry, buildTelemetryRiskSignals } from './utils/telemetryAnalytics';
import {
  evaluateMetacognitiveCalibration,
  evaluateOperationalPrioritization,
  evaluateLearningAgility,
} from './services/futureAssessments';
import { getExperimentConfig } from './utils/abTesting';

const Report = () => {
  const { sessionData, participantProfile, getSessionMetadata } = useTelemetry();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Initialize dummy mode from URL params
  const initialDummyMode = searchParams.get('dummy') === 'true';
  
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [aiReport, setAiReport] = useState(null);
  const [useAI, setUseAI] = useState(true); // Toggle between AI and heuristic
  const [useDummyData, setUseDummyData] = useState(initialDummyMode);
  const [showDevTelemetry, setShowDevTelemetry] = useState(false);
  const [insightMeta, setInsightMeta] = useState({ mode: 'pending', reason: '' });
  const [sessionSavedId, setSessionSavedId] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const reportGeneratedRef = useRef(false);
  const isTestEnv = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';
  const hasGeminiKey = Boolean(typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_API_KEY);

  const isDevBuild = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

  // Check if we have sufficient data or should use dummy data
  const hasRealData = hasMinimumAssessmentData(sessionData);
  const reportData = useMemo(() => {
    if (useDummyData || !hasRealData) {
      return generateDummyReportData();
    }
    return sessionData;
  }, [useDummyData, hasRealData, sessionData]);

  const experimentConfig = useMemo(() => (
    getExperimentConfig('report-insight-panel-v1', participantProfile?.participantId || 'anonymous')
  ), [participantProfile?.participantId]);

  const telemetryAnalytics = useMemo(() => analyzeTelemetry(reportData), [reportData]);
  const telemetryRiskSignals = useMemo(() => buildTelemetryRiskSignals(telemetryAnalytics), [telemetryAnalytics]);

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

  const extendedGameRows = useMemo(() => buildEnhancedRows(reportData), [reportData]);
  const devTelemetryOverview = useMemo(() => buildTelemetryOverview(reportData), [reportData]);
  const radarProfile = useMemo(() => buildRadarProfile(reportData), [reportData]);
  const competencyHighlights = useMemo(() => buildCompetencyHighlights(radarProfile), [radarProfile]);

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
            if (hasGeminiKey) {
              const report = await generateAIReport(reportData, 'recruitment');
              if (report) {
                resolvedReport = report;
                setInsightMeta({ mode: 'ai', reason: 'Gemini response parsed successfully.' });
              }
            } else {
              setInsightMeta({ mode: 'heuristic', reason: 'Missing VITE_GOOGLE_API_KEY in environment.' });
            }
          }

          if (!resolvedReport) {
            // Fallback to heuristic if AI fails or is disabled
            resolvedReport = generateHeuristicReport(reportData);
            if (!useAI) {
              setInsightMeta({ mode: 'heuristic', reason: 'AI mode is disabled by user toggle.' });
            } else if (hasGeminiKey) {
              const fallbackReason = getLastAIFailureReason() || 'AI call failed or returned invalid JSON; fallback activated.';
              setInsightMeta({ mode: 'heuristic', reason: fallbackReason });
            }
          }

          setAiReport(resolvedReport);
          setIsAnalyzing(false);
        } catch (error) {
          console.error('Error generating AI report:', error);
          const heuristicReport = generateHeuristicReport(reportData);
          setAiReport(heuristicReport);
          setInsightMeta({ mode: 'heuristic', reason: 'Runtime error while generating AI report; fallback activated.' });
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
            setBackendError('No se pudo guardar la sesion en backend');
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
    reportData,
    participantProfile,
    getSessionMetadata,
    sessionSavedId,
    hasGeminiKey
  ]);

  if (!hasRealData && !useDummyData) {
    return (
      <div className="flex-center glass-panel" style={{ margin: 'auto', marginTop: '100px', maxWidth: '600px', padding: '40px', textAlign: 'center' }}>
        <h2>{isEn ? 'No Assessment Data Found' : 'No se encontraron datos de evaluacion'}</h2>
        <p>{isEn ? 'Please complete the extended assessment to view the HR report.' : 'Completa la evaluacion extendida para ver el reporte final.'}</p>
        <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
          <button className="btn" onClick={() => window.location.href = '/'}>{isEn ? 'Go to Start' : 'Ir al inicio'}</button>
          <button className="btn" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', border: '1px solid #7c3aed' }} onClick={() => setUseDummyData(true)}>
            {isEn ? 'View Demo Report' : 'Ver reporte demo'}
          </button>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="flex-center" style={{ width: '100%', minHeight: '100vh', flexDirection: 'column', padding: '40px' }}>
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="glass-panel"
           style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ width: '60px', height: '60px', border: '4px solid rgba(59, 130, 246, 0.2)', borderTop: '4px solid #3b82f6', borderRadius: '50%' }}
          />
          <h2 className="text-gradient">{isEn ? 'Analyzing Telemetry Data...' : 'Analizando telemetria...'}</h2>
          <p style={{ color: '#374151', fontSize: '1.1rem', maxWidth: '400px', lineHeight: '1.6' }}>
            {useAI
              ? (isEn ? 'Calling AI model to interpret cognitive patterns...' : 'Consultando modelo IA para interpretar patrones cognitivos...')
              : (isEn ? 'Processing behavioral metrics...' : 'Procesando metricas conductuales...')}
          </p>
        </motion.div>
      </div>
    );
  }

  // Use AI report if available, otherwise fallback to heuristic
  const report = aiReport || generateHeuristicReport(reportData, 'recruitment');
  const actionPriorities = buildActionPriorities(report, competencyHighlights);

  return (
    <div style={{ width: '100%', minHeight: '100%', padding: '40px', paddingBottom: '80px' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
        style={{ maxWidth: '900px', margin: '0 auto', padding: '40px' }}
      >
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px', textAlign: 'center' }}>
          {report.source === 'gemini'
            ? (isEn ? 'AI-Powered Skills Assessment' : 'Evaluacion de habilidades con IA')
            : (isEn ? 'Skills Evaluation Matrix' : 'Matriz de evaluacion de habilidades')}
        </h1>
        <p style={{ textAlign: 'center', color: '#374151', marginBottom: '40px' }}>
          {report.source === 'gemini'
            ? (isEn ? 'Generated by Google Gemini AI' : 'Generado por Google Gemini AI')
            : (isEn ? 'Heuristic-Based Analysis' : 'Analisis basado en heuristicas')}
          {useDummyData && <span style={{ color: '#7c3aed', fontStyle: 'italic' }}>{isEn ? ' | Demo Data' : ' | Datos demo'}</span>}
        </p>

        {participantProfile?.participantId && (
          <div
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

        <div className="glass-panel-light" style={{ padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '14px', color: '#1e1b4b', fontWeight: '700', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '8px' }}>
            {isEn ? 'Executive Capability Snapshot' : 'Resumen ejecutivo de capacidades'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '18px' }}>
            <TelemetryStatCard label={isEn ? 'Profile Signal' : 'Senal de perfil'} value={report.recommendation || 'N/A'} />
            <TelemetryStatCard label={isEn ? 'Confidence' : 'Confianza'} value={report.confidenceScore ? `${report.confidenceScore}%` : 'N/A'} />
            <TelemetryStatCard label={isEn ? 'Coverage' : 'Cobertura'} value={`${extendedGameRows.filter((row) => typeof row.score === 'number').length}/${GAME_ROWS.length} ${isEn ? 'games' : 'juegos'}`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(240px, 1fr)', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '100%', height: 300, background: 'linear-gradient(150deg, rgba(239,246,255,0.75), rgba(250,245,255,0.78))', borderRadius: '14px', border: '1px solid rgba(129,140,248,0.2)', padding: '8px' }}>
              {isTestEnv ? (
                <RadarChart width={520} height={280} data={radarProfile} outerRadius="72%">
                  <PolarGrid stroke="rgba(99,102,241,0.28)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: '#334155', fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Radar name="Score" dataKey="value" stroke="#4338ca" fill="#6366f1" fillOpacity={0.42} />
                  <Radar name="Benchmark" dataKey="baseline" stroke="#0ea5e9" fill="#7dd3fc" fillOpacity={0.2} />
                </RadarChart>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarProfile} outerRadius="72%">
                    <PolarGrid stroke="rgba(99,102,241,0.28)" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: '#334155', fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Radar name="Score" dataKey="value" stroke="#4338ca" fill="#6366f1" fillOpacity={0.42} />
                    <Radar name="Benchmark" dataKey="baseline" stroke="#0ea5e9" fill="#7dd3fc" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
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
        </div>

        {/* Extended Results for new battery */}
        <div className="glass-panel-light" style={{ padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', color: '#1e1b4b', fontWeight: '700', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '8px' }}>
            {isEn ? 'Integrated Battery Results (Games 1-13)' : 'Resultados integrados de bateria (juegos 1-13)'}
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ color: '#374151', textAlign: 'left' }}>
                  <th style={{ padding: '8px', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>{isEn ? 'Game' : 'Juego'}</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>{isEn ? 'Construct' : 'Constructo'}</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>Score</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>{isEn ? 'Errors' : 'Errores'}</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>{isEn ? 'Duration' : 'Duracion'}</th>
                  <th style={{ padding: '8px', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>{isEn ? 'Key Metric' : 'Metrica clave'}</th>
                </tr>
              </thead>
              <tbody>
                {extendedGameRows.map((row) => (
                  <tr key={row.id} style={{ color: '#374151' }}>
                    <td style={{ padding: '8px', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>{row.name}</td>
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
        <div style={{ 
          backgroundColor: 'rgba(255,255,255,0.7)', 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '32px',
          textAlign: 'center',
          border: `2px solid ${getRecommendationColor(report.recommendation)}`
        }}>
          <h2 style={{ color: '#374151', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {report.source === 'gemini'
              ? (isEn ? 'AI Skills and Talent Signal' : 'Senal de talento y habilidades por IA')
              : (isEn ? 'System Skills and Talent Signal' : 'Senal de talento y habilidades del sistema')}
          </h2>
          <div style={{ color: '#475569', marginTop: '10px', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {isEn
              ? 'This panel summarizes interpretation context. Primary recommendation and confidence are shown once in the executive snapshot to avoid duplication.'
              : 'Este panel resume el contexto de interpretacion. La recomendacion principal y confianza se muestran una sola vez para evitar duplicacion.'}
          </div>
          <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '999px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#3730a3', fontSize: '0.86rem', fontWeight: 600 }}>
            {isEn ? 'Insight Source' : 'Fuente de insight'}: {insightMeta.mode === 'ai' ? 'ai' : 'heuristic'}
          </div>
          {insightMeta.reason && (
            <div style={{ marginTop: '8px', color: '#64748b', fontSize: '0.82rem', maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto' }}>
              {insightMeta.reason}
            </div>
          )}
        </div>

        {experimentConfig.showTelemetryInsightPanel && (
          <div className="glass-panel-light" style={{ padding: '24px', marginBottom: '32px', border: '1px solid rgba(14,165,233,0.35)' }}>
            <h3 style={{ marginBottom: '14px', color: '#0c4a6e', fontWeight: '700' }}>
              Behavioral Signal Insights (A/B Variant)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <TelemetryStatCard label="Completion Rate" value={`${telemetryAnalytics.completionRate}%`} />
              <TelemetryStatCard label="Attention Stability" value={`${telemetryAnalytics.attentionStabilityScore}%`} />
              <TelemetryStatCard label="Telemetry Density" value={telemetryAnalytics.telemetryDensity} />
              <TelemetryStatCard label="Cursor Hesitation" value={telemetryAnalytics.hesitationCount} />
            </div>
            {telemetryRiskSignals.length > 0 && (
              <ul style={{ marginTop: '12px', color: '#334155', lineHeight: '1.6' }}>
                {telemetryRiskSignals.map((signal, idx) => (
                  <li key={idx}>{signal}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="glass-panel-light" style={{ padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '12px', color: '#1e1b4b', fontWeight: '700', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '8px' }}>
            Future Modules (High-Priority Plan) - Beta Scoring
          </h3>
          {!hasFutureModulesData && (
            <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.25)', color: '#075985', fontSize: '0.9rem' }}>
              <div>
                {isEn
                  ? 'No future-module events were captured in this session yet. Scores stay as pending beta until telemetry is collected.'
                  : 'Aun no se capturaron eventos de modulos futuros en esta sesion. Los puntajes quedan pendientes en beta hasta recolectar telemetria.'}
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
              <div style={{ fontWeight: 700, color: '#1e293b' }}>Metacognitive Calibration</div>
              <div style={{ color: '#334155', marginTop: 4 }}>{hasFutureModulesData ? futureAssessmentSummary.metacognitive.label : (isEn ? 'PENDING CAPTURE' : 'CAPTURA PENDIENTE')}</div>
              <div style={{ color: '#64748b', marginTop: 4 }}>Score: {hasFutureModulesData ? futureAssessmentSummary.metacognitive.score : '--'}</div>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(15,23,42,0.1)' }}>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>Operational Prioritization</div>
              <div style={{ color: '#334155', marginTop: 4 }}>{hasFutureModulesData ? futureAssessmentSummary.prioritization.label : (isEn ? 'PENDING CAPTURE' : 'CAPTURA PENDIENTE')}</div>
              <div style={{ color: '#64748b', marginTop: 4 }}>Score: {hasFutureModulesData ? futureAssessmentSummary.prioritization.score : '--'}</div>
            </div>
            <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(15,23,42,0.1)' }}>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>Learning Agility</div>
              <div style={{ color: '#334155', marginTop: 4 }}>{hasFutureModulesData ? futureAssessmentSummary.learningAgility.label : (isEn ? 'PENDING CAPTURE' : 'CAPTURA PENDIENTE')}</div>
              <div style={{ color: '#64748b', marginTop: 4 }}>Score: {hasFutureModulesData ? futureAssessmentSummary.learningAgility.score : '--'}</div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="glass-panel-light" style={{ padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', color: '#1e1b4b', fontWeight: '700', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '8px' }}>
            Executive Summary
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
              Key Strengths
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
              Areas to Monitor
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

        <div className="glass-panel-light" style={{ padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', color: '#1e1b4b', fontWeight: '700', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '8px' }}>
            90-Day Action Priorities
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {actionPriorities.map((priority, idx) => (
              <div key={idx} style={{ padding: '14px', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.28)', background: 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(244,247,255,0.9))' }}>
                <div style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Priority {idx + 1}
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{priority.title}</div>
                <div style={{ color: '#334155', fontSize: '0.9rem', lineHeight: '1.55' }}>{priority.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Career Fit */}
        {report.careerRecommendations && report.careerRecommendations.length > 0 && (
          <div className="glass-panel-light" style={{ padding: '24px', marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '16px', color: '#1e1b4b', fontWeight: '700', borderBottom: '1px solid rgba(99,102,241,0.2)', paddingBottom: '8px' }}>
              Career Fit Recommendations
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
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '0.9rem',
                background: useAI ? '#7c3aed' : 'rgba(124, 58, 237, 0.2)',
                color: useAI ? 'white' : '#7c3aed',
                border: `1px solid ${useAI ? '#7c3aed' : 'rgba(124, 58, 237, 0.5)'}`
              }}
              onClick={() => setUseAI(!useAI)}
            >
              {useAI ? 'AI Mode' : 'Heuristic Mode'}
            </button>
            {hasRealData && (
              <button
                className="btn"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  background: useDummyData ? '#059669' : 'rgba(5, 150, 105, 0.2)',
                  color: useDummyData ? 'white' : '#059669',
                  border: `1px solid ${useDummyData ? '#059669' : 'rgba(5, 150, 105, 0.5)'}`
                }}
                onClick={() => setUseDummyData(!useDummyData)}
              >
                {useDummyData ? 'Demo Data' : 'Real Data'}
              </button>
            )}
            {isDevBuild && (
              <button
                className="btn"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  background: showDevTelemetry ? '#0ea5e9' : 'rgba(14, 165, 233, 0.2)',
                  color: showDevTelemetry ? 'white' : '#0369a1',
                  border: `1px solid ${showDevTelemetry ? '#0ea5e9' : 'rgba(14, 165, 233, 0.5)'}`
                }}
                onClick={() => setShowDevTelemetry(prev => !prev)}
              >
                {showDevTelemetry ? 'Dev Telemetry: ON' : 'Dev Telemetry: OFF'}
              </button>
            )}
          </div>
        </div>

        {/* Development-only telemetry visualization */}
        {isDevBuild && showDevTelemetry && (
          <div className="glass-panel-light" style={{ padding: '24px', marginBottom: '32px', border: '1px dashed rgba(14,165,233,0.5)' }}>
            <h3 style={{ marginBottom: '8px', color: '#0c4a6e', fontWeight: '700' }}>Development Telemetry Panel</h3>
            <p style={{ color: '#0f172a', fontSize: '0.9rem', marginBottom: '18px' }}>
              Debug-only panel for cursor/webcam telemetry validation. Do not use for production decisions.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '18px' }}>
              <TelemetryStatCard label="Cursor Events" value={devTelemetryOverview.cursorEvents} />
              <TelemetryStatCard label="Click Events" value={devTelemetryOverview.clickEvents} />
              <TelemetryStatCard label="Trial Events" value={devTelemetryOverview.trialEvents} />
              <TelemetryStatCard label="Webcam Frames" value={devTelemetryOverview.webcamFrames} />
              <TelemetryStatCard label="Avg Webcam Quality" value={devTelemetryOverview.avgWebcamQuality} />
              <TelemetryStatCard label="Quality Flags" value={devTelemetryOverview.qualityFlags} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <h4 style={{ color: '#1e293b', margin: '0 0 10px 0' }}>Telemetry Coverage by Game</h4>
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
              <summary style={{ cursor: 'pointer', color: '#075985', fontWeight: 600 }}>View Raw Telemetry Snapshot</summary>
              <pre style={{ marginTop: '10px', maxHeight: '260px', overflow: 'auto', background: '#0f172a', color: '#e2e8f0', padding: '12px', borderRadius: '8px', fontSize: '0.75rem' }}>
                {JSON.stringify(devTelemetryOverview.rawSnapshot, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <div style={{ marginBottom: '12px', color: '#475569' }}>
            {!useDummyData && backendError && <span style={{ color: '#dc2626' }}>[WARN] {backendError}</span>}
            {!useDummyData && !backendError && sessionSavedId && <span style={{ color: '#16a34a' }}>[OK] Session saved with ID {sessionSavedId}</span>}
            {!useDummyData && !backendError && !sessionSavedId && <span style={{ color: '#0ea5e9' }}>Saving session to backend...</span>}
            {useDummyData && <span style={{ color: '#7c3aed' }}>[INFO] Demo mode: backend save disabled</span>}
          </div>
          <button className="btn" style={{ padding: '16px 40px', fontSize: '1.2rem' }} onClick={() => window.location.href = '/'}>
            Start Another Assessment
          </button>
        </div>
      </motion.div>
    </div>
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
  <div style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(148,163,184,0.3)', borderRadius: '8px', padding: '10px' }}>
    <div style={{ color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
    <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.05rem' }}>{value}</div>
  </div>
);

const GAME_ROWS = [
  { id: 'ospan_game_1', legacyId: 'game1', name: 'Game 1 - OSPAN', construct: 'Working Memory' },
  { id: 'sst_game_2', legacyId: 'game2', name: 'Game 2 - Stop-Signal', construct: 'Response Inhibition' },
  { id: 'tsw_game_3', legacyId: 'game3', name: 'Game 3 - Task Switching', construct: 'Cognitive Flexibility' },
  { id: 'cpt_game_4', legacyId: 'game4', name: 'Game 4 - CPT', construct: 'Sustained Attention' },
  { id: 'dec_game_5', legacyId: 'game5', name: 'Game 5 - Decision', construct: 'Decision Making' },
  { id: 'rsh_game_6', legacyId: 'game6', name: 'Game 6 - Rule Shift', construct: 'Adaptation' },
  { id: 'sjt_game_7', legacyId: 'game7', name: 'Game 7 - SJT', construct: 'Situational Judgment' },
  { id: 'cmp_meta_8', legacyId: 'game8', name: 'Game 8 - Metacognitive Calibration', construct: 'Metacognitive Accuracy' },
  { id: 'cmp_ops_9', legacyId: 'game9', name: 'Game 9 - Operational Prioritization', construct: 'Operational Prioritization' },
  { id: 'cmp_agility_10', legacyId: 'game10', name: 'Game 10 - Learning Agility', construct: 'Adaptive Learning' },
  { id: 'cmp_social_11', legacyId: 'game11', name: 'Game 11 - Social Coordination', construct: 'Social Coordination' },
  { id: 'cmp_resilience_12', legacyId: 'game12', name: 'Game 12 - Cognitive Resilience', construct: 'Resilience Under Load' },
  { id: 'cmp_risk_13', legacyId: 'game13', name: 'Game 13 - Risk Under Uncertainty', construct: 'Risk Decision Framing' },
];

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

function buildEnhancedRows(data) {
  return GAME_ROWS.map((game) => {
    const snapshot = getGameSnapshot(data, game.id, game.legacyId);
    const details = snapshot?.details || {};
    const metric =
      details.operationAccuracy !== undefined ? `Operation accuracy ${details.operationAccuracy}%` :
      details.accuracy !== undefined ? `Accuracy ${details.accuracy}%` :
      details.nBackLevel !== undefined ? `N-back level ${details.nBackLevel}` :
      details.efficiency !== undefined ? `Efficiency ${details.efficiency}` :
      details.categoriesCompleted !== undefined ? `Categories ${details.categoriesCompleted}` :
      details.noGoAccuracy !== undefined ? `No-Go accuracy ${details.noGoAccuracy}%` :
      details.totalTime !== undefined ? `Total time ${Math.round(details.totalTime / 1000)}s` :
      details.maxSequenceLength !== undefined ? `Max sequence ${details.maxSequenceLength}` :
      details.blocksCompleted !== undefined ? `Blocks ${details.blocksCompleted}` :
      details.scenariosCompleted !== undefined ? `Scenarios ${details.scenariosCompleted}` :
      'Telemetry captured';

    return {
      id: game.id,
      name: game.name,
      construct: game.construct,
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
    name: g.name,
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

function buildRadarProfile(data) {
  const dims = [
    { axis: 'Memory', keys: ['ospan_game_1', 'game1', 'cmp_meta_8', 'game8', 'cmp_risk_13', 'game13'] },
    { axis: 'Control', keys: ['sst_game_2', 'game2', 'cmp_social_11', 'game11'] },
    { axis: 'Agility', keys: ['tsw_game_3', 'game3', 'rsh_game_6', 'game6', 'cmp_agility_10', 'game10'] },
    { axis: 'Attention', keys: ['cpt_game_4', 'game4', 'cmp_resilience_12', 'game12'] },
    { axis: 'Decision', keys: ['dec_game_5', 'game5', 'cmp_ops_9', 'game9'] },
    { axis: 'Judgment', keys: ['sjt_game_7', 'game7'] },
  ];

  return dims.map((dim) => {
    const values = dim.keys
      .map((k) => data?.[k]?.score)
      .filter((v) => typeof v === 'number' && !Number.isNaN(v));

    const value = values.length
      ? Math.round(values.reduce((acc, current) => acc + current, 0) / values.length)
      : 0;

    return {
      axis: dim.axis,
      value,
      baseline: 70,
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

function buildActionPriorities(report, competencyHighlights) {
  const top = competencyHighlights.top[0];
  const watch = competencyHighlights.watch[0];
  const monitor = report?.areasToMonitor?.[0];

  return [
    {
      title: top ? `Scale ${top.axis}` : 'Scale strongest capability',
      detail: top
        ? `Use ${top.axis} in high-impact tasks and mentoring flows to maximize current strengths.`
        : 'Assign stretch tasks aligned with the strongest demonstrated capability.',
    },
    {
      title: watch ? `Coach ${watch.axis}` : 'Targeted development sprint',
      detail: watch
        ? `Set a focused coaching cycle for ${watch.axis} with weekly measurable checkpoints.`
        : 'Run a 4-6 week development plan with practical rehearsal scenarios.',
    },
    {
      title: 'Interview + manager alignment',
      detail: monitor
        ? `Probe this signal in interviews and onboarding plan: ${monitor}`
        : 'Validate development hypotheses with structured behavioral interviews and manager rubric.',
    },
  ];
}

export default Report;

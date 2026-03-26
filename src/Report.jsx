import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelemetry } from './TelemetryContext';
import { generateAIReport, generateHeuristicReport } from './services/aiReportService';
import { saveSessionToBackend } from './services/backendService';
import { generateDummyReportData } from './utils/dummyDataGenerator';

const Report = () => {
  const { sessionData } = useTelemetry();
  const [searchParams] = useSearchParams();
  
  // Initialize dummy mode from URL params
  const initialDummyMode = searchParams.get('dummy') === 'true';
  
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [aiReport, setAiReport] = useState(null);
  const [useAI, setUseAI] = useState(true); // Toggle between AI and heuristic
  const [useDummyData, setUseDummyData] = useState(initialDummyMode);
  const [sessionSavedId, setSessionSavedId] = useState(null);
  const [backendError, setBackendError] = useState(null);
  const reportGeneratedRef = useRef(false);
  const isTestEnv = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';
  const aiAnalysisDelayMs = isTestEnv ? 10 : 8000;
  const heuristicAnalysisDelayMs = isTestEnv ? 10 : 3500;

  // Check if we have sufficient data or should use dummy data
  const hasRealData = sessionData.game1 && Object.keys(sessionData).length >= 7; // At least some games completed
  const reportData = useDummyData || !hasRealData ? generateDummyReportData() : Object.values(sessionData);

  // Reset generation state when switching AI/demo modes to avoid stale report output.
  useEffect(() => {
    reportGeneratedRef.current = false;
    setIsAnalyzing(true);
    setAiReport(null);
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
          if (useAI) {
            const report = await generateAIReport(reportData, 'recruitment');
            if (report) {
              setAiReport(report);
              setTimeout(() => setIsAnalyzing(false), aiAnalysisDelayMs);
              return;
            }
          }
          // Fallback to heuristic if AI fails or is disabled
          const heuristicReport = generateHeuristicReport(reportData);
          setAiReport(heuristicReport);
          setTimeout(() => setIsAnalyzing(false), heuristicAnalysisDelayMs);
        } catch (error) {
          console.error('Error generating AI report:', error);
          const heuristicReport = generateHeuristicReport(reportData);
          setAiReport(heuristicReport);
          setTimeout(() => setIsAnalyzing(false), heuristicAnalysisDelayMs);
        }

        // Save session to backend
        if (!useDummyData && hasRealData && !sessionSavedId) {
          try {
            const saveRes = await saveSessionToBackend(reportData);
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
  }, [hasRealData, useDummyData, useAI, reportData, sessionSavedId, aiAnalysisDelayMs, heuristicAnalysisDelayMs]);

  if (!hasRealData && !useDummyData) {
    return (
      <div className="flex-center glass-panel" style={{ margin: 'auto', marginTop: '100px', maxWidth: '600px', padding: '40px', textAlign: 'center' }}>
        <h2>No Assessment Data Found</h2>
        <p>Please complete the extended assessment to view the HR report.</p>
        <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
          <button className="btn" onClick={() => window.location.href = '/'}>Go to Start</button>
          <button className="btn" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', border: '1px solid #7c3aed' }} onClick={() => setUseDummyData(true)}>
            View Demo Report
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
          <h2 className="text-gradient">Analyzing Telemetry Data...</h2>
          <p style={{ color: '#374151', fontSize: '1.1rem', maxWidth: '400px', lineHeight: '1.6' }}>
            {useAI ? 'Calling AI model to interpret cognitive patterns...' : 'Processing behavioral metrics...'}
          </p>
        </motion.div>
      </div>
    );
  }

  // Use AI report if available, otherwise fallback to heuristic
  const report = aiReport || generateHeuristicReport(sessionData, 'recruitment');

  return (
    <div style={{ width: '100%', minHeight: '100%', padding: '40px', paddingBottom: '80px' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
        style={{ maxWidth: '900px', margin: '0 auto', padding: '40px' }}
      >
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px', textAlign: 'center' }}>
          {report.source === 'gemini' ? 'AI-Powered Talent Assessment' : 'Candidate Evaluation Matrix'}
        </h1>
        <p style={{ textAlign: 'center', color: '#374151', marginBottom: '40px' }}>
          {report.source === 'gemini' ? 'Generated by Google Gemini AI' : 'Heuristic-Based Analysis'}
          {useDummyData && <span style={{ color: '#7c3aed', fontStyle: 'italic' }}> | Demo Data</span>}
        </p>

        {/* Recommendation Panel */}
        <div style={{ 
          backgroundColor: 'rgba(255,255,255,0.7)', 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '32px',
          textAlign: 'center',
          border: `2px solid ${getRecommendationColor(report.recommendation)}`
        }}>
          <h2 style={{ color: '#374151', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {report.source === 'gemini' ? 'AI Recommendation' : 'System Recommendation'}
          </h2>
          <div style={{ color: getRecommendationColor(report.recommendation), fontSize: '2.5rem', fontWeight: 'bold', marginTop: '8px' }}>
            {report.recommendation}
          </div>
          {report.confidenceScore && (
            <div style={{ color: '#7c3aed', marginTop: '12px', fontSize: '0.95rem' }}>
              Confidence Score: <strong>{report.confidenceScore}%</strong>
            </div>
          )}
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
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <div style={{ marginBottom: '12px', color: '#475569' }}>
            {!useDummyData && backendError && <span style={{ color: '#dc2626' }}>[WARN] {backendError}</span>}
            {!useDummyData && !backendError && sessionSavedId && <span style={{ color: '#16a34a' }}>[OK] Session saved with ID {sessionSavedId}</span>}
            {!useDummyData && !backendError && !sessionSavedId && <span style={{ color: '#0ea5e9' }}>Saving session to backend...</span>}
            {useDummyData && <span style={{ color: '#7c3aed' }}>[INFO] Demo mode: backend save disabled</span>}
          </div>
          <button className="btn" style={{ padding: '16px 40px', fontSize: '1.2rem' }} onClick={() => window.location.href = '/'}>
            Assess Another Candidate
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const getRecommendationColor = (recommendation) => {
  switch(recommendation) {
    case 'HIGHLY RECOMMEND':
      return '#10b981'; // green
    case 'RECOMMEND WITH RESERVATIONS':
      return '#06b6d4'; // cyan
    case 'BORDERLINE FIT':
      return '#f59e0b'; // amber
    case 'REQUIRES FOLLOW-UP':
    default:
      return '#f43f5e'; // rose
  }
};

export default Report;

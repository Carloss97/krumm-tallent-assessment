import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import {
  evaluateMetacognitiveCalibration,
  evaluateOperationalPrioritization,
  evaluateLearningAgility,
} from '../services/futureAssessments';

const initialMeta = [
  { confidence: 70, correct: true },
  { confidence: 40, correct: false },
  { confidence: 80, correct: true },
  { confidence: 60, correct: true },
];

const initialPrioritization = [
  { expectedPriority: 'high', assignedPriority: 'high', completedWithinMs: 5200, deadlineMs: 6500 },
  { expectedPriority: 'medium', assignedPriority: 'medium', completedWithinMs: 6600, deadlineMs: 9000 },
  { expectedPriority: 'low', assignedPriority: 'medium', completedWithinMs: 5100, deadlineMs: 7000 },
];

const initialAgility = [
  { accuracy: 56, adaptationMs: 2300 },
  { accuracy: 63, adaptationMs: 2000 },
  { accuracy: 69, adaptationMs: 1800 },
  { accuracy: 76, adaptationMs: 1500 },
];

const inputStyle = {
  width: '100%',
  padding: '8px',
  borderRadius: '8px',
  border: '1px solid rgba(148, 163, 184, 0.5)',
};

const cardStyle = {
  background: 'rgba(255,255,255,0.7)',
  borderRadius: '12px',
  padding: '16px',
  border: '1px solid rgba(148, 163, 184, 0.35)',
};

function FutureAssessmentLab() {
  const navigate = useNavigate();
  const { recordFutureModuleData } = useTelemetry();

  const [metaRows, setMetaRows] = useState(initialMeta);
  const [priorRows, setPriorRows] = useState(initialPrioritization);
  const [agilityRows, setAgilityRows] = useState(initialAgility);

  const metaResult = useMemo(() => evaluateMetacognitiveCalibration(metaRows), [metaRows]);
  const priorResult = useMemo(() => evaluateOperationalPrioritization(priorRows), [priorRows]);
  const agilityResult = useMemo(() => evaluateLearningAgility(agilityRows), [agilityRows]);

  const saveAndGoToReport = () => {
    recordFutureModuleData('metacognitive', metaRows);
    recordFutureModuleData('prioritization', priorRows);
    recordFutureModuleData('learningAgility', agilityRows);
    navigate('/report');
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '24px' }}>
      <div className="glass-panel" style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px' }}>
        <h1 className="text-gradient" style={{ marginBottom: '8px' }}>Future Assessment Lab</h1>
        <p style={{ color: '#334155', marginBottom: '24px' }}>
          High-priority modules: metacognitive calibration, operational prioritization, and learning agility.
          Edit values, review computed scores, and inject into report.
        </p>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Metacognitive Calibration</h3>
            {metaRows.map((row, idx) => (
              <div key={`meta-${idx}`} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  max="100"
                  value={row.confidence}
                  onChange={(e) => {
                    const next = [...metaRows];
                    next[idx] = { ...next[idx], confidence: Number(e.target.value) };
                    setMetaRows(next);
                  }}
                />
                <select
                  style={inputStyle}
                  value={row.correct ? 'true' : 'false'}
                  onChange={(e) => {
                    const next = [...metaRows];
                    next[idx] = { ...next[idx], correct: e.target.value === 'true' };
                    setMetaRows(next);
                  }}
                >
                  <option value="true">Correct</option>
                  <option value="false">Incorrect</option>
                </select>
              </div>
            ))}
            <div style={{ marginTop: '10px', color: '#0f172a' }}>Score: <strong>{metaResult.score}</strong> | {metaResult.label}</div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Operational Prioritization</h3>
            {priorRows.map((row, idx) => (
              <div key={`prior-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <select
                  style={inputStyle}
                  value={row.expectedPriority}
                  onChange={(e) => {
                    const next = [...priorRows];
                    next[idx] = { ...next[idx], expectedPriority: e.target.value };
                    setPriorRows(next);
                  }}
                >
                  <option value="high">Expected High</option>
                  <option value="medium">Expected Medium</option>
                  <option value="low">Expected Low</option>
                </select>
                <select
                  style={inputStyle}
                  value={row.assignedPriority}
                  onChange={(e) => {
                    const next = [...priorRows];
                    next[idx] = { ...next[idx], assignedPriority: e.target.value };
                    setPriorRows(next);
                  }}
                >
                  <option value="high">Assigned High</option>
                  <option value="medium">Assigned Medium</option>
                  <option value="low">Assigned Low</option>
                </select>
                <input
                  style={inputStyle}
                  type="number"
                  value={row.completedWithinMs}
                  onChange={(e) => {
                    const next = [...priorRows];
                    next[idx] = { ...next[idx], completedWithinMs: Number(e.target.value) };
                    setPriorRows(next);
                  }}
                />
                <input
                  style={inputStyle}
                  type="number"
                  value={row.deadlineMs}
                  onChange={(e) => {
                    const next = [...priorRows];
                    next[idx] = { ...next[idx], deadlineMs: Number(e.target.value) };
                    setPriorRows(next);
                  }}
                />
              </div>
            ))}
            <div style={{ marginTop: '10px', color: '#0f172a' }}>Score: <strong>{priorResult.score}</strong> | {priorResult.label}</div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Learning Agility</h3>
            {agilityRows.map((row, idx) => (
              <div key={`ag-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  max="100"
                  value={row.accuracy}
                  onChange={(e) => {
                    const next = [...agilityRows];
                    next[idx] = { ...next[idx], accuracy: Number(e.target.value) };
                    setAgilityRows(next);
                  }}
                />
                <input
                  style={inputStyle}
                  type="number"
                  value={row.adaptationMs}
                  onChange={(e) => {
                    const next = [...agilityRows];
                    next[idx] = { ...next[idx], adaptationMs: Number(e.target.value) };
                    setAgilityRows(next);
                  }}
                />
              </div>
            ))}
            <div style={{ marginTop: '10px', color: '#0f172a' }}>Score: <strong>{agilityResult.score}</strong> | {agilityResult.label}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => navigate('/intro')}>Back to Intro</button>
          <button className="btn" onClick={saveAndGoToReport}>Save Modules and Open Report</button>
        </div>
      </div>
    </div>
  );
}

export default FutureAssessmentLab;

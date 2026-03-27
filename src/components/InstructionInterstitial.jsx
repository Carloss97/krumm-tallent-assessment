import React from 'react';

const pillStyle = {
  padding: '6px 10px',
  borderRadius: '999px',
  border: '1px solid rgba(37, 99, 235, 0.2)',
  background: 'rgba(37, 99, 235, 0.08)',
  color: '#1e3a8a',
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.02em',
};

const InstructionInterstitial = ({ title, description, timeLimit, type, language = 'es', onStart, mission, strategy, rewardHint, varietyHint }) => {
  const isEn = language === 'en';

  const missionText = mission || (isEn ? 'Complete the module with precision and stable rhythm.' : 'Completa el modulo con precision y ritmo estable.');
  const strategyText = strategy || (isEn ? 'Prioritize consistency over rushed attempts.' : 'Prioriza consistencia por encima de respuestas apresuradas.');
  const rewardText = rewardHint || (isEn ? 'Earn non-invasive engagement badges while preserving psychometric integrity.' : 'Gana insignias de engagement no invasivas sin alterar la validez psicometrica.');
  const varietyText = varietyHint || (isEn ? 'Scenarios rotate to avoid repetitive patterns.' : 'Los escenarios rotan para evitar patrones repetitivos.');

  return (
    <div style={{ width:'100%', height:'100%', display:'flex', justifyContent:'center', alignItems:'center' }}>
      <div
        style={{
          padding:'36px', maxWidth:'760px', width:'100%', textAlign:'left',
          background:'linear-gradient(160deg, rgba(255,255,255,0.92), rgba(241,245,255,0.96))',
          border:'1px solid rgba(99,102,241,0.2)', borderRadius:'16px',
          boxShadow:'0 24px 50px rgba(30,41,59,0.16)',
        }}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px', gap:'12px', flexWrap:'wrap' }}>
          <div style={{ color:'#334155', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'1.8px', fontWeight:'700' }}>
            {type} {isEn ? 'Mission Module' : 'Modulo de mision'}
          </div>
          <div style={pillStyle}>{isEn ? 'Psychometric Safe Gamification' : 'Gamificacion segura psicometrica'}</div>
        </div>

        <h2 style={{ fontSize:'2rem', marginBottom:'14px', color:'#1e1b4b', fontWeight:'800' }}>{title}</h2>
        <p style={{ fontSize:'1rem', color:'#334155', lineHeight:'1.7', marginBottom:'18px' }}>{description}</p>

        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',
          gap:'10px',
          marginBottom:'18px',
        }}>
          <div style={{ padding:'12px', borderRadius:'12px', background:'rgba(15, 23, 42, 0.04)', border:'1px solid rgba(99,102,241,0.15)' }}>
            <strong style={{ display:'block', color:'#1e3a8a', marginBottom:'4px' }}>{isEn ? 'Mission' : 'Mision'}</strong>
            <span style={{ color:'#334155', fontSize:'0.94rem' }}>{missionText}</span>
          </div>
          <div style={{ padding:'12px', borderRadius:'12px', background:'rgba(15, 23, 42, 0.04)', border:'1px solid rgba(99,102,241,0.15)' }}>
            <strong style={{ display:'block', color:'#1e3a8a', marginBottom:'4px' }}>{isEn ? 'Strategy Cue' : 'Pista estrategica'}</strong>
            <span style={{ color:'#334155', fontSize:'0.94rem' }}>{strategyText}</span>
          </div>
          <div style={{ padding:'12px', borderRadius:'12px', background:'rgba(15, 23, 42, 0.04)', border:'1px solid rgba(99,102,241,0.15)' }}>
            <strong style={{ display:'block', color:'#1e3a8a', marginBottom:'4px' }}>{isEn ? 'Reward Track' : 'Ruta de recompensa'}</strong>
            <span style={{ color:'#334155', fontSize:'0.94rem' }}>{rewardText}</span>
          </div>
          <div style={{ padding:'12px', borderRadius:'12px', background:'rgba(15, 23, 42, 0.04)', border:'1px solid rgba(99,102,241,0.15)' }}>
            <strong style={{ display:'block', color:'#1e3a8a', marginBottom:'4px' }}>{isEn ? 'Variety Layer' : 'Capa de variedad'}</strong>
            <span style={{ color:'#334155', fontSize:'0.94rem' }}>{varietyText}</span>
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'center', gap:'28px', marginBottom:'24px', padding:'16px', background:'rgba(59,130,246,0.08)', borderRadius:'12px', border:'1px solid rgba(59,130,246,0.16)' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'#64748b', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px' }}>{isEn ? 'Time Limit' : 'Tiempo limite'}</div>
            <div style={{ fontSize:'1.04rem', fontWeight:'700', color:'#1e1b4b' }}>{timeLimit || 'N/A'}</div>
          </div>
          <div style={{ width:'1px', background:'rgba(59,130,246,0.2)' }} />
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'#64748b', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px' }}>{isEn ? 'Focus Goal' : 'Meta de enfoque'}</div>
            <div style={{ fontSize:'1.04rem', fontWeight:'700', color:'#1e1b4b' }}>{isEn ? 'Stable Precision' : 'Precision estable'}</div>
          </div>
        </div>

        <button className="btn" style={{ width:'100%', fontSize:'1.05rem' }} onClick={onStart}>
          {isEn ? 'Ready, start game' : 'Listo, comenzar juego'}
        </button>
      </div>
    </div>
  );
};

export default InstructionInterstitial;

import React from ''react'';

const InstructionInterstitial = ({ title, description, timeLimit, type, language = ''es'', onStart, mission, strategy, rewardHint, varietyHint }) => {
  const isEn = language === ''en'';

  return (
    <div style={{ width:''100%'', height:''100%'', display:''flex'', justifyContent:''center'', alignItems:''center'', padding:''24px'' }}>
      <div
        style={{
          padding:''40px'', maxWidth:''660px'', width:''100%'', textAlign:''center'',
          background:''linear-gradient(160deg, rgba(255,255,255,0.93), rgba(241,245,255,0.97))'',
          border:''1px solid rgba(99,102,241,0.2)'', borderRadius:''16px'',
          boxShadow:''0 20px 40px rgba(30,41,59,0.14)'',
        }}
      >
        <div style={{ marginBottom:''24px'' }}>
          <div style={{ color:''#64748b'', fontSize:''0.75rem'', textTransform:''uppercase'', letterSpacing:''2px'', fontWeight:''700'', marginBottom:''10px'' }}>
            {type}
          </div>
          <h2 style={{ fontSize:''2.2rem'', marginBottom:''16px'', color:''#1e1b4b'', fontWeight:''800'', lineHeight:''1.2'' }}>
            {title}
          </h2>
        </div>

        <p style={{ fontSize:''1.05rem'', color:''#334155'', lineHeight:''1.8'', marginBottom:''32px'', fontWeight:''500'' }}>
          {description}
        </p>

        <div style={{
          display:''flex'',
          justifyContent:''center'',
          gap:''32px'',
          marginBottom:''32px'',
          padding:''20px'',
          background:''rgba(99,102,241,0.05)'',
          borderRadius:''12px'',
          border:''1px solid rgba(99,102,241,0.15)''
        }}>
          {timeLimit && timeLimit !== ''None'' && timeLimit !== ''Timed'' && (
            <div style={{ textAlign:''center'' }}>
              <div style={{ color:''#64748b'', fontSize:''0.7rem'', textTransform:''uppercase'', letterSpacing:''1px'', marginBottom:''6px'', fontWeight:''700'' }}>
                {isEn ? ''Time'' : ''Tiempo''}
              </div>
              <div style={{ fontSize:''1.3rem'', fontWeight:''800'', color:''#2563eb'' }}>
                {timeLimit}
              </div>
            </div>
          )}
          <div style={{ textAlign:''center'' }}>
            <div style={{ color:''#64748b'', fontSize:''0.7rem'', textTransform:''uppercase'', letterSpacing:''1px'', marginBottom:''6px'', fontWeight:''700'' }}>
              {isEn ? ''Focus'' : ''Enfoque''}
            </div>
            <div style={{ fontSize:''1.3rem'', fontWeight:''800'', color:''#2563eb'' }}>
              {isEn ? ''Precision'' : ''Precision''}
            </div>
          </div>
        </div>

        <button 
          className="btn" 
          style={{ 
            width:''100%'', 
            fontSize:''1.1rem'',
            padding:''16px 24px'',
            fontWeight:''700'',
            letterSpacing:''0.5px''
          }} 
          onClick={onStart}
        >
          {isEn ? ''Start Game'' : ''Comenzar Juego''}
        </button>
      </div>
    </div>
  );
};

export default InstructionInterstitial;

import React, { useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import FaceMeshOverlayWrapper from './FaceMeshOverlayWrapper.jsx';

const CH_COLORS = {
  cognitiveLoad: 'var(--ink-yellow)', emotionalValence: 'var(--ink-green)',
  motorControl: 'var(--ink-blue)', engagement: 'var(--ink-green)',
  stressResponse: 'var(--ink-blue)', fatigueIndex: 'var(--ink-red)',
  taskPerformance: 'var(--ink-yellow)',
};
const EMO_ICONS = { happiness:'😊',sadness:'😢',surprise:'😲',fear:'😨',anger:'😠',disgust:'🤢',contempt:'😏',neutral:'😐' };
const EMO_CLRS = { happiness:'#4dd4ac',sadness:'#74a7ff',surprise:'#ffd166',fear:'#ffb4b4',anger:'#ff6b6b',disgust:'#c8a86e',contempt:'#d4a574',neutral:'#9fb0c2' };

function fmt(n,d){d=d||3;return Number.isFinite(n)?Number(n).toFixed(d):Number(0).toFixed(d)}
function pct(v){var x=clamp(v);return Math.round(x*100)+'%'}
function light(c){return c==='good'?'var(--ink-green)':c==='moderate'?'var(--ink-yellow)':'var(--ink-red)'}
const clamp=(v,l,h)=>{l=l||0;h=h||1;return Math.min(h,Math.max(l,Number.isFinite(v)?v:l))};

export default function Dashboard({
  videoRef,isCameraActive:_isCameraActive,showMesh,setShowMesh,
  telemetry,faceWorker,statusClassName,lastQuality,
  calibrationProfile,calStatusLabel,
  insightItems,auEntries,activeAUCount,
  edgeAIResult,edgeChannels,edgeConfidence:_edgeConfidence,edgeComposite,
  latestLandmarks,latestGaze,auRegionSummary,gameSummary,gameCorrelation,DEVICE_CONFIG:_DEVICE_CONFIG,
  latestPose,moveNetPose,moveNet = {},
  onCalibrateGazeCenter,onCalibratePostureUpright,manualCalStatus,
}){
  const { t } = useLanguage();
  const camRef=useRef(null), meshRef=useRef(null);
  const emotions=edgeAIResult?.emotions;
  const captureQ=edgeAIResult?.confidence?.captureQuality;
  const sc='status ' + (statusClassName || '');
  const [openMetrics,setOpenMetrics]=useState(true);
  const [openEdge,setOpenEdge]=useState(true);
  const [openStats,setOpenStats]=useState(true);
  const [openPosture,setOpenPosture]=useState(true);
  const [openAuBars,setOpenAuBars]=useState(true);
  const [openCalibration,setOpenCalibration]=useState(true);
  const [openMesh,setOpenMesh]=useState(true);

  // Helper to build style objects without template literals
  const style = function(obj){return obj;};

  return (
    React.createElement('div', { className: 'dashboard-v2', style: {display:'flex',flexDirection:'column',gap:'1.5rem'} },
      React.createElement('div', { className: 'dash-cam-row', style: {display:'grid',gridTemplateColumns:'1fr 420px',gap:'1.5rem',alignItems:'start'} },
        React.createElement('article', { className: 'panel dash-cam-panel', style: {display:'flex',flexDirection:'column',height:'100%',minHeight:'600px'} },
          React.createElement('div', { className: 'panel-heading' },
            React.createElement('h2', null, '📷 ', t('Webcam', 'Webcam')),
            React.createElement('span', { className: sc }, faceWorker.status)
          ),
          React.createElement('div', { className: 'camera-container', ref: camRef, style: {flex:1,minHeight:0,display:'flex',flexDirection:'column'} },
            React.createElement('video', { ref: videoRef, className: 'camera', muted: true, playsInline: true, style: {flex:1,width:'100%',height:'100%',objectFit:'cover',borderRadius:'12px',background:'#050d18'} })
          ),
          React.createElement('div', { className: 'mesh-toggle', style: {display:'flex',alignItems:'center',gap:'12px',marginTop:'12px',paddingTop:'12px',borderTop:'1px solid rgba(255,255,255,0.1)'} },
            React.createElement('label', { style: {display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'0.9rem',color:'#e8ebf0'} },
              React.createElement('input', { type: 'checkbox', checked: showMesh, onChange: function(e){setShowMesh(e.target.checked);} }),
              t('Mostrar mesh', 'Show mesh')
            ),
            React.createElement('span', { className: 'caption', style: {marginLeft:'auto',color:'#9fb0c2'} }, (faceWorker.delegate||'CPU') + ' \u00b7 ' + telemetry.sampleCount + ' ' + t('muestras', 'samples'))
          ),
          React.createElement('div', { className: 'summary-grid summary-grid-compact', style: {display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'12px',marginTop:'12px',paddingTop:'12px',borderTop:'1px solid rgba(255,255,255,0.1)'} },
            React.createElement('div', null,
              React.createElement('span', { style: {color:'#a5b8d0',fontSize:'0.8rem'} }, t('Rostros', 'Faces')),
              React.createElement('strong', { style: {fontSize:'1.5rem',color:'#e8ebf0'} }, (lastQuality?.faceCount??0))
            ),
            React.createElement('div', null,
              React.createElement('span', { style: {color:'#a5b8d0',fontSize:'0.8rem'} }, t('Confianza', 'Confidence')),
              React.createElement('strong', { style: {fontSize:'1.5rem',color:'#4dd4ac'} }, pct(telemetry.meanConfidence))
            ),
            React.createElement('div', null,
              React.createElement('span', { style: {color:'#a5b8d0',fontSize:'0.8rem'} }, t('Presencia', 'Presence')),
              React.createElement('strong', { style: {fontSize:'1.5rem',color:'#74a7ff'} }, pct(telemetry.facePresenceRatio))
            ),
            React.createElement('div', null,
              React.createElement('span', { style: {color:'#a5b8d0',fontSize:'0.8rem'} }, t('FPS', 'FPS')),
              React.createElement('strong', { style: {fontSize:'1.5rem',color:'#ffd166'} }, fmt(telemetry.fpsEstimate,1))
            ),
            React.createElement('div', null,
              React.createElement('span', { style: {color:'#a5b8d0',fontSize:'0.8rem'} }, t('Calibraci\u00f3n', 'Calibration')),
              React.createElement('strong', { style: {color:calibrationProfile?.eligible?'#4dd4ac':'#ffd166'} }, calStatusLabel)
            )
          ),
          React.createElement('div', { style: {display:'flex',gap:'8px',alignItems:'center',marginTop:'12px',flexWrap:'wrap'} },
            React.createElement('button', { type: 'button', className: 'btn-secondary', onClick: onCalibrateGazeCenter, disabled: !latestLandmarks, style: {fontSize:'0.75rem',padding:'8px 12px'} }, t('Calibrar mirada centro', 'Calibrate gaze center')),
            React.createElement('button', { type: 'button', className: 'btn-secondary', onClick: onCalibratePostureUpright, disabled: !latestLandmarks, style: {fontSize:'0.75rem',padding:'8px 12px'} }, t('Calibrar postura erguida', 'Calibrate upright posture')),
            manualCalStatus && React.createElement('span', { className: 'caption', style: {color:'#a5b8d0'} }, manualCalStatus)
          ),
          captureQ && React.createElement('div', { className: 'capture-quality-bar', style: {marginTop:'12px',paddingTop:'12px',borderTop:'1px solid rgba(255,255,255,0.1)'} },
            React.createElement('span', { className: 'cq-label', style: {color:'#a5b8d0',fontSize:'0.8rem'} }, t('Calidad', 'Quality')),
            React.createElement('div', { className: 'cq-track', style: {height:'6px',background:'rgba(255,255,255,0.1)',borderRadius:'3px',marginTop:'6px',overflow:'hidden'} },
              React.createElement('div', { className: 'cq-fill', style: {width: captureQ.overallScore + '%',height:'100%',background:light(captureQ.illumination),borderRadius:'3px',transition:'width 0.3s'} })
            ),
            React.createElement('strong', { style: {color:light(captureQ.illumination),fontSize:'1.1rem',marginTop:'6px',display:'block'} }, captureQ.overallScore + '%'),
            React.createElement('span', { className: 'cq-detail', style: {color:'#a5b8d0',fontSize:'0.75rem'} }, captureQ.illumination + (captureQ.occlusion ? ' \u00b7 ' + t('ocluido', 'occluded') : ''))
          )
        ),
        React.createElement('article', { className: 'panel dash-mesh-panel', style: {flex:1,display:'flex',flexDirection:'column',minHeight:'600px',minWidth:0} },
          React.createElement('div', { className: 'panel-heading', style: {display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:'12px',borderBottom:'1px solid rgba(255,255,255,0.1)'} },
            React.createElement('h2', null, '🧬 ', t('Rostro', 'Face')),
            React.createElement('span', { className: 'status ready', style: {fontSize:'0.7rem',padding:'4px 8px',borderRadius:'999px',background:latestLandmarks?'rgba(77,212,172,0.2)':'rgba(255,107,107,0.2)',color:latestLandmarks?'#4dd4ac':'#ff6b6b'} }, latestLandmarks?t('detectado','detected'):t('sin rostro','no face'))
          ),
          React.createElement('div', { className: 'mesh-dark-container', ref: meshRef, style: {flex:1,position:'relative',background:'#050d18',borderRadius:'12px',overflow:'hidden',minHeight:0} },
            React.createElement(FaceMeshOverlayWrapper, { containerRef: meshRef, landmarks: latestLandmarks, visible: showMesh, auRegionActivation: auRegionSummary, gaze: latestGaze, moveNetPose: moveNetPose })
          ),
          telemetry.recentCount>0 && React.createElement('div', { className: 'mesh-info-footer', style: {marginTop:'16px',paddingTop:'16px',paddingBottom:'4px',paddingLeft:'4px',paddingRight:'4px',borderTop:'1px solid rgba(255,255,255,0.1)'} },
            emotions && React.createElement('div', { className: 'mesh-emotion-line', style: {display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px',paddingBottom:'12px',borderBottom:'1px solid rgba(255,255,255,0.1)'} },
              React.createElement('span', { style: {fontSize:'1.8rem'} }, EMO_ICONS[emotions.dominant]||'😐'),
              React.createElement('strong', { style: {color:EMO_CLRS[emotions.dominant],fontSize:'1.1rem'} },
                emotions.dominant==='happiness'?t('Alegr\u00eda','Happiness'):
                emotions.dominant==='sadness'?t('Tristeza','Sadness'):
                emotions.dominant==='surprise'?t('Sorpresa','Surprise'):
                emotions.dominant==='fear'?t('Miedo','Fear'):
                emotions.dominant==='anger'?t('Enojo','Anger'):
                emotions.dominant==='disgust'?t('Disgusto','Disgust'):
                emotions.dominant==='contempt'?t('Desprecio','Contempt'):
                t('Neutral','Neutral')
              ),
              React.createElement('span', { className: 'caption', style: {fontSize:'0.7rem',color:'#9fb0c2',marginLeft:'auto'} }, t('intensidad', 'intensity') + ' ' + Math.round(emotions.dominantScore*100) + '%')
            ),
            React.createElement('div', { className: 'mesh-human-text', style: {color:'#c8d7e8',fontSize:'0.85rem',lineHeight:'1.6'} },
              (function(){
                var top = auEntries.slice(0,3).filter(function(a){return a[1].intensity>0.04;});
                if(!top.length) return React.createElement('span', { style: {color:'#9fb0c2'} }, t('Rostro en reposo', 'Face at rest'));
                var parts = [];
                var hasEyebrows = top.some(function(c){return c[0]==='AU1'||c[0]==='AU2'||c[0]==='AU4';});
                var hasEyes = top.some(function(c){return c[0]==='AU5'||c[0]==='AU6'||c[0]==='AU7'||c[0]==='AU43'||c[0]==='AU45';});
                var hasMouth = top.some(function(c){return c[0]==='AU10'||c[0]==='AU12'||c[0]==='AU14'||c[0]==='AU15'||c[0]==='AU20'||c[0]==='AU23'||c[0]==='AU26';});
                if(hasEyebrows) parts.push(t('cejas activas','active eyebrows'));
                if(hasEyes) parts.push(t('ojos activos','active eyes'));
                if(hasMouth) parts.push(t('boca activa','active mouth'));
                if(emotions?.dominant && emotions.dominant!=='neutral') {
                  var exp = emotions.dominant==='happiness'?t('alegr\u00eda','happiness'):
                    emotions.dominant==='sadness'?t('tristeza','sadness'):
                    emotions.dominant==='surprise'?t('sorpresa','surprise'):
                    emotions.dominant==='fear'?t('miedo','fear'):
                    emotions.dominant==='anger'?t('enojo','anger'):
                    emotions.dominant==='disgust'?t('disgusto','disgust'):
                    emotions.dominant==='contempt'?t('desprecio','contempt'):
                    emotions.dominant;
                  parts.push(t('expresi\u00f3n', 'expression') + ': ' + exp);
                }
                return React.createElement('span', null, parts.join(' \u00b7 '));
              })()
            )
          )
        )
      ),
      React.createElement('div', { className: 'dash-section', style: {marginTop:'1.5rem'} },
        React.createElement('div', { className: 'dash-section-hdr', onClick: function(){setOpenPosture(!openPosture);}, style: {cursor:'pointer',userSelect:'none',display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:'8px',borderBottom:'1px solid rgba(255,255,255,0.1)'} },
          React.createElement('span', { className: 'dash-section-arrow', style: {transition:'transform 0.2s',display:'inline-block',transform:openPosture?'rotate(0)':'rotate(-90deg)'} }, '▼'),
          React.createElement('span', { className: 'dash-section-title', style: {fontSize:'1rem',fontWeight:600,color:'#e8ebf0'} }, '🧍 ', t('Postura corporal', 'Body posture')),
          React.createElement('span', { className: 'dash-section-badge', style: {color:latestPose?(latestPose.postureScore>0.7?'var(--ink-green)':'var(--ink-yellow)'):'#9fb0c2',fontSize:'0.85rem',fontWeight:600} }, latestPose?Math.round(latestPose.postureScore*100)+'%':'—')
        ),
        openPosture && React.createElement('div', { className: 'dash-section-body', style: {marginTop:'16px',animation:'slideDown 0.2s ease'} },
          latestPose ? React.createElement('div', { style: {display:'flex',flexDirection:'column',gap:'16px'} },
            React.createElement('div', { style: {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'12px'} },
              React.createElement('div', { style: {background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'16px',textAlign:'center'} },
                React.createElement('div', { style: {fontSize:'0.7rem',color:'#9fb0c2',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.05em'} }, t('Inclinaci\u00f3n lateral', 'Lateral tilt')),
                React.createElement('div', { style: {fontSize:'2rem',fontWeight:800,color:Math.abs(latestPose.headTiltDeg)<5?'var(--ink-green)':Math.abs(latestPose.headTiltDeg)<15?'var(--ink-yellow)':'var(--ink-red)'} },
                  (latestPose.headTiltDeg > 0 ? '→' : latestPose.headTiltDeg < 0 ? '←' : '•') + ' ' + Math.abs(latestPose.headTiltDeg).toFixed(1) + '°'
                ),
                React.createElement('div', { style: {fontSize:'0.7rem',color:'#9fb0c2',marginTop:'4px'} }, Math.abs(latestPose.headTiltDeg)<5?'✓ Óptimo':Math.abs(latestPose.headTiltDeg)<15?'⚠ Leve':'⚠ Moderado')
              ),
              React.createElement('div', { style: {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'16px',textAlign:'center'} },
                React.createElement('div', { style: {fontSize:'0.7rem',color:'#9fb0c2',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.05em'} }, t('Inclinaci\u00f3n frontal', 'Forward tilt')),
                React.createElement('div', { style: {fontSize:'2rem',fontWeight:800,color:latestPose.headForward<0.3?'var(--ink-green)':latestPose.headForward<0.6?'var(--ink-yellow)':'var(--ink-red)'} },
                  Math.round(latestPose.headForward*100) + '%'
                ),
                React.createElement('div', { style: {fontSize:'0.7rem',color:'#9fb0c2',marginTop:'4px'} }, latestPose.headForward<0.3?'✓ Óptimo':latestPose.headForward<0.6?'⚠ Leve':'⚠ Moderado')
              )
            ),
            React.createElement('div', { style: {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'12px',marginTop:'8px'} },
              React.createElement('div', { style: {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'16px',textAlign:'center'} },
                React.createElement('div', { style: {fontSize:'0.7rem',color:'#9fb0c2',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.05em'} }, t('Asimetr\u00eda', 'Asymmetry')),
                React.createElement('div', { style: {fontSize:'2rem',fontWeight:800,color:latestPose.asymmetry<0.2?'var(--ink-green)':'var(--ink-yellow)'} },
                  Math.round(latestPose.asymmetry*100) + '%'
                ),
                React.createElement('div', { style: {fontSize:'0.7rem',color:'#9fb0c2',marginTop:'4px'} }, latestPose.asymmetry<0.2?'✓ Simétrico':latestPose.asymmetry<0.4?'⚠ Leve':'⚠ Notable')
              ),
              React.createElement('div', { style: {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'16px',textAlign:'center'} },
                React.createElement('div', { style: {fontSize:'0.7rem',color:'#9fb0c2',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.05em'} }, t('Estabilidad', 'Stability')),
                React.createElement('div', { style: {fontSize:'2rem',fontWeight:800,color:latestPose.stability>0.6?'var(--ink-green)':'var(--ink-yellow)'} },
                  Math.round(latestPose.stability*100) + '%'
                ),
                React.createElement('div', { style: {fontSize:'0.7rem',color:'#9fb0c2',marginTop:'4px'} }, latestPose.stability>0.6?'✓ Estable':latestPose.stability>0.3?'⚠ Inestable':'⚠ Inestable')
              )
            ),
            moveNetPose ? React.createElement('div', { style: {marginTop:'16px',background:'rgba(77,212,172,0.1)',border:'1px solid rgba(77,212,172,0.2)',borderRadius:'12px',padding:'16px',textAlign:'left'} },
              React.createElement('div', { style: {fontSize:'0.75rem',color:'#4dd4ac',marginBottom:'8px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'} }, '🏃 Hombros (MoveNet)'),
              React.createElement('div', { style: {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'12px',fontSize:'0.85rem',color:'#e8ebf0'} },
                React.createElement('div', null, React.createElement('span', { style: {color:'#a5b8d0'} }, 'Ángulo:'), ' ', React.createElement('strong', null, moveNetPose.shoulderAngle.toFixed(1) + '°')),
                React.createElement('div', null, React.createElement('span', { style: {color:'#a5b8d0'} }, 'Simetría:'), ' ', React.createElement('strong', null, Math.round(moveNetPose.symmetry*100) + '%')),
                React.createElement('div', null, React.createElement('span', { style: {color:'#a5b8d0'} }, 'Confianza:'), ' ', React.createElement('strong', null, Math.round(moveNetPose.confidence*100) + '%')),
                React.createElement('div', null, React.createElement('span', { style: {color:'#a5b8d0'} }, 'Cobertura:'), ' ', React.createElement('strong', null, Math.round((moveNetPose.upperBodyCoverage??0)*100) + '%')),
                React.createElement('div', null, React.createElement('span', { style: {color:'#a5b8d0'} }, 'Brazos:'), ' ', React.createElement('strong', null, (moveNetPose.armsVisible??0) + '/4')),
                React.createElement('div', null, React.createElement('span', { style: {color:'#a5b8d0'} }, 'Actividad:'), ' ', React.createElement('strong', null, Math.round((moveNetPose.armActivity??0)*100) + '%'))
              )
            ) : React.createElement('div', { style: {marginTop:'16px',background:'rgba(255,255,255,0.03)',border:'1px dashed rgba(255,255,255,0.1)',borderRadius:'12px',padding:'20px',textAlign:'center',color:'#9fb0c2'} },
              'MoveNet: ' + (moveNet?.status??'idle') + (moveNet?.error ? ' \u00b7 ' + moveNet.error : '') + ' \u00b7 ' + t('sin hombros detectados', 'no shoulders detected') + '. ' + t('Aléjate hasta que ambos hombros entren en cuadro.', 'Step back until both shoulders are in frame.')
            ),
            React.createElement('div', { style: {marginTop:'16px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'20px',textAlign:'center'} },
              React.createElement('div', { style: {fontSize:'0.7rem',color:'#9fb0c2',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.05em'} }, t('Puntuación general', 'Overall score')),
              React.createElement('div', { style: {fontSize:'3rem',fontWeight:800,color:'var(--ink-green)'} }, Math.round(latestPose.postureScore*100) + '%'),
              React.createElement('div', { style: {fontSize:'0.8rem',color:'#a5b8d0',marginTop:'8px'} },
                latestPose.postureScore>0.7?'✓ Excelente postura':latestPose.postureScore>0.4?'⚠ Postura mejorable':'⚠ Postura requiere atención'
              )
            ),
            React.createElement('p', { className: 'caption', style: {marginTop:'12px',fontSize:'0.7rem',textAlign:'center',color:'#9fb0c2'} }, t('Estimado desde landmarks faciales. Las tarjetas cambian de color según severidad.', 'Estimated from facial landmarks. Cards change color by severity.'))
          ) : React.createElement('p', { className: 'caption', style: {textAlign:'center',color:'#9fb0c2',padding:'40px'} }, t('Esperando landmarks faciales...', 'Waiting for facial landmarks...'))
        )
      ),
      React.createElement('div', { className: 'dash-section', style: {marginTop:'1.5rem'} },
        React.createElement('div', { className: 'dash-section-hdr', onClick: function(){setOpenMetrics(!openMetrics);}, style: {cursor:'pointer',userSelect:'none',display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:'8px',borderBottom:'1px solid rgba(255,255,255,0.1)'} },
          React.createElement('span', { className: 'dash-section-arrow', style: {transition:'transform 0.2s',display:'inline-block',transform:openMetrics?'rotate(0)':'rotate(-90deg)'} }, '▼'),
          React.createElement('span', { className: 'dash-section-title', style: {fontSize:'1rem',fontWeight:600,color:'#e8ebf0'} }, '📊 ', t('Métricas', 'Metrics')),
          React.createElement('span', { className: 'dash-section-badge', style: {color:'#9fb0c2',fontSize:'0.85rem'} }, telemetry.recentCount + ' muestras')
        ),
        openMetrics && React.createElement('div', { className: 'dash-section-body', style: {marginTop:'16px',animation:'slideDown 0.2s ease'} },
          telemetry.recentCount>0 ? React.createElement('div', { className: 'metrics-grid-compact', style: {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'12px'} },
            insightItems.map(function(item){
              return React.createElement('div', { key: item.id, className: 'metric-compact', style: {background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'14px'} },
                React.createElement('div', { className: 'metric-label', style: {display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'8px'} },
                  React.createElement('span', { style: {color:'#a5b8d0',fontSize:'0.75rem'} }, item.label),
                  React.createElement('strong', { style: {fontSize:'1.5rem',color:'#e8ebf0'} }, pct(item.value))
                ),
                React.createElement('div', { className: 'metric-bar', style: {height:'8px',background:'rgba(255,255,255,0.1)',borderRadius:'4px',overflow:'hidden'} },
                  React.createElement('div', { className: 'metric-bar-fill', style: {width: pct(item.value),height:'100%',background:'var(--ink-green)',borderRadius:'4px',transition:'width 0.3s'} })
                )
              );
            })
          ) : React.createElement('p', { style: {color:'#9fb0c2',textAlign:'center',padding:'20px'} }, t('Esperando datos...', 'Waiting for data...'))
        )
      ),
      edgeAIResult && React.createElement('div', { className: 'dash-section', style: {marginTop:'1.5rem'} },
        React.createElement('div', { className: 'dash-section-hdr', onClick: function(){setOpenEdge(!openEdge);}, style: {cursor:'pointer',userSelect:'none',display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:'8px',borderBottom:'1px solid rgba(255,255,255,0.1)'} },
          React.createElement('span', { className: 'dash-section-arrow', style: {transition:'transform 0.2s',display:'inline-block',transform:openEdge?'rotate(0)':'rotate(-90deg)'} }, '▼'),
          React.createElement('span', { className: 'dash-section-title', style: {fontSize:'1rem',fontWeight:600,color:'#e8ebf0'} }, '🧠 ', t('Edge AI', 'Edge AI')),
          React.createElement('span', { className: 'dash-section-badge', style: {fontSize:'0.85rem',color:edgeComposite?.level==='strong'?'#4dd4ac':edgeComposite?.level==='moderate'?'#ffd166':'#ff6b6b',fontWeight:600} }, (edgeComposite?.score??'—') + '% ' + (edgeComposite?.level??'—'))
        ),
        openEdge && React.createElement('div', { className: 'dash-section-body', style: {marginTop:'16px',animation:'slideDown 0.2s ease'} },
          React.createElement('div', { className: 'edge-composite-bar', style: {marginBottom:'16px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'16px'} },
            React.createElement('span', { className: 'composite-label', style: {display:'block',color:'#a5b8d0',fontSize:'0.75rem',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.05em'} }, t('Score', 'Score')),
            React.createElement('div', { className: 'composite-track', style: {height:'10px',background:'rgba(255,255,255,0.1)',borderRadius:'5px',overflow:'hidden'} },
              React.createElement('div', { className: 'composite-fill', style: {width: (edgeComposite?.score??0) + '%',height:'100%',background:'linear-gradient(90deg,var(--ink-red),var(--ink-yellow),var(--ink-green))',borderRadius:'5px',transition:'width 0.5s ease'} })
            ),
            React.createElement('div', { style: {display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'12px'} },
              React.createElement('strong', { style: {fontSize:'1.8rem',color:edgeComposite?.level==='strong'?'var(--ink-green)':edgeComposite?.level==='moderate'?'var(--ink-yellow)':'var(--ink-red)'} }, (edgeComposite?.score??'—') + '%'),
              React.createElement('span', { className: 'composite-level ' + (edgeComposite?.level??''), style: {fontSize:'0.7rem',padding:'4px 10px',borderRadius:'999px',background:edgeComposite?.level==='strong'?'rgba(77,212,172,0.2)':edgeComposite?.level==='moderate'?'rgba(255,209,102,0.2)':'rgba(255,107,107,0.2)',color:edgeComposite?.level==='strong'?'#4dd4ac':edgeComposite?.level==='moderate'?'#ffd166':'#ff6b6b',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'} }, edgeComposite?.level??'—')
            )
          ),
          emotions && React.createElement('div', { className: 'emotion-badge', style: {marginBottom:'16px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'14px'} },
            React.createElement('div', { style: {display:'flex',alignItems:'center',gap:'12px'} },
              React.createElement('span', { className: 'emotion-icon', style: {fontSize:'2rem'} }, EMO_ICONS[emotions.dominant]||'😐'),
              React.createElement('div', null,
                React.createElement('div', { style: {display:'flex',alignItems:'center',gap:'10px'} },
                  React.createElement('span', { className: 'emotion-label', style: {color:EMO_CLRS[emotions.dominant],fontSize:'1rem',fontWeight:600} }, t('Expresión proxy', 'Proxy expression') + ': ' + emotions.dominant),
                  React.createElement('small', { className: 'caption', style: {color:'#9fb0c2'} }, t('Naive Bayes sobre AUs procesadas · conf', 'Naive Bayes over processed AUs · conf') + ' ' + pct(emotions.confidence??emotions.dominantScore))
                ),
                React.createElement('div', { className: 'emotion-mini-probs', style: {display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'8px'} },
                  Object.entries(emotions.probabilities??{}).sort(function(a,b){return b[1]-a[1];}).slice(0,4).map(function(pair){
                    return React.createElement('span', { key: pair[0], className: 'emotion-mini-chip', style: {background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'999px',padding:'4px 10px',fontSize:'0.7rem',color:'#c8d7e8'} }, pair[0] + ' ' + pct(pair[1]));
                  })
                )
              )
            )
          ),
          React.createElement('div', { className: 'edge-channels-grid-compact', style: {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'12px'} },
            Object.entries(edgeChannels).map(function(entry){
              var name = entry[0], ch = entry[1];
              var clr = CH_COLORS[name]||'var(--ink-blue)';
              var bgColor = ch.level==='strong'?'rgba(77,212,172,0.2)':ch.level==='moderate'?'rgba(255,209,102,0.2)':'rgba(255,107,107,0.2)';
              var txtColor = ch.level==='strong'?'#4dd4ac':ch.level==='moderate'?'#ffd166':'#ff6b6b';
              return React.createElement('div', { key: name, className: 'edge-channel-card', style: {borderColor:clr,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'10px',padding:'14px'} },
                React.createElement('div', { className: 'edge-channel-header', style: {display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'} },
                  React.createElement('span', { className: 'edge-channel-label', style: {fontSize:'0.8rem',fontWeight:600,color:'#e8ebf0',textTransform:'capitalize'} }, t(ch.label, ch.labelEn ?? ch.label)),
                  React.createElement('span', { className: 'edge-channel-level ' + ch.level, style: {fontSize:'0.6rem',padding:'2px 8px',borderRadius:'999px',background:bgColor,color:txtColor,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.03em'} }, ch.level)
                ),
                React.createElement('div', { className: 'edge-channel-bar-track', style: {height:'8px',background:'rgba(255,255,255,0.1)',borderRadius:'4px',overflow:'hidden'} },
                  React.createElement('div', { className: 'edge-channel-bar-fill', style: {width: ch.score + '%',height:'100%',background:clr,borderRadius:'4px',transition:'width 0.4s ease'} })
                ),
                React.createElement('div', { className: 'edge-channel-score-row', style: {display:'flex',justifyContent:'space-between',marginTop:'10px'} },
                  React.createElement('strong', { style: {fontSize:'1.2rem',color:'#e8ebf0'} }, ch.score + '%'),
                  React.createElement('span', { style: {color:'#9fb0c2',fontSize:'0.75rem'} }, t(ch.label, ch.labelEn ?? ch.label))
                )
              );
            })
          ),
          edgeAIResult.caveats?.length>0 && React.createElement('p', { className: 'caption', style: {marginTop:'16px',color:'var(--ink-yellow)',fontSize:'0.8rem',padding:'12px',background:'rgba(255,209,102,0.1)',border:'1px solid rgba(255,209,102,0.2)',borderRadius:'8px'} }, '⚠ ' + t(edgeAIResult.caveats[0], (edgeAIResult.caveatsEn ?? [])[0] ?? edgeAIResult.caveats[0]))
        )
      ),
      React.createElement('div', { className: 'dash-section', style: {marginTop:'1.5rem'} },
        React.createElement('div', { className: 'dash-section-hdr', onClick: function(){setOpenStats(!openStats);}, style: {cursor:'pointer',userSelect:'none',display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:'8px',borderBottom:'1px solid rgba(255,255,255,0.1)'} },
          React.createElement('span', { className: 'dash-section-arrow', style: {transition:'transform 0.2s',display:'inline-block',transform:openStats?'rotate(0)':'rotate(-90deg)'} }, '▼'),
          React.createElement('span', { className: 'dash-section-title', style: {fontSize:'1rem',fontWeight:600,color:'#e8ebf0'} }, '📈 ', t('Estadísticas', 'Statistics')),
          React.createElement('span', { className: 'dash-section-badge', style: {color:'#9fb0c2',fontSize:'0.85rem'} }, telemetry.sampleCount + ' total')
        ),
        openStats && React.createElement('div', { className: 'dash-section-body', style: {marginTop:'16px',animation:'slideDown 0.2s ease'} },
          React.createElement('div', { className: 'stats-grid-compact', style: {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'12px'} },
            React.createElement('div', { className: 'stat-item', style: {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'14px',textAlign:'center'} },
              React.createElement('span', { style: {display:'block',color:'#9fb0c2',fontSize:'0.7rem',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em'} }, t('Muestras', 'Samples')),
              React.createElement('strong', { style: {fontSize:'1.8rem',color:'#e8ebf0'} }, telemetry.sampleCount)
            ),
            React.createElement('div', { className: 'stat-item', style: {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'14px',textAlign:'center'} },
              React.createElement('span', { style: {display:'block',color:'#9fb0c2',fontSize:'0.7rem',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em'} }, t('Ventana', 'Window')),
              React.createElement('strong', { style: {fontSize:'1.8rem',color:'#e8ebf0'} }, telemetry.recentCount)
            ),
            React.createElement('div', { className: 'stat-item', style: {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'14px',textAlign:'center'} },
              React.createElement('span', { style: {display:'block',color:'#9fb0c2',fontSize:'0.7rem',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em'} }, t('Presencia', 'Presence')),
              React.createElement('strong', { style: {fontSize:'1.8rem',color:'#74a7ff'} }, Math.round(telemetry.facePresenceRatio*100) + '%')
            ),
            React.createElement('div', { className: 'stat-item', style: {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'14px',textAlign:'center'} },
              React.createElement('span', { style: {display:'block',color:'#9fb0c2',fontSize:'0.7rem',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em'} }, t('Confianza', 'Confidence')),
              React.createElement('strong', { style: {fontSize:'1.8rem',color:'#4dd4ac'} }, fmt(telemetry.meanConfidence,2))
            ),
            React.createElement('div', { className: 'stat-item', style: {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'14px',textAlign:'center'} },
              React.createElement('span', { style: {display:'block',color:'#9fb0c2',fontSize:'0.7rem',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em'} }, t('FPS', 'FPS')),
              React.createElement('strong', { style: {fontSize:'1.8rem',color:'#ffd166'} }, fmt(telemetry.fpsEstimate,1))
            ),
            React.createElement('div', { className: 'stat-item', style: {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'14px',textAlign:'center'} },
              React.createElement('span', { style: {display:'block',color:'#9fb0c2',fontSize:'0.7rem',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em'} }, t('AUs', 'AUs')),
              React.createElement('strong', { style: {fontSize:'1.8rem',color:'#ffd166'} }, activeAUCount)
            ),
            React.createElement('div', { className: 'stat-item', style: {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'14px',textAlign:'center'} },
              React.createElement('span', { style: {display:'block',color:'#9fb0c2',fontSize:'0.7rem',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em'} }, t('Motor', 'Engine')),
              React.createElement('strong', { style: {fontSize:'1.8rem',color:'#74a7ff'} }, faceWorker.delegate??'CPU')
            ),
            React.createElement('div', { className: 'stat-item', style: {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'14px',textAlign:'center'} },
              React.createElement('span', { style: {display:'block',color:'#9fb0c2',fontSize:'0.7rem',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em'} }, t('Score', 'Score')),
              React.createElement('strong', { style: {fontSize:'1.8rem',color:edgeComposite?.level==='strong'?'var(--ink-green)':edgeComposite?.level==='moderate'?'var(--ink-yellow)':'var(--ink-red)'} }, (edgeComposite?.score??'—') + '%')
            )
          )
        )
      ),
      telemetry.recentCount>0 && auEntries.length>0 && React.createElement('div', { className: 'dash-section', style: {marginTop:'1.5rem'} },
        React.createElement('div', { className: 'dash-section-hdr', onClick: function(){setOpenAuBars(!openAuBars);}, style: {cursor:'pointer',userSelect:'none',display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:'8px',borderBottom:'1px solid rgba(255,255,255,0.1)'} },
          React.createElement('span', { className: 'dash-section-arrow', style: {transition:'transform 0.2s',display:'inline-block',transform:openAuBars?'rotate(0)':'rotate(-90deg)'} }, '▼'),
          React.createElement('span', { className: 'dash-section-title', style: {fontSize:'1rem',fontWeight:600,color:'#e8ebf0'} }, '📈 ', t('Actividad muscular', 'Muscle activity')),
          React.createElement('span', { className: 'dash-section-badge', style: {color:'#9fb0c2',fontSize:'0.85rem'} }, activeAUCount + ' activas')
        ),
        openAuBars && React.createElement('div', { className: 'dash-section-body', style: {marginTop:'16px',animation:'slideDown 0.2s ease'} },
          React.createElement('div', { className: 'au-timeline', style: {display:'flex',flexDirection:'column',gap:'8px'} },
            auEntries.slice(0,12).map(function(entry){
              var code = entry[0], au = entry[1];
              var isActive = au.intensity > 0.05;
              var bgColor = isActive ? 'rgba(77,212,172,0.08)' : 'rgba(255,255,255,0.02)';
              var borderColor = isActive ? 'rgba(77,212,172,0.2)' : 'rgba(255,255,255,0.05)';
              var fillColor = au.intensity > 0.08 ? 'var(--ink-green)' : au.intensity > 0.04 ? 'var(--ink-yellow)' : 'var(--ink-blue)';
              var txtColor = au.intensity > 0.08 ? '#4dd4ac' : au.intensity > 0.04 ? '#ffd166' : '#9fb0c2';
              return React.createElement('div', { key: code, className: 'au-timeline-item' + (isActive?' active':''), style: {display:'flex',alignItems:'center',gap:'12px',padding:'10px 12px',background:bgColor,border:'1px solid',borderColor:borderColor,borderRadius:'8px',transition:'all 0.2s'} },
                React.createElement('span', { className: 'au-timeline-code', style: {fontSize:'0.85rem',fontWeight:700,color:'#e8ebf0',minWidth:'55px',textAlign:'right'} }, code),
                React.createElement('div', { className: 'au-timeline-track', style: {flex:1,height:'10px',background:'rgba(255,255,255,0.08)',borderRadius:'5px',overflow:'hidden'} },
                  React.createElement('div', { className: 'au-timeline-fill', style: {width: Math.round(au.intensity*100) + '%',height:'100%',background:fillColor,borderRadius:'5px',transition:'width 0.3s ease'} })
                ),
                React.createElement('strong', { style: {fontSize:'0.8rem',minWidth:'45px',textAlign:'right',color:txtColor} }, Math.round(au.intensity*100) + '%')
              );
            })
          )
        )
      )
    )
  );
}
import React from 'react';
import { motion } from 'framer-motion';

const InstructionInterstitial = ({ title, description, timeLimit, type, onStart }) => {
  return (
    <div style={{ width:'100%', height:'100%', display:'flex', justifyContent:'center', alignItems:'center' }}>
      <motion.div
        initial={{ opacity:0, scale:0.95, y:10 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:1.05, y:-10 }}
        transition={{ duration:0.35, ease:'easeOut' }}
        className="glass-panel-light"
        style={{ padding:'44px', maxWidth:'580px', width:'100%', textAlign:'center' }}
      >
        <div style={{ color:'#7c3aed', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'2px', marginBottom:'14px', fontWeight:'600' }}>
          {type} Module
        </div>
        <h2 style={{ fontSize:'2.1rem', marginBottom:'20px', color:'#1e1b4b', fontWeight:'800' }}>{title}</h2>
        <p style={{ fontSize:'1rem', color:'#374151', lineHeight:'1.75', marginBottom:'28px' }}>{description}</p>
        <div style={{ display:'flex', justifyContent:'center', gap:'28px', marginBottom:'36px', padding:'18px', background:'rgba(99,102,241,0.07)', borderRadius:'12px', border:'1px solid rgba(99,102,241,0.15)' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'#6b7280', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px' }}>Time Limit</div>
            <div style={{ fontSize:'1.05rem', fontWeight:'700', color:'#1e1b4b' }}>{timeLimit || 'N/A'}</div>
          </div>
          <div style={{ width:'1px', background:'rgba(99,102,241,0.2)' }} />
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'#6b7280', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px' }}>Requirement</div>
            <div style={{ fontSize:'1.05rem', fontWeight:'700', color:'#1e1b4b' }}>Max Focus</div>
          </div>
        </div>
        <button className="btn" style={{ width:'100%', fontSize:'1.05rem' }} onClick={onStart}>
          Begin Module
        </button>
      </motion.div>
    </div>
  );
};

export default InstructionInterstitial;

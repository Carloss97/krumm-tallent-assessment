import React from 'react';
import { motion } from 'framer-motion';

export default function Confetti({ count = 16, size = 8, spread = 80, duration = 1.0 }) {
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#7c3aed'];
  return (
    <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 60 }}>
      {Array.from({ length: count }).map((_, i) => {
        // eslint-disable-next-line react-hooks/purity
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        // eslint-disable-next-line react-hooks/purity
        const dist = spread * (0.6 + Math.random() * 0.8);
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        const color = colors[i % colors.length];
        // eslint-disable-next-line react-hooks/purity
        const rot = Math.round(Math.random() * 360);
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.7, rotate: rot }}
            animate={{ x, y, opacity: 0, scale: 1 }}
            // eslint-disable-next-line react-hooks/purity
            transition={{ duration: duration + Math.random() * 0.6, ease: 'easeOut' }}
            style={{ width: size, height: size * 1.4, background: color, borderRadius: 3, margin: 1, display: 'inline-block' }}
          />
        );
      })}
    </div>
  );
}

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.jpg';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const toggleAuth = () => {
    setIsLogin(!isLogin);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, we would handle authentication here.
    // For this prototype, we'll just navigate to the welcome page.
    navigate('/welcome');
  };

  return (
    <div className="flex-center" style={{ width: '100%', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel" 
        style={{ padding: '40px', width: '100%', maxWidth: '450px', position: 'relative' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img src={logo} alt="Company Logo" style={{ width: '120px', height: 'auto', marginBottom: '20px', borderRadius: '12px' }} />
          <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '8px' }}>
            {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            {isLogin ? 'Accede a tu panel de evaluación cognitiva' : 'Regístrate para comenzar tu evaluación'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>Nombre Completo</label>
              <input 
                type="text" 
                placeholder="Juan Pérez" 
                required 
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  outline: 'none',
                  fontSize: '1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)'
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="correo@ejemplo.com" 
              required 
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                outline: 'none',
                fontSize: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.5)'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required 
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                outline: 'none',
                fontSize: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.5)'
              }}
            />
          </div>

          <button type="submit" className="btn" style={{ marginTop: '10px', width: '100%' }}>
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
            <button 
              onClick={toggleAuth}
              style={{
                background: 'none',
                border: 'none',
                color: '#6366f1',
                fontWeight: '600',
                marginLeft: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                textDecoration: 'underline'
              }}
            >
              {isLogin ? 'Regístrate' : 'Inicia Sesión'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;

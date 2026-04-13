import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="app-footer-inner">
        <div>© {new Date().getFullYear()} Krumm</div>
        <div>
          <a href="mailto:info@krumm.cl">info@krumm.cl</a>
          <span style={{ margin: '0 8px' }}>|</span>
          <a href="mailto:contacto@krumm.cl">contacto@krumm.cl</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[var(--bg)] border-t border-white/[0.06] py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">

        {/* Brand & Copyright */}
        <div className="text-center md:text-left">
          <p className="text-[var(--text-muted)] text-sm">
            &copy; {new Date().getFullYear()} PosterMe. All rights reserved.
          </p>
          <p className="text-[var(--text-muted)] text-xs mt-1">
            AI-Powered Persona Generation
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-[var(--text-muted)]">
          <Link to="/terms" className="hover:text-white transition-colors">
            Terms & Conditions
          </Link>
          <Link to="/refund-policy" className="hover:text-white transition-colors">
            Refunds & Cancellations
          </Link>
          <Link to="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link to="/contact" className="hover:text-white transition-colors">
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import React, { useEffect, useState } from 'react';
import { useImageContext } from '../context/ImageContext';
import { Check } from 'lucide-react';

const PaymentSuccessModal: React.FC = () => {
  const { showSuccessModal, setShowSuccessModal } = useImageContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (showSuccessModal) {
      setVisible(true);
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 300);
  };

  if (!showSuccessModal) return null;

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className={`relative bg-[var(--surface)] border border-white/[0.08] rounded-3xl p-8 max-w-sm w-full shadow-2xl transform transition-all duration-300 ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>

        {/* Success Animation */}
        <div className="flex justify-center mb-6 relative">
            {/* Glow */}
            <div className="absolute inset-0 bg-emerald-500/15 blur-xl rounded-full"></div>

            <div className="relative w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center animate-bounce-gentle">
                <Check size={40} className="text-white drop-shadow-md" strokeWidth={3} />
            </div>

            {/* Confetti */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-visible">
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-confetti-1"></div>
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[var(--accent)] rounded-full animate-confetti-2"></div>
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-400 rounded-full animate-confetti-3"></div>
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-emerald-400 rounded-full animate-confetti-4"></div>
            </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">Payment Successful!</h2>
        <p className="text-[var(--text-secondary)] text-center mb-8">
            Your <span className="text-emerald-400 font-bold">5 Credits</span> have been added to your account.
        </p>

        <button
            onClick={handleClose}
            className="w-full bg-white text-black font-bold py-3.5 rounded-2xl hover:bg-zinc-200 transition-colors active:scale-95"
        >
            Start Creating
        </button>
      </div>

    </div>
  );
};

export default PaymentSuccessModal;

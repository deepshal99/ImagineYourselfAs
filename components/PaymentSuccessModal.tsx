import React, { useEffect, useState } from 'react';
import { useImageContext } from '../context/ImageContext';

const PaymentSuccessModal: React.FC = () => {
  const { showSuccessModal, setShowSuccessModal } = useImageContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (showSuccessModal) {
      setVisible(true);
      // Auto close after 5 seconds
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
    }, 300); // Wait for exit animation
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
      <div className={`relative bg-[#09090b] border border-zinc-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl transform transition-all duration-300 ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        
        {/* Success Animation */}
        <div className="flex justify-center mb-6 relative">
            {/* Glow */}
            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
            
            <div className="relative w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-bounce-gentle">
                <svg className="w-10 h-10 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            
            {/* Confetti (CSS based simple particles) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-visible">
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-confetti-1"></div>
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-400 rounded-full animate-confetti-2"></div>
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-400 rounded-full animate-confetti-3"></div>
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full animate-confetti-4"></div>
            </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">Payment Successful!</h2>
        <p className="text-zinc-400 text-center mb-8">
            Your <span className="text-green-400 font-bold">5 Credits</span> have been added to your account.
        </p>

        <button 
            onClick={handleClose}
            className="w-full bg-white text-black font-bold py-3.5 rounded-full hover:bg-zinc-200 transition-colors active:scale-95"
        >
            Start Creating
        </button>
      </div>

      {/* CSS for simple confetti animation */}
      <style>{`
        @keyframes confetti-1 { 0% { transform: translate(-50%, -50%) scale(0); opacity: 1; } 100% { transform: translate(-150%, -150%) scale(1); opacity: 0; } }
        @keyframes confetti-2 { 0% { transform: translate(-50%, -50%) scale(0); opacity: 1; } 100% { transform: translate(50%, -150%) scale(1); opacity: 0; } }
        @keyframes confetti-3 { 0% { transform: translate(-50%, -50%) scale(0); opacity: 1; } 100% { transform: translate(-150%, 50%) scale(1); opacity: 0; } }
        @keyframes confetti-4 { 0% { transform: translate(-50%, -50%) scale(0); opacity: 1; } 100% { transform: translate(50%, 50%) scale(1); opacity: 0; } }
        .animate-confetti-1 { animation: confetti-1 0.8s ease-out forwards; }
        .animate-confetti-2 { animation: confetti-2 0.8s ease-out forwards 0.1s; }
        .animate-confetti-3 { animation: confetti-3 0.8s ease-out forwards 0.2s; }
        .animate-confetti-4 { animation: confetti-4 0.8s ease-out forwards 0.15s; }
        .animate-bounce-gentle { animation: bounce-gentle 2s infinite; }
        @keyframes bounce-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      `}</style>
    </div>
  );
};

export default PaymentSuccessModal;


import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageContext } from '../context/ImageContext';
import { AlertTriangle, Zap, X } from 'lucide-react';

const CreditsExhaustedModal: React.FC = () => {
    const navigate = useNavigate();
    const { showCreditsExhaustedModal, setShowCreditsExhaustedModal, buyCredits } = useImageContext();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (showCreditsExhaustedModal) {
            setVisible(true);
        }
    }, [showCreditsExhaustedModal]);

    const handleClose = () => {
        setVisible(false);
        setTimeout(() => {
            setShowCreditsExhaustedModal(false);
        }, 300);
    };

    const handleBuyCredits = () => {
        handleClose();
        buyCredits();
    };

    const handleGoBack = () => {
        handleClose();
        navigate('/');
    };

    if (!showCreditsExhaustedModal) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={handleGoBack}
            ></div>

            {/* Modal */}
            <div className={`relative bg-[var(--surface)] border border-white/[0.08] rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                <button
                    onClick={handleGoBack}
                    className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-6">
                    {/* Animated Icon */}
                    <div className="relative flex justify-center mb-4">
                        <div className="absolute inset-0 w-16 h-16 mx-auto bg-red-500/15 blur-xl rounded-full animate-pulse"></div>
                        <div className="relative w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center">
                            <AlertTriangle size={28} className="text-red-400" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Credits Exhausted</h2>
                    <p className="text-[var(--text-secondary)] mb-4">You've used all your credits. Buy more to continue creating awesome posters!</p>

                    {/* Pricing Card */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-4">
                        <p className="text-sm text-[var(--text-secondary)] mb-2">1 Credit = 1 Generation</p>
                        <div className="flex items-center justify-center gap-3">
                            <div className="text-left">
                                <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">50% OFF</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-white">&rupee;49</span>
                                    <span className="text-lg text-[var(--text-muted)] line-through">&rupee;99</span>
                                </div>
                            </div>
                            <div className="text-2xl text-[var(--text-muted)]">=</div>
                            <div className="text-left">
                                <p className="text-xs text-[var(--text-muted)] font-medium">Get</p>
                                <p className="text-3xl font-bold text-[var(--accent)]">5 Credits</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buy Button */}
                <button
                    onClick={handleBuyCredits}
                    className="w-full bg-[var(--accent)] text-white font-bold py-3.5 rounded-2xl hover:bg-[var(--accent-hover)] transition-colors flex items-center justify-center gap-2 mb-3"
                >
                    <Zap size={18} />
                    Buy 5 Credits - ₹49
                </button>

                {/* Go Back Button */}
                <button
                    onClick={handleGoBack}
                    className="w-full bg-white/[0.04] text-zinc-300 font-medium py-2.5 rounded-xl hover:bg-white/[0.08] transition-colors"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
};

export default CreditsExhaustedModal;

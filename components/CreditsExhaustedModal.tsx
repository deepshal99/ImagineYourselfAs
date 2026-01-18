import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImageContext } from '../context/ImageContext';

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
        }, 300); // Wait for exit animation
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
            <div className={`relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                <button
                    onClick={handleGoBack}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>

                <div className="text-center mb-6">
                    {/* Animated Icon */}
                    <div className="relative flex justify-center mb-4">
                        <div className="absolute inset-0 w-16 h-16 mx-auto bg-red-500/20 blur-xl rounded-full animate-pulse"></div>
                        <div className="relative w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Credits Exhausted</h2>
                    <p className="text-zinc-400 mb-4">You've used all your credits. Buy more to continue creating awesome posters!</p>

                    {/* Pricing Card */}
                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-4">
                        <p className="text-sm text-zinc-400 mb-2">1 Credit = 1 Generation</p>
                        <div className="flex items-center justify-center gap-3">
                            <div className="text-left">
                                <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">50% OFF</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-white">₹49</span>
                                    <span className="text-lg text-zinc-500 line-through">₹99</span>
                                </div>
                            </div>
                            <div className="text-2xl text-zinc-600">=</div>
                            <div className="text-left">
                                <p className="text-xs text-zinc-500 font-medium">Get</p>
                                <p className="text-3xl font-bold text-blue-400">5 Credits</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buy Button */}
                <button
                    onClick={handleBuyCredits}
                    className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-3"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Buy 5 Credits - ₹49
                </button>

                {/* Go Back Button */}
                <button
                    onClick={handleGoBack}
                    className="w-full bg-zinc-800/50 text-zinc-300 font-medium py-2.5 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
};

export default CreditsExhaustedModal;

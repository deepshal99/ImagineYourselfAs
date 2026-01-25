import React from 'react';
import { useImageContext } from '../context/ImageContext';

interface CreditsModalProps {
    onClose: () => void;
}

const CreditsModal: React.FC<CreditsModalProps> = ({ onClose }) => {
    const { credits, isUnlimited, buyCredits } = useImageContext();

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    {isUnlimited ? (
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 12c-2-2.67-6-2.67-8 0a4 4 0 1 0 0 8c2 2.67 6 2.67 8 0a4 4 0 1 0 0-8Z" />
                                <path d="M12 12c2-2.67 6-2.67 8 0a4 4 0 1 1 0 8c-2 2.67-6 2.67-8 0a4 4 0 1 1 0-8Z" />
                            </svg>
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}

                    <h2 className="text-xl font-bold text-white mb-1">
                        {isUnlimited ? 'PRO Member' : 'Your Credits'}
                    </h2>
                    <p className="text-zinc-400 text-sm">
                        {isUnlimited
                            ? 'Unlimited poster generations'
                            : 'Each poster costs 1 credit'
                        }
                    </p>
                </div>

                {/* Credits Display */}
                <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 text-center">
                    {isUnlimited ? (
                        <div>
                            <span className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                ∞
                            </span>
                            <p className="text-zinc-400 text-sm mt-1">Unlimited</p>
                        </div>
                    ) : (
                        <div>
                            <span className={`text-4xl font-bold ${credits > 0 ? 'text-white' : 'text-red-400'}`}>
                                {credits}
                            </span>
                            <p className="text-zinc-400 text-sm mt-1">
                                {credits === 1 ? 'credit remaining' : 'credits remaining'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                {isUnlimited ? (
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
                    >
                        Continue Creating
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            onClose();
                            buyCredits();
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                            Get More Credits
                        </span>
                    </button>
                )}

                {/* Pro Upgrade Hint */}
                {!isUnlimited && (
                    <p className="text-center text-xs text-zinc-500 mt-4">
                        Upgrade to PRO for unlimited generations
                    </p>
                )}
            </div>
        </div>
    );
};

export default CreditsModal;

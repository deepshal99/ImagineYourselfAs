import React from 'react';
import { useImageContext } from '../context/ImageContext';
import { Infinity, Coins, Plus, X } from 'lucide-react';

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
                className="bg-[var(--surface)] border border-white/[0.08] rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    {isUnlimited ? (
                        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Infinity size={28} className="text-amber-400" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-[var(--accent-soft)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Coins size={28} className="text-[var(--accent)]" />
                        </div>
                    )}

                    <h2 className="text-xl font-bold text-white mb-1">
                        {isUnlimited ? 'PRO Member' : 'Your Credits'}
                    </h2>
                    <p className="text-[var(--text-secondary)] text-sm">
                        {isUnlimited
                            ? 'Unlimited poster generations'
                            : 'Each poster costs 1 credit'
                        }
                    </p>
                </div>

                {/* Credits Display */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-6 text-center">
                    {isUnlimited ? (
                        <div>
                            <span className="text-4xl font-bold text-amber-400">
                                &infin;
                            </span>
                            <p className="text-[var(--text-secondary)] text-sm mt-1">Unlimited</p>
                        </div>
                    ) : (
                        <div>
                            <span className={`text-4xl font-bold ${credits > 0 ? 'text-white' : 'text-red-400'}`}>
                                {credits}
                            </span>
                            <p className="text-[var(--text-secondary)] text-sm mt-1">
                                {credits === 1 ? 'credit remaining' : 'credits remaining'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                {isUnlimited ? (
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 rounded-2xl bg-white/[0.06] text-white font-medium hover:bg-white/[0.1] transition-colors"
                    >
                        Continue Creating
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            onClose();
                            buyCredits();
                        }}
                        className="w-full py-3 px-4 rounded-2xl bg-[var(--accent)] text-white font-bold hover:bg-[var(--accent-hover)] transition-all shadow-lg"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Plus size={18} />
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

import React, { useState } from 'react';
import { fetchTrendingPersonas } from '../services/agentService';
import { useImageContext } from '../context/ImageContext';

const AgentHunter: React.FC = () => {
    const { addPersonas, personas } = useImageContext();
    const [isHunting, setIsHunting] = useState(false);

    const handleHunt = async () => {
        setIsHunting(true);
        try {
            // "Hunt" for new personas using the AI Agent
            const newPersonas = await fetchTrendingPersonas(personas.length);
            if (newPersonas && newPersonas.length > 0) {
                addPersonas(newPersonas);
                alert(`Agent found ${newPersonas.length} new trending personas!`);
            } else {
                alert("Agent returned empty-handed this time. Try again later.");
            }
        } catch (e) {
            console.error(e);
            alert("Agent encountered an error while hunting.");
        } finally {
            setIsHunting(false);
        }
    };

    return (
        <div className="w-full bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-xl p-6 mb-8 relative overflow-hidden group">
            {/* Background Animation */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">🕵️‍♂️</span> AI Trend Agent
                    </h3>
                    <p className="text-sm text-purple-200 mt-1">
                        Unleash the agent to scour the internet for trending movies, games, and styles.
                    </p>
                </div>

                <button
                    onClick={handleHunt}
                    disabled={isHunting}
                    className={`px-6 py-3 rounded-full font-bold text-white shadow-lg transition-all duration-300 flex items-center gap-2
                        ${isHunting 
                            ? 'bg-zinc-700 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 hover:shadow-purple-500/25'
                        }`}
                >
                    {isHunting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Hunting...
                        </>
                    ) : (
                        <>
                            ✨ Discover New Personas
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default AgentHunter;


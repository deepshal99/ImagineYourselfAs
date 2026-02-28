import React, { useState } from 'react';
import { useImageContext } from "../context/ImageContext.tsx";
import { SavedCreation } from '../types';
import Navigation from "../components/Navigation.tsx";
import MetaHead from '../components/MetaHead';
import { toast } from 'sonner';

import Postey from '../components/Postey';
import { Download, Trash2, X, Check, Images } from 'lucide-react';

const ActionButton: React.FC<{
    icon: React.ReactNode,
    label: string,
    onClick?: () => void,
    variant?: 'default' | 'primary' | 'danger',
    className?: string
}> = ({ icon, label, onClick, variant = 'default', className = '' }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-2 group ${className}`}
    >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg border border-transparent
            ${variant === 'primary'
                ? 'bg-white text-black hover:bg-zinc-200 hover:scale-110 hover:shadow-white/20'
                : variant === 'danger'
                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white hover:scale-110 hover:shadow-red-500/20 border-red-500/20'
                    : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white hover:scale-110 hover:border-white/[0.1] backdrop-blur-sm'
            }`}
        >
            {icon}
        </div>
        <span className="text-xs font-medium text-[var(--text-muted)] group-hover:text-zinc-300 transition-colors">{label}</span>
    </button>
);

const LibraryPage: React.FC = () => {
    const { library, removeFromLibrary, personas } = useImageContext();
    const [selectedImage, setSelectedImage] = useState<SavedCreation | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleClose = () => {
        setSelectedImage(null);
        setShowDeleteConfirm(false);
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (selectedImage) {
            removeFromLibrary(selectedImage.id);
            handleClose();
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    const handleDownload = () => {
        if (selectedImage) {
            const link = document.createElement('a');
            link.href = selectedImage.imageUrl;
            link.download = `saved_persona_${selectedImage.timestamp}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Download started");
        }
    };

    const selectedPersona = selectedImage ? personas.find(p => p.id === selectedImage.personaId) : null;

    return (
        <div className="min-h-screen bg-[var(--bg)]">
            <MetaHead
                title="My Library | PosterMe"
                description="View your personal collection of AI-generated movie posters. Download or delete your creations."
            />
            <Navigation title="My Library" />

            {/* Image Viewer Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
                    <div
                        className="relative w-full max-w-6xl max-h-[90vh] h-auto flex flex-col md:flex-row bg-[var(--surface)] md:rounded-3xl overflow-hidden shadow-2xl border border-white/[0.08]"
                        onClick={e => e.stopPropagation()}
                    >

                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 z-[60] p-2 bg-black/50 text-white rounded-xl hover:bg-black/80 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Image Section */}
                        <div className="flex-1 bg-black flex items-center justify-center p-4 relative group min-h-0">
                            <img
                                src={selectedImage.imageUrl}
                                alt="View"
                                className="max-w-full max-h-[50vh] md:max-h-[85vh] w-auto h-auto object-contain shadow-2xl"
                            />

                            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-100 transition-opacity">
                                <h3 className="text-2xl font-bold text-white mb-1">{selectedPersona?.name || 'Creation'}</h3>
                                <p className="text-[var(--text-secondary)] text-sm">{new Date(selectedImage.timestamp).toLocaleDateString()} &middot; {new Date(selectedImage.timestamp).toLocaleTimeString()}</p>
                            </div>
                        </div>

                        {/* Sidebar / Controls */}
                        <div className="w-full md:w-32 bg-[var(--bg)] border-t md:border-t-0 md:border-l border-white/[0.06] flex flex-row md:flex-col items-center justify-evenly md:justify-center gap-4 py-4 md:py-6 px-4 shrink-0 z-50">

                            {!showDeleteConfirm ? (
                                <>
                                    <ActionButton
                                        label="Download"
                                        variant="primary"
                                        onClick={handleDownload}
                                        icon={<Download size={22} />}
                                    />

                                    <ActionButton
                                        label="Delete"
                                        variant="default"
                                        onClick={handleDeleteClick}
                                        icon={<Trash2 size={22} />}
                                    />
                                </>
                            ) : (
                                <div className="flex flex-row md:flex-col items-center justify-center gap-4 w-full animate-fade-in">
                                    <div className="hidden md:block text-center md:mb-4">
                                        <p className="text-red-400 font-bold mb-1">Delete?</p>
                                    </div>

                                    <ActionButton
                                        label="Confirm"
                                        variant="danger"
                                        onClick={confirmDelete}
                                        icon={<Check size={22} />}
                                    />

                                    <ActionButton
                                        label="Cancel"
                                        onClick={cancelDelete}
                                        icon={<X size={22} />}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto p-6">

                {library.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center">
                        <Postey size={88} mood="waving" />
                        <h3 className="text-zinc-300 text-lg font-semibold mt-4">No posters yet!</h3>
                        <p className="text-[var(--text-muted)] mt-2 mb-6">Create your first movie poster and save it here.</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="px-6 py-2.5 bg-[var(--accent)] text-white font-bold rounded-full hover:bg-[var(--accent-hover)] transition-colors text-sm"
                        >
                            Create a Poster
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {library.map((item) => {
                            const persona = personas.find(p => p.id === item.personaId);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedImage(item)}
                                    className="group relative aspect-[3/4] bg-[var(--surface)] rounded-2xl overflow-hidden shadow-lg border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-all hover:-translate-y-1"
                                >
                                    <img src={item.imageUrl} alt="Saved" className="w-full h-full object-cover" />

                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/10">
                                            Click to view
                                        </span>
                                    </div>

                                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                                        <p className="text-xs font-medium text-zinc-300">{persona?.name || 'Unknown Style'}</p>
                                        <p className="text-[10px] text-[var(--text-muted)]">{new Date(item.timestamp).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LibraryPage;

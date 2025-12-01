import React, { useState } from 'react';
import { useImageContext } from "../context/ImageContext.tsx";
import { PERSONAS } from '../constants';
import { SavedCreation } from '../types';
import Navigation from "../components/Navigation.tsx";
import { toast } from 'sonner';

// Reusing the ActionButton from ResultPage for consistency
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
        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border border-transparent
            ${variant === 'primary' 
                ? 'bg-white text-black hover:bg-zinc-200 hover:scale-110 hover:shadow-white/20' 
                : variant === 'danger'
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white hover:scale-110 hover:shadow-red-500/20 border-red-500/20'
                : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-white hover:scale-110 hover:border-zinc-600 backdrop-blur-sm'
            }`}
        >
            {icon}
        </div>
        <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
    </button>
);

const LibraryPage: React.FC = () => {
  const { library, removeFromLibrary } = useImageContext();
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
          // toast.success is handled in context
          handleClose();
      }
  };

  const cancelDelete = () => {
      setShowDeleteConfirm(false);
      // toast.info("Delete cancelled");
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

  const selectedPersona = selectedImage ? PERSONAS.find(p => p.id === selectedImage.personaId) : null;

  return (
    <div className="min-h-screen bg-[#09090b]">
      <Navigation title="My Library" />

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-8 bg-black/95 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
            <div 
                className="relative w-full h-full md:max-w-6xl md:h-[90vh] flex flex-col md:flex-row bg-zinc-900 md:rounded-2xl overflow-hidden shadow-2xl border-none md:border border-zinc-800" 
                onClick={e => e.stopPropagation()}
            >
                
                {/* Close Button (Mobile/Desktop) */}
                <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors md:hidden"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>

                {/* Image Section */}
                <div className="flex-1 bg-black flex items-center justify-center p-4 relative group">
                    <img 
                        src={selectedImage.imageUrl} 
                        alt="View" 
                        className="max-w-full max-h-[80vh] object-contain shadow-2xl"
                    />
                    
                    {/* Metadata Overlay (Bottom) */}
                    <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-100 transition-opacity">
                        <h3 className="text-2xl font-bold text-white mb-1">{selectedPersona?.name || 'Creation'}</h3>
                        <p className="text-zinc-400 text-sm">{new Date(selectedImage.timestamp).toLocaleDateString()} • {new Date(selectedImage.timestamp).toLocaleTimeString()}</p>
                    </div>
                </div>

                {/* Sidebar / Controls (Right Side on Desktop, Bottom on Mobile) */}
                <div className="fixed bottom-0 left-0 right-0 md:static w-full md:w-32 bg-[#09090b]/95 backdrop-blur-md md:bg-[#09090b] border-t md:border-t-0 md:border-l border-zinc-800 flex flex-row md:flex-col items-center justify-evenly md:justify-center gap-2 md:gap-8 py-4 md:py-6 px-6 md:px-4 shrink-0 z-50 safe-area-bottom shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] md:shadow-none">
                    
                    {/* Close Button (Desktop) */}
                    <button 
                        onClick={handleClose}
                        className="hidden md:flex absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
                        title="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>

                    {!showDeleteConfirm ? (
                        <>
                            <div className="hidden md:flex flex-1"></div>
                            
                            <ActionButton 
                                label="Download" 
                                variant="primary"
                                onClick={handleDownload}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>}
                            />

                            <ActionButton 
                                label="Delete" 
                                variant="default"
                                onClick={handleDeleteClick}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>}
                            />
                            
                            <div className="hidden md:flex flex-1"></div>
                        </>
                    ) : (
                        <div className="flex flex-row md:flex-col items-center justify-center gap-6 w-full animate-fade-in">
                            <div className="hidden md:block text-center md:mb-4">
                                <p className="text-red-400 font-bold mb-1">Delete Image?</p>
                                <p className="text-zinc-500 text-xs">Cannot be undone.</p>
                            </div>
                            
                            <ActionButton 
                                label="Confirm" 
                                variant="danger"
                                onClick={confirmDelete}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 10-10"/></svg>}
                            />
                            
                            <ActionButton 
                                label="Cancel" 
                                onClick={cancelDelete}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        
        {library.length === 0 ? (
            <div className="text-center py-20">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-zinc-400 text-lg font-medium">No saved images yet</h3>
                <p className="text-zinc-600 mt-2">Generate and save your transformations to see them here.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {library.map((item) => {
                    const persona = PERSONAS.find(p => p.id === item.personaId);
                    return (
                        <div 
                            key={item.id} 
                            onClick={() => setSelectedImage(item)}
                            className="group relative aspect-[3/4] bg-zinc-900 rounded-xl overflow-hidden shadow-lg border border-zinc-800 cursor-pointer hover:border-zinc-600 transition-all hover:-translate-y-1"
                        >
                            <img src={item.imageUrl} alt="Saved" className="w-full h-full object-cover" />
                            
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/10">
                                    Click to view
                                </span>
                            </div>
                            
                            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                                <p className="text-xs font-medium text-zinc-300">{persona?.name || 'Unknown Style'}</p>
                                <p className="text-[10px] text-zinc-500">{new Date(item.timestamp).toLocaleDateString()}</p>
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
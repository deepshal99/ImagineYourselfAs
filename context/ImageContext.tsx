import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ImageContextType, Persona, SavedCreation } from '../types';
import { PERSONAS } from '../constants';

// Extended Context to include dynamic persona management
interface ExtendedImageContextType extends ImageContextType {
  personas: Persona[];
  addPersonas: (newPersonas: Persona[]) => void;
}

const ImageContext = createContext<ExtendedImageContextType | undefined>(undefined);

export const ImageContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [library, setLibrary] = useState<SavedCreation[]>([]);
  
  // State to hold ALL personas (Static + AI Discovered)
  const [personas, setPersonas] = useState<Persona[]>(PERSONAS);

  // Load library from local storage on mount
  useEffect(() => {
    // Rebrand: Use 'posterme_library'
    const stored = localStorage.getItem('posterme_library');
    if (stored) {
      try {
        setLibrary(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse library", e);
      }
    }
  }, []);

  const saveToLibrary = (imageUrl: string, personaId: string) => {
    const newCreation: SavedCreation = {
      id: Date.now().toString(),
      personaId,
      imageUrl,
      timestamp: Date.now(),
    };
    const updated = [newCreation, ...library];
    setLibrary(updated);
    localStorage.setItem('posterme_library', JSON.stringify(updated));
  };

  const removeFromLibrary = (id: string) => {
    const updated = library.filter(item => item.id !== id);
    setLibrary(updated);
    localStorage.setItem('posterme_library', JSON.stringify(updated));
  };

  const addPersonas = (newPersonas: Persona[]) => {
    setPersonas(prev => [...prev, ...newPersonas]);
  };

  return (
    <ImageContext.Provider
      value={{
        uploadedImage,
        setUploadedImage,
        selectedPersona,
        setSelectedPersona,
        generatedImage,
        setGeneratedImage,
        library,
        saveToLibrary,
        removeFromLibrary,
        personas,
        addPersonas
      }}
    >
      {children}
    </ImageContext.Provider>
  );
};

export const useImageContext = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImageContext must be used within an ImageContextProvider');
  }
  return context;
};

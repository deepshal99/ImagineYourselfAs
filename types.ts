export type PersonaCategory = "Movie" | "Series" | "YouTube" | "Other";

export interface Persona {
  id: string;
  name: string;
  cover: string;
  prompt: string;
  category: PersonaCategory;
}

export interface SavedCreation {
  id: string;
  personaId: string;
  imageUrl: string;
  timestamp: number;
}

export interface ImageContextType {
  uploadedImage: string | null;
  setUploadedImage: (image: string | null) => void;
  selectedPersona: Persona | null;
  setSelectedPersona: (persona: Persona | null) => void;
  library: SavedCreation[];
  saveToLibrary: (imageUrl: string, personaId: string) => void;
  removeFromLibrary: (id: string) => void;
  generatedImage: string | null;
  setGeneratedImage: (image: string | null) => void;
}

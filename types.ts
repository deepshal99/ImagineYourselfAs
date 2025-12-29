export type PersonaCategory = "Movie" | "Series" | "YouTube" | "Other";

export interface Persona {
  id: string;
  name: string;
  cover: string;
  prompt: string;
  category: PersonaCategory;
  reference_image?: string;
  reference_description?: string;
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
  personas: Persona[];
  addPersonas: (newPersonas: Persona[]) => void;
  credits: number;
  isUnlimited: boolean;
  checkCredits: () => Promise<boolean>;
  deductCredit: () => Promise<void>;
  buyCredits: () => Promise<void>;
  // Face description caching for cost optimization
  cachedFaceDescription: string | null;
  setCachedFaceDescription: (desc: string | null) => void;
  imageHash: string | null;
  showSuccessModal: boolean;
  setShowSuccessModal: (show: boolean) => void;
  userReferenceImage: string | null;
  setUserReferenceImage: (image: string | null) => void;
}

import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ImageContextProvider } from './context/ImageContext';
import UploadPage from './pages/UploadPage';
import PersonasPage from './pages/PersonasPage';
import ResultPage from './pages/ResultPage';
import LibraryPage from './pages/LibraryPage';
import { PERSONAS } from './constants';

const ImagePreloader = () => {
  return (
    <div style={{ display: 'none' }} aria-hidden="true">
      {PERSONAS.map((persona) => (
        <img 
          key={persona.id} 
          src={persona.cover} 
          alt={`Preload ${persona.id}`} 
          loading="eager"
        />
      ))}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ImageContextProvider>
        <ImagePreloader />
        <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 selection:bg-white selection:text-black font-sans">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/personas" element={<PersonasPage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/library" element={<LibraryPage />} />
          </Routes>
        </div>
      </ImageContextProvider>
    </Router>
  );
};

export default App;
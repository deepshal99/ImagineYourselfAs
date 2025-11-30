import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ImageContextProvider } from './context/ImageContext';
import { AuthProvider } from './context/AuthContext';
import UploadPage from './pages/UploadPage';
import ResultPage from './pages/ResultPage';
import LibraryPage from './pages/LibraryPage';
import { Toaster } from 'sonner';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ImageContextProvider>
          <Toaster position="top-center" theme="dark" richColors closeButton />
          <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 selection:bg-white selection:text-black font-sans">
            <Routes>
              <Route path="/" element={<UploadPage />} />
              <Route path="/result" element={<ResultPage />} />
              <Route path="/library" element={<LibraryPage />} />
            </Routes>
          </div>
        </ImageContextProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
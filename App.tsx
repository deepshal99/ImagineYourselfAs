import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ImageContextProvider } from "./context/ImageContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { Toaster } from 'sonner';

// Lazy load pages for better performance
const UploadPage = lazy(() => import("./pages/UploadPage.tsx"));
const ResultPage = lazy(() => import("./pages/ResultPage.tsx"));
const LibraryPage = lazy(() => import("./pages/LibraryPage.tsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.tsx"));

const LoadingSpinner = () => (
  <div className="min-h-screen w-full bg-[#09090b] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ImageContextProvider>
          <Toaster position="top-center" theme="dark" richColors closeButton />
          <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 selection:bg-white selection:text-black font-sans">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<UploadPage />} />
                <Route path="/result" element={<ResultPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/admin" element={<AdminPage />} />
                {/* Catch-all redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </ImageContextProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
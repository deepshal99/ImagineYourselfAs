import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ImageContextProvider } from "./context/ImageContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { Toaster } from 'sonner';
import { Agentation } from "agentation";

// Eager load critical pages for instant navigation
import UploadPage from "./pages/UploadPage.tsx";
import ResultPage from "./pages/ResultPage.tsx";
import PersonaPage from "./pages/PersonaPage.tsx";
import PaymentSuccessModal from "./components/PaymentSuccessModal.tsx";
import CreditsExhaustedModal from "./components/CreditsExhaustedModal.tsx";
import Footer from "./components/Footer.tsx";
import { TermsPage, RefundPage, ContactPage, PrivacyPage } from "./pages/LegalPages.tsx";

// Lazy load secondary pages
const LibraryPage = lazy(() => import("./pages/LibraryPage.tsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.tsx"));

const LoadingSpinner = () => (
  <div className="min-h-screen w-full bg-[#09090b] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-zinc-800 rounded-full animate-spin" style={{ borderTopColor: '#6c72cb' }}></div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ImageContextProvider>
          <Toaster position="top-center" theme="dark" richColors closeButton />
          <PaymentSuccessModal />
          <CreditsExhaustedModal />
          {process.env.NODE_ENV === "development" && <Agentation />}
          <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 selection:bg-white selection:text-black font-sans flex flex-col">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<UploadPage />} />
                <Route path="/result" element={<ResultPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/persona/:personaId" element={<PersonaPage />} />
                <Route path="/admin" element={<AdminPage />} />

                {/* Legal Pages */}
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/refund-policy" element={<RefundPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />

                {/* Catch-all redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <Footer />
          </div>
        </ImageContextProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Navbar from "./components/Navbar"; 
import Hero from "./components/Hero";
import ProductPreview from "./components/ProductPreview"; 
import HowItWorks from "./components/HowItWorks"; 
import ProductCapabilities from "./components/ProductCapabilities"; 
import AIAnalysisPreview from "./components/AIAnalysisPreview"; 
import FinalCTA from "./components/FinalCTA"; 
import Footer from "./components/Footer";  
import AppShell from "./components/AppShell"; 
import DatasetWorkspace from "./components/DatasetWorkspace";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <Navbar /> 

      <main>
        <Hero /> 
        <ProductPreview />
        <HowItWorks />
        <ProductCapabilities />
        <AIAnalysisPreview />
        <FinalCTA />
      </main> 

      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} /> 
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          /> 

          <Route
            path="/app/datasets/:id"
            element={
              <ProtectedRoute>
                <DatasetWorkspace />
              </ProtectedRoute>
            }
          /> 
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
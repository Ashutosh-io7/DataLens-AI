import { BrowserRouter, Routes, Route } from "react-router-dom";

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
    <BrowserRouter>
      <Routes>
        <Route path = "/" element = {<LandingPage/>}/> 

        <Route path = "/app" element = {<AppShell />}/> 

        <Route path = "/app/datasets/:id" element = {<DatasetWorkspace />} /> 

      </Routes>
    </BrowserRouter>
  );
}

export default App;
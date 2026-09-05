import Navbar from "./components/Navbar"; 
import Hero from "./components/Hero";
import ProductPreview from "./components/ProductPreview"; 
import HowItWorks from "./components/HowItWorks"; 
import ProductCapabilities from "./components/ProductCapabilities"; 
import AIAnalysisPreview from "./components/AIAnalysisPreview"; 
import FinalCTA from "./components/FinalCTA"; 
import Footer from "./components/Footer";

function App() {
  return (
    <div class = "min-h-screen bg-slate-50">
      <Navbar/> 
      <Hero/>
      <ProductPreview/> 
      <HowItWorks/> 
      <ProductCapabilities/> 
      <AIAnalysisPreview/> 
      <FinalCTA/> 
      <Footer/>
    </div>
  )
}

export default App
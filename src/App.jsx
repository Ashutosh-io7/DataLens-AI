import Navbar from "./components/Navbar"; 
import Hero from "./components/Hero";
import ProductPreview from "./components/ProductPreview"; 
import HowItWorks from "./components/HowItWorks"; 
import ProductCapabilities from "./components/ProductCapabilities";

function App() {
  return (
    <div class = "min-h-screen bg-slate-50">
      <Navbar/> 
      <Hero/>
      <ProductPreview/> 
      <HowItWorks/> 
      <ProductCapabilities/>
    </div>
  )
}

export default App
import Navbar from "./components/Navbar"; 
import Hero from "./components/Hero";
import ProductPreview from "./components/ProductPreview";

function App() {
  return (
    <div class = "min-h-screen bg-slate-50">
      <Navbar/> 
      <Hero/>
      <ProductPreview/>
    </div>
  )
}

export default App
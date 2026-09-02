import { ArrowRight } from "lucide-react";
import DataLensLogo from "./DataLensLogo";

function Navbar() {
    return (
        <nav className="flex items-center justify-between px-8 py-5 lg:px-16">
            {/* Logo */} 
            <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <DataLensLogo size = {36}/>
                </div> 

                <span className="text-xl font-bold tracking-tight text-slate-900">
                    DataLens <span className="text-blue-600"> AI </span>
                </span>
            </div> 

            {/* Navigation */} 

            <div className="hidden items-center gap-10 text-sm font-medium text-slate-600 md:flex">
                <a href = "#features" className="transition hover:text-slate-900">
                    Features 
                </a> 

                <a href = "#how-it-works" className="transition hover:text-slate-900">
                    How it works
                </a> 

                <a href = "#pricing" className="transition hover:text-slate-900">
                    Pricing
                </a>
            </div> 

            {/* Actions */} 

            <div className = "flex items-center gap-4">
                <button className="hidden text-sm font-semibold text-slate-700 transition hover:text-slate-900 sm:block">
                    Log in 
                </button> 

                <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                    Get Started 
                    <ArrowRight size = {16}/>
                </button>
            </div>

        </nav>
    )
} 


export default Navbar;
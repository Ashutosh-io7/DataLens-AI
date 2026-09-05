import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import DataLensLogo from "./DataLensLogo";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-slate-50/90 px-6 backdrop-blur-md lg:px-16">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between">
        {/* Brand */}
        <a href="#" className="flex items-center gap-2">
          <DataLensLogo size={36} />

          <span className="text-xl font-bold tracking-tight text-slate-900">
            DataLens <span className="text-blue-600">AI</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-9 text-sm font-medium text-slate-600 md:flex">
          <a href="#features" className="transition hover:text-slate-900">
            Features
          </a>

          <a href="#how-it-works" className="transition hover:text-slate-900">
            How it works
          </a>

          <a href="#pricing" className="transition hover:text-slate-900">
            Pricing
          </a>
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-4 md:flex">
          <button className="text-sm font-semibold text-slate-700 transition hover:text-slate-900">
            Log in
          </button>

          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            Get Started
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="border-t border-slate-200 py-5 md:hidden">
          <div className="flex flex-col gap-1">
            <a
              href="#features"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900"
            >
              How it works
            </a>

            <a
              href="#pricing"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900"
            >
              Pricing
            </a>

            <div className="mt-3 flex gap-3 border-t border-slate-200 pt-4">
              <button className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">
                Log in
              </button>

              <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
                Get Started
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
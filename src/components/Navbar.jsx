import { ArrowRight, Menu, User, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import DataLensLogo from "./DataLensLogo";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-slate-50/90 px-6 backdrop-blur-md lg:px-16">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <DataLensLogo size={36} />

          <span className="text-xl font-bold tracking-tight text-slate-900">
            DataLens <span className="text-blue-600">AI</span>
          </span>
        </Link>

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
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200">
                <User size={14} className="text-blue-600" />
                <span>{user?.email}</span>
              </div>

              <Link
                to="/app"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Go to Workspace
                <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-700 transition hover:text-slate-900"
              >
                Log in
              </Link>

              <Link
                to="/signup"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Get Started
                <ArrowRight size={16} />
              </Link>
            </>
          )}
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
              {isAuthenticated ? (
                <Link
                  to="/app"
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Go to Workspace
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 text-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    Log in
                  </Link>

                  <Link
                    to="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Get Started
                    <ArrowRight size={16} />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
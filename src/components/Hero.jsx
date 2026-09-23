import { ArrowRight, Play, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Hero() { 
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleCtaClick = () => {
    navigate(isAuthenticated ? "/app" : "/signup");
  };

  const handleScrollToHowItWorks = () => {
    const el = document.getElementById("how-it-works");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden px-6 pt-16 pb-12 sm:pt-20 lg:px-16 lg:pt-24 lg:pb-16">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[480px] w-[700px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-gradient-to-tr from-blue-100/70 via-indigo-50/50 to-transparent blur-3xl" />

      <div className="mx-auto max-w-4xl text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-xs backdrop-blur-xs">
          <Sparkles size={13} className="text-blue-600" />
          <span>Next-Generation Data Science Workspace</span>
        </div>

        {/* Headline */}
        <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
          Your data has answers.
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Just ask.
          </span>
        </h1>

        {/* Subhead */}
        <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg sm:leading-8">
          Upload any CSV or Excel file. DataLens AI automatically profiles your dataset,
          executes deterministic Pandas calculations, and generates explainable ML insights.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
          <button
            onClick={handleCtaClick}
            className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
          >
            <span>{isAuthenticated ? "Go to your workspace" : "Start analyzing for free"}</span>
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </button>

          <button
            onClick={handleScrollToHowItWorks}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
          >
            <Play size={14} className="fill-slate-600 text-slate-600" />
            <span>See how it works</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            No SQL or formulas required
          </span>
          <span className="hidden sm:inline">·</span>
          <span>Instant CSV & XLSX profiling</span>
          <span className="hidden sm:inline">·</span>
          <span>XGBoost & SHAP explainability</span>
        </div>
      </div>
    </section>
  );
}

export default Hero;
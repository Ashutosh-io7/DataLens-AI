import { ArrowRight, Bot, CheckCircle2, Database, Sparkles, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function FinalCTA() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleCtaClick = () => {
    navigate(isAuthenticated ? "/app" : "/signup");
  };

  return (
    <section id="cta" className="px-6 py-24 lg:px-8 lg:py-32">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white px-7 py-16 sm:px-12 lg:px-16 lg:py-20 shadow-xl shadow-blue-500/5">
        {/* Subtle background ambient blur */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left: Headline & Actions */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs backdrop-blur-xs">
              <Sparkles size={13} className="text-blue-600" />
              <span>Instant AI Data Science</span>
            </div>

            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Stop staring at spreadsheets.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Start asking questions.
              </span>
            </h2>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600">
              Upload any CSV or Excel file. Uncover correlations, generate predictive
              XGBoost models, and get clear analytical explanations in seconds.
            </p>

            <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <button
                onClick={handleCtaClick}
                className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <span>{isAuthenticated ? "Go to your workspace" : "Get started for free"}</span>
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>No credit card required</span>
              </div>
            </div>

            <p className="mt-5 text-xs font-medium text-slate-400">
              PostgreSQL persistence · CSV & Excel · Natural language queries
            </p>
          </div>

          {/* Right: Floating Product Preview Card */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xl shadow-slate-300/40">
              {/* Top bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Bot size={14} />
                  </div>
                  <span className="text-xs font-bold text-slate-900">DataLens AI</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <Database size={11} />
                  <span>Ready</span>
                </div>
              </div>

              {/* Sample Question */}
              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Question</p>
                <p className="mt-0.5 text-xs font-medium text-slate-800">
                  "Which marketing channel delivers the highest ROI?"
                </p>
              </div>

              {/* Sample Answer */}
              <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Top Channel</p>
                    <p className="text-lg font-extrabold text-slate-900">Email Marketing</p>
                    <p className="text-xs font-semibold text-emerald-600">+4.2× average ROI</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <TrendingUp size={20} />
                  </div>
                </div>

                {/* Progress bars */}
                <div className="mt-4 space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-600 mb-1">
                      <span>Email</span>
                      <span className="font-bold text-blue-600">420%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: "92%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-600 mb-1">
                      <span>Organic Search</span>
                      <span className="font-bold text-slate-600">280%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: "62%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Grounded badge */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Verified with Pandas</span>
                <span className="font-medium text-blue-600">100% Deterministic</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
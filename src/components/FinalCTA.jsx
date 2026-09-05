import { ArrowRight, BarChart3, MessageSquareText, Sparkles } from "lucide-react";

function FinalCTA() {
  return (
    <section id="cta" className="px-6 py-24 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
        {/* Subtle background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)",
          }}
        />

        <div className="relative grid items-center gap-14 lg:grid-cols-[1fr_0.8fr]">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-sm">
              <Sparkles size={13} />
              Start with your data
            </div>

            <h2 className="mt-6 max-w-xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Stop staring at spreadsheets.
              <span className="text-blue-600"> Start asking questions.</span>
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Upload your dataset and let DataLens AI help you discover trends,
              patterns, and answers in seconds.
            </p>

            <button className="group mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              Analyze your data

              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>

            <p className="mt-5 text-xs font-medium text-slate-400">
              CSV & Excel supported · No SQL required
            </p>
          </div>

          {/* Mini Product Visual */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50">
              {/* Question */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <MessageSquareText size={16} />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Ask your data
                  </p>

                  <p className="mt-1 text-sm font-medium leading-5 text-slate-800">
                    What are my strongest sales regions?
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="my-5 h-px bg-slate-100" />

              {/* Result */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Top region
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    West
                  </p>

                  <p className="mt-1 text-xs text-emerald-600">
                    +18.4% revenue growth
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <BarChart3 size={19} />
                </div>
              </div>

              {/* Mini bars */}
              <div className="mt-6 flex h-20 items-end gap-2">
                {[38, 52, 44, 67, 58, 76, 92].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-sm bg-blue-100"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Floating insight */}
            <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-blue-100 bg-white px-4 py-3 shadow-lg shadow-slate-200/50 sm:block">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-blue-600" />

                <span className="text-xs font-semibold text-slate-800">
                  Insight found
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
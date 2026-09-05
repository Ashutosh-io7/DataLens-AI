import { ArrowRight, Play } from "lucide-react";

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-12 pt-8 lg:px-16 lg:pb-16 lg:pt-12">
      {/* Background accents */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl" />

      <div className="mx-auto max-w-5xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3.5 py-1.5 text-xs font-semibold text-blue-600 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
          AI-powered data analysis
        </div>

        <h1 className="mt-7 text-5xl font-bold tracking-[-0.03em] text-slate-900 sm:text-6xl lg:text-7xl">
          Your data has answers.
          <br />
          <span className="text-blue-600">Just ask.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
          Upload your CSV or Excel file and let DataLens AI turn raw data
          into clear answers, useful visualizations, and actionable insights.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button className="group flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            Analyze your data
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </button>

          <button className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50">
            <Play size={15} />
            See how it works
          </button>
        </div>

        <p className="mt-6 text-xs font-medium text-slate-400">
          No SQL required · CSV & Excel supported · Ask questions in plain English
        </p>
      </div>
    </section>
  );
}

export default Hero;
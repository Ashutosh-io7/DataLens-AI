import {
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Database,
  GitBranch,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const capabilities = [
  {
    icon: MessageSquareText,
    title: "Natural Language Queries",
    description:
      "Ask questions in plain English. The Gemini LLM planner decodes intent and routes to safe, deterministic Pandas execution — no hallucinated numbers.",
    tag: "Core",
    tagColor: "bg-blue-50 text-blue-600 border-blue-100",
    iconColor: "bg-blue-50 text-blue-600",
  },
  {
    icon: BarChart3,
    title: "Intelligent Visualization",
    description:
      "Charts are chosen automatically based on data type and question intent — bars for rankings, lines for trends, histograms for distributions.",
    tag: "Analysis",
    tagColor: "bg-sky-50 text-sky-600 border-sky-100",
    iconColor: "bg-sky-50 text-sky-600",
  },
  {
    icon: BrainCircuit,
    title: "XGBoost ML Models",
    description:
      "Ask \"predict\" or \"classify\" and an XGBoost model is automatically trained, evaluated, and explained — with accuracy, AUC, and feature importance.",
    tag: "ML",
    tagColor: "bg-violet-50 text-violet-700 border-violet-100",
    iconColor: "bg-violet-50 text-violet-600",
  },
  {
    icon: GitBranch,
    title: "SHAP Explainability",
    description:
      "Every ML prediction comes with a SHAP feature importance chart so you understand exactly why the model made each decision.",
    tag: "Explainability",
    tagColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
    iconColor: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Database,
    title: "PostgreSQL Persistence",
    description:
      "Dataset metadata, conversations, and ML results are persisted in PostgreSQL. Refresh or close the tab — your analysis history is always there.",
    tag: "Storage",
    tagColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
    iconColor: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: ShieldCheck,
    title: "Grounded Analysis Only",
    description:
      "DataLens AI never invents numbers. The LLM identifies intent; Pandas performs all math. Calculated results are always verifiable and deterministic.",
    tag: "Reliability",
    tagColor: "bg-amber-50 text-amber-700 border-amber-100",
    iconColor: "bg-amber-50 text-amber-600",
  },
];

function ProductCapabilities() {
  return (
    <section
      id="features"
      className="bg-slate-50 px-6 py-24 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Platform capabilities
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to understand your data.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-500">
              A full analytical stack — from conversational queries to production-grade ML — in one workspace.
            </p>
          </div>

          {/* Trust stat */}
          <div className="flex shrink-0 flex-col items-start rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-xs lg:items-center">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-blue-600" />
              <p className="text-2xl font-black tracking-tight text-slate-900">
                6 Core Features
              </p>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              From upload to SHAP explainability
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <article
                key={cap.title}
                className="group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300"
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cap.iconColor}`}>
                    <Icon size={19} />
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cap.tagColor}`}>
                    {cap.tag}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {cap.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {cap.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom note */}
        <div className="mt-10 flex items-center gap-2.5 text-xs text-slate-400">
          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
          <span>
            All features work on any CSV or Excel file — no templates, no dataset-specific configuration.
          </span>
        </div>
      </div>
    </section>
  );
}

export default ProductCapabilities;
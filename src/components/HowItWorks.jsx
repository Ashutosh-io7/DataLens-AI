import { FileUp, MessageSquareText, Sparkles } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileUp,
    label: "Upload",
    title: "Drop in your dataset",
    description:
      "Upload any CSV or Excel file. DataLens AI instantly profiles every column — detecting types, missing values, outliers, distributions, and data quality.",
    accent: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
  },
  {
    number: "02",
    icon: MessageSquareText,
    label: "Ask",
    title: "Ask in plain English",
    description:
      "Type a question like you'd ask a colleague. The LLM query planner understands intent, then runs deterministic Pandas calculations — no hallucinated numbers.",
    accent: "bg-indigo-50 text-indigo-600",
    border: "border-indigo-100",
  },
  {
    number: "03",
    icon: Sparkles,
    label: "Understand",
    title: "Get grounded answers",
    description:
      "Receive accurate answers with matching visualizations, AI-written explanations, and smart follow-up suggestions to explore further.",
    accent: "bg-violet-50 text-violet-600",
    border: "border-violet-100",
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-white px-6 py-24 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
            How it works
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            From raw data to clear answers
            <span className="text-blue-600"> in seconds.</span>
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-500 sm:text-lg">
            A focused three-step workflow — no dashboards, no queries, no configuration.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article
                key={step.number}
                className={`group relative overflow-hidden rounded-2xl border bg-white p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${step.border}`}
              >
                {/* Step number watermark */}
                <span className="pointer-events-none absolute right-5 top-4 text-6xl font-black text-slate-100 select-none">
                  {step.number}
                </span>

                {/* Icon */}
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${step.accent} shadow-xs`}>
                  <Icon size={20} />
                </div>

                {/* Label pill */}
                <span className={`mt-5 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${step.accent}`}>
                  {step.label}
                </span>

                <h3 className="mt-3 text-base font-bold text-slate-900">
                  {step.title}
                </h3>

                <p className="mt-2.5 text-sm leading-6 text-slate-500">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
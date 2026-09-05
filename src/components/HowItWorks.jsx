import { ArrowRight, FileUp, MessageSquareText, Sparkles } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileUp,
    title: "Upload your data",
    description:
      "Drop in a CSV or Excel file. DataLens AI understands its structure and prepares it for analysis.",
  },
  {
    number: "02",
    icon: MessageSquareText,
    title: "Ask questions",
    description:
      "Ask questions in plain English. No SQL, formulas, or complex dashboards required.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Get useful answers",
    description:
      "Receive clear answers, relevant visualizations, and insights that help you understand what matters.",
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y border-slate-200/80 bg-white px-6 py-24 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
            How it works
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            From raw data to clear answers.
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            A simple workflow built around conversation, context, and useful
            analysis.
          </p>
        </div>

        {/* Steps */}
        <div className="relative mt-14">
          {/* Connection Line */}
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-9 hidden h-px bg-slate-200 md:block" />

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.number}
                  className="group relative z-10 rounded-2xl border border-slate-200 bg-slate-50/80 p-7 transition-all duration-200 hover:-translate-y-1 hover:border-blue-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
                >
                  {/* Icon + Number */}
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/80 transition-colors group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600">
                      <Icon size={19} />
                    </div>

                    <span className="text-xs font-bold tracking-wider text-slate-300">
                      {step.number}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="mt-7 text-lg font-semibold text-slate-900">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>

        {/* Next Section Link */}
        <a
          href="#ai-analysis"
          className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
        >
          See the analysis experience
          <ArrowRight size={15} />
        </a>
      </div>
    </section>
  );
}

export default HowItWorks;
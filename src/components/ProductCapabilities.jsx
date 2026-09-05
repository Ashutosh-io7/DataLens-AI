import {
  BarChart3,
  Brain,
  MessageSquareText,
  Sparkles,
} from "lucide-react";

const capabilities = [
  {
    icon: MessageSquareText,
    title: "Ask in plain English",
    description:
      "Ask questions about your dataset naturally. No SQL or complicated formulas.",
  },
  {
    icon: BarChart3,
    title: "Useful visualizations",
    description:
      "Turn important patterns and comparisons into clear, relevant charts.",
  },
  {
    icon: Brain,
    title: "AI-powered analysis",
    description:
      "Go beyond basic numbers with deeper analysis, patterns, and explanations.",
  },
  {
    icon: Sparkles,
    title: "Actionable insights",
    description:
      "Understand what your data means and identify the trends that matter.",
  },
];

function ProductCapabilities() {
  return (
    <section
      id="features"
      className="bg-slate-50 px-6 py-24 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
            Product capabilities
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Everything you need to understand your data.
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            DataLens AI combines conversation, analysis, and visualization in
            one focused workspace.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((capability) => {
            const Icon = capability.icon;

            return (
              <article
                key={capability.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl hover:shadow-slate-200/50"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <Icon size={20} />
                </div>

                <h3 className="mt-6 text-base font-semibold text-slate-900">
                  {capability.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {capability.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ProductCapabilities;
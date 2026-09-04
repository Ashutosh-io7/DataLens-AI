import {
    BarChart3,
    Brain,
    FileSpreadsheet,
    MessageSquareText,
    Search,
    WandSparkles
} from "lucide-react"; 

const capabilities = [
  {
    icon: MessageSquareText,
    title: "Ask your data",
    description:
      "Explore your dataset using natural language. Ask follow-up questions and keep the conversation going.",
  },
  {
    icon: BarChart3,
    title: "Visual answers",
    description:
      "Get the right chart for the question automatically, instead of building dashboards manually.",
  },
  {
    icon: Brain,
    title: "AI-powered insights",
    description:
      "Go beyond numbers with explanations, trends, patterns, and factors that deserve your attention.",
  },
  {
    icon: FileSpreadsheet,
    title: "CSV & Excel ready",
    description:
      "Upload the files you already work with and let DataLens AI understand their structure automatically.",
  },
  {
    icon: Search,
    title: "Explore deeper",
    description:
      "Move from high-level findings to specific segments, metrics, and patterns with contextual follow-ups.",
  },
  {
    icon: WandSparkles,
    title: "Analysis without the busywork",
    description:
      "Spend less time cleaning, calculating, and formatting—and more time making decisions from your data.",
  },
]; 

function ProductCapabilities () {
    return (
        <section id="features" className="px-6 py-24 lg:px-16">
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div className="max-w-2xl">
                        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                            Product capabilities
                        </p> 

                        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Everything you need to understand your data. 
                        </h2>
                    </div> 

                    <p className="max-w-md text-sm leading-6 text-slate-500">
                        Built around conversation, context, and useful analysis-not endless dashboards.
                    </p>
                </div> 

                <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
                    {
                        capabilities.map((capability) => {
                            const Icon = capability.icon;

                            return (
                                <div
                                key={capability.title}
                                className="bg-white p-7 transition hover:bg-slate-50"
                                > 

                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"> 
                                    <Icon size = {20}/>
                                </div> 

                                <h3 className="mt-6 text-base font-semibold text-slate-900">
                                    {capability.title}
                                </h3> 

                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {capability.description}
                                </p>

                                </div>
                            )
                        })
                    }
                </div>
            </div>
        </section>
    )
} 

export default ProductCapabilities;
import { FileUp , MessageSquareText , Sparkles } from "lucide-react"; 

const steps = [
    {
        number : "01",
        icon : FileUp,
        title : "Upload your data",
        description :  "Drop in a CSV or Excel file. DataLens AI automatically understands its structure and prepares it for analysis.",
    },
    {
        number : "02",
        icon : MessageSquareText,
        title : "Ask questions",
        description : "Ask questions about your data in plain English. No formulas, SQL, or complex dashboards required.",
    },
    {
        number : "03",
        icon : Sparkles,
        title : "Get intelligent answers",
        description : "Receive clear answers, useful visualizations, and AI-generated insights that help you understand what matters.",
    },
];

function HowItWorks () {
    return (
        <section id="how-it-works" className="px-6 py-24 lg:px-16">
            <div className="mx-auto max-w-6xl">
                <div className="max-w-2xl">
                    <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                        How it works 
                    </p> 

                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        From raw data to clear answers.
                    </h2> 

                    <p className="mt-4 text-lg leading-8 text-slate-600">
                        DataLens AI handles the complexity so you can focus on understanding your data.
                    </p>
                </div> 

                <div>
                    {
                        steps.map((step) => {
                            const Icon = step.icon;

                            return (
                                <div
                                key={step.number}
                                className="rounded-2xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50"
                                > 
                                <div className="flex items-center justify-between">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <Icon size={21} />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-300">
                                        {step.number}
                                    </span>
                                </div>

                                <h3 className="mt-7 text-lg font-semibold text-slate-900">
                                    {step.title}
                                </h3>

                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                    {step.description}
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

export default HowItWorks;
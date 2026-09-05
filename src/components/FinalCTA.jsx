import { ArrowRight , Upload } from "lucide-react";

function FinalCTA () {
    return (
        <section className="px-6 py-24 lg:px-16">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-slate-900 px-8 py-16 sm:px-12 lg:px-16">
                <div className="max-w-3xl">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <Upload size={20}/>
                    </div> 

                    <h2 className="mt-7 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Your next insight could be one question away.
                    </h2> 

                    <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                        Upload your dataset, ask a question, and let DataLens AI do the analysis.
                    </p> 

                    <button className="mt-8 flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                        Start analyzing
                        <ArrowRight size={16}/>
                    </button>
                </div>
            </div>
        </section>
    )
} 

export default FinalCTA;
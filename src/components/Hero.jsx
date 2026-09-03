function Hero () {
    return (
        <section className="px-6 pb-20 pt-16 lg:px-16 lg:pt-24">
            <div className="mx-auto max-w-5xl text-center">
                <p className="mb-5 text-sm font-semibold uppercase tracking-wider text-blue-600">
                    AI-powered data analysis
                </p>

                <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                    Your data has answers.
                    <br/>
                    <span className="text-blue-600">Just ask.</span>
                </h1> 

                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                     Upload your CSV or Excel file and let DataLens AI turn your data
                     into clear answers, insights, and visualizations.
                </p> 

                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <button className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                        Analyze your data 
                    </button> 

                    <button className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                        See how it works
                    </button>
                </div>
            </div>
        </section>
    )
}

export default Hero;
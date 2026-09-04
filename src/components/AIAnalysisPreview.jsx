import { BarChart3, Bot, Send, User } from "lucide-react"; 

function AIAnalysisPreview () {
    return (
        <section className="px-6 py-24 lg:px-16">
            <div className="mx-auto max-w-6xl">
                <div className="max-w-2xl">
                    <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                        Ask. Analyze. Understand. 
                    </p> 

                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Have a conversation with your data.
                    </h2> 

                    <p className="mt-4 text-lg leading-8 text-slate-600">
                        DataLens AI turns natural-language questions into analysis,
                        visualizations, and explanations.
                    </p>
                </div>

                <div className="mt-14 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
                    {/* Header */} 
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                Sales Analysis
                            </p> 
                            <p className="text-xs text-slate-400">sales_data.csv</p>
                        </div> 

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Bot size={18}/>
                        </div>
                    </div>

                    {/* Conversation */} 
                    <div className="space-y-6 p-6 lg:p-8">
                        {/* User */} 
                        <div className="ml-auto flex max-w-xl items-start gap-3">
                            <div className="rounded-2xl rounded-tr-md bg-blue-600 px-5 py-3 text-sm leading-6 text-white">
                                Why did revenue decrease in Q3? 
                            </div>

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                <User size={15}/>
                            </div>
                        </div>

                        {/* AI */} 

                         <div className="flex max-w-3xl items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                                <Bot size={15} />
                            </div>

                            <div className="flex-1">
                                <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-slate-50 px-5 py-4">
                                    <p className="text-sm leading-6 text-slate-700">
                                        Revenue fell by <strong>8.4%</strong> in Q3, primarily
                                        driven by lower sales in the West region and a decline in
                                        average order value.
                                    </p>

                                    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-slate-400">
                                                    QUARTERLY REVENUE
                                                </p>
                                                <p className="mt-1 text-lg font-bold text-slate-900">
                                                    $284.6K
                                                </p>
                                            </div>

                                            <BarChart3 size={19} className="text-blue-600" />
                                        </div>

                                        <div className="mt-5 flex h-28 items-end gap-3">
                                            {[82, 96, 110, 94, 78, 88, 104, 92].map(
                                                (height, index) => (
                                                    <div
                                                    key={index}
                                                    className="flex-1 rounded-t-md bg-blue-100"
                                                    style={{ height: `${height}px` }}
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-lg bg-white p-3">
                                            <p className="text-xs text-slate-400">West region</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                -14.2%
                                            </p>
                                        </div>

                                        <div className="rounded-lg bg-white p-3">
                                            <p className="text-xs text-slate-400">
                                                Avg. order value
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                -6.8%
                                            </p>
                                        </div>

                                        <div className="rounded-lg bg-white p-3">
                                            <p className="text-xs text-slate-400">Units sold</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                -2.1%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-3 text-xs text-slate-400">
                                    Based on 12,450 rows across 8 columns
                                </p>
                            </div>
                        </div> 

                        {/* Input */} 

                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <input
                            type = "text"
                            placeholder="Ask a follow-up question..."
                            className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                            /> 

                            <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700">
                                <Send size={16}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
} 

export default AIAnalysisPreview;
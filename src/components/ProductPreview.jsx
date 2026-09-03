import { BarChart3 , MessageSquare , TrendingUp } from "lucide-react"; 

function ProductPreview () {
    return (
        <section className="px-6 pb-24 pt-8 lg:px-16">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
                {/* Window Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-slate-300" />
                        <span className="h-3 w-3 rounded-full bg-slate-300" />
                        <span className="h-3 w-3 rounded-full bg-slate-300" />
                    </div> 

                    <span className="text-sm font-medium text-slate-500">
                        DataLens AI 
                    </span>

                <div className="w-12"/>
                </div> 

                {/* Workspace */}
                <div className="grid min-h-[420px] md:grid-cols-[220px_1fr]">
                    {/* Sidebar */}
                    <aside  className="hidden border-r border-slate-200 bg-slate-50 p-5 md:block">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Dataset
                        </p>

                        <div className="mt-4 rounded-lg border border-blue-100 bg-white p-3">
                            <p className="text-sm font-semibold text-slate-800">
                                sales_data.csv
                            </p> 
                            <p className="mt-1 text-xs text-slate-400">
                                12,450 rows · 8 columns
                            </p>
                        </div> 

                        <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Analysis
                        </p> 

                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                            <div className="rounded-lg bg-blue-50 px-3 py-2 font-medium text-blue-600">
                                Overview
                            </div>
                            <div className="px-3 py-2">Insights</div>
                            <div className="px-3 py-2">Conversations</div>
                        </div>

                    </aside> 

                    {/* Main Content */} 
                    <main className="p-6 lg:p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-400">
                                    SALES ANALYSIS
                                </p>
                                <h3 className="mt-1 text-xl font-semibold text-slate-900">
                                    Revenue Overview
                                </h3>
                            </div>

                            <TrendingUp className="text-blue-600" size = {22}/>
                        </div> 

                    {/* Chart */} 
                    <div className="mt-6 rounded-xl border border-slate-200 p-5">
                        <div  className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Total revenue</p> 
                                <p className="mt-1 text-2xl font-bold text-slate-900">$284,650</p>
                            </div> 

                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">+12.8%</span>

                        </div> 

                        <div className="mt-8 flex h-36 items-end gap-3">
                            {
                                [45, 62, 52, 76, 68, 88, 96, 82, 100, 92, 108, 118].map(
                                    (height,index) => (
                                        <div
                                            key = {index}
                                            className="flex-1 rounded-t-md bg-blue-100"
                                            style={{height : `${height}px`}}
                                        />
                                    )
                                )
                            }
                        </div>
                    </div> 

                    {/* AI Insight */} 
                    <div className="mt-5 flex gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                            <MessageSquare size = {17}/>
                        </div> 

                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                AI Insight
                            </p> 
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                Revenue increased by 12.8%, driven primarily by stronger
                                sales in the West region and higher-value orders.
                            </p>
                        </div>
                    </div> 

                    {/* Question */} 

                    <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <BarChart3 size={18} className="text-slate-400"/> 
                        <span className="text-sm text-slate-400">
                            Ask anything about your data... 
                        </span>
                    </div>

                    </main>

                </div>

            </div>
        </section>
    )
} 

export default ProductPreview;
import {
  BarChart3,
  Bot,
  Database,
  FileSpreadsheet,
  Lightbulb,
  Send,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";

function ProductPreview() {
  const categories = [
    { name: "Technology", margin: "38.4%", width: "95%", profit: "$148.2K", highlight: true },
    { name: "Office Supplies", margin: "26.1%", width: "65%", profit: "$92.4K", highlight: false },
    { name: "Electronics", margin: "22.8%", width: "57%", profit: "$78.1K", highlight: false },
    { name: "Furniture", margin: "19.2%", width: "48%", profit: "$54.6K", highlight: false },
  ];

  return (
    <section className="px-6 pb-20 pt-2 lg:px-16 lg:pb-28">
      <div className="relative mx-auto max-w-6xl">
        {/* Glow behind frame */}
        <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-b from-blue-100/60 to-transparent blur-2xl" />

        {/* Browser window */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 ring-1 ring-slate-900/5">
          {/* Window Chrome Header */}
          <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-slate-300 transition-colors hover:bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-slate-300 transition-colors hover:bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-slate-300 transition-colors hover:bg-emerald-400" />
            </div>

            {/* URL / status pill */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3.5 py-1 text-xs text-slate-500 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-mono text-[11px] text-slate-600">datalens.ai/app/datasets/q4_enterprise_sales.csv</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-600">
              <Database size={13} />
              <span className="hidden sm:inline">PostgreSQL Synced</span>
            </div>
          </div>

          {/* Main App Workspace */}
          <div className="grid lg:grid-cols-[300px_1fr]">
            {/* Left Column: Dataset Sidebar */}
            <aside className="hidden border-r border-slate-200 bg-slate-50/50 p-5 lg:block">
              {/* Dataset Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-900">
                      q4_enterprise_sales.csv
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      24,500 rows · 12 columns
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-[11px]">
                  <div>
                    <span className="text-slate-400">Quality</span>
                    <p className="font-semibold text-emerald-600">99 / 100</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Null Cells</span>
                    <p className="font-semibold text-slate-700">0.0%</p>
                  </div>
                </div>
              </div>

              {/* Suggested Questions */}
              <div className="mt-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Analysis Ideas
                </p>
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="rounded-lg bg-white border border-slate-200/80 px-3 py-2 text-slate-700 font-medium">
                    🏆 Profit margin by category
                  </div>
                  <div className="rounded-lg px-3 py-2 hover:bg-white hover:text-slate-900 transition">
                    📈 Monthly revenue trend
                  </div>
                  <div className="rounded-lg px-3 py-2 hover:bg-white hover:text-slate-900 transition">
                    🤖 Predict churn risk with XGBoost
                  </div>
                  <div className="rounded-lg px-3 py-2 hover:bg-white hover:text-slate-900 transition">
                    🔍 Missing values breakdown
                  </div>
                </div>
              </div>
            </aside>

            {/* Right Column: Active Conversation & Visuals */}
            <main className="flex flex-col p-5 sm:p-7">
              {/* Chat Thread */}
              <div className="space-y-4">
                {/* User Message */}
                <div className="flex justify-end gap-2.5">
                  <div className="max-w-lg rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-medium text-white shadow-xs">
                    Which product category drove our highest profit margin in Q4?
                  </div>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                    <User size={13} />
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Sparkles size={13} />
                  </div>

                  <div className="max-w-xl rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs leading-relaxed text-slate-700 shadow-2xs">
                    <p>
                      Calculated <strong>Profit Margin by Category</strong> across 24,500 records.
                      <strong> Technology</strong> delivered the highest profit margin at <strong>38.4%</strong>, outperforming Furniture by +19.2%.
                    </p>

                    {/* Stat Cards */}
                    <div className="mt-3.5 grid grid-cols-3 gap-2.5">
                      <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Top Category</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">Technology</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Avg Margin</p>
                        <p className="mt-1 text-sm font-bold text-emerald-600">38.4%</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Total Profit</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">$148,200</p>
                      </div>
                    </div>

                    {/* Chart Visualization */}
                    <div className="mt-3.5 rounded-xl border border-slate-200 bg-white p-3.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                        <span>Profit Margin Breakdown</span>
                        <span className="text-[10px] text-slate-400 font-normal">Deterministic Pandas Calculation</span>
                      </div>

                      <div className="mt-3 space-y-2.5">
                        {categories.map((cat) => (
                          <div key={cat.name}>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className={cat.highlight ? "font-semibold text-slate-900" : "text-slate-600"}>
                                {cat.name}
                              </span>
                              <span className={cat.highlight ? "font-bold text-blue-600" : "font-medium text-slate-600"}>
                                {cat.margin} ({cat.profit})
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  cat.highlight ? "bg-blue-600" : "bg-blue-300"
                                }`}
                                style={{ width: cat.width }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Follow-up suggestions */}
                    <div className="mt-3.5 border-t border-slate-200/60 pt-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1.5">
                        <Lightbulb size={12} className="text-amber-500" />
                        <span>Suggested follow-ups:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600 hover:border-blue-300 hover:text-blue-600 cursor-pointer transition">
                          Predict next quarter with XGBoost
                        </span>
                        <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600 hover:border-blue-300 hover:text-blue-600 cursor-pointer transition">
                          Show SHAP feature importance
                        </span>
                        <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600 hover:border-blue-300 hover:text-blue-600 cursor-pointer transition">
                          Break down by sub-region
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs">
                <input
                  type="text"
                  readOnly
                  value="What factors most influenced sales in Technology?"
                  className="flex-1 bg-transparent text-xs text-slate-700 outline-none"
                />
                <button
                  aria-label="Send query"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white"
                >
                  <Send size={13} />
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductPreview;
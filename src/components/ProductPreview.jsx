import {
  BarChart3,
  MessageSquare,
  MoreHorizontal,
  TrendingUp,
} from "lucide-react";

function ProductPreview() {
  return (
    <section className="px-6 pb-20 pt-4 lg:px-16 lg:pb-24">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
        {/* App Header */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          </div>

          <div className="text-xs font-medium text-slate-400">
            DataLens AI
          </div>

          <MoreHorizontal size={18} className="text-slate-400" />
        </div>

        <div className="grid min-h-[440px] md:grid-cols-[210px_1fr]">
          {/* Sidebar */}
          <aside className="hidden border-r border-slate-200 bg-slate-50/70 p-5 md:block">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Dataset
            </p>

            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
              <p className="truncate text-sm font-semibold text-slate-800">
                sales_data.csv
              </p>

              <p className="mt-1 text-xs text-slate-400">
                12,450 rows · 8 columns
              </p>
            </div>

            <p className="mt-7 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Workspace
            </p>

            <div className="mt-3 space-y-1 text-sm">
              <div className="rounded-lg bg-blue-50 px-3 py-2 font-medium text-blue-600">
                Overview
              </div>

              <div className="rounded-lg px-3 py-2 text-slate-600">
                Insights
              </div>

              <div className="rounded-lg px-3 py-2 text-slate-600">
                Conversations
              </div>
            </div>
          </aside>

          {/* Main Workspace */}
          <main className="p-5 sm:p-7 lg:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Sales analysis
                </p>

                <h3 className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">
                  Revenue overview
                </h3>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <TrendingUp size={18} />
              </div>
            </div>

            {/* Revenue Card */}
            <div className="mt-6 rounded-xl border border-slate-200 p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-500">Total revenue</p>

                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    $284,650
                  </p>
                </div>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                  +12.8%
                </span>
              </div>

              {/* Chart */}
              <div className="mt-8 flex h-36 items-end gap-2.5 sm:gap-3">
                {[44, 58, 51, 72, 64, 84, 94, 78, 101, 88, 110, 120].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-sm bg-blue-100 transition hover:bg-blue-200"
                      style={{ height: `${height}px` }}
                    />
                  )
                )}
              </div>

              <div className="mt-3 flex justify-between text-[10px] text-slate-400">
                <span>Jan</span>
                <span>Mar</span>
                <span>Jun</span>
                <span>Sep</span>
                <span>Dec</span>
              </div>
            </div>

            {/* AI Insight */}
            <div className="mt-4 flex gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <MessageSquare size={15} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-900">
                  AI Insight
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                  Revenue increased by 12.8%, driven primarily by stronger
                  sales in the West region and higher-value orders.
                </p>
              </div>
            </div>

            {/* Ask Bar */}
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <BarChart3 size={17} className="shrink-0 text-slate-400" />

              <span className="truncate text-xs text-slate-400 sm:text-sm">
                Ask anything about your data...
              </span>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}

export default ProductPreview;
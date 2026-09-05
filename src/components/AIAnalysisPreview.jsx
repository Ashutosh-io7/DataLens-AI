import {
  BarChart3,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";

function AIAnalysisPreview() {
  return (
    <section
      id="ai-analysis"
      className="border-y border-slate-200/80 bg-white px-6 py-24 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Text */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              AI analysis
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Ask a question.
              <br />
              Get an answer you can understand.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              DataLens AI analyzes your data, chooses the right way to present
              the result, and explains what the numbers actually mean.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Understands your question and dataset context",
                "Performs the analysis automatically",
                "Explains the result with useful visualizations",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Sparkles size={11} />
                  </div>

                  <p className="text-sm font-medium text-slate-700">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Preview */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-xl shadow-slate-200/40 sm:p-5">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {/* Question */}
              <div className="border-b border-slate-200 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <MessageSquare size={15} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      You asked
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Which region generated the most revenue this year?
                    </p>
                  </div>
                </div>
              </div>

              {/* Answer */}
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <TrendingUp size={15} />
                  </div>

                  <p className="text-xs font-semibold text-slate-900">
                    DataLens AI
                  </p>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  The <span className="font-semibold text-slate-900">West</span>{" "}
                  region generated the highest revenue this year, contributing
                  <span className="font-semibold text-slate-900"> $96.4K</span>.
                </p>

                {/* Mini Chart */}
                <div className="mt-6 rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={15} className="text-blue-600" />

                    <span className="text-xs font-semibold text-slate-700">
                      Revenue by region
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      ["West", "96.4K", "92%"],
                      ["East", "81.7K", "78%"],
                      ["South", "67.2K", "64%"],
                      ["North", "52.8K", "50%"],
                    ].map(([region, revenue, width]) => (
                      <div key={region}>
                        <div className="mb-1.5 flex justify-between text-[10px]">
                          <span className="font-medium text-slate-500">
                            {region}
                          </span>
                          <span className="font-semibold text-slate-700">
                            ${revenue}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insight */}
                <div className="mt-4 rounded-lg bg-blue-50/70 p-3">
                  <p className="text-xs leading-5 text-slate-600">
                    <span className="font-semibold text-slate-900">
                      Insight:
                    </span>{" "}
                    The West region is outperforming the North by roughly 82%.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AIAnalysisPreview;
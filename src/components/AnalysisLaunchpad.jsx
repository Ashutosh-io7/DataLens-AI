import {
  ArrowRight,
  Database,
  FileSpreadsheet,
  FileUp,
  Sparkles,
  Upload,
} from "lucide-react";

function AnalysisLaunchpad({
  user,
  recentDatasets,
  loadingDatasets,
  savedInsightsCount,
  navigate,
  handleTabChange,
  onOpenUpload,
}) {
  const displayName =
    user?.email?.split("@")[0]?.replace(/[._-]+/g, " ") || "there";

  const firstName = displayName
    .split(" ")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ");

  return (
    <div className="space-y-8">

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.08),transparent_36%)]" />

        <div className="relative grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">

          {/* Left */}
          <div className="flex flex-col justify-center p-7 sm:p-9 lg:p-12">

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
              <Sparkles size={13} />
              AI data workspace
            </div>

            <h2 className="mt-5 max-w-xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Welcome back, {firstName}.
              <span className="mt-1 block text-blue-600">
                What do you want to discover?
              </span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
              Upload a dataset and let DataLens turn rows and
              columns into clear answers, useful visualizations,
              and meaningful insights.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {[
                "Find the biggest trends",
                "Show top categories",
                "Check data quality",
                "What stands out?",
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={onOpenUpload}
                  className="cursor-pointer rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Upload */}
          <div className="border-t border-slate-200 p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
            <div
              onClick={onOpenUpload}
              className="group flex min-h-[290px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/45 px-6 text-center transition hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm transition duration-200 group-hover:scale-105">
                <Upload size={24} />
              </div>

              <h3 className="mt-5 text-base font-semibold text-slate-900">
                Start with your data
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Drop a CSV or Excel file here, or choose one
                from your computer.
              </p>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenUpload();
                }}
                className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <FileUp size={16} />
                Upload dataset
              </button>

              <p className="mt-3 text-[11px] text-slate-400">
                CSV, XLSX supported
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compact signals */}
      <section className="grid gap-3 sm:grid-cols-3">

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Datasets
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {recentDatasets.length}
            </p>
          </div>

          <Database size={18} className="text-slate-400" />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Saved insights
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {savedInsightsCount}
            </p>
          </div>

          <Sparkles size={18} className="text-slate-400" />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Analysis engine
            </p>

            <p className="mt-1 text-lg font-bold text-emerald-600">
              Ready
            </p>
          </div>

          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </div>
      </section>

      {/* Recent datasets */}
      <section>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
              Continue where you left off
            </p>

            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              Recent datasets
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Jump straight back into an analysis.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleTabChange("datasets")}
            className="cursor-pointer text-xs font-semibold text-blue-600 transition hover:text-blue-700"
          >
            View all ({recentDatasets.length}) →
          </button>
        </div>

        {loadingDatasets ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-40 rounded bg-slate-100" />
              <div className="h-12 rounded-xl bg-slate-50" />
              <div className="h-12 rounded-xl bg-slate-50" />
            </div>
          </div>
        ) : recentDatasets.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">

            {recentDatasets.slice(0, 4).map((dataset) => (
              <div
                key={dataset.dataset_id}
                onClick={() =>
                  navigate(
                    `/app/datasets/${dataset.dataset_id}`
                  )
                }
                className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3.5">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                    <FileSpreadsheet size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 transition group-hover:text-blue-700">
                      {dataset.filename}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span>
                        {dataset.rows?.toLocaleString() ?? 0} rows
                      </span>

                      <span>·</span>

                      <span>
                        {dataset.columns ?? 0} columns
                      </span>

                      {dataset.quality_score != null && (
                        <>
                          <span>·</span>

                          <span className="font-medium text-emerald-600">
                            {dataset.quality_score}/100 quality
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <ArrowRight
                  size={16}
                  className="ml-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
                />
              </div>
            ))}

          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
              <FileSpreadsheet size={19} />
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-700">
              Your first analysis starts here.
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Upload a dataset and DataLens will prepare the
              workspace for you.
            </p>
          </div>
        )}

      </section>
    </div>
  );
}

export default AnalysisLaunchpad;
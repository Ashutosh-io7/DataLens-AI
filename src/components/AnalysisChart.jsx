function AnalysisChart({ chart }) {
  if (
    !chart ||
    !Array.isArray(chart.data) ||
    chart.data.length === 0
  ) {
    return null;
  }

  const maxValue = Math.max(
    ...chart.data.map((item) => item.value),
    1
  );

  return (
    <div className="mb-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-800">
          {chart.title}
        </p>

        <p className="mt-1 text-[11px] text-slate-400">
          {chart.value_label} by {chart.category_label}
        </p>
      </div>

      <div className="space-y-3">
        {chart.data.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
              <span className="min-w-0 truncate text-slate-600">
                {item.label}
              </span>

              <span className="shrink-0 font-medium text-slate-700">
                {item.value.toLocaleString()}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnalysisChart;
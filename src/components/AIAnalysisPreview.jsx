import { Bot, BrainCircuit, CheckCircle2, GitBranch, Sparkles, TrendingUp } from "lucide-react";

const chatExchange = [
  {
    sender: "user",
    text: "Predict which customers are at risk of churning and explain the key drivers.",
  },
  {
    sender: "ai",
    avatar: <Bot size={13} />,
    text: (
      <>
        Detected a <strong>classification intent</strong>. Trained an{" "}
        <strong>XGBoost model</strong> on 15,200 records with stratified
        cross-validation. Here are the results:
      </>
    ),
    metrics: [
      { label: "Accuracy", value: "91.4%", color: "text-emerald-600" },
      { label: "AUC-ROC", value: "0.94", color: "text-blue-600" },
      { label: "Churners Found", value: "1,847", color: "text-slate-900" },
    ],
    shap: [
      { label: "Contract Length", pct: 88, bar: "bg-blue-600" },
      { label: "Monthly Charges", pct: 74, bar: "bg-blue-500" },
      { label: "Tenure (months)", pct: 61, bar: "bg-blue-400" },
      { label: "Payment Method", pct: 48, bar: "bg-blue-300" },
    ],
    insight:
      "Customers on month-to-month contracts with high monthly charges are 3.2× more likely to churn. Consider offering annual contract discounts to this segment.",
  },
];

const highlights = [
  {
    icon: TrendingUp,
    title: "Deterministic Analysis",
    description: "Sums, averages, rankings, correlations — always calculated by Pandas, never invented by the LLM.",
  },
  {
    icon: BrainCircuit,
    title: "Automated ML Training",
    description: "XGBoost models are automatically trained, cross-validated, and evaluated when questions call for prediction.",
  },
  {
    icon: GitBranch,
    title: "SHAP Feature Importance",
    description: "Every ML result includes a SHAP chart explaining which features drove the prediction and by how much.",
  },
];

function AIAnalysisPreview() {
  return (
    <section
      id="ai-analysis"
      className="bg-white px-6 py-24 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left: Text */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              AI-Powered Analysis
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Ask anything.
              <br />
              <span className="text-blue-600">Get answers you can trust.</span>
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-500">
              DataLens AI routes every question to the right engine — deterministic
              Pandas for analytics, XGBoost for predictions — then explains results
              with SHAP so you always know <em>why</em>.
            </p>

            <div className="mt-9 space-y-5">
              {highlights.map((h) => {
                const Icon = h.icon;
                return (
                  <div key={h.title} className="flex items-start gap-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{h.title}</p>
                      <p className="mt-0.5 text-sm leading-6 text-slate-500">{h.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: ML Conversation Preview */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-xl shadow-slate-200/40">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {/* Chat header */}
              <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/70 px-4 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Sparkles size={13} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">DataLens AI Analyst</p>
                  <p className="text-[10px] text-slate-400">Natural language · XGBoost · SHAP</p>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-blue-600 px-3.5 py-2 text-xs text-white">
                    Predict which customers are at risk of churning and explain the key drivers.
                  </div>
                </div>

                {/* AI response */}
                <div className="space-y-3">
                  <p className="text-xs leading-6 text-slate-600">
                    Detected a <strong>classification intent.</strong> Trained an{" "}
                    <strong>XGBoost model</strong> on 15,200 records. Results:
                  </p>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Accuracy", value: "91.4%", color: "text-emerald-600" },
                      { label: "AUC-ROC", value: "0.94", color: "text-blue-600" },
                      { label: "At-Risk Customers", value: "1,847", color: "text-slate-900" },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                        <p className="text-[10px] text-slate-400">{m.label}</p>
                        <p className={`mt-0.5 text-sm font-bold ${m.color}`}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* SHAP chart */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <div className="flex items-center gap-2 mb-3">
                      <GitBranch size={13} className="text-violet-600" />
                      <span className="text-[11px] font-semibold text-slate-800">SHAP Feature Importance</span>
                      <span className="ml-auto text-[10px] text-slate-400">XGBoost TreeExplainer</span>
                    </div>
                    {[
                      { label: "Contract Length", pct: 88 },
                      { label: "Monthly Charges", pct: 74 },
                      { label: "Tenure (months)", pct: 61 },
                      { label: "Payment Method", pct: 42 },
                    ].map((row, i) => (
                      <div key={row.label} className="mb-2.5">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-slate-600 font-medium">{row.label}</span>
                          <span className="text-slate-500">{row.pct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500"
                            style={{ width: `${row.pct}%`, opacity: 1 - i * 0.15 + 0.15 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Insight callout */}
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                    <CheckCircle2 size={14} className="shrink-0 text-amber-500 mt-0.5" />
                    <p className="text-[11px] leading-5 text-slate-700">
                      <strong>Insight:</strong> Month-to-month customers with high charges are{" "}
                      <strong>3.2× more likely to churn.</strong> Consider annual contract incentives.
                    </p>
                  </div>
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
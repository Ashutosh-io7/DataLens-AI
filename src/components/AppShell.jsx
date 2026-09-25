import { useEffect, useRef, useState } from "react"; 
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  FileSpreadsheet,
  FileUp,
  Filter,
  HardDrive,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import AppSidebar from "./AppSidebar"; 
import AnalysisChart from "./AnalysisChart";
import { endpoints } from "../api"; 
import { useAuth } from "../context/AuthContext"; 
import { getSavedInsights, saveInsight, removeInsight } from "../utils/insightsStorage";

function renderInsightText(text) {
  if (!text) return null;
  const str = typeof text === "string" ? text : String(text);
  const parts = str.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function AppShell() {
  const fileInputRef = useRef(null); 
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const { user, logout } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false); 
  const [recentDatasets, setRecentDatasets] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true); 
  const [health, setHealth] = useState(null); 
  const [datasetSearch, setDatasetSearch] = useState("");
  const [savedInsights, setSavedInsights] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [insightSearch, setInsightSearch] = useState(""); 
  const [charts, setCharts] = useState([]); 
  const [loadingCharts, setLoadingCharts] = useState(false); 
  const [chartSearch, setChartSearch] = useState("");
  const [chartTypeFilter, setChartTypeFilter] = useState("all");
  const [chartDatasetFilter, setChartDatasetFilter] = useState("all");
  const [savedChartIds, setSavedChartIds] = useState([]);

  useEffect(() => {
    if (activeTab === "charts") {
      setLoadingCharts(true);
      fetch(endpoints.charts)
       .then((res) => res.json())
       .then((data) => setCharts(data.charts || []))
       .catch(() => setCharts([])) 
       .finally(() => setLoadingCharts(false)); 
    }
  }, [activeTab]); 

  useEffect(() => {
    const list = getSavedInsights();
    setSavedInsights(list);
    setSavedChartIds(list.map((item) => item.id));
  }, [activeTab]);

  const handleDeleteInsight = (insightId, e) => {
    e.stopPropagation();
    const updated = removeInsight(insightId);
    setSavedInsights(updated);
  };

  const handleCopyInsight = (insight, e) => {
    e.stopPropagation();
    const content = `${insight.question}\n\n${insight.answer}`;
    navigator.clipboard.writeText(content);
    setCopiedId(insight.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTabChange = (tabKey) => {
    setSearchParams({ tab: tabKey });
  };

  const handleStartAnalyzing = async (fileToUpload) => {
    const file = fileToUpload || selectedFile;
    if (!file) return;

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(endpoints.uploadDataset, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to upload dataset.");
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFile(null);

      navigate(`/app/datasets/${data.dataset_id}`);
    } catch (err) {
      setError(err.message || "Unable to upload dataset.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const validExtensions = [".csv", ".xlsx", ".xls"];
    const extension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(extension)) {
      setError("Please upload a CSV or XLSX file.");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setError("");
    setSelectedFile(file);
    handleStartAnalyzing(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fetchDatasets = async () => {
    try {
      setLoadingDatasets(true);
      const res = await fetch(endpoints.datasets);
      if (res.ok) {
        const data = await res.json();
        setRecentDatasets(data.datasets || []);
      }
    } catch {
      // Keep empty if network issue
    } finally {
      setLoadingDatasets(false);
    }
  };

  useEffect(() => {
    fetchDatasets(); 

    fetch(endpoints.health)
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setHealth({ database: "disconnected", llm_configured: false }));
  }, []);

  const handleDeleteDataset = async (datasetId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this dataset?")) return;

    try {
      const res = await fetch(endpoints.deleteDataset(datasetId), {
        method: "DELETE",
      });
      if (res.ok) {
        setRecentDatasets((prev) => prev.filter((d) => d.dataset_id !== datasetId));
      }
    } catch {
      alert("Failed to delete dataset.");
    }
  };

  const filteredDatasets = recentDatasets.filter((ds) =>
    ds.filename.toLowerCase().includes(datasetSearch.toLowerCase())
  );

  const filteredInsights = (savedInsights || []).filter((item) => {
    if (!item) return false;
    if (!insightSearch.trim()) return true;
    const q = insightSearch.toLowerCase();
    const dsName = String(item.dataset_name || "").toLowerCase();
    const question = String(item.question || "").toLowerCase();
    const answer = String(item.answer || "").toLowerCase();
    return dsName.includes(q) || question.includes(q) || answer.includes(q);
  });

  const handleToggleSaveChart = (c, e) => {
    e.stopPropagation();
    const isAlreadySaved = savedChartIds.includes(c.message_id);
    if (isAlreadySaved) {
      const updated = removeInsight(c.message_id);
      setSavedInsights(updated);
      setSavedChartIds((prev) => prev.filter((id) => id !== c.message_id));
    } else {
      const insight = {
        id: c.message_id,
        dataset_id: c.dataset_id,
        dataset_name: c.dataset_filename,
        question: c.question || "Generated Chart",
        answer: c.answer || "",
        chart: c.chart || null,
        metrics: null,
        analysis_type: c.analysis_type || null,
        saved_at: new Date().toISOString(),
      };
      const updated = saveInsight(insight);
      setSavedInsights(updated);
      setSavedChartIds((prev) => [...prev, c.message_id]);
    }
  };

  const uniqueChartDatasets = Array.from(
    new Set((charts || []).map((c) => c.dataset_filename).filter(Boolean))
  );

  const filteredCharts = (charts || []).filter((c) => {
    if (!c || !c.chart) return false;

    if (chartTypeFilter !== "all") {
      const cType = String(c.chart.type || "").toLowerCase();
      if (chartTypeFilter === "other") {
        if (["bar", "line", "histogram", "scatter", "pie"].includes(cType)) {
          return false;
        }
      } else if (cType !== chartTypeFilter) {
        return false;
      }
    }

    if (chartDatasetFilter !== "all") {
      if (c.dataset_filename !== chartDatasetFilter) {
        return false;
      }
    }

    if (chartSearch.trim()) {
      const q = chartSearch.toLowerCase();
      const ds = String(c.dataset_filename || "").toLowerCase();
      const quest = String(c.question || "").toLowerCase();
      const title = String(c.chart.title || "").toLowerCase();
      const ans = String(c.answer || "").toLowerCase();
      if (
        !ds.includes(q) &&
        !quest.includes(q) &&
        !title.includes(q) &&
        !ans.includes(q)
      ) {
        return false;
      }
    }

    return true;
  });

  const getChartTypeBadge = (type) => {
    const t = String(type || "").toLowerCase();
    switch (t) {
      case "bar":
        return { label: "Bar Chart", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "line":
        return { label: "Line Chart", bg: "bg-violet-50 text-violet-700 border-violet-200" };
      case "histogram":
        return { label: "Histogram", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "scatter":
        return { label: "Scatter Plot", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "pie":
        return { label: "Pie Chart", bg: "bg-pink-50 text-pink-700 border-pink-200" };
      default:
        return { label: t ? `${t.charAt(0).toUpperCase() + t.slice(1)}` : "Chart", bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div>
            <p className="text-xs font-medium text-slate-400 capitalize">{activeTab}</p>
            <h1 className="text-sm font-semibold text-slate-900">
              {activeTab === "overview" && "Workspace Overview"}
              {activeTab === "datasets" && "Dataset Management"}
              {activeTab === "conversations" && "Conversations & Sessions"}
              {activeTab === "charts" && "Charts"}
              {activeTab === "insights" && "Saved Insights"}
              {activeTab === "settings" && "System Settings"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
            >
              <Plus size={16} />
              New dataset
            </button>

            <div className="h-5 w-px bg-slate-200 mx-0.5" />

            {user?.email && (
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                <User size={14} className="text-blue-600" />
                <span className="max-w-40 truncate">{user.email}</span>
              </div>
            )}

            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Global Uploading Modal Overlay */}
        {uploading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center border border-slate-100">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
                <Upload size={26} className="animate-bounce" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                Uploading & Profiling Dataset
              </h3>
              <p className="mt-1 text-xs text-slate-500 font-medium truncate px-4">
                {selectedFile?.name || "Processing your file..."}
              </p>
              <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 px-3 text-xs font-semibold text-blue-600 border border-slate-100">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span>Computing schema, stats & quality score...</span>
              </div>
            </div>
          </div>
        )}

        {/* Global Upload Error Modal */}
        {error && !uploading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center border border-red-100">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <X size={22} />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Upload Failed</h3>
              <p className="mt-2 text-xs text-slate-600 px-2 leading-relaxed">{error}</p>
              <button
                onClick={() => setError("")}
                className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div>
                <div>
                  <p className="text-sm font-medium text-blue-600">Overview</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    Explore your data.
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Upload a dataset and start discovering insights with AI.
                  </p>
                </div>

                {/* Upload Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-8 cursor-pointer rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-8 text-center transition hover:border-blue-300 hover:bg-blue-50"
                >
                  {selectedFile ? (
                    <>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                        <FileSpreadsheet size={21} />
                      </div>
                      <h3 className="mt-5 text-base font-semibold text-slate-900">
                        Dataset selected
                      </h3>
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {selectedFile.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          removeFile();
                        }}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <X size={15} />
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                        <Upload size={21} />
                      </div>
                      <h3 className="mt-5 text-base font-semibold text-slate-900">
                        Upload your dataset
                      </h3>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                        Upload a CSV or Excel file and DataLens AI will prepare it for analysis.
                      </p>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <FileUp size={16} />
                        Choose file
                      </button>
                      <p className="mt-3 text-xs text-slate-400">
                        CSV, XLSX supported
                      </p>
                    </>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
                )}

                {/* Upload Action Card if a file is currently selected */}
                {selectedFile && (
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <FileSpreadsheet size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedFile.name}
                        </p>
                        <p className="mt-1 text-xs text-blue-600 font-medium">
                          Ready to process into PostgreSQL
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleStartAnalyzing} 
                      disabled={uploading} 
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    >
                      {uploading ? "Processing..." : "Start analyzing"}
                    </button>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500">Datasets</p>
                      <Database size={17} className="text-slate-400" />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-slate-900">
                      {recentDatasets.length}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {recentDatasets.length === 1 ? "1 saved dataset" : `${recentDatasets.length} saved datasets`}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500">Storage Engine</p>
                      <BarChart3 size={17} className="text-slate-400" />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-slate-900">PostgreSQL</p>
                    <p className={`mt-1 text-xs ${health?.database === "connected" ? "text-emerald-500 font-medium" : "text-amber-500 font-medium"}`}>
                      {health === null
                        ? "Checking status..."
                        : health.database === "connected"
                        ? "Connected & sync ready"
                        : "Disconnected — using local file storage"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500">Analysis Engine</p>
                      <FileSpreadsheet size={17} className="text-slate-400" />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-slate-900">Active</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Deterministic Pandas + XGBoost ML
                    </p>
                  </div>
                </div>

                {/* Recent datasets preview */}
                <section className="mt-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Recent datasets
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Quick access to your most recently uploaded datasets.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleTabChange("datasets")}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        View all ({recentDatasets.length}) →
                      </button>
                    </div>
                  </div>

                  {loadingDatasets ? (
                    <div className="mt-4 flex min-h-32 items-center justify-center rounded-xl border border-slate-200 bg-white">
                      <p className="text-xs text-slate-400">Loading datasets...</p>
                    </div>
                  ) : recentDatasets.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {recentDatasets.slice(0, 4).map((ds) => (
                        <div
                          key={ds.dataset_id}
                          onClick={() => navigate(`/app/datasets/${ds.dataset_id}`)}
                          className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-xs"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                              <FileSpreadsheet size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition">
                                {ds.filename}
                              </p>
                              <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                                <span>{ds.rows?.toLocaleString() ?? 0} rows</span>
                                <span>•</span>
                                <span>{ds.columns ?? 0} columns</span>
                                {ds.quality_score !== null && ds.quality_score !== undefined && (
                                  <>
                                    <span>•</span>
                                    <span className="font-medium text-emerald-600">Score: {ds.quality_score}/100</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleDeleteDataset(ds.dataset_id, e)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
                              title="Delete dataset"
                            >
                              <Trash2 size={16} />
                            </button>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                              <ArrowRight size={16} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 flex min-h-36 items-center justify-center rounded-xl border border-slate-200 bg-white">
                      <p className="text-xs text-slate-400">No datasets uploaded yet.</p>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* TAB 2: DATASETS MANAGEMENT */}
            {activeTab === "datasets" && (
              <div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Datasets</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                      Dataset Management
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Inspect, search, and manage all your uploaded CSV and Excel files.
                    </p>
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 cursor-pointer"
                  >
                    <Plus size={15} />
                    Upload Dataset
                  </button>
                </div>

                {/* Search Bar */}
                <div className="mt-6 flex items-center gap-3">
                  <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Search size={16} />
                    </div>
                    <input
                      type="text"
                      value={datasetSearch}
                      onChange={(e) => setDatasetSearch(e.target.value)}
                      placeholder="Search datasets by filename..."
                      className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  {recentDatasets.length > 0 && (
                    <button
                      onClick={fetchDatasets}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Refresh
                    </button>
                  )}
                </div>

                {/* Datasets List */}
                {loadingDatasets ? (
                  <div className="mt-6 flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <p className="text-xs text-slate-400">Loading datasets...</p>
                  </div>
                ) : filteredDatasets.length > 0 ? (
                  <div className="mt-6 grid gap-4">
                    {filteredDatasets.map((ds) => (
                      <div
                        key={ds.dataset_id}
                        className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-200 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <FileSpreadsheet size={20} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              {ds.filename}
                            </h3>
                            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span><strong>{ds.rows?.toLocaleString() ?? 0}</strong> rows</span>
                              <span>•</span>
                              <span><strong>{ds.columns ?? 0}</strong> columns</span>
                              {ds.quality_score !== null && ds.quality_score !== undefined && (
                                <>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 text-[11px]">
                                    <Sparkles size={11} /> Quality: {ds.quality_score}/100
                                  </span>
                                </>
                              )}
                              {ds.created_at && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-400">
                                    Uploaded {new Date(ds.created_at).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => navigate(`/app/datasets/${ds.dataset_id}`)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700 cursor-pointer"
                          >
                            <span>Open Analysis</span>
                            <ArrowRight size={13} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteDataset(ds.dataset_id, e)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition cursor-pointer"
                            title="Delete dataset"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
                    <div>
                      <Database size={24} className="mx-auto text-slate-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-700">No matching datasets</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {datasetSearch ? "Try adjusting your search query." : "Upload your first CSV or Excel file to get started."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CONVERSATIONS */}
            {activeTab === "conversations" && (
              <div>
                <div>
                  <p className="text-sm font-medium text-blue-600">Conversations</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    Active Analysis Sessions
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Jump right back into any natural language analysis or machine learning conversation.
                  </p>
                </div>

                {loadingDatasets ? (
                  <div className="mt-6 flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <p className="text-xs text-slate-400">Loading conversation threads...</p>
                  </div>
                ) : recentDatasets.length > 0 ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {recentDatasets.map((ds) => (
                      <div
                        key={ds.dataset_id}
                        className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:border-blue-200"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <MessageSquare size={17} />
                            </div>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              {ds.rows?.toLocaleString() ?? 0} rows
                            </span>
                          </div>

                          <h3 className="mt-4 text-sm font-bold text-slate-900">
                            {ds.filename}
                          </h3>
                          <p className="mt-1 text-xs text-slate-400">
                            Persistent conversation synced in PostgreSQL
                          </p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            {ds.created_at ? new Date(ds.created_at).toLocaleDateString() : "Ready"}
                          </span>
                          <button
                            onClick={() => navigate(`/app/datasets/${ds.dataset_id}`)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            <span>Resume Chat</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
                    <div>
                      <MessageSquare size={24} className="mx-auto text-slate-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-700">No active conversations yet</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Upload a dataset and ask your first question to start a persistent session.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: SAVED INSIGHTS */}
            {activeTab === "insights" && (
              <div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-blue-600">Saved Insights</p>
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-100">
                        {savedInsights.length} saved
                      </span>
                    </div>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                      Your Key Discoveries
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Pinned analytical findings, charts, and machine learning explainability cards.
                    </p>
                  </div>
                </div>

                {/* Search Bar if we have insights */}
                {savedInsights.length > 0 && (
                  <div className="mt-6 flex items-center gap-3">
                    <div className="relative flex-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Search size={16} />
                      </div>
                      <input
                        type="text"
                        value={insightSearch}
                        onChange={(e) => setInsightSearch(e.target.value)}
                        placeholder="Search saved insights by question, finding, or dataset..."
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                )}

                {filteredInsights.length > 0 ? (
                  <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    {filteredInsights.map((insight) => (
                      <div
                        key={insight.id}
                        className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-200"
                      >
                        <div>
                          {/* Card Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <FileSpreadsheet size={15} />
                              </div>
                              <span className="text-xs font-semibold text-slate-800">
                                {insight.dataset_name || "Dataset"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400">
                                {insight.saved_at ? new Date(insight.saved_at).toLocaleDateString() : ""}
                              </span>
                              <button
                                onClick={(e) => handleDeleteInsight(insight.id, e)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
                                title="Remove saved insight"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Question */}
                          <div className="mt-3.5 rounded-xl bg-slate-50 p-3 text-xs">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Question Asked
                            </p>
                            <p className="mt-0.5 font-medium text-slate-800">
                              "{insight.question}"
                            </p>
                          </div>

                          {/* Answer / Finding */}
                          <div className="mt-3 text-xs leading-5 text-slate-700 whitespace-pre-line">
                            {renderInsightText(insight.answer)}
                          </div>

                          {/* Embedded Chart if present */}
                          {insight.chart && Array.isArray(insight.chart.data) && insight.chart.data.length > 0 && (
                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                              <AnalysisChart chart={insight.chart} />
                            </div>
                          )}

                          {/* Metrics if ML */}
                          {insight.metrics && (
                            <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                              {insight.metrics.accuracy && (
                                <span className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                                  Accuracy: {insight.metrics.accuracy}%
                                </span>
                              )}
                              {insight.metrics.f1_score && (
                                <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                                  F1: {insight.metrics.f1_score}
                                </span>
                              )}
                              {insight.metrics.r2_score && (
                                <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">
                                  R²: {insight.metrics.r2_score}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <button
                            onClick={(e) => handleCopyInsight(insight, e)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition cursor-pointer"
                          >
                            {copiedId === insight.id ? (
                              <>
                                <Check size={13} className="text-emerald-600" />
                                <span className="text-emerald-600 font-semibold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copy Finding</span>
                              </>
                            )}
                          </button>

                          {insight.dataset_id && (
                            <button
                              onClick={() => navigate(`/app/datasets/${insight.dataset_id}`)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
                            >
                              <span>Open in Chat</span>
                              <ExternalLink size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
                    <div>
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Bookmark size={22} />
                      </div>
                      <h3 className="mt-4 text-sm font-bold text-slate-900">
                        {insightSearch ? "No matching insights found" : "No saved insights yet"}
                      </h3>
                      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                        {insightSearch
                          ? "Try a different search query."
                          : "While analyzing your data in the workspace, click the 'Save insight' button on any AI answer to bookmark it here."}
                      </p>
                      {!insightSearch && (
                        <button
                          onClick={() => handleTabChange("datasets")}
                          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
                        >
                          <Database size={14} />
                          <span>Explore your datasets</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )} 

            {/* TAB: CHARTS */}
            {activeTab === "charts" && (
              <div>
                {/* Header & Stats */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Visualizations</p>
                    <div className="mt-1 flex items-center gap-3">
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                        Charts
                      </h2>
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 border border-blue-200">
                        {filteredCharts.length} {filteredCharts.length === 1 ? "visualization" : "visualizations"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Every chart generated across your datasets, organized with instant filtering, search, and one-click bookmarking.
                    </p>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
                  {/* Chart Type Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { key: "all", label: "All Types" },
                      { key: "bar", label: "Bar" },
                      { key: "line", label: "Line" },
                      { key: "histogram", label: "Histogram" },
                      { key: "scatter", label: "Scatter" },
                      { key: "pie", label: "Pie" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setChartTypeFilter(tab.key)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                          chartTypeFilter === tab.key
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Dataset Dropdown & Search Bar */}
                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    {uniqueChartDatasets.length > 0 && (
                      <div className="relative w-full sm:w-auto">
                        <select
                          value={chartDatasetFilter}
                          onChange={(e) => setChartDatasetFilter(e.target.value)}
                          className="w-full sm:w-44 rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="all">All datasets ({uniqueChartDatasets.length})</option>
                          {uniqueChartDatasets.map((ds) => (
                            <option key={ds} value={ds}>
                              {ds}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="relative w-full sm:w-60">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        placeholder="Search charts, prompts..."
                        value={chartSearch}
                        onChange={(e) => setChartSearch(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-7 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                      />
                      {chartSearch && (
                        <button
                          onClick={() => setChartSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                {loadingCharts ? (
                  <div className="mt-6 flex min-h-60 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    <p className="mt-3 text-xs font-medium text-slate-500">Loading visualizations...</p>
                  </div>
                ) : filteredCharts.length > 0 ? (
                  <div className="mt-6 grid gap-6 xl:grid-cols-2">
                    {filteredCharts.map((c) => {
                      const typeBadge = getChartTypeBadge(c.chart?.type);
                      const isSaved = savedChartIds.includes(c.message_id);

                      return (
                        <div
                          key={c.message_id}
                          className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-300 hover:shadow-md"
                        >
                          <div>
                            {/* Card Top Meta */}
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                  <Database size={14} />
                                </div>
                                <span className="truncate text-xs font-semibold text-slate-700" title={c.dataset_filename}>
                                  {c.dataset_filename}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${typeBadge.bg}`}>
                                  {typeBadge.label}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}
                                </span>
                              </div>
                            </div>

                            {/* Analysis Question / Prompt */}
                            {c.question && (
                              <div className="mt-3.5 rounded-xl bg-slate-50 p-3 border border-slate-100">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                  Analysis Prompt
                                </p>
                                <p className="mt-1 text-xs font-medium text-slate-800 line-clamp-2">
                                  {renderInsightText(c.question)}
                                </p>
                              </div>
                            )}

                            {/* Interactive Recharts Chart Component */}
                            <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                              <AnalysisChart chart={c.chart} />
                            </div>

                            {/* AI Answer Summary Snippet */}
                            {c.answer && (
                              <p className="mt-3 line-clamp-2 text-xs text-slate-600">
                                {renderInsightText(c.answer)}
                              </p>
                            )}
                          </div>

                          {/* Card Actions Footer */}
                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                            <button
                              onClick={(e) => handleToggleSaveChart(c, e)}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                                isSaved
                                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                              }`}
                            >
                              <Bookmark size={13} className={isSaved ? "fill-amber-500 text-amber-500" : ""} />
                              <span>{isSaved ? "Saved in Insights" : "Save to Insights"}</span>
                            </button>

                            <button
                              onClick={() => navigate(`/app/datasets/${c.dataset_id}`)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                            >
                              <span>Explore in Workspace</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-xs">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <BarChart3 size={24} />
                    </div>
                    {chartSearch || chartTypeFilter !== "all" || chartDatasetFilter !== "all" ? (
                      <>
                        <p className="mt-3 text-sm font-semibold text-slate-800">No matching charts found</p>
                        <p className="mt-1 max-w-sm text-xs text-slate-500">
                          Try changing your chart type filter, dataset selection, or search query.
                        </p>
                        <button
                          onClick={() => {
                            setChartSearch("");
                            setChartTypeFilter("all");
                            setChartDatasetFilter("all");
                          }}
                          className="mt-4 rounded-lg bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="mt-3 text-sm font-semibold text-slate-800">No charts generated yet</p>
                        <p className="mt-1 max-w-sm text-xs text-slate-500">
                          Ask the AI Analyst questions that generate trends, distributions, or comparisons in the workspace. They will automatically appear here.
                        </p>
                        <button
                          onClick={() => handleTabChange("datasets")}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
                        >
                          <Database size={13} />
                          <span>Explore datasets</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SETTINGS */}
            {activeTab === "settings" && (
              <div>
                <div>
                  <p className="text-sm font-medium text-blue-600">Configuration</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    System & Account Settings
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Inspect your environment status, database connection, and AI reasoning engine.
                  </p>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {/* Account Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <User size={19} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">User Account</h3>
                        <p className="text-xs text-slate-400">Authenticated Session</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-xs border-t border-slate-100 pt-4">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Email:</span>
                        <span className="font-semibold text-slate-800">{user?.email || "Guest"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Session Status:</span>
                        <span className="font-semibold text-emerald-600">Active (JWT Bearer)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Password Hashing:</span>
                        <span className="font-semibold text-slate-800">bcrypt (12 rounds)</span>
                      </div>
                    </div>
                  </div>

                  {/* Database Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Database size={19} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">PostgreSQL Database</h3>
                        <p className="text-xs text-slate-400">SQLAlchemy ORM</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-xs border-t border-slate-100 pt-4">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Connection Status:</span>
                        <span className={`font-semibold ${health?.database === "connected" ? "text-emerald-600" : "text-amber-600"}`}>
                          {health?.database === "connected" ? "Connected" : "Disconnected (Local Fallback)"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Database Name:</span>
                        <span className="font-semibold text-slate-800">datalens_ai</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Active Tables:</span>
                        <span className="font-semibold text-slate-800">users, datasets, conversations, messages</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Planner Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Cpu size={19} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">AI Query Planner</h3>
                        <p className="text-xs text-slate-400">LangChain Structured Output</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-xs border-t border-slate-100 pt-4">
                      <div className="flex justify-between">
                        <span className="text-slate-500">LLM Model:</span>
                        <span className="font-semibold text-slate-800">{health?.llm_model || "gemini-3.6-flash"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">API Key Configured:</span>
                        <span className={`font-semibold ${health?.llm_configured ? "text-emerald-600" : "text-amber-600"}`}>
                          {health?.llm_configured ? "Configured" : "Missing (Using Rule-based Fallback)"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hard Timeout Safety:</span>
                        <span className="font-semibold text-slate-800">20s ThreadPoolExecutor deadline</span>
                      </div>
                    </div>
                  </div>

                  {/* ML & Analysis Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                        <ShieldCheck size={19} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Deterministic Analytics</h3>
                        <p className="text-xs text-slate-400">Zero Hallucination Pipeline</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 text-xs border-t border-slate-100 pt-4">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Math Execution:</span>
                        <span className="font-semibold text-emerald-600">Deterministic Pandas</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">ML Engine:</span>
                        <span className="font-semibold text-slate-800">XGBoost Classifier & Regressor</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Explainability:</span>
                        <span className="font-semibold text-slate-800">SHAP TreeExplainer</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
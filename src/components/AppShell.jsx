import { useEffect, useRef, useState } from "react"; 
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Database,
  FileSpreadsheet,
  FileUp,
  LogOut,
  Plus,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import AppSidebar from "./AppSidebar"; 
import { endpoints } from "../api"; 
import { useAuth } from "../context/AuthContext"; 

function AppShell() {
  const fileInputRef = useRef(null); 
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false); 
  const [recentDatasets, setRecentDatasets] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true); 
  const [health, setHealth] = useState(null); 

  const handleFileSelect = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const validExtensions = [".csv", ".xlsx"];
    const extension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(extension)) {
      setError("Please upload a CSV or XLSX file.");
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }; 

  const handleStartAnalyzing = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        endpoints.uploadDataset,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Unable to upload dataset."
        );
      }

      sessionStorage.setItem(
        "datalens_dataset",
        JSON.stringify(result)
      );

      navigate(`/app/datasets/${result.dataset_id}`);
    } catch (err) {
      setError(
        err.message || "Unable to upload dataset."
      );
    } finally {
      setUploading(false);
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
    } catch (err) {
      alert("Failed to delete dataset.");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div>
            <p className="text-xs font-medium text-slate-400">Workspace</p>
            <h1 className="text-sm font-semibold text-slate-900">
              Data Analysis
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
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
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Dashboard */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {/* Heading */}
            <div>
              <p className="text-sm font-medium text-blue-600">Overview</p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Explore your data.
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Upload a dataset and start discovering insights with AI.
              </p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload */}
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
                    Upload a CSV or Excel file and DataLens AI will prepare it
                    for analysis.
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
              <p className="mt-3 text-sm font-medium text-red-500">
                {error}
              </p>
            )}

            {/* Quick Stats */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">
                    Datasets
                  </p>
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
                  <p className="text-xs font-medium text-slate-500">
                    Storage Engine
                  </p>
                  <BarChart3 size={17} className="text-slate-400" />
                </div>

                <p className="mt-3 text-2xl font-bold text-slate-900">PostgreSQL</p>

                <p className={`mt-1 text-xs ${health?.database === "connected" ? "text-emerald-500" : "text-amber-500"}`}>
                  {health === null
                    ? "Checking status..."
                    : health.database === "connected"
                    ? "Connected & sync ready"
                    : "Disconnected — using local file storage"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">
                    Analysis Engine
                  </p>
                  <FileSpreadsheet
                    size={17}
                    className="text-slate-400"
                  />
                </div>

                <p className="mt-3 text-2xl font-bold text-slate-900">Active</p>

                <p className="mt-1 text-xs text-slate-400">
                  Deterministic Pandas + Heuristics
                </p>
              </div>
            </div>

            {/* Recent datasets */}
            <section className="mt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Recent datasets
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Your saved datasets in PostgreSQL and local storage.
                  </p>
                </div>

                {recentDatasets.length > 0 && (
                  <button
                    onClick={fetchDatasets}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Refresh
                  </button>
                )}
              </div>

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
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploading ? "Processing..." : "Start analyzing"}
                  </button>
                </div>
              )}

              {/* Saved Datasets list */}
              {loadingDatasets ? (
                <div className="mt-4 flex min-h-32 items-center justify-center rounded-xl border border-slate-200 bg-white">
                  <p className="text-xs text-slate-400">Loading datasets...</p>
                </div>
              ) : recentDatasets.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {recentDatasets.map((ds) => (
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
                            {ds.created_at && (
                              <>
                                <span>•</span>
                                <span>{new Date(ds.created_at).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDeleteDataset(ds.dataset_id, e)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
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
                <div className="mt-4 flex min-h-40 items-center justify-center rounded-xl border border-slate-200 bg-white">
                  <div className="text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                      <Database size={18} />
                    </div>

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      No datasets yet
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Upload your first dataset above to get started.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
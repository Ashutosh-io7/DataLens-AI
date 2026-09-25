import { useEffect, useRef, useState } from "react"; 
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Database,
  Info,
  Lightbulb,
  MessageSquare,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Table2,
  User,
} from "lucide-react"; 
import AnalysisChart from "./AnalysisChart"; 
import AppSidebar from "./AppSidebar";
import { endpoints } from "../api"; 

// Turns "**bold**" segments into real bold text for chat messages
function renderFormattedText(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function DatasetWorkspace() {
  const [fileName, setFileName] = useState("Dataset");
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [totalRows, setTotalRows] = useState(0);  
  const [profile, setProfile] = useState(null); 
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { id } = useParams(); 
  const navigate = useNavigate();

  // Conversational state
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      text: "Hello! I am your DataLens AI analyst. Your dataset is loaded and ready. Ask me any question, explore distributions, check missing values, or uncover trends.",
      suggestedFollowUps: [
        "How many rows and columns?",
        "Show missing values breakdown",
        "Are there any duplicate rows?",
      ],
    },
  ]);
  const [question, setQuestion] = useState(""); 
  const [asking, setAsking] = useState(false); 
  const [conversationContext, setConversationContext] = useState({});
  const chatBottomRef = useRef(null);

  // Interactive dataset explorer state
  const [explorerTab, setExplorerTab] = useState("grid"); // "grid" | "schema"
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Filter and paginate data
  const filteredData = data.filter((row) => {
    if (!tableSearch.trim()) return true;
    const query = tableSearch.toLowerCase();
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(query)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = filteredData.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  useEffect(() => {
    const loadDataset = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(endpoints.getDataset(id));
        const dataset = await response.json();

        if (!response.ok) {
          throw new Error(dataset.detail || "Unable to load dataset.");
        }

        setFileName(dataset.filename);
        setData(dataset.preview || []);
        setColumns(dataset.column_names || []);
        setTotalRows(dataset.rows || 0);
        setProfile(dataset.profile || null);

        // Fetch persisted conversation history from PostgreSQL
        try {
          const convRes = await fetch(endpoints.getConversation(id));
          if (convRes.ok) {
            const convData = await convRes.json();
            if (convData.messages && convData.messages.length > 0) {
              setMessages(convData.messages);
            }
          }
        } catch {
          // If conversation endpoint is unavailable, preserve default welcome
        }
      } catch (err) {
        setError(err.message || "Unable to load dataset.");
      } finally {
        setLoading(false);
      }
    };

    loadDataset();
  }, [id]); 

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to reset this conversation history?")) return;
    try {
      await fetch(endpoints.clearConversation(id), { method: "DELETE" });
    } catch {
      // offline/file storage tolerance
    }
    setMessages([
      {
        id: "welcome",
        sender: "ai",
        text: "Hello! I am your DataLens AI analyst. Your dataset is loaded and ready. Ask me any question, explore distributions, check missing values, or uncover trends.",
        suggestedFollowUps: [
          "How many rows and columns?",
          "Show missing values breakdown",
          "Are there any duplicate rows?",
        ],
      },
    ]);
    setConversationContext({});
  };

  const handleAskQuestion = async (queryText = null) => {
    const textToSend = (queryText || question).trim();
    if (!textToSend || asking) return;

    // Add user message to thread
    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setAsking(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s safety net

    try {
      const response = await fetch(endpoints.queryDataset(id), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: textToSend,
          context: conversationContext,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Unable to analyze your question.");
      }

      // Track context for follow-up questions
      if (result.plan) {
        setConversationContext((prev) => ({
          ...prev,
          target_column: result.plan.target_column || prev.target_column,
          group_column: result.plan.group_column || prev.group_column,
          intent: result.plan.intent,
        }));
      }

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: result.answer,
        chart: result.chart || null,
        explanation: result.explanation || null,
        suggestedFollowUps: result.suggested_follow_ups || [],
        metrics: result.metrics || null,
        analysisType: result.analysis_type || null,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === "AbortError";
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: isTimeout
          ? "That took too long to respond — please try asking again."
          : err.message || "An unexpected error occurred during analysis.",
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar activeTab="conversations" />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/app")}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to datasets</span>
            </button>

            <div className="ml-6 h-5 w-px bg-slate-200" />

            <div className="ml-6">
              <p className="text-xs text-slate-400">Dataset Workspace</p>
              <h1 className="text-sm font-semibold text-slate-900">
                {fileName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700">Active Session</span>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">

          {/* Dataset Metrics */}
          {!loading && !error && (
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">Rows</p>
                  <Database size={17} className="text-slate-400" />
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {totalRows.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-400">Total records</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">Columns</p>
                  <Table2 size={17} className="text-slate-400" />
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {columns.length}
                </p>
                <p className="mt-1 text-xs text-slate-400">Attributes available</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">Quality Score</p>
                  <Sparkles size={17} className="text-emerald-500" />
                </div>
                <p className="mt-3 text-2xl font-bold text-emerald-600">
                  {profile?.quality_score ?? 100}/100
                </p>
                <p className="mt-1 text-xs text-slate-400">Completeness & integrity</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">Missing Cells</p>
                  <Info size={17} className="text-slate-400" />
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {profile?.missing_cells?.toLocaleString() ?? 0}
                </p>
                <p className="mt-1 text-xs text-slate-400">Across all columns</p>
              </div>
            </div>
          )}

          {/* Main Grid: Data Preview & AI Conversational Analyst */}
          <div className="grid gap-6 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px]">

            {/* Dataset Preview Section */}
            <section className="flex h-[680px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              {/* Header with tabs and search */}
              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {/* View Tabs */}
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      onClick={() => setExplorerTab("grid")}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        explorerTab === "grid"
                          ? "bg-white text-blue-600 shadow-2xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <Table2 size={13} />
                      <span>Data Grid</span>
                    </button>
                    <button
                      onClick={() => setExplorerTab("schema")}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        explorerTab === "schema"
                          ? "bg-white text-blue-600 shadow-2xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <Columns3 size={13} />
                      <span>Schema & Types</span>
                    </button>
                  </div>

                  <span className="hidden text-xs text-slate-400 sm:inline">
                    {totalRows.toLocaleString()} total records
                  </span>
                </div>

                {explorerTab === "grid" && !loading && !error && (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={tableSearch}
                        onChange={(e) => {
                          setTableSearch(e.target.value);
                          setCurrentPage(1);
                        }}
                        placeholder="Filter rows..."
                        className="h-8 w-40 rounded-lg border border-slate-200 bg-white pl-7 pr-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                )}
              </div>

              {loading && (
                <div className="flex flex-1 items-center justify-center p-8">
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Table2 size={21} />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-slate-900">
                      Analyzing dataset...
                    </h3>
                    <p className="mt-2 text-xs text-slate-400">
                      Reading schema and computing data profile.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex flex-1 items-center justify-center p-8">
                  <div className="text-center">
                    <h3 className="text-sm font-semibold text-red-600">
                      Unable to load dataset
                    </h3>
                    <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {!loading && !error && explorerTab === "grid" && (
                <>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full min-w-max text-left text-xs">
                      <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                          <th className="border-b border-slate-200 px-3 py-2.5 font-mono text-[11px] font-semibold text-slate-400 bg-slate-50 w-10 text-center">
                            #
                          </th>
                          {columns.map((column) => (
                            <th
                              key={column}
                              className="border-b border-slate-200 px-3.5 py-2.5 font-semibold text-slate-700 bg-slate-50"
                            >
                              <div className="flex items-center gap-1.5">
                                <span>{column}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {paginatedData.length > 0 ? (
                          paginatedData.map((row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className="border-b border-slate-100 last:border-0 hover:bg-blue-50/30 transition"
                            >
                              <td className="px-3 py-2 text-center font-mono text-[11px] text-slate-400 border-r border-slate-50">
                                {(safeCurrentPage - 1) * pageSize + rowIndex + 1}
                              </td>
                              {columns.map((column) => (
                                <td
                                  key={column}
                                  className="max-w-52 truncate px-3.5 py-2 text-slate-600"
                                >
                                  {String(row[column] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={columns.length + 1} className="py-16 text-center text-xs text-slate-400">
                              No rows match "{tableSearch}".
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination footer */}
                  <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">Rows:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-700 cursor-pointer"
                      >
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                      <span className="text-[11px] text-slate-400">
                        {filteredData.length > 0
                          ? `Showing ${(safeCurrentPage - 1) * pageSize + 1}-${Math.min(safeCurrentPage * pageSize, filteredData.length)} of ${filteredData.length} records`
                          : "0 records"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safeCurrentPage <= 1}
                        className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Previous page"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <span className="px-1.5 text-[11px] font-medium text-slate-700">
                        {safeCurrentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safeCurrentPage >= totalPages}
                        className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Next page"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {!loading && !error && explorerTab === "schema" && (
                <div className="flex-1 overflow-auto p-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="pb-2 pl-2">Column</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Profile / Sample</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {columns.map((col) => {
                        const colProf = profile?.column_profiles?.[col] || {};
                        const semType = colProf.semantic_type || "text";
                        const isNum = semType === "numeric";
                        return (
                          <tr key={col} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 pl-2 font-medium text-slate-800">
                              {col}
                            </td>
                            <td className="py-2.5">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  isNum
                                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                                    : semType === "datetime"
                                    ? "bg-violet-50 text-violet-700 border border-violet-100"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {isNum ? "Numeric" : semType === "datetime" ? "Datetime" : "Categorical"}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-500 text-[11px]">
                              {isNum ? (
                                <span>
                                  Median: <strong>{colProf.median ?? "N/A"}</strong> · Std: {colProf.std ?? "N/A"}
                                </span>
                              ) : colProf.top_values?.length ? (
                                <span>
                                  Top: {colProf.top_values.slice(0, 3).map((v) => `${v.label} (${v.count})`).join(", ")}
                                </span>
                              ) : (
                                <span className="text-slate-400">Available in records</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* AI Conversational Analyst Panel */}
            <section className="flex h-[680px] flex-col rounded-2xl border border-slate-200 bg-white shadow-xs">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                    <Bot size={17} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      DataLens AI Analyst
                    </h2>
                    <p className="text-xs text-slate-400">
                      Natural language reasoning & visualization
                    </p>
                  </div>
                </div>

                {messages.length > 1 && (
                  <button
                    onClick={handleClearChat}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                    title="Reset conversation history"
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.sender === "ai" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 mt-0.5">
                        <Sparkles size={14} />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-5 ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white font-medium"
                          : msg.isError
                          ? "bg-red-50 text-red-600 border border-red-100"
                          : "bg-slate-100/90 text-slate-700 border border-slate-200/60"
                      }`}
                    >
                      <p className="whitespace-pre-line">{renderFormattedText(msg.text)}</p> 

                      {/* Explanation Callout */}
                      {msg.explanation && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/70 text-[11px] text-slate-500 flex items-start gap-1.5">
                          <Info size={13} className="shrink-0 mt-0.5 text-blue-500" />
                          <span>{msg.explanation}</span>
                        </div>
                      )}

                      {/* Render Interactive Chart */}
                      {msg.chart && (
                        <div className="mt-3">
                          <AnalysisChart chart={msg.chart} />
                        </div>
                      )} 

                      {/* ML Model Metrics */}
                      {msg.analysisType === "machine_learning" && msg.metrics && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {msg.metrics.task === "classification" ? (
                            <>
                              <div className="rounded-lg bg-white border border-slate-200/70 px-3 py-2">
                                <p className="text-[10px] uppercase tracking-wide text-slate-400">Accuracy</p>
                                <p className="text-sm font-semibold text-slate-800">{msg.metrics.accuracy}%</p>
                              </div>
                              <div className="rounded-lg bg-white border border-slate-200/70 px-3 py-2">
                                <p className="text-[10px] uppercase tracking-wide text-slate-400">F1 Score</p>
                                <p className="text-sm font-semibold text-slate-800">{msg.metrics.f1_score}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="rounded-lg bg-white border border-slate-200/70 px-3 py-2">
                                <p className="text-[10px] uppercase tracking-wide text-slate-400">R² Score</p>
                                <p className="text-sm font-semibold text-slate-800">{msg.metrics.r2_score}</p>
                              </div>
                              <div className="rounded-lg bg-white border border-slate-200/70 px-3 py-2">
                                <p className="text-[10px] uppercase tracking-wide text-slate-400">RMSE</p>
                                <p className="text-sm font-semibold text-slate-800">{msg.metrics.rmse}</p>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Suggested Follow-up chips */}
                      {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1.5">
                            <Lightbulb size={12} className="text-amber-500" />
                            <span>Suggested follow-ups:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.suggestedFollowUps.map((prompt, i) => (
                              <button
                                key={i}
                                onClick={() => handleAskQuestion(prompt)}
                                disabled={asking}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition disabled:opacity-50"
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {msg.sender === "user" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 mt-0.5">
                        <User size={14} />
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading indicator */}
                {asking && (
                  <div className="flex gap-3 items-center">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Sparkles size={14} className="animate-spin" />
                    </div>
                    <div className="rounded-2xl bg-slate-100 px-4 py-2.5 text-xs text-slate-500 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span>Analyzing dataset & preparing visualization...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-200 p-3 bg-white rounded-b-2xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskQuestion();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Ask anything about your data..."
                    disabled={asking}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />

                  <button
                    type="submit"
                    disabled={!question.trim() || asking}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Send message"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </section>

          </div>
        </div>
      </main>
      </div>
    </div>
  );
}

export default DatasetWorkspace;

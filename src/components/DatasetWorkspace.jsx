import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Database,
  MessageSquare,
  Table2,
} from "lucide-react";

function DatasetWorkspace() {
  const [fileName, setFileName] = useState("Dataset");
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [totalRows, setTotalRows] = useState(0);  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedDataset = sessionStorage.getItem("datalens_dataset");

    if (!storedDataset) {
      setError("Dataset information could not be found. Please upload it again.");
      setLoading(false);
      return;
    }

    try {
      const dataset = JSON.parse(storedDataset);

      setFileName(dataset.filename || "Dataset");
      setData(dataset.preview || []);
      setColumns(dataset.column_names || []);
      setTotalRows(dataset.rows || 0);
      setLoading(false);
    } catch {
      setError("Unable to load dataset information.");
      setLoading(false);
    }
  }, []);


  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="flex h-16 items-center border-b border-slate-200 bg-white px-6">
        <button
          onClick={() => {
            window.location.href = "/app";
          }}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to datasets
        </button>

        <div className="ml-6 h-5 w-px bg-slate-200" />

        <div className="ml-6">
          <p className="text-xs text-slate-400">Dataset</p>

          <h1 className="text-sm font-semibold text-slate-900">
            {fileName}
          </h1>
        </div>
      </header>

      <main className="p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">

          {/* Dataset information */}
          {!loading && !error && (
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">
                    Rows
                  </p>

                  <Database size={17} className="text-slate-400" />
                </div>

                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {totalRows.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">
                    Columns
                  </p>

                  <Table2 size={17} className="text-slate-400" />
                </div>

                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {columns.length}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

            {/* Dataset preview */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Dataset preview
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    First 10 rows of your dataset
                  </p>
                </div>

                {!loading && !error && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Table2 size={15} />
                    {totalRows.toLocaleString()} rows
                  </div>
                )}
              </div>

              {loading && (
                <div className="flex min-h-96 items-center justify-center p-8">
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Table2 size={21} />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-slate-900">
                      Analyzing your dataset...
                    </h3>

                    <p className="mt-2 text-xs text-slate-400">
                      Preparing your data for analysis.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex min-h-96 items-center justify-center p-8">
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
                      <Table2 size={21} />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-slate-900">
                      Unable to load dataset
                    </h3>

                    <p className="mt-2 max-w-sm text-xs leading-5 text-red-500">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {!loading && !error && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-left text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        {columns.map((column) => (
                          <th
                            key={column}
                            className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-600"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {data.slice(0, 10).map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="border-b border-slate-100 last:border-0"
                        >
                          {columns.map((column) => (
                            <td
                              key={column}
                              className="max-w-48 truncate px-4 py-3 text-slate-600"
                            >
                              {String(row[column] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* AI Panel */}
            <section className="flex min-h-96 flex-col rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <MessageSquare size={15} />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Ask DataLens AI
                    </h2>

                    <p className="text-xs text-slate-400">
                      Ask anything about your dataset
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-center p-6">
                <div className="text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                    <BarChart3 size={18} />
                  </div>

                  <p className="mt-3 text-sm font-medium text-slate-700">
                    Dataset ready
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Your data is ready for AI analysis.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 p-4">
                <div className="rounded-lg border border-slate-200 px-4 py-3 text-xs text-slate-400">
                  Ask a question about your data...
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DatasetWorkspace;
import { useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
  downloadPriceSheet,
  uploadPriceSheet,
  getJobStatus,
  getJobResults,
} from "../../services/bulkPriceService";

const VERTICALS = ["qwik", "eato", "bazar", "star"];
const POLL_INTERVAL = 3000;

const STEPS = ["Export & Upload", "Preview & Confirm", "Processing", "Results"];

export default function BulkPriceUpdate() {
  const [step, setStep] = useState(0);

  // Export filters
  const [vertical, setVertical] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [exporting, setExporting] = useState(false);

  // Upload
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Preview
  const [previewRows, setPreviewRows] = useState([]);
  const [clientErrors, setClientErrors] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Job tracking
  const [jobId, setJobId] = useState(null);
  const [jobState, setJobState] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0, errorCount: 0 });
  const [invalidRowsFromServer, setInvalidRowsFromServer] = useState([]);
  const pollingRef = useRef(null);

  // Results
  const [results, setResults] = useState([]);
  const [resultSummary, setResultSummary] = useState({ total: 0, errorCount: 0 });

  // --- Export ---
  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadPriceSheet({ vertical: vertical || undefined, category_id: categoryId || undefined });
      toast.success("Price sheet downloaded successfully");
    } catch (err) {
      toast.error("Export failed: " + (err.response?.data?.error || err.message));
    } finally {
      setExporting(false);
    }
  };

  // --- File handling ---
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    const ext = selectedFile.name.toLowerCase();
    if (!ext.endsWith(".xlsx") && !ext.endsWith(".xls") && !ext.endsWith(".csv")) {
      toast.error("Only Excel (.xlsx, .xls) or CSV files are allowed");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum 10MB.");
      return;
    }
    setFile(selectedFile);
    parseFilePreview(selectedFile);
  };

  const parseFilePreview = (f) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const errors = [];
        const valid = [];

        rows.slice(0, 5000).forEach((row, i) => {
          const norm = {};
          Object.keys(row).forEach((k) => {
            norm[k.trim().toLowerCase().replace(/\s+/g, "_")] = row[k];
          });

          const rowNum = i + 2;
          const vid = norm.variant_id?.toString().trim();
          const np = parseFloat(norm.new_price);
          const nop = norm.new_old_price !== "" && norm.new_old_price != null ? parseFloat(norm.new_old_price) : null;

          const rowErrors = [];
          if (!vid) rowErrors.push("variant_id missing");
          if (isNaN(np) || np <= 0) rowErrors.push("new_price must be > 0");
          if (nop != null && !isNaN(nop) && nop < np) rowErrors.push("new_old_price < new_price");

          if (rowErrors.length) {
            errors.push({ row: rowNum, variant_id: vid, errors: rowErrors });
          } else {
            valid.push({
              product_name: norm.product_name,
              sku: norm.sku,
              variant_id: vid,
              current_price: norm.current_price,
              new_price: np,
              new_old_price: nop,
              new_discount_percentage: norm.new_discount_percentage !== "" ? norm.new_discount_percentage : "",
            });
          }
        });

        setPreviewRows(valid);
        setClientErrors(errors);
        setStep(1);
      } catch (err) {
        toast.error("Failed to parse file: " + err.message);
      }
    };
    reader.readAsBinaryString(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, []);

  // --- Upload & poll ---
  const handleConfirmUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadPriceSheet(file);
      if (!data.success) {
        toast.error(data.error || "Upload failed");
        return;
      }
      setJobId(data.jobId);
      setInvalidRowsFromServer(data.invalidRows || []);
      setProgress({ done: 0, total: data.validRows, errorCount: 0 });
      setStep(2);
      startPolling(data.jobId);
    } catch (err) {
      toast.error("Upload failed: " + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const startPolling = (jid) => {
    pollingRef.current = setInterval(async () => {
      try {
        const status = await getJobStatus(jid);
        if (status.progress) setProgress(status.progress);
        setJobState(status.state);

        if (status.state === "completed" || status.state === "failed") {
          clearInterval(pollingRef.current);
          const res = await getJobResults(jid);
          setResults(res.results || []);
          setResultSummary({ total: res.total || 0, errorCount: res.errorCount || 0 });
          setStep(3);
          if (status.state === "failed") {
            toast.error("Job failed: " + (status.failedReason || "Unknown error"));
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, POLL_INTERVAL);
  };

  const handleReset = () => {
    clearInterval(pollingRef.current);
    setStep(0);
    setFile(null);
    setPreviewRows([]);
    setClientErrors([]);
    setJobId(null);
    setJobState(null);
    setProgress({ done: 0, total: 0, errorCount: 0 });
    setInvalidRowsFromServer([]);
    setResults([]);
    setResultSummary({ total: 0, errorCount: 0 });
  };

  const downloadErrorReport = () => {
    const errors = results.filter((r) => r.status === "error");
    if (!errors.length) return;
    const ws = XLSX.utils.json_to_sheet(errors);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Errors");
    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `price-update-errors-${date}.xlsx`);
  };

  const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Bulk Price Update</h1>
      <p className="text-gray-500 mb-6 text-sm">Export current prices, edit in Excel, then upload to apply changes.</p>

      {/* Stepper */}
      <div className="flex items-center mb-8 gap-0">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
                ${i < step ? "bg-green-500 border-green-500 text-white" : i === step ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300 text-gray-400"}`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${i === step ? "text-blue-600 font-semibold" : "text-gray-400"}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < step ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Export & Upload */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Export Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-1">Step 1 — Export Current Prices</h2>
            <p className="text-sm text-gray-500 mb-4">Download a pre-filled sheet with all variants. Fill in <code className="bg-gray-100 px-1 rounded">new_price</code>, <code className="bg-gray-100 px-1 rounded">new_old_price</code>, and <code className="bg-gray-100 px-1 rounded">new_discount_percentage</code> columns.</p>

            <div className="flex flex-wrap gap-3 mb-4">
              <select
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Verticals</option>
                {VERTICALS.map((v) => (
                  <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Category ID (optional)"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
              />
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {exporting ? (
                  <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Exporting...</>
                ) : (
                  <><span>⬇</span> Export Price Sheet</>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400">Exports all active variants. Do not modify the <strong>variant_id</strong>, <strong>product_name</strong>, <strong>sku</strong>, or <strong>current_*</strong> columns.</p>
          </div>

          {/* Upload Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-1">Step 2 — Upload Updated Sheet</h2>
            <p className="text-sm text-gray-500 mb-4">Upload the edited Excel file. Supports .xlsx, .xls, .csv — max 10MB, 5000 rows.</p>

            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition
                ${dragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}`}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleFileSelect(e.target.files[0])} />
              <div className="text-4xl mb-3">📂</div>
              <p className="font-medium text-gray-700">Drop your Excel file here</p>
              <p className="text-sm text-gray-400 mt-1">or click to browse</p>
              {file && <p className="mt-3 text-blue-600 font-semibold text-sm">{file.name}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Preview & Confirm */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">Preview — {file?.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{previewRows.length} valid rows · {clientErrors.length} invalid rows</p>
            </div>
            <button onClick={() => setStep(0)} className="text-sm text-gray-500 hover:text-blue-600 underline">← Back</button>
          </div>

          {clientErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-700 mb-2">⚠ {clientErrors.length} rows will be skipped (validation errors):</p>
              <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                {clientErrors.map((e, i) => (
                  <li key={i}>Row {e.row} {e.variant_id ? `(${e.variant_id})` : ""}: {e.errors.join(", ")}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-auto max-h-80 rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {["product_name", "sku", "current_price", "new_price", "new_old_price", "new_discount_percentage"].map((h) => (
                    <th key={h} className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h.replace(/_/g, " ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700 max-w-xs truncate">{row.product_name || "—"}</td>
                    <td className="px-3 py-2 text-gray-500 font-mono text-xs">{row.sku || "—"}</td>
                    <td className="px-3 py-2">{row.current_price}</td>
                    <td className="px-3 py-2 font-semibold text-blue-600">{row.new_price}</td>
                    <td className="px-3 py-2">{row.new_old_price ?? "—"}</td>
                    <td className="px-3 py-2">{row.new_discount_percentage !== "" ? row.new_discount_percentage : "auto"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {previewRows.length === 0 ? (
            <p className="text-red-500 text-sm font-semibold">No valid rows to upload. Please fix errors and re-upload.</p>
          ) : (
            <button
              onClick={handleConfirmUpload}
              disabled={uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm transition disabled:opacity-50"
            >
              {uploading ? "Uploading..." : `Confirm & Update ${previewRows.length} Variants`}
            </button>
          )}
        </div>
      )}

      {/* Step 2: Processing */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center space-y-6">
          <div className="text-5xl animate-pulse">⚙️</div>
          <div>
            <h2 className="font-semibold text-xl mb-1">Processing...</h2>
            <p className="text-sm text-gray-500">Job ID: <code className="bg-gray-100 px-1 rounded">{jobId}</code></p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {progress.done} / {progress.total} variants updated
            {progress.errorCount > 0 && <span className="text-red-500 ml-2">· {progress.errorCount} errors</span>}
          </p>

          {invalidRowsFromServer.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
              <p className="text-sm font-semibold text-yellow-700 mb-2">{invalidRowsFromServer.length} rows were skipped before processing (pre-flight validation):</p>
              <ul className="text-xs text-yellow-700 space-y-1 max-h-28 overflow-y-auto">
                {invalidRowsFromServer.map((e, i) => (
                  <li key={i}>{e.variant_id || `Row ${e.row}`}: {(e.errors || []).join(", ")}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-400">This page polls automatically. You can leave and come back — the job will continue in the background.</p>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className={`text-5xl ${resultSummary.errorCount === 0 ? "" : ""}`}>
              {resultSummary.errorCount === 0 ? "✅" : "⚠️"}
            </div>
            <div>
              <h2 className="font-semibold text-xl">Update Complete</h2>
              <p className="text-sm text-gray-500">
                {resultSummary.total - resultSummary.errorCount} succeeded
                {resultSummary.errorCount > 0 && <span className="text-red-500 ml-2">· {resultSummary.errorCount} failed</span>}
              </p>
            </div>
          </div>

          {resultSummary.errorCount > 0 && (
            <button
              onClick={downloadErrorReport}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              ⬇ Download Error Report
            </button>
          )}

          <div className="overflow-auto max-h-96 rounded-lg border">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {["variant_id", "status", "new_price", "new_old_price", "new_discount_percentage", "reason"].map((h) => (
                    <th key={h} className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h.replace(/_/g, " ")}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={i} className={`border-t ${row.status === "error" ? "bg-red-50" : "hover:bg-gray-50"}`}>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500 max-w-xs truncate">{row.variant_id}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.status === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">{row.new_price ?? "—"}</td>
                    <td className="px-3 py-2">{row.new_old_price ?? "—"}</td>
                    <td className="px-3 py-2">{row.new_discount_percentage ?? "—"}</td>
                    <td className="px-3 py-2 text-red-500 text-xs">{row.reason || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleReset}
            className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-lg font-semibold text-sm transition"
          >
            Start New Import
          </button>
        </div>
      )}
    </div>
  );
}

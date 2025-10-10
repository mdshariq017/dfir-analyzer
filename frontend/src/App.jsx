import { useMemo, useRef, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./App.css";

// Attach JWT automatically
axios.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

function App() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [name, setName] = useState(localStorage.getItem("name") || "Guest");
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const onStorage = () => {
      setToken(localStorage.getItem("token"));
      setName(localStorage.getItem("name") || "Guest");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    setToken(null);
    setName("Guest");
    navigate("/login");
  };

  const loadDash = async () => {
    if (!token) { setStats(null); setHistory([]); return; }
    try {
      const [s, h] = await Promise.all([
        axios.get("http://127.0.0.1:8000/stats"),
        axios.get("http://127.0.0.1:8000/history?limit=50"),
      ]);
      setStats(s.data);
      setHistory(h.data);
    } catch (e) {
      console.error("Failed to load stats/history", e);
    }
  };

  useEffect(() => { loadDash(); }, [token]);

  // ----- Dashboard numbers (live if signed in, fallback to demo) -----
  const demo = { total: 123, avg: 42.7, high: 8 };
  const totalScans = stats?.total_scans ?? demo.total;
  const avgRiskScore = stats?.avg_risk ?? demo.avg;
  const highRiskFiles = stats?.high_risk ?? demo.high;

  // map server ext -> friendly label + color
  const _extLabel = (ext) => {
    const e = (ext || "").toLowerCase();
    if (e === ".pdf") return "PDF";
    if (e === ".zip") return "ZIP";
    if (e === ".docx" || e === ".doc") return "DOCX";
    return "Other";
  };
  const _colorFor = (label) => {
    if (label === "PDF") return "#6C63FF";
    if (label === "ZIP") return "#25CED1";
    if (label === "DOCX") return "#1DB954";
    return "#F29E4C";
  };

  const fileTypeData = (stats?.types ?? [
    { ext: ".pdf", count: 25 },
    { ext: ".zip", count: 20 },
    { ext: ".docx", count: 15 },
    { ext: ".other", count: 40 },
  ]).map(t => {
    const label = _extLabel(t.ext);
    return { name: label, value: t.count, color: _colorFor(label) };
  });

  const scanHistoryData = (() => {
    const times = stats?.times ?? Array.from({length:10}, (_,i)=>i+1); // demo ticks
    // Simple cumulative trend: 1..N
    return times.map((_, idx) => ({ time: idx + 1, scans: idx + 1 }));
  })();

  const riskBand = useMemo(() => {
    if (avgRiskScore <= 40) return "Low";
    if (avgRiskScore <= 70) return "Medium";
    return "High";
  }, [avgRiskScore]);

  // ----- UI state -----
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  const [analysis, setAnalysis] = useState(null); // becomes object after upload
  const hiddenFileInputRef = useRef(null);
  const analysisRef = useRef(null); // for PDF export

  // ----- Helpers -----
  const triggerFilePicker = () => hiddenFileInputRef.current?.click();

  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes)) return "-";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getRiskBand = (score) => {
    if (score <= 40) return "low";
    if (score <= 70) return "medium";
    return "high";
  };

  const recommendationsFor = (score) => {
    if (score <= 40) return "File appears safe, but keep for records.";
    if (score <= 70) return "Review file carefully for potential anomalies.";
    return "High-risk file. Immediate review and quarantine recommended.";
  };

  // ----- Timeline helpers -----
  const formatDateTime = (sec) => {
    if (!sec || !Number.isFinite(sec)) return "-";
    const d = new Date(sec * 1000);
    return d.toLocaleString();
  };

  const getBaseName = (p) => {
    if (!p) return "";
    const parts = p.split("/");
    return parts[parts.length - 1] || p;
  };

  const buildTimelineData = (timeline, limit = 30) => {
    if (!Array.isArray(timeline)) return [];
    const filtered = timeline
      .filter(t => Number.isFinite(t?.mtime))
      .sort((a, b) => (b.mtime ?? 0) - (a.mtime ?? 0))
      .slice(0, limit);
    return filtered.map((t, idx) => ({
      idx,
      mtime: t.mtime,
      sizeKB: Math.max(0, (t.size || 0) / 1024),
      label: getBaseName(t.path),
    }));
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast("SHA256 copied to clipboard");
    } catch {
      setToast("Copy failed");
    }
  };

  // ----- Upload flow -----
  const handleUpload = async (event) => {
    const picked = event.target.files?.[0];
    if (!picked) return;

    const formData = new FormData();
    formData.append("file", picked);

    try {
      setUploading(true);
      setToast("");
      const response = await axios.post("http://127.0.0.1:8000/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast(`Upload successful. Risk score: ${response.data?.risk_score ?? "-"}`);

      // Build the analysis object the UI expects
      const details = {
        originalFilename: response.data?.filename ?? picked.name,
        storedFilename: "-",
        fileSize: picked.size,
        sha256: response.data?.sha256 ?? "-",
        score: response.data?.risk_score ?? 0,
      };
      setAnalysis(details);
      await loadDash();
    } catch (err) {
      setToast(err.response?.data?.detail || "Upload failed. Try again.");
    } finally {
      setUploading(false);
      // allow re-selecting same file
      event.target.value = "";
    }
  };

  // ----- Export PDF (captures only the analysis panel) -----
  const exportPDF = async () => {
    if (!analysisRef.current) return;
    const canvas = await html2canvas(analysisRef.current, {
      scale: 2,
      backgroundColor: "#0f1224",
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 20; // 10mm margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= pageHeight - 20) {
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    } else {
      // naive multipage slicing
      let y = 0;
      const sliceHeight = Math.floor((canvas.width * (pageHeight - 20)) / imgWidth);
      while (y < canvas.height) {
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(sliceHeight, canvas.height - y);
        const ctx = pageCanvas.getContext("2d");
        ctx.drawImage(
          canvas,
          0, y, canvas.width, pageCanvas.height,
          0, 0, canvas.width, pageCanvas.height
        );
        const pageImg = pageCanvas.toDataURL("image/png");
        if (y > 0) pdf.addPage();
        const h = (pageCanvas.height * imgWidth) / pageCanvas.width;
        pdf.addImage(pageImg, "PNG", 10, 10, imgWidth, h);
        y += sliceHeight;
      }
    }

    const safeName = (analysis?.originalFilename || "dfir-analysis").replace(/[^\w.-]+/g, "_");
    pdf.save(`${safeName}.pdf`);
  };

  // ----- Export CSV + JSON -----
  const downloadBlob = (name, blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = async () => {
    if (!analysis?.sha256) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/export/csv?sha256=${analysis.sha256}`);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const safe = (analysis.originalFilename || "dfir-analysis").replace(/[^\w.-]+/g, "_");
      downloadBlob(`${safe}.csv`, blob);
      setToast("CSV exported");
    } catch (e) {
      setToast("CSV export failed");
    }
  };

  const exportJSON = async () => {
    if (!analysis?.sha256) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/export/json?sha256=${analysis.sha256}`);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const safe = (analysis.originalFilename || "dfir-analysis").replace(/[^\w.-]+/g, "_");
      downloadBlob(`${safe}.json`, blob);
      setToast("JSON exported");
    } catch (e) {
      setToast("JSON export failed");
    }
  };

  return (
    <div className="app app-wide">
      {/* Top bar */}
      <div className="topbar">
        <div>
          <h1 className="app-title">DFIR Analyzer</h1>
        </div>
        <div className="topbar-right">
          <span className="welcome-text">Welcome, {name}</span>

          <div className="avatar-wrap" onBlur={() => setMenuOpen(false)} tabIndex={0}>
            <button className="avatar-btn" onClick={() => setMenuOpen(v => !v)}>
              {token ? (
                (name?.[0] || "U").toString().toUpperCase()
              ) : (
                <img src="/login.png" alt="Login" className="login-icon" />
              )}
            </button>
            {menuOpen && (
              <div className="avatar-menu">
                {!token ? (
                  <>
                    <button onClick={() => navigate("/signup")}>Sign up</button>
                    <button onClick={() => navigate("/login")}>Log in</button>
                  </>
                ) : (
                  <>
                    <button onClick={logout}>Logout</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Header Row: KPIs (left) + Upload (right) ===== */}
      <div className="header-row">
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-title">Total Scans</div>
            <div className="metric-value">{totalScans}</div>
          </div>
          <div className="metric-card">
            <div className="metric-title">Avg. Risk Score</div>
            <div className="metric-row">
              <div className="metric-value">{avgRiskScore.toFixed(1)}</div>
              <span className={`badge badge-${riskBand.toLowerCase()}`}>{riskBand}</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-title">High-Risk Files</div>
            <div className="metric-value">{highRiskFiles}</div>
          </div>
        </div>

        {/* Upload in the top row for better first impression */}
        <div className="upload-card card">
          <div className="panel-title">Upload File</div>
          <input
            ref={hiddenFileInputRef}
            type="file"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
          <button
            className={`upload-btn ${uploading ? "loading" : ""}`}
            onClick={() => hiddenFileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload File"}
          </button>
          {toast && <div className="toast">{toast}</div>}
          {!analysis && (
            <div className="panel-placeholder" style={{ marginTop: ".5rem" }}>
              Upload a file to view detailed analysis.
            </div>
          )}
        </div>
      </div>

      {/* ===== Main: two columns ===== */}
      <div className="dashboard-grid two-col">
        {/* LEFT: charts (keep your two cards here) */}
        <div className="dashboard-left">
          <div className="chart-grid">
            <div className="card">
              <div className="card-title">File Types</div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(20,20,40,0.9)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                    />
                    <Pie
                      data={fileTypeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      stroke="none"
                    >
                      {fileTypeData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="middle"
                      align="right"
                      layout="vertical"
                      formatter={(value) => <span style={{ color: "#c7c7d2" }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Scan History</div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scanHistoryData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="time"
                      stroke="#8b8b9b"
                      tickLine={false}
                      axisLine={false}
                      label={{ value: "Time", position: "insideBottom", dy: 10, fill: "#8b8b9b" }}
                    />
                    <YAxis stroke="#8b8b9b" tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(20,20,40,0.9)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                    />
                    <Line type="monotone" dataKey="scans" stroke="#9b7bff" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <aside className="right-panel">
          {/* ACTION BAR: always visible; disabled before upload */}
          {(() => {
            const hasAnalysis = !!analysis;
            return (
              <div className="panel-section action-bar">
                <div className="panel-title">Analysis Details</div>
                <div className="actions">
                  <button
                    className="upload-btn"
                    onClick={exportPDF}
                    disabled={!hasAnalysis}
                    title={hasAnalysis ? "Export PDF" : "Upload a file first"}
                  >
                    Export PDF
                  </button>
                  <button
                    className="upload-btn"
                    onClick={exportCSV}
                    disabled={!hasAnalysis}
                    title={hasAnalysis ? "Export CSV" : "Upload a file first"}
                  >
                    Export CSV
                  </button>
                  <button
                    className="upload-btn"
                    onClick={exportJSON}
                    disabled={!hasAnalysis}
                    title={hasAnalysis ? "Export JSON" : "Upload a file first"}
                  >
                    Export JSON
                  </button>
                  <button
                    className="upload-btn"
                    onClick={() => setAnalysis(null)}
                    disabled={!hasAnalysis}
                    title={hasAnalysis ? "Start a new analysis" : "Upload a file first"}
                  >
                    New Analysis
                  </button>
                </div>
              </div>
            );
          })()}

          {/* DETAILS + RECOMMENDATIONS: always render with placeholders */}
          <div ref={analysisRef}>
            <div className="panel-section">
              <div className="panel-item">
                <span className="result-label">Original filename</span>
                <span className="result-value">{analysis?.originalFilename || "Not uploaded"}</span>
              </div>

              <div className="panel-item">
                <span className="result-label">Stored filename</span>
                <span className="result-value" style={{ fontFamily: "monospace" }}>
                  {analysis?.storedFilename || "-"}
                </span>
              </div>

              <div className="panel-item">
                <span className="result-label">File size</span>
                <span className="result-value">
                  {analysis ? formatBytes(analysis.fileSize) : "-"}
                </span>
              </div>

              <div className="panel-item" style={{ alignItems: "flex-start", gap: "0.5rem" }}>
                <span className="result-label">SHA256</span>
                <span className="hash-field">
                  <span className="code-select">{analysis?.sha256 || "-"}</span>
                  <button
                    className="copy-btn"
                    onClick={() => analysis && handleCopy(analysis.sha256)}
                    disabled={!analysis}
                    title={analysis ? "Copy" : "Upload a file first"}
                  >
                    Copy
                  </button>
                </span>
              </div>

              <div className="panel-item">
                <span className="result-label">Risk score</span>
                <span>
                  {analysis ? (
                    <span className={`score-bubble score-${getRiskBand(analysis.score)}`}>{analysis.score}</span>
                  ) : (
                    <span className="score-bubble score-disabled">-</span>
                  )}
                </span>
              </div>
            </div>

            <div className="panel-section">
              <div className="card-title" style={{ marginLeft: 0, marginBottom: "0.5rem" }}>
                Recommendations
              </div>
              <p className="recommendation-text">
                {analysis
                  ? recommendationsFor(analysis.score)
                  : "Upload a file to get recommendations."}
              </p>
            </div>
            {analysis?.timeline?.length ? (
              <div className="panel-section">
                <div className="card-title" style={{ marginLeft: 0, marginBottom: ".5rem" }}>
                  File Timeline (by mtime)
                </div>
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={buildTimelineData(analysis.timeline)} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis
                        dataKey="idx"
                        stroke="#8b8b9b"
                        tickLine={false}
                        axisLine={false}
                        label={{ value: "Recent files", position: "insideBottom", dy: 10, fill: "#8b8b9b" }}
                      />
                      <YAxis
                        dataKey="sizeKB"
                        stroke="#8b8b9b"
                        tickLine={false}
                        axisLine={false}
                        label={{ value: "Size (KB)", angle: -90, position: "insideLeft", dx: -5, fill: "#8b8b9b" }}
                      />
                      <Tooltip
                        formatter={(value, name, props) => {
                          if (name === "sizeKB") return [`${value.toFixed(1)} KB`, "Size"];
                          return [value, name];
                        }}
                        labelFormatter={(idx) => {
                          const d = buildTimelineData(analysis.timeline)[idx];
                          return d ? `${d.label} � ${formatDateTime(d.mtime)}` : "";
                        }}
                        contentStyle={{
                          background: "rgba(20,20,40,0.9)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                        }}
                      />
                      <Line type="monotone" dataKey="sizeKB" stroke="#9b7bff" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ color: "#a0a0b4", fontSize: ".85rem", marginTop: ".5rem" }}>
                  Showing up to 30 most recently modified files.
                </div>
              </div>
            ) : null}

          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;

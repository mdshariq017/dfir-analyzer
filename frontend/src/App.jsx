import { useMemo, useRef, useState } from "react";
import axios from "axios";
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
import "./App.css";

function App() {
  // Mocked dashboard data — replace with API data later
  const totalScans = 123;
  const avgRiskScore = 42.7;
  const highRiskFiles = 8;

  const fileTypeData = [
    { name: "PDF", value: 25, color: "#6C63FF" },
    { name: "ZIP", value: 20, color: "#25CED1" },
    { name: "DOCX", value: 15, color: "#1DB954" },
    { name: "Other", value: 40, color: "#F29E4C" },
  ];

  const scanHistoryData = [
    { time: 1, scans: 5 },
    { time: 2, scans: 12 },
    { time: 3, scans: 18 },
    { time: 4, scans: 22 },
    { time: 5, scans: 32 },
    { time: 6, scans: 28 },
    { time: 7, scans: 38 },
    { time: 8, scans: 25 },
    { time: 9, scans: 48 },
    { time: 10, scans: 60 },
  ];

  const riskBand = useMemo(() => {
    if (avgRiskScore <= 40) return "Low";
    if (avgRiskScore <= 70) return "Medium";
    return "High";
  }, [avgRiskScore]);

  // Upload CTA logic (non-intrusive, no login). Uses existing backend.
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const hiddenFileInputRef = useRef(null);

  const triggerFilePicker = () => hiddenFileInputRef.current?.click();

  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes)) return "-";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]; 
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  async function sha256HexFromFile(fileObj) {
    const buffer = await fileObj.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

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

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast("SHA256 copied to clipboard");
    } catch (e) {
      setToast("Copy failed");
    }
  };

  const handleUpload = async (event) => {
    const picked = event.target.files?.[0];
    if (!picked) return;

    const formData = new FormData();
    formData.append("file", picked);

    try {
      setUploading(true);
      setToast("");
      const response = await axios.post("http://127.0.0.1:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setToast(`Upload successful. Risk score: ${response.data?.score ?? "-"}`);

      // Compute details client-side
      const hash = await sha256HexFromFile(picked);
      const details = {
        originalFilename: response.data?.original_filename ?? picked.name,
        storedFilename: response.data?.stored_as ?? "-",
        fileSize: picked.size,
        sha256: hash,
        score: response.data?.score ?? 0,
      };
      setAnalysis(details);
      setShowPanel(true);
    } catch (err) {
      setToast(err.response?.data?.detail || "Upload failed. Try again.");
    } finally {
      setUploading(false);
      // reset input so same file can be selected again
      event.target.value = "";
    }
  };

  return (
    <div className={`app ${showPanel ? "app-wide" : ""}`}>
      {/* Top bar */}
      <div className="topbar">
        <div>
          <h1 className="app-title">DFIR Analyzer</h1>
        </div>
        <div className="welcome">
          <span className="welcome-text">Welcome, John Doe</span>
          <div className="avatar" aria-label="Profile placeholder" />
        </div>
      </div>

      <div className={`dashboard-viewport ${showPanel ? "with-panel" : "centered"}`}>
        {/* Left: Dashboard */}
        <div className="dashboard-left">
          {/* Metric cards */}
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

          {/* Charts grid */}
          <div className="chart-grid">
            <div className="card">
              <div className="card-title">File Types</div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={{ background: "rgba(20,20,40,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                    <Pie data={fileTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} stroke="none">
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
                    <XAxis dataKey="time" stroke="#8b8b9b" tickLine={false} axisLine={false} label={{ value: "Time", position: "insideBottom", dy: 10, fill: "#8b8b9b" }} />
                    <YAxis stroke="#8b8b9b" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "rgba(20,20,40,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="scans" stroke="#9b7bff" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Upload CTA */}
          <div className="upload-cta">
            <input ref={hiddenFileInputRef} type="file" onChange={handleUpload} style={{ display: "none" }} />
            <button className={`upload-btn ${uploading ? "loading" : ""}`} onClick={triggerFilePicker} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload File"}
            </button>
            {toast && <div className="toast">{toast}</div>}
          </div>
        </div>

        {/* Right: Details Panel */}
        <aside className={`right-panel ${showPanel ? "visible" : "peek"}`}>
          {!analysis ? (
            <div className="panel-placeholder">Upload a file to view detailed analysis.</div>
          ) : (
            <div>
              <div className="panel-header">
                <div className="panel-title">Analysis Details</div>
                <button className="upload-btn" onClick={() => { setShowPanel(false); setAnalysis(null); }}>
                  New Analysis
                </button>
              </div>

              <div className="panel-section">
                <div className="panel-item"><span className="result-label">Original filename</span><span className="result-value">{analysis.originalFilename}</span></div>
                <div className="panel-item"><span className="result-label">Stored filename</span><span className="result-value" style={{ fontFamily: 'monospace' }}>{analysis.storedFilename}</span></div>
                <div className="panel-item"><span className="result-label">File size</span><span className="result-value">{formatBytes(analysis.fileSize)}</span></div>
                <div className="panel-item" style={{ alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span className="result-label">SHA256</span>
                  <span className="hash-field">
                    <span className="code-select">{analysis.sha256}</span>
                    <button className="copy-btn" onClick={() => handleCopy(analysis.sha256)}>Copy</button>
                  </span>
                </div>
                <div className="panel-item">
                  <span className="result-label">Risk score</span>
                  <span>
                    <span className={`score-bubble score-${getRiskBand(analysis.score)}`}>{analysis.score}</span>
                  </span>
                </div>
              </div>

              <div className="panel-section">
                <div className="card-title" style={{ marginLeft: 0, marginBottom: '0.5rem' }}>Recommendations</div>
                <p className="recommendation-text">{recommendationsFor(analysis.score)}</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default App;

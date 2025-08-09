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
  const hiddenFileInputRef = useRef(null);

  const triggerFilePicker = () => hiddenFileInputRef.current?.click();

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
    } catch (err) {
      setToast(err.response?.data?.detail || "Upload failed. Try again.");
    } finally {
      setUploading(false);
      // reset input so same file can be selected again
      event.target.value = "";
    }
  };

  return (
    <div className="app">
      {/* Top bar */}
      <div className="topbar">
        <div>
          <h1 className="app-title">DFIR Analyzer</h1>
        </div>
        <div className="welcome-text">Welcome, John Doe</div>
      </div>

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
  );
}

export default App;

import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "./Header";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function URLAnalysis() {
  const navigate = useNavigate();
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleScan = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    let url = urlInput.trim();
    if (!url) {
      setError("Please enter a URL to analyze.");
      return;
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/url/analyze`, { url });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score < 20) return "#1DB954";
    if (score < 40) return "#25CED1";
    if (score < 60) return "#F29E4C";
    if (score < 80) return "#FF6B6B";
    return "#C71F37";
  };

  const getCategoryColor = (cat) => {
    const map = {
      Low: "bg-green-500/20 text-green-400 border-green-500/30",
      Moderate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      Critical: "bg-red-500/20 text-red-400 border-red-500/30",
      Extreme: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    };
    return map[cat] || map.Low;
  };

  return (
    <div className="min-h-screen bg-[#0f1224] text-white">
      <Header name="Guest" token={null} />

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-6 text-purple-400 hover:text-purple-300 flex items-center gap-2 transition-colors"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            URL Security <span className="text-purple-400">Analysis</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl">
            Detect phishing attempts, malware distribution, and social engineering attacks
            hidden in URLs. Powered by AI-driven threat intelligence.
          </p>
        </div>
      </section>

      {/* Main Scanner */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <div className="bg-[#1a1d35] border border-purple-500/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Analyze URL</h2>
          
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="https://example.com/suspicious-link"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleScan(e)}
              className="flex-1 px-4 py-3 rounded-lg bg-[#0f1224] border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500"
            />
            <button
              onClick={handleScan}
              disabled={loading}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Analyzing..." : "Scan URL"}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {!result && !error && !loading && (
            <div className="text-center py-8 text-gray-400">
              Enter a URL above to begin security analysis
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* Risk Score */}
              <div className="flex items-center justify-between p-6 bg-[#0f1224] rounded-xl">
                <div>
                  <div className="text-gray-400 text-sm mb-1">Overall Risk Score</div>
                  <div className="text-3xl font-bold" style={{ color: getRiskColor(result.risk_score) }}>
                    {result.risk_score} / 100
                  </div>
                </div>
                <div className={`px-6 py-3 rounded-lg border ${getCategoryColor(result.category)}`}>
                  {result.category} Risk
                </div>
              </div>

              {/* URL Profile */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#0f1224] rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">Protocol</div>
                  <div className="font-mono">{result.profile.scheme}://</div>
                </div>
                <div className="p-4 bg-[#0f1224] rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">Domain</div>
                  <div className="font-mono truncate">{result.profile.host}</div>
                </div>
                <div className="p-4 bg-[#0f1224] rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">TLD</div>
                  <div className="font-mono">.{result.profile.tld}</div>
                </div>
                <div className="p-4 bg-[#0f1224] rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">URL Entropy</div>
                  <div>{result.profile.entropy.toFixed(2)}</div>
                </div>
              </div>

              {/* Threat Signals */}
              {result.signals && result.signals.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Detected Threats</h3>
                  <div className="space-y-3">
                    {result.signals.map((signal, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-lg border ${
                          signal.severity === "high"
                            ? "bg-red-500/10 border-red-500/30"
                            : signal.severity === "medium"
                            ? "bg-yellow-500/10 border-yellow-500/30"
                            : "bg-blue-500/10 border-blue-500/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">
                            {signal.severity === "high" ? "🚨" : signal.severity === "medium" ? "⚠️" : "ℹ️"}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold mb-1">{signal.description}</div>
                            {signal.evidence && (
                              <div className="text-sm text-gray-400">{signal.evidence}</div>
                            )}
                            {signal.remediation && (
                              <div className="text-sm text-purple-400 mt-2">
                                💡 {signal.remediation}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificate Info */}
              {result.profile.certificate && (
                <div className="p-6 bg-[#0f1224] rounded-xl">
                  <h3 className="text-xl font-bold mb-4">SSL Certificate</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Issuer:</span>{" "}
                      {result.profile.certificate.issuer || "Unknown"}
                    </div>
                    <div>
                      <span className="text-gray-400">Self-Signed:</span>{" "}
                      {result.profile.certificate.is_self_signed ? "Yes ⚠️" : "No ✓"}
                    </div>
                    {result.profile.certificate.days_until_expiry !== null && (
                      <div>
                        <span className="text-gray-400">Days Until Expiry:</span>{" "}
                        {result.profile.certificate.days_until_expiry}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Educational Content */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <h2 className="text-3xl font-bold mb-8">Understanding URL Threats</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-[#1a1d35] border border-purple-500/20 rounded-xl">
            <div className="text-4xl mb-4">🎣</div>
            <h3 className="text-xl font-bold mb-2">Phishing</h3>
            <p className="text-gray-400 text-sm">
              Fake websites impersonating legitimate brands to steal credentials.
              Look for misspelled domains and suspicious TLDs.
            </p>
          </div>

          <div className="p-6 bg-[#1a1d35] border border-purple-500/20 rounded-xl">
            <div className="text-4xl mb-4">🦠</div>
            <h3 className="text-xl font-bold mb-2">Malware Distribution</h3>
            <p className="text-gray-400 text-sm">
              URLs hosting viruses, ransomware, or trojans. Often use high-entropy
              randomized strings to evade detection.
            </p>
          </div>

          <div className="p-6 bg-[#1a1d35] border border-purple-500/20 rounded-xl">
            <div className="text-4xl mb-4">🎭</div>
            <h3 className="text-xl font-bold mb-2">Social Engineering</h3>
            <p className="text-gray-400 text-sm">
              Manipulative tactics using urgent language, fake security warnings,
              or impersonation to trick users.
            </p>
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-purple-900/20 to-purple-600/10 border border-purple-500/20 rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-6">🛡️ Best Practices</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-purple-400">✓</span>
              Always verify the domain before entering credentials
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400">✓</span>
              Check for HTTPS and valid SSL certificates
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400">✓</span>
              Be suspicious of URLs with unusual TLDs (.xyz, .top, .click)
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400">✓</span>
              Hover over links to preview destination before clicking
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400">✓</span>
              Use our URL scanner before visiting suspicious links
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
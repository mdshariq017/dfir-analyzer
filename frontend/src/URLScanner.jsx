// frontend/src/URLScanner.jsx
import React, { useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function URLScanner() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a URL to analyze.");
      return;
    }
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setError("URL must start with http:// or https://");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/url/analyze`, { url: trimmed });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Failed to analyze URL. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // tiny helpers
  const safeTI = result?.threat_intel || {};
  const signals = Array.isArray(result?.signals) ? result.signals : [];
  const recommendations = Array.isArray(result?.recommendations)
    ? result.recommendations
    : [];

  return (
    <div className="url-scanner-card">
      <h3 className="panel-title">URL Forensic Profiler</h3>
      <p className="panel-subtitle">
        Analyze a suspicious URL using SSL, DNS, entropy and content signals.
      </p>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="url-form">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/login"
          className="url-input"
        />
        <button
          type="submit"
          disabled={loading}
          className="url-submit-btn"
        >
          {loading ? "Analyzing..." : "Analyze URL"}
        </button>
      </form>

      {error && <div className="url-error">{error}</div>}

      {/* Results */}
      {result && (
        <div className="url-results">
          {/* Overall risk */}
          <div className="url-risk-summary">
            <div className="url-risk-score">
              <div className="url-risk-number">{result.risk_score}</div>
              <div className="url-risk-label">/ 100</div>
            </div>
            <div className="url-risk-category">{result.risk_category}</div>
            <div className="url-risk-url">{result.url}</div>
          </div>

          {/* Threat intelligence numbers */}
          <div className="url-threat-grid">
            <div className="url-threat-item">
              <div className="label">Phishing likelihood</div>
              <div className="value">
                {safeTI.phishing_likelihood ?? 0}/100
              </div>
            </div>
            <div className="url-threat-item">
              <div className="label">Malware likelihood</div>
              <div className="value">
                {safeTI.malware_likelihood ?? 0}/100
              </div>
            </div>
            <div className="url-threat-item">
              <div className="label">Social engineering</div>
              <div className="value">
                {safeTI.social_engineering_score ?? 0}/100
              </div>
            </div>
            <div className="url-threat-item">
              <div className="label">Infrastructure risk</div>
              <div className="value">
                {safeTI.infrastructure_risk ?? 0}/100
              </div>
            </div>
          </div>

          {/* URL profile */}
          <div className="url-profile">
            <h4>URL profile</h4>
            <div className="row">
              <span>Scheme</span>
              <span>{result.profile?.scheme?.toUpperCase() || "?"}</span>
            </div>
            <div className="row">
              <span>Host</span>
              <span>{result.profile?.host || "-"}</span>
            </div>
            <div className="row">
              <span>TLD</span>
              <span>{result.profile?.tld || "N/A"}</span>
            </div>
            <div className="row">
              <span>URL length</span>
              <span>{result.profile?.url_length ?? "-"}</span>
            </div>
            <div className="row">
              <span>Entropy</span>
              <span>{result.profile?.entropy ?? "-"}</span>
            </div>
            <div className="row">
              <span>Subdomains</span>
              <span>{result.profile?.subdomain_count ?? "-"}</span>
            </div>

            {result.profile?.certificate?.issuer && (
              <>
                <h5>SSL certificate</h5>
                <div className="row">
                  <span>Issuer</span>
                  <span>{result.profile.certificate.issuer}</span>
                </div>
                {result.profile.certificate.days_until_expiry != null && (
                  <div className="row">
                    <span>Expires in</span>
                    <span>
                      {result.profile.certificate.days_until_expiry} days
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Signals */}
          <div className="url-signals">
            <h4>Security signals</h4>
            {signals.length === 0 && (
              <p className="muted">No strong malicious signals detected.</p>
            )}
            {signals.map((s, i) => (
              <div key={i} className="signal-card">
                <div className="signal-header">
                  <span className="signal-type">{s.type}</span>
                  <span className={`signal-severity severity-${s.severity}`}>
                    {s.severity}
                  </span>
                </div>
                <div className="signal-desc">{s.description}</div>
                {s.evidence && (
                  <div className="signal-evidence">Evidence: {s.evidence}</div>
                )}
                {s.remediation && (
                  <div className="signal-remediation">
                    Recommendation: {s.remediation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="url-recommendations">
              <h4>Recommendations</h4>
              <ul>
                {recommendations.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
      setError("");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadResult(null);
      setError("");
    }
  };

  const getRiskColor = (score) => {
    if (score <= 40) return "low";
    if (score <= 70) return "medium";
    return "high";
  };

  const getRiskLabel = (score) => {
    if (score <= 40) return "Low Risk";
    if (score <= 70) return "Medium Risk";
    return "High Risk";
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      setError("");
      
      const response = await axios.post("http://127.0.0.1:8000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadResult(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setUploadResult(null);
    setError("");
    setIsUploading(false);
  };

  return (
    <div className="app">
      <div className="header">
        <h1 className="app-title">DFIR Analyzer</h1>
        <p className="app-subtitle">Digital Forensics & Incident Response Tool</p>
      </div>

      <div className={`upload-container ${dragActive ? 'drag-active' : ''}`}>
        <div 
          className="file-input-wrapper"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            onChange={handleFileChange}
            className="file-input"
            id="file-input"
            accept="*/*"
          />
          <label htmlFor="file-input" className="file-input">
            {file ? (
              <div>
                <strong>Selected File:</strong> {file.name}
                <br />
                <small>Size: {formatFileSize(file.size)}</small>
              </div>
            ) : (
              <div>
                <strong>📁 Choose a file</strong> or drag and drop here
                <br />
                <small>Supports all file types for forensic analysis</small>
              </div>
            )}
          </label>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`upload-btn ${isUploading ? 'loading' : ''}`}
          >
            {isUploading ? 'Analyzing...' : 'Analyze File'}
          </button>
          
          {uploadResult && (
            <button
              onClick={resetForm}
              className="upload-btn"
              style={{ 
                marginLeft: '1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              New Analysis
            </button>
          )}
        </div>

        {error && (
          <div className="error-message">
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}
      </div>

      {uploadResult && (
        <div className="result-card">
          <h2 style={{ marginBottom: '1.5rem', color: '#667eea' }}>
            📊 Analysis Results
          </h2>
          
          <div className="result-item">
            <span className="result-label">Original Filename:</span>
            <span className="result-value">{uploadResult.original_filename}</span>
          </div>
          
          <div className="result-item">
            <span className="result-label">Stored As:</span>
            <span className="result-value" style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {uploadResult.stored_as}
            </span>
          </div>
          
          <div className="result-item">
            <span className="result-label">Risk Assessment:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`risk-score ${getRiskColor(uploadResult.score)}`}>
                {uploadResult.score}
              </span>
              <span style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>
                ({getRiskLabel(uploadResult.score)})
              </span>
            </div>
          </div>
          
          <div className="result-item">
            <span className="result-label">Status:</span>
            <span className="result-value" style={{ color: '#22c55e' }}>
              ✅ {uploadResult.message}
            </span>
          </div>
          
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            background: 'rgba(102, 126, 234, 0.1)', 
            borderRadius: '10px',
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#667eea' }}>🔍 Analysis Summary</h3>
            <p style={{ color: '#a0a0a0', lineHeight: '1.6' }}>
              The file has been successfully analyzed and stored securely. 
              The risk score indicates the potential threat level based on file type and content analysis. 
              Lower scores suggest safer files, while higher scores may require further investigation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

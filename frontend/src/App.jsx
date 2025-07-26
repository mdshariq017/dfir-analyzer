import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadResult(null);
    setError("");
  };

  const getRiskColor = (score) => {
    if (score <= 40) return "green";
    if (score <= 70) return "orange";
    return "red";
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://127.0.0.1:8000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadResult(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Upload failed");
    }
  };

  return (
    <div className="app">
      <h1>DFIR File Upload</h1>

      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {uploadResult && (
        <div className="result-card">
          <p><strong>Original Filename:</strong> {uploadResult.original_filename}</p>
          <p><strong>Stored As:</strong> {uploadResult.stored_as}</p>
          <p>
            <strong>Risk Score:</strong>{" "}
            <span style={{ color: getRiskColor(uploadResult.score), fontWeight: "bold" }}>
              {uploadResult.score}
            </span>
          </p>
          <p>{uploadResult.message}</p>
        </div>
      )}
    </div>
  );
}

export default App;

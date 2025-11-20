import React, { useState } from "react";
import axios from "axios";
import URLScanner from "./URLScanner";

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const response = await axios.post(
        "http://127.0.0.1:8000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(`✅ Success: ${response.data.message || "File uploaded."}`);
    } catch (error) {
      setMessage(
        `❌ Error: ${error.response?.data?.detail || error.message}`
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1224] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* ================= FILE UPLOAD CARD ================= */}
        <div className="bg-[#1a1d35] border border-white/10 rounded-2xl p-6 shadow-lg max-w-xl">
          <h1 className="text-2xl font-bold mb-4">
            Upload File for Forensic Analysis
          </h1>

          <input
            type="file"
            onChange={handleFileChange}
            className="mb-4 block w-full text-sm text-gray-300"
          />

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>

          {message && (
            <p className="mt-4 text-sm text-gray-200 whitespace-pre-line">
              {message}
            </p>
          )}
        </div>

        {/* ================= URL SCANNER SECTION ================= */}
        {/* Your big URLScanner.jsx component is rendered here, on the same page */}
        <URLScanner/>
      </div>
    </div>
  );
};

export default UploadPage;

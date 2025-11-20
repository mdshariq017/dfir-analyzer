import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import App from "./App.jsx"; // dashboard
import Login from "./Login.jsx";
import Signup from "./Signup.jsx";
import URLAnalysis from "./URLAnalysis.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Logged-in dashboard */}
        <Route path="/dashboard" element={<App />} />

        {/* Guest/demo dashboard */}
        <Route path="/guest" element={<App />} />

        {/* URL Analysis */}
        <Route path="/dashboard/url-analysis" element={<URLAnalysis />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

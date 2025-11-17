import { useNavigate } from "react-router-dom";
import Spline from "@splinetool/react-spline";
import HeroHeader from "./HeroHeader";

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <HeroHeader />
      <main className="home-root"
        style={{
          position: "relative",
          width: "100vw", // full viewport width
          height: "100vh", // full viewport height
          backgroundColor: "#0f1224",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 0, // remove padding for edge-to-edge
          boxSizing: "border-box",
        }}
      >
      <Spline
        scene="https://prod.spline.design/uI6bfwNsCyuDfk-5/scene.splinecode"
        style={{ width: "100vw", height: "100vh" }}
      />

      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          maxWidth: 600,
          pointerEvents: "none",
          zIndex: 10, // above canvas
        }}
      >
        <h1
          style={{
            fontSize: "3rem",
            fontWeight: "bold",
            marginBottom: "0.5rem",
          }}
        >
          Welcome to DFIR Analyzer
        </h1>
        <p style={{ fontSize: "1.2rem", lineHeight: 1.5 }}>
          A powerful digital forensics and incident response tool for analyzing
          threat risks.
        </p>
      </div>

      <button
        onClick={() => navigate("/dashboard")}
        style={{
          position: "absolute",
          bottom: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "0.75rem 2rem",
          fontSize: "1.25rem",
          fontWeight: "bold",
          borderRadius: "6px",
          border: "none",
          backgroundColor: "#6C63FF",
          color: "white",
          cursor: "pointer",
          pointerEvents: "auto",
          zIndex: 10, // above canvas
        }}
        aria-label="Start"
      >
        Start
      </button>
    </main>
    </>
  );
}

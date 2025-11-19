"use client";

import React from "react";
import TextType from "./TextType";

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center text-center pt-32 pb-20 overflow-hidden bg-[#0f1224] min-h-screen">
      {/* Background blob */}
      <div className="absolute inset-0 flex justify-center">
        <div className="absolute top-1/4 z-10 w-[700px] h-[700px] bg-[#6C63FF]/20 rounded-full blur-[140px] hidden sm:block" />
      </div>

      <div className="relative z-20 max-w-4xl mx-auto px-4">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
          Streamline Your
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
            <TextType
              text={["Digital Forensics", "Incident Response"]}
              typingSpeed={100}
              deletingSpeed={50}
              pauseDuration={2000}
              showCursor={true}
              cursorCharacter="|"
              cursorClassName="text-purple-400"
              loop={true}
              as="span"
              className="inline-block"
            />
          </span>
        </h1>

        <p className="text-gray-400 mt-6 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
          Automated analysis of RAW images, disk evidence, and suspicious files with
          AI-powered threat detection and comprehensive reporting.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <button className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-purple-500/50">
            Use Free Scan
          </button>
        </div>
      </div>

      {/* Animated Lock Visualization */}
      <div className="relative z-30 mt-20 mb-16">
        <div className="relative w-[350px] h-[350px] sm:w-[450px] sm:h-[450px]">
          {/* Outer rotating circle with binary */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-full h-full opacity-60 hero-spin-slow"
              viewBox="0 0 400 400"
            >
              <defs>
                <path
                  id="outer-circle-path"
                  d="M 200, 200 m -180, 0 a 180,180 0 1,1 360,0 a 180,180 0 1,1 -360,0"
                />
              </defs>
              <circle
                cx="200"
                cy="200"
                r="180"
                className="stroke-purple-500/20 fill-none"
                strokeWidth="1"
              />
              <text className="text-[9px] fill-purple-400/50 font-mono">
                <textPath href="#outer-circle-path">
                  100101110010100101110010100101110010100101110010100101110010100101110010100101110011010101010101010101011111000001110000111000111000
                </textPath>
              </text>
            </svg>
          </div>

          {/* Middle rotating ring */}
          <div className="absolute inset-0 flex items-center justify-center hero-spin-reverse">
            <div
              className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] rounded-full border-2 border-purple-500/30"
              style={{
                background:
                  "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
              }}
            />
          </div>

          {/* Inner glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] rounded-full bg-purple-600/40 blur-3xl hero-pulse-slow" />
          </div>

          {/* Lock Icon */}
          <div className="absolute inset-0 flex items-center justify-center hero-float">
            <svg className="w-40 h-40 sm:w-48 sm:h-48" viewBox="0 0 200 200" fill="none">
              <rect
                x="60"
                y="90"
                width="80"
                height="70"
                rx="8"
                className="stroke-purple-400 fill-purple-600/20"
                strokeWidth="4"
                style={{ filter: "drop-shadow(0 0 25px rgba(168, 85, 247, 0.8))" }}
              />
              <path
                d="M 75 90 L 75 65 Q 75 35, 100 35 Q 125 35, 125 65 L 125 90"
                className="stroke-purple-400 fill-none"
                strokeWidth="4"
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 25px rgba(168, 85, 247, 0.8))" }}
              />
              <circle
                cx="100"
                cy="115"
                r="10"
                className="fill-purple-300"
                style={{ filter: "drop-shadow(0 0 15px rgba(216, 180, 254, 0.9))" }}
              />
              <rect
                x="95"
                y="122"
                width="10"
                height="22"
                rx="2"
                className="fill-purple-300"
                style={{ filter: "drop-shadow(0 0 15px rgba(216, 180, 254, 0.9))" }}
              />
            </svg>
          </div>

          {/* Decorative plus signs */}
          <div className="absolute top-4 right-8 text-purple-500/70 text-3xl hero-pulse font-light">
            +
          </div>
          <div className="absolute bottom-12 left-4 text-purple-500/70 text-3xl hero-pulse delay-500 font-light">
            +
          </div>
          <div className="absolute top-16 left-12 text-purple-500/50 text-xl hero-pulse delay-700 font-light">
            +
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f1224] to-transparent z-10" />

      {/* Global keyframes for hero animations */}
      <style jsx global>{`
        @keyframes hero-spin-keyframes {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes hero-spin-reverse-keyframes {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes hero-pulse-keyframes {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes hero-float-keyframes {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .hero-spin-slow {
          animation: hero-spin-keyframes 20s linear infinite;
          transform-origin: 50% 50%;
          transform-box: fill-box;
        }

        .hero-spin-reverse {
          animation: hero-spin-reverse-keyframes 25s linear infinite;
          transform-origin: 50% 50%;
          transform-box: fill-box;
        }

        .hero-pulse-slow {
          animation: hero-pulse-keyframes 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .hero-pulse {
          animation: hero-pulse-keyframes 2.5s ease-in-out infinite;
        }

        .hero-float {
          animation: hero-float-keyframes 6s ease-in-out infinite;
        }

        .delay-500 {
          animation-delay: 500ms;
        }

        .delay-700 {
          animation-delay: 700ms;
        }
      `}</style>
    </section>
  );
}

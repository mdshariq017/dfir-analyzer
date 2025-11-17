// components/Hero.client.tsx
"use client";
import React, { useEffect, useState } from "react";
import Spline from "@splinetool/react-spline"; // safe, because this file is client-only

export default function HeroClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // any Math.random(), Date.now(), window access can live here
  const seed = mounted ? Math.random() : 0;

  return (
    <section className="relative flex flex-col items-center text-center pt-32">
      <div className="relative z-20 max-w-4xl mx-auto px-4">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Digital Forensics
          </span>
        </h1>
        <p className="text-gray-400 mt-6 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
          Automated analysis of RAW images, disk evidence, and suspicious files with AI-powered tools.
        </p>

        {/* Place browser-only widget like Spline here */}
        <div className="mt-10 w-full flex justify-center">
          {mounted && (
            <div style={{ width: 450, height: 450 }}>
              <Spline scene="https://prod.spline.design/your-scene-url/scene.splinecode" />
            </div>
          )}
        </div>
      </div>

      {/* other client-only interactive bits */}
    </section>
  );
}

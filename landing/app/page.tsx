"use client";

import React from "react";
import dynamic from "next/dynamic";

import Nav from "./components/Nav";
import Footer from "./components/Footer";
import Defense from "./components/Defense";
import Info from "./components/Info";
import Contact from "./components/Contact";

// Hero (and optionally Features) are animation-heavy → client-only, no SSR
const Hero = dynamic(() => import("./components/Hero"), { ssr: false });
const Features = dynamic(() => import("./components/Features"), { ssr: false });
// if Features behaves fine you can also just import it normally instead

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0f1224] text-white antialiased">
      <Nav />
      <main>
        <Hero />
        <Features />
        <Defense />
        <Info />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

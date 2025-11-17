"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0f1224]/80 backdrop-blur-md border-b border-white/10">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DF</span>
          </div>
          <span className="text-white font-semibold text-xl">DFIR Analyzer</span>
        </div>

        {/* Center Navigation */}
        <ul className="hidden md:flex items-center gap-10 text-gray-300 text-sm">
          <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
          <li><Link href="#analysis" className="hover:text-white transition">Analysis</Link></li>
          <li><Link href="#timeline" className="hover:text-white transition">Timeline</Link></li>
          <li><Link href="#contact" className="hover:text-white transition">Contact</Link></li>
        </ul>

        {/* Right side buttons */}
        <div className="flex items-center gap-4">
          <Link href="http://localhost:5173/login" className="text-gray-300 hover:text-white transition text-sm">
            Login
          </Link>
          <Link 
            href="http://localhost:5173/signup" 
            className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm transition"
          >
            Signup
          </Link>
        </div>

      </nav>
    </header>
  );
}
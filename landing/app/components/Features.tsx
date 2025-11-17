"use client";

import React from "react";
import { PiFastForwardThin } from 'react-icons/pi';
import { FcDataProtection } from 'react-icons/fc';
import { VscWorkspaceTrusted } from 'react-icons/vsc';
import { VscSourceControl } from 'react-icons/vsc';
import { AiOutlineCompress } from 'react-icons/ai';
import { PiEscalatorUpThin } from 'react-icons/pi';

export default function Features() {
  return (
    <section className="relative py-0 pb-20 text-center bg-[#0f1224]">

      <div className="relative z-20 mb-12">
        <h1 className="text-5xl md:text-6xl font-bold text-white">
          Advanced <span className="text-purple-400">Forensic Analysis</span>
        </h1>
        <p className="text-gray-400 mt-4 text-lg">
          AI-powered digital forensics and incident response tools for modern investigations.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/5">

        <div className="relative flex flex-col items-center justify-center py-12 text-center border border-white/5 bg-gradient-to-t from-transparent to-transparent hover:from-[#FFFFFF]/6 hover:to-[#FFFFFF]/0 transition-all duration-200 overflow-hidden">
          <h3 className="text-white font-semibold text-lg mb-2">
            <PiFastForwardThin className="w-12 h-12 mx-auto" /> Automated Collection
          </h3>
          <p className="text-gray-400 text-sm max-w-xs">
            Extract data from RAW images and forensic formats instantly
          </p>
        </div>

        <div className="relative flex flex-col items-center justify-center py-12 text-center border border-white/5 bg-gradient-to-t from-transparent to-transparent hover:from-[#FFFFFF]/6 hover:to-[#FFFFFF]/0 transition-all duration-200 overflow-hidden">
          <h3 className="text-white font-semibold text-lg mb-2">
            <FcDataProtection className="w-12 h-12 mx-auto" /> AI-Powered Detection
          </h3>
          <p className="text-gray-400 text-sm max-w-xs">
            Machine learning algorithms for anomaly and pattern recognition
          </p>
        </div>

        <div className="relative flex flex-col items-center justify-center py-12 text-center border border-white/5 bg-gradient-to-t from-transparent to-transparent hover:from-[#FFFFFF]/6 hover:to-[#FFFFFF]/0 transition-all duration-200 overflow-hidden">
          <h3 className="text-white font-semibold text-lg mb-2">
            <VscWorkspaceTrusted className="w-12 h-12 mx-auto" /> IOC Identification
          </h3>
          <p className="text-gray-400 text-sm max-w-xs">
            Detect indicators of compromise and suspicious activities
          </p>
        </div>

        <div className="relative flex flex-col items-center justify-center py-12 text-center border border-white/5 bg-gradient-to-t from-transparent to-transparent hover:from-[#FFFFFF]/6 hover:to-[#FFFFFF]/0 transition-all duration-200 overflow-hidden">
          <h3 className="text-white font-semibold text-lg mb-2">
            <PiEscalatorUpThin className="w-12 h-12 mx-auto" /> Interactive Timeline
          </h3>
          <p className="text-gray-400 text-sm max-w-xs">
            Visualize file activity and system events chronologically
          </p>
        </div>

        <div className="relative flex flex-col items-center justify-center py-12 text-center border border-white/5 bg-gradient-to-t from-transparent to-transparent hover:from-[#FFFFFF]/6 hover:to-[#FFFFFF]/0 transition-all duration-200 overflow-hidden">
          <h3 className="text-white font-semibold text-lg mb-2">
            <VscSourceControl className="w-12 h-12 mx-auto" /> Smart Scoring System
          </h3>
          <p className="text-gray-400 text-sm max-w-xs">
            Risk assessment engine to prioritize critical artifacts
          </p>
        </div>

        <div className="relative flex flex-col items-center justify-center py-12 text-center border border-white/5 bg-gradient-to-t from-transparent to-transparent hover:from-[#FFFFFF]/6 hover:to-[#FFFFFF]/0 transition-all duration-200 overflow-hidden">
          <h3 className="text-white font-semibold text-lg mb-2">
            <AiOutlineCompress className="w-12 h-12 mx-auto" /> Multi-Format Export
          </h3>
          <p className="text-gray-400 text-sm max-w-xs">
            Generate reports in PDF, JSON, and CSV formats
          </p>
        </div>

      </div>

    </section>
  );
}

"use client";

import React from 'react';
import { FiShield, FiActivity, FiLock, FiZap } from 'react-icons/fi';

const Defense = () => {
  const defenseFeatures = [
    {
      icon: <FiShield className="w-8 h-8" />,
      title: "Threat Intelligence",
      description: "Real-time threat detection using machine learning algorithms and global threat databases.",
      stats: "99.9% Detection Rate"
    },
    {
      icon: <FiActivity className="w-8 h-8" />,
      title: "Behavioral Analysis",
      description: "Monitor and analyze system behavior patterns to identify anomalies and potential breaches.",
      stats: "Real-time Monitoring"
    },
    {
      icon: <FiLock className="w-8 h-8" />,
      title: "Evidence Preservation",
      description: "Maintain chain of custody with cryptographic hashing and secure evidence storage.",
      stats: "Court-Ready Reports"
    },
    {
      icon: <FiZap className="w-8 h-8" />,
      title: "Rapid Response",
      description: "Automated incident response workflows to contain threats within minutes, not hours.",
      stats: "< 5 min Response"
    }
  ];

  return (
    <section id="analysis" className="relative py-24 bg-gradient-to-b from-[#0f1224] to-[#1a1d35] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(108, 99, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(108, 99, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-sm font-semibold">
              Defense & Response
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Multi-Layered Protection
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Comprehensive defense mechanisms powered by AI to detect, analyze, and respond to digital threats.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {defenseFeatures.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-[#1a1d35] border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300"
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-purple-600/0 group-hover:from-purple-600/5 group-hover:to-transparent rounded-2xl transition-all duration-300" />
              
              <div className="relative z-10">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400 mb-6 group-hover:scale-110 group-hover:bg-purple-600/30 transition-all duration-300">
                  {feature.icon}
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 mb-4 leading-relaxed">
                  {feature.description}
                </p>

                {/* Stats Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/10 border border-purple-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  <span className="text-purple-300 text-sm font-semibold">
                    {feature.stats}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <button className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-purple-500/50">
              Start Free Trial
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-purple-500 hover:bg-purple-500/10 text-white font-semibold rounded-lg transition-all">
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Defense;
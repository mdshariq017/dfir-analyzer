import React from "react";

const Defense = () => {
  return (
    <section className="relative py-30 text-center bg-[#0f1224]">
      <div className="relative z-20 mb-0">
        <h1 className="text-5xl md:text-6xl font-bold text-white">
          Comprehensive Forensic Analysis
        </h1>
        <p className="text-gray-400 mt-4 text-lg">
          Our platform uses machine learning and behavioral modeling to identify<br />
          indicators of compromise before they escalate.
        </p>
      </div>

      <div className="flex w-auto mx-auto items-center justify-center overflow-hidden">
        <img
          src="/defense.png"
          alt="Analysis Interface"
          width={750}
          height={500}
          className="rounded-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1224]/50 to-[#1D1C20]/0 pointer-events-none rounded-2xl"></div>
      </div>

      <div className="relative overflow-hidden w-[1200px] mx-auto pl-2.5">
        {/* Action buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-t-lg overflow-hidden pr-2">
          <div className="p-4 border border-[#1f1c2e]/80 md:border-b-0 md:border-r flex items-center justify-center gap-2">
            {/* Try FREE VERSION → guest dashboard */}
            <a
              href="http://localhost:5173/guest"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-[#1f1c2e] transition-colors inline-flex items-center justify-center"
            >
              Try Free Version
            </a>
          </div>
          <div className="p-4 border border-[#1f1c2e]/80 md:border-b-0 md:border-r flex items-center justify-center gap-2">
            <a
              href="http://localhost:5173/signup"
              className="px-6 py-3 bg-[#1f1c2e] text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center justify-center"
            >
              Get Started
            </a>
          </div>
        </div>

        {/* Capabilities list */}
        {/* ...rest of your code unchanged... */}
      </div>
    </section>
  );
};

export default Defense;

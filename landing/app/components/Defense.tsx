import React from 'react'

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
                        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-[#1f1c2e] transition-colors">
                            Try Demo
                        </button>
                    </div>
                    <div className="p-4 border border-[#1f1c2e]/80 md:border-b-0 md:border-r flex items-center justify-center gap-2">
                        <button className="px-6 py-3 bg-[#1f1c2e] text-white rounded-lg hover:bg-purple-700 transition-colors">
                            Get Started
                        </button>
                    </div>
                </div>

                {/* Capabilities list */}
                <div className="max-h-48 scroll-custom overflow-y-auto border border-t-0 border-[#1f1c2e]/80 rounded-b-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                        <div className="p-4 border border-[#1f1c2e]/80 md:border-b-0 md:border-r flex items-center justify-start gap-2">
                            <img src="/verify2.png" width={30} height={30} alt="check" />
                            RAW disk image analysis (.dd, .img, .raw)
                        </div>
                        <div className="p-4 border border-[#1f1c2e]/80 md:border-b-0 md:border-r flex items-center justify-start gap-2">
                            <img src="/verify2.png" width={30} height={30} alt="check" />
                            Automated file extraction and cataloging
                        </div>
                        <div className="p-4 border border-[#1f1c2e]/80 md:border-b-0 md:border-r flex items-center justify-start gap-2">
                            <img src="/verify2.png" width={30} height={30} alt="check" />
                            AI-powered malware and threat detection
                        </div>
                        <div className="p-4 border border-[#1f1c2e]/80 md:border-b-0 md:border-r flex items-center justify-start gap-2">
                            <img src="/verify2.png" width={30} height={30} alt="check" />
                            SHA256 hash verification and integrity checks
                        </div>
                        <div className="p-4 border border-[#1f1c2e]/80 md:border-b-0 md:border-r flex items-center justify-start gap-2">
                            <img src="/verify2.png" width={30} height={30} alt="check" />
                            Real-time file system timeline generation
                        </div>
                        <div className="p-4 border border-[#1f1c2e]/80 md:border-b-0 md:border-r flex items-center justify-start gap-2">
                            <img src="/verify2.png" width={30} height={30} alt="check" />
                            Suspicious artifact flagging (PE, scripts, macros)
                        </div>
                        <div className="p-4 border border-[#1f1c2e]/80 md:border-b-0 md:border-r flex items-center justify-start gap-2">
                            <img src="/verify2.png" width={30} height={30} alt="check" />
                            Interactive data visualization dashboards
                        </div>
                        <div className="p-4 border border-[#1f1c2e]/80 md:border-b-0 md:border-r flex items-center justify-start gap-2">
                            <img src="/verify2.png" width={30} height={30} alt="check" />
                            Entropy analysis for encrypted payloads
                        </div>
                        <div className="p-4 border border-[#1f1c2e]/80 md:border-b-0 md:border-r flex items-center justify-start gap-2">
                            <img src="/verify2.png" width={30} height={30} alt="check" />
                            Risk scoring with ML confidence levels
                        </div>
                        <div className="p-4 border border-[#1f1c2e]/80 md:border-b-0 md:border-r flex items-center justify-start gap-2">
                            <img src="/verify2.png" width={30} height={30} alt="check" />
                            Comprehensive reporting (PDF, JSON, CSV)
                        </div>
                        <div className="p-4 border border-[#1f1c2e]/80 md:border-b-0 md:border-r flex items-center justify-start gap-2">
                            <img src="/verify2.png" width={30} height={30} alt="check" />
                            Chain of custody documentation
                        </div>
                        <div className="p-4 border border-[#1f1c2e]/80 md:border-b-0 md:border-r flex items-center justify-start gap-2">
                            <img src="/verify2.png" width={30} height={30} alt="check" />
                            Multi-platform evidence support
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-[#ffffff]/0 pointer-events-none rounded-2xl"></div>
                </div>
            </div>

        </section>
    )
}

export default Defense
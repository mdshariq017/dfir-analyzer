import React from "react";

const Info = () => {
    return (
        <section className="relative flex flex-col items-center justify-center py-32 bg-[#0f1224] overflow-hidden">
            {/* Background radar effect */}
            <div className="absolute inset-0 pt-[200px] flex items-center justify-center">
                <img
                    src="/vector.png"
                    alt="radar background"
                    className="w-[700px] md:w-[900px] opacity-100 z-10"
                />
                {/* Center glow */}
                <img
                    src="/leen.png"
                    alt="center glow"
                    className="absolute w-[700px] md:w-[700px] z-20"
                />
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1224] via-[#0f1224]/40 to-transparent z-30"></div>

            {/* Content */}
            <div className="relative z-40 text-center px-6">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                    Never Miss Critical Evidence
                </h1>
                <p className="text-gray-300 max-w-2xl mx-auto text-lg">
                    Automated evidence collection, intelligent analysis, and comprehensive reporting for faster investigations.
                </p>
            </div>

            <img
                src="/star.png"
                alt="Star decoration"
                width={80}
                height={80}
                className="absolute z-40 ml-180 rounded-2xl shadow-2xl overflow-hidden"
            />
            <img
                src="/star.png"
                alt="Star decoration"
                width={80}
                height={80}
                className="absolute z-40 mr-200 mt-[280px] rounded-2xl shadow-2xl overflow-hidden"
            />

            <div className="relative z-40 text-start px-6">
                <div className="mt-10 flex flex-col md:flex-row justify-center gap-10 border-[#FFFFFF]/6 rounded-lg text-sm w-[800px] text-gray-400 border">
                    <div className="flex-1 ml-5 mt-5 mb-5">
                        <h3 className="font-semibold text-white text-3xl mb-1">AI-Driven Analysis</h3>
                        <p className="text-gray-400 mt-4 text-lg">
                            Leverage machine learning to automatically detect IOCs, malware signatures, and suspicious patterns in evidence.
                        </p>
                    </div>

                    <div className="flex-1 text-left mt-5 mb-5 mr-5">
                        <h3 className="font-semibold text-white text-3xl mb-1">Complete Visibility</h3>
                        <p className="text-gray-400 mt-4 text-lg">
                            Track file timelines, registry changes, and network artifacts with interactive visualizations and detailed logs.
                        </p>
                    </div>
                </div>
            </div>

        </section>
    );
};

export default Info;
"use client";

import { 
    CheckCircle2, 
    UploadCloud, 
    ScanSearch, 
    BrainCircuit, 
    Sparkles, 
    ShieldCheck, 
    Loader2 
} from "lucide-react";

interface ProcessStatusProps {
    currentStep: number;
    progress: number;
    statusMessage: string;
    isProcessing: boolean;
}

export function ProcessStatus({
    progress,
    statusMessage,
}: ProcessStatusProps) {
    const steps = [
        { id: 1, title: "Upload", threshold: 0, icon: UploadCloud, color: "text-sky-400", border: "border-sky-500", shadow: "shadow-sky-500/50" },
        { id: 2, title: "Analyze", threshold: 20, icon: ScanSearch, color: "text-violet-400", border: "border-violet-500", shadow: "shadow-violet-500/50" },
        { id: 3, title: "Plan", threshold: 40, icon: BrainCircuit, color: "text-fuchsia-400", border: "border-fuchsia-500", shadow: "shadow-fuchsia-500/50" },
        { id: 4, title: "Generate", threshold: 60, icon: Sparkles, color: "text-amber-400", border: "border-amber-500", shadow: "shadow-amber-500/50" },
        { id: 5, title: "Validate", threshold: 80, icon: ShieldCheck, color: "text-emerald-400", border: "border-emerald-500", shadow: "shadow-emerald-500/50" },
    ];

    return (
        <div className="w-full py-4 px-1">
            {/* Status Header */}
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-violet-500 to-amber-500 animate-gradient-xy mb-1">
                    {progress === 100 ? "Exam Ready!" : "AI Processing"}
                </h3>
                <p className="text-slate-400 text-xs font-mono tracking-wide truncate">
                    {`>> ${statusMessage || "Initializing..."}`}
                    <span className="animate-pulse">_</span>
                </p>
            </div>

            {/* Flow Visualization */}
            <div className="relative w-full h-16 flex items-center justify-center px-1">
                {/* 1. Background Track */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 rounded-full overflow-hidden">
                     <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] animate-[shimmer_2s_infinite]"></div>
                </div>

                {/* 2. Active Liquid Line */}
                <div 
                    className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-gradient-to-r from-sky-500 via-violet-500 to-amber-500 shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-all duration-700 ease-out rounded-full z-0"
                    style={{ width: `${progress}%` }}
                >
                    {/* Head Flare */}
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full blur-[1px] shadow-[0_0_8px_white]"></div>
                </div>

                {/* 3. Steps Nodes */}
                <div className="absolute inset-0 w-full h-full">
                    {steps.map((step, index) => {
                        const isCompleted = progress > step.threshold + 15;
                        const isActive = progress >= step.threshold && progress < (step.threshold + 20);
                        
                        const position = `${(index / (steps.length - 1)) * 100}%`;

                        return (
                            <div 
                                key={step.id} 
                                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center group transition-all duration-500"
                                style={{ 
                                    left: position, 
                                    transform: `translate(-${index === steps.length - 1 ? 100 : (index === 0 ? 0 : 50)}%, -50%)` 
                                }}
                            >
                                {/* Node Circle */}
                                <div className={`
                                    relative z-10 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center border transition-all duration-500
                                    ${isCompleted 
                                        ? `bg-[#0A0A0A] ${step.border} ${step.shadow} scale-100 rotate-0` 
                                        : isActive 
                                            ? `bg-[#0A0A0A] ${step.border} ${step.shadow} scale-110 -rotate-3` 
                                            : "bg-[#0A0A0A] border-white/10 scale-90 rotate-45 opacity-50 grayscale"
                                    }
                                `}>
                                    <div className={`transition-all duration-500 ${isActive ? "scale-110" : "scale-100"}`}>
                                        {isCompleted ? (
                                            <CheckCircle2 className={`w-4 h-4 md:w-5 md:h-5 ${step.color}`} />
                                        ) : isActive ? (
                                            <step.icon className={`w-4 h-4 md:w-5 md:h-5 ${step.color} ${
                                                step.id === 1 ? "animate-bounce" :
                                                step.id === 2 ? "animate-pulse" :
                                                step.id === 3 ? "animate-spin-slow" :
                                                step.id === 4 ? "animate-pulse" :
                                                "animate-ping-slow"
                                            }`} />
                                        ) : (
                                            <step.icon className="w-3 h-3 md:w-4 md:h-4 text-slate-600 -rotate-45" />
                                        )}
                                    </div>
                                    
                                    {/* Active Glow Ring */}
                                    {isActive && (
                                        <div className={`absolute inset-0 rounded-lg ${step.border} border opacity-50 animate-ping`}></div>
                                    )}
                                </div>

                                {/* Title Label - Hidden on very small screens or abbreviated */}
                                <div className={`
                                    absolute -bottom-6 text-[8px] md:text-[10px] font-bold uppercase tracking-wider transition-all duration-500 whitespace-nowrap px-1 py-0.5 rounded
                                    ${isActive 
                                        ? "text-white bg-white/5 translate-y-0 opacity-100" 
                                        : isCompleted 
                                            ? `${step.color} translate-y-0 opacity-80` 
                                            : "text-slate-700 translate-y-1 opacity-0"
                                    }
                                `}>
                                    {step.title}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

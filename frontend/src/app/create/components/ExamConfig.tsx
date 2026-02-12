"use client";

import { useEffect } from "react";
import { FileText, BookOpen, Scale, HelpCircle, Layers, ListChecks } from "lucide-react";

interface ExamConfigProps {
    config: {
        passageType: number;
        totalQuestions: number;
        numQuestionTypes: number;
    };
    onChange: (config: Partial<ExamConfigProps["config"]>) => void;
    disabled?: boolean;
}

export function ExamConfig({
    config,
    onChange,
    disabled = false,
}: ExamConfigProps) {
    
    // Default values if not set
    useEffect(() => {
        if (!config.passageType) onChange({ passageType: 1 });
        if (!config.totalQuestions) onChange({ totalQuestions: 14 });
        if (!config.numQuestionTypes) onChange({ numQuestionTypes: 3 });
    }, []);

    const passageTypes = [
        { 
            value: 1, 
            label: "Passage 1", 
            description: "Descriptive/Factual texts (easiest)",
            icon: FileText
        },
        { 
            value: 2, 
            label: "Passage 2", 
            description: "Discursive texts (medium difficulty)",
            icon: BookOpen
        },
        { 
            value: 3, 
            label: "Passage 3", 
            description: "Argumentative texts (hardest)",
            icon: Scale
        },
    ];

    return (
        <div className={`w-full transition-all duration-300 ease-in-out font-sans ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
            <div className="space-y-8">
                
                {/* Passage Type */}
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Reading Passage Type
                    </h3>
                    <div className="space-y-3">
                        {passageTypes.map((type) => {
                            const Icon = type.icon;
                            const isSelected = config.passageType === type.value;
                            
                            return (
                                <div key={type.value} 
                                    onClick={() => !disabled && onChange({ passageType: type.value })}
                                    className={`
                                        relative flex items-center p-4 rounded-xl border border-transparent transition-all cursor-pointer group
                                        ${disabled ? "cursor-not-allowed opacity-50" : ""}
                                        ${isSelected 
                                            ? "bg-red-500/10 border-red-500/50" 
                                            : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                                        }
                                    `}
                                >
                                    <div className={`p-3 rounded-lg mr-4 transition-colors ${isSelected ? "bg-red-500 text-white" : "bg-white/5 text-slate-400"}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-semibold ${isSelected ? "text-white" : "text-slate-200"}`}>
                                            {type.label}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {type.description}
                                        </div>
                                    </div>
                                    
                                    {isSelected && (
                                        <div className="absolute right-4 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Total Questions */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4" />
                            Questions Count
                        </h3>
                        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-white font-bold text-2xl">{config.totalQuestions}</span>
                                <span className="text-xs text-slate-500">Standard: 13-14</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="20"
                                step="1"
                                value={config.totalQuestions}
                                onChange={(e) => onChange({ totalQuestions: parseInt(e.target.value) })}
                                disabled={disabled}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                                <span>10</span>
                                <span>20</span>
                            </div>
                        </div>
                    </div>

                    {/* Question Types */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ListChecks className="w-4 h-4" />
                            Variety
                        </h3>
                        <div className="grid grid-cols-2 gap-3 h-[calc(100%-2rem)]">
                            {[2, 3].map((num) => {
                                const isSelected = config.numQuestionTypes === num;
                                return (
                                    <div 
                                        key={num}
                                        onClick={() => !disabled && onChange({ numQuestionTypes: num })}
                                        className={`
                                            flex flex-col items-center justify-center rounded-xl border transition-all cursor-pointer
                                            ${disabled ? "cursor-not-allowed opacity-50" : ""}
                                            ${isSelected 
                                                ? "bg-red-500/10 border-red-500/50 text-white" 
                                                : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                                            }
                                        `}
                                    >
                                        <span className="text-xl font-bold">{num}</span>
                                        <span className="text-[10px] uppercase tracking-wider opacity-70">Types</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

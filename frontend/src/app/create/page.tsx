"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileUpload } from "./components/FileUpload";
import { ExamConfig } from "./components/ExamConfig";
import { ProcessStatus } from "./components/ProcessStatus";
import { SessionList } from "./components/SessionList";
import { api } from "@/lib/api";
import { UserMenu } from "@/components/auth/UserMenu";
import { useSession } from "next-auth/react";
import { Upload, Settings, Play, ArrowRight, Loader2, FileText, AlertCircle, CheckCircle2, UploadCloud } from "lucide-react";

export default function CreateExam() {
    const router = useRouter();
    const { data: session } = useSession();
    const userId = (session?.user as any)?.id;
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState("");
    const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Exam configuration state
    const [examConfig, setExamConfig] = useState({
        passageType: 1,
        totalQuestions: 14,
        numQuestionTypes: 3,
    });

    const handleFileSelected = (
        selectedFile: File | null,
        selectedUrl: string,
        method: "file" | "url"
    ) => {
        setFile(selectedFile);
        setFileUrl(selectedUrl);
        setUploadMethod(method);
        setError(null);
    };

    const handleConfigChange = (config: Partial<typeof examConfig>) => {
        setExamConfig({ ...examConfig, ...config });
    };

    const handleProcess = async () => {
        if (!file && !fileUrl) {
            setError("Please upload a file or provide a URL");
            return;
        }

        setError(null);
        setIsProcessing(true);
        setCurrentStep(1);
        setProgress(10);
        setStatusMessage("Initializing session...");

        try {
            // STEP 1: Upload & Extract (Real API Call)
            setStatusMessage("Uploading document and extracting text...");
            setProgress(20);
            
            const fileToUpload = uploadMethod === "file" ? (file || undefined) : undefined;
            const urlToUpload = uploadMethod === "url" ? (fileUrl || undefined) : undefined;
            
            const apiSession = await api.createSession(fileToUpload, urlToUpload);
            
            setSessionId(apiSession.session_id);
            
            // Start the generation process (Background Task)
            await api.generateIelts(apiSession.session_id, {
                passage_type: examConfig.passageType,
                total_questions: examConfig.totalQuestions,
                num_question_types: examConfig.numQuestionTypes,
            });

            // Set initial state for Step 2
            setCurrentStep(2);
            setStatusMessage("Starting exam generation...");

            // Polling function
            let pollInterval: NodeJS.Timeout | null = null;
            
            const pollStatus = async () => {
                try {
                    const status = await api.getExamStatus(apiSession.session_id);
                    
                    if (status.status === "failed") {
                        if (pollInterval) clearInterval(pollInterval);
                        setError(status.message || "Generation failed");
                        setIsProcessing(false);
                        return;
                    }

                    if (status.status === "completed") {
                        if (pollInterval) clearInterval(pollInterval);
                        setCurrentStep(5);
                        setProgress(100);
                        setStatusMessage("Exam generated successfully! Redirecting...");
                        setTimeout(() => {
                            router.push(`/exam/${apiSession.session_id}`);
                        }, 1000);
                        return;
                    }

                    // Map status to steps
                    let step = 2;
                    let msg = "Processing...";
                    
                    switch (status.status) {
                        case "queued":
                            step = 2;
                            msg = "Queued for processing...";
                            break;
                            
                        case "preprocessing":
                            step = 2;
                            msg = "Preprocessing content...";
                            break;
                            
                        case "generating_passage":
                            step = 2;
                            msg = "Generating reading passage...";
                            break;
                            
                        case "planning_strategy":
                            step = 3;
                            msg = "Planning question strategy...";
                            break;
                            
                        case "generating_questions":
                            step = 4;
                            msg = `Generating questions... (${status.progress}%)`;
                            break;
                            
                        case "finalizing":
                            step = 5;
                            msg = "Finalizing exam...";
                            break;
                    }


                    setCurrentStep(step);
                    setProgress((prev) => Math.max(prev, status.progress || 0));
                    setStatusMessage(msg);

                } catch (e) {
                    console.error("Polling error", e);
                }
            };

            // Do first poll immediately
            await pollStatus();
            
            // Then poll every second
            pollInterval = setInterval(pollStatus, 2000);


        } catch (err: any) {
            console.error("Error:", err);
            setError(err.message || "An unexpected error occurred");
            setIsProcessing(false);
            setProgress(0);
            setStatusMessage("Failed to process request");
        }
    };

    return (
        <main className="min-h-screen bg-[#0A0A0A] text-slate-200 font-sans selection:bg-red-500/30">
            {/* Header */}
            <nav className="border-b border-white/10 bg-[#0A0A0A]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                         {/* Logo */}
                         <Link href="/" className="flex items-center gap-2 group">
                            <img
                                src="/images/logo.png"
                                alt="AcaRead Logo"
                                className="w-10 h-10 object-contain"
                            />
                            <span className="text-2xl font-bold tracking-tight group-hover:text-white transition-colors">
                                <span className="text-red-500">Aca</span>
                                <span className="text-white">Read</span>
                            </span>
                        </Link>

                        <div className="flex items-center gap-6">
                            <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                                Back to Home
                            </Link>
                            <div className="h-6 w-px bg-white/10"></div>
                            <UserMenu />
                        </div>
                    </div>
                </div>
            </nav>



            {/* Step 3: Completion UI (Previous code...) */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                
                {/* Page Title */}
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-white mb-2">Create New Exam</h1>
                    <p className="text-slate-400">Transform your scientific reading materials into IELTS-style practice tests.</p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-900/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="text-red-400 font-medium text-sm">Action Failed</h3>
                            <p className="text-red-400/80 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Input */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        {/* Step 1: Upload */}
                        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Upload className="w-4 h-4" />
                                </div>
                                <h2 className="text-lg font-semibold text-white">Source Material</h2>
                            </div>
                            
                            <FileUpload
                                onFileSelected={handleFileSelected}
                                disabled={isProcessing}
                            />
                        </div>

                         {/* Step 2: Config */}
                        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                                    <Settings className="w-4 h-4" />
                                </div>
                                <h2 className="text-lg font-semibold text-white">Exam Configuration</h2>
                            </div>
                            
                            <ExamConfig
                                config={examConfig}
                                onChange={handleConfigChange}
                                disabled={isProcessing}
                            />
                        </div>
                    </div>

                    {/* Right Column: Actions & History */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        {/* Action Card */}
                        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 sticky top-24">
                            <h3 className="text-white font-medium mb-4">Ready to Generate?</h3>
                            <div className="text-sm text-slate-400 mb-6">
                                This will consume <span className="text-white font-bold">2 credits</span> from your balance.
                            </div>
                            
                            <button
                                onClick={handleProcess}
                                disabled={isProcessing || (!file && !fileUrl)}
                                className={`w-full py-4 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5 fill-current" />
                                        <span>Generate Exam</span>
                                    </>
                                )}
                            </button>

                            {isProcessing && (
                                <div className="mt-6 border-t border-white/5 pt-6">
                                    <ProcessStatus 
                                        currentStep={currentStep}
                                        progress={progress}
                                        statusMessage={statusMessage}
                                        isProcessing={isProcessing}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Sessions */}
                <div className="mt-16 pt-12 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-8">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <h2 className="text-xl font-bold text-white">Recent Exams</h2>
                    </div>
                    <SessionList />
                </div>
            </div>
        </main>
    );
}

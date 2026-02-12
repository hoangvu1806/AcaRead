"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Exam, SessionInfo, FullValidationReport } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import { TaskRenderer } from "./components/TaskRenderer";
import { PassageWithNotes } from "./components/PassageWithNotes";
import { motion, AnimatePresence } from "framer-motion";


interface ExamClientProps {
  sessionId: string;
}

  // Simple Loader Component
  const SimpleLoader = () => {
      const [progress, setProgress] = useState(0);

      useEffect(() => {
          // Faster progress simulation
          const interval = setInterval(() => {
              setProgress(prev => {
                  if (prev >= 100) {
                      clearInterval(interval);
                      return 100;
                  }
                  return prev + Math.floor(Math.random() * 15) + 5; // Faster increments
              });
          }, 50);

          return () => clearInterval(interval);
      }, []);

      return (
          <div className="fixed inset-0 z-[100] bg-[#09090b] flex items-center justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                  {/* SVG Circular Progress */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                      {/* Background Circle */}
                      <circle 
                          cx="64" 
                          cy="64" 
                          r="60" 
                          fill="transparent" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          className="text-white/5" 
                      />
                      {/* Progress Circle (Circumference ~377) */}
                      <circle 
                          cx="64" 
                          cy="64" 
                          r="60" 
                          fill="transparent" 
                          stroke="currentColor" 
                          strokeWidth="3" 
                          strokeLinecap="round"
                          className="text-primary-500 transition-all duration-100 ease-linear shadow-[0_0_15px_currentColor]"
                          strokeDasharray={377}
                          strokeDashoffset={377 - (377 * progress) / 100} 
                      />
                  </svg>
                  
                  {/* Logo Image */}
                  <div className="relative z-10 w-20 h-20 rounded-full bg-black/50 p-3 backdrop-blur-sm border border-white/5">
                      <img 
                          src="/images/logo.png" 
                          alt="Loading..." 
                          className="w-full h-full object-contain opacity-90 animate-pulse"
                      />
                  </div>
                  
                  {/* Inner Glow Pulse */}
                  <div className="absolute inset-0 rounded-full bg-primary-500/10 blur-2xl animate-pulse pointer-events-none"></div>
              </div>
          </div>
      );
  };

export default function ExamClient({ sessionId }: ExamClientProps) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<any | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true); // New state for CyberLoader
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20 * 60); // Default 20 mins
  const [timerActive, setTimerActive] = useState(false);
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  
  // Resizable Pane State
  const [leftPaneWidth, setLeftPaneWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  // Resize Handlers
  const startResizing = () => setIsResizing(true);
  
  useEffect(() => {
    const stopResizing = () => setIsResizing(false);
    
    const resize = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = (e.clientX / window.innerWidth) * 100;
        // Limit width between 20% and 80%
        if (newWidth > 20 && newWidth < 80) {
          setLeftPaneWidth(newWidth);
        }
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  // Load Data
  useEffect(() => {
    loadExamData();
  }, [sessionId]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && !isSubmitted) {
      // Check if time is up and we haven't entered overtime yet
      if (timeLeft === 0 && !isOvertime) {
         setTimerActive(false);
         setShowTimeUpModal(true);
         return;
      }

      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, isSubmitted, isOvertime]);

  const handleContinueExam = () => {
    setIsOvertime(true);
    setShowTimeUpModal(false);
    setTimerActive(true);
  };

  const loadExamData = async () => {
    try {
      setLoading(true);
      const sessionData = await api.getSession(sessionId);
      setSession(sessionData);

      if (sessionData.has_exam) {
        const examResponse = await api.getExam(sessionId);
        if (!examResponse || !examResponse.result) throw new Error("Invalid exam data");
        setExam(examResponse.result);
      } else {
        setError("Exam not generated.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load");
    } finally {
      setTimeout(() => {
         setLoading(false);
         setTimeout(() => setIsInitializing(false), 800);
      }, 300);
    }
  };

  const handleAnswerChange = (qId: string, value: string) => {
    setUserAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async () => {
     if (!confirm("Are you sure you want to submit?")) return;
     setIsSubmitted(true);
     setTimerActive(false);
     
     try {
        const ansRes = await api.submitExam(sessionId, userAnswers);
        setAnswers(ansRes.answers);
     } catch (e) {
        alert("Could not fetch correct answers. Please check server.");
     }
  };

  const formatTime = (seconds: number) => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const m = Math.floor(absSeconds / 60);
    const s = absSeconds % 60;
    return `${isNegative ? '-' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Calculate Score
  const calculateScore = () => {
    if (!answers || !answers.tasks) return { score: 0, total: 0 };
    let correct = 0;
    let total = 0;
    
    exam?.tasks.forEach((task, tIdx) => {
       task.questions.forEach((q, qIdx) => {
          total++;
          const qNum = q.question_number;
          const userAns = userAnswers[`q-${qNum}`]?.trim().toLowerCase();
          const correctAns = answers.tasks[tIdx]?.answers[qIdx]?.answer?.trim().toLowerCase();
          if (userAns && userAns === correctAns) correct++;
       });
    });
    return { correct, total };
  };

  if (loading || isInitializing) return <SimpleLoader />;

  if (error || !exam) return (
     <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-white">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-md text-center">
           <h2 className="text-xl font-bold text-red-500 mb-2">System Error</h2>
           <p className="text-gray-400 mb-6">{error || "Exam data unavailable"}</p>
           <Link href="/create" className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">Return Home</Link>
        </div>
     </div>
  );

  const score = isSubmitted ? calculateScore() : null;

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-200 font-sans selection:bg-primary-500/30 flex flex-col h-screen overflow-hidden">
      
      {/* Top Bar */}
      <header className="h-16 flex-shrink-0 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 z-50">
         <div className="flex items-center gap-6">
            <Link href="/create" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
               <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
               <span className="font-medium text-sm">Exit</span>
            </Link>
            <div className="h-6 w-px bg-white/10"></div>
            <div>
               <h1 className="text-sm font-bold text-gray-200 tracking-wide truncate max-w-[200px]">{session?.filename}</h1>
               <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded-md bg-primary-500/10 text-primary-400 text-[10px] font-bold border border-primary-500/20">IELTS READING</span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-6">
            {/* Timer */}
            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${timeLeft < 0 ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' : timeLeft < 300 ? 'bg-orange-950/30 border-orange-900/50 text-orange-400' : 'bg-white/5 border-white/5 text-gray-300'}`}>
               <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <span className="font-mono text-xl font-bold tabular-nums tracking-wider">{formatTime(timeLeft)}</span>
            </div>

            {/* Controls */}
            {!isSubmitted ? (
               <div className="flex items-center gap-3">
                  {!timerActive ? (
                     <button onClick={() => setTimerActive(true)} className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-primary-900/20 active:scale-95">
                        {timeLeft === 20 * 60 ? "Start Exam" : "Resume"}
                     </button>
                  ) : (
                     <button onClick={() => setTimerActive(false)} className="px-6 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/20 rounded-lg font-bold text-sm transition-all active:scale-95">
                        Pause
                     </button>
                  )}
                  
                  <button onClick={handleSubmit} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-emerald-900/20 ml-4 active:scale-95">
                     Submit
                  </button>
               </div>
            ) : (
               <div className="flex items-center gap-4 px-6 py-2 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-right">
                     <p className="text-xs text-gray-400 uppercase font-bold">Score</p>
                     <p className="text-xl font-mono font-bold text-white leading-none">
                        <span className="text-primary-400">{score?.correct}</span>
                        <span className="text-gray-600">/</span>
                        <span>{score?.total}</span>
                     </p>
                  </div>
                  <div className="h-8 w-px bg-white/10"></div>
                  <button onClick={() => window.print()} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  </button>
               </div>
            )}
         </div>
      </header>

      {/* Main Split View */}
      <div className={`flex-1 flex overflow-hidden ${isResizing ? 'select-none cursor-col-resize' : ''}`}>
         
         {/* LEFT: Passage with Notes */}
         <div 
            style={{ width: `${leftPaneWidth}%` }}
            className="h-full border-r border-white/5 bg-[#0c0c0e] relative flex-shrink-0 transition-[width] duration-0 ease-linear"
         >
            <PassageWithNotes
              title={exam.reading_passage.title}
              topic={exam.reading_passage.topic}
              passageType={exam.passage_type?.toString()}
              content={exam.reading_passage.content}
            />
         </div>

         {/* RESIZER HANDLE */}
         <div
            className="w-1.5 bg-black hover:bg-primary-500/50 cursor-col-resize z-20 flex items-center justify-center group relative -ml-[3px] mr-[0px]"
            onMouseDown={startResizing}
         >
             <div className="absolute inset-y-0 -left-2 -right-2 z-10"></div> {/* Expand hit area */}
             <div className="h-8 w-1 bg-white/10 rounded-full group-hover:bg-primary-400/80 transition-colors pointer-events-none" />
         </div>

         {/* RIGHT: Questions */}
         <div className="flex-1 h-full flex flex-col bg-[#09090b] min-w-0">
            
            {/* Task Navigation Tabs */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-white/5 flex gap-2 overflow-x-auto custom-scrollbar bg-[#09090b]/50 backdrop-blur">
               {exam.tasks.map((task, idx) => {
                  // Check status of this task section
                  const taskQNums = task.questions.map(q => q.question_number);
                  const isComplete = taskQNums.every(num => userAnswers[`q-${num}`]);
                  const hasSome = taskQNums.some(num => userAnswers[`q-${num}`]);
                  
                  return (
                     <button
                        key={idx}
                        onClick={() => setActiveTaskIndex(idx)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border
                           ${activeTaskIndex === idx
                              ? 'bg-white/10 border-white/20 text-white shadow-lg'
                              : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                           }
                        `}
                     >
                        <span className={`w-2 h-2 rounded-full ${isComplete ? 'bg-green-500' : hasSome ? 'bg-yellow-500' : 'bg-gray-700'}`}></span>
                        {task.task_type}
                     </button>
                  );
               })}
            </div>

            {/* Task Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
               <div className={`transition-opacity duration-300 ${!timerActive && !isSubmitted ? 'opacity-30 pointer-events-none blur-sm select-none' : 'opacity-100'}`}>
                   {/* Overlay if paused */}
                   {!timerActive && !isSubmitted && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                         <h3 className="text-2xl font-bold text-white mb-2">Exam Paused</h3>
                         <p className="text-gray-400">Press "Start Exam" to continue</p>
                      </div>
                   )}

                   <div className="max-w-3xl mx-auto">
                      <AnimatePresence mode="wait">
                         <motion.div
                            key={activeTaskIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                         >
                            <div className="mb-6">
                               <h2 className="text-xl font-bold text-white mb-2">{exam.tasks[activeTaskIndex].task_type}</h2>
                               <div className="text-gray-400 text-sm italic border-l-2 border-primary-500/50 pl-3">
                                  {exam.tasks[activeTaskIndex].instruction}
                               </div>
                            </div>
                            
                            <TaskRenderer 
                               task={exam.tasks[activeTaskIndex]}
                               answers={userAnswers}
                               setAnswer={handleAnswerChange}
                               isSubmitted={isSubmitted}
                               correctAnswers={answers?.tasks?.[activeTaskIndex]?.answers}
                            />
                         </motion.div>
                      </AnimatePresence>
                   </div>
               </div>
               <div className="h-20"></div>
            </div>
         </div>
      </div>

      {/* Time Up Modal */}
      {showTimeUpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
           <div className="bg-[#1c1c1f] border border-white/10 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Time is Up!</h2>
              <p className="text-gray-400 mb-8">The allocated time of 20 minutes has expired. Would you like to submit your answers now or continue working?</p>
              
              <div className="flex gap-4">
                 <button 
                    onClick={handleSubmit} 
                    className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
                 >
                    Submit Exam
                 </button>
                 <button 
                    onClick={handleContinueExam} 
                    className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold transition-all shadow-lg shadow-yellow-500/20"
                 >
                    Continue
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

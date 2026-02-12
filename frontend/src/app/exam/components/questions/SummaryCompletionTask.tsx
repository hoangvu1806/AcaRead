import React from 'react';
import { Task } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BaseTaskProps {
  task: Task;
  answers: Record<string, string>;
  setAnswer: (questionId: string, value: string) => void;
  isSubmitted: boolean;
  correctAnswers?: any;
}

export const SummaryCompletionTask: React.FC<BaseTaskProps> = ({ task, answers, setAnswer, isSubmitted, correctAnswers }) => {
  let summaryText = task.summary_text || "";
  
  // Clean up strategy: Remove all underscores that are part of the blank.
  
  // 1. Combine [N] and following underscores into one token
  // Regex: \[(\d+)\] followed by optional space and underscores
  summaryText = summaryText.replace(/\[(\d+)\]\s*[_.]*/g, "{{Q-$1}}");
  
  // 2. Combine "N. ______" or "N ______" into one token
  // Regex: (\d+) followed by optional dot, optional space, and underscores/dots
  // We use [_.]{2,} to ensure we are matching a blank line (at least 2 chars) to avoid false positives with just a period.
  summaryText = summaryText.replace(/(\d+)\.?\s*([_.]){2,}/g, "{{Q-$1}}");

  // 3. Fallback: If there are still [N] left without underscores?
  summaryText = summaryText.replace(/\[(\d+)\]/g, "{{Q-$1}}");
  
  // Split by token
  const parts = summaryText.split(/({{Q-\d+}})/g);

  return (
    <div className="space-y-8">
       {/* Dark Mode Container */}
       <div className="bg-[#1c1c1f] border border-white/10 rounded-xl p-8 shadow-lg relative overflow-hidden">
          
          <h3 className="text-xl font-bold text-gray-200 mb-6 text-center border-b border-white/5 pb-4">
            {task.summary_title || "Summary Completion"}
          </h3>
             
          <div className="text-gray-300 text-lg leading-loose text-justify font-serif">
            {parts.map((part, index) => {
                const match = part.match(/{{Q-(\d+)}}/);
                
                if (match) {
                  const qNum = parseInt(match[1]);
                  const qKey = `q-${qNum}`;
                  const currentAnswer = answers[qKey] || "";
                  
                  // Find correct answer info
                  const qIndex = task.questions.findIndex(q => q.question_number === qNum);
                  const correctData = Array.isArray(correctAnswers) 
                    ? correctAnswers.find((a: any) => a.question === qNum)
                    : correctAnswers?.[qIndex];
                    
                  const correctAnswer = correctData?.answer;
                  const isCorrect = isSubmitted && currentAnswer.trim().toLowerCase() === correctAnswer?.trim().toLowerCase();

                  return (
                      <span key={`q-${qNum}`} className="relative inline-flex flex-col mx-1 align-middle group min-w-[120px]">
                         {/* Input box */}
                        <div className="relative w-full">
                           <input
                                type="text"
                                value={currentAnswer}
                                onChange={(e) => setAnswer(qKey, e.target.value)}
                                disabled={isSubmitted}
                                className={`
                                    w-full h-8 px-2 text-center font-bold font-sans rounded border-b-2 text-sm outline-none transition-all
                                    ${isSubmitted 
                                    ? (isCorrect 
                                            ? 'border-green-500 bg-green-500/10 text-green-400' 
                                            : 'border-red-500 bg-red-500/10 text-red-400 line-through decoration-red-500/50')
                                    : 'bg-transparent border-white/30 text-white hover:border-yellow-500 focus:border-yellow-500 focus:bg-white/5'
                                    }
                                `}
                            />
                            {/* Question number floating inside or nearby */}
                            <span className="absolute -top-2 -left-2 text-[10px] bg-gray-700 text-gray-300 px-1 rounded opacity-70 select-none pointer-events-none">
                               {qNum}
                            </span>
                        </div>
                        
                        {/* Correct Answer Tooltip */}
                        {isSubmitted && !isCorrect && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max max-w-[200px] z-20 pointer-events-none">
                                <div className="bg-green-600/90 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1 justify-center animate-in fade-in zoom-in slide-in-from-top-1 border border-green-400/30">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    {correctAnswer}
                                </div>
                            </div>
                        )}
                      </span>
                  );
                } else {
                  // Replace leftover underscores with spaces
                  const safePart = part.replace(/_+/g, ' '); 
                  return <span key={index} className="inline tracking-wide"><ReactMarkdown components={{p: 'span'}} remarkPlugins={[remarkGfm]}>{safePart}</ReactMarkdown></span>;
                }
            })}
          </div>
       </div>

       {/* Explanations Section */}
       {isSubmitted && correctAnswers && (
         <div className="bg-[#1c1c1f] border border-white/10 rounded-xl p-6 shadow-xl mt-6">
             <h4 className="font-bold text-gray-300 mb-4 flex items-center gap-2 uppercase text-sm tracking-wider">
                <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Detailed Explanations
             </h4>
             <div className="grid gap-4 md:grid-cols-2">
                {task.questions.map((q, idx) => {
                   const correctData = Array.isArray(correctAnswers) 
                        ? correctAnswers.find((a: any) => a.question === q.question_number)
                        : correctAnswers?.[idx];

                   return (
                      <div key={idx} className="bg-black/30 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                         <div className="flex items-center gap-2 mb-2">
                             <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold bg-white/10 text-white border border-white/20">
                                {q.question_number}
                             </div>
                             <span className="text-sm font-bold text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/30">
                                {correctData?.answer}
                             </span>
                         </div>
                         <div className="text-sm text-gray-400 leading-relaxed pl-1 italic border-l-2 border-white/5 ml-1">
                            {correctData?.explanation || "No explanation available."}
                         </div>
                      </div>
                   );
                })}
             </div>
         </div>
      )}
    </div>
  );
};

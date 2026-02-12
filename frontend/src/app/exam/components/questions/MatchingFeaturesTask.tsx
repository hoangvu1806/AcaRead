import React from 'react';
import { Task } from '@/lib/types';

interface BaseTaskProps {
  task: Task;
  answers: Record<string, string>;
  setAnswer: (questionId: string, value: string) => void;
  isSubmitted: boolean;
  correctAnswers?: any;
}

export const MatchingFeaturesTask: React.FC<BaseTaskProps> = ({ task, answers, setAnswer, isSubmitted, correctAnswers }) => {
  // Use 'features_list' or 'options_box' or fallback to empty array
  const features = task.features_list || task.options_box || [];

  return (
    <div className="space-y-8">
      {/* Features List Box */}
      {features.length > 0 ? (
        <div className="bg-[#1c1c1f] border border-white/10 rounded-xl p-6 shadow-inner">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
             List of Features
          </h4>
          <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {features.map((feature: any) => (
               <div key={feature.id} className="flex gap-3 text-gray-300 text-sm items-start bg-black/20 p-2 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                  <span className="font-bold text-yellow-500 bg-yellow-500/10 px-2 rounded min-w-[2rem] text-center">{feature.id}</span>
                  <span className="leading-relaxed">{feature.text || feature.heading_text}</span>
               </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
           No features list found for this task.
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {task.questions.map((q: any, index: number) => {
          const qNum = q.question_number;
          const qKey = `q-${qNum}`;
          const currentAnswer = answers[qKey] || "";
          
          // Get correct answer for validation display
          // The structure of correctAnswers depends on how it's passed. 
          // Usually it's an array of objects matching the question index order or ID order.
          // Assuming correctAnswers is an array [ { question: 7, answer: "A", ... }, ... ]
          const correctData = correctAnswers?.find((a: any) => a.question === qNum);
          const correctAnswer = correctData?.answer;
          const isCorrect = isSubmitted && currentAnswer.trim().toLowerCase() === correctAnswer?.trim().toLowerCase();

          return (
            <div key={q.question_number} className="bg-[#1c1c1f] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all shadow-lg group">
               <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  
                  {/* Question Statement */}
                  <div className="flex gap-4 flex-1">
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                        {qNum}
                      </div>
                      <p className="text-gray-200 text-base leading-relaxed font-medium pt-1">
                        {q.statement || q.question_text || "No statement provided"}
                      </p>
                  </div>

                  {/* Input/Select */}
                  <div className="flex flex-col items-end gap-2 min-w-[140px]">
                      <select
                          value={currentAnswer}
                          onChange={(e) => setAnswer(qKey, e.target.value)}
                          disabled={isSubmitted}
                          className={`
                            w-full bg-black/40 border rounded-lg px-4 py-2.5 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 transition-all font-bold text-center
                            ${isSubmitted 
                                ? (isCorrect 
                                    ? 'border-green-500/50 bg-green-500/10 text-green-400 ring-green-500/20' 
                                    : 'border-red-500/50 bg-red-500/10 text-red-400 ring-red-500/20')
                                : 'border-white/10 hover:border-white/30 focus:border-blue-500 focus:ring-blue-500/20'
                            }
                          `}
                      >
                          <option value="" className="text-gray-500">Select...</option>
                          {features.map((f: any) => (
                              <option key={f.id} value={f.id} className="bg-gray-900 text-white py-2">
                                  {f.id}
                              </option>
                          ))}
                      </select>

                      {isSubmitted && !isCorrect && (
                         <div className="text-xs text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded border border-green-500/20 animate-in fade-in slide-in-from-top-1">
                            Correct: {correctAnswer}
                         </div>
                      )}
                  </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

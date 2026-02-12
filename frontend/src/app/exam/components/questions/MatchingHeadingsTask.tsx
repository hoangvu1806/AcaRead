import React from 'react';
import { Task } from '@/lib/types';

interface BaseTaskProps {
  task: Task;
  answers: Record<string, string>;
  setAnswer: (questionId: string, value: string) => void;
  isSubmitted: boolean;
  correctAnswers?: Record<string, any>;
}

export const MatchingHeadingsTask: React.FC<BaseTaskProps> = ({ task, answers, setAnswer, isSubmitted, correctAnswers }) => {
  const headings = task.headings_list || [];

  return (
    <div className="space-y-8">
      {/* Headings List Reference */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">List of Headings</h4>
        <div className="space-y-3">
          {headings.map((heading: any) => (
             <div key={heading.id} className="flex gap-3 text-gray-300">
                <span className="font-bold text-primary-400 min-w-[2rem]">{heading.id}</span>
                <span>{heading.heading_text}</span>
             </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {task.questions.map((q, index) => {
          const qNum = q.question_number;
          const qKey = `q-${qNum}`;
          const currentAnswer = answers[qKey] || "";
          const correct = correctAnswers?.[index]?.answer; // Usually the ID (i, ii, iii)
          const explanation = correctAnswers?.[index]?.explanation;
          const isCorrect = isSubmitted && currentAnswer === correct;

          return (
            <div key={q.question_number} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all">
               <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
                    {qNum}
                  </div>
                  <span className="text-lg font-medium text-gray-200">
                    {q.paragraph_reference || `Paragraph ${String.fromCharCode(65 + index)}`}
                  </span>
               </div>
               
               <div className="flex items-center gap-4">
                 <select
                    value={currentAnswer}
                    onChange={(e) => setAnswer(qKey, e.target.value)}
                    disabled={isSubmitted}
                    className={`bg-black/40 border rounded-lg px-4 py-2 text-white min-w-[120px] focus:outline-none focus:ring-1 transition-all
                      ${isSubmitted 
                        ? (isCorrect ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400')
                        : 'border-white/20 focus:border-purple-500 focus:ring-purple-500'
                      }
                    `}
                 >
                    <option value="">Select...</option>
                    {headings.map((h: any) => (
                      <option key={h.id} value={h.id}>{h.id}</option>
                    ))}
                 </select>
                 
                 {isSubmitted && !isCorrect && (
                   <span className="text-green-400 font-bold text-sm whitespace-nowrap">
                      (Correct: {correct})
                   </span>
                 )}
               </div>
            </div>
          );
        })}
      </div>
      
      {isSubmitted && correctAnswers && (
         <div className="mt-4 p-4 bg-white/5 rounded-xl">
             <h4 className="font-bold text-gray-300 mb-2">Explanations</h4>
             <div className="space-y-2">
                {task.questions.map((q, idx) => (
                   <div key={idx} className="text-sm text-gray-400">
                      <span className="font-bold text-primary-400 mr-2">{q.question_number}.</span>
                      {correctAnswers[idx]?.explanation || "No explanation available."}
                   </div>
                ))}
             </div>
         </div>
      )}
    </div>
  );
};

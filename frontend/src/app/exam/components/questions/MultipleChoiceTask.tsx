import React from 'react';
import { Task, Question } from '@/lib/types';

interface BaseTaskProps {
  task: Task;
  answers: Record<string, string>;
  setAnswer: (questionId: string, value: string) => void;
  isSubmitted: boolean;
  correctAnswers?: Record<string, any>;
}

export const MultipleChoiceTask: React.FC<BaseTaskProps> = ({ task, answers, setAnswer, isSubmitted, correctAnswers }) => {
  return (
    <div className="space-y-6">
      {task.questions.map((q, index) => {
        const qNum = q.question_number;
        const qKey = `q-${qNum}`;
        const currentAnswer = answers[qKey] || "";
        const correct = correctAnswers?.[index]?.answer;
        const explanation = correctAnswers?.[index]?.explanation;
        const isCorrect = isSubmitted && currentAnswer === correct;

        // Normalize options
        let options: { label: string; text: string }[] = [];
        if (Array.isArray(q.options)) {
           // If it's an array of strings or objects
           options = q.options.map((opt: any, i: number) => {
             if (typeof opt === 'string') return { label: String.fromCharCode(65 + i), text: opt };
             return { label: opt.label || String.fromCharCode(65 + i), text: opt.text || JSON.stringify(opt) };
           });
        } else if (typeof q.options === 'object') {
           // If it's an object {A: "...", B: "..."}
           options = Object.entries(q.options).map(([key, val]) => ({
             label: key,
             text: String(val)
           }));
        }

        return (
          <div key={q.question_number} className="p-4 bg-white/5 border border-white/10 rounded-xl transition-all hover:border-white/20">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary-500/20 text-primary-400 font-bold border border-primary-500/30">
                {qNum}
              </div>
              <div className="flex-1">
                <p className="text-lg text-gray-200 mb-4 font-medium">{q.question_text}</p>
                <div className="grid gap-3">
                  {options.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => !isSubmitted && setAnswer(qKey, opt.label)}
                      disabled={isSubmitted}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3
                        ${currentAnswer === opt.label 
                          ? 'bg-primary-600/20 border-primary-500 text-primary-100' 
                          : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/20'
                        }
                        ${isSubmitted && opt.label === correct ? '!bg-green-500/20 !border-green-500 !text-green-200' : ''}
                        ${isSubmitted && currentAnswer === opt.label && currentAnswer !== correct ? '!bg-red-500/20 !border-red-500 !text-red-200' : ''}
                      `}
                    >
                      <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold border
                        ${currentAnswer === opt.label ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-600 text-gray-500'}
                        ${isSubmitted && opt.label === correct ? '!bg-green-500 !border-green-500 !text-white' : ''}
                      `}>
                        {opt.label}
                      </span>
                      <span>{opt.text}</span>
                    </button>
                  ))}
                </div>
                
                {isSubmitted && (
                   <div className="mt-4 p-3 bg-white/5 rounded-lg text-sm">
                      <div className="flex items-center gap-2 font-bold mb-1">
                         <span className={isCorrect ? "text-green-400" : "text-red-400"}>
                           {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                         </span>
                         {!isCorrect && <span className="text-gray-400">Correct Answer: <span className="text-green-400">{correct}</span></span>}
                      </div>
                      {explanation && <p className="text-gray-400 mt-1 italic">{explanation}</p>}
                   </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React from 'react';
import { Task } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

interface BaseTaskProps {
  task: Task;
  answers: Record<string, string>;
  setAnswer: (questionId: string, value: string) => void;
  isSubmitted: boolean;
  correctAnswers?: Record<string, any>;
}

export const ShortAnswerTask: React.FC<BaseTaskProps> = ({ task, answers, setAnswer, isSubmitted, correctAnswers }) => {
  return (
    <div className="space-y-6">
      {task.questions.map((q, index) => {
        const qNum = q.question_number;
        const qKey = `q-${qNum}`;
        const currentAnswer = answers[qKey] || "";
        const correct = correctAnswers?.[index]?.answer;
        const isCorrect = isSubmitted && currentAnswer.toLowerCase().trim() === correct?.toLowerCase().trim();

        return (
          <div key={q.question_number} className="p-4 bg-white/5 border border-white/10 rounded-xl transition-all hover:border-white/20">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold border border-teal-500/30">
                {qNum}
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="text-lg text-gray-200 font-medium leading-relaxed">
                   <ReactMarkdown components={{p: 'span'}}>{q.question_text || q.statement || ""}</ReactMarkdown>
                </div>
                
                <div className="relative max-w-md">
                   <input
                      type="text"
                      value={currentAnswer}
                      onChange={(e) => !isSubmitted && setAnswer(qKey, e.target.value)}
                      disabled={isSubmitted}
                      placeholder="Type your answer..."
                      className={`w-full bg-black/30 border rounded-lg px-4 py-3 focus:outline-none transition-all
                        ${isSubmitted 
                          ? (isCorrect ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-red-500 text-red-400 bg-red-500/10')
                          : 'border-white/20 focus:border-teal-500 text-white placeholder-gray-600'
                        }
                      `}
                   />
                   {isSubmitted && !isCorrect && (
                      <div className="mt-2 text-sm text-green-400 font-bold bg-green-500/10 p-2 rounded border border-green-500/20 inline-block">
                        Correct Answer: {correct}
                      </div>
                   )}
                </div>

                {isSubmitted && correctAnswers?.[index]?.explanation && (
                    <div className="text-sm text-gray-400 italic">
                       Explanation: {correctAnswers[index].explanation}
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

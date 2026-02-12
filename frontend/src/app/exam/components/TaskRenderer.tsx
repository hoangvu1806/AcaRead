import React from 'react';
import { Task } from '@/lib/types';


import { MultipleChoiceTask } from './questions/MultipleChoiceTask';
import { TrueFalseTask } from './questions/TrueFalseTask';
import { MatchingHeadingsTask } from './questions/MatchingHeadingsTask';
import { SummaryCompletionTask } from './questions/SummaryCompletionTask';
import { SentenceCompletionTask } from './questions/SentenceCompletionTask';
import { ShortAnswerTask } from './questions/ShortAnswerTask';
import { MatchingFeaturesTask } from './questions/MatchingFeaturesTask';
import { MatchingInformationTask } from './questions/MatchingInformationTask';


interface TaskRendererProps {
  task: Task;
  answers: Record<string, string>;
  setAnswer: (questionId: string, value: string) => void;
  isSubmitted: boolean;
  correctAnswers?: Record<string, any>; // Array of answer objects from backend
}

export const TaskRenderer: React.FC<TaskRendererProps> = (props) => {
  const { task } = props;
  const type = (task.task_type || "").toLowerCase();
  const key = (task.task_key || "").toLowerCase();

  if (type.includes("multiple choice")) {
    return <MultipleChoiceTask {...props} />;
  }
  
  if (type.includes("true") || type.includes("false") || type.includes("yes") || type.includes("no") || key.includes("true_false") || key.includes("yes_no")) {
    return <TrueFalseTask {...props} />;
  }


  if (type.includes("summary") || key.includes("summary") || (task.summary_text && task.summary_text.length > 0)) {
    return <SummaryCompletionTask {...props} />;
  }


  if (type.includes("heading") || key.includes("heading")) {
    return <MatchingHeadingsTask {...props} />;
  }

  if (type.includes("sentence") || key.includes("sentence")) {
     return <SentenceCompletionTask {...props} />;
  }

  if (type.includes("matching information") || key.includes("matching_information")) {
     return <MatchingInformationTask {...props} />;
  }

  if (type.includes("matching features") || key.includes("matching_features") || type.includes("matching_features")) {
     return <MatchingFeaturesTask {...props} />;
  }

  if (type.includes("short answer") || key.includes("short_answer")) {
     return <ShortAnswerTask {...props} />;
  }

  // Fallback for unknown types (Generic Input)
  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
       <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-200 text-sm">
          Task Type: <strong>{task.task_type}</strong> (Using Generic View)
       </div>
       <ShortAnswerTask {...props} />
    </div>
  );
};


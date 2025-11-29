
import React, { useState, useEffect } from 'react';
import { CheckCircle, Trash2, Clock, AlertCircle, Pencil, Image as ImageIcon } from 'lucide-react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onComplete: (task: Task) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onViewProof: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, onDelete, onEdit, onViewProof }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!task.deadline || task.status !== 'pending') {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const deadline = new Date(task.deadline!).getTime();
      const distance = deadline - now;

      if (distance < 0) {
        setIsOverdue(true);
        setTimeLeft('00:00:00');
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [task.deadline, task.status]);

  const getStatusColor = () => {
    if (task.status === 'completed') return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
    if (task.status === 'failed') return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
    if (isOverdue) return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
    return 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700';
  };

  return (
    <div className={`relative p-5 rounded-2xl border shadow-sm transition-all duration-300 ${getStatusColor()}`}>
      <div className="flex flex-col gap-4">
        
        {/* Header Section */}
        <div className="flex justify-between items-start gap-4">
           <div className="flex-1 min-w-0">
             <h3 className={`text-lg md:text-xl font-semibold break-words truncate ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
               {task.title}
             </h3>
             {task.description && (
               <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                 {task.description}
               </p>
             )}
           </div>
           
           {task.status === 'failed' && (
              <div className="text-red-500 opacity-80 shrink-0">
                  <AlertCircle size={24} />
              </div>
           )}
        </div>

        {/* Metadata & Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
               {task.deadline && task.status === 'pending' && (
                 <div className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg font-medium ${isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                   <Clock size={14} />
                   {timeLeft}
                 </div>
               )}
               <span className="text-xs text-slate-400 font-medium">
                  {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </span>

               {task.completionProof && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); onViewProof(task); }}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                 >
                   <ImageIcon size={12} />
                   <span>Proof</span>
                 </button>
               )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {task.status === 'pending' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                  className="p-2.5 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-100 dark:border-slate-700"
                  title="Edit Task"
                >
                  <Pencil size={20} />
                </button>
              )}

              {task.status === 'pending' && !isOverdue && (
                <button
                  onClick={(e) => { e.stopPropagation(); onComplete(task); }}
                  className="p-2.5 text-slate-400 hover:text-green-600 dark:text-slate-500 dark:hover:text-green-400 transition-colors rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/30 border border-slate-100 dark:border-slate-700"
                  title="Complete Task"
                >
                  <CheckCircle size={20} />
                </button>
              )}
              
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(task); }}
                className="p-2.5 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-colors rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 border border-slate-100 dark:border-slate-700"
                title="Delete Task"
              >
                <Trash2 size={20} />
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;

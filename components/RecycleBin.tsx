
import React from 'react';
import { Trash2, RotateCcw, XCircle, ArrowLeft } from 'lucide-react';
import { Task } from '../types';

interface Props {
  tasks: Task[];
  onRestore: (task: Task) => void;
  onDeleteForever: (task: Task) => void;
  onBack: () => void;
}

const RecycleBin: React.FC<Props> = ({ tasks, onRestore, onDeleteForever, onBack }) => {
  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-30 flex flex-col animate-fade-in overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
           <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
           <Trash2 className="text-slate-400" />
           <h2 className="text-xl font-bold">Recycle Bin</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
            <Trash2 size={48} className="mb-4" />
            <p>Bin is empty</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
               <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 line-through decoration-slate-400">{task.title}</h3>
                    <p className="text-xs text-slate-400">Deleted: {task.deletedAt ? new Date(task.deletedAt).toLocaleDateString() : 'Unknown'}</p>
                  </div>
               </div>
               <div className="flex gap-2 mt-2">
                 <button 
                   onClick={() => onRestore(task)}
                   className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                 >
                   <RotateCcw size={16} /> Restore
                 </button>
                 <button 
                   onClick={() => onDeleteForever(task)}
                   className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40"
                 >
                   <XCircle size={16} /> Delete Forever
                 </button>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecycleBin;

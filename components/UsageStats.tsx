
import React from 'react';
import { BarChart2, CheckCircle, Trash2, Zap, ArrowLeft, Calendar } from 'lucide-react';
import { UserStats } from '../types';

interface Props {
  stats: UserStats;
  onBack: () => void;
}

const UsageStats: React.FC<Props> = ({ stats, onBack }) => {
  const completionRate = stats.totalCreated > 0 
    ? Math.round((stats.totalCompleted / stats.totalCreated) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-30 flex flex-col animate-fade-in overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
           <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
           <BarChart2 className="text-slate-400" />
           <h2 className="text-xl font-bold">Usage Statistics</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
           <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center mb-3">
                 <CheckCircle size={20} />
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalCompleted}</span>
              <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">Completed</span>
           </div>
           
           <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center mb-3">
                 <Zap size={20} />
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.currentStreak}</span>
              <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">Day Streak</span>
           </div>

           <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center mb-3">
                 <Calendar size={20} />
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalCreated}</span>
              <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">Created</span>
           </div>

           <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center mb-3">
                 <Trash2 size={20} />
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalDeleted}</span>
              <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">Deleted</span>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Completion Rate</h3>
           <div className="relative pt-1">
             <div className="flex mb-2 items-center justify-between">
               <div>
                 <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300">
                   Productivity
                 </span>
               </div>
               <div className="text-right">
                 <span className="text-xs font-semibold inline-block text-indigo-600 dark:text-indigo-400">
                   {completionRate}%
                 </span>
               </div>
             </div>
             <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200 dark:bg-slate-800">
               <div style={{ width: `${completionRate}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"></div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UsageStats;

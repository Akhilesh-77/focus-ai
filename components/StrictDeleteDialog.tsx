
import React, { useState } from 'react';
import { Gavel, MessageSquareWarning, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Task, GeminiModelType } from '../types';
import { judgeDeletion } from '../services/geminiService';

interface Props {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  modelSelection: GeminiModelType;
}

const StrictDeleteDialog: React.FC<Props> = ({ task, isOpen, onClose, onConfirmDelete, modelSelection }) => {
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'judging' | 'inquiry' | 'approved' | 'rejected'>('idle');
  const [judgeMessage, setJudgeMessage] = useState<string>('');
  
  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    
    setStatus('judging');
    const currentHistory = [...history, `User: ${reason}`];
    setHistory(currentHistory);

    const result = await judgeDeletion(task.title, reason, currentHistory, modelSelection);
    
    setJudgeMessage(result.message);
    setReason(''); 

    if (result.verdict === 'approved') {
      setStatus('approved');
      setTimeout(onConfirmDelete, 2000); 
    } else if (result.verdict === 'rejected') {
      setStatus('rejected');
    } else {
      setStatus('inquiry');
      if (result.question) {
         setJudgeMessage(result.message + " " + result.question);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-slide-up">
        
        {/* Strict Header */}
        <div className="bg-red-700 p-6 flex flex-col items-center justify-center text-white text-center border-b border-red-800 shadow-inner">
          <Gavel size={40} className="mb-2 text-red-200" />
          <h3 className="text-2xl font-serif font-bold uppercase tracking-widest text-white">The Court of Focus</h3>
          <p className="text-red-200 text-xs font-mono uppercase tracking-widest mt-1">Strict Deletion Protocol Active</p>
        </div>

        <div className="p-6">
          {status === 'idle' && (
            <div className="animate-fade-in">
              <div className="mb-6 text-center">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">You are attempting to delete:</p>
                 <p className="text-xl font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 py-3 px-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                   "{task.title}"
                 </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  State your reason clearly. Why should this task be removed?
                </label>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none h-32 resize-none shadow-inner"
                  placeholder="Explain yourself..."
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                  Withdraw Request
                </button>
                <button onClick={handleSubmit} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all active:scale-95">
                  Submit to Judge
                </button>
              </div>
            </div>
          )}

          {status === 'judging' && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-red-200 dark:border-red-900 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-mono text-sm tracking-wide animate-pulse">
                THE JUDGE IS DELIBERATING...
              </p>
            </div>
          )}

          {status === 'inquiry' && (
             <div className="animate-slide-up">
               <div className="flex items-start gap-4 mb-6 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm">
                 <MessageSquareWarning className="text-orange-600 dark:text-orange-500 shrink-0 mt-1" size={24} />
                 <div>
                   <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase mb-1">Judge's Inquiry</p>
                   <p className="text-slate-800 dark:text-slate-200 font-medium italic leading-relaxed">"{judgeMessage}"</p>
                 </div>
               </div>
               <textarea 
                 value={reason}
                 onChange={(e) => setReason(e.target.value)}
                 className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none h-24 resize-none mb-4 shadow-inner"
                 placeholder="Your response..."
                 autoFocus
               />
               <button onClick={handleSubmit} className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/30 transition-all active:scale-95">
                  Answer the Court
               </button>
             </div>
          )}

          {status === 'rejected' && (
             <div className="text-center py-6 animate-slide-up">
               <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 mb-6 animate-bounce">
                 <ThumbsDown size={40} />
               </div>
               <h4 className="text-2xl font-bold text-red-600 mb-2">DELETION DENIED</h4>
               <p className="text-slate-600 dark:text-slate-300 mb-8 px-4 leading-relaxed">"{judgeMessage}"</p>
               <button onClick={onClose} className="w-full py-4 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold shadow-lg transition-all hover:bg-slate-900">
                  Accept Verdict & Return
               </button>
             </div>
          )}

          {status === 'approved' && (
             <div className="text-center py-6 animate-slide-up">
               <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mb-6 animate-pulse">
                 <ThumbsUp size={40} />
               </div>
               <h4 className="text-2xl font-bold text-green-600 mb-2">APPROVED</h4>
               <p className="text-slate-600 dark:text-slate-300 mb-2">{judgeMessage}</p>
               <p className="text-xs text-slate-400 mt-4">Deleting task...</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrictDeleteDialog;

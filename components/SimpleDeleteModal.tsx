
import React from 'react';
import { Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
}

const SimpleDeleteModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, taskTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700 animate-slide-up">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
             <Trash2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete this task?</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 px-4">
            "{taskTitle}" is already completed. Do you want to remove it permanently?
          </p>
          <div className="flex gap-3 w-full">
            <button 
              onClick={onClose}
              className="flex-1 py-3 text-slate-700 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              No, Keep
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-3 text-white font-bold bg-red-600 rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/20 transition-colors"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDeleteModal;

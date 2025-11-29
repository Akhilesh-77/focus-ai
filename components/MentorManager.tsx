
import React, { useState, useRef } from 'react';
import { ArrowLeft, Upload, User, Trash2, Plus, Edit2, Check, X } from 'lucide-react';
import { AppSettings, Mentor } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onBack: () => void;
}

const MentorManager: React.FC<Props> = ({ settings, onUpdateSettings, onBack }) => {
  const [editingMentorId, setEditingMentorId] = useState<string | null>(null);
  const [newMentorName, setNewMentorName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [manualQuote, setManualQuote] = useState('');

  // Form states for adding/editing
  const [editName, setEditName] = useState('');
  
  const handlePhotoUpload = (mentorId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const updatedMentors = settings.mentors.map(m => 
          m.id === mentorId ? { ...m, photo: base64 } : m
        );
        onUpdateSettings({ ...settings, mentors: updatedMentors });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMentor = () => {
    if (!newMentorName.trim()) return;
    const newMentor: Mentor = {
      id: uuidv4(),
      name: newMentorName,
      quotes: [],
      photo: undefined,
      isDefault: false
    };
    onUpdateSettings({
      ...settings,
      mentors: [...settings.mentors, newMentor],
      activeMentorId: settings.activeMentorId // Keep current active
    });
    setNewMentorName('');
    setIsAdding(false);
  };

  const handleDeleteMentor = (id: string) => {
    // Prevent deleting if it's the active one, unless we switch active
    const updatedMentors = settings.mentors.filter(m => m.id !== id);
    let newActiveId = settings.activeMentorId;
    if (settings.activeMentorId === id) {
        newActiveId = updatedMentors[0]?.id || '';
    }
    onUpdateSettings({
      ...settings,
      mentors: updatedMentors,
      activeMentorId: newActiveId
    });
  };

  const startEdit = (mentor: Mentor) => {
    setEditingMentorId(mentor.id);
    setEditName(mentor.name);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    const updatedMentors = settings.mentors.map(m => 
      m.id === editingMentorId ? { ...m, name: editName } : m
    );
    onUpdateSettings({ ...settings, mentors: updatedMentors });
    setEditingMentorId(null);
  };

  const addQuote = (mentorId: string) => {
    if (!manualQuote.trim()) return;
    const updatedMentors = settings.mentors.map(m => 
        m.id === mentorId ? { ...m, quotes: [...m.quotes, manualQuote] } : m
    );
    onUpdateSettings({ ...settings, mentors: updatedMentors });
    setManualQuote('');
  };

  const removeQuote = (mentorId: string, quoteIndex: number) => {
    const updatedMentors = settings.mentors.map(m => {
        if (m.id === mentorId) {
            const newQuotes = [...m.quotes];
            newQuotes.splice(quoteIndex, 1);
            return { ...m, quotes: newQuotes };
        }
        return m;
    });
    onUpdateSettings({ ...settings, mentors: updatedMentors });
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-30 flex flex-col animate-fade-in overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
           <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
           <User className="text-slate-400" />
           <h2 className="text-xl font-bold">Mentor Management</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Add New Section */}
        {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all font-bold"
            >
               <Plus size={20} /> Add New Mentor
            </button>
        ) : (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-indigo-100 dark:border-indigo-900 animate-slide-up">
               <h3 className="font-bold text-slate-800 dark:text-white mb-4">Add Mentor</h3>
               <input 
                 type="text" 
                 value={newMentorName}
                 onChange={(e) => setNewMentorName(e.target.value)}
                 className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                 placeholder="Mentor Name (e.g. David Goggins)"
                 autoFocus
               />
               <div className="flex gap-3">
                 <button onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl">Cancel</button>
                 <button onClick={handleAddMentor} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">Save</button>
               </div>
            </div>
        )}

        {/* Mentor List */}
        <div className="space-y-6">
          {settings.mentors.map(mentor => (
            <div key={mentor.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
               
               {/* Mentor Header */}
               <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     {/* Photo Upload */}
                     <label className="relative group cursor-pointer">
                        <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-inner border border-slate-300 dark:border-slate-600">
                           {mentor.photo ? (
                             <img src={mentor.photo} alt={mentor.name} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-400">
                               <User size={24} />
                             </div>
                           )}
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                              <Upload size={16} className="text-white" />
                           </div>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(mentor.id, e)} />
                     </label>

                     <div>
                       {editingMentorId === mentor.id ? (
                         <div className="flex items-center gap-2">
                            <input 
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="p-1 rounded bg-white dark:bg-slate-950 border border-indigo-500 outline-none text-sm font-bold"
                            />
                            <button onClick={saveEdit} className="p-1 text-green-600"><Check size={16} /></button>
                            <button onClick={() => setEditingMentorId(null)} className="p-1 text-red-500"><X size={16} /></button>
                         </div>
                       ) : (
                         <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{mentor.name}</h3>
                            <button onClick={() => startEdit(mentor)} className="text-slate-400 hover:text-indigo-500"><Edit2 size={14} /></button>
                         </div>
                       )}
                       <p className="text-xs text-slate-500">{mentor.isDefault ? 'Default Mentor' : 'Custom Mentor'}</p>
                     </div>
                  </div>

                  {!mentor.isDefault && (
                    <button onClick={() => handleDeleteMentor(mentor.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                       <Trash2 size={20} />
                    </button>
                  )}
               </div>

               {/* Manual Quotes Section */}
               <div className="p-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Manual Quotes ({mentor.quotes.length})</h4>
                  
                  {mentor.quotes.length > 0 && (
                     <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                       {mentor.quotes.map((quote, idx) => (
                         <li key={idx} className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg flex justify-between items-start gap-2">
                            <span>"{quote}"</span>
                            <button onClick={() => removeQuote(mentor.id, idx)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                         </li>
                       ))}
                     </ul>
                  )}

                  <div className="flex gap-2">
                     <input 
                       type="text" 
                       value={editingMentorId === mentor.id ? manualQuote : ''} // Only allow adding when "focused" roughly or just general input
                       // Simplified: A general input that works for the currently interacting card would be better, but for now lets put local state input per card? No, simplified.
                       // Let's use the general state `manualQuote` but we need to know WHICH mentor we are adding to.
                       // Implementation tweak: Put input in every card, update state on focus?
                       // Simpler: Just an input field here.
                       onChange={(e) => {
                          setEditingMentorId(mentor.id); // Hack to track active input
                          setManualQuote(e.target.value);
                       }}
                       onFocus={() => {
                          setEditingMentorId(mentor.id);
                          setManualQuote('');
                       }}
                       placeholder={editingMentorId === mentor.id ? "Type a quote..." : "Click to add quote..."}
                       className="flex-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm border-none focus:ring-1 focus:ring-indigo-500"
                     />
                     <button 
                        onClick={() => addQuote(mentor.id)}
                        disabled={editingMentorId !== mentor.id || !manualQuote}
                        className="p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                     >
                       <Plus size={16} />
                     </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MentorManager;

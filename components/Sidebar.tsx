
import React from 'react';
import { X, Settings, Moon, Mic, Volume2, Trash2, BarChart2, Users, Database, ChevronRight, Shuffle } from 'lucide-react';
import { AppSettings, GeminiModelType, Theme, Mentor } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

const MODELS: GeminiModelType[] = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0', 'gemini-exp'];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  const navigateTo = (hash: string) => {
    window.location.hash = hash;
    onClose();
  };

  const getActiveMentorName = () => {
    if (settings.mentorMode === 'random') return "Random Mode";
    const mentor = settings.mentors.find(m => m.id === settings.activeMentorId);
    return mentor ? mentor.name : "Select Mentor";
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Panel */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800 overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="text-slate-900 dark:text-white" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Navigation Links */}
          <section className="space-y-2">
             <button onClick={() => navigateTo('#bin')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200 font-medium">
               <Trash2 size={20} className="text-slate-500" />
               Recycle Bin
             </button>
             <button onClick={() => navigateTo('#stats')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200 font-medium">
               <BarChart2 size={20} className="text-slate-500" />
               Usage Statistics
             </button>
          </section>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Theme */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Moon size={16} /> Appearance
            </h3>
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
              <span className="font-medium text-slate-700 dark:text-slate-200">Dark Mode</span>
              <button 
                onClick={() => onUpdateSettings({ ...settings, theme: settings.theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.theme === Theme.DARK ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.theme === Theme.DARK ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </section>

          {/* Voice Controls */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Mic size={16} /> Voice Controls
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
                <span className="font-medium text-slate-700 dark:text-slate-200">Enable Voice Input</span>
                <button 
                  onClick={() => onUpdateSettings({ ...settings, enableVoiceInput: !settings.enableVoiceInput })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enableVoiceInput ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enableVoiceInput ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
                <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-slate-500"/>
                    <span className="font-medium text-slate-700 dark:text-slate-200">Voice Replies</span>
                </div>
                <button 
                  onClick={() => onUpdateSettings({ ...settings, enableVoiceResponse: !settings.enableVoiceResponse })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enableVoiceResponse ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enableVoiceResponse ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </section>

          {/* Motivation System */}
          <section>
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                 <Users size={16} /> Mentors
               </h3>
               <button onClick={() => navigateTo('#mentors')} className="text-xs text-indigo-500 font-bold hover:underline">
                 Manage
               </button>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-3 border border-slate-100 dark:border-slate-800">
               <div className="flex justify-between items-center mb-3">
                 <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Active Mode</span>
               </div>
               
               <div className="flex gap-2">
                  <button 
                    onClick={() => onUpdateSettings({ ...settings, mentorMode: 'selected' })}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${settings.mentorMode === 'selected' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                  >
                    Selected
                  </button>
                  <button 
                    onClick={() => onUpdateSettings({ ...settings, mentorMode: 'random' })}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors ${settings.mentorMode === 'random' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                  >
                    <Shuffle size={12} /> Random
                  </button>
               </div>

               {settings.mentorMode === 'selected' && (
                 <div className="mt-4">
                    <label className="text-xs font-bold text-slate-400 block mb-2">Select Primary Mentor</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                       {settings.mentors.map(mentor => (
                         <button
                           key={mentor.id}
                           onClick={() => onUpdateSettings({ ...settings, activeMentorId: mentor.id })}
                           className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${settings.activeMentorId === mentor.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                         >
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                               {mentor.photo ? (
                                 <img src={mentor.photo} alt={mentor.name} className="w-full h-full object-cover" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">{mentor.name.substring(0,2)}</div>
                               )}
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{mentor.name}</span>
                            {settings.activeMentorId === mentor.id && <div className="w-2 h-2 rounded-full bg-indigo-500 ml-auto" />}
                         </button>
                       ))}
                    </div>
                 </div>
               )}
            </div>
            
            <button 
              onClick={() => navigateTo('#mentors')}
              className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-colors"
            >
              Add New Mentor <ChevronRight size={16} />
            </button>
          </section>

          {/* AI Model */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Database size={16} /> Intelligence Model
            </h3>
            <div className="space-y-2">
              {MODELS.map(model => (
                <label key={model} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${settings.geminiModel === model ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                   <div className="flex items-center gap-3">
                     <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settings.geminiModel === model ? 'border-indigo-500' : 'border-slate-400'}`}>
                        {settings.geminiModel === model && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                     </div>
                     <span className="font-medium text-slate-700 dark:text-slate-200">{model}</span>
                   </div>
                   <input 
                     type="radio" 
                     name="model" 
                     className="hidden" 
                     checked={settings.geminiModel === model}
                     onChange={() => onUpdateSettings({ ...settings, geminiModel: model })} 
                   />
                </label>
              ))}
            </div>
          </section>

        </div>
      </div>
    </>
  );
};

export default Sidebar;


import React from 'react';
import { X, Settings, Moon, Mic, Volume2, Trash2, BarChart2, Image as ImageIcon, Database, Quote } from 'lucide-react';
import { AppSettings, GeminiModelType, Theme } from '../types';

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
             <button onClick={() => navigateTo('#speakers')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200 font-medium">
               <ImageIcon size={20} className="text-slate-500" />
               Motivation Speaker Photos
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

          {/* Motivation - RESTRICTED TO VIRAT KOHLI */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Quote size={16} /> Mentor
            </h3>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold">VK</div>
                  <div>
                    <p className="text-slate-900 dark:text-white font-bold">Virat Kohli</p>
                    <p className="text-xs text-slate-500">Selected Mentor</p>
                  </div>
               </div>
               <p className="text-xs text-slate-400 mt-3 italic">
                 "Self-belief and hard work will always earn you success."
               </p>
            </div>
          </section>

        </div>
      </div>
    </>
  );
};

export default Sidebar;

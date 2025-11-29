
import React, { useState } from 'react';
import { X, Settings, Moon, Sun, User, Quote, Database, Mic, Volume2 } from 'lucide-react';
import { AppSettings, GeminiModelType, Theme } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

const MODELS: GeminiModelType[] = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0', 'gemini-exp'];

const PRESET_AUTHORS = [
  "Virat Kohli", "Michael Jordan", "Kobe Bryant", "Steve Jobs", 
  "APJ Abdul Kalam", "David Goggins", "Jocko Willink", "Elon Musk"
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  const [newAuthor, setNewAuthor] = useState('');

  const toggleAuthor = (author: string) => {
    const current = settings.quotePreferences.authors;
    const updated = current.includes(author)
      ? current.filter(a => a !== author)
      : [...current, author];
    
    onUpdateSettings({
      ...settings,
      quotePreferences: { ...settings.quotePreferences, authors: updated }
    });
  };

  const addCustomAuthor = () => {
    if (newAuthor.trim()) {
      onUpdateSettings({
        ...settings,
        quotePreferences: {
          ...settings.quotePreferences,
          customAuthors: [...settings.quotePreferences.customAuthors, newAuthor.trim()]
        }
      });
      setNewAuthor('');
    }
  };

  const removeCustomAuthor = (author: string) => {
    onUpdateSettings({
      ...settings,
      quotePreferences: {
        ...settings.quotePreferences,
        customAuthors: settings.quotePreferences.customAuthors.filter(a => a !== author)
      }
    });
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

          {/* Motivation */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Quote size={16} /> Motivation Source
            </h3>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
               <div className="flex gap-2 mb-4">
                  <button 
                    onClick={() => onUpdateSettings({ ...settings, quotePreferences: { ...settings.quotePreferences, mode: 'random' } })}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${settings.quotePreferences.mode === 'random' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
                  >
                    Random
                  </button>
                  <button 
                     onClick={() => onUpdateSettings({ ...settings, quotePreferences: { ...settings.quotePreferences, mode: 'selected' } })}
                     className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${settings.quotePreferences.mode === 'selected' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
                  >
                    Selected
                  </button>
               </div>
               
               {settings.quotePreferences.mode === 'selected' && (
                 <div className="space-y-2">
                    <p className="text-xs text-slate-400 mb-2">Select Mentors:</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_AUTHORS.map(author => (
                        <button
                          key={author}
                          onClick={() => toggleAuthor(author)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            settings.quotePreferences.authors.includes(author)
                              ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {author}
                        </button>
                      ))}
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-xs text-slate-400 mb-2">Add Custom:</p>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newAuthor}
                          onChange={(e) => setNewAuthor(e.target.value)}
                          placeholder="e.g. My Father"
                          className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button onClick={addCustomAuthor} className="px-3 bg-indigo-600 text-white rounded-lg text-sm font-bold">+</button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                         {settings.quotePreferences.customAuthors.map(author => (
                           <span key={author} className="flex items-center gap-1 px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-full">
                              {author}
                              <button onClick={() => removeCustomAuthor(author)}><X size={12} /></button>
                           </span>
                         ))}
                      </div>
                    </div>
                 </div>
               )}
            </div>
          </section>

        </div>
      </div>
    </>
  );
};

export default Sidebar;

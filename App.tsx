
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Mic, MicOff, BrainCircuit, Menu, Send, X, AlertTriangle } from 'lucide-react';
import TaskCard from './components/TaskCard';
import Modal from './components/Modal';
import Sidebar from './components/Sidebar';
import StrictDeleteDialog from './components/StrictDeleteDialog';
import SimpleDeleteModal from './components/SimpleDeleteModal';
import EditTaskModal from './components/EditTaskModal';
import CompletionModal from './components/CompletionModal';
import { Task, Theme, AppSettings } from './types';
import { parseVoiceCommand, getPersonalizedQuote } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'focus-ai-data';
const SETTINGS_KEY = 'focus-ai-settings';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

const DEFAULT_SETTINGS: AppSettings = {
  geminiModel: 'gemini-1.5-flash',
  theme: Theme.LIGHT,
  quotePreferences: {
    authors: [],
    customAuthors: [],
    mode: 'random'
  },
  enableVoiceInput: true,
  enableVoiceResponse: true,
};

function App() {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState(''); 
  const [aiProcessing, setAiProcessing] = useState(false);

  // App State
  const [motivation, setMotivation] = useState('Initializing Focus Protocol...');
  
  // Hash Based Routing State
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#home');

  // Modals Data
  const [strictDeleteTask, setStrictDeleteTask] = useState<Task | null>(null);
  const [simpleDeleteTask, setSimpleDeleteTask] = useState<Task | null>(null);
  const [completeTaskData, setCompleteTaskData] = useState<Task | null>(null);
  const [editTaskData, setEditTaskData] = useState<Task | null>(null);
  const [proofViewUrl, setProofViewUrl] = useState<string | null>(null);
  
  // Manual Add Modal State
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualDeadline, setManualDeadline] = useState('');

  const recognitionRef = useRef<any>(null);

  // --- Initialization & Routing ---

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash || '#home');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync Hash to Modal States
  useEffect(() => {
    // If hash is home, close all modals (conceptually)
    if (currentHash === '#home') {
       // We keep data state but UI closes based on hash check in render
    }
  }, [currentHash]);

  const navigate = (hash: string) => {
    window.location.hash = hash;
  };

  const goHome = () => {
    navigate('#home');
    // Clear temp data
    setStrictDeleteTask(null);
    setSimpleDeleteTask(null);
    setCompleteTaskData(null);
    setEditTaskData(null);
    setProofViewUrl(null);
    setVoiceDraft('');
    setIsListening(false);
  };

  // --- Storage & Setup ---

  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setSettings(prev => ({ ...prev, theme: Theme.DARK }));
    }

    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setTasks(parsed.tasks || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tasks,
      lastLogin: new Date().toDateString()
    }));
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      setTasks(currentTasks => 
        currentTasks.map(t => {
          if (t.status === 'pending' && t.deadline && new Date(t.deadline).getTime() < now) {
            return { ...t, status: 'failed' };
          }
          return t;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  useEffect(() => {
    if (settings.theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const fetchQuote = async () => {
      const quote = await getPersonalizedQuote(settings.quotePreferences, settings.geminiModel);
      setMotivation(quote);
    };
    fetchQuote();
  }, [settings.quotePreferences, settings.geminiModel]);

  // --- Voice Integration ---

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported.");
      return;
    }

    navigate('#voice');
    setVoiceDraft('');
    setIsListening(true);

    const SpeechRecognition = window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => setIsListening(true);
    
    recognitionRef.current.onend = () => {
      setIsListening(false);
      // Stay on #voice to let user edit
    };
    
    recognitionRef.current.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setVoiceDraft(text);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const confirmVoiceDraft = async () => {
    if (!voiceDraft.trim()) return;
    
    setAiProcessing(true);
    const parsed = await parseVoiceCommand(voiceDraft, settings.geminiModel);
    setAiProcessing(false);
    
    if (parsed) {
      const deadline = parsed.deadlineRelativeSeconds 
        ? new Date(Date.now() + parsed.deadlineRelativeSeconds * 1000).toISOString()
        : undefined;

      const newTask: Task = {
        id: uuidv4(),
        title: parsed.title,
        description: parsed.description,
        deadline,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      setTasks(prev => [newTask, ...prev]);
      speak(`Added ${parsed.title}`);
      goHome();
    } else {
      speak("I didn't catch that.");
    }
  };

  const speak = (text: string) => {
    if (!settings.enableVoiceResponse) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  // --- Logic Handlers ---

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle) return;

    const newTask: Task = {
      id: uuidv4(),
      title: manualTitle,
      description: manualDesc,
      deadline: manualDeadline ? new Date(manualDeadline).toISOString() : undefined,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    setTasks(prev => [newTask, ...prev]);
    setManualTitle('');
    setManualDesc('');
    setManualDeadline('');
    goHome();
  };

  const handleDeleteRequest = (task: Task) => {
    if (task.status === 'completed' || task.status === 'failed') {
      setSimpleDeleteTask(task);
    } else {
      setStrictDeleteTask(task);
      navigate('#court');
    }
  };

  const handleSimpleDelete = () => {
    if (simpleDeleteTask) {
      setTasks(prev => prev.filter(t => t.id !== simpleDeleteTask.id));
      setSimpleDeleteTask(null);
    }
  };

  const handleStrictDelete = () => {
    if (strictDeleteTask) {
       setTasks(prev => prev.filter(t => t.id !== strictDeleteTask.id));
       setStrictDeleteTask(null);
       speak("Task removed.");
       goHome();
    }
  };

  const handleCompleteConfirm = (proof?: string) => {
    if (completeTaskData) {
      setTasks(prev => prev.map(t => t.id === completeTaskData.id ? { 
        ...t, 
        status: 'completed',
        completionProof: proof 
      } : t));
      setCompleteTaskData(null);
      speak("Task verified. Excellent work.");
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed');
  const progress = tasks.length === 0 ? 0 : Math.round((completedTasks.length / tasks.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Sidebar Overlay based on Hash */}
      <Sidebar 
        isOpen={currentHash === '#settings'} 
        onClose={goHome} 
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <div className="max-w-3xl mx-auto min-h-screen flex flex-col relative pb-32">
        
        {/* Header */}
        <header className="px-6 pt-8 pb-4 flex justify-between items-center sticky top-0 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
             <button onClick={() => navigate('#settings')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-white">
               <Menu size={28} />
             </button>
             <div className="flex items-center gap-2">
               <BrainCircuit className="text-indigo-600 dark:text-indigo-400" size={26} />
               <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Focus AI</h1>
             </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-6 flex-1 flex flex-col gap-6">
          
          {/* Motivation */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 animate-slide-up relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
             <p className="text-sm font-bold text-indigo-500 mb-2 uppercase tracking-widest">Daily Wisdom</p>
             <p className="text-xl md:text-2xl font-serif text-slate-800 dark:text-slate-200 leading-relaxed italic relative z-10">
               "{motivation}"
             </p>
          </div>

          {/* Progress */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
             <div className="flex justify-between items-end mb-3">
               <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Today's Focus</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{completedTasks.length} of {tasks.length} tasks completed</p>
               </div>
               <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{progress}%</span>
             </div>
             <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out rounded-full" style={{ width: `${progress}%` }}></div>
             </div>
          </div>

          {/* Task List */}
          <div className="space-y-4 pb-8">
             {tasks.length === 0 && (
               <div className="text-center py-16 opacity-50">
                 <p className="text-slate-400 text-lg">Your mind is clear.</p>
                 <p className="text-sm text-slate-400">Tap + to add a task.</p>
               </div>
             )}

             {pendingTasks.map(task => (
               <TaskCard 
                  key={task.id} 
                  task={task} 
                  onComplete={() => setCompleteTaskData(task)} 
                  onDelete={() => handleDeleteRequest(task)} 
                  onEdit={() => setEditTaskData(task)}
                  onViewProof={() => setProofViewUrl(task.completionProof || null)}
                />
             ))}

             {/* Failed Tasks */}
             {failedTasks.length > 0 && (
                <div className="pt-4 opacity-80 grayscale">
                  <h4 className="text-sm font-bold text-red-500 mb-3 px-2 uppercase tracking-wider">Failed</h4>
                  <div className="space-y-4">
                     {failedTasks.map(task => (
                      <TaskCard key={task.id} task={task} onComplete={() => {}} onDelete={() => handleDeleteRequest(task)} onEdit={() => {}} onViewProof={() => {}} />
                    ))}
                  </div>
                </div>
            )}

             {/* Completed Tasks */}
             {completedTasks.length > 0 && (
                <div className="pt-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                  <h4 className="text-sm font-bold text-green-500 mb-3 px-2 uppercase tracking-wider">Completed</h4>
                  <div className="space-y-4">
                     {completedTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onComplete={() => {}} 
                        onDelete={() => handleDeleteRequest(task)} 
                        onEdit={() => {}}
                        onViewProof={() => setProofViewUrl(task.completionProof || null)}
                      />
                    ))}
                  </div>
                </div>
            )}
          </div>
        </div>

        {/* Voice Interface Overlay */}
        {currentHash === '#voice' && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
             <div className="bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl p-6 border-t border-slate-200 dark:border-slate-800 animate-slide-up">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Mic className={isListening ? "text-red-500 animate-pulse" : "text-slate-400"} size={20} />
                    {isListening ? "Listening..." : "Edit & Review"}
                  </h3>
                  <button onClick={goHome} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={24} />
                  </button>
                </div>

                <textarea
                  value={voiceDraft}
                  onChange={(e) => setVoiceDraft(e.target.value)}
                  className="w-full h-32 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-lg text-slate-800 dark:text-slate-100 border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4 font-medium"
                  placeholder={isListening ? "Speak now..." : "Transcript will appear here..."}
                />

                <div className="flex gap-3">
                   <button onClick={goHome} className="flex-1 py-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2">
                      Cancel
                   </button>
                   <button 
                      onClick={confirmVoiceDraft} 
                      disabled={!voiceDraft || aiProcessing}
                      className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
                   >
                      {aiProcessing ? <BrainCircuit className="animate-pulse" /> : <Send size={20} />}
                      {aiProcessing ? "Processing..." : "Send to AI"}
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Floating Action Button */}
        {currentHash === '#home' && (
          <div className="fixed bottom-6 right-6 flex flex-col gap-4 items-end z-30">
            {/* Voice Trigger */}
            {settings.enableVoiceInput && (
              <button 
                  onClick={startListening}
                  className="flex items-center gap-2 px-5 h-14 rounded-full shadow-lg transition-all duration-300 font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:scale-105"
              >
                  <Mic size={24} className="text-indigo-500" />
                  <span className="text-sm">Tap to Speak</span>
              </button>
            )}
            
            {/* Add Button */}
            <button 
              onClick={() => navigate('#add')}
              className="h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-xl shadow-indigo-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            >
              <Plus size={32} />
            </button>
          </div>
        )}

      </div>

      {/* --- MODALS --- */}

      {/* Manual Add Modal */}
      <Modal isOpen={currentHash === '#add'} onClose={goHome} title="New Task">
         <form onSubmit={handleManualAdd} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Title</label>
              <input 
                type="text" 
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                placeholder="What needs doing?"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Details</label>
              <textarea 
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                placeholder="Optional description..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Deadline</label>
              <input 
                type="datetime-local" 
                value={manualDeadline}
                onChange={(e) => setManualDeadline(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors text-lg shadow-lg shadow-indigo-500/20">
              Create Task
            </button>
         </form>
      </Modal>

      {/* Edit Modal */}
      <EditTaskModal 
        task={editTaskData}
        isOpen={!!editTaskData}
        onClose={() => setEditTaskData(null)}
        onSave={(t) => {
           setTasks(prev => prev.map(old => old.id === t.id ? t : old));
           setEditTaskData(null);
        }}
      />

      {/* Completion Modal */}
      <CompletionModal 
        isOpen={!!completeTaskData}
        onClose={() => setCompleteTaskData(null)}
        onConfirm={handleCompleteConfirm}
        taskTitle={completeTaskData?.title || ''}
      />

      {/* Strict Delete Judge (Pending Tasks) */}
      {strictDeleteTask && (
        <StrictDeleteDialog 
          task={strictDeleteTask} 
          isOpen={currentHash === '#court'} 
          onClose={goHome} 
          onConfirmDelete={handleStrictDelete}
          modelSelection={settings.geminiModel}
        />
      )}

      {/* Simple Delete (Completed Tasks) */}
      {simpleDeleteTask && (
         <SimpleDeleteModal 
            isOpen={!!simpleDeleteTask}
            onClose={() => setSimpleDeleteTask(null)}
            onConfirm={handleSimpleDelete}
            taskTitle={simpleDeleteTask.title}
         />
      )}

      {/* View Proof Modal */}
      {proofViewUrl && (
        <Modal isOpen={!!proofViewUrl} onClose={() => setProofViewUrl(null)} title="Completion Proof">
           <img src={proofViewUrl} alt="Evidence" className="w-full h-auto rounded-xl" />
        </Modal>
      )}

    </div>
  );
}

export default App;

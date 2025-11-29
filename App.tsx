
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Mic, MicOff, BrainCircuit, Menu, Send, X, AlertTriangle, User } from 'lucide-react';
import TaskCard from './components/TaskCard';
import Modal from './components/Modal';
import Sidebar from './components/Sidebar';
import StrictDeleteDialog from './components/StrictDeleteDialog';
import SimpleDeleteModal from './components/SimpleDeleteModal';
import EditTaskModal from './components/EditTaskModal';
import CompletionModal from './components/CompletionModal';
import RecycleBin from './components/RecycleBin';
import UsageStats from './components/UsageStats';
import MentorManager from './components/MentorManager';
import { Task, Theme, AppSettings, UserStats, Mentor } from './types';
import { parseVoiceCommand, getPersonalizedQuote } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'focus-ai-data';
const SETTINGS_KEY = 'focus-ai-settings';
const STATS_KEY = 'focus-ai-stats';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

const DEFAULT_MENTOR_VK: Mentor = {
  id: 'default-vk',
  name: 'Virat Kohli',
  quotes: [],
  isDefault: true,
  // Photo can be uploaded by user, but default is undefined (silhouette)
};

const DEFAULT_SETTINGS: AppSettings = {
  geminiModel: 'gemini-1.5-flash',
  theme: Theme.LIGHT,
  enableVoiceInput: true,
  enableVoiceResponse: true,
  mentors: [DEFAULT_MENTOR_VK],
  activeMentorId: 'default-vk',
  mentorMode: 'selected'
};

const DEFAULT_STATS: UserStats = {
  totalCreated: 0,
  totalCompleted: 0,
  totalDeleted: 0,
  currentStreak: 0,
  lastCompletionDate: null
};

function App() {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState(''); 
  const [aiProcessing, setAiProcessing] = useState(false);

  // App State - Motivation
  const [motivation, setMotivation] = useState('Initializing Focus Protocol...');
  const [currentMentor, setCurrentMentor] = useState<Mentor | null>(null);
  const [isQuoteFading, setIsQuoteFading] = useState(false);
  
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
      // Merge for backward compatibility
      const parsed = JSON.parse(savedSettings);
      
      // Migration logic: ensure mentors exist
      if (!parsed.mentors || parsed.mentors.length === 0) {
        parsed.mentors = [DEFAULT_MENTOR_VK];
        parsed.activeMentorId = DEFAULT_MENTOR_VK.id;
      }

      setSettings({ ...DEFAULT_SETTINGS, ...parsed });
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setSettings(prev => ({ ...prev, theme: Theme.DARK }));
    }

    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setTasks(parsed.tasks || []);
    }

    const savedStats = localStorage.getItem(STATS_KEY);
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tasks,
      lastLogin: new Date().toDateString()
    }));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    if (settings.theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // --- Quote Logic (Auto Refresh 1 min) ---

  const refreshQuote = useCallback(async () => {
    if (settings.mentors.length === 0) return;

    setIsQuoteFading(true);
    
    setTimeout(async () => {
        // 1. Determine Mentor
        let targetMentor: Mentor;
        if (settings.mentorMode === 'random') {
            targetMentor = settings.mentors[Math.floor(Math.random() * settings.mentors.length)];
        } else {
            targetMentor = settings.mentors.find(m => m.id === settings.activeMentorId) || settings.mentors[0];
        }

        // 2. Get Quote
        let quoteText = "";
        // Try manual quotes first if available (50% chance if AI also available? No, prioritize variety. 
        // Let's say: If manual quotes exist, 50% chance to use one. Else use AI.)
        // Prompt says: "Add a list of quotes...".
        
        const useManual = targetMentor.quotes.length > 0 && Math.random() > 0.4; // 60% chance for manual if exists
        
        if (useManual) {
            quoteText = targetMentor.quotes[Math.floor(Math.random() * targetMentor.quotes.length)];
             // Formatting check
             if (!quoteText.includes(targetMentor.name)) {
                 quoteText = `"${quoteText}" - ${targetMentor.name}`;
             }
        } else {
            // Use Gemini
            quoteText = await getPersonalizedQuote(targetMentor.name, settings.geminiModel);
        }

        setMotivation(quoteText);
        setCurrentMentor(targetMentor);
        setIsQuoteFading(false);

    }, 300); // Wait for fade out
  }, [settings.mentors, settings.activeMentorId, settings.mentorMode, settings.geminiModel]);

  // Initial Fetch & Interval
  useEffect(() => {
    refreshQuote();
    const interval = setInterval(refreshQuote, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [refreshQuote]);


  // --- Logic Helpers ---
  
  const updateStats = (type: 'created' | 'completed' | 'deleted') => {
    setStats(prev => {
      const newStats = { ...prev };
      if (type === 'created') newStats.totalCreated++;
      if (type === 'deleted') newStats.totalDeleted++;
      if (type === 'completed') {
        newStats.totalCompleted++;
        const today = new Date().toDateString();
        if (newStats.lastCompletionDate !== today) {
          // Simple streak logic: check if last completion was yesterday
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (newStats.lastCompletionDate === yesterday.toDateString()) {
             newStats.currentStreak++;
          } else if (newStats.lastCompletionDate !== today) {
             newStats.currentStreak = 1; // Reset or Start new
          }
          newStats.lastCompletionDate = today;
        }
      }
      return newStats;
    });
  };

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
    };
    
    recognitionRef.current.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setVoiceDraft(text);
    };

    recognitionRef.current.start();
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
      updateStats('created');
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
    updateStats('created');
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

  const performSoftDelete = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, deletedAt: new Date().toISOString() } : t));
    updateStats('deleted');
  };

  const handleSimpleDelete = () => {
    if (simpleDeleteTask) {
      performSoftDelete(simpleDeleteTask.id);
      setSimpleDeleteTask(null);
    }
  };

  const handleStrictDelete = () => {
    if (strictDeleteTask) {
       performSoftDelete(strictDeleteTask.id);
       setStrictDeleteTask(null);
       speak("Task removed.");
       goHome();
    }
  };

  const handleRestoreTask = (task: Task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, deletedAt: undefined } : t));
  };

  const handlePermanentDelete = (task: Task) => {
    setTasks(prev => prev.filter(t => t.id !== task.id));
  };

  const handleCompleteConfirm = (proof?: string) => {
    if (completeTaskData) {
      setTasks(prev => prev.map(t => t.id === completeTaskData.id ? { 
        ...t, 
        status: 'completed',
        completionProof: proof 
      } : t));
      updateStats('completed');
      setCompleteTaskData(null);
      speak("Task verified. Excellent work.");
    }
  };

  // Filter Tasks (Active vs Deleted)
  const activeTasks = tasks.filter(t => !t.deletedAt);
  const deletedTasks = tasks.filter(t => t.deletedAt);

  const pendingTasks = activeTasks.filter(t => t.status === 'pending');
  const completedTasks = activeTasks.filter(t => t.status === 'completed');
  const failedTasks = activeTasks.filter(t => t.status === 'failed');
  const progress = activeTasks.length === 0 ? 0 : Math.round((completedTasks.length / activeTasks.length) * 100);


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Sidebar Overlay based on Hash */}
      <Sidebar 
        isOpen={currentHash === '#settings'} 
        onClose={goHome} 
        settings={settings}
        onUpdateSettings={setSettings}
      />

      {/* Recycle Bin Page */}
      {currentHash === '#bin' && (
         <RecycleBin 
            tasks={deletedTasks}
            onRestore={handleRestoreTask}
            onDeleteForever={handlePermanentDelete}
            onBack={goHome}
         />
      )}

      {/* Usage Stats Page */}
      {currentHash === '#stats' && (
         <UsageStats 
            stats={stats}
            onBack={goHome}
         />
      )}

      {/* Mentor Manager Page */}
      {currentHash === '#mentors' && (
         <MentorManager 
            settings={settings}
            onUpdateSettings={setSettings}
            onBack={goHome}
         />
      )}

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
          
          {/* Daily Wisdom Card - Auto Refreshing */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 animate-slide-up relative overflow-hidden flex items-center justify-between gap-4 min-h-[130px]">
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
             
             <div className={`flex-1 relative z-10 transition-opacity duration-300 ${isQuoteFading ? 'opacity-0' : 'opacity-100'}`}>
                <p className="text-sm font-bold text-indigo-500 mb-2 uppercase tracking-widest flex items-center gap-2">
                   Daily Wisdom
                </p>
                <p className="text-lg md:text-xl font-serif text-slate-800 dark:text-slate-200 leading-relaxed italic">
                  {motivation}
                </p>
             </div>
             
             {/* Speaker Image - Always on Right - Base64 Safe */}
             <div className="shrink-0 relative z-10">
                {currentMentor?.photo ? (
                  <img 
                    src={currentMentor.photo} 
                    alt={currentMentor.name} 
                    className="w-14 h-14 rounded-full shadow-md object-cover animate-fade-in border-2 border-white dark:border-slate-700 cursor-pointer"
                    onClick={() => navigate('#mentors')}
                    title={`Manage ${currentMentor.name}`}
                  />
                ) : (
                  <div 
                    className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    onClick={() => navigate('#mentors')}
                    title="Manage Mentors"
                  >
                     <User size={24} />
                  </div>
                )}
             </div>
          </div>

          {/* Progress */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
             <div className="flex justify-between items-end mb-3">
               <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Today's Focus</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{completedTasks.length} of {activeTasks.length} tasks completed</p>
               </div>
               <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{progress}%</span>
             </div>
             <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out rounded-full" style={{ width: `${progress}%` }}></div>
             </div>
          </div>

          {/* Task List */}
          <div className="space-y-4 pb-8">
             {activeTasks.length === 0 && (
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

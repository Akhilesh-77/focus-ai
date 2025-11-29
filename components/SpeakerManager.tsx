
import React from 'react';
import { ArrowLeft, Upload, User, Trash2 } from 'lucide-react';
import { AppSettings } from '../types';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onBack: () => void;
}

// STRICTLY ONLY VIRAT KOHLI
const PRESET_AUTHORS = ["Virat Kohli"];

const SpeakerManager: React.FC<Props> = ({ settings, onUpdateSettings, onBack }) => {
  
  const handleImageUpload = (author: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onUpdateSettings({
          ...settings,
          speakerImages: {
            ...settings.speakerImages,
            [author]: base64
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (author: string) => {
    const newImages = { ...settings.speakerImages };
    delete newImages[author];
    onUpdateSettings({
      ...settings,
      speakerImages: newImages
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-30 flex flex-col animate-fade-in overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
           <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
           <User className="text-slate-400" />
           <h2 className="text-xl font-bold">Speaker Photos</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Manage the photo for your mentor. This photo will appear on the Daily Wisdom card.
        </p>
        
        <div className="grid grid-cols-1 gap-4">
          {PRESET_AUTHORS.map(author => {
            // Check for image using exact name match
            const hasImage = !!settings.speakerImages[author];
            const imageSrc = settings.speakerImages[author];

            return (
              <div key={author} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="relative w-14 h-14 shrink-0">
                      {hasImage ? (
                        <img 
                          src={imageSrc} 
                          alt={author} 
                          className="w-full h-full rounded-full object-cover shadow-sm"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
                           <User size={24} />
                        </div>
                      )}
                   </div>
                   <span className="font-bold text-slate-800 dark:text-white">{author}</span>
                 </div>

                 <div className="flex items-center gap-2">
                    <label className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                       <Upload size={18} />
                       <input 
                         type="file" 
                         accept="image/*" 
                         className="hidden" 
                         onChange={(e) => handleImageUpload(author, e)} 
                       />
                    </label>
                    {hasImage && (
                      <button 
                        onClick={() => removeImage(author)}
                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                 </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SpeakerManager;

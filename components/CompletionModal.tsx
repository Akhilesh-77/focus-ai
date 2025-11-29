
import React, { useState } from 'react';
import Modal from './Modal';
import { Camera, Upload, ShieldCheck } from 'lucide-react';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (proof?: string) => void;
  taskTitle: string;
}

type Step = 'honesty' | 'proof';

const CompletionModal: React.FC<CompletionModalProps> = ({ isOpen, onClose, onConfirm, taskTitle }) => {
  const [step, setStep] = useState<Step>('honesty');
  const [proofImage, setProofImage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setStep('honesty');
      setProofImage(null);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinish = () => {
    onConfirm(proofImage || undefined);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={step === 'honesty' ? "Verification" : "Evidence"}>
      {step === 'honesty' && (
        <div className="space-y-6 text-center py-2 animate-fade-in">
          <div className="mx-auto w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600">
             <ShieldCheck size={40} />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Honesty Check</h4>
            <p className="text-slate-600 dark:text-slate-300 font-medium px-4 text-sm leading-relaxed">
              Have you <span className="text-indigo-600 dark:text-indigo-400 font-bold underline">TRULY</span> completed this task honestly?
            </p>
            <p className="text-lg font-bold text-slate-800 dark:text-white mt-4 italic bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
              "{taskTitle}"
            </p>
          </div>
          <div className="flex gap-4 pt-4">
             <button onClick={onClose} className="flex-1 py-4 text-slate-600 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors">
               No
             </button>
             <button onClick={() => setStep('proof')} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-colors">
               Yes, Completed
             </button>
          </div>
        </div>
      )}

      {step === 'proof' && (
        <div className="space-y-6 text-center py-2 animate-slide-up">
           <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600">
             <Camera size={40} />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Upload Proof?</h4>
            <p className="text-slate-500 dark:text-slate-400 px-4 text-sm">
              Do you want to attach a photo as evidence of your hard work?
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
             <label className="w-full cursor-pointer group">
                <div className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${proofImage ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                   {proofImage ? (
                     <img src={proofImage} alt="Proof" className="h-full w-full object-contain rounded-lg" />
                   ) : (
                     <>
                       <Upload className="text-slate-400 group-hover:text-indigo-500 transition-colors" size={32} />
                       <span className="text-sm text-slate-400 font-medium mt-2">Tap to upload photo</span>
                     </>
                   )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
             </label>
          </div>

          <div className="flex gap-4 pt-4">
             <button onClick={handleFinish} className="flex-1 py-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium">
               Skip
             </button>
             <button onClick={handleFinish} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-colors">
               Finish
             </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CompletionModal;

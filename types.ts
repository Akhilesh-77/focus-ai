
export type TaskStatus = 'pending' | 'completed' | 'failed';

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline?: string; // ISO String
  createdAt: string; // ISO String
  status: TaskStatus;
  completionProof?: string; // Base64 Data URL of attached image
  deletedAt?: string; // ISO String if in recycle bin
}

export interface AIParsedTask {
  title: string;
  description: string;
  deadlineRelativeSeconds?: number; // How many seconds from now
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export type GeminiModelType = 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-2.0' | 'gemini-exp';

export interface Mentor {
  id: string;
  name: string;
  photo?: string; // Base64
  quotes: string[];
  isDefault?: boolean; // If true, cannot be deleted (e.g. Virat Kohli)
}

export interface AppSettings {
  geminiModel: GeminiModelType;
  theme: Theme;
  enableVoiceInput: boolean;
  enableVoiceResponse: boolean;
  
  // New Mentor System
  mentors: Mentor[];
  activeMentorId: string; // ID of the currently selected mentor
  mentorMode: 'random' | 'selected';
}

export interface JudgeResult {
  verdict: 'approved' | 'rejected' | 'inquiry';
  message: string;
  question?: string;
}

export interface UserStats {
  totalCreated: number;
  totalCompleted: number;
  totalDeleted: number;
  currentStreak: number;
  lastCompletionDate: string | null;
}

export type AppRoute = 'home' | 'settings' | 'add' | 'court' | 'voice' | 'quotes' | 'bin' | 'stats' | 'mentors';


import { GoogleGenAI, Type } from "@google/genai";
import { AIParsedTask, GeminiModelType, JudgeResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Map user-friendly selection to actual API model names
const getModelName = (selection: GeminiModelType): string => {
  switch (selection) {
    case 'gemini-1.5-flash': return 'gemini-2.5-flash';
    case 'gemini-1.5-pro': return 'gemini-3-pro-preview';
    case 'gemini-2.0': return 'gemini-2.0-flash-exp'; 
    case 'gemini-exp': return 'gemini-exp-1206';
    default: return 'gemini-2.5-flash';
  }
};

export const parseVoiceCommand = async (transcript: string, modelSelection: GeminiModelType): Promise<AIParsedTask | null> => {
  try {
    const modelName = getModelName(modelSelection);
    const prompt = `
      Extract a task from this voice command: "${transcript}".
      If the user specifies a time (e.g., "in 2 hours", "by 5pm"), calculate the seconds from now until that time and return it as deadlineRelativeSeconds.
      If no description is provided, use a brief summary of the title.
      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            deadlineRelativeSeconds: { type: Type.NUMBER, description: "Seconds from now until deadline, or null if no deadline" },
          },
          required: ["title", "description"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AIParsedTask;
  } catch (error) {
    console.error("Gemini parse error:", error);
    return null;
  }
};

export const getPersonalizedQuote = async (authorName: string, modelSelection: GeminiModelType): Promise<string> => {
  try {
    const modelName = getModelName(modelSelection);
    
    const prompt = `
      Give a short, punchy, 1-sentence motivational quote from ${authorName}.
      Tone: High performance, Discipline, Aggression, Focus.
      CRITICAL: You MUST end the quote exactly with this format: " - ${authorName}".
      Example Output: "Self-belief and hard work will always earn you success. - ${authorName}"
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    const text = response.text;
    if (text && text.includes(authorName)) {
        return text;
    }
    return `Stay focused and never give up. - ${authorName}`;
  } catch (error) {
    return `Hard work beats talent when talent doesn't work hard. - ${authorName}`;
  }
};

export const judgeDeletion = async (
  taskTitle: string, 
  userReason: string, 
  history: string[], 
  modelSelection: GeminiModelType
): Promise<JudgeResult> => {
  try {
    const modelName = getModelName(modelSelection);
    const prompt = `
      You are a Strict Productivity Judge. A user wants to delete the task: "${taskTitle}".
      Current reason provided: "${userReason}".
      Conversation History: ${JSON.stringify(history)}
      
      Your goal: Prevent the user from being lazy, but distinguish between laziness and genuine burnout.
      
      CRITICAL HEALTH EXCEPTION RULE:
      If the user mentions: tired, sleep, sleepy, fatigue, sick, stress, exhaustion, headache, mental burnout.
      1. If you have ALREADY asked "Do you promise to return to this task later? Yes or No?" and the user answered "Yes" or "No" -> APPROVED immediately.
      2. If you have NOT asked it yet -> Return 'inquiry'. Message MUST be exactly: "Your health comes first. Do you promise to return to this task later? Yes or No?". Do not ask anything else.

      NORMAL RULES (Only if not a health exception):
      1. If reason is short, empty, emotional (without valid fatigue), or lazy -> REJECT immediately.
      2. If user answers probing questions reasonably and shows self-awareness -> APPROVED.
      3. If reason is strictly logical (e.g., "Duplicate task", "Already done") -> APPROVED.
      4. If user fails to justify after questioning -> REJECT.
      5. If ambiguous -> Return 'inquiry' with a probing question.

      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: { type: Type.STRING, enum: ["approved", "rejected", "inquiry"] },
            message: { type: Type.STRING, description: "The judge's response to the user." },
            question: { type: Type.STRING, description: "The follow-up question if verdict is inquiry." },
          },
          required: ["verdict", "message"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as JudgeResult;
  } catch (error) {
    console.error("Judge error:", error);
    return { verdict: 'rejected', message: "System error. Discipline prevails. Task stays." };
  }
};

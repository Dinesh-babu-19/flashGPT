import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Newest stable free-tier models first, older documented one last.
// The helper below falls through this list when Google returns
// 404 / model-not-found, so a future retirement degrades instead of 500ing.
export const GEMINI_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite"
];

const isModelNotFound = (error) => {
    const status = error?.status;
    const message = error?.message || "";
    return status === 404 || /not found|not supported/i.test(message);
};

export async function generateText(prompt) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing in server/.env");
    }

    let lastError;
    for (const model of GEMINI_MODELS) {
        try {
            const response = await ai.models.generateContent({ model, contents: prompt });
            const text = response.text;
            if (!text) {
                throw new Error(`Empty response from ${model}`);
            }
            return { text, model };
        } catch (error) {
            lastError = error;
            console.warn(`Gemini model ${model} failed (${error?.message || error}), trying fallback...`);
        }
    }
    throw lastError;
}

export default ai;

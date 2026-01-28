
import { GoogleGenAI, Type } from "@google/genai";
import { GameInputs, ValidationResult } from "../types";

// Helper for local validation when AI is unavailable or quota is exceeded
const localValidate = (letter: string, inputs: GameInputs, reason: string): ValidationResult => {
  const validateItem = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return { valid: false, score: 0, message: "Empty" };
    }
    // Check if starts with correct letter
    if (trimmed.charAt(0).toLowerCase() !== letter.toLowerCase()) {
      return { valid: false, score: 0, message: "Wrong Letter" };
    }
    // Basic length check
    if (trimmed.length < 2) {
       return { valid: false, score: 0, message: "Too Short" };
    }
    // If we are here, it starts with the letter. 
    // Since we can't semantically verify without AI, we give the benefit of the doubt.
    return { valid: true, score: 10, message: `Accepted (${reason})` };
  };

  const name = validateItem(inputs.name);
  const place = validateItem(inputs.place);
  const animal = validateItem(inputs.animal);
  const thing = validateItem(inputs.thing);

  return {
    name,
    place,
    animal,
    thing,
    totalRoundScore: name.score + place.score + animal.score + thing.score
  };
};

export const validateAnswers = async (
  letter: string,
  inputs: GameInputs
): Promise<ValidationResult> => {
  const apiKey = process.env.API_KEY;

  // 1. If no API Key is provided, immediately use local fallback.
  // This allows the game to be played "offline" or without setup.
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    console.warn("API Key missing. Using local validation.");
    return localValidate(letter, inputs, "Offline Mode");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  const prompt = `
    You are the judge of a "Name Place Animal Thing" game.
    The current letter is "${letter}".
    
    Evaluate the following user inputs:
    ${JSON.stringify(inputs, null, 2)}

    For each category (name, place, animal, thing):
    - Check if the word starts with the letter "${letter}" (case-insensitive).
    - Check if the word is a valid entry for that category.
    - Be lenient with spelling if it is phonetically close.
    - If the input is empty or just the letter itself, it is invalid.
    - Assign a score: 10 for valid, 0 for invalid.
    - Provide a short, fun message explaining why it is valid or invalid (max 6 words).

    Return the result in strict JSON format matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.OBJECT,
              properties: {
                valid: { type: Type.BOOLEAN },
                score: { type: Type.INTEGER },
                message: { type: Type.STRING },
              },
              required: ["valid", "score", "message"],
            },
            place: {
              type: Type.OBJECT,
              properties: {
                valid: { type: Type.BOOLEAN },
                score: { type: Type.INTEGER },
                message: { type: Type.STRING },
              },
              required: ["valid", "score", "message"],
            },
            animal: {
              type: Type.OBJECT,
              properties: {
                valid: { type: Type.BOOLEAN },
                score: { type: Type.INTEGER },
                message: { type: Type.STRING },
              },
              required: ["valid", "score", "message"],
            },
            thing: {
              type: Type.OBJECT,
              properties: {
                valid: { type: Type.BOOLEAN },
                score: { type: Type.INTEGER },
                message: { type: Type.STRING },
              },
              required: ["valid", "score", "message"],
            },
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");

    const parsed = JSON.parse(jsonText);
    
    // Calculate total score safely
    const totalRoundScore = 
      (parsed.name?.score || 0) + 
      (parsed.place?.score || 0) + 
      (parsed.animal?.score || 0) + 
      (parsed.thing?.score || 0);

    return {
      ...parsed,
      totalRoundScore
    } as ValidationResult;

  } catch (error: any) {
    console.error("Gemini Validation Error:", error);
    
    // 2. Determine if it's a quota issue or other transient error
    let shortError = "AI Busy";
    const msg = error?.message || "";
    
    if (msg.includes("429")) shortError = "Quota Limit"; // Quota exceeded
    else if (msg.includes("401") || msg.includes("403")) shortError = "Bad Key";
    else if (msg.includes("503")) shortError = "Server Busy";
    else if (msg.includes("Failed to fetch")) shortError = "No Internet";

    // 3. Fallback to local validation so the user can continue playing
    // The message will indicate why AI wasn't used (e.g., "Accepted (Quota Limit)")
    return localValidate(letter, inputs, shortError);
  }
};

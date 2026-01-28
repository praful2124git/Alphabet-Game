
import { GoogleGenAI, Type } from "@google/genai";
import { GameInputs, ValidationResult } from "../types";

// We do not initialize 'ai' here to prevent the app from crashing on load 
// if the API Key is missing. We initialize it inside the function.

export const validateAnswers = async (
  letter: string,
  inputs: GameInputs
): Promise<ValidationResult> => {
  const apiKey = process.env.API_KEY;

  // Graceful fallback if key is missing
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    console.error("API Key is missing. Please set API_KEY in your environment variables.");
    return {
      name: { valid: false, score: 0, message: "API Key Missing" },
      place: { valid: false, score: 0, message: "Check Config" },
      animal: { valid: false, score: 0, message: "No Key Found" },
      thing: { valid: false, score: 0, message: "Set API_KEY" },
      totalRoundScore: 0
    };
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
    
    // Determine a user-friendly error message
    let shortError = "Error";
    const msg = error?.message || "";
    
    if (msg.includes("401") || msg.includes("403")) shortError = "Invalid API Key";
    else if (msg.includes("429")) shortError = "Quota Exceeded";
    else if (msg.includes("404")) shortError = "Model Issue";
    else if (msg.includes("500") || msg.includes("503")) shortError = "Server Busy";
    else if (msg.includes("Safety")) shortError = "Safety Block";
    else shortError = "Connection Failed";

    return {
      name: { valid: false, score: 0, message: shortError },
      place: { valid: false, score: 0, message: shortError },
      animal: { valid: false, score: 0, message: shortError },
      thing: { valid: false, score: 0, message: shortError },
      totalRoundScore: 0
    };
  }
};

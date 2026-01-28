import { GoogleGenAI, Type } from "@google/genai";
import { GameInputs, ValidationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const validateAnswers = async (
  letter: string,
  inputs: GameInputs
): Promise<ValidationResult> => {
  const prompt = `
    You are the judge of a "Name Place Animal Thing" game.
    The current letter is "${letter}".
    
    Evaluate the following user inputs:
    1. Name: "${inputs.name}"
    2. Place: "${inputs.place}"
    3. Animal: "${inputs.animal}"
    4. Thing: "${inputs.thing}"

    For each category:
    - Check if the word starts with the letter "${letter}" (case-insensitive).
    - Check if the word is a valid entry for that category.
    - Be lenient with spelling if it is phonetically close, but strict about the starting letter.
    - If the input is empty, it is invalid.
    - Assign a score: 10 for valid, 0 for invalid.
    - Provide a short, fun message explaining why it is valid or invalid (max 10 words).

    Return the result in strict JSON format.
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
    if (!jsonText) throw new Error("No response from AI");

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

  } catch (error) {
    console.error("Gemini Validation Error:", error);
    // Fallback in case of error (e.g., API issues) - marking all as 0 to be safe, or could retry
    return {
      name: { valid: false, score: 0, message: "Error validating" },
      place: { valid: false, score: 0, message: "Error validating" },
      animal: { valid: false, score: 0, message: "Error validating" },
      thing: { valid: false, score: 0, message: "Error validating" },
      totalRoundScore: 0
    };
  }
};
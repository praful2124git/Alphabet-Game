
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

  // 1. Check for API Key
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    console.warn("API Key missing. Using local validation.");
    return localValidate(letter, inputs, "Offline Mode");
  }

  // Construct the prompt for Llama 3
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

    Return the result in strict JSON format matching this schema:
    {
      "name": { "valid": boolean, "score": number, "message": string },
      "place": { "valid": boolean, "score": number, "message": string },
      "animal": { "valid": boolean, "score": number, "message": string },
      "thing": { "valid": boolean, "score": number, "message": string }
    }
  `;

  try {
    // 2. Call Groq API via fetch
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { 
            role: "system", 
            content: "You are a helpful game judge that outputs only valid JSON." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `HTTP Error ${response.status}`);
    }

    const data = await response.json();
    const jsonText = data.choices?.[0]?.message?.content;

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
    console.error("Groq/AI Validation Error:", error);
    
    // 3. Error Handling & Fallback
    let shortError = "AI Busy";
    const msg = (error?.message || "").toLowerCase();
    
    if (msg.includes("429")) shortError = "Quota Limit"; 
    else if (msg.includes("401") || msg.includes("403")) shortError = "Bad Key";
    else if (msg.includes("500") || msg.includes("503")) shortError = "Server Error";
    else if (msg.includes("fetch")) shortError = "No Internet";

    // Fallback to local validation
    return localValidate(letter, inputs, shortError);
  }
};

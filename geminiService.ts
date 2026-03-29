import { GoogleGenAI } from "@google/genai";
import { Recipe, Ingredient, UserPreferences } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function detectIngredients(base64Image: string): Promise<Ingredient[]> {
  try {
    let base64Data = base64Image;
    let mimeType = "image/jpeg";

    if (base64Image.includes(";base64,")) {
      const parts = base64Image.split(";base64,");
      mimeType = parts[0].split(":")[1];
      base64Data = parts[1];
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            { text: "Identify all food ingredients in this image. Return ONLY a JSON array of strings. Example: [\"Tomato\", \"Onion\", \"Garlic\"]" },
          ],
        },
      ],
    });

    const text = response.text || "[]";
    try {
      const cleanText = text.replace(/```json|```/g, "").trim();
      let ingredients = JSON.parse(cleanText);
      
      if (!Array.isArray(ingredients) && typeof ingredients === 'object' && ingredients !== null) {
        if (Array.isArray(ingredients.ingredients)) {
          ingredients = ingredients.ingredients;
        } else {
          const arrayProp = Object.values(ingredients).find(val => Array.isArray(val));
          if (arrayProp) ingredients = arrayProp;
        }
      }
      
      if (!Array.isArray(ingredients)) ingredients = [];
      
      return ingredients.map((name: string) => ({ name, confidence: 0.95 }));
    } catch (parseError) {
      console.error("JSON Parse Error (Detect):", text);
      return [];
    }
  } catch (e) {
    console.error("Failed to detect ingredients", e);
    return [];
  }
}

export async function generateRecipes(
  ingredients: string[],
  preferences: UserPreferences
): Promise<Recipe[]> {
  try {
    const prompt = `Generate 9 yummy and accurate recipes using these ingredients: ${ingredients.join(", ")}.
    
    User Preferences:
    - Cuisine Style: ${preferences.cuisine || "Any (be creative but authentic)"}
    - Dietary Restrictions: ${preferences.dietaryRestrictions.join(", ") || "None"}
    - Allergies: ${preferences.allergies.join(", ") || "None"}
    - Max Cooking Time: ${preferences.maxTime} minutes
    
    IMPORTANT: 
    1. If a specific cuisine is requested, ensure the recipes are authentic to that cuisine.
    2. Ensure the ingredients used are primarily from the provided list, but you can add common pantry staples (salt, oil, water, etc.).
    3. Provide a realistic calorie count for each recipe.
    
    Return ONLY a JSON array of recipe objects with this structure:
    [{
      "id": "unique-id",
      "title": "Recipe Title",
      "description": "Short yummy description",
      "ingredients": ["item 1", "item 2"],
      "instructions": ["step 1", "step 2"],
      "cookingTime": 30,
      "difficulty": "Easy",
      "cuisine": "Cuisine Type",
      "calories": 450,
      "dietaryInfo": ["Vegan", "Gluten-Free"]
    }]`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are a professional master chef who specializes in creating accurate, healthy, and delicious recipes based on available ingredients and user preferences. Always return valid JSON."
      }
    });

    const text = response.text || "[]";
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("JSON Parse Error (Recipes):", text);
      return [];
    }
  } catch (e) {
    console.error("Failed to generate recipes", e);
    return [];
  }
}

export async function generateSpeech(text: string): Promise<string | undefined> {
  return undefined;
}

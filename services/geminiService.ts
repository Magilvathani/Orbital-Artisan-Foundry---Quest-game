
import { GoogleGenAI, Type } from "@google/genai";
import type { Quest } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const questSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A creative, high-tech sounding name for the manufactured item." },
        client: { type: Type.STRING, description: "A futuristic-sounding corporate client name. e.g., 'Astra Dynamics', 'Cygnus Medical', 'Helion Composites'." },
        description: { type: Type.STRING, description: "A brief, engaging description of the item and why it must be manufactured in microgravity." },
        requirements: {
            type: Type.OBJECT,
            properties: {
                materials: { type: Type.NUMBER, description: "Amount of raw materials in kg. Between 50 and 500." },
                time: { type: Type.NUMBER, description: "Time to manufacture in days. Between 5 and 20." }
            },
            required: ['materials', 'time']
        },
        reward: {
            type: Type.OBJECT,
            properties: {
                cash: { type: Type.NUMBER, description: "The cash reward. Proportional to material and time cost. Between 10000 and 100000." },
                research: { type: Type.NUMBER, description: "The research points reward. Between 10 and 100." }
            },
            required: ['cash', 'research']
        },
    },
    required: ['title', 'client', 'description', 'requirements', 'reward']
};

export const generateQuest = async (stationLevel: number): Promise<Quest> => {
  try {
    const prompt = `You are a creative game designer. Create a contract for a futuristic in-space manufacturing company, 'Orbital Artisan Foundry'. The company operates in Low Earth Orbit. The contract should be for a high-value, bespoke component targeting one of these industries: Aerospace, Medical, Luxury Goods, or Advanced Electronics. The complexity and rewards should be appropriate for a station at level ${stationLevel}. Respond ONLY with a single JSON object that strictly follows the provided schema.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: questSchema,
        },
    });

    const jsonText = response.text.trim();
    const questData = JSON.parse(jsonText);
    
    return {
        ...questData,
        id: `quest-${Date.now()}-${Math.random()}`
    };
  } catch (error) {
    console.error("Error generating quest with Gemini:", error);
    // Return a fallback quest on error
    return {
        id: `fallback-${Date.now()}`,
        title: "Manual Override Crystal",
        client: "OAF Internal",
        description: "A critical focusing crystal is needed for the station's comms array. Our primary request to Gemini failed, so we're manufacturing this one from blueprints.",
        requirements: { materials: 50, time: 5 },
        reward: { cash: 10000, research: 10 }
    };
  }
};

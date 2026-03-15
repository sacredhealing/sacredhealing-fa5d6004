/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { ScalarWave, buildSystemInstruction } from "@/features/siddha-sound-oracle/constants";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("VITE_GEMINI_API_KEY not set. Audio analysis will not function.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

export async function analyzeAudio(
  base64Audio: string,
  mimeType: string,
  activeScalarWaves: ScalarWave[] = []
): Promise<string> {
  const systemInstruction = buildSystemInstruction(activeScalarWaves);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction,
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Audio,
            },
          },
          {
            text: activeScalarWaves.length > 0
              ? `Initiate the Alchemical Siddha Reading. The following scalar wave transmissions are active: ${activeScalarWaves.map(w => `${w.name} (${w.field})`).join(", ")}. Channel your full analysis through these living fields. Begin with the Vibrational Siddha Scan, then provide the Alchemical Siddha Reading.`
              : "Initiate the Alchemical Siddha Scan. Begin with the Vibrational Siddha Scan, then provide the Alchemical Siddha Reading.",
          },
        ],
      },
    ],
  });

  const text = (response as { text?: string }).text ?? response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No response from the Oracle.");
  }
  return text;
}

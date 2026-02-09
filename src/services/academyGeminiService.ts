import { supabase } from '@/integrations/supabase/client';
import type { ModuleContent } from '@/types/academy';

const JSON_SCHEMA_INSTRUCTION = `
You MUST respond with ONLY valid JSON, no markdown, no code blocks, no extra text.
The JSON must match this structure exactly:
{
  "title": { "en": "...", "sv": "..." },
  "objective": { "en": "...", "sv": "..." },
  "videoScript": {
    "sections": [
      { "label": { "en": "...", "sv": "..." }, "content": { "en": "...", "sv": "..." } }
    ]
  },
  "meditationScript": { "en": "...", "sv": "..." },
  "workbook": {
    "reflectionQuestions": [
      { "en": "...", "sv": "..." }
    ],
    "practicalExercise": { "en": "...", "sv": "..." }
  },
  "socialHook": { "en": "...", "sv": "..." }
}
`;

export const generateModule = async (month: number, topic: string): Promise<ModuleContent> => {
  const prompt = `You are a world-class Instructional Designer and Spiritual Mentor for 'Sacred Healing Academy'.

The Task:
Create detailed curriculum content for Month ${month}. 
Theme: ${topic}

Requirements:
1. Create a "Video Production Script" with multiple sections. Each section must correspond to the sub-topics listed in the Theme provided above.
2. Provide a "Meditation Script" that integrates the energy of this month's theme.
3. Create a "Student Workbook" with 5 reflection questions and 1 practical exercise.
4. Ensure the tone is professional, grounded in bioenergetics/psychology, yet deeply esoteric.
5. Content MUST be bilingual: provide every single field in both English (en) and Swedish (sv).

Structure the Video Script sections based on the specific titles mentioned in: "${topic}".

${JSON_SCHEMA_INSTRUCTION}`;

  const { data, error } = await supabase.functions.invoke<{ response: string }>('gemini-bridge', {
    body: { prompt, feature: 'academy_curriculum' }
  });

  if (error) {
    throw new Error(error.message || 'Energy transmission failed. Check API configuration.');
  }

  const responseText = data?.response;
  if (!responseText) {
    throw new Error('Empty response from AI');
  }

  // Strip markdown code blocks if present
  let jsonStr = responseText.trim();
  const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    jsonStr = match[1].trim();
  }

  try {
    return JSON.parse(jsonStr) as ModuleContent;
  } catch (e) {
    console.error('Failed to parse AI response:', responseText);
    throw new Error('AI returned invalid JSON content.');
  }
};

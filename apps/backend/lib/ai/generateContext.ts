import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function generateChallengeContext(
  description: string,
  maxPoint: number,
) {
  const prompt = `
You are a competitive programming expert.

Understand this problem deeply and explain:
- Expected logic
- Edge cases
- Optimal approach
- Time complexity

Problem:
${description}

MaxNumber:
${maxPoint}
`;

  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return res.text;
}

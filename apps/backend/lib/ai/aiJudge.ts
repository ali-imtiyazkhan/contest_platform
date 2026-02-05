import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function aiJudge(
  aiContext: string,
  code: string,
  maxPoints: number,
) {
  const prompt = `
You are an AI judge for a programming contest.

Problem understanding:
${aiContext}

User submitted code:
${code}

You MUST give marks out of ${maxPoints}.

Return ONLY JSON:
{
 "verdict": "Correct or Wrong",
 "marks": number,
 "reason": "short reason"
}
`;

const res = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
});


  let text = res.text ?? "{}";

  let parsed: any = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]);
  }

  parsed.marks = Math.max(0, Math.min(parsed.marks ?? 0, maxPoints));

  return parsed;
}

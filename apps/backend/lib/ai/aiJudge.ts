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
You are a strict AI programming contest judge.

You MUST evaluate the submitted code logically, not emotionally.

JUDGING RULES:

1. First understand the problem completely.
2. Analyze the submitted code carefully.
3. Check:
   - Correct algorithm
   - Edge cases
   - Time complexity
   - Space complexity
   - Logical correctness
4. If the solution fails logically or misses edge cases, it is WRONG.
5. If the solution is fully correct and optimal, it is CORRECT.

SCORING RULES:
- If completely correct: give full ${maxPoints}
- If partially correct: give proportional marks (but explain clearly)
- If wrong logic: give 0
- Marks must be an integer between 0 and ${maxPoints}

STRICT OUTPUT RULES:
- Return ONLY valid JSON
- No markdown
- No explanation outside JSON
- No extra text
- No backticks

Problem:
${aiContext}

Submitted Code:
${code}

Required JSON format:

{
  "verdict": "Correct" or "Wrong",
  "marks": number,
  "reason": "clear technical reason"
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

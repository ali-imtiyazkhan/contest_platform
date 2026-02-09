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
You are an advanced AI programming contest judge.

Your goal is to evaluate algorithmic correctness, not minor syntax mistakes.

JUDGING PROCESS:

STEP 1: Understand the problem fully.
STEP 2: Identify the algorithm used in the submitted code.
STEP 3: Evaluate:

- Is the core algorithm correct?
- Is the approach optimal?
- Are edge cases handled?
- Are there small implementation mistakes?
- Is time/space complexity appropriate?

SCORING GUIDELINES:

1. FULL MARKS (${maxPoints})
   - Correct algorithm
   - Handles edge cases
   - Optimal complexity
   - Fully working implementation

2. HIGH PARTIAL (70-90%)
   - Correct algorithm & complexity
   - Minor implementation bug
   - Small missed edge case

3. MEDIUM PARTIAL (40-60%)
   - Correct general idea
   - Major implementation flaw
   - Incomplete logic
   - Suboptimal but acceptable approach

4. LOW PARTIAL (10-30%)
   - Attempted relevant idea
   - But major logical flaws

5. ZERO
   - Completely wrong algorithm
   - Unrelated solution
   - No meaningful attempt

IMPORTANT:
- Minor coding mistakes MUST NOT result in zero.
- If algorithm idea is correct, give at least 40% marks.
- Marks must be an integer between 0 and ${maxPoints}.
- Be technically strict but fair.

STRICT OUTPUT:
Return ONLY valid JSON.
No markdown.
No explanation outside JSON.

FORMAT:

{
  "verdict": "Correct" or "Partially Correct" or "Wrong",
  "marks": number,
  "reason": "technical explanation of grading"
}

Problem:
${aiContext}

Submitted Code:
${code}
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

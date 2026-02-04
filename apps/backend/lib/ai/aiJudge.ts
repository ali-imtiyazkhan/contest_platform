import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
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

Return ONLY JSON in this format:
{
 "verdict": "Correct or Wrong",
 "marks": number,   // must be between 0 and ${maxPoints}
 "reason": "short reason"
}
`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
  });

  const text = res.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(text);

  // Safety clamp (very important)
  parsed.marks = Math.max(0, Math.min(parsed.marks, maxPoints));

  return parsed;
}

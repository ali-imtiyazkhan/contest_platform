import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generateChallengeContext(description: string) {
  const prompt = `
You are a competitive programming expert.

Understand this problem deeply and explain:
- Expected logic
- Edge cases
- Optimal approach
- Time complexity

Problem:
${description}
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return res.choices[0].message.content;
}

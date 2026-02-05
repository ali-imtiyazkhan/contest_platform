import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const run = async () => {
  const pager = await ai.models.list();

  for await (const model of pager) {
    console.log(model.name);
  }
};

run();

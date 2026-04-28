import { RequestHandler } from "express";

// Returns which AI models are available based on configured API keys.
// Called by the client on load to know which model selector buttons to enable.
export const handleGetAiConfig: RequestHandler = (_req, res) => {
  const availableModels: string[] = [];

  if (process.env.OPENAI_API_KEY) availableModels.push("openai");
  if (process.env.GEMINI_API_KEY) availableModels.push("gemini");
  if (process.env.ANTHROPIC_API_KEY) availableModels.push("claude");
  if (process.env.GROQ_API_KEY) availableModels.push("groq");

  res.json({ availableModels });
};

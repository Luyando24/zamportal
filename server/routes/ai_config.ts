import { RequestHandler } from "express";
import { query } from "../lib/db.js";

// Returns which AI models are available and the default model from the DB
export const handleGetAiConfig: RequestHandler = async (_req, res) => {
  try {
    const settings = await query("SELECT * FROM ai_settings LIMIT 1");
    
    // Check environment variables as a baseline
    const envModels: string[] = [];
    if (process.env.OPENAI_API_KEY) envModels.push("openai");
    if (process.env.GEMINI_API_KEY) envModels.push("gemini");
    if (process.env.ANTHROPIC_API_KEY) envModels.push("claude");
    if (process.env.GROQ_API_KEY) envModels.push("groq");

    if (settings.rows.length === 0) {
      return res.json({ 
        availableModels: envModels,
        defaultModel: envModels.includes("openai") ? "openai" : (envModels[0] || "openai")
      });
    }

    const s = settings.rows[0];
    res.json({ 
      availableModels: s.available_models || envModels,
      defaultModel: s.default_model || "openai"
    });
  } catch (err) {
    console.error("AI Config Error:", err);
    res.status(500).json({ error: "Failed to fetch AI settings" });
  }
};

// Update AI settings (Admin only)
export const handleUpdateAiConfig: RequestHandler = async (req, res) => {
  const { defaultModel, availableModels } = req.body;
  try {
    const result = await query(
      `UPDATE ai_settings 
       SET default_model = $1, available_models = $2, updated_at = CURRENT_TIMESTAMP 
       RETURNING *`,
      [defaultModel, availableModels]
    );
    
    if (result.rows.length === 0) {
      // If no row exists, insert one
      const insert = await query(
        "INSERT INTO ai_settings (default_model, available_models) VALUES ($1, $2) RETURNING *",
        [defaultModel, availableModels]
      );
      return res.json(insert.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update AI settings" });
  }
};

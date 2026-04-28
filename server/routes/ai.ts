import { RequestHandler } from "express";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

type SupportedModel = "openai" | "gemini" | "claude" | "groq";

interface GeneratedForm {
  form_name: string;
  fields: Array<{
    label: string;
    type: "text" | "textarea" | "number" | "date" | "file" | "select";
    required: boolean;
    options?: string[];
  }>;
}

const buildUserMessage = (serviceName: string, prompt: string, existingForm?: any) => {
  if (existingForm) {
    return `Service: ${serviceName}\n\nI have an existing form structure:\n${JSON.stringify(existingForm, null, 2)}\n\nPlease modify this form according to the following instructions:\n${prompt}\n\nReturn the ENTIRE updated form structure in JSON.`;
  }
  return `Service: ${serviceName}\n\nDescription: ${prompt}`;
};

const SYSTEM_PROMPT = `You are an expert government service form designer for Zambia's national digital services portal.
Your goal is to generate optimal data collection schemas for Zambian citizens and businesses.
When designing forms, anticipate and automatically include relevant Zambian context and standard requirements, such as:
- National Registration Card (NRC) numbers for citizens
- Taxpayer Identification Numbers (TPIN) (10 digits) for individuals and businesses
- PACRA Registration Details for businesses
- ZRA (Zambia Revenue Authority) and NAPSA details if applicable
- Standard Zambian addresses (Province, District, Plot Number)
- Financial values and fees should use Zambian Kwacha (ZMW)
Given a description of a sub-service, output a JSON object (no markdown, no explanation, no code fences) with this exact structure:
{
  "form_name": "Short, clear sub-service name",
  "fields": [
    { "label": "Field label", "type": "text", "required": true },
    { "label": "Another field", "type": "select", "required": false, "options": ["Option A", "Option B"] }
  ]
}
Valid types: text, textarea, number, date, file, select.
The "options" array is only required when type is "select".
Keep field labels concise, professional, and tailored to Zambian government standards. Return raw JSON only — no extra text.`;

/**
 * Strips markdown code fences that some LLMs wrap around JSON responses.
 * e.g. ```json\n{...}\n``` → {...}
 */
function extractJson(raw: string): string {
  // Find the first occurrence of '{' or '[' and the last occurrence of '}' or ']'
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return raw.substring(firstBrace, lastBrace + 1);
  }
  
  return raw.trim();
}

async function generateWithOpenAI(prompt: string, serviceName: string, existingForm?: any): Promise<GeneratedForm> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(serviceName, prompt, (arguments[2] || undefined)) },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  });
  const raw = completion.choices[0]?.message?.content || "";
  return JSON.parse(extractJson(raw));
}

async function generateWithGemini(prompt: string, serviceName: string, existingForm?: any): Promise<GeneratedForm> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(
    `${SYSTEM_PROMPT}\n\n${buildUserMessage(serviceName, prompt, existingForm)}`
  );
  const raw = result.response.text();
  return JSON.parse(extractJson(raw));
}

async function generateWithClaude(prompt: string, serviceName: string, existingForm?: any): Promise<GeneratedForm> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: buildUserMessage(serviceName, prompt, existingForm) },
    ],
  });
  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  return JSON.parse(extractJson(raw));
}

async function generateWithGroq(prompt: string, serviceName: string, existingForm?: any): Promise<GeneratedForm> {
  // Groq uses the OpenAI-compatible API — no extra package needed
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
  const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(serviceName, prompt, existingForm) },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  });
  const raw = completion.choices[0]?.message?.content || "";
  return JSON.parse(extractJson(raw));
}

export const handleGenerateForm: RequestHandler = async (req, res) => {
  const { prompt, serviceName, model, existingForm } = req.body as {
    prompt: string;
    serviceName: string;
    model: SupportedModel;
    existingForm?: any;
  };

  if (!prompt || !model) {
    return res.status(400).json({ error: "prompt and model are required" });
  }

  // Check that the requested provider's API key is configured
  const keyMap: Record<SupportedModel, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
    groq:   process.env.GROQ_API_KEY,
  };

  if (!keyMap[model]) {
    return res.status(400).json({ error: `API key for ${model} is not configured on this server.` });
  }

  try {
    let generated: GeneratedForm;

    switch (model) {
      case "openai":
        generated = await generateWithOpenAI(prompt, serviceName || "Government Service", existingForm);
        break;
      case "gemini":
        generated = await generateWithGemini(prompt, serviceName || "Government Service", existingForm);
        break;
      case "claude":
        generated = await generateWithClaude(prompt, serviceName || "Government Service", existingForm);
        break;
      case "groq":
        generated = await generateWithGroq(prompt, serviceName || "Government Service", existingForm);
        break;
      default:
        return res.status(400).json({ error: "Invalid model selection" });
    }

    // Attach stable IDs to fields for React rendering
    const { v4: uuidv4 } = await import("uuid");
    const fieldsWithIds = generated.fields.map((f) => ({ ...f, id: uuidv4() }));

    res.json({ form_name: generated.form_name, fields: fieldsWithIds });
  } catch (err: any) {
    // Log the real error internally but never expose provider details to the client
    console.error(`[AI] ${model} generation error:`, err?.message || err);

    const msg: string = (err?.message || err?.error?.message || "").toLowerCase();

    // Classify the error into a safe, generic user-facing message
    let userMessage = "The AI service is temporarily unavailable. Please try again in a moment.";

    if (msg.includes("parse") || msg.includes("json") || msg.includes("syntax")) {
      userMessage = "The AI returned an unexpected response. Please rephrase your description and try again.";
    } else if (msg.includes("timeout") || msg.includes("timed out")) {
      userMessage = "The request took too long. Please try a shorter description.";
    } else if (msg.includes("rate") || msg.includes("limit") || msg.includes("quota")) {
      userMessage = "The AI service is busy right now. Please wait a moment and try again.";
    }
    // All billing/credit/auth errors fall through to the generic message above

    res.status(500).json({ error: userMessage });
  }
};

interface GeneratedService {
  title: string;
  description: string;
  category_slug: string;
  sub_services: GeneratedForm[];
}

const FULL_SERVICE_SYSTEM_PROMPT = `You are an expert government service designer for Zambia's national digital services portal.
Your goal is to generate a comprehensive Service package, including its metadata and initial sub-services (data collection forms).
CRITICAL: A "sub-service" is a completely distinct application workflow, NOT a section or tab of a single form. 
For example, if the Service is "National Registration Card (NRC)", the sub-services should be complete independent use-cases like "New NRC Registration", "NRC Renewal", and "Report Lost NRC" (each containing ALL fields needed for that specific application, like personal info, witness details, etc). DO NOT split a single form into sections like "Basic Info" and "Additional Info".
When designing forms, anticipate Zambian context (NRC, TPIN, PACRA, ZRA, ZMW).
Given a description of a high-level service, output a JSON object (no markdown, no explanation) with this exact structure:
{
  "title": "Service Title",
  "description": "Clear description of the service",
  "category_slug": "business",
  "sub_services": [
    {
      "form_name": "Independent Sub-Service Name (e.g. New NRC Registration)",
      "fields": [
        { "label": "Field label", "type": "text", "required": true }
      ]
    }
  ]
}
Valid categories: identity, transport, business, land, health, education, tax, agriculture.
Valid field types: text, textarea, number, date, file, select.
Return raw JSON only — no extra text.`;

export const handleGenerateService: RequestHandler = async (req, res) => {
  const { prompt, model } = req.body as { prompt: string; model: SupportedModel };

  if (!prompt || !model) return res.status(400).json({ error: "prompt and model are required" });

  const keyMap: Record<SupportedModel, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
    groq:   process.env.GROQ_API_KEY,
  };

  if (!keyMap[model]) return res.status(400).json({ error: `API key for ${model} is not configured.` });

  try {
    const userMsg = `I want to create a new service for: ${prompt}`;
    let raw = "";

    if (model === "openai") {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: FULL_SERVICE_SYSTEM_PROMPT }, { role: "user", content: userMsg }],
        temperature: 0.3, max_tokens: 2500,
      });
      raw = completion.choices[0]?.message?.content || "";
    } else if (model === "gemini") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await geminiModel.generateContent(`${FULL_SERVICE_SYSTEM_PROMPT}\n\n${userMsg}`);
      raw = result.response.text();
    } else if (model === "claude") {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await client.messages.create({
        model: "claude-3-haiku-20240307", max_tokens: 2500, system: FULL_SERVICE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      });
      raw = message.content[0].type === "text" ? message.content[0].text : "";
    } else if (model === "groq") {
      const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
      const completion = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: FULL_SERVICE_SYSTEM_PROMPT }, { role: "user", content: userMsg }],
        temperature: 0.3, max_tokens: 2500,
      });
      raw = completion.choices[0]?.message?.content || "";
    }

    const generated: GeneratedService = JSON.parse(extractJson(raw));
    
    // Attach IDs to all fields in all sub-services
    const { v4: uuidv4 } = await import("uuid");
    generated.sub_services = generated.sub_services.map(sub => ({
      ...sub,
      fields: sub.fields.map(f => ({ ...f, id: uuidv4() }))
    }));

    res.json(generated);
  } catch (err: any) {
    console.error(`[AI Service Gen] ${model} error:`, err?.message || err);
    res.status(500).json({ error: "Failed to connect to the AI provider or parse the generated form structure." });
  }
};

const SUGGESTIONS_SYSTEM_PROMPT = `You are a visionary digital transformation consultant for the Government of Zambia.
Your goal is to suggest innovative, high-impact government services that should be digitalized on the ZamPortal platform.

Zambia's Digital Ambition:
- Moving towards a paperless government.
- Improving ease of doing business.
- Enhancing citizen convenience through "one-stop" digital shops.
- Driving financial inclusion and transparent revenue collection.

CRITICAL RULE:
- DO NOT suggest any services that are already mentioned in the "Existing Services" list.
- Be creative! Think beyond basic registration. Think about permits, clearances, integrated social services, agricultural digital support, and trade facilitation.

Return a JSON array (no markdown, no explanation) of exactly 4 objects with this structure:
[{
  "title": "Service Title",
  "category_name": "Category Name (e.g., Agriculture & Livestock)"
}]
Return raw JSON only.`;

const MODULE_SCHEMA_SYSTEM_PROMPT = `You are a Principal System Architect. Design a detailed, enterprise-grade data schema for a management module.

OUTPUT RULES:
- Return ONLY a raw JSON object. 
- NO markdown, NO code fences, NO explanation.
- Include 8-12 relevant fields.
- Always include a 'status' field.
- Include standard Zambian identifiers (NRC/TPIN) if applicable.

JSON STRUCTURE:
{
  "name": "Module Name (e.g., Fleet Management)",
  "singular_entity": "Singular Entity (e.g., Vehicle)",
  "description": "Professional operational description",
  "icon": "lucide-react icon name",
  "fields": [
    {
      "name": "field_name (snake_case)",
      "label": "Field Label",
      "field_description": "Small helper text",
      "placeholder": "Example text",
      "type": "text | number | date | select | textarea | boolean",
      "required": true,
      "validation_regex": "^[A-Z0-9]$ (Optional regex)",
      "options": ["Opt 1", "Opt 2"] (Required only for 'select')
    }
  ]
}

Return raw JSON only.`;

export const handleSuggestServices: RequestHandler = async (req, res) => {
  const { portalName, existingServices, model } = req.body as { portalName: string; existingServices: string; model: SupportedModel };

  if (!portalName || !model) return res.status(400).json({ error: "portalName and model are required" });

  const keyMap: Record<SupportedModel, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
    groq:   process.env.GROQ_API_KEY,
  };

  if (!keyMap[model]) return res.status(400).json({ error: `API key for ${model} is not configured.` });

  try {
    const userMsg = `Portal Name: ${portalName}\nExisting Services: ${existingServices || 'None'}\n\nSuggest 4 new services.`;
    let raw = "";

    if (model === "openai") {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: SUGGESTIONS_SYSTEM_PROMPT }, { role: "user", content: userMsg }],
        temperature: 0.7, max_tokens: 1000,
      });
      raw = completion.choices[0]?.message?.content || "";
    } else if (model === "gemini") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await geminiModel.generateContent(`${SUGGESTIONS_SYSTEM_PROMPT}\n\n${userMsg}`);
      raw = result.response.text();
    } else if (model === "claude") {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await client.messages.create({
        model: "claude-3-haiku-20240307", max_tokens: 1000, system: SUGGESTIONS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      });
      raw = message.content[0].type === "text" ? message.content[0].text : "";
    } else if (model === "groq") {
      const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
      const completion = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: SUGGESTIONS_SYSTEM_PROMPT }, { role: "user", content: userMsg }],
        temperature: 0.7, max_tokens: 1000,
      });
      raw = completion.choices[0]?.message?.content || "";
    }

    const suggestions = JSON.parse(extractJson(raw));
    res.json(suggestions);
  } catch (err: any) {
    console.error(`[AI Suggest Services] ${model} error:`, err?.message || err);
    res.status(500).json({ error: "Failed to generate suggestions." });
  }
};

export const handleGenerateModuleSchema: RequestHandler = async (req, res) => {
  const { prompt, model } = req.body as { prompt: string; model: SupportedModel };

  if (!prompt || !model) return res.status(400).json({ error: "prompt and model are required" });

  const keyMap: Record<SupportedModel, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
    groq:   process.env.GROQ_API_KEY,
  };

  if (!keyMap[model]) return res.status(400).json({ error: `API key for ${model} is not configured.` });

  try {
    const userMsg = `Module Description: ${prompt}`;
    let raw = "";

    if (model === "openai") {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: MODULE_SCHEMA_SYSTEM_PROMPT }, { role: "user", content: userMsg }],
        temperature: 0.7, max_tokens: 2000,
      });
      raw = completion.choices[0]?.message?.content || "";
    } else if (model === "gemini") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await geminiModel.generateContent(`${MODULE_SCHEMA_SYSTEM_PROMPT}\n\n${userMsg}`);
      raw = result.response.text();
    } else if (model === "claude") {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await client.messages.create({
        model: "claude-3-haiku-20240307", max_tokens: 2000, system: MODULE_SCHEMA_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      });
      raw = message.content[0].type === "text" ? message.content[0].text : "";
    } else if (model === "groq") {
      const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
      const completion = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: MODULE_SCHEMA_SYSTEM_PROMPT }, { role: "user", content: userMsg }],
        temperature: 0.7, max_tokens: 2000,
      });
      raw = completion.choices[0]?.message?.content || "";
    }

    const cleaned = extractJson(raw);
    try {
      const schema = JSON.parse(cleaned);
      res.json(schema);
    } catch (parseErr) {
      console.error("[AI] JSON Parse Error. Raw output:", raw);
      console.error("[AI] Cleaned output:", cleaned);
      throw parseErr;
    }
  } catch (err: any) {
    console.error(`[AI Generate Module] ${model} error:`, err?.message || err);
    res.status(500).json({ error: "Failed to generate module schema: " + (err.message || "Unknown error") });
  }
};

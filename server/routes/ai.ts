import { RequestHandler } from "express";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { query } from "../lib/db";

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

const MODULE_SUGGESTIONS_PROMPT = `You are an expert system architect for the Government of Zambia.
Your task is to suggest internal administrative systems or data registries that can be digitized.
Return a JSON array of 3 objects with this structure:
[
  { "title": "System Name", "desc": "Short description of what it tracks", "icon": "lucide-react icon name (e.g. truck, hospital, school, briefcase, package)" }
]
Keep suggestions professional and tailored to Zambian public sector needs. Return raw JSON only.`;

export const RECOMMEND_SERVICES_PROMPT = `
You are the ZamPortal AI Assistant. Your goal is to help Zambian citizens find the right government services.
Given a user's natural language request, identify the top 3 most relevant services from the provided list.

List of Available Services:
{{SERVICES_JSON}}

Response Format (Strict JSON):
{
  "response": "A friendly conversational response explaining how these services help.",
  "recommendations": [
    { "id": "service_id_from_list", "reason": "Briefly why this fits" }
  ]
}
`;

export type SupportedModel = "openai" | "gemini" | "claude" | "groq";

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

export const handleRecommendServices: RequestHandler = async (req, res) => {
  const { query: userQuery, model } = req.body as { query: string; model: SupportedModel };

  if (!userQuery || !model) return res.status(400).json({ error: "query and model are required" });

  const keyMap: Record<SupportedModel, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
    groq:   process.env.GROQ_API_KEY,
  };

  if (!keyMap[model]) return res.status(400).json({ error: `API key for ${model} is not configured.` });

  try {
    // 1. Fetch all services for context
    const servicesRes = await query(`
      SELECT s.id, s.title, s.description, c.name as category 
      FROM services s
      LEFT JOIN service_categories c ON s.category_id = c.id
    `);
    
    console.log(`[AI Recommend Services] Found ${servicesRes.rows.length} services in DB.`);

    const servicesJson = JSON.stringify(servicesRes.rows.map(r => ({
      id: r.id,
      title: r.title,
      description: (r.description || "").substring(0, 80) + ((r.description || "").length > 80 ? "..." : ""),
      category: r.category || "General"
    })));

    const systemPrompt = `You are the ZamPortal AI Assistant. Identify the 3 most relevant services.
Return ONLY a JSON object with this structure:
{
  "response": "A friendly greeting and explanation of how you can help.",
  "recommendations": [
    { "id": "UUID", "title": "SERVICE_TITLE", "reason": "Short reason" }
  ]
}

Available Services:
${servicesJson}`;

    const userMsg = `User Request: "${userQuery}"`;
    let raw = "";

    try {
      if (model === "openai") {
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }],
          temperature: 0.5,
        });
        raw = completion.choices[0]?.message?.content || "";
      } else if (model === "gemini") {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await geminiModel.generateContent(`${systemPrompt}\n\n${userMsg}`);
        raw = result.response.text();
      } else if (model === "claude") {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const message = await client.messages.create({
          model: "claude-3-haiku-20240307", max_tokens: 1000, system: systemPrompt,
          messages: [{ role: "user", content: userMsg }],
        });
        raw = message.content[0].type === "text" ? message.content[0].text : "";
      } else if (model === "groq") {
        const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
        const completion = await client.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }],
          temperature: 0.5,
        });
        raw = completion.choices[0]?.message?.content || "";
      }
    } catch (aiErr: any) {
      console.error("[AI Recommend Services] Provider Error:", aiErr);
      return res.json({
        response: "I'm having some trouble connecting to my knowledge base right now. Please browse our services manually or try again in a moment.",
        services: []
      });
    }

    const aiResponseRaw = extractJson(raw);
    let aiResponse: any = { response: "", recommendations: [] };
    
    try {
      aiResponse = JSON.parse(aiResponseRaw);
    } catch (parseErr) {
      console.error("[AI Recommend Services] JSON Parse Error:", parseErr, "Raw was:", raw);
      aiResponse.response = "I've analyzed your request and identified some services that might be relevant to you.";
    }

    if (!aiResponse.response) {
      aiResponse.response = "I found some services that match your request. Here are the best options for you:";
    }
    
    // 2. Fetch full details for the recommended services (by ID or Title)
    const recommendedIds = Array.isArray(aiResponse.recommendations) 
      ? aiResponse.recommendations.map((r: any) => r.id).filter((id: any) => id && typeof id === 'string')
      : [];
    
    const recommendedTitles = Array.isArray(aiResponse.recommendations)
      ? aiResponse.recommendations.map((r: any) => r.title).filter((t: any) => t && typeof t === 'string')
      : [];

    if (recommendedIds.length > 0 || recommendedTitles.length > 0) {
      console.log("[AI Recommend Services] Fetching full details for:", { recommendedIds, recommendedTitles });
      
      const fullServicesRes = await query(`
        SELECT s.*, c.name as category_name,
          (SELECT p.slug FROM portals p 
           LEFT JOIN portal_services ps ON p.id = ps.portal_id 
           LEFT JOIN portal_service_forms f ON p.id = f.portal_id
           WHERE ps.service_id = s.id OR f.service_id = s.id 
           LIMIT 1) as portal_slug
        FROM services s
        LEFT JOIN service_categories c ON s.category_id = c.id
        WHERE s.id::text = ANY($1::text[]) 
           OR s.title = ANY($2::text[])
           OR LOWER(s.title) = ANY(SELECT LOWER(t) FROM unnest($2::text[]) t)
      `, [recommendedIds, recommendedTitles]);

      console.log(`[AI Recommend Services] DB matched ${fullServicesRes.rows.length} services.`);

      aiResponse.services = fullServicesRes.rows.map(row => {
        const recommendation = Array.isArray(aiResponse.recommendations) 
          ? aiResponse.recommendations.find((r: any) => 
              (r.id && r.id === row.id) || 
              (r.title && row.title.toLowerCase() === r.title.toLowerCase())
            )
          : null;

        return {
          id: row.id,
          title: row.title,
          icon: row.icon,
          description: row.description || "",
          slug: row.slug,
          portal_slug: row.portal_slug,
          category_name: row.category_name,
          reason: recommendation?.reason || "Recommended based on your request."
        };
      });
    } else {
      aiResponse.services = [];
    }

    res.json(aiResponse);
  } catch (err: any) {
    console.error(`[AI Recommend Services] Final Catch Error:`, err);
    res.json({
      response: `I encountered an error while searching for services: ${err.message}`,
      services: [],
      debug_error: err.message
    });
  }
};

export const handleSuggestModules: RequestHandler = async (req, res) => {
  const { model } = req.body as { model: SupportedModel };

  if (!model) return res.status(400).json({ error: "model is required" });

  const keyMap: Record<SupportedModel, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
    groq:   process.env.GROQ_API_KEY,
  };

  if (!keyMap[model]) return res.status(400).json({ error: `API key for ${model} is not configured.` });

  try {
    const userMsg = `Suggest 3 advanced internal administrative modules for a national digital portal.`;
    let raw = "";

    if (model === "openai") {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: MODULE_SUGGESTIONS_PROMPT }, { role: "user", content: userMsg }],
        temperature: 0.8, max_tokens: 1000,
      });
      raw = completion.choices[0]?.message?.content || "";
    } else if (model === "gemini") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await geminiModel.generateContent(`${MODULE_SUGGESTIONS_PROMPT}\n\n${userMsg}`);
      raw = result.response.text();
    } else if (model === "claude") {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await client.messages.create({
        model: "claude-3-haiku-20240307", max_tokens: 1000, system: MODULE_SUGGESTIONS_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      });
      raw = message.content[0].type === "text" ? message.content[0].text : "";
    } else if (model === "groq") {
      const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
      const completion = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: MODULE_SUGGESTIONS_PROMPT }, { role: "user", content: userMsg }],
        temperature: 0.8, max_tokens: 1000,
      });
      raw = completion.choices[0]?.message?.content || "";
    }

    const suggestions = JSON.parse(extractJson(raw));
    res.json(suggestions);
  } catch (err: any) {
    console.error(`[AI Suggest Modules] ${model} error:`, err?.message || err);
    res.status(500).json({ error: "Failed to generate module suggestions." });
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

const INSTITUTION_SYSTEM_PROMPT = `You are an expert government digital transformation consultant.
Your goal is to help provision a new dedicated institutional portal.
Given an institution name or high-level purpose, suggest:
1. A professional mission description.
2. A URL slug (lowercase, no spaces).
3. A branding palette (Primary and Secondary hex colors).
4. A list of relevant existing service titles that should be activated (choose from provided list if available, or suggest new ones).

Output a JSON object with this structure:
{
  "description": "Professional mission statement",
  "slug": "url-slug",
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "suggestedServices": ["Service Title 1", "Service Title 2"]
}
Return raw JSON only.`;

export const handleGenerateInstitution: RequestHandler = async (req, res) => {
  const { prompt, model } = req.body as { prompt: string; model: SupportedModel };

  if (!prompt || !model) return res.status(400).json({ error: "prompt and model are required" });

  try {
    const userMsg = `Institution: ${prompt}`;
    let raw = "";

    if (model === "openai") {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: INSTITUTION_SYSTEM_PROMPT }, { role: "user", content: userMsg }],
        temperature: 0.7, max_tokens: 1000,
      });
      raw = completion.choices[0]?.message?.content || "";
    } else if (model === "gemini") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await geminiModel.generateContent(`${INSTITUTION_SYSTEM_PROMPT}\n\n${userMsg}`);
      raw = result.response.text();
    } else if (model === "groq") {
      const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
      const completion = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: INSTITUTION_SYSTEM_PROMPT }, { role: "user", content: userMsg }],
        temperature: 0.7, max_tokens: 1000,
      });
      raw = completion.choices[0]?.message?.content || "";
    }

    const cleaned = extractJson(raw);
    console.log("[AI Generate Institution] Raw output:", raw);
    console.log("[AI Generate Institution] Cleaned output:", cleaned);
    
    try {
      res.json(JSON.parse(cleaned));
    } catch (parseErr) {
      console.error("[AI Generate Institution] JSON Parse Error:", parseErr);
      res.status(500).json({ error: "Failed to parse AI response" });
    }
  } catch (err: any) {
    console.error(`[AI Generate Institution] ${model} error:`, err?.message || err);
    res.status(500).json({ error: "Failed to generate institution config: " + (err.message || "Unknown error") });
  }
};

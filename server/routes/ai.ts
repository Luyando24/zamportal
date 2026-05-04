import { RequestHandler } from "express";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { query } from "../lib/db.js";

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

const SYSTEM_PROMPT = `You are a Senior Business Analyst and Lead UX Designer for Zambia's national digital services portal.
Your goal is to generate "ready-to-use" data collection schemas that are detailed, accurate, and professional.

CRITICAL DESIGN RULES:
1. AUDIENCE: The primary audience is Zambian CITIZENS and BUSINESSES. Use respectful, clear, and action-oriented language.
2. FIELD DEPTH: Generate 8-12 comprehensive fields per form. Don't just ask for a name; ask for all necessary regulatory and operational data (e.g. for a vehicle permit, ask for VIN, Engine Number, Year, Make, Model, Fuel Type, etc.).
3. DROPDOWN DATA: For every field of type 'select', you MUST provide a comprehensive list of realistic options. If the field is 'Province', list all 10 Zambian provinces. If it is 'Identity Type', list NRC, Passport, Diplomatic ID. NEVER leave options empty or with placeholders like ["Option A"].
4. VALIDATION: Include realistic 'validation_regex' where applicable (e.g., NRC format: 111111/11/1, TPIN: 10 digits).
5. ZAMBIAN CONTEXT: Use local terminology (e.g., Plot Number, District, Chiefdom, Kwacha/ZMW).

JSON STRUCTURE:
{
  "form_name": "Professional Sub-Service Name",
  "fields": [
    { 
      "label": "Field Label", 
      "type": "text | textarea | number | date | file | select", 
      "required": true,
      "placeholder": "Helpful example entry",
      "field_description": "Small helper text for the user",
      "options": ["Complete", "List", "Of", "Options"],
      "validation_regex": "Optional regex"
    }
  ]
}
Return raw JSON only — no extra text, no markdown fences.`;

/**
 * Strips markdown code fences that some LLMs wrap around JSON responses.
 * e.g. ```json\n{...}\n``` → {...}
 */
function extractJson(raw: string): string {
  // Strip comments (both // and /* */)
  let clean = raw.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
  
  // Find the first occurrence of '{' or '[' and the last occurrence of '}' or ']'
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  let first = -1;
  if (firstBrace !== -1 && firstBracket !== -1) first = Math.min(firstBrace, firstBracket);
  else if (firstBrace !== -1) first = firstBrace;
  else if (firstBracket !== -1) first = firstBracket;

  const lastBrace = clean.lastIndexOf('}');
  const lastBracket = clean.lastIndexOf(']');
  let last = -1;
  if (lastBrace !== -1 && lastBracket !== -1) last = Math.max(lastBrace, lastBracket);
  else if (lastBrace !== -1) last = lastBrace;
  else if (lastBracket !== -1) last = lastBracket;
  
  if (first !== -1 && last !== -1 && last > first) {
    return clean.substring(first, last + 1);
  }
  
  return clean.trim();
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

const FULL_SERVICE_SYSTEM_PROMPT = `You are a Senior Business Systems Analyst specialized in Zambian e-Governance.
Your goal is to generate a comprehensive, citizen-centric Service package.

CRITICAL ANALYTICAL RULES:
1. BUSINESS LOGIC: Deeply analyze the institution's purpose. If the service is "Land Titling", include fields for Survey Diagrams, Beacon Numbers, Traditional Authority details, etc. Ensure the forms capture EVERYTHING a regulatory body would need.
2. FIELD DEPTH: Every sub-service form must contain 8-12 comprehensive fields.
3. DROPDOWN DATA: Every 'select' type field MUST include a complete list of valid options. (e.g., if asking for 'Land Use Type', list ['Residential', 'Commercial', 'Agricultural', 'Industrial']).
4. AUDIENCE: Use action-oriented, citizen-friendly language. (e.g., "Apply for Farm Input Subsidy").
5. ZAMBIAN CONTEXT: Use local standards (NRC, TPIN, ZMW, Provinces, Districts).

JSON STRUCTURE:
{
  "title": "Professional Service Title",
  "description": "Comprehensive citizen-facing description",
  "category_slug": "business | identity | land | health | education | tax | agriculture",
  "sub_services": [
    {
      "form_name": "Specific Sub-Service Workflow (e.g. New Passport Application)",
      "fields": [
        { 
          "label": "Field Label", 
          "type": "text | textarea | number | date | file | select", 
          "required": true,
          "options": ["Complete", "Option", "List"],
          "placeholder": "Example",
          "field_description": "Guidance text"
        }
      ]
    }
  ]
}
Return raw JSON only — no extra text, no markdown fences.`;

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
Your goal is to suggest innovative, high-impact government services for CITIZENS and BUSINESSES.

CRITICAL RULES:
- Focus on citizen convenience and "one-stop" digital ease.
- Use action verbs in titles: "Apply for...", "Register...", "Pay...", "Request...", "Check...".
- AVOID administrative names like "Revenue Management" or "Education System". Use "Pay Taxes" or "Enroll for School" instead.

Zambia's Digital Ambition:
- Moving towards a paperless government.
- Improving ease of doing business.
- Enhancing citizen convenience through "one-stop" digital shops.
- Driving financial inclusion and transparent revenue collection.

Return a JSON array (no markdown, no explanation) of exactly 4 objects with this structure:
[{
  "title": "Service Title",
  "category_name": "Category Name (e.g., Agriculture & Livestock)"
}]
Return raw JSON only.`;

const MODULE_SUGGESTIONS_PROMPT = `You are a Principal Enterprise Architect for the Government of Zambia.
Your goal is to suggest advanced INTERNAL ADMINISTRATIVE SYSTEMS and OPERATIONAL REGISTRIES for government institutions.

CRITICAL RULES:
- The audience is GOVERNMENT ADMINISTRATORS and STAFF.
- Use professional, institutional language.
- Focus on operational efficiency, resource tracking, and data management.
- Examples of titles: "Fleet Management System", "Employee Registry", "Inventory Tracker", "Case Management Module", "Grant Disbursement Registry".
- DO NOT suggest citizen-facing services here.

Return a JSON array of 3 objects with this structure:
[
  { "title": "System Name", "desc": "Professional operational description", "icon": "lucide-react icon name (e.g. truck, hospital, school, briefcase, package, shield, activity, users)" }
]
Return raw JSON only.`;

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

const MODULE_SCHEMA_SYSTEM_PROMPT = `You are a Principal System Architect designing an ENTERPRISE-GRADE internal management module.
Your goal is to build a robust data schema for institutional operations and administrative tracking.

CRITICAL ARCHITECTURE RULES:
- Target audience: Government Staff and Administrators.
- Use precise, professional terminology (e.g., "Assigned Officer", "Operational Status", "Audit Timestamp").
- Always include fields for internal accountability (e.g., "assigned_to", "last_inspected_date", "priority_level").
- The description should focus on operational impact and data integrity.

OUTPUT RULES:
- Return ONLY a raw JSON object. No markdown, no fences.
- Include 8-12 comprehensive fields.
- Always include a 'status' field (e.g., Pending, Active, Suspended, Archived).
- Include standard Zambian identifiers (NRC/TPIN) if the module tracks personnel or entities.

JSON STRUCTURE:
{
  "name": "Module Name (e.g., Fleet Management System)",
  "singular_entity": "Singular Entity (e.g., Vehicle)",
  "description": "Comprehensive operational description including primary use-case",
  "icon": "lucide-react icon name",
  "fields": [
    {
      "name": "field_name (snake_case)",
      "label": "Professional Field Label",
      "field_description": "Administrative helper text",
      "placeholder": "Professional entry example",
      "type": "text | number | date | select | textarea | boolean",
      "required": true,
      "validation_regex": "^[A-Z0-9]$ (Optional)",
      "options": ["Opt 1", "Opt 2"]
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

    if (aiResponse.services.length === 0) {
      aiResponse.canSuggest = true;
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

const INSTITUTION_SYSTEM_PROMPT = `You are a Senior Strategic Consultant for the Zambian Government with deep knowledge of institutional mandates.
Your goal is to provision a new institutional portal.

MANDATE ACCURACY RULES:
1. JURISDICTIONAL ISOLATION: Deeply analyze the institution name. Only describe duties that fall under its specific legal mandate. For example, "Ministry of Finance" handles national treasury, public debt, and budgeting, NOT company registration (PACRA) or tax collection (ZRA).
2. COMPREHENSIVE MISSION: Write a professional, lengthy description (3-5 paragraphs) covering vision, core functions, and impact on national development.
3. PUBLIC SUMMARY: Write a 1-2 sentence summary for the website header.

Output a JSON object:
{
  "description": "Lengthy mission statement focused EXCLUSIVELY on this institution's mandate",
  "summary": "Concise summary for public display",
  "slug": "url-slug",
  "primaryColor": "#hex",
  "secondaryColor": "#hex"
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

export const handleCraftSuggestion: RequestHandler = async (req, res) => {
  const { query: userQuery, model } = req.body;
  if (!userQuery) return res.status(400).json({ error: "query is required" });

  const keyMap: Record<string, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
    groq:   process.env.GROQ_API_KEY,
  };

  const selectedModel = model || "groq";
  if (!keyMap[selectedModel]) return res.status(400).json({ error: `API key for ${selectedModel} is not configured.` });

  try {
    const prompt = `You are a professional assistant for ZamPortal (Zambian Government Portal). 
    A user searched for a service but couldn't find it. Their query was: "${userQuery}".
    Please craft a highly professional and compelling suggestion message to the portal administrators.
    The message should explain:
    1. What the service is.
    2. Why it is important for Zambian citizens/businesses.
    3. A brief pitch on how it improves digital governance.
    
    Return the response as a JSON object with:
    - suggested_service: A concise name for the proposed service.
    - crafted_message: The full professional message.
    - description: A short 1-sentence summary.
    
    Response MUST be valid JSON.`;

    let raw = "";
    if (selectedModel === "groq") {
      const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
      const completion = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      raw = completion.choices[0].message?.content || "";
    } else if (selectedModel === "openai") {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      raw = completion.choices[0].message?.content || "";
    }

    res.json(JSON.parse(raw));
  } catch (err: any) {
    console.error("Craft Suggestion Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const handleSubmitSuggestion: RequestHandler = async (req, res) => {
  const { user_query, suggested_service, description, crafted_message } = req.body;
  
  try {
    await query(`
      INSERT INTO service_suggestions (user_query, suggested_service, description, crafted_message)
      VALUES ($1, $2, $3, $4)
    `, [user_query, suggested_service, description, crafted_message]);
    
    res.json({ success: true, message: "Suggestion submitted successfully." });
  } catch (err: any) {
    console.error("Submit Suggestion Error:", err);
    res.status(500).json({ error: err.message });
  }
};

const COMPREHENSIVE_INSTITUTION_PROMPT = `You are a Senior Strategic Consultant for the Zambian Government with deep knowledge of institutional mandates.
Your goal is to provision a new institutional portal by architecting services that are EXCLUSIVELY within that institution's jurisdiction.

ANALYTICAL DEPTH RULES:
1. INSTITUTIONAL MANDATE: Perform a deep analysis of the institution's legal and operational mandate. Only generate services that this specific institution is responsible for.
2. STRICT ISOLATION: Do NOT suggest services that belong to other well-known Zambian bodies. 
   - If not PACRA, don't suggest business registration.
   - If not ZRA, don't suggest tax payments.
   - If not RTSA, don't suggest vehicle licensing.
   - If not Zambia Police, don't suggest crime reporting, police clearance, or security certificates.
   - If not Ministry of Finance, don't suggest treasury/budget services.
   - For "Ministry of Finance", suggest: "Government Grant Applications", "Treasury Bill Subscriptions", "Financial Clearance for Contractors", "Public Procurement Registration", "External Debt Reporting", etc.
3. QUANTITY: You MUST propose NOT LESS THAN 8 and up to 12 new high-impact services.
4. BUSINESS LOGIC: Each service must include all necessary regulatory data fields.
5. FIELD DEPTH: Every sub-service form must contain 8-12 comprehensive fields.
6. DROPDOWN DATA: Every 'select' field MUST have a comprehensive list of realistic options. NEVER leave options empty.
7. PUBLIC-FACING LANGUAGE: Use action verbs (Apply, Register, Pay).

JSON STRUCTURE:
{
  "existingServiceIds": ["uuid-1", "uuid-2"],
  "newServiceProposals": [
    {
      "title": "Professional Service Title",
      "description": "Citizen-centric outcome description",
      "category_slug": "identity | transport | business | land | health | education | tax | agriculture",
      "sub_services": [
        {
          "form_name": "Independent Application Workflow (e.g. New Vehicle Registration)",
          "fields": [
            { 
              "label": "Field Label", 
              "type": "text | textarea | number | date | file | select", 
              "required": true,
              "options": ["Complete", "Option", "List"],
              "placeholder": "Example",
              "field_description": "Small helper text"
            }
          ]
        }
      ]
    }
  ]
}
Return raw JSON only — no extra text, no markdown fences.`;


export const handleGenerateComprehensiveServices: RequestHandler = async (req, res) => {
  const { name, description, model } = req.body as { name: string; description: string; model: SupportedModel };

  if (!name || !model) return res.status(400).json({ error: "name and model are required" });

  try {
    // 1. Fetch all existing services for context
    const servicesRes = await query(`
      SELECT s.id, s.title, s.description, c.name as category 
      FROM services s
      LEFT JOIN service_categories c ON s.category_id = c.id
    `);
    
    const servicesJson = JSON.stringify(servicesRes.rows.map(r => ({
      id: r.id,
      title: r.title,
      description: (r.description || "").substring(0, 50) + "..."
    })));

    const userMsg = `Institution: ${name}\nDescription: ${description || 'N/A'}\n\nExisting Services:\n${servicesJson}`;
    let raw = "";

    if (model === "openai") {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: COMPREHENSIVE_INSTITUTION_PROMPT }, { role: "user", content: userMsg }],
        temperature: 0.7, max_tokens: 3000,
      });
      raw = completion.choices[0]?.message?.content || "";
    } else if (model === "gemini") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await geminiModel.generateContent(`${COMPREHENSIVE_INSTITUTION_PROMPT}\n\n${userMsg}`);
      raw = result.response.text();
    } else if (model === "groq") {

      const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
      const completion = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: COMPREHENSIVE_INSTITUTION_PROMPT }, { role: "user", content: userMsg }],
        temperature: 0.7, max_tokens: 3000,
      });
      raw = completion.choices[0]?.message?.content || "";
    }

    const cleaned = extractJson(raw);
    const result = JSON.parse(cleaned);

    // Attach stable IDs to new service proposals
    const { v4: uuidv4 } = await import("uuid");
    if (result.newServiceProposals) {
      result.newServiceProposals = result.newServiceProposals.map((s: any) => ({
        ...s,
        id: uuidv4(),
        sub_services: (s.sub_services || []).map((sub: any) => ({
          ...sub,
          fields: (sub.fields || []).map((f: any) => ({ ...f, id: uuidv4() }))
        }))
      }));
    }

    res.json(result);
  } catch (err: any) {
    console.error(`[AI Generate Comprehensive] ${model} error:`, err?.message || err);
    res.status(500).json({ error: "Failed to generate comprehensive services." });
  }
};

export const handleInstitutionalChat: RequestHandler = async (req, res) => {
  const { portalName, portalDescription, message, history, model } = req.body;
  
  if (!message || !portalName) {
    return res.status(400).json({ error: "Message and portal context are required" });
  }

  const selectedModel = model || "openai";
  const keyMap: Record<string, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
    groq:   process.env.GROQ_API_KEY,
  };

  if (!keyMap[selectedModel]) {
    return res.status(400).json({ error: `API key for ${selectedModel} is not configured.` });
  }

  const SYSTEM_PROMPT = `You are the "Assistant" for ${portalName}, a high-level digital expert integrated into Zambia's national service portal.
  
  INSTITUTIONAL CONTEXT:
  Name: ${portalName}
  Description: ${portalDescription || 'A Zambian government institution.'}
  
  YOUR ROLE:
  1. Act as a senior assistant, technical expert, and administrative aide specialized EXCLUSIVELY in the domain of ${portalName}.
  2. You help employees and administrators analyze complex documents (contracts, budget reports, legal frameworks), summarize internal papers, and draft professional government correspondence.
  3. You are an expert in Zambian laws, regulations, and operational procedures relevant to this specific institution.
  4. If a user asks something outside the scope of ${portalName}, politely redirect them to the relevant institution or explain that your expertise is focused on this institution.
  5. Your tone is highly professional, authoritative yet helpful, and strictly aligned with Zambian government standards.
  
  CAPABILITIES:
  - Document Analysis: Identify risks, key clauses, or financial discrepancies in text.
  - Summarization: Condense lengthy reports into executive summaries.
  - Drafting: Write memos, budget justifications, or policy drafts.
  - Assistance: Provide strategic guidance on institutional processes.
  
  FORMATTING RULES:
  - Use clear, descriptive HEADINGS (Markdown # or ##) to organize your response.
  - Use distinct PARAGRAPHS for different ideas to ensure readability.
  - Use BULLET POINTS or NUMBERED LISTS when listing requirements, steps, or features.
  - Use **bold** text for important institutional terms, deadlines, or critical actions.
  
  Constraint: NEVER mention you are an AI model like GPT-4 or Claude. You are the ${portalName} Assistant.`;

  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(history || []).map((h: any) => ({ role: h.role, content: h.content })),
      { role: "user", content: message }
    ];

    let responseText = "";

    if (selectedModel === "openai") {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o", // Using 4o for document analysis capabilities
        messages,
        temperature: 0.7,
      });
      responseText = completion.choices[0]?.message?.content || "";
    } else if (selectedModel === "gemini") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const chat = geminiModel.startChat({
        history: (history || []).map((h: any) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        })),
      });
      const result = await chat.sendMessage(message);
      responseText = result.response.text();
    } else if (selectedModel === "groq") {
      const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
      const completion = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
      });
      responseText = completion.choices[0]?.message?.content || "";
    } else if (selectedModel === "claude") {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await client.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [
          ...(history || []).map((h: any) => ({ role: h.role, content: h.content })),
          { role: "user", content: message }
        ],
      });
      responseText = message.content[0].type === "text" ? message.content[0].text : "";
    }

    res.json({ response: responseText });
  } catch (err: any) {
    console.error("Institutional AI Error:", err);
    res.status(500).json({ error: "The AI advisor is temporarily unavailable. Please try again later." });
  }
};

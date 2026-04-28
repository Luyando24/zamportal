const { Client } = require('pg');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

async function testAi() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const userQuery = "I want to report a lost vehicle";
  const model = "groq";

  try {
    const servicesRes = await client.query(`
      SELECT s.id, s.title, s.description, c.name as category 
      FROM services s
      LEFT JOIN service_categories c ON s.category_id = c.id
    `);
    
    console.log(`Found ${servicesRes.rows.length} services.`);

    const servicesJson = JSON.stringify(servicesRes.rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description?.substring(0, 80),
      category: r.category
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

    const openai = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `User Request: "${userQuery}"` }],
      temperature: 0.5,
    });

    const raw = completion.choices[0]?.message?.content || "";
    console.log("Raw Response:", raw);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

testAi();

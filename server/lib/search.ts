import "./env.js";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

/**
 * Searches the web using Serper.dev API.
 * Requires SERPER_API_KEY in environment variables.
 */
export async function searchWeb(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    console.warn("[Search] SERPER_API_KEY is not configured. Web search is disabled.");
    return [];
  }

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query }),
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.statusText}`);
    }

    const data = await response.json();
    const results: SearchResult[] = (data.organic || []).map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }));

    return results.slice(0, 5); // Return top 5 results
  } catch (error) {
    console.error("[Search] Web search failed:", error);
    return [];
  }
}

/**
 * Formats search results into a string for LLM context.
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return "No search results found.";

  return results
    .map(
      (r, i) => `[${i + 1}] ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`
    )
    .join("\n\n");
}

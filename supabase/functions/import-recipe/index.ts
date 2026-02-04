import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImportedRecipe {
  name: string;
  instructions: string;
  imageUrl?: string;
  tags: string[];
  ingredients: { name: string; amount: number; unit: string }[];
  macros: { carbs: number; protein: number; fat: number; calories?: number };
  servings?: number;
  prepTime?: number;
  cookTime?: number;
}

function errorResponse(message: string, status = 500) {
  console.error("Error:", message);
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return errorResponse("Invalid JSON in request body", 400);
    }

    const { url } = body;

    if (!url) {
      return errorResponse("URL is required", 400);
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return errorResponse("Invalid URL format", 400);
    }

    // Fetch the webpage content
    console.log(`Fetching URL: ${url}`);
    let pageResponse;
    try {
      pageResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
    } catch (fetchError) {
      return errorResponse(`Failed to fetch URL: ${fetchError.message}`);
    }

    if (!pageResponse.ok) {
      return errorResponse(`Failed to fetch URL: HTTP ${pageResponse.status}`, 400);
    }

    const html = await pageResponse.text();
    console.log(`Fetched ${html.length} characters of HTML`);

    // Extract text content from HTML (basic extraction)
    const textContent = extractTextFromHtml(html);
    console.log(`Extracted ${textContent.length} characters of text`);
    
    // Limit content length for API call (Gemini has token limits)
    const truncatedContent = textContent.slice(0, 30000);

    // Call Gemini API to extract recipe
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return errorResponse("Gemini API key not configured");
    }

    console.log("Calling Gemini API...");
    const recipe = await extractRecipeWithGemini(truncatedContent, html, GEMINI_API_KEY);
    console.log("Successfully extracted recipe:", recipe.name);

    return new Response(
      JSON.stringify({ recipe }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return errorResponse(message);
  }
});

function extractTextFromHtml(html: string): string {
  // Remove script and style tags with their content
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");
  
  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, "");
  
  // Replace common block elements with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br|section|article)>/gi, "\n");
  
  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&#\d+;/g, "");
  
  // Clean up whitespace
  text = text
    .replace(/\t/g, " ")
    .replace(/ +/g, " ")
    .replace(/\n +/g, "\n")
    .replace(/ +\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  
  return text;
}

async function extractRecipeWithGemini(
  textContent: string,
  html: string,
  apiKey: string
): Promise<ImportedRecipe> {
  // Try to extract image from HTML
  const imageUrl = extractMainImage(html);

  const prompt = `You are a recipe extraction assistant. Extract the recipe information from the following webpage content.

Return ONLY a valid JSON object with this structure (no markdown formatting, no code blocks, just the raw JSON):
{
  "name": "Recipe Name",
  "instructions": "Step-by-step cooking instructions as a single string with numbered steps",
  "tags": ["tag1", "tag2"],
  "ingredients": [
    {"name": "ingredient name", "amount": 1.5, "unit": "cups"}
  ],
  "macros": {"carbs": 30, "protein": 25, "fat": 15, "calories": 350},
  "servings": 4,
  "prepTime": 15,
  "cookTime": 30
}

Important rules:
1. For ingredients: always use numeric amounts (convert fractions like "1/2" to 0.5). If no amount is given, use 1. If no unit is given, use "piece" or appropriate default.
2. For macros: estimate reasonable values if not explicitly stated. Use per-serving values.
3. For tags: include meal type (breakfast/lunch/dinner), cuisine type, dietary info (vegetarian, vegan, gluten-free), and cooking style.
4. Times should be in minutes.
5. Instructions should be clear, numbered steps as a single string.
6. If information is not available, use reasonable defaults or null for optional fields.
7. IMPORTANT: Return ONLY the JSON object, no other text.

Webpage content:
${textContent}`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  let response;
  try {
    response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      }),
    });
  } catch (fetchError) {
    throw new Error(`Failed to call Gemini API: ${fetchError.message}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error response:", errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText.slice(0, 200)}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    throw new Error("Failed to parse Gemini API response as JSON");
  }
  
  console.log("Gemini response structure:", JSON.stringify(Object.keys(data)));
  
  // Check for blocked content or errors
  if (data.promptFeedback?.blockReason) {
    throw new Error(`Content blocked by Gemini: ${data.promptFeedback.blockReason}`);
  }

  // Extract the text response
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!generatedText) {
    console.error("Unexpected Gemini response structure:", JSON.stringify(data).slice(0, 500));
    throw new Error("No text content in Gemini response");
  }

  console.log("Raw Gemini output (first 500 chars):", generatedText.slice(0, 500));

  // Parse the JSON from the response (handle potential markdown code blocks)
  let jsonString = generatedText.trim();
  
  // Remove markdown code blocks if present
  if (jsonString.startsWith("```json")) {
    jsonString = jsonString.slice(7);
  } else if (jsonString.startsWith("```")) {
    jsonString = jsonString.slice(3);
  }
  if (jsonString.endsWith("```")) {
    jsonString = jsonString.slice(0, -3);
  }
  jsonString = jsonString.trim();

  let recipe: ImportedRecipe;
  try {
    recipe = JSON.parse(jsonString);
  } catch (parseError) {
    console.error("Failed to parse JSON. Raw string:", jsonString.slice(0, 1000));
    throw new Error(`Failed to parse recipe data from AI response: ${parseError.message}`);
  }

  // Validate and clean up the recipe
  recipe = {
    name: recipe.name || "Imported Recipe",
    instructions: recipe.instructions || "",
    imageUrl: imageUrl || undefined,
    tags: Array.isArray(recipe.tags) ? recipe.tags : [],
    ingredients: Array.isArray(recipe.ingredients) 
      ? recipe.ingredients.map(ing => ({
          name: ing.name || "",
          amount: typeof ing.amount === "number" ? ing.amount : parseFloat(String(ing.amount)) || 1,
          unit: ing.unit || "piece",
        }))
      : [],
    macros: {
      carbs: recipe.macros?.carbs || 0,
      protein: recipe.macros?.protein || 0,
      fat: recipe.macros?.fat || 0,
      calories: recipe.macros?.calories || undefined,
    },
    servings: recipe.servings || undefined,
    prepTime: recipe.prepTime || undefined,
    cookTime: recipe.cookTime || undefined,
  };

  return recipe;
}

function extractMainImage(html: string): string | undefined {
  // Try to find og:image meta tag first (most reliable for recipe sites)
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) 
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  
  if (ogImageMatch?.[1]) {
    return ogImageMatch[1];
  }

  // Try schema.org recipe image
  const schemaMatch = html.match(/"image"\s*:\s*"([^"]+)"/);
  if (schemaMatch?.[1] && schemaMatch[1].startsWith("http")) {
    return schemaMatch[1];
  }

  // Try first large image in content
  const imgMatches = html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
  for (const match of imgMatches) {
    const src = match[1];
    // Filter out small/icon images
    if (
      src.startsWith("http") &&
      !src.includes("icon") &&
      !src.includes("logo") &&
      !src.includes("avatar") &&
      !src.includes("1x1") &&
      !src.includes("tracking")
    ) {
      return src;
    }
  }

  return undefined;
}

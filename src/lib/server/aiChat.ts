type ChatRole = "system" | "user" | "assistant";

export type AIChatMessage = {
  role: ChatRole;
  content: string;
};

type AIChatOptions = {
  messages: AIChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormatJson?: boolean;
  purpose?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractChatText(json: any) {
  const content = json?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (typeof part?.text === "string") return part.text;
        return "";
      })
      .join("\n")
      .trim();
  }

  if (typeof json?.choices?.[0]?.text === "string") {
    return json.choices[0].text.trim();
  }

  return "";
}

function getOpenRouterModels() {
  const raw = process.env.OPENROUTER_MODELS || process.env.OPENROUTER_MODEL || "openrouter/free";
  const models = raw
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return models.length > 0 ? models : ["openrouter/free"];
}

function getProviderOrder() {
  const configured = (process.env.AI_PROVIDER || "").toLowerCase().trim();

  if (configured === "openai") return ["openai", "openrouter"];
  if (configured === "openrouter") return ["openrouter", "openai"];

  const providers: string[] = [];
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  if (process.env.OPENROUTER_API_KEY) providers.push("openrouter");

  return providers.length > 0 ? providers : ["openai", "openrouter"];
}

async function callOpenAI(options: AIChatOptions) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: options.messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 1200,
      ...(options.responseFormatJson ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  const raw = await response.text();
  const json = raw ? JSON.parse(raw) : {};

  if (!response.ok) {
    throw new Error(json?.error?.message || "OpenAI request failed.");
  }

  const text = extractChatText(json);

  if (!text) {
    throw new Error("OpenAI returned an empty response.");
  }

  return text;
}

async function callOpenRouter(options: AIChatOptions) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://hirevify.vercel.app",
      "X-Title": "HireVify",
    },
    body: JSON.stringify({
      models: getOpenRouterModels(),
      messages: options.messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 1200,
      ...(options.responseFormatJson ? { response_format: { type: "json_object" } } : {}),
      provider: {
        allow_fallbacks: true,
        sort: "throughput",
      },
    }),
  });

  const raw = await response.text();
  const json = raw ? JSON.parse(raw) : {};

  if (!response.ok) {
    throw new Error(json?.error?.message || json?.message || "OpenRouter request failed.");
  }

  const text = extractChatText(json);

  if (!text || /<pad>/i.test(text)) {
    throw new Error("OpenRouter returned an empty or invalid response.");
  }

  return text;
}

export async function callConfiguredAI(options: AIChatOptions) {
  const providers = getProviderOrder();
  const maxAttempts = Number(process.env.AI_MAX_RETRIES || process.env.OPENROUTER_MAX_RETRIES || 3);
  const errors: string[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    for (const provider of providers) {
      try {
        if (provider === "openai") {
          return await callOpenAI(options);
        }

        if (provider === "openrouter") {
          return await callOpenRouter(options);
        }
      } catch (error) {
        errors.push(
          `${options.purpose || "AI"} attempt ${attempt} via ${provider}: ${
            error instanceof Error ? error.message : "Unknown AI provider error."
          }`,
        );
      }
    }

    await sleep(700 * attempt);
  }

  throw new Error(`AI request failed. ${errors.join(" | ")}`);
}

export function extractJsonObject(text: string) {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("AI did not return valid JSON.");
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

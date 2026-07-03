import { NextRequest, NextResponse } from "next/server";

// Server-only — API keys never reach the browser.
//
// Locally (npm run dev) this calls Claude. On Vercel it calls Groq instead —
// Vercel automatically sets the VERCEL env var at build/runtime, so the
// switch is automatic and needs no manual toggle. NARRATIVE_PROVIDER can
// force a specific provider if you ever need to override that.
//
// Note: Groq (api.groq.com, fast open-model inference) is a different
// company from xAI's Grok (api.x.ai) — easy to mix up, don't swap these.
const isDeployed = process.env.VERCEL === "1";
const PROVIDER = process.env.NARRATIVE_PROVIDER || (isDeployed ? "groq" : "claude");

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = process.env.CLAUDE_NARRATIVE_MODEL || "claude-sonnet-5";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// Cookie used to cap the public demo to one AI summary per visitor.
// Deliberately simple (no database) — clearing cookies or using a private
// window resets it, which is an acceptable tradeoff for a portfolio demo.
const DEMO_LIMIT_COOKIE = "mp_demo_used";

interface NarrativeRequestBody {
  cleaningSummary: {
    totalRowsIn: number;
    totalRowsOut: number;
    duplicatesRemoved: number;
    missingValuesHandled: number;
  };
  kpis: {
    totalRevenue: number;
    totalUnits: number;
    avgOrderValue: number;
    momGrowthPct: number;
  };
  topAnomalies: {
    sku: string;
    category: string;
    date: string;
    type: string;
    value: number;
    expected: number;
  }[];
  topSkus: { sku: string; category: string; pctChange: number; revenueCurrent: number }[];
  decliningSkus: { sku: string; category: string; pctChange: number; revenueCurrent: number }[];
  forecast: { nextPeriodRevenue: number; confidence: string; method: string };
}

const SYSTEM_PROMPT = `You are a senior e-commerce operations analyst writing the executive summary section of an internal weekly sales report for retail/marketplace leadership (Amazon, Walmart, and Shopify channels).

You will be given a compact structured JSON summary of the period's data — NOT raw transaction data. Write in a professional, direct, business-report tone. Do not invent specific numbers that were not provided to you; only reason over the figures given.

Respond ONLY with valid JSON in this exact shape, with no markdown fences and no preamble:
{
  "summary": "4-6 sentences covering what happened this period, the standout winners/decliners, and any anomalies worth flagging — written as flowing prose, not bullet points",
  "recommendations": ["3 to 5 short, concrete, actionable recommendations, each one sentence"]
}`;

function parseNarrativeText(rawText: string): { summary: string; recommendations: string[] } {
  try {
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return { summary: parsed.summary, recommendations: parsed.recommendations ?? [] };
  } catch {
    return { summary: rawText, recommendations: [] };
  }
}

async function callClaude(userContent: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new NarrativeError(
      500,
      "ANTHROPIC_API_KEY is not set on the server. Add it to your .env.local (see .env.example) to enable AI narrative generation."
    );
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new NarrativeError(502, `Anthropic API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const textBlock = (data.content ?? []).find((b: { type: string }) => b.type === "text");
  const rawText: string = textBlock?.text ?? "{}";
  return { ...parseNarrativeText(rawText), model: CLAUDE_MODEL };
}

async function callGroq(userContent: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new NarrativeError(
      500,
      "GROQ_API_KEY is not set on the server. Add it in your Vercel project's environment variables to enable AI narrative generation."
    );
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 1000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new NarrativeError(502, `Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText: string = data.choices?.[0]?.message?.content ?? "{}";
  return { ...parseNarrativeText(rawText), model: GROQ_MODEL };
}

class NarrativeError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function POST(req: NextRequest) {
  if (PROVIDER === "groq" && req.cookies.get(DEMO_LIMIT_COOKIE)) {
    return NextResponse.json(
      {
        error:
          "This is a live public demo — the AI executive summary is limited to one generation per visitor. Everything else (dashboard, charts, exports) is unlimited.",
      },
      { status: 429 }
    );
  }

  let body: NarrativeRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const userContent = JSON.stringify(body, null, 2);

  try {
    const { summary, recommendations, model } =
      PROVIDER === "groq" ? await callGroq(userContent) : await callClaude(userContent);

    const res = NextResponse.json({
      summary,
      recommendations,
      generatedAt: new Date().toISOString(),
      model,
    });

    if (PROVIDER === "groq") {
      res.cookies.set(DEMO_LIMIT_COOKIE, "1", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return res;
  } catch (err) {
    if (err instanceof NarrativeError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: `Failed to reach the AI provider: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}

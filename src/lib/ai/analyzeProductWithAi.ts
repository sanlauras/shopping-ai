import { AnalysisContent, ProductInfo } from "@/types/product";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function isAiConfigured(): boolean {
  return Boolean(GEMINI_API_KEY);
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer" },
    summary: { type: "string" },
    goodPoints: { type: "array", items: { type: "string" } },
    badPoints: { type: "array", items: { type: "string" } },
    recommendedFor: { type: "array", items: { type: "string" } },
    notRecommendedFor: { type: "array", items: { type: "string" } },
  },
  required: [
    "score",
    "summary",
    "goodPoints",
    "badPoints",
    "recommendedFor",
    "notRecommendedFor",
  ],
};

// 現時点ではレビュー本文の収集は未実装のため、タイトル・価格・販売サイトのみから
// 一般的に想定される観点を組み立てる。個別の欠陥/長所を断定しないよう指示している。
function buildPrompt(info: ProductInfo): string {
  return `あなたはショッピングサイトの商品購入をサポートするアシスタントです。
以下の商品情報だけをもとに、購入検討者向けの分析を日本語で作成してください。
実際のレビュー本文は与えられていないため、「壊れやすい」「電池持ちが悪い」のような
具体的すぎる欠陥・長所を断定的に書かないでください。商品カテゴリや価格帯から一般的に
想定される観点(用途、価格の妥当性、購入前に確認すべき点)を中心にまとめてください。

商品名: ${info.title}
価格: ${info.price ? `${info.price}円` : "不明"}
販売サイト: ${info.siteName}

score は 0〜100 の整数で、価格やカテゴリから見た「情報の分かりやすさ」の目安としてください
(実際のレビュー評価ではないことに注意してください)。`;
}

export async function analyzeProductWithAi(
  info: ProductInfo
): Promise<AnalysisContent> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(info) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: HTTP ${response.status}`);
  }

  const data = await response.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini API returned no content");

  const parsed = JSON.parse(text);

  return {
    score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
    summary: String(parsed.summary ?? ""),
    goodPoints: Array.isArray(parsed.goodPoints)
      ? parsed.goodPoints.map(String)
      : [],
    badPoints: Array.isArray(parsed.badPoints)
      ? parsed.badPoints.map(String)
      : [],
    recommendedFor: Array.isArray(parsed.recommendedFor)
      ? parsed.recommendedFor.map(String)
      : [],
    notRecommendedFor: Array.isArray(parsed.notRecommendedFor)
      ? parsed.notRecommendedFor.map(String)
      : [],
  };
}

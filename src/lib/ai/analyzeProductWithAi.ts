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

// レビュー本文そのものの収集はまだ未実装のため、楽天APIで取れる
// 「商品説明・レビュー平均点・件数」までを材料にする。これらが無い
// サイト(Amazon・Yahoo!)では、AIに「情報なし」と正直に伝え、
// 存在しないデータを埋め合わせて断定しないよう指示する。
export function buildPrompt(info: ProductInfo): string {
  const hasReviewStats = info.reviewAverage !== null && info.reviewCount !== null;

  return `あなたはショッピングサイトの商品購入をサポートするアシスタントです。
以下の商品情報だけをもとに、購入検討者向けの分析を日本語で作成してください。
実際のレビュー本文(個々の感想の文章)は与えられていないため、「壊れやすい」
「電池持ちが悪い」のような具体的すぎる欠陥・長所を断定的に書かないでください。

商品名: ${info.title}
価格: ${info.price !== null ? `${info.price}円` : "不明"}
販売サイト: ${info.siteName}
商品説明: ${info.description ?? "情報なし"}
レビュー平均点: ${info.reviewAverage !== null ? `5点満点中 ${info.reviewAverage}点` : "情報なし"}
レビュー件数: ${info.reviewCount !== null ? `${info.reviewCount}件` : "情報なし"}

${
  hasReviewStats
    ? `レビュー平均点・件数の情報があります。これらの数値を根拠として言及してよいですが、
個々の具体的なレビュー内容(誰が何を書いたか等)は与えられていないため創作しないでください。
score は 0〜100 の整数とし、レビュー評価(5点満点)を100点満点に換算したものを主な基準に、
商品説明や価格も参考にして決めてください。`
    : `レビュー平均点・件数が「情報なし」となっているサイトのため、実際の顧客評価データは
ありません。商品カテゴリや価格帯から一般的に想定される観点(用途、価格の妥当性、購入前に
確認すべき点)を中心にまとめてください。
score は 0〜100 の整数で、価格やカテゴリから見た「情報の分かりやすさ」の目安としてください
(実際のレビュー評価ではないことに注意してください)。`
}`;
}

const AI_TIMEOUT_MS = 12000;

export async function analyzeProductWithAi(
  info: ProductInfo
): Promise<AnalysisContent> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(
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
        signal: controller.signal,
      }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`[analyzeProductWithAi] timeout after ${AI_TIMEOUT_MS}ms`);
      throw new Error("Gemini API timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    console.error(`[analyzeProductWithAi] HTTP ${response.status}`);
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

import * as cheerio from "cheerio";
import { ProductInfo, SiteName } from "@/types/product";

function parseJsonLdPrice($: cheerio.CheerioAPI): number | null {
  const scripts = $('script[type="application/ld+json"]').toArray();

  for (const script of scripts) {
    const raw = $(script).contents().text();
    if (!raw) continue;

    try {
      const data = JSON.parse(raw);
      const candidates = Array.isArray(data) ? data : [data];

      for (const item of candidates) {
        const offers = item?.offers;
        const price = Array.isArray(offers) ? offers[0]?.price : offers?.price;
        const parsed = Number(price);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // JSON-LDの形式がおかしいページもあるため、失敗しても無視して次を試す
    }
  }
  return null;
}

function parsePriceFromText(text: string): number | null {
  const match = text.match(/[¥￥]\s?([\d,]{3,10})/);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) && value >= 10 && value <= 100_000_000
    ? value
    : null;
}

// サイトごとにCSSセレクタが違うため、上から順に試して最初に見つかった値を採用する。
const PRICE_SELECTORS: Record<SiteName, string[]> = {
  amazon: [
    "#corePriceDisplay_desktop_feature_div .a-price .a-offscreen",
    "#priceblock_ourprice",
    "#priceblock_dealprice",
    ".a-price .a-offscreen",
  ],
  rakuten: ['[itemprop="price"]', ".price--3zUFA", "#priceCalculationConfig"],
  yahoo: ['[itemprop="price"]', ".elPrice", ".Price__value"],
  unknown: ['[itemprop="price"]'],
};

const TITLE_SELECTORS: Record<SiteName, string[]> = {
  amazon: ["#productTitle"],
  rakuten: [".item-name", "h1"],
  yahoo: [".elName", "h1"],
  unknown: ["h1"],
};

const IMAGE_SELECTORS: Record<SiteName, string[]> = {
  amazon: ["#landingImage", "#imgTagWrapperId img"],
  rakuten: [".image--3z5RH img"],
  yahoo: [".elImg img"],
  unknown: [],
};

function pickFirstText($: cheerio.CheerioAPI, selectors: string[]): string | null {
  for (const selector of selectors) {
    const text = $(selector).first().text().trim();
    if (text) return text;
  }
  return null;
}

function pickFirstPrice($: cheerio.CheerioAPI, selectors: string[]): number | null {
  for (const selector of selectors) {
    const el = $(selector).first();
    if (!el.length) continue;
    const raw = el.attr("content") ?? el.text();
    const price = parsePriceFromText(raw) ?? Number(raw.replace(/[^\d]/g, ""));
    if (Number.isFinite(price) && price > 0) return price;
  }
  return null;
}

function pickFirstImage($: cheerio.CheerioAPI, selectors: string[]): string | null {
  for (const selector of selectors) {
    const src = $(selector).first().attr("src");
    if (src) return src;
  }
  return null;
}

export function parseProductInfo(
  html: string,
  sourceUrl: string,
  siteName: SiteName
): ProductInfo {
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    pickFirstText($, TITLE_SELECTORS[siteName]) ||
    $("title").text().trim() ||
    "商品名を取得できませんでした";

  const imageUrl =
    $('meta[property="og:image"]').attr("content")?.trim() ||
    pickFirstImage($, IMAGE_SELECTORS[siteName]) ||
    null;

  const ogPriceMeta = Number(
    $('meta[property="product:price:amount"]').attr("content")
  );

  const price =
    parseJsonLdPrice($) ??
    (Number.isFinite(ogPriceMeta) && ogPriceMeta > 0 ? ogPriceMeta : null) ??
    pickFirstPrice($, PRICE_SELECTORS[siteName]) ??
    parsePriceFromText($("body").text());

  return {
    title,
    imageUrl,
    price,
    sourceUrl,
    siteName,
  };
}

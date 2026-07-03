import { SiteName } from "@/types/product";

const HOST_PATTERNS: [RegExp, SiteName][] = [
  [/(^|\.)amazon\.co\.jp$/, "amazon"],
  [/(^|\.)amazon\.com$/, "amazon"],
  [/(^|\.)rakuten\.co\.jp$/, "rakuten"],
  [/(^|\.)shopping\.yahoo\.co\.jp$/, "yahoo"],
];

export function detectSite(url: string): SiteName {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return "unknown";
  }

  for (const [pattern, siteName] of HOST_PATTERNS) {
    if (pattern.test(hostname)) return siteName;
  }
  return "unknown";
}

export const SUPPORTED_SITE_LABEL = "Amazon / 楽天市場 / Yahoo!ショッピング";

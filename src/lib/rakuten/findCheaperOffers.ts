import { extractRakutenItemCode } from "@/lib/rakuten/extractItemCode";
import { searchRakutenItemsByKeyword } from "@/lib/rakuten/searchRakutenItem";

const MAX_KEYWORD_LENGTH = 50;
// 商品名の単語のうち、これ以上の割合が一致していれば「同じような商品」とみなす。
// 低すぎると無関係な商品を安いおすすめとして出してしまう危険があるため、
// やや厳しめの値にしている。
const MIN_TITLE_OVERLAP = 0.4;
const MAX_OFFERS = 5;

function tokenize(title: string): Set<string> {
  return new Set(
    title
      .split(/[\s/／【】()（）[\]｜|・,、。:：]+/)
      .map((token) => token.trim().toLowerCase())
      .filter((token) => token.length > 1)
  );
}

// baseの単語のうち、candidateにも含まれる単語の割合(0〜1)。
function titleOverlapRatio(base: string, candidate: string): number {
  const baseTokens = tokenize(base);
  if (baseTokens.size === 0) return 0;

  const candidateTokens = tokenize(candidate);
  let matched = 0;
  for (const token of baseTokens) {
    if (candidateTokens.has(token)) matched++;
  }
  return matched / baseTokens.size;
}

export type CheaperOffer = {
  shopName: string;
  price: number;
  itemUrl: string;
};

// 今表示している商品と似た商品名で幅広く検索し、
// ・自分自身は除外
// ・商品名の類似度が低いもの(=別の商品の可能性が高いもの)は除外
// ・今の価格より安いものだけ
// を安い順に返す。見つからなくてもエラーにはしない(価格比較はおまけの機能のため)。
export async function findCheaperOffers(current: {
  shopCode: string;
  itemCode: string;
  title: string;
  price: number;
}): Promise<CheaperOffer[]> {
  const keyword = current.title.slice(0, MAX_KEYWORD_LENGTH);
  const candidates = await searchRakutenItemsByKeyword(keyword);

  const offers: CheaperOffer[] = [];

  for (const candidate of candidates) {
    if (candidate.itemPrice >= current.price) continue;
    if (titleOverlapRatio(current.title, candidate.itemName) < MIN_TITLE_OVERLAP) continue;

    try {
      const parsed = extractRakutenItemCode(candidate.itemUrl);
      if (parsed.shopCode === current.shopCode && parsed.itemCode === current.itemCode) {
        continue; // 自分自身
      }
    } catch {
      // itemUrlが想定外の形式でも、価格比較としては採用して問題ない
    }

    offers.push({
      shopName: candidate.shopName,
      price: candidate.itemPrice,
      itemUrl: candidate.itemUrl,
    });
  }

  offers.sort((a, b) => a.price - b.price);
  return offers.slice(0, MAX_OFFERS);
}

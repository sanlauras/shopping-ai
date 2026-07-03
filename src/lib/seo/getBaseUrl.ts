// 独自ドメイン設定後は NEXT_PUBLIC_SITE_URL を設定するとそちらが優先される。
// 未設定の間はVercelが自動で払い出すVERCEL_URLを使うので、追加設定なしでも動く。
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

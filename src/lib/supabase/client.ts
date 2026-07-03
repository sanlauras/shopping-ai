import { createClient, SupabaseClient } from "@supabase/supabase-js";

// SUPABASE_SERVICE_ROLE_KEYはサーバー専用の強い権限を持つキー。
// NEXT_PUBLIC_を付けず、サーバーコンポーネント/Route Handlerからのみ使う。
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;

// 環境変数が未設定の間はnullを返し、呼び出し側はDBキャッシュなしで動作を続ける。
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  if (!client) {
    client = createClient(SUPABASE_URL as string, SUPABASE_SERVICE_ROLE_KEY as string, {
      auth: { persistSession: false },
    });
  }
  return client;
}

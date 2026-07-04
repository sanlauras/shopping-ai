-- shopping-ai: 商品解析結果を保存するテーブル
-- Supabaseのダッシュボード > SQL Editor で実行してください。

create table if not exists products (
  id text primary key,
  source_url text not null,
  site_name text not null,
  title text not null,
  image_url text,
  price integer,
  description text,
  review_average numeric,
  review_count integer,
  score integer not null,
  summary text not null,
  good_points jsonb not null default '[]',
  bad_points jsonb not null default '[]',
  recommended_for jsonb not null default '[]',
  not_recommended_for jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_site_name_idx on products (site_name);
create index if not exists products_created_at_idx on products (created_at desc);

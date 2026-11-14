-- Supabase Dashboard > SQL Editor で全体を実行してください。
create table if not exists public.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint save_data_is_object check (jsonb_typeof(save_data) = 'object')
);

alter table public.game_saves enable row level security;

-- ログイン中の本人だけが自分のセーブを読み書きできます。
drop policy if exists "Users can read own save" on public.game_saves;
create policy "Users can read own save" on public.game_saves
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own save" on public.game_saves;
create policy "Users can insert own save" on public.game_saves
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own save" on public.game_saves;
create policy "Users can update own save" on public.game_saves
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- v4.0: 公開ランキング。メールアドレスやセーブ内容は公開せず、集計値と表示名のみ公開します。
create table if not exists public.leaderboard_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  player_name text not null default '雪山の木こり' check (char_length(player_name) between 1 and 18),
  player_level integer not null default 1 check (player_level >= 1),
  total_logs bigint not null default 0 check (total_logs >= 0),
  total_stars bigint not null default 0 check (total_stars >= 0),
  total_money bigint not null default 0 check (total_money >= 0),
  updated_at timestamptz not null default now()
);

alter table public.leaderboard_profiles enable row level security;
drop policy if exists "Leaderboard is public" on public.leaderboard_profiles;
create policy "Leaderboard is public" on public.leaderboard_profiles
  for select using (true);
drop policy if exists "Users can insert own leaderboard profile" on public.leaderboard_profiles;
create policy "Users can insert own leaderboard profile" on public.leaderboard_profiles
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update own leaderboard profile" on public.leaderboard_profiles;
create policy "Users can update own leaderboard profile" on public.leaderboard_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists leaderboard_total_logs_idx on public.leaderboard_profiles (total_logs desc);
create index if not exists leaderboard_player_level_idx on public.leaderboard_profiles (player_level desc);
create index if not exists leaderboard_total_stars_idx on public.leaderboard_profiles (total_stars desc);
create index if not exists leaderboard_total_money_idx on public.leaderboard_profiles (total_money desc);

-- API roles for the leaderboard table.
grant select on public.leaderboard_profiles to anon, authenticated;
grant insert, update on public.leaderboard_profiles to authenticated;

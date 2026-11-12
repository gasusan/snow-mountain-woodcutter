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

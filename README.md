# 雪山の丸太割り v3.0 - アカウント・クラウドセーブ

## 今回の更新
- Supabase Auth によるメールアドレス・パスワード登録/ログイン
- Supabase PostgreSQLへのクラウドセーブ
- 既存ブラウザセーブ `snowWoodSave` の初回移行
- ログイン後の自動保存（変更後約4秒）と手動保存/復元
- 既存セーブとクラウドセーブが両方ある場合、確認してから片方を採用（自動上書きしない）
- RLSで本人のデータだけ読み書き可能

## 最初に必要な設定（必須）
このZIPをGitHubへ上げるだけでは、Supabaseのプロジェクト設定がまだないためログイン機能は動きません。以下を一度設定してください。

### 1. Supabaseプロジェクトを作成
1. https://supabase.com/ を開いて無料アカウントを作成/ログイン。
2. New project を押し、プロジェクト名・データベースパスワード・リージョンを設定。
3. プロジェクトが起動するまで待つ。

### 2. セーブ用テーブルを作成
1. Supabaseの左メニューから SQL Editor を開く。
2. `supabase/schema.sql` の中身を全部コピーして貼り付ける。
3. Run を押す。`game_saves` テーブルが作成される。

### 3. 公開キーを設定
1. Supabaseの Project Settings → API（または Connect / API Keys）を開く。
2. Project URL と anon / publishable key をコピー。
3. `public/supabase-config.js` の2つの値を書き換える。
   - `YOUR_SUPABASE_PROJECT_URL` → Project URL
   - `YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY` → anon / publishable key
4. このファイルを含めてGitHubへアップロードし、Renderを再デプロイ。

**重要：** ブラウザに置くのは Project URL と anon/publishable key のみ。`service_role` / secret key は絶対に貼り付けたり公開したりしないこと。RLSが本人のデータだけを保護する。

### 4. メール確認設定
Supabase Authentication → URL Configuration で Site URL を `https://snow-mountain-woodcutter.onrender.com` に設定。必要に応じて Redirect URLs に同じURLを追加。
無料プランの標準メール送信には制限があるため、登録確認メールが届かない場合はSupabaseのAuth設定・メール送信制限を確認してください。

## プレイヤー向けの移行
- 旧ブラウザに `snowWoodSave` が残っている状態で新しいゲームを開く。
- 山小屋 → アカウント・クラウドセーブ から登録またはログイン。
- アカウントにクラウドデータがなければ、既存ブラウザセーブをクラウドへ移行する確認が出る。
- 既にクラウドデータがある場合は、クラウドから復元するか、この端末のデータで上書きするか確認する。
- データが消えた端末で空のセーブを先にクラウドへ保存しないよう、移行時の確認をよく読むこと。

## デプロイ
Renderの既存設定をそのまま使用。Build Command `npm install`、Start Command `npm start`。

## 注意
- Supabase Freeは無料だが、低アクティビティが7日続くとプロジェクトが一時停止することがある。Supabase DashboardからResumeできる。
- Freeプランには自動バックアップが含まれない。大切なセーブはゲーム内の「セーブコードを書き出す」も併用する。
- クラウド保存はログイン後に有効。ログイン前は従来どおりブラウザ内に保存。

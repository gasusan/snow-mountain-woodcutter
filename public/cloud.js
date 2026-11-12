(() => {
  const $ = (id) => document.getElementById(id);
  const status = (msg) => { $('cloudStatus').textContent = msg; };
  const message = (msg) => { $('cloudMessage').textContent = msg; };
  const configured = window.SUPABASE_URL && window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.includes('YOUR_') && !window.SUPABASE_ANON_KEY.includes('YOUR_');
  if (!configured || !window.supabase?.createClient) {
    status('未接続：Supabaseの接続設定が必要です');
    message('supabase-config.js に Project URL と anon/publishable key を設定すると有効になります。');
    ['signUpBtn','signInBtn','signOutBtn','cloudSaveBtn','cloudLoadBtn'].forEach(id => $(id).disabled = true);
    return;
  }
  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  let user = null, busy = false, timer = null, lastCloudAt = null;
  const setButtons = () => {
    $('signOutBtn').disabled = !user;
    $('cloudSaveBtn').disabled = !user;
    $('cloudLoadBtn').disabled = !user;
  };
  async function getProfile() {
    const { data, error } = await client.from('game_saves').select('save_data, updated_at').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    return data;
  }
  async function writeCloud(data) {
    if (!user || busy) return;
    busy = true;
    try {
      const { error } = await client.from('game_saves').upsert({ user_id: user.id, save_data: data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) throw error;
      lastCloudAt = new Date();
      status(`ログイン中：${user.email} ／ 最終保存 ${lastCloudAt.toLocaleString('ja-JP')}`);
      message('クラウド保存が完了しました。別の端末でも同じアカウントで続きから遊べます。');
    } catch (e) { message(`クラウド保存に失敗しました：${e.message}。ブラウザ内のセーブは残っています。`); }
    finally { busy = false; }
  }
  async function syncAfterLogin() {
    const remote = await getProfile();
    const local = window.getWoodcutterSave();
    if (!remote) {
      const ok = confirm('このアカウントにはクラウドセーブがありません。\nこのブラウザの既存セーブをクラウドへ移行しますか？');
      if (ok) await writeCloud(local);
      else message('クラウドへの移行は保留しました。既存のブラウザセーブはそのまま残っています。');
      return;
    }
    const choice = confirm('クラウドセーブが見つかりました。\nOK：クラウドのデータでこの端末を更新\nキャンセル：この端末のデータをクラウドへ上書き');
    if (choice) {
      window.applyCloudSave(remote.save_data);
      lastCloudAt = new Date(remote.updated_at);
      message('クラウドセーブをこの端末に復元しました。');
    } else {
      if (confirm('本当に現在の端末データでクラウドを上書きしますか？古いクラウドデータは置き換わります。')) await writeCloud(local);
    }
  }
  async function refreshSession() {
    const { data: { session } } = await client.auth.getSession();
    user = session?.user || null; setButtons();
    if (user) { status(`ログイン中：${user.email}`); try { await syncAfterLogin(); } catch(e) { message(`セーブ確認エラー：${e.message}`); } }
    else status('未ログイン：このブラウザにセーブされています');
  }
  $('signUpBtn').onclick = async () => {
    const email = $('accountEmail').value.trim(), password = $('accountPassword').value;
    if (!email || password.length < 8) return message('メールアドレスと8文字以上のパスワードを入力してください。');
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) return message(`登録できませんでした：${error.message}`);
    if (data.session) { user = data.user; setButtons(); status(`ログイン中：${user.email}`); await syncAfterLogin(); }
    else message('確認メールを送信しました。メール内のリンクを開いてからログインしてください。');
  };
  $('signInBtn').onclick = async () => {
    const { data, error } = await client.auth.signInWithPassword({ email: $('accountEmail').value.trim(), password: $('accountPassword').value });
    if (error) return message(`ログインできませんでした：${error.message}`);
    user = data.user; setButtons(); status(`ログイン中：${user.email}`);
    try { await syncAfterLogin(); } catch(e) { message(`クラウドセーブ確認エラー：${e.message}`); }
  };
  $('signOutBtn').onclick = async () => { await client.auth.signOut(); user = null; setButtons(); status('ログアウトしました。ブラウザ内のセーブは残っています。'); };
  $('cloudSaveBtn').onclick = () => writeCloud(window.getWoodcutterSave());
  $('cloudLoadBtn').onclick = async () => {
    if (!confirm('現在の端末のセーブをクラウドの内容で置き換えますか？')) return;
    try { const remote = await getProfile(); if (!remote) return message('クラウドセーブがまだありません。'); window.applyCloudSave(remote.save_data); message('クラウドから復元しました。'); }
    catch(e) { message(`復元できませんでした：${e.message}`); }
  };
  const originalSave = window.save;
  if (typeof originalSave === 'function') {
    window.save = function(...args) {
      const result = originalSave.apply(this, args);
      if (user) { clearTimeout(timer); timer = setTimeout(() => writeCloud(window.getWoodcutterSave()), 4000); }
      return result;
    };
  }
  client.auth.onAuthStateChange((_event, session) => { user = session?.user || null; setButtons(); if (!user) status('未ログイン：このブラウザにセーブされています'); });
  refreshSession();
})();

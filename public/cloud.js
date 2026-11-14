(() => {
  const $ = (id) => document.getElementById(id);
  const status = (msg) => { const el=$('cloudStatus'); if(el) el.textContent=msg; };
  const message = (msg) => { const el=$('cloudMessage'); if(el) el.textContent=msg; };
  const pendingKey = 'snowWoodCloudPending';
  let user=null, client=null, busy=false, pending=false, timer=null, lastCloudAt=null, syncing=false, nextRetryAt=0;
  try{pending=localStorage.getItem(pendingKey)==='1'}catch(e){}
  const configured = window.SUPABASE_URL && window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.includes('YOUR_') && !window.SUPABASE_ANON_KEY.includes('YOUR_');
  const setButtons=()=>{
    ['signOutBtn','cloudSaveBtn','cloudLoadBtn'].forEach(id=>{const el=$(id);if(el)el.disabled=!user});
  };
  const markPending=()=>{pending=true;try{localStorage.setItem(pendingKey,'1')}catch(e){}};
  const clearPending=()=>{pending=false;try{localStorage.removeItem(pendingKey)}catch(e){}};
  const getName=()=>{
    let n=(localStorage.getItem('snowWoodPlayerName')||'').trim();
    if(!n && user)n='木こり'+String(user.id).slice(-4);
    return (n||'雪山の木こり').slice(0,18);
  };
  async function getProfile(){
    const {data,error}=await client.from('game_saves').select('save_data, updated_at').eq('user_id',user.id).maybeSingle();
    if(error)throw error;return data;
  }
  async function publishLeaderboard(data){
    if(!user)return;
    const row={user_id:user.id,player_name:getName(),player_level:Math.max(1,Math.floor(data.level||1)),total_logs:Math.max(0,Math.floor(data.lifetimeLogs||data.totalLogs||0)),total_stars:Math.max(0,Math.floor(data.totalStarsEarned||data.stars||0)),total_money:Math.max(0,Math.floor(data.money||0)),updated_at:new Date().toISOString()};
    const {error}=await client.from('leaderboard_profiles').upsert(row,{onConflict:'user_id'});
    if(error)throw error;
  }
  async function writeCloud(data){
    if(!user||!navigator.onLine){markPending();return false;}
    if(busy){markPending();return false;}
    busy=true;
    try{
      const snapshot=JSON.parse(JSON.stringify(data));
      const {error}=await client.from('game_saves').upsert({user_id:user.id,save_data:snapshot,updated_at:new Date().toISOString()},{onConflict:'user_id'});
      if(error)throw error;
      lastCloudAt=new Date();nextRetryAt=0;clearPending();
      status(`ログイン中：${user.email} ／ クラウド保存 ${lastCloudAt.toLocaleTimeString('ja-JP')}`);
      try{await publishLeaderboard(snapshot);message('クラウド保存・ランキング更新が完了しました。');}
      catch(rankError){message(`ゲームデータはクラウド保存済みです。ランキング更新のみ保留：${rankError.message}（Supabaseでv4.0のschema.sqlを実行してください）`);}
      return true;
    }catch(e){markPending();nextRetryAt=Date.now()+10000;message(`クラウド同期を保留しました：${e.message}。端末内のセーブは保持されています。`);return false;}
    finally{busy=false;if(pending&&navigator.onLine&&user)scheduleSync(1200);}
  }
  function scheduleSync(delay=3000){
    markPending();
    if(!user||!navigator.onLine||timer)return;
    delay=Math.max(delay,nextRetryAt-Date.now());
    timer=setTimeout(async()=>{timer=null;if(!user||!navigator.onLine)return;await writeCloud(window.getWoodcutterSave());},delay);
  }
  async function syncAfterLogin(){
    const remote=await getProfile();
    const local=window.getWoodcutterSave();
    if(!remote){
      const saved=await writeCloud(local);
      if(saved)message('このアカウントの初回クラウドセーブを作成しました。');
      else message('初回クラウド保存は保留中です。端末内のセーブは残り、通信が戻れば自動で再試行します。');
      return;
    }
    const hasLocalPending=localStorage.getItem(pendingKey)==='1';
    if(hasLocalPending){
      const choice=confirm('この端末にクラウド未同期の進行があります。\nOK：この端末の進行をクラウドへ同期\nキャンセル：クラウドのデータをこの端末へ復元');
      if(choice)await writeCloud(local);
      else{window.applyCloudSave(remote.save_data);clearPending();message('クラウドのセーブを復元しました。');}
      return;
    }
    const choice=confirm('クラウドセーブが見つかりました。\nOK：クラウドのデータでこの端末を更新\nキャンセル：この端末のデータでクラウドを上書き');
    if(choice){window.applyCloudSave(remote.save_data);message('クラウドセーブを復元しました。');}
    else if(confirm('本当に現在の端末データでクラウドを上書きしますか？古いクラウドデータは置き換わります。'))await writeCloud(local);
  }
  async function refreshSession(){
    const {data:{session}}=await client.auth.getSession();user=session?.user||null;setButtons();
    if(user){status(`ログイン中：${user.email}`);try{await syncAfterLogin()}catch(e){message(`セーブ確認エラー：${e.message}`)}}
    else status('未ログイン：この端末に自動保存されています');
  }
  async function loadLeaderboard(metric='total_logs'){
    const list=$('rankingList'),state=$('rankingStatus');
    if(!client){if(list)list.innerHTML='<div class="ranking-empty">Supabaseの接続設定が必要です。</div>';return;}
    if(list)list.innerHTML='<div class="ranking-empty">ランキングを読み込み中…</div>';
    const allowed=['total_logs','player_level','total_stars','total_money'];if(!allowed.includes(metric))metric='total_logs';
    try{
      const {data,error}=await client.from('leaderboard_profiles').select('player_name,player_level,total_logs,total_stars,total_money,updated_at').order(metric,{ascending:false}).limit(50);
      if(error)throw error;
      const labels={total_logs:'本',player_level:'Lv.',total_stars:'個',total_money:'G'};
      if(list)list.innerHTML=(data||[]).length?(data||[]).map((r,i)=>`<div class="ranking-row"><div class="ranking-rank">${i+1}</div><div class="ranking-player"><b>${escapeHtml(r.player_name||'雪山の木こり')}</b><small>Lv.${Number(r.player_level||1)} ・ 累計 ${Number(r.total_logs||0).toLocaleString()}本</small></div><div class="ranking-score">${Number(r[metric]||0).toLocaleString()} ${labels[metric]}</div></div>`).join(''):'<div class="ranking-empty">まだランキングデータがありません。ログインしてプレイすると登録されます！</div>';
      if(state)state.textContent=user?'ログイン中：プレイ内容はクラウド保存時にランキングへ反映されます。':'ランキング閲覧中：登録にはログインが必要です。';
    }catch(e){if(list)list.innerHTML=`<div class="ranking-empty">ランキングを取得できませんでした。SQLのv4.0追加分をSupabaseで実行したか確認してください。<br>${escapeHtml(e.message)}</div>`;}
  }
  function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  if(!configured||!window.supabase?.createClient){
    status('未接続：Supabaseの接続設定が必要です');message('supabase-config.js に Project URL と anon/publishable key を設定してください。');
    ['signUpBtn','signInBtn','signOutBtn','cloudSaveBtn','cloudLoadBtn'].forEach(id=>{if($(id))$(id).disabled=true});
  }else{
    client=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    $('signUpBtn').onclick=async()=>{
      const email=$('accountEmail').value.trim(),password=$('accountPassword').value;
      if(!email||password.length<8)return message('メールアドレスと8文字以上のパスワードを入力してください。');
      const {data,error}=await client.auth.signUp({email,password});if(error)return message(`登録できませんでした：${error.message}`);
      if(data.session){user=data.user;setButtons();await syncAfterLogin()}else message('確認メールを送信しました。メール内のリンクを開いてからログインしてください。');
    };
    $('signInBtn').onclick=async()=>{
      const {data,error}=await client.auth.signInWithPassword({email:$('accountEmail').value.trim(),password:$('accountPassword').value});
      if(error)return message(`ログインできませんでした：${error.message}`);user=data.user;setButtons();try{await syncAfterLogin()}catch(e){message(`クラウドセーブ確認エラー：${e.message}`)};
    };
    $('signOutBtn').onclick=async()=>{await client.auth.signOut();user=null;setButtons();status('ログアウトしました。端末内の自動保存は継続します。')};
    $('cloudSaveBtn').onclick=()=>writeCloud(window.getWoodcutterSave());
    $('cloudLoadBtn').onclick=async()=>{if(!confirm('現在の端末データをクラウドの内容で置き換えますか？'))return;try{const remote=await getProfile();if(!remote)return message('クラウドセーブがありません。');window.applyCloudSave(remote.save_data);clearPending();message('クラウドから復元しました。')}catch(e){message(`復元できませんでした：${e.message}`)}};
    const originalSave=window.save;
    if(typeof originalSave==='function')window.save=function(...args){const result=originalSave.apply(this,args);if(user)scheduleSync(3000);return result};
    async function reconnectSync(){
      if(!user||!navigator.onLine||syncing)return;syncing=true;
      try{const remote=await getProfile(),local=window.getWoodcutterSave();
        if(remote&&Date.parse(remote.updated_at||'')>(Number(local.lastSeen||0)+3000)){
          const keepLocal=confirm('オフライン中に別端末から更新されたクラウドデータがあります。\nOK：この端末のオフライン進行を優先してクラウドへ保存\nキャンセル：別端末のクラウドデータを復元');
          if(keepLocal)await writeCloud(local);else{window.applyCloudSave(remote.save_data);clearPending();}
        }else await writeCloud(local);
      }catch(e){message(`再接続時の同期を保留しました：${e.message}`)}finally{syncing=false;}
    }
    window.addEventListener('online',()=>{if(user&&pending)reconnectSync()});
    window.addEventListener('offline',()=>{if(user)message('オフラインです。端末内に保存し、通信復帰後にクラウドへ同期します。')});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&user&&pending)scheduleSync(300)});
    window.addEventListener('pagehide',()=>{try{if(user&&pending)localStorage.setItem(pendingKey,'1')}catch(e){}});
    client.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;setButtons();if(!user)status('未ログイン：この端末に自動保存されています')});
    refreshSession();
  }
  window.WoodcutterCloud={loadLeaderboard,refresh:()=>user&&pending?scheduleSync(100):null,isLoggedIn:()=>!!user};
  const nameInput=$('rankingName');if(nameInput){nameInput.value=localStorage.getItem('snowWoodPlayerName')||'';$('saveRankingName').onclick=()=>{let n=nameInput.value.trim().slice(0,18);if(!n)return alert('1〜18文字の名前を入力してください');localStorage.setItem('snowWoodPlayerName',n);if(user)scheduleSync(100);$('rankingStatus').textContent='表示名を保存しました。次回のクラウド同期でランキングに反映されます。'};}
  const refresh=$('refreshRanking'),metric=$('rankingMetric');if(refresh)refresh.onclick=()=>loadLeaderboard(metric?.value||'total_logs');if(metric)metric.onchange=()=>loadLeaderboard(metric.value);
  if($('rankingList'))loadLeaderboard(metric?.value||'total_logs');
})();

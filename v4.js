/* Snow Mountain Woodcutter v4.0 systems and progression */
(() => {
  const $ = id => document.getElementById(id);
  const now = () => Date.now();
  const fmt = n => Math.floor(Number(n || 0)).toLocaleString('ja-JP');

  // ---- Save migration: keep every existing v1-v3 field and extend safely. ----
  function ensureV4() {
    s.up = { power:0, crit:0, critPower:0, speed:0, value:0, luck:0, ...(s.up || {}) };
    s.woodBy = Array.isArray(s.woodBy) ? s.woodBy.slice(0, woods.length) : [];
    while (s.woodBy.length < woods.length) s.woodBy.push(0);
    s.pets = Array.isArray(s.pets) ? s.pets.map(x => typeof x === 'number' ? {id:x,level:1} : x) : [];
    s.skills = Array.isArray(s.skills) ? s.skills : [];
    s.achievements = Array.isArray(s.achievements) ? s.achievements : [];
    s.starSkills = s.starSkills || {};
    s.milestones = Array.isArray(s.milestones) ? s.milestones : [];
    s.petLevels = s.petLevels || {};
    s.bestPrestigeReward = Number(s.bestPrestigeReward || 1);
    s.runLogs = Number(s.runLogs || s.totalLogs || 0);
    s.autoProgress = Number(s.autoProgress || 0);
    s.autoMachineProgress = Math.max(0, Number(s.autoMachineProgress || 0));
    s.volume = Number.isFinite(s.volume) ? s.volume : 35;
    s.woodcutterSkills = s.woodcutterSkills || {};
    const oldFoundProgress = Number(s.legacyFound ?? s.found ?? 0);
    s.legacyFound = oldFoundProgress;
    s.discoveredWoodTypes = Array.isArray(s.discoveredWoodTypes) ? s.discoveredWoodTypes : woods.map((_,i) => (s.woodBy[i] || 0) > 0 || i === (s.logType || 0));
    while (s.discoveredWoodTypes.length < woods.length) s.discoveredWoodTypes.push(false);
    s.found = Math.max(s.discoveredWoodTypes.filter(Boolean).length, s.legacyFound);
    s.totalPlanksMade = Number(s.totalPlanksMade || 0);
    s.lifetimeLogs = Number(s.lifetimeLogs || s.totalLogs || 0);
    s.craftJobsCompleted = Number(s.craftJobsCompleted || 0);
    s.planks = Number(s.planks || 0);
    s.fireLevel = Math.max(1, Number(s.fireLevel || 1));
    s.fireBuffUntil = Number(s.fireBuffUntil || 0);
    s.craftSpeedLevel = Number(s.craftSpeedLevel || 0);
    s.craftJob = s.craftJob && typeof s.craftJob === 'object' ? s.craftJob : null;
    s.autoMachine = Boolean(s.autoMachine || s.up.speed > 0); // old speed upgrades remain usable
    s.totalStarsEarned = Number(s.totalStarsEarned || 0);
    if (!s.totalStarsEarned) {
      const legacySpent = (s.starSkills.star_power || 0) + (s.starSkills.star_sale || 0) + (s.starSkills.star_auto || 0) + (s.starSkills.star_crit || 0) * 2;
      s.totalStarsEarned = Number(s.stars || 0) + legacySpent;
    }
    s.lastSeen = Number(s.lastSeen || now());
    s.version = 4;
  }

  window.ensureWoodcutterV4 = ensureV4;

  // Extend the axe progression without changing the existing ranks or costs.
  axeNames.push('紅葉の斧', '月光の斧', '天界の斧');
  axeCosts.push(7500000, 30000000, 125000000);

  // New wood types were appended to the original array in app.js, preserving old indices.
  const newAchievements = [
    ['logs10000','一万本の木こり','累計10,000本の丸太を割る','🪵',10000],
    ['logs50000','雪山の大ベテラン','累計50,000本の丸太を割る','🏔️',50000],
    ['player50','熟練の木こり','プレイヤーレベル50に到達','🌟',50],
    ['player100','雪山の頂点','プレイヤーレベル100に到達','👑',100],
    ['allwoods','森の完全調査','13種類すべての木を発見する','🌲',13],
    ['axe10','伝説の鍛冶屋','斧を最高ランクまで強化する','🪓',10],
    ['plank1','初めての木材加工','木の板を1枚作る','🪚',1],
    ['plank100','木工職人','木の板を累計100枚作る','🪵',100],
    ['fire5','焚き火の番人','焚き火レベル5に到達','🔥',5],
    ['fire10','山小屋の守り火','焚き火レベル10に到達','🏕️',10],
    ['craft10','加工の達人','木材加工を10回完了する','🛠️',10],
    ['prestige5','星を継ぐ者','転生を5回行う','🌠',5],
    ['stars50','星の大収集家','山の星を累計50個獲得する','💫',50],
    ['millionaire','雪山の大富豪','累計1,000,000Gを稼ぐ','💰',1000000],
    ['allpets','動物たちの大家族','6種類すべてのペットを仲間にする','🐾',6],
    ['petlevel50','最高の飼育係','ペットの合計レベルを50にする','🐺',50]
  ];
  for (const a of newAchievements) if (!achievements.some(x => x[0] === a[0])) achievements.push(a);

  // Mild debuffs and very rare weather. The old five climates keep their indices.
  weatherList.push(
    ['🥶','凍てつく風','攻撃力が少し低下する。'],
    ['🌫️','深い霧','売却倍率が少し低下する。'],
    ['🌪️','荒れ狂う風','自動木こりの速度が少し低下する。'],
    ['💎','結晶の雪（超レア）','攻撃力と売却倍率が大きく上昇する。'],
    ['🌠','星降る夜（超レア）','クリティカルダメージが大きく上昇する。']
  );

  // ---- Offline progress. The browser save is already local-first; simulate away-time once. ----
  function processOfflineProgress() {
    const elapsed = Math.max(0, Math.min(12 * 3600, (now() - s.lastSeen) / 1000));
    if (elapsed < 2) { s.lastSeen = now(); return; }
    let completed = 0;
    const rate = Math.max(0, Number(window.autoDps ? window.autoDps() : 0));
    if (rate > 0 && s.autoMachine) {
      const type = Math.max(0, Math.min(woods.length - 1, s.logType || 0));
      const w = woods[type];
      const critRate = Math.max(0, Math.min(0.9, (window.critChance ? window.critChance() : 5) / 100));
      const critMult = window.critDamageMultiplier ? window.critDamageMultiplier() : 2 + (s.up.critPower || 0) * .12;
      const averageDamage = Math.max(1, (window.damage ? window.damage() : 1) * (1 + critRate * (critMult - 1)));
      let totalDamage = rate * elapsed * averageDamage;
      const firstNeed = Math.max(1, Number(s.logHp || w.hp));
      if (totalDamage >= firstNeed) {
        totalDamage -= firstNeed;
        completed = 1 + Math.floor(totalDamage / w.hp);
        s.logHp = w.hp - (totalDamage % w.hp);
      } else {
        s.logHp = Math.max(1, firstNeed - totalDamage);
      }
      if (completed > 0) {
        const bonusChance = Math.min(.6, (s.up.luck || 0) * .025 + (s.woodcutterSkills.high_wood || 0) * .03 + (s.starSkills.mid_star_wood || 0) * .05);
        const extra = Math.floor(completed * bonusChance);
        const totalWood = completed + extra;
        s.wood += totalWood;
        s.woodBy[type] = (s.woodBy[type] || 0) + totalWood;
        s.totalLogs += completed;
        s.lifetimeLogs = (s.lifetimeLogs || 0) + completed;
        s.runLogs = (s.runLogs || 0) + completed;
        s.dailyProgress = (s.dailyProgress || 0) + completed;
        s.discoveredWoodTypes[type] = true;
        s.found = s.discoveredWoodTypes.filter(Boolean).length;
        gainXp(completed * w.xp);
      }
    }
    // Time-based systems complete even if the automatic lumberjack is not purchased.
    if (s.craftJob && s.craftJob.finishAt <= now()) finishCrafting(true);
    if (s.exploreEnd && s.exploreEnd <= now()) window.finishExplore();
    s.lastSeen = now();
    if (elapsed > 30) setTimeout(() => toast(`おかえり！留守中の進行を反映しました。${fmt(completed)}本の丸太を自動で割りました。`), 700);
  }

  // ---- Player skills: existing skills become beginner; new mid/advanced skills use skill points. ----
  const playerSkillTiers = [
    {title:'初級スキル',note:'現在の木こりスキル',ids:['keen','seller','focus','worker','scout','heart']},
    {title:'中級スキル',note:'1レベルにつき3ポイント',ids:['mid_power','mid_sale','mid_xp']},
    {title:'上級スキル',note:'1レベルにつき6ポイント',ids:['high_crit','high_auto','high_wood']}
  ];
  const advancedPlayerSkills = [
    {id:'mid_power',name:'鍛え抜かれた腕',desc:'丸太へのダメージ +5% / Lv',icon:'💪',cost:3,max:5},
    {id:'mid_sale',name:'雪山の商才',desc:'売却倍率 +5% / Lv',icon:'🪙',cost:3,max:5},
    {id:'mid_xp',name:'経験の探究者',desc:'獲得経験値 +5% / Lv',icon:'📘',cost:3,max:5},
    {id:'high_crit',name:'会心の極意',desc:'クリティカルダメージ倍率 +0.15 / Lv',icon:'💥',cost:6,max:5},
    {id:'high_auto',name:'神速の斧さばき',desc:'自動木こり速度 +10% / Lv',icon:'⚡',cost:6,max:5},
    {id:'high_wood',name:'豊穣の手',desc:'追加木材の獲得率 +3% / Lv',icon:'🌲',cost:6,max:5}
  ];
  skills.push(...advancedPlayerSkills);
  const baseRenderGrowth = window.renderGrowth || renderGrowth;
  function renderPlayerSkills() {
    const el = $('skillGrid'); if (!el) return;
    const beginner = skills.filter(sk => ['keen','seller','focus','worker','scout','heart'].includes(sk.id));
    let html = `<div class="player-skill-tier"><h3>🌱 初級スキル</h3><div class="skill-grid">${beginner.map(sk => {
      const has=s.skills.includes(sk.id);return `<div class="skill-card"><div class="upgrade-icon">${sk.icon}</div><div class="upgrade-copy"><b>${sk.name}</b><p>${sk.desc}</p></div><button ${has||s.skillPoints<sk.cost?'disabled':''} onclick="buySkill('${sk.id}')">${has?'習得済み':sk.cost+'pt'}</button></div>`;
    }).join('')}</div></div>`;
    for (const tier of playerSkillTiers.slice(1)) {
      const list=advancedPlayerSkills.filter(sk=>tier.ids.includes(sk.id));
      html += `<div class="player-skill-tier"><h3>${tier.title} <small>（${tier.note}）</small></h3><div class="skill-grid">${list.map(sk=>{
        const lv=Number(s.woodcutterSkills[sk.id]||0),cost=sk.cost;
        return `<div class="skill-card"><div class="upgrade-icon">${sk.icon}</div><div class="upgrade-copy"><b>${sk.name} Lv.${lv}/${sk.max}</b><p>${sk.desc}</p></div><button ${lv>=sk.max||s.skillPoints<cost?'disabled':''} onclick="buyWoodSkill('${sk.id}')">${lv>=sk.max?'MAX':cost+'pt'}</button></div>`;
      }).join('')}</div></div>`;
    }
    el.innerHTML=html;
  }
  window.renderGrowth=function(){baseRenderGrowth();renderPlayerSkills();const label=document.querySelector('.level-line b');if(label)label.innerHTML=`プレイヤーレベル <span id="level">${s.level}</span>`;};
  window.buyWoodSkill=function(id){const sk=advancedPlayerSkills.find(x=>x.id===id);if(!sk)return;const lv=Number(s.woodcutterSkills[id]||0);if(lv>=sk.max||s.skillPoints<sk.cost)return;s.skillPoints-=sk.cost;s.woodcutterSkills[id]=lv+1;toast(`${sk.name} Lv.${lv+1}！`);renderAll();save()};

  // ---- Three-tier mountain star tree. Old four IDs remain beginner skills. ----
  const starTiers = [
    {title:'初級',subtitle:'既存スキル',kind:'beginner',skills:[
      {id:'star_power',name:'星の腕力',desc:'基本ダメージ +12% / Lv',cost:1,max:10},
      {id:'star_sale',name:'星の商才',desc:'売却価格 +10% / Lv',cost:1,max:10},
      {id:'star_auto',name:'星の鼓動',desc:'自動作業速度 +15% / Lv',cost:1,max:10},
      {id:'star_crit',name:'星の導き',desc:'クリティカル率 +1.5% / Lv',cost:2,max:10}
    ]},
    {title:'中級',subtitle:'各スキル30個以上の星から',kind:'intermediate',skills:[
      {id:'mid_star_crit_damage',name:'星砕きの一撃',desc:'クリティカルダメージ +0.25倍 / Lv',cost:30,max:5},
      {id:'mid_star_xp',name:'星の知恵',desc:'獲得経験値 +10% / Lv',cost:35,max:5},
      {id:'mid_star_wood',name:'星の豊穣',desc:'追加木材の獲得率 +5% / Lv',cost:40,max:5}
    ]},
    {title:'上級',subtitle:'各スキル200個以上の星から',kind:'advanced',skills:[
      {id:'high_star_crit_damage',name:'天星の必殺',desc:'クリティカルダメージ +0.5倍 / Lv',cost:200,max:5},
      {id:'high_star_power',name:'星界の剛力',desc:'基本ダメージ +8% / Lv',cost:220,max:5},
      {id:'high_star_sale',name:'天界の商才',desc:'売却倍率 +8% / Lv',cost:220,max:5}
    ]}
  ];
  const starLevel=id=>Number(s.starSkills[id]||0);
  window.renderStarTree=function(){
    const el=$('starSkillGrid');if(!el)return;
    el.innerHTML=starTiers.map(tier=>`<div class="star-tier"><div class="star-tier-title">${tier.kind==='beginner'?'⭐':tier.kind==='intermediate'?'🌟':'💫'} ${tier.title} <small>${tier.subtitle}</small></div>${tier.skills.map(sk=>{
      const lv=starLevel(sk.id),cost=Math.ceil(sk.cost*Math.pow(1.35,lv));
      return `<div class="star-skill-card"><div class="star-glyph ${tier.kind}">${tier.kind==='beginner'?'⭐':tier.kind==='intermediate'?'🌟':'💫'}</div><div class="upgrade-copy"><b>${sk.name} Lv.${lv}/${sk.max}</b><p>${sk.desc}</p><small>次の強化：${cost} 山の星</small></div><button ${lv>=sk.max||s.stars<cost?'disabled':''} onclick="buyTierStar('${sk.id}')">${lv>=sk.max?'MAX':cost+' 星'}</button></div>`;
    }).join('')}</div>`).join('');
  };
  window.buyTierStar=function(id){const sk=starTiers.flatMap(t=>t.skills).find(x=>x.id===id);if(!sk)return;const lv=starLevel(id),cost=Math.ceil(sk.cost*Math.pow(1.35,lv));if(lv>=sk.max||s.stars<cost)return;s.stars-=cost;s.starSkills[id]=lv+1;toast(`${sk.name}を強化！`);renderAll();save()};
  window.critDamageMultiplier=()=>2+(s.up.critPower||0)*.12+starLevel('mid_star_crit_damage')*.25+starLevel('high_star_crit_damage')*.5+(s.woodcutterSkills.high_crit||0)*.15+(s.weather===9?.5:0);

  // ---- Permanent firepit multipliers and temporary fuel buffs. ----
  const fireLevel=()=>Math.max(1,Number(s.fireLevel||1));
  const firePermanent=()=>1+(fireLevel()-1)*.05;
  const fireActive=()=>Number(s.fireBuffUntil||0)>now();
  const fireTemporary=()=>fireActive()?1.2:1;
  const oldDamageV2=window.damage||damage;
  const oldSaleV2=window.saleMult||saleMult;
  const oldAutoV2=window.autoDps||autoDps;
  const oldCritV2=window.critChance||critChance;
  window.damage=()=>Math.max(1,Math.floor(oldDamageV2()*firePermanent()*fireTemporary()*(1+(s.woodcutterSkills.mid_power||0)*.05)*(s.weather===5?.9:s.weather===8?1.2:1)*(1+(s.starSkills.high_star_power||0)*.08)));
  window.saleMult=()=>oldSaleV2()*firePermanent()*fireTemporary()*(1+(s.woodcutterSkills.mid_sale||0)*.05)*(1+(s.starSkills.high_star_sale||0)*.08)*(s.weather===6?.9:s.weather===8?1.12:1);
  window.autoDps=()=>s.autoMachine?Math.max(0.2,oldAutoV2())*firePermanent()*fireTemporary()*(1+(s.woodcutterSkills.high_auto||0)*.1)*(s.weather===7?.9:1):0;
  window.critChance=()=>Math.min(85,oldCritV2()+(s.weather===9?5:0));
  const oldGainXpV4=window.gainXp||gainXp;
  window.gainXp=function(n){const mult=(1+(s.woodcutterSkills.mid_xp||0)*.05)*(1+(s.starSkills.mid_star_xp||0)*.1);return oldGainXpV4(Math.floor(n*mult))};

  function renderFirepit(){
    const el=$('firepitPanel');if(!el)return;
    // Preserve the user's in-progress input while the one-second tick refreshes this panel.
    const previousAmount=$('firewoodAmount')?.value;
    const level=fireLevel(),remaining=Math.max(0,Math.ceil((s.fireBuffUntil-now())/1000));
    const needed=2+level;
    const art=level>=7?'🔥🔥🔥':level>=4?'🔥🔥':'🔥';
    const title=level>=7?'豪華なキャンピングファイヤー':level>=4?'大きなキャンプファイヤー':'小さな焚き火';
    el.innerHTML=`<div class="firepit-card"><div class="firepit-art level-${Math.min(10,level)}"><div class="firepit-sparks">${level>=7?'✨ ✨ ✨':'✦　✦'}</div><div class="firepit-flame">${art}</div><div class="firepit-logs">🪵🪵🪵</div></div><div class="firepit-level"><div><small>焚き火レベル</small><strong>Lv.${level}</strong><div>${title}</div></div><div><small>次のレベルまで</small><strong>${needed} 枚の木の板</strong><small>所持：${fmt(s.planks)} 枚</small></div></div><div class="firepit-stats"><div><small>攻撃力の基本倍率</small><b>×${firePermanent().toFixed(2)}</b></div><div><small>売却の基本倍率</small><b>×${firePermanent().toFixed(2)}</b></div><div><small>自動速度の基本倍率</small><b>×${firePermanent().toFixed(2)}</b></div></div><button class="primary" onclick="levelUpFirepit()" ${s.planks<needed?'disabled':''}>木の板 ${needed}枚で焚き火をレベルアップ</button>${remaining>0?`<div class="firepit-buff">🔥 焚き火の加護 発動中：残り ${Math.floor(remaining/60)}分 ${remaining%60}秒<br>攻撃力・売却倍率・自動木こり速度がそれぞれ20%アップ！</div>`:'<div class="firepit-note">木材を納品すると、攻撃力・売却倍率・自動木こり速度が一定時間20%アップします。</div>'}</div><div class="craft-card"><h3>🪵 木材を納品して火を強くしよう</h3><p>木材の種類は問いません。納品数 × 20秒間、3つの効果が同時にアップします。</p><div class="firepit-controls"><label>納品する木材の数<input id="firewoodAmount" type="number" min="1" max="999999" value="${Math.min(10,Math.max(1,s.wood))}"></label><button class="primary" onclick="donateFirewood()" ${s.wood<1?'disabled':''}>木材を納品</button></div><div class="firepit-note">所持木材：${fmt(s.wood)} 個 ／ 納品後の効果時間は既存の残り時間に加算されます。</div></div>`;
    if(previousAmount!==undefined){const input=$('firewoodAmount');if(input)input.value=previousAmount;}
  }
  window.donateFirewood=function(){const input=$('firewoodAmount');let amount=Math.min(s.wood,Math.max(1,Math.floor(Number(input?.value||0))));if(amount<=0){toast('納品できる木材がありません');return;}let left=amount;for(let i=0;i<s.woodBy.length&&left>0;i++){const take=Math.min(left,Number(s.woodBy[i]||0));s.woodBy[i]-=take;left-=take;}s.wood-=amount;s.fireBuffUntil=Math.max(now(),Number(s.fireBuffUntil||0))+amount*20000;toast(`木材${amount}個を納品！ ${amount*20}秒間、焚き火の加護が続くよ！`);renderAll();save()};
  window.levelUpFirepit=function(){const need=2+fireLevel();if(s.planks<need)return;s.planks-=need;s.fireLevel++;toast(`焚き火がレベル${s.fireLevel}に成長！`);checkV4Achievements();renderAll();save()};

  // ---- Woodworking: 3 logs -> 1 plank, queued batch timer, independent G skip. ----
  function craftSecondsPerPlank(){return Math.max(12,60*(1-Math.min(.75,(s.craftSpeedLevel||0)*.05)))}
  function finishCrafting(silent=false){if(!s.craftJob||s.craftJob.finishAt>now())return false;const job=s.craftJob;s.planks+=job.quantity;s.totalPlanksMade+=job.quantity;s.craftJobsCompleted=(s.craftJobsCompleted||0)+1;s.craftJob=null;if(!silent)toast(`木材加工完了！ 木の板 ${fmt(job.quantity)}枚を獲得！`);checkV4Achievements();renderAll();save();return true}
  window.startCrafting=function(){if(s.craftJob){toast('現在の加工が終わるまで待ってね');return;}const qty=Math.max(1,Math.min(500,Math.floor(Number($('craftAmount')?.value||1))));const need=qty*3;if(s.wood<need){toast(`木材が足りない！ ${fmt(need)}個必要だよ`);return;}let left=need;for(let i=0;i<s.woodBy.length&&left>0;i++){const take=Math.min(left,Number(s.woodBy[i]||0));s.woodBy[i]-=take;left-=take;}s.wood-=need;const seconds=Math.max(5,Math.ceil(qty*60*(1-Math.min(.75,s.craftSpeedLevel*.05))));s.craftJob={quantity:qty,startedAt:now(),finishAt:now()+seconds*1000,totalSeconds:seconds};toast(`木材加工を開始！ ${fmt(qty)}枚を加工するよ`);renderAll();save()};
  window.speedCrafting=function(){if(!s.craftJob)return;const remaining=s.craftJob.finishAt-now();if(remaining<=0){finishCrafting();return;}const cost=100;if(s.money<cost){toast('時間短縮には100G必要だよ');return;}s.money-=cost;s.craftJob.finishAt=Math.max(now(),s.craftJob.finishAt-60000);toast('Gを使って加工時間を1分短縮！');if(s.craftJob.finishAt<=now())finishCrafting();else{renderAll();save()}};
  window.buyCraftSpeed=function(){const lv=Number(s.craftSpeedLevel||0),cost=Math.floor(500*Math.pow(1.8,lv));if(lv>=15||s.money<cost)return;s.money-=cost;s.craftSpeedLevel=lv+1;toast(`加工時間短縮 Lv.${s.craftSpeedLevel}！開始時の時間が5%短くなったよ`);renderAll();save()};
  function renderCrafting(){const el=$('craftingPanel');if(!el)return;const previousAmount=$('craftAmount')?.value;const job=s.craftJob,remaining=job?Math.max(0,Math.ceil((job.finishAt-now())/1000)):0;const pct=job?Math.max(0,Math.min(100,(1-remaining/Math.max(1,job.totalSeconds))*100)):0;const upgradeCost=Math.floor(500*Math.pow(1.8,s.craftSpeedLevel||0));
    el.innerHTML=`<div class="craft-card"><h3>🪚 木の板を作ろう</h3><p>木材を加工して、焚き火のレベルアップに使う木の板を作れます。</p><div class="craft-recipe"><div class="recipe-item"><span class="recipe-icon">🪵</span>木材 ×3</div><div style="font-size:24px">➜</div><div class="recipe-item"><span class="recipe-icon">🪚</span>木の板 ×1</div></div><div class="craft-stats"><div><small>所持木材</small><b>${fmt(s.wood)} 個</b></div><div><small>所持木の板</small><b>${fmt(s.planks)} 枚</b></div><div><small>1枚あたりの加工時間</small><b>${Math.ceil(craftSecondsPerPlank())}秒</b></div></div><div class="craft-controls"><label>加工する枚数<input id="craftAmount" type="number" min="1" max="500" value="1" ${job?'disabled':''}></label><button class="primary" onclick="startCrafting()" ${job?'disabled':''}>まとめて加工開始</button></div>${job?`<div class="craft-job"><b>加工中：木の板 ${fmt(job.quantity)}枚</b><div class="craft-progress"><i style="width:${pct}%"></i></div><div>残り時間：<b>${Math.floor(remaining/60)}分 ${remaining%60}秒</b></div><button class="secondary" onclick="speedCrafting()">Gで1分短縮（100G）</button></div>`:'<div class="craft-note">加工は一度にまとめて開始できます。加工中は次の加工を開始できません。</div>'}</div><div class="craft-card"><h3>⚙️ 加工設備の強化</h3><p>強化すると、加工開始時点の基本所要時間が短くなります。加工中にGで短縮する機能とは別です。</p><div class="craft-stats"><div><small>強化レベル</small><b>Lv.${s.craftSpeedLevel}/15</b></div><div><small>基本時間短縮</small><b>${Math.min(75,s.craftSpeedLevel*5)}%</b></div><div><small>次の強化費用</small><b>${s.craftSpeedLevel>=15?'MAX':fmt(upgradeCost)+' G'}</b></div></div><button class="primary" onclick="buyCraftSpeed()" ${s.craftSpeedLevel>=15||s.money<upgradeCost?'disabled':''}>加工設備を強化</button></div>`;
    if(previousAmount!==undefined&&!job){const input=$('craftAmount');if(input)input.value=previousAmount;}
  }

  // ---- Automatic lumberjack machine: 750G gate. ----
  window.buyAutoMachine=function(){if(s.autoMachine||s.money<750)return;s.money-=750;s.autoMachine=true;toast('自動木こり機を購入！自動作業が始まり、振りの速さも強化できるよ！');renderAll();save()};
  const baseRenderCabinV2=window.renderCabin||renderCabin;
  window.renderCabin=function(){baseRenderCabinV2();const el=$('cabinGrid');if(!el)return;const card=document.createElement('div');card.className='upgrade-card';card.innerHTML=`<div class="upgrade-icon">⚙️</div><div class="upgrade-copy"><b>自動木こり機</b><p>自動で斧を振るための設備。購入後に「振りの速さ」を強化できます。</p><small>${s.autoMachine?'購入済み':'必要設備：750 G'}</small></div><button ${s.autoMachine||s.money<750?'disabled':''} onclick="buyAutoMachine()">${s.autoMachine?'設置済み':'購入 750G'}</button>`;el.prepend(card);};

  const baseBuyUpgradeV4=window.buyUpgrade||buyUpgrade;
  window.buyUpgrade=function(id,...args){if(id==='speed'&&!s.autoMachine){toast('先に山小屋で自動木こり機（750G）を購入してね！');return;}return baseBuyUpgradeV4(id,...args)};

  const baseRenderShopV4=window.renderShop||renderShop;
  window.renderShop=function(){baseRenderShopV4();const el=$('shopGrid');if(!el)return;const cost=Math.floor(500*Math.pow(1.8,s.craftSpeedLevel||0));const speedCard=[...el.children].find(c=>c.textContent.includes('振りの速さ'));if(speedCard){const speedButton=speedCard.querySelector('button');if(speedButton&&!s.autoMachine){speedButton.disabled=true;speedButton.textContent='設備が必要';}}el.insertAdjacentHTML('beforeend',`<div class="upgrade-card"><div class="upgrade-icon">🪚</div><div class="upgrade-copy"><b>木材加工設備</b><p>加工開始時の所要時間をレベルごとに5%短縮。</p><small>Lv.${s.craftSpeedLevel}/15　次 ${s.craftSpeedLevel>=15?'MAX':fmt(cost)+' G'}</small></div><button ${s.craftSpeedLevel>=15||s.money<cost?'disabled':''} onclick="buyCraftSpeed()">強化</button></div>`);};

  // ---- Achievements: discover actual unique woods, count lifetime stars, reward new milestones. ----
  const rewardByAchievement={logs10000:1000,logs50000:5000,player50:1500,player100:10000,allwoods:10000,axe10:15000,plank1:300,plank100:3000,fire5:2000,fire10:10000,craft10:1500,prestige5:5000,stars50:10000,millionaire:5000,allpets:5000,petlevel50:8000};
  function checkV4Achievements(){
    s.found=Math.max((s.discoveredWoodTypes||[]).filter(Boolean).length,Number(s.legacyFound||0));
    // The old achievements remain in the same array. Their base reward logic is preserved.
    const vals={logs10000:s.lifetimeLogs,logs50000:s.lifetimeLogs,player50:s.level,player100:s.level,allwoods:(s.discoveredWoodTypes||[]).filter(Boolean).length,axe10:s.axe,plank1:s.totalPlanksMade,plank100:s.totalPlanksMade,fire5:s.fireLevel,fire10:s.fireLevel,craft10:s.craftJobsCompleted||0,prestige5:s.prestiges,stars50:s.totalStarsEarned,millionaire:s.totalEarned,allpets:s.pets.length,petlevel50:s.pets.reduce((n,p)=>n+(p.level||1),0)};
    for(const a of newAchievements){if(s.achievements.includes(a[0])||Number(vals[a[0]]||0)<a[4])continue;s.achievements.push(a[0]);const reward=rewardByAchievement[a[0]]||500;s.money+=reward;s.totalEarned=(s.totalEarned||0)+reward;toast(`実績解除：${a[1]}！ +${fmt(reward)}G`);}
    if(s.totalStarsEarned>=5&&!s.achievements.includes('starcollector')){s.achievements.push('starcollector');s.money+=250;s.totalEarned=(s.totalEarned||0)+250;toast('実績解除：星の収集家！ +250G')}
    if(s.discoveredWoodTypes.filter(Boolean).length>=5&&!s.achievements.includes('woods')){s.achievements.push('woods');s.money+=100;s.totalEarned=(s.totalEarned||0)+100;toast('実績解除：森の研究者！ +100G')}
  }
  const baseCheckAchievementsV4=window.checkAchievements||checkAchievements;
  window.checkAchievements=function(){baseCheckAchievementsV4();checkV4Achievements()};
  const baseRenderQuestV4=window.renderQuest||renderQuest;
  window.renderQuest=function(){baseRenderQuestV4();checkV4Achievements();};

  // Mark actual discovery when a tree is selected, chopped, or found on an expedition.
  function markWood(i){if(i<0||i>=woods.length)return;s.discoveredWoodTypes[i]=true;s.found=Math.max(s.discoveredWoodTypes.filter(Boolean).length,Number(s.legacyFound||0));}
  const baseChopV4=window.chop||chop;
  window.chop=function(){const type=s.logType||0;markWood(type);const before=s.totalLogs;baseChopV4();if(s.totalLogs>before){s.lifetimeLogs=(s.lifetimeLogs||0)+(s.totalLogs-before);checkV4Achievements();}renderLiveProgressV4();};
  const baseSelectWoodV4=window.selectWood||selectWood;
  window.selectWood=function(i){baseSelectWoodV4(i);if(s.level>=woods[i].unlock){markWood(i);checkV4Achievements();save()}};
  // Correct the explorer reward pool: choose only currently unlocked woods, not a pseudo-count index.
  window.finishExplore=function(){
    if(!s.exploreEnd||now()<s.exploreEnd)return;
    const before=s.woodBy.slice();
    const coins=Math.floor((30+s.level*8+(s.up.luck||0)*12)*(1+s.stars*.05)*(s.weather===3?1.3:1)*(s.skills.includes('scout')?1.2:1));
    const roll=Math.random();let reward=`${coins} G`;s.money+=coins;s.totalEarned=(s.totalEarned||0)+coins;s.explores++;const fox=s.pets.find(p=>p.id===1);if(fox){const extra=Math.floor(coins*.10*(fox.level||1));s.money+=extra;s.totalEarned=(s.totalEarned||0)+extra;reward+=`、森ギツネの追加報酬 ${fmt(extra)}G`;}
    const eligible=woods.map((w,i)=>s.level>=w.unlock?i:-1).filter(i=>i>=0);
    if(roll<.28&&eligible.length){const idx=eligible[Math.floor(Math.random()*eligible.length)];s.wood++;s.woodBy[idx]++;markWood(idx);reward+=`、${woods[idx].name}を発見！`;}
    if(roll>.88){s.skillPoints++;reward+='、スキルポイント +1';}
    s.exploreEnd=0;s.exploreStart=0;s.dailyProgress=(s.dailyProgress||0)+2;toast('探索完了！ '+reward);checkV4Achievements();renderAll();save();
  };

  // ---- Prestige: player level 30, preserve legacy star formula and lifetime star count. ----
  window.prestige=function(){
    if(s.level<30)return;
    const runLogs=Number(s.runLogs||s.totalLogs||0);
    const reward=Math.max(Number(s.bestPrestigeReward||1),1+Math.floor((s.level-30)/10)+Math.floor(runLogs/1000));
    if(!confirm(`プレイヤーレベル${s.level}で転生しますか？\n山の星 ${reward} 個を獲得します。\n所持金・レベル・通常強化・木材・焚き火・加工設備はリセットされます。`))return;
    const stars=Number(s.stars||0)+reward,prestiges=Number(s.prestiges||0)+1,totalStarsEarned=Number(s.totalStarsEarned||0)+reward;
    const keep={stars,prestiges,totalStarsEarned,achievements:s.achievements.slice(),discoveredWoodTypes:s.discoveredWoodTypes.slice(),found:s.found,legacyFound:s.legacyFound||0,starSkills:{...s.starSkills},bestPrestigeReward:reward,milestones:s.milestones||[],totalEarned:s.totalEarned||0,lifetimeLogs:s.lifetimeLogs||s.totalLogs||0,totalPlanksMade:s.totalPlanksMade||0,craftJobsCompleted:s.craftJobsCompleted||0};
    s=defaults();Object.assign(s,keep);s.logHp=woods[0].hp;s.lastSeen=now();s.version=4;ensureV4();checkV4Achievements();toast(`転生成功！ 山の星 ${reward} 個を獲得！`);renderAll();save();
  };

  // ---- Random weather cycle: debuffs are common-ish; ultra-rare climates are very rare. ----
  window.changeWeather=function(){
    const r=Math.random();
    if(r<.012)s.weather=8+Math.floor(Math.random()*2);
    else if(r<.27)s.weather=5+Math.floor(Math.random()*3);
    else s.weather=Math.floor(Math.random()*5);
    renderScene();renderForest();save();
    if(s.weather>=8)toast(`✨ 超レア気候「${weatherList[s.weather][1]}」が発生！`);
    else if(s.weather>=5)toast(`🌨️ 気候変化：${weatherList[s.weather][1]}（少し不利な効果）`);
  };

  // ---- Ranking panel is backed by cloud.js; it remains browsable while logged out. ----
  function refreshRanking(){if(window.WoodcutterCloud?.loadLeaderboard)window.WoodcutterCloud.loadLeaderboard($('rankingMetric')?.value||'total_logs');}

  // Save is always local immediately; cloud.js attaches its queued sync wrapper after this file.
  const originalSaveV4=window.save||save;
  window.save=function(...args){s.version=4;return originalSaveV4.apply(this,args)};
  const originalApplyCloudV4=window.applyCloudSave;
  window.applyCloudSave=function(data){originalApplyCloudV4(data);ensureV4();renderAll();save();};
  const originalSwitchTabV4=window.switchTab||switchTab;
  window.switchTab=function(tab){originalSwitchTabV4(tab);save();if(tab==='firepit')renderFirepit();if(tab==='crafting')renderCrafting();if(tab==='ranking')refreshRanking();if(tab==='growth'){renderGrowth();renderLiveProgressV4();}if(tab==='forest'){renderForest();renderLiveProgressV4();}};

  const oldRenderAllV4=window.renderAll||renderAll;
  window.renderAll=function(){oldRenderAllV4();renderFirepit();renderCrafting();if(document.getElementById('rankingList')){} };
  const oldRenderTopV4=window.renderTop||renderTop;
  window.renderTop=function(){oldRenderTopV4();const totalLogsEl=$('totalLogs');if(totalLogsEl)totalLogsEl.textContent=fmt(s.lifetimeLogs||s.totalLogs);const levelLine=document.querySelector('.level-line b');if(levelLine)levelLine.innerHTML=`プレイヤーレベル <span id="level">${s.level}</span>`;};
  const oldRenderSceneV4=window.renderScene||renderScene;
  window.renderScene=function(){oldRenderSceneV4();const scene=document.querySelector('.scene');if(scene){scene.classList.remove('weather-snow','weather-blizzard','weather-sun','weather-wind','weather-aurora','weather-freeze','weather-fog','weather-gale','weather-crystal','weather-starfall');scene.classList.add(['weather-snow','weather-blizzard','weather-sun','weather-wind','weather-aurora','weather-freeze','weather-fog','weather-gale','weather-crystal','weather-starfall'][s.weather]||'weather-snow');}const line=$('weatherLine');if(line)line.textContent=weatherList[s.weather][2];};

  // Render weather effects in the forest tab.
  const oldRenderForestV4=window.renderForest||renderForest;
  window.renderForest=function(){oldRenderForestV4();const detail=$('weatherDetail');if(detail){const [icon,name,desc]=weatherList[s.weather];detail.innerHTML=`<b>${icon} ${name}</b><p>${desc} 天気は約90秒ごとに変化します。</p>`;}};

  // Input spam protection: only one Space/Enter chop per physical key press; ignore key-repeat.
  let lastKeyboardChop=0;
  window.addEventListener('keydown',e=>{
    if(e.code!=='Space'&&e.code!=='Enter')return;
    const target=e.target;
    const editing=target&&(target.matches('input,textarea,select,[contenteditable="true"]'));
    const focusedButton=target&&target.closest('button');
    if(editing)return;
    if(e.code==='Enter'&&focusedButton&&focusedButton.id!=='chopBtn')return;
    if(e.code==='Space'&&focusedButton&&focusedButton.id!=='chopBtn')return;
    e.preventDefault();
    if(e.repeat)return;
    const t=now();if(t-lastKeyboardChop<120)return;lastKeyboardChop=t;
    window.chop();
  },true);
  const chopBtn=$('chopBtn');if(chopBtn){chopBtn.addEventListener('click',e=>{if(e.detail===0&&now()-lastKeyboardChop<150)e.stopImmediatePropagation()},true)}

  // Live-only progress rendering. These DOM updates never change game state or save data.
  // The main tick runs once per second, so both bars stay current without rebuilding whole tabs.
  function renderLiveProgressV4(){
    const currentXp=Math.max(0,Number(s.xp)||0);
    const requiredXp=Math.max(1,Number(xpNeed())||1);
    const xpPercent=Math.max(0,Math.min(100,(currentXp/requiredXp)*100));
    const xpBar=$('xpBar');
    if(xpBar)xpBar.style.width=xpPercent.toFixed(2)+'%';
    const xpText=$('xpText');
    if(xpText)xpText.textContent=`経験値 ${fmt(currentXp)} / ${fmt(requiredXp)}`;
    const level=$('level');
    if(level)level.textContent=String(s.level);
    const points=$('skillPoints');
    if(points)points.textContent=`スキルポイント ${fmt(s.skillPoints)}`;
    const topXp=$('xp');
    if(topXp)topXp.textContent=`${fmt(currentXp)} / ${fmt(requiredXp)}`;

    const start=Number(s.exploreStart)||0;
    const end=Number(s.exploreEnd)||0;
    const current=now();
    const exploreBar=$('exploreBar');
    const exploreStatus=$('exploreStatus');
    const exploreButton=$('exploreBtn');
    if(end>start){
      const ratio=Math.max(0,Math.min(1,(current-start)/(end-start)));
      if(exploreBar)exploreBar.style.width=(ratio*100).toFixed(2)+'%';
      if(exploreStatus)exploreStatus.textContent=current<end?`探索中… 残り ${Math.ceil((end-current)/1000)}秒`:'探索完了！';
      if(exploreButton){exploreButton.disabled=true;exploreButton.textContent=current<end?'探索中…':'探索完了処理中…';}
    }else{
      if(exploreBar)exploreBar.style.width='0%';
      if(exploreStatus)exploreStatus.textContent='準備完了';
      if(exploreButton){exploreButton.disabled=false;exploreButton.textContent='探索に出発';}
    }
  }

  // The ordinary game tick handles general UI/game state only. Automatic
  // chopping has its own clock below, so it cannot be skipped when another
  // script replaces window.tick or accidentally run twice from nested timers.
  window.tick=function(){
    if(s.exploreEnd && Date.now()>=s.exploreEnd){
      const finish=window.finishExplore||finishExplore;
      if(typeof finish==='function') finish();
    }
    renderTop();
    save();
  };

  // v4 timed jobs and the automatic lumberjack each use this single clock.
  function runV4Timers(){
    const current=now();
    if(s.autoMachine){
      let rate=0;
      try { rate=Number(window.autoDps ? window.autoDps() : 0); } catch(e) { rate=0; }
      if(!Number.isFinite(rate) || rate<0) rate=0;
      // The purchased machine always has a minimum base speed of 0.2 logs/sec.
      rate=Math.max(0.2,rate);
      s.autoProgress=Math.max(0,Number(s.autoProgress||0))+rate;
      const count=Math.min(100,Math.floor(s.autoProgress));
      if(count>0){
        s.autoProgress-=count;
        for(let i=0;i<count;i++){
          // Keep the standard reward/quest/achievement path, but bypass the
          // manual click cooldown. The v2 wrapper also updates runLogs.
          s.lastChop=Date.now()-76;
          const doChop=window.chop||chop;
          if(typeof doChop==='function') doChop();
        }
        save();
      }
    }
    if(s.craftJob && Number(s.craftJob.finishAt||0)<=current) finishCrafting();
    if(document.getElementById('page-crafting')?.classList.contains('active')) renderCrafting();
    if(document.getElementById('page-firepit')?.classList.contains('active')) renderFirepit();
    if(s.fireBuffUntil && Number(s.fireBuffUntil)<=current && s.fireBuffExpiredNotice!==true){
      s.fireBuffExpiredNotice=true;
      toast('焚き火の加護が終了しました。');
      save();
    }
    if(Number(s.fireBuffUntil||0)>current) s.fireBuffExpiredNotice=false;
    renderLiveProgressV4();
  }
  // A dedicated one-second clock also protects against later modules replacing
  // window.tick. Clear an older copy if the script is re-initialized.
  if(window.__woodcutterV4Timer) clearInterval(window.__woodcutterV4Timer);
  window.__woodcutterV4Timer=setInterval(runV4Timers,1000);

  // Initialize migration and apply offline progress after v2's save migration.
  ensureV4();
  processOfflineProgress();
  if (window.checkAchievements) window.checkAchievements(); else checkV4Achievements();
  renderAll();
  renderLiveProgressV4();
  save();
})();

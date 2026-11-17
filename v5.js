/* Snow Mountain Woodcutter v5.0 - World Expansion
   Additive systems only. Existing save fields and cloud account schema are preserved. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const fmt = n => Math.floor(Number(n || 0)).toLocaleString('ja-JP');
  const num = (n, d=0) => Number.isFinite(Number(n)) ? Number(n) : d;
  const notify = msg => { if (typeof window.toast === 'function') window.toast(msg); else if (typeof toast === 'function') toast(msg); };
  const persist = () => { if (typeof window.save === 'function') window.save(); else if (typeof save === 'function') save(); };
  const safe = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ensure = () => {
    s.v5 = s.v5 && typeof s.v5 === 'object' ? s.v5 : {};
    const d = s.v5;
    d.summitPoints = Math.max(0,num(d.summitPoints));
    d.summitCount = Math.max(0,num(d.summitCount));
    d.unlockedRegions = Array.isArray(d.unlockedRegions) ? d.unlockedRegions : ['snowfield'];
    d.discoveries = d.discoveries && typeof d.discoveries === 'object' ? d.discoveries : {};
    d.fish = d.fish && typeof d.fish === 'object' ? d.fish : {};
    d.research = d.research && typeof d.research === 'object' ? d.research : {};
    d.villageLevel = Math.max(1,num(d.villageLevel,1));
    d.houseLevel = Math.max(1,num(d.houseLevel,1));
    d.factoryLevel = Math.max(0,num(d.factoryLevel));
    d.legendAxeLevel = Math.max(0,num(d.legendAxeLevel));
    d.factoryPlanks = Math.max(0,num(d.factoryPlanks));
    d.researchPoints = Math.max(0,num(d.researchPoints));
    d.bossWins = Math.max(0,num(d.bossWins));
    d.treasureFinds = Math.max(0,num(d.treasureFinds));
    d.lastFish = num(d.lastFish);
    d.lastTreasure = num(d.lastTreasure);
    d.missionDay = d.missionDay || '';
    d.missionWeek = d.missionWeek || '';
    d.missionClaims = d.missionClaims && typeof d.missionClaims === 'object' ? d.missionClaims : {};
    d.missionProgress = d.missionProgress && typeof d.missionProgress === 'object' ? d.missionProgress : {};
    d.missionBase = d.missionBase && typeof d.missionBase === 'object' ? d.missionBase : {};
    d.event = d.event && typeof d.event === 'object' ? d.event : {id:'quiet',until:0};
    d.lastEventRoll = num(d.lastEventRoll);
    d.totalFish = Math.max(0,num(d.totalFish));
    d.totalResearch = Math.max(0,num(d.totalResearch));
    d.totalExpeditions = Math.max(0,num(d.totalExpeditions));
    d.lastDailyReset = d.lastDailyReset || '';
    s.v5 = d;
  };
  ensure();

  const regions = [
    {id:'snowfield',name:'雪山奥地',icon:'🏔️',points:0,desc:'新しい木材と鉱石が見つかる雪深い森。'},
    {id:'glacier',name:'氷河地帯',icon:'🧊',points:1,desc:'氷晶鉱石と氷河魚が眠る極寒の地。'},
    {id:'permafrost',name:'永久凍土洞窟',icon:'💎',points:3,desc:'古代の化石と希少鉱石が眠る洞窟。'},
    {id:'ancient',name:'古代樹の森',icon:'🌳',points:5,desc:'伝説の木材と守護者が存在する森。'},
    {id:'sky',name:'天空の雪原',icon:'🌌',points:10,desc:'頂上の力でのみ到達できる天空の大地。'}
  ];
  const fishTypes = [
    {id:'ice_trout',name:'氷結マス',icon:'🐟',chance:48,value:120},
    {id:'snow_carp',name:'雪鯉',icon:'🐠',chance:28,value:420},
    {id:'crystal_fish',name:'水晶魚',icon:'🐡',chance:16,value:1800},
    {id:'aurora_salmon',name:'オーロラサーモン',icon:'🌈',chance:7,value:12000},
    {id:'myth_fish',name:'幻氷魚',icon:'✨',chance:1,value:100000}
  ];
  const researches = [
    {id:'sharp',name:'刃の研究',desc:'丸太へのダメージを恒久的に強化',cost:1,max:20,icon:'🪓'},
    {id:'logistics',name:'物流研究',desc:'木材・工場の生産効率を強化',cost:2,max:20,icon:'🚚'},
    {id:'fortune',name:'幸運研究',desc:'探索・釣りの希少発見率を強化',cost:2,max:15,icon:'🍀'},
    {id:'automation',name:'自動化研究',desc:'工場の生産量を強化',cost:3,max:15,icon:'⚙️'}
  ];
  const missions = [
    {id:'chop',name:'今日の薪割り',desc:'丸太を100本割る',goal:100,reward:25000,kind:'logs'},
    {id:'explore',name:'雪山調査',desc:'探索を1回完了する',goal:1,reward:50000,kind:'explore'},
    {id:'fish',name:'氷上の釣り人',desc:'魚を3匹釣る',goal:3,reward:30000,kind:'fish'},
    {id:'weekly',name:'週刊・雪山開拓',desc:'ボスを3体討伐する',goal:3,reward:250000,kind:'boss',weekly:true}
  ];
  const d = () => s.v5;
  const moneyCost = (base,lv,pow=1.7) => Math.floor(base*Math.pow(pow,lv));
  const hasRegion = id => d().unlockedRegions.includes(id);
  const discover = id => { d().discoveries[id]=true; };
  const countDiscoveries = () => Object.keys(d().discoveries).filter(k=>d().discoveries[k]).length;
  const updateMissionProgress = () => {
    const base=d().missionBase||{};
    d().missionProgress.logs = Math.max(0,num(s.lifetimeLogs||s.totalLogs)-num(base.logs));
    d().missionProgress.explore = Math.max(0,num(s.explores)-num(base.explore));
    d().missionProgress.fish = Math.max(0,d().totalFish-num(base.fish));
    d().missionProgress.boss = Math.max(0,d().bossWins-num(base.boss));
  };
  const resetMissionPeriods = () => {
    const day = new Date().toDateString();
    const date = new Date();
    const week = `${date.getFullYear()}-${Math.floor((Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())-Date.UTC(date.getFullYear(),0,1))/604800000)}`;
    if(d().missionDay!==day){
      d().missionDay=day; for(const m of missions.filter(x=>!x.weekly)) delete d().missionClaims[m.id];
      d().missionBase={...d().missionBase,logs:num(s.lifetimeLogs||s.totalLogs),explore:num(s.explores),fish:d().totalFish};
    }
    if(d().missionWeek!==week){
      d().missionWeek=week; delete d().missionClaims.weekly;
      d().missionBase={...d().missionBase,boss:num(d().bossWins)};
    }
  };
  const card = (icon,title,desc,meta,button,disabled=false) => `<article class="v5-card"><div class="v5-icon">${icon}</div><div class="v5-copy"><b>${title}</b><p>${desc}</p><small>${meta||''}</small></div>${button||''}</article>`;
  const button = (label,action,disabled=false,cls='primary') => `<button class="${cls}" data-v5="${action}" ${disabled?'disabled':''}>${label}</button>`;

  function renderSummit(){
    const ready = num(s.money)>=1e15 && num(s.wood)>=10000 && num(s.planks)>=100 && num(s.level)>=5000;
    return `<div class="v5-feature summit-feature"><div class="v5-feature-art">🏔️✨</div><div class="v5-feature-body"><span class="eyebrow">THE ULTIMATE PEAK</span><h3>頂上への挑戦</h3><p>雪山のすべてを極めた者だけが到達できる究極の境地。達成すると頂上ポイントを1獲得し、通常の転生と同じリセットが行われます。</p><div class="v5-requirements"><span class="${s.money>=1e15?'met':''}">💰 1,000兆 G：${fmt(s.money)} / 1,000兆</span><span class="${s.wood>=10000?'met':''}">🪵 丸太 10,000：${fmt(s.wood)}</span><span class="${s.planks>=100?'met':''}">🪚 木材 100：${fmt(s.planks)}</span><span class="${s.level>=5000?'met':''}">🌟 レベル 5,000：${fmt(s.level)}</span></div><div class="v5-summit-total">頂上ポイント <b>${fmt(d().summitPoints)}</b>　｜　達成回数 <b>${fmt(d().summitCount)}</b></div>${button('頂上を達成する','summit',!ready,'danger')}</div></div>`;
  }
  function renderRegions(){
    return `<div class="v5-grid">${regions.map(r=>{
      const unlocked=hasRegion(r.id),need=r.points;
      return `<article class="v5-card region-card"><div class="v5-icon">${r.icon}</div><div class="v5-copy"><b>${r.name}</b><p>${r.desc}</p><small>${unlocked?'解放済み':`解放条件：頂上ポイント ${need}`}</small></div>${unlocked?button('エリア探索',`expedition:${r.id}`):button('解放',`region:${r.id}`,d().summitPoints<need)}</article>`;
    }).join('')}</div>`;
  }
  function renderForge(){
    const lv=d().legendAxeLevel, cost=3+lv*2;
    return `<div class="v5-feature"><div class="v5-feature-art">🪓✨</div><div class="v5-feature-body"><h3>伝説の斧・星霜の斧 Lv.${lv}</h3><p>研究ポイントを使って伝説の斧を鍛造。強化するほど木こりの攻撃力が恒久的に上昇します。</p><div class="v5-statline">伝説の斧ボーナス：攻撃力 +${lv*15}%　｜　次の鍛造：研究ポイント ${cost}</div>${button(lv>=30?'最大強化':`鍛造する（${cost}研究pt）`,'forge',lv>=30||d().researchPoints<cost)}</div></div>
    <div class="v5-grid">${card('🛡️','雪守の防具','探索やボス戦を助ける防具。',`ボス討伐 ${fmt(d().bossWins)} 回`,`<span class="v5-unlocked">${d().bossWins>=3?'製造可能':'討伐3回で解放'}</span>`)}${card('💍','星晶のお守り','希少素材の発見率を高める。','頂上ポイント 5 必要',`<span class="v5-unlocked">${d().summitPoints>=5?'製造可能':'未解放'}</span>`)}</div>`;
  }
  function renderFactory(){
    const cost=moneyCost(1e7,d().factoryLevel);
    const rate=(d().factoryLevel*(1+(num(d().research.automation)*.15))*(1+num(d().research.logistics)*.1));
    return `<div class="v5-feature"><div class="v5-feature-art">🏭</div><div class="v5-feature-body"><h3>木材工場 Lv.${d().factoryLevel}</h3><p>工場は時間経過で木材を自動生産します。生産物は受け取り時に加算されます。</p><div class="v5-statline">生産速度：${rate.toFixed(2)} 枚 / 分　｜　未受取：${fmt(d().factoryPlanks)} 枚</div>${button(`工場を強化（${fmt(cost)} G）`,'factory',s.money<cost)} ${button('生産物を受け取る','factory-collect',d().factoryPlanks<1,'secondary')}</div></div>`;
  }
  function renderVillage(){
    const vCost=moneyCost(5e5,d().villageLevel,2.1), hCost=moneyCost(2e5,d().houseLevel,2);
    return `<div class="v5-grid">${card('🏘️',`村レベル ${d().villageLevel}`,'施設や商店が増え、雪山の開拓が進む。',`次の改築：${fmt(vCost)} G`,button('村を発展','village',s.money<vCost))}${card('🏡',`自宅レベル ${d().houseLevel}`,'自分専用の家を大きくして家具や設備を置けるようにする。',`次の改築：${fmt(hCost)} G`,button('自宅を改築','house',s.money<hCost))}</div><div class="v5-house-decor"><h3>🏠 自宅のインテリア</h3><p>改築レベルに応じて飾りを解放。コインで好きな飾りを設置できます。</p><div class="v5-decor-grid">${[['🕯️','暖炉の灯り',10000],['🪴','雪山の観葉植物',50000],['🖼️','山の風景画',250000],['🛋️','ふかふかソファ',1000000],['🦌','古代鹿の剥製',10000000],['🌌','星空の天窓',100000000]].map((x,i)=>{const owned=!!d().discoveries['decor_'+i];return `<div>${x[0]}<b>${x[1]}</b>${button(owned?'設置済み':fmt(x[2])+' G',`decor:${i}`,owned||s.money<x[2],'secondary')}</div>`}).join('')}</div></div>`;
  }
  function renderFishing(){
    const cooldown=Math.max(0,Math.ceil((d().lastFish+12000-Date.now())/1000));
    return `<div class="v5-feature"><div class="v5-feature-art">🎣</div><div class="v5-feature-body"><h3>凍った湖で釣り</h3><p>12秒ごとに釣りができます。釣った魚は図鑑に登録され、売却価値もあります。</p><div class="v5-statline">釣った魚：${fmt(d().totalFish)} 匹</div>${button(cooldown?`次の釣りまで ${cooldown} 秒`:'釣りをする','fish',cooldown>0)} <div class="v5-collection">${fishTypes.map(f=>`<span>${f.icon} ${f.name}：${fmt(d().fish[f.id]||0)}</span>`).join('')}</div></div></div>`;
  }
  function renderResearch(){
    return `<div class="v5-research-head">🔬 研究ポイント：<b>${fmt(d().researchPoints)}</b>　｜　累計研究：${fmt(d().totalResearch)}</div><div class="v5-grid">${researches.map(r=>{const lv=num(d().research[r.id]),cost=r.cost*(lv+1);return card(r.icon,`${r.name} Lv.${lv}/${r.max}`,r.desc,`次の研究：${cost} pt`,button(lv>=r.max?'MAX':`${cost} ptで研究`,`research:${r.id}`,lv>=r.max||d().researchPoints<cost));}).join('')}</div>`;
  }
  function renderTreasure(){
    const cooldown=Math.max(0,Math.ceil((d().lastTreasure+60000-Date.now())/1000));
    return `<div class="v5-feature"><div class="v5-feature-art">🗺️</div><div class="v5-feature-body"><h3>遺跡と宝探し</h3><p>探索で手に入れた地図を頼りに、古代の宝箱を探します。発見するとコイン・研究ポイント・希少素材を獲得。</p><div class="v5-statline">発見した宝箱：${fmt(d().treasureFinds)} 個</div>${button(cooldown?`再探索まで ${cooldown} 秒`:'遺跡を調査する','treasure',cooldown>0||!hasRegion('glacier'))}<small>氷河地帯以上のエリア解放が必要です。</small></div></div>`;
  }
  function renderBoss(){
    const level=Math.max(1,d().bossWins);
    const boss=[{name:'氷牙の巨狼',hp:1000,need:0,reward:100000},{name:'氷晶ゴーレム',hp:100000,need:1,reward:5000000},{name:'古代樹の守護者',hp:1e8,need:5,reward:1e9},{name:'天空の氷竜',hp:1e12,need:10,reward:1e12}].filter(x=>d().summitPoints>=x.need).slice(-1)[0];
    const power=Math.max(1,num(window.damage?window.damage():s.damage,1)*(1+num(d().research.sharp)*.1));
    const hits=Math.ceil(boss.hp/power);
    return `<div class="v5-feature"><div class="v5-feature-art">🐉</div><div class="v5-feature-body"><h3>${boss.name}</h3><p>自動戦闘でボスに挑戦。装備・レベル・研究・ペットの成長が戦闘力に反映されます。</p><div class="v5-statline">推定戦闘力：${fmt(power)}　｜　推定攻撃回数：${fmt(hits)}</div><div class="v5-statline">討伐数：${fmt(d().bossWins)}　｜　報酬：${fmt(boss.reward)} G + 研究ポイント</div>${button('自動戦闘で挑戦','boss')}</div></div>`;
  }
  function renderMissions(){
    resetMissionPeriods(); updateMissionProgress();
    return `<div class="v5-grid">${missions.map(m=>{const claimed=!!d().missionClaims[m.id],progress=num(d().missionProgress[m.kind]),eligible=progress>=m.goal;return card(m.weekly?'📅':'📜',m.name,m.desc,`${Math.min(m.goal,progress)} / ${m.goal}　｜　報酬 ${fmt(m.reward)} G`,button(claimed?'受取済み':eligible?'報酬を受け取る':'進行中',`mission:${m.id}`,claimed||!eligible,'secondary'));}).join('')}</div>`;
  }
  function renderCollection(){
    const entries=[...regions.map(r=>({id:'region_'+r.id,name:r.name,icon:r.icon,kind:'探索エリア'})),...fishTypes.map(f=>({id:'fish_'+f.id,name:f.name,icon:f.icon,kind:'魚'})),...['古代の木片','氷晶鉱石','永久凍土の化石','星界の結晶','伝説の設計図'].map((n,i)=>({id:'material_'+i,name:n,icon:['🪵','💎','🦴','✨','📜'][i],kind:'希少素材'}))];
    return `<div class="v5-collection-summary">発見・収集：<b>${countDiscoveries()}</b> 種類</div><div class="v5-collection-grid">${entries.map(e=>{const found=!!d().discoveries[e.id]||(e.id.startsWith('region_')&&hasRegion(e.id.slice(7)))||(e.id.startsWith('fish_')&&num(d().fish[e.id.slice(5)])>0);return `<div class="${found?'found':''}"><span>${found?e.icon:'❔'}</span><b>${found?e.name:'？？？'}</b><small>${e.kind}</small></div>`}).join('')}</div>`;
  }
  function eventLabel(){
    const ev=d().event||{},left=Math.max(0,Math.ceil((num(ev.until)-Date.now())/1000));
    if(left<=0)return '❄️ 現在は静かな雪山。次の自然イベントを待とう。';
    const labels={aurora:'🌌 オーロラ祭：釣りと探索の希少発見率アップ！',meteor:'☄️ 流星群：宝探しの報酬アップ！',festival:'🎊 雪山祭り：工場の生産速度アップ！'};
    return `${labels[ev.id]||'✨ 特別な自然現象'}（残り ${Math.floor(left/60)}分 ${left%60}秒）`;
  }
  function renderWorld(){
    const el=$('worldExpansionPanel'); if(!el)return;
    updateMissionProgress();
    el.innerHTML = `<div class="v5-world-hero"><div><span class="eyebrow">WORLD EXPANSION · v5.0</span><h2>雪山世界の開拓</h2><p>採集・冒険・経営・研究を通じて、雪山の未知なる領域を切り開こう。</p></div><div class="v5-world-level">🏔️ 頂上ポイント <b>${fmt(d().summitPoints)}</b></div></div><div class="v5-event-banner" id="v5EventBanner">${eventLabel()}</div>
      <div class="v5-subnav"><button data-v5-tab="summit" class="active">🏔️ 頂上</button><button data-v5-tab="regions">🗺️ エリア</button><button data-v5-tab="village">🏘️ 村と自宅</button><button data-v5-tab="factory">🏭 工場</button><button data-v5-tab="forge">⚒️ 伝説装備</button><button data-v5-tab="research">🔬 研究</button><button data-v5-tab="fishing">🎣 釣り</button><button data-v5-tab="treasure">🗝️ 宝探し</button><button data-v5-tab="boss">🐉 ボス</button><button data-v5-tab="missions">📜 ミッション</button><button data-v5-tab="collection">📚 図鑑</button></div>
      <div id="v5-subpage-summit" class="v5-subpage active">${renderSummit()}</div>
      <div id="v5-subpage-regions" class="v5-subpage">${renderRegions()}</div>
      <div id="v5-subpage-village" class="v5-subpage">${renderVillage()}</div>
      <div id="v5-subpage-factory" class="v5-subpage">${renderFactory()}</div><div id="v5-subpage-forge" class="v5-subpage">${renderForge()}</div>
      <div id="v5-subpage-research" class="v5-subpage">${renderResearch()}</div>
      <div id="v5-subpage-fishing" class="v5-subpage">${renderFishing()}</div>
      <div id="v5-subpage-treasure" class="v5-subpage">${renderTreasure()}</div>
      <div id="v5-subpage-boss" class="v5-subpage">${renderBoss()}</div>
      <div id="v5-subpage-missions" class="v5-subpage">${renderMissions()}</div>
      <div id="v5-subpage-collection" class="v5-subpage">${renderCollection()}</div>`;
    const active = d().activePage || 'summit';
    document.querySelectorAll('.v5-subnav button').forEach(b=>b.classList.toggle('active',b.dataset.v5Tab===active));
    document.querySelectorAll('.v5-subpage').forEach(el=>el.classList.toggle('active',el.id==='v5-subpage-'+active));
  }
  function activateSub(tab){d().activePage=tab;renderWorld();}
  function addMoney(n){s.money=Math.max(0,num(s.money)+n);s.totalEarned=num(s.totalEarned)+n;}
  function rewardMaterial(id){discover('material_'+id);d().researchPoints+=1;}
  function runSummit(){
    const ready=num(s.money)>=1e15&&num(s.wood)>=10000&&num(s.planks)>=100&&num(s.level)>=5000;
    if(!ready){notify('頂上達成条件をすべて満たしていません。');return;}
    if(!confirm('頂上を達成しますか？\\n頂上ポイントを1獲得します。\\n通常の転生と同じく、レベル・所持金・丸太・木材・通常強化・ペット・焚き火・加工設備などがリセットされます。\\n山の星・山の星スキル・頂上ポイント・頂上記録・図鑑は維持されます。'))return;
    const keep={
      stars:num(s.stars),prestiges:num(s.prestiges),totalStarsEarned:num(s.totalStarsEarned),
      achievements:Array.isArray(s.achievements)?s.achievements.slice():[],discoveredWoodTypes:Array.isArray(s.discoveredWoodTypes)?s.discoveredWoodTypes.slice():[],
      found:num(s.found),legacyFound:num(s.legacyFound),starSkills:{...(s.starSkills||{})},bestPrestigeReward:num(s.bestPrestigeReward,1),
      milestones:Array.isArray(s.milestones)?s.milestones.slice():[],totalEarned:num(s.totalEarned),lifetimeLogs:num(s.lifetimeLogs||s.totalLogs),
      totalPlanksMade:num(s.totalPlanksMade),craftJobsCompleted:num(s.craftJobsCompleted),
      v5:{summitPoints:d().summitPoints+1,summitCount:d().summitCount+1,unlockedRegions:d().unlockedRegions.slice(),discoveries:{...d().discoveries},fish:{...d().fish},totalFish:d().totalFish,treasureFinds:d().treasureFinds,bossWins:d().bossWins,totalExpeditions:d().totalExpeditions,missionDay:'',missionWeek:'',missionClaims:{},missionProgress:{},event:{id:'quiet',until:0},activePage:'summit',research:{},researchPoints:0,totalResearch:d().totalResearch,legendAxeLevel:0,factoryLevel:0,factoryPlanks:0,villageLevel:1,houseLevel:1,summitHistory:(d().summitHistory||[]).concat([{at:Date.now(),count:d().summitCount+1}])}
    };
    s=defaults();Object.assign(s,keep);s.v5=keep.v5;s.logHp=woods[0].hp;s.lastSeen=Date.now();
    if(window.ensureWoodcutterV4)window.ensureWoodcutterV4();
    notify('頂上到達！頂上ポイントを1獲得しました！');renderAll();persist();
  }
  function doFish(){
    if(Date.now()<d().lastFish+12000)return;
    d().lastFish=Date.now();
    let roll=Math.random()*100, chosen=fishTypes[0];
    for(const f of fishTypes){roll-=f.chance;if(roll<=0){chosen=f;break;}}
    const bonus=Math.min(.35,num(d().research.fortune)*.01)+((d().event.id==='aurora'&&d().event.until>Date.now())?0.2:0);
    if(Math.random()<bonus)chosen=fishTypes[Math.min(4,fishTypes.indexOf(chosen)+1)];
    d().fish[chosen.id]=num(d().fish[chosen.id])+1;d().totalFish++;
    discover('fish_'+chosen.id);
    if(chosen.id==='myth_fish')rewardMaterial(3);
    notify(`${chosen.icon} ${chosen.name}を釣り上げた！`);renderWorld();persist();
  }
  function doTreasure(){
    if(Date.now()<d().lastTreasure+60000||!hasRegion('glacier'))return;
    d().lastTreasure=Date.now();d().treasureFinds++;
    let r=Math.random();
    if(d().event.id==='meteor'&&d().event.until>Date.now())r=Math.max(0,r-.2);
    if(r<.5){addMoney(5e5+Math.floor(Math.random()*5e6));d().researchPoints+=1;notify('宝箱を発見！コインと研究ポイントを獲得！');}
    else if(r<.85){rewardMaterial(Math.floor(Math.random()*3));notify('遺跡で希少素材を発見！');}
    else{d().researchPoints+=5;addMoney(1e8);discover('material_4');notify('古代の設計図を発見！大量の報酬を獲得！');}
    renderWorld();persist();
  }
  function doBoss(){
    const boss=[{name:'氷牙の巨狼',hp:1000,need:0,reward:100000},{name:'氷晶ゴーレム',hp:100000,need:1,reward:5000000},{name:'古代樹の守護者',hp:1e8,need:5,reward:1e9},{name:'天空の氷竜',hp:1e12,need:10,reward:1e12}].filter(x=>d().summitPoints>=x.need).slice(-1)[0];
    const power=Math.max(1,num(window.damage?window.damage():s.damage,1)*(1+num(d().research.sharp)*.1));
    const teamBonus=1+Math.max(0,(s.pets||[]).length)*.08+num(d().research.logistics)*.02;
    const combatPower=power*Math.max(1,num(s.level,1))*5*teamBonus;
    const chance=Math.max(.08,Math.min(.98,.15+(combatPower/(boss.hp+combatPower))*.8));
    if(Math.random()<chance){
      d().bossWins++;addMoney(boss.reward);d().researchPoints+=2;rewardMaterial(d().bossWins%5);
      notify(`${boss.name}を討伐！ ${fmt(boss.reward)} Gと研究ポイントを獲得！`);
    }else{
      addMoney(Math.floor(boss.reward*.03));notify(`${boss.name}に敗北… 戦闘報酬を少し獲得。装備や研究を強化しよう。`);
    }
    renderWorld();persist();
  }
  function doAction(action){
    if(action==='summit'){runSummit();return;}
    if(action==='forge'){const cost=3+d().legendAxeLevel*2;if(d().legendAxeLevel>=30||d().researchPoints<cost)return;d().researchPoints-=cost;d().legendAxeLevel++;notify(`星霜の斧をLv.${d().legendAxeLevel}に強化！`);}
    else if(action.startsWith('expedition:')){
      const id=action.split(':')[1],r=regions.find(x=>x.id===id);
      if(!r||!hasRegion(id))return;
      const last=num(d().lastRegionExplore),wait=15000;
      if(Date.now()<last+wait){notify('次のエリア探索まで少し待ってね。');return;}
      d().lastRegionExplore=Date.now();d().totalExpeditions++;
      const reward= Math.floor((1+regions.findIndex(x=>x.id===id))*250000*(1+num(d().research.fortune)*.1));
      addMoney(reward);d().researchPoints+=1+regions.findIndex(x=>x.id===id);
      rewardMaterial(Math.min(4,regions.findIndex(x=>x.id===id)));
      if(Math.random()<.12){discover('material_4');notify(`${r.name}で伝説の設計図を発見！ ${fmt(reward)} G獲得！`);}
      else notify(`${r.name}の探索完了！ ${fmt(reward)} Gと研究ポイントを獲得！`);
    }
    if(action==='fish'){doFish();return;}
    if(action==='treasure'){doTreasure();return;}
    if(action==='boss'){doBoss();return;}
    if(action==='factory'){
      const cost=moneyCost(1e7,d().factoryLevel);
      if(s.money<cost)return;
      s.money-=cost;d().factoryLevel++;notify('木材工場を強化した！');
    }else if(action==='factory-collect'){
      const amount=Math.floor(d().factoryPlanks);if(amount<1)return;
      s.planks=num(s.planks)+amount;d().factoryPlanks-=amount;notify(`${fmt(amount)}枚の木材を受け取った！`);
    }else if(action==='village'){
      const cost=moneyCost(5e5,d().villageLevel,2.1);if(s.money<cost)return;s.money-=cost;d().villageLevel++;notify('村が発展した！');
    }else if(action==='house'){
      const cost=moneyCost(2e5,d().houseLevel,2);if(s.money<cost)return;s.money-=cost;d().houseLevel++;notify('自宅を改築した！');
    }else if(action.startsWith('region:')){
      const id=action.split(':')[1],r=regions.find(x=>x.id===id);if(!r||hasRegion(id)||d().summitPoints<r.points)return;
      d().unlockedRegions.push(id);discover('region_'+id);notify(`${r.name}を解放した！`);
    }else if(action.startsWith('research:')){
      const id=action.split(':')[1],r=researches.find(x=>x.id===id);if(!r)return;
      const lv=num(d().research[id]),cost=r.cost*(lv+1);if(lv>=r.max||d().researchPoints<cost)return;
      d().researchPoints-=cost;d().research[id]=lv+1;d().totalResearch++;notify(`${r.name}をLv.${lv+1}に強化！`);
    }else if(action.startsWith('mission:')){
      const id=action.split(':')[1],m=missions.find(x=>x.id===id);if(!m)return;
      resetMissionPeriods();updateMissionProgress();
      if(d().missionClaims[id]||num(d().missionProgress[m.kind])<m.goal)return;
      d().missionClaims[id]=true;addMoney(m.reward);d().researchPoints+=m.weekly?3:1;notify(`ミッション達成！ ${fmt(m.reward)} Gを獲得！`);
    }else if(action.startsWith('decor:')){
      const i=Number(action.split(':')[1]),prices=[10000,50000,250000,1000000,10000000,100000000],price=prices[i];
      if(!Number.isFinite(price)||d().discoveries['decor_'+i]||s.money<price)return;
      s.money-=price;discover('decor_'+i);notify('自宅の飾りを購入した！');
    }
    renderWorld();persist();
  }
  function onClick(e){
    const tab=e.target.closest('[data-v5-tab]');
    if(tab){activateSub(tab.dataset.v5Tab);return;}
    const action=e.target.closest('[data-v5]');
    if(action){doAction(action.dataset.v5);}
  }
  document.addEventListener('click',onClick);
  const oldDamage=window.damage;
  if(typeof oldDamage==='function')window.damage=function(){return Math.max(1,Math.floor(oldDamage()*(1+num(d().legendAxeLevel)*.15)));};
  const oldRenderAll=window.renderAll||renderAll;
  window.renderAll=function(){oldRenderAll();ensure();renderWorld();};
  const oldApply=window.applyCloudSave;
  if(typeof oldApply==='function')window.applyCloudSave=function(data){oldApply(data);ensure();renderWorld();};
  // Factory production and panel refresh share one lightweight clock.
  d().factoryLast = num(d().factoryLast,Date.now());
  let lastV5Save=Date.now();
  const timer=setInterval(()=>{
    ensure();
    const now=Date.now(),elapsed=Math.max(0,Math.min(12*3600,(now-num(d().factoryLast,now))/1000));
    d().factoryLast=now;
    if(d().factoryLevel>0){let rate=d().factoryLevel*(1+num(d().research.automation)*.15)*(1+num(d().research.logistics)*.1);if(d().event.id==='festival'&&num(d().event.until)>now)rate*=2;d().factoryPlanks+=rate*elapsed/60;}
    if(now-num(d().lastEventRoll)<0||now-num(d().lastEventRoll)>300000){
      d().lastEventRoll=now;
      const roll=Math.random();
      if(roll<.22){const ids=['aurora','meteor','festival'];d().event={id:ids[Math.floor(Math.random()*ids.length)],until:now+90000};notify('雪山で特別な自然イベントが発生！');}
      else if(num(d().event.until)<=now)d().event={id:'quiet',until:0};
    }
    if(document.getElementById('page-world')?.classList.contains('active'))renderWorld();
    if(now-lastV5Save>15000){persist();lastV5Save=now;}
  },1000);
  ensure();renderWorld();persist();
})();

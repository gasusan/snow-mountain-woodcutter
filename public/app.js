const $=id=>document.getElementById(id);
const woods=[
 {name:"普通の丸太",icon:"🪵",hp:10,value:2,xp:2,unlock:1},
 {name:"白樺",icon:"🌳",hp:35,value:5,xp:5,unlock:3},
 {name:"松の木",icon:"🌲",hp:100,value:12,xp:10,unlock:6},
 {name:"樹齢の古木",icon:"🌳",hp:280,value:30,xp:22,unlock:10},
 {name:"黒檀",icon:"🪵",hp:750,value:85,xp:45,unlock:15},
 {name:"氷晶樹",icon:"❄️",hp:2200,value:240,xp:100,unlock:22},
 {name:"星降りの木",icon:"🌟",hp:7500,value:700,xp:250,unlock:32},
 {name:"世界樹の枝",icon:"🌌",hp:25000,value:2200,xp:700,unlock:45}
];
const upgrades=[
 {id:"power",name:"腕力トレーニング",desc:"丸太に与えるダメージが増える",icon:"💪",base:18,stat:"power"},
 {id:"crit",name:"斧さばき",desc:"クリティカル率が上がる",icon:"🎯",base:35,stat:"crit"},
 {id:"critPower",name:"一撃の心得",desc:"クリティカルダメージが増える",icon:"💥",base:55,stat:"critPower"},
 {id:"speed",name:"振りの速さ",desc:"自動で斧を振る速度が上がる",icon:"⚡",base:80,stat:"speed"},
 {id:"value",name:"薪の目利き",desc:"薪の売却価格が上がる",icon:"💰",base:65,stat:"value"},
 {id:"luck",name:"山の幸運",desc:"レア木材や探索報酬が増える",icon:"🍀",base:110,stat:"luck"}
];
const skills=[
 {id:"keen",name:"鋭い刃",desc:"全ダメージ +10%",cost:1,icon:"🗡️"},
 {id:"seller",name:"商人の心得",desc:"売却価格 +15%",cost:1,icon:"🪙"},
 {id:"focus",name:"集中",desc:"クリティカル率 +3%",cost:1,icon:"🎯"},
 {id:"worker",name:"手際の良さ",desc:"自動作業速度 +15%",cost:2,icon:"⏱️"},
 {id:"scout",name:"山の案内人",desc:"探索報酬 +20%",cost:2,icon:"🧭"},
 {id:"heart",name:"折れない心",desc:"経験値獲得 +20%",cost:2,icon:"❤️"}
];
const achievements=[
 ["first","初めての一振り","丸太を1本割る","🪓",1],
 ["ten","薪割り見習い","丸太を10本割る","🪵",10],
 ["hundred","薪割り職人","丸太を100本割る","🏅",100],
 ["thousand","山の伝説","丸太を1,000本割る","🏔️",1000],
 ["rich","小金持ち","累計で1,000G稼ぐ","💰",1000],
 ["rich2","大富豪","累計で100,000G稼ぐ","💎",100000],
 ["level10","一人前","レベル10になる","🌟",10],
 ["level30","山の達人","レベル30になる","👑",30],
 ["explorer","冒険家","探索を10回完了","🧭",10],
 ["woods","森の研究者","木材を5種類発見","🌲",5],
 ["pet","最高の相棒","相棒を1匹迎える","🐺",1]
];
const defaults=()=>({money:0,wood:0,woodBy:woods.map(()=>0),level:1,xp:0,skillPoints:0,totalLogs:0,totalEarned:0,damage:1,axe:0,up:{power:0,crit:0,critPower:0,speed:0,value:0,luck:0},skills:[],cabin:1,cabinUp:0,pets:[],stars:0,prestiges:0,explores:0,found:1,achievements:[],dailyDay:"",dailyClaim:false,dailyProgress:0,combo:0,lastChop:0,logHp:10,logType:0,weather:0,exploreEnd:0,exploreStart:0,exploreReward:null,lastSeen:Date.now(),sound:true});
let s=defaults(),toastTimer=null,autoTimer=null,weatherTimer=null;
const axeNames=["古い斧","鉄の斧","鋼の斧","銀の斧","氷結の斧","星鋼の斧","山神の斧","世界樹の斧"];
const axeCosts=[0,120,600,2500,12000,60000,300000,1500000];
const weatherList=[["❄️","雪","普通の天気。"],["🌨️","大雪","木材の経験値 +25%。"],["☀️","晴れ","売却価格 +20%。"],["🌬️","吹雪","探索報酬 +30%。"],["🌌","オーロラ","クリティカル率 +5%。"]];
function save(){s.lastSeen=Date.now();localStorage.setItem("snowWoodSave",JSON.stringify(s))}
function load(){try{let d=JSON.parse(localStorage.getItem("snowWoodSave"));if(d)s={...defaults(),...d,up:{...defaults().up,...d.up}}}catch(e){};s.logType=Math.max(0,Math.min(woods.length-1,s.logType));if(!s.logHp||s.logHp<=0)s.logHp=woods[s.logType].hp;
 let away=Math.min(8*3600,Math.max(0,(Date.now()-s.lastSeen)/1000));if(away>60){let gain=Math.floor(away*autoDps()*.35);if(gain>0){s.wood+=Math.floor(gain/5);s.money+=Math.floor(gain/5)*Math.max(1,woods[s.logType].value);setTimeout(()=>toast(`おかえり！留守中に薪と ${Math.floor(gain/5)} G 相当を獲得したよ。`),500)}}}
function cost(base,lv){return Math.floor(base*Math.pow(1.48,lv))}
function damage(){return Math.max(1,Math.floor((1+s.up.power*2+s.axe*3)*(s.skills.includes("keen")?1.1:1)*(1+s.stars*.08)))}
function critChance(){return Math.min(75,5+s.up.crit*2+(s.skills.includes("focus")?3:0)+(s.weather===4?5:0))}
function autoDps(){return s.up.speed*.55*(s.skills.includes("worker")?1.15:1)+s.cabinUp*.18+s.pets.length*.12}
function saleMult(){return 1+s.up.value*.12+(s.skills.includes("seller")?.15:0)+(s.weather===2?.2:0)+s.stars*.03}
function xpNeed(){return Math.floor(20*Math.pow(s.level,1.42))}
function gainXp(n){s.xp+=Math.floor(n*(s.skills.includes("heart")?1.2:1));while(s.xp>=xpNeed()){s.xp-=xpNeed();s.level++;s.skillPoints++;toast(`レベルアップ！ 木こりレベル ${s.level} 🎉`)}}
function chooseWood(){let max=0;woods.forEach((w,i)=>{if(s.level>=w.unlock)max=i});s.logType=Math.min(max,Math.max(0,s.logType));s.logHp=woods[s.logType].hp}
function toast(t){let el=$("toast");el.textContent=t;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2300)}
function modal(html){$("modalContent").innerHTML=html;$("modal").classList.add("show")}
function closeModal(){$("modal").classList.remove("show")}
function chop(){let now=Date.now();if(now-s.lastChop<75)return;s.combo=now-s.lastChop<1800?s.combo+1:1;s.lastChop=now;
 let dmg=damage();let crit=Math.random()*100<critChance();if(crit)dmg=Math.floor(dmg*(2+s.up.critPower*.12));s.logHp-=dmg;
 $("log").classList.add("hit");setTimeout(()=>$("log").classList.remove("hit"),100);
 $("hitFx").textContent=crit?"💥 CRITICAL!":(s.combo%5===0?"✨":"");$("hitFx").style.left=(35+Math.random()*35)+"%";setTimeout(()=>$("hitFx").textContent="",450);
 if(s.logHp<=0){let w=woods[s.logType];let qty=1+(Math.random()<Math.min(.6,s.up.luck*.025)?1:0);s.wood+=qty;s.woodBy[s.logType]+=qty;s.totalLogs++;s.dailyProgress++;s.money+=0;gainXp(w.xp);if(s.totalLogs===1)toast("初めて丸太を割った！薪を手に入れた。");s.logHp=w.hp;
   if(Math.random()<.04+s.up.luck*.008){s.money+=w.value*3;toast("✨ 山の幸運！ボーナスコインを発見！")}
   checkAchievements();
 }
 renderTop();renderScene();renderQuest();save();
}
function buyUpgrade(id,fromShop=false){let u=upgrades.find(x=>x.id===id),lv=s.up[id],c=cost(u.base,lv);if(s.money<c){toast("お金が足りない！");return} s.money-=c;s.up[id]++;toast(`${u.name}を強化した！`);renderAll();save()}
function buyAxe(){let n=s.axe+1;if(n>=axeNames.length){toast("斧は最高ランクだ！");return}let c=axeCosts[n];if(s.money<c){toast("お金が足りない！");return}s.money-=c;s.axe=n;toast(`${axeNames[n]}を手に入れた！`);renderAll();save()}
function renderTop(){$("money").textContent=Math.floor(s.money).toLocaleString()+" G";$("wood").textContent=s.wood.toLocaleString();$("levelTop").textContent=s.level;$("totalLogs").textContent=s.totalLogs.toLocaleString();$("damage").textContent=damage().toLocaleString();$("crit").textContent=critChance()+"%";$("xp").textContent=`${s.xp.toLocaleString()} / ${xpNeed().toLocaleString()}`}
function renderScene(){let w=woods[s.logType];$("woodName").textContent=w.name;$("logHpText").textContent=`耐久 ${Math.max(0,s.logHp)} / ${w.hp}`;$("hpLabel").textContent=`${Math.max(0,s.logHp)} / ${w.hp}`;$("hpBar").style.width=Math.max(0,s.logHp/w.hp*100)+"%";$("combo").textContent=`🔥 ${s.combo} COMBO`;let [ico,name,desc]=weatherList[s.weather];$("weather").textContent=ico+" "+name;$("weatherLine").textContent=desc}
function card(icon,name,desc,meta,button,disabled=false){return `<div class="upgrade-card"><div class="upgrade-icon">${icon}</div><div class="upgrade-copy"><b>${name}</b><p>${desc}</p><small>${meta}</small></div>${button?button:""}</div>`}
function renderGrowth(){$("level").textContent=s.level;$("skillPoints").textContent=`スキルポイント ${s.skillPoints}`;$("xpText").textContent=`経験値 ${s.xp.toLocaleString()} / ${xpNeed().toLocaleString()}`;$("xpBar").style.width=s.xp/xpNeed()*100+"%";
 $("upgradeGrid").innerHTML=upgrades.map(u=>{let c=cost(u.base,s.up[u.id]);return card(u.icon,u.name,u.desc,`Lv.${s.up[u.id]}　次の強化 ${c.toLocaleString()} G`,`<button ${s.money<c?"disabled":""} onclick="buyUpgrade('${u.id}')">強化</button>`)}).join("");
 $("skillGrid").innerHTML=skills.map(sk=>{let has=s.skills.includes(sk.id);return `<div class="skill-card"><div class="upgrade-icon">${sk.icon}</div><div class="upgrade-copy"><b>${sk.name}</b><p>${sk.desc}</p></div><button ${has||s.skillPoints<sk.cost?"disabled":""} onclick="buySkill('${sk.id}')">${has?"習得済み":sk.cost+"pt"}</button></div>`}).join("")}
function buySkill(id){let sk=skills.find(x=>x.id===id);if(s.skills.includes(id)||s.skillPoints<sk.cost)return;s.skillPoints-=sk.cost;s.skills.push(id);toast(`${sk.name}を習得！`);renderAll();save()}
function renderShop(){$("axeName").textContent=axeNames[s.axe];let next=s.axe+1;$("buyAxe").textContent=next>=axeNames.length?"最高ランク":`${axeNames[next]} ${axeCosts[next].toLocaleString()} G`;$("buyAxe").disabled=next>=axeNames.length||s.money<axeCosts[next];$("shopGrid").innerHTML=upgrades.map(u=>{let c=cost(u.base,s.up[u.id]);return card(u.icon,u.name, u.desc,`Lv.${s.up[u.id]}　${c.toLocaleString()} G`,`<button ${s.money<c?"disabled":""} onclick="buyUpgrade('${u.id}',true)">購入</button>`)}).join("");
 $("woodInventory").innerHTML=woods.map((w,i)=>`<div class="wood-item"><b>${w.icon} ${w.name}</b><small>${s.woodBy[i]||0}個 / ${Math.floor(w.value*saleMult())} G / 個</small></div>`).join("")}
function sell(n){n=Math.max(0,Math.min(s.wood,Math.floor(n)));if(!n){toast("売れる薪がないよ！");return}let value=woods.reduce((a,w,i)=>a+(s.woodBy[i]||0)*Math.floor(w.value*saleMult()),0);let total=s.woodBy.reduce((a,b)=>a+b,0);let remaining=n;let earned=0;for(let i=s.woodBy.length-1;i>=0&&remaining>0;i--){let take=Math.min(remaining,s.woodBy[i]);let v=Math.floor(woods[i].value*saleMult());earned+=take*v;s.woodBy[i]-=take;remaining-=take}s.wood-=n;s.money+=earned;s.totalEarned+=earned;toast(`${n}個の薪を ${earned.toLocaleString()} G で売却！`);renderAll();save()}
function renderForest(){$("exploreTime").textContent=Math.max(10,45-s.up.luck*2)+"秒";$("forestList").innerHTML=woods.map((w,i)=>`<div class="forest-item ${s.level<w.unlock?"locked":""}"><div><b>${w.icon} ${w.name}</b><small>${s.level<w.unlock?`レベル${w.unlock}で解放`:`耐久 ${w.hp.toLocaleString()} / 売値 ${w.value}G`}</small></div><button class="secondary" ${s.level<w.unlock?"disabled":""} onclick="selectWood(${i})">${s.logType===i?"選択中":"この木を割る"}</button></div>`).join("");
 let [ico,name,desc]=weatherList[s.weather];$("weatherDetail").innerHTML=`<b>${ico} ${name}</b><p>${desc} 天気は一定時間ごとに変化するよ。</p>`;let running=s.exploreEnd>Date.now();$("exploreBtn").disabled=running;$("exploreBtn").textContent=running?"探索中…":"探索に出発";if(running){let pct=(Date.now()-s.exploreStart)/(s.exploreEnd-s.exploreStart)*100;$("exploreBar").style.width=pct+"%";$("exploreStatus").textContent="探索中…"}else{$("exploreBar").style.width="0%";$("exploreStatus").textContent="準備完了"}}
function selectWood(i){if(s.level<woods[i].unlock)return;s.logType=i;s.logHp=woods[i].hp;renderAll();toast(`${woods[i].name}に切り替えた！`);save()}
function explore(){if(s.exploreEnd>Date.now())return;let secs=Math.max(10,45-s.up.luck*2);s.exploreStart=Date.now();s.exploreEnd=Date.now()+secs*1000;toast("雪山の探索に出発！");renderForest();save()}
function finishExplore(){if(!s.exploreEnd||Date.now()<s.exploreEnd)return;let coins=Math.floor((30+s.level*8+s.up.luck*12)*(1+s.stars*.05)*(s.weather===3?1.3:1)*(s.skills.includes("scout")?1.2:1));let roll=Math.random();let reward=`${coins} G`;s.money+=coins;s.explores++;if(roll<.28){let idx=Math.min(woods.length-1,Math.floor(Math.random()*Math.max(1,s.found+1)));if(s.level>=woods[idx].unlock){s.wood++;s.woodBy[idx]++;reward+=`、${woods[idx].name}を発見！`;s.found=Math.max(s.found,idx+1)}}if(roll>.88){s.skillPoints++;reward+="、スキルポイント +1"}s.exploreEnd=0;s.exploreStart=0;s.dailyProgress+=2;toast("探索完了！ "+reward);checkAchievements();renderAll();save()}
function renderQuest(){let target=10+(new Date().getDate()%4)*5;let claimed=s.dailyClaim&&s.dailyDay===new Date().toDateString();$("dailyCard").innerHTML=`<h3>📦 今日の薪割り依頼</h3><p>丸太を ${target} 本割ろう。達成するとボーナス報酬！</p><div class="daily-progress"><i style="width:${Math.min(100,s.dailyProgress/target*100)}%"></i></div><small>${Math.min(s.dailyProgress,target)} / ${target}</small><button class="primary" style="float:right" ${s.dailyProgress<target||claimed?"disabled":""} onclick="claimDaily()">${claimed?"受取済み":s.dailyProgress>=target?"報酬を受け取る":"依頼中"}</button><div style="clear:both"></div>`;
 $("achievementCount").textContent=`${s.achievements.length} / ${achievements.length}`;$("achievementList").innerHTML=achievements.map(a=>{let done=s.achievements.includes(a[0]);return `<div class="achievement ${done?"done":""}"><span>${a[3]}</span><div><b>${a[1]} ${done?"✓":""}</b><small>${a[2]}</small></div></div>`}).join("")}
function claimDaily(){let target=10+(new Date().getDate()%4)*5;if(s.dailyProgress<target)return;s.money+=100+s.level*20;s.dailyClaim=true;s.dailyDay=new Date().toDateString();toast("依頼達成！報酬を受け取った！");renderAll();save()}
function checkAchievements(){for(let a of achievements){if(s.achievements.includes(a[0]))continue;let val=({first:s.totalLogs,ten:s.totalLogs,hundred:s.totalLogs,thousand:s.totalLogs,rich:s.totalEarned,rich2:s.totalEarned,level10:s.level,level30:s.level,explorer:s.explores,woods:s.found,pet:s.pets.length})[a[0]];if(val>=a[4]){s.achievements.push(a[0]);s.money+=100;s.totalEarned+=100;toast(`実績解除：${a[1]}！ +100G`)}}}
function renderCabin(){$("cabinLevel").textContent=`小屋レベル ${s.cabin}`;$("upgradeCabin").textContent=`改築 ${Math.floor(300*Math.pow(2,s.cabin-1))} G`;$("upgradeCabin").disabled=s.money<300*Math.pow(2,s.cabin-1);$("cabinGrid").innerHTML=[{name:"薪置き場",desc:"薪の保管上限が増える（実質無制限）",icon:"🪵",cost:200},{name:"作業台",desc:"自動作業効率 +0.18 / 秒",icon:"🛠️",cost:350},{name:"暖炉",desc:"経験値獲得ボーナス（雰囲気も最高）",icon:"🔥",cost:500}].map((x,i)=>card(x.icon,x.name,x.desc,`購入 ${x.cost} G`,`<button ${s.cabinUp>i||s.money<x.cost?"disabled":""} onclick="buyCabinItem(${i},${x.cost})">${s.cabinUp>i?"設置済み":"設置"}</button>`)).join("");
 let pets=[["🐺","雪オオカミ","自動作業 +0.12 / 秒",2500],["🦊","森ギツネ","探索報酬 +10%",5000],["🐻","こぐま","丸太割りダメージ +2",10000]];$("petGrid").innerHTML=pets.map((p,i)=>`<div class="pet-card"><div class="upgrade-icon">${p[0]}</div><div class="upgrade-copy"><b>${p[1]}</b><p>${p[2]}</p></div><button ${s.pets.includes(i)||s.money<p[3]?"disabled":""} onclick="buyPet(${i},${p[3]})">${s.pets.includes(i)?"仲間":"迎える "+p[3].toLocaleString()+"G"}</button></div>`).join("");
 $("prestigeInfo").textContent=`山の星 ${s.stars} / ${s.level>=30?"転生可能！":"レベル30で解放（現在Lv."+s.level+"）"}`;$("prestigeBtn").disabled=s.level<30}
function buyCabin(){let c=Math.floor(300*Math.pow(2,s.cabin-1));if(s.money<c)return;s.money-=c;s.cabin++;s.cabinUp+=.1;toast("山小屋を改築した！");renderAll();save()}
function buyCabinItem(i,c){if(s.cabinUp>i||s.money<c)return;s.money-=c;s.cabinUp+=1;toast("山小屋に設備を設置した！");renderAll();save()}
function buyPet(i,c){if(s.pets.includes(i)||s.money<c)return;s.money-=c;s.pets.push(i);toast("新しい相棒が仲間になった！");checkAchievements();renderAll();save()}
function prestige(){if(s.level<30)return;let stars=Math.max(1,Math.floor(Math.sqrt(s.totalLogs/100)));if(!confirm(`転生して山の星 ${stars} 個を獲得しますか？ 所持金・レベル・通常強化がリセットされます。`))return;s.stars+=stars;s.prestiges++;let keep={stars:s.stars,prestiges:s.prestiges,achievements:s.achievements,found:s.found};s=defaults();Object.assign(s,keep);s.logHp=woods[0].hp;toast("山の星を受け継いだ！永久ボーナス獲得！");renderAll();save()}
function renderAll(){renderTop();renderScene();renderGrowth();renderShop();renderForest();renderQuest();renderCabin()}
function tick(){if(s.exploreEnd&&Date.now()>=s.exploreEnd)finishExplore();let dps=autoDps();if(dps>0&&Math.random()<dps/10)chop();renderTop();save()}
function switchTab(tab){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));document.querySelectorAll(".tab-page").forEach(p=>p.classList.toggle("active",p.id==="page-"+tab))}
$("tabs").addEventListener("click",e=>{let b=e.target.closest(".tab");if(b)switchTab(b.dataset.tab)});
$("chopBtn").addEventListener("click",()=>window.chop?window.chop():chop());$("chopBtn").addEventListener("pointerdown",e=>{if(e.pointerType==="touch")e.preventDefault()});
$("buyAxe").onclick=buyAxe;$("sellBtn").onclick=()=>sell(+$("sellAmount").value);$("sellAllBtn").onclick=()=>sell(s.wood);$("exploreBtn").onclick=explore;$("upgradeCabin").onclick=buyCabin;$("prestigeBtn").onclick=()=>window.prestige?window.prestige():prestige();
$("modalX").onclick=closeModal;$("modal").onclick=e=>{if(e.target.id==="modal")closeModal()};
$("exportBtn").onclick=()=>modal(`<h2>セーブコード</h2><p>このコードをコピーして保管してね。</p><textarea id="saveCode" readonly>${btoa(unescape(encodeURIComponent(JSON.stringify(s))))}</textarea><button class="primary" onclick="navigator.clipboard.writeText(document.getElementById('saveCode').value).then(()=>toast('コピーしました！'))">コードをコピー</button>`);
$("importBtn").onclick=()=>modal(`<h2>セーブコード読み込み</h2><p>現在のセーブデータは上書きされます。</p><textarea id="loadCode" placeholder="セーブコードを貼り付け"></textarea><button class="primary" onclick="importSave()">読み込む</button>`);
function importSave(){try{s={...defaults(),...JSON.parse(decodeURIComponent(escape(atob($("loadCode").value.trim()))))};save();closeModal();renderAll();toast("セーブデータを読み込んだ！")}catch(e){toast("コードが正しくないみたい…")}}
$("resetBtn").onclick=()=>{if(confirm("本当に最初からやり直す？セーブデータも消えるよ。")){localStorage.removeItem("snowWoodSave");s=defaults();renderAll();save();toast("新しい木こり生活の始まり！")}};
load();chooseWood();renderAll();
if(s.dailyDay!==new Date().toDateString()){s.dailyDay=new Date().toDateString();s.dailyClaim=false;s.dailyProgress=0}
setInterval(()=>window.tick?window.tick():tick(),1000);setInterval(()=>{s.weather=(s.weather+1)%weatherList.length;renderScene();renderForest();save()},90000);

// Public bridge for the cloud-save module. The actual game state remains private to this script.
window.getWoodcutterSave = () => JSON.parse(JSON.stringify(s));
window.applyCloudSave = (data) => {
  if (!data || typeof data !== "object") throw new Error("セーブデータが正しくありません");
  const base = defaults();
  s = { ...base, ...data, up: { ...base.up, ...(data.up || {}) } };
  s.logType = Math.max(0, Math.min(woods.length - 1, Number(s.logType) || 0));
  if (!Array.isArray(s.woodBy)) s.woodBy = woods.map(() => 0);
  if (!Array.isArray(s.pets)) s.pets = [];
  if (!Array.isArray(s.skills)) s.skills = [];
  if (!Array.isArray(s.achievements)) s.achievements = [];
  save(); renderAll();
};

/* Snow Mountain Woodcutter v2.0 enhancements */
(()=>{
const $=id=>document.getElementById(id);
const PETS=[
 {id:0,icon:'🐺',name:'雪オオカミ',effect:'自動作業速度 +',base:.12,unit:' / 秒',cost:2500,levelCost:350,desc:'自動で丸太を割る速度を強化'},
 {id:1,icon:'🦊',name:'森ギツネ',effect:'探索報酬 +',base:.10,unit:'%',cost:5000,levelCost:500,desc:'探索で見つけるコインが増える'},
 {id:2,icon:'🐻',name:'こぐま',effect:'基本ダメージ +',base:2,unit:'',cost:10000,levelCost:800,desc:'丸太を割る基本ダメージが増える'},
 {id:3,icon:'🦉',name:'雪フクロウ',effect:'クリティカル率 +',base:1,unit:'%',cost:18000,levelCost:1200,desc:'クリティカルが発生しやすくなる'},
 {id:4,icon:'🐰',name:'白雪ウサギ',effect:'獲得経験値 +',base:5,unit:'%',cost:30000,levelCost:1800,desc:'木こり経験値を多く獲得'},
 {id:5,icon:'🦌',name:'森のトナカイ',effect:'薪の売却価格 +',base:3,unit:'%',cost:50000,levelCost:2600,desc:'薪を売ったときの価格が上昇'}
];
const STAR_SKILLS=[
 {id:'star_power',name:'星の腕力',desc:'基本ダメージ +12% / Lv',cost:1,max:10},
 {id:'star_sale',name:'星の商才',desc:'売却価格 +10% / Lv',cost:1,max:10},
 {id:'star_auto',name:'星の鼓動',desc:'自動作業速度 +15% / Lv',cost:1,max:10},
 {id:'star_crit',name:'星の導き',desc:'クリティカル率 +1.5% / Lv',cost:2,max:10}
];
const MILESTONES=[{n:3,reward:500,title:'初心者木こり'},{n:6,reward:1500,title:'山の働き者'},{n:10,reward:5000,title:'雪山の名人'},{n:15,reward:15000,title:'伝説の木こり'}];
function ensure(){
 s.pets=(s.pets||[]).map(x=>typeof x==='number'?{id:x,level:1}:x);
 s.petLevels=s.petLevels||{}; s.starSkills=s.starSkills||{}; s.bestPrestigeReward=s.bestPrestigeReward||1;
 s.runLogs=s.runLogs||s.totalLogs||0; s.milestones=s.milestones||[]; s.volume=Number.isFinite(s.volume)?s.volume:35;
 s.autoProgress=s.autoProgress||0;
}
function petLevel(id){let p=s.pets.find(x=>x.id===id);return p?Math.max(1,p.level||1):0}
function petOwned(id){return s.pets.some(x=>x.id===id)}
function petEffect(id){const p=PETS[id],lv=petLevel(id);return p.base*lv}
function starLv(id){return Math.max(0,s.starSkills[id]||0)}
// Replace key formulas while retaining the base game's progression.
const oldDamage=damage,oldCrit=critChance,oldAuto=autoDps,oldSale=saleMult;
window.damage=()=>Math.max(1,Math.floor(oldDamage()*(1+starLv('star_power')*.12)+petEffect(2)));
window.critChance=()=>Math.min(85,oldCrit()+petEffect(3)+starLv('star_crit')*1.5);
window.autoDps=()=>Math.max(0,(oldAuto()+petEffect(0))*(1+starLv('star_auto')*.15));
window.saleMult=()=>oldSale()*(1+starLv('star_sale')*.10+petEffect(5)/100);
const oldExplore=finishExplore;
window.finishExplore=function(){let before=s.money;oldExplore();let fox=petEffect(1)/100;if(fox>0){let extra=Math.floor(Math.max(0,s.money-before)*fox);s.money+=extra;s.totalEarned=(s.totalEarned||0)+extra;toast(`森ギツネが追加報酬 ${extra.toLocaleString()} G を見つけた！`);save();renderAll()}};
const oldGain=gainXp;
window.gainXp=function(n){let bonus=1+petEffect(4)/100;oldGain(Math.floor(n*bonus))};
// Accumulated auto-work: no probability cap, so speed upgrades never become weaker.
const oldTick=tick;
window.tick=function(){if(s.exploreEnd&&Date.now()>=s.exploreEnd)finishExplore();let rate=window.autoDps?window.autoDps():autoDps();s.autoProgress=(s.autoProgress||0)+Math.max(0,Number(rate)||0);let count=Math.min(100,Math.floor(s.autoProgress));if(count>0){s.autoProgress-=count;for(let i=0;i<count;i++){s.lastChop=Date.now()-76;(window.chop||chop)()}}renderTop();save()};
// More generous, non-decreasing prestige reward based on this run's level and output.
const oldPrestige=prestige;
window.prestige=function(){if(s.level<30)return;let reward=Math.max(s.bestPrestigeReward||1,1+Math.floor((s.level-30)/10)+Math.floor((s.runLogs||s.totalLogs)/1000));let before=s.stars;if(!confirm(`転生して山の星 ${reward} 個を獲得しますか？ 所持金・レベル・通常強化がリセットされます。`))return;s.stars+=reward;s.prestiges++;s.bestPrestigeReward=reward;let keep={stars:s.stars,prestiges:s.prestiges,achievements:s.achievements,found:s.found,starSkills:s.starSkills,bestPrestigeReward:reward,milestones:s.milestones};s=defaults();Object.assign(s,keep);s.logHp=woods[0].hp;toast(`山の星を ${reward} 個受け継いだ！`);renderAll();save()};
// Add run counters to every chopped log, including offline play.
const oldChop=chop;
window.chop=function(){let prev=s.totalLogs;oldChop();if(s.totalLogs>prev){s.runLogs=(s.runLogs||0)+(s.totalLogs-prev);save()}};
// BGM volume control, persisted in the existing save.
function setupAudio(){const audio=$('bgm'),slider=$('volumeSlider'),label=$('volumeValue');if(!audio||!slider)return;slider.value=s.volume;audio.volume=s.volume/100;label.textContent=s.volume+'%';slider.addEventListener('input',()=>{s.volume=+slider.value;audio.volume=s.volume/100;label.textContent=s.volume+'%';save()});const start=()=>{if(s.volume>0)audio.play().catch(()=>{});document.removeEventListener('pointerdown',start)};document.addEventListener('pointerdown',start,{once:true});}
// Visual pet companions in the distant scenery.
function renderPetsBackdrop(){let el=$('petBackdrop');if(!el)return;el.innerHTML=s.pets.map((pet,i)=>{let p=PETS[pet.id];return `<span class="scene-pet pet-${i%4}" title="${p.name} Lv.${pet.level}">${p.icon}</span>`}).join('')}
function renderPetCards(){let el=$('petGrid');if(!el)return;el.innerHTML=PETS.map(p=>{let owned=petOwned(p.id),lv=petLevel(p.id),cost=Math.floor(p.levelCost*Math.pow(1.55,Math.max(0,lv-1)));let effect=p.base*lv;let effectText=p.id===0?`自動作業 +${effect.toFixed(2)} / 秒`:p.id===2?`基本ダメージ +${effect}`:`${p.effect}${effect}${p.unit}`;return `<div class="pet-card"><div class="upgrade-icon">${p.icon}</div><div class="upgrade-copy"><b>${p.name} ${owned?'Lv.'+lv:''}</b><p>${p.desc}</p><small>${owned?effectText:'仲間になると効果発動'}</small></div>${owned?`<button onclick="levelPet(${p.id})" ${s.money<cost||lv>=50?'disabled':''}>${lv>=50?'MAX':`Lv.UP ${cost.toLocaleString()}G`}</button>`:`<button onclick="buyPet(${p.id},${p.cost})" ${s.money<p.cost?'disabled':''}>迎える ${p.cost.toLocaleString()}G</button>`}</div>`}).join('');renderPetsBackdrop()}
window.buyPet=function(id,cost){if(petOwned(id)||s.money<cost)return;s.money-=cost;s.pets.push({id,level:1});toast(`${PETS[id].name}が仲間になった！`);checkAchievements();renderAll();save()};
window.levelPet=function(id){let lv=petLevel(id);if(!lv||lv>=50)return;let cost=Math.floor(PETS[id].levelCost*Math.pow(1.55,lv-1));if(s.money<cost){toast('コインが足りないよ！');return}s.money-=cost;s.pets.find(x=>x.id===id).level++;toast(`${PETS[id].name}が Lv.${lv+1} に成長！`);renderAll();save()};
function renderStarTree(){let el=$('starSkillGrid');if(!el)return;el.innerHTML=STAR_SKILLS.map(sk=>{let lv=starLv(sk.id);return `<div class="skill-card"><div class="upgrade-icon">🌟</div><div class="upgrade-copy"><b>${sk.name} Lv.${lv}/${sk.max}</b><p>${sk.desc}</p></div><button onclick="buyStarSkill('${sk.id}')" ${s.stars<sk.cost||lv>=sk.max?'disabled':''}>${lv>=sk.max?'MAX':sk.cost+' 星で強化'}</button></div>`}).join('')}
window.buyStarSkill=function(id){let sk=STAR_SKILLS.find(x=>x.id===id),lv=starLv(id);if(!sk||lv>=sk.max||s.stars<sk.cost)return;s.stars-=sk.cost;s.starSkills[id]=lv+1;toast(`${sk.name}を強化した！`);renderAll();save()};
function renderEffects(){let el=$('effectSummary');if(!el)return;let rows=[['丸太ダメージ',damage()+' / hit'],['クリティカル率',critChance().toFixed(1)+'%'],['自動作業速度',(window.autoDps?window.autoDps():autoDps()).toFixed(2)+' 回 / 秒'],['薪の売却倍率','×'+saleMult().toFixed(2)],['経験値倍率','×'+(1+petEffect(4)/100).toFixed(2)],['山の星倍率','×'+(1+s.stars*.08).toFixed(2)]];el.innerHTML=rows.map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}
function renderMilestones(){let el=$('achievementList');if(!el)return;let count=s.achievements.length;let cards=MILESTONES.map(m=>{let done=count>=m.n,claimed=s.milestones.includes(m.n);return `<div class="milestone-card"><div><b>🏅 ${m.title}</b><small>実績 ${m.n} 個達成で ${m.reward.toLocaleString()} G</small><div class="daily-progress"><i style="width:${Math.min(100,count/m.n*100)}%"></i></div><small>${Math.min(count,m.n)} / ${m.n}</small></div><button class="primary" onclick="claimMilestone(${m.n})" ${!done||claimed?'disabled':''}>${claimed?'受取済み':'受け取る'}</button></div>`}).join('');let wrap=$('milestoneRewards');if(!wrap){wrap=document.createElement('div');wrap.id='milestoneRewards';el.after(wrap)}wrap.innerHTML=`<div class="section-title sub"><div><span class="eyebrow">ACHIEVEMENT REWARDS</span><h2>実績達成ボーナス</h2></div></div><div class="milestone-list">${cards}</div>`}
window.claimMilestone=function(n){let m=MILESTONES.find(x=>x.n===n);if(!m||s.achievements.length<n||s.milestones.includes(n))return;s.milestones.push(n);s.money+=m.reward;s.totalEarned=(s.totalEarned||0)+m.reward;toast(`${m.title}達成！ ${m.reward.toLocaleString()} G 獲得！`);renderAll();save()};
const oldRenderCabin=renderCabin;
window.renderCabin=function(){oldRenderCabin();renderPetCards();renderStarTree()};
const oldRenderQuest=renderQuest;
window.renderQuest=function(){oldRenderQuest();renderMilestones()};
const oldRenderAll=renderAll;
window.renderAll=function(){oldRenderAll();renderPetCards();renderStarTree();renderEffects()};
const oldRenderTop=renderTop;
window.renderTop=function(){oldRenderTop();renderEffects()};
// Scene: larger upright timber, per-species tint, animated axe, and actual weather atmosphere.
const oldRenderScene=renderScene;
window.renderScene=function(){oldRenderScene();let log=$('log');if(log){log.style.width='116px';log.style.height='118px';log.style.bottom='27px';log.style.borderRadius='48% 48% 18% 18%';log.style.background=`linear-gradient(90deg,${['#98613e','#d5c2a0','#5c4936','#59463b','#24252a','#6ab4c5','#8b72bd','#4c8b79'][s.logType]||'#98613e'},#d5a879 48%,#7b4b30)`;log.style.boxShadow='inset 0 0 0 7px #80583c,0 7px 0 #895b3e';}let scene=document.querySelector('.scene');if(scene){scene.dataset.weather=s.weather;scene.classList.remove('weather-snow','weather-blizzard','weather-sun','weather-wind','weather-aurora');scene.classList.add(['weather-snow','weather-blizzard','weather-sun','weather-wind','weather-aurora'][s.weather]||'weather-snow')}};
// Axe swing and critical effects
const chopButton=$('chopBtn');if(chopButton){chopButton.addEventListener('click',()=>{chopButton.classList.remove('swing');void chopButton.offsetWidth;chopButton.classList.add('swing')})}
// Preserve base critical logic but add an unmistakable flash whenever a crit is shown.
const fx=$('hitFx');if(fx){const obs=new MutationObserver(()=>{if((fx.textContent||'').includes('CRITICAL')){document.querySelector('.scene')?.classList.add('critical-flash');setTimeout(()=>document.querySelector('.scene')?.classList.remove('critical-flash'),240)}});obs.observe(fx,{childList:true,characterData:true,subtree:true})}
// Weather effect styling and refreshes are kept in the original timer.
// Additional achievements focused on v2.0 progression.
achievements.push(
 ['petmaster','相棒育成の達人','ペットの合計レベルを10にする','🐾',10],
 ['starcollector','星の収集家','山の星を5個獲得する','🌟',5],
 ['petcollector','動物たちの友','ペットを4匹仲間にする','🦊',4],
 ['prestige2','山の記憶を継ぐ者','転生を2回行う','🏔️',2]
);
const baseCheckAchievements=checkAchievements;
window.checkAchievements=function(){baseCheckAchievements();let petTotal=s.pets.reduce((n,p)=>n+(p.level||1),0);let vals={petmaster:petTotal,starcollector:s.stars,petcollector:s.pets.length,prestige2:s.prestiges};for(let a of achievements){if(!vals.hasOwnProperty(a[0])||s.achievements.includes(a[0]))continue;if(vals[a[0]]>=a[4]){s.achievements.push(a[0]);s.money+=250;s.totalEarned=(s.totalEarned||0)+250;toast(`実績解除：${a[1]}！ +250G`)}}};
ensure();setupAudio();renderAll();
})();

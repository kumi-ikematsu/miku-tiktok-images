// 12星座ランキング画像を作る: node ranking.js ranking.json outDir [seed]
// 出力: outDir/01.png（1〜6位）/ 02.png（7〜12位）/ 03.png（案内。"cta" があるときだけ）  各1080x1920
// ranking.json: {"month":"12月","fortune":"総合運","catch":"保存してね","sub":"ひとこと",
//   "items":[{"sign":"山羊座","text":"本文。**強調**できる（全角60〜80字）","lucky":"ラッキー:白"(任意)}, ...12件、1位から順に],
//   "footSmall":"...","footBig":"...","cta":"案内文(任意)"}
const fs=require('fs'),path=require('path');const{chromium}=require('playwright');
const[,,dataFile,outDir,seedArg]=process.argv;const D=JSON.parse(fs.readFileSync(dataFile,'utf8'));fs.mkdirSync(outDir,{recursive:true});
let seed=seedArg?[...seedArg].reduce((a,c)=>Math.imul(a^c.charCodeAt(0),16777619)>>>0,2166136261):Math.floor(Math.random()*4294967296);
const R=()=>{seed=(seed+0x6D2B79F5)>>>0;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};const pick=a=>a[Math.floor(R()*a.length)];
const esc=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
const rich=t=>esc(t).replace(/\*\*(.+?)\*\*/g,'<b class="hl">$1</b>').split('\n').join('<br>');
const BG=path.join(__dirname,'bg');const files=fs.existsSync(BG)?fs.readdirSync(BG).filter(f=>f.endsWith('.jpg')).sort():[];
const light=files.filter(f=>f.startsWith('light-'));
const uri=f=>'data:image/jpeg;base64,'+fs.readFileSync(path.join(BG,f)).toString('base64');
const SIGNS={
 '牡羊座':['♈','3/21-4/19','#c94a4a','#f6d5cf'],'牡牛座':['♉','4/20-5/20','#4f8a4a','#dcebd2'],'双子座':['♊','5/21-6/21','#c9a227','#f6ecc6'],
 '蟹座':['♋','6/22-7/22','#d0668f','#f7dbe6'],'獅子座':['♌','7/23-8/22','#d0802a','#f7e1c6'],'乙女座':['♍','8/23-9/22','#5e9a6a','#dcefdf'],
 '天秤座':['♎','9/23-10/23','#4f6fc0','#dbe3f6'],'蠍座':['♏','10/24-11/22','#7a4aa8','#e6daf3'],'射手座':['♐','11/23-12/21','#3f78b0','#d6e6f4'],
 '山羊座':['♑','12/22-1/19','#8a6a3a','#efe4d0'],'水瓶座':['♒','1/20-2/18','#3a98b0','#d3edf3'],'魚座':['♓','2/19-3/20','#5a72c8','#dde2f7']};
const MEDAL=[['#fff3c4','#e0b23c','#9a6a10'],['#ffffff','#c9ced8','#7a8090'],['#ffe2c8','#d08a52','#8a4a1a']];
const bgA=light.length?pick(light):null,bgB=light.length?pick(light.filter(f=>f!==bgA))||bgA:null;
const CSS=`*{margin:0;padding:0;box-sizing:border-box}body{width:1080px;height:1920px;overflow:hidden;position:relative;font-family:'Noto Serif CJK JP',serif;background:#fbf3ec}
.gold{background:linear-gradient(180deg,#d9a441 0%,#b07a2a 45%,#7a4a1a 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 2px #fff) drop-shadow(0 0 2px #fff) drop-shadow(0 3px 0 rgba(255,255,255,.95)) drop-shadow(0 0 12px rgba(255,250,240,.9))}
.sym{font-family:'FreeSerif','DejaVu Serif',serif;font-variant-emoji:text}
.hl{font-weight:900;color:#a8325e;background:linear-gradient(transparent 62%,rgba(255,214,120,.55) 62%)}`;
function medal(n){const m=MEDAL[n-1];const [a,b,c]=m||['#fffaf3','#e8d9c6','#8a6a4a'];
 return `<div style="flex:none;width:118px;height:118px;border-radius:50%;background:radial-gradient(circle at 35% 30%,${a},${b} 70%);border:4px solid ${m?c:'rgba(176,130,58,.55)'};box-shadow:0 4px 12px rgba(120,80,40,.25),inset 0 0 0 4px rgba(255,255,255,.55);display:flex;align-items:baseline;justify-content:center;padding-top:26px;color:${m?c:'#6a4a2e'}"><span style="font-size:${n>9?50:58}px;font-weight:900;line-height:1">${n}</span><span style="font-size:24px;font-weight:900">位</span></div>`;}
function row(it,n,h){const s=SIGNS[it.sign]||['✦','','#8a6a3a','#efe4d0'];
 return `<div style="height:${h}px;display:flex;align-items:center;gap:14px;padding:0 18px 0 16px;border-radius:22px;background:linear-gradient(90deg,${s[3]}d9 0%,rgba(255,251,246,.62) 38%,rgba(255,251,246,.55) 100%);border:1.5px solid ${s[2]}55;box-shadow:0 4px 14px rgba(120,80,60,.12);backdrop-filter:blur(3px);margin-bottom:12px">
 ${medal(n)}
 <div style="flex:none;width:186px;text-align:center">
  <div style="font-size:40px;font-weight:900;color:#3a2350;line-height:1.1">${esc(it.sign)}</div>
  <div class="sym" style="font-size:64px;line-height:1.05;color:${s[2]};opacity:.85">${s[0]}&#xFE0E;</div>
  <div style="font-size:21px;color:#6a5a70;font-weight:700">${s[1]}</div></div>
 <div style="flex:1;align-self:stretch;margin:16px 0;padding:12px 18px;border-radius:16px;background:rgba(255,253,249,.6);border:1.5px solid rgba(201,154,74,.35);display:flex;flex-direction:column;justify-content:center">
  <div style="font-size:26px;line-height:1.5;color:#3a2a3a;font-weight:600">${rich(it.text)}</div>
  ${it.lucky?`<div style="margin-top:6px;font-size:21px;color:${s[2]};font-weight:800">✦ ${esc(it.lucky)}</div>`:''}</div></div>`;}
function page(from,bg){const list=D.items.slice(from,from+6);const top=318,foot=200;const h=Math.floor((1920-top-foot-12*6)/6);
 return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
 ${bg?`<div style="position:absolute;inset:0;background:url(${uri(bg)}) center/cover no-repeat"></div>`:''}
 <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,251,244,.45),rgba(255,251,244,.25) 40%,rgba(255,251,244,.4))"></div>
 <div style="position:absolute;inset:12px;border:3px solid rgba(176,130,58,.5);border-radius:28px"></div>
 <div style="position:absolute;top:44px;left:0;right:0;text-align:center">
  <div style="display:inline-block;padding:8px 30px;border-radius:999px;background:rgba(255,250,240,.6);border:2px solid rgba(201,154,74,.55);color:#6a4a2e;font-size:30px;font-weight:700">${esc(D.catch||'自分の星座をチェックしてね')}</div>
  <div class="gold" style="font-size:92px;font-weight:900;line-height:1.15;margin-top:14px;white-space:nowrap">${esc(D.month)}の${esc(D.fortune||'運勢')}</div>
  <div style="display:inline-flex;align-items:center;gap:16px;margin-top:4px;color:#5a3d22;font-size:38px;font-weight:900"><span style="color:#c99a4a">✦</span>12星座ランキング <span style="font-size:30px;padding:2px 18px;border-radius:999px;background:rgba(176,130,58,.75);color:#fff">${from+1}位〜${from+6}位</span><span style="color:#c99a4a">✦</span></div></div>
 <div style="position:absolute;top:${top}px;left:26px;right:26px">${list.map((it,i)=>row(it,from+i+1,h)).join('')}</div>
 <div style="position:absolute;left:0;right:0;bottom:34px;text-align:center">
  <div style="color:#6a4a2e;font-size:28px;font-weight:700">${esc(from?(D.footSmall2||'順位よりも、あなたの心地よさを大切に'):(D.footSmall||'7位〜12位は次の画像へ →'))}</div>
  <div style="display:inline-block;margin-top:10px;border:3px solid #c99a4a;color:#5a3d22;background:rgba(255,255,255,.55);font-size:26px;font-weight:700;padding:6px 30px;border-radius:999px">保存して見返してね</div>
  <div style="color:#8a6532;font-size:20px;letter-spacing:.3em;margin-top:8px">未來（みく）の霊視鑑定</div></div></body></html>`;}
function ctaPage(){return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
 ${bgB?`<div style="position:absolute;inset:0;background:url(${uri(bgB)}) center/cover no-repeat"></div>`:''}<div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 45% at 50% 50%,rgba(255,251,244,.85),rgba(255,251,244,.5) 65%,rgba(255,251,244,.12))"></div>
 <div style="position:absolute;inset:40px;border:2px solid #b0823a;opacity:.6;border-radius:8px"></div>
 <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 110px">
  <div style="color:#b0823a;font-size:46px;letter-spacing:30px;margin-bottom:46px">✦ ✧ ✦</div>
  <div style="color:#4f3a28;font-size:58px;font-weight:500;line-height:1.95;letter-spacing:.06em;text-shadow:0 0 14px #fffaf2">${esc(D.cta).split('\n').join('<br>')}</div></div>
 <div style="position:absolute;bottom:110px;left:50%;transform:translateX(-50%);white-space:nowrap;padding:10px 34px;border-radius:999px;background:rgba(255,251,244,.7);color:#7a5a2e;font-size:30px;letter-spacing:.3em">未來（みく）の霊視鑑定</div></body></html>`;}
(async()=>{if(D.items.length!==12)throw new Error('items は12件');for(const it of D.items)if(!SIGNS[it.sign])throw new Error('星座名が不正: '+it.sign);
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
 console.log(`look: 背景=${bgA}/${bgB}`);const pages=[page(0,bgA),page(6,bgB)];if(D.cta)pages.push(ctaPage());
 for(let i=0;i<pages.length;i++){await p.setContent(pages[i],{waitUntil:'load'});await p.waitForTimeout(150);const o=path.join(outDir,`${String(i+1).padStart(2,'0')}.png`);await p.screenshot({path:o});console.log(o);}
 await b.close();})();

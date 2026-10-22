// 一覧表タイプの投稿画像を作る: node table.js table.json outDir [seed]
// 出力: outDir/01.png（一覧表 1080x1920） / outDir/02.png（案内 1080x1920）
// 背景は ./bg の dark-*.jpg / light-*.jpg、顔イラストは ./face/ の画像（あれば）を使う
const fs=require('fs'),path=require('path');const{chromium}=require('playwright');
const[,,dataFile,outDir,seedArg]=process.argv;const D=JSON.parse(fs.readFileSync(dataFile,'utf8'));fs.mkdirSync(outDir,{recursive:true});
let seed=seedArg?[...seedArg].reduce((a,c)=>Math.imul(a^c.charCodeAt(0),16777619)>>>0,2166136261):Math.floor(Math.random()*4294967296);
const R=()=>{seed=(seed+0x6D2B79F5)>>>0;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};const pick=a=>a[Math.floor(R()*a.length)];
const esc=t=>String(t??'').replace(/&/g,'&amp;').replace(/</g,'&lt;');const br=t=>esc(t).split('\n').join('<br>');
const BG=path.join(__dirname,'bg'),FACE=path.join(__dirname,'face');
const files=fs.existsSync(BG)?fs.readdirSync(BG).filter(f=>f.endsWith('.jpg')).sort():[];
const dark=files.filter(f=>f.startsWith('dark-')),light=files.filter(f=>f.startsWith('light-'));
const uri=(dir,f)=>{const ext=path.extname(f).slice(1).toLowerCase();return `data:image/${ext==='jpg'?'jpeg':ext};base64,`+fs.readFileSync(path.join(dir,f)).toString('base64');};
const faceFiles=fs.existsSync(FACE)?fs.readdirSync(FACE).filter(f=>/\.(png|jpe?g|webp)$/i.test(f)).sort():[];
const THEMES=[
 {n:'紫',a:'#2a0f4a',b:'#4b1f7a',c:'#7a3fb0',pill:'linear-gradient(90deg,#3b1466,#6a2fa0,#3b1466)',row:'#fbf7ff',rowR:'#f3ecfb'},
 {n:'藍',a:'#0f1440',b:'#26307a',c:'#4f5fc0',pill:'linear-gradient(90deg,#17205c,#3a4aa8,#17205c)',row:'#f8f9ff',rowR:'#eceffb'},
 {n:'葡萄',a:'#33102e',b:'#5e1f55',c:'#9a4590',pill:'linear-gradient(90deg,#4a1442,#86357c,#4a1442)',row:'#fff7fb',rowR:'#f8eaf3'}];
const dayNo=seedArg&&/^\d{4}-\d{2}-\d{2}/.test(seedArg)?Math.floor(Date.parse(seedArg.slice(0,10))/864e5):null;
const faceFile=faceFiles.length?(dayNo!==null?faceFiles[Math.floor(dayNo/2)%faceFiles.length]:pick(faceFiles)):null; // 一覧表回(2日おき)ごとに順番に入れ替わる
const T=pick(THEMES),bgDark=dark.length?pick(dark):null,bgLight=light.length?pick(light):null,flip=R()<.5;
const BADGE=['#d23a6e','#7b45c4','#2f63c0','#2f8a4a','#cf7f12','#c23a8a','#3b8fa6','#8d5a2b'];
const bgDiv=(f,dir,extra='')=>f?`<div style="position:absolute;inset:0;background:url(${uri(BG,f)}) center/cover no-repeat;${dir?'transform:scaleX(-1);':''}${extra}"></div>`:'';
const stars=(()=>{let s='';for(let i=0;i<70;i++){const x=R()*1080,y=R()*1920,r=R()*2+.6;s+=`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#fff" opacity="${(R()*.6+.3).toFixed(2)}"/>`;}
 for(let i=0;i<9;i++){const x=R()*1080,y=R()*1920,k=.6+R()*1.2;s+=`<path d="M${x} ${y-16*k}L${x+4*k} ${y-4*k}L${x+16*k} ${y}L${x+4*k} ${y+4*k}L${x} ${y+16*k}L${x-4*k} ${y+4*k}L${x-16*k} ${y}L${x-4*k} ${y-4*k}Z" fill="#ffe7a6" opacity=".9"/>`;}
 return `<svg style="position:absolute;inset:0" width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;})();
const CSS=`*{margin:0;padding:0;box-sizing:border-box}body{width:1080px;height:1920px;overflow:hidden;position:relative;font-family:'Noto Serif CJK JP',serif;background:${T.a}}
.gold{background:linear-gradient(180deg,#fff6d6 0%,#f7d77e 38%,#d9a441 62%,#fbe7a2 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 3px 0 rgba(60,20,80,.85)) drop-shadow(0 0 14px rgba(0,0,0,.45))}
.emo{font-family:'Noto Color Emoji';line-height:1}`;
function portrait(){const sz=290;const inner=faceFile?`<div style="position:absolute;inset:0;background:url(${uri(FACE,faceFile)}) center top/cover no-repeat"></div>`:bgDiv(dark.find(f=>f.includes('moon'))||bgDark,false,'background-size:cover;background-position:50% 30%');
 return `<div style="position:absolute;top:64px;right:36px;width:${sz}px;height:${sz}px;border-radius:50%;overflow:hidden;border:6px solid #e9c46a;box-shadow:0 0 0 4px rgba(255,255,255,.35),0 0 40px rgba(255,214,120,.55)">${inner}</div>`;}
function header(){const t=D.title.split('\n');const last=t.pop();const nl=(D.num||'').length;const fs=Math.min(D.titleSize||94,Math.floor(680/Math.max(...t.map(x=>x.length),last.length+nl*1.2)));const ns=Math.round(fs*2);
 return `<div style="position:absolute;top:0;left:0;right:0;height:${D.layout==='grid'?600:560}px">
 ${portrait()}
 ${D.side?`<div style="position:absolute;top:340px;right:34px;transform:rotate(-6deg);background:#fffaf0;color:${T.b};border:3px solid #e9c46a;border-radius:22px;padding:12px 18px;font-size:26px;font-weight:700;line-height:1.35;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.3)">${br(D.side)}</div>`:''}
 <div style="position:absolute;top:58px;left:52px;transform:rotate(-4deg);background:#fffaf0;color:${T.b};font-size:34px;font-weight:700;padding:10px 30px;border-radius:999px;box-shadow:0 6px 18px rgba(0,0,0,.35);border:3px solid #e9c46a">${esc(D.catch)}</div>
 <div style="position:absolute;top:150px;left:44px;width:700px">
  ${t.map(l=>`<div class="gold" style="font-size:${fs}px;font-weight:900;line-height:1.12;letter-spacing:-.02em;white-space:nowrap">${esc(l)}</div>`).join('')}
  <div style="display:flex;align-items:flex-end;gap:10px"><div class="gold" style="font-size:${fs}px;font-weight:900;line-height:1.12;letter-spacing:-.02em;white-space:nowrap">${esc(last)}</div>${D.num?`<div class="gold" style="font-size:${ns}px;font-weight:900;line-height:.86;font-family:'Noto Serif CJK JP'">${esc(D.num)}</div>`:''}</div>
 </div>
 <div style="position:absolute;top:${D.layout==='grid'?505:470}px;left:40px;width:${D.side?640:1000}px;transform:rotate(-2deg);background:linear-gradient(90deg,#f7ecd2,#fffaf0,#f7ecd2);color:${T.a};font-size:${Math.min(32,Math.floor((D.side?590:950)/[...D.sub].length))}px;white-space:nowrap;font-weight:700;padding:12px 22px;border-radius:8px;text-align:center;box-shadow:0 6px 16px rgba(0,0,0,.35);border:2px solid #d9b25c">${esc(D.sub)}</div>
 </div>`;}
function rows(){const top=600,bottom=270,n=D.rows.length,h=1920-top-bottom-78;const rh=Math.min(96,Math.floor(h/n))-8;
 const head=`<div style="position:absolute;top:${top}px;left:28px;right:28px;display:flex;gap:44px">${[D.colL,D.colR].map(c=>`<div style="flex:1;background:${T.pill};color:#fff;font-size:30px;font-weight:700;text-align:center;padding:12px 0;border-radius:999px 999px 18px 18px;border:2px solid rgba(233,196,106,.7)">${esc(c)}</div>`).join('')}</div>`;
 const body=D.rows.map((r,i)=>`<div style="display:flex;align-items:center;height:${rh}px;margin-bottom:8px">
  <div style="flex:1;height:100%;display:flex;align-items:center;gap:12px;background:${T.row};border-radius:16px;padding:0 12px;box-shadow:0 3px 10px rgba(0,0,0,.25)">
   <div style="flex:none;width:30px;height:30px;border:3px solid ${T.c};border-radius:6px;background:#fff"></div>
   <div style="flex:none;width:${Math.min(56,rh-14)}px;height:${Math.min(56,rh-14)}px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff6,transparent 45%),${BADGE[i%BADGE.length]};color:#fff;font-size:${rh>70?32:26}px;font-weight:900;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">${i+1}</div>
   <div style="flex:1;color:#2b1840;font-size:${D.rowSize||27}px;font-weight:700;line-height:1.25">${br(r.l)}</div>
   <div class="emo" style="flex:none;font-size:${Math.min(46,rh-24)}px">${esc(r.li||'')}</div></div>
  <div style="flex:none;width:44px;text-align:center;color:#e9c46a;font-size:34px;text-shadow:0 0 8px rgba(0,0,0,.5)">➜</div>
  <div style="flex:1;height:100%;display:flex;align-items:center;gap:10px;background:${T.rowR};border-radius:16px;padding:0 16px;box-shadow:0 3px 10px rgba(0,0,0,.25)">
   ${D.checkR?`<div style="flex:none;width:30px;height:30px;border:3px solid ${T.c};border-radius:6px;background:#fff"></div>`:''}
   <div style="flex:1;color:${T.b};font-size:${D.rowSize||27}px;font-weight:700;line-height:1.25">${br(r.r)}</div>
   <div class="emo" style="flex:none;font-size:${Math.min(46,rh-24)}px">${esc(r.ri||'')}</div></div></div>`).join('');
 return head+`<div style="position:absolute;top:${top+78}px;left:28px;right:28px">${body}</div>`;}
function grid(){const top=640,bottom=270;const n=D.cards.length,cols=4,rowsN=Math.ceil(n/cols);const ch=Math.floor((1920-top-bottom-12*(rowsN-1))/rowsN);
 const cards=D.cards.map((c,i)=>`<div style="background:linear-gradient(180deg,#fffdf8,#f8f1ff);border-radius:22px;padding:16px 12px 14px;height:${ch}px;display:flex;flex-direction:column;align-items:center;box-shadow:0 6px 16px rgba(0,0,0,.3);border:2px solid rgba(233,196,106,.6)">
  <div style="display:flex;align-items:center;gap:10px;width:100%"><div style="flex:none;width:46px;height:46px;border-radius:50%;background:${BADGE[i%BADGE.length]};color:#fff;font-size:26px;font-weight:900;display:flex;align-items:center;justify-content:center">${i+1}</div><div style="flex:1;text-align:center;color:#2b1840;font-size:${c.head.length>2?44:66}px;font-weight:900;line-height:1">${esc(c.head)}</div></div>
  ${c.sub?`<div style="color:#5a4670;font-size:24px;font-weight:700;margin-top:6px">${esc(c.sub)}</div>`:''}
  <div style="margin-top:8px;background:${BADGE[i%BADGE.length]}22;color:${BADGE[i%BADGE.length]};font-size:24px;font-weight:900;padding:5px 14px;border-radius:999px;white-space:nowrap">${esc(c.key)}</div>
  <div class="emo" style="font-size:86px;margin:14px 0 10px">${esc(c.icon||'')}</div>
  <div style="align-self:stretch;color:#2b1840;font-size:21px;font-weight:700;line-height:1.5">${(c.points||[]).map(p=>`<div>・${esc(p)}</div>`).join('')}</div>
  <div style="margin-top:auto;align-self:stretch;text-align:center"><div style="display:inline-block;background:${T.c};color:#fff;font-size:18px;font-weight:700;padding:2px 14px;border-radius:999px;margin-bottom:-6px;position:relative">${esc(D.tipLabel||'ひとこと')}</div>
   <div style="background:#fff7e6;border:2px solid #e9c46a;border-radius:12px;padding:12px 6px 8px;color:#3a2350;font-size:21px;font-weight:700;line-height:1.35">${br(c.tip)}</div></div></div>`).join('');
 return `<div style="position:absolute;top:${top}px;left:24px;right:24px;display:grid;grid-template-columns:repeat(${cols},1fr);gap:12px">${cards}</div>`;}
function footer(){return `<div style="position:absolute;left:0;right:0;bottom:0;height:262px;background:linear-gradient(180deg,rgba(0,0,0,0),${T.a} 22%,${T.b});border-top:3px solid rgba(233,196,106,.65)">
 <div style="text-align:center;color:#f6e7c1;font-size:30px;font-weight:700;margin-top:18px;letter-spacing:.06em">${esc(D.footSmall)}</div>
 <div class="gold" style="text-align:center;font-size:${Math.min(66,Math.floor(940/[...D.footBig].length))}px;font-weight:900;line-height:1.15;margin-top:0">${esc(D.footBig)}</div>
 <div style="display:flex;justify-content:center;gap:22px;margin-top:10px">${(D.btns||['保存して見返してね','毎日12時に投稿中']).map(b=>`<div style="border:3px solid #e9c46a;color:#fff6dc;background:rgba(255,255,255,.08);font-size:26px;font-weight:700;padding:8px 28px;border-radius:999px">${esc(b)}</div>`).join('')}</div>
 <div style="text-align:center;color:#e9c46a;font-size:22px;letter-spacing:.3em;margin-top:8px">未來（みく）の霊視鑑定</div></div>`;}
function tablePage(){return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
 ${bgDiv(bgDark,flip)}<div style="position:absolute;inset:0;background:linear-gradient(180deg,${T.a}cc 0%,${T.b}b3 35%,${T.a}d9 100%)"></div>${stars}
 <div style="position:absolute;inset:12px;border:3px solid rgba(233,196,106,.55);border-radius:28px"></div>
 ${header()}${D.layout==='grid'?grid():rows()}${footer()}</body></html>`;}
function ctaPage(){return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
 ${bgDiv(bgLight,!flip)}<div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 45% at 50% 50%,rgba(255,251,244,.9),rgba(255,251,244,.55) 65%,rgba(255,251,244,.15))"></div>
 <div style="position:absolute;inset:40px;border:2px solid #b0823a;opacity:.6;border-radius:8px"></div>
 <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 110px">
  <div style="color:#b0823a;font-size:46px;letter-spacing:30px;margin-bottom:46px">✦ ✧ ✦</div>
  <div style="color:#4f3a28;font-size:58px;font-weight:500;line-height:1.95;letter-spacing:.06em;text-shadow:0 0 14px #fffaf2">${br(D.cta)}</div>
  <div style="width:220px;height:2px;margin-top:56px;background:linear-gradient(90deg,transparent,#b0823a,transparent)"></div></div>
 <div style="position:absolute;bottom:110px;left:50%;transform:translateX(-50%);white-space:nowrap;padding:10px 34px;border-radius:999px;background:rgba(255,251,244,.75);color:#7a5a2e;font-size:30px;letter-spacing:.3em">未來（みく）の霊視鑑定</div></body></html>`;}
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
 console.log(`look: 色=${T.n} 背景=${bgDark}/${bgLight} 顔=${faceFile||'なし(月の写真)'}`);
 const pages=[tablePage()];if(D.cta)pages.push(ctaPage());
 for(let i=0;i<pages.length;i++){await p.setContent(pages[i],{waitUntil:'load'});await p.waitForTimeout(150);const o=path.join(outDir,`${String(i+1).padStart(2,'0')}.png`);await p.screenshot({path:o});console.log(o);}
 await b.close();})();

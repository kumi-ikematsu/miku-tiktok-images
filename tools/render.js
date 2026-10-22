// node render.js post.json outDir [seed]
// bg: night | silk | day(明るい朝・昼の回) / kind: cover | body | cta | list(day専用: □で始まる行がチェック項目) / tag: day専用の見出しラベル(任意)
const fs=require('fs'),path=require('path');const{chromium}=require('playwright');
const[,,postFile,outDir,seedArg]=process.argv;const post=JSON.parse(fs.readFileSync(postFile,'utf8'));fs.mkdirSync(outDir,{recursive:true});
let seed=seedArg?[...seedArg].reduce((a,c)=>Math.imul(a^c.charCodeAt(0),16777619)>>>0,2166136261):Math.floor(Math.random()*4294967296);
const R=()=>{seed=(seed+0x6D2B79F5)>>>0;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};const pick=a=>a[Math.floor(R()*a.length)];
const NIGHT=[
 {n:'紺',sky:['#030719','#0c1736','#2b2a4a'],glow:'#c79a5c',acc:'#e9cf8f'},
 {n:'紫',sky:['#0b0618','#24123f','#4a2a5e'],glow:'#d59ab8',acc:'#efc9e0'},
 {n:'青緑',sky:['#021014','#0a2a33','#1d4650'],glow:'#9fd0c8',acc:'#cfe9df'},
 {n:'藍金',sky:['#05060f','#111a3a','#3a2f4a'],glow:'#e0a860',acc:'#f0d38f'},
 {n:'薔薇',sky:['#0d0712','#2a1030','#5a2840'],glow:'#e7a08a',acc:'#f3c7b4'}];
const SILK=[
 {n:'アイボリー',base:['#fdfaf5','#f3ebe0','#e9dfd1'],fold:'#d9cbb7',ink:'#5b4630',acc:'#b8935a'},
 {n:'桜',base:['#fff8f8','#f8e6e8','#efd3d8'],fold:'#e2b8c0',ink:'#6a3e4a',acc:'#c98a98'},
 {n:'シャンパン',base:['#fffaf0','#f5e9d2','#e8d6b4'],fold:'#d8bf90',ink:'#5a4320',acc:'#b88a3e'},
 {n:'ラベンダー',base:['#fbf9ff','#ece6f6','#ddd3ee'],fold:'#c4b6dc',ink:'#4a3d66',acc:'#9a86c4'},
 {n:'ミント',base:['#f9fdfb','#e6f2ec','#d4e8de'],fold:'#b4d2c4',ink:'#2f5246',acc:'#7fae9c'}];
const L={night:pick(NIGHT),silk:pick(SILK),
 moon:pick(['full','crescent','crescentL']),moonX:pick([230,540,850]),moonY:pick([200,250,300]),
 mw:pick([1,-1,0]),crystal:pick(['right','left','none','pair']),flower:R()<.5,
 frame:pick(['single','double','corner']),spark:pick(['✦ ✧ ✦','✧ ✦ ✧','☽ ✦ ☾','✦','⋆ ✦ ⋆']),
 shoot:R()<.5,silkDir:pick([1,-1])};
const starsSeed=Math.floor(R()*1e9);
const DAY=[
 {n:'朝焼け',sky:['#ffcfb8','#ffe4d0','#fff8ee'],sun:'#ffc98a',ink:'#5a3b2e',acc:'#e0866a',fl:['#f6a7a0','#ffd2a8','#fff']},
 {n:'青空',sky:['#9fcff3','#cfe9fb','#f5fbff'],sun:'#fff1b8',ink:'#2b4862',acc:'#4b8fc4',fl:['#ffffff','#ffd9e4','#fff1a8']},
 {n:'若葉',sky:['#c6ebd5','#e3f5e8','#fbfff7'],sun:'#fff0b0',ink:'#2e563e',acc:'#5aa577',fl:['#ffffff','#ffe39a','#f7c6d4']},
 {n:'桜朝',sky:['#ffcfdc','#ffe6ee','#fff9f5'],sun:'#ffe2b0',ink:'#683848',acc:'#df839d',fl:['#ffffff','#ffc0d0','#ffe6a8']},
 {n:'レモン',sky:['#ffe49a','#fff1c8','#fffdf2'],sun:'#fff7d6',ink:'#594617',acc:'#d79a22',fl:['#ffffff','#ffd0b0','#c9e8b4']}];
const D2={day:pick(DAY),sunX:pick([170,910]),cloudSeed:Math.floor(R()*1e9),flowers:pick(['both','left','right'])};
function svgUrl(s){return `url("data:image/svg+xml;base64,${Buffer.from(s).toString('base64')}") center/cover`;}
function crystal(x,y,sc,fillId,glow){return `<g transform="translate(${x} ${y}) scale(${sc})"><ellipse cx="0" cy="130" rx="120" ry="18" fill="${glow}" opacity=".28" filter="url(#g)"/>
<polygon points="0,-60 52,0 34,120 -34,120 -52,0" fill="url(#${fillId})" opacity=".88"/><polygon points="0,-60 52,0 0,25 -52,0" fill="#fff" opacity=".6"/>
<polygon points="0,25 34,120 -34,120" fill="${glow}" opacity=".3"/><line x1="0" y1="25" x2="0" y2="120" stroke="#fff" stroke-opacity=".6"/></g>`;}
function crystals(glow,fill,baseY){const c=L.crystal;if(c==='none')return'';if(c==='left')return crystal(200,baseY,.85,fill,glow);
 if(c==='pair')return crystal(870,baseY,.85,fill,glow)+crystal(780,baseY+40,.55,fill,glow);return crystal(880,baseY,.85,fill,glow);}
function moon(){const{moonX:x,moonY:y}=L;const halo=`<circle cx="${x}" cy="${y}" r="${L.moon==='full'?230:180}" fill="url(#halo)"/>`;
 if(L.moon==='full')return halo+`<circle cx="${x}" cy="${y}" r="78" fill="url(#moon)"/><circle cx="${x-25}" cy="${y-15}" r="14" fill="#000" opacity=".08"/><circle cx="${x+22}" cy="${y+25}" r="9" fill="#000" opacity=".07"/>`;
 const dx=L.moon==='crescent'?34:-34;
 return halo+`<mask id="mm"><rect width="1080" height="1440" fill="#fff"/><circle cx="${x+dx}" cy="${y-20}" r="68" fill="#000"/></mask><circle cx="${x}" cy="${y}" r="78" fill="url(#moon)" mask="url(#mm)"/>`;}
function nightSvg(){let s=starsSeed;const r=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};const P=L.night;let st='';
 for(let i=0;i<260;i++)st+=`<circle cx="${r()*1080}" cy="${r()*1050}" r="${r()*1.8+.3}" fill="#fff" opacity="${(r()*.7+.25).toFixed(2)}"/>`;
 for(let i=0;i<10;i++)st+=`<circle cx="${r()*1080}" cy="${r()*900}" r="3.2" fill="#fff" filter="url(#g)"/>`;
 const mw=L.mw===0?'':`<path d="${L.mw>0?'M-100 1000 C 300 700, 600 400, 1200 -50 L 1200 250 C 700 600, 300 900, -100 1250Z':'M1180 1000 C 780 700, 480 400, -120 -50 L -120 250 C 380 600, 780 900, 1180 1250Z'}" fill="url(#mw)" filter="url(#b)"/>`;
 const shoot=L.shoot?`<line x1="${L.moonX<540?700:120}" y1="140" x2="${L.moonX<540?900:300}" y2="60" stroke="url(#sh)" stroke-width="3"/>`:'';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 1080 1440"><defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky[0]}"/><stop offset=".55" stop-color="${P.sky[1]}"/><stop offset=".8" stop-color="${P.sky[2]}"/><stop offset=".835" stop-color="${P.glow}"/><stop offset=".85" stop-color="${P.sky[2]}"/><stop offset="1" stop-color="${P.sky[0]}"/></linearGradient>
<radialGradient id="moon" cx=".45" cy=".42"><stop offset="0" stop-color="#fff9e6"/><stop offset=".7" stop-color="#f3dda3"/><stop offset="1" stop-color="#d9b874"/></radialGradient>
<radialGradient id="halo"><stop offset="0" stop-color="#ffe7a8" stop-opacity=".5"/><stop offset="1" stop-color="#ffe7a8" stop-opacity="0"/></radialGradient>
<radialGradient id="hz"><stop offset="0" stop-color="${P.glow}" stop-opacity=".85"/><stop offset="1" stop-color="${P.glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="mw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fa0ff" stop-opacity="0"/><stop offset=".5" stop-color="#d8d0ff" stop-opacity=".22"/><stop offset="1" stop-color="#8fa0ff" stop-opacity="0"/></linearGradient>
<linearGradient id="sh" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient>
<linearGradient id="cr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".5" stop-color="#bcd2ff" stop-opacity=".55"/><stop offset="1" stop-color="${P.glow}" stop-opacity=".85"/></linearGradient>
<filter id="g"><feGaussianBlur stdDeviation="3"/></filter><filter id="b"><feGaussianBlur stdDeviation="40"/></filter></defs>
<rect width="1080" height="1440" fill="url(#sky)"/>${mw}${st}${shoot}${moon()}
<ellipse cx="540" cy="1205" rx="620" ry="60" fill="url(#hz)" filter="url(#b)"/>
${Array.from({length:22},(_,i)=>`<rect x="${(L.moonX-70)+Math.sin(i*1.7)*60}" y="${1222+i*9}" width="${140-i*4}" height="3" fill="${P.glow}" opacity="${(.6-i*.025).toFixed(2)}"/>`).join('')}
${crystals(P.glow,'cr',1215)}</svg>`;}
function silkSvg(){let s=starsSeed+1;const r=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};const P=L.silk,d=L.silkDir;
 const fx=p=>d>0?p:p.replace(/(-?\d+) (-?\d+)/g,(m,x,y)=>`${1080-x} ${y}`);
 const petals=L.flower?Array.from({length:9},()=>{const x=r()*1080,y=r()*1440,a=r()*360;return `<ellipse cx="${x}" cy="${y}" rx="16" ry="9" transform="rotate(${a} ${x} ${y})" fill="${P.fold}" opacity=".55"/>`;}).join(''):'';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 1080 1440"><defs>
<linearGradient id="base" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P.base[0]}"/><stop offset=".5" stop-color="${P.base[1]}"/><stop offset="1" stop-color="${P.base[2]}"/></linearGradient>
<linearGradient id="f1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="f2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${P.fold}" stop-opacity="0"/><stop offset=".5" stop-color="${P.fold}" stop-opacity=".55"/><stop offset="1" stop-color="${P.fold}" stop-opacity="0"/></linearGradient>
<linearGradient id="cs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#eef0f6"/><stop offset="1" stop-color="${P.fold}"/></linearGradient>
<filter id="b"><feGaussianBlur stdDeviation="28"/></filter><filter id="g"><feGaussianBlur stdDeviation="4"/></filter></defs>
<rect width="1080" height="1440" fill="url(#base)"/><g filter="url(#b)">
<path d="${fx('M-200 1050 C 200 900, 500 1250, 1300 980 L1300 1120 C 600 1350, 250 1000, -200 1200Z')}" fill="url(#f2)"/>
<path d="${fx('M-200 1000 C 250 860, 520 1180, 1300 930 L1300 990 C 560 1220, 250 900, -200 1060Z')}" fill="url(#f1)"/>
<path d="${fx('M-200 220 C 300 80, 650 380, 1300 150 L1300 300 C 650 500, 300 220, -200 380Z')}" fill="url(#f2)" opacity=".7"/>
<path d="${fx('M-200 180 C 300 40, 650 330, 1300 110 L1300 170 C 650 390, 300 110, -200 240Z')}" fill="url(#f1)"/>
<path d="M-200 1250 C 300 1150, 700 1420, 1300 1230 L1300 1440 L-200 1440Z" fill="url(#f2)" opacity=".8"/></g>${petals}
${Array.from({length:18},()=>`<circle cx="${r()*1080}" cy="${r()*1440}" r="${(r()*2.5+1).toFixed(1)}" fill="${P.acc}" opacity="${(r()*.5+.3).toFixed(2)}" filter="url(#g)"/>`).join('')}
${crystals(P.fold,'cs',1200)}</svg>`;}
function frame(acc){if(L.frame==='double')return `<div style="position:absolute;inset:40px;border:2px solid ${acc};opacity:.55"></div><div style="position:absolute;inset:54px;border:1px solid ${acc};opacity:.45"></div>`;
 if(L.frame==='corner'){const c=(t,l,b)=>`<div style="position:absolute;${t};${l};width:120px;height:120px;border-${b}:3px solid ${acc};opacity:.7"></div>`;
  return [c('top:50px','left:50px','top'),c('top:50px','left:50px','left'),c('top:50px','right:50px','top'),c('top:50px','right:50px','right'),c('bottom:50px','left:50px','bottom'),c('bottom:50px','left:50px','left'),c('bottom:50px','right:50px','bottom'),c('bottom:50px','right:50px','right')].join('');}
 return `<div style="position:absolute;inset:44px;border:2px solid ${acc};opacity:.55;border-radius:6px"></div>`;}
const esc=t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;');

function daySvg(){let s=D2.cloudSeed;const r=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};const P=D2.day,sx=D2.sunX;
 const cloud=(x,y,k)=>`<g opacity=".9" filter="url(#sf)">${[[0,0,70],[60,-30,80],[130,-5,70],[190,10,55],[-50,15,50]].map(([dx,dy,rr])=>`<circle cx="${x+dx*k}" cy="${y+dy*k}" r="${rr*k}" fill="#fff"/>`).join('')}<rect x="${x-50*k}" y="${y}" width="${245*k}" height="${55*k}" rx="${27*k}" fill="#fff"/></g>`;
 const clouds=[cloud(sx<540?620:140,230,.9),cloud(sx<540?80:700,560,.6),cloud(sx<540?760:60,1010,.75)].join('');
 const rays=Array.from({length:12},(_,i)=>{const a=i*30*Math.PI/180;return `<line x1="${sx+Math.cos(a)*120}" y1="${150+Math.sin(a)*120}" x2="${sx+Math.cos(a)*190}" y2="${150+Math.sin(a)*190}" stroke="${P.sun}" stroke-width="8" stroke-linecap="round" opacity=".8"/>`;}).join('');
 const flower=(x,y,k,c)=>`<g transform="translate(${x} ${y}) scale(${k})">${[0,72,144,216,288].map(a=>`<ellipse cx="0" cy="-26" rx="17" ry="26" fill="${c}" transform="rotate(${a})" opacity=".95"/>`).join('')}<circle r="13" fill="${P.sun}"/><circle r="13" fill="${P.acc}" opacity=".35"/></g>`;
 let fl='';const side=D2.flowers;
 for(let i=0;i<7;i++){const left=side==='left'||(side==='both'&&i%2==0);const x=left?40+r()*230:810+r()*230;const y=1180+r()*230;fl+=flower(x,y,.7+r()*.6,P.fl[i%3]);}
 for(let i=0;i<5;i++){const x=r()*1080,y=1300+r()*140;fl+=`<ellipse cx="${x}" cy="${y}" rx="40" ry="14" fill="${P.acc}" opacity=".18" transform="rotate(${-20+r()*40} ${x} ${y})"/>`;}
 const sp=Array.from({length:16},()=>{const x=r()*1080,y=r()*1100,k=.5+r()*.8;return `<path d="M${x} ${y-14*k} L${x+4*k} ${y-4*k} L${x+14*k} ${y} L${x+4*k} ${y+4*k} L${x} ${y+14*k} L${x-4*k} ${y+4*k} L${x-14*k} ${y} L${x-4*k} ${y-4*k}Z" fill="#fff" opacity="${(.5+r()*.5).toFixed(2)}"/>`;}).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 1080 1440"><defs>
<linearGradient id="ds" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky[0]}"/><stop offset=".55" stop-color="${P.sky[1]}"/><stop offset="1" stop-color="${P.sky[2]}"/></linearGradient>
<radialGradient id="sg"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="${P.sun}" stop-opacity=".7"/><stop offset="1" stop-color="${P.sun}" stop-opacity="0"/></radialGradient>
<filter id="sf"><feGaussianBlur stdDeviation="2"/></filter></defs>
<rect width="1080" height="1440" fill="url(#ds)"/><circle cx="${sx}" cy="150" r="330" fill="url(#sg)"/>${rays}<circle cx="${sx}" cy="150" r="88" fill="#fff" opacity=".9"/><circle cx="${sx}" cy="150" r="88" fill="${P.sun}" opacity=".55"/>
${clouds}${sp}${fl}</svg>`;}
function dayHtml(s){const P=D2.day;const k=s.kind;
 const size=k==='cover'?86:k==='cta'?54:k==='list'?46:50;const weight=k==='cover'?900:k==='cta'?700:500;
 let body;
 if(k==='list'){body=esc(s.text).split('\n').map(l=>l.trim()===''?'<div style="height:26px"></div>':l.startsWith('□')?`<div class="li"><span class="bx"></span><span>${l.slice(1).trim()}</span></div>`:`<div class="lh">${l}</div>`).join('');}
 else body=`<div class="t">${esc(s.text).split('\n').join('<br>')}</div>`;
 const tag=s.tag?`<div class="tag">${esc(s.tag)}</div>`:'';
 return `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1440px;overflow:hidden;font-family:'Noto Sans CJK JP',sans-serif;position:relative}
.bg{position:absolute;inset:0;background:${svgUrl(daySvg())}}
.wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.card{width:880px;background:rgba(255,255,255,.8);border-radius:56px;padding:${k==='cover'?'84px 50px 90px':'74px 56px 80px'};box-shadow:0 18px 50px rgba(0,0,0,.08);display:flex;flex-direction:column;align-items:center;border:3px solid rgba(255,255,255,.9)}
.tag{background:${P.acc};color:#fff;font-size:36px;font-weight:700;letter-spacing:.12em;padding:12px 40px;border-radius:999px;margin-bottom:${k==='cover'?54:40}px}
.t{color:${P.ink};font-size:${size}px;font-weight:${weight};line-height:${k==='cover'?1.45:1.8};letter-spacing:.04em;text-align:center}
.li{display:flex;align-items:center;gap:26px;color:${P.ink};font-size:${size}px;font-weight:500;line-height:1.5;margin:14px 0;letter-spacing:.03em;width:100%}
.lh{color:${P.ink};font-size:${size}px;font-weight:700;line-height:1.6;text-align:center;width:100%}
.bx{flex:none;width:46px;height:46px;border:5px solid ${P.acc};border-radius:12px;background:#fff}
.dots{margin-top:${k==='cover'?50:40}px;display:flex;gap:18px}.dots i{width:16px;height:16px;border-radius:50%;background:${P.acc};opacity:.55}.dots i:nth-child(2){opacity:.9}
.sign{position:absolute;bottom:70px;width:100%;text-align:center;color:${P.ink};opacity:.75;font-size:30px;font-weight:500;letter-spacing:.25em}
</style></head><body><div class="bg"></div><div class="wrap"><div class="card">${tag}<div style="width:100%;display:flex;flex-direction:column;align-items:${k==='list'?'flex-start':'center'}">${body}</div><div class="dots"><i></i><i></i><i></i></div></div></div>
<div class="sign">未來（みく）の霊視鑑定</div></body></html>`;}
function html(s){if(s.bg==='day')return dayHtml(s);const dark=s.bg==='night';const ink=dark?'#fbf6ea':L.silk.ink;const acc=dark?L.night.acc:L.silk.acc;
 const lines=esc(s.text).split('\n').join('<br>');const size=s.kind==='cover'?92:s.kind==='cta'?58:50;const weight=s.kind==='cover'?700:500;
 return `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1440px;overflow:hidden;font-family:'Noto Serif CJK JP',serif;position:relative}
.bg{position:absolute;inset:0;background:${svgUrl(dark?nightSvg():silkSvg())}}
.veil{position:absolute;inset:0;background:${dark?'radial-gradient(ellipse at 50% 46%, rgba(5,8,25,.55), rgba(5,8,25,.12) 70%)':'radial-gradient(ellipse at 50% 46%, rgba(255,253,250,.74), rgba(255,253,250,.2) 70%)'}}
.wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 110px;text-align:center}
.spark{color:${acc};font-size:46px;margin-bottom:46px;letter-spacing:30px}
.t{color:${ink};font-size:${size}px;font-weight:${weight};line-height:${s.kind==='cover'?1.55:1.95};letter-spacing:.06em;text-shadow:${dark?'0 2px 18px rgba(0,0,0,.6)':'0 1px 10px rgba(255,255,255,.9)'}}
.line{width:220px;height:2px;margin-top:56px;background:linear-gradient(90deg,transparent,${acc},transparent)}
.sign{position:absolute;bottom:92px;width:100%;text-align:center;color:${acc};font-size:30px;letter-spacing:.3em}
</style></head><body><div class="bg"></div><div class="veil"></div>${frame(acc)}
<div class="wrap"><div class="spark">${L.spark}</div><div class="t">${lines}</div><div class="line"></div></div>
<div class="sign">未來（みく）の霊視鑑定</div></body></html>`;}
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1440}});
 console.log(`look: 夜空=${L.night.n} 白系=${L.silk.n} 月=${L.moon} 枠=${L.frame} 昼=${D2.day.n}`);
 for(let i=0;i<post.slides.length;i++){await p.setContent(html(post.slides[i]),{waitUntil:'load'});const o=path.join(outDir,`${String(i+1).padStart(2,'0')}.png`);await p.screenshot({path:o});console.log(o);}
 await b.close();})();

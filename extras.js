document.head.insertAdjacentHTML("beforeend",`<style>
.dots{display:flex;gap:14px;justify-content:center;margin:22px 0}
.dots i{width:18px;height:18px;border-radius:50%;border:2px solid var(--grape)}
.dots i.on{background:var(--grape)}
.keys{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:300px;margin:0 auto}
.keys button{height:68px;border-radius:20px;border:0;background:#fff;color:var(--grape);font-size:26px;font-weight:800;box-shadow:0 4px 12px #4a23701a}
.keys button:active{transform:scale(.95)}
#rview{position:fixed;top:0;left:0;right:0;bottom:0;z-index:50;background:#E9E4F0;overflow:auto;padding:12px}
#rview img{display:block;width:100%;max-width:520px;margin:0 auto}
#rview button{position:sticky;top:0;display:block;margin:0 0 10px auto;min-height:48px;padding:0 24px;border:0;border-radius:16px;background:#4A2370;color:#fff;font-size:16px;font-weight:800;z-index:2}
.stat{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
.stat .card{margin:0}
</style>`);
let vault={ok:false,t:0,buf:"",step:"enter",first:"",tries:0,lock:0,tab:"today",msg:"",next:null};
tabs[4]=["vault","🔐","Vault"];
/* ---------- Owner mode: buying prices and profit are hidden from workers ---------- */
let own={until:0};
const hasPin=()=>!!DB.get("vaultpin",null);
const isOwner=()=>!hasPin()||Date.now()<own.until;
const ownerOn=()=>{own.until=Date.now()+10*60000};
const _go=go;
go=function(t){if(t!=="vault"){vault.ok=false;vault.next=null}_go(t)};
const _render=render;
render=function(){
if(own.until&&Date.now()<own.until)own.until=Date.now()+10*60000;
_render();
const b=document.querySelector(".brand");if(b)b.textContent="ShopRoot"+(hasPin()&&!isOwner()?" 🔒":"");
};
function unlockThen(n){vault.next=n;go("vault")}
function lockOwner(){own.until=0;vault.ok=false;render()}
function lockedCard(name,key){return `<h1>${name}</h1><div class="card"><b>🔒 Owner only</b><p class="sub">Enter the owner PIN to open ${name.toLowerCase()}.</p><button class="btn green" onclick="unlockThen('${key}')">Enter PIN</button></div>`}
const _stk3=screens.stock;
function workerStock(){
const list=items(),low=list.filter(isLow);
const head=`<h1>Stock</h1><div class="chips"><span class="chip">${list.length} items</span>${low.length?`<span class="chip red">${low.length} running low</span>`:""}</div><p class="sub">Only the owner can add items or change prices.</p>`;
if(!list.length)return head+`<div class="card"><p class="sub" style="margin:0">No items yet.</p></div><button class="btn sm ghost" onclick="unlockThen('stock')">Owner? Enter PIN</button>`;
return head+list.map(i=>{const tag=isLow(i)?`<span class="badge">${i.stock<=0?"Out":"Low"}</span>`:"";return `<div class="card"><div class="it"><button class="nm" onclick="itemHistory('${i.id}')">${esc(i.name)}${tag}</button><span class="big">${fmt(i,i.stock)}</span></div><div class="row"><button class="btn sm" onclick="moveForm('${i.id}','restock')">Restock</button><button class="btn sm ghost" onclick="moveForm('${i.id}','waste')">Waste</button></div></div>`}).join("")+`<button class="btn sm ghost" onclick="unlockThen('stock')">Owner? Enter PIN</button>`;
}
screens.stock=()=>isOwner()?_stk3():workerStock();

/* ---------- Settings: shop details, bank accounts, switches ---------- */
const BANKS=["Access Bank","GTBank","First Bank","UBA","Zenith Bank","Opay","Moniepoint","PalmPay","Kuda","Wema Bank","Sterling Bank","Fidelity Bank","Union Bank","Stanbic IBTC","FCMB","Polaris Bank","Ecobank","Keystone Bank","Providus Bank","Other"];
screens.settings=()=>{
const si=DB.get("shopinfo",{}),banks=DB.get("banks",[]);
const on=k=>store.get(k,"on")==="on";
const foot=si.footer==null?"Thank you for your patronage":si.footer;
return `<h1>Settings</h1>
<div class="card"><b>Shop details (shown on receipts)</b>
<label>Shop name</label><input id="sn" value="${esc(shop())}">
<label>Address</label><input id="sa" value="${esc(si.address||"")}" placeholder="e.g. 12 Market Road, Ikeja">
<label>Phone number</label><input id="sp" type="tel" inputmode="tel" value="${esc(si.phone||"")}" placeholder="e.g. 0803 000 0000">
<label>Message at the bottom of the receipt</label><input id="sf" value="${esc(foot)}">
<button class="btn green" onclick="saveShopInfo()">Save</button></div>
<div class="card"><b>Bank accounts for transfer</b>`+(banks.length?banks.map(a=>`<div class="bank"><div class="small">${esc(a.bank)}</div><div class="acct">${esc(a.number)}</div><div style="font-weight:700">${esc(a.name)}</div><button class="btn sm redline" style="margin-top:10px" onclick="delBank('${a.id}')">Remove</button></div>`).join(""):`<p class="sub">No account saved yet. Save it once and it will show when a customer pays by transfer.</p>`)+`<button class="btn" onclick="bankForm()">+ Add bank account</button></div>
<div class="card"><b>Payment sound</b><button class="btn ${on("sound")?"green":"ghost"}" onclick="toggleSet('sound')">${on("sound")?"Sound is ON":"Sound is OFF"}</button></div>
<div class="card"><b>Success animation</b><button class="btn ${on("anim")?"green":"ghost"}" onclick="toggleSet('anim')">${on("anim")?"Animation is ON":"Animation is OFF"}</button></div>`;
};
const _settingsFull=screens.settings;
screens.settings=()=>isOwner()?_settingsFull():lockedCard("Settings","settings");
function toggleSet(k){store.set(k,store.get(k,"on")==="on"?"off":"on");render()}
function saveShopInfo(){
store.set("shopName",$("#sn").value.trim()||"My Shop");
DB.set("shopinfo",{address:$("#sa").value.trim(),phone:$("#sp").value.trim(),footer:$("#sf").value.trim()});
toast("Saved");render();
}
function bankForm(){
sheet(`<h1>Add bank account</h1><label>Bank (tap one)</label>${pills("b_bank",BANKS,"")}
<label>Account number</label><input id="b_num" type="tel" inputmode="numeric" maxlength="10" placeholder="10 digits">
<label>Account name</label><input id="b_name" placeholder="Name on the account">
<button class="btn green" onclick="saveBank()">Save account</button><div class="gap"></div><button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
}
function saveBank(){
const bank=pillVal("b_bank"),num=$("#b_num").value.replace(/\s/g,""),name=$("#b_name").value.trim();
if(!bank)return toast("Please tap your bank");
if(!/^\d{10}$/.test(num))return toast("Account number must be 10 digits");
if(!name)return toast("Please type the account name");
const b=DB.get("banks",[]);b.push({id:DB.id(),bank,number:num,name});DB.set("banks",b);
toast("Account saved");render();
}
function delBank(id){
sheet(`<h1>Remove this account?</h1><p class="sub">It will no longer show when customers pay by transfer.</p><button class="btn red" onclick="doDelBank('${id}')">Yes, remove</button><div class="gap"></div><button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
}
function doDelBank(id){DB.set("banks",DB.get("banks",[]).filter(x=>x.id!==id));toast("Removed");render()}

/* ---------- QR code (small built-in encoder, level M, versions 1-6) ---------- */
const QR=(()=>{
const EXP=new Array(512),LOG=new Array(256);
(()=>{let x=1;for(let i=0;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&256)x^=0x11d}for(let i=255;i<512;i++)EXP[i]=EXP[i-255]})();
const mul=(a,b)=>a&&b?EXP[LOG[a]+LOG[b]]:0;
function rsEnc(data,n){
let g=[1];
for(let i=0;i<n;i++){const ng=new Array(g.length+1).fill(0);for(let j=0;j<g.length;j++){ng[j]^=g[j];ng[j+1]^=mul(g[j],EXP[i])}g=ng}
const res=new Array(n).fill(0);
for(const b of data){const f=b^res.shift();res.push(0);for(let i=0;i<n;i++)res[i]^=mul(g[i+1],f)}
return res;
}
const T={1:{dc:16,ec:10,b:[16]},2:{dc:28,ec:16,b:[28]},3:{dc:44,ec:26,b:[44]},4:{dc:64,ec:18,b:[32,32]},5:{dc:86,ec:24,b:[43,43]},6:{dc:108,ec:16,b:[27,27,27,27]}};
const AL={1:[],2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34]};
const MASKS=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
function make(text){
const bytes=Array.from(new TextEncoder().encode(text));
let v=0;
for(let k=1;k<=6;k++){if(12+bytes.length*8<=T[k].dc*8){v=k;break}}
if(!v)return null;
const t=T[v],n=17+4*v;
let bits=[];
const put=(val,len)=>{for(let i=len-1;i>=0;i--)bits.push((val>>>i)&1)};
put(4,4);put(bytes.length,8);bytes.forEach(b=>put(b,8));
put(0,Math.min(4,t.dc*8-bits.length));
while(bits.length%8)bits.push(0);
const data=[];for(let i=0;i<bits.length;i+=8){let b=0;for(let j=0;j<8;j++)b=(b<<1)|bits[i+j];data.push(b)}
for(let p=0;data.length<t.dc;p++)data.push(p%2?0x11:0xEC);
const blocks=[];let pos=0;
for(const len of t.b){blocks.push(data.slice(pos,pos+len));pos+=len}
const ecs=blocks.map(b=>rsEnc(b,t.ec));
const out=[];
for(let i=0;i<Math.max(...t.b);i++)blocks.forEach(b=>{if(i<b.length)out.push(b[i])});
for(let i=0;i<t.ec;i++)ecs.forEach(e=>out.push(e[i]));
const stream=[];out.forEach(b=>{for(let i=7;i>=0;i--)stream.push((b>>>i)&1)});
if(v>1)for(let i=0;i<7;i++)stream.push(0);
const mod=Array.from({length:n},()=>new Array(n).fill(false)),fn=Array.from({length:n},()=>new Array(n).fill(false));
const set=(y,x,d)=>{if(y<0||x<0||y>=n||x>=n)return;mod[y][x]=d;fn[y][x]=true};
const finder=(r,c)=>{for(let dy=-1;dy<=7;dy++)for(let dx=-1;dx<=7;dx++){const d=Math.max(Math.abs(dy-3),Math.abs(dx-3));set(r+dy,c+dx,d!==2&&d!==4)}};
finder(0,0);finder(0,n-7);finder(n-7,0);
for(let i=8;i<n-8;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
if(v>1){const a=AL[v][1];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(a+dy,a+dx,Math.max(Math.abs(dy),Math.abs(dx))!==1)}
for(let i=0;i<9;i++){if(!fn[8][i])set(8,i,false);if(!fn[i][8])set(i,8,false)}
for(let i=0;i<8;i++){set(8,n-1-i,false);set(n-1-i,8,false)}
set(n-8,8,true);
let k=0;
for(let right=n-1;right>=1;right-=2){
if(right===6)right=5;
for(let vert=0;vert<n;vert++)for(let j=0;j<2;j++){
const x=right-j,up=((right+1)&2)===0,y=up?n-1-vert:vert;
if(!fn[y][x]&&k<stream.length){mod[y][x]=!!stream[k];k++}
}
}
const fmtBits=m=>{const d=m;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);return((d<<10)|r)^0x5412};
const bit=(b,i)=>((b>>>i)&1)!==0;
const drawFmt=(g,m)=>{
const b=fmtBits(m);
for(let i=0;i<=5;i++)g[i][8]=bit(b,i);
g[7][8]=bit(b,6);g[8][8]=bit(b,7);g[8][7]=bit(b,8);
for(let i=9;i<15;i++)g[8][14-i]=bit(b,i);
for(let i=0;i<8;i++)g[8][n-1-i]=bit(b,i);
for(let i=8;i<15;i++)g[n-15+i][8]=bit(b,i);
g[n-8][8]=true;
};
const penalty=g=>{
let p=0;
for(let pass=0;pass<2;pass++){
for(let a=0;a<n;a++){
let run=1,line="";
for(let b=0;b<n;b++){
const c=pass?g[b][a]:g[a][b];line+=c?"1":"0";
if(b>0){const pc=pass?g[b-1][a]:g[a][b-1];if(c===pc){run++;if(run===5)p+=3;else if(run>5)p++}else run=1}
}
const m=line.match(/10111010000|00001011101/g);if(m)p+=40*m.length;
}
}
for(let y=0;y<n-1;y++)for(let x=0;x<n-1;x++){const c=g[y][x];if(c===g[y][x+1]&&c===g[y+1][x]&&c===g[y+1][x+1])p+=3}
let dark=0;g.forEach(r=>r.forEach(c=>{if(c)dark++}));
p+=(Math.ceil(Math.abs(dark*20-n*n*10)/(n*n))-1)*10;
return p;
};
let best=null,bp=1e9;
for(let m=0;m<8;m++){
const g=mod.map(r=>r.slice());
for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(!fn[y][x]&&MASKS[m](x,y))g[y][x]=!g[y][x];
drawFmt(g,m);
const p=penalty(g);
if(p<bp){bp=p;best=g}
}
return best;
}
function draw(ctx,text,x,y,size){
const g=make(text);if(!g)return;
const n=g.length,m=Math.max(1,Math.floor(size/(n+8))),w=m*(n+8);
ctx.fillStyle="#fff";ctx.fillRect(x,y,w,w);
ctx.fillStyle="#000";
for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(g[r][c])ctx.fillRect(x+(c+4)*m,y+(r+4)*m,m,m);
}
return{make,draw};
})();

/* ---------- Secret receipt code (never printed; only a code made from it is) ---------- */
function secretKey(){
const m=meta();
if(!m.secret){const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let i=0;i<24;i++)s+=c[Math.floor(Math.random()*c.length)];m.secret=s;DB.set("meta",m)}
return m.secret;
}
function sigOf(s){
let h1=0x9e3779b9,h2=0x7f4a7c15;const str=secretKey()+"|"+s.no+"|"+Math.round(s.total)+"|"+s.date;
for(let r=0;r<20;r++)for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677);h1^=h2>>>15;h2^=h1>>>13}
h1=Math.imul(h1^(h1>>>16),2246822507);h2=Math.imul(h2^(h2>>>16),3266489909);
const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let o="";
for(let i=0;i<8;i++)o+=A[((i<4?h1>>>(5*i):h2>>>(5*(i-4)))&31)];
return o;
}
const codeShow=c=>c.slice(0,4)+"-"+c.slice(4);

/* ---------- Receipt picture (drawn on a canvas like a shop receipt) ---------- */
function drawReceipt(s){
const info=DB.get("shopinfo",{}),W=440,M=18,SC=2,mono='"Courier New",Courier,monospace';
const Lx=M+22,Rx=W-M-22,CX=W/2;
const od=s.orderDiscount!=null?s.orderDiscount:(s.discount||0);
const p2=n=>String(n).padStart(2,"0"),dt=new Date(s.date);
const ds=p2(dt.getDate())+"/"+p2(dt.getMonth()+1)+"/"+dt.getFullYear()+"  "+p2(dt.getHours())+":"+p2(dt.getMinutes());
function run(ctx,draw){
let y=46;
const F=(sz,b)=>{ctx.font=(b?"bold ":"")+sz+"px "+mono};
const wrap=(t,maxW)=>{const words=String(t).split(" "),out=[];let cur="";for(const w of words){const test=cur?cur+" "+w:w;if(ctx.measureText(test).width>maxW&&cur){out.push(cur);cur=w}else cur=test}if(cur)out.push(cur);return out.length?out:[""]};
const txt=(t,x,al,col)=>{if(!draw)return;ctx.textAlign=al;ctx.fillStyle=col||"#111";ctx.fillText(t,x,y)};
const center=(t,sz,b,col,lh)=>{F(sz,b);wrap(t,Rx-Lx).forEach(l=>{y+=lh;txt(l,CX,"center",col)})};
const lr=(l,r,sz,b,col)=>{F(sz,b);y+=sz+8;txt(l,Lx,"left",col);txt(r,Rx,"right",col)};
const dash=()=>{y+=10;if(draw){ctx.save();ctx.strokeStyle="#777";ctx.setLineDash([5,4]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(Lx,y);ctx.lineTo(Rx,y);ctx.stroke();ctx.restore()}y+=8};
center(shop(),26,true,"#111",30);
if(info.address)center(info.address,14,false,"#333",18);
if(info.phone)center("Tel: "+info.phone,14,false,"#333",18);
dash();
center("SALES RECEIPT",18,true,"#111",22);
y+=4;
lr("Receipt No:",s.no,13,false);
lr("Date:",ds,13,false);
lr("Cashier:",s.by||"Owner",13,false);
dash();
F(13,true);y+=21;
if(draw){txt("QTY",Lx,"left");txt("ITEM",Lx+38,"left");txt("PRICE",Rx-96,"right");txt("AMOUNT",Rx,"right")}
dash();
s.lines.forEach(l=>{
F(14,false);const nm=wrap(l.name,162);
y+=21;
if(draw){txt(String(l.qty),Lx,"left");txt(nm[0],Lx+38,"left");txt(naira(l.price),Rx-96,"right");txt(naira(l.price*l.qty),Rx,"right")}
for(let k=1;k<nm.length;k++){y+=18;txt(nm[k],Lx+38,"left")}
if(l.disc>0){F(12,false);y+=17;txt("Discount",Lx+38,"left","#b91c1c");txt("-"+naira(l.disc),Rx,"right","#b91c1c")}
});
dash();
lr("Sub-total",naira(s.subtotal),14,false);
const ld=s.lines.reduce((t,l)=>t+(l.disc||0),0);
if(ld)lr("Item discounts","-"+naira(ld),14,false,"#b91c1c");
if(od)lr("Order discount"+(s.discType==="pct"&&s.discValue?" ("+s.discValue+"%)":""),"-"+naira(od),14,false,"#b91c1c");
y+=6;const yT=y;
lr("TOTAL",naira(s.total),22,true);
dash();
lr("Payment",payName(s.pay),14,false);
if(s.pay==="cash"&&s.received!=null&&!isNaN(s.received)){lr("Cash received",naira(s.received),14,false);lr("Change",naira(Math.max(0,s.received-s.total)),14,false)}
dash();
const code=sigOf(s);
y+=6;
if(draw)QR.draw(ctx,"SR|"+s.no+"|"+code,CX-75,y,150);
y+=150;
center("Scan to verify this receipt",11,false,"#555",16);
center("Code: "+codeShow(code),14,true,"#111",20);
dash();
const foot=info.footer==null?"Thank you for your patronage":info.footer;
if(foot)center(foot,14,true,"#111",20);
y+=6;center("Powered by ShopRoot",11,false,"#888",16);
y+=20;
return{y,yT};
}
const dry=run(document.createElement("canvas").getContext("2d"),false);
const H=dry.y+20;
const c=document.createElement("canvas");c.width=W*SC;c.height=H*SC;
const ctx=c.getContext("2d");ctx.scale(SC,SC);
ctx.fillStyle="#E9E4F0";ctx.fillRect(0,0,W,H);
ctx.save();ctx.shadowColor="rgba(40,20,70,.25)";ctx.shadowBlur=12;ctx.shadowOffsetY=3;ctx.fillStyle="#fff";
const x0=M,x1=W-M,top=10,bot=H-10,st=12,h=6;
ctx.beginPath();ctx.moveTo(x0,top+h);
for(let x=x0;x<x1;x+=st){ctx.lineTo(Math.min(x+st/2,x1),top);ctx.lineTo(Math.min(x+st,x1),top+h)}
ctx.lineTo(x1,bot-h);
for(let x=x1;x>x0;x-=st){ctx.lineTo(Math.max(x-st/2,x0),bot);ctx.lineTo(Math.max(x-st,x0),bot-h)}
ctx.closePath();ctx.fill();ctx.restore();
const r=run(ctx,true);
ctx.save();ctx.translate(W-150,r.yT-6);ctx.rotate(-0.2);ctx.globalAlpha=0.16;ctx.fillStyle="#16A34A";ctx.font="bold 56px "+mono;ctx.textAlign="center";ctx.fillText("PAID",0,0);ctx.restore();
return c;
}
function showReceipt(id){
const s=DB.get("sales",[]).find(x=>x.id===id);if(!s)return;
const o=document.createElement("div");o.id="rview";
o.innerHTML=`<button onclick="document.getElementById('rview').remove()">Close</button><img src="${drawReceipt(s).toDataURL("image/png")}">`;
document.body.appendChild(o);
}
async function sendReceipt(id){
const s=DB.get("sales",[]).find(x=>x.id===id);if(!s)return;
const c=drawReceipt(s);
const blob=await new Promise(r=>c.toBlob(r,"image/png"));
const file=new File([blob],"receipt-"+s.no+".png",{type:"image/png"});
try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"Receipt "+s.no,text:shop()+" - receipt "+s.no});return}}catch(e){if(e&&e.name==="AbortError")return}
const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=file.name;document.body.appendChild(a);a.click();a.remove();
toast("Receipt picture saved. Open WhatsApp and attach it");
}
function openReceipt(id,owner,back){viewSale=id;viewOwner=owner;receiptBack=back;current="receipt";render()}
screens.receipt=()=>{
const s=DB.get("sales",[]).find(x=>x.id===viewSale);
if(!s)return info("Receipt","Receipt not found.");
const fresh=receiptBack==="sell";
const head=fresh?`<h1>Sale complete ✅</h1><p class="sub">${naira(s.total)} · ${payName(s.pay)}</p>`:`<h1>Receipt</h1><p class="sub">${s.no}</p>`;
return head+`<img src="${drawReceipt(s).toDataURL("image/png")}" style="width:100%;border-radius:16px;margin-bottom:14px" onclick="showReceipt('${s.id}')"><button class="btn green" onclick="sendReceipt('${s.id}')">📤 Send receipt (WhatsApp, email...)</button><div class="gap"></div><button class="btn ghost" onclick="showReceipt('${s.id}')">Show receipt to customer</button><div class="gap"></div><button class="btn" onclick="go('${receiptBack}')">${fresh?"Done · New sale":"Back"}</button>`;
};

/* ---------- Dashboard and History (no profit shown here) ---------- */
screens.dash=()=>{
const td=DB.get("sales",[]).filter(s=>sameDay(s.date,new Date())),low=items().filter(isLow);
return `<h1>Good day 👋</h1><p class="sub">${esc(shop())}</p><div class="card"><b>Today</b><div class="it" style="margin:0"><span>Sales (${td.length})</span><span class="big">${naira(sumOf(td,s=>s.total))}</span></div></div><div class="card"><b>Running low</b>`+(low.length?low.map(i=>`<div class="it"><span>${esc(i.name)}</span><span class="small">${fmt(i,i.stock)} left</span></div>`).join(""):`<p class="sub" style="margin:0">Nothing is running low.</p>`)+`</div>`+(hasPin()?"":`<div class="card"><b>🔐 Protect your buying prices</b><p class="sub">Set a 4-digit PIN so workers cannot see what you pay for goods, or your profit.</p><button class="btn green" onclick="go('vault')">Set PIN</button></div>`);
};
screens.profile=()=>{
const pin=hasPin(),ow=isOwner();
return `<h1>Profile</h1><div class="card"><b>${esc(shop())}</b><p class="sub" style="margin:0">Mode: ${pin?(ow?"Owner":"Worker"):"Owner (no PIN set)"}</p></div>`+(pin?(ow?`<button class="btn" onclick="lockOwner()">🔒 Switch to worker mode</button>`:`<button class="btn green" onclick="unlockThen('profile')">🔓 Enter PIN for owner mode</button>`):`<button class="btn green" onclick="go('vault')">Set a PIN to protect your prices</button>`)+`<p class="sub" style="margin-top:14px">In worker mode, buying prices, profit, recipes, settings and the vault are hidden.</p>`;
};
screens.hist=()=>{
const all=DB.get("sales",[]).slice().reverse(),td=all.filter(s=>sameDay(s.date,new Date()));
const head=`<h1>History</h1><button class="btn sm ghost" onclick="go('verify')">🔍 Verify a receipt</button><div class="gap"></div><div class="card"><b>Today</b><div class="it" style="margin:0"><span>Sales (${td.length})</span><span class="big">${naira(sumOf(td,s=>s.total))}</span></div></div>`;
if(!all.length)return head+`<div class="card"><p class="sub" style="margin:0">No sales yet. Your receipts will appear here.</p></div>`;
return head+all.slice(0,60).map(s=>{
const t=new Date(s.date).toLocaleString("en-NG",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const names=s.lines.map(l=>l.qty+"× "+esc(l.name)).join(", ");
return `<div class="card" onclick="openReceipt('${s.id}',false,'hist')"><div class="it"><b>${s.no}</b><span class="big">${naira(s.total)}</span></div><p class="small" style="margin:0">${t} · ${payName(s.pay)}${s.discount?" · discount "+naira(s.discount):""}</p><p class="small" style="margin:4px 0 0">${names}</p></div>`;
}).join("");
};

/* ---------- Vault (PIN protected: profit and private money) ---------- */
const money=n=>(n<0?"-":"")+naira(Math.abs(n));
function pinHash(p){
let h1=0xdeadbeef,h2=0x41c6ce57;const s="sr#"+p+"#x";
for(let r=0;r<500;r++)for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}
h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
return (4294967296*(2097151&h2)+(h1>>>0)).toString(36);
}
function keypad(title,sub){
const dots=[0,1,2,3].map(i=>`<i class="${i<vault.buf.length?"on":""}"></i>`).join("");
const keys=["1","2","3","4","5","6","7","8","9","","0","⌫"].map(k=>k===""?`<span></span>`:`<button onclick="pinKey('${k}')">${k}</button>`).join("");
return `<h1>🔐 ${title}</h1><p class="sub">${sub}</p><div class="dots">${dots}</div>${vault.msg?`<p class="sub" style="text-align:center;color:var(--red);font-weight:700">${vault.msg}</p>`:""}<div class="keys">${keys}</div>`;
}
function pinKey(k){
if(k==="⌫")vault.buf=vault.buf.slice(0,-1);
else if(vault.buf.length<4)vault.buf+=k;
vault.msg="";render();
if(vault.buf.length===4)setTimeout(pinDone,150);
}
function pinDone(){
const pin=vault.buf;vault.buf="";
const has=DB.get("vaultpin",null);
if(!has){
if(vault.step!=="confirm"){vault.first=pin;vault.step="confirm";return render()}
if(pin===vault.first){DB.set("vaultpin",pinHash(pin));vault.ok=true;vault.t=Date.now();ownerOn();vault.step="enter";toast("PIN saved");return render()}
vault.step="create";vault.msg="The two PINs did not match. Try again.";return render();
}
if(Date.now()<vault.lock){vault.msg="Too many tries. Please wait a minute.";return render()}
if(pinHash(pin)===has){vault.tries=0;ownerOn();if(vault.next){const n=vault.next;vault.next=null;vault.ok=false;current=n;return render()}vault.ok=true;vault.t=Date.now();return render()}
vault.tries++;
if(vault.tries>=5){vault.lock=Date.now()+60000;vault.tries=0;vault.msg="Too many tries. Please wait a minute."}
else vault.msg="Wrong PIN. Try again.";
render();
}
const period=k=>{
const now=new Date();
return DB.get("sales",[]).filter(s=>{const d=new Date(s.date);if(k==="today")return sameDay(s.date,now);if(k==="week")return now-d<7*864e5&&d<=now;return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()});
};
function setVaultTab(k){vault.tab=k;render()}
function lockVault(){own.until=0;vault.ok=false;render()}
function changePin(){
sheet(`<h1>Change your PIN?</h1><p class="sub">You will create a new 4-digit PIN.</p><button class="btn red" onclick="doChangePin()">Yes, change PIN</button><div class="gap"></div><button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
}
function doChangePin(){DB.set("vaultpin",null);vault.ok=false;vault.step="create";vault.buf="";closeSheet();render()}
function vaultHome(){
const list=period(vault.tab),names={today:"Today",week:"Last 7 days",month:"This month"};
const rev=sumOf(list,s=>s.total),dis=sumOf(list,s=>s.discount||0),cost=sumOf(list,s=>s.cost||0),pr=sumOf(list,s=>s.profit||0);
const seg=`<div class="seg">${["today","week","month"].map(k=>`<button class="${vault.tab===k?"on":""}" onclick="setVaultTab('${k}')">${k==="today"?"Today":k==="week"?"7 days":"Month"}</button>`).join("")}</div>`;
const recent=DB.get("sales",[]).slice().reverse().slice(0,15).map(s=>{
const t=new Date(s.date).toLocaleString("en-NG",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
return `<div class="card" onclick="openReceipt('${s.id}',false,'vault')"><div class="it" style="margin:0"><span><b>${s.no}</b><br><span class="small">${t} · sold ${naira(s.total)}</span></span><b style="color:${s.profit>=0?"var(--green)":"var(--red)"}">${money(s.profit||0)}</b></div></div>`;
}).join("");
return `<h1>🔐 Vault</h1><button class="btn sm ghost" onclick="lockVault()">Lock vault now</button><div class="gap"></div>${seg}
<div class="card" style="background:linear-gradient(135deg,#4A2370,#6b3a9a);color:#fff"><b>Profit · ${names[vault.tab]}</b><div style="font-size:38px;font-weight:900">${money(pr)}</div><span style="opacity:.85">${list.length} sales</span></div>
<div class="stat"><div class="card"><span class="small">Sales</span><br><b>${naira(rev)}</b></div><div class="card"><span class="small">Cost of goods</span><br><b>${naira(cost)}</b></div><div class="card"><span class="small">Discounts given</span><br><b>${naira(dis)}</b></div><div class="card"><span class="small">Sales count</span><br><b>${list.length}</b></div></div>
<h1 style="font-size:20px">Recent sales and profit</h1>${recent||`<div class="card"><p class="sub" style="margin:0">No sales yet.</p></div>`}
<div class="card"><b>Coming next</b><p class="sub" style="margin:0">Suppliers you owe, money customers owe you, and reminders.</p></div>
<button class="btn sm ghost" onclick="changePin()">Change PIN</button>`;
}
screens.vault=()=>{
const has=DB.get("vaultpin",null);
if(vault.ok&&Date.now()-vault.t>120000)vault.ok=false;
if(!vault.ok){
if(!has){
if(vault.step!=="confirm")vault.step="create";
return keypad(vault.step==="create"?"Create your PIN":"Confirm your PIN","Choose 4 numbers. Write them down somewhere safe, because they cannot be reset yet.");
}
vault.step="enter";
return keypad("Enter your PIN","Your profit and private money records are inside.");
}
vault.t=Date.now();
return vaultHome();
};

/* ---------- Verify a receipt (QR scan, photo, or type it) ---------- */
let camStop=()=>{};
function stopCam(){camStop()}
function verifyCheck(no,code,typed){
no=(no||"").trim().toUpperCase();code=(code||"").replace(/[^A-Za-z0-9]/g,"").toUpperCase();
const s=DB.get("sales",[]).find(x=>x.no.toUpperCase()===no);
if(!s)return{k:"bad",t:"Not found",m:"This receipt number is not in this shop's records. It may be fake or from another shop."};
if(sigOf(s)!==code)return{k:"bad",t:"Not genuine",m:"The code does not match this receipt. It may have been changed or copied."};
const n=parseFloat(typed);
if(typed!==""&&typed!=null&&!isNaN(n)&&Math.round(n)!==Math.round(s.total))return{k:"warn",t:"Amount changed",m:"The code is valid, but the total on this receipt ("+naira(n)+") does not match our record ("+naira(s.total)+").",sale:s};
return{k:"ok",t:"Genuine receipt",m:"This receipt came from "+shop()+".",sale:s};
}
function showVerify(r){
const col={ok:["#e8f8ee","#16A34A"],warn:["#fef3c7","#d97706"],bad:["#fee2e2","#DC2626"]}[r.k];
const s=r.sale;
$("#v_res").innerHTML=`<div class="card" style="background:${col[0]};border:3px solid ${col[1]}"><b style="font-size:22px;color:${col[1]}">${r.k==="ok"?"✅ ":r.k==="warn"?"⚠️ ":"❌ "}${r.t}</b><p style="margin:6px 0 0">${r.m}</p>`+(s?`<div class="dsh"></div><div class="it"><span>Receipt</span><b>${s.no}</b></div><div class="it"><span>Date</span><span>${new Date(s.date).toLocaleString("en-NG",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</span></div>${s.lines.map(l=>`<div class="it"><span>${l.qty} × ${esc(l.name)}</span><span>${naira(l.price*l.qty-(l.disc||0))}</span></div>`).join("")}<div class="it" style="margin:0"><b>Total</b><b>${naira(s.total)}</b></div>`:"")+`</div>`;
}
screens.verify=()=>`<h1>Verify receipt</h1><p class="sub">Check that a receipt really came from your shop.</p>
<button class="btn green" onclick="scanCamera()">📷 Scan the QR code</button><div class="gap"></div>
<label class="btn ghost" style="display:flex;align-items:center;justify-content:center">🖼️ Choose a photo of the receipt<input type="file" accept="image/*" style="display:none" onchange="scanPhoto(this)"></label>
<div class="card" style="margin-top:14px"><b>Or type it</b><label>Receipt number</label><input id="v_no" placeholder="e.g. 5GL6-T32-261115-0001"><label>Code under the QR</label><input id="v_code" placeholder="e.g. K7P2-9XQM"><label>Total shown on the receipt <span class="small">optional</span></label><input id="v_tot" type="number" inputmode="decimal" placeholder="e.g. 3135"><button class="btn" onclick="runVerify()">Check receipt</button></div>
<div id="v_res"></div><button class="btn ghost" onclick="go('hist')">Back to History</button>`;
function runVerify(){
const no=$("#v_no").value,code=$("#v_code").value;
if(!no.trim()||!code.trim())return toast("Type the receipt number and the code");
showVerify(verifyCheck(no,code,$("#v_tot").value));
}
function useQR(raw){
const m=/^SR\|([^|]+)\|([A-Za-z0-9]+)$/.exec(String(raw).trim());
if(current!=="verify"){current="verify";render()}
if(!m){$("#v_res").innerHTML="";return toast("This QR code is not a ShopRoot receipt")}
$("#v_no").value=m[1];$("#v_code").value=codeShow(m[2].toUpperCase());
showVerify(verifyCheck(m[1],m[2],$("#v_tot").value));
}
async function scanCamera(){
if(!("BarcodeDetector" in window))return toast("Camera scan is not available on this phone. Type the number and code instead.");
let stream;
try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}})}catch(e){return toast("The camera was not allowed")}
const det=new BarcodeDetector({formats:["qr_code"]});
const o=document.createElement("div");o.id="cam";
o.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;z-index:60;background:#000;display:flex;flex-direction:column";
o.innerHTML=`<video autoplay playsinline muted style="flex:1;width:100%;object-fit:cover"></video><button class="btn" style="border-radius:0;min-height:64px" onclick="stopCam()">Cancel</button>`;
document.body.appendChild(o);
const v=o.querySelector("video");v.srcObject=stream;
let tm=null;
camStop=()=>{clearInterval(tm);stream.getTracks().forEach(t=>t.stop());o.remove();camStop=()=>{}};
tm=setInterval(async()=>{try{const r=await det.detect(v);if(r.length){const raw=r[0].rawValue;camStop();useQR(raw)}}catch(e){}},300);
}
async function scanPhoto(inp){
const f=inp.files&&inp.files[0];if(!f)return;
if(!("BarcodeDetector" in window))return toast("Photo scan is not available on this phone. Type the number and code instead.");
try{
const det=new BarcodeDetector({formats:["qr_code"]});
const bmp=await createImageBitmap(f);
const r=await det.detect(bmp);
if(!r.length)return toast("No QR code found in this photo");
useQR(r[0].rawValue);
}catch(e){toast("Could not read this photo")}
}

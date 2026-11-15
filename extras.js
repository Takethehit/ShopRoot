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
let vault={ok:false,t:0,buf:"",step:"enter",first:"",tries:0,lock:0,tab:"today",msg:""};
tabs[4]=["vault","🔐","Vault"];
const _go=go;
go=function(t){if(t!=="vault")vault.ok=false;_go(t)};

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
return `<h1>Good day 👋</h1><p class="sub">${esc(shop())}</p><div class="card"><b>Today</b><div class="it" style="margin:0"><span>Sales (${td.length})</span><span class="big">${naira(sumOf(td,s=>s.total))}</span></div></div><div class="card"><b>Running low</b>`+(low.length?low.map(i=>`<div class="it"><span>${esc(i.name)}</span><span class="small">${fmt(i,i.stock)} left</span></div>`).join(""):`<p class="sub" style="margin:0">Nothing is running low.</p>`)+`</div>`;
};
screens.hist=()=>{
const all=DB.get("sales",[]).slice().reverse(),td=all.filter(s=>sameDay(s.date,new Date()));
const head=`<h1>History</h1><div class="card"><b>Today</b><div class="it" style="margin:0"><span>Sales (${td.length})</span><span class="big">${naira(sumOf(td,s=>s.total))}</span></div></div>`;
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
if(pin===vault.first){DB.set("vaultpin",pinHash(pin));vault.ok=true;vault.t=Date.now();vault.step="enter";toast("PIN saved");return render()}
vault.step="create";vault.msg="The two PINs did not match. Try again.";return render();
}
if(Date.now()<vault.lock){vault.msg="Too many tries. Please wait a minute.";return render()}
if(pinHash(pin)===has){vault.ok=true;vault.t=Date.now();vault.tries=0;return render()}
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
function lockVault(){vault.ok=false;render()}
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

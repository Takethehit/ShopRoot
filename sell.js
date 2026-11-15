document.head.insertAdjacentHTML("beforeend",`<style>
.paygrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0}
.paytile{border:2px solid #d9c8ee;background:#fff;color:var(--grape);border-radius:16px;min-height:84px;font-size:16px;font-weight:800;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}
.paytile.on{border-color:var(--green);background:#e8f8ee}
.chk{display:flex;gap:12px;align-items:center;font-weight:600;margin:10px 0}
.slide{position:relative;height:64px;border-radius:32px;background:#16a34a;overflow:hidden;margin-top:14px;user-select:none}
.slide span{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;pointer-events:none;padding-left:60px}
.slide input{position:absolute;left:0;top:0;width:100%;height:64px;margin:0;padding:0;border:0;background:transparent;-webkit-appearance:none;appearance:none}
.slide input::-webkit-slider-runnable-track{height:64px;background:transparent}
.slide input::-webkit-slider-thumb{-webkit-appearance:none;width:64px;height:64px;border-radius:50%;background:#fff;border:6px solid #16a34a;box-shadow:0 2px 8px #0003}
.slide input::-moz-range-track{height:64px;background:transparent}
.slide input::-moz-range-thumb{width:52px;height:52px;border-radius:50%;background:#fff;border:6px solid #16a34a}
#ok{position:fixed;top:0;left:0;right:0;bottom:0;z-index:40;background:#F4EEFB;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#4A2370}
#ok h2{font-size:28px;margin:18px 0 4px}
#ok p{font-size:20px;font-weight:700;margin:0}
.stage{position:relative;width:300px;height:300px}
.stage i{position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(-50%,-50%) scale(0);animation:grow .6s ease-out forwards}
.stage .c{position:absolute;left:50%;top:50%;width:112px;height:112px;border-radius:50%;background:#16A34A;display:grid;place-items:center;transform:translate(-50%,-50%) scale(0);animation:pop .5s .3s ease-out forwards}
@keyframes grow{to{transform:translate(-50%,-50%) scale(1)}}
@keyframes pop{0%{transform:translate(-50%,-50%) scale(0)}70%{transform:translate(-50%,-50%) scale(1.15)}100%{transform:translate(-50%,-50%) scale(1)}}
.rcpt{background:#fff;border-radius:16px;padding:18px;box-shadow:0 4px 14px #4a23701a;position:relative;margin-bottom:14px}
.rcpt h2{margin:0 0 2px;font-size:22px}
.rl{display:flex;justify-content:space-between;gap:10px;margin:6px 0}
.dsh{border-top:2px dashed #cbb8e6;margin:12px 0}
.stamp{position:absolute;right:14px;top:14px;border:4px solid #16A34A;color:#16A34A;font-weight:900;font-size:22px;padding:2px 10px;border-radius:8px;transform:rotate(12deg);opacity:.85}
</style>`);
let cart=[],sq="",disc={t:"amt",v:0},payType="",viewSale=null,viewOwner=false,receiptBack="sell";
const money=n=>(n<0?"-":"")+naira(Math.abs(n));
const sameDay=(iso,d)=>new Date(iso).toDateString()===d.toDateString();
const sumOf=(a,f)=>a.reduce((t,x)=>t+f(x),0);
const payName=k=>({cash:"Cash",pos:"POS",transfer:"Transfer"}[k]||k);
function usage(extra){
const u={};
const add=(p,n)=>p.lines.forEach(l=>{u[l.itemId]=(u[l.itemId]||0)+l.qty*n});
cart.forEach(c=>{const p=prods().find(x=>x.id===c.pid);if(p)add(p,c.qty)});
if(extra){const p=prods().find(x=>x.id===extra);if(p)add(p,1)}
return u;
}
function fits(pid){
const u=usage(pid);
return Object.keys(u).every(id=>{const i=itemById(id);return i&&u[id]<=i.stock+1e-9});
}
function servingsLeft(p){
const u=usage();let m=Infinity;
for(const l of p.lines){const i=itemById(l.itemId);if(!i||!(l.qty>0))return 0;m=Math.min(m,Math.floor((i.stock-(u[l.itemId]||0))/l.qty+1e-9))}
return m===Infinity?0:Math.max(0,m);
}
const subTotal=()=>cart.reduce((s,c)=>{const p=prods().find(x=>x.id===c.pid);return s+(p?p.price*c.qty:0)},0);
const cartCount=()=>cart.reduce((s,c)=>s+c.qty,0);
const cartCost=()=>cart.reduce((s,c)=>{const p=prods().find(x=>x.id===c.pid);return s+(p?costOf(p)*c.qty:0)},0);
function discOf(t,v,sub){let d=t==="pct"?Math.round(sub*Math.min(v,100)/100):(Number(v)||0);return Math.max(0,Math.min(d,sub))}
const discAmt=()=>discOf(disc.t,disc.v,subTotal());
const grandTotal=()=>subTotal()-discAmt();
function addToCart(pid){
const p=prods().find(x=>x.id===pid);if(!p)return;
if(!fits(pid))return toast("Not enough stock for "+p.name);
const c=cart.find(x=>x.pid===pid);
if(c)c.qty++;else cart.push({pid,qty:1});
refreshSell();
}
function decCart(pid){
const c=cart.find(x=>x.pid===pid);if(!c)return;
c.qty--;if(c.qty<=0)cart=cart.filter(x=>x.pid!==pid);
if(!cart.length)disc={t:"amt",v:0};
refreshSell();
}
function refreshSell(){if(current==="sell"){$("#grid").innerHTML=gridHTML();$("#order").innerHTML=orderHTML()}}
function setSq(v){sq=v;$("#grid").innerHTML=gridHTML()}
function openProducts(){stockTab="items";go("stock")}
function gridHTML(){
const list=prods();
if(!list.length)return `<div class="card" style="grid-column:1/-1"><p class="sub" style="margin:0 0 12px">Nothing to sell yet. Add an item in Stock and put it on sale.</p><button class="btn" onclick="openProducts()">Go to Stock</button></div>`;
const q=sq.toLowerCase();
const f=list.filter(p=>p.name.toLowerCase().includes(q));
if(!f.length)return `<p class="sub">No product found</p>`;
return f.map(p=>{
const n=servingsLeft(p);
const st=n<=0?`<span style="color:var(--red);font-weight:700">Out of stock</span>`:(n<=5?`<span style="color:var(--red);font-weight:700">${n} left</span>`:`<span style="color:var(--green);font-weight:700">In stock</span>`);
return `<div class="tile"><div class="emoji">${pic(p.name)}</div><b>${esc(p.name)}</b><span>${naira(p.price)}</span><br>${st}<button class="btn green" ${n<=0?"disabled":""} onclick="addToCart('${p.id}')">+ Add</button></div>`;
}).join("");
}
function orderHTML(){
const rows=cart.map(c=>{
const p=prods().find(x=>x.id===c.pid);if(!p)return "";
return `<div class="it" style="align-items:center;margin-bottom:6px"><span style="flex:1;font-weight:700">${pic(p.name)} ${esc(p.name)}</span><button class="btn sm ghost" style="width:44px;min-height:44px;padding:0" onclick="decCart('${p.id}')">−</button><b style="min-width:22px;text-align:center">${c.qty}</b><button class="btn sm ghost" style="width:44px;min-height:44px;padding:0" onclick="addToCart('${p.id}')">+</button><span style="min-width:78px;text-align:right">${naira(p.price*c.qty)}</span></div>`;
}).join("");
const d=discAmt();
const lines=cart.length?`<div class="it small" style="margin:4px 0"><span>Subtotal</span><span>${naira(subTotal())}</span></div>`+(d?`<div class="it" style="margin:4px 0;color:var(--red);font-weight:700"><span>Discount${disc.t==="pct"?" ("+disc.v+"%)":""}</span><span>-${naira(d)}</span></div>`:""):"";
return `<b>Current order · ${cartCount()} ${cartCount()===1?"item":"items"}</b><div style="max-height:24vh;overflow-y:auto">${rows}</div>${lines}<div class="it" style="margin:8px 0"><span class="big">Total</span><span class="big">${naira(grandTotal())}</span></div><button class="btn sm ghost" onclick="discForm()">${d?"Change discount":"Add discount"}</button><div class="gap"></div><button class="btn" ${cart.length?"":"disabled"} onclick="openPay()">Proceed to Payment</button>`;
}
screens.sell=()=>`<h1>New Sale</h1><p class="sub">Tap + Add to put products in the customer’s order.</p><input id="q" placeholder="Search products..." value="${esc(sq)}" oninput="setSq(this.value)"><div class="grid" id="grid">${gridHTML()}</div><div class="card" id="order" style="position:sticky;bottom:0;margin-top:14px;box-shadow:0 -4px 16px #4a237030">${orderHTML()}</div>`;

function discForm(){
if(!cart.length)return toast("Add products first");
sheet(`<h1>Discount</h1><p class="sub">Subtotal ${naira(subTotal())}</p>
<div class="seg"><button class="${disc.t==="amt"?"on":""}" onclick="setDiscType('amt')">₦ Amount</button><button class="${disc.t==="pct"?"on":""}" onclick="setDiscType('pct')">% Percent</button></div>
<input id="d_val" type="number" inputmode="decimal" placeholder="${disc.t==="pct"?"e.g. 10":"e.g. 500"}" value="${disc.v||""}" oninput="discPreview()">
<div class="card" id="d_prev" style="box-shadow:none;border:2px solid #e7d8f7"></div>
<button class="btn green" onclick="applyDisc()">Apply discount</button><div class="gap"></div>
${disc.v?`<button class="btn redline" onclick="clearDisc()">Remove discount</button><div class="gap"></div>`:""}
<button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
discPreview();
}
function setDiscType(t){const v=parseFloat($("#d_val").value)||0;disc={t,v};discForm()}
function discPreview(){
const v=parseFloat($("#d_val").value)||0,sub=subTotal(),d=discOf(disc.t,v,sub),nt=sub-d,pr=nt-cartCost();
$("#d_prev").innerHTML=`<div class="it"><span>Discount</span><b>${naira(d)}</b></div><div class="it"><span>New total</span><b>${naira(nt)}</b></div><div class="it" style="margin:0"><span>Your profit</span><b style="color:${pr>=0?"var(--green)":"var(--red)"}">${money(pr)}</b></div>`+(pr<0?`<p class="small" style="color:var(--red);font-weight:700;margin:8px 0 0">This is below what you paid. You will lose ${naira(-pr)}.</p>`:"");
}
function applyDisc(){
const v=parseFloat($("#d_val").value)||0;
if(v<0)return toast("Discount cannot be negative");
if(disc.t==="pct"&&v>100)return toast("Percent cannot be more than 100");
disc={t:disc.t,v};closeSheet();refreshSell();toast(v?"Discount added":"No discount");
}
function clearDisc(){disc={t:"amt",v:0};closeSheet();refreshSell()}

function openPay(){
if(!cart.length)return;
const u=usage(),its=items();
for(const id in u){const i=its.find(x=>x.id===id);if(!i||u[id]>i.stock+1e-9)return toast("Not enough stock. Please check your order")}
payType="";drawPay();
}
function setPay(k){payType=k;drawPay()}
function drawPay(){
const t=grandTotal(),d=discAmt();
const tile=(k,ico,l)=>`<button class="paytile ${payType===k?"on":""}" onclick="setPay('${k}')"><span style="font-size:30px">${ico}</span>${l}</button>`;
let box=`<p class="sub">Choose how the customer is paying.</p>`;
if(payType==="cash")box=`<label>Amount received (₦) <span class="small">optional</span></label><input id="p_recv" type="number" inputmode="decimal" placeholder="${t}" oninput="recvChange()"><p class="big" id="p_change" style="margin:0 0 6px;color:var(--green)"></p><label class="chk"><input type="checkbox" id="p_ok" style="width:28px;height:28px;margin:0;padding:0">I have received ${naira(t)} in cash.</label>`;
if(payType==="pos")box=`<label class="chk"><input type="checkbox" id="p_ok" style="width:28px;height:28px;margin:0;padding:0">The POS terminal shows APPROVED for ${naira(t)}.</label>`;
if(payType==="transfer")box=`<label class="chk"><input type="checkbox" id="p_ok" style="width:28px;height:28px;margin:0;padding:0">I confirmed ${naira(t)} in my bank app or SMS alert, not a customer screenshot.</label>`;
sheet(`<h1>Has the customer paid you?</h1>
<div class="big" style="font-size:34px">${naira(t)}</div>${d?`<p class="small" style="margin:0">After ${naira(d)} discount</p>`:""}
<div class="paygrid">${tile("cash","💵","Cash")}${tile("pos","💳","POS")}${tile("transfer","🏦","Transfer")}</div>${box}
<div class="slide"><span>Slide to confirm payment received</span><input type="range" id="slide" min="0" max="100" value="0" onchange="slideEnd()"></div>
<div class="gap"></div><button class="btn ghost" onclick="closeSheet()">Not yet</button>`);
}
function recvChange(){
const r=parseFloat($("#p_recv").value),t=grandTotal();
$("#p_change").textContent=(!isNaN(r)&&r>=t)?"Change to give: "+naira(r-t):"";
}
function slideEnd(){
const s=$("#slide");
const back=m=>{s.value=0;toast(m)};
if(!payType)return back("Choose Cash, POS or Transfer first");
if(!$("#p_ok").checked)return back("Please tick the box first");
if(payType==="cash"&&$("#p_recv").value!==""&&parseFloat($("#p_recv").value)<grandTotal())return back("Amount received is less than the total");
if(Number(s.value)>=95)completeSale();else s.value=0;
}
function meta(){
let m=DB.get("meta",null);
if(!m){
const r=n=>{const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let k=0;k<n;k++)s+=c[Math.floor(Math.random()*c.length)];return s};
m={shopCode:r(4),device:"T"+r(2),counter:0};DB.set("meta",m);
}
return m;
}
function nextNo(){
const m=meta();m.counter++;DB.set("meta",m);
const d=new Date(),p=n=>String(n).padStart(2,"0");
return m.shopCode+"-"+m.device+"-"+String(d.getFullYear()).slice(2)+p(d.getMonth()+1)+p(d.getDate())+"-"+String(m.counter).padStart(4,"0");
}
function completeSale(){
const u=usage(),its=items();
for(const id in u){const i=its.find(x=>x.id===id);if(!i||u[id]>i.stock+1e-9){closeSheet();return toast("Not enough stock. Please check your order")}}
const lines=cart.map(c=>{const p=prods().find(x=>x.id===c.pid);return{pid:p.id,name:p.name,qty:c.qty,price:p.price,cost:Math.round(costOf(p)*100)/100}});
const subtotal=subTotal(),discount=discAmt(),total=subtotal-discount;
const cost=Math.round(lines.reduce((s,l)=>s+l.cost*l.qty,0)*100)/100;
const no=nextNo();
const sale={id:DB.id(),no,date:new Date().toISOString(),lines,subtotal,discount,discType:disc.t,discValue:disc.v,total,pay:payType,cost,profit:Math.round((total-cost)*100)/100,by:"Owner",status:"paid"};
const sales=DB.get("sales",[]);sales.push(sale);DB.set("sales",sales);
for(const id in u){const i=its.find(x=>x.id===id);i.stock=Math.round((i.stock-u[id])*10000)/10000;addMove(id,"sold",-u[id],no)}
DB.set("items",its);
const low=its.filter(i=>u[i.id]&&isLow(i)).map(i=>i.name);
cart=[];disc={t:"amt",v:0};closeSheet();
showSuccess(sale,()=>{viewSale=sale.id;viewOwner=false;receiptBack="sell";current="receipt";render();if(low.length)toast("Running low: "+low.join(", "))});
}
function chime(){
try{navigator.vibrate&&navigator.vibrate(60)}catch(e){}
if(store.get("sound","on")!=="on")return;
try{
const A=window.AudioContext||window.webkitAudioContext,c=new A();
[[880,0],[1320,.12]].forEach(([f,t])=>{
const o=c.createOscillator(),g=c.createGain(),s=c.currentTime+t;
o.type="sine";o.frequency.value=f;o.connect(g);g.connect(c.destination);
g.gain.setValueAtTime(0.0001,s);g.gain.exponentialRampToValueAtTime(0.3,s+0.02);g.gain.exponentialRampToValueAtTime(0.0001,s+0.5);
o.start(s);o.stop(s+0.55);
});
setTimeout(()=>{try{c.close()}catch(e){}},1500);
}catch(e){}
}
function showSuccess(sale,done){
if(store.get("anim","on")!=="on"){chime();return done()}
const o=document.createElement("div");o.id="ok";
o.innerHTML=`<div class="stage"><i style="width:300px;height:300px;background:#E7D8F7"></i><i style="width:210px;height:210px;background:#4A2370;animation-delay:.12s"></i><div class="c"><svg viewBox="0 0 52 52" width="64" height="64"><path d="M14 27l8 8 16-17" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div><h2>Payment received</h2><p>${naira(sale.total)} · ${payName(sale.pay)}</p>`;
let fin=false;
const t=setTimeout(finish,2200);
function finish(){if(fin)return;fin=true;clearTimeout(t);o.remove();done()}
o.onclick=finish;document.body.appendChild(o);chime();
}
function receiptText(s){
const d=new Date(s.date).toLocaleString("en-NG",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
return shop()+"\nReceipt "+s.no+"\n"+d+"\n\n"+s.lines.map(l=>l.qty+" x "+l.name+"  "+naira(l.price*l.qty)).join("\n")+"\n\n"+(s.discount?"Subtotal "+naira(s.subtotal)+"\nDiscount -"+naira(s.discount)+"\n":"")+"Total "+naira(s.total)+"\nPaid by "+payName(s.pay)+"\nThank you!";
}
async function shareReceipt(id){
const s=DB.get("sales",[]).find(x=>x.id===id);if(!s)return;
const txt=receiptText(s);
try{if(navigator.share){await navigator.share({title:"Receipt "+s.no,text:txt});return}}catch(e){if(e&&e.name==="AbortError")return}
try{await navigator.clipboard.writeText(txt);toast("Receipt copied. Paste it in WhatsApp")}catch(e){toast("Sharing is not available on this phone")}
}
function openReceipt(id,owner,back){viewSale=id;viewOwner=owner;receiptBack=back;current="receipt";render()}
screens.receipt=()=>{
const s=DB.get("sales",[]).find(x=>x.id===viewSale);
if(!s)return info("Receipt","Receipt not found.");
const d=new Date(s.date).toLocaleString("en-NG",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
const rows=s.lines.map(l=>`<div class="rl"><span>${l.qty} × ${esc(l.name)}</span><span>${naira(l.price*l.qty)}</span></div>`).join("");
const dl=s.discount?`<div class="rl"><span>Subtotal</span><span>${naira(s.subtotal)}</span></div><div class="rl" style="color:var(--red)"><span>Discount${s.discType==="pct"?" ("+s.discValue+"%)":""}</span><span>-${naira(s.discount)}</span></div>`:"";
const own=viewOwner?`<div class="card"><b>Owner only</b><div class="it"><span>Cost</span><span>${naira(s.cost)}</span></div><div class="it" style="margin:0"><span>Profit</span><b style="color:${s.profit>=0?"var(--green)":"var(--red)"}">${money(s.profit)}</b></div></div>`:"";
return `<div class="rcpt"><div class="stamp">PAID</div><h2>${esc(shop())}</h2><p class="small" style="margin:0">Receipt ${s.no}<br>${d}</p><div class="dsh"></div>${rows}<div class="dsh"></div>${dl}<div class="rl"><b class="big">Total</b><b class="big">${naira(s.total)}</b></div><p class="small" style="margin:8px 0 0">Paid by ${payName(s.pay)} · Served by ${esc(s.by)}</p><div class="dsh"></div><p class="small" style="margin:0;text-align:center">Thank you for your purchase</p></div>${own}<button class="btn green" onclick="shareReceipt('${s.id}')">Share receipt</button><div class="gap"></div><button class="btn" onclick="go('${receiptBack}')">${receiptBack==="sell"?"Done":"Back"}</button>`;
};
screens.hist=()=>{
const all=DB.get("sales",[]).slice().reverse(),td=all.filter(s=>sameDay(s.date,new Date()));
const head=`<h1>History</h1><div class="card"><b>Today</b><div class="it"><span>Sales (${td.length})</span><span class="big">${naira(sumOf(td,s=>s.total))}</span></div><div class="it"><span>Discounts given</span><span>${naira(sumOf(td,s=>s.discount))}</span></div><div class="it" style="margin:0"><span>Profit</span><b style="color:var(--green)">${money(sumOf(td,s=>s.profit))}</b></div></div>`;
if(!all.length)return head+`<div class="card"><p class="sub" style="margin:0">No sales yet. Your receipts will appear here.</p></div>`;
return head+all.slice(0,60).map(s=>{
const t=new Date(s.date).toLocaleString("en-NG",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const names=s.lines.map(l=>l.qty+"× "+esc(l.name)).join(", ");
return `<div class="card" onclick="openReceipt('${s.id}',true,'hist')"><div class="it"><b>${s.no}</b><span class="big">${naira(s.total)}</span></div><p class="small" style="margin:0">${t} · ${payName(s.pay)}${s.discount?" · discount "+naira(s.discount):""}</p><p class="small" style="margin:4px 0 0">${names}</p></div>`;
}).join("");
};
screens.dash=()=>{
const td=DB.get("sales",[]).filter(s=>sameDay(s.date,new Date())),low=items().filter(isLow);
return `<h1>Good day 👋</h1><p class="sub">${esc(shop())}</p><div class="card"><b>Today</b><div class="it"><span>Sales (${td.length})</span><span class="big">${naira(sumOf(td,s=>s.total))}</span></div><div class="it" style="margin:0"><span>Profit</span><b style="color:var(--green)">${money(sumOf(td,s=>s.profit))}</b></div>${sumOf(td,s=>s.discount)?`<p class="small" style="margin:8px 0 0">Discounts given: ${naira(sumOf(td,s=>s.discount))}</p>`:""}</div><div class="card"><b>Running low</b>`+(low.length?low.map(i=>`<div class="it"><span>${esc(i.name)}</span><span class="small">${fmt(i,i.stock)} left</span></div>`).join(""):`<p class="sub" style="margin:0">Nothing is running low.</p>`)+`</div>`;
};
const _setScr=screens.settings;
screens.settings=()=>{
const on=k=>store.get(k,"on")==="on";
return _setScr()+`<div class="card"><b>Payment sound</b><button class="btn ${on("sound")?"green":"ghost"}" onclick="toggleSet('sound')">${on("sound")?"Sound is ON":"Sound is OFF"}</button></div><div class="card"><b>Success animation</b><button class="btn ${on("anim")?"green":"ghost"}" onclick="toggleSet('anim')">${on("anim")?"Animation is ON":"Animation is OFF"}</button></div>`;
};
function toggleSet(k){store.set(k,store.get(k,"on")==="on"?"off":"on");render()}

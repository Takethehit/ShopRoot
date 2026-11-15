document.head.insertAdjacentHTML("beforeend",`<style>
.paygrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0}
.paytile{border:2px solid #d9c8ee;background:#fff;color:var(--grape);border-radius:16px;min-height:84px;font-size:16px;font-weight:800;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}
.paytile.on{border-color:var(--green);background:#e8f8ee}
.pills{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}
.pill{min-height:44px;padding:0 16px;border-radius:999px;border:2px solid #d9c8ee;background:#fff;color:var(--grape);font-size:15px;font-weight:700}
.pill.on{background:var(--grape);border-color:var(--grape);color:#fff}
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
.dsh{border-top:2px dashed #cbb8e6;margin:12px 0}
.obar{position:fixed;left:14px;right:14px;bottom:calc(80px + env(safe-area-inset-bottom));z-index:15;background:linear-gradient(135deg,#4A2370,#6b3a9a);color:#fff;border-radius:22px;padding:14px 14px 14px 18px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 24px #4a237066}
.obar .t{flex:1;line-height:1.25}
.obar .t span{font-size:13px;opacity:.85;display:block}
.obar .t b{font-size:24px}
.obar button{background:#16A34A;color:#fff;border:0;border-radius:16px;min-height:56px;padding:0 20px;font-size:17px;font-weight:800;box-shadow:0 4px 12px #0003}
.oi{display:flex;gap:12px;align-items:center;background:#F4EEFB;border-radius:18px;padding:12px;margin-bottom:10px}
.oe{font-size:38px;width:52px;text-align:center}
.ob{flex:1;display:flex;flex-direction:column;gap:2px}
.ob b{font-size:17px}
.oq{display:flex;align-items:center;gap:12px;margin-top:6px}
.oq button{width:44px;height:44px;border-radius:50%;border:2px solid var(--grape);background:#fff;color:var(--grape);font-size:22px;font-weight:800}
.oq b{min-width:22px;text-align:center;font-size:18px}
.op{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.op>b{font-size:19px}
.bank{background:#F4EEFB;border-radius:16px;padding:14px;margin:8px 0}
.acct{font-size:28px;font-weight:900;letter-spacing:2px;font-family:monospace}
#toast{bottom:calc(168px + env(safe-area-inset-bottom))}
</style>`);
let cart=[],sq="",disc={t:"amt",v:0},dTarget="order",payType="",viewSale=null,viewOwner=false,receiptBack="sell";
const sameDay=(iso,d)=>new Date(iso).toDateString()===d.toDateString();
const sumOf=(a,f)=>a.reduce((t,x)=>t+f(x),0);
const payName=k=>({cash:"Cash",pos:"POS",transfer:"Transfer"}[k]||k);
const prodOf=pid=>prods().find(x=>x.id===pid);
function usage(extra){
const u={};
const add=(p,n)=>p.lines.forEach(l=>{u[l.itemId]=(u[l.itemId]||0)+l.qty*n});
cart.forEach(c=>{const p=prodOf(c.pid);if(p)add(p,c.qty)});
if(extra){const p=prodOf(extra);if(p)add(p,1)}
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
function discOf(t,v,base){let d=t==="pct"?Math.round(base*Math.min(v,100)/100):(Number(v)||0);return Math.max(0,Math.min(d,base))}
const cartCount=()=>cart.reduce((s,c)=>s+c.qty,0);
const lineGross=c=>{const p=prodOf(c.pid);return p?p.price*c.qty:0};
const lineDisc=c=>discOf(c.d.t,c.d.v,lineGross(c));
const subTotal=()=>cart.reduce((s,c)=>s+lineGross(c),0);
const linesDisc=()=>cart.reduce((s,c)=>s+lineDisc(c),0);
const afterLines=()=>subTotal()-linesDisc();
const orderDisc=()=>discOf(disc.t,disc.v,afterLines());
const discAmt=()=>linesDisc()+orderDisc();
const grandTotal=()=>subTotal()-discAmt();
const cartCost=()=>cart.reduce((s,c)=>{const p=prodOf(c.pid);return s+(p?costOf(p)*c.qty:0)},0);
function addToCart(pid,r){
const p=prodOf(pid);if(!p)return;
if(!fits(pid))return toast("Not enough stock for "+p.name);
const c=cart.find(x=>x.pid===pid);
if(c)c.qty++;else cart.push({pid,qty:1,d:{t:"amt",v:0}});
refreshSell();if(r)reviewOrder();
}
function decCart(pid,r){
const c=cart.find(x=>x.pid===pid);if(!c)return;
c.qty--;if(c.qty<=0)cart=cart.filter(x=>x.pid!==pid);
if(!cart.length){disc={t:"amt",v:0};closeSheet();refreshSell();return}
refreshSell();if(r)reviewOrder();
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
if(!cart.length)return "";
return `<div class="obar"><div class="t"><span>${cartCount()} ${cartCount()===1?"item":"items"} in order</span><b>${naira(grandTotal())}</b></div><button onclick="reviewOrder()">View order</button></div>`;
}
screens.sell=()=>`<h1>New Sale</h1><p class="sub">Tap + Add on a product to start the customer’s order.</p><input id="q" placeholder="Search products..." value="${esc(sq)}" oninput="setSq(this.value)"><div class="grid" id="grid">${gridHTML()}</div><div style="height:100px"></div><div id="order">${orderHTML()}</div>`;

function reviewOrder(){
if(!cart.length)return toast("Add products first");
const old=document.querySelector("#sheet .panel"),st=old?old.scrollTop:0;
const rows=cart.map(c=>{
const p=prodOf(c.pid),g=lineGross(c),d=lineDisc(c);
return `<div class="oi"><div class="oe">${pic(p.name)}</div><div class="ob"><b>${esc(p.name)}</b><span class="small">${naira(p.price)} each</span><div class="oq"><button onclick="decCart('${p.id}',true)">−</button><b>${c.qty}</b><button onclick="addToCart('${p.id}',true)">+</button></div></div><div class="op"><b>${naira(g-d)}</b>${d?`<span class="small" style="color:var(--red);font-weight:700">Discount -${naira(d)}</span>`:""}<button class="pill" onclick="discForm('${p.id}')">${d?"Change discount":"Discount"}</button></div></div>`;
}).join("");
const ld=linesDisc(),od=orderDisc();
sheet(`<h1>Your order</h1><p class="sub">${cartCount()} ${cartCount()===1?"item":"items"}</p>${rows}<div class="dsh"></div>
<div class="it"><span>Subtotal</span><span>${naira(subTotal())}</span></div>
${ld?`<div class="it" style="color:var(--red)"><span>Item discounts</span><span>-${naira(ld)}</span></div>`:""}
${od?`<div class="it" style="color:var(--red);font-weight:700"><span>Order discount${disc.t==="pct"?" ("+disc.v+"%)":""}</span><span>-${naira(od)}</span></div>`:""}
<div class="it" style="margin-top:6px"><span class="big">Total</span><span class="big" style="font-size:30px">${naira(grandTotal())}</span></div>
<button class="btn sm ghost" onclick="discForm('order')">${od?"Change order discount":"Discount on whole order"}</button><div class="gap"></div>
<button class="btn" onclick="openPay()">Proceed to Payment</button><div class="gap"></div>
<button class="btn ghost" onclick="closeSheet()">Back to products</button>`);
const np=document.querySelector("#sheet .panel");if(np)np.scrollTop=st;
}
function curDisc(){return dTarget==="order"?disc:cart.find(c=>c.pid===dTarget).d}
function discBase(){return dTarget==="order"?afterLines():lineGross(cart.find(c=>c.pid===dTarget))}
function discForm(target){
if(target)dTarget=target;
if(dTarget!=="order"&&!cart.find(c=>c.pid===dTarget))return;
const cur=curDisc(),base=discBase();
const name=dTarget==="order"?"Whole order":prodOf(dTarget).name;
const quick=cur.t==="pct"?[5,10,15,20]:[100,200,500,1000];
sheet(`<h1>Discount</h1><p class="sub">${esc(name)} · ${naira(base)}</p>
<div class="seg"><button class="${cur.t==="amt"?"on":""}" onclick="setDiscType('amt')">₦ Amount</button><button class="${cur.t==="pct"?"on":""}" onclick="setDiscType('pct')">% Percent</button></div>
<div class="pills">${quick.map(q=>`<button class="pill" onclick="quickDisc(${q})">${cur.t==="pct"?q+"%":"₦"+q}</button>`).join("")}</div>
<input id="d_val" type="number" inputmode="decimal" placeholder="${cur.t==="pct"?"or type a percent":"or type an amount"}" value="${cur.v||""}" oninput="discPreview()">
<div class="card" id="d_prev" style="box-shadow:none;border:2px solid #e7d8f7"></div>
<button class="btn green" onclick="applyDisc()">Apply discount</button><div class="gap"></div>
${cur.v?`<button class="btn redline" onclick="clearDisc()">Remove discount</button><div class="gap"></div>`:""}
<button class="btn ghost" onclick="reviewOrder()">Cancel</button>`);
discPreview();
}
function quickDisc(v){$("#d_val").value=v;discPreview()}
function setDiscType(t){const v=parseFloat($("#d_val").value)||0;const c=curDisc();c.t=t;c.v=v;discForm()}
function discPreview(){
const v=parseFloat($("#d_val").value)||0,cur=curDisc(),base=discBase(),d=discOf(cur.t,v,base),nt=base-d;
let below=false;
if(dTarget==="order")below=(afterLines()-discOf(cur.t,v,afterLines()))<cartCost();
else{const c=cart.find(x=>x.pid===dTarget),p=prodOf(c.pid);below=nt<costOf(p)*c.qty}
$("#d_prev").innerHTML=`<div class="it"><span>Discount</span><b>${naira(d)}</b></div><div class="it" style="margin:0"><span>New price</span><b>${naira(nt)}</b></div>`+(below&&isOwner()?`<p class="small" style="color:var(--red);font-weight:700;margin:8px 0 0">This price is below what you paid for it.</p>`:"");
}
function applyDisc(){
const v=parseFloat($("#d_val").value)||0,cur=curDisc();
if(v<0)return toast("Discount cannot be negative");
if(cur.t==="pct"&&v>100)return toast("Percent cannot be more than 100");
cur.v=v;refreshSell();reviewOrder();toast(v?"Discount added":"No discount");
}
function clearDisc(){const c=curDisc();c.v=0;refreshSell();reviewOrder()}

function openPay(){
if(!cart.length)return;
const u=usage(),its=items();
for(const id in u){const i=its.find(x=>x.id===id);if(!i||u[id]>i.stock+1e-9)return toast("Not enough stock. Please check your order")}
payType="";drawPay();
}
function setPay(k){payType=k;drawPay()}
function bankCards(){
const b=DB.get("banks",[]);
if(!b.length)return `<div class="card" style="box-shadow:none;border:2px dashed #d9c8ee"><p class="sub" style="margin:0 0 10px">No bank account saved yet. Save your account once in Settings and it will show here every time.</p><button class="btn sm ghost" onclick="closeSheet();go('settings')">Add bank account</button></div>`;
return b.map(a=>`<div class="bank"><div class="small">${esc(a.bank)}</div><div class="acct">${esc(a.number)}</div><div style="font-weight:700">${esc(a.name)}</div><div class="row" style="margin-top:10px"><button class="btn sm ghost" onclick="copyAcct('${a.id}')">Copy number</button><button class="btn sm ghost" onclick="shareAcct('${a.id}')">Share details</button></div></div>`).join("");
}
function copyAcct(id){
const a=DB.get("banks",[]).find(x=>x.id===id);if(!a)return;
try{navigator.clipboard.writeText(a.number).then(()=>toast("Account number copied"),()=>toast("Could not copy"))}catch(e){toast("Could not copy")}
}
async function shareAcct(id){
const a=DB.get("banks",[]).find(x=>x.id===id);if(!a)return;
const txt=a.bank+"\nAccount number: "+a.number+"\nAccount name: "+a.name;
try{if(navigator.share){await navigator.share({text:txt});return}}catch(e){if(e&&e.name==="AbortError")return}
try{await navigator.clipboard.writeText(txt);toast("Details copied")}catch(e){toast("Could not share")}
}
function drawPay(){
const t=grandTotal(),d=discAmt();
const tile=(k,ico,l)=>`<button class="paytile ${payType===k?"on":""}" onclick="setPay('${k}')"><span style="font-size:30px">${ico}</span>${l}</button>`;
const ck=txt=>`<label class="chk"><input type="checkbox" id="p_ok" style="width:28px;height:28px;margin:0;padding:0">${txt}</label>`;
let box=`<p class="sub">Choose how the customer is paying.</p>`;
if(payType==="cash")box=`<label>Amount received (₦) <span class="small">optional</span></label><input id="p_recv" type="number" inputmode="decimal" placeholder="${t}" oninput="recvChange()"><p class="big" id="p_change" style="margin:0 0 6px;color:var(--green)"></p>`+ck(`I have received ${naira(t)} in cash.`);
if(payType==="pos")box=ck(`The POS terminal shows APPROVED for ${naira(t)}.`);
if(payType==="transfer")box=`<p class="sub" style="margin:0">Show the customer where to send ${naira(t)}:</p>`+bankCards()+ck(`I confirmed ${naira(t)} in my bank app or SMS alert, not a customer screenshot.`);
sheet(`<h1>Has the customer paid you?</h1>
<div class="big" style="font-size:34px">${naira(t)}</div>${d?`<p class="small" style="margin:0">After ${naira(d)} discount</p>`:""}
<div class="paygrid">${tile("cash","💵","Cash")}${tile("pos","💳","POS")}${tile("transfer","🏦","Transfer")}</div>${box}
<div class="slide"><span>Slide to confirm payment received</span><input type="range" id="slide" min="0" max="100" value="0" onchange="slideEnd()"></div>
<div class="gap"></div><button class="btn ghost" onclick="reviewOrder()">Back to order</button>`);
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
const recv=(payType==="cash"&&$("#p_recv")&&$("#p_recv").value!=="")?parseFloat($("#p_recv").value):null;
const lines=cart.map(c=>{const p=prodOf(c.pid);return{pid:p.id,name:p.name,qty:c.qty,price:p.price,disc:lineDisc(c),cost:Math.round(costOf(p)*100)/100}});
const subtotal=subTotal(),od=orderDisc(),discount=discAmt(),total=subtotal-discount;
const cost=Math.round(lines.reduce((s,l)=>s+l.cost*l.qty,0)*100)/100;
const no=nextNo();
const sale={id:DB.id(),no,date:new Date().toISOString(),lines,subtotal,orderDiscount:od,discount,discType:disc.t,discValue:disc.v,total,pay:payType,received:recv,cost,profit:Math.round((total-cost)*100)/100,by:"Owner",status:"paid"};
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

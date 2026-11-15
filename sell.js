let cart=[],sq="";
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
const cartTotal=()=>cart.reduce((s,c)=>{const p=prods().find(x=>x.id===c.pid);return s+(p?p.price*c.qty:0)},0);
const cartCount=()=>cart.reduce((s,c)=>s+c.qty,0);
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
refreshSell();
}
function refreshSell(){if(current==="sell"){$("#grid").innerHTML=gridHTML();$("#order").innerHTML=orderHTML()}}
function setSq(v){sq=v;$("#grid").innerHTML=gridHTML()}
function openProducts(){stockTab="items";go("stock")}
function pay(){toast("Payment confirmation comes in the next piece")}
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
return `<b>Current order · ${cartCount()} ${cartCount()===1?"item":"items"}</b><div style="max-height:28vh;overflow-y:auto">${rows}</div><div class="it" style="margin:8px 0"><span class="big">Total</span><span class="big">${naira(cartTotal())}</span></div><button class="btn" ${cart.length?"":"disabled"} onclick="pay()">Proceed to Payment</button>`;
}
screens.sell=()=>`<h1>New Sale</h1><p class="sub">Tap + Add to put products in the customer’s order.</p><input id="q" placeholder="Search products..." value="${esc(sq)}" oninput="setSq(this.value)"><div class="grid" id="grid">${gridHTML()}</div><div class="card" id="order" style="position:sticky;bottom:0;margin-top:14px;box-shadow:0 -4px 16px #4a237030">${orderHTML()}</div>`;

const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const naira=n=>"₦"+Math.round(Number(n)||0).toLocaleString("en-NG");
const store={
get(k,d){try{return localStorage.getItem(k)||d}catch(e){return d}},
set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
};
function fmt(i,q){
q=Number(q)||0;
const r=n=>String(Math.round(n*100)/100);
if(i.unit==="g")return q>=1000?r(q/1000)+" kg":r(q)+" g";
if(i.unit==="ml")return q>=1000?r(q/1000)+" L":r(q)+" ml";
return r(q)+(q===1?" piece":" pieces");
}
const isLow=i=>i.stock<=i.min;
function sheet(h){$("#sheet").innerHTML='<div class="back" onclick="closeSheet()"></div><div class="panel">'+h+'</div>';$("#sheet").classList.add("open")}
function closeSheet(){$("#sheet").classList.remove("open");$("#sheet").innerHTML=""}
let tt;
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("show"),2200)}
const products=[["🍚","Rice 1kg","₦2,500"],["🛢️","Vegetable Oil 1L","₦3,000"],["🥚","Eggs (Tray)","₦5,000"],["🍝","Spaghetti 500g","₦1,200"],["🍅","Tomato 1kg","₦1,200"],["🧅","Onion 1kg","₦1,000"]];
const tabs=[["dash","🏠","Dashboard"],["sell","🛒","Sell"],["stock","📦","Stock"],["hist","🧾","History"],["money","💰","Money"]];
let current="sell",order=0;
const shop=()=>store.get("shopName","My Shop");
function tiles(q){
return products.filter(p=>p[1].toLowerCase().includes(q)).map(p=>`<div class="tile"><div class="emoji">${p[0]}</div><b>${p[1]}</b><span>${p[2]}</span><button class="btn green" onclick="add()">+ Add</button></div>`).join("")||"<p class='sub'>No product found</p>";
}
function add(){order++;$("#oc").textContent=order+(order===1?" item":" items");$("#paybtn").disabled=false}
function filter(){$("#grid").innerHTML=tiles($("#q").value.toLowerCase())}
function pay(){toast("Payment comes in a later piece")}
function saveShop(){store.set("shopName",$("#sn").value.trim()||"My Shop");toast("Saved");render()}
const info=(t,s)=>`<h1>${t}</h1><div class="card"><p class="sub">${s}</p></div>`;
const screens={
dash:()=>{
const low=DB.get("items",[]).filter(isLow);
return `<h1>Good day 👋</h1><p class="sub">${esc(shop())}</p><div class="card"><b>Running low</b>`+(low.length?low.map(i=>`<div class="it"><span>${esc(i.name)}</span><span class="small">${fmt(i,i.stock)} left</span></div>`).join(""):`<p class="sub" style="margin:0">Nothing is running low.</p>`)+`</div><div class="card"><p class="sub" style="margin:0">Weather, sales chart and more come in later pieces.</p></div>`;
},
sell:()=>`<h1>New Sale</h1><p class="sub">Find products and add them to the customer’s order.</p><input id="q" placeholder="Search products..." oninput="filter()"><div class="grid" id="grid">${tiles("")}</div><div class="card" style="margin-top:14px"><b id="oc">${order} items</b><button class="btn" id="paybtn" onclick="pay()" ${order?"":"disabled"}>Proceed to Payment</button></div>`,
stock:()=>info("Stock","Coming soon."),
hist:()=>info("History","Sales, receipts and verification come in later pieces."),
money:()=>info("Money","Expenses and reports come in later pieces."),
profile:()=>info("Profile","Shop: "+esc(shop())+"<br>Role: Owner"),
settings:()=>`<h1>Settings</h1><div class="card"><b>Shop name</b><input id="sn" value="${esc(shop())}"><button class="btn green" onclick="saveShop()">Save</button></div>`
};
function go(t){current=t;render()}
function render(){
closeSheet();
$("#screen").innerHTML=screens[current]();
$("#nav").innerHTML=tabs.map(t=>`<button class="${t[0]===current?"on":""}" onclick="go('${t[0]}')"><i>${t[1]}</i>${t[2]}</button>`).join("");
$("#av").textContent=shop().charAt(0).toUpperCase();
$("#screen").scrollTop=0;
}
function net(){$("#dot").className="dot"+(navigator.onLine?"":" off")}
addEventListener("online",net);addEventListener("offline",net);

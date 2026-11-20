document.head.insertAdjacentHTML("beforeend",`<style>
.pimg{width:1.5em;height:1.5em;border-radius:8px;object-fit:cover;vertical-align:middle}
.emoji .pimg{width:68px;height:68px;border-radius:18px}
.oe .pimg{width:52px;height:52px;border-radius:14px}
.kpi{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
.kc{display:flex;flex-direction:column;gap:2px;text-align:left;background:rgba(255,255,255,.93);border:1px solid rgba(255,255,255,.9);border-radius:20px;padding:14px;color:var(--grape);box-shadow:0 1px 2px rgba(74,35,112,.06),0 10px 24px rgba(74,35,112,.09)}
.kc span{font-size:13px;font-weight:700;color:var(--muted)}
.kc b{font-size:22px;line-height:1.2}
.kc:active{transform:scale(.98)}
.pc{padding:14px}
.pcrow{display:flex;gap:12px;align-items:center;margin-bottom:12px}
.pcimg{width:64px;height:64px;border-radius:18px;background:#F4EEFB;display:grid;place-items:center;font-size:36px;overflow:hidden;flex:none}
.pcimg img{width:100%;height:100%;object-fit:cover}
.pcinfo{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;align-items:flex-start}
.on-chip,.off-chip{display:inline-block;font-size:12px;font-weight:800;border-radius:999px;padding:3px 10px}
.on-chip{background:#e8f8ee;color:#15803d}
.off-chip{background:#f1e9fa;color:#7a6a8a}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.g2 .btn{margin-top:0}
.emg{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:10px 0}
.emg button{height:48px;font-size:26px;border-radius:14px;border:2px solid #e3d6f3;background:#fff}
.emg button.on{border-color:var(--green);background:#e8f8ee}
.pbig{width:96px;height:96px;border-radius:26px;background:#F4EEFB;display:grid;place-items:center;font-size:54px;overflow:hidden;margin:0 auto 12px}
.pbig img{width:100%;height:100%;object-fit:cover}
</style>`);
LABELS.splice(LABELS.length-1,0,"Kg","Litre","Cup","Derica");

/* ---------- Pictures: your own photo, or a system picture ---------- */
function autoPic(n){for(const p of PICS)if(new RegExp("\\b"+p[0],"i").test(String(n)))return p[1];return "🛒"}
const thumb=i=>i.img?`<img src="${i.img}" alt="">`:(i.emoji||autoPic(i.name));
function pic(n){
const it=items().find(x=>x.name===n);
if(it){if(it.img)return `<img class="pimg" src="${it.img}" alt="">`;if(it.emoji)return it.emoji}
return autoPic(n);
}
const EMOJIS=["🍚","🍞","🥚","🥛","🧃","🥤","💧","🍺","🍫","🍬","🍪","🍜","🍝","🍗","🐟","🥩","🍅","🧅","🌶️","🥔","🍠","🍌","🍎","🍊","🧴","🧼","🔋","💡","📱","👕"];
let pf={id:"",img:"",emoji:""};
const pfShow=name=>pf.img?`<img src="${pf.img}" alt="">`:(pf.emoji||autoPic(name||""));
function updPic(){
const b=$("#pbig");if(b)b.innerHTML=pfShow($("#pr_name")?$("#pr_name").value:"");
document.querySelectorAll(".emg button").forEach(x=>x.classList.toggle("on",!pf.img&&x.textContent===pf.emoji));
}
function pickEmoji(e){pf.emoji=e;pf.img="";updPic()}
function autoPicture(){pf.emoji="";pf.img="";updPic()}
function pickPhoto(inp){
const f=inp.files&&inp.files[0];if(!f)return;
const fr=new FileReader();
fr.onload=()=>{
const im=new Image();
im.onload=()=>{
const S=200,c=document.createElement("canvas");c.width=c.height=S;
const r=Math.min(im.width,im.height);
c.getContext("2d").drawImage(im,(im.width-r)/2,(im.height-r)/2,r,r,0,0,S,S);
pf.img=c.toDataURL("image/jpeg",0.72);pf.emoji="";updPic();toast("Photo added");
};
im.onerror=()=>toast("Could not read this photo");
im.src=fr.result;
};
fr.onerror=()=>toast("Could not read this photo");
fr.readAsDataURL(f);
}

/* ---------- Product tab: add a product, then the list of products ---------- */
screens.product=()=>{
const own_=isOwner(),list=items().slice().reverse();
const head=`<h1>Product</h1><button class="btn green" onclick="productSheet()">+ Add product</button><div class="gap"></div>`;
if(!list.length)return head+`<div class="card"><p class="sub" style="margin:0">No products yet. Tap Add product to add your first one. Every product you add will show here.</p></div>`;
return head+list.map(i=>productCard(i,own_)).join("");
};
function productCard(i,own_){
const dp=directOf(i),on=!!dp,price=dp?dp.price:(i.price!=null?i.price:null);
const tag=isLow(i)?`<span class="badge">${i.stock<=0?"Out":"Low"}</span>`:"";
const ptxt=price==null?"No price yet":naira(price)+(i.unit!=="piece"&&dp?" for "+fmt(i,dp.lines[0].qty):"");
const chip=on?`<span class="on-chip">On sale ✓</span>`:`<span class="off-chip">Not on sale</span>`;
const btns=own_?`<div class="g2">${on?`<button class="btn sm ghost" onclick="stopSell('${i.id}')">Stop selling</button>`:`<button class="btn sm green" onclick="putOnSell('${i.id}')">Put on sell</button>`}<button class="btn sm" onclick="productSheet('${i.id}')">Edit / Restock</button><button class="btn sm ghost" onclick="moveForm('${i.id}','waste')">Waste</button><button class="btn sm redline" onclick="confirmDelete('${i.id}')">Delete</button></div>`:`<div class="g2"><button class="btn sm" onclick="moveForm('${i.id}','restock')">Restock</button><button class="btn sm ghost" onclick="moveForm('${i.id}','waste')">Waste</button></div>`;
return `<div class="card pc"><div class="pcrow"><div class="pcimg">${thumb(i)}</div><div class="pcinfo"><button class="nm" onclick="itemHistory('${i.id}')">${esc(i.name)}${tag}</button><span class="small">Stock: ${fmt(i,i.stock)}</span><b style="font-size:18px">${ptxt}</b>${chip}</div></div>${btns}</div>`;
}
function productSheet(id){
const i=id?items().find(x=>x.id===id):null,own_=isOwner(),legacy=!!i&&i.unit!=="piece";
const dp=i?directOf(i):null;
const price=i?(i.price!=null?i.price:(dp?dp.price:"")):"";
pf={id:id||"",img:i&&i.img||"",emoji:i&&i.emoji||""};
const cap=t=>t?t.charAt(0).toUpperCase()+t.slice(1):"";
const lab=cap(i&&i.label||"piece"),known=LABELS.includes(lab)&&lab!=="Other",labCur=known?lab:"Other";
let mid="";
if(legacy){
mid=`<p class="sub" style="margin:4px 0 8px">This product is sold by weight or volume. In stock now: <b>${fmt(i,i.stock)}</b></p><div class="g2"><button class="btn sm ghost" onclick="moveForm('${i.id}','restock')">Restock</button><button class="btn sm ghost" onclick="sellForm('${i.id}')">Change selling price</button></div><div class="gap"></div>`;
}else{
mid=(own_?`<label>Selling price (₦)</label><input id="pr_price" type="number" inputmode="decimal" value="${price}" placeholder="e.g. 1000">`:`<p class="small">The owner will set the selling price.</p>`)+
`<label>What do you call one?</label>${pills("pr_label",LABELS,labCur)}`+
(i?`<p class="sub" style="margin:4px 0 8px">In stock now: <b>${fmt(i,i.stock)}</b></p><label>Add stock (restock)</label><input id="pr_add" type="number" inputmode="decimal" placeholder="0">`:`<label>How many do you have now?</label><input id="pr_stock" type="number" inputmode="decimal" placeholder="0">`);
}
sheet(`<h1>${i?"Edit / Restock":"Add product"}</h1>
<div class="pbig" id="pbig">${pfShow(i?i.name:"")}</div>
<div class="g2"><label class="btn ghost sm" style="display:flex;align-items:center;justify-content:center;margin:0;min-height:48px;font-size:15px">📷 Upload photo<input type="file" accept="image/*" style="display:none" onchange="pickPhoto(this)"></label><button class="btn ghost sm" onclick="autoPicture()">✨ Automatic picture</button></div>
<label>Or choose a system picture</label><div class="emg">${EMOJIS.map(e=>`<button onclick="pickEmoji('${e}')">${e}</button>`).join("")}</div>
<label>Product name</label><input id="pr_name" value="${esc(i?i.name:"")}" placeholder="e.g. Coke" oninput="updPic()">
${mid}
<label>Warn me when stock is this low <span class="small">optional</span></label><input id="pr_min" type="number" inputmode="decimal" value="${i&&i.min?i.min:""}" placeholder="e.g. 5">
${!i&&own_?`<label>Show on the Dashboard to sell?</label>${pills("pr_show",["Yes, now","Not yet"],"Yes, now")}`:""}
<button class="btn green" onclick="saveProduct('${id||""}')">Save</button><div class="gap"></div><button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
updPic();
}
function saveProduct(id){
const name=$("#pr_name").value.trim();
if(!name)return toast("Please type the product name");
const own_=isOwner(),list=items(),i=id?list.find(x=>x.id===id):null,legacy=!!i&&i.unit!=="piece";
const min=parseFloat($("#pr_min").value)||0;
let price=null;
if(own_&&!legacy&&$("#pr_price")){
const ps=$("#pr_price").value.trim();
if(ps!==""){price=parseFloat(ps);if(!(price>=0))return toast("Please type a valid price")}
}
const label=legacy?"":(pillVal("pr_label")||"Piece").toLowerCase();
if(i){
const oldName=i.name;
Object.assign(i,{name,min,img:pf.img,emoji:pf.emoji});
if(!legacy){
i.label=label;
if(own_)i.price=price;
const add=parseFloat($("#pr_add")&&$("#pr_add").value)||0;
if(add>0){i.stock=Math.round((i.stock+add)*10000)/10000;addMove(i.id,"restock",add,"")}
}
DB.set("items",list);
const dp=directOf(i,oldName);
if(dp&&!legacy&&own_){if(price==null)syncDirect(i,null,oldName);else syncDirect(i,price,oldName,1)}
else if(dp&&legacy&&oldName!==name)syncDirect(i,dp.price,oldName,dp.lines[0].qty);
toast("Saved");
}else{
const stock=parseFloat($("#pr_stock").value)||0;
const item={id:DB.id(),name,unit:"piece",label,packSize:1,packPrice:null,stock,min,price,img:pf.img,emoji:pf.emoji};
list.push(item);DB.set("items",list);
if(stock>0)addMove(item.id,"opening",stock,"");
const show=own_&&pillVal("pr_show")==="Yes, now";
if(show&&price!=null){syncDirect(item,price,name,1);toast("Saved. It is on the Dashboard.")}
else if(show){toast("Saved. Add a price to put it on sale.")}
else toast("Saved");
}
render();
}
function putOnSell(id){
const i=items().find(x=>x.id===id);
if(i.unit!=="piece"||i.price==null||isNaN(i.price))return sellForm(id);
syncDirect(i,i.price,i.name,1);toast("Now on the Dashboard");render();
}
function stopSell(id){const i=items().find(x=>x.id===id);syncDirect(i,null,i.name);toast("Removed from the Dashboard");render()}
function saveSell(id){
const l=items(),i=l.find(x=>x.id===id),p=parseFloat($("#s_price").value);
if(!(p>=0))return toast("Please type the selling price");
let qty=1;
if(i.unit!=="piece"){
const lab=$("#s_amt").value;
if(lab==="Other")qty=parseFloat($("#s_amt_o").value);
else{const f=AMTS[i.unit].find(a=>a[0]===lab);qty=f?f[1]:0}
if(!(qty>0))return toast("Please choose how much is sold");
}else{i.price=p;DB.set("items",l)}
syncDirect(i,p,i.name,qty);toast("Now on the Dashboard");render();
}

/* ---------- Dashboard: today and yesterday, then everything on sale ---------- */
function gridHTML(){
const list=prods();
if(!list.length)return `<div class="card" style="grid-column:1/-1"><p class="sub" style="margin:0 0 12px">Nothing to sell yet. Add your first product, then tap Put on sell.</p><button class="btn" onclick="go('product')">Go to Product</button></div>`;
const q=sq.toLowerCase();
const f=list.filter(p=>p.name.toLowerCase().includes(q));
if(!f.length)return `<p class="sub">No product found</p>`;
return f.map(p=>{
const n=servingsLeft(p);
const st=n<=0?`<span style="color:var(--red);font-weight:700">Out of stock</span>`:(n<=5?`<span style="color:var(--red);font-weight:700">${n} left</span>`:`<span style="color:var(--green);font-weight:700">In stock</span>`);
return `<div class="tile"><div class="emoji">${pic(p.name)}</div><b>${esc(p.name)}</b><span>${naira(p.price)}</span><br>${st}<button class="btn green" ${n<=0?"disabled":""} onclick="addToCart('${p.id}')">+ Add</button></div>`;
}).join("");
}
function refreshSell(){
if(current==="dash"){const g=$("#grid"),o=$("#order");if(g)g.innerHTML=gridHTML();if(o)o.innerHTML=orderHTML()}
}
function openProducts(){go("product")}
screens.dash=()=>{
const S=DB.get("sales",[]),tS=S.filter(s=>inR(s.date,rangeOf("today"))),yS=S.filter(s=>inR(s.date,rangeOf("yesterday")));
const low=items().filter(isLow).length,rem=isOwner()?remindItems().length:0;
const n=a=>a.length+" sale"+(a.length===1?"":"s");
return `<div class="kpi"><div class="kc"><span>📅 Today</span><b>${naira(sumOf(tS,s=>s.total))}</b><span>${n(tS)}</span></div><div class="kc"><span>🕘 Yesterday</span><b>${naira(sumOf(yS,s=>s.total))}</b><span>${n(yS)}</span></div></div>`+
(rem?`<div class="card" style="border:2px solid #f59e0b;background:#fffbeb" onclick="go('fin')"><b>⏰ ${rem} payment reminder${rem>1?"s":""}</b><p class="sub" style="margin:0">Tap to open Finance.</p></div>`:"")+
(low?`<div class="card" onclick="go('product')"><b>⚠️ ${low} product${low>1?"s":""} running low</b><p class="sub" style="margin:0">Tap to see them in Product.</p></div>`:"")+
`<h1 style="font-size:22px">Tap a product to sell</h1><input id="q" placeholder="Search products..." value="${esc(sq)}" oninput="setSq(this.value)"><div class="grid" id="grid">${gridHTML()}</div><div style="height:100px"></div><div id="order">${orderHTML()}</div>`;
};

/* ---------- The five buttons ---------- */
tabs.length=0;
tabs.push(["dash","🏠","Dashboard"],["product","📦","Product"],["vault","🔐","Vault"],["fin","💼","Finance"],["hist","🧾","History"]);
current="dash";
const _go3=go;
go=function(t){if(t==="sell")t="dash";if(t==="stock")t="product";_go3(t)};

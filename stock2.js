/* ---------- Buying price is optional and private (it is set inside the Vault) ---------- */
const hasCost=i=>i.packPrice!=null&&i.packPrice!==""&&!isNaN(i.packPrice)&&Number(i.packSize)>0;
function costOf(p){return p.lines.reduce((s,l)=>{const i=itemById(l.itemId);return s+(i&&hasCost(i)?l.qty*i.packPrice/i.packSize:0)},0)}
const costKnown=p=>p.lines.every(l=>{const i=itemById(l.itemId);return i&&hasCost(i)});

/* ---------- Put on sale: only the selling price (and how much is sold) ---------- */
const AMTS={g:[["100 g",100],["250 g",250],["500 g",500],["1 kg",1000],["Other",0]],ml:[["100 ml",100],["250 ml",250],["500 ml",500],["1 L",1000],["Other",0]]};
function syncDirect(i,price,oldName,qty){
const pl=DB.get("products",[]);
const ix=pl.findIndex(p=>isDirect(p,i,oldName));
if(price==null){if(ix>=0)pl.splice(ix,1)}
else{
const q=qty||(ix>=0?pl[ix].lines[0].qty:1);
const name=i.unit==="piece"?i.name:i.name+" "+fmt(i,q);
const rec={name,price,item:i.id,lines:[{itemId:i.id,qty:q}]};
if(ix>=0)Object.assign(pl[ix],rec);else pl.push(Object.assign({id:DB.id()},rec));
}
DB.set("products",pl);
}
function sellForm(id){
const i=items().find(x=>x.id===id),dp=directOf(i),isP=i.unit==="piece";
let amt="",m=null;
if(!isP){
const q=dp?dp.lines[0].qty:1000;
m=AMTS[i.unit].find(a=>a[1]===q&&a[0]!=="Other");
amt=`<label>Sold by (tap one)</label>${pills("s_amt",AMTS[i.unit].map(a=>a[0]),m?m[0]:"Other")}`;
}
sheet(`<h1>${dp?"Change price":"Put "+esc(i.name)+" on sale"}</h1><p class="sub">Type your selling price.${isP?"":" Then choose how much a customer gets for that price."}</p>${amt}
<label>${isP?"Selling price of one (₦)":"Selling price for this amount (₦)"}</label><input id="s_price" type="number" inputmode="decimal" value="${dp?dp.price:""}" placeholder="e.g. 3000">
<button class="btn green" onclick="saveSell('${id}')">${dp?"Save price":"Put on sale"}</button><div class="gap"></div>
${dp?`<button class="btn redline" onclick="stopSale('${id}')">Stop selling this</button><div class="gap"></div>`:""}
<button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
if(!isP&&!m){$("#s_amt_o").value=dp?dp.lines[0].qty:"";}
}
function saveSell(id){
const i=items().find(x=>x.id===id),p=parseFloat($("#s_price").value);
if(!(p>=0))return toast("Please type the selling price");
let qty=1;
if(i.unit!=="piece"){
const lab=$("#s_amt").value;
if(lab==="Other")qty=parseFloat($("#s_amt_o").value);
else{const f=AMTS[i.unit].find(a=>a[0]===lab);qty=f?f[1]:0}
if(!(qty>0))return toast("Please choose how much is sold");
}
syncDirect(i,p,i.name,qty);toast("Saved");render();
}
function stopSale(id){const i=items().find(x=>x.id===id);syncDirect(i,null,i.name);toast("Stopped selling");render()}

/* ---------- Item cards and form: no buying price here ---------- */
function itemCard(i){
const tag=isLow(i)?`<span class="badge">${i.stock<=0?"Out":"Low"}</span>`:"";
const dp=directOf(i);
const sale=dp?`<p class="small" style="margin:0 0 10px;color:var(--green);font-weight:700">On sale · ${naira(dp.price)}${i.unit==="piece"?"":" for "+fmt(i,dp.lines[0].qty)}</p>`:"";
const putBtn=dp?"":`<button class="btn sm green" onclick="sellForm('${i.id}')">Put on sale</button><div class="gap"></div>`;
return `<div class="card"><div class="it"><button class="nm" onclick="itemHistory('${i.id}')">${esc(i.name)}${tag}</button><span class="big">${fmt(i,i.stock)}</span></div><p class="small" style="margin:0 0 10px">Warn me at ${fmt(i,i.min)} or less</p>${sale}${putBtn}<div class="row"><button class="btn sm" onclick="moveForm('${i.id}','restock')">Restock</button><button class="btn sm ghost" onclick="moveForm('${i.id}','waste')">Waste</button><button class="btn sm ghost" onclick="itemForm('${i.id}')">Edit</button></div>${dp?`<div class="gap"></div><button class="btn sm ghost" onclick="sellForm('${i.id}')">Change selling price</button>`:""}</div>`;
}
function unitHint(fromChange){
const u=$("#f_unit").value;
$("#labelBox").style.display=u==="piece"?"block":"none";
$("#auBox").style.display=u==="piece"?"none":"block";
const sb=$("#sellBox");if(sb)sb.style.display=u==="piece"?"block":"none";
const ns=$("#noSell");if(ns)ns.style.display=u==="piece"?"none":"block";
if(fromChange&&u!=="piece"){
const opts=u==="g"?["kg","g"]:["L","ml"];
$("#f_au_p").innerHTML=opts.map(o=>`<button class="pill ${o===opts[0]?"on":""}" onclick="pickPill('f_au',this)">${o}</button>`).join("");
$("#f_au").value=opts[0];
}
prevUnit=u;
}
function itemForm(id){
const i=id?items().find(x=>x.id===id):{name:"",unit:"piece",label:"",stock:"",min:""};
const dp=id&&i.unit==="piece"?directOf(i):null;
const cap=t=>t?t.charAt(0).toUpperCase()+t.slice(1):"";
const lab=cap(i.label||"piece"),known=LABELS.includes(lab)&&lab!=="Other",labCur=known?lab:"Other";
const big=i.unit!=="piece"&&(i.stock>=1000||i.min>=1000);
const mult=big?1000:1;
const sv=i.stock===""?"":Math.round(i.stock/mult*1000)/1000,mv=i.min===""?"":Math.round(i.min/mult*1000)/1000;
const auOpts=i.unit==="ml"?["L","ml"]:["kg","g"];
const auCur=i.unit==="ml"?(big?"L":"ml"):(big?"kg":"g");
sheet(`<h1>${id?"Edit item":"Add item"}</h1>
<label>Name</label><input id="f_name" value="${esc(i.name)}" placeholder="e.g. Coke, Battery, Rice">
<label>How do you count it?</label>${kindTiles(i.unit)}
<div id="labelBox"><label>What do you call one?</label>${pills("f_label",LABELS,labCur)}</div>
<div id="auBox"><label>Type amounts in</label>${pills("f_au",auOpts,i.unit==="piece"?auOpts[0]:auCur)}</div>
<label>Stock you have now</label><input id="f_stock" type="number" inputmode="decimal" value="${sv}" placeholder="0">
<label>Warn me when stock is this low</label><input id="f_min" type="number" inputmode="decimal" value="${mv}" placeholder="0">
${isOwner()?`<div id="sellBox"><label>Selling price of one (₦) <span class="small">optional</span></label><input id="f_sell" type="number" inputmode="decimal" value="${dp?dp.price:""}" placeholder="Leave empty if you do not sell it directly"></div>
<p class="small" id="noSell">Items sold by weight or volume (like rice or oil): save the item, then tap Put on sale on it.</p>`:`<p class="small">The owner will set the selling price.</p>`}
<button class="btn green" onclick="saveItem('${id||""}')">Save</button><div class="gap"></div>
${id?`<button class="btn redline" onclick="confirmDelete('${id}')">Delete item</button><div class="gap"></div>`:""}
<button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
unitHint(false);
if(!known){$("#f_label_o").value=i.label||"";$("#f_label_o").style.display="block"}
}
function saveItem(id){
const name=$("#f_name").value.trim(),unit=$("#f_unit").value;
const label=unit==="piece"?(pillVal("f_label").toLowerCase()||"piece"):"";
const au=$("#f_au").value,mult=(unit!=="piece"&&(au==="kg"||au==="L"))?1000:1;
const stock=Math.round((parseFloat($("#f_stock").value)||0)*mult*10000)/10000;
const min=Math.round((parseFloat($("#f_min").value)||0)*mult*10000)/10000;
if(!name)return toast("Please type the item name");
const sellStr=(unit==="piece"&&$("#f_sell"))?$("#f_sell").value.trim():"";
const sell=sellStr===""?null:parseFloat(sellStr);
if(sell!==null&&!(sell>=0))return toast("Please type a valid selling price");
const list=items();
let item,oldName,oldUnit;
if(id){
item=list.find(x=>x.id===id);oldName=item.name;oldUnit=item.unit;
const diff=Math.round((stock-item.stock)*10000)/10000;
Object.assign(item,{name,unit,label,min});
if(oldUnit!==unit){item.packSize=unit==="piece"?1:1000;item.packPrice=null}
if(diff!==0){item.stock=stock;addMove(id,"adjust",diff,"")}
}else{
item={id:DB.id(),name,unit,label,packSize:unit==="piece"?1:1000,packPrice:null,stock,min};oldName=name;oldUnit=unit;
list.push(item);
if(stock>0)addMove(item.id,"opening",stock,"");
}
DB.set("items",list);
if(oldUnit!==unit)syncDirect(item,null,oldName);
else if(unit==="piece")syncDirect(item,sell,oldName);
else{const dp=directOf(item,oldName);if(dp&&dp.name!==item.name+" "+fmt(item,dp.lines[0].qty))syncDirect(item,dp.price,oldName,dp.lines[0].qty)}
toast(sell!==null?"Saved. It is ready to sell.":"Saved");render();
}

/* ---------- Restock / waste: type in kg or litres if you like ---------- */
function moveForm(id,type){
const i=items().find(x=>x.id===id),w=type==="waste",isP=i.unit==="piece";
const au=isP?"":`<label>Type the amount in</label>${pills("m_au",i.unit==="ml"?["L","ml"]:["kg","g"],i.unit==="ml"?"L":"kg")}`;
sheet(`<h1>${w?"Record waste":"Restock"}: ${esc(i.name)}</h1><p class="sub">Now: ${fmt(i,i.stock)}</p>${au}
<label>Amount${isP?" ("+unitText(i)+")":""}</label><input id="m_amt" type="number" inputmode="decimal" placeholder="0">
<label>${w?"Why? (tap one)":"Where from? (optional)"}</label>${pills("m_why",w?WASTE:RESTOCK,"")}
<button class="btn ${w?"red":"green"}" onclick="saveMove('${id}','${type}')">${w?"Save waste":"Add stock"}</button><div class="gap"></div>
<button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
}
function saveMove(id,type){
const list=items(),i=list.find(x=>x.id===id);
const mult=(i.unit!=="piece"&&["kg","L"].includes($("#m_au").value))?1000:1;
const amt=Math.round((parseFloat($("#m_amt").value)||0)*mult*10000)/10000,note=pillVal("m_why");
if(!(amt>0))return toast("Type an amount more than 0");
if(type==="waste"&&!note)return toast("Please tap the reason");
if(type==="waste"&&amt>i.stock)return toast("That is more than you have in stock");
const delta=type==="waste"?-amt:amt;
i.stock=Math.round((i.stock+delta)*10000)/10000;
addMove(id,type,delta,note);
DB.set("items",list);toast("Saved");render();
}

/* ---------- Recipes (owner only): cost only when buying prices are set ---------- */
function prodCard(p){
const n=canMake(p),ok=costKnown(p),c=costOf(p),pr=p.price-c,m=p.price>0?Math.round(pr/p.price*100):0;
const tag=n<=0?`<span class="badge">Out</span>`:(n<=5?`<span class="badge">${n} left</span>`:"");
const lines=p.lines.map(l=>{const i=itemById(l.itemId);return i?fmt(i,l.qty)+" "+esc(i.name):"(deleted item)"}).join(" · ");
const money_=ok?`Cost ${naira(c)} · Profit <b style="color:${pr>=0?"var(--green)":"var(--red)"}">${naira(pr)}</b> · ${m}% margin`:`Buying prices not set yet. Add them in the Vault to see profit.`;
return `<div class="card"><div class="it"><span class="nm">${pic(p.name)} ${esc(p.name)}${tag}</span><span class="big">${naira(p.price)}</span></div><p class="small" style="margin:0 0 6px">${lines}</p><p class="small" style="margin:0 0 12px">${money_}</p><div class="row"><button class="btn sm ghost" onclick="prodForm('${p.id}')">Edit</button></div></div>`;
}
function costPreview(){
const price=parseFloat($("#p_price").value)||0;
let cost=0,known=true;
draft.lines.forEach((l,k)=>{const i=itemById($("#l_i"+k).value),q=parseFloat($("#l_q"+k).value)||0;if(i&&hasCost(i))cost+=q*i.packPrice/i.packSize;else known=false});
const pr=price-cost,m=price>0?Math.round(pr/price*100):0;
$("#prev").innerHTML=known?`<b>Cost and profit</b><div class="it"><span>Cost for one sale</span><b>${naira(cost)}</b></div><div class="it"><span>Profit</span><b style="color:${pr>=0?"var(--green)":"var(--red)"}">${naira(pr)} (${m}%)</b></div>`:`<b>Cost and profit</b><p class="sub" style="margin:0">Some buying prices are not set yet. Add them in the Vault to see the profit.</p>`;
}

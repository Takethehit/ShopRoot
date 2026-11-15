let stockTab="items",packOpen=false,prevUnit="piece";
const UNITS=[["piece","Count (pieces, bottles, bags, cartons...)"],["g","Weight (grams / kg)"],["ml","Liquid (ml / litres)"]];
const items=()=>DB.get("items",[]);
const moves=()=>DB.get("moves",[]);
const isDirect=(p,i,name)=>p.item===i.id||(p.lines.length===1&&p.lines[0].itemId===i.id&&p.lines[0].qty===1&&p.name===(name||i.name));
const directOf=(i,name)=>DB.get("products",[]).find(p=>isDirect(p,i,name));
function syncDirect(i,price,oldName){
const pl=DB.get("products",[]);
const ix=pl.findIndex(p=>isDirect(p,i,oldName));
if(price==null||i.unit!=="piece"){if(ix>=0)pl.splice(ix,1)}
else if(ix>=0){Object.assign(pl[ix],{name:i.name,price,item:i.id,lines:[{itemId:i.id,qty:1}]})}
else pl.push({id:DB.id(),name:i.name,price,item:i.id,lines:[{itemId:i.id,qty:1}]});
DB.set("products",pl);
}
function addMove(itemId,type,amount,note){const m=moves();m.push({id:DB.id(),itemId,type,amount,note:note||"",date:new Date().toISOString()});DB.set("moves",m)}
function setStockTab(t){stockTab=t;render()}
screens.stock=()=>{
const list=items(),low=list.filter(isLow);
let h=`<h1>Stock</h1><div class="seg"><button class="${stockTab==="items"?"on":""}" onclick="setStockTab('items')">Items</button><button class="${stockTab==="products"?"on":""}" onclick="setStockTab('products')">Recipes</button></div>`;
if(stockTab==="products")return h+`<div class="card"><p class="sub" style="margin:0">Recipes come in the next piece.</p></div>`;
h+=`<div class="chips"><span class="chip">${list.length} items</span>`+(low.length?`<span class="chip red">${low.length} running low</span>`:"")+`</div><button class="btn green" onclick="itemForm()">+ Add item</button><div class="gap"></div>`;
if(!list.length)return h+`<div class="card"><p class="sub" style="margin:0">No items yet. Add the things you buy and sell, for example Coke, rice or batteries.</p></div>`;
return h+list.map(itemCard).join("");
};
function costText(i){
if(i.unit!=="piece")return "cost "+naira(i.packPrice)+" per "+fmt(i,i.packSize);
return "cost "+naira(i.packPrice/i.packSize)+" each"+(Number(i.packSize)!==1?" ("+naira(i.packPrice)+" per "+fmt(i,i.packSize)+")":"");
}
function itemCard(i){
const tag=isLow(i)?`<span class="badge">${i.stock<=0?"Out":"Low"}</span>`:"";
const dp=i.unit==="piece"?directOf(i):null;
const sale=dp?`<p class="small" style="margin:0 0 10px;color:var(--green);font-weight:700">On sale · ${naira(dp.price)}</p>`:"";
const putBtn=(i.unit==="piece"&&!dp)?`<button class="btn sm green" onclick="sellForm('${i.id}')">Put on sale</button><div class="gap"></div>`:"";
return `<div class="card"><div class="it"><button class="nm" onclick="itemHistory('${i.id}')">${esc(i.name)}${tag}</button><span class="big">${fmt(i,i.stock)}</span></div><p class="small" style="margin:0 0 10px">Warn at ${fmt(i,i.min)} or less · ${costText(i)}</p>${sale}${putBtn}<div class="row"><button class="btn sm" onclick="moveForm('${i.id}','restock')">Restock</button><button class="btn sm ghost" onclick="moveForm('${i.id}','waste')">Waste</button><button class="btn sm ghost" onclick="itemForm('${i.id}')">Edit</button></div></div>`;
}
function sellForm(id){
const i=items().find(x=>x.id===id);
sheet(`<h1>Put ${esc(i.name)} on sale</h1><p class="sub">You pay ${naira(i.packPrice/i.packSize)} for one ${esc(i.label||"piece")}. Just type your selling price.</p>
<label>Selling price of one (₦)</label><input id="s_price" type="number" inputmode="decimal" placeholder="e.g. 3000" oninput="sellPreview('${id}')"><p class="small" id="s_prev"></p>
<button class="btn green" onclick="saveSell('${id}')">Put on sale</button><div class="gap"></div><button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
}
function sellPreview(id){
const i=items().find(x=>x.id===id),p=parseFloat($("#s_price").value)||0,c=i.packPrice/i.packSize;
$("#s_prev").textContent=p?"Profit "+naira(p-c)+" each ("+Math.round((p-c)/p*100)+"%)":"";
}
function saveSell(id){
const i=items().find(x=>x.id===id),p=parseFloat($("#s_price").value);
if(!(p>=0))return toast("Please type the selling price");
syncDirect(i,p,i.name);toast("Now on sale");render();
}
function unitHint(fromChange){
const u=$("#f_unit").value;
if(fromChange){
const d={g:1000,ml:1000,piece:1};
if($("#f_pack").value===String(d[prevUnit]))$("#f_pack").value=d[u];
if(u==="piece")packOpen=Number($("#f_pack").value)!==1;
}
const showPack=u!=="piece"||packOpen;
$("#hint").textContent={g:"Amounts are in grams. 1 kg = 1000 g. Example: a 1 kg bag = pack 1000.",ml:"Amounts are in millilitres. 1 L = 1000 ml. Example: a 1 L bottle = pack 1000.",piece:"A crate of 12 bottles? Type 12 and the price of the whole crate."}[u];
$("#packBox").style.display=showPack?"block":"none";
$("#packLink").style.display=(u==="piece"&&!packOpen)?"block":"none";
$("#priceLabel").textContent=showPack?"Price of one pack (₦)":"What do you pay for one? (₦)";
$("#labelBox").style.display=u==="piece"?"block":"none";
$("#sellBox").style.display=u==="piece"?"block":"none";
$("#noSell").style.display=u==="piece"?"none":"block";
prevUnit=u;
}
function showPack(){packOpen=true;unitHint(false)}
function itemForm(id){
const i=id?items().find(x=>x.id===id):{name:"",unit:"piece",label:"",packSize:1,packPrice:"",stock:"",min:""};
const dp=id&&i.unit==="piece"?directOf(i):null;
prevUnit=i.unit;packOpen=i.unit==="piece"&&Number(i.packSize)!==1;
sheet(`<h1>${id?"Edit item":"Add item"}</h1>
<label>Name</label><input id="f_name" value="${esc(i.name)}" placeholder="e.g. Coke, Battery, Rice">
<label>How do you count it?</label><select id="f_unit" onchange="unitHint(true)">${UNITS.map(u=>`<option value="${u[0]}" ${u[0]===i.unit?"selected":""}>${u[1]}</option>`).join("")}</select>
<div id="labelBox"><label>What do you call one? (optional)</label><input id="f_label" value="${esc(i.label||"")}" placeholder="piece, bottle, bag, carton, sachet"></div>
<div id="packBox"><label>How many do you get in one pack?</label><input id="f_pack" type="number" inputmode="decimal" value="${i.packSize}"><p class="small" id="hint" style="margin:-4px 0 10px"></p></div>
<button class="btn sm ghost" id="packLink" onclick="showPack()" style="margin-bottom:10px">I buy it in packs (crate, carton, dozen)</button>
<label id="priceLabel">What do you pay for one? (₦)</label><input id="f_price" type="number" inputmode="decimal" value="${i.packPrice}" placeholder="e.g. 2500">
<label>Stock you have now</label><input id="f_stock" type="number" inputmode="decimal" value="${i.stock}" placeholder="0">
<label>Warn me when stock is this low</label><input id="f_min" type="number" inputmode="decimal" value="${i.min}" placeholder="0">
<div id="sellBox"><label>Selling price of one (₦) <span class="small">optional</span></label><input id="f_sell" type="number" inputmode="decimal" value="${dp?dp.price:""}" placeholder="Leave empty if you do not sell it directly"></div>
<p class="small" id="noSell">Rice, oil and other ingredients are used in recipes. You can sell them directly later.</p>
<button class="btn green" onclick="saveItem('${id||""}')">Save</button><div class="gap"></div>
${id?`<button class="btn redline" onclick="confirmDelete('${id}')">Delete item</button><div class="gap"></div>`:""}
<button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
unitHint(false);
}
function saveItem(id){
const name=$("#f_name").value.trim(),unit=$("#f_unit").value;
const label=unit==="piece"?($("#f_label").value.trim()||"piece"):"";
const packSize=parseFloat($("#f_pack").value),packPrice=parseFloat($("#f_price").value);
const stock=parseFloat($("#f_stock").value)||0,min=parseFloat($("#f_min").value)||0;
if(!name)return toast("Please type the item name");
if(!(packSize>0))return toast("Pack size must be more than 0");
if(!(packPrice>=0))return toast("Please type what you pay");
const sellStr=unit==="piece"?$("#f_sell").value.trim():"";
const sell=sellStr===""?null:parseFloat(sellStr);
if(sell!==null&&!(sell>=0))return toast("Please type a valid selling price");
const list=items();
let item,oldName;
if(id){
item=list.find(x=>x.id===id);oldName=item.name;
const diff=Math.round((stock-item.stock)*10000)/10000;
Object.assign(item,{name,unit,label,packSize,packPrice,min});
if(diff!==0){item.stock=stock;addMove(id,"adjust",diff,"")}
}else{
item={id:DB.id(),name,unit,label,packSize,packPrice,stock,min};oldName=name;
list.push(item);
if(stock>0)addMove(item.id,"opening",stock,"");
}
DB.set("items",list);
syncDirect(item,sell,oldName);
toast(sell!==null?"Saved. It is ready to sell.":"Saved");render();
}
function moveForm(id,type){
const i=items().find(x=>x.id===id),w=type==="waste";
sheet(`<h1>${w?"Record waste":"Restock"}: ${esc(i.name)}</h1><p class="sub">Now: ${fmt(i,i.stock)}</p>
<label>Amount (${unitText(i)})</label><input id="m_amt" type="number" inputmode="decimal" placeholder="0">
<label>${w?"Reason (required)":"Note (optional)"}</label><input id="m_note" placeholder="${w?"e.g. spoiled, spilled":"e.g. bought from market"}">
<button class="btn ${w?"red":"green"}" onclick="saveMove('${id}','${type}')">${w?"Save waste":"Add stock"}</button><div class="gap"></div>
<button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
}
function saveMove(id,type){
const amt=parseFloat($("#m_amt").value),note=$("#m_note").value.trim();
if(!(amt>0))return toast("Type an amount more than 0");
if(type==="waste"&&!note)return toast("Please type a reason");
const list=items(),i=list.find(x=>x.id===id);
if(type==="waste"&&amt>i.stock)return toast("That is more than you have in stock");
const delta=type==="waste"?-amt:amt;
i.stock=Math.round((i.stock+delta)*10000)/10000;
addMove(id,type,delta,note);
DB.set("items",list);toast("Saved");render();
}
function confirmDelete(id){
const i=items().find(x=>x.id===id);
sheet(`<h1>Delete ${esc(i.name)}?</h1><p class="sub">This cannot be undone.</p><button class="btn red" onclick="deleteItem('${id}')">Yes, delete</button><div class="gap"></div><button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
}
function deleteItem(id){
const i=items().find(x=>x.id===id);
DB.set("products",DB.get("products",[]).filter(p=>!isDirect(p,i)));
DB.set("items",items().filter(x=>x.id!==id));
DB.set("moves",moves().filter(m=>m.itemId!==id));
toast("Deleted");render();
}
function itemHistory(id){
const i=items().find(x=>x.id===id);
const ms=moves().filter(m=>m.itemId===id).reverse().slice(0,20);
const label={restock:"Restocked",waste:"Waste",adjust:"Edited",opening:"Opening stock",sold:"Sold"};
const row=m=>{
const when=new Date(m.date).toLocaleString("en-NG",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const sign=m.amount<0?"-":"+";
const color=m.amount<0?"var(--red)":"var(--green)";
return `<div class="it"><span>${label[m.type]||m.type}${m.note?" · "+esc(m.note):""}<br><span class="small">${when}</span></span><b style="color:${color}">${sign}${fmt(i,Math.abs(m.amount))}</b></div>`;
};
sheet(`<h1>${esc(i.name)}</h1><p class="sub">History · now ${fmt(i,i.stock)}</p>`+(ms.length?ms.map(row).join(""):`<p class="sub">No records yet.</p>`)+`<button class="btn ghost" onclick="closeSheet()">Close</button>`);
}

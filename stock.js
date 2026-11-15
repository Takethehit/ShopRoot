let stockTab="items";
const UNITS=[["piece","Count (pieces, bottles, bags, cartons...)"],["g","Weight (grams / kg)"],["ml","Liquid (ml / litres)"]];
let prevUnit="piece";
const items=()=>DB.get("items",[]);
const moves=()=>DB.get("moves",[]);
function addMove(itemId,type,amount,note){const m=moves();m.push({id:DB.id(),itemId,type,amount,note:note||"",date:new Date().toISOString()});DB.set("moves",m)}
function setStockTab(t){stockTab=t;render()}
screens.stock=()=>{
const list=items(),low=list.filter(isLow);
let h=`<h1>Stock</h1><div class="seg"><button class="${stockTab==="items"?"on":""}" onclick="setStockTab('items')">Items</button><button class="${stockTab==="products"?"on":""}" onclick="setStockTab('products')">Products</button></div>`;
if(stockTab==="products")return h+`<div class="card"><p class="sub" style="margin:0">Products and recipes come in the next piece.</p></div>`;
h+=`<div class="chips"><span class="chip">${list.length} items</span>`+(low.length?`<span class="chip red">${low.length} running low</span>`:"")+`</div><button class="btn green" onclick="itemForm()">+ Add item</button><div class="gap"></div>`;
if(!list.length)return h+`<div class="card"><p class="sub" style="margin:0">No items yet. Add your ingredients and stock, for example rice, oil and tomatoes.</p></div>`;
return h+list.map(itemCard).join("");
};
function itemCard(i){
const tag=isLow(i)?`<span class="badge">${i.stock<=0?"Out":"Low"}</span>`:"";
return `<div class="card"><div class="it"><button class="nm" onclick="itemHistory('${i.id}')">${esc(i.name)}${tag}</button><span class="big">${fmt(i,i.stock)}</span></div><p class="small" style="margin:0 0 12px">Warn at ${fmt(i,i.min)} or less · ${naira(i.packPrice)} per ${fmt(i,i.packSize)}</p><div class="row"><button class="btn sm" onclick="moveForm('${i.id}','restock')">Restock</button><button class="btn sm ghost" onclick="moveForm('${i.id}','waste')">Waste</button><button class="btn sm ghost" onclick="itemForm('${i.id}')">Edit</button></div></div>`;
}
function unitHint(fromChange){
const u=$("#f_unit").value;
$("#hint").textContent={g:"Amounts are in grams. 1 kg = 1000 g. Example: a 1 kg bag = pack 1000.",ml:"Amounts are in millilitres. 1 L = 1000 ml. Example: a 1 L bottle = pack 1000.",piece:"Buying one at a time? Leave 1. A crate of 12 bottles? Type 12 and the price of the whole crate."}[u];
$("#labelBox").style.display=u==="piece"?"block":"none";
const dw=$("#directWrap");if(dw)dw.style.display=u==="piece"?"block":"none";
if(fromChange){
const d={g:1000,ml:1000,piece:1};
if($("#f_pack").value===String(d[prevUnit]))$("#f_pack").value=d[u];
}
prevUnit=u;
}
function toggleDirect(){$("#directBox").style.display=$("#f_direct").checked?"block":"none"}
function itemForm(id){
const i=id?items().find(x=>x.id===id):{name:"",unit:"piece",label:"",packSize:1,packPrice:"",stock:"",min:""};
prevUnit=i.unit;
sheet(`<h1>${id?"Edit item":"Add item"}</h1>
<label>Name</label><input id="f_name" value="${esc(i.name)}" placeholder="e.g. Rice, Battery, Coke">
<label>How do you count it?</label><select id="f_unit" onchange="unitHint(true)">${UNITS.map(u=>`<option value="${u[0]}" ${u[0]===i.unit?"selected":""}>${u[1]}</option>`).join("")}</select>
<div id="labelBox"><label>What do you call one? (optional)</label><input id="f_label" value="${esc(i.label||"")}" placeholder="piece, bottle, bag, carton, sachet"></div>
<label>How many do you get in one pack?</label><input id="f_pack" type="number" inputmode="decimal" value="${i.packSize}">
<p class="small" id="hint" style="margin:-4px 0 10px"></p>
<label>Price of one pack (₦)</label><input id="f_price" type="number" inputmode="decimal" value="${i.packPrice}" placeholder="e.g. 2500">
<label>Stock you have now</label><input id="f_stock" type="number" inputmode="decimal" value="${i.stock}" placeholder="0">
<label>Warn me when stock is this low</label><input id="f_min" type="number" inputmode="decimal" value="${i.min}" placeholder="0">
${id?`<p class="small">If you change how it is counted, check your stock, price and products again.</p>`:`<div id="directWrap" class="card" style="box-shadow:none;border:2px solid #e7d8f7"><label style="display:flex;gap:12px;align-items:center;margin:0"><input type="checkbox" id="f_direct" style="width:28px;height:28px;margin:0;padding:0" onchange="toggleDirect()"> I sell this item directly to customers</label><div id="directBox" style="display:none;margin-top:10px"><label>Selling price of one (₦)</label><input id="f_sell" type="number" inputmode="decimal" placeholder="e.g. 3000"></div></div>`}
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
if(!(packPrice>=0))return toast("Please type the price of one pack");
const direct=!id&&unit==="piece"&&$("#f_direct")&&$("#f_direct").checked;
const sell=direct?parseFloat($("#f_sell").value):0;
if(direct&&!(sell>=0))return toast("Please type the selling price");
const list=items();
if(id){
const i=list.find(x=>x.id===id);
const diff=Math.round((stock-i.stock)*10000)/10000;
Object.assign(i,{name,unit,label,packSize,packPrice,min});
if(diff!==0){i.stock=stock;addMove(id,"adjust",diff,"")}
}else{
const i={id:DB.id(),name,unit,label,packSize,packPrice,stock,min};
list.push(i);
if(stock>0)addMove(i.id,"opening",stock,"");
if(direct){const pl=DB.get("products",[]);pl.push({id:DB.id(),name,price:sell,lines:[{itemId:i.id,qty:1}]});DB.set("products",pl)}
}
DB.set("items",list);toast(direct?"Saved. It is ready to sell.":"Saved");render();
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

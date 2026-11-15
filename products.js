const PICS=[["jollof","🍛"],["fried rice","🍛"],["rice","🍚"],["bean","🫘"],["garri","🥣"],["egg","🥚"],["oil","🛢️"],["milk","🥛"],["sugar","🍬"],["salt","🧂"],["bread","🍞"],["chicken","🍗"],["fish","🐟"],["beef","🥩"],["meat","🥩"],["tomato","🍅"],["onion","🧅"],["pepper","🌶️"],["potato","🥔"],["yam","🍠"],["plantain","🍌"],["banana","🍌"],["water","💧"],["coke","🥤"],["soda","🥤"],["drink","🥤"],["juice","🧃"],["beer","🍺"],["noodle","🍜"],["indomie","🍜"],["spaghetti","🍝"],["pasta","🍝"],["pie","🥧"],["puff","🍩"],["cake","🎂"],["coffee","☕"],["tea","☕"],["soap","🧼"],["detergent","🧴"],["credit","📱"],["phone","📱"],["flour","🌾"],["butter","🧈"],["cheese","🧀"]];
function pic(n){for(const p of PICS)if(new RegExp("\\b"+p[0],"i").test(String(n)))return p[1];return "🛒"}
const prods=()=>DB.get("products",[]);
const itemById=id=>items().find(x=>x.id===id);
function costOf(p){return p.lines.reduce((s,l)=>{const i=itemById(l.itemId);return s+(i?l.qty*i.packPrice/i.packSize:0)},0)}
function canMake(p){
let m=Infinity;
for(const l of p.lines){const i=itemById(l.itemId);if(!i||!(l.qty>0))return 0;m=Math.min(m,Math.floor(i.stock/l.qty+1e-9))}
return m===Infinity?0:m;
}
function segHeader(){
return `<h1>Stock</h1><div class="seg"><button class="${stockTab==="items"?"on":""}" onclick="setStockTab('items')">Items</button><button class="${stockTab==="products"?"on":""}" onclick="setStockTab('products')">Recipes</button></div>`;
}
const _stk=screens.stock;
screens.stock=()=>stockTab==="products"?productsScreen():_stk();
const recipeProds=()=>{const its=items();return prods().filter(p=>!its.some(i=>isDirect(p,i)))};
function productsScreen(){
const list=recipeProds();
const h=segHeader()+`<p class="sub">For things made from several items, like Jollof rice. Things you sell as they are (like Coke) are put on sale from the Items tab.</p><button class="btn green" onclick="prodForm()">+ Add recipe</button><div class="gap"></div>`;
if(!items().length)return h+`<div class="card"><p class="sub" style="margin:0">Add your items first (ingredients or things you sell), then make products from them.</p></div>`;
if(!list.length)return h+`<div class="card"><p class="sub" style="margin:0">No recipes yet. Make one when you sell something cooked or mixed from several items.</p></div>`;
return h+list.map(prodCard).join("");
}
function prodCard(p){
const c=costOf(p),pr=p.price-c,m=p.price>0?Math.round(pr/p.price*100):0;
const n=canMake(p);
const tag=n<=0?`<span class="badge">Out</span>`:(n<=5?`<span class="badge">${n} left</span>`:"");
const lines=p.lines.map(l=>{const i=itemById(l.itemId);return i?fmt(i,l.qty)+" "+esc(i.name):"(deleted item)"}).join(" · ");
return `<div class="card"><div class="it"><span class="nm">${pic(p.name)} ${esc(p.name)}${tag}</span><span class="big">${naira(p.price)}</span></div><p class="small" style="margin:0 0 6px">${lines}</p><p class="small" style="margin:0 0 12px">Cost ${naira(c)} · Profit <b style="color:${pr>=0?"var(--green)":"var(--red)"}">${naira(pr)}</b> · ${m}% margin</p><div class="row"><button class="btn sm ghost" onclick="prodForm('${p.id}')">Edit</button></div></div>`;
}
let draft=null;
const defQty=i=>i.unit==="piece"?1:"";
function prodForm(id){
if(!items().length)return toast("Add your items first");
const p=id?prods().find(x=>x.id===id):null;
draft=p?JSON.parse(JSON.stringify(p)):{id:"",name:"",price:"",lines:[{itemId:items()[0].id,qty:defQty(items()[0])}]};
drawForm();
}
function readDraft(){
if(!$("#p_name"))return;
draft.name=$("#p_name").value;draft.price=$("#p_price").value;
draft.lines.forEach((l,k)=>{l.itemId=$("#l_i"+k).value;l.qty=$("#l_q"+k).value});
}
function drawForm(){
const its=items();
const rows=draft.lines.map((l,k)=>{
const it=itemById(l.itemId)||its[0];
const u=unitText(it);
return `<div class="card" style="padding:12px;box-shadow:none;border:2px solid #e7d8f7"><select id="l_i${k}" onchange="lineChanged()">${its.map(i=>`<option value="${i.id}" ${i.id===it.id?"selected":""}>${esc(i.name)} (${unitText(i)})</option>`).join("")}</select><input id="l_q${k}" type="number" inputmode="decimal" placeholder="Amount used, in ${u}" value="${l.qty}" oninput="costPreview()"><button class="btn sm redline" onclick="rmLine(${k})">Remove</button></div>`;
}).join("");
sheet(`<h1>${draft.id?"Edit recipe":"Add recipe"}</h1>
<label>Name</label><input id="p_name" value="${esc(draft.name)}" placeholder="e.g. Jollof rice">
<label>Selling price (₦)</label><input id="p_price" type="number" inputmode="decimal" value="${draft.price}" placeholder="e.g. 2500" oninput="costPreview()">
<label>What is used for ONE sale</label>${rows}
<button class="btn sm ghost" onclick="addLine()">+ Add another item</button>
<div class="card" id="prev" style="margin-top:14px"></div>
<button class="btn green" onclick="saveProd()">Save</button><div class="gap"></div>
${draft.id?`<button class="btn redline" onclick="confirmProdDelete('${draft.id}')">Delete recipe</button><div class="gap"></div>`:""}
<button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
costPreview();
}
function lineChanged(){readDraft();drawForm()}
function addLine(){readDraft();draft.lines.push({itemId:items()[0].id,qty:defQty(items()[0])});drawForm()}
function rmLine(k){readDraft();if(draft.lines.length<2)return toast("A product needs at least one item");draft.lines.splice(k,1);drawForm()}
function costPreview(){
const price=parseFloat($("#p_price").value)||0;
let cost=0;
draft.lines.forEach((l,k)=>{const i=itemById($("#l_i"+k).value),q=parseFloat($("#l_q"+k).value)||0;if(i)cost+=q*i.packPrice/i.packSize});
const pr=price-cost,m=price>0?Math.round(pr/price*100):0;
$("#prev").innerHTML=`<b>Cost and profit</b><div class="it"><span>Cost for one sale</span><b>${naira(cost)}</b></div><div class="it"><span>Profit</span><b style="color:${pr>=0?"var(--green)":"var(--red)"}">${naira(pr)} (${m}%)</b></div>`;
}
function saveProd(){
readDraft();
const name=draft.name.trim(),price=parseFloat(draft.price);
if(!name)return toast("Please type the product name");
if(!(price>=0))return toast("Please type the selling price");
const lines=[];
for(const l of draft.lines){const q=parseFloat(l.qty);if(!(q>0))return toast("Type an amount for every item");lines.push({itemId:l.itemId,qty:q})}
const list=prods();
if(draft.id){const p=list.find(x=>x.id===draft.id);Object.assign(p,{name,price,lines})}
else list.push({id:DB.id(),name,price,lines});
DB.set("products",list);toast("Saved");render();
}
function confirmProdDelete(id){
const p=prods().find(x=>x.id===id);
sheet(`<h1>Delete ${esc(p.name)}?</h1><p class="sub">This cannot be undone.</p><button class="btn red" onclick="deleteProd('${id}')">Yes, delete</button><div class="gap"></div><button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
}
function deleteProd(id){DB.set("products",prods().filter(x=>x.id!==id));toast("Deleted");render()}
const _cd=confirmDelete;
confirmDelete=function(id){
const it=items().find(x=>x.id===id);const used=prods().filter(p=>p.lines.some(l=>l.itemId===id)&&!isDirect(p,it));
if(used.length){
closeSheet();
return sheet(`<h1>Can’t delete yet</h1><p class="sub">This item is used in these recipes: ${used.map(p=>esc(p.name)).join(", ")}. Remove it from them first.</p><button class="btn ghost" onclick="closeSheet()">OK</button>`);
}
_cd(id);
};

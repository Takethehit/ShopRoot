/* ---------- Header: shop name next to the profile circle ---------- */
const _render3=render;
render=function(){
_render3();
const b=document.querySelector(".brand");
if(b){
const d=new Date().toLocaleDateString("en-NG",{weekday:"long",day:"numeric",month:"long"});
b.innerHTML=`<b>${esc(shop())}${hasPin()&&!isOwner()?" 🔒":""}</b><small>${d}</small>`;
}
};
const _go2=go;
go=function(t){if(t!=="vault")vault.page="home";_go2(t)};
vault.page="home";
function vaultGo(p){vault.page=p;render()}
function lockVault(){own.until=0;vault.ok=false;vault.page="home";render()}
const backBtn=()=>`<button class="btn sm ghost" onclick="vaultGo('home')">← Back to Vault</button><div class="gap"></div>`;

/* ---------- Profit uses buying prices set in the Vault ---------- */
const prodNow=pid=>prods().find(x=>x.id===pid);
const lineCostNow=l=>{if(l.cost>0)return l.cost;const p=prodNow(l.pid);return p?costOf(p):0};
const saleCostNow=s=>Math.round(s.lines.reduce((t,l)=>t+lineCostNow(l)*l.qty,0)*100)/100;
const saleProfitNow=s=>Math.round((s.total-saleCostNow(s))*100)/100;

/* ---------- Pick-list extras (due dates, packs) ---------- */
const _pp=pickPill;
pickPill=function(g,b){
_pp(g,b);
const t=b.textContent;
if(g==="pf_due"||g==="df_due"){const d=$("#"+(g==="pf_due"?"pf_date":"df_date"));if(d)d.style.display=t==="Pick a date"?"block":"none"}
if(g==="c_how"){
const packs=t.startsWith("In packs");
$("#c_packbox").style.display=packs?"block":"none";
$("#c_plabel").textContent=packs?"What did you pay for the whole pack? (₦)":"What did you pay for one? (₦)";
}
};

/* ---------- Workers can add items and record stock, but never see or set prices ---------- */
function workerStock(){
const list=items(),low=list.filter(isLow);
const head=`<h1>Stock</h1><div class="chips"><span class="chip">${list.length} items</span>${low.length?`<span class="chip red">${low.length} running low</span>`:""}</div><button class="btn green" onclick="itemForm()">+ Add item</button><div class="gap"></div>`;
const foot=`<button class="btn sm ghost" onclick="unlockThen('stock')">Owner? Enter PIN</button>`;
if(!list.length)return head+`<div class="card"><p class="sub" style="margin:0">No items yet.</p></div>`+foot;
return head+list.map(i=>{const tag=isLow(i)?`<span class="badge">${i.stock<=0?"Out":"Low"}</span>`:"";return `<div class="card"><div class="it"><button class="nm" onclick="itemHistory('${i.id}')">${esc(i.name)}${tag}</button><span class="big">${fmt(i,i.stock)}</span></div><div class="row"><button class="btn sm" onclick="moveForm('${i.id}','restock')">Restock</button><button class="btn sm ghost" onclick="moveForm('${i.id}','waste')">Waste</button></div></div>`}).join("")+foot;
}

/* ---------- Vault main page ---------- */
function vaultHome(){
const p=vault.page||"home";
if(p==="prices")return pricesPage();
if(p==="owe"||p==="owed")return ledgerList(p);
if(p.startsWith("p:"))return personPage(p.slice(2));
return vaultMain();
}
function vaultMain(){
const list=period(vault.tab),names={today:"Today",week:"Last 7 days",month:"This month"};
const rev=sumOf(list,s=>s.total),dis=sumOf(list,s=>s.discount||0),cost=sumOf(list,saleCostNow),pr=Math.round((rev-cost)*100)/100;
const miss=items().filter(i=>!hasCost(i));
const seg=`<div class="seg">${["today","week","month"].map(k=>`<button class="${vault.tab===k?"on":""}" onclick="setVaultTab('${k}')">${k==="today"?"Today":k==="week"?"7 days":"Month"}</button>`).join("")}</div>`;
const recent=DB.get("sales",[]).slice().reverse().slice(0,15).map(s=>{
const t=new Date(s.date).toLocaleString("en-NG",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const pf=saleProfitNow(s);
return `<div class="card" onclick="openReceipt('${s.id}',false,'vault')"><div class="it" style="margin:0"><span><b>${s.no}</b><br><span class="small">${t} · sold ${naira(s.total)}</span></span><b style="color:${pf>=0?"var(--green)":"var(--red)"}">${money(pf)}</b></div></div>`;
}).join("");
const tile=(ico,title,sub,pg)=>`<button class="vt" onclick="vaultGo('${pg}')"><i>${ico}</i><div><b>${title}</b><span>${sub}</span></div><em>›</em></button>`;
return `<h1>🔐 Vault</h1><button class="btn sm ghost" onclick="lockVault()">Lock vault now</button><div class="gap"></div>
${remindCard()}
${seg}
<div class="card" style="background:linear-gradient(135deg,#4A2370,#6b3a9a);color:#fff"><b>Profit · ${names[vault.tab]}</b><div style="font-size:38px;font-weight:900">${money(pr)}</div><span style="opacity:.85">${list.length} sale${list.length===1?"":"s"}</span></div>
${miss.length?`<div class="card" style="border:2px solid #f59e0b;background:#fffbeb"><b>⚠️ ${miss.length} stock item${miss.length>1?"s have":" has"} no buying price</b><p class="sub" style="margin:0 0 10px">Profit is too high until you add what you paid.</p><button class="btn sm green" onclick="vaultGo('prices')">Add buying prices</button></div>`:""}
<div class="stat"><div class="card"><span class="small">Sales</span><br><b>${naira(rev)}</b></div><div class="card"><span class="small">Cost of goods</span><br><b>${naira(cost)}</b></div><div class="card"><span class="small">Discounts given</span><br><b>${naira(dis)}</b></div><div class="card"><span class="small">Sales count</span><br><b>${list.length}</b></div></div>
${tile("💰","Buying prices",miss.length?miss.length+" not set":"All set","prices")}
${tile("🏭","Suppliers I owe",naira(totalBal("owe"))+" to pay","owe")}
${tile("🤝","People who owe me",naira(totalBal("owed"))+" to collect","owed")}
<h1 style="font-size:20px">Recent sales and profit</h1>${recent||`<div class="card"><p class="sub" style="margin:0">No sales yet.</p></div>`}
<button class="btn sm ghost" onclick="changePin()">Change PIN</button>`;
}

/* ---------- Buying prices page ---------- */
const PACKS={g:[["1 kg",1000],["5 kg",5000],["10 kg",10000],["25 kg",25000],["50 kg",50000],["Other",0]],ml:[["1 L",1000],["5 L",5000],["10 L",10000],["20 L",20000],["25 L",25000],["Other",0]]};
function costLine(i){
if(i.unit==="piece")return naira(i.packPrice/i.packSize)+" each"+(Number(i.packSize)!==1?` <span class="small">(${naira(i.packPrice)} per ${fmt(i,i.packSize)})</span>`:"");
return naira(i.packPrice)+" per "+fmt(i,i.packSize);
}
function pricesPage(){
const its=items(),miss=its.filter(i=>!hasCost(i));
return backBtn()+`<h1>💰 Buying prices</h1><p class="sub">What you paid for each stock. Only you can see this page. Workers never see it.</p>`+
(its.length?`<div class="chips">${miss.length?`<span class="chip red">${miss.length} not set</span>`:`<span class="chip">All prices set ✅</span>`}</div>`:"")+
(its.length?its.map(i=>`<div class="card"><div class="it"><b>${esc(i.name)}</b><span class="small">${fmt(i,i.stock)} in stock</span></div><p style="margin:0 0 10px">${hasCost(i)?costLine(i):`<span style="color:var(--red);font-weight:700">Not set</span>`}</p><button class="btn sm ${hasCost(i)?"ghost":"green"}" onclick="costForm('${i.id}')">${hasCost(i)?"Change price":"Set buying price"}</button></div>`).join(""):`<div class="card"><p class="sub" style="margin:0">No stock yet. Add items in the Stock tab first.</p></div>`);
}
function costForm(id){
const i=items().find(x=>x.id===id),isP=i.unit==="piece";
let top="",m=null;
const inPack=isP&&Number(i.packSize)>1;
if(isP){
top=`<label>How do you buy it?</label>${pills("c_how",["One at a time","In packs (crate, carton, dozen)"],inPack?"In packs (crate, carton, dozen)":"One at a time")}<div id="c_packbox" style="display:${inPack?"block":"none"}"><label>How many in one pack?</label><input id="c_pack" type="number" inputmode="decimal" value="${inPack?i.packSize:""}" placeholder="e.g. 12"></div>`;
}else{
const opts=PACKS[i.unit];
m=opts.find(o=>o[1]===Number(i.packSize)&&o[0]!=="Other");
top=`<label>What size pack do you buy? (tap one)</label>${pills("c_ps",opts.map(o=>o[0]),m?m[0]:(hasCost(i)?"Other":opts[0][0]))}`;
}
const packs=!isP||inPack;
sheet(`<h1>Buying price</h1><p class="sub">${esc(i.name)} · only you can see this</p>${top}
<label id="c_plabel">${packs?"What did you pay for the whole pack? (₦)":"What did you pay for one? (₦)"}</label><input id="c_price" type="number" inputmode="decimal" value="${hasCost(i)?i.packPrice:""}" placeholder="e.g. 9600">
<button class="btn green" onclick="saveCost('${id}')">Save</button><div class="gap"></div><button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
if(!isP&&!m&&hasCost(i))$("#c_ps_o").value=i.packSize;
}
function saveCost(id){
const list=items(),i=list.find(x=>x.id===id);
const price=parseFloat($("#c_price").value);
if(!(price>=0))return toast("Please type the price");
let size=1;
if(i.unit==="piece"){
if(pillVal("c_how").startsWith("In packs")){size=parseFloat($("#c_pack").value);if(!(size>0))return toast("Type how many are in one pack")}
}else{
const lab=$("#c_ps").value;
if(lab==="Other")size=parseFloat($("#c_ps_o").value);
else{const f=PACKS[i.unit].find(o=>o[0]===lab);size=f?f[1]:0}
if(!(size>0))return toast("Please choose the pack size")
}
i.packSize=size;i.packPrice=price;
DB.set("items",list);toast("Buying price saved");render();
}

/* ---------- Suppliers I owe / People who owe me ---------- */
const LK={
owe:{title:"Suppliers I owe",icon:"🏭",add:"+ Add supplier or partner",charge:"+ Add stock bought",pay:"💵 Record payment",chargeTitle:"Add stock bought",payTitle:"Record payment",chargeName:"Stock bought",payName:"Payment made",totalL:"Total bought",paidL:"Paid so far",balL:"Still to pay",amtLabel:"Value of stock bought (₦)",tags:["Supplier","Business partner","Individual","Other"],empty:"No one yet. Add a supplier or partner you need to pay."},
owed:{title:"People who owe me",icon:"🤝",add:"+ Add person who owes me",charge:"+ Add amount owed",pay:"💵 Record collection",chargeTitle:"Add amount owed",payTitle:"Record collection",chargeName:"Amount owed",payName:"Collected",totalL:"Total owed",paidL:"Collected so far",balL:"Still to collect",amtLabel:"Amount they owe (₦)",tags:["Customer","Business","Individual","Other"],empty:"No one yet. Add someone who owes you money."}
};
const ledger=()=>DB.get("ledger",[]);
const saveLedger=l=>DB.set("ledger",l);
const entTotal=(p,t)=>p.entries.filter(e=>e.type===t).reduce((s,e)=>s+e.amount,0);
const balOf=p=>Math.round((entTotal(p,"charge")-entTotal(p,"pay"))*100)/100;
const totalBal=k=>ledger().filter(p=>p.kind===k).reduce((s,p)=>s+Math.max(0,balOf(p)),0);
const ymd=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
function daysTo(due){if(!due)return null;return Math.round((new Date(due+"T00:00:00")-new Date(ymd(new Date())+"T00:00:00"))/864e5)}
function dueText(p){
const d=daysTo(p.due);
if(d===null||balOf(p)<=0)return "";
if(d<0)return "Overdue by "+(-d)+" day"+(-d>1?"s":"");
if(d===0)return "Due today";
return "Due in "+d+" day"+(d>1?"s":"");
}
function dueColor(p){const d=daysTo(p.due);return d!==null&&d<0?"var(--red)":(d!==null&&d<=2?"#d97706":"var(--muted)")}
function remindItems(){return ledger().filter(p=>balOf(p)>0&&p.due&&daysTo(p.due)<=2).sort((a,b)=>daysTo(a.due)-daysTo(b.due))}
function remindCard(){
const r=remindItems();if(!r.length)return "";
return `<div class="card" style="border:2px solid #f59e0b;background:#fffbeb"><b>⏰ Reminders</b>${r.map(p=>`<div class="it" onclick="vaultGo('p:${p.id}')"><span>${LK[p.kind].icon} <b>${esc(p.name)}</b><br><span class="small" style="color:${dueColor(p)};font-weight:700">${dueText(p)} · ${p.kind==="owe"?"pay":"collect"}</span></span><b>${naira(balOf(p))}</b></div>`).join("")}</div>`;
}
function ledgerList(k){
const L=LK[k],list=ledger().filter(p=>p.kind===k).sort((a,b)=>balOf(b)-balOf(a));
return backBtn()+`<h1>${L.icon} ${L.title}</h1><div class="card" style="background:linear-gradient(135deg,#4A2370,#6b3a9a);color:#fff"><b>${L.balL}</b><div style="font-size:34px;font-weight:900">${naira(totalBal(k))}</div></div><button class="btn green" onclick="personForm('${k}')">${L.add}</button><div class="gap"></div>`+
(list.length?list.map(p=>{
const b=balOf(p),dt=dueText(p);
return `<div class="card" onclick="vaultGo('p:${p.id}')"><div class="it"><b style="font-size:18px">${esc(p.name)}</b><b style="font-size:20px;color:${b>0?(k==="owe"?"var(--red)":"var(--grape)"):"var(--green)"}">${b>0?naira(b):"Settled ✅"}</b></div><p class="small" style="margin:0">${esc(p.tag||"")}${dt?` · <span style="color:${dueColor(p)};font-weight:700">${dt}</span>`:""}</p></div>`;
}).join(""):`<div class="card"><p class="sub" style="margin:0">${L.empty}</p></div>`);
}
function personPage(id){
const p=ledger().find(x=>x.id===id);
if(!p){vault.page="home";return vaultMain()}
const L=LK[p.kind],b=balOf(p),dt=dueText(p);
let run=0;
const rows=p.entries.map(e=>{run+=e.type==="charge"?e.amount:-e.amount;return{e,run:Math.round(run*100)/100}}).reverse().map(({e,run})=>{
const when=new Date(e.date).toLocaleDateString("en-NG",{day:"2-digit",month:"short",year:"numeric"});
return `<div class="it" onclick="delEntry('${p.id}','${e.id}')"><span><b>${e.type==="charge"?L.chargeName:L.payName}</b>${e.note?" · "+esc(e.note):""}<br><span class="small">${when} · balance ${naira(run)}</span></span><b style="color:${e.type==="charge"?"var(--grape)":"var(--green)"}">${e.type==="charge"?"+":"-"}${naira(e.amount)}</b></div>`;
}).join("");
return `<button class="btn sm ghost" onclick="vaultGo('${p.kind}')">← Back</button><div class="gap"></div><h1>${esc(p.name)}</h1><p class="sub">${esc(p.tag||"")}${p.note?" · "+esc(p.note):""}</p>
<div class="card" style="background:linear-gradient(135deg,#4A2370,#6b3a9a);color:#fff"><b>${L.balL}</b><div style="font-size:36px;font-weight:900">${naira(b)}</div>${dt?`<span style="opacity:.95;font-weight:700">${dt}</span>`:(p.due&&b>0?`<span style="opacity:.9">Due ${p.due}</span>`:"")}</div>
<div class="stat"><div class="card"><span class="small">${L.totalL}</span><br><b>${naira(entTotal(p,"charge"))}</b></div><div class="card"><span class="small">${L.paidL}</span><br><b>${naira(entTotal(p,"pay"))}</b></div></div>
<button class="btn green" onclick="entryForm('${p.id}','charge')">${L.charge}</button><div class="gap"></div>
<button class="btn" onclick="entryForm('${p.id}','pay')">${L.pay}</button><div class="gap"></div>
<button class="btn sm ghost" onclick="dueForm('${p.id}')">${p.due?"Change due date":"Set due date"}</button><div class="gap"></div>
<h1 style="font-size:20px">History</h1><p class="small" style="margin:0 0 8px">Tap an entry to remove it if it was a mistake.</p><div class="card">${rows||`<p class="sub" style="margin:0">No entries yet.</p>`}</div>
<button class="btn sm redline" onclick="delPerson('${p.id}')">Delete ${esc(p.name)}</button>`;
}
const DUES=["No date","Today","7 days","14 days","30 days","Pick a date"];
function dueFrom(label,dateVal){
if(label==="Pick a date")return dateVal||"";
const map={"Today":0,"7 days":7,"14 days":14,"30 days":30};
if(!(label in map))return "";
const d=new Date();d.setDate(d.getDate()+map[label]);return ymd(d);
}
function personForm(k){
const L=LK[k];
sheet(`<h1>${L.add.replace(/^\+\s/,"")}</h1>
<label>Name</label><input id="pf_name" placeholder="Type the name">
<label>Who is this? (tap one)</label>${pills("pf_tag",L.tags,L.tags[0])}
<label>${L.amtLabel} <span class="small">optional</span></label><input id="pf_amt" type="number" inputmode="decimal" placeholder="e.g. 50000">
<label>Due date (tap one)</label>${pills("pf_due",DUES,"No date")}<input id="pf_date" type="date" style="display:none">
<label>Note <span class="small">optional</span></label><input id="pf_note" placeholder="e.g. rice and oil">
<button class="btn green" onclick="savePerson('${k}')">Save</button><div class="gap"></div><button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
}
function savePerson(k){
const name=$("#pf_name").value.trim();
if(!name)return toast("Please type the name");
const amt=parseFloat($("#pf_amt").value)||0;
const due=dueFrom($("#pf_due").value,$("#pf_date").value);
if($("#pf_due").value==="Pick a date"&&!due)return toast("Please pick the date");
const p={id:DB.id(),kind:k,name,tag:$("#pf_tag").value,note:$("#pf_note").value.trim(),due,entries:[]};
if(amt>0)p.entries.push({id:DB.id(),type:"charge",amount:amt,date:new Date().toISOString(),note:""});
const l=ledger();l.push(p);saveLedger(l);
vault.page="p:"+p.id;toast("Saved");render();
}
function entryForm(id,type){
const p=ledger().find(x=>x.id===id),L=LK[p.kind],pay=type==="pay";
sheet(`<h1>${pay?L.payTitle:L.chargeTitle}</h1><p class="sub">${esc(p.name)}${pay?" · balance "+naira(balOf(p)):""}</p>
<label>Amount (₦)</label><input id="e_amt" type="number" inputmode="decimal" placeholder="e.g. 50000">
<label>Note <span class="small">optional</span></label><input id="e_note" placeholder="${pay?"e.g. transfer or cash":"e.g. 20 bags of rice"}">
<button class="btn green" onclick="saveEntry('${id}','${type}')">Save</button><div class="gap"></div><button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
}
function saveEntry(id,type){
const amt=parseFloat($("#e_amt").value),note=$("#e_note").value.trim();
if(!(amt>0))return toast("Type an amount more than 0");
const l=ledger(),p=l.find(x=>x.id===id);
if(type==="pay"&&amt>balOf(p)+0.0001)return toast("That is more than the balance ("+naira(balOf(p))+")");
p.entries.push({id:DB.id(),type,amount:amt,date:new Date().toISOString(),note});
saveLedger(l);toast(type==="pay"?"Saved. Balance "+naira(balOf(p)):"Saved");render();
}
function dueForm(id){
sheet(`<h1>Due date</h1><p class="sub">When should you be reminded?</p>${pills("df_due",DUES,"No date")}<input id="df_date" type="date" style="display:none">
<button class="btn green" onclick="saveDue('${id}')">Save</button><div class="gap"></div><button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
}
function saveDue(id){
const due=dueFrom($("#df_due").value,$("#df_date").value);
if($("#df_due").value==="Pick a date"&&!due)return toast("Please pick the date");
const l=ledger(),p=l.find(x=>x.id===id);p.due=due;saveLedger(l);toast(due?"Reminder set":"Due date removed");render();
}
function delEntry(pid,eid){
const p=ledger().find(x=>x.id===pid),e=p.entries.find(x=>x.id===eid);
sheet(`<h1>Remove this entry?</h1><p class="sub">${e.type==="charge"?LK[p.kind].chargeName:LK[p.kind].payName}: ${naira(e.amount)}</p><button class="btn red" onclick="doDelEntry('${pid}','${eid}')">Yes, remove</button><div class="gap"></div><button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
}
function doDelEntry(pid,eid){const l=ledger(),p=l.find(x=>x.id===pid);p.entries=p.entries.filter(x=>x.id!==eid);saveLedger(l);toast("Removed");render()}
function delPerson(id){
const p=ledger().find(x=>x.id===id);
sheet(`<h1>Delete ${esc(p.name)}?</h1><p class="sub">All their records will be removed. This cannot be undone.</p><button class="btn red" onclick="doDelPerson('${id}')">Yes, delete</button><div class="gap"></div><button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
}
function doDelPerson(id){const k=ledger().find(x=>x.id===id).kind;saveLedger(ledger().filter(x=>x.id!==id));vault.page=k;toast("Deleted");render()}

/* ---------- Reminders on the Dashboard (count only) and when the app opens ---------- */
const _dash0=screens.dash;
screens.dash=()=>{
let h=_dash0();
const n=remindItems().length;
if(isOwner()&&n)h+=`<div class="card" style="border:2px solid #f59e0b;background:#fffbeb"><b>⏰ ${n} payment reminder${n>1?"s":""}</b><p class="sub" style="margin:0 0 10px">Open your Vault to see who to pay or collect from.</p><button class="btn sm ghost" onclick="go('vault')">Open Vault</button></div>`;
return h;
};
setTimeout(()=>{const n=remindItems().length;if(n&&isOwner())toast(n+" payment reminder"+(n>1?"s":"")+" in your Vault")},900);

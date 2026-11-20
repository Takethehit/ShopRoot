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
const fin={tab:"owe",page:"home",settled:false};
let vr={key:"today",from:"",to:""};
const _go2=go;
go=function(t){if(t!=="vault"){vault.page="home";vr.key="today"}if(t!=="fin")fin.page="home";_go2(t)};
vault.page="home";
function vaultGo(p){vault.page=p;render()}
function finGo(p,t){fin.page=p;if(t)fin.tab=t;render()}
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

/* ---------- PIN (Vault and Finance). It can be skipped by an owner who works alone ---------- */
function keypad(title,sub,skip){
const dots=[0,1,2,3].map(i=>`<i class="${i<vault.buf.length?"on":""}"></i>`).join("");
const keys=["1","2","3","4","5","6","7","8","9","","0","⌫"].map(k=>k===""?`<span></span>`:`<button onclick="pinKey('${k}')">${k}</button>`).join("");
return `<h1>🔐 ${title}</h1><p class="sub">${sub}</p><div class="dots">${dots}</div>${vault.msg?`<p class="sub" style="text-align:center;color:var(--red);font-weight:700">${vault.msg}</p>`:""}<div class="keys">${keys}</div>${skip?`<button class="btn ghost" style="max-width:300px;margin:18px auto 6px;display:block" onclick="skipPin()">Skip. I work alone</button><p class="small" style="text-align:center;margin:0">You can set a PIN later in the Vault.</p>`:""}`;
}
function pinDone(){
const pin=vault.buf;vault.buf="";
const has=DB.get("vaultpin",null);
if(!has){
if(vault.step!=="confirm"){vault.first=pin;vault.step="confirm";return render()}
if(pin===vault.first){DB.set("vaultpin",pinHash(pin));DB.set("pinskip",false);ownerOn();vault.step="enter";toast("PIN saved");return render()}
vault.step="create";vault.msg="The two PINs did not match. Try again.";return render();
}
if(Date.now()<vault.lock){vault.msg="Too many tries. Please wait a minute.";return render()}
if(pinHash(pin)===has){vault.tries=0;ownerOn();if(vault.next){const n=vault.next;vault.next=null;current=n}return render()}
vault.tries++;
if(vault.tries>=5){vault.lock=Date.now()+60000;vault.tries=0;vault.msg="Too many tries. Please wait a minute."}
else vault.msg="Wrong PIN. Try again.";
render();
}
function skipPin(){DB.set("pinskip",true);toast("PIN skipped");render()}
function startPin(){DB.set("pinskip",false);vault.step="create";vault.buf="";vault.msg="";render()}
function lockNow(){own.until=0;render()}
function changePin(){
sheet(`<h1>Change your PIN?</h1><p class="sub">You will create a new 4-digit PIN.</p><button class="btn red" onclick="doChangePin()">Yes, change PIN</button><div class="gap"></div><button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
}
function doChangePin(){DB.set("vaultpin",null);DB.set("pinskip",false);own.until=0;vault.step="create";vault.buf="";vault.msg="";closeSheet();render()}
function turnOffPin(){
sheet(`<h1>Turn off the PIN?</h1><p class="sub">Anyone who uses this phone will be able to open the Vault and Finance, and see your buying prices and profit.</p><button class="btn red" onclick="doTurnOff()">Yes, turn it off</button><div class="gap"></div><button class="btn ghost" onclick="closeSheet()">Cancel</button>`);
}
function doTurnOff(){DB.set("vaultpin",null);DB.set("pinskip",true);closeSheet();toast("PIN turned off");render()}
function gate(sub){
if(!hasPin()&&!DB.get("pinskip",false)){
if(vault.step!=="confirm")vault.step="create";
return keypad(vault.step==="create"?"Create your PIN":"Confirm your PIN","Choose 4 numbers and write them down somewhere safe. Or skip if you work alone.",vault.step==="create");
}
if(hasPin()&&!isOwner()){vault.step="enter";return keypad("Enter your PIN",sub,false)}
return null;
}
screens.vault=()=>gate("Your profit and private records are inside.")||vaultHome();
screens.fin=()=>gate("Who you owe and who owes you.")||financeHome();

/* ---------- Dates, totals and the numbers shown in the Vault ---------- */
const DAY=864e5;
const startOfDay=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x};
function rangeOf(key,from,to){
const t0=startOfDay(new Date());
if(key==="today")return[t0,new Date(+t0+DAY)];
if(key==="yesterday")return[new Date(+t0-DAY),t0];
if(key==="7d")return[new Date(+t0-6*DAY),new Date(+t0+DAY)];
if(key==="30d")return[new Date(+t0-29*DAY),new Date(+t0+DAY)];
if(key==="3m")return[new Date(+t0-89*DAY),new Date(+t0+DAY)];
if(key==="1y")return[new Date(+t0-364*DAY),new Date(+t0+DAY)];
const a=from?new Date(from+"T00:00:00"):t0,b=to?new Date(to+"T00:00:00"):a;
return[a,new Date(+b+DAY)];
}
const inR=(iso,r)=>{const t=+new Date(iso);return t>=+r[0]&&t<+r[1]};
const unitsOf=(i,q)=>!i?0:(i.unit==="piece"?q:q/1000);
const fmtN=n=>String(Math.round(n*10)/10);
const isRestock=m=>m.type==="restock"||m.type==="opening";
function stats(r){
const sales=DB.get("sales",[]).filter(s=>inR(s.date,r));
const rev=sumOf(sales,s=>s.total),dis=sumOf(sales,s=>s.discount||0),cost=sumOf(sales,saleCostNow);
const mv=moves().filter(m=>isRestock(m)&&inR(m.date,r));
return{count:sales.length,rev,dis,cost,profit:Math.round((rev-cost)*100)/100,restockUnits:sumOf(mv,m=>unitsOf(itemById(m.itemId),m.amount)),restockValue:sumOf(mv,m=>{const i=itemById(m.itemId);return i&&hasCost(i)?m.amount*i.packPrice/i.packSize:0})};
}
const METRICS={
sales:{t:"Sales",ico:"💰",val:s=>naira(s.rev)},
profit:{t:"Profit",ico:"📈",val:s=>money(s.profit)},
restock:{t:"Restocked",ico:"📦",val:s=>fmtN(s.restockUnits)+" units"},
discounts:{t:"Discounts",ico:"🏷️",val:s=>naira(s.dis)},
count:{t:"Sales count",ico:"🧾",val:s=>String(s.count)}
};
function totalStock(){
const its=items();
return{units:sumOf(its,i=>unitsOf(i,i.stock)),products:its.length,value:sumOf(its,i=>hasCost(i)?i.stock*i.packPrice/i.packSize:0),unknown:its.filter(i=>!hasCost(i)).length};
}
function openCard(pg){if(pg.startsWith("m:"))vr.key="today";vaultGo(pg)}
const kc=(ico,label,val,sub,pg)=>`<button class="kc" onclick="openCard('${pg}')"><span>${ico} ${label}</span><b>${val}</b><span>${sub}</span></button>`;
function kpiRow(){
const st=stats(rangeOf("today")),ts=totalStock();
return `<p class="sub">Today. Tap any box to see the full details.</p><div class="kpi">${kc("💰","Sales",naira(st.rev),st.count+" sale"+(st.count===1?"":"s"),"m:sales")}${kc("📈","Profit",money(st.profit),"after buying prices","m:profit")}${kc("📦","Restocked",fmtN(st.restockUnits)+" units",st.restockValue?"worth "+naira(st.restockValue):"today","m:restock")}${kc("🗄️","Total stock",fmtN(ts.units)+" units",ts.products+" product"+(ts.products===1?"":"s"),"stock")}${kc("🏷️","Discounts",naira(st.dis),"given today","m:discounts")}${kc("🧾","Sales count",String(st.count),"today","m:count")}</div>`;
}

/* ---------- Vault pages ---------- */
function vaultHome(){
const p=vault.page||"home";
if(p==="stock")return stockPage();
if(p.startsWith("m:"))return metricPage(p.slice(2));
return vaultMain();
}
const PACKS={g:[["1 kg",1000],["5 kg",5000],["10 kg",10000],["25 kg",25000],["50 kg",50000],["Other",0]],ml:[["1 L",1000],["5 L",5000],["10 L",10000],["20 L",20000],["25 L",25000],["Other",0]]};
function costLine(i){
if(i.unit==="piece")return naira(i.packPrice/i.packSize)+" each"+(Number(i.packSize)!==1?` <span class="small">(${naira(i.packPrice)} per ${fmt(i,i.packSize)})</span>`:"");
return naira(i.packPrice)+" per "+fmt(i,i.packSize);
}
function priceRows(its){
return its.map(i=>`<div class="card"><div class="pcrow"><div class="pcimg">${thumb(i)}</div><div class="pcinfo"><b>${esc(i.name)}</b><span class="small">${fmt(i,i.stock)} in stock</span><span>${hasCost(i)?costLine(i):`<span style="color:var(--red);font-weight:700">Buying price not set</span>`}</span></div></div><button class="btn sm ${hasCost(i)?"ghost":"green"}" onclick="costForm('${i.id}')">${hasCost(i)?"Change buying price":"Set buying price"}</button></div>`).join("");
}
function vaultMain(){
const its=items(),miss=its.filter(i=>!hasCost(i));
return `<h1>🔐 Vault</h1>`+(hasPin()?`<button class="btn sm ghost" onclick="lockNow()">Lock vault now</button><div class="gap"></div>`:"")+kpiRow()+
(miss.length?`<div class="card" style="border:2px solid #f59e0b;background:#fffbeb"><b>⚠️ ${miss.length} product${miss.length>1?"s have":" has"} no buying price</b><p class="sub" style="margin:0">Profit is too high until you add what you paid. Scroll down to add them.</p></div>`:"")+
`<h1 style="font-size:22px">Buying prices</h1><p class="sub">What you paid for each product. Only you can see this.</p>`+
(its.length?priceRows(its):`<div class="card"><p class="sub" style="margin:0">No products yet. Add products in the Product tab first.</p></div>`)+
(hasPin()?`<div class="g2"><button class="btn sm ghost" onclick="changePin()">Change PIN</button><button class="btn sm ghost" onclick="turnOffPin()">Turn off PIN</button></div>`:`<div class="card"><b>🔓 No PIN set</b><p class="sub" style="margin:0 0 10px">Anyone using this phone can open the Vault and Finance. Set a PIN to protect them.</p><button class="btn sm green" onclick="startPin()">Set a PIN</button></div>`);
}
function stockPage(){
const its=items(),ts=totalStock();
const rows=its.map(i=>{const v=hasCost(i)?i.stock*i.packPrice/i.packSize:null;const tag=isLow(i)?`<span class="badge">${i.stock<=0?"Out":"Low"}</span>`:"";return `<div class="card"><div class="pcrow" style="margin:0"><div class="pcimg">${thumb(i)}</div><div class="pcinfo"><b>${esc(i.name)}${tag}</b><span class="small">${fmt(i,i.stock)} in stock</span><span class="small">${v==null?"Buying price not set":"Worth "+naira(v)+" at buying price"}</span></div></div></div>`}).join("");
return backBtn()+`<h1>🗄️ Total stock</h1>`+kpiRow()+
`<div class="card"><b>Stock summary</b><div class="it"><span>Units in stock</span><b>${fmtN(ts.units)}</b></div><div class="it"><span>Products</span><b>${ts.products}</b></div><div class="it" style="margin:0"><span>Value at buying price</span><b>${naira(ts.value)}</b></div>${ts.unknown?`<p class="small" style="margin:8px 0 0">${ts.unknown} product${ts.unknown>1?"s have":" has"} no buying price yet, so the value is not complete.</p>`:""}</div>`+
`<h1 style="font-size:22px">All products</h1>`+(rows||`<div class="card"><p class="sub" style="margin:0">No products yet.</p></div>`);
}
function setRange(k){vr.key=k;if(k==="custom"&&!vr.from){const t=ymd(new Date());vr.from=t;vr.to=t}render()}
function applyCustom(){
const f=$("#vr_from").value,t=$("#vr_to").value;
if(!f)return toast("Pick the first date");
if(t&&t<f)return toast("The last date must be after the first date");
vr.from=f;vr.to=t||f;vr.key="custom";render();
}
function breakdown(k,r){
const days=Math.round((r[1]-r[0])/DAY),byMonth=days>62;
const keyOf=iso=>{const d=new Date(iso);return byMonth?d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"):ymd(d)};
const B={},get=kk=>B[kk]||(B[kk]={rev:0,dis:0,profit:0,count:0,units:0});
DB.get("sales",[]).filter(s=>inR(s.date,r)).forEach(s=>{const b=get(keyOf(s.date));b.rev+=s.total;b.dis+=s.discount||0;b.profit+=saleProfitNow(s);b.count++});
moves().filter(m=>isRestock(m)&&inR(m.date,r)).forEach(m=>{get(keyOf(m.date)).units+=unitsOf(itemById(m.itemId),m.amount)});
const val=b=>k==="sales"?naira(b.rev):k==="profit"?money(Math.round(b.profit*100)/100):k==="restock"?fmtN(b.units)+" units":k==="discounts"?naira(b.dis):String(b.count);
const label=kk=>byMonth?new Date(kk+"-01T00:00:00").toLocaleDateString("en-NG",{month:"long",year:"numeric"}):new Date(kk+"T00:00:00").toLocaleDateString("en-NG",{weekday:"short",day:"numeric",month:"short"});
const keys=Object.keys(B).sort().reverse();
const nonzero=keys.filter(kk=>{const b=B[kk];return b.rev||b.dis||b.units||b.count});
return nonzero.length?nonzero.map(kk=>`<div class="it"><span>${label(kk)}</span><b>${val(B[kk])}</b></div>`).join(""):`<p class="sub" style="margin:0">Nothing recorded in this period.</p>`;
}
function metricPage(k){
const M=METRICS[k]||METRICS.sales;if(!METRICS[k])k="sales";
const r=rangeOf(vr.key,vr.from,vr.to),st=stats(r);
const P=[["today","Today"],["yesterday","Yesterday"],["7d","7 days"],["30d","30 days"],["3m","3 months"],["1y","1 year"],["custom","Pick dates"]];
const names={today:"Today",yesterday:"Yesterday","7d":"Last 7 days","30d":"Last 30 days","3m":"Last 3 months","1y":"Last year",custom:"Chosen dates"};
const compare=P.filter(p=>p[0]!=="custom").map(p=>`<div class="it" onclick="setRange('${p[0]}')"><span>${p[1]==="7 days"?"Last 7 days":p[1]==="30 days"?"Last 30 days":p[1]==="3 months"?"Last 3 months":p[1]==="1 year"?"Last year":p[1]}</span><b>${M.val(stats(rangeOf(p[0])))}</b></div>`).join("");
return backBtn()+`<h1>${M.ico} ${M.t}</h1>
<div class="pills">${P.map(p=>`<button class="pill ${vr.key===p[0]?"on":""}" onclick="setRange('${p[0]}')">${p[1]}</button>`).join("")}</div>
${vr.key==="custom"?`<div class="card"><label>From</label><input id="vr_from" type="date" value="${vr.from}"><label>To</label><input id="vr_to" type="date" value="${vr.to}"><button class="btn green" onclick="applyCustom()">Show these dates</button></div>`:""}
<div class="card" style="background:linear-gradient(135deg,#4A2370,#6b3a9a);color:#fff"><b>${M.t} · ${names[vr.key]}</b><div style="font-size:38px;font-weight:900">${M.val(st)}</div><span style="opacity:.9">${st.count} sale${st.count===1?"":"s"}</span></div>
<div class="card"><b>Compare</b>${compare}</div>
<h1 style="font-size:22px">Day by day</h1><div class="card">${breakdown(k,r)}</div>`;
}

/* ---------- Buying price form (inside the Vault) ---------- */
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

/* ---------- Finance: people I owe and people who owe me ---------- */
const LK={
owe:{title:"Suppliers I owe",icon:"🏭",add:"+ Add supplier or partner",charge:"+ Add stock bought",pay:"💵 Record payment",chargeTitle:"Add stock bought",payTitle:"Record payment",chargeName:"Stock bought",payName:"Payment made",totalL:"Total bought",paidL:"Paid so far",balL:"Still to pay",amtLabel:"Value of stock bought (₦)",tags:["Supplier","Business partner","Individual","Other"],empty:"No one yet. Add a supplier or partner you need to pay."},
owed:{title:"People who owe me",icon:"🤝",add:"+ Add person who owes me",charge:"+ Add amount owed",pay:"💵 Record collection",chargeTitle:"Add amount owed",payTitle:"Record collection",chargeName:"Amount owed",payName:"Collected",totalL:"Total owed",paidL:"Collected so far",balL:"Still to collect",amtLabel:"Amount they owe (₦)",tags:["Customer","Business","Individual","Other"],empty:"No one yet. Add someone who owes you money."}
};
const ledger=()=>DB.get("ledger",[]);
const saveLedger=l=>DB.set("ledger",l);
const entTotal=(p,t)=>p.entries.filter(e=>e.type===t).reduce((s,e)=>s+e.amount,0);
const balOf=p=>Math.round((entTotal(p,"charge")-entTotal(p,"pay"))*100)/100;
const totalBal=k=>ledger().filter(p=>p.kind===k).reduce((s,p)=>s+Math.max(0,balOf(p)),0);
const activeCount=k=>ledger().filter(p=>p.kind===k&&balOf(p)>0).length;
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
return `<div class="card" style="border:2px solid #f59e0b;background:#fffbeb"><b>⏰ Reminders</b>${r.map(p=>`<div class="it" onclick="finGo('p:${p.id}','${p.kind}')"><span>${LK[p.kind].icon} <b>${esc(p.name)}</b><br><span class="small" style="color:${dueColor(p)};font-weight:700">${dueText(p)} · ${p.kind==="owe"?"pay":"collect"}</span></span><b>${naira(balOf(p))}</b></div>`).join("")}</div>`;
}
function personCard(p){
const b=balOf(p),dt=dueText(p);
return `<div class="card" onclick="finGo('p:${p.id}','${p.kind}')"><div class="it"><b style="font-size:18px">${esc(p.name)}</b><b style="font-size:20px;color:${b>0?(p.kind==="owe"?"var(--red)":"var(--grape)"):"var(--green)"}">${b>0?naira(b):"Settled ✅"}</b></div><p class="small" style="margin:0">${esc(p.tag||"")}${dt?` · <span style="color:${dueColor(p)};font-weight:700">${dt}</span>`:""}</p></div>`;
}
function financeHome(){
if(fin.page.startsWith("p:"))return personPage(fin.page.slice(2));
const L=LK[fin.tab],all=ledger().filter(p=>p.kind===fin.tab);
const act=all.filter(p=>balOf(p)>0).sort((a,b)=>{const da=a.due?daysTo(a.due):9999,db=b.due?daysTo(b.due):9999;return da-db||balOf(b)-balOf(a)});
const done=all.filter(p=>balOf(p)<=0);
return `<h1>💼 Finance</h1>
<div class="kpi"><button class="kc" onclick="finGo('home','owe')"><span>🏭 I owe</span><b style="color:var(--red)">${naira(totalBal("owe"))}</b><span>${activeCount("owe")} active</span></button><button class="kc" onclick="finGo('home','owed')"><span>🤝 Owed to me</span><b>${naira(totalBal("owed"))}</b><span>${activeCount("owed")} active</span></button></div>
${remindCard()}
<div class="seg"><button class="${fin.tab==="owe"?"on":""}" onclick="finGo('home','owe')">I owe</button><button class="${fin.tab==="owed"?"on":""}" onclick="finGo('home','owed')">Owed to me</button></div>
<button class="btn green" onclick="personForm('${fin.tab}')">${L.add}</button><div class="gap"></div>
<h1 style="font-size:22px">Active</h1>${act.length?act.map(personCard).join(""):`<div class="card"><p class="sub" style="margin:0">${L.empty}</p></div>`}
${done.length?`<button class="btn sm ghost" onclick="fin.settled=!fin.settled;render()">${fin.settled?"Hide":"Show"} settled (${done.length})</button><div class="gap"></div>${fin.settled?done.map(personCard).join(""):""}`:""}`;
}
function personPage(id){
const p=ledger().find(x=>x.id===id);
if(!p){fin.page="home";return financeHome()}
const L=LK[p.kind],b=balOf(p),dt=dueText(p);
let run=0;
const rows=p.entries.map(e=>{run+=e.type==="charge"?e.amount:-e.amount;return{e,run:Math.round(run*100)/100}}).reverse().map(({e,run})=>{
const when=new Date(e.date).toLocaleDateString("en-NG",{day:"2-digit",month:"short",year:"numeric"});
return `<div class="it" onclick="delEntry('${p.id}','${e.id}')"><span><b>${e.type==="charge"?L.chargeName:L.payName}</b>${e.note?" · "+esc(e.note):""}<br><span class="small">${when} · balance ${naira(run)}</span></span><b style="color:${e.type==="charge"?"var(--grape)":"var(--green)"}">${e.type==="charge"?"+":"-"}${naira(e.amount)}</b></div>`;
}).join("");
return `<button class="btn sm ghost" onclick="finGo('home','${p.kind}')">← Back to Finance</button><div class="gap"></div><h1>${esc(p.name)}</h1><p class="sub">${esc(p.tag||"")}${p.note?" · "+esc(p.note):""}</p>
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
fin.tab=k;fin.page="p:"+p.id;toast("Saved");render();
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
function doDelPerson(id){const k=ledger().find(x=>x.id===id).kind;saveLedger(ledger().filter(x=>x.id!==id));fin.tab=k;fin.page="home";toast("Deleted");render()}
setTimeout(()=>{const n=remindItems().length;if(n&&isOwner())toast(n+" payment reminder"+(n>1?"s":"")+" in Finance")},900);

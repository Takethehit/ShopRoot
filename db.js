const DB={
get(k,d){try{const v=localStorage.getItem("sr_"+k);return v?JSON.parse(v):d}catch(e){return d}},
set(k,v){try{localStorage.setItem("sr_"+k,JSON.stringify(v));return true}catch(e){alert("Could not save. Phone storage may be full.");return false}},
id(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
};

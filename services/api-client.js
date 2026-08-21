(function(root){
  'use strict';
  const caches={chinese:new Map(),thai:new Map(),almanac:new Map(),tibetan:new Map()};
  const lastErrors={status:null,chinese:null,thai:null,almanac:null,tibetan:null,geocode:null,timezone:null,siusts:null,lunarCalendar:null,marsCalendar:null};

  async function raw(url){
    const r=await fetch(url,{cache:'no-store'});
    let j=null;
    try{j=await r.json();}catch(e){const err=new Error(`Invalid JSON from ${url}`);err.httpStatus=r.status;throw err;}
    if(!r.ok||j?.ok===false){const err=new Error(j?.error||`API failed: ${url}`);err.httpStatus=r.status;err.detail=j?.detail||'';err.payload=j;throw err;}
    return j;
  }
  async function json(url){const j=await raw(url);return Object.prototype.hasOwnProperty.call(j,'data')?j.data:j;}
  function remember(key,error){lastErrors[key]=error?{message:error.message||String(error),detail:error.detail||'',httpStatus:error.httpStatus||null,at:new Date().toISOString()}:null;}

  // /api/status is intentionally a top-level status object, not a {data: ...} business payload.
  async function status(){
    try{const j=await raw('/api/status');remember('status',null);return j.data??j;}
    catch(e){remember('status',e);throw e;}
  }
  function dayKey(g){return `${g.year}-${g.month}-${g.day}`;}
  function getChineseCached(g){return caches.chinese.get(dayKey(g))||null;}
  function getThaiCached(g){return caches.thai.get(dayKey(g))||null;}
  async function chineseDay(g){const k=dayKey(g);if(caches.chinese.has(k))return caches.chinese.get(k);try{const x=await json(`/api/chinese/day?y=${g.year}&m=${g.month}&d=${g.day}`);caches.chinese.set(k,x);remember('chinese',null);return x;}catch(e){remember('chinese',e);return null;}}
  async function chineseMonth(y,m,days){try{const xs=await json(`/api/chinese/month?y=${y}&m=${m}&days=${days}`);xs.forEach(row=>{if(row.error)return;const g=row.solar;caches.chinese.set(`${g[0]}-${g[1]}-${g[2]}`,row);});remember('chinese',null);return xs;}catch(e){remember('chinese',e);return null;}}
  async function chineseAlmanac(g,h=12,min=0,sec=0){const k=`${g.year}-${g.month}-${g.day}-${h}-${min}-${sec}`;if(caches.almanac.has(k))return caches.almanac.get(k);try{const x=await json(`/api/chinese/almanac?y=${g.year}&m=${g.month}&d=${g.day}&h=${h}&min=${min}&sec=${sec}`);caches.almanac.set(k,x);remember('almanac',null);return x;}catch(e){remember('almanac',e);return null;}}
  async function chineseFromLunar(y,m,d,leap=0){return json(`/api/chinese/from-lunar?y=${y}&m=${m}&d=${d}&leap=${leap}`);}
  async function thaiDay(g){const k=dayKey(g);if(caches.thai.has(k))return caches.thai.get(k);try{const x=await json(`/api/thai/day?y=${g.year}&m=${g.month}&d=${g.day}`);caches.thai.set(k,x);remember('thai',null);return x;}catch(e){remember('thai',e);return null;}}
  async function thaiMonth(y,m,days){try{const xs=await json(`/api/thai/month?y=${y}&m=${m}&days=${days}`);xs.forEach(row=>{if(row.error)return;const g=row.solar;caches.thai.set(`${g[0]}-${g[1]}-${g[2]}`,row);});remember('thai',null);return xs;}catch(e){remember('thai',e);return null;}}
  async function tibetanDay(g,engine='phugpa'){const k=`${engine}:${g.year}-${g.month}-${g.day}`;if(caches.tibetan.has(k))return caches.tibetan.get(k);try{const x=await json(`/api/tibetan/day?y=${g.year}&m=${g.month}&d=${g.day}&engine=${encodeURIComponent(engine)}`);caches.tibetan.set(k,x);remember('tibetan',null);return x;}catch(e){remember('tibetan',e);return null;}}
  async function geocode(q){try{const x=await json(`/api/geocode/search?q=${encodeURIComponent(q)}`);remember('geocode',null);return x;}catch(e){remember('geocode',e);return [];}}
  async function reverse(lat,lon){try{const x=await json(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);remember('geocode',null);return x;}catch(e){remember('geocode',e);return null;}}
  async function resolveLocation(lat,lon){try{const x=await json(`/api/location/resolve?lat=${lat}&lon=${lon}`);remember('timezone',null);return x;}catch(e){remember('timezone',e);return null;}}
  async function siUstsFromUtc(time){try{const x=await json(`/api/si-usts/from-utc?time=${encodeURIComponent(time)}`);remember('siusts',null);return x;}catch(e){remember('siusts',e);throw e;}}
  async function lunarCalendar(input){const q=new URLSearchParams({time:input.time,lat:input.lat,lon:input.lon,height:input.height??0,offset:input.offset??0,label:input.label||'Base Civil Time'});try{const x=await json(`/api/lunar-calendar/calculate?${q}`);remember('lunarCalendar',null);return x;}catch(e){remember('lunarCalendar',e);throw e;}}
  async function marsCalendar(input){const q=new URLSearchParams({time:input.time,lon:input.lon??0});try{const x=await json(`/api/mars-calendar/calculate?${q}`);remember('marsCalendar',null);return x;}catch(e){remember('marsCalendar',e);throw e;}}
  function getLastError(key){return lastErrors[key]||null;}
  root.CalendarApiClient={...caches,status,chineseDay,chineseMonth,chineseAlmanac,chineseFromLunar,thaiDay,thaiMonth,tibetanDay,geocode,reverse,resolveLocation,siUstsFromUtc,lunarCalendar,marsCalendar,getChineseCached,getThaiCached,getLastError,lastErrors,_json:json,_raw:raw};
})(window);

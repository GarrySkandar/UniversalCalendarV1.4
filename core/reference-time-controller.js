(function(root){
  'use strict';

  const labels={live:'实时',calendar:'日历联动',custom:'自定义 UTC'};
  const listeners=new Set();
  let mode='live';
  let fixedInstant=new Date();
  let detail='跟随系统当前时间，每秒校时。';

  function asDate(value){
    const date=value instanceof Date?new Date(value.getTime()):new Date(value);
    if(Number.isNaN(date.getTime()))throw new Error('无效的参考时刻');
    return date;
  }
  function currentInstant(now){
    return mode==='live'?asDate(now||new Date()):new Date(fixedInstant.getTime());
  }
  function snapshot(now){
    return {mode,label:labels[mode],detail,instant:currentInstant(now)};
  }
  function emit(reason,now){
    const state=snapshot(now);
    listeners.forEach(listener=>listener(state,reason));
    return state;
  }
  function setLive(now=new Date()){
    mode='live';fixedInstant=asDate(now);detail='跟随系统当前时间，每秒校时。';
    return emit('mode',fixedInstant);
  }
  function setCalendar(parts,location,temporal){
    if(!temporal?.instantFromLocalParts)throw new Error('当地时间转换能力不可用');
    fixedInstant=asDate(temporal.instantFromLocalParts(parts,location||{}));mode='calendar';
    const place=location?.name||'所选地点',zone=location?.timezone||temporal.offsetLabel?.(location?.utcOffsetMinutes||0)||'当地时区';
    detail=`来自日历选定时刻 · ${place} · ${zone}`;
    return emit('mode');
  }
  function setCustom(value,source='手动输入'){
    fixedInstant=asDate(value);mode='custom';detail=`${source} · 月球历与火星历共用同一 UTC`;
    return emit('mode');
  }
  function tick(now=new Date()){
    if(mode!=='live')return snapshot();
    fixedInstant=asDate(now);
    return emit('tick',fixedInstant);
  }
  function subscribe(listener,{immediate=false}={}){
    listeners.add(listener);
    if(immediate)listener(snapshot(),'init');
    return ()=>listeners.delete(listener);
  }

  root.ReferenceTimeController={labels,snapshot,getInstant:currentInstant,getMode:()=>mode,setLive,setCalendar,setCustom,tick,subscribe};
})(window);

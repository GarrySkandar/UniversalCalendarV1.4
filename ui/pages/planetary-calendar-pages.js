(function(root){
  'use strict';
  const pad=n=>String(n).padStart(2,'0');
  const utcInputValue=(date=new Date())=>date.toISOString().slice(0,19);
  const globes={moon:null,mars:null};
  const renderVersions={lunar:0,mars:0};
  const lightLabel=state=>state==='day'?'昼区 · 太阳在几何地平线上方':state==='night'?'夜区 · 太阳在几何地平线下方':'晨昏线附近';
  function updateSurfaceDetails($){
    const G=root.PlanetarySurfaceGlobe;
    if(globes.moon){
      const state=globes.moon.getState();
      if($('#lunarSurfaceCoordinates'))$('#lunarSurfaceCoordinates').textContent=G.formatCoordinate(state.selection.lat,state.selection.lon);
      if($('#lunarSurfaceEarthSide'))$('#lunarSurfaceEarthSide').textContent=state.earthSide==='near'?'近地面 · 朝向地球一侧':'背地面 · 背向地球一侧';
      if($('#lunarSurfaceLight'))$('#lunarSurfaceLight').textContent=lightLabel(state.illumination.state);
    }
    if(globes.mars){
      const state=globes.mars.getState();
      if($('#marsSurfaceCoordinates'))$('#marsSurfaceCoordinates').textContent=G.formatCoordinate(state.selection.lat,state.selection.lon);
      if($('#marsSurfaceLight'))$('#marsSurfaceLight').textContent=lightLabel(state.illumination.state);
      if($('#marsSurfaceSubsolar'))$('#marsSurfaceSubsolar').textContent=G.formatCoordinate(state.sun.lat,state.sun.lon);
    }
  }
  function initSurfaceGlobes($){
    const G=root.PlanetarySurfaceGlobe;if(!G)return;
    const lunarCanvas=$('#lunarSurfaceGlobe'),marsCanvas=$('#marsSurfaceGlobe');
    if(lunarCanvas&&!globes.moon)globes.moon=G.create(lunarCanvas,{body:'moon',lat:Number($('#lunarLat')?.value),lon:Number($('#lunarLon')?.value),viewLat:0,viewLon:0,onPick:point=>{
      $('#lunarLat').value=point.lat.toFixed(5);$('#lunarLon').value=point.lon.toFixed(5);updateSurfaceDetails($);$('#calculateLunar')?.click();
    }});
    if(marsCanvas&&!globes.mars)globes.mars=G.create(marsCanvas,{body:'mars',lat:Number($('#marsLat')?.value),lon:Number($('#marsLon')?.value),viewLat:0,viewLon:0,onPick:point=>{
      $('#marsLat').value=point.lat.toFixed(5);$('#marsLon').value=point.lon.toFixed(5);updateSurfaceDetails($);$('#calculateMars')?.click();
    }});
    for(const input of [$('#lunarLat'),$('#lunarLon')])if(input&&!input.dataset.surfaceBound){input.dataset.surfaceBound='1';input.addEventListener('change',()=>{globes.moon?.setSelection(Number($('#lunarLat').value),Number($('#lunarLon').value),true);updateSurfaceDetails($);});}
    for(const input of [$('#marsLat'),$('#marsLon')])if(input&&!input.dataset.surfaceBound){input.dataset.surfaceBound='1';input.addEventListener('change',()=>{globes.mars?.setSelection(Number($('#marsLat').value),Number($('#marsLon').value),true);updateSurfaceDetails($);});}
    document.querySelectorAll('[data-surface-action]').forEach(button=>{if(button.dataset.surfaceBound)return;button.dataset.surfaceBound='1';button.addEventListener('click',()=>{
      const action=button.dataset.surfaceAction;if(action==='lunar-near')globes.moon?.setView(0,0);else if(action==='lunar-far')globes.moon?.setView(0,180);else if(action==='lunar-selection')globes.moon?.focusSelection();else if(action==='mars-prime')globes.mars?.setView(0,0);else if(action==='mars-selection')globes.mars?.focusSelection();updateSurfaceDetails($);
    });});
    updateSurfaceDetails($);
  }
  function readUtc($,selector){const value=$(selector)?.value||'',instant=new Date(`${value}Z`);if(Number.isNaN(instant.getTime()))throw new Error('请输入有效的 UTC 日期时间');return instant;}
  function earthLocalText(T,instant,location){
    if(!T||!location||Number.isNaN(instant.getTime()))return '—';
    const p=T.zoneParts(instant,location.timezone,location.utcOffsetMinutes);
    return `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
  }
  function earthReferenceText(T,instant,location){
    if(!location)return '—';
    const referenceInstant=Number.isNaN(instant.getTime())?new Date():instant;
    const offset=T?.zoneOffsetMinutes?.(referenceInstant,location.timezone)??location.utcOffsetMinutes??0;
    const offsetText=T?.offsetLabel?.(offset)||'UTC',zoneText=location.timezone?`${location.timezone} · ${offsetText}`:offsetText;
    return `${location.name||'自定义地点'} · ${zoneText}`;
  }
  function updateEarthReference({$,T,location}){
    for(const kind of ['lunar','mars']){
      const input=$(`#${kind}Instant`),place=$(`#${kind}EarthReference`),clock=$(`#${kind}EarthLocalTime`);
      if(!input||!place||!clock)continue;
      const instant=new Date(`${input.value}Z`);
      place.textContent=earthReferenceText(T,instant,location);
      clock.textContent=earthLocalText(T,instant,location);
    }
  }
  function applyReferenceTime({$,T,location,state}){
    if(!state?.instant)return;
    const instant=state.instant instanceof Date?state.instant:new Date(state.instant),value=utcInputValue(instant),custom=state.mode==='custom';
    for(const kind of ['lunar','mars']){
      const input=$(`#${kind}Instant`);if(!input)continue;
      input.value=value;input.readOnly=!custom;input.setAttribute('aria-readonly',custom?'false':'true');
    }
    document.querySelectorAll('[data-reference-time-mode-label]').forEach(el=>{el.textContent=state.label||state.mode;});
    document.querySelectorAll('[data-reference-time-detail]').forEach(el=>{el.textContent=state.detail||'';});
    document.querySelectorAll('[data-reference-time-mode]').forEach(button=>{const active=button.dataset.referenceTimeMode===state.mode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',active?'true':'false');});
    updateEarthReference({$,T,location});
  }
  function initInputs({$,T,location,referenceTime}){
    applyReferenceTime({$,T,location,state:referenceTime||{mode:'live',label:'实时',detail:'跟随系统当前时间，每秒校时。',instant:new Date()}});
    initSurfaceGlobes($);
  }
  function syncReferenceInstant({$,T,location,source}){
    const from=$(`#${source}Instant`),other=source==='lunar'?$('#marsInstant'):$('#lunarInstant');
    if(from&&other)other.value=from.value;
    updateEarthReference({$,T,location});
  }
  function errorCard($,esc,target,error){const el=$(target);if(el)el.innerHTML=`<section class="surface planetary-message error"><b>Provider 暂不可用</b><p>${esc(error?.message||String(error||'Unknown error'))}</p><small>V1.4.0 保留的地球历法功能不受影响。</small></section>`;}
  function cards(esc,rows){return rows.map(([label,value,note=''])=>`<section class="surface planetary-card"><span>${esc(label)}</span><strong>${esc(value??'—')}</strong>${note?`<small>${esc(note)}</small>`:''}</section>`).join('');}
  async function renderLunar({$,PM,esc,T,location,quiet=false}){
    const version=++renderVersions.lunar,status=$('#lunarCalendarStatus'),out=$('#lunarCalendarResult');if(!status||!out)return;if(!quiet){status.textContent='正在通过 Lunar Calendar v0.1 Provider 计算…';out.innerHTML='';}
    try{
      const instant=readUtc($,'#lunarInstant'),lat=Number($('#lunarLat').value),lon=Number($('#lunarLon').value),offset=Number($('#lunarOffset').value);
      updateEarthReference({$,T,location});globes.moon?.resize();globes.moon?.setSelection(lat,lon,false);updateSurfaceDetails($);
      const [r,s]=await Promise.all([PM.execute('lunar-calendar-v03',{instant,planet:'moon',planetLocation:{body:'moon',latitude:lat,longitude:lon,heightM:0,coordinateFrame:'IAU_MOON'},civilOffsetHours:offset,civilLabel:'基地民用时间'}),PM.execute('si-usts',{instant})]);
      if(!r.ok)throw new Error(r.message);if(version!==renderVersions.lunar)return;const v=r.value,n=v.natural,sc=v.science,c=v.cultural;status.textContent=`规则 ${v.metadata.rules} · 科学量与文化标签解耦`;
      globes.moon?.setSun(n.subsolar_latitude_deg,n.subsolar_longitude_deg);updateSurfaceDetails($);
      out.innerHTML=cards(esc,[['阴阳合历月球自然昼夜',c.display,c.note],['几何昼夜',n.astronomical_state,'球形月面理论结果，不含 DEM 地形遮挡。'],['自然周期相位',`${sc.cycle_phase_percent.toFixed(6)}% · ${sc.cycle_phase_deg.toFixed(3)}°`,'从本次朔到下一次朔的周期进度。'],['月面太阳',`高度 ${n.sun_altitude_deg.toFixed(3)}° · 方位 ${n.sun_azimuth_deg.toFixed(3)}°`,'所选月面地点的太阳高度角与方位角。'],['当前朔',sc.current_new_moon_utc,`当前自然周期的起点，以 UTC 表示 · ${sc.new_moon_utc_status}`],['下一自然事件',n.next_event?`${n.next_event.name} · ${n.next_event.utc}`:'35日搜索范围内无结果','所选地点下一次几何日出或日落。'],['协调时间',v.civil.utc,'本次计算使用的绝对 UTC 时刻，与地球地点无关。'],['基地民用时间',v.civil.local,'按月球基地自定义偏移换算，不是地球参考地点时间。'],['SI-UST',s.ok?s.value.human:'Provider unavailable',s.ok?`跨行星连续 SI 秒时间轴 · ${s.value.timestamp}`:'跨行星连续 SI 秒时间轴。']]);
    }catch(e){if(version!==renderVersions.lunar)return;if(quiet)status.textContent=`实时更新暂不可用 · ${e?.message||e}`;else{status.textContent='';errorCard($,esc,'#lunarCalendarResult',e);}}
  }
  async function renderMars({$,PM,esc,T,location,quiet=false}){
    const version=++renderVersions.mars,status=$('#marsCalendarStatus'),out=$('#marsCalendarResult');if(!status||!out)return;if(!quiet){status.textContent='正在通过 Mars Calendar v0.4 Provider 计算…';out.innerHTML='';}
    try{
      const instant=readUtc($,'#marsInstant'),lat=Number($('#marsLat').value),lon=Number($('#marsLon').value),[r,s]=await Promise.all([PM.execute('mars-calendar-v04',{instant,planet:'mars',planetLocation:{body:'mars',longitude:lon,coordinateFrame:'IAU_MARS'}}),PM.execute('si-usts',{instant})]);
      updateEarthReference({$,T,location});globes.mars?.resize();globes.mars?.setSelection(lat,lon,false);updateSurfaceDetails($);
      if(!r.ok)throw new Error(r.message);if(version!==renderVersions.mars)return;const v=r.value,era=v.local_era==='MY'?`MY ${v.local_era_year}`:`${v.local_era_year} BME`;status.textContent=`Mars Calendar v0.4 · 年界 ${v.boundary.source} · ${v.boundary.precision_class}`;
      const sun=root.PlanetarySurfaceGlobe.marsSubsolarPoint(v.amt,v.ls_deg);globes.mars?.setSun(sun.lat,sun.lon);updateSurfaceDetails($);
      out.innerHTML=cards(esc,[['火星表面选点',root.PlanetarySurfaceGlobe.formatCoordinate(lat,lon),'纬度用于昼夜可视化；经度同时驱动 LMST 与当地日期。'],['火星当地日期',`${era} · 第 ${v.local_day_of_year} 日 · ${v.local_weekday_zh}`,'按所选火星经度和 LMST 划分的当地日期。'],['火星全球日期',`${v.global_era} ${v.global_era_year} · 第 ${v.global_day_of_year} 日 · ${v.global_weekday_zh}`,'按 Airy 本初子午线统一划分的全球日期。'],['LMST',v.lmst,`当地平太阳时，随火星经度变化 · 东经 ${v.longitude_signed.toFixed(5)}°`],['AMT',v.amt,'Airy 本初子午线平太阳时，不随所选经度变化。'],['Mars Sol Date',v.msd.toFixed(9),'连续火星日计数，主要用于科学换算。'],['太阳经度 Ls',`${v.ls_deg.toFixed(6)}°`,'表示火星季节位置；0° 为北半球春分。'],['本年长度',`${v.local_year_length} sol`,`${v.is_leap_year?'669日年':'668日年'} · 本规则中的火星年长度。`],['Earth UTC',v.earth_utc,`同一事件换算成地球 UTC，与地球地点无关 · ${v.utc_status}`],['SI-UST',s.ok?s.value.human:'Provider unavailable',s.ok?`跨行星连续 SI 秒时间轴 · ${s.value.timestamp}`:'跨行星连续 SI 秒时间轴。']]);
    }catch(e){if(version!==renderVersions.mars)return;if(quiet)status.textContent=`实时更新暂不可用 · ${e?.message||e}`;else{status.textContent='';errorCard($,esc,'#marsCalendarResult',e);}}
  }
  root.PlanetaryCalendarPages={initInputs,applyReferenceTime,syncReferenceInstant,updateEarthReference,initSurfaceGlobes,updateSurfaceDetails,renderLunar,renderMars};
})(window);

(() => {
  'use strict';
  const C=window.CalendarCore, E=window.ChineseEraData, O=window.ObservanceEngine, T=window.TemporalCore, R=window.CalendarRegistry, U=window.UniversalTemporalEngine, CR=window.CivilizationRegistry, A=window.AdvancedTimeSystems, PM=window.PluginManager, API=window.CalendarApiClient, F=window.AppFormatters, S=window.AppState, I18n=window.I18n, H=window.HumanUI, CCS=window.CivilizationCalendarSelector, TT=window.TraditionalTime, MDP=window.MarkdownPage, PCP=window.PlanetaryCalendarPages, RT=window.ReferenceTimeController;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)],tr=(key,vars={},fallback='')=>I18n?.t(key,vars,{fallback})??fallback;
  const LM=window.UCCLocaleMetadata||{},calendarMeta=(x,key)=>isEnglish()?(LM.calendar?.[x.id]?.[key]||x[key]):x[key];
  const pluginLocale=p=>isEnglish()?(LM.plugin?.[p.id]||{}):{};
  const traditionLocale=t=>isEnglish()?(LM.tradition?.[t.id]||{}):{};
  const isEnglish=()=>!(I18n?.is?.('zh-CN')||I18n?.is?.('zh'));
  const weekdayShort=i=>tr(`weekday.${i}`,{},['日','一','二','三','四','五','六'][i]);
  const weekdayLong=i=>tr(`weekday.long.${i}`,{},`星期${['日','一','二','三','四','五','六'][i]}`);
  const nl=s=>esc(s).replace(/\n/g,'<br>');
  const viewMeta={today:['CALENDAR · v1.4.0','view.today.title','view.today.subtitle'],calendar:['CALENDAR · MONTH','view.calendar.title','view.calendar.subtitle'],earth:['LOCATION','view.earth.title','view.earth.subtitle'],astronomy:['ASTRONOMY','view.astronomy.title','view.astronomy.subtitle'],'lunar-calendar':['LUNAR CALENDAR · v0.3','view.lunarCalendar.title','view.lunarCalendar.subtitle'],'mars-calendar':['MARS CALENDAR · v0.4','view.marsCalendar.title','view.marsCalendar.subtitle'],calendars:['WORLD CALENDARS','view.calendars.title','view.calendars.subtitle'],converter:['CONVERT','view.converter.title','view.converter.subtitle'],capabilities:['WORLD CALENDARS · CAPABILITY MATRIX','view.capabilities.title','view.capabilities.subtitle'],about:['SYSTEM · ARCHITECTURE','view.about.title','view.about.subtitle'],'site-about':['ABOUT','view.siteAbout.title','view.siteAbout.subtitle'],donation:['DONATION','view.donation.title','view.donation.subtitle']};
  const now=new Date();
  let location=T?T.loadLocation():{name:'北京',country:'中国',lat:39.9042,lon:116.4074,timezone:'Asia/Shanghai',utcOffsetMinutes:480};
  function localTodayJdn(){const p=T?T.localDateParts(new Date(),location):{year:now.getFullYear(),month:now.getMonth()+1,day:now.getDate()};return C.gregorianToJdn(p.year,p.month,p.day);}
  let todayJdn=localTodayJdn();
  let selectedJdn=todayJdn;
  let engineStatus={sxtwl:false,thai:false,timezonefinder:false,lunar_python:false,tibetan:false};
  let earthMap=null, familyFilter='all', clockTimer=null, lastPlanetaryRefreshAt=0;
  const loadSet=(key,defaults)=>{try{const x=JSON.parse(localStorage.getItem(key)||'null');if(Array.isArray(x))return new Set(x);}catch(_){}return new Set(defaults);};
  let activeCalendarSystems=loadSet('ucc.calendarSystems',CCS?[...CCS.defaultSystems]:[]),activeCalendarChildren=loadSet('ucc.calendarChildren',CCS?[...CCS.defaultChildren]:[]);
  if(CCS){const legacyChristian=['gregorian','christian_western','catholic','protestant','lds'];if(legacyChristian.some(id=>activeCalendarChildren.has(id)))activeCalendarSystems.add('christianity');if(activeCalendarChildren.has('orthodox_old'))activeCalendarChildren.add('julian');if(activeCalendarChildren.has('orthodox_new'))activeCalendarChildren.add('revised-julian');legacyChristian.concat(['orthodox_old','orthodox_new']).forEach(id=>activeCalendarChildren.delete(id));}let activeInterpretationPlugins=new Set([...activeCalendarChildren].filter(id=>CCS?.pluginIds?.has(id)));
  const esc=F.esc, shortYear=F.shortYear, siliconLabel=F.siliconLabel, aiLabel=F.aiLabel, gregorianFromEraSigned=F.gregorianFromEraSigned, lunarText=F.lunarText, hanBuddhistText=F.hanBuddhistText, taoistText=F.taoistText;
  function thaiText(th,short=false){
    if(!th)return '—';
    const phase=th.phase==='waxing'?(isEnglish()?'waxing':'上'):(isEnglish()?'waning':'下'),month=th.month===88?(isEnglish()?'2nd 8':'后8'):th.month;
    if(short)return isEnglish()?`BE ${th.buddhist_year} · M${month} ${phase} ${th.phase_day}`:`BE${th.buddhist_year} · ${month}月${phase}${th.phase_day}`;
    return isEnglish()?`Thai Buddhist Era BE ${th.buddhist_year} · Thai lunisolar M${th.month_display} ${th.phase==='waxing'?'ขึ้น (waxing)':'แรม (waning)'} ${th.phase_day}`:`泰国佛历 BE ${th.buddhist_year} · 泰历${th.month_display}月 ${th.phase==='waxing'?'ขึ้น（上半月）':'แรม（下半月）'}${th.phase_day}日`;
  }
  function eraText(g,short=false){
    if(!E)return '—';const xs=E.lookup(g.year);if(!xs.length)return short?'—':tr('common.noRecord',{},'当前历史纪年数据库无记录');
    if(short){const x=xs[0],n=x.kind==='era'?`${x.era}${x.year===1?'元':x.year}`:`${x.ruler}${x.year===1?'元':x.year}`;return xs.length>1?`${n} +${xs.length-1}`:n;}
    return xs.map(E.formatOne).join('；');
  }
  function chineseHistoricalText(g,short=false){const xs=[],hx=eraText(g,short);if(hx&&hx!=='—'&&!hx.includes('无记录'))xs.push(hx);if(g.year>=1912)xs.push(isEnglish()?`ROC ${g.year-1911}`:`民国 ${g.year-1911}年`);return xs.join(short||isEnglish()?' · ':'；')||'—';} async function checkEngines(){
    const badge=$('#engineBadge');
    try{
      const j=await API.status();engineStatus=j||{};S?.set('engineStatus',engineStatus);
      const parts=[j.sxtwl?tr('engine.chinese.ok'):tr('engine.chinese.fail'),j.lunar_python?tr('engine.almanac.ok'):tr('engine.almanac.base'),j.thai?tr('engine.thai.ok'):tr('engine.thai.fail'),j.tibetan?tr('engine.tibetan.ok'):tr('engine.tibetan.optional'),j.timezonefinder?tr('engine.timezone.ok'):tr('engine.timezone.fallback')];
      badge.textContent=`${parts.join(' · ')} · Py ${j.python||''}`;
      badge.className=`engine-badge ${j.sxtwl&&j.thai?'':j.sxtwl||j.thai?'warn':'bad'}`;
      badge.title=[j.sxtwl_error,j.lunar_python_error,j.thai_error,j.tibetan_error,j.timezone_error].filter(Boolean).join('\n');
    }catch(e){engineStatus={sxtwl:false,thai:false,timezonefinder:false,lunar_python:false,tibetan:false};S?.set('engineStatus',engineStatus);badge.textContent=tr('engine.static',{},'静态模式 · 使用浏览器/近似回退');badge.className='engine-badge warn';}
  }
  async function fetchChineseDay(g){return engineStatus.sxtwl?API.chineseDay(g):null;}
  async function fetchChineseMonth(y,m,days){if(engineStatus.sxtwl)return API.chineseMonth(y,m,days);}
  async function fetchChineseAlmanac(g,h=12){return engineStatus.lunar_python?API.chineseAlmanac(g,h):null;}
  async function fetchThaiDay(g){return engineStatus.thai&&g.year>=638?API.thaiDay(g):null;}
  async function fetchThaiMonth(y,m,days){if(engineStatus.thai&&y>=638)return API.thaiMonth(y,m,days);}
  async function fetchTibetanDay(g,engine='phugpa'){return engineStatus.tibetan&&g.year>=1?API.tibetanDay(g,engine):null;}
  function calendarEngineMessage(kind='chinese'){
    if(kind==='chinese'){
      if(!engineStatus.sxtwl)return tr('calendar.chineseMissing',{},'中国历法 Provider（sxtwl）未连接');
      const e=API?.getLastError?.('chinese');
      if(e)return tr('calendar.chineseRequestFailed',{},'中国历法请求失败；Provider 已连接，请查看顶部引擎状态');
      return tr('calendar.chineseNoData',{},'当前日期没有可用的中国历法结果');
    }
    if(kind==='thai'){
      if(!engineStatus.thai)return tr('calendar.thaiMissing',{},'泰国历法 Provider（pythaidate）未连接');
      const e=API?.getLastError?.('thai');
      if(e)return tr('calendar.thaiRequestFailed',{},'泰国历法请求失败；Provider 已连接，请查看顶部引擎状态');
      return tr('calendar.thaiNoData',{},'当前日期没有可用的泰国历法结果');
    }
    return tr('calendar.noData',{},'当前模块没有可用结果');
  }
  function observancesFor(jdn,ch,th){return O?O.eventsFor(jdn,{ch,th}):[];}
  function traditionMeta(id){const x=O?.byId?.[id]||{id,label:id,short:id,group:'其它'};const m=traditionLocale(x);return {...x,label:m.label||x.label,short:m.short||x.short,group:m.group||x.group};}
  function friendlyStatus(status){
    if(status==='full'||status==='core')return tr('human.status.usable');
    if(status==='versioned')return tr('human.status.multiple');
    if(status==='external')return tr('human.status.external');
    if(status==='historical')return tr('human.status.historical');
    if(status==='experimental'||status==='partial')return tr('human.status.experimental');
    return tr('human.status.planned');
  }
  function saveCalendarSelections(){
    localStorage.setItem('ucc.calendarSystems',JSON.stringify([...activeCalendarSystems]));localStorage.setItem('ucc.calendarChildren',JSON.stringify([...activeCalendarChildren]));
    activeInterpretationPlugins=new Set([...activeCalendarChildren].filter(id=>CCS?.pluginIds?.has(id)));S?.set('activeInterpretationPlugins',activeInterpretationPlugins);}
  function setAllCalendarSelections(enabled){activeCalendarSystems.clear();activeCalendarChildren.clear();if(enabled&&CCS)CCS.catalog.forEach(item=>{activeCalendarSystems.add(item.id);CCS.selectableDescendants(item).forEach(child=>activeCalendarChildren.add(child.id));});
    saveCalendarSelections();buildCivilizationCalendarFilters();refreshDateViews();
  }
  function buildCivilizationCalendarFilters(){
    const wrap=$('#civilizationCalendarFilters');if(!wrap||!CCS)return;
    function renderChildren(items,parentOn,depth=0){
      return (items||[]).map(item=>{
        if(item.kind==='group'){
          return `<div class="civilization-subgroup depth-${depth}"><div class="civilization-subgroup-title">${esc(CCS.label(item,isEnglish()))}</div>${renderChildren(item.children,parentOn,depth+1)}</div>`;
        }
        const checked=activeCalendarChildren.has(item.id);
        const enabled=parentOn;
        const childMarkup=item.children?`<div class="civilization-subgroup depth-${depth+1}">${renderChildren(item.children,enabled&&checked,depth+1)}</div>`:'';
        return `<label class="civilization-child depth-${depth} ${enabled?'':'parent-off'}"><input type="checkbox" class="civilizationChildCheck" value="${esc(item.id)}" ${checked?'checked':''} ${enabled?'':'disabled'}/><span>${esc(CCS.label(item,isEnglish()))}</span></label>${childMarkup}`;
      }).join('');
    }
    wrap.innerHTML=CCS.catalog.map(item=>{
      const checked=activeCalendarSystems.has(item.id),label=CCS.label(item,isEnglish()),children=renderChildren(item.children,checked,0);
      return `<section class="civilization-option-group ${children?'':'no-children'}"><label class="civilization-parent"><input type="checkbox" class="civilizationSystemCheck" value="${esc(item.id)}" ${checked?'checked':''}/><span>${esc(label)}</span></label>${children?`<div class="civilization-children">${children}</div>`:''}</section>`;
    }).join('');
    $$('.civilizationSystemCheck').forEach(c=>c.addEventListener('change',()=>{
      c.checked?activeCalendarSystems.add(c.value):activeCalendarSystems.delete(c.value);saveCalendarSelections();buildCivilizationCalendarFilters();refreshDateViews();
    }));
    $$('.civilizationChildCheck').forEach(c=>c.addEventListener('change',()=>{
      c.checked?activeCalendarChildren.add(c.value):activeCalendarChildren.delete(c.value);saveCalendarSelections();refreshDateViews();
    }));
  }
  function refreshDateViews(){const active=$('.view.active')?.id;if(active==='today')renderToday();if(active==='calendar')renderMonth();if(active==='civilization')renderCivilization();}
  function setSelectedJdn(jdn){selectedJdn=Math.floor(jdn);S?.set('selectedJdn',selectedJdn);updateGlobalDate();}
  function updateGlobalDate(){const el=$('#globalDate');if(!el)return;const g=C.jdnToGregorian(selectedJdn);el.textContent=`${location.name||tr('common.customLocation')} · ${shortYear(g.year)} ${C.pad(g.month)}-${C.pad(g.day)} · JDN ${selectedJdn}`;}
  function switchView(id){
    H?.syncNavigation?.(id);$$('.view').forEach(x=>x.classList.toggle('active',x.id===id));
    const m=viewMeta[id]||viewMeta.today;S?.set('activeView',id);$('#viewEyebrow').textContent=m[0];$('#viewTitle').textContent=tr(m[1]);$('#viewSubtitle').textContent=tr(m[2]);
    $('#traditionPanel').hidden=!(id==='today'||id==='calendar');
    if(id==='today')renderToday();
    if(id==='earth')renderEarth();
    if(id==='astronomy')renderAstronomy();
    if(id==='lunar-calendar')renderLunarCalendar();
    if(id==='mars-calendar')renderMarsCalendar();
    if(id==='calendar'){syncMonthToSelected();renderMonth();}
    if(id==='calendars')renderCalendarSystems();
    if(id==='capabilities')renderCapabilities();
    if(id==='converter'){renderSourceFields();renderComparison(selectedJdn);}
    if(id==='about'){renderArchitecture();renderRuleEraLookup();}
    if(id==='site-about')MDP?.renderAbout?.($('#aboutMarkdown'),I18n?.getLocale?.()||'zh-CN');
    if(id==='donation')MDP?.renderDonation?.($('#donationMarkdown'),I18n?.getLocale?.()||'zh-CN');
  }
  function observanceTagClass(x){
    if(x.group==='佛教')return 'buddhist';if(x.group==='基督教')return 'christian';if(x.group==='伊斯兰教')return 'islamic';if(x.group==='犹太教')return 'jewish';if(x.group==='道教')return 'taoist';if(x.group==='现代纪元')return 'silicon';return '';
  }
  function observanceCategoryLabel(category){
    const zh={religion:'宗教',country:'国家',civilization:'文明',history:'历史',culture:'文化',international:'国际'};
    const en={religion:'Religion',country:'Country',civilization:'Civilization',history:'History',culture:'Culture',international:'International'};
    return (isEnglish()?en:zh)[category]||(isEnglish()?'Civilization':'文明');
  }
  function renderObservanceList(events,target){
    const el=$(target);if(!el)return;
    if(!events.length){el.innerHTML=`<div class="empty-observance">${esc(isEnglish()?'No major observances are recorded for this date.':'今日无已收录重要文明纪念。')}</div>`;return;}
    el.innerHTML=events.map(x=>{
      const meta=traditionMeta(x.tradition),cat=observanceCategoryLabel(x.category),name=x.wikipedia?`<a class="observance-title-link" href="${esc(x.wikipedia)}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a>`:esc(x.name);
      return `<article class="observance-item civilization-observance"><div class="observance-line"><span class="observance-category ${esc(x.category||'civilization')}">（${esc(cat)}）</span><strong>${name}</strong></div><div class="observance-meta">${esc(meta.label)}</div>${x.note?`<p>${esc(x.note)}</p>`:''}</article>`;
    }).join('');
  }
  function snapshotGroup(title,rows,note=''){return `<section class="surface snapshot-group"><h3>${esc(title)}</h3>${rows}${note?`<div class="snapshot-note">${esc(note)}</div>`:''}</section>`;}
  function snapshotRow(k,v){return `<div class="snapshot-row"><div class="key">${esc(k)}</div><div class="val">${esc(v)}</div></div>`;}
  async function buildSnapshot(jdn){
    const a=C.allFromJdn(jdn),g=a.gregorian,[ch,th]=await Promise.all([fetchChineseDay(g),fetchThaiDay(g)]);
    const china=ch?snapshotRow(isEnglish()?'Chinese Lunisolar':'中国农历',lunarText(ch))+snapshotRow(isEnglish()?'Han Buddhist Era':'汉传佛历',hanBuddhistText(ch))+snapshotRow(isEnglish()?'Daoist Calendar Day':'道教历日',taoistText(ch))+snapshotRow(isEnglish()?'Ganzhi':'干支',`${ch.ganzhi.year_lichun}年 ${ch.ganzhi.month}月 ${ch.ganzhi.day}日 · ${ch.zodiac}`)+snapshotRow(isEnglish()?'Solar Term':'节气',ch.term?ch.term.name:tr('calendar.noTerm')):snapshotRow(isEnglish()?'Chinese Calendar':'中国历法',calendarEngineMessage('chinese'));
    const thai=th?snapshotRow(isEnglish()?'Buddhist Era Year':'佛历年',`BE ${th.buddhist_year}`)+snapshotRow(isEnglish()?'Thai Lunisolar':'泰国阴阳历',`M${th.month_display} ${th.phase==='waxing'?'ขึ้น':'แรม'} ${th.phase_day} ค่ำ`)+snapshotRow(isEnglish()?'Thai Text':'泰文日期',th.text_th):snapshotRow(isEnglish()?'Thai Calendar':'泰国历法',g.year<638?(isEnglish()?'Date precedes this engine epoch':'当前日期早于本引擎纪元'):calendarEngineMessage('thai'));
    const world=snapshotRow(tr('calendar.name.julian'),a.labels.julian)+snapshotRow(tr('calendar.name.islamic'),a.labels.islamic)+snapshotRow(tr('calendar.name.hebrew'),a.labels.hebrew)+snapshotRow(tr('calendar.name.persian'),a.labels.persian)+snapshotRow(tr('calendar.name.coptic'),a.labels.coptic)+snapshotRow(tr('calendar.name.ethiopic'),a.labels.ethiopic)+snapshotRow(tr('calendar.name.indian'),a.labels.indian);
    const history=snapshotRow(tr('era.chineseHistorical'),chineseHistoricalText(g))+snapshotRow(tr('era.silicon'),siliconLabel(g))+snapshotRow(tr('era.ai'),aiLabel(g));
    return snapshotGroup(isEnglish()?'Chinese Calendar System':'中国历法体系',china,isEnglish()?'Han Buddhist and Daoist religious calendars are layered on the Chinese lunisolar calendar.':'汉传佛教与道教宗教日历都叠加在中国农历之上。')+snapshotGroup(isEnglish()?'Thai Theravada Calendar':'南传泰国佛历',thai,isEnglish()?'Thai Buddhist Era years and religious lunisolar dates are calculated separately.':'泰国佛历年与宗教阴阳历月日分别计算。')+snapshotGroup(isEnglish()?'World Calendars':'世界历法',world)+snapshotGroup(isEnglish()?'Historical and Modern Eras':'历史与现代纪元',history);
  }
  async function renderDateLayers(jdn,prefix,ch,th,timeParts=null,trueSolarParts=null){
    const g=C.jdnToGregorian(jdn),today=prefix==='today';
    const clockParts=timeParts||T?.zoneParts?.(new Date(),location.timezone,location.utcOffsetMinutes)||{hour:12,minute:0,second:0};
    const eras=$(today?'#todayEras':'#selectedEras'),civilizations=$(today?'#todayCivilizations':'#selectedCivilizations');
    const sections={
      chineseAlmanac:$(today?'#todayChineseAlmanacSection':'#selectedChineseAlmanacSection'),
      huangji:$(today?'#todayHuangjiSection':'#selectedHuangjiSection'),
      sanyuan:$(today?'#todaySanyuanSection':'#selectedSanyuanSection'),
      panchanga:$(today?'#todayPanchangaSection':'#selectedPanchangaSection')
    };
    const targets={
      chineseAlmanac:$(today?'#todayChineseAlmanac':'#selectedChineseAlmanac'),
      huangji:$(today?'#todayHuangji':'#selectedHuangji'),
      sanyuan:$(today?'#todaySanyuan':'#selectedSanyuan'),
      panchanga:$(today?'#todayPanchanga':'#selectedPanchanga')
    };
    return window.TodayHumanPage?.renderDateModules({
      eraEl:eras,civilizationEl:civilizations,systems:activeCalendarSystems,children:activeCalendarChildren,selector:CCS,g,ch,th,C,PM,
      lunarText,hanBuddhistText,taoistText,thaiText,siliconLabel,aiLabel,calendarEngineMessage,eraText,esc,isEnglish:isEnglish(),forceHistorical:prefix==='selected',sections,targets,TT,timeParts:clockParts,trueSolarParts,location
    });
  }
  async function renderToday(){
    todayJdn=localTodayJdn();
    const g=C.jdnToGregorian(todayJdn),[ch,th]=await Promise.all([fetchChineseDay(g),fetchThaiDay(g)]),fs=observancesFor(todayJdn,ch,th);
    $('#todayLocationLabel').textContent=`${String(location.name||'CUSTOM').toUpperCase()} · EARTH`;
    $('#todayWeekday').textContent=weekdayLong(C.weekdayFromJdn(todayJdn));$('#todayMonthDay').textContent=`${C.pad(g.month)} · ${C.pad(g.day)}`;$('#todayYear').textContent=shortYear(g.year);
    const timeContext=updateTodayTimeDisplay(new Date()),clockParts=timeContext.civilParts,trueSolarParts=timeContext.trueSolarParts;
    const sun=T?T.solarApprox(g.year,g.month,g.day,location.lat,location.lon):null,moon=T?T.moonPhase(new Date()):null;
    $('#todaySunrise').textContent=sun?T.formatEventTime(g.year,g.month,g.day,sun.sunriseUTC,location):'—';
    $('#todaySunset').textContent=sun?T.formatEventTime(g.year,g.month,g.day,sun.sunsetUTC,location):'—';
    $('#todayMoon').textContent=moon?tr(`moon.${moon.key||moon.name}`,{},moon.name):'—';$('#todayDayLength').textContent=sun?`${sun.dayLengthHours.toFixed(1)} h`:'—';
    renderObservanceList(fs,'#todayObservances');await renderDateLayers(todayJdn,'today',ch,th,clockParts,trueSolarParts);
  }
  function buildMonths(el){el.innerHTML=Array.from({length:12},(_,i)=>`<option value="${i+1}">${esc(tr('calendar.monthOption',{month:i+1}))}</option>`).join('');}
  function syncMonthToSelected(){const g=C.jdnToGregorian(selectedJdn);$('#calYear').value=g.year;$('#calMonth').value=g.month;}
  function setCalendarYm(y,m){while(m<1){m+=12;y--;}while(m>12){m-=12;y++;}$('#calYear').value=y;$('#calMonth').value=m;renderMonth();}
  function secondaryFor(g,ch,th,type){
    const a=C.allFromJdn(C.gregorianToJdn(g.year,g.month,g.day));
    if(type==='chinese')return `<div class="cell-secondary chinese">${ch?esc(lunarText(ch,true)):isEnglish()?'Chinese…':'农历…'}</div>`;
    if(type==='hanbuddhist')return `<div class="cell-secondary buddhist">${ch?esc(hanBuddhistText(ch,true)):isEnglish()?'Buddhist…':'佛历…'}</div>`;
    if(type==='taoist')return `<div class="cell-secondary taoist">${ch?esc(taoistText(ch,true)):isEnglish()?'Daoist…':'道历…'}</div>`;
    if(type==='thai')return `<div class="cell-secondary thai">${th?esc(thaiText(th,true)):isEnglish()?'Thai…':'泰历…'}</div>`;
    if(type==='silicon')return `<div class="cell-secondary silicon">${esc(siliconLabel(g,true))}</div>`;
    if(type==='islamic')return `<div class="cell-secondary">AH ${a.islamic.year} · ${a.islamic.month}/${a.islamic.day}</div>`;
    if(type==='hebrew')return `<div class="cell-secondary">AM ${a.hebrew.year} · ${a.hebrew.month}/${a.hebrew.day}</div>`;
    if(type==='julian')return `<div class="cell-secondary">J ${a.julian.month}/${a.julian.day}</div>`;return '';
  }
  function annotationsFor(jdn,g,ch,th){
    const opts=new Set($$('.annotationCheck:checked').map(x=>x.value)),tags=[];
    if(opts.has('term')&&ch?.term)tags.push(`<span class="mini-tag term">${esc(ch.term.name)}</span>`);
    if(opts.has('festival')){
      const events=observancesFor(jdn,ch,th),limit=2;events.slice(0,limit).forEach(x=>tags.push(`<span class="mini-tag festival ${observanceTagClass(x)}">${esc(x.name)}</span>`));
      if(events.length>limit)tags.push(`<span class="mini-tag more">+${events.length-limit}</span>`);
    }
    if(opts.has('era')){const e=eraText(g,true);if(e!=='—')tags.push(`<span class="mini-tag era">${esc(e)}</span>`);}
    return `<div class="cell-annotations">${tags.join('')}</div>`;
  }
  function renderMonthPeriodBanner(y,m){
    const banner=$('#monthPeriodBanner');const r=activeCalendarSystems.has('islamic')&&O?O.ramadanRangeForGregorianMonth(y,m):null;
    if(r){banner.hidden=false;const s=r.start,e=r.end;banner.innerHTML=`<strong>${esc(tr('calendar.ramadanTitle',{ah:r.ah}))}</strong><span>${esc(`${s.year}-${C.pad(s.month)}-${C.pad(s.day)} ～ ${e.year}-${C.pad(e.month)}-${C.pad(e.day)}`)} · ${esc(tr('calendar.ramadanNote'))}</span>`;}else{banner.hidden=true;banner.textContent='';}
  }
  async function renderMonth(){
    const y=Number($('#calYear').value),m=Number($('#calMonth').value);if(!Number.isInteger(y)||y<-5000||y>5000||m<1||m>12)return;
    const dim=C.daysInGregorianMonth(y,m),selected=C.jdnToGregorian(selectedJdn);if(selected.year!==y||selected.month!==m){setSelectedJdn(C.gregorianToJdn(y,m,Math.min(selected.day,dim)));if(RT?.getMode?.()==='calendar')setReferenceFromCalendar();}renderMonthPeriodBanner(y,m);await Promise.all([fetchChineseMonth(y,m,dim),fetchThaiMonth(y,m,dim)]);
    const first=C.gregorianToJdn(y,m,1),start=first-C.weekdayFromJdn(first),secondary=$('#cellSecondary').value;let html='';
    for(let i=0;i<42;i++){
      const jdn=start+i,g=C.jdnToGregorian(jdn),cur=g.year===y&&g.month===m,ch=API?.getChineseCached?.(g)||null,th=API?.getThaiCached?.(g)||null;
      html+=`<button type="button" class="daycell ${cur?'':'out'} ${jdn===selectedJdn?'selected':''} ${jdn===todayJdn?'today':''}" data-jdn="${jdn}"><div class="day-top"><span class="daynum">${g.day}</span>${g.year<=0?'<span class="day-era">BCE</span>':''}</div>${secondaryFor(g,ch,th,secondary)}${annotationsFor(jdn,g,ch,th)}</button>`;
    }
    $('#monthGrid').innerHTML=html;$$('#monthGrid .daycell').forEach(b=>b.addEventListener('click',async()=>{setSelectedJdn(Number(b.dataset.jdn));setReferenceFromCalendar();await renderInspector(selectedJdn);renderMonth();}));await renderInspector(selectedJdn);
  }
  function selectedTimeParts(){const v=$('#selectedClockTime')?.value||'',m=/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(v);return m?{hour:Number(m[1]),minute:Number(m[2]),second:Number(m[3]||0)}:T?.zoneParts?.(new Date(),location.timezone,location.utcOffsetMinutes)||{hour:12,minute:0,second:0};}
  function setReferenceFromCalendar(){if(!RT||!T)return null;const g=C.jdnToGregorian(selectedJdn),time=selectedTimeParts();return RT.setCalendar({year:g.year,month:g.month,day:g.day,hour:time.hour,minute:time.minute,second:time.second},location,T);}
  function useLiveReference(){const instant=new Date(),parts=T?.zoneParts?.(instant,location.timezone,location.utcOffsetMinutes);todayJdn=localTodayJdn();selectedJdn=todayJdn;S?.set('selectedJdn',selectedJdn);syncMonthToSelected();updateGlobalDate();if(parts&&$('#selectedClockTime'))$('#selectedClockTime').value=`${C.pad(parts.hour)}:${C.pad(parts.minute)}:${C.pad(parts.second)}`;RT?.setLive?.(instant);if($('.view.active')?.id==='calendar')renderMonth();}
  function setCustomReferenceFromInput(source){const input=$(`#${source}Instant`),instant=new Date(`${input?.value||''}Z`);if(Number.isNaN(instant.getTime()))return;RT?.setCustom?.(instant,source==='lunar'?'月球历手动输入':'火星历手动输入');}
  function refreshActivePlanetary(force=false){const active=$('.view.active')?.id;if(active!=='lunar-calendar'&&active!=='mars-calendar')return;const current=Date.now();if(!force&&current-lastPlanetaryRefreshAt<10000)return;lastPlanetaryRefreshAt=current;if(active==='lunar-calendar')renderLunarCalendar({quiet:true});else renderMarsCalendar({quiet:true});}
  function handleReferenceTime(state,reason){PCP?.applyReferenceTime?.({$,T,location,state});S?.set?.('referenceTime',{mode:state.mode,instant:state.instant.toISOString()});refreshActivePlanetary(reason!=='tick');}
  async function renderInspector(jdn){
    const g=C.jdnToGregorian(jdn),[ch,th]=await Promise.all([fetchChineseDay(g),fetchThaiDay(g)]),fs=observancesFor(jdn,ch,th);
    $('#selectedTitle').textContent=`${C.pad(g.month)}月${C.pad(g.day)}日`;
    $('#selectedSubtitle').textContent=`${shortYear(g.year)} · ${weekdayLong(C.weekdayFromJdn(jdn))} · ${isEnglish()?'Gregorian':'公历'} ${g.year}-${C.pad(g.month)}-${C.pad(g.day)}`;
    renderObservanceList(fs,'#selectedObservances');await renderDateLayers(jdn,'selected',ch,th,selectedTimeParts());
  }
  const sourceDefs=['gregorian','julian','chinese','taoist','hanbuddhist','thai','thaisolar','silicon','ai','islamic','hebrew','persian','indian','coptic','ethiopic','mayan','jdn'];
  function buildSourceOptions(){$('#sourceCalendar').innerHTML=sourceDefs.map(v=>`<option value="${v}">${esc(tr(`converter.source.${v}`,{},v))}</option>`).join('');}
  function field(label,id,value,type='number',extra=''){return `<label>${esc(label)}<input id="${id}" type="${type}" value="${esc(value)}" ${extra}/></label>`;}
  async function renderSourceFields(){
    const s=$('#sourceCalendar').value,g=C.jdnToGregorian(selectedJdn),wrap=$('#sourceFields');
    if(s==='gregorian'||s==='julian'||s==='thaisolar'){let x=g;if(s==='julian')x=C.jdnToJulian(selectedJdn);const yy=s==='thaisolar'?g.year+543:x.year;wrap.innerHTML=field(s==='thaisolar'?(isEnglish()?'Buddhist Era Year BE':'佛历年 BE'):tr('common.year'),'srcY',yy)+field(tr('common.month'),'srcM',x.month,'number','min="1" max="12"')+field(tr('common.date'),'srcD',x.day,'number','min="1" max="31"');return;}
    if(s==='chinese'||s==='taoist'||s==='hanbuddhist'){
      const ch=await fetchChineseDay(g),l=ch?.lunar,yy=l?(s==='hanbuddhist'?l.year+1027:l.year):(s==='hanbuddhist'?g.year+1027:g.year);wrap.innerHTML=field(s==='hanbuddhist'?tr('converter.field.hanYear'):s==='taoist'?tr('converter.field.taoLunarYear'):tr('converter.field.lunarYear'),'srcY',yy)+field(tr('common.month'),'srcM',l?.month||1,'number','min="1" max="12"')+field(tr('common.date'),'srcD',l?.day||1,'number','min="1" max="30"')+`<label>${esc(tr('converter.field.leapMonth'))}<select id="srcLeap"><option value="0" ${!l?.leap?'selected':''}>${esc(tr('common.no'))}</option><option value="1" ${l?.leap?'selected':''}>${esc(tr('common.yes'))}</option></select></label>`;return;
    }
    if(s==='thai'){
      const th=await fetchThaiDay(g);wrap.innerHTML=field(tr('converter.field.thaiBE'),'srcThaiBE',th?.buddhist_year||g.year+543)+`<label>${esc(tr('converter.field.thaiMonth'))}<select id="srcThaiM">${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${(th?.month===i+1||th?.month===88&&i===7)?'selected':''}>${esc(tr('calendar.monthOption',{month:i+1}))}</option>`).join('')}</select></label><label>${esc(tr('converter.field.phase'))}<select id="srcThaiPhase"><option value="waxing" ${th?.phase!=='waning'?'selected':''}>ขึ้น${isEnglish()?' (waxing)':'（上半月）'}</option><option value="waning" ${th?.phase==='waning'?'selected':''}>แรม${isEnglish()?' (waning)':'（下半月）'}</option></select></label>${field(tr('converter.field.phaseDay'),'srcThaiD',th?.phase_day||15,'number','min="1" max="15"')}<label>${esc(tr('converter.field.secondEight'))}<select id="srcThaiSecond8"><option value="0" ${th?.month!==88?'selected':''}>${esc(tr('common.no'))}</option><option value="1" ${th?.month===88?'selected':''}>${esc(tr('converter.field.secondEightYes'))}</option></select></label><div class="field-note span2">${esc(tr('converter.field.thaiNote'))}</div>`;return;
    }
    if(s==='silicon'||s==='ai'){wrap.innerHTML=field(s==='silicon'?tr('converter.field.seYear'):tr('converter.field.aiYear'),'srcY',eraSignedYear(g.year,s==='silicon'?1948:1956))+field(tr('common.month'),'srcM',g.month,'number','min="1" max="12"')+field(tr('common.date'),'srcD',g.day,'number','min="1" max="31"');return;}
    if(s==='jdn'){wrap.innerHTML=field('JDN','srcJdn',selectedJdn);return;}
    if(s==='mayan'){const x=C.mayanFromJdn(selectedJdn);wrap.innerHTML=field('Baktun','srcB',x.baktun)+field('Katun','srcK',x.katun)+field('Tun','srcT',x.tun)+field('Uinal','srcU',x.uinal)+field('Kin','srcKin',x.kin);return;}
    const a=C.allFromJdn(selectedJdn),x=a[s];wrap.innerHTML=field(tr('common.year'),'srcY',x.year)+field(tr('common.month'),'srcM',x.month,'number','min="1" max="13"')+field(tr('common.date'),'srcD',x.day,'number','min="1" max="31"');
  }
  async function lunarToJdn(y,m,d,leap){const r=await fetch(`/api/chinese/from-lunar?y=${y}&m=${m}&d=${d}&leap=${leap}`),j=await r.json();if(!j.ok)throw new Error(j.error||tr('converter.error.chinese'));const g=j.data.solar;return C.gregorianToJdn(g[0],g[1],g[2]);}
  async function thaiLunarToJdn(){
    const be=Number($('#srcThaiBE').value),month=Number($('#srcThaiM').value),phase=$('#srcThaiPhase').value,day=Number($('#srcThaiD').value),second8=$('#srcThaiSecond8').value;
    const r=await fetch(`/api/thai/from-lunar?be=${be}&month=${month}&phase=${phase}&day=${day}&second8=${second8}`),j=await r.json();if(!j.ok)throw new Error(j.error||tr('converter.error.thai'));if(!j.data.length)throw new Error(tr('converter.error.thaiNone'));if(j.data.length>1)$('#convertMessage').textContent=tr('converter.candidate',{count:j.data.length});return j.data[0].jdn;
  }
  async function convertSource(){
    const s=$('#sourceCalendar').value,msg=$('#convertMessage');msg.textContent='';
    try{
      let jdn;
      if(s==='jdn')jdn=Math.floor(Number($('#srcJdn').value));
      else if(s==='mayan')jdn=C.mayanToJdn(Number($('#srcB').value),Number($('#srcK').value),Number($('#srcT').value),Number($('#srcU').value),Number($('#srcKin').value));
      else if(s==='thai')jdn=await thaiLunarToJdn();
      else if(s==='chinese'||s==='taoist'||s==='hanbuddhist'){let y=Number($('#srcY').value);if(s==='hanbuddhist')y-=1027;jdn=await lunarToJdn(y,Number($('#srcM').value),Number($('#srcD').value),$('#srcLeap').value);}
      else{
        let y=Number($('#srcY').value),m=Number($('#srcM').value),d=Number($('#srcD').value);
        if(s==='gregorian')jdn=C.gregorianToJdn(y,m,d);else if(s==='julian')jdn=C.julianToJdn(y,m,d);else if(s==='thaisolar')jdn=C.gregorianToJdn(y-543,m,d);else if(s==='silicon')jdn=C.gregorianToJdn(gregorianFromEraSigned(y,1948),m,d);else if(s==='ai')jdn=C.gregorianToJdn(gregorianFromEraSigned(y,1956),m,d);else if(s==='islamic')jdn=C.islamicToJdn(y,m,d);else if(s==='hebrew')jdn=C.hebrewToJdn(y,m,d);else if(s==='persian')jdn=C.persianToJdn(y,m,d);else if(s==='indian')jdn=C.indianToJdn(y,m,d);else if(s==='coptic')jdn=C.alexToJdn(C.COPTIC_EPOCH,y,m,d);else if(s==='ethiopic')jdn=C.alexToJdn(C.ETHIOPIC_EPOCH,y,m,d);
      }
      if(!Number.isFinite(jdn))throw new Error(tr('converter.error.date'));setSelectedJdn(jdn);setReferenceFromCalendar();await renderComparison(jdn);
    }catch(e){msg.textContent=e.message||String(e);}
  }
  function comparisonItem(label,value,note=''){return `<div class="comparison-item"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div>${note?`<div class="note">${esc(note)}</div>`:''}</div>`;}
  async function renderComparison(jdn){
    const a=C.allFromJdn(jdn),g=a.gregorian,[ch,th]=await Promise.all([fetchChineseDay(g),fetchThaiDay(g)]);$('#convertResultMeta').textContent=`${shortYear(g.year)} ${C.pad(g.month)}-${C.pad(g.day)} · JDN ${jdn}`;
    let html=comparisonItem(tr('calendar.name.gregorian'),a.labels.gregorian)+comparisonItem(tr('calendar.name.julian'),a.labels.julian)+comparisonItem(tr('era.chineseHistorical'),chineseHistoricalText(g),tr('converter.rule.regnal'))+comparisonItem(tr('era.silicon'),siliconLabel(g),'1948 = SE 1')+comparisonItem(tr('era.ai'),aiLabel(g),'1956 = AI 1')+comparisonItem(tr('calendar.name.islamic'),a.labels.islamic,tr('converter.rule.arithmetic'))+comparisonItem(tr('calendar.name.hebrew'),a.labels.hebrew,tr('converter.rule.sunset'))+comparisonItem(tr('calendar.name.persian'),a.labels.persian)+comparisonItem(tr('calendar.name.coptic'),a.labels.coptic)+comparisonItem(tr('calendar.name.ethiopic'),a.labels.ethiopic)+comparisonItem(tr('calendar.name.indian'),a.labels.indian)+comparisonItem('Maya Long Count',a.labels.mayan,tr('catalog.specialComposite'))+comparisonItem('JDN / MJD',`${a.jdn} / ${a.derived.mjd}`);
    html+=ch?comparisonItem(tr('calendar.name.chinese'),lunarText(ch),tr('inspector.ganzhiShort',{year:ch.ganzhi.year_lichun,month:ch.ganzhi.month,day:ch.ganzhi.day}))+comparisonItem(tr('calendar.name.taoist'),taoistText(ch),tr('converter.rule.modernChinese'))+comparisonItem(tr('calendar.name.hanBuddhist'),hanBuddhistText(ch),tr('converter.rule.sameChinese')):comparisonItem(tr('converter.chinaGroup'),calendarEngineMessage('chinese'));
    html+=th?comparisonItem(tr('calendar.name.thaiBE'),`BE ${th.buddhist_year}-${C.pad(g.month)}-${C.pad(g.day)}`,tr('converter.rule.thaiOfficial'))+comparisonItem(tr('calendar.name.thaiLunisolar'),thaiText(th),tr('converter.rule.thaiReligious')):comparisonItem(tr('calendar.name.thai'),g.year<638?tr('inspector.beforeThaiEpoch'):calendarEngineMessage('thai'));
    $('#convertResults').innerHTML=html;
  }
  function profileHtml(label,value){return `<div class="detail-pair"><span>${esc(label)}</span><strong>${esc(value||'—')}</strong></div>`;}
  function updateTodayTimeDisplay(d){const civilParts=T?.zoneParts?.(d,location.timezone,location.utcOffsetMinutes)||{year:d.getFullYear(),month:d.getMonth()+1,day:d.getDate(),hour:d.getHours(),minute:d.getMinutes(),second:d.getSeconds()},trueSolarParts=T?.trueSolarTimeParts?.(d,location.lon)||null,hp=$('#todayCurrentTime');if(hp&&$('.view.active')?.id==='today')hp.textContent=`${C.pad(civilParts.hour)}:${C.pad(civilParts.minute)}:${C.pad(civilParts.second)}`;const solarLabel=$('#todayTrueSolarLabel'),solarTime=$('#todayTrueSolarTime');if(solarLabel)solarLabel.textContent=isEnglish()?'APPARENT SOLAR TIME':'真太阳时';if(solarTime)solarTime.textContent=trueSolarParts?(T?.formatDateTimeParts?.(trueSolarParts)||'—'):'—';const civilAlmanac=$('#todayAlmanacCivilTime'),solarAlmanac=$('#todayAlmanacSolarTime');if(civilAlmanac)civilAlmanac.textContent=T?.formatDateTimeParts?.(civilParts)||'—';if(solarAlmanac&&trueSolarParts){const branch=TT?.chinese?.(trueSolarParts,isEnglish()),label=isEnglish()?'Apparent solar time: ':'真太阳时：';solarAlmanac.textContent=`${label}${T?.formatDateTimeParts?.(trueSolarParts)||'—'} · ${branch?.label||'—'}`;}return {civilParts,trueSolarParts};}
  function updateContextClock(){if(!T)return;const d=new Date(),nextToday=localTodayJdn(),wasFollowingToday=RT?.getMode?.()==='live'&&selectedJdn===todayJdn;
    if(nextToday!==todayJdn){todayJdn=nextToday;if(wasFollowingToday){selectedJdn=todayJdn;S?.set('selectedJdn',selectedJdn);syncMonthToSelected();updateGlobalDate();if($('.view.active')?.id==='calendar')renderMonth();}}
    $('#contextLocation').textContent=`${location.name||tr('common.customCoordinates')}${location.country?` · ${location.country}`:''}`;
    $('#contextCoords').textContent=T.coordinateLabel(location.lat,location.lon);
    $('#contextTime').textContent=T.formatLocalTime(d,location);
    updateTodayTimeDisplay(d);
    $('#contextZone').textContent=location.timezone||T.offsetLabel(location.utcOffsetMinutes||T.approxOffsetMinutes(location.lon));
    $('#contextSolarTime').textContent=T.localSolarTime(d,location.lon);
    const side=$('#sidebarLocationName');if(side)side.textContent=`${location.name||tr('common.customLocation')} · ${location.timezone||T.offsetLabel(location.utcOffsetMinutes||0)}`;
    if(earthMap)earthMap.setSun(T.subsolarPoint(d));if(RT?.getMode?.()==='live'&&$('#selectedClockTime')&&document.activeElement!==$('#selectedClockTime')){const p=T.zoneParts(d,location.timezone,location.utcOffsetMinutes);$('#selectedClockTime').value=`${C.pad(p.hour)}:${C.pad(p.minute)}:${C.pad(p.second)}`;}RT?.tick?.(d);
  }
  function renderLocationDetail(){
    if(!T)return;const n=T.nearestProfile(location.lat,location.lon),p=location.profileId?T.byId[location.profileId]:n.profile;
    const source=location.resolveSource||location.source||'profile';$('#locationResolveSource').textContent=source==='timezonefinder'?tr('location.source.timezonefinder'):source==='longitude_approx'?tr('location.source.longitude'):source==='preset'?tr('location.source.preset'):tr('location.source.coordinate');
    $('#locationLat').value=Number(location.lat).toFixed(4);$('#locationLon').value=Number(location.lon).toFixed(4);
    $('#locationDetail').innerHTML=profileHtml(tr('location.field.place'),`${location.name||tr('common.customCoordinates')}${location.country?` · ${location.country}`:''}`)+profileHtml(tr('location.field.coords'),T.coordinateLabel(location.lat,location.lon))+profileHtml(tr('location.field.zone'),location.timezone||T.offsetLabel(location.utcOffsetMinutes))+profileHtml(tr('location.field.offset'),T.offsetLabel(location.utcOffsetMinutes||0))+profileHtml(tr('location.field.solarTime'),T.localSolarTime(new Date(),location.lon))+profileHtml(tr('location.field.nearest'),p?`${p.name} · ${Math.round(n.distanceKm)} km`:'—')+profileHtml(tr('location.field.defaultCalendar'),p?.calendars?.join(' / ')||'Gregorian')+profileHtml(tr('location.field.era'),p?.eras?.join(' / ')||'CE')+profileHtml(tr('location.field.culture'),p?.traditions?.join(' / ')||tr('location.filter.user'));
  }
  function renderLocationResults(q=''){
    if(!T)return;const rows=T.searchProfiles(q),el=$('#locationResults');
    el.innerHTML=rows.map(p=>`<div class="location-result" data-profile="${p.id}"><div><b>${esc(p.name)} · ${esc(p.country)}</b><small>${esc(p.en)} · ${p.lat.toFixed(2)}, ${p.lon.toFixed(2)}</small></div><code>${esc(p.timezone)}</code></div>`).join('')||`<div class="empty-observance">${esc(tr('location.profile.none'))}</div>`;
    $$('#locationResults .location-result').forEach(x=>x.addEventListener('click',()=>applyProfile(x.dataset.profile)));
  }
  const COUNTRY_ZONE_FALLBACK={CN:'Asia/Shanghai',HK:'Asia/Hong_Kong',TW:'Asia/Taipei',KR:'Asia/Seoul',KP:'Asia/Pyongyang',JP:'Asia/Tokyo',VN:'Asia/Ho_Chi_Minh',TH:'Asia/Bangkok',MM:'Asia/Yangon',KH:'Asia/Phnom_Penh',LA:'Asia/Vientiane',LK:'Asia/Colombo',IN:'Asia/Kolkata',NP:'Asia/Kathmandu',BT:'Asia/Thimphu',SG:'Asia/Singapore',SA:'Asia/Riyadh',IL:'Asia/Jerusalem',EG:'Africa/Cairo',ET:'Africa/Addis_Ababa'};
  function administrativeTimeFallback(code,p,lon){
    const c=String(code||p?.code||'').toUpperCase(),zone=p?.timezone||COUNTRY_ZONE_FALLBACK[c]||null;
    const offset=(zone?T.zoneOffsetMinutes(new Date(),zone):null)??T.approxOffsetMinutes(lon);
    return {timezone:zone,utc_offset_minutes:offset,source:p?'nearest_profile':(zone?'country_profile':'longitude_approx')};
  }
  async function searchGlobalPlaces(query){
    const q=String(query||'').trim(), box=$('#globalPlaceResults'), status=$('#globalPlaceSearchStatus');
    if(!box||!status)return;
    if(q.length<2){box.innerHTML='';status.textContent=tr('location.search.min');return;}
    status.textContent=tr('location.searching');box.innerHTML='';
    try{
      const r=await fetch(`/api/geocode/search?q=${encodeURIComponent(q)}`,{cache:'no-store'}),j=await r.json();
      if(j.ok&&j.data?.length){
        status.textContent=tr('location.search.results',{count:j.data.length});
        box.innerHTML=j.data.map((x,i)=>`<button type="button" class="global-place-result" data-place-index="${i}"><span><b>${esc(x.name||x.city||x.display_name)}</b><small>${esc(x.display_name)}</small></span><code>${Number(x.lat).toFixed(4)}, ${Number(x.lon).toFixed(4)}</code></button>`).join('');
        $$('#globalPlaceResults .global-place-result').forEach(b=>b.addEventListener('click',()=>selectGlobalPlace(j.data[Number(b.dataset.placeIndex)])));
        return;
      }
      throw new Error(j.error||tr('location.search.none'));
    }catch(e){
      const rows=T.searchProfiles(q);status.textContent=rows.length?tr('location.search.noOnline'):tr('location.search.none');
      box.innerHTML=rows.map((x,i)=>`<button type="button" class="global-place-result" data-profile="${esc(x.id)}"><span><b>${esc(x.name)} · ${esc(x.country)}</b><small>${esc(x.en)}</small></span><code>${x.lat.toFixed(4)}, ${x.lon.toFixed(4)}</code></button>`).join('');
      $$('#globalPlaceResults [data-profile]').forEach(b=>b.addEventListener('click',()=>applyProfile(b.dataset.profile)));
    }
  }
  async function selectGlobalPlace(x){
    if(!x)return; const lat=Number(x.lat),lon=Number(x.lon);if(earthMap)earthMap.flyTo(lat,lon,10);
    const near=T.nearestProfile(lat,lon), p=near.distanceKm<250?near.profile:null,code=x.country_code||p?.code||'';
    let data=administrativeTimeFallback(code,p,lon);
    try{const r=await fetch(`/api/location/resolve?lat=${lat}&lon=${lon}`,{cache:'no-store'}),j=await r.json();if(j.ok&&j.data?.timezone)data=j.data;}catch(e){}
    await setLocation({...(p||{}),name:x.name||x.city||p?.name||tr('common.customLocation'),country:x.country||p?.country||'',code,profileId:p?.id||null,lat,lon,timezone:data.timezone,utcOffsetMinutes:data.utc_offset_minutes,resolveSource:'geocode + '+data.source,displayName:x.display_name||''});
    const status=$('#globalPlaceSearchStatus');if(status)status.textContent=tr('location.located',{name:x.display_name||x.name||''});
  }
  async function reverseGeocodePoint(lat,lon){
    try{const r=await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`,{cache:'no-store'}),j=await r.json();return j.ok?j.data:null;}catch(e){return null;}
  }
  async function setLocation(next,{syncDate=true}={}){
    location=T?T.normalizeLocation(next):next;S?.set('location',location);T?.saveLocation(location);if(earthMap)earthMap.setMarker(location.lat,location.lon);updateContextClock();renderLocationDetail();
    PCP?.updateEarthReference?.({$,T,location});
    if(syncDate&&RT?.getMode?.()==='live'){todayJdn=localTodayJdn();selectedJdn=todayJdn;S?.set('selectedJdn',selectedJdn);syncMonthToSelected();updateGlobalDate();}
    PCP?.applyReferenceTime?.({$,T,location,state:RT?.snapshot?.()});
    const active=$('.view.active')?.id;if(active==='today')await renderToday();if(active==='astronomy')renderAstronomy();if(active==='civilization')renderCivilization();if(active==='calendar')renderMonth();
  }
  async function applyProfile(id){const p=T?.byId?.[id];if(!p)return;let offset=T.zoneOffsetMinutes(new Date(),p.timezone)??T.approxOffsetMinutes(p.lon),source='preset';try{const r=await fetch(`/api/location/resolve?lat=${p.lat}&lon=${p.lon}`,{cache:'no-store'}),j=await r.json();if(j.ok&&j.data.timezone){offset=j.data.utc_offset_minutes;source=j.data.source;}}catch(e){}await setLocation({...p,profileId:p.id,utcOffsetMinutes:offset,resolveSource:source});}
  async function resolveCoordinates(lat,lon){
    lat=T.clamp(Number(lat),-89.999,89.999);lon=T.clamp(Number(lon),-180,180);const near=T.nearestProfile(lat,lon),p=near.distanceKm<250?near.profile:null;
    const geo=await reverseGeocodePoint(lat,lon),code=geo?.country_code||p?.code||'';
    let data=administrativeTimeFallback(code,p,lon);
    try{const r=await fetch(`/api/location/resolve?lat=${lat}&lon=${lon}`,{cache:'no-store'}),j=await r.json();if(j.ok&&j.data?.timezone)data=j.data;}catch(e){}
    await setLocation({...(p||{}),name:geo?.name||p?.name||tr('common.customCoordinates'),country:geo?.country||p?.country||tr('common.unboundCountry'),code,profileId:p?.id||null,lat,lon,timezone:data.timezone,utcOffsetMinutes:data.utc_offset_minutes,resolveSource:(geo?'reverse-geocode + ':'')+data.source,displayName:geo?.display_name||''});
  }
  function initEarthMap(){if(!window.EarthMap||earthMap)return;earthMap=new EarthMap($('#earthMapCanvas'),{marker:location,profiles:T?.profiles||[],onPick:p=>resolveCoordinates(p.lat,p.lon)});earthMap.setSun(T.subsolarPoint(new Date()));}
  function renderEarth(){initEarthMap();setTimeout(()=>earthMap?.invalidateSize?.(),50);renderLocationResults($('#locationSearch')?.value||'');renderLocationDetail();updateContextClock();}
  function renderAstronomy(){
    if(!T)return;const g=C.jdnToGregorian(selectedJdn),sun=T.solarApprox(g.year,g.month,g.day,location.lat,location.lon),date=T.utcDate(g.year,g.month,g.day,12),moon=T.moonPhase(date);
    $('#astroLocation').textContent=`${location.name||tr('common.custom')} · ${T.coordinateLabel(location.lat,location.lon)}`;
    const sr=T.formatEventTime(g.year,g.month,g.day,sun.sunriseUTC,location),ss=T.formatEventTime(g.year,g.month,g.day,sun.sunsetUTC,location),sn=T.formatEventTime(g.year,g.month,g.day,sun.solarNoonUTC,location);
    $('#astroSunMain').textContent=sun.polar==='day'?tr('astro.polarDay'):sun.polar==='night'?tr('astro.polarNight'):`${sr} → ${ss}`;
    $('#astroSunDetail').innerHTML=nl(tr('astro.sunDetail',{decl:sun.declination.toFixed(2),noon:sn,length:sun.dayLengthHours.toFixed(2),eot:sun.equationOfTime.toFixed(1)}));
    $('#astroMoonMain').textContent=`${tr(`moon.${moon.name}`,{},moon.name)} · ${(moon.illumination*100).toFixed(0)}%`;
    $('#astroMoonDetail').innerHTML=nl(tr('astro.moonDetail',{age:moon.ageDays.toFixed(1),full:moon.nextFullDays.toFixed(1),newmoon:moon.nextNewDays.toFixed(1)}));
    $('#astroTimeMain').textContent=location.timezone||T.offsetLabel(location.utcOffsetMinutes);
    $('#astroTimeDetail').innerHTML=nl(tr('astro.timeDetail',{civil:T.formatLocalTime(new Date(),location),solar:T.localSolarTime(new Date(),location.lon),lon:location.lon.toFixed(4)}));
    const season=T.hemisphereSeason(location.lat,g.month),hemi=location.lat>0?tr('astro.hemi.north'):location.lat<0?tr('astro.hemi.south'):tr('astro.hemi.equator');
    $('#astroSeasonMain').textContent=`${hemi} · ${tr(`season.${season}`,{},season)}`;
    $('#astroSeasonDetail').innerHTML=nl(tr('astro.seasonDetail'));
  }
  function buildFamilyTabs(){if(!R)return;const el=$('#calendarFamilyFilters');el.innerHTML=`<button class="family-tab ${familyFilter==='all'?'active':''}" data-family="all">${esc(tr('common.all'))}</button>`+R.families.map(f=>`<button class="family-tab ${familyFilter===f.id?'active':''}" data-family="${f.id}">${esc(isEnglish()?f.en:f.label)}</button>`).join('');$$('.family-tab').forEach(b=>b.addEventListener('click',()=>{familyFilter=b.dataset.family;renderCalendarSystems();}));}
  async function renderCalendarSystems(){
    if(!R)return;buildFamilyTabs();const xs=R.calendars.filter(x=>familyFilter==='all'||x.family===familyFilter),families=Object.fromEntries(R.families.map(x=>[x.id,x]));
    $('#calendarCatalog').innerHTML=xs.map(x=>{const st=statusMeta(x.status),primary=isEnglish()?(x.en||x.name):x.name,secondary=isEnglish()?x.name:x.en;return `<article class="calendar-card"><div class="calendar-card-head"><div><h3>${esc(primary)}</h3><div class="en">${esc(secondary)} · ${esc(isEnglish()?(families[x.family]?.en||x.family):(families[x.family]?.label||x.family))}</div></div><span class="status-pill ${st.cls}">${esc(st.label)}</span></div><dl><dt>${esc(tr('catalog.source'))}</dt><dd>${esc(calendarMeta(x,'civilization'))}</dd><dt>${esc(tr('catalog.basis'))}</dt><dd>${esc(calendarMeta(x,'basis'))}</dd><dt>${esc(tr('catalog.sync'))}</dt><dd>${esc(calendarMeta(x,'sync'))}</dd><dt>${esc(tr('catalog.range'))}</dt><dd>${esc(calendarMeta(x,'range'))}</dd></dl></article>`;}).join('');
    const a=C.allFromJdn(selectedJdn),g=a.gregorian,[ch,th,tibPhugpa,tibTsurphu]=await Promise.all([fetchChineseDay(g),fetchThaiDay(g),fetchTibetanDay(g,'phugpa'),fetchTibetanDay(g,'tsurphu')]);$('#calendarCompareMeta').textContent=`${shortYear(g.year)} ${C.pad(g.month)}-${C.pad(g.day)} · ${location.name||''}`;
    let html=comparisonItem('Gregorian',a.labels.gregorian)+comparisonItem('Julian',a.labels.julian)+comparisonItem('Islamic',a.labels.islamic,tr('catalog.arithmetic'))+comparisonItem('Hebrew',a.labels.hebrew)+comparisonItem('Persian',a.labels.persian)+comparisonItem('Coptic',a.labels.coptic)+comparisonItem('Ethiopic',a.labels.ethiopic)+comparisonItem('Indian Civil',a.labels.indian)+comparisonItem('Maya Long Count',a.labels.mayan,tr('catalog.specialComposite'));
    if(ch)html+=comparisonItem(isEnglish()?'Chinese Lunisolar':'中华传统阴阳历',lunarText(ch),tr('catalog.currentChinese',{location:location.name||tr('common.custom')}));if(th)html+=comparisonItem(isEnglish()?'Thai Lunisolar':'泰国传统阴阳历',thaiText(th),tr('catalog.thaiEngine'));if(tibPhugpa)html+=comparisonItem(isEnglish()?'Tibetan · Phugpa':'藏历 · Phugpa',tibPhugpa.text,'caltib versioned engine');if(tibTsurphu)html+=comparisonItem(isEnglish()?'Tibetan · Tsurphu':'藏历 · Tsurphu',tibTsurphu.text,'caltib versioned engine');$('#calendarCurrentComparison').innerHTML=html;
  }
  async function renderCivilization(){
    const a=C.allFromJdn(selectedJdn),g=a.gregorian,[ch,th]=await Promise.all([fetchChineseDay(g),fetchThaiDay(g)]),fs=observancesFor(selectedJdn,ch,th);renderObservanceList(fs,'#civilizationObservances');
    const p=location.profileId?T.byId[location.profileId]:T.nearestProfile(location.lat,location.lon).profile;
    $('#countryProfilePanel').innerHTML=`<div class="profile-card"><b>${esc(location.name||tr('common.custom'))} · ${esc(location.country||tr('common.unboundRegion'))}</b><p>${esc(tr('location.field.zone'))}: ${esc(location.timezone||T.offsetLabel(location.utcOffsetMinutes))}</p></div><div class="profile-card"><b>${esc(tr('country.defaultCalendar'))}</b><p>${esc(p?.calendars?.join(' / ')||'Gregorian')}</p></div><div class="profile-card"><b>${esc(tr('country.defaultEra'))}</b><p>${esc(p?.eras?.join(' / ')||'CE')}</p></div><div class="profile-card"><b>${esc(tr('country.traditionEntry'))}</b><p>${esc(p?.traditions?.join(' / ')||tr('country.traditionFallback'))}</p></div><div class="profile-card"><b>${esc(tr('country.holidayLayer'))}</b><p>${esc(tr('country.holidayNote'))}</p></div>`;
    const jap=a.derived.japanese||'—';
    $('#civilizationEra').innerHTML=`<div class="profile-card"><b>CE / BCE</b><p>${esc(shortYear(g.year))}</p></div><div class="profile-card"><b>${esc(tr('era.chineseHistorical'))}</b><p>${esc(chineseHistoricalText(g))}</p></div><div class="profile-card"><b>${esc(tr('era.japanese'))}</b><p>${esc(jap)}</p></div><div class="profile-card"><b>${esc(isEnglish()?'Thai Buddhist Era':'泰国佛历')}</b><p>BE ${g.year+543}</p></div><div class="profile-card"><b>${esc(tr('era.tech'))}</b><p>${esc(siliconLabel(g,true))} · ${esc(aiLabel(g,true))}</p></div>`;
  }
  function statusMeta(status){
    const u=U?.STATUS?.[status],r=R?.statusMeta?.[status];
    const base=u||{label:r?.[0]||status,cls:r?.[1]||status,description:''};
    const technical=tr(`status.${status}`,{},base.label);return {...base,label:technical,technicalLabel:technical,description:tr(`status.${status}.desc`,{},base.description)};
  }
  function pluginTypeMeta(type){const x=U?.PLUGIN_TYPES?.find(x=>x.id===type)||{id:type,zh:type,label:type,description:''};return {...x,zh:tr(`type.${type}`,{},x.zh),description:tr(`type.${type}.desc`,{},x.description)};}
  function miniRows(rows){
    return `<div class="interpretation-kv">${rows.filter(x=>x&&x[1]!==undefined&&x[1]!==null&&x[1]!==''&&(!(Array.isArray(x[1]))||x[1].length)).map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(Array.isArray(v)?v.join('、'):v)}</strong></div>`).join('')}</div>`;
  }
  function listBlock(title,items,empty='—'){
    const xs=(items||[]).filter(Boolean);return `<div class="almanac-list"><b>${esc(title)}</b><p>${esc(xs.length?xs.join(' · '):empty)}</p></div>`;
  }
  async function renderInterpretation(){return window.InterpretationPage.render({PM,U,C,T,$,esc,statusMeta,pluginTypeMeta,selectedJdn,location,activePlugins:activeInterpretationPlugins,I18n});}
  function renderCapabilities(){return window.CapabilitiesPage.render({U,PM,R,$,esc,statusMeta,pluginTypeMeta,renderMars:renderMarsPrototype});}
  function renderMarsPrototype(){
    const el=$('#marsPrototype');if(!el||!U)return;
    const m=U.marsTime(new Date(),0,0);
    el.innerHTML=`<div><span>Mars Sol Date</span><strong>${m.msd.toFixed(5)}</strong><small>${esc(tr('mars.solCount'))}</small></div><div><span>Airy Mean Time</span><strong>${U.formatMarsHour(m.mst)}</strong><small>${esc(tr('mars.airy'))}</small></div><div><span>Mars Ls</span><strong>${m.ls.toFixed(2)}°</strong><small>${esc(m.season)}</small></div><div><span>${esc(tr('common.status'))}</span><strong>${esc(tr('status.experimental'))}</strong><small>${esc(tr('mars.note'))}</small></div>`;
  }
  const renderLunarCalendar=(options={})=>{lastPlanetaryRefreshAt=Date.now();return PCP.renderLunar({$,PM,esc,T,location,quiet:options?.quiet===true});};
  const renderMarsCalendar=(options={})=>{lastPlanetaryRefreshAt=Date.now();return PCP.renderMars({$,PM,esc,T,location,quiet:options?.quiet===true});};
  function renderArchitecture(){
    if(!U)return;const el=$('#fiveLayerArchitecture');if(!el)return;
    el.innerHTML=U.LAYERS.map(x=>`<article class="surface layer-card"><b>${esc(x.n)}</b><span>${esc(x.name)}</span><h3>${esc(tr(`architecture.layer.${x.id}`,{},x.zh))}</h3><strong>${esc(x.core)}</strong><p>${esc(tr(`architecture.desc.${x.id}`,{},x.description))}</p></article>`).join('');
  }
  function renderRuleEraLookup(){const g=C.jdnToGregorian(selectedJdn),xs=E?E.lookup(g.year):[];$('#ruleEraLookup').innerHTML=comparisonItem(isEnglish()?'Selected Date':'选中日期',`${shortYear(g.year)} ${C.pad(g.month)}-${C.pad(g.day)}`)+comparisonItem(tr('era.chineseHistorical'),xs.length?xs.map(E.formatOne).join(isEnglish()?'; ':'；'):tr('common.noRecord'),tr('era.lookupNote'));}
  function bind(){
    $$('.nav-item').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));H?.bind?.(switchView);
    $('#selectAllCalendars')?.addEventListener('click',()=>setAllCalendarSelections(true));$('#clearAllCalendars')?.addEventListener('click',()=>setAllCalendarSelections(false));
    $('#jumpEarth').addEventListener('click',()=>switchView('earth'));
    $('#prevMonth').addEventListener('click',()=>setCalendarYm(Number($('#calYear').value),Number($('#calMonth').value)-1));$('#nextMonth').addEventListener('click',()=>setCalendarYm(Number($('#calYear').value),Number($('#calMonth').value)+1));$('#goMonth').addEventListener('click',renderMonth);$('#todayBtn').addEventListener('click',useLiveReference);
    $('#cellSecondary').addEventListener('change',renderMonth);$$('.annotationCheck').forEach(c=>c.addEventListener('change',renderMonth));
    $('#selectedClockTime')?.addEventListener('change',()=>{setReferenceFromCalendar();renderInspector(selectedJdn);});
    $('#sourceCalendar').addEventListener('change',renderSourceFields);$('#convertBtn').addEventListener('click',convertSource);
    $('#calculateLunar')?.addEventListener('click',renderLunarCalendar);$('#calculateMars')?.addEventListener('click',renderMarsCalendar);
    $('#lunarInstant')?.addEventListener('change',()=>setCustomReferenceFromInput('lunar'));$('#marsInstant')?.addEventListener('change',()=>setCustomReferenceFromInput('mars'));
    $$('[data-reference-time-mode]').forEach(button=>button.addEventListener('click',()=>{const mode=button.dataset.referenceTimeMode;if(mode==='live')useLiveReference();else if(mode==='calendar')setReferenceFromCalendar();else if(mode==='custom')RT?.setCustom?.(RT.getInstant(),'准备手动输入');}));
    $$('[data-reference-time-action="now"]').forEach(button=>button.addEventListener('click',useLiveReference));
    $('#resolveLocationBtn').addEventListener('click',()=>resolveCoordinates($('#locationLat').value,$('#locationLon').value));
    $('#locationSearch').addEventListener('input',e=>renderLocationResults(e.target.value));
    $('#globalPlaceSearchBtn')?.addEventListener('click',()=>searchGlobalPlaces($('#globalPlaceSearch').value));
    $('#globalPlaceSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchGlobalPlaces(e.currentTarget.value);}});
    $('#useBrowserLocation').addEventListener('click',()=>{if(!navigator.geolocation){alert(tr('location.browserUnsupported'));return;}navigator.geolocation.getCurrentPosition(p=>resolveCoordinates(p.coords.latitude,p.coords.longitude),e=>alert(tr('location.browserError',{message:e.message})),{enableHighAccuracy:false,timeout:8000});});
    $('#uiLanguage')?.addEventListener('change',e=>I18n?.setLocale(e.target.value));
    document.addEventListener('ucc:localechange',()=>{
      document.title=isEnglish()?'Universal Civilization Calendar Engine v1.4.0':'通用文明历法引擎 Universal Civilization Calendar v1.4.0';S?.set('locale',I18n?.getLocale?.()||'zh-CN');
      buildMonths($('#calMonth'));buildSourceOptions();buildCivilizationCalendarFilters();updateGlobalDate();updateContextClock();renderLocationDetail();
      const id=$('.view.active')?.id||'today';switchView(id);if(id!=='calendar')renderMonth();renderCalendarSystems();renderAstronomy();renderCapabilities();renderArchitecture();
    });
  }
  async function init(){
    window.TodayLayout?.init?.();saveCalendarSelections();
    S?.set('location',location);S?.set('selectedJdn',selectedJdn);S?.set('activeInterpretationPlugins',activeInterpretationPlugins);S?.set('locale',I18n?.getLocale?.()||'zh-CN');
    const lang=$('#uiLanguage');if(lang)lang.value=I18n?.getLocale?.()||'zh-CN';document.title=isEnglish()?'Universal Civilization Calendar Engine v1.4.0':'通用文明历法引擎 Universal Civilization Calendar v1.4.0';I18n?.applyDocument?.();H?.apply?.();
    buildMonths($('#calMonth'));buildSourceOptions();buildCivilizationCalendarFilters();bind();syncMonthToSelected();
    const tp=T?.zoneParts?.(new Date(),location.timezone,location.utcOffsetMinutes);if(tp&&$('#selectedClockTime'))$('#selectedClockTime').value=`${C.pad(tp.hour)}:${C.pad(tp.minute)}:${C.pad(tp.second)}`;
    PCP.initInputs({$,T,location,referenceTime:RT?.snapshot?.()});RT?.subscribe?.(handleReferenceTime);
    updateGlobalDate();await checkEngines();initEarthMap();renderLocationResults();renderLocationDetail();updateContextClock();clockTimer=setInterval(updateContextClock,1000);
    await Promise.all([renderToday(),renderSourceFields(),renderComparison(selectedJdn),renderCalendarSystems()]);renderAstronomy();renderCapabilities();renderArchitecture();$('#traditionPanel').hidden=false;
  }
  init();
})();

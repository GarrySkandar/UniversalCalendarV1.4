(function(root){
  'use strict';
  const safe=v=>v==null||v===''?'—':String(v);
  function card(esc,title,value,note='',cls=''){
    return `<article class="human-result-card ${cls}"><span>${esc(title)}</span><strong>${esc(safe(value))}</strong>${note?`<small>${esc(note)}</small>`:''}</article>`;
  }
  function kv(esc,k,v){return `<div class="date-module-row"><span>${esc(k)}</span><strong>${esc(safe(v))}</strong></div>`;}
  function dateTimeText(parts){return parts?`${String(parts.year).padStart(4,'0')}-${String(parts.month).padStart(2,'0')}-${String(parts.day).padStart(2,'0')} ${String(parts.hour).padStart(2,'0')}:${String(parts.minute).padStart(2,'0')}:${String(parts.second).padStart(2,'0')}`:'—';}
  function listBlock(esc,title,xs){const text=Array.isArray(xs)?xs.join(' · '):xs;return text?`<div class="date-module-list"><b>${esc(title)}</b><p>${esc(text)}</p></div>`:'';}
  function timePeriodBlock(esc,isEnglish,periods,currentBranch){
    if(!Array.isArray(periods)||!periods.length)return '';
    const names={子:'Zi',丑:'Chou',寅:'Yin',卯:'Mao',辰:'Chen',巳:'Si',午:'Wu',未:'Wei',申:'Shen',酉:'You',戌:'Xu',亥:'Hai'};
    const rows=periods.map(p=>{const branch=String(p.branch||'—'),luck=Array.isArray(p.luck)?p.luck.join(' · '):(p.luck||p.tian_shen_type||'—'),luckClass=String(luck).includes('吉')?'good':String(luck).includes('凶')?'bad':'neutral',yi=Array.isArray(p.yi)?p.yi.join(isEnglish?' · ':'、'):p.yi||'—',ji=Array.isArray(p.ji)?p.ji.join(isEnglish?' · ':'、'):p.ji||'—';return `<div class="almanac-time-row ${branch===currentBranch?'current':''}"><strong>${esc(isEnglish?`${names[branch]||branch} (${branch})`:branch+'时')}</strong><span class="time-luck ${luckClass}">${esc(luck)}</span><span>${esc(p.tian_shen||'—')}</span><span>${esc(yi)}</span><span>${esc(ji)}</span></div>`;}).join('');
    return `<section class="almanac-time-block"><div class="almanac-time-head"><b>${esc(isEnglish?'Twelve double-hours · auspiciousness':'十二时辰吉凶')}</b><small>${esc(isEnglish?'The highlighted row follows the current civil-time double-hour.':'高亮行按当前民用时区时辰。')}</small></div><div class="almanac-time-table"><div class="almanac-time-row almanac-time-label"><span>${esc(isEnglish?'Double-hour':'时辰')}</span><span>${esc(isEnglish?'Luck':'吉凶')}</span><span>${esc(isEnglish?'Deity':'天神')}</span><span>${esc(isEnglish?'Recommended':'宜')}</span><span>${esc(isEnglish?'Avoid':'忌')}</span></div>${rows}</div></section>`;
  }
  function isChildEnabled(selector,childId,systems,children){return selector?.isEffectiveChild?.(childId,systems,children)??children.has(childId);}
  function labelOf(ctx,id){const x=ctx.selector?.byId?.[id];return x?ctx.selector.label(x,ctx.isEnglish):id;}
  function selectedChildren(ctx,systemId){return (ctx.selector?.selectedUnder?.(systemId,ctx.children)||[]).filter(id=>isChildEnabled(ctx.selector,id,ctx.systems,ctx.children));}
  function christianCalendarTitle(id,isEnglish){
    const names=isEnglish?{
      gregorian:'Christianity (Gregorian / International Civil Calendar)',
      'revised-julian':'Revised Julian Calendar (Eastern Orthodox New Calendar)',
      julian:'Julian Calendar (Eastern Orthodox Old Calendar)',
      armenian:'Gregorian Calendar · Armenian Apostolic tradition',
      coptic:'Coptic Calendar · Coptic Orthodox tradition',ethiopian:'Ethiopic Calendar · Ethiopian Orthodox tradition'
    }:{
      gregorian:'基督教相关（格里高利历，国际公历）',
      'revised-julian':'修订儒略历（东正教新历）',julian:'儒略历（东正教旧历）',
      armenian:'格里高利历（国际公历） · 亚美尼亚使徒教会传统',
      coptic:'科普特历 · 科普特正教传统',ethiopian:'埃塞俄比亚历 · 埃塞俄比亚正教传统'
    };return names[id]||id;
  }

  async function renderEras(ctx){
    const {eraEl:el,systems,children,g,ch,th,C,siliconLabel,aiLabel,eraText,esc,isEnglish,forceHistorical}=ctx;if(!el)return;
    const rows=[];
    // Fixed user-facing order: Silicon, Han Buddhist, Theravada Buddhist, Japanese, then Chinese historical chronology.
    if(systems.has('silicon'))rows.push(['硅基纪元',siliconLabel(g,true),aiLabel?aiLabel(g,true):'']);
    if(isChildEnabled(ctx.selector,'han_buddhist',systems,children))rows.push(['汉传佛历',ch?.lunar?`${ch.lunar.year+1027}`:'—','']);
    if(systems.has('theravada'))rows.push(['南传佛历',`BE ${th?.buddhist_year??g.year+543}`,'']);
    if(forceHistorical||systems.has('chinese')){const history=[];const hx=eraText?.(g);if(hx&&hx!=='—'&&!hx.includes('无记录'))history.push(hx);if(g.year>=1912)history.push(isEnglish?`ROC ${g.year-1911}`:`民国 ${g.year-1911}年`);if(history.length)rows.push(['中华历史纪年',history.join(isEnglish?' · ':'；'),'']);}
    if(systems.has('japanese')&&isChildEnabled(ctx.selector,'japanese-era',systems,children))rows.push(['日本年号',C.allFromJdn(C.gregorianToJdn(g.year,g.month,g.day)).derived.japanese||'—','']);
    const enMap={'硅基纪元':'Silicon Era','汉传佛历':'Han Buddhist Era','南传佛历':'Theravada Buddhist Era','日本年号':'Japanese Era Name','中华历史纪年':'Chinese Historical Chronology'};
    el.innerHTML=rows.length?rows.map(([k,v,n])=>`<div class="era-chip"><span>${esc(isEnglish?(enMap[k]||k):k)}</span><strong>${esc(v)}</strong>${n?`<small>${esc(n)}</small>`:''}</div>`).join(''):`<div class="empty-observance">${esc(isEnglish?'No era layer is enabled.':'当前选择没有对应纪年。')}</div>`;
  }

  async function renderCivilizations(ctx){
    const {civilizationEl:el,systems,g,ch,th,C,PM,lunarText,thaiText,siliconLabel,calendarEngineMessage,esc,isEnglish,TT,timeParts}=ctx;if(!el)return;
    const a=C.allFromJdn(C.gregorianToJdn(g.year,g.month,g.day)),cards=[];
    const selected=ctx.children||new Set();
    const ctime=TT?.chinese?.(timeParts,isEnglish),itime=TT?.indianSix?.(timeParts,isEnglish);

    if(systems.has('christianity')){
      const xs=selectedChildren(ctx,'christianity');
      const effective=['gregorian',...xs];
      for(const id of effective){
        if(id==='gregorian')cards.push(card(esc,christianCalendarTitle(id,isEnglish),a.labels.gregorian,isEnglish?'International civil calendar; Christian traditions may add their own observance rules.':'国际通用公历；基督教各传统在其上叠加不同的节期规则。'));
        else if(id==='julian')cards.push(card(esc,christianCalendarTitle(id,isEnglish),a.labels.julian,isEnglish?'Julian Calendar; Orthodox Old Calendar traditions may be layered on top.':'儒略历；东正教旧历传统可叠加于此。'));
        else if(id==='revised-julian')cards.push(card(esc,christianCalendarTitle(id,isEnglish),a.labels.gregorian,isEnglish?'Revised Julian Calendar; fixed dates are aligned with the Gregorian calendar for the current era.':'修订儒略历；当前时期固定日期与格里高利历公历对齐。'));
        else if(id==='armenian')cards.push(card(esc,christianCalendarTitle(id,isEnglish),a.labels.gregorian,isEnglish?'Armenian Apostolic observance layer.':'亚美尼亚使徒教会节期传统；当前日期层使用格里高利历。'));
        else if(id==='coptic')cards.push(card(esc,christianCalendarTitle(id,isEnglish),a.labels.coptic,isEnglish?'Coptic calendar date.':'科普特历日期。'));
        else if(id==='ethiopian')cards.push(card(esc,christianCalendarTitle(id,isEnglish),a.labels.ethiopic,isEnglish?'Ethiopic calendar date.':'埃塞俄比亚历日期。'));
      }
    }
    if(systems.has('islamic'))cards.push(card(esc,isEnglish?'Islamic Calendar':'伊斯兰历',a.labels.islamic,isEnglish?'Built-in conversion is tabular/arithmetic; actual moon sighting can differ.':'当前内置换算为算术历；实际月见可能不同。'));
    if(systems.has('chinese')){
      const note=[ctime?.label,ctime?.note].filter(Boolean).join(' · ');
      cards.push(card(esc,isEnglish?'Chinese Lunisolar Calendar':'中华农历',ch?lunarText(ch,true):calendarEngineMessage('chinese'),note));
      if(isChildEnabled(ctx.selector,'taoist',systems,selected))cards.push(card(esc,isEnglish?'Daoist calendar day':'道教历日',ch?ctx.taoistText(ch,true):calendarEngineMessage('chinese'),ctime?.label||''));
      if(isChildEnabled(ctx.selector,'han_buddhist',systems,selected))cards.push(card(esc,isEnglish?'Han Buddhist calendar':'汉传佛历',ch?ctx.hanBuddhistText(ch,true):calendarEngineMessage('chinese'),ctime?.label||''));
    }
    if(systems.has('indian')){
      let value=isEnglish?'Traditional lunisolar RuleSet pending':'传统阴阳历月日 RuleSet 待接入',note=itime?[itime.label,itime.detail].join(' · '):'';
      if(PM){const r=await PM.execute('indian-panchanga',{g});if(r.ok){value=`Tithi ${r.value.tithi?.index||'—'} · ${r.value.tithi?.name||''}`;note=[`Nakshatra ${r.value.nakshatra?.name||'—'}`,note].filter(Boolean).join(' · ');}}
      cards.push(card(esc,isEnglish?'Indian traditional calendar':'印度传统历法',value,note));
    }
    if(systems.has('theravada'))cards.push(card(esc,isEnglish?'Theravada Buddhist Calendar':'南传佛历',th?thaiText(th,true):`BE ${g.year+543}`,th?`${th.month_display||th.month} · ${th.phase||''} ${th.phase_day||''}`:(isEnglish?'Thai lunisolar provider unavailable; BE year only.':'泰国阴阳历 Provider 不可用；当前仅显示佛历年。')));
    if(systems.has('japanese'))cards.push(card(esc,isEnglish?'Japanese calendar context':'日本传统',C.allFromJdn(C.gregorianToJdn(g.year,g.month,g.day)).derived.japanese||a.labels.gregorian,isEnglish?'Era-name layer; historical calendar RuleSets remain separate.':'显示年号层；历史日本历法 RuleSet 仍单独管理。'));
    if(systems.has('jewish')){
      const variants=selectedChildren(ctx,'jewish').map(id=>labelOf(ctx,id));
      cards.push(card(esc,isEnglish?'Hebrew Calendar':'犹太历',a.labels.hebrew,`${isEnglish?'Religious day begins at sunset.':'宗教日传统从日落开始。'}${variants.length?` · ${variants.join(' / ')}`:''}`));
    }
    if(systems.has('zoroastrian'))cards.push(card(esc,isEnglish?'Zoroastrian calendars':'琐罗亚斯德历',isEnglish?'Calendar-day engine pending':'历日引擎待接入',isEnglish?'Shahenshahi / Qadimi / Fasli remain separate RuleSets.':'Shahenshahi / Qadimi / Fasli 需分别建立 RuleSet。'));
    if(systems.has('bahai'))cards.push(card(esc,isEnglish?'Baháʼí Badíʿ Calendar':'巴哈伊 Badíʿ 历',isEnglish?'Calendar-day engine pending':'历日引擎待接入',isEnglish?'Recorded observances still appear in Civilization Observances.':'已收录纪念日仍会在“文明纪念”显示。'));
    if(systems.has('silicon'))cards.push(card(esc,isEnglish?'Silicon Civilization':'硅基文明',`${siliconLabel(g,true)} · ${C.pad(g.month)}-${C.pad(g.day)}`,isEnglish?'1948 = SE 1':'1948 = SE 1'));
    el.innerHTML=cards.length?cards.join(''):`<div class="empty-observance">${esc(isEnglish?'No civilization calendars are selected.':'尚未选择各文明历法。')}</div>`;
  }

  async function renderChineseAlmanac(ctx){
    const {section,el,systems,children,selector,PM,g,esc,isEnglish,TT,timeParts,trueSolarParts,location}=ctx;const enabled=isChildEnabled(selector,'chinese-almanac',systems,children);if(section)section.hidden=!enabled;if(!el||!enabled)return;
    const r=await PM.execute('chinese-almanac',{g,timeParts});if(!r.ok){el.innerHTML=`<div class="module-message">${esc(r.message|| (isEnglish?'Almanac provider unavailable.':'黄历 Provider 不可用。'))}</div>`;return;}
    const a=r.value.raw||{},currentBranch=TT?.chinese?.(timeParts,isEnglish)?.branch,solarBranch=TT?.chinese?.(trueSolarParts,isEnglish),solarText=isEnglish?`Apparent solar time: ${dateTimeText(trueSolarParts)} · ${solarBranch?.label||'—'}`:`真太阳时：${dateTimeText(trueSolarParts)} · ${solarBranch?.label||'—'}`,timeBasis=timeParts&&trueSolarParts?`<div class="almanac-time-basis"><span>${esc(isEnglish?'Almanac time basis':'黄历时间口径')}</span><strong id="todayAlmanacCivilTime">${esc(dateTimeText(timeParts))}</strong><small id="todayAlmanacSolarTime">${esc(solarText)}</small><em>${esc(isEnglish?`Civil time (${location?.timezone||'local timezone'}) fixes the calendar date and auspiciousness; apparent solar time is a location-based double-hour reference.`:`民用时区（${location?.timezone||'当地时区'}）决定黄历日期与宜忌；真太阳时仅作地点校正后的时辰参考。`)}</em></div>`:'';el.innerHTML=`${timeBasis}<div class="date-module-grid">${kv(esc,isEnglish?'Lunar date':'农历',a.lunar)}${kv(esc,isEnglish?'Ganzhi':'四柱干支',(a.bazi||[]).join(' · '))}${kv(esc,isEnglish?'Day officer':'建除十二值',a.zhi_xing)}${kv(esc,isEnglish?'Lunar mansion':'二十八宿',[a.xiu,a.xiu_luck].filter(Boolean).join(' · '))}${kv(esc,isEnglish?'Conflict':'冲',a.chong)}${kv(esc,isEnglish?'Sha':'煞',a.sha)}</div>${listBlock(esc,isEnglish?'Recommended':'宜',a.yi)}${listBlock(esc,isEnglish?'Avoid':'忌',a.ji)}${listBlock(esc,isEnglish?'Auspicious spirits':'吉神宜趋',a.ji_shen)}${listBlock(esc,isEnglish?'Inauspicious spirits':'凶神宜忌',a.xiong_sha)}${timePeriodBlock(esc,isEnglish,a.time_periods,currentBranch)}`;
  }
  async function renderHuangji(ctx){
    const {section,el,systems,children,selector,PM,g,esc,isEnglish,timeParts,location}=ctx;const enabled=isChildEnabled(selector,'huangji-jingshi',systems,children);if(section)section.hidden=!enabled;if(!el||!enabled)return;
    const r=await PM.execute('huangji-jingshi',{g,timeParts,location});if(!r.ok){el.innerHTML=`<div class="module-message">${esc(r.message||'—')}</div>`;return;}const v=r.value,h=v.hexagram,path=(v.hexagramPath||[]).map(x=>x?.shortName).filter(Boolean).join(' → ');
    el.innerHTML=`<div class="sanyuan-current-state huangji-current"><span>${esc(isEnglish?'Annual hexagram':'值年卦')}</span><strong>${esc(h?`${h.symbol} ${h.name}`:'—')}</strong><small>${esc(`${v.huangjiYear} ${v.ganzhi} · ${isEnglish?'changes at Li Chun':'立春换年'}`)}</small></div><div class="chronology-strip"><div><span>${isEnglish?'Yuan':'元'}</span><b>${v.yuan}</b></div><i>→</i><div><span>${isEnglish?'Hui':'会'}</span><b>${v.hui}</b></div><i>→</i><div><span>${isEnglish?'Yun':'运'}</span><b>${v.yun}</b></div><i>→</i><div><span>${isEnglish?'Shi':'世'}</span><b>${v.shi}</b></div></div><div class="date-module-grid">${kv(esc,isEnglish?'Hierarchy path':'层级卦路',path)}${kv(esc,isEnglish?'Sexagenary position':'甲子内位置',`${v.coordinate?.sexagenaryIndex+1||'—'} / 60`)}${kv(esc,isEnglish?'Year in Shi':'世内年',`${v.yearInShi}/30`)}${kv(esc,isEnglish?'Year in Yuan':'元内年序',v.yuanYear)}</div><p class="module-note">${esc(v.ruleSet||'')}</p>`;
  }
  async function renderSanyuan(ctx){
    const {section,el,systems,children,selector,PM,g,esc,isEnglish}=ctx;const enabled=isChildEnabled(selector,'sanyuan-jiuyun',systems,children);if(section)section.hidden=!enabled;if(!el||!enabled)return;
    const r=await PM.execute('sanyuan-jiuyun',{g});if(!r.ok){el.innerHTML=`<div class="module-message">${esc(r.message||'—')}</div>`;return;}const v=r.value;
    const cycleProgress=v.cycleYears?`${(((v.yearInCycle-1)/(v.cycleYears-1))*100).toFixed(1)}%`:'—';
    const state=`${v.yuan||'—'} · ${v.periodLabel||'—'}`;
    const stateNote=`${v.periodStart||'—'}–${v.periodEnd||'—'} · ${v.star?.name||'—'} · ${v.star?.trigram||'—'} · ${v.star?.element||'—'}`;
    el.innerHTML=`<div class="sanyuan-current-state"><span>${esc(isEnglish?'Current state':'当前状态')}</span><strong>${esc(state)}</strong><small>${esc(stateNote)}</small></div><div class="date-module-grid sanyuan-grid">${kv(esc,isEnglish?'Current cycle':'当前元',`${v.yuan||'—'} · ${v.yuanStart||'—'}–${v.yuanEnd||'—'}`)}${kv(esc,isEnglish?'Current period':'当前运',`${v.periodLabel||'—'} · ${v.periodStart||'—'}–${v.periodEnd||'—'}`)}${kv(esc,isEnglish?'Period star':'运星',v.star?.name||'—')}${kv(esc,isEnglish?'Trigram / element':'卦象 / 五行',`${v.star?.trigram||'—'} · ${v.star?.element||'—'}`)}${kv(esc,isEnglish?'Year in period':'运内年份',`${v.yearInPeriod||'—'} / 20`)}${kv(esc,isEnglish?'180-year cycle':'180年周期',`${v.cycleStart||'—'}–${v.cycleEnd||'—'}`)}${kv(esc,isEnglish?'Cycle progress':'周期进度',`${v.yearInCycle||'—'} / ${v.cycleYears||180} · ${cycleProgress}`)}</div><div class="date-module-list sanyuan-rule"><b>${esc(isEnglish?'RuleSet':'规则版本')}</b><p>${esc(v.ruleSet||'三元九运 · 1864纪元常用玄空规则')}</p></div><p class="module-note">${esc(v.note||(isEnglish?'A separate Xuankong/Fengshui cycle, displayed alongside rather than inside the original Huangji hierarchy.':'玄空/风水相关时间周期，与《皇极经世》元会运世并列，不视为同一原典算法。'))}</p>`;
  }
  async function renderPanchanga(ctx){
    const {section,el,systems,children,selector,PM,g,esc,isEnglish}=ctx;const enabled=isChildEnabled(selector,'indian-panchanga',systems,children);if(section)section.hidden=!enabled;if(!el||!enabled)return;
    const r=await PM.execute('indian-panchanga',{g});if(!r.ok){el.innerHTML=`<div class="module-message">${esc(r.message||'—')}</div>`;return;}const v=r.value;
    el.innerHTML=`<div class="date-module-grid panchanga-grid">${kv(esc,'Vara',v.vara)}${kv(esc,'Tithi',`${v.tithi?.paksha||''} · ${v.tithi?.index||'—'} · ${v.tithi?.name||''}`)}${kv(esc,'Nakshatra',`${v.nakshatra?.index||'—'} · ${v.nakshatra?.name||''}`)}${kv(esc,'Yoga',v.yoga?.index)}${kv(esc,'Karana',v.karana?.halfTithi)}</div><p class="module-note">${esc(isEnglish?'Experimental shared-astronomy approximation; not yet an official/local Drik Panchanga RuleSet.':'当前为共享天文近似实验版；尚不是印度官方或地区 Drik Panchanga RuleSet。')}</p>`;
  }
  async function renderDateModules(ctx){
    await renderCivilizations(ctx);
    await renderEras(ctx);
    await renderChineseAlmanac({...ctx,section:ctx.sections?.chineseAlmanac,el:ctx.targets?.chineseAlmanac});
    await renderHuangji({...ctx,section:ctx.sections?.huangji,el:ctx.targets?.huangji});
    await renderSanyuan({...ctx,section:ctx.sections?.sanyuan,el:ctx.targets?.sanyuan});
    await renderPanchanga({...ctx,section:ctx.sections?.panchanga,el:ctx.targets?.panchanga});
  }
  root.TodayHumanPage={renderEras,renderCivilizations,renderChineseAlmanac,renderHuangji,renderSanyuan,renderPanchanga,renderDateModules};
})(window);

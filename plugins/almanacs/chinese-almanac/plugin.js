(function(){
  const terms={
    'field.dayOfficer':{native:'建除十二值',romanization:{en:'Twelve Day Officers'}},
    'field.mansion':{native:'二十八宿',romanization:{en:'Twenty-Eight Mansions'}},
    'field.ganzhi':{native:'四柱干支',romanization:{en:'Four Pillars Ganzhi'}},
    'field.nayin':{native:'纳音',romanization:{en:'Na Yin'}},
    'field.yi':{native:'宜',romanization:{en:'Recommended'}},
    'field.ji':{native:'忌',romanization:{en:'Avoid'}}
  };
  const locales={
    'zh-CN':{'title':'中国传统黄历','rule.note':'完整性针对当前声明的黄历 RuleSet；其它通书可并列注册。'},
    'en':{'title':'Chinese Traditional Almanac','rule.note':'Completeness is scoped to the declared RuleSet; other almanac traditions can coexist as separate RuleSets.'}
  };
  window.PluginBootstrap.define({
    manifest:{id:'chinese-almanac',type:'almanac',name:'中国传统黄历',en:'Chinese Traditional Almanac',civilization:'中华文明',status:'versioned',version:'1.2.0',representation:'almanac-properties',dependsOn:['chinese'],coverage:'lunar-python RuleSet：干支、纳音、建除、二十八宿、神煞、宜忌、九星、十二时辰吉凶、道历等',ruleSet:{id:'lunar-python-1.4',name:'6tail lunar-python traditional almanac'},ui:{selectable:true,group:'interpretation',renderer:'chinese-almanac'}},
    terminology:terms,locales,
    engine:{async compute(input,ctx){const C=ctx.core.calendar;const g=input.g||C.jdnToGregorian(input.jdn??input.selectedJdn),time=input.timeParts||{};const a=await ctx.services.api.chineseAlmanac(g,input.hour??time.hour??12,input.minute??time.minute??0,input.second??time.second??0);if(!a)throw new Error('lunar_python provider unavailable');return {type:'almanac-properties',ruleSet:a.rule_set,raw:a,displayRows:[
      {label:'农历',value:a.lunar},{label:'四柱干支',value:(a.bazi||[]).join(' · ')},{label:'五行',value:(a.wuxing||[]).join(' · ')},{label:'纳音',value:(a.nayin||[]).join(' · ')},{label:'建除十二值',value:a.zhi_xing},{label:'二十八宿',value:[a.xiu,a.xiu_gong,a.xiu_animal,a.xiu_luck].filter(Boolean).join(' · ')},{label:'冲',value:a.chong},{label:'煞',value:a.sha},{label:'月相',value:a.moon_phase}
    ]};}},
    renderer(payload,ctx){const v=payload?.value??payload,a=v.raw||{};const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const rows=(v.displayRows||[]).filter(r=>r.value);const list=(title,xs)=>`<div class="almanac-list"><b>${esc(title)}</b><p>${esc((xs||[]).join(' · ')||'—')}</p></div>`;const times=(a.time_periods||[]).map(p=>`<div class="almanac-time-row"><strong>${esc((p.branch||'—')+'时')}</strong><span class="time-luck ${String(p.luck||'').includes('吉')?'good':String(p.luck||'').includes('凶')?'bad':'neutral'}">${esc(p.luck||p.tian_shen_type||'—')}</span><span>${esc(p.tian_shen||'—')}</span><span>${esc((p.yi||[]).join('、')||'—')}</span><span>${esc((p.ji||[]).join('、')||'—')}</span></div>`).join('');return `<div class="plugin-almanac">${rows.map(r=>`<div class="plugin-kv-row"><span>${esc(r.label)}</span><strong>${esc(r.value)}</strong></div>`).join('')}${list('彭祖百忌',a.pengzu)}${list('吉神宜趋',a.ji_shen)}${list('凶神宜忌',a.xiong_sha)}${list('宜',a.yi)}${list('忌',a.ji)}${times?`<section class="almanac-time-block"><div class="almanac-time-head"><b>十二时辰吉凶</b></div><div class="almanac-time-table"><div class="almanac-time-row almanac-time-label"><span>时辰</span><span>吉凶</span><span>天神</span><span>宜</span><span>忌</span></div>${times}</div></section>`:''}${a.tao?`<div class="plugin-kv-row"><span>道历</span><strong>${esc(a.tao.date)}</strong></div>`:''}</div>`;}
  });
})();

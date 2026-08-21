window.PluginBootstrap.define({
  manifest:{id:'huangji-jingshi',type:'cosmology',name:'皇极经世',en:'Huangji Jingshi',civilization:'中华文明',status:'versioned',version:'1.3.3',representation:'hierarchical-chronology',dependsOn:['temporal-core'],coverage:'元/会/运/世层级；先天圆图去乾坤坎离，按上级卦与两级爻变确定每个甲子的起卦，再配六十干支；立春时刻换年',ruleSet:{id:'hjys-fuxi-circle-60-hierarchy-lichun-v1',name:'先天方圆图层级值年法 · 立春界'},ui:{selectable:true,group:'interpretation',renderer:'huangji-chronology'}},
  engine:{compute(input,ctx){
    const C=ctx.core.calendar,T=ctx.core.temporal,A=window.AdvancedTimeSystems;
    const g=input.g||C.jdnToGregorian(input.jdn??input.selectedJdn);if(!A)throw new Error('Huangji provider unavailable');
    const location=input.location||{};
    const instant=input.instant instanceof Date?input.instant:(T?.instantFromLocalParts?T.instantFromLocalParts({year:g.year,month:g.month||1,day:g.day||1,...(input.timeParts||{hour:12})},location):T.utcDate(g.year,g.month||1,g.day||1,input.timeParts?.hour??12,input.timeParts?.minute||0,input.timeParts?.second||0));
    const result=A.huangjiForDate(instant,location);
    return {type:'hierarchical-chronology',...result,sanyuanJiuyun:A.sanyuanJiuyunForYear(result.huangjiYear)};
  }}
});

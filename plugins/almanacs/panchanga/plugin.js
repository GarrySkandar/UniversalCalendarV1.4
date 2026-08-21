window.PluginBootstrap.define({
  manifest:{id:'indian-panchanga',type:'almanac',name:'印度 Panchanga',en:'Panchanga',civilization:'印度文明',status:'experimental',version:'1.2.0',representation:'five-limb-almanac',dependsOn:['astronomy-engine','calendar-engine'],coverage:'Vara/Tithi/Nakshatra/Yoga/Karana 共享近似天文原型；正式 Drik/官方 RuleSet 待替换 provider',ruleSet:{id:'shared-astronomy-approx',name:'Shared astronomy approximation'},ui:{selectable:true,group:'interpretation',renderer:'generic-key-value'}},
  engine:{compute(input,ctx){const C=ctx.core.calendar,T=ctx.core.temporal;const g=input.g||C.jdnToGregorian(input.jdn??input.selectedJdn);const date=T.utcDate(g.year,g.month,g.day,12,0,0);return {type:'five-limb-almanac',...window.AdvancedTimeSystems.panchangaApprox(date)};}}
});

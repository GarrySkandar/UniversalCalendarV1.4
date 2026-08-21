window.PluginBootstrap.define({
  manifest:{id:'chinese',type:'calendar',name:'中华传统阴阳历',en:'Chinese Lunisolar',civilization:'中华文明',status:'full',version:'1.0.0',representation:'year-month-day',dependsOn:['temporal-core','astronomy-engine'],coverage:'现代中国农历规则范围；历史历法另由 History 层处理',ruleSet:{id:'modern-chinese-lunisolar',name:'Modern Chinese Lunisolar / sxtwl provider'},ui:{selectable:false,renderer:'generic-key-value'}},
  engine:{async compute(input,ctx){const C=ctx.core.calendar;const g=input.g||C.jdnToGregorian(input.jdn??input.selectedJdn);const x=await ctx.services.api.chineseDay(g);if(!x)throw new Error('Chinese calendar provider unavailable');return {type:'year-month-day',calendar:'chinese',solar:g,lunar:x.lunar,ganzhi:x.ganzhi,zodiac:x.zodiac,term:x.term,provider:'sxtwl'};}}
});

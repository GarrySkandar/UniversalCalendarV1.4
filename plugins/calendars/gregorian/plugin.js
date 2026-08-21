window.PluginBootstrap.define({
  manifest:{id:'gregorian',type:'calendar',name:'格里高利历',en:'Gregorian',civilization:'西方/全球',status:'full',version:'1.0.0',representation:'year-month-day',dependsOn:['temporal-core'],coverage:'前端核心 -5000…+5000',ruleSet:{id:'gregorian-proleptic',name:'Proleptic Gregorian'},ui:{selectable:false,renderer:'generic-key-value'}},
  engine:{compute(input,ctx){const C=ctx.core.calendar;const jdn=input.jdn??input.selectedJdn;if(jdn==null)throw new Error('Gregorian plugin requires jdn');const g=C.jdnToGregorian(jdn);return {type:'year-month-day',calendar:'gregorian',...g,jdn};}}
});

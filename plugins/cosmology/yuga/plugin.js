window.PluginBootstrap.define({
  manifest:{id:'indian-yuga',type:'cosmology',name:'Yuga / Kalpa 宇宙时序',en:'Yuga / Kalpa',civilization:'印度文明',status:'versioned',version:'1.2.0',representation:'hierarchical-chronology',dependsOn:['temporal-core'],coverage:'经典四 Yuga / Mahayuga 时长与 Kali 纪元参考；更高层级按文本版本化',ruleSet:{id:'puranic-durations',name:'Puranic canonical durations'},ui:{selectable:true,group:'interpretation',renderer:'generic-key-value'}},
  engine:{compute(input,ctx){const C=ctx.core.calendar;const g=input.g||C.jdnToGregorian(input.jdn??input.selectedJdn);return {type:'hierarchical-chronology',...window.AdvancedTimeSystems.yugaForDate(g)};}}
});

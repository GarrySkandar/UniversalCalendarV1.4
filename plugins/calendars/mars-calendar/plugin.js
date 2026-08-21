(function(root){
  'use strict';
  root.PluginManager.register({
    manifest:{id:'mars-calendar-v04',type:'calendar',name:'火星历',en:'Mars Calendar',civilization:'火星 / 跨行星',status:'versioned',version:'0.4.0',representation:'continuous-count',dependsOn:['temporal-core','mars'],coverage:'MY0–MY100 Piqueux 2015；范围外 Mars24 approximate',source:['Mars Calendar v0.4','NASA Mars24','Piqueux et al. 2015'],ruleSet:{id:'mars-calendar-rules-v04',name:'Mars Calendar v0.4'},ui:{selectable:false,group:'planetary-calendar',renderer:'generic-key-value'}},
    engine:{async compute(input,ctx){const instant=input.instant instanceof Date?input.instant:new Date(input.instant||Date.now()),p=input.planetLocation||{};return ctx.services.api.marsCalendar({time:instant.toISOString(),lon:p.longitude??0});}}
  });
})(window);

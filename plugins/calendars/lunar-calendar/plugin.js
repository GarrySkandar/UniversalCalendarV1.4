(function(root){
  'use strict';
  root.PluginManager.register({
    manifest:{id:'lunar-calendar-v03',type:'calendar',name:'月球历',en:'Lunar Calendar',civilization:'月球 / 中国文化版',status:'experimental',version:'0.1.0',representation:'continuous-count',dependsOn:['temporal-core','moon'],coverage:'月球历规则 v0.3；几何月面光照，不含DEM',source:['Lunar Calendar Engine v0.1','Rules v0.3'],ruleSet:{id:'lunar-calendar-rules-v03',name:'月球历规则 v0.3'},ui:{selectable:false,group:'planetary-calendar',renderer:'generic-key-value'}},
    engine:{async compute(input,ctx){const instant=input.instant instanceof Date?input.instant:new Date(input.instant||Date.now()),p=input.planetLocation||{};return ctx.services.api.lunarCalendar({time:instant.toISOString(),lat:p.latitude??0.67409,lon:p.longitude??23.47298,height:p.heightM??0,offset:input.civilOffsetHours??8,label:input.civilLabel||'基地民用时间'});}}
  });
})(window);

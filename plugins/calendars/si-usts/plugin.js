(function(root){
  'use strict';
  root.PluginManager.register({
    manifest:{id:'si-usts',type:'calendar',name:'SI秒统一科学时间',en:'SI-Second Unified Scientific Time',civilization:'跨行星科学体系',status:'experimental',version:'0.5.0',representation:'continuous-count',dependsOn:['temporal-core'],coverage:'SI-USTS v0.5 / RP1 adapter; PyERFA optional',source:['SI-USTS v0.5 draft','IAU SOFA / ERFA RP1'],ruleSet:{id:'si-usts-rp1',name:'SI-USTS Reference Profile 1'},ui:{selectable:false,group:'scientific-time',renderer:'generic-key-value'}},
    engine:{async compute(input,ctx){const instant=input.instant instanceof Date?input.instant:new Date(input.instant||input.utc||Date.now());if(Number.isNaN(instant.getTime()))throw new Error('SI-USTS requires a valid instant');return ctx.services.api.siUstsFromUtc(instant.toISOString());}},
    locales:{'zh-CN':{title:'SI秒统一科学时间'},en:{title:'SI-Second Unified Scientific Time'}}
  });
})(window);

window.PluginBootstrap.define({
  manifest:{id:'pawukon-cycles',type:'cycle',name:'巴厘 Pawukon 周期',en:'Balinese Pawukon',civilization:'巴厘文明',status:'versioned',version:'1.2.0',representation:'concurrent-cycles',dependsOn:['temporal-core'],coverage:'210日并行周期结构；传统 wara 名称/权重/偏移继续按来源版本化',ruleSet:{id:'pawukon-structural',name:'Pawukon structural cycle'},ui:{selectable:true,group:'interpretation',renderer:'cycle-grid'}},
  engine:{compute(input){const jdn=input.jdn??input.selectedJdn;if(jdn==null)throw new Error('Pawukon plugin requires jdn');return {type:'concurrent-cycles',...window.AdvancedTimeSystems.pawukonStructural(jdn)};}}
});

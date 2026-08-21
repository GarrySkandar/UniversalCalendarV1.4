(function(root){
  'use strict';
  const U=root.UniversalTemporalEngine;
  if(!U)return;
  const defs=[
    {id:'chinese-almanac',type:'almanac',name:'中国传统黄历',en:'Chinese Traditional Almanac',civilization:'中华文明',status:'versioned',representation:'almanac-properties',dependsOn:['temporal-core','astronomy-engine','calendar-engine'],coverage:'6tail lunar-python RuleSet：干支、五行、纳音、建除、二十八宿、十二神、彭祖百忌、冲煞、方位、吉神凶煞、每日宜忌、九星等；其它通书版本可并列注册',description:'以现代中华阴阳历与节气为底座的复合传统历注。完整性相对于明确 RuleSet，而不是宣称所有通书流派完全一致。'},
    {id:'huangji-jingshi',type:'cosmology',name:'皇极经世',en:'Huangji Jingshi',civilization:'中华文明',status:'versioned',representation:'hierarchical-chronology',dependsOn:['temporal-core'],coverage:'已实现元/会/运/世结构与值年卦：先天圆图去乾坤坎离，上级卦及两级爻变决定甲子起卦，六十干支逐年配位，立春时刻切换',description:'宏观宇宙时序插件。六十甲子只是值年卦的基本排布单元，不视为整个129600年体系的总循环。'},
    {id:'daoist-time',type:'religion',name:'道教时间体系',en:'Daoist Time System',civilization:'中华文明',status:'versioned',representation:'religious-observances',dependsOn:['calendar-engine','chinese-almanac'],coverage:'lunar-python Tao RuleSet：道历、神诞/节日、三会、三元、八节、五腊、八会、明戊/暗戊、天赦等；其它道派科仪日另行版本化',description:'道教宗教节期与中国传统黄历相关但不等同。'},
    {id:'indian-panchanga',type:'almanac',name:'印度 Panchanga',en:'Panchanga',civilization:'印度文明',status:'experimental',representation:'five-limb-almanac',dependsOn:['astronomy-engine','calendar-engine'],coverage:'已实现 Vara / Tithi / Nakshatra / Yoga / Karana 五支的内置近似版；正式印度官方/地区 Drik RuleSet 仍需高精度边界算法后再升 Full',description:'历法 + 天文 + 仪式时间解释的复合系统。当前内置结果明确标为 Experimental。'},
    {id:'indian-muhurta',type:'auspicious',name:'印度 Muhurta',en:'Muhurta',civilization:'印度文明',status:'planned',representation:'activity-timing',dependsOn:['indian-panchanga'],coverage:'活动择时规则依流派、地区与用途而异，接口已定义但未以简化规则冒充完整',description:'日期 × 活动的择时层，与 Panchanga 基础数据分离。'},
    {id:'indian-yuga',type:'cosmology',name:'Yuga / Kalpa 宇宙时序',en:'Yuga / Kalpa',civilization:'印度文明',status:'versioned',representation:'hierarchical-chronology',dependsOn:['temporal-core'],coverage:'经典四 Yuga / Mahayuga 时长与 Kali 纪元参考已实现；更高层级与精确纪元日按文本传统版本化',description:'宏观宇宙时间层级，不当作普通年月历。'},
    {id:'tibetan-almanac',type:'almanac',name:'藏族历算/历书',en:'Tibetan Almanac',civilization:'藏地/喜马拉雅',status:'planned',representation:'regional-almanac',dependsOn:['astronomy-engine','calendar-engine'],coverage:'Phugpa / Tsurphu 等存在真实算法差异；当前保留版本化接口，未用单一近似算法冒充“藏历全部”',description:'历法、星宿、五行、宗教与择日高度复合。'},
    {id:'pawukon-cycles',type:'cycle',name:'巴厘 Pawukon 周期',en:'Balinese Pawukon',civilization:'巴厘文明',status:'versioned',representation:'concurrent-cycles',dependsOn:['temporal-core'],coverage:'210日并行周期结构已运行；传统各 wara 名称、权重和偏移需按具体权威表加载后才可将该版本升 Full',description:'多周期并行，重点描述“今天处于哪些周期”，不强制年月日。'},
    {id:'maya-ritual',type:'cycle',name:'玛雅仪式周期',en:'Maya Ritual Cycles',civilization:'玛雅文明',status:'full',representation:'composite-cycles',dependsOn:['temporal-core'],coverage:'GMT 584283 RuleSet：Long Count + Tzolkin + Haab + Calendar Round 可联合显示；相关常数可作为其它版本另注册',description:'复合周期系统，完整性相对于声明的 GMT 584283 相关常数版本。'},
    {id:'nahua-tonalpohualli',type:'cycle',name:'纳瓦 Tonalpohualli',en:'Nahua Tonalpohualli',civilization:'中部墨西哥文明',status:'planned',representation:'ritual-cycle',dependsOn:['temporal-core'],coverage:'260日占日周期接口已列入；需要单独确认纪元/日名映射版本后再实现',description:'与玛雅 Tzolkin 同为260日型仪式周期，但不能简单视为同一历法。'},
    {id:'arabic-electional',type:'astrology',name:'阿拉伯—波斯历史择时星占',en:'Historical Arabic-Persian Electional Astrology',civilization:'历史伊斯兰文化圈',status:'historical',representation:'astral-interpretation',dependsOn:['astronomy-engine'],coverage:'作为历史星占/择时传统分类与插件接口保留；具体作者/文本 RuleSet 分别实现',description:'消费行星位置数据的历史择时传统，不等同于伊斯兰宗教历。'},
    {id:'european-almanac',type:'almanac',name:'欧洲历史历书传统',en:'Historical European Almanac',civilization:'欧洲历史文明',status:'historical',representation:'historical-almanac',dependsOn:['astronomy-engine','calendar-engine'],coverage:'按地区/时代/文本接入；不把多个世纪的历书传统压成一个伪统一算法',description:'历日、节期、天文/占星与生活实践的历史复合历书。'},
    {id:'personal-bazi',type:'personal',name:'八字个人解释',en:'Bazi Personal Interpretation',civilization:'中华文明',status:'planned',representation:'person-temporal-context',dependsOn:['chinese-almanac'],coverage:'明确与“黄历日期自身属性”分层；本项目当前先做公共时间系统，不把个人命理混入首页',description:'Person + Birth TemporalPoint + Current TemporalPoint；属于个人解释层。'}
  ];
  defs.forEach(x=>U.registerPlugin(x));
  root.CivilizationRegistry={plugins:defs};
})(window);

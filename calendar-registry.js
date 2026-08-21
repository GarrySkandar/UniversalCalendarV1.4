(function(root){
  'use strict';
  const families=[
    {id:'solar',label:'太阳历',en:'Solar',desc:'以太阳年/季节为主要校准目标。'},
    {id:'lunar',label:'太阴历',en:'Lunar',desc:'以朔望月为基础，不用闰月把月份重新锁回季节。'},
    {id:'lunisolar',label:'阴阳合历',en:'Lunisolar',desc:'以月亮定月，同时通过闰月、太阳位置或周期规则校准季节。'},
    {id:'special',label:'周期与特殊历',en:'Special',desc:'允许复合周期、连续计数、观测型日期和其它非 YYYY-MM-DD Representation。'}
  ];
  const calendars=[
    {id:'gregorian',family:'solar',name:'格里高利历',en:'Gregorian',civilization:'西方/全球',status:'full',basis:'固定月 + 太阳年近似',sync:'4/100/400闰年规则',range:'前端核心 -5000…+5000'},
    {id:'julian',family:'solar',name:'儒略历',en:'Julian',civilization:'罗马—西方',status:'full',basis:'固定月 + 太阳年近似',sync:'每4年闰日',range:'前端核心 -5000…+5000'},
    {id:'persian',family:'solar',name:'波斯算术历',en:'Persian Arithmetic',civilization:'伊朗—波斯',status:'full',basis:'太阳年',sync:'2820年算术周期',range:'核心可算；不等同所有官方/天文实现'},
    {id:'coptic',family:'solar',name:'科普特历',en:'Coptic',civilization:'亚历山大—科普特',status:'full',basis:'365/366日太阳历',sync:'四年闰日',range:'核心可算'},
    {id:'ethiopic',family:'solar',name:'埃塞俄比亚历',en:'Ethiopic',civilization:'埃塞俄比亚/厄立特里亚',status:'full',basis:'365/366日太阳历',sync:'四年闰日',range:'核心可算'},
    {id:'indian',family:'solar',name:'印度国定历',en:'Indian Civil / Saka',civilization:'印度现代国家',status:'full',basis:'太阳历',sync:'与公历闰年协调',range:'核心可算'},
    {id:'islamic',family:'lunar',name:'伊斯兰算术历',en:'Tabular Islamic',civilization:'伊斯兰文明',status:'full',basis:'12个朔望月的算术近似',sync:'不校准太阳季节',range:'核心可算'},
    {id:'islamic-observed',family:'lunar',name:'伊斯兰月见历',en:'Observed Hijri',civilization:'伊斯兰文明',status:'external',basis:'首次可见新月',sync:'不校准太阳季节',range:'需要地点、可见性模型与宗教/国家权威确认'},
    {id:'chinese',family:'lunisolar',name:'中华传统阴阳历',en:'Chinese Lunisolar',civilization:'中华文明',status:'full',basis:'天文朔定月',sync:'太阳黄经/中气 + 闰月',range:'现代规则范围：sxtwl 专用引擎；按现代中国农历规则展示。历史历法不包含在此 Full 声明内，由 History 层处理'},
    {id:'korean',family:'lunisolar',name:'韩国/朝鲜阴历分支',en:'Korean Lunisolar',civilization:'东亚阴阳历家族',status:'planned',basis:'天文月',sync:'当地时区/地区规则',range:'待独立地区参数化'},
    {id:'vietnamese',family:'lunisolar',name:'越南阴历分支',en:'Vietnamese Lunisolar',civilization:'东亚阴阳历家族',status:'planned',basis:'天文月',sync:'UTC+7等地区参数',range:'待独立地区参数化'},
    {id:'japanese-historical',family:'lunisolar',name:'日本传统历体系',en:'Japanese Historical Calendars',civilization:'日本',status:'planned',basis:'历史阴阳历',sync:'按具体历史历法与有效期解析',range:'Historical Resolver 待扩展'},
    {id:'hebrew',family:'lunisolar',name:'希伯来历',en:'Hebrew',civilization:'犹太文明',status:'full',basis:'月周期算术历',sync:'19年周期闰月 + 延期规则',range:'核心可算'},
    {id:'thai',family:'lunisolar',name:'泰国传统阴阳历',en:'Thai Lunisolar',civilization:'东南亚大陆',status:'partial',basis:'月相计日',sync:'泰国置闰月/闰日规则',range:'pythaidate 专用引擎'},
    {id:'burmese',family:'lunisolar',name:'缅甸历',en:'Burmese Calendar',civilization:'东南亚大陆',status:'planned',basis:'月相计日',sync:'缅甸独立置闰体系',range:'待独立引擎'},
    {id:'srilanka',family:'lunisolar',name:'斯里兰卡僧伽罗/Poya传统',en:'Sinhala / Poya',civilization:'斯里兰卡',status:'partial',basis:'月相与满月Poya',sync:'南亚佛教传统',range:'纪念日层部分；完整历法待扩展'},
    {id:'tibetan',family:'lunisolar',name:'藏历—喜马拉雅体系',en:'Tibetan',civilization:'藏地/喜马拉雅',status:'versioned',basis:'月日 + 时轮历算传统',sync:'独立闰月/重复日/缺日规则',range:'可选 caltib 引擎：Phugpa / Tsurphu / Mongol；藏族每日历注另属解释插件'},
    {id:'mayan',family:'special',name:'玛雅长纪历',en:'Maya Long Count',civilization:'中美洲',status:'full',basis:'连续日计数',sync:'复合周期',range:'Long Count 核心可算；其它周期另插件'},
    {id:'pawukon',family:'special',name:'巴厘 Pawukon',en:'Pawukon',civilization:'巴厘',status:'versioned',basis:'210日多重并行周期',sync:'不属于普通年月日模型',range:'已接入并行周期结构；传统 wara 名称/偏移需按版本表加载'},
    {id:'bahai',family:'special',name:'巴哈伊 Badíʿ 历',en:'Badíʿ',civilization:'巴哈伊',status:'partial',basis:'19×19日 + 闰余日',sync:'Naw-Rúz 与春分关系',range:'当前节庆以年度参考为主，完整转换待扩展'},
    {id:'mars-sol',family:'special',name:'火星 Sol / Mars24 时间原型',en:'Mars Sol / Solar Time',civilization:'跨行星',status:'experimental',basis:'火星平均太阳日',sync:'MSD / MST / LMST / Ls',range:'实验物理时间层；不是官方火星民用年月历'}
  ];
  const fallback={
    core:['核心','core'],full:['完整','full'],versioned:['版本化','versioned'],external:['外部确认','external'],historical:['历史重建','historical'],partial:['部分','partial'],plugin:['插件','plugin'],experimental:['实验','experimental'],planned:['待扩展','planned'],authority:['外部确认','external'],
    engine:['专用引擎','partial'],reference:['年度参考','partial'],architecture:['架构预留','experimental']
  };
  const statusMeta=new Proxy(fallback,{get(target,key){
    const u=root.UniversalTemporalEngine?.STATUS?.[key];return u?[u.label,u.cls]:target[key];
  }});
  root.CalendarRegistry={families,calendars,statusMeta};
})(window);

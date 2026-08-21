(function(root){
  'use strict';
  const C=root.CalendarCore, T=root.TemporalCore;
  if(!C)return;
  const mod=(a,n)=>((a%n)+n)%n;

  const TZOLKIN_NAMES=['Imix','Ikʼ','Akʼbal','Kʼan','Chikchan','Kimi','Manikʼ','Lamat','Muluk','Ok','Chuwen','Ebʼ','Bʼen','Ix','Men','Kʼibʼ','Kabʼan','Etzʼnabʼ','Kawak','Ajaw'];
  const HAAB_MONTHS=['Pop','Woʼ','Sip','Sotzʼ','Sek','Xul','Yaxkʼin','Mol','Chʼen','Yax','Sakʼ','Keh','Mak','Kʼankʼin','Muwanʼ','Pax','Kʼayab','Kumkʼu','Wayebʼ'];
  function mayaRitual(jdn){
    const n=Math.floor(jdn)-584283;
    const tzNum=mod(n+3,13)+1, tzName=TZOLKIN_NAMES[mod(n+19,20)];
    const h=mod(n+348,365); const hm=h<360?Math.floor(h/20):18; const hd=h<360?mod(h,20):h-360;
    return {correlation:'GMT 584283',totalDays:n,tzolkin:{number:tzNum,name:tzName,text:`${tzNum} ${tzName}`},haab:{day:hd,month:HAAB_MONTHS[hm],text:`${hd} ${HAAB_MONTHS[hm]}`},calendarRound:`${tzNum} ${tzName} · ${hd} ${HAAB_MONTHS[hm]}`};
  }

  // 皇极经世结构化时间：以《皇极经世书》卷五所列“经世之子二千一百五十七，甲子=公元前2337年”作锚点。
  // 这是“元会运世层级定位”RuleSet，不把后世每年卦法冒充邵雍唯一原法。
  const HJ_ANCHOR_YEAR=-2336; // astronomical year numbering = 2337 BCE
  const HJ_ANCHOR_SHI=2157;
  const BRANCHES=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const STEMS=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const HJ_HEXAGRAMS={
    1:['乾','乾为天','䷀',63],2:['坤','坤为地','䷁',0],3:['屯','水雷屯','䷂',17],4:['蒙','山水蒙','䷃',34],
    5:['需','水天需','䷄',23],6:['讼','天水讼','䷅',58],7:['师','地水师','䷆',2],8:['比','水地比','䷇',16],
    9:['小畜','风天小畜','䷈',55],10:['履','天泽履','䷉',59],11:['泰','地天泰','䷊',7],12:['否','天地否','䷋',56],
    13:['同人','天火同人','䷌',61],14:['大有','火天大有','䷍',47],15:['谦','地山谦','䷎',4],16:['豫','雷地豫','䷏',8],
    17:['随','泽雷随','䷐',25],18:['蛊','山风蛊','䷑',38],19:['临','地泽临','䷒',3],20:['观','风地观','䷓',48],
    21:['噬嗑','火雷噬嗑','䷔',41],22:['贲','山火贲','䷕',37],23:['剥','山地剥','䷖',32],24:['复','地雷复','䷗',1],
    25:['无妄','天雷无妄','䷘',57],26:['大畜','山天大畜','䷙',39],27:['颐','山雷颐','䷚',33],28:['大过','泽风大过','䷛',30],
    29:['坎','坎为水','䷜',18],30:['离','离为火','䷝',45],31:['咸','泽山咸','䷞',28],32:['恒','雷风恒','䷟',14],
    33:['遁','天山遁','䷠',60],34:['大壮','雷天大壮','䷡',15],35:['晋','火地晋','䷢',40],36:['明夷','地火明夷','䷣',5],
    37:['家人','风火家人','䷤',53],38:['睽','火泽睽','䷥',43],39:['蹇','水山蹇','䷦',20],40:['解','雷水解','䷧',10],
    41:['损','山泽损','䷨',35],42:['益','风雷益','䷩',49],43:['夬','泽天夬','䷪',31],44:['姤','天风姤','䷫',62],
    45:['萃','泽地萃','䷬',24],46:['升','地风升','䷭',6],47:['困','泽水困','䷮',26],48:['井','水风井','䷯',22],
    49:['革','泽火革','䷰',29],50:['鼎','火风鼎','䷱',46],51:['震','震为雷','䷲',9],52:['艮','艮为山','䷳',36],
    53:['渐','风山渐','䷴',52],54:['归妹','雷泽归妹','䷵',11],55:['丰','雷火丰','䷶',13],56:['旅','火山旅','䷷',44],
    57:['巽','巽为风','䷸',54],58:['兑','兑为泽','䷹',27],59:['涣','风水涣','䷺',50],60:['节','水泽节','䷻',19],
    61:['中孚','风泽中孚','䷼',51],62:['小过','雷山小过','䷽',12],63:['既济','水火既济','䷾',21],64:['未济','火水未济','䷿',42]
  };
  const HJ_BY_BITS=Object.fromEntries(Object.entries(HJ_HEXAGRAMS).map(([number,v])=>[v[3],{number:+number,shortName:v[0],name:v[1],symbol:v[2],bits:v[3]}]));
  const HJ_NON_CARDINAL_NAMES=['复','颐','屯','益','震','噬嗑','随','无妄','明夷','贲','既济','家人','丰','革','同人','临','损','节','中孚','归妹','睽','兑','履','泰','大畜','需','小畜','大壮','大有','夬','姤','大过','鼎','恒','巽','井','蛊','升','讼','困','未济','解','涣','蒙','师','遁','咸','旅','小过','渐','蹇','艮','谦','否','萃','晋','豫','观','比','剥'];
  const HJ_BY_NAME=Object.fromEntries(Object.values(HJ_BY_BITS).map(v=>[v.shortName,v]));
  const HJ_NON_CARDINAL=HJ_NON_CARDINAL_NAMES.map(name=>HJ_BY_NAME[name]);
  const HJ_FULL_CIRCLE_NAMES=['复','颐','屯','益','震','噬嗑','随','无妄','明夷','贲','既济','家人','丰','离','革','同人','临','损','节','中孚','归妹','睽','兑','履','泰','大畜','需','小畜','大壮','大有','夬','乾','姤','大过','鼎','恒','巽','井','蛊','升','讼','困','未济','解','涣','坎','蒙','师','遁','咸','旅','小过','渐','蹇','艮','谦','否','萃','晋','豫','观','比','剥','坤'];
  const HJ_RULESET_ID='hjys-fuxi-circle-60-hierarchy-lichun-v1';
  const HJ_COORDINATE_ANCHOR_YEAR=1984;
  const HJ_COORDINATE_ANCHOR=31*2160+5*360+4*60; // 大过 · 上爻变姤 · 五爻变鼎 · 甲子
  function changeLine(hexagram,line){return HJ_BY_BITS[hexagram.bits^(1<<(line-1))];}
  function huangjiCoordinateForYear(year){
    const cycleYear=mod(HJ_COORDINATE_ANCHOR+(year-HJ_COORDINATE_ANCHOR_YEAR),129600);
    const greatIndex=Math.floor(cycleYear/2160),withinGreat=mod(cycleYear,2160);
    const firstChange=Math.floor(withinGreat/360)+1,withinFirst=mod(withinGreat,360);
    const secondChange=Math.floor(withinFirst/60)+1,sexagenaryIndex=mod(withinFirst,60);
    const greatHexagram=HJ_NON_CARDINAL[greatIndex];
    const firstChangedHexagram=changeLine(greatHexagram,firstChange);
    const sexagenaryStartHexagram=changeLine(firstChangedHexagram,secondChange);
    const fullStart=HJ_FULL_CIRCLE_NAMES.indexOf(sexagenaryStartHexagram.shortName);
    let annualStartName=sexagenaryStartHexagram.shortName,step=0;
    while(['乾','坤','坎','离'].includes(annualStartName)&&step<4){step++;annualStartName=HJ_FULL_CIRCLE_NAMES[mod(fullStart+step,64)];}
    const startIndex=HJ_NON_CARDINAL.findIndex(x=>x.shortName===annualStartName);
    if(startIndex<0)throw new Error(`Huangji annual sequence start unavailable: ${annualStartName}`);
    return {cycleYear,greatIndex,firstChange,secondChange,sexagenaryIndex,greatHexagram,firstChangedHexagram,sexagenaryStartHexagram,annualSequenceStartHexagram:HJ_NON_CARDINAL[startIndex],skippedCardinalAtStart:step>0,annualHexagram:HJ_NON_CARDINAL[mod(startIndex+sexagenaryIndex,60)]};
  }
  function huangjiYearForDate(date,location){
    if(!(date instanceof Date)||!Number.isFinite(date.getTime()))throw new Error('Huangji calculation requires a valid instant');
    const p=T?.zoneParts?T.zoneParts(date,location?.timezone,location?.utcOffsetMinutes):{year:date.getUTCFullYear()};
    const boundary=T?.liChunInstant?T.liChunInstant(p.year):T?.utcDate?.(p.year,2,4,12);
    const year=boundary&&date<boundary?p.year-1:p.year;
    return {year,boundary,boundarySource:T?.liChunInstant?'apparent-solar-longitude-315':'fallback'};
  }
  function huangjiForYear(year){
    const diff=year-HJ_ANCHOR_YEAR;
    const shi=HJ_ANCHOR_SHI+Math.floor(diff/30);
    const yearInShi=mod(diff,30)+1;
    const yun=Math.floor((shi-1)/12)+1;
    const shiInYun=mod(shi-1,12)+1;
    const hui=Math.floor((yun-1)/30)+1;
    const yunInHui=mod(yun-1,30)+1;
    const yuan=Math.floor((hui-1)/12)+1;
    const huiInYuan=mod(hui-1,12)+1;
    const yuanYear=mod((shi-1)*30 + (yearInShi-1),129600)+1;
    const sexagenaryIndex=mod(diff,60);
    const coordinate=huangjiCoordinateForYear(year),hexagram=coordinate.annualHexagram;
    return {ruleSet:'先天方圆图层级值年法 · 去乾坤坎离 · 立春换年',ruleSetId:HJ_RULESET_ID,anchor:'2337 BCE = 经世2157之甲子',yuan,hui,huiInYuan,huiBranch:BRANCHES[huiInYuan-1],yun,yunInHui,shi,shiInYun,yearInShi,yuanYear,ganzhi:`${STEMS[sexagenaryIndex%10]}${BRANCHES[sexagenaryIndex%12]}`,hexagram,coordinate,hexagramPath:[coordinate.greatHexagram,coordinate.firstChangedHexagram,coordinate.annualSequenceStartHexagram,hexagram]};
  }
  function huangjiForDate(date,location){
    const boundary=huangjiYearForDate(date,location),result=huangjiForYear(boundary.year);
    return {...result,huangjiYear:boundary.year,liChunInstant:boundary.boundary?.toISOString?.()||null,boundarySource:boundary.boundarySource};
  }



  // 三元九运（玄空/风水时间体系）与邵雍《皇极经世》的“元会运世”不是同一套层级。
  // 这里采用现代三元九运中常见的 180 年周期基线：1864-2043 为一完整周期，
  // 每元 60 年、每运 20 年；2024-2043 为下元九运。其它流派若采用不同纪元，应另建 RuleSet。
  const SYJY_BASE_YEAR=1864;
  const SYJY_STARS=[
    {period:1,name:'一白贪狼',trigram:'坎',element:'水'},
    {period:2,name:'二黑巨门',trigram:'坤',element:'土'},
    {period:3,name:'三碧禄存',trigram:'震',element:'木'},
    {period:4,name:'四绿文曲',trigram:'巽',element:'木'},
    {period:5,name:'五黄廉贞',trigram:'中',element:'土'},
    {period:6,name:'六白武曲',trigram:'乾',element:'金'},
    {period:7,name:'七赤破军',trigram:'兑',element:'金'},
    {period:8,name:'八白左辅',trigram:'艮',element:'土'},
    {period:9,name:'九紫右弼',trigram:'离',element:'火'}
  ];
  function sanyuanJiuyunForYear(year){
    const offset=year-SYJY_BASE_YEAR;
    const absolutePeriod=Math.floor(offset/20);
    const period=mod(absolutePeriod,9)+1;
    const cycleIndex=Math.floor(offset/180);
    const cycleStart=SYJY_BASE_YEAR+cycleIndex*180;
    const cycleEnd=cycleStart+179;
    const periodStart=SYJY_BASE_YEAR+absolutePeriod*20;
    const periodEnd=periodStart+19;
    const yuanIndex=Math.floor((period-1)/3);
    const yuan=['上元','中元','下元'][yuanIndex];
    const yuanStart=cycleStart+yuanIndex*60;
    const yuanEnd=yuanStart+59;
    const star=SYJY_STARS[period-1];
    return {
      ruleSet:'三元九运 · 1864纪元常用玄空规则',
      cycleYears:180,
      cycleStart,cycleEnd,yearInCycle:year-cycleStart+1,
      yuan,yuanIndex:yuanIndex+1,yuanStart,yuanEnd,
      period,periodLabel:`${['一','二','三','四','五','六','七','八','九'][period-1]}运`,periodStart,periodEnd,yearInPeriod:year-periodStart+1,
      star,
      note:'三元九运属于玄空/风水相关时间体系；与邵雍《皇极经世》的元会运世应并列显示，不应视为同一原典算法。'
    };
  }

  // Puranic-style canonical duration hierarchy. Absolute dating is explicitly versioned.
  function yugaForDate(g){
    const y=g.year;
    const start=-3101; // 3102 BCE, astronomical year numbering; day-level epoch varies by tradition.
    const kaliYear=y-start + (y>0?0:1);
    const cycle=4320000, kali=432000, dvapara=864000, treta=1296000, krita=1728000;
    return {ruleSet:'Puranic canonical durations / Kali epoch reference',kaliYearApprox:kaliYear,mahayugaYears:cycle,durations:{Krita:krita,Treta:treta,Dvapara:dvapara,Kali:kali},note:'只实现经典时长与纪元参考；不同宗派/天文传统的精确纪元日与宇宙层级需版本化。'};
  }

  // Lightweight Panchanga limb model. It uses the shared lunar phase engine and a low-order solar longitude;
  // boundary times are not claimed as official Indian Panchang results.
  const NAKSHATRA=['Ashwini','Bharani','Krittika','Rohini','Mrigashirsha','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
  const TITHI_NAMES=['Pratipada','Dvitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dvadashi','Trayodashi','Chaturdashi','Purnima/Amavasya'];
  function approxSolarLongitude(date){
    const jd=T?T.julianDate(date):(date.getTime()/86400000+2440587.5),n=jd-2451545.0;
    const L=mod(280.460+0.9856474*n,360),g=(mod(357.528+0.9856003*n,360))*Math.PI/180;
    return mod(L+1.915*Math.sin(g)+0.020*Math.sin(2*g),360);
  }
  function panchangaApprox(date){
    const phase=T?T.moonPhase(date):{fraction:0};
    const elong=mod(phase.fraction*360,360), sun=approxSolarLongitude(date), moon=mod(sun+elong,360);
    const tithi=Math.floor(elong/12)+1, paksha=tithi<=15?'Shukla':'Krishna', tIn=((tithi-1)%15)+1;
    const nak=Math.floor(moon/(360/27)); const yoga=Math.floor(mod(sun+moon,360)/(360/27))+1;
    const weekday=['Ravivara','Somavara','Mangalavara','Budhavara','Guruvara','Shukravara','Shanivara'][date.getUTCDay()];
    return {status:'experimental',ruleSet:'Shared astronomy approximation',vara:weekday,tithi:{index:tithi,paksha,name:TITHI_NAMES[tIn-1]},nakshatra:{index:nak+1,name:NAKSHATRA[nak]},yoga:{index:yoga},karana:{halfTithi:Math.floor(elong/6)+1},sunLongitude:sun,moonLongitude:moon,note:'用于插件架构与五支展示；精确边界需接入印度官方/高精度历算 RuleSet 后才可标 Full。'};
  }

  // Generic 210-day concurrent cycle representation for the Pawukon plugin.
  // Individual named wara offsets are kept versioned until a sourced Balinese rule table is loaded.
  function pawukonStructural(jdn){
    const index=mod(Math.floor(jdn),210)+1;
    return {status:'versioned',cycleDay:index,cycles:{dwi:mod(index-1,2)+1,tri:mod(index-1,3)+1,catur:mod(index-1,4)+1,panca:mod(index-1,5)+1,sad:mod(index-1,6)+1,sapta:mod(index-1,7)+1,asta:mod(index-1,8)+1,sanga:mod(index-1,9)+1,dasa:mod(index-1,10)+1},note:'210日并行周期框架已实现；传统各 wara 名称/权重/特殊偏移表必须按来源版本加载，不能用简单模运算冒充完整巴厘规则。'};
  }

  root.AdvancedTimeSystems={mayaRitual,huangjiForYear,huangjiForDate,huangjiCoordinateForYear,sanyuanJiuyunForYear,yugaForDate,panchangaApprox,pawukonStructural};
})(window);

(function(root){
  'use strict';

  const STATUS = {
    core:         {label:'核心', cls:'core', rank:0, description:'底层稳定能力，供其它模块依赖。'},
    full:         {label:'完整', cls:'full', rank:1, description:'对声明的 RuleSet、版本和有效范围已完整实现。'},
    versioned:    {label:'版本化', cls:'versioned', rank:2, description:'存在多个传统/版本；当前已实现一个或多个明确命名的 RuleSet。'},
    external:     {label:'外部确认', cls:'external', rank:3, description:'算法可给出预测/候选，但现实采用结果还需政府、宗教机构或实际观测确认。'},
    historical:   {label:'历史重建', cls:'historical', rank:4, description:'依据历史文献或重建规则工作，结果必须标明时代和来源。'},
    experimental: {label:'实验', cls:'experimental', rank:5, description:'用于验证架构或近似算法，不作为正式规范结果。'},
    planned:      {label:'待扩展', cls:'planned', rank:6, description:'接口/数据模型已预留，尚未实现。'},
    partial:      {label:'部分', cls:'partial', rank:7, description:'开发过渡状态：已有结果，但声明能力尚未全部覆盖。'},
    plugin:       {label:'插件', cls:'plugin', rank:8, description:'独立模块，通过标准接口接入；成熟度应同时由其具体 RuleSet 声明。'},
    authority:    {label:'外部确认', cls:'external', rank:3, description:'兼容旧状态名；等同 external。'}
  };

  const PLUGIN_TYPES = [
    {id:'calendar', label:'Calendar', zh:'历法', description:'把绝对时间表示为某种历法/周期日期。'},
    {id:'almanac', label:'Almanac', zh:'传统历注', description:'解释某一日期自身的传统属性。'},
    {id:'religion', label:'Religion', zh:'宗教', description:'宗教纪念、节期和仪式时间。'},
    {id:'era', label:'Era', zh:'纪年', description:'年份命名、帝王/年号/纪元。'},
    {id:'country', label:'Country', zh:'国家地区', description:'民用历法、法定假日、周末和行政时间制度。'},
    {id:'history', label:'History', zh:'历史解析', description:'按时代和地区选择当时实际使用的规则。'},
    {id:'auspicious', label:'Auspicious Timing', zh:'择日择时', description:'日期 × 活动的传统适宜性规则。'},
    {id:'cycle', label:'Divinatory Cycle', zh:'占日周期', description:'多重周期、日名或仪式性质。'},
    {id:'astrology', label:'Astrology', zh:'星占', description:'消费天文位置数据的文化解释系统。'},
    {id:'cosmology', label:'Cosmological Chronology', zh:'宇宙时序', description:'元会运世、Yuga/Kalpa 等宏观时间层级。'},
    {id:'personal', label:'Personal Interpretation', zh:'个人解释', description:'加入个人出生时空点后的命理/个人化判断。'}
  ];

  const LAYERS = [
    {id:'physical', n:'01', name:'Physical Time', zh:'物理时间', core:'Planetary + Temporal + Location', description:'天体、自转、公转、绝对时刻、经纬度、时区。'},
    {id:'astronomical', n:'02', name:'Astronomical Time', zh:'天文时间', core:'Astronomy Engine', description:'太阳/月亮/行星位置、朔望、节气、日出日落。'},
    {id:'calendar', n:'03', name:'Calendar Time', zh:'历法时间', core:'Calendar Engine', description:'Calendar Rules、Regional Variants、Special Plugins。'},
    {id:'civilizational', n:'04', name:'Civilizational Time', zh:'文明时间', core:'Civilization Context', description:'Era、Religion、Country、History、权威数据。'},
    {id:'interpretive', n:'05', name:'Interpretive Time', zh:'解释时间', core:'Civilizational Interpretation', description:'历注、择日、占日周期、星占、宇宙时序。'}
  ];

  const planets = {
    earth:{
      id:'earth', name:'地球', en:'Earth', status:'core', active:true,
      rotationSeconds:86164.0905, meanSolarDaySeconds:86400,
      yearDays:365.2422, primeMeridian:'IERS/Greenwich',
      capabilities:['civil-time','timezone','sun','moon','calendar-engine']
    },
    mars:{
      id:'mars', name:'火星', en:'Mars', status:'experimental', active:false,
      meanSolarDaySeconds:88775.244, yearEarthDays:686.98, yearSols:668.6,
      primeMeridian:'Airy-0',
      capabilities:['MSD','MST','LMST','Ls','season'],
      note:'采用 NASA Mars24/Allison-McEwen 的太阳时框架；不把任何提议中的火星民用年月历当作官方标准。'
    },
    moon:{
      id:'moon', name:'月球', en:'Moon', status:'planned', active:false,
      capabilities:[], note:'预留天体/地点接口；尚未定义项目内民用历法。'
    }
  };

  const plugins = new Map();

  function validatePlugin(p){
    if(!p || typeof p!=='object') throw new Error('Plugin must be an object');
    if(!p.id || !p.type || !p.name) throw new Error('Plugin requires id/type/name');
    if(!PLUGIN_TYPES.some(x=>x.id===p.type)) throw new Error(`Unknown plugin type: ${p.type}`);
    if(p.status && !STATUS[p.status]) throw new Error(`Unknown plugin status: ${p.status}`);
    return true;
  }
  function registerPlugin(p){
    validatePlugin(p);
    const normalized={
      status:'plugin', version:'0.1', dependsOn:[], representation:'custom', coverage:'未声明',
      sourceType:'rule', ...p
    };
    plugins.set(normalized.id, normalized);
    return normalized;
  }
  function unregisterPlugin(id){ return plugins.delete(id); }
  function getPlugin(id){ return plugins.get(id)||null; }
  function listPlugins(filter={}){
    return [...plugins.values()].filter(p=>{
      if(filter.type && p.type!==filter.type)return false;
      if(filter.status && p.status!==filter.status)return false;
      if(filter.civilization && p.civilization!==filter.civilization)return false;
      return true;
    });
  }
  function dependencyReport(id){
    const p=getPlugin(id); if(!p)return {ok:false,missing:['plugin-not-found']};
    const knownCore=new Set(['temporal-core','location-core','astronomy-engine','calendar-engine','solar-core','lunar-core','earth','mars']);
    const missing=(p.dependsOn||[]).filter(x=>!knownCore.has(x)&&!plugins.has(x));
    return {ok:missing.length===0,missing};
  }

  function mod(a,n){return ((a%n)+n)%n;}
  function d2r(x){return x*Math.PI/180;}
  function r2d(x){return x*180/Math.PI;}

  // Experimental Mars temporal calculation following NASA Mars24 equations.
  // For modern dates, TT-UTC = 69.184 s while TAI-UTC remains 37 s (IERS Bulletin C 72, 2026-07-06).
  function marsTime(date=new Date(), longitudeEast=0, latitude=0){
    const jdUT=2440587.5 + date.getTime()/86400000;
    const ttMinusUtc=69.184;
    const jdTT=jdUT + ttMinusUtc/86400;
    const dt=jdTT-2451545.0;
    const M=mod(19.3871+0.52402073*dt,360);
    const fms=mod(270.3871+0.524038496*dt,360);
    const terms=[
      [0.0071,2.2353,49.409],[0.0057,2.7543,168.173],[0.0039,1.1177,191.837],
      [0.0037,15.7866,21.736],[0.0021,2.1354,15.704],[0.0020,2.4694,95.528],[0.0018,32.8493,49.095]
    ];
    const pbs=terms.reduce((s,[A,tau,phi])=>s+A*Math.cos(d2r((0.985626*dt/tau)+phi)),0);
    const center=(10.691+3e-7*dt)*Math.sin(d2r(M)) + 0.623*Math.sin(d2r(2*M)) + 0.050*Math.sin(d2r(3*M)) + 0.005*Math.sin(d2r(4*M)) + 0.0005*Math.sin(d2r(5*M)) + pbs;
    const ls=mod(fms+center,360);
    const eot=2.861*Math.sin(d2r(2*ls))-0.071*Math.sin(d2r(4*ls))+0.002*Math.sin(d2r(6*ls))-center;
    const mst=mod(24*(((jdTT-2451549.5)/1.0274912517)+44796.0-0.0009626),24);
    const lmst=mod(mst+longitudeEast/15,24); // NASA uses west-positive; east-positive therefore adds.
    const ltst=mod(lmst+eot/15,24);
    const msd=((jdTT-2451549.5)/1.0274912517)+44796.0-0.0009626;
    const decl=r2d(Math.asin(0.42565*Math.sin(d2r(ls)))) + 0.25*Math.sin(d2r(ls));
    const season = ls<90?'北半球春 / 南半球秋':ls<180?'北半球夏 / 南半球冬':ls<270?'北半球秋 / 南半球春':'北半球冬 / 南半球夏';
    return {jdUT,jdTT,ttMinusUtc,msd,mst,lmst,ltst,ls,eot,declination:decl,longitudeEast,latitude,season};
  }

  function formatMarsHour(h){
    h=mod(h,24); const hh=Math.floor(h), mm=Math.floor((h-hh)*60), ss=Math.floor((((h-hh)*60)-mm)*60);
    return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  }

  root.UniversalTemporalEngine={STATUS,PLUGIN_TYPES,LAYERS,planets,registerPlugin,unregisterPlugin,getPlugin,listPlugins,dependencyReport,validatePlugin,marsTime,formatMarsHour};
})(window);

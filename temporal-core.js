(function(root){
  'use strict';
  const DEG=Math.PI/180, RAD=180/Math.PI;
  const profiles=[
    {id:'beijing',name:'北京',en:'Beijing',country:'中国',code:'CN',lat:39.9042,lon:116.4074,timezone:'Asia/Shanghai',calendars:['Gregorian','中华传统阴阳历'],eras:['CE','中国历史纪年'],traditions:['中国传统','汉传佛教','道教']},
    {id:'shanghai',name:'上海',en:'Shanghai',country:'中国',code:'CN',lat:31.2304,lon:121.4737,timezone:'Asia/Shanghai',calendars:['Gregorian','中华传统阴阳历'],eras:['CE','中国历史纪年'],traditions:['中国传统','汉传佛教','道教']},
    {id:'urumqi',name:'乌鲁木齐',en:'Urumqi',country:'中国',code:'CN',lat:43.8256,lon:87.6168,timezone:'Asia/Shanghai',calendars:['Gregorian','中华传统阴阳历'],eras:['CE','中国历史纪年'],traditions:['中国传统','汉传佛教','道教']},
    {id:'hongkong',name:'香港',en:'Hong Kong',country:'中国香港',code:'HK',lat:22.3193,lon:114.1694,timezone:'Asia/Hong_Kong',calendars:['Gregorian','中华传统阴阳历'],eras:['CE'],traditions:['中国传统','汉传佛教','道教']},
    {id:'taipei',name:'台北',en:'Taipei',country:'台湾地区',code:'TW',lat:25.0330,lon:121.5654,timezone:'Asia/Taipei',calendars:['Gregorian','中华传统阴阳历'],eras:['民国','CE'],traditions:['中国传统','汉传佛教','道教']},
    {id:'seoul',name:'首尔',en:'Seoul',country:'韩国',code:'KR',lat:37.5665,lon:126.9780,timezone:'Asia/Seoul',calendars:['Gregorian','韩国阴历'],eras:['CE'],traditions:['韩国传统','佛教']},
    {id:'pyongyang',name:'平壤',en:'Pyongyang',country:'朝鲜',code:'KP',lat:39.0392,lon:125.7625,timezone:'Asia/Pyongyang',calendars:['Gregorian','朝鲜传统阴历'],eras:['CE'],traditions:['朝鲜传统']},
    {id:'tokyo',name:'东京',en:'Tokyo',country:'日本',code:'JP',lat:35.6762,lon:139.6503,timezone:'Asia/Tokyo',calendars:['Gregorian','日本旧历（历史/传统）'],eras:['日本年号','CE'],traditions:['日本传统','佛教']},
    {id:'hanoi',name:'河内',en:'Hanoi',country:'越南',code:'VN',lat:21.0278,lon:105.8342,timezone:'Asia/Ho_Chi_Minh',calendars:['Gregorian','越南阴历'],eras:['CE'],traditions:['越南传统','佛教']},
    {id:'bangkok',name:'曼谷',en:'Bangkok',country:'泰国',code:'TH',lat:13.7563,lon:100.5018,timezone:'Asia/Bangkok',calendars:['Gregorian','泰国阴阳历'],eras:['Buddhist Era','CE'],traditions:['泰国上座部佛教']},
    {id:'yangon',name:'仰光',en:'Yangon',country:'缅甸',code:'MM',lat:16.8409,lon:96.1735,timezone:'Asia/Yangon',calendars:['Gregorian','缅甸历'],eras:['Myanmar Era','CE'],traditions:['缅甸上座部佛教']},
    {id:'phnompenh',name:'金边',en:'Phnom Penh',country:'柬埔寨',code:'KH',lat:11.5564,lon:104.9282,timezone:'Asia/Phnom_Penh',calendars:['Gregorian','高棉传统历'],eras:['Buddhist Era','CE'],traditions:['柬埔寨上座部佛教']},
    {id:'vientiane',name:'万象',en:'Vientiane',country:'老挝',code:'LA',lat:17.9757,lon:102.6331,timezone:'Asia/Vientiane',calendars:['Gregorian','老挝传统历'],eras:['Buddhist Era','CE'],traditions:['老挝上座部佛教']},
    {id:'colombo',name:'科伦坡',en:'Colombo',country:'斯里兰卡',code:'LK',lat:6.9271,lon:79.8612,timezone:'Asia/Colombo',calendars:['Gregorian','Sinhala/Poya传统'],eras:['CE'],traditions:['斯里兰卡上座部佛教']},
    {id:'delhi',name:'新德里',en:'New Delhi',country:'印度',code:'IN',lat:28.6139,lon:77.2090,timezone:'Asia/Kolkata',calendars:['Gregorian','Indian Civil','印度传统历家族'],eras:['Saka','CE'],traditions:['印度教','锡克教','耆那教']},
    {id:'kathmandu',name:'加德满都',en:'Kathmandu',country:'尼泊尔',code:'NP',lat:27.7172,lon:85.3240,timezone:'Asia/Kathmandu',calendars:['Gregorian','Bikram Sambat'],eras:['BS','CE'],traditions:['印度教','佛教']},
    {id:'thimphu',name:'廷布',en:'Thimphu',country:'不丹',code:'BT',lat:27.4728,lon:89.6390,timezone:'Asia/Thimphu',calendars:['Gregorian','不丹/藏历家族'],eras:['CE'],traditions:['藏传佛教']},
    {id:'ulaanbaatar',name:'乌兰巴托',en:'Ulaanbaatar',country:'蒙古',code:'MN',lat:47.8864,lon:106.9057,timezone:'Asia/Ulaanbaatar',calendars:['Gregorian','蒙古/藏历家族'],eras:['CE'],traditions:['藏传佛教']},
    {id:'tehran',name:'德黑兰',en:'Tehran',country:'伊朗',code:'IR',lat:35.6892,lon:51.3890,timezone:'Asia/Tehran',calendars:['Solar Hijri','Gregorian','Islamic'],eras:['Solar Hijri','AH','CE'],traditions:['伊斯兰教','琐罗亚斯德传统']},
    {id:'riyadh',name:'利雅得',en:'Riyadh',country:'沙特阿拉伯',code:'SA',lat:24.7136,lon:46.6753,timezone:'Asia/Riyadh',calendars:['Gregorian','Islamic Hijri'],eras:['AH','CE'],traditions:['伊斯兰教']},
    {id:'jerusalem',name:'耶路撒冷',en:'Jerusalem',country:'以色列',code:'IL',lat:31.7683,lon:35.2137,timezone:'Asia/Jerusalem',calendars:['Gregorian','Hebrew'],eras:['AM','CE'],traditions:['犹太教','基督教','伊斯兰教']},
    {id:'cairo',name:'开罗',en:'Cairo',country:'埃及',code:'EG',lat:30.0444,lon:31.2357,timezone:'Africa/Cairo',calendars:['Gregorian','Coptic','Islamic'],eras:['CE','AH'],traditions:['伊斯兰教','科普特正教']},
    {id:'addis',name:'亚的斯亚贝巴',en:'Addis Ababa',country:'埃塞俄比亚',code:'ET',lat:8.9806,lon:38.7578,timezone:'Africa/Addis_Ababa',calendars:['Ethiopic','Gregorian'],eras:['Ethiopic','CE'],traditions:['埃塞俄比亚正教','伊斯兰教']},
    {id:'athens',name:'雅典',en:'Athens',country:'希腊',code:'GR',lat:37.9838,lon:23.7275,timezone:'Europe/Athens',calendars:['Gregorian','Julian（宗教固定节期参考）'],eras:['CE'],traditions:['东正教']},
    {id:'moscow',name:'莫斯科',en:'Moscow',country:'俄罗斯',code:'RU',lat:55.7558,lon:37.6173,timezone:'Europe/Moscow',calendars:['Gregorian','Julian（宗教固定节期参考）'],eras:['CE'],traditions:['东正教旧历传统']},
    {id:'rome',name:'罗马',en:'Rome',country:'意大利',code:'IT',lat:41.9028,lon:12.4964,timezone:'Europe/Rome',calendars:['Gregorian'],eras:['CE'],traditions:['天主教']},
    {id:'london',name:'伦敦',en:'London',country:'英国',code:'GB',lat:51.5074,lon:-0.1278,timezone:'Europe/London',calendars:['Gregorian'],eras:['CE'],traditions:['基督教']},
    {id:'paris',name:'巴黎',en:'Paris',country:'法国',code:'FR',lat:48.8566,lon:2.3522,timezone:'Europe/Paris',calendars:['Gregorian'],eras:['CE'],traditions:['基督教']},
    {id:'newyork',name:'纽约',en:'New York',country:'美国',code:'US',lat:40.7128,lon:-74.0060,timezone:'America/New_York',calendars:['Gregorian'],eras:['CE'],traditions:['基督教','犹太教','伊斯兰教']},
    {id:'losangeles',name:'洛杉矶',en:'Los Angeles',country:'美国',code:'US',lat:34.0522,lon:-118.2437,timezone:'America/Los_Angeles',calendars:['Gregorian'],eras:['CE'],traditions:['多宗教']},
    {id:'mexicocity',name:'墨西哥城',en:'Mexico City',country:'墨西哥',code:'MX',lat:19.4326,lon:-99.1332,timezone:'America/Mexico_City',calendars:['Gregorian'],eras:['CE'],traditions:['天主教','本土传统']},
    {id:'lima',name:'利马',en:'Lima',country:'秘鲁',code:'PE',lat:-12.0464,lon:-77.0428,timezone:'America/Lima',calendars:['Gregorian'],eras:['CE'],traditions:['天主教','安第斯传统']},
    {id:'saopaulo',name:'圣保罗',en:'São Paulo',country:'巴西',code:'BR',lat:-23.5505,lon:-46.6333,timezone:'America/Sao_Paulo',calendars:['Gregorian'],eras:['CE'],traditions:['基督教']},
    {id:'buenosaires',name:'布宜诺斯艾利斯',en:'Buenos Aires',country:'阿根廷',code:'AR',lat:-34.6037,lon:-58.3816,timezone:'America/Argentina/Buenos_Aires',calendars:['Gregorian'],eras:['CE'],traditions:['基督教']},
    {id:'nairobi',name:'内罗毕',en:'Nairobi',country:'肯尼亚',code:'KE',lat:-1.2921,lon:36.8219,timezone:'Africa/Nairobi',calendars:['Gregorian'],eras:['CE'],traditions:['基督教','伊斯兰教']},
    {id:'capetown',name:'开普敦',en:'Cape Town',country:'南非',code:'ZA',lat:-33.9249,lon:18.4241,timezone:'Africa/Johannesburg',calendars:['Gregorian'],eras:['CE'],traditions:['多宗教']},
    {id:'singapore',name:'新加坡',en:'Singapore',country:'新加坡',code:'SG',lat:1.3521,lon:103.8198,timezone:'Asia/Singapore',calendars:['Gregorian','中华传统阴阳历（华人传统）'],eras:['CE'],traditions:['华人传统','佛教','道教','伊斯兰教','印度教']},
    {id:'jakarta',name:'雅加达',en:'Jakarta',country:'印度尼西亚',code:'ID',lat:-6.2088,lon:106.8456,timezone:'Asia/Jakarta',calendars:['Gregorian','Islamic','爪哇/地方传统'],eras:['CE','AH'],traditions:['伊斯兰教']},
    {id:'denpasar',name:'登巴萨',en:'Denpasar',country:'印度尼西亚·巴厘岛',code:'ID',lat:-8.6705,lon:115.2126,timezone:'Asia/Makassar',calendars:['Gregorian','Balinese Saka','Pawukon'],eras:['CE','Saka'],traditions:['巴厘印度教']},
    {id:'sydney',name:'悉尼',en:'Sydney',country:'澳大利亚',code:'AU',lat:-33.8688,lon:151.2093,timezone:'Australia/Sydney',calendars:['Gregorian'],eras:['CE'],traditions:['多宗教']},
    {id:'auckland',name:'奥克兰',en:'Auckland',country:'新西兰',code:'NZ',lat:-36.8509,lon:174.7645,timezone:'Pacific/Auckland',calendars:['Gregorian'],eras:['CE'],traditions:['多宗教']},
    {id:'honolulu',name:'檀香山',en:'Honolulu',country:'美国·夏威夷',code:'US',lat:21.3069,lon:-157.8583,timezone:'Pacific/Honolulu',calendars:['Gregorian'],eras:['CE'],traditions:['多宗教']}
  ];
  const byId=Object.fromEntries(profiles.map(x=>[x.id,x]));

  function mod(a,n){return ((a%n)+n)%n;}
  function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
  function haversine(lat1,lon1,lat2,lon2){
    const p1=lat1*DEG,p2=lat2*DEG,dp=(lat2-lat1)*DEG,dl=(lon2-lon1)*DEG;
    const a=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
    return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }
  function nearestProfile(lat,lon){
    let best=null,dist=Infinity;
    for(const p of profiles){const d=haversine(lat,lon,p.lat,p.lon);if(d<dist){dist=d;best=p;}}
    return {profile:best,distanceKm:dist};
  }
  function searchProfiles(q){
    const s=String(q||'').trim().toLowerCase();if(!s)return profiles.slice(0,12);
    return profiles.filter(p=>[p.name,p.en,p.country,p.code].some(v=>String(v).toLowerCase().includes(s))).slice(0,12);
  }
  function approxOffsetMinutes(lon){return Math.round((lon/15)*4)*15;}
  function offsetLabel(minutes){const sign=minutes>=0?'+':'-';const a=Math.abs(minutes),h=Math.floor(a/60),m=a%60;return `UTC${sign}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;}
  function formatCoord(v,pos,neg){return `${Math.abs(v).toFixed(4)}° ${v>=0?pos:neg}`;}
  function coordinateLabel(lat,lon){return `${formatCoord(lat,'N','S')} · ${formatCoord(lon,'E','W')}`;}
  function zoneParts(date,zone,offsetMinutes){
    if(zone){
      try{
        const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);
        const o={};parts.forEach(p=>{if(p.type!=='literal')o[p.type]=p.value;});
        return {year:+o.year,month:+o.month,day:+o.day,hour:+o.hour,minute:+o.minute,second:+o.second};
      }catch(e){}
    }
    const d=new Date(date.getTime()+(offsetMinutes||0)*60000);
    return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate(),hour:d.getUTCHours(),minute:d.getUTCMinutes(),second:d.getUTCSeconds()};
  }
  function formatLocalTime(date,loc){const p=zoneParts(date,loc.timezone,loc.utcOffsetMinutes);return `${String(p.hour).padStart(2,'0')}:${String(p.minute).padStart(2,'0')}:${String(p.second).padStart(2,'0')}`;}
  function zoneOffsetMinutes(date,zone){if(!zone)return null;try{const p=zoneParts(date,zone,0),ms=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second),base=Math.floor(date.getTime()/1000)*1000;return Math.round((ms-base)/60000);}catch(e){return null;}}
  function localDateParts(date,loc){return zoneParts(date,loc.timezone,loc.utcOffsetMinutes);}
  function utcDate(y,m,d,h=0,min=0,sec=0){const x=new Date(0);x.setUTCFullYear(y,m-1,d);x.setUTCHours(h,min,sec,0);return x;}
  function instantFromLocalParts(parts,loc={}){
    const target=utcDate(parts.year,parts.month,parts.day,parts.hour||0,parts.minute||0,parts.second||0).getTime();
    let instant=new Date(target-(loc.utcOffsetMinutes||0)*60000);
    for(let i=0;i<3;i++){
      const p=zoneParts(instant,loc.timezone,loc.utcOffsetMinutes);
      const shown=utcDate(p.year,p.month,p.day,p.hour,p.minute,p.second).getTime();
      instant=new Date(instant.getTime()+target-shown);
    }
    return instant;
  }
  function dayOfYear(y,m,d){const a=utcDate(y,m,d).getTime(),b=utcDate(y,1,0).getTime();return Math.floor((a-b)/86400000);}
  function solarApprox(y,m,d,lat,lon){
    const n=dayOfYear(y,m,d),gamma=2*Math.PI/365*(n-1);
    const eqtime=229.18*(0.000075+0.001868*Math.cos(gamma)-0.032077*Math.sin(gamma)-0.014615*Math.cos(2*gamma)-0.040849*Math.sin(2*gamma));
    const decl=0.006918-0.399912*Math.cos(gamma)+0.070257*Math.sin(gamma)-0.006758*Math.cos(2*gamma)+0.000907*Math.sin(2*gamma)-0.002697*Math.cos(3*gamma)+0.00148*Math.sin(3*gamma);
    const latr=lat*DEG,zen=90.833*DEG;
    const cosH=(Math.cos(zen)/(Math.cos(latr)*Math.cos(decl)))-Math.tan(latr)*Math.tan(decl);
    const solarNoonUTC=720-4*lon-eqtime;
    if(cosH>1)return {declination:decl*RAD,equationOfTime:eqtime,polar:'night',solarNoonUTC,sunriseUTC:null,sunsetUTC:null,dayLengthHours:0};
    if(cosH<-1)return {declination:decl*RAD,equationOfTime:eqtime,polar:'day',solarNoonUTC,sunriseUTC:null,sunsetUTC:null,dayLengthHours:24};
    const h=Math.acos(cosH)*RAD;
    return {declination:decl*RAD,equationOfTime:eqtime,polar:null,solarNoonUTC,sunriseUTC:solarNoonUTC-4*h,sunsetUTC:solarNoonUTC+4*h,dayLengthHours:8*h/60};
  }
  function minutesToDateUTC(y,m,d,mins){return new Date(utcDate(y,m,d).getTime()+mins*60000);}
  function formatEventTime(y,m,d,mins,loc){if(mins==null)return '—';return formatLocalTime(minutesToDateUTC(y,m,d,mins),loc).slice(0,5);}
  function julianDate(date){return date.getTime()/86400000+2440587.5;}
  function solarApparentLongitude(date){
    const jd=julianDate(date),t=(jd-2451545.0)/36525;
    const L0=mod(280.46646+36000.76983*t+0.0003032*t*t,360);
    const M=mod(357.52911+35999.05029*t-0.0001537*t*t+t*t*t/24490000,360)*DEG;
    const c=(1.914602-0.004817*t-0.000014*t*t)*Math.sin(M)+(0.019993-0.000101*t)*Math.sin(2*M)+0.000289*Math.sin(3*M);
    const omega=(125.04-1934.136*t)*DEG;
    return mod(L0+c-0.00569-0.00478*Math.sin(omega),360);
  }
  function solarLongitudeCrossing(year,targetLongitude=315){
    let lo=utcDate(year,2,2).getTime(),hi=utcDate(year,2,6).getTime();
    const signed=t=>mod(solarApparentLongitude(new Date(t))-targetLongitude+180,360)-180;
    let flo=signed(lo),fhi=signed(hi);
    if(flo>0||fhi<0)return null;
    for(let i=0;i<52;i++){
      const mid=(lo+hi)/2,fmid=signed(mid);
      if(fmid<0)lo=mid;else hi=mid;
    }
    return new Date((lo+hi)/2);
  }
  function liChunInstant(year){return solarLongitudeCrossing(year,315);}
  function moonPhase(date){
    const syn=29.530588853,epoch=2451550.09765,jd=julianDate(date),age=mod(jd-epoch,syn),f=age/syn;
    const illumination=(1-Math.cos(2*Math.PI*f))/2;
    let name='新月';
    if(f<0.03||f>0.97)name='新月';else if(f<0.22)name='娥眉月';else if(f<0.28)name='上弦月';else if(f<0.47)name='盈凸月';else if(f<0.53)name='满月';else if(f<0.72)name='亏凸月';else if(f<0.78)name='下弦月';else name='残月';
    const nextFull=mod(0.5-f,1)*syn,nextNew=mod(1-f,1)*syn;
    return {ageDays:age,fraction:f,illumination,name,nextFullDays:nextFull,nextNewDays:nextNew};
  }
  function subsolarPoint(date){
    const jd=julianDate(date),n=jd-2451545.0,L=mod(280.460+0.9856474*n,360),g=mod(357.528+0.9856003*n,360)*DEG;
    const lambda=(L+1.915*Math.sin(g)+0.020*Math.sin(2*g))*DEG,eps=(23.439-0.0000004*n)*DEG;
    const dec=Math.asin(Math.sin(eps)*Math.sin(lambda));
    const ra=Math.atan2(Math.cos(eps)*Math.sin(lambda),Math.cos(lambda))*RAD;
    const T=(jd-2451545.0)/36525;
    const gmst=mod(280.46061837+360.98564736629*(jd-2451545)+0.000387933*T*T-T*T*T/38710000,360);
    const lon=mod(ra-gmst+180,360)-180;
    return {lat:dec*RAD,lon};
  }
  function localSolarTime(date,lon){
    const p=new Date(date.getTime()+lon/15*3600000);
    return `${String(p.getUTCHours()).padStart(2,'0')}:${String(p.getUTCMinutes()).padStart(2,'0')}`;
  }
  // Apparent ("true") solar time = UTC + longitude correction + equation of time.
  // This is intentionally distinct from localSolarTime(), which is local mean solar time.
  function trueSolarTimeParts(date,lon){
    const utc={year:date.getUTCFullYear(),month:date.getUTCMonth()+1,day:date.getUTCDate()};
    const equationOfTimeMinutes=solarApprox(utc.year,utc.month,utc.day,0,lon).equationOfTime;
    const correctionMinutes=lon*4+equationOfTimeMinutes;
    const p=new Date(date.getTime()+correctionMinutes*60000);
    return {year:p.getUTCFullYear(),month:p.getUTCMonth()+1,day:p.getUTCDate(),hour:p.getUTCHours(),minute:p.getUTCMinutes(),second:p.getUTCSeconds(),equationOfTimeMinutes,correctionMinutes};
  }
  function formatDateTimeParts(parts){
    return `${String(parts.year).padStart(4,'0')}-${String(parts.month).padStart(2,'0')}-${String(parts.day).padStart(2,'0')} ${String(parts.hour).padStart(2,'0')}:${String(parts.minute).padStart(2,'0')}:${String(parts.second).padStart(2,'0')}`;
  }
  function hemisphereSeason(lat,month){
    const north=['冬季','冬季','春季','春季','春季','夏季','夏季','夏季','秋季','秋季','秋季','冬季'];
    const south=['夏季','夏季','秋季','秋季','秋季','冬季','冬季','冬季','春季','春季','春季','夏季'];
    if(Math.abs(lat)<8)return '热带季节性弱';return (lat>=0?north:south)[month-1];
  }
  function defaultLocation(){return {...byId.beijing,utcOffsetMinutes:480,source:'preset'};}
  function normalizeLocation(x){
    const n={...defaultLocation(),...(x||{})};n.lat=clamp(Number(n.lat),-89.999,89.999);n.lon=clamp(Number(n.lon),-180,180);
    if(!Number.isFinite(n.utcOffsetMinutes))n.utcOffsetMinutes=approxOffsetMinutes(n.lon);return n;
  }
  function saveLocation(loc){try{localStorage.setItem('uc-location-v1',JSON.stringify(loc));}catch(e){}}
  function loadLocation(){try{return normalizeLocation(JSON.parse(localStorage.getItem('uc-location-v1')||'null'));}catch(e){return defaultLocation();}}

  root.TemporalCore={profiles,byId,mod,clamp,haversine,nearestProfile,searchProfiles,approxOffsetMinutes,offsetLabel,coordinateLabel,zoneParts,formatLocalTime,zoneOffsetMinutes,localDateParts,instantFromLocalParts,utcDate,solarApprox,formatEventTime,julianDate,solarApparentLongitude,solarLongitudeCrossing,liChunInstant,moonPhase,subsolarPoint,localSolarTime,trueSolarTimeParts,formatDateTimeParts,hemisphereSeason,defaultLocation,normalizeLocation,saveLocation,loadLocation};
})(window);

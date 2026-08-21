(function(root){
  'use strict';
  const floor = Math.floor;
  const mod = (a,b)=>((a%b)+b)%b;
  const pad=(n,w=2)=>String(Math.abs(n)).padStart(w,'0');

  function astroYearLabel(y){
    if(y>0) return `公元 ${y} 年`;
    if(y===0) return '公元前 1 年（天文0年）';
    return `公元前 ${1-y} 年`;
  }

  function gregorianToJdn(y,m,d){
    const a=floor((14-m)/12), y2=y+4800-a, m2=m+12*a-3;
    return d+floor((153*m2+2)/5)+365*y2+floor(y2/4)-floor(y2/100)+floor(y2/400)-32045;
  }
  function julianToJdn(y,m,d){
    const a=floor((14-m)/12), y2=y+4800-a, m2=m+12*a-3;
    return d+floor((153*m2+2)/5)+365*y2+floor(y2/4)-32083;
  }
  function gregorianLeap(y){return mod(y,4)===0 && (mod(y,100)!==0 || mod(y,400)===0)}
  function julianLeap(y){return mod(y,4)===0}
  function daysInGregorianMonth(y,m){return [31,gregorianLeap(y)?29:28,31,30,31,30,31,31,30,31,30,31][m-1]||0}
  function daysInJulianMonth(y,m){return [31,julianLeap(y)?29:28,31,30,31,30,31,31,30,31,30,31][m-1]||0}

  function fromJdnByYear(jdn, toStart, daysInMonth){
    let y=floor((jdn-1721426)/365.2425)+1;
    while(jdn < toStart(y,1,1)) y--;
    while(jdn >= toStart(y+1,1,1)) y++;
    let doy=jdn-toStart(y,1,1)+1, m=1;
    while(doy>daysInMonth(y,m)){doy-=daysInMonth(y,m);m++;}
    return {year:y,month:m,day:doy};
  }
  function jdnToGregorian(jdn){return fromJdnByYear(floor(jdn),gregorianToJdn,daysInGregorianMonth)}
  function jdnToJulian(jdn){return fromJdnByYear(floor(jdn),julianToJdn,daysInJulianMonth)}
  function weekdayFromJdn(jdn){return mod(jdn+1,7)} // 0 Sunday

  const ISLAMIC_EPOCH=1948439.5;
  const islamicMonths=['Muharram','Safar','Rabi I','Rabi II','Jumada I','Jumada II','Rajab','Sha\'ban','Ramadan','Shawwal','Dhu al-Qadah','Dhu al-Hijjah'];
  function islamicToJd(y,m,d){return d+Math.ceil(29.5*(m-1))+(y-1)*354+floor((3+11*y)/30)+ISLAMIC_EPOCH-1}
  function islamicToJdn(y,m,d){return floor(islamicToJd(y,m,d)+0.5)}
  function jdnToIslamic(jdn){
    const jd=floor(jdn)-0.5;
    const y=floor((30*(jd-ISLAMIC_EPOCH)+10646)/10631);
    let m=Math.min(12,Math.ceil((jd-(29+islamicToJd(y,1,1)))/29.5)+1); if(m<1)m=1;
    const d=floor(jd-islamicToJd(y,m,1)+1);
    return {year:y,month:m,day:d};
  }

  const HEBREW_EPOCH=347995.5;
  const hebrewMonths={1:'Nisan',2:'Iyar',3:'Sivan',4:'Tammuz',5:'Av',6:'Elul',7:'Tishri',8:'Heshvan',9:'Kislev',10:'Tevet',11:'Shevat',12:'Adar',13:'Adar II'};
  function hebrewLeap(y){return mod(y*7+1,19)<7}
  function hebrewYearMonths(y){return hebrewLeap(y)?13:12}
  function hebrewDelay1(y){
    const months=floor((235*y-234)/19), parts=12084+13753*months;
    let day=months*29+floor(parts/25920);
    if(mod(3*(day+1),7)<3) day++;
    return day;
  }
  function hebrewDelay2(y){
    const last=hebrewDelay1(y-1), present=hebrewDelay1(y), next=hebrewDelay1(y+1);
    if(next-present===356) return 2;
    if(present-last===382) return 1;
    return 0;
  }
  function hebrewToJd(y,m,d){
    let jd=HEBREW_EPOCH+hebrewDelay1(y)+hebrewDelay2(y)+d+1;
    if(m<7){
      for(let mm=7;mm<=hebrewYearMonths(y);mm++) jd+=hebrewMonthDays(y,mm);
      for(let mm=1;mm<m;mm++) jd+=hebrewMonthDays(y,mm);
    }else{
      for(let mm=7;mm<m;mm++) jd+=hebrewMonthDays(y,mm);
    }
    return jd;
  }
  function hebrewToJdn(y,m,d){return floor(hebrewToJd(y,m,d)+0.5)}
  function hebrewYearDays(y){return hebrewToJd(y+1,7,1)-hebrewToJd(y,7,1)}
  function hebrewMonthDays(y,m){
    if([2,4,6,10,13].includes(m)) return 29;
    if(m===12 && !hebrewLeap(y)) return 29;
    if(m===8 && mod(hebrewYearDays(y),10)!==5) return 29;
    if(m===9 && mod(hebrewYearDays(y),10)===3) return 29;
    return 30;
  }
  function jdnToHebrew(jdn){
    const jd=floor(jdn)-0.5;
    let count=floor(((jd-HEBREW_EPOCH)*98496)/35975351);
    let y=count-1;
    while(jd>=hebrewToJd(y+1,7,1)) y++;
    let first=jd<hebrewToJd(y,1,1)?7:1;
    let m=first;
    while(jd>hebrewToJd(y,m,hebrewMonthDays(y,m))){m++; if(m>hebrewYearMonths(y))m=1;}
    const d=floor(jd-hebrewToJd(y,m,1)+1);
    return {year:y,month:m,day:d,leap:hebrewLeap(y)};
  }

  const PERSIAN_EPOCH=1948320.5;
  const persianMonths=['Farvardin','Ordibehesht','Khordad','Tir','Mordad','Shahrivar','Mehr','Aban','Azar','Dey','Bahman','Esfand'];
  function persianToJd(y,m,d){
    const epbase=y-(y>=0?474:473), epyear=474+mod(epbase,2820);
    return d+(m<=7?(m-1)*31:(m-1)*30+6)+floor((epyear*682-110)/2816)+(epyear-1)*365+floor(epbase/2820)*1029983+(PERSIAN_EPOCH-1);
  }
  function persianToJdn(y,m,d){return floor(persianToJd(y,m,d)+0.5)}
  function jdnToPersian(jdn){
    const jd=floor(jdn)-0.5;
    const depoch=jd-persianToJd(475,1,1), cycle=floor(depoch/1029983), cyear=mod(depoch,1029983);
    let ycycle;
    if(cyear===1029982) ycycle=2820;
    else {const aux1=floor(cyear/366), aux2=mod(cyear,366); ycycle=floor((2134*aux1+2816*aux2+2815)/1028522)+aux1+1;}
    let y=ycycle+2820*cycle+474; if(y<=0)y--;
    const yday=floor(jd-persianToJd(y,1,1))+1;
    const m=yday<=186?Math.ceil(yday/31):Math.ceil((yday-6)/30);
    const d=floor(jd-persianToJd(y,m,1))+1;
    return {year:y,month:m,day:d};
  }

  const COPTIC_EPOCH=1825029.5, ETHIOPIC_EPOCH=1724220.5;
  const copticMonths=['Thout','Paopi','Hathor','Koiak','Tobi','Meshir','Paremhat','Paremoude','Pashons','Paoni','Epip','Mesori','Pi Kogi Enavot'];
  const ethiopicMonths=['Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miyazya','Ginbot','Sene','Hamle','Nehase','Pagumen'];
  function alexToJd(epoch,y,m,d){return epoch-1+365*(y-1)+floor(y/4)+30*(m-1)+d}
  function alexToJdn(epoch,y,m,d){return floor(alexToJd(epoch,y,m,d)+0.5)}
  function jdnToAlex(epoch,jdn){
    const jd=floor(jdn)-0.5;
    const y=floor((4*(jd-epoch)+1463)/1461);
    const m=1+floor((jd-alexToJd(epoch,y,1,1))/30);
    const d=floor(jd-alexToJd(epoch,y,m,1))+1;
    return {year:y,month:m,day:d};
  }

  function indianToJdn(y,m,d){
    const gy=y+78, leap=gregorianLeap(gy), start=gregorianToJdn(gy,3,leap?21:22), chaitra=leap?31:30;
    let off=d-1;
    if(m===1) return start+off;
    off+=chaitra;
    if(m<=6) off+=(m-2)*31;
    else off+=5*31+(m-7)*30;
    return start+off;
  }
  const indianMonths=['Chaitra','Vaisakha','Jyaistha','Asadha','Sravana','Bhadra','Asvina','Kartika','Agrahayana','Pausa','Magha','Phalguna'];
  function jdnToIndian(jdn){
    const g=jdnToGregorian(jdn);
    let gy=g.year, leap=gregorianLeap(gy), start=gregorianToJdn(gy,3,leap?21:22);
    if(jdn<start){gy--; leap=gregorianLeap(gy); start=gregorianToJdn(gy,3,leap?21:22);}
    const y=gy-78, chaitra=leap?31:30; let day=jdn-start;
    if(day<chaitra) return {year:y,month:1,day:day+1};
    day-=chaitra;
    if(day<155){const m=2+floor(day/31); return {year:y,month:m,day:mod(day,31)+1};}
    day-=155; const m=7+floor(day/30); return {year:y,month:m,day:mod(day,30)+1};
  }

  const MAYAN_EPOCH=584283;
  function mayanFromJdn(jdn){
    let n=floor(jdn)-MAYAN_EPOCH;
    const baktun=floor(n/144000); n=mod(n,144000);
    const katun=floor(n/7200);n%=7200;
    const tun=floor(n/360);n%=360;
    const uinal=floor(n/20);const kin=n%20;
    return {baktun,katun,tun,uinal,kin};
  }
  function mayanToJdn(b,k,t,u,kin){return MAYAN_EPOCH+b*144000+k*7200+t*360+u*20+kin}

  function japaneseEra(g){
    const key=g.year*10000+g.month*100+g.day;
    const eras=[
      {name:'令和',start:20190501,y:2019},{name:'平成',start:19890108,y:1989},{name:'昭和',start:19261225,y:1926},{name:'大正',start:19120730,y:1912},{name:'明治',start:18680125,y:1868}
    ];
    for(const e of eras){if(key>=e.start){const n=g.year-e.y+1;return `${e.name}${n===1?'元':n}年`;}}
    return '现代年号表未覆盖';
  }
  function formatYmd(o,names){return `${o.year}-${pad(o.month)}-${pad(o.day)}${names?` · ${names[o.month-1]||''}`:''}`}



  function ymdShort(g){return `${g.year}-${pad(g.month)}-${pad(g.day)}`}
  function orthodoxEasterJdn(y){
    // Meeus Julian computus; result is a Julian-calendar date converted to JDN.
    const a=mod(y,4), b=mod(y,7), c=mod(y,19), d=mod(19*c+15,30), e=mod(2*a+4*b-d+34,7);
    const month=floor((d+e+114)/31), day=mod(d+e+114,31)+1;
    return julianToJdn(y,month,day);
  }
  function alexYearLeap(epoch,y){return alexToJdn(epoch,y+1,1,1)-alexToJdn(epoch,y,1,1)===366}
  function majorObservancesFromJdn(jdn){
    jdn=floor(jdn);
    const a=allFromJdn(jdn), g=a.gregorian, isl=a.islamic, heb=a.hebrew, per=a.persian, cop=a.coptic, eth=a.ethiopic, ind=a.indian, jul=a.julian;
    const out=[];
    const add=(type,name,note='')=>out.push({type,name,note});

    if(g.month===1&&g.day===1)add('公历','公历元旦');
    if(jul.month===1&&jul.day===1)add('儒略历','儒略历元旦');

    if(isl.month===1&&isl.day===1)add('伊斯兰','伊斯兰新年（Muharram 1）');
    if(isl.month===1&&isl.day===10)add('伊斯兰','阿舒拉日（Ashura）');
    if(isl.month===3&&isl.day===12)add('伊斯兰','圣纪／先知诞辰（Mawlid）','常见逊尼传统日期；不同传统日期有差异');
    if(isl.month===7&&isl.day===27)add('伊斯兰','夜行登霄纪念（Isra and Mi\'raj）','传统纪念日期');
    if(isl.month===8&&isl.day===15)add('伊斯兰','白拉特夜／舍尔邦月中夜（Mid-Sha\'ban）','不同地区传统有差异');
    if(isl.month===9){
      const start=islamicToJdn(isl.year,9,1), end=islamicToJdn(isl.year,10,1)-1;
      const gs=jdnToGregorian(start), ge=jdnToGregorian(end);
      add('伊斯兰',`斋月 Ramadan · 第${isl.day}日`,`AH ${isl.year} 斋月：${ymdShort(gs)} ～ ${ymdShort(ge)}（算术历推算；实际月见可能相差约1天）`);
      if(isl.day===27)add('伊斯兰','盖德尔夜（Laylat al-Qadr，常见第27夜纪念）','传统上在斋月最后十夜中寻求，具体传统不同');
    }
    if(isl.month===10&&isl.day===1)add('伊斯兰','开斋节（Eid al-Fitr）');
    if(isl.month===12&&isl.day===8)add('伊斯兰','朝觐主要仪式开始／塔尔维耶日');
    if(isl.month===12&&isl.day===9)add('伊斯兰','阿拉法特日（Day of Arafah）');
    if(isl.month===12&&isl.day===10)add('伊斯兰','古尔邦节／宰牲节（Eid al-Adha）');

    if(heb.month===7&&heb.day===1)add('希伯来','犹太新年首日（Rosh Hashanah）');
    if(heb.month===7&&heb.day===2)add('希伯来','犹太新年第二日（Rosh Hashanah II）');
    if(heb.month===7&&heb.day===10)add('希伯来','赎罪日（Yom Kippur）');
    if(heb.month===7&&heb.day===15)add('希伯来','住棚节首日（Sukkot）');
    if(heb.month===7&&heb.day===22)add('希伯来','圣会节／以色列欢庆妥拉节（Shemini Atzeret / Simchat Torah）');
    if(heb.month===7&&heb.day===23)add('希伯来','欢庆妥拉节（Simchat Torah，离散地区）');
    if(heb.month===9&&heb.day===25)add('希伯来','光明节首日（Hanukkah）');
    if(heb.month===11&&heb.day===15)add('希伯来','树木新年（Tu BiShvat）');
    if((heb.leap&&heb.month===13&&heb.day===14)||(!heb.leap&&heb.month===12&&heb.day===14))add('希伯来','普珥节（Purim）');
    if(heb.month===1&&heb.day===15)add('希伯来','逾越节首日（Passover / Pesach）');
    if(heb.month===2&&heb.day===18)add('希伯来','拉格巴奥默节（Lag BaOmer）');
    if(heb.month===3&&heb.day===6)add('希伯来','七七节（Shavuot）');
    if(heb.month===5&&heb.day===9)add('希伯来','圣殿被毁日（Tisha B\'Av）');

    if(per.month===1&&per.day===1)add('波斯','诺鲁孜／波斯新年（Nowruz）');
    if(per.month===1&&per.day===13)add('波斯','自然日／十三出游（Sizdah Bedar）');
    if(per.month===9&&per.day===30)add('波斯','雅尔达之夜（Yalda Night）');

    if(ind.month===1&&ind.day===1)add('印度国定历','印度国定历新年（Chaitra 1）');

    if(cop.month===1&&cop.day===1)add('科普特','科普特新年／殉道者新年（Nayrouz）');
    if(cop.month===4&&cop.day===29)add('科普特','圣诞节（Nativity）');
    if(cop.month===5&&cop.day===11)add('科普特','主显节／神显节（Epiphany）');
    if(cop.month===7&&cop.day===29)add('科普特','圣母领报节（Annunciation）');

    if(eth.month===1&&eth.day===1)add('埃塞俄比亚','埃塞俄比亚新年（Enkutatash）');
    if(eth.month===1&&eth.day===17)add('埃塞俄比亚','真十字架节（Meskel）');
    const ethChristmasDay=alexYearLeap(ETHIOPIC_EPOCH,eth.year)?28:29;
    if(eth.month===4&&eth.day===ethChristmasDay)add('埃塞俄比亚','圣诞节／Genna');
    if(eth.month===5&&eth.day===11)add('埃塞俄比亚','主显节／Timkat');

    if(g.year>0){
      const easter=orthodoxEasterJdn(g.year), delta=jdn-easter;
      if(delta===-7)add('科普特/埃塞俄比亚','圣枝主日（Palm Sunday）');
      if(delta===-2)add('科普特/埃塞俄比亚','圣周五／受难日（Good Friday）');
      if(delta===0)add('科普特/埃塞俄比亚','复活节／Pascha・Fasika');
      if(delta===39)add('科普特/埃塞俄比亚','升天节（Ascension）');
      if(delta===49)add('科普特/埃塞俄比亚','五旬节（Pentecost）');
    }
    return out;
  }

  function allFromJdn(jdn){
    jdn=floor(jdn);
    const g=jdnToGregorian(jdn), j=jdnToJulian(jdn), isl=jdnToIslamic(jdn), heb=jdnToHebrew(jdn), per=jdnToPersian(jdn), cop=jdnToAlex(COPTIC_EPOCH,jdn), eth=jdnToAlex(ETHIOPIC_EPOCH,jdn), ind=jdnToIndian(jdn), may=mayanFromJdn(jdn);
    const roc=g.year>=1912?`民国 ${g.year-1911} 年`:`民国前 ${1912-g.year} 年`;
    return {
      jdn,
      gregorian:g,julian:j,islamic:isl,hebrew:heb,persian:per,coptic:cop,ethiopic:eth,indian:ind,mayan:may,
      derived:{mjd:jdn-2400001, rataDie:jdn-1721425, buddhistYear:g.year+543, roc, japanese:japaneseEra(g), auc:g.year>0?g.year+753:g.year+754},
      labels:{
        gregorian:`${formatYmd(g)} · ${astroYearLabel(g.year)}`,
        julian:formatYmd(j),
        islamic:`AH ${isl.year} · ${islamicMonths[isl.month-1]} ${isl.day}`,
        hebrew:`AM ${heb.year} · ${hebrewMonths[heb.month]} ${heb.day}`,
        persian:`${per.year} · ${persianMonths[per.month-1]} ${per.day}`,
        coptic:`${cop.year} · ${copticMonths[cop.month-1]} ${cop.day}`,
        ethiopic:`${eth.year} · ${ethiopicMonths[eth.month-1]} ${eth.day}`,
        indian:`Saka ${ind.year} · ${indianMonths[ind.month-1]} ${ind.day}`,
        mayan:`${may.baktun}.${may.katun}.${may.tun}.${may.uinal}.${may.kin}`
      }
    };
  }

  root.CalendarCore={mod,pad,astroYearLabel,gregorianToJdn,julianToJdn,jdnToGregorian,jdnToJulian,gregorianLeap,julianLeap,daysInGregorianMonth,daysInJulianMonth,weekdayFromJdn,islamicToJdn,jdnToIslamic,hebrewToJdn,jdnToHebrew,hebrewMonthDays,hebrewYearMonths,persianToJdn,jdnToPersian,alexToJdn,jdnToAlex,COPTIC_EPOCH,ETHIOPIC_EPOCH,indianToJdn,jdnToIndian,mayanToJdn,mayanFromJdn,orthodoxEasterJdn,majorObservancesFromJdn,allFromJdn,islamicMonths,hebrewMonths,persianMonths,copticMonths,ethiopicMonths,indianMonths};
})(typeof module!=='undefined'&&module.exports?module.exports:window);

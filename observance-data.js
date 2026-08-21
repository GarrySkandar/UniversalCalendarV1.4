(function(root){
  'use strict';
  const C=root.CalendarCore;
  const traditions=[
    {id:'chinese',group:'中华传统',label:'中国传统节日',short:'中国传统',default:true},
    {id:'han_buddhist',group:'佛教',label:'汉传佛教',short:'汉传佛教',default:true},
    {id:'taoist',group:'道教',label:'道教',short:'道教',default:true},
    {id:'thai_buddhist',group:'佛教',label:'泰国上座部佛教',short:'泰国佛教',default:false},
    {id:'islamic',group:'伊斯兰教',label:'伊斯兰教',short:'伊斯兰',default:true},
    {id:'jewish_israel',group:'犹太教',label:'犹太教·以色列',short:'犹太·以色列',default:false},
    {id:'jewish_diaspora',group:'犹太教',label:'犹太教·散居地',short:'犹太·散居地',default:false},
    {id:'christian_western',group:'基督教',label:'西方基督教共同使用',short:'西方基督教',default:true},
    {id:'catholic',group:'基督教',label:'天主教礼仪传统',short:'天主教',default:false},
    {id:'protestant',group:'基督教',label:'新教主要传统',short:'新教',default:false},
    {id:'lds',group:'基督教',label:'后期圣徒教会传统',short:'后期圣徒',default:false},
    {id:'orthodox_new',group:'基督教',label:'东正教·新历传统',short:'东正教新历',default:false},
    {id:'orthodox_old',group:'基督教',label:'东正教·旧历传统',short:'东正教旧历',default:true},
    {id:'armenian',group:'基督教',label:'亚美尼亚使徒教会传统',short:'亚美尼亚教会',default:false},
    {id:'coptic',group:'基督教',label:'科普特历·科普特正教传统',short:'科普特正教',default:false},
    {id:'ethiopian',group:'基督教',label:'埃塞俄比亚历·埃塞俄比亚正教传统',short:'埃塞正教',default:false},
    {id:'hindu',group:'印度宗教',label:'印度教（2026参考）',short:'印度教',default:false},
    {id:'sikh',group:'印度宗教',label:'锡克教（2026参考）',short:'锡克教',default:false},
    {id:'jain',group:'印度宗教',label:'耆那教（2026参考）',short:'耆那教',default:false},
    {id:'zoroastrian',group:'伊朗宗教',label:'琐罗亚斯德教（部分2026参考）',short:'琐罗亚斯德',default:false},
    {id:'bahai',group:'巴哈伊教',label:'巴哈伊教（2026官方表）',short:'巴哈伊',default:false},
    {id:'silicon',group:'现代纪元',label:'硅基文明纪念日',short:'硅基',default:true}
  ];
  const byId=Object.fromEntries(traditions.map(x=>[x.id,x]));

  const chineseFestivals={
    '1-1':'春节','1-15':'元宵节','2-2':'龙抬头','3-3':'上巳节','5-5':'端午节','7-7':'七夕','7-15':'中元节','8-15':'中秋节','9-9':'重阳节','12-8':'腊八节','12-23':'北方小年','12-24':'南方小年'
  };
  // Core list follows the Hong Kong Buddhist Association table; extra entries are common temple traditions.
  const hanBuddhistFestivals={
    '1-1':'弥勒菩萨圣诞','1-6':'定光佛圣诞（扩展传统）','2-8':'释迦牟尼佛出家日','2-15':'释迦牟尼佛涅槃日','2-19':'观世音菩萨圣诞','2-21':'普贤菩萨圣诞','3-16':'准提菩萨圣诞','4-4':'文殊菩萨圣诞','4-8':'释迦牟尼佛圣诞（浴佛节）','4-28':'药王菩萨圣诞','5-13':'伽蓝菩萨圣诞','6-3':'韦驮菩萨圣诞','6-19':'观世音菩萨成道日','7-13':'大势至菩萨圣诞','7-15':'佛欢喜日／盂兰盆节','7-24':'龙树菩萨圣诞（扩展传统）','7-30':'地藏王菩萨圣诞','8-15':'月光菩萨圣诞（扩展传统）','8-22':'燃灯佛圣诞（扩展传统）','9-19':'观世音菩萨出家日','9-30':'药师琉璃光佛圣诞','10-5':'达摩祖师圣诞（祖师纪念）','11-17':'阿弥陀佛圣诞','12-8':'释迦牟尼佛成道日','12-23':'监斋菩萨圣诞（扩展传统）','12-29':'华严菩萨圣诞'
  };
  // Major/common Taoist observances. Regional temples and lineages may use additional or differing dates.
  const taoistFestivals={
    '1-9':'玉皇大帝圣诞','1-15':'上元一品赐福天官圣诞','1-19':'全真龙门派丘处机祖师圣诞','2-2':'土地正神诞（民间/道教传统）','2-3':'文昌帝君圣诞','2-15':'太上老君道德天尊圣诞','3-3':'真武大帝（玄天上帝）圣诞','3-3a':'西王母蟠桃会','3-15':'财神赵公明圣诞（通行传统）','3-23':'天后妈祖圣诞（道教/民间传统）','4-14':'吕祖吕洞宾圣诞','5-18':'张天师张道陵圣诞（通行传统）','6-22':'火德真君圣诞（北京火神庙传统）','6-24':'关圣帝君圣诞（通行传统）','7-15':'中元二品赦罪地官圣诞','7-18':'西王母圣诞','8-3':'灶君圣诞（通行传统）','8-15':'太阴星君圣诞','9-9':'斗姆元君圣诞','9-28':'华光大帝马元帅圣诞','10-15':'下元三品解厄水官圣诞','11-11':'太乙救苦天尊圣诞（通行传统）'
  };
  const siliconFestivals={'1-1':'硅基新年','6-18':'AI诞生日','6-21':'程序圣诞','10-24':'程序员日（1024）'};

  const bahai2026={
    '3-21':'诺鲁孜（Naw-Rúz）','4-21':'里兹万节第一日','4-29':'里兹万节第九日','5-2':'里兹万节第十二日','5-24':'巴布宣示日','5-29':'巴哈欧拉升天日','7-10':'巴布殉道日','11-10':'巴布诞辰','11-11':'巴哈欧拉诞辰','11-26':'圣约日','11-28':'阿博都-巴哈升天日'
  };
  const hindu2026={
    '1-14':'Makar Sankranti／太阳入摩羯','2-15':'Maha Shivaratri／湿婆大夜','3-4':'Holi／洒红节','3-26':'Rama Navami／罗摩诞辰','4-14':'Vaisakhi／部分印度传统新年','7-16':'Rath Yatra／战车节','8-28':'Raksha Bandhan／兄妹节','9-4':'Krishna Janmashtami／黑天诞辰','9-14':'Ganesh Chaturthi／象头神节','10-20':'Dussehra／胜利十日节','11-8':'Diwali／排灯节','11-9':'Govardhan Puja','11-11':'Bhai Duj','11-15':'Chhath Puja／太阳神祭'
  };
  const sikh2026={
    '3-14':'锡克历新年（1 Chet，Nanakshahi）','4-14':'Vaisakhi／卡尔萨创立纪念','6-16':'古鲁阿尔琼殉道纪念（Nanakshahi通行固定日）','11-24':'古鲁那纳克诞辰 Gurpurab（2026 SGPC/印度年表）','11-24a':'古鲁德格·巴哈都尔殉道纪念（2026印度年表）'
  };
  const jain2026={'3-31':'Mahavir Jayanti／筏驮摩那大雄诞辰','11-8':'Mahavira Nirvana／大雄涅槃纪念（排灯节日）'};
  const zoroastrian2026={'3-21':'Fasli Nowruz／琐罗亚斯德新年（Fasli）','8-15':'Parsi New Year／Shahenshahi Navroz（2026印度年表）'};

  const religiousTraditions=new Set(['han_buddhist','taoist','thai_buddhist','islamic','jewish_israel','jewish_diaspora','christian_western','catholic','protestant','lds','orthodox_new','orthodox_old','armenian','coptic','ethiopian','hindu','sikh','jain','zoroastrian','bahai']);
  function categoryFor(tradition){
    if(religiousTraditions.has(tradition))return 'religion';
    if(tradition==='silicon')return 'civilization';
    if(tradition==='chinese')return 'culture';
    return 'civilization';
  }
  function ev(tradition,name,note='',priority=50,extra={}){
    const meta=byId[tradition]||{group:'其它',label:tradition,short:tradition};
    return {tradition,group:meta.group,type:meta.short,category:extra.category||categoryFor(tradition),name,note,priority,wikipedia:extra.wikipedia||null,links:extra.links||null};
  }
  function key(g){return `${g.month}-${g.day}`;}
  function lunarKey(ch){return ch&&!ch.lunar.leap?`${ch.lunar.month}-${ch.lunar.day}`:null;}
  function addMap(out,map,k,tradition,note=''){if(map[k])out.push(ev(tradition,map[k],note));}

  function westernEasterJdn(y){
    if(y<=0)return null;
    const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),gg=Math.floor((b-f+1)/3);
    const h=(19*a+b-d-gg+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
    const month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
    return C.gregorianToJdn(y,month,day);
  }
  function fixedGregorian(out,g,tradition,map,note=''){addMap(out,map,key(g),tradition,note);}
  function fixedJulian(out,a,tradition,map,note=''){addMap(out,map,`${a.julian.month}-${a.julian.day}`,tradition,note);}

  function christianEvents(jdn,a,out){
    const g=a.gregorian;if(g.year<=0)return;
    const west=westernEasterJdn(g.year),orth=C.orthodoxEasterJdn(g.year);
    const wd=west==null?null:jdn-west, od=jdn-orth;
    fixedGregorian(out,g,'christian_western',{'1-6':'主显节 Epiphany','12-25':'圣诞节 Christmas'});
    if(wd===-46)out.push(ev('christian_western','圣灰星期三 Ash Wednesday'));
    if(wd===-7)out.push(ev('christian_western','棕枝主日 Palm Sunday'));
    if(wd===-2)out.push(ev('christian_western','耶稣受难日 Good Friday'));
    if(wd===0)out.push(ev('christian_western','复活节 Easter',`${g.year}年西方复活节算法` ,90));
    if(wd===39)out.push(ev('christian_western','耶稣升天节 Ascension'));
    if(wd===49)out.push(ev('christian_western','五旬节 Pentecost'));
    fixedGregorian(out,g,'catholic',{'1-1':'天主之母节','8-15':'圣母升天节 Assumption','11-1':'诸圣节 All Saints','11-2':'追思已亡节 All Souls','12-8':'圣母无染原罪瞻礼 Immaculate Conception'});
    fixedGregorian(out,g,'protestant',{'10-31':'宗教改革纪念日 Reformation Day'},'主要见于路德宗等部分新教传统');

    const orthoFixed={'1-6':'神显节 Theophany','2-2':'主进圣殿节 Meeting of the Lord','3-25':'圣母领报节 Annunciation','8-6':'显圣容节 Transfiguration','8-15':'圣母安息节 Dormition','9-8':'圣母诞辰','9-14':'举荣圣架节','11-21':'圣母进殿节','12-25':'基督圣诞'};
    fixedGregorian(out,g,'orthodox_new',orthoFixed,'固定节期按新历；Pascha仍按东正教计算');
    fixedJulian(out,a,'orthodox_old',orthoFixed,'固定节期按儒略历日期；当前20–21世纪通常比公历晚13天');
    if(od===-7){out.push(ev('orthodox_new','圣枝主日 Palm Sunday'));out.push(ev('orthodox_old','圣枝主日 Palm Sunday'));}
    if(od===0){out.push(ev('orthodox_new','圣大复活节 Pascha','东正教复活节计算',90));out.push(ev('orthodox_old','圣大复活节 Pascha','东正教复活节计算',90));}
    if(od===39){out.push(ev('orthodox_new','主升天节 Ascension'));out.push(ev('orthodox_old','主升天节 Ascension'));}
    if(od===49){out.push(ev('orthodox_new','圣灵降临节 Pentecost'));out.push(ev('orthodox_old','圣灵降临节 Pentecost'));}

    fixedGregorian(out,g,'armenian',{'1-6':'圣诞与神显节 Nativity & Theophany','2-14':'献主节／Candlemas','4-7':'圣母领报节 Annunciation','9-8':'圣母诞辰'},'亚美尼亚使徒教会主要固定节期');
    if(wd===-7)out.push(ev('armenian','棕枝主日'));
    if(wd===0)out.push(ev('armenian','圣复活节 Holy Resurrection','亚美尼亚使徒教会；与本算法西方复活节日期一致',90));
    if(wd===39)out.push(ev('armenian','主升天节 Ascension'));

    const cop=a.coptic,eth=a.ethiopic;
    if(cop.month===4&&cop.day===29)out.push(ev('coptic','圣诞节 Nativity'));
    if(cop.month===5&&cop.day===11)out.push(ev('coptic','主显节 Theophany'));
    if(cop.month===7&&cop.day===29)out.push(ev('coptic','圣母领报节 Annunciation'));
    if(od===-7)out.push(ev('coptic','圣枝主日'));
    if(od===-2)out.push(ev('coptic','圣周五／受难日'));
    if(od===0)out.push(ev('coptic','复活节 Pascha','科普特正教复活节周期',90));
    if(od===39)out.push(ev('coptic','升天节'));if(od===49)out.push(ev('coptic','五旬节'));

    if(eth.month===1&&eth.day===17)out.push(ev('ethiopian','Meskel／真十字架节'));
    const ethChristmasDay=(C.alexToJdn(C.ETHIOPIC_EPOCH,eth.year+1,1,1)-C.alexToJdn(C.ETHIOPIC_EPOCH,eth.year,1,1)===366)?28:29;
    if(eth.month===4&&eth.day===ethChristmasDay)out.push(ev('ethiopian','Genna／圣诞节'));
    if(eth.month===5&&eth.day===11)out.push(ev('ethiopian','Timkat／主显节'));
    if(od===-7)out.push(ev('ethiopian','Hosanna／圣枝主日'));
    if(od===-2)out.push(ev('ethiopian','Siklet／受难日'));
    if(od===0)out.push(ev('ethiopian','Fasika／复活节','埃塞俄比亚正教复活节周期',90));
  }

  function islamicEvents(a,out){
    const x=a.islamic;
    if(x.month===1&&x.day===1)out.push(ev('islamic','伊斯兰新年（Muharram 1）'));
    if(x.month===1&&x.day===10)out.push(ev('islamic','阿舒拉日 Ashura','逊尼与什叶传统的宗教意义不同'));
    if(x.month===3&&x.day===12)out.push(ev('islamic','圣纪 Mawlid','常见逊尼传统日期；不同传统有差异'));
    if(x.month===7&&x.day===27)out.push(ev('islamic','夜行登霄纪念 Isra and Mi\'raj','传统纪念日期'));
    if(x.month===8&&x.day===15)out.push(ev('islamic','白拉特夜 Mid-Sha\'ban','不同地区传统有差异'));
    if(x.month===9){
      const start=C.islamicToJdn(x.year,9,1),end=C.islamicToJdn(x.year,10,1)-1,gs=C.jdnToGregorian(start),ge=C.jdnToGregorian(end);
      out.push(ev('islamic',`斋月 Ramadan · 第${x.day}日`,`AH ${x.year}：${fmt(gs)} ～ ${fmt(ge)}（算术历；实际月见可能±1日）`,95));
      if(x.day===27)out.push(ev('islamic','盖德尔夜 Laylat al-Qadr（常见第27夜纪念）','传统上在最后十夜中寻求'));
    }
    if(x.month===10&&x.day===1)out.push(ev('islamic','开斋节 Eid al-Fitr', '',90));
    if(x.month===12&&x.day===8)out.push(ev('islamic','塔尔维耶日／朝觐主要仪式开始'));
    if(x.month===12&&x.day===9)out.push(ev('islamic','阿拉法特日 Day of Arafah'));
    if(x.month===12&&x.day===10)out.push(ev('islamic','古尔邦节 Eid al-Adha','实际日期可能受月见影响',90));
  }

  function jewishEvents(a,out){
    const h=a.hebrew,leap=h.leap,purimMonth=leap?13:12;
    const common=[];
    if(h.month===7&&h.day===1)common.push('犹太新年首日 Rosh Hashanah');
    if(h.month===7&&h.day===2)common.push('犹太新年第二日');
    if(h.month===7&&h.day===10)common.push('赎罪日 Yom Kippur');
    if(h.month===7&&h.day===15)common.push('住棚节首日 Sukkot');
    if(h.month===9&&h.day===25)common.push('光明节首日 Hanukkah');
    if(h.month===11&&h.day===15)common.push('树木新年 Tu BiShvat');
    if(h.month===purimMonth&&h.day===14)common.push('普珥节 Purim');
    if(h.month===1&&h.day===15)common.push('逾越节首日 Pesach');
    if(h.month===2&&h.day===18)common.push('Lag BaOmer');
    if(h.month===3&&h.day===6)common.push('七七节 Shavuot');
    if(h.month===5&&h.day===9)common.push('圣殿被毁日 Tisha B\'Av');
    common.forEach(n=>{out.push(ev('jewish_israel',n,'犹太宗教日从日落开始'));out.push(ev('jewish_diaspora',n,'犹太宗教日从日落开始'));});
    if(h.month===7&&h.day===22){out.push(ev('jewish_israel','Shemini Atzeret / Simchat Torah（以色列合并日）'));out.push(ev('jewish_diaspora','Shemini Atzeret（散居地）'));}
    if(h.month===7&&h.day===23)out.push(ev('jewish_diaspora','Simchat Torah（散居地）'));
    if(h.month===1&&h.day===22)out.push(ev('jewish_diaspora','逾越节第八日（散居地）'));
    if(h.month===3&&h.day===7)out.push(ev('jewish_diaspora','七七节第二日（散居地）'));
  }

  function fmt(g){return `${g.year}-${String(g.month).padStart(2,'0')}-${String(g.day).padStart(2,'0')}`;}
  function fastingDays(ch,out){
    if(!ch||ch.lunar.leap)return;
    const d=ch.lunar.day,days=ch.lunar.month_days||30;
    const six=days===29?[8,14,15,23,28,29]:[8,14,15,23,29,30];
    const ten=days===29?[1,8,14,15,18,23,24,27,28,29]:[1,8,14,15,18,23,24,28,29,30];
    if(six.includes(d))out.push(ev('han_buddhist','六斋日','离散斋日，不作为连续区间',20));
    if(ten.includes(d))out.push(ev('han_buddhist','十斋日','离散斋日，不作为连续区间',20));
  }

  function eventsFor(jdn,ctx={}){
    const a=C.allFromJdn(jdn),g=a.gregorian,ch=ctx.ch||null,th=ctx.th||null,out=[];
    const gk=key(g),lk=lunarKey(ch);
    if(lk){
      addMap(out,chineseFestivals,lk,'chinese');
      addMap(out,hanBuddhistFestivals,lk,'han_buddhist','汉传佛教月日依中国农历');
      addMap(out,taoistFestivals,lk,'taoist','道教日历月日依中国农历；部分神诞存在地区/宫观差异');
      if(lk==='3-3')out.push(ev('taoist',taoistFestivals['3-3a'],'道教/民间传统'));
    }
    if(ch?.term?.name==='清明')out.push(ev('chinese','清明节','二十四节气与传统节日重合'));
    fastingDays(ch,out);
    if(th?.festivals?.length)th.festivals.forEach(x=>out.push(ev('thai_buddhist',x.name,'按泰国阴阳历')));
    islamicEvents(a,out);jewishEvents(a,out);christianEvents(jdn,a,out);
    fixedGregorian(out,g,'zoroastrian',{'3-21':'Fasli Nowruz／诺鲁孜（Fasli传统）'},'不同琐罗亚斯德历传统日期并不一致');
    if(g.year===2026){
      addMap(out,bahai2026,gk,'bahai','巴哈伊世界中心官方183 B.E.（2026）年表；日从日落开始');
      addMap(out,hindu2026,gk,'hindu','2026印度公共年表参考；印度教节日因地区、月制和地点可有差异');
      addMap(out,sikh2026,gk,'sikh','2026 SGPC/印度年表参考');if(sikh2026[`${gk}a`])out.push(ev('sikh',sikh2026[`${gk}a`],'2026印度年表参考'));
      addMap(out,jain2026,gk,'jain','2026印度年表参考；耆那教宗派传统可能有差异');
      addMap(out,zoroastrian2026,gk,'zoroastrian','2026印度年表参考；Shahenshahi/Kadmi/Fasli历法不同');
    }
    addMap(out,siliconFestivals,gk,'silicon');
    // De-duplicate identical tradition/name combinations while preserving notes and priority.
    const seen=new Set();
    return out.filter(x=>{const k=`${x.tradition}|${x.name}`;if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>b.priority-a.priority||a.group.localeCompare(b.group,'zh-CN'));
  }
  function defaultSelection(){return new Set(traditions.filter(x=>x.default).map(x=>x.id));}
  function groupedTraditions(){const groups={};for(const t of traditions)(groups[t.group]||(groups[t.group]=[])).push(t);return groups;}
  function ramadanRangeForGregorianMonth(y,m){
    const dim=C.daysInGregorianMonth(y,m);for(let d=1;d<=dim;d++){const j=C.gregorianToJdn(y,m,d),x=C.jdnToIslamic(j);if(x.month===9){const s=C.islamicToJdn(x.year,9,1),e=C.islamicToJdn(x.year,10,1)-1;return {ah:x.year,start:C.jdnToGregorian(s),end:C.jdnToGregorian(e)};}}return null;
  }

  root.ObservanceEngine={traditions,byId,groupedTraditions,defaultSelection,eventsFor,ramadanRangeForGregorianMonth,westernEasterJdn,hanBuddhistFestivals,taoistFestivals,categoryFor};
})(window);

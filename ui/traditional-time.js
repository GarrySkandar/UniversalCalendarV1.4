(function(root){
  'use strict';
  const branches=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const keLabels=['初初刻','初一刻','初二刻','初三刻','正初刻','正一刻','正二刻','正三刻'];
  const sixNames=['晨朝','日中','日没','初夜','中夜','后夜'];
  const sixNamesEn=['Morning watch','Midday watch','Late-day watch','First night watch','Middle night watch','Late night watch'];

  function minuteOfDay(parts){return parts.hour*60+parts.minute+(parts.second||0)/60;}
  function chinese(parts,isEnglish=false){
    const mins=minuteOfDay(parts),idx=Math.floor((((parts.hour+1)%24))/2),start=((idx*2+23)%24)*60;
    const elapsed=(mins-start+1440)%1440,ke=Math.min(7,Math.floor(elapsed/15));
    return {
      branch:branches[idx],ke:keLabels[ke],index:idx,keIndex:ke,
      label:isEnglish?`${branches[idx]} shichen · ${keLabels[ke]}`:`${branches[idx]}时 · ${keLabels[ke]}`,
      note:isEnglish?'96-ke RuleSet: 8 ke per shichen, 15 minutes per ke; earlier 100-ke systems differed.':'96刻制：每时辰8刻、每刻15分钟；更早长期存在百刻制。'
    };
  }
  function indianSix(parts,isEnglish=false){
    const mins=minuteOfDay(parts),shifted=(mins-360+1440)%1440,period=Math.floor(shifted/240),elapsed=shifted%240;
    const muhurta=Math.floor(elapsed/48)+1,withinMuhurta=(elapsed%48)*60;
    const lava=Math.floor(withinMuhurta/96)+1;
    const withinLava=withinMuhurta%96;
    const tatksana=Math.floor(withinLava/1.6)+1;
    return {
      period,periodName:sixNames[period],muhurta,lava,tatksana,
      label:isEnglish?`${sixNamesEn[period]} · Muhūrta ${muhurta}/5 · Lava ${lava}/30`:`${sixNames[period]} · 第${muhurta}/5牟呼栗多 · 第${lava}/30腊缚`,
      detail:isEnglish?`1 time = 5 muhūrtas; 1 muhūrta = 30 lava; 1 lava = 60 tatkṣaṇa; 1 tatkṣaṇa = 120 kṣaṇa.`:`1时=5牟呼栗多；1牟呼栗多=30腊缚；1腊缚=60呾刹那；1呾刹那=120刹那。`
    };
  }
  root.TraditionalTime={chinese,indianSix,branches,keLabels,sixNames};
})(window);

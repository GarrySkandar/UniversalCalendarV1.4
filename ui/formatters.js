(function(root){
  'use strict';
  const C=root.CalendarCore;
  const lunarMonthNames=['正','二','三','四','五','六','七','八','九','十','冬','腊'];
  const lunarDayNames=['','初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
  const t=(key,vars={},fallback='')=>root.I18n?.t(key,vars,{fallback})??fallback;
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function shortYear(y){return y>0?t('format.ce',{year:y},`公元${y}年`):y===0?t('format.bceOne',{},'公元前1年'):t('format.bce',{year:1-y},`公元前${1-y}年`);}
  function eraSignedYear(gYear,epoch){return gYear>=epoch?gYear-epoch+1:-(epoch-gYear);}
  function siliconLabel(g,short=false){const y=eraSignedYear(g.year,1948),s=y>0?`SE ${y}`:`SE−${Math.abs(y)}`;return short?s:`${s} · ${C.pad(g.month)}-${C.pad(g.day)}`;}
  function aiLabel(g,short=false){const y=eraSignedYear(g.year,1956),s=y>0?`AI ${y}`:`AI−${Math.abs(y)}`;return short?s:`${s} · ${C.pad(g.month)}-${C.pad(g.day)}`;}
  function gregorianFromEraSigned(y,epoch){y=Number(y);if(!Number.isInteger(y)||y===0)throw new Error(t('error.eraZero',{},'纪元年份不能为0。'));return y>0?epoch+y-1:epoch+y;}
  function lunarParts(ch){if(!ch)return null;const l=ch.lunar;return {l,month:`${l.leap?'闰':''}${lunarMonthNames[l.month-1]||l.month}月`,day:lunarDayNames[l.day]||String(l.day)};}
  function lunarText(ch,short=false){const p=lunarParts(ch);if(!p)return '—';const date=`${p.month}${p.day}`;return short?date:t('format.lunar',{year:p.l.year,date},`农历 ${p.l.year}年 ${date}`);}
  function hanBuddhistText(ch,short=false){const p=lunarParts(ch);if(!p)return '—';const y=p.l.year+1027,date=`${p.month}${p.day}`;return short?t('format.hanShort',{year:y,date},`佛${y} ${date}`):t('format.hanBuddhist',{year:y,date},`汉传佛历 ${y}年 ${date}`);}
  function taoistText(ch,short=false){const p=lunarParts(ch);if(!p)return '—';const year=ch.ganzhi?.year_lichun||ch.ganzhi?.year_chunjie||p.l.year,date=`${p.month}${p.day}日`;return short?t('format.taoShort',{year,date},`道历 ${year}年 ${date}`):t('format.taoist',{year,date},`道教历日 ${year}年 ${date}`);}
  root.AppFormatters={esc,shortYear,eraSignedYear,siliconLabel,aiLabel,gregorianFromEraSigned,lunarParts,lunarText,hanBuddhistText,taoistText,lunarMonthNames,lunarDayNames};
})(window);

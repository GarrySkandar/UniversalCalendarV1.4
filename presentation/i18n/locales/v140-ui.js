(function(){
  const packs={
    'zh-CN':{
      'app.version':'Universal Calendar · v1.4.0',
      'nav.human.lunarCalendar':'月球历','nav.human.marsCalendar':'火星历',
      'view.lunarCalendar.title':'月球历','view.lunarCalendar.subtitle':'月球纪元、自然周期相位与指定月面地点的几何昼夜。',
      'view.marsCalendar.title':'火星历','view.marsCalendar.subtitle':'MY/BME、年内日、AMT 与指定经度的 LMST。'
    },
    en:{
      'app.version':'Universal Calendar · v1.4.0',
      'nav.human.lunarCalendar':'Lunar Calendar','nav.human.marsCalendar':'Mars Calendar',
      'view.lunarCalendar.title':'Lunar Calendar','view.lunarCalendar.subtitle':'Lunar era, natural cycle phase, and geometric day/night at a selected surface location.',
      'view.marsCalendar.title':'Mars Calendar','view.marsCalendar.subtitle':'MY/BME, sol of year, AMT, and longitude-dependent LMST.'
    },
    ja:{'app.version':'Universal Calendar · v1.4.0','nav.human.lunarCalendar':'月球暦','nav.human.marsCalendar':'火星暦'},
    ko:{'app.version':'Universal Calendar · v1.4.0','nav.human.lunarCalendar':'달 달력','nav.human.marsCalendar':'화성 달력'},
    es:{'app.version':'Universal Calendar · v1.4.0','nav.human.lunarCalendar':'Calendario lunar','nav.human.marsCalendar':'Calendario marciano'},
    fr:{'app.version':'Universal Calendar · v1.4.0','nav.human.lunarCalendar':'Calendrier lunaire','nav.human.marsCalendar':'Calendrier martien'}
  };
  Object.entries(packs).forEach(([locale,dict])=>window.I18n.registerLocale(locale,dict));
})();

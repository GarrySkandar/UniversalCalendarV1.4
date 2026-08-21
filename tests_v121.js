const fs=require('fs'),vm=require('vm');
const localStore=new Map();
const documentStub={
  readyState:'loading',documentElement:{},body:null,
  querySelectorAll:()=>[],dispatchEvent:()=>{},addEventListener:()=>{},
};
function CustomEvent(type,init){this.type=type;this.detail=init?.detail;}
const ctx={window:{},console,Date,Math,Map,Set,Promise,JSON,
  localStorage:{getItem:k=>localStore.get(k)||null,setItem:(k,v)=>localStore.set(k,String(v))},
  document:documentStub,CustomEvent,MutationObserver:function(){this.observe=()=>{};},NodeFilter:{SHOW_TEXT:4}};
ctx.window.window=ctx.window;ctx.window.localStorage=ctx.localStorage;ctx.window.document=documentStub;ctx.window.CustomEvent=CustomEvent;ctx.window.MutationObserver=ctx.MutationObserver;ctx.window.NodeFilter=ctx.NodeFilter;
vm.createContext(ctx);
for(const f of ['presentation/i18n/i18n-core.js','presentation/i18n/locales/zh-CN.js','presentation/i18n/locales/en.js','presentation/i18n/ui-literals.js','presentation/i18n/metadata-en.js']){
  vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
}
const I=ctx.window.I18n;
function ok(cond,msg){if(!cond)throw new Error(msg);console.log('ok - '+msg)}
I.setLocale('en');
ok(I.t('view.calendar.title')==='Month Calendar','month calendar page title localized');
ok(I.t('weekday.1')==='Mon'&&I.t('weekday.long.1')==='Monday','month calendar weekdays localized');
ok(I.t('calendar.monthOption',{month:8})==='Month 8','month selector labels localized');
ok(I.t('converter.field.leapMonth')==='Leap Month','dynamic converter fields localized');
ok(I.t('inspector.section.world')==='Other World Calendars','month date inspector sections localized');
ok(I.t('moon.满月')==='Full Moon'&&I.t('season.冬季')==='Winter','astronomy dynamic values localized');
ok(I.literal('月历','en')==='Month Calendar','legacy/static UI literal catalog translates existing HTML');
ok(I.literal('年份','en')==='Year','legacy month toolbar text translated');
const M=ctx.window.UCCLocaleMetadata;
ok(M?.calendar?.chinese?.basis&&M?.plugin?.['chinese-almanac']?.description,'registry presentation metadata has English coverage');
const html=fs.readFileSync('index.html','utf8');
ok(html.includes('ui-literals.js?v=1.4.0')&&html.includes('metadata-en.js?v=1.4.0'),'v1.4.0 shell loads full-page i18n compatibility catalogs');
ok(html.includes('app.js?v=1.4.0'),'v1.4.0 application assets are cache-busted');
const app=fs.readFileSync('app.js','utf8');
ok(app.includes("tr('converter.field.leapMonth')")&&app.includes('converter.source.'),'dynamic calendar/converter UI uses semantic i18n keys');
ok(app.includes('buildSourceOptions();buildCivilizationCalendarFilters()'),'language change rebuilds localized dynamic option lists');
const fmt=fs.readFileSync('ui/formatters.js','utf8');
ok(fmt.includes("lunarMonthNames=['正'")&&fmt.includes("t('format.lunar'"),'native Chinese calendar terminology is preserved while wrappers are localized');
const server=fs.readFileSync('server.py','utf8');
ok(server.includes('"app_version": "1.4.0"'),'backend reports v1.4.0');
console.log('V1.4.0 i18n compatibility tests passed');

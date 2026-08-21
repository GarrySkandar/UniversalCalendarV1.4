const fs=require('fs'),vm=require('vm');
const localStore=new Map();
const documentStub={documentElement:{},querySelectorAll:()=>[],dispatchEvent:()=>{},addEventListener:()=>{}};
function CustomEvent(type,init){this.type=type;this.detail=init?.detail;}
const ctx={window:{},console,Date,Math,Map,Set,Promise,JSON,localStorage:{getItem:k=>localStore.get(k)||null,setItem:(k,v)=>localStore.set(k,String(v))},document:documentStub,CustomEvent};
ctx.window.window=ctx.window;ctx.window.localStorage=ctx.localStorage;ctx.window.document=documentStub;ctx.window.CustomEvent=CustomEvent;
vm.createContext(ctx);
const files=[
  'calendar-core.js','temporal-core.js','universal-engine.js',
  'core/plugin-contract.js','core/plugin-manager.js',
  'presentation/i18n/i18n-core.js','presentation/i18n/locales/zh-CN.js','presentation/i18n/locales/en.js',
  'presentation/terminology/terminology-registry.js','presentation/renderers/renderer-registry.js',
  'services/api-client.js','calendar-registry.js','civilization-registry.js','advanced-systems.js',
  'plugins/plugin-bootstrap.js','plugins/calendars/gregorian/plugin.js','plugins/calendars/chinese-modern/plugin.js','plugins/calendars/tibetan/plugin.js',
  'plugins/almanacs/chinese-almanac/plugin.js','plugins/almanacs/panchanga/plugin.js','plugins/cosmology/huangji/plugin.js','plugins/cosmology/yuga/plugin.js','plugins/cycles/maya/plugin.js','plugins/cycles/pawukon/plugin.js','plugins/bootstrap.js'
];
for(const f of files)vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const w=ctx.window, PM=w.PluginManager, I=w.I18n, TR=w.TerminologyRegistry, RR=w.RendererRegistry, C=w.CalendarCore;
function ok(cond,msg){if(!cond)throw new Error(msg);console.log('ok - '+msg)}
(async()=>{
  ok(!!w.PluginContract&&!!PM,'Plugin ABI infrastructure loaded');
  ok(w.UCCPluginRuntime.installed>=9,'executable ABI plugin bootstrap installed representative plugins');
  ok(PM.get('gregorian')?.engine?.compute,'Gregorian migrated to executable CalendarPlugin');
  ok(PM.get('chinese-almanac')?.renderer,'Chinese Almanac owns a plugin renderer');
  ok(PM.get('indian-muhurta')?.legacy===true,'legacy metadata plugin preserved through adapter');
  ok(PM.dependencyReport('chinese-almanac').ok,'plugin dependency graph resolves Chinese Almanac -> Chinese calendar');
  const jdn=C.gregorianToJdn(2026,8,10);
  const gr=await PM.execute('gregorian',{jdn});
  ok(gr.ok&&gr.value.year===2026&&gr.value.month===8&&gr.value.day===10,'PluginManager executes calendar plugin');
  const maya=await PM.execute('maya-ritual',{jdn:584283});
  ok(maya.ok&&maya.value.cycles.tzolkin==='4 Ajaw'&&maya.value.cycles.haab==='8 Kumkʼu','PluginManager executes composite-cycle plugin');
  const hj=await PM.execute('huangji-jingshi',{g:{year:2026,month:8,day:13},timeParts:{hour:12},location:{timezone:'Asia/Shanghai',utcOffsetMinutes:480}});
  ok(hj.ok&&hj.value.hexagram.shortName==='同人'&&hj.value.ganzhi==='丙午','PluginManager executes hierarchical Huangji annual-hexagram RuleSet');
  I.setLocale('en');
  ok(I.t('nav.calendars')==='Calendars','I18n Core switches shell locale');
  const term=TR.get('chinese-almanac','field.dayOfficer');
  ok(term?.native==='建除十二值','plugin terminology bundle registered independently');
  ok(TR.format({pluginId:'chinese-almanac',termId:'field.dayOfficer'}).includes('建除十二值'),'Terminology Registry preserves native term in non-Chinese UI');
  ok(RR.has('generic-key-value')&&RR.has('cycle-grid')&&RR.has('hierarchical-chronology'),'Renderer Registry contains generic representation renderers');
  const html=fs.readFileSync('index.html','utf8');
  ok(html.includes('core/plugin-manager.js')&&html.includes('presentation/i18n/i18n-core.js')&&html.includes('uiLanguage'),'V1.2 shell loads Plugin Manager + I18n + language selector');
  const app=fs.readFileSync('app.js','utf8');
  ok(app.includes('CalendarApiClient')&&app.includes('InterpretationPage.render')&&app.includes('CapabilitiesPage.render'),'app.js delegates API and page rendering to modules');
  ok(app.split(/\r?\n/).length<450,'app.js reduced below 450 lines as migration milestone');
  console.log('V1.2.0 architecture tests passed');
})().catch(e=>{console.error(e);process.exit(1)});

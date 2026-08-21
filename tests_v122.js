const fs=require('fs');
const vm=require('vm');
const path=require('path');
const root=__dirname;
function assert(cond,msg){if(!cond)throw new Error(msg);}

// 1) Regression: month renderer must use API Client cache contract, not removed v1.1 local caches.
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
assert(!/\bchineseCache\b/.test(app),'stale chineseCache reference remains in app.js');
assert(!/\bthaiCache\b/.test(app),'stale thaiCache reference remains in app.js');
assert(/getChineseCached/.test(app)&&/getThaiCached/.test(app),'month renderer is not using API cache getters');

// 2) API Client cache getter contract.
const apiCode=fs.readFileSync(path.join(root,'services/api-client.js'),'utf8');
const sandbox={window:{},fetch:async()=>({json:async()=>({ok:true,data:[]})})};
vm.createContext(sandbox);vm.runInContext(apiCode,sandbox);
const API=sandbox.window.CalendarApiClient;
assert(typeof API.getChineseCached==='function','getChineseCached missing');
assert(typeof API.getThaiCached==='function','getThaiCached missing');
API.chinese.set('2026-8-10',{x:1});API.thai.set('2026-8-10',{y:2});
assert(API.getChineseCached({year:2026,month:8,day:10}).x===1,'Chinese cache getter failed');
assert(API.getThaiCached({year:2026,month:8,day:10}).y===2,'Thai cache getter failed');

// 3) Six visible languages.
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const l of ['zh-CN','en','ja','ko','es','fr']) assert(html.includes(`option value="${l}"`),`language option ${l} missing`);
for(const l of ['ja','ko','es','fr']) assert(html.includes(`locales/${l}.js`),`locale script ${l} missing`);

// 4) i18n fallback + target-language core UI.
const fakeDoc={readyState:'loading',addEventListener(){},dispatchEvent(){},documentElement:{},body:null};
const storage={getItem(){return null},setItem(){}};
const box={window:{},document:fakeDoc,localStorage:storage,CustomEvent:function(){},MutationObserver:function(){},NodeFilter:{SHOW_TEXT:4},Node:{TEXT_NODE:3,ELEMENT_NODE:1}};
box.window=box;vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(root,'presentation/i18n/i18n-core.js'),'utf8'),box);
for(const l of ['zh-CN','en','ja','ko','es','fr']) vm.runInContext(fs.readFileSync(path.join(root,`presentation/i18n/locales/${l}.js`),'utf8'),box);
box.I18n.setLocale('ja');assert(box.I18n.t('nav.month')==='月間カレンダー','Japanese month title failed');
box.I18n.setLocale('ko');assert(box.I18n.t('nav.month')==='월간 달력','Korean month title failed');
box.I18n.setLocale('es');assert(box.I18n.t('nav.month')==='Calendario mensual','Spanish month title failed');
box.I18n.setLocale('fr');assert(box.I18n.t('nav.month')==='Calendrier mensuel','French month title failed');

console.log('V1.3.0 regression tests passed');

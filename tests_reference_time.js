const fs=require('fs');
const vm=require('vm');

function ok(condition,label){if(!condition)throw new Error(`FAIL: ${label}`);console.log(`OK: ${label}`);}

const source=fs.readFileSync('core/reference-time-controller.js','utf8');
const sandbox={window:{},Date,Set,Error,Number};
vm.createContext(sandbox);
vm.runInContext(source,sandbox);
const RT=sandbox.window.ReferenceTimeController;

ok(RT.getMode()==='live','reference time defaults to live mode');
let lastEvent=null;
RT.subscribe((state,reason)=>{lastEvent={state,reason};});
RT.tick(new Date('2026-08-15T01:02:03Z'));
ok(lastEvent.reason==='tick'&&lastEvent.state.instant.toISOString()==='2026-08-15T01:02:03.000Z','live tick publishes the current instant');

const temporal={
  instantFromLocalParts(parts){return new Date(Date.UTC(parts.year,parts.month-1,parts.day,parts.hour-8,parts.minute,parts.second));},
  offsetLabel(){return 'UTC+08:00';}
};
RT.setCalendar({year:2030,month:1,day:2,hour:12,minute:30,second:15},{name:'北京',timezone:'Asia/Shanghai'},temporal);
ok(RT.getMode()==='calendar','calendar selection switches to calendar-linked mode');
ok(RT.getInstant().toISOString()==='2030-01-02T04:30:15.000Z','calendar local time is normalized to UTC');

RT.setCustom(new Date('2040-03-04T05:06:07Z'),'test');
ok(RT.getMode()==='custom'&&RT.getInstant().toISOString()==='2040-03-04T05:06:07.000Z','custom UTC is retained');
const frozen=RT.getInstant().toISOString();
RT.tick(new Date('2050-01-01T00:00:00Z'));
ok(RT.getInstant().toISOString()===frozen,'custom time does not advance on live ticks');

const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const planetary=fs.readFileSync('ui/pages/planetary-calendar-pages.js','utf8');
for(const mode of ['live','calendar','custom'])ok(html.includes(`data-reference-time-mode="${mode}"`),`time source control includes ${mode} mode`);
ok(app.includes('setReferenceFromCalendar()')&&app.includes('RT?.tick?.(d)'),'calendar selection and realtime clock share the controller');
ok(planetary.includes('applyReferenceTime'),'planetary pages consume shared reference time');
ok(app.includes('current-lastPlanetaryRefreshAt<10000'),'full planetary refreshes are throttled to ten seconds');

console.log('Reference time integration tests passed.');

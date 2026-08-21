const fs=require('fs'),vm=require('vm');
const sandbox={window:{},localStorage:{getItem(){return null},setItem(){}}};sandbox.window=sandbox;vm.createContext(sandbox);
for(const f of ['temporal-core.js','calendar-registry.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+f,'utf8'),sandbox,{filename:f});
const T=sandbox.TemporalCore,R=sandbox.CalendarRegistry;
function ok(v,msg){if(!v)throw new Error(msg)}
ok(T.profiles.length>=30,'location profiles');
ok(T.nearestProfile(39.9,116.4).profile.id==='beijing','nearest Beijing');
ok(T.zoneOffsetMinutes(new Date('2026-08-09T12:00:00Z'),'Asia/Shanghai')===480,'Shanghai UTC+8');
ok(T.zoneOffsetMinutes(new Date('2026-08-09T12:00:00Z'),'Asia/Kathmandu')===345,'Kathmandu +5:45');
const sun=T.solarApprox(2026,8,9,39.9042,116.4074);ok(sun.dayLengthHours>13&&sun.dayLengthHours<15,'Beijing summer daylight');
const moon=T.moonPhase(new Date('2026-08-09T12:00:00Z'));ok(moon.ageDays>=0&&moon.ageDays<29.54,'moon age range');
ok(R.families.length===4,'four calendar families');ok(R.calendars.some(x=>x.id==='mayan'&&['core','full'].includes(x.status)),'Maya core');ok(R.calendars.some(x=>x.id==='mars-sol'&&['architecture','experimental'].includes(x.status)),'Mars architecture');
console.log('v1.0 temporal/registry tests passed');

const fs=require('fs');
const html=fs.readFileSync('index.html','utf8'),app=fs.readFileSync('app.js','utf8'),planetary=fs.readFileSync('ui/pages/planetary-calendar-pages.js','utf8'),server=fs.readFileSync('server.py','utf8'),human=fs.readFileSync('ui/human-ui.js','utf8'),manager=fs.readFileSync('core/plugin-manager.js','utf8');
function ok(c,m){if(!c)throw new Error('FAIL: '+m);console.log('OK:',m);}
const nav=[...html.matchAll(/class="nav-item[^>]*data-view="([^"]+)"/g)].map(x=>x[1]);
ok(JSON.stringify(nav.slice(0,9))===JSON.stringify(['today','astronomy','lunar-calendar','mars-calendar','earth','converter','about','site-about','donation']),'V1.4.0 navigation order');
ok(!nav.includes('capabilities'),'World Calendars is not a main navigation item');
for(const view of ['today','calendar','capabilities'])ok(html.includes(`data-target-view="${view}"`),`Calendar tab exists: ${view}`);
ok(human.includes("['today','calendar','capabilities']"),'World Calendars shares the Calendar navigation group');
for(const id of ['si-usts','lunar-calendar-v03','mars-calendar-v04'])ok(html.includes(id==='si-usts'?'plugins/calendars/si-usts/plugin.js':id==='lunar-calendar-v03'?'plugins/calendars/lunar-calendar/plugin.js':'plugins/calendars/mars-calendar/plugin.js'),`plugin asset loaded: ${id}`);
ok(server.includes('/api/si-usts/from-utc')&&server.includes('/api/lunar-calendar/calculate')&&server.includes('/api/mars-calendar/calculate'),'three scientific/planetary APIs exist');
ok(planetary.includes("PM.execute('lunar-calendar-v03'")&&planetary.includes("PM.execute('mars-calendar-v04'")&&planetary.includes("PM.execute('si-usts'"),'planetary pages execute plugins');
ok(planetary.includes("coordinateFrame:'IAU_MOON'")&&planetary.includes("coordinateFrame:'IAU_MARS'"),'Moon and Mars use explicit planetary coordinate frames');
ok(manager.includes("'moon','mars'"),'Moon and Mars are recognized planetary core dependencies');
ok(html.includes('v1.4.0')&&server.includes('app_version": "1.4.0'),'frontend and backend are versioned V1.4.0');
ok(app.split(/\r?\n/).length<450,'V1.2 app.js size boundary remains intact');
console.log('V1.4.0 integration tests passed.');

const fs=require('fs'),vm=require('vm'),path=require('path');
const root=__dirname;
function ok(cond,msg){if(!cond){console.error('FAIL:',msg);process.exit(1);}console.log('OK:',msg);}

// 1) /api/status client must accept top-level status payload rather than expecting data.
let fetched=[];
const ctx1={console,Date,Map,encodeURIComponent,window:null,fetch:async(url)=>{fetched.push(url);return {ok:true,status:200,json:async()=>({ok:true,app_version:'1.3.0',sxtwl:true,thai:true,lunar_python:true,tibetan:true,timezonefinder:true})};}};ctx1.window=ctx1;
vm.runInNewContext(fs.readFileSync(path.join(root,'services/api-client.js'),'utf8'),ctx1);
(async()=>{
  const st=await ctx1.CalendarApiClient.status();
  ok(st.sxtwl===true&&st.app_version==='1.3.0','status() preserves top-level /api/status fields');
  ok(fetched.includes('/api/status'),'status() requests /api/status');

  // 2) Sanyuan Jiuyun common 1864 RuleSet: 2026 should be Lower Cycle / Period 9, 2024-2043.
  const ctx2={console,window:null,Date,Math};ctx2.window=ctx2;
  // Minimal CalendarCore object is enough to load advanced-systems; temporal functions are not used here.
  ctx2.CalendarCore={};ctx2.TemporalCore={};
  vm.runInNewContext(fs.readFileSync(path.join(root,'advanced-systems.js'),'utf8'),ctx2);
  const sy=ctx2.AdvancedTimeSystems.sanyuanJiuyunForYear(2026);
  ok(sy.yuan==='下元','2026 is 下元 in the common Sanyuan Jiuyun RuleSet');
  ok(sy.period===9&&sy.periodStart===2024&&sy.periodEnd===2043,'2026 is 九运, 2024-2043');
  ok(sy.star&&sy.star.name==='九紫右弼','Period 9 exposes 九紫右弼 metadata');

  const hj=ctx2.AdvancedTimeSystems.huangjiForYear(2026);
  ok(hj.hexagram.shortName==='同人'&&hj.hexagram.name==='天火同人','2026 Li-Chun year is 天火同人 under the verified hierarchy');
  ok(hj.hexagramPath.map(x=>x.shortName).join('>')==='大过>姤>鼎>同人','2026 exposes its upper-hierarchy coordinate path');

  // 3) Huangji and Sanyuan remain distinct plugins/rendering contracts.
  const huang=fs.readFileSync(path.join(root,'plugins/cosmology/huangji/plugin.js'),'utf8');
  const syPlugin=fs.readFileSync(path.join(root,'plugins/cosmology/sanyuan-jiuyun/plugin.js'),'utf8');
  ok(huang.includes("renderer:'huangji-chronology'")&&huang.includes('sanyuanJiuyunForYear'),'Huangji card displays parallel Sanyuan status');
  ok(syPlugin.includes("id:'sanyuan-jiuyun'")&&syPlugin.includes('selectable:false'),'Sanyuan is still an independent non-duplicated plugin');

  // 4) Old ambiguous error text is not used by app rendering.
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  ok(!app.includes("tr('calendar.noChinese')"),'app no longer emits ambiguous Chinese-engine fallback key');
  ok(app.includes('calendarEngineMessage'),'app distinguishes provider/request/no-data states');

  // 5) Script is loaded and version updated.
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  ok(html.includes('plugins/cosmology/sanyuan-jiuyun/plugin.js?v=1.4.0'),'Sanyuan plugin is loaded by current v1.4.0 index');
  ok(html.includes('v1.4.0'),'UI assets reference current v1.4.0');
  console.log('V1.4.0 compatibility tests passed.');
})().catch(e=>{console.error(e);process.exit(1);});

const fs=require('fs'),vm=require('vm');
const ctx={window:{},console};ctx.window.window=ctx.window;vm.createContext(ctx);
for(const f of ['universal-engine.js','civilization-registry.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
const U=ctx.window.UniversalTemporalEngine;
function ok(cond,msg){if(!cond)throw new Error(msg);console.log('ok - '+msg)}
ok(U.LAYERS.length===5,'five top-level time layers');
ok(U.PLUGIN_TYPES.some(x=>x.id==='cosmology'),'cosmology plugin contract');
ok(U.getPlugin('chinese-almanac')?.type==='almanac','Chinese Almanac registered');
ok(U.getPlugin('huangji-jingshi')?.type==='cosmology','Huangji registered separately');
ok(['experimental','planned','versioned','full'].includes(U.getPlugin('indian-panchanga')?.status),'Panchanga extension registered');
ok(U.dependencyReport('indian-muhurta').ok,'plugin dependency resolution');
U.registerPlugin({id:'future-unknown-calendar',type:'calendar',name:'Future Unknown Calendar',status:'experimental',representation:'custom',dependsOn:['temporal-core']});
ok(U.getPlugin('future-unknown-calendar')?.representation==='custom','unknown future representation can register without core change');
const m=U.marsTime(new Date('2000-01-06T00:00:00Z'),0,0);
ok(Math.abs(m.mst-23.99425)<0.01,'Mars24 benchmark MST near 23:59:39');
ok(m.ls>277&&m.ls<278,'Mars Ls benchmark');
console.log('V1.1.0 architecture compatibility tests passed');

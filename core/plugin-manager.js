(function(root){
  'use strict';
  const Contract=root.PluginContract;
  const records=new Map();
  const CORE_IDS=new Set(['temporal-core','location-core','astronomy-engine','calendar-engine','solar-core','lunar-core','earth','moon','mars']);

  function normalizeBundle(bundle){
    if(bundle.manifest){
      const manifest=Contract.normalizeManifest(bundle.manifest);
      return {manifest,engine:bundle.engine||null,renderer:bundle.renderer||null,terminology:bundle.terminology||null,locales:bundle.locales||{},legacy:false};
    }
    const manifest=Contract.normalizeManifest(bundle);
    return {manifest,engine:null,renderer:null,terminology:null,locales:{},legacy:true};
  }
  function register(bundle,{syncLegacy=true}={}){
    const rec=normalizeBundle(bundle);
    records.set(rec.manifest.id,rec);
    if(syncLegacy&&root.UniversalTemporalEngine){
      try{root.UniversalTemporalEngine.registerPlugin({...rec.manifest});}catch(e){console.warn('Legacy registry sync failed',e);}
    }
    if(rec.terminology&&root.TerminologyRegistry)root.TerminologyRegistry.registerBundle(rec.manifest.id,rec.terminology);
    if(root.I18n&&rec.locales){Object.entries(rec.locales).forEach(([locale,dict])=>root.I18n.registerLocale(locale,dict,{namespace:rec.manifest.id}));}
    if(rec.renderer&&root.RendererRegistry)root.RendererRegistry.register(rec.manifest.id,rec.renderer);
    return rec;
  }
  function registerLegacy(meta){return register(meta,{syncLegacy:false});}
  function syncLegacy(){
    const U=root.UniversalTemporalEngine;if(!U)return;
    U.listPlugins().forEach(p=>{if(!records.has(p.id))registerLegacy(p);});
  }
  function get(id){return records.get(id)||null;}
  function list(filter={}){
    return [...records.values()].filter(r=>{
      const p=r.manifest;
      if(filter.type&&p.type!==filter.type)return false;
      if(filter.status&&p.status!==filter.status)return false;
      if(filter.civilization&&p.civilization!==filter.civilization)return false;
      if(filter.executable===true&&!r.engine)return false;
      if(filter.selectable===true&&p.ui?.selectable===false)return false;
      return true;
    });
  }
  function dependencyReport(id){
    const r=get(id);if(!r)return {ok:false,missing:['plugin-not-found']};
    const missing=(r.manifest.dependsOn||[]).filter(x=>!CORE_IDS.has(x)&&!records.has(x));
    return {ok:missing.length===0,missing};
  }
  function runtimeContext(extra={}){
    return {
      core:{calendar:root.CalendarCore,temporal:root.TemporalCore,universal:root.UniversalTemporalEngine},
      services:{api:root.CalendarApiClient},
      i18n:root.I18n,
      terms:root.TerminologyRegistry,
      renderers:root.RendererRegistry,
      pluginManager:api,
      ...extra
    };
  }
  async function execute(id,input,extra={}){
    const r=get(id);if(!r)throw new Error(`Plugin not found: ${id}`);
    const deps=dependencyReport(id);if(!deps.ok)throw new Error(`Plugin ${id} missing dependencies: ${deps.missing.join(', ')}`);
    if(!r.engine||typeof r.engine.compute!=='function')return {ok:false,pluginId:id,status:'metadata-only',errorCode:'NO_ENGINE',message:'该插件仍为元数据/规划接口，尚未迁移到可执行 Plugin ABI。'};
    try{
      const value=await r.engine.compute(input,runtimeContext(extra));
      return {ok:true,pluginId:id,manifest:r.manifest,value};
    }catch(error){
      return {ok:false,pluginId:id,errorCode:error.code||'PLUGIN_EXECUTION_FAILED',message:error.message||String(error),error};
    }
  }
  function render(id,result,opts={}){
    const r=get(id);if(!r)return '';
    const rr=root.RendererRegistry;
    const renderer=r.renderer || rr?.get(r.manifest.ui?.renderer) || rr?.get('generic-key-value');
    if(!renderer)return `<pre>${String(JSON.stringify(result,null,2))}</pre>`;
    return renderer(result,{manifest:r.manifest,i18n:root.I18n,terms:root.TerminologyRegistry,...opts});
  }
  function capabilities(){return list().map(r=>({...r.manifest,executable:!!r.engine,legacy:r.legacy}));}
  function unregister(id){return records.delete(id);}
  const api={register,registerLegacy,syncLegacy,get,list,execute,render,capabilities,dependencyReport,unregister,runtimeContext};
  root.PluginManager=api;
})(window);

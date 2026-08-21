(function(root){
  'use strict';
  const bundles=new Map();
  function registerBundle(pluginId,data){bundles.set(pluginId,{...(bundles.get(pluginId)||{}),...(data||{})});}
  function get(pluginId,termId){return bundles.get(pluginId)?.[termId]||null;}
  function format(ref,opts={}){
    if(ref==null)return '—';
    if(typeof ref==='string')return ref;
    const locale=opts.locale||root.I18n?.getLocale?.()||'zh-CN';
    const term=(ref.pluginId&&ref.termId?get(ref.pluginId,ref.termId):null)||ref;
    const native=term.native??ref.native??ref.value??ref.termId??'';
    const roman=term.romanization?.[locale]||term.romanization?.en||term.romanization||ref.romanization||'';
    const translated=term.translation?.[locale]||ref.translation?.[locale]||'';
    const mode=opts.mode||((locale==='zh-CN'||locale==='zh')?'native':'native-plus-romanization');
    if(mode==='translated'&&translated)return translated;
    if(mode==='native-plus-translation'&&translated&&translated!==native)return `${native} · ${translated}`;
    if(mode==='native-plus-romanization'&&roman&&roman!==native)return `${native} · ${roman}`;
    return String(native);
  }
  root.TerminologyRegistry={registerBundle,get,format,list:()=>[...bundles.entries()]};
})(window);

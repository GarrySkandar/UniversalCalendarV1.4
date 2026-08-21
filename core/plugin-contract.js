(function(root){
  'use strict';
  const TYPES=new Set(['calendar','almanac','religion','era','country','history','auspicious','cycle','astrology','cosmology','personal']);
  const REPRESENTATIONS=new Set(['year-month-day','continuous-count','concurrent-cycles','composite-cycles','hierarchical-chronology','hierarchical-cycle','observation-result','almanac-properties','five-limb-almanac','activity-timing','religious-observances','regional-almanac','ritual-cycle','astral-interpretation','historical-almanac','person-temporal-context','custom']);
  function assert(cond,msg){if(!cond)throw new Error(`PluginContract: ${msg}`);}
  function validateManifest(m){
    assert(m&&typeof m==='object','manifest must be an object');
    ['id','type','name'].forEach(k=>assert(m[k],`manifest.${k} is required`));
    assert(TYPES.has(m.type),`unsupported type ${m.type}`);
    if(m.representation)assert(REPRESENTATIONS.has(m.representation)||String(m.representation).startsWith('x-'),`unknown representation ${m.representation}`);
    if(m.dependsOn)assert(Array.isArray(m.dependsOn),'dependsOn must be an array');
    if(m.locales)assert(typeof m.locales==='object','locales must be an object');
    return true;
  }
  function validateExecutable(p){
    validateManifest(p.manifest||p);
    const engine=p.engine;
    assert(engine&&typeof engine.compute==='function','executable plugin requires engine.compute(context)');
    return true;
  }
  function normalizeManifest(m){
    validateManifest(m);
    return {
      status:'planned', version:'1.0.0', dependsOn:[], representation:'custom', coverage:'未声明', source:[],
      ui:{selectable:true,group:'default',renderer:'generic-key-value'},
      ...m,
      dependsOn:[...(m.dependsOn||[])],
      ui:{selectable:true,group:'default',renderer:'generic-key-value',...(m.ui||{})}
    };
  }
  root.PluginContract={TYPES,REPRESENTATIONS,validateManifest,validateExecutable,normalizeManifest};
})(window);

(function(root){
  'use strict';
  const defs=[];
  root.PluginBootstrap={
    define(bundle){defs.push(bundle);return bundle;},
    installAll(){
      if(!root.PluginManager)throw new Error('PluginManager missing');
      defs.forEach(x=>root.PluginManager.register(x));
      root.PluginManager.syncLegacy();
      return defs.length;
    },
    list:()=>defs.slice()
  };
})(window);

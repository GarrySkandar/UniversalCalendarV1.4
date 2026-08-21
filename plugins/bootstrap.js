(function(root){
  'use strict';
  const installed=root.PluginBootstrap?.installAll?.()||0;
  root.UCCPluginRuntime={installed,version:'1.4.0'};
})(window);

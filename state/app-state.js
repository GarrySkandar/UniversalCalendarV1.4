(function(root){
  'use strict';
  const listeners=new Map();
  const state={locale:null,location:null,selectedJdn:null,activeView:'today',activeTraditions:new Set(),activeInterpretationPlugins:new Set(),engineStatus:{}};
  function emit(key,value){(listeners.get(key)||[]).forEach(fn=>fn(value,state));(listeners.get('*')||[]).forEach(fn=>fn({key,value},state));}
  function set(key,value){state[key]=value;emit(key,value);return value;}
  function get(key){return state[key];}
  function subscribe(key,fn){if(!listeners.has(key))listeners.set(key,[]);listeners.get(key).push(fn);return ()=>listeners.set(key,(listeners.get(key)||[]).filter(x=>x!==fn));}
  root.AppState={state,set,get,subscribe,snapshot:()=>({...state,activeTraditions:new Set(state.activeTraditions),activeInterpretationPlugins:new Set(state.activeInterpretationPlugins)})};
})(window);

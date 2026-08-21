(function(root){
  'use strict';
  const stores=new Map();
  const literalStores=new Map();
  const originalText=new WeakMap();
  const meta=new Map([
    ['zh-CN',{dir:'ltr',label:'简体中文'}],['en',{dir:'ltr',label:'English'}],['ja',{dir:'ltr',label:'日本語'}],['ko',{dir:'ltr',label:'한국어'}],['es',{dir:'ltr',label:'Español'}],['fr',{dir:'ltr',label:'Français'}],['ar',{dir:'rtl',label:'العربية'}],['he',{dir:'rtl',label:'עברית'}]
  ]);
  let locale=localStorage.getItem('ucc.locale')||'zh-CN';
  let translating=false;
  let observer=null;
  function ensure(l){if(!stores.has(l))stores.set(l,{base:{},namespaces:{}});return stores.get(l);}
  function registerLocale(l,dict,{namespace=null}={}){const s=ensure(l);if(namespace)s.namespaces[namespace]={...(s.namespaces[namespace]||{}),...dict};else Object.assign(s.base,dict);}
  function registerLiterals(l,dict){literalStores.set(l,{...(literalStores.get(l)||{}),...dict});}
  function resolve(key,l=locale,namespace=null){
    const fallbacks=(l==='zh-CN'||l.startsWith('zh'))?[l,l.split('-')[0],'en']:[l,l.split('-')[0],'en','zh-CN'];
    for(const f of fallbacks){const s=stores.get(f);if(!s)continue;const d=namespace?s.namespaces[namespace]:s.base;if(d&&Object.prototype.hasOwnProperty.call(d,key))return d[key];}
    return null;
  }
  function t(key,vars={},opts={}){let v=resolve(key,opts.locale||locale,opts.namespace)||opts.fallback||key;if(typeof v!=='string')return v;return v.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??`{${k}}`);}
  function literal(source,l=locale){if(l==='zh-CN')return source;const candidates=[l,l.split('-')[0],'en'];for(const c of candidates){const d=literalStores.get(c);if(d&&Object.prototype.hasOwnProperty.call(d,source))return d[source];}return source;}
  function shouldSkipText(node){const p=node.parentElement;if(!p)return true;if(['SCRIPT','STYLE','PRE','CODE','TEXTAREA'].includes(p.tagName))return true;if(p.closest('[data-i18n-native],.term-native'))return true;return false;}
  function translateTextNode(node){
    if(shouldSkipText(node))return;
    if(!originalText.has(node))originalText.set(node,node.nodeValue);
    const raw=originalText.get(node),trim=raw.trim();if(!trim)return;
    const translated=literal(trim,locale);if(translated===trim&&locale!=='zh-CN')return;
    const lead=raw.match(/^\s*/)?.[0]||'',trail=raw.match(/\s*$/)?.[0]||'';node.nodeValue=lead+translated+trail;
  }
  function translateFragment(rootNode=document.body){
    if(!rootNode||translating)return;translating=true;
    try{
      const walker=document.createTreeWalker(rootNode,NodeFilter.SHOW_TEXT);const nodes=[];let n;while((n=walker.nextNode()))nodes.push(n);nodes.forEach(translateTextNode);
    }finally{translating=false;}
  }
  function applyExplicit(rootNode=document){
    rootNode.querySelectorAll?.('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n,{}, {fallback:el.textContent});});
    rootNode.querySelectorAll?.('[data-i18n-placeholder]').forEach(el=>{el.placeholder=t(el.dataset.i18nPlaceholder,{}, {fallback:el.placeholder});});
    rootNode.querySelectorAll?.('[data-i18n-title]').forEach(el=>{el.title=t(el.dataset.i18nTitle,{}, {fallback:el.title});});
    rootNode.querySelectorAll?.('[data-i18n-aria-label]').forEach(el=>{el.setAttribute('aria-label',t(el.dataset.i18nAriaLabel,{}, {fallback:el.getAttribute('aria-label')||''}));});
  }
  function applyDocument(){document.documentElement.lang=locale;document.documentElement.dir=getMeta().dir;applyExplicit(document);translateFragment(document.body);}
  function startObserver(){if(observer||!document.body)return;observer=new MutationObserver(records=>{if(translating)return;for(const r of records){for(const n of r.addedNodes){if(n.nodeType===Node.TEXT_NODE)translateTextNode(n);else if(n.nodeType===Node.ELEMENT_NODE){applyExplicit(n);translateFragment(n);}}}});observer.observe(document.body,{childList:true,subtree:true});}
  function setLocale(l){locale=l||'zh-CN';localStorage.setItem('ucc.locale',locale);applyDocument();document.dispatchEvent(new CustomEvent('ucc:localechange',{detail:{locale}}));}
  function getLocale(){return locale;}
  function is(l){return locale===l||locale.split('-')[0]===l;}
  function getMeta(l=locale){return meta.get(l)||{dir:'ltr',label:l};}
  function registerMeta(l,m){meta.set(l,{dir:'ltr',label:l,...m});}
  root.I18n={registerLocale,registerLiterals,registerMeta,t,setLocale,getLocale,is,getMeta,applyDocument,applyExplicit,translateFragment,resolve,literal,startObserver};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{applyDocument();startObserver();});else{applyDocument();startObserver();}
})(window);

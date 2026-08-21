(function(root){
  'use strict';
  const KEY='ucc.todayLayout.v1.3.3';
  const DEFAULTS={
    orders:{
      top:['today-overview','today-era','today-civilizations','today-observances','today-date-systems'],
      overview:['today-gregorian','today-astronomy'],
      'date-systems':['today-almanac','today-side-stack','today-panchanga'],
      'side-stack':['today-huangji','today-sanyuan']
    },
    spans:{
      'today-overview':12,'today-era':12,'today-civilizations':12,'today-observances':12,'today-date-systems':12,
      'today-gregorian':1,'today-astronomy':1,'today-almanac':1,'today-side-stack':1,'today-panchanga':2,'today-huangji':1,'today-sanyuan':1
    },
    heights:{}
  };
  let state=null,dragItem=null,dragContainer=null;
  const clone=x=>JSON.parse(JSON.stringify(x));
  function load(){
    let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(_){saved={};}
    state={orders:{...clone(DEFAULTS.orders),...(saved.orders||{})},spans:{...DEFAULTS.spans,...(saved.spans||{})},heights:{...(saved.heights||{})}};
  }
  function save(){localStorage.setItem(KEY,JSON.stringify(state));}
  function containerItems(container){return [...container.children].filter(x=>x.dataset?.layoutId);}
  function orderContainer(container){
    const key=container.dataset.layoutContainer,items=containerItems(container),saved=state.orders[key]||[];
    saved.slice().reverse().forEach(id=>{const item=items.find(x=>x.dataset.layoutId===id);if(item)container.insertBefore(item,container.firstElementChild);});
  }
  function setSpan(item,span){item.style.setProperty('--today-layout-span',String(span));}
  function setHeight(item,height){if(height){item.dataset.layoutSized='1';item.style.setProperty('--today-layout-height',`${height}px`);}else{delete item.dataset.layoutSized;item.style.removeProperty('--today-layout-height');}}
  function persistOrder(container){state.orders[container.dataset.layoutContainer]=containerItems(container).map(x=>x.dataset.layoutId);save();}
  function resizeItem(item,container,handle){
    handle.addEventListener('pointerdown',e=>{
      e.preventDefault();e.stopPropagation();
      const rect=container.getBoundingClientRect(),isWide=container.dataset.layoutContainer==='top',columns=isWide?12:2,startSpan=Number(state.spans[item.dataset.layoutId]||DEFAULTS.spans[item.dataset.layoutId]||1),startHeight=item.getBoundingClientRect().height,startX=e.clientX,startY=e.clientY;
      handle.setPointerCapture?.(e.pointerId);
      const move=ev=>{const cell=rect.width/columns,span=Math.max(isWide?3:1,Math.min(columns,startSpan+Math.round((ev.clientX-startX)/cell))),height=Math.max(120,Math.min(720,Math.round(startHeight+ev.clientY-startY)));state.spans[item.dataset.layoutId]=span;state.heights[item.dataset.layoutId]=height;setSpan(item,span);setHeight(item,height);};
      const end=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',end);save();};
      document.addEventListener('pointermove',move);document.addEventListener('pointerup',end,{once:true});
    });
  }
  function addControls(item,container){
    if(item.querySelector(':scope > .today-layout-controls'))return;
    item.classList.add('today-layout-item');
    const controls=document.createElement('div');controls.className='today-layout-controls';
    const drag=document.createElement('span');drag.className='today-layout-drag-handle';drag.draggable=true;drag.textContent='⋮⋮';drag.title='拖动调整顺序';drag.setAttribute('aria-label','拖动调整顺序');
    const resize=document.createElement('span');resize.className='today-layout-resize-handle';resize.title='拖拽调整大小';resize.setAttribute('aria-label','拖拽调整大小');
    controls.append(drag,resize);item.append(controls);
    drag.addEventListener('dragstart',e=>{dragItem=item;dragContainer=container;item.classList.add('today-layout-dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',item.dataset.layoutId);});
    drag.addEventListener('dragend',()=>{item.classList.remove('today-layout-dragging');if(dragContainer)persistOrder(dragContainer);dragItem=null;dragContainer=null;});
    resizeItem(item,container,resize);
  }
  function bindDnD(container){
    if(container.dataset.layoutBound)return;container.dataset.layoutBound='1';
    container.addEventListener('dragover',e=>{if(!dragItem||dragContainer!==container)return;e.preventDefault();const target=e.target.closest('[data-layout-id]');if(!target||target===dragItem||target.parentElement!==container)return;const rect=target.getBoundingClientRect(),after=e.clientY>rect.top+rect.height/2;container.insertBefore(dragItem,after?target.nextElementSibling:target);});
    container.addEventListener('drop',e=>{if(!dragItem||dragContainer!==container)return;e.preventDefault();persistOrder(container);});
  }
  function apply(){
    document.querySelectorAll('[data-layout-container]').forEach(container=>{
      if(container.dataset.layoutContainer==='toolbar')return;
      orderContainer(container);bindDnD(container);
      containerItems(container).forEach(item=>{addControls(item,container);setSpan(item,Number(state.spans[item.dataset.layoutId]||DEFAULTS.spans[item.dataset.layoutId]||12));setHeight(item,state.heights[item.dataset.layoutId]);});
    });
  }
  function reset(){localStorage.removeItem(KEY);load();apply();}
  function init(){if(state)return;load();apply();document.querySelector('#resetTodayLayout')?.addEventListener('click',reset);}
  root.TodayLayout={init,reset,apply,key:KEY,defaults:clone(DEFAULTS)};
})(window);

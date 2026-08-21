(function(root){
  'use strict';
  let switcher=null;
  function navGroup(view){
    if(['today','calendar','capabilities'].includes(view))return 'today';
    if(view==='lunar-calendar')return 'lunar-calendar';
    if(view==='mars-calendar')return 'mars-calendar';
    if(view==='calendars')return 'calendars';
    if(view==='astronomy')return 'astronomy';
    if(view==='converter')return 'converter';
    if(view==='earth')return 'earth';
    if(view==='site-about')return 'site-about';
    if(view==='donation')return 'donation';
    return view;
  }
  function syncNavigation(view){
    const group=navGroup(view);
    document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===group));
    document.querySelectorAll('.calendar-view-tab').forEach(x=>x.classList.toggle('active',x.dataset.targetView===view));
  }
  function bind(go){
    switcher=go;
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('[data-target-view]');if(!b||!switcher)return;
      switcher(b.dataset.targetView);
    });
  }
  function apply(){delete document.body.dataset.displayMode;}
  root.HumanUI={bind,syncNavigation,navGroup,apply};
})(window);

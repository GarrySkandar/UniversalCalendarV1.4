(function(root){
  'use strict';
  function render(ctx){
    const {U,PM,R,$,esc,statusMeta,pluginTypeMeta,renderMars}=ctx;if(!U)return;
    const I18n=root.I18n,LM=root.UCCLocaleMetadata||{},t=(key,vars={},fallback='')=>I18n?.t(key,vars,{fallback})??fallback,isEn=I18n?.is?.('en')||false;
    const statuses=['core','full','versioned','external','historical','experimental','planned','partial'];
    const legend=$('#capabilityLegend');if(legend)legend.innerHTML=statuses.map(id=>{const st=statusMeta(id);return `<span class="status-pill ${st.cls}" title="${esc(st.description)}">${esc(st.label)}</span>`;}).join('');
    const familyName=id=>{const f=R.families.find(f=>f.id===id);return isEn?(f?.en||id):(f?.label||id);};
    const calendarRows=(R?.calendars||[]).map(x=>{const m=isEn?(LM.calendar?.[x.id]||{}):{};return {name:isEn?(x.en||x.name):x.name,type:t('table.calendarType',{family:familyName(x.family)}),status:x.status,scope:m.civilization||x.civilization,note:`${m.basis||x.basis}；${m.range||x.range}`};});
    const pluginRows=(PM?PM.capabilities():U.listPlugins()).map(x=>{const m=isEn?(LM.plugin?.[x.id]||{}):{};return {name:isEn?(x.en||x.name):x.name,type:`${pluginTypeMeta(x.type).zh} Plugin`,status:x.status,scope:m.civilization||x.civilization||'—',note:`${m.coverage||x.coverage}；${t('plugin.dependencies')} ${(x.dependsOn||[]).join(', ')||t('plugin.none')}${x.executable?`；${t('plugin.executable')}`:`；${t('plugin.metadata')}`}`};});
    const coreRows=[
      {name:'Planetary / Temporal Core',type:t('cap.physical'),status:'core',scope:t('cap.earthMars'),note:'Instant / JDN / UTC / Rotation / Orbit'},
      {name:'Location Core',type:t('cap.physical'),status:'core',scope:'Earth',note:t('cap.locationNote')},
      {name:'Astronomy Engine',type:t('cap.astronomical'),status:'core',scope:'Earth',note:t('cap.astronomyNote')},
      {name:'Plugin ABI / Plugin Manager',type:t('cap.crossLayer'),status:'core',scope:t('cap.general'),note:t('cap.pluginNote')},
      {name:'I18n / Terminology / Renderer',type:t('cap.presentation'),status:'core',scope:t('cap.general'),note:t('cap.presentationNote')},
      {name:'Calendar Plugin Contract',type:t('cap.calendarTime'),status:'core',scope:t('cap.general'),note:t('cap.contractNote')}
    ];
    const rows=[...coreRows,...calendarRows,...pluginRows];
    const body=$('#capabilityTableBody');if(body)body.innerHTML=rows.map(r=>{const st=statusMeta(r.status);return `<tr><td><b>${esc(r.name)}</b></td><td>${esc(r.type)}</td><td><span class="status-pill ${esc(st.cls)}">${esc(st.label)}</span></td><td>${esc(r.scope||'—')}</td><td>${esc(r.note||'—')}</td></tr>`;}).join('');
    const counts={};rows.forEach(r=>counts[r.status]=(counts[r.status]||0)+1);
    const sum=$('#capabilitySummary');if(sum)sum.innerHTML=statuses.map(id=>{const st=statusMeta(id);return `<div class="surface capability-stat"><span>${esc(st.label)}</span><strong>${counts[id]||0}</strong><small>${esc(st.description)}</small></div>`;}).join('');
    renderMars();I18n?.translateFragment?.($('#capabilities'));
  }
  root.CapabilitiesPage={render};
})(window);

(function(root){
  'use strict';
  async function render(ctx){
    const {PM,U,C,T,$,esc,statusMeta,pluginTypeMeta,selectedJdn,location,activePlugins,I18n}=ctx;
    if(!U&&!PM)return;
    const t=(key,vars={},fallback='')=>I18n?.t(key,vars,{fallback})??fallback;
    const isEn=I18n?.is?.('en')||false,LM=root.UCCLocaleMetadata||{};
    const types=['almanac','auspicious','cycle','astrology','cosmology','personal'];
    const typeEl=$('#interpretationTypes');
    if(typeEl)typeEl.innerHTML=types.map(id=>{const x=pluginTypeMeta(id);return `<article class="surface interpretation-type-card"><span>${esc(x.label)}</span><h3>${esc(x.zh)}</h3><p>${esc(x.description)}</p></article>`;}).join('');
    const all=(PM?PM.list().map(r=>r.manifest):U.listPlugins()).filter(p=>types.includes(p.type));
    const selected=all.filter(p=>activePlugins.has(p.id)),shown=selected.length?selected:all;
    const cat=$('#interpretationPluginCatalog');
    if(cat)cat.innerHTML=shown.map(p=>{const st=statusMeta(p.status),tm=pluginTypeMeta(p.type),rec=PM?.get(p.id),lm=isEn?(LM.plugin?.[p.id]||{}):{},name=isEn?(p.en||p.name):p.name,secondary=isEn?p.name:(p.en||'');return `<article class="plugin-card"><div class="plugin-card-head"><div><h3>${esc(name)}</h3><small>${esc(secondary)}${secondary?' · ':''}${esc(p.civilization||'')}</small></div><span class="status-pill ${esc(st.cls)}">${esc(st.label)}</span></div><div class="plugin-type">${esc(tm.zh)} · ${esc(p.representation)}${rec?.engine?` · ${esc(t('plugin.executable'))}`:` · ${esc(t('plugin.metadata'))}`}</div><p>${esc(lm.description||p.description||'')}</p><dl><dt>${esc(t('plugin.coverage'))}</dt><dd>${esc(lm.coverage||p.coverage||'—')}</dd><dt>${esc(t('plugin.dependencies'))}</dt><dd>${esc((p.dependsOn||[]).join(' → ')||t('plugin.none'))}</dd></dl></article>`;}).join('');
    const live=$('#interpretationLive');if(!live)return;
    const enabled=all.filter(p=>activePlugins.has(p.id));
    if(!enabled.length){live.innerHTML=`<div class="empty-observance">${esc(t('plugin.noSelection'))}</div>`;return;}
    const g=C.jdnToGregorian(selectedJdn),date=T.utcDate(g.year,g.month,g.day,12,0,0),blocks=[];
    for(const p of enabled){
      const st=statusMeta(p.status),rec=PM?.get(p.id);
      if(PM&&rec?.engine){
        const result=await PM.execute(p.id,{jdn:selectedJdn,selectedJdn,g,date,location,hour:12});
        if(result.ok){
          const body=PM.render(p.id,result,{locale:I18n?.getLocale?.()||'zh-CN'});
          const title=I18n?.resolve?.('title',I18n.getLocale(),p.id)||(isEn?(p.en||p.name):p.name);
          blocks.push(`<article class="interpretation-result"><div class="interpretation-result-head"><div><h3>${esc(title)}</h3><small>${esc(result.value?.ruleSet||p.ruleSet?.name||p.version||'Plugin ABI')}</small></div><span class="status-pill ${st.cls}">${esc(st.label)}</span></div>${body}${result.value?.note?`<p class="interpretation-note">${esc(result.value.note)}</p>`:''}</article>`);
        }else blocks.push(errorBlock(p,st,result.message,esc,isEn,t));
      }else blocks.push(errorBlock(p,st,p.coverage||p.description||t('plugin.legacy'),esc,isEn,t));
    }
    live.innerHTML=blocks.join('')||`<div class="empty-observance">${esc(t('plugin.noResult'))}</div>`;
    I18n?.translateFragment?.(live);
  }
  function errorBlock(p,st,message,esc,isEn,t){return `<article class="interpretation-result"><div class="interpretation-result-head"><div><h3>${esc(isEn?(p.en||p.name):p.name)}</h3><small>${esc(isEn?p.name:(p.en||'Plugin ABI'))}</small></div><span class="status-pill ${st.cls}">${esc(st.label)}</span></div><p class="interpretation-note">${esc(message||t('plugin.notExecutable'))}</p></article>`;}
  root.InterpretationPage={render};
})(window);

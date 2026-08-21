(function(root){
  'use strict';
  const renderers=new Map();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function register(id,fn){if(!id||typeof fn!=='function')throw new Error('Renderer requires id + function');renderers.set(id,fn);return fn;}
  function get(id){return renderers.get(id)||null;}
  function entries(value){
    if(!value||typeof value!=='object')return [['value',value]];
    return Object.entries(value).filter(([,v])=>v!==null&&v!==undefined&&typeof v!=='function');
  }
  register('generic-key-value',(payload,ctx={})=>{
    const v=payload?.value??payload;return `<div class="plugin-kv">${entries(v).map(([k,x])=>`<div class="plugin-kv-row"><span>${esc(k)}</span><strong>${esc(typeof x==='object'?JSON.stringify(x):x)}</strong></div>`).join('')}</div>`;
  });
  register('hierarchical-chronology',(payload)=>{
    const v=payload?.value??payload;const keys=['yuan','hui','yun','shi','yearInShi'];return `<div class="plugin-hierarchy">${keys.filter(k=>v?.[k]!=null).map(k=>`<div><span>${esc(k)}</span><b>${esc(v[k])}</b></div>`).join('<i>↓</i>')}</div>`;
  });

  function renderSanyuan(v,ctx={}){
    if(!v)return '';
    const t=(k,vars={},fallback='')=>ctx.i18n?.t?.(k,vars,{fallback})||fallback||k;
    const star=v.star||{};
    return `<div class="sanyuan-jiuyun-block"><div class="sanyuan-title"><b>${esc(t('sanyuan.title',{},'三元九运'))}</b><small>${esc(t('sanyuan.parallel',{},'玄空体系 · 与皇极经世并列'))}</small></div><div class="plugin-kv"><div class="plugin-kv-row"><span>${esc(t('sanyuan.currentYuan',{},'当前元'))}</span><strong>${esc(v.yuan||'—')} · ${esc(v.yuanStart)}–${esc(v.yuanEnd)}</strong></div><div class="plugin-kv-row"><span>${esc(t('sanyuan.currentPeriod',{},'当前运'))}</span><strong>${esc(v.periodLabel||'—')} · ${esc(v.periodStart)}–${esc(v.periodEnd)}</strong></div><div class="plugin-kv-row"><span>${esc(t('sanyuan.star',{},'运星'))}</span><strong>${esc(star.name||'—')} · ${esc(star.trigram||'')} ${esc(star.element||'')}</strong></div><div class="plugin-kv-row"><span>${esc(t('sanyuan.progress',{},'运内年份'))}</span><strong>${esc(v.yearInPeriod||'—')} / 20</strong></div><div class="plugin-kv-row"><span>${esc(t('sanyuan.cycle',{},'180年周期'))}</span><strong>${esc(v.cycleStart)}–${esc(v.cycleEnd)} · ${esc(v.yearInCycle)} / 180</strong></div></div></div>`;
  }
  register('sanyuan-jiuyun',(payload,ctx={})=>renderSanyuan(payload?.value??payload,ctx));
  register('huangji-chronology',(payload,ctx={})=>{
    const v=payload?.value??payload;const t=(k,vars={},fallback='')=>ctx.i18n?.t?.(k,vars,{fallback})||fallback||k;
    const keys=[['yuan',t('huangji.yuan',{},'元')],['hui',t('huangji.hui',{},'会')],['yun',t('huangji.yun',{},'运')],['shi',t('huangji.shi',{},'世')],['yearInShi',t('huangji.yearInShi',{},'世内年')]];
    const path=(v?.hexagramPath||[]).map(x=>x?.shortName).filter(Boolean).join(' → ');
    const annual=v?.hexagram?`<div class="sanyuan-current-state huangji-current"><span>${esc(t('huangji.annualHexagram',{},'值年卦'))}</span><strong>${esc(`${v.hexagram.symbol} ${v.hexagram.name}`)}</strong><small>${esc(`${v.huangjiYear??''} ${v.ganzhi||''} · ${t('huangji.liChunBoundary',{},'立春换年')}`)}</small></div>`:'';
    const main=`<div class="huangji-main"><div class="sanyuan-title"><b>${esc(t('huangji.title',{},'皇极经世 · 元会运世'))}</b><small>${esc(v?.ruleSet||'')}</small></div>${annual}<div class="plugin-hierarchy">${keys.filter(([k])=>v?.[k]!=null).map(([k,label])=>`<div><span>${esc(label)}</span><b>${esc(v[k])}</b></div>`).join('<i>↓</i>')}</div>${v?.ganzhi?`<div class="plugin-kv"><div class="plugin-kv-row"><span>${esc(t('huangji.ganzhi',{},'干支'))}</span><strong>${esc(v.ganzhi)}</strong></div><div class="plugin-kv-row"><span>${esc(t('huangji.path',{},'层级卦路'))}</span><strong>${esc(path||'—')}</strong></div><div class="plugin-kv-row"><span>${esc(t('huangji.yuanYear',{},'元内年序'))}</span><strong>${esc(v.yuanYear)}</strong></div></div>`:''}</div>`;
    return `<div class="huangji-composite">${main}${renderSanyuan(v?.sanyuanJiuyun,ctx)}<p class="interpretation-note">${esc(t('sanyuan.distinction',{},'三元九运属于玄空/风水时间体系，并非《皇极经世》原典中的元会运世；此处作为中华传统宏观时间体系并列显示。'))}</p></div>`;
  });

  register('cycle-grid',(payload)=>{
    const v=payload?.value??payload;const cycles=v?.cycles||v;return `<div class="plugin-cycle-grid">${entries(cycles).map(([k,x])=>`<div><span>${esc(k)}</span><b>${esc(typeof x==='object'?(x.text||JSON.stringify(x)):x)}</b></div>`).join('')}</div>`;
  });
  register('almanac',(payload,ctx={})=>{
    const v=payload?.value??payload;if(!v)return '';
    const terms=ctx.terms||root.TerminologyRegistry;
    const rows=v.displayRows||[];
    return `<div class="plugin-almanac">${rows.map(r=>`<div class="plugin-kv-row"><span>${esc(r.label)}</span><strong>${esc(r.term?terms.format(r.term):r.value)}</strong></div>`).join('')}</div>`;
  });
  root.RendererRegistry={register,get,has:id=>renderers.has(id),list:()=>[...renderers.keys()]};
})(window);
